import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import test from 'node:test';
import certification from '../src/data/iteration24-certification.json';
import diagnostics from '../src/data/iteration24-shape-diagnostics.json';
import transitions from '../src/data/iteration24-fresh-transitions.json';
import physical from '../src/data/iteration24-physical-construction.json';
import bindings from '../src/data/iteration24-port-bindings.json';
import occupancy from '../src/data/iteration24-port-occupancy.json';
import annotations from '../src/data/source-annotations.json';
import { repository } from '../src/data/repository';
import { parseRoute, routeHash } from '../src/domain/navigation';

const rawPath = new URL('../migration/iteration24/tsageri-lentekhi.iteration24.raw.json.gz', import.meta.url);
const raw = JSON.parse(gunzipSync(readFileSync(rawPath)).toString('utf8'));
const page = raw.pages[0];
const byId = new Map(page.shapes.map((shape: any) => [String(shape.id), shape]));

test('24.1 certification reads the immutable current VSDX and passes all 15 gates', () => {
  assert.equal(certification.source.sha256, 'caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa');
  assert.equal(certification.statement, 'CERTIFIED FOR NEXT INTERPRETATION ITERATION');
  assert.equal(certification.gates.length, 15); assert.ok(certification.gates.every(gate => gate.passed));
  assert.equal(certification.criticalLimitations, 0);
  assert.equal(certification.rawArtifactSha256, certification.secondRunArtifactSha256);
});

test('24.2 package, hierarchy, raw text and Property evidence are lossless', () => {
  assert.equal(raw.format, 'fiber-atlas-vsdx-raw/3'); assert.equal(raw.package_parts.length, 41);
  assert.equal(raw.summary.all_page_shapes_including_subshapes, 7349); assert.equal(raw.summary.grouped_subshapes, 4709);
  assert.equal(raw.summary.shapes_with_local_property_sections, 218); assert.equal(raw.summary.unique_masters, 22);
  assert.equal((byId.get('43430') as any).parent_id, '43429'); assert.deepEqual((byId.get('43430') as any).group_path, ['43429']);
  assert.equal((byId.get('12484') as any).raw_text, '1\n'); assert.equal((byId.get('15983') as any).raw_text, '172-217-218-48\n');
});

test('24.3 world geometry resolves nested and rotated source Shapes', () => {
  const nested: any = byId.get('43430'); const parent: any = byId.get('43429');
  assert.equal(nested.depth, 1); assert.ok(Math.abs(nested.geometry.global_pin.x - parent.geometry.global_pin.x) < 1e-9);
  assert.ok(nested.geometry.world_bounds.width > 17.9);
  const rotated: any = byId.get('37584'); assert.ok(Math.abs(rotated.geometry.world_angle + Math.PI / 2) < 1e-9);
  assert.ok(rotated.geometry.world_bounds.height > 5.4);
});

test('24.4 effective style provenance resolves master, green Port, white Port and Fiber marker', () => {
  const inherited: any = byId.get('12428'); assert.equal(inherited.effective_style.FillForegnd.source_kind, 'master-shape');
  assert.equal(inherited.effective_style.FillForegnd.rgb, '#bfbfbf');
  assert.equal((byId.get('12484') as any).effective_style.FillForegnd.rgb, '#92d050');
  assert.equal((byId.get('12487') as any).effective_style.FillForegnd.rgb, '#ffffff');
  assert.equal((byId.get('34674') as any).effective_style.FillForegnd.rgb, '#808080');
  assert.equal((byId.get('34674') as any).effective_style.LineColor.rgb, '#008000');
  assert.equal(raw.summary.unresolved_effective_colors, 0);
});

test('24.5 Connect rows, explicit/geometric transitions and remaps reconcile', () => {
  assert.equal(raw.summary.connect_rows, 203); assert.equal(raw.summary.connect_rows_dangling, 0);
  assert.equal(transitions.exactConnectorEdges.length, 838);
  assert.ok(transitions.exactConnectorEdges.some(edge => edge.a.fiberNumber === edge.z.fiberNumber));
  assert.ok(transitions.exactConnectorEdges.some(edge => edge.a.fiberNumber === 29 && edge.z.fiberNumber === 1));
  assert.ok(transitions.exactConnectorEdges.some(edge => edge.a.tubeNumber !== edge.z.tubeNumber));
  assert.ok(transitions.exactConnectorEdges.every(edge => !edge.basis.includes('route_adjacency')));
});

test('24.6 Ports, physical markers and mirrored identities are freshly certified', () => {
  assert.equal(physical.segments.length, 20); assert.equal(physical.segments.reduce((sum, segment) => sum + segment.records.length, 0), 1176);
  assert.equal(bindings.bindings.length, 192); assert.equal(occupancy.ports.length, 384);
  const ap41p1 = occupancy.ports.find(port => port.ownerType === 'ap' && port.ownerId === '41' && port.portNumber === 1);
  assert.equal(ap41p1?.effectiveFill, '#92d050'); assert.equal(ap41p1?.physicalUsage, 'in_use');
  const tsageri1 = occupancy.ports.find(port => port.ownerType === 'odf' && port.ownerId === 'ODF-TSAGERI-01' && port.portNumber === 1);
  assert.equal(tsageri1?.sourceShapeIds.length, 2);
});

test('24.7 company labels and all meaningful text remain reconciled without assignments', () => {
  assert.equal(certification.counts.companyOccurrences, 31);
  assert.ok(certification.companyOccurrences.some(item => item.normalizedCandidate === 'OpenNet'));
  assert.ok(certification.companyOccurrences.some(item => item.normalizedCandidate === 'Skytel'));
  assert.ok(certification.companyOccurrences.some(item => item.normalizedCandidate === 'Magti'));
  assert.ok(certification.companyOccurrences.some(item => item.normalizedCandidate === 'Silknet'));
  assert.ok(certification.companyOccurrences.every(item => item.assignmentCreated === false && item.worldBounds));
  const report = (annotations as any).report;
  const annotationOccurrences = report.associated + report.groupAssociated + report.routeAssociated + report.pageGeneral + report.unresolvedAssociation;
  assert.equal(report.totalCandidateTexts - report.structuredSourceTexts - report.deliberatelyIgnored - annotationOccurrences, 0);
  assert.equal((annotations as any).extractionRunId, 'IMPORT-TL-2026-09-29-I24');
});

test('24.8 active data and engineering Shape deep links use certified Iteration 24 evidence', async () => {
  const data = await repository.load(); assert.match(data.snapshot, /fresh VSDX caae4badc9c8/);
  const hash = routeHash({ view: 'import', shapeId: '12484' }); assert.equal(hash, '#/import?shape=12484');
  assert.deepEqual(parseRoute(hash), { view: 'import', runId: undefined, shapeId: '12484' });
  assert.ok(diagnostics.anchors.some(item => item.shapeId === '12484'));
});
