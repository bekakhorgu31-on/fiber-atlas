import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const hash = (path: string) => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
const source = JSON.parse(read('migration/iteration27/source-interpretation.json'));
const dashboard = JSON.parse(read('migration/iteration27/dashboard-summary.json'));
const semanticAudit = JSON.parse(read('migration/iteration27/semantic-audit.json'));
const network = JSON.parse(read('reference/fiber-atlas-network-v1.manifest.json'));
const frozenManifest = JSON.parse(read('reference/tsageri-lentekhi-v1.manifest.json'));

test('27.1 new source extraction is independently reproducible and immutable by SHA', () => {
  assert.equal(source.source.sha256, '419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d');
  assert.equal(hash('migration/iteration27/run-a/tsageri-alpana-tvishi.raw.json.gz'), hash('migration/iteration27/run-b/tsageri-alpana-tvishi.raw.json.gz'));
  assert.equal(hash('migration/iteration27/run-a/interpretation.json'), hash('migration/iteration27/run-b/interpretation.json'));
  assert.equal(source.cableLabels.length, 22);
});

test('27.2 candidate overlap identifies C169 by full label, capacity, and endpoint context', () => {
  const c169 = source.overlapCandidates.C169;
  assert.equal(c169.state, 'exact_match');
  assert.equal(c169.sourceB.labels[0].legacyLabel, '169-206-216-48');
  assert.deepEqual(c169.sourceB.labels[0].endpointTokens, ['206', '216']);
  assert.equal(c169.sourceB.labels[0].capacityFibers, 48);
  assert.equal(c169.sourceA.canonicalId, 'CAB-000169');
  assert.equal(source.overlapCandidates.SC205.state, 'exact_match');
  assert.equal(source.overlapCandidates.SC206.state, 'exact_match');
});

test('27.3 C169 all 48 construction positions and SC206 transitions cross-validate', () => {
  const rows = source.overlapCandidates.C169.fiberComparisonRows;
  assert.equal(rows.length, 48);
  assert.ok(rows.every((row: any) => row.fiberColorMatches && row.tubeColorMatches && row.SC206TransitionMatches));
  assert.equal(source.overlapCandidates.C169.constructionCrossValidation.state, 'exact_match');
  assert.equal(source.overlapCandidates.C169.transitionCrossValidation.exactPairsReproduced, 48);
  assert.equal(source.overlapCandidates.C169.transitionCrossValidation.sourceAOnly, 0);
  assert.equal(source.overlapCandidates.C169.transitionCrossValidation.sourceBOnly, 0);
});

test('27.4 C148 preserves a source conflict in Tube colors instead of flattening it', () => {
  const c148 = source.overlapConstructionComparison['148'];
  assert.equal(c148.state, 'source_conflict');
  assert.equal(c148.fiberCountA, 192);
  assert.equal(c148.fiberCountB, 192);
  assert.equal(c148.sourceBFiberBanks.length, 2);
  assert.ok(c148.sourceBFiberBanks.every((bank: any) => bank.positionDifferences.length === 72));
  assert.ok(c148.sourceBFiberBanks.every((bank: any) => bank.positionDifferences.every((row: any) => row.sourceA.fiberColor === row.sourceB.fiberColor)));
  assert.ok(c148.sourceBFiberBanks.every((bank: any) => bank.positionDifferences[0].fiberNumber === 121 && bank.positionDifferences.at(-1).fiberNumber === 192));
});

test('27.5 exact Georgian direction label is preserved without creating Fiber continuity', () => {
  assert.equal(source.directionEvidence[0].rawText, 'ლენტეხი-ხელედის მიმართულება');
  assert.equal(network.namedDirectionEvidence.createsFiberContinuity, false);
  assert.ok(source.fiberTopology.nodeLocalTransitions > 0);
  const endpoints = new Map<string, string[]>(source.cableLabels.map((cable: any) => [cable.legacyId.slice(1), cable.endpointTokens]));
  assert.ok(source.fiberTopology.transitionEdges.every((edge: any) => endpoints.get(edge.a.segment)?.includes(edge.nodeToken) && endpoints.get(edge.z.segment)?.includes(edge.nodeToken)));
});

test('27.6 topology activation is independent from optional semantic enrichment', () => {
  assert.equal(network.status, 'ACTIVE');
  assert.ok(source.overlapCandidates.tsageriAggregation);
  assert.ok(source.overlapCandidates.SC205);
  assert.ok(source.overlapCandidates.SC206);
  assert.equal(network.topologyCertification.status, 'PASS');
  assert.equal(network.canonicalAssetMerges.length, 8);
  assert.equal(network.crossDocumentFiberLinks[0].transitionCount, 143);
  assert.equal(network.documentBoundaryLinks[0].assetType, 'unknown');
});

test('27.7 lightweight import dashboard reflects the full candidate without bundling raw evidence', () => {
  assert.equal(dashboard.sha256, source.source.sha256);
  assert.equal(dashboard.cableLabelCount, source.cableLabels.length);
  assert.equal(dashboard.nodeLocalTransitionCandidates, source.fiberTopology.nodeLocalTransitions);
  assert.equal(dashboard.overlapCandidates.C169, 'exact_match');
  assert.equal(dashboard.c148Conflict, 'unresolved_source_conflict');
  assert.equal(dashboard.certificationState, 'CERTIFIED_FOR_NETWORK_ACTIVATION');
  assert.equal(dashboard.packageStatus, 'PASS');
  assert.match(dashboard.sc207Boundary, /143 C151↔C152/);
  assert.equal(dashboard.activeCanonicalMerges, 7);
  assert.equal(dashboard.activation, 'ACTIVE');
});

test('27.8 semantic gates fail closed and account for every candidate edge', () => {
  assert.equal(semanticAudit.state, 'NOT_CERTIFIED');
  assert.equal(semanticAudit.activation, 'withheld');
  assert.equal(semanticAudit.transitions.candidateCount, 1151);
  assert.equal(semanticAudit.transitions.duplicateOverlapEvidence, 376);
  assert.equal(semanticAudit.transitions.notSemanticallyReviewed, 0);
  assert.equal(semanticAudit.transitions.validatedExact, 775);
  assert.equal(semanticAudit.transitions.unexplained, 0);
  assert.equal(semanticAudit.gates.all1151TransitionDispositions, 'PASS_ZERO_UNEXPLAINED');
  assert.equal(semanticAudit.transitions.groups.reduce((sum: number, group: any) => sum + group.candidateCount, 0), 1151);
  assert.equal(network.promotion.status, 'ACTIVE');
  assert.equal(network.sourceBSemanticCertification.state, 'CERTIFIED_FOR_NETWORK_ACTIVATION');
  assert.equal(network.sourceBSemanticCertification.transitionDispositions.exactSourceTransitions, 775);
  assert.equal(network.sourceBSemanticCertification.transitionDispositions.notSemanticallyReviewed, 0);
  assert.equal(network.crossDocumentFiberLinks.length, 1);
  assert.equal(network.sourceBSemanticCertification.nonBlockingEnrichment.length > 0, true);
  assert.equal(Object.values(semanticAudit.textShapeDisposition.companyOccurrenceCounts).reduce((sum: number, count: any) => sum + count, 0), 24);
  assert.equal(semanticAudit.textShapeDisposition.companyOccurrences.length, 24);
  assert.ok(semanticAudit.textShapeDisposition.companyOccurrences.every((item: any) => item.shapeId && item.worldBounds && Array.isArray(item.nearestTransitionMarkerShapes)));
  assert.equal(Object.values(semanticAudit.textShapeDisposition.categories).reduce((sum: number, count: any) => sum + count, 0), 3569);
});

test('27.9 C148 keeps identity evidence separate from six structured Tube-color conflicts', () => {
  const conflict = semanticAudit.c148Conflict;
  assert.equal(conflict.status, 'unresolved_source_conflict');
  assert.equal(conflict.physicalIdentity, 'strong_candidate_separate_from_attribute_conflict');
  assert.equal(conflict.affectedPositionCount, 72);
  assert.equal(conflict.fiberColorPositionsMatch, 192);
  assert.equal(conflict.affectedRanges.length, 6);
  assert.ok(conflict.affectedRanges.every((range: any) => range.sourceA.tubeColor !== range.sourceB.tubeColor));
  assert.ok(conflict.affectedRanges.every((range: any) => range.sourceB.groupShapeIds.length === 2));
  const c169 = network.overlapCandidates.find((item: any) => item.sourceA === 'CAB-000169');
  assert.equal(c169.state, 'golden_48_of_48');
  assert.equal(network.topologyCertification.C169SC206TransitionsWithDualEvidence, 48);
});

test('27.10 frozen V1 manifest and source identity are unchanged', () => {
  assert.equal(hash('reference/tsageri-lentekhi-v1.manifest.json'), '59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125');
  assert.equal(network.frozenSource.manifestSha256, hash('reference/tsageri-lentekhi-v1.manifest.json'));
  assert.equal(frozenManifest.id, 'TSAGERI-LENTEKHI-REFERENCE-V1');
  assert.equal(frozenManifest.source.sha256, 'caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa');
});
