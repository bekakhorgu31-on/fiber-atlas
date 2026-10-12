import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import pilotJson from '../src/data/pilot.json' with { type: 'json' };
import { applyConfirmedC172Construction, interpretTsageriMarker } from '../src/domain/colors';
import { applyIteration07PathReview } from '../src/domain/pathReview';
import { applyIteration08CableRoute, findCableRoute } from '../src/domain/cableRoutes';
import { applyIteration09Foundations } from '../src/domain/foundations';
import { applyIteration10AggregationTopology } from '../src/domain/aggregationTopology';
import { applyIteration12FullMigration } from '../src/domain/fullMigration';
import { applyIteration15Showcase } from '../src/domain/showcase';
import { applyIteration16CableContinuity } from '../src/domain/cableContinuity';
import { applyIteration17FiberLineage } from '../src/domain/fiberLineage';
import {
  AP_PORT_FLOW_RULE, LENTEKHI_AGGREGATION_ID, PHYSICAL_COLOR_RULE, apFlowProfile,
  apPortFlow, applyIteration19, lineageVisitsAP, validateIteration19,
} from '../src/domain/iteration19';
import { routeInventoryCounts, routeScopedSearch } from '../src/domain/routeWorkspace';
import type { FiberLineage, Inventory } from '../src/domain/types';

const build = () => applyIteration19(applyIteration17FiberLineage(applyIteration16CableContinuity(applyIteration15Showcase(applyIteration12FullMigration(applyIteration10AggregationTopology(applyIteration09Foundations(applyIteration08CableRoute(applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory))))))))));
const workspaceSource = readFileSync(new URL('../src/views/RouteWorkspace.tsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

test('1 creates 24 AP Port Flow records for each of six independently audited APs', () => {
  const data = build();
  assert.equal(data.apPortFlows?.length, 144);
  assert.deepEqual(data.accessPoints.map(ap => [ap.id, data.apPortFlows?.filter(item => item.accessPointId === ap.id).length]).sort(), [['41',24],['50',24],['51',24],['52',24],['53',24],['54',24]]);
});
test('2 AP Port Flow uses the versioned source rule', () => assert.ok(build().apFlowProfiles?.every(item => item.sourceRule === AP_PORT_FLOW_RULE)));
test('3 AP41 preserves the latest three owner-described direction groups', () => assert.deepEqual(apFlowProfile(build(), '41')?.directionGroups.map(item => [item.startPort, item.endPort, item.role]), [[1,16,'ingress'],[16,22,'return'],[23,24,'local_termination']]));
test('4 AP41 Port16 preserves ingress and return overlap', () => assert.deepEqual(apPortFlow(build(), '41', 16)?.roles, ['ingress','return','transit']));
test('5 AP41 Port16 displays transit without deleting either source group', () => assert.equal(apPortFlow(build(), '41', 16)?.primaryRole, 'transit'));
test('6 AP41 retains the older Ports3–22 Ambrolauri statement in provenance', () => assert.match(apFlowProfile(build(), '41')?.notes.join(' ') ?? '', /Ports3–22.*Ambrolauri/));
test('7 AP41 maps its aligned C149 Fiber identities to numbered ports', () => assert.deepEqual([apPortFlow(build(), '41', 18)?.incoming?.segmentId, apPortFlow(build(), '41', 18)?.incoming?.fiberNumber], ['CAB-000149',18]));
test('8 AP role is independent from physical usage', () => assert.deepEqual([apPortFlow(build(), '41', 18)?.primaryRole, apPortFlow(build(), '41', 18)?.physicalUsage], ['return','unknown']));
test('9 AP usage is independent from administrative allocation', () => assert.deepEqual([apPortFlow(build(), '51', 3)?.physicalUsage, apPortFlow(build(), '51', 3)?.administrativeAllocation], ['in_use','unknown']));
test('10 unused does not imply commercial availability', () => assert.deepEqual([apPortFlow(build(), '51', 1)?.physicalUsage, apPortFlow(build(), '51', 1)?.commercialAvailability], ['unused','unknown']));
test('11 AP51 Port3 in-use state survives', () => assert.equal(apPortFlow(build(), '51', 3)?.physicalUsage, 'in_use'));
test('12 AP51 retains all 24 lineage links', () => assert.ok(Array.from({ length: 24 }, (_, i) => apPortFlow(build(), '51', i + 1)).every(item => item?.lineageIds.length === 1)));
test('13 AP50–54 do not inherit AP51 usage colors', () => assert.ok(build().apPortFlows?.filter(item => item.accessPointId !== '51').every(item => item.physicalUsage === 'unknown')));
test('14 each non-AP51 profile cites its own symbol and marker structure', () => assert.ok(build().apFlowProfiles?.filter(item => item.accessPointId !== '51').every(item => item.source.shapeIds.length >= 4)));
test('15 AP internal continuation is explicitly unknown', () => assert.ok(build().apPortFlows?.every(item => item.internalContinuation === 'unknown')));
test('16 AP internal continuation is not presented as splice, patch or jumper', () => assert.doesNotMatch(JSON.stringify(build().apPortFlows), /"internalContinuation":"(?:splice|patch|jumper)/));
test('17 lineage helper supports an AP as an intermediate node', () => {
  const lineage = structuredClone(build().fiberLineages![0]) as FiberLineage;
  lineage.legs[0].endNode = { kind: 'ap', id: '41' }; lineage.legs[1].startNode = { kind: 'ap', id: '41' };
  assert.equal(lineageVisitsAP(lineage, '41'), true);
});
test('18 all 20 source cable segments have deterministic color coverage', () => assert.equal(build().physicalColorCoverage?.length, 20));
test('19 all 1176 source marker positions decode a Fiber color', () => assert.equal(build().physicalColorCoverage?.reduce((sum, item) => sum + item.decodedFiberColors, 0), 1176));
test('20 every decoded Tube group has a physical color', () => assert.ok(build().physicalColorCoverage?.every(item => item.decodedTubeColors === item.tubeCount)));
test('21 full-page construction creates documented Tube records', () => {
  const data = build(); const cable = data.cables.find(item => item.legacyCableId === '150')!;
  assert.deepEqual([cable.tubeCount, data.tubes.filter(item => item.cableId === cable.id && item.basis === 'documented').length], [16,16]);
});
test('22 physical decoder reads inner fill and outer ring separately', () => assert.deepEqual([interpretTsageriMarker({ innerFill: '#ff0000', outerRing: '#7030a0' }).fiberColor.key, interpretTsageriMarker({ innerFill: '#ff0000', outerRing: '#7030a0' }).tubeColor.key], ['red','violet']));
test('23 connector line style is ignored', () => assert.deepEqual(interpretTsageriMarker({ innerFill: '4', outerRing: '#f48c37', connectorLine: '#ff0000' }).ignoredConnectorLine, '#ff0000'));
test('24 new construction evidence uses the marker-colors v2 rule', () => assert.ok(build().fibers.filter(item => item.physicalEvidence?.ruleVersion === PHYSICAL_COLOR_RULE).length > 1000));
test('25 no generated Tube identity uses a visible G-number label', () => assert.ok(build().tubes.every(item => !/^G\d+$/i.test(item.id))));
test('26 route workspace renders decoded Tube ribbons', () => assert.match(workspaceSource, /route-tube-ribbon/));
test('27 AP grid uses explicit role text and physical Fiber swatches', () => { assert.match(workspaceSource, /apRoleKa/); assert.match(workspaceSource, /fiberColor\.hex/); });
test('28 AP status green is styled independently from physical Fiber swatches', () => { assert.match(cssSource, /usage-in_use/); assert.match(cssSource, /ap-port-legend i/); });
test('29 Lentekhi is a first-class neutral aggregation identity', () => assert.equal(build().aggregations.find(item => item.id === LENTEKHI_AGGREGATION_ID)?.name, 'ლენტეხის აგრეგაცია'));
test('30 Lentekhi keeps both numeric legacy claims without a winner', () => assert.deepEqual(build().aggregations.find(item => item.id === LENTEKHI_AGGREGATION_ID)?.legacyIdentityClaims?.map(item => [item.field,item.value]), [['heading','6'],['property','5']]));
test('31 main route ends at the known Lentekhi aggregation', () => { const destination = findCableRoute(build(), 'ROUTE-TSAGERI-LENTEKHI-CORE')!.destination; assert.deepEqual(destination.state === 'known' ? destination.asset : null, { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID }); });
test('32 C184 is a canonical final route segment', () => assert.deepEqual(findCableRoute(build(), 'ROUTE-TSAGERI-LENTEKHI-CORE')!.legs.at(-1)?.segmentId, 'CAB-000184'));
test('33 Fiber Lineages can reach Lentekhi despite the numeric conflict', () => assert.ok(build().fiberLineages?.some(item => item.destination.asset?.id === LENTEKHI_AGGREGATION_ID)));
test('34 all 68 established Fiber Lineages remain', () => assert.equal(build().fiberLineages?.length, 68));
test('35 Lentekhi is counted as an aggregation instead of an unresolved route item', () => { const data = build(), route = findCableRoute(data, 'ROUTE-TSAGERI-LENTEKHI-CORE')!; const counts = routeInventoryCounts(data, route); assert.ok(counts.aggregationIds.has(LENTEKHI_AGGREGATION_ID)); assert.equal(data.externalBoundaries?.some(item => item.id === 'BOUNDARY-LENTEKHI-AGG'), false); assert.equal(counts.unresolved, route.branches.filter(item => item.verification === 'needs_verification' || item.destinationRole === 'external_direction').length); });
test('36 route search resolves AP Port18 to AP flow contexts', () => { const data = build(), route = findCableRoute(data, 'ROUTE-TSAGERI-LENTEKHI-CORE')!; assert.ok(routeScopedSearch(data, route, 'Port18').some(item => item.key === 'port:ap:41:18')); });
test('37 normal UI states that Lentekhi destination is known', () => assert.match(workspaceSource, /დანიშნულება ცნობილია/));
test('38 Iteration 19 validation passes', () => assert.deepEqual(validateIteration19(build()), []));
