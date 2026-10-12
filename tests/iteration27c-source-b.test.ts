import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const ledger = JSON.parse(readFileSync(join(root, 'migration/iteration27/source-b-transition-ledger.json'), 'utf8'));
const journeys = JSON.parse(readFileSync(join(root, 'migration/iteration27/source-b-fiber-journey-summary.json'), 'utf8'));
const dashboard = JSON.parse(readFileSync(join(root, 'migration/iteration27/dashboard-summary.json'), 'utf8'));

test('27C source ledger retains candidate provenance while 27D activates the validated projection', () => {
  assert.equal(ledger.summary.candidateTransitions, 1151);
  assert.equal(ledger.summary.dispositionCounts.exact_source_transition, 775);
  assert.equal(ledger.summary.dispositionCounts.duplicate_overlap_evidence, 376);
  assert.equal(ledger.summary.unexplained, 0);
  assert.equal(ledger.transitions.length, 1151);
  assert.equal(ledger.activation.active, false, 'the immutable 27C ledger remains a source-candidate artifact');
  assert.equal(dashboard.certificationState, 'CERTIFIED_FOR_NETWORK_ACTIVATION');
  assert.equal(dashboard.activation, 'ACTIVE');
  assert.equal(dashboard.transitionDisposition.notSemanticallyReviewed, 0);
});

test('each source transition has its own two unique marker endpoints', () => {
  const connectors = ledger.transitions.map((edge: { connectorShape: string }) => edge.connectorShape);
  assert.equal(new Set(connectors).size, 1151);
  for (const edge of ledger.transitions) {
    assert.deepEqual(edge.endpointMarkerMatches, [1, 1]);
    assert.ok(edge.markerShapeA);
    assert.ok(edge.markerShapeB);
    assert.ok(edge.connectorGeometry.length >= 1);
    assert.equal(edge.active, false);
  }
});

test('node relationship matrix matches the audited source groups', () => {
  const actual = Object.fromEntries(ledger.relationshipMatrix.map((row: { node: string; segmentA: string; segmentB: string; candidateCount: number }) =>
    [row.node + ':' + row.segmentA + '/' + row.segmentB, row.candidateCount]));
  const expected: Record<string, number> = {
    'SC207:C151/C152': 143,
    'SC208:C152/C153': 24, 'SC208:C152/C154': 108,
    'SC209:C154/C155': 18, 'SC209:C154/C156': 90, 'SC209:C155/C156': 6,
    'SC210:C156/C157': 12, 'SC210:C156/C158': 84, 'SC210:C157/C158': 12,
    'SC211:C158/C159': 14, 'SC211:C158/C160': 18, 'SC211:C158/C161': 64,
    'SC211:C159/C160': 2, 'SC211:C159/C161': 8,
    'SC212:C161/C162': 11, 'SC212:C161/C164': 23, 'SC212:C162/C164': 8,
    'SC213:C164/C165': 12, 'SC213:C164/C166': 36, 'SC213:C165/C166': 12,
    'SC214:C166/C167': 46, 'SC215:C167/C168': 24,
  };
  for (const [key, count] of Object.entries(expected)) assert.equal(actual[key], count, key);
  assert.equal(Object.keys(expected).length, 22);
});

test('SC207 keeps its unmapped position unresolved rather than inventing a termination', () => {
  const edges = ledger.transitions.filter((edge: { node: string }) => edge.node === 'SC207');
  assert.equal(edges.length, 143);
  assert.equal(edges.some((edge: { fiberA: number }) => edge.fiberA === 118), false);
  assert.ok(edges.every((edge: { fiberA: number; fiberB: number }) => edge.fiberA === edge.fiberB));
});

test('every Source B Fiber has a transition-only JourneySummary', () => {
  assert.equal(journeys.coverage, 1512);
  assert.equal(journeys.items.length, 1512);
  assert.deepEqual(journeys.statusCounts, { full: 0, partial: 1512, intentional_termination: 0, external_boundary: 0 });
  assert.ok(journeys.items.every((item: { status: string; terminationClaimed: boolean; boundaryClaimed: boolean }) =>
    item.status === 'partial' && !item.terminationClaimed && !item.boundaryClaimed));
  assert.ok(ledger.fiberComponents.every((component: { routeAdjacencyUsed: boolean }) => !component.routeAdjacencyUsed));
});

test('V1 frozen manifest stays unchanged while optional semantic gaps remain visible', () => {
  const frozen = readFileSync(join(root, 'reference/tsageri-lentekhi-v1.manifest.json'));
  assert.equal(createHash('sha256').update(frozen).digest('hex'), '59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125');
  assert.match(dashboard.semanticGates.Ports, /not decoded/);
  assert.match(dashboard.semanticGates.Companies, /24 occurrences preserved/);
  assert.match(dashboard.semanticGates.Annotations, /accounted/);
  assert.match(dashboard.semanticGates['Node 207'], /asset type unknown/);
  assert.equal(dashboard.overlapCandidates.C148, 'source_conflict');
});
