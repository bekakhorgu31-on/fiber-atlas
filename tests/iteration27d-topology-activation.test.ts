import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { loadFrozenV1Reference, repository } from '../src/data/repository';
import { findCable, findFiber, validateInventory } from '../src/domain/network';
import { applyIteration27D, enrichNetworkNode, validateIteration27D } from '../src/domain/iteration27d';

test('27D activates source-proven topology while leaving optional metadata unresolved', async () => {
  const data = await repository.load();
  assert.deepEqual(validateIteration27D(data), []);
  assert.deepEqual(validateInventory(data), []);
  const doc = data.sourceDocuments?.find(item => item.id === 'SRC-TSAGERI-ALPANA-TVISHI-419DEF34');
  assert.equal(doc?.counts.cableSegments, 22);
  assert.equal(doc?.counts.logicalFibers, 1512);
  assert.equal(data.nodeFiberTransitions?.filter(item => item.id.startsWith('27D-')).length, 775);
  assert.equal(data.sourceAnnotations?.filter(item => item.id.startsWith('27D-ORG-')).length, 24);
  assert.equal(data.sourceAnnotations?.filter(item => item.id.startsWith('27D-CUT-')).length, 3);
  assert.equal(data.sourceAnnotations?.filter(item => item.id.startsWith('27D-CUT-')).every(item => item.warnings.some(note => note.includes('execution status is unknown'))), true);
  assert.equal(data.portTopologyBindings?.filter(item => item.id.startsWith('27D-')).length, 0);
  assert.equal(data.networkUseAssignments?.filter(item => item.id.startsWith('27D-')).length, 0);
});

test('SC207 joins exact C151/C152 edges and retains its canonical network node identity', async () => {
  const data = await repository.load();
  const node = data.networkNodes?.find(item => item.id === '207');
  assert.equal(node?.assetType, 'closure');
  assert.equal(node?.displayName, 'SC207');
  assert.equal(data.cables.find(item => item.id === 'CAB-000151')?.endpointB.kind, 'network_node');
  const at207 = data.nodeFiberTransitions?.filter(item => item.active && item.node.kind === 'network_node' && item.node.id === '207') ?? [];
  assert.equal(at207.length, 143);
  assert.equal(at207.some(item => item.a.segmentId === 'CAB-000151' && item.a.fiberNumber === 118), false);
  assert.equal(at207.some(item => item.z?.segmentId === 'SRC-TSAGERI-ALPANA-TVISHI-419DEF34-C152' && item.z.fiberNumber === 118), false);
  const idBefore = node!.id;
  const fiberEdgesBefore = at207.map(item => item.id);
  enrichNetworkNode(data, '207', { assetType: 'closure', displayName: 'SC207', source: { file: 'owner-confirmation', page: 'owner', shapeIds: [], interpretationRule: 'owner-confirmed-type' } });
  assert.equal(node!.id, idBefore);
  assert.equal(node!.displayName, 'SC207');
  assert.deepEqual(at207.map(item => item.id), fiberEdgesBefore);
});

test('shared overlap evidence deduplicates C169 and C148 conflict does not overwrite V1', async () => {
  const data = await repository.load();
  assert.equal(data.cables.filter(item => item.legacyCableId === '169').length, 1);
  const c169At206 = data.nodeFiberTransitions?.filter(item => item.node.kind === 'closure' && item.node.id === '206' && (item.a.segmentId === 'CAB-000169' || item.z?.segmentId === 'CAB-000169') && (item.a.segmentId === 'CAB-000150' || item.z?.segmentId === 'CAB-000150')) ?? [];
  assert.equal(c169At206.length, 48);
  assert.equal(c169At206.filter(item => item.evidenceSources?.some(ref => ref.file === 'Tsageri-Alpana-Tvishi.vsdx')).length, 48);
  assert.equal(findCable(data, '169-206-216-48')?.sourceRepresentations?.length, 2);
  assert.equal(data.fibers.find(item => item.cableId === 'CAB-000169' && item.number === 1)?.sourceRepresentations?.length, 2);
  const conflict = data.sourceConflicts?.find(item => item.id === 'CONFLICT-C148-TUBE-COLOR');
  assert.equal((conflict?.affectedPositionCount as number), 72);
  const c148 = findCable(data, '148-5-205-192')!;
  assert.equal((conflict?.affectedRanges as unknown[]).length, 6);
  assert.equal(findFiber(data, c148.id, 145)?.physicalEvidence?.source.file, 'Tsageri-Lentekhi 2025.vsdx');
});

test('Source B C172 stays separate from frozen V1 C172', async () => {
  const data = await repository.load();
  const v1 = findCable(data, '172-217-218-48');
  const sourceB = findCable(data, '172-225-44-24');
  assert.ok(v1 && sourceB);
  assert.notEqual(v1.id, sourceB.id);
  assert.equal(v1.legacyCableId, '172');
  assert.equal(sourceB.legacyCableId, '172');
  assert.equal(findCable(data, 'C172'), undefined);
});

test('27D activation projection is deterministic and leaves the frozen V1 input unchanged', async () => {
  const baseline = await loadFrozenV1Reference();
  const v1Before = JSON.stringify({ cables: baseline.cables, fibers: baseline.fibers, transitions: baseline.nodeFiberTransitions });
  const first = applyIteration27D(baseline);
  const second = applyIteration27D(baseline);
  const digest = (value: unknown) => createHash('sha256').update(JSON.stringify({ cables: (value as typeof first).cables, fibers: (value as typeof first).fibers, tubes: (value as typeof first).tubes, nodes: (value as typeof first).networkNodes, transitions: (value as typeof first).nodeFiberTransitions, annotations: (value as typeof first).sourceAnnotations, conflicts: (value as typeof first).sourceConflicts })).digest('hex');
  assert.equal(digest(first), digest(second));
  assert.equal(JSON.stringify({ cables: baseline.cables, fibers: baseline.fibers, transitions: baseline.nodeFiberTransitions }), v1Before);
});
