import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { loadFrozenV1Reference } from '../src/data/repository';
import summary from '../src/data/iteration23-fresh-summary.json';
import transitions from '../src/data/iteration23-fresh-transitions.json';
import diff from '../src/data/iteration23-transition-diff.json';
import occupancy from '../src/data/iteration23-port-occupancy.json';
import bindingEvidence from '../src/data/iteration23-port-bindings.json';
import reconciliation from '../src/data/iteration23-connection-reconciliation.json';
import ownerConfirmations from '../src/data/iteration23-owner-confirmations.json';
import physical from '../src/data/iteration23-physical-construction.json';
import { connectionSheetForFiberAtNode, connectionSheetForPort } from '../src/domain/iteration22';
import { GOLDEN_F32_LINEAGE_ID, GOLDEN_PORT38_LINEAGE_ID } from '../src/domain/iteration21';
import { ITERATION23_SOURCE_SHA256 } from '../src/domain/iteration23';
import { ITERATION24_SOURCE_SHA256 } from '../src/domain/iteration24';

const data = await loadFrozenV1Reference();
const exactTransitions = data.nodeFiberTransitions!.filter(item => item.active && item.z);
const rows = data.connectionSheets!.flatMap(sheet => sheet.rows.map(row => ({ sheet, row })));
const edge = (node: string, a: string, af: number, z: string, zf: number) => transitions.exactConnectorEdges.find(item => item.nodeId === node && [item.a, item.z].some((left, index, pair) => left.legacySegmentId === a && left.fiberNumber === af && pair[1 - index].legacySegmentId === z && pair[1 - index].fiberNumber === zf));

test('23.1 clean import uses the current desktop VSDX SHA', () => assert.equal(summary.source.sha256, ITERATION23_SOURCE_SHA256));
test('23.2 fresh interpreter declares old fixtures excluded from its input', () => {
  assert.equal(summary.generation.oldFixtureInput, false);
  assert.match(transitions.inputPolicy, /fresh raw extraction only/);
  assert.equal('ownerAnchors' in transitions, false);
});
test('23.3 owner confirmations are a separate overlay', () => {
  assert.equal(ownerConfirmations.layer, 'owner_confirmation');
  assert.ok(ownerConfirmations.confirmations.some(item => item.id === GOLDEN_F32_LINEAGE_ID));
});
test('23.4 effective fill resolves occupied green AP Port', () => {
  const port = occupancy.ports.find(item => item.ownerId === '41' && item.portNumber === 1)!;
  assert.deepEqual([port.effectiveFill, port.physicalUsage, port.sourceShapeIds[0]], ['#92d050', 'in_use', '12484']);
});
test('23.5 white Port resolves unused under the source convention', () => {
  const port = occupancy.ports.find(item => item.ownerId === '41' && item.portNumber === 4)!;
  assert.deepEqual([port.effectiveFill, port.physicalUsage], ['#ffffff', 'unused']);
});
test('23.6 unused never becomes available', () => assert.ok(occupancy.ports.filter(item => item.physicalUsage === 'unused').every(item => item.availability === 'unknown')));
test('23.7 physical Fiber green is structurally distinct from Port status green', () => {
  assert.ok(data.fibers.some(item => item.physicalColor?.key === 'green'));
  assert.equal('fiberColor' in occupancy.ports[0], false);
});
test('23.8 exact Connect row survives raw extraction', () => assert.deepEqual(summary.rawAnchors.connectRow, { FromCell: 'EndX', FromPart: '12', FromSheet: '44243', ToCell: 'Connections.X2', ToPart: '101', ToSheet: '37815' }));
test('23.9 nested group coordinates are transformed into page space', () => {
  const anchor = summary.rawAnchors.nestedGroup;
  assert.deepEqual([anchor.parentId, anchor.depth], ['43429', 1]);
  assert.ok(Math.abs(anchor.geometry.global_pin.y - 595.4062538919969) < 1e-9);
  assert.equal(anchor.geometry.local_to_page.length, 6);
});
test('23.10 master inherited style is resolved with provenance', () => {
  const fill = summary.rawAnchors.masterInheritedStyle.effectiveStyle.FillForegnd;
  assert.deepEqual([summary.rawAnchors.masterInheritedStyle.masterId, fill.rgb, fill.source_kind], ['23', '#bfbfbf', 'master-shape']);
});
test('23.11 mirrored Tsageri ports are deduplicated while preserving both shapes', () => {
  const ports = occupancy.ports.filter(item => item.ownerId === 'ODF-TSAGERI-01');
  assert.equal(ports.length, 192);
  assert.ok(ports.every(item => item.sourceShapeIds.length === 2));
});
test('23.12 exact Fiber numbers come from labels and x alignment', () => {
  const binding = bindingEvidence.bindings.find(item => item.ownerId === '41' && item.portNumber === 3)!;
  assert.equal(binding.fiberNumber, 3);
  assert.ok(binding.basis.includes('ordered_marker_alignment'));
});
test('23.13 every fresh transition appears in exactly one connection sheet', () => assert.ok(exactTransitions.every(item => rows.filter(entry => entry.row.nodeFiberTransitionId === item.id).length === 1)));
test('23.14 no fresh exact transition is missing from active sheets', () => assert.equal(new Set(rows.filter(entry => entry.row.state === 'exact').map(entry => entry.row.nodeFiberTransitionId).filter(Boolean)).size, transitions.exactConnectorEdges.length));
test('23.15 no sheet creates an exact transition absent from fresh evidence', () => {
  const ids = new Set(transitions.exactConnectorEdges.map(item => item.id));
  assert.ok(rows.filter(entry => entry.row.nodeFiberTransitionId && entry.row.state === 'exact').every(entry => ids.has(entry.row.nodeFiberTransitionId!)));
});
test('23.16 cross-Tube mappings preserve both Tube identities', () => assert.ok(rows.some(({ row }) => row.state === 'exact' && row.tubeChanged && row.left.tubeNumber !== row.right.tubeNumber)));
test('23.17 cross-color mappings preserve both Fiber colors', () => assert.ok(rows.some(({ row }) => row.state === 'exact' && row.fiberColorChanged && row.left.fiberColor?.key !== row.right.fiberColor?.key)));
test('23.18 same-number direct mappings remain explicit', () => assert.ok(rows.some(({ row }) => row.state === 'exact' && !row.numberChanged && row.nodeFiberTransitionId)));
test('23.19 AP Port and Fiber navigation resolve the same sheet', () => {
  const byPort = connectionSheetForPort(data, 'ap', '52', 24);
  const byFiber = connectionSheetForFiberAtNode(data, { kind: 'ap', id: '52' }, 'CAB-000175', 24);
  assert.equal(byPort?.id, byFiber?.id);
});
test('23.20 branch-aware Golden Cases survive clean regeneration', () => {
  assert.ok(data.fiberLineages?.some(item => item.id === GOLDEN_F32_LINEAGE_ID));
  assert.ok(data.fiberLineages?.some(item => item.id === GOLDEN_PORT38_LINEAGE_ID));
  assert.ok(edge('SC219', '176', 32, '175', 24));
  assert.ok(edge('SC224', '184', 38, '181', 6));
});
test('23.21 SC218 raw Golden mapping is source-derived', () => assert.ok(edge('SC218', '172', 29, '173', 1)));
test('23.22 all relationship reconciliations balance', () => assert.ok(reconciliation.relationships.every(item => item.reconciled && item.exact + item.intentionalTerminations + item.unresolved + item.otherRelationship === item.capacity)));
test('23.23 AP and ODF occupancy covers 384 unique logical Ports', () => {
  const keys = new Set(occupancy.ports.map(item => `${item.ownerType}:${item.ownerId}:${item.portNumber}`));
  assert.equal(keys.size, 384);
});
test('23.24 old/new transition comparison is isolated and exhaustive', () => assert.deepEqual(diff.counts, { changed: 0, fresh: 838, newlyDiscovered: 0, notFoundInFreshSource: 0, old: 838, reproducedExactly: 838 }));
test('23.25 active Document Overview exposes source file, import date and SHA prefix', () => {
  const document = data.sourceDocuments![0];
  assert.equal(document.sourceSha256, ITERATION24_SOURCE_SHA256);
  const source = readFileSync(new URL('../src/views/DocumentOverview.tsx', import.meta.url), 'utf8');
  assert.match(source, /Active source:/);
  assert.match(source, /ITERATION24_IMPORT_DATE/);
});
test('23.26 change filters and all-connections view are present', () => {
  const source = readFileSync(new URL('../src/views/SpliceWorkspace.tsx', import.meta.url), 'utf8');
  for (const text of ['ყველა შეერთება','ნომერი შეიცვალა','ტუბი შეიცვალა','ჟილის ფერი შეიცვალა','დაუდგენელი','ცვლილებები']) assert.match(source, new RegExp(text));
});
test('23.27 print output identifies generation date and source SHA', () => {
  const source = readFileSync(new URL('../src/views/SpliceWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /splice-print-meta/);
  assert.match(source, /ITERATION24_SOURCE_SHA256/);
});
test('23.28 page identity and package counts come from the fresh extraction', () => {
  assert.deepEqual([summary.page.id, summary.page.name], ['4', 'ცაგერი-ლენტეხი']);
  assert.deepEqual([summary.rawCounts.package_parts, summary.rawCounts.xml_parts_preserved_verbatim, summary.rawCounts.connect_rows], [41, 40, 203]);
});
test('23.29 physical construction is regenerated from the current raw source', () => {
  assert.equal(physical.sourceSha256, ITERATION23_SOURCE_SHA256);
  assert.equal(physical.conventionLayer, 'iteration23-owner-confirmations.json#OWNER-MARKER-GRAMMAR');
  assert.deepEqual([physical.segments.length, physical.segments.flatMap(item => item.records).length, physical.segments.reduce((sum, item) => sum + item.tubeCount, 0)], [20, 1176, 98]);
  assert.ok(physical.segments.every(item => item.pairedBanksAgree && item.unresolved.length === 0));
});
test('23.30 fresh transition endpoints retain both local physical identities', () => {
  const f32 = edge('SC219', '176', 32, '175', 24)!;
  const c176 = [f32.a, f32.z].find(item => item.legacySegmentId === '176')!;
  assert.deepEqual([c176.fiberNumber, c176.tubeNumber, c176.fiberColorKey], [32, 3, 'black']);
  assert.ok([f32.a, f32.z].every(item => item.tubeColorKey && item.fiberColorKey && item.effectiveInnerColor));
});
test('23.31 relationship reconciliation includes physical change counts and basis', () => {
  const item = reconciliation.relationships.find(value => value.nodeId === 'SC218' && value.leftLegacySegmentId === '172' && value.rightLegacySegmentId === '173')!;
  assert.deepEqual([item.numberChanges, item.tubeChanges, item.fiberColorChanges], [12, 12, 12]);
  assert.ok(Object.keys(item.basisCounts).length > 0);
});
test('23.32 active core inventory and annotations are revalidated against the fresh revision', () => {
  assert.equal(data.cables.length, summary.inventory.cables.length);
  assert.ok(data.cables.every(item => item.source.interpretationRule === 'tsageri-lentekhi-source-fidelity/2'));
  assert.ok(data.closures.every(item => item.source.interpretationRule === 'tsageri-lentekhi-source-fidelity/2'));
  assert.ok(data.accessPoints.every(item => item.source.interpretationRule === 'tsageri-lentekhi-source-fidelity/2'));
  assert.ok(data.sourceAnnotations?.every(item => item.sourceSha256 === ITERATION24_SOURCE_SHA256 && item.extractionRunId === 'IMPORT-TL-2026-09-29-I24'));
  assert.equal(data.migrationCoverage?.sourceShapes, summary.rawCounts.all_page_shapes_including_subshapes);
});
