import assert from 'node:assert/strict';
import test from 'node:test';
import { loadFrozenV1Reference } from '../src/data/repository';
import { lineageForFiber } from '../src/domain/fiberLineage';
import {
  BRANCH_LINEAGE_RULE, GOLDEN_F32_LINEAGE_ID, GOLDEN_PORT38_LINEAGE_ID,
  NODE_FIBER_TRANSITION_RULE, nodeTransitionsForFiber, validateIteration21,
} from '../src/domain/iteration21';
import { fiberJourneySummary, portTopologyBinding } from '../src/domain/iteration20';
import { validateInventory } from '../src/domain/network';

const data = await loadFrozenV1Reference();
const f32 = data.fiberLineages!.find(item => item.id === GOLDEN_F32_LINEAGE_ID)!;
const p38 = data.fiberLineages!.find(item => item.id === GOLDEN_PORT38_LINEAGE_ID)!;
const legKeys = (lineage: typeof f32) => lineage.legs.map(leg => `${leg.sourceSegmentLabel}/F${leg.fiberNumber}`);
const reachesAp = (apId: string) => data.fiberLineages!.filter(lineage => [lineage.endpointA, lineage.endpointB].some(endpoint => endpoint?.asset?.kind === 'ap' && endpoint.asset.id === apId));

test('1 Route adjacency never creates a Fiber transition', () => {
  assert.ok(data.nodeFiberTransitions!.every(item => item.source.interpretationRule === NODE_FIBER_TRANSITION_RULE));
  assert.equal(nodeTransitionsForFiber(data, 'CAB-000176', 33).some(item => item.node.kind === 'closure' && item.node.id === '219'), false);
});
test('2 every active multi-leg Lineage uses node-local transition edges', () => assert.ok(data.fiberLineages!.every(item => item.transitions.length === item.legs.length - 1 && item.transitions.every(edge => edge.nodeFiberTransitionId))));
test('3 branch transition can leave the main Route', () => assert.deepEqual([legKeys(f32).includes('C175/F24'), legKeys(f32).some(item => item.startsWith('C174/'))], [true, false]));
test('4 nested-route transition can leave the root Route', () => assert.deepEqual(legKeys(p38), ['C184/F38', 'C181/F6']));
test('5 previous Lineages may be superseded', () => assert.deepEqual([data.fiberLineageAudit!.length, data.supersededFiberLineages!.length], [68, 42]));
test('6 stale Lineage never overrides corrected graph', () => assert.deepEqual([fiberJourneySummary(data, 'CAB-000176', 32)?.lineageId, lineageForFiber(data, 'CAB-000176', 32)?.interpretationRule], [GOLDEN_F32_LINEAGE_ID, BRANCH_LINEAGE_RULE]));
test('7 AP51 requires C173', () => assert.ok(reachesAp('51').every(lineage => lineage.legs.some(leg => leg.segmentId === 'CAB-000173'))));
test('8 AP52 requires C175', () => assert.ok(reachesAp('52').every(lineage => lineage.legs.some(leg => leg.segmentId === 'CAB-000175'))));
test('9 AP53 requires C182', () => assert.ok(reachesAp('53').every(lineage => lineage.legs.some(leg => leg.segmentId === 'CAB-000182'))));
test('10 AP54 requires C183', () => assert.ok(reachesAp('54').every(lineage => lineage.legs.some(leg => leg.segmentId === 'CAB-000183'))));
test('11 root-route paths reaching SC225 require C181', () => assert.ok(data.fiberLineages!.filter(item => item.legs.some(leg => ['CAB-000180', 'CAB-000184'].includes(leg.segmentId)) && item.legs.some(leg => leg.startNode.id === '225' || leg.endNode.id === '225')).every(item => item.legs.some(leg => leg.segmentId === 'CAB-000181'))));
test('12 skipped-node Lineage fails validation', () => {
  const clone = structuredClone(data);
  const target = clone.fiberLineages!.find(item => item.id === GOLDEN_F32_LINEAGE_ID)!;
  target.legs[1].startNode = { kind: 'closure', id: '999' };
  assert.ok(validateIteration21(clone).some(error => error.includes('Missing node-local transition')));
});

test('13 C176/F32 physical color is black', () => assert.equal(data.fibers.find(item => item.cableId === 'CAB-000176' && item.number === 32)?.physicalColor.key, 'black'));
test('14 C176/F32 reaches SC219', () => assert.ok(f32.legs.some(leg => leg.segmentId === 'CAB-000176' && (leg.startNode.id === '219' || leg.endNode.id === '219'))));
test('15 C176/F32 branches to AP52 through C175/F24', () => assert.deepEqual([f32.destination.asset, f32.destination.portNumber, legKeys(f32).at(-1)], [{ kind: 'ap', id: '52' }, 24, 'C175/F24']));
test('16 C176/F32 opposite endpoint is Lentekhi', () => assert.deepEqual([f32.origin.asset, f32.origin.portNumber], [{ kind: 'aggregation', id: 'AGG-LENTEKHI' }, 32]));
test('17 C176/F32 excludes SC218, C174, C173 and AP51', () => {
  assert.equal(f32.legs.some(leg => ['CAB-000174', 'CAB-000173'].includes(leg.segmentId) || leg.startNode.id === '218' || leg.endNode.id === '218'), false);
  assert.equal([f32.origin, f32.destination].some(endpoint => endpoint.asset?.kind === 'ap' && endpoint.asset.id === '51'), false);
});
test('18 C176/F32 records the SC219 local remap', () => assert.ok(f32.transitions.some(item => item.node.id === '219' && item.fromSegmentId === 'CAB-000176' && item.fromFiberNumber === 32 && item.toSegmentId === 'CAB-000175' && item.toFiberNumber === 24)));
test('19 AP52 Port24 opens the same F32 Lineage', () => assert.ok(portTopologyBinding(data, 'ap', '52', 24)?.lineageIds.includes(GOLDEN_F32_LINEAGE_ID)));

test('20 Lentekhi Port38 binds C184/F38', () => assert.deepEqual([portTopologyBinding(data, 'odf', 'ODF-LENTEKHI-01', 38)?.segmentId, portTopologyBinding(data, 'odf', 'ODF-LENTEKHI-01', 38)?.fiberNumber], ['CAB-000184', 38]));
test('21 Port38 reaches SC224 and switches to C181/F06', () => assert.deepEqual(legKeys(p38), ['C184/F38', 'C181/F6']));
test('22 Port38 reaches SC225', () => assert.ok(p38.legs.some(leg => leg.segmentId === 'CAB-000181' && (leg.startNode.id === '225' || leg.endNode.id === '225'))));
test('23 Port38 has a known SC225 termination endpoint', () => assert.match(p38.destination.label, /SC225.*მთავრდება/));
test('24 Port38 excludes SC223, SC218 and AP51', () => {
  assert.equal(p38.legs.some(leg => ['223', '218'].includes(leg.startNode.id) || ['223', '218'].includes(leg.endNode.id)), false);
  assert.equal([p38.origin, p38.destination].some(endpoint => endpoint.asset?.kind === 'ap' && endpoint.asset.id === '51'), false);
});
test('25 Port38 journey terminates and uses the golden Lineage', () => assert.deepEqual([fiberJourneySummary(data, 'CAB-000184', 38)?.scope, fiberJourneySummary(data, 'CAB-000184', 38)?.lineageId], ['termination', GOLDEN_PORT38_LINEAGE_ID]));
test('26 adjacent F37 follows the same proven SC224 branch pattern without invented AP', () => {
  const adjacent = lineageForFiber(data, 'CAB-000184', 37)!;
  assert.deepEqual(legKeys(adjacent), ['C184/F37', 'C181/F5']);
  assert.match(adjacent.destination.label, /SC225.*მთავრდება/);
});

test('27 every source Fiber retains one JourneySummary', () => assert.deepEqual([data.fiberJourneySummaries!.length, new Set(data.fiberJourneySummaries!.map(item => item.fiberId)).size], [1176, 1176]));
test('28 rebuilt inventory has deterministic graph and audit totals', () => {
  const auditCounts = data.fiberLineageAudit!.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.classification]: (counts[item.classification] ?? 0) + 1 }), {});
  assert.deepEqual([data.nodeFiberTransitions!.length, data.fiberLineages!.length, auditCounts.preserved, auditCounts.corrected], [854, 278, 26, 42]);
});
test('29 audited node routing tables have source-specific counts', () => {
  const count = (id: string) => data.nodeFiberTransitions!.filter(item => item.node.kind === 'closure' && item.node.id === id).length;
  assert.deepEqual(['205','206','216','218','219','224','225'].map(count), [196,180,56,52,48,48,36]);
});
test('30 AP branch coverage is physical-segment constrained', () => assert.deepEqual(['50','51','52','53','54'].map(id => reachesAp(id).length), [24,24,24,16,16]));
test('31 validation accepts the complete Iteration 21 inventory', () => assert.deepEqual(validateIteration21(data), []));
test('32 shared inventory validation accepts the rebuilt graph', () => assert.deepEqual(validateInventory(data), []));
