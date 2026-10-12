import assert from 'node:assert/strict';
import test from 'node:test';
import pilotJson from '../src/data/pilot.json';
import { applyConfirmedC172Construction } from '../src/domain/colors';
import { applyIteration07PathReview } from '../src/domain/pathReview';
import { applyIteration08CableRoute } from '../src/domain/cableRoutes';
import { applyIteration09Foundations } from '../src/domain/foundations';
import {
  C172_PHYSICAL_CABLE_ID, TSAGERI_ODF_ID, applyIteration10AggregationTopology,
  portRangeFor, traceFromOdfPort, validateIteration10,
} from '../src/domain/aggregationTopology';
import { searchInventory, traceFiber, validateInventory } from '../src/domain/network';
import { parseRoute, routeHash } from '../src/domain/navigation';
import type { Inventory } from '../src/domain/types';

const build = () => applyIteration10AggregationTopology(applyIteration09Foundations(applyIteration08CableRoute(applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory)))));
const destination = (data: Inventory, port: number) => portRangeFor(data, TSAGERI_ODF_ID, port)?.destination;

test('1 Tsageri aggregation contains a logical ODF', () => assert.deepEqual(build().odfs![0].containedBy, { kind: 'aggregation', id: '5' }));
test('2 reviewed Tsageri ODF exposes exactly 192 logical ports', () => assert.equal(build().odfPorts!.filter(item => item.odfId === TSAGERI_ODF_ID).length, 192));
test('3 internal and bottom-edge representations deduplicate to one port', () => { const p = build().odfPorts![0]; assert.equal(p.id, 'ODF-TSAGERI-01-P001'); assert.deepEqual(p.sourceRepresentations.map(item => item.role), ['internal_odf_port', 'aggregation_boundary_port']); });
test('4 deduplicated port retains all source references', () => assert.deepEqual(build().odfPorts![0].sourceRepresentations.map(item => item.source.shapeIds[0]), ['43429', '43832']));
test('5 mirrored source representations do not double capacity', () => { const data = build(); assert.equal(data.odfs![0].portCapacity, 192); assert.equal(data.odfPorts!.length, 192); assert.equal(data.odfPorts!.flatMap(item => item.sourceRepresentations).length, 384); });
test('6 ports 1-116 map to Ambrolauri direction', () => { const data = build(); for (let p = 1; p <= 116; p += 1) assert.deepEqual(destination(data, p), { type: 'named_direction', name: 'Ambrolauri direction' }); });
test('7 port 116 maps to Ambrolauri', () => { const target = destination(build(), 116); assert.equal(target?.type === 'named_direction' ? target.name : null, 'Ambrolauri direction'); });
test('8 port 117 maps to SC205 end range', () => assert.deepEqual(destination(build(), 117), { type: 'asset', asset: { kind: 'closure', id: '205' }, label: 'SC205' }));
test('9 port 130 maps to SC205 end range', () => assert.equal(portRangeFor(build(), TSAGERI_ODF_ID, 130)?.continuity, 'stops_at_destination'));
test('10 port 131 maps to AP Chkhuteli', () => assert.deepEqual(destination(build(), 131), { type: 'asset', asset: { kind: 'ap', id: '41' }, label: 'AP Chkhuteli' }));
test('11 port 144 maps to AP Chkhuteli', () => assert.equal(portRangeFor(build(), TSAGERI_ODF_ID, 144)?.id, 'PRA-TSAGERI-131-144'));
test('12 port 145 maps to Lentekhi direction', () => assert.deepEqual(destination(build(), 145), { type: 'cable_route', routeId: 'ROUTE-TSAGERI-LENTEKHI-CORE', label: 'Lentekhi direction' }));
test('13 port 192 maps to Lentekhi direction', () => assert.equal(portRangeFor(build(), TSAGERI_ODF_ID, 192)?.id, 'PRA-TSAGERI-145-192'));
test('14 range boundaries do not overlap', () => assert.deepEqual(validateIteration10(build()), []));
test('15 ports stopping at SC205 are not damaged', () => { const data = build(); for (let p = 117; p <= 130; p += 1) assert.equal(data.odfPorts!.find(item => item.number === p)!.condition, 'unknown'); });
test('16 direction assignment creates no customer service or rights', () => { const data = build(); assert.equal(data.services.length, 0); assert.equal(data.assignments.length, 0); assert.equal(data.rights.length, 0); });
test('17 AP Chkhuteli supports outgoing ports 3-22', () => { const row = build().accessPointPortRanges![0]; assert.deepEqual([row.accessPointId, row.startPort, row.endPort, row.role], ['41', 3, 22, 'egress']); });
test('18 AP Chkhuteli is not terminal', () => assert.match(build().accessPoints.find(item => item.id === '41')!.notes.join(' '), /not a leaf/));
test('19 AP 3-22 references Ambrolauri without exact mapping', () => { const row = build().accessPointPortRanges![0]; assert.deepEqual(row.destination, { type: 'named_direction', name: 'Ambrolauri direction' }); assert.equal(row.internalMapping, 'unresolved'); });
test('20 backfeed creates no fake splice edge', () => assert.equal(build().connections.some(item => item.location.kind === 'ap' && item.location.id === '41'), false));
test('21 ODF port trace stops at unresolved exact fiber mapping', () => { const trace = traceFromOdfPort(build(), TSAGERI_ODF_ID, 145); assert.equal(trace.stopCode, 'exact_mapping_unresolved'); assert.deepEqual(trace.exactOpticalPath, ['ODF-TSAGERI-01-P145']); });
test('22 Cable Segment remains distinct from PhysicalCable', () => { const data = build(); const segment = data.cables.find(item => item.legacyCableId === '172')!; const physical = data.physicalCables![0]; assert.equal(segment.recordType, 'cable_segment'); assert.notEqual(segment.id, physical.id); });
test('23 PhysicalCable remains distinct from Cable Route', () => { const data = build(); assert.notEqual(data.physicalCables![0].id, data.cableRoutes![0].id); assert.equal(data.physicalCables![0].routeId, data.cableRoutes![0].id); });
test('24 C172 remains local SC217 to SC218', () => { const c = build().cables.find(item => item.legacyCableId === '172')!; assert.deepEqual([c.endpointA, c.endpointB], [{ kind: 'closure', id: '217' }, { kind: 'closure', id: '218' }]); });
test('25 containing PhysicalCable extends upstream beyond SC217', () => { const end = build().physicalCables![0].endA; assert.equal(end.state, 'unresolved'); assert.match(end.label, /Upstream of SC217/); });
test('26 PhysicalCable ends at SC218 while route continues', () => { const data = build(); const pc = data.physicalCables![0]; assert.deepEqual(pc.endB, { state: 'known', asset: { kind: 'closure', id: '218' }, label: 'SC218 · physical cable end' }); assert.ok(data.cableRoutes![0].nodes.some(item => item.sequence > data.cableRoutes![0].nodes.find(n => n.asset?.id === '218')!.sequence)); });
test('27 route continuation does not assign the following segment to the same cable', () => { const data = build(); const after = data.cables.find(item => item.legacyCableId === '173')!; assert.equal(after.physicalCableId ?? null, null); assert.equal(data.physicalCables![0].segmentMemberships.some(item => item.segmentId === after.id), false); });
test('28 equal fiber count does not accept PhysicalCable membership', () => { const member = build().physicalCables![0].segmentMemberships.find(item => item.segmentId === 'CAB-000171')!; assert.equal(member.state, 'candidate'); assert.match(member.basis, /do not prove/); });
test('29 Iteration 09 route topology remains intact', () => { const route = build().cableRoutes![0]; assert.equal(route.nodes.length, 13); assert.equal(route.legs.length, 12); assert.equal(route.branches.length, 3); });
test('30 existing SC217 SC218 AP51 strict trace remains intact', () => { const trace = traceFiber(build(), 'CAB-000172', 29, false); assert.deepEqual(trace.stops.map(item => item.code), ['missing', 'port_unknown']); assert.equal(trace.steps.filter(item => item.kind === 'connection').length, 3); });
test('31 SC216 receives no invented three-way optical mapping', () => assert.equal(build().connections.some(item => item.location.kind === 'closure' && item.location.id === '216'), false));
test('32 legacy search and deep links remain valid', () => { const data = build(); assert.ok(searchInventory(data, 'C172').some(item => item.route.view === 'cable')); const route = { view: 'odf_port', odfId: TSAGERI_ODF_ID, port: 117 } as const; assert.deepEqual(parseRoute(routeHash(route)), route); });
test('Iteration 10 full inventory validates', () => assert.deepEqual(validateInventory(build()), []));
test('C172 points only to its reviewed PhysicalCable identity', () => assert.equal(build().cables.find(item => item.id === 'CAB-000172')!.physicalCableId, C172_PHYSICAL_CABLE_ID));
