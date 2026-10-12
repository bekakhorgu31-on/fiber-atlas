import assert from 'node:assert/strict';
import test from 'node:test';
import pilotJson from '../src/data/pilot.json';
import { applyConfirmedC172Construction } from '../src/domain/colors';
import { applyIteration07PathReview } from '../src/domain/pathReview';
import {
  assetExists,
  assetRoute,
  attachedCables,
  availabilitySummary,
  cableDisplayName,
  cableLegacyLabel,
  colorLabel,
  commercialRoles,
  endLabel,
  endLegacyLabel,
  fiberTube,
  findCable,
  manufacturerLabel,
  orderedRouteNodes,
  rowsForClosure,
  routeSpans,
  routeSummary,
  searchInventory,
  traceFiber,
  tubeLabel,
  typedAssetLabel,
  validateInventory,
} from '../src/domain/network';
import type { AssetRef, Cable, Inventory, RouteNode } from '../src/domain/types';

const pilot = applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory));
const clonePilot = (): Inventory => structuredClone(pilot);
const hasError = (inventory: Inventory, prefix: string) =>
  validateInventory(inventory).some(error => error.startsWith(prefix));
const cable = (data: Inventory, legacyId: string) => findCable(data, legacyId)!;
const cableId = (legacyId: string) => `CAB-000${legacyId}`;
const routeNode = (sequence: number, asset: AssetRef, accessType: RouteNode['accessType'] = 'unknown'): RouteNode => ({
  sequence, asset, accessType, verification: 'documentation_reviewed',
});

test('pilot inventory contains six canonical cables, 240 fibers, five reviewed tubes, and the declared assets', () => {
  assert.deepEqual(pilot.cables.map(c => c.id), ['CAB-000169', 'CAB-000170', 'CAB-000171', 'CAB-000172', 'CAB-000173', 'CAB-000174']);
  assert.equal(pilot.fibers.length, 240);
  assert.equal(pilot.tubes.length, 20);
  assert.equal(pilot.tubes.filter(tube => tube.basis === 'documented').length, 5);
  assert.equal(pilot.tubes.filter(tube => tube.basis === 'provisional').length, 15);
  assert.deepEqual(pilot.closures.map(item => item.id), ['206', '216', '217', '218', '219']);
  assert.deepEqual(pilot.accessPoints.map(item => item.id), ['50', '51']);
  assert.equal(pilot.connections.length, 54);
  assert.equal(validateInventory(pilot).length, 0);

  const candidates = pilot.connections.filter(connection => connection.location.kind === 'closure' && connection.location.id === '218');
  assert.equal(candidates.length, 52);
  const positions = new Set(candidates.flatMap(connection => [connection.a, connection.z])
    .filter((end): end is Extract<typeof end, { kind: 'fiber' }> => end.kind === 'fiber')
    .map(end => `${end.cableId}/F${end.fiber}`));
  assert.equal(positions.size, 104);
  for (const legacy of ['172', '174']) {
    for (let fiber = 41; fiber <= 48; fiber++) assert.equal(positions.has(`${cableId(legacy)}/F${fiber}`), false);
  }
});

test('canonical cable identity is stable when its display fields change, and equal routes may belong to different cables', () => {
  const data = clonePilot();
  const original = cable(data, '172');
  const originalId = original.id;
  original.endpointB = { kind: 'closure', id: '219' };
  original.fiberCount = 47;
  assert.equal(original.id, originalId);
  assert.equal(findCable(data, 'CAB-000172')?.id, originalId);
  assert.equal(cableDisplayName(original), 'SC217 ↔ SC219 · 47F');

  const duplicateRouteData = clonePilot();
  const originalCable = cable(duplicateRouteData, '172');
  const newId = 'CAB-000999';
  const newTubeId = (id: string) => id.replace(originalCable.id, newId);
  const duplicate: Cable = { ...structuredClone(originalCable), id: newId, legacyCableId: '999', legacyLabels: ['999-217-218-48'] };
  duplicateRouteData.cables.push(duplicate);
  const clonedTubes = duplicateRouteData.tubes.filter(tube => tube.cableId === originalCable.id).map(tube => ({ ...structuredClone(tube), id: newTubeId(tube.id), cableId: newId }));
  duplicateRouteData.tubes.push(...clonedTubes);
  const clonedFibers = duplicateRouteData.fibers.filter(fiber => fiber.cableId === originalCable.id).map(fiber => ({
    ...structuredClone(fiber), id: fiber.id.replace(originalCable.id, newId), cableId: newId,
    tubeId: fiber.tubeId ? newTubeId(fiber.tubeId) : null,
  }));
  duplicateRouteData.fibers.push(...clonedFibers);
  assert.equal(cableDisplayName(originalCable), cableDisplayName(duplicate));
  assert.equal(findCable(duplicateRouteData, 'CAB-000172')?.id, 'CAB-000172');
  assert.equal(findCable(duplicateRouteData, 'CAB-000999')?.id, 'CAB-000999');
  assert.deepEqual(validateInventory(duplicateRouteData), []);
});

test('legacy ID, full legacy label, and strand search resolve to canonical records', () => {
  const c172 = cable(pilot, '172');
  assert.equal(findCable(pilot, 'CAB-000172')?.id, 'CAB-000172');
  assert.equal(findCable(pilot, '172')?.id, 'CAB-000172');
  assert.equal(findCable(pilot, '172-217-218-48')?.id, 'CAB-000172');
  assert.equal(findCable(pilot, 'C172')?.id, 'CAB-000172');
  assert.match(cableLegacyLabel(c172), /ძველი ID: 172/);
  assert.ok(searchInventory(pilot, '172').some(result => result.id === 'c-CAB-000172'));
  assert.ok(searchInventory(pilot, '172-217-218-48').some(result => result.id === 'c-CAB-000172'));
  const strand = searchInventory(pilot, '172/29').find(result => result.id === 'fiber-CAB-000172-29');
  assert.ok(strand && strand.route.view === 'fiber' && strand.route.cableId === 'CAB-000172');
});

test('typed cable names and multi-token endpoint search are readable and do not use display text as identity', () => {
  const c172 = cable(pilot, '172');
  assert.equal(cableDisplayName(c172), 'SC217 ↔ SC218 · 48F');
  const result = searchInventory(pilot, 'SC217 SC218').find(result => result.id === 'c-CAB-000172');
  assert.ok(result?.route.view === 'cable');
  assert.equal(result.route.id, 'CAB-000172');
  assert.equal(searchInventory(pilot, cableDisplayName(c172)).find(result => result.id === 'c-CAB-000172')?.title, cableDisplayName(c172));
  assert.equal(typedAssetLabel(c172.endpointA), 'SC217');
  assert.equal(typedAssetLabel(c172.endpointB), 'SC218');
});

test('search covers known asset aliases and leaves empty or unknown input empty', () => {
  assert.ok(searchInventory(pilot, 'SC218').some(result => result.id === 'sc-218'));
  assert.ok(searchInventory(pilot, 'AP51').some(result => result.id === 'ap-51'));
  assert.ok(searchInventory(pilot, 'ODF50').some(result => result.id === 'ap-50'));
  assert.ok(searchInventory(pilot, 'AGG5').some(result => result.id === 'agg-5'));
  assert.ok(searchInventory(pilot, 'ცაგერი–ლენტეხი').some(result => result.id === 'area'));
  assert.deepEqual(searchInventory(pilot, 'SC50'), []);
  assert.deepEqual(searchInventory(pilot, '   '), []);
  assert.deepEqual(searchInventory(pilot, 'not-a-real-asset'), []);
});

test('AP50 is a typed endpoint, ODF50 is its explicit legacy alias, and SC50 is absent', () => {
  const ap50: AssetRef = { kind: 'ap', id: '50' };
  const sc50: AssetRef = { kind: 'closure', id: '50' };
  assert.equal(typedAssetLabel(ap50), 'AP50');
  assert.equal(typedAssetLabel(sc50), 'SC50');
  assert.equal(assetExists(pilot, ap50), true);
  assert.equal(assetExists(pilot, sc50), false);
  assert.deepEqual(assetRoute(ap50), { view: 'ap', id: '50' });
  assert.equal(searchInventory(pilot, 'ODF50').find(result => result.id === 'ap-50')?.route.view, 'ap');
  assert.equal(searchInventory(pilot, 'SC50').some(result => result.id === 'ap-50'), false);
  assert.equal(assetRoute({ kind: 'odf', id: '50' }), null);
});

test('manufacturer stays unknown in the source fixture and an explicit known value is searchable', () => {
  assert.ok(pilot.cables.every(record => record.manufacturer === null));
  assert.ok(pilot.cables.every(record => manufacturerLabel(record) === 'უცნობია'));
  assert.equal(searchInventory(pilot, 'ZTT').some(result => result.category === 'კაბელი'), false);

  const data = clonePilot();
  const c172 = cable(data, '172');
  c172.manufacturer = 'ZTT';
  c172.manufacturerVerification = 'documentation_reviewed';
  assert.equal(searchInventory(data, 'ZTT').find(result => result.id === 'c-CAB-000172')?.title, cableDisplayName(c172));
  assert.equal(manufacturerLabel(c172), 'ZTT');
});

test('route nodes sort by sequence without mutating source order, and summaries preserve unknown intermediates', () => {
  const c172 = cable(pilot, '172');
  assert.equal(routeSummary(c172).intermediateCount, null);
  assert.equal(routeSummary(c172).complete, false);

  const data = clonePilot();
  const routeCable = cable(data, '169');
  routeCable.routeCompleteness = 'ordered_documented';
  routeCable.routeNodes = [
    routeNode(2, routeCable.endpointB),
    routeNode(0, routeCable.endpointA),
    routeNode(1, { kind: 'closure', id: '217' }, 'pass_through'),
  ];
  const sorted = orderedRouteNodes(routeCable);
  assert.deepEqual(sorted.map(node => node.sequence), [0, 1, 2]);
  assert.deepEqual(routeCable.routeNodes.map(node => node.sequence), [2, 0, 1], 'sorting must return a copy');
  const spans = routeSpans(routeCable);
  assert.deepEqual(spans.map(span => [span.from.asset, span.to.asset]), [
    [routeCable.endpointA, { kind: 'closure', id: '217' }],
    [{ kind: 'closure', id: '217' }, routeCable.endpointB],
  ]);
  assert.deepEqual(routeSummary(routeCable), { knownNodes: 3, intermediateCount: 1, describedSpans: 2, complete: true });
});

test('route validation catches duplicate ordering and unknown locations', () => {
  const invalidOrder = clonePilot();
  const orderedCable = cable(invalidOrder, '169');
  orderedCable.routeNodes[1].sequence = orderedCable.routeNodes[0].sequence;
  assert.equal(hasError(invalidOrder, 'Invalid route ordering: CAB-000169'), true);

  const unknownAsset = clonePilot();
  const route = cable(unknownAsset, '169');
  route.routeCompleteness = 'ordered_documented';
  route.routeNodes.splice(1, 0, routeNode(1, { kind: 'site', id: 'not-imported' }, 'opened'));
  route.routeNodes[2].sequence = 2;
  assert.equal(hasError(unknownAsset, 'Unknown route asset: CAB-000169'), true);
});

test('C172 and C173 Tube 1 colors are documented while unreviewed groups remain provisional', () => {
  const unreviewedFibers = pilot.fibers.filter(fiber => fiber.cableId !== cableId('172') && !(fiber.cableId === cableId('173') && fiber.number <= 12));
  const unreviewedTubes = pilot.tubes.filter(tube => tube.cableId !== cableId('172') && !(tube.cableId === cableId('173') && tube.number === 1));
  assert.ok(unreviewedFibers.every(fiber => fiber.physicalColor.basis === 'unknown' && colorLabel(fiber.physicalColor) === 'უცნობია'));
  assert.ok(unreviewedTubes.every(tube => tube.physicalColor.basis === 'unknown' && colorLabel(tube.physicalColor) === 'უცნობია'));
  assert.ok(unreviewedTubes.every(tube => tube.basis === 'provisional' && tube.number === null));

  const fiber = pilot.fibers.find(record => record.cableId === cableId('172') && record.number === 29)!;
  const tube = fiberTube(pilot, fiber);
  assert.ok(tube);
  assert.equal(tubeLabel(tube), 'ტუბი 3');
  assert.equal(fiber.positionInTube, 5);
  assert.match(colorLabel(fiber.physicalColor), /Slate\/Grey/);
  assert.equal(fiber.proposedColor, null);
  assert.equal(tubeLabel(undefined), 'ტუბი უცნობია');
});

test('legacy and display endpoint labels expose canonical names and secondary IDs', () => {
  const end = { kind: 'fiber', cableId: 'CAB-000172', fiber: 29, at: { kind: 'closure', id: '218' } } as const;
  assert.equal(endLabel(end, pilot), 'SC217 ↔ SC218 · 48F / F29');
  assert.equal(endLegacyLabel(end, pilot), 'C172 / F29');
});

test('closure rows resolve a candidate from either canonical cable direction', () => {
  const from173 = rowsForClosure(pilot, '218', cableId('173')).find(row => row.fiber === 1);
  assert.ok(from173?.connection);
  assert.deepEqual(from173.other, {
    kind: 'fiber', cableId: cableId('172'), fiber: 29, at: { kind: 'closure', id: '218' },
  });

  const from172 = rowsForClosure(pilot, '218', cableId('172')).find(row => row.fiber === 29);
  assert.ok(from172?.connection);
  assert.deepEqual(from172.other, {
    kind: 'fiber', cableId: cableId('173'), fiber: 1, at: { kind: 'closure', id: '218' },
  });
});

test('strict trace follows reviewed joins and stops at AP51 with port unresolved', () => {
  const trace = traceFiber(pilot, cableId('172'), 29, false);
  assert.deepEqual(trace.stops.map(stop => stop.code), ['missing', 'port_unknown']);
  assert.equal(trace.steps.filter(step => step.kind === 'connection').length, 3);
  assert.equal(trace.includesCandidates, false);
  assert.equal(trace.complete, false);
  assert.deepEqual(trace.stops.map(stop => stop.side).sort(), ['a', 'b']);
});

test('candidate trace follows the primary route and stops at the unmapped SC216 end', () => {
  const trace = traceFiber(pilot, cableId('171'), 29, true);
  const route = trace.steps.map(step => step.kind === 'cable'
    ? `${step.cableId}/F${String(step.fiber).padStart(2, '0')}`
    : step.kind === 'port' ? step.title : step.title);
  assert.deepEqual(route, [
    'CAB-000171/F29', 'ქურო 217', 'CAB-000172/F29', 'ქურო 218', 'CAB-000173/F01', 'AP51', 'AP51', 'AP51 / პორტი 1',
  ]);
  assert.ok(trace.stops.some(stop => stop.code === 'missing' && stop.at.includes('216')));
  assert.ok(trace.stops.some(stop => stop.code === 'terminal'));
  assert.equal(trace.includesCandidates, true);
  assert.equal(trace.steps.filter(step => step.kind === 'cable').every(step => pilot.cables.some(c => c.id === step.cableId)), true);
});

test('C172/F41 stays unknown without an invented route or confirmed spare claim', () => {
  const fiber = pilot.fibers.find(record => record.cableId === cableId('172') && record.number === 41)!;
  const trace = traceFiber(pilot, cableId('172'), 41, true);
  assert.deepEqual(trace.steps.map(step => step.kind), ['cable']);
  assert.deepEqual(trace.stops.map(stop => stop.code), ['missing', 'missing']);
  assert.equal(fiber.allocation, 'unknown');
  assert.equal(fiber.connectivity, 'unknown');
  assert.equal(availabilitySummary(pilot, [fiber]).available, 0);
});

test('company annotations stay searchable without pretending they are confirmed cable roles', () => {
  const company = searchInventory(pilot, 'მაგთი').find(result => result.id === 'org-magti');
  assert.ok(company);
  assert.match(company.subtitle, /დაუდასტურებელია/);
});

test('commercial roles remain independent; unknown and confirmed none remain distinct', () => {
  const data = clonePilot();
  const c172 = cable(data, '172');
  const fiber = data.fibers.find(record => record.cableId === c172.id && record.number === 29)!;
  c172.owner = { state: 'none' };

  let roles = commercialRoles(data, c172.id, 29);
  assert.equal(roles[0].value, 'არ არის — დადასტურებული');
  assert.equal(roles[1].value, 'უცნობი');
  assert.equal(roles[2].value, 'უცნობი');
  assert.equal(roles[3].value, 'უცნობი');
  assert.equal(roles[4].value, 'უცნობი');

  fiber.rights = { state: 'none' };
  fiber.service = { state: 'none' };
  roles = commercialRoles(data, c172.id, 29);
  assert.equal(roles[1].value, 'არ არის — დადასტურებული');
  assert.equal(roles[2].value, 'არ არის — დადასტურებული');
  assert.equal(roles[3].value, 'არ არის — დადასტურებული');
  assert.equal(roles[4].value, 'არ არის — დადასტურებული');
});

test('separate known organizations populate cable owner, rights holder, provider, and customer only in their own roles', () => {
  const data = clonePilot();
  const c172 = cable(data, '172');
  const fiber = data.fibers.find(record => record.cableId === c172.id && record.number === 29)!;
  data.organizations.push(
    { id: 'cable-owner', name: 'Cable Owner Ltd', aliases: [], annotationOnly: false },
    { id: 'fiber-holder', name: 'Fiber Rights Ltd', aliases: [], annotationOnly: false },
    { id: 'service-provider', name: 'Service Provider Ltd', aliases: [], annotationOnly: false },
    { id: 'service-customer', name: 'Service Customer Ltd', aliases: [], annotationOnly: false },
  );
  c172.owner = { state: 'known', id: 'cable-owner' };
  fiber.rights = { state: 'known', id: 'right-29' };
  fiber.service = { state: 'known', id: 'service-29' };
  data.rights.push({ id: 'right-29', holderId: 'fiber-holder', fiberId: fiber.id, category: 'lease', validFrom: null, validTo: null, verification: 'documentation_reviewed' });
  data.services.push({
    id: 'service-29', name: 'Dedicated transit', provider: { state: 'known', id: 'service-provider' },
    customer: { state: 'known', id: 'service-customer' }, verification: 'documentation_reviewed',
  });

  assert.deepEqual(commercialRoles(data, c172.id, 29).map(role => role.value), [
    'Cable Owner Ltd', 'Fiber Rights Ltd', 'Service Provider Ltd', 'Service Customer Ltd', 'Dedicated transit',
  ]);
});

test('availability requires confirmed capacity status; reservation, rights, and service assignments disqualify', () => {
  const data = clonePilot();
  const fiber = data.fibers.find(record => record.cableId === cableId('172') && record.number === 41)!;
  assert.equal(fiber.allocation, 'unknown');
  assert.equal(fiber.condition, 'unknown');
  assert.equal(fiber.connectivity, 'unknown');
  assert.equal(availabilitySummary(data, [fiber]).available, 0);

  fiber.allocation = 'unallocated';
  fiber.condition = 'serviceable';
  fiber.verification = 'field_verified';
  fiber.rights = { state: 'none' };
  fiber.service = { state: 'none' };
  assert.equal(data.connections.some(connection => [connection.a, connection.z].some(end => end.kind === 'fiber' && end.cableId === fiber.cableId && end.fiber === fiber.number)), false);
  assert.equal(availabilitySummary(data, [fiber]).available, 1, 'capacity can be available without an optical route claim');

  const reserved = clonePilot();
  const reservedFiber = reserved.fibers.find(record => record.cableId === cableId('172') && record.number === 41)!;
  Object.assign(reservedFiber, { allocation: 'reserved', condition: 'serviceable', verification: 'field_verified', rights: { state: 'none' }, service: { state: 'none' } });
  assert.equal(availabilitySummary(reserved, [reservedFiber]).available, 0);

  const withRight = clonePilot();
  const rightFiber = withRight.fibers.find(record => record.cableId === cableId('172') && record.number === 41)!;
  Object.assign(rightFiber, { allocation: 'unallocated', condition: 'serviceable', verification: 'field_verified', rights: { state: 'known', id: 'right-41' }, service: { state: 'none' } });
  withRight.rights.push({ id: 'right-41', holderId: 'holder', fiberId: rightFiber.id, category: 'iru', validFrom: null, validTo: null, verification: 'field_verified' });
  assert.equal(availabilitySummary(withRight, [rightFiber]).available, 0);

  const withService = clonePilot();
  const serviceFiber = withService.fibers.find(record => record.cableId === cableId('172') && record.number === 41)!;
  Object.assign(serviceFiber, { allocation: 'unallocated', condition: 'serviceable', verification: 'field_verified', rights: { state: 'none' }, service: { state: 'none' } });
  withService.assignments.push({ id: 'assignment-41', fiberId: serviceFiber.id, serviceId: 'service-41', verification: 'field_verified' });
  assert.equal(availabilitySummary(withService, [serviceFiber]).available, 0);

  const blocked = clonePilot();
  const blockedFiber = blocked.fibers.find(record => record.cableId === cableId('172') && record.number === 41)!;
  blockedFiber.condition = 'blocked';
  assert.equal(availabilitySummary(blocked, [blockedFiber]).damaged, 1);
});

test('opening a cable at an intermediate closure does not invent a strand connection', () => {
  const data = clonePilot();
  const c169 = cable(data, '169');
  c169.routeCompleteness = 'ordered_documented';
  c169.routeNodes = [
    routeNode(0, c169.endpointA),
    routeNode(1, { kind: 'closure', id: '217' }, 'opened'),
    routeNode(2, c169.endpointB),
  ];

  const trace = traceFiber(data, c169.id, 1, true);
  assert.ok(trace.stops.some(stop => stop.code === 'route_unknown'));
  assert.equal(trace.steps.some(step => step.kind === 'connection'), false);
  assert.equal(data.connections.some(connection => [connection.a, connection.z].some(end => end.kind === 'fiber' && end.cableId === c169.id && end.fiber === 1)), false);
});

test('SC216 exposes cables 169, 170, and 171 without inferring a three-way optical mapping', () => {
  const at216 = attachedCables(pilot, { kind: 'closure', id: '216' }).map(record => record.id).sort();
  assert.deepEqual(at216, [cableId('169'), cableId('170'), cableId('171')]);
  assert.equal(pilot.connections.some(connection => connection.location.kind === 'closure' && connection.location.id === '216'), false);

  for (const legacy of ['169', '170', '171']) {
    const rows = rowsForClosure(pilot, '216', cableId(legacy));
    assert.ok(rows.length > 0);
    assert.ok(rows.every(row => row.connection === null && row.other === null));
  }
  const trace = traceFiber(pilot, cableId('169'), 1, true);
  assert.ok(trace.stops.some(stop => stop.code === 'boundary' || stop.code === 'missing'));
  assert.equal(trace.steps.some(step => step.kind === 'connection'), false);
});

test('validation rejects malformed fiber inventory, ports, endpoint locations, endpoint reuse, and unsupported approval', () => {
  const invalidFiber = clonePilot();
  invalidFiber.fibers = invalidFiber.fibers.filter(fiber => !(fiber.cableId === cableId('172') && fiber.number === 48));
  assert.equal(hasError(invalidFiber, `Invalid fiber inventory: ${cableId('172')}`), true);

  const invalidPort = clonePilot();
  const portConnection = invalidPort.connections.find(connection => connection.location.kind === 'ap')!;
  portConnection.z = { kind: 'port', assetId: '51', port: invalidPort.accessPoints.find(ap => ap.id === '51')!.portCount + 1, at: { kind: 'ap', id: '51' } };
  assert.equal(hasError(invalidPort, 'Invalid port:'), true);

  const wrongLocation = clonePilot();
  const closureConnection = wrongLocation.connections.find(connection => connection.location.kind === 'closure' && connection.location.id === '217')!;
  closureConnection.location = { kind: 'closure', id: '218' };
  assert.equal(hasError(wrongLocation, 'Location mismatch:'), true);

  const reusedEndpoint = clonePilot();
  const sourceConnection = reusedEndpoint.connections.find(connection => connection.location.kind === 'closure' && connection.location.id === '217')!;
  reusedEndpoint.connections.push({ ...structuredClone(sourceConnection), id: 'duplicate-endpoint-fixture' });
  assert.equal(hasError(reusedEndpoint, 'Conflicting endpoint:'), true);

  const unsupportedApproval = clonePilot();
  const unverified = unsupportedApproval.connections.find(connection => connection.location.kind === 'closure' && connection.location.id === '218' && !connection.approved)!;
  unverified.approved = true;
  assert.equal(hasError(unsupportedApproval, 'Approval without verification:'), true);
  assert.deepEqual(traceFiber(unsupportedApproval, cableId('172'), 29, false).stops.map(stop => stop.code), ['missing', 'port_unknown']);
});

test('validation rejects a fiber assigned to an unrecognized tube and an asserted unknown fiber color', () => {
  const unknownTube = clonePilot();
  const fiber = unknownTube.fibers.find(record => record.cableId === cableId('172') && record.number === 1)!;
  fiber.tubeId = 'not-a-real-tube';
  assert.equal(hasError(unknownTube, `Invalid fiber tube: ${fiber.id}`), true);

  const assertedUnknownColor = clonePilot();
  const unknownColorFiber = assertedUnknownColor.fibers.find(record => record.cableId === cableId('174') && record.number === 1)!;
  unknownColorFiber.physicalColor.nameKa = 'ლურჯი';
  assert.equal(hasError(assertedUnknownColor, `Unknown fiber color has asserted value: ${unknownColorFiber.id}`), true);
});

test('trace fails closed when a candidate endpoint is ambiguous', () => {
  const data = clonePilot();
  const c172 = cable(data, '172');
  const candidate = data.connections.find(connection => connection.location.kind === 'closure' && connection.location.id === '218' &&
    [connection.a, connection.z].some(end => end.kind === 'fiber' && end.cableId === c172.id && end.fiber === 29))!;
  data.connections.push({ ...structuredClone(candidate), id: 'ambiguous-candidate-fixture' });

  const trace = traceFiber(data, c172.id, 29, true);
  assert.ok(trace.stops.some(stop => stop.code === 'ambiguous'));
  assert.equal(trace.steps.some(step => step.id === candidate.id), false);
  assert.equal(trace.steps.some(step => step.kind === 'cable' && step.cableId === cableId('173')), false);
});

test('trace stops before repeating a fiber when a cloned fixture creates a loop', () => {
  const data = clonePilot();
  const c171 = cable(data, '171');
  const sameClosure = { kind: 'closure', id: '217' } as const;
  c171.endpointA = sameClosure;
  c171.endpointB = sameClosure;
  c171.routeNodes = [routeNode(0, sameClosure), routeNode(1, sameClosure)];

  const trace = traceFiber(data, cableId('172'), 29, true);
  assert.ok(trace.stops.some(stop => stop.code === 'cycle'));
  assert.equal(trace.steps.filter(step => step.kind === 'cable' && step.cableId === cableId('172') && step.fiber === 29).length, 1);
});

test('a passive branch without its declared component is invalid, and trace does not choose a branch port', () => {
  const data = clonePilot();
  const c172 = cable(data, '172');
  const branch = data.connections.find(connection => connection.location.kind === 'closure' && connection.location.id === '217')!;
  branch.operation = 'passive_branch';
  branch.passiveComponentId = 'missing-component';

  assert.equal(hasError(data, `Missing passive component: ${branch.id}`), true);
  const trace = traceFiber(data, c172.id, 29, true);
  assert.ok(trace.stops.some(stop => stop.code === 'component'));
  assert.equal(trace.steps.some(step => step.kind === 'cable' && step.cableId === cableId('171')), false);
});

test('a parked fiber does not traverse its paired visual candidate', () => {
  const data = clonePilot();
  const branch = data.connections.find(connection => connection.location.kind === 'closure' && connection.location.id === '217')!;
  branch.operation = 'parked';

  const trace = traceFiber(data, cableId('172'), 29, true);
  assert.equal(trace.steps.some(step => step.kind === 'connection' && step.id === branch.id), false);
  assert.equal(trace.steps.some(step => step.kind === 'cable' && step.cableId === cableId('171')), false);
});

test('conflicting connection evidence stops both strict and candidate traces before downstream fibers', () => {
  const data = clonePilot();
  const conflict = data.connections.find(connection => connection.location.kind === 'closure' && connection.location.id === '218' &&
    [connection.a, connection.z].some(end => end.kind === 'fiber' && end.cableId === cableId('172') && end.fiber === 29))!;
  conflict.verification = 'conflicting';

  for (const includeCandidates of [false, true]) {
    const trace = traceFiber(data, cableId('172'), 29, includeCandidates);
    assert.ok(trace.stops.some(stop => stop.code === 'conflicting'));
    assert.equal(trace.steps.some(step => step.kind === 'cable' && step.cableId === cableId('173')), false);
  }
});
