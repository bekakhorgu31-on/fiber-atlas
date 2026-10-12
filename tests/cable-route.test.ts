import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import pilotJson from '../src/data/pilot.json';
import { applyIteration08CableRoute, cableRoutesForAsset, cableRoutesForSegment, orderedCableRouteNodes, primaryRouteEvidence, validateCableRoutes } from '../src/domain/cableRoutes';
import { applyConfirmedC172Construction } from '../src/domain/colors';
import { parseRoute, routeHash } from '../src/domain/navigation';
import { findFiber, searchInventory, traceFiber, validateInventory } from '../src/domain/network';
import { applyIteration07PathReview } from '../src/domain/pathReview';
import { applyIteration09Foundations } from '../src/domain/foundations';
import type { CableRoute, Inventory } from '../src/domain/types';

const buildPilot = () => applyIteration09Foundations(applyIteration08CableRoute(applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory))));
const route = (data: Inventory): CableRoute => data.cableRoutes![0];

test('Cable Route is a distinct inventory entity from Cable Segment', () => {
  const data = buildPilot();
  assert.equal(route(data).id, 'ROUTE-TSAGERI-LENTEKHI-CORE');
  assert.ok(!data.cables.some(segment => segment.id === route(data).id));
  assert.ok(route(data).legs.some(leg => leg.segmentId === 'CAB-000172'));
});

test('Cable Route is distinct from one-fiber optical Trace', () => {
  const data = buildPilot();
  const physicalRoute = route(data);
  const opticalTrace = traceFiber(data, 'CAB-000171', 29, false);
  assert.equal(physicalRoute.nodes.length, 13);
  assert.ok(opticalTrace.steps.some(step => step.cableId === 'CAB-000173' && step.fiber === 1));
  assert.ok(!physicalRoute.legs.some(leg => leg.segmentId === 'CAB-000173'));
});

test('the bounded main route contains eleven imported Cable Segments', () => {
  assert.deepEqual(route(buildPilot()).legs.flatMap(leg => leg.segmentId ? [leg.segmentId] : []), ['CAB-000148', 'CAB-000150', 'CAB-000169', 'CAB-000171', 'CAB-000172', 'CAB-000174', 'CAB-000176', 'CAB-000177', 'CAB-000178', 'CAB-000179', 'CAB-000180']);
});

test('route nodes preserve reviewed order', () => {
  assert.deepEqual(orderedCableRouteNodes(route(buildPilot())).map(node => node.label), [
    'AGG5 · ცაგერი', 'SC205', 'SC206', 'SC216', 'SC217', 'SC218', 'SC219', 'SC220', 'SC221', 'SC222', 'SC223', 'SC224', 'ლენტეხის მიმართულება · დაუდასტურებელი აგრეგაცია',
  ]);
});

test('main segment endpoints match adjacent route nodes', () => {
  assert.deepEqual(validateCableRoutes(buildPilot()), []);
});

test('the route has a documented branch from SC218 to AP51 through C173', () => {
  const branch = route(buildPilot()).branches.find(item => item.id === 'route-branch-ap51');
  assert.deepEqual(branch?.destination, { kind: 'ap', id: '51' });
  assert.equal(branch?.fromNodeId, 'node-sc218');
  assert.deepEqual(branch?.segmentIds, ['CAB-000173']);
});

test('the AP51 branch does not terminate the main route', () => {
  const item = route(buildPilot());
  assert.equal(item.destination.state, 'unresolved');
  assert.equal(orderedCableRouteNodes(item).at(-1)?.id, 'node-lentekhi-boundary');
  assert.ok(item.legs.some(leg => leg.segmentId === 'CAB-000174'));
});

test('route membership does not infer a PhysicalCable parent', () => {
  const data = buildPilot();
  assert.equal(route(data).physicalCableId, null);
  assert.ok(data.cables.every(segment => !segment.physicalCableId));
});

test('the destination remains an unresolved boundary with the source conflict preserved', () => {
  const destination = route(buildPilot()).destination;
  assert.equal(destination.state, 'unresolved');
  assert.equal(destination.verification, 'conflicting');
  assert.ok(destination.state === 'unresolved' && destination.warnings.some(warning => warning.includes('AGG6')));
});

test('closure treatment remains unknown instead of inferring cut or pass-through', () => {
  const nodes = orderedCableRouteNodes(route(buildPilot())).filter(node => node.asset?.kind === 'closure');
  assert.ok(nodes.every(node => node.treatment === 'unknown' && node.treatmentVerification === 'needs_verification'));
});

test('the model can represent aggregation to closures to aggregation when the endpoint is supported', () => {
  const data = buildPilot();
  data.aggregations.push({ ...structuredClone(data.aggregations[0]), id: '6', name: 'ლენტეხი' });
  const item = route(data);
  const last = orderedCableRouteNodes(item).at(-1)!;
  last.asset = { kind: 'aggregation', id: '6' };
  last.label = 'AGG6 · ლენტეხი';
  item.destination = { state: 'known', asset: { kind: 'aggregation', id: '6' }, label: 'AGG6 · ლენტეხი', verification: 'documentation_reviewed', source: item.source };
  assert.deepEqual(validateCableRoutes(data), []);
});

test('the real route validly represents aggregation to closures to unresolved boundary', () => {
  const data = buildPilot();
  assert.equal(route(data).origin.state, 'known');
  assert.equal(route(data).destination.state, 'unresolved');
  assert.deepEqual(validateInventory(data), []);
});

test('route-level physical condition is independent from fiber allocation', () => {
  const data = buildPilot();
  const before = data.fibers.map(fiber => fiber.allocation);
  route(data).condition = 'damaged';
  route(data).conditionVerification = 'field_verified';
  assert.deepEqual(data.fibers.map(fiber => fiber.allocation), before);
});

test('a broken Cable Segment does not change commercial allocation state', () => {
  const data = buildPilot();
  const segment = data.cables.find(cable => cable.id === 'CAB-000172')!;
  const allocations = data.fibers.filter(fiber => fiber.cableId === segment.id).map(fiber => fiber.allocation);
  segment.physicalCondition = 'broken';
  segment.physicalConditionVerification = 'field_verified';
  assert.deepEqual(data.fibers.filter(fiber => fiber.cableId === segment.id).map(fiber => fiber.allocation), allocations);
});

test('Fiber Trace may leave the main Cable Route through the AP51 branch', () => {
  const data = buildPilot();
  const trace = traceFiber(data, 'CAB-000171', 29, false);
  assert.ok(trace.steps.some(step => step.cableId === 'CAB-000173'));
  assert.ok(route(data).branches.some(branch => branch.segmentIds.includes('CAB-000173')));
  assert.ok(!route(data).legs.some(leg => leg.segmentId === 'CAB-000173'));
});

test('Iteration 07 accepted optical trace still reaches AP51 with port unresolved', () => {
  const trace = traceFiber(buildPilot(), 'CAB-000171', 29, false);
  assert.ok(trace.steps.some(step => step.kind === 'asset' && step.title === 'AP51'));
  assert.ok(trace.stops.some(stop => stop.code === 'port_unknown'));
});

test('SC216 receives route membership without invented optical mappings', () => {
  const data = buildPilot();
  assert.equal(cableRoutesForAsset(data, { kind: 'closure', id: '216' }).length, 1);
  assert.equal(data.connections.filter(connection => connection.location.kind === 'closure' && connection.location.id === '216').length, 0);
});

test('legacy searches and deep links remain valid alongside route lookup', () => {
  const data = buildPilot();
  assert.ok(searchInventory(data, '172').some(result => result.route.view === 'cable'));
  assert.ok(searchInventory(data, '172/29').some(result => result.route.view === 'fiber'));
  assert.deepEqual(parseRoute('#/trace/172/29'), { view: 'trace', cableId: '172', fiber: 29 });
  assert.equal(routeHash({ view: 'cable', id: '172' }), '#/cable/172');
});

test('route-oriented search identifies the object type and navigation target', () => {
  const result = searchInventory(buildPilot(), 'AGG5 ლენტეხის მიმართულება').find(item => item.category === 'კაბელის მარშრუტი');
  const c172Results = searchInventory(buildPilot(), 'C172');
  assert.equal(result?.route.view, 'route');
  assert.equal(result?.title, 'AGG5 · ცაგერი → ლენტეხის მიმართულება');
  assert.ok(c172Results.some(item => item.category === 'კაბელის მარშრუტი'));
  assert.ok(c172Results.some(item => item.category === 'კაბელის მონაკვეთი'));
  assert.equal(routeHash({ view: 'route', id: 'ROUTE-TSAGERI-LENTEKHI-CORE' }), '#/route/ROUTE-TSAGERI-LENTEKHI-CORE');
  assert.deepEqual(parseRoute('#/route/ROUTE-TSAGERI-LENTEKHI-CORE'), { view: 'route', id: 'ROUTE-TSAGERI-LENTEKHI-CORE' });
});

test('C172 and reviewed C173 physical construction remain unchanged', () => {
  const data = buildPilot();
  assert.equal(data.tubes.filter(tube => tube.cableId === 'CAB-000172' && tube.basis === 'documented').length, 4);
  assert.equal(data.tubes.filter(tube => tube.cableId === 'CAB-000173' && tube.basis === 'documented').length, 1);
  assert.equal(findFiber(data, 'CAB-000172', 29)?.physicalColor.key, 'slate');
  assert.equal(findFiber(data, 'CAB-000173', 1)?.physicalColor.key, 'blue');
});

test('segment and asset route membership helpers include main and branch relationships', () => {
  const data = buildPilot();
  assert.equal(cableRoutesForSegment(data, 'CAB-000172')[0]?.id, route(data).id);
  assert.equal(cableRoutesForSegment(data, 'CAB-000173')[0]?.id, route(data).id);
  assert.equal(cableRoutesForAsset(data, { kind: 'ap', id: '51' })[0]?.id, route(data).id);
});

test('duplicate node order is rejected', () => {
  const data = buildPilot();
  route(data).nodes[1].sequence = 0;
  assert.ok(validateCableRoutes(data).some(error => error.startsWith('Invalid Cable Route node order')));
});

test('circular routes are rejected unless explicitly allowed', () => {
  const data = buildPilot();
  route(data).nodes.at(-1)!.asset = { kind: 'aggregation', id: '5' };
  route(data).destination = { state: 'known', asset: { kind: 'aggregation', id: '5' }, label: 'AGG5', verification: 'documentation_reviewed', source: route(data).source };
  assert.ok(validateCableRoutes(data).some(error => error.startsWith('Circular Cable Route not allowed')));
});

test('segment endpoint mismatches and branch promotion are rejected', () => {
  const mismatch = buildPilot();
  route(mismatch).legs.find(leg => leg.segmentId === 'CAB-000172')!.segmentId = 'CAB-000169';
  assert.ok(validateCableRoutes(mismatch).some(error => error.startsWith('Cable Route segment endpoint mismatch')));

  const promoted = buildPilot();
  route(promoted).branches.find(branch => branch.branchKind === 'asset_branch')!.segmentIds = ['CAB-000172'];
  assert.ok(validateCableRoutes(promoted).some(error => error.startsWith('Cable Route branch promoted to main path')));
});

test('unsupported aggregation endpoints are rejected', () => {
  const data = buildPilot();
  const first = orderedCableRouteNodes(route(data))[0];
  first.asset = { kind: 'aggregation', id: '999' };
  route(data).origin = { state: 'known', asset: { kind: 'aggregation', id: '999' }, label: 'AGG999', verification: 'imported', source: first.source };
  assert.ok(validateCableRoutes(data).some(error => error.startsWith('Unsupported Cable Route asset')));
});

test('route evidence is tied to the reviewed source hash and leaves physical identity null', () => {
  assert.equal(primaryRouteEvidence.sourceSha256, '51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a');
  assert.equal(primaryRouteEvidence.route.physicalCableId, null);
  assert.ok(primaryRouteEvidence.route.source.shapeIds.includes('15983'));
});

test('normal detail views keep audit evidence in disclosures', () => {
  const source = readFileSync(new URL('../src/views/NetworkViews.tsx', import.meta.url), 'utf8');
  assert.match(source, /წყარო და მტკიცებულება/);
  assert.doesNotMatch(source, /<details[^>]*className="evidence"[^>]*\sopen(?:=|>)/);
});
