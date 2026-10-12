import assert from 'node:assert/strict';
import test from 'node:test';
import pilotJson from '../src/data/pilot.json';
import { applyConfirmedC172Construction } from '../src/domain/colors';
import { applyIteration07PathReview } from '../src/domain/pathReview';
import { buildTsageriImportRun, candidateFingerprint, reconcileImportRun, reviewCandidate, tsageriEvidence } from '../src/domain/import';
import { availabilitySummary, cableFibers, findCable, findFiber, searchInventory, traceFiber } from '../src/domain/network';
import { parseRoute, routeHash } from '../src/domain/navigation';
import type { ImportCandidate, Inventory } from '../src/domain/types';

const pilot = applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory));
const clonePilot = (): Inventory => structuredClone(pilot);
const reviewed = (candidate: ImportCandidate, action: 'accepted' | 'corrected' | 'rejected' | 'unresolved', correction?: string) => reviewCandidate(candidate, {
  action,
  correction,
  decidedAt: '2026-09-25T00:00:00.000Z',
  reviewer: 'test-engineer',
});

test('actual source provenance and raw extraction counts remain attached to the run', () => {
  const run = buildTsageriImportRun();
  assert.equal(run.sourceSha256, 'caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa');
  assert.deepEqual(run.rawSummary, { pages: 1, allShapes: 7349, topLevelShapes: 2640, textShapes: 2676, localPropertyShapes: 218, connectRows: 203 });
  assert.ok(run.candidates.every(candidate => candidate.provenance.sourceSha256 === run.sourceSha256));
});

test('legacy cable labels create cable-segment candidates without inventing physical-cable parents', () => {
  const segments = buildTsageriImportRun().candidates.filter(candidate => candidate.kind === 'cable_segment');
  assert.equal(segments.length, 20);
  assert.ok(segments.every(candidate => candidate.interpreted.physicalCableId === null));
  assert.equal(segments.find(candidate => candidate.interpreted.legacySegmentId === '170')?.interpreted.fiberCount, 24);
});

test('only reviewed C172 physical evidence and the target SC218 edge are pre-accepted', () => {
  const run = buildTsageriImportRun();
  const physical = run.candidates.filter(candidate => candidate.kind === 'fiber_physical');
  const reviewedConnection = run.candidates.filter(candidate => candidate.kind === 'connection' && candidate.interpreted.fromSegmentId === '172' && candidate.interpreted.fromFiber === 29);
  const remaining = run.candidates.filter(candidate => candidate.kind !== 'fiber_physical' && !reviewedConnection.includes(candidate));
  assert.equal(physical.length, 48);
  assert.ok(physical.every(candidate => candidate.reviewState === 'accepted' && candidate.verification === 'documentation_reviewed'));
  assert.equal(reviewedConnection.length, 1);
  assert.equal(reviewedConnection[0].reviewState, 'accepted');
  assert.ok(remaining.every(candidate => candidate.reviewState === 'unreviewed' && candidate.verification === 'needs_verification'));
  assert.equal(run.acceptedRecordIds.length, 49);
  const lentekhi = run.candidates.find(candidate => candidate.kind === 'aggregation' && candidate.interpreted.name === 'ლენტეხი');
  assert.equal(lentekhi?.interpreted.aggregationIdCandidate, '6');
  assert.equal(lentekhi?.interpreted.conflictingPropertyId, '5');
  assert.ok(lentekhi?.warnings.some(warning => warning.includes('ეწინააღმდეგება')));
});

test('the source-specific interpreter preserves a documented number remap as two endpoint identities', () => {
  const remap = buildTsageriImportRun().candidates.find(candidate => candidate.kind === 'connection' && candidate.interpreted.fromFiber === 29);
  assert.equal(remap?.interpreted.fromSegmentId, '172');
  assert.equal(remap?.interpreted.fromFiber, 29);
  assert.equal(remap?.interpreted.toSegmentId, '173');
  assert.equal(remap?.interpreted.toFiber, 1);
  assert.equal(remap?.interpreted.approved, true);
  assert.equal(remap?.interpreted.operationVerification, 'unknown');
});

test('reused drawing colors never merge connection candidates', () => {
  const blue = buildTsageriImportRun().candidates.filter(candidate => candidate.kind === 'connection' && candidate.interpreted.lineColor === '#0000ff');
  assert.ok(blue.length > 2);
  assert.equal(new Set(blue.map(candidate => candidate.naturalKey)).size, blue.length);
});

test('strict trace follows an approved explicit remap across different numbers and physical colors', () => {
  const data = clonePilot();
  const from = findFiber(data, '172', 29)!;
  const to = findFiber(data, '173', 1)!;
  from.physicalColor = { nameKa: 'წითელი', nameEn: 'red', hex: '#ff0000', basis: 'documented', verification: 'documentation_reviewed' };
  to.physicalColor = { nameKa: 'ლურჯი', nameEn: 'blue', hex: '#0000ff', basis: 'documented', verification: 'documentation_reviewed' };
  const connection = data.connections.find(item => item.location.id === '218' && [item.a, item.z].some(end => end.kind === 'fiber' && end.cableId === from.cableId && end.fiber === 29))!;
  connection.approved = true;
  connection.verification = 'documentation_reviewed';
  const trace = traceFiber(data, from.cableId, 29, false);
  assert.ok(trace.steps.some(step => step.kind === 'cable' && step.cableId === to.cableId && step.fiber === 1));
  assert.equal(from.physicalColor.nameEn, 'red');
  assert.equal(to.physicalColor.nameEn, 'blue');
});

test('strict trace follows the single reviewed SC218 edge', () => {
  const trace = traceFiber(pilot, findCable(pilot, '172')!.id, 29, false);
  assert.equal(trace.steps.some(step => step.kind === 'cable' && step.cableId === findCable(pilot, '173')!.id && !step.candidate), true);
  assert.ok(trace.stops.some(stop => stop.code === 'port_unknown'));
});

test('candidate trace exposes the unresolved AP51 Port 1 suggestion', () => {
  const trace = traceFiber(pilot, findCable(pilot, '172')!.id, 29, true);
  assert.ok(trace.steps.some(step => step.kind === 'port' && step.title.includes('პორტი 1') && step.candidate));
  assert.equal(trace.includesCandidates, true);
});

test('unknown physical colors carry no asserted names or hex values', () => {
  assert.ok(pilot.fibers.filter(fiber => fiber.physicalColor.basis === 'unknown').every(fiber => fiber.physicalColor.nameKa === null && fiber.physicalColor.nameEn === null && fiber.physicalColor.hex === null));
});

test('unknown allocation is not counted as free capacity', () => {
  const fibers = cableFibers(pilot, findCable(pilot, '172')!.id);
  const summary = availabilitySummary(pilot, fibers);
  assert.equal(summary.available, 0);
  assert.equal(summary.unknown, fibers.length);
});

test('SC216 shared location does not create three-way optical continuity', () => {
  const at216 = pilot.connections.filter(connection => connection.location.kind === 'closure' && connection.location.id === '216');
  assert.equal(at216.length, 0);
  const trace = traceFiber(pilot, findCable(pilot, '169')!.id, 1, true);
  assert.equal(trace.steps.some(step => step.kind === 'cable' && ['CAB-000170', 'CAB-000171'].includes(step.cableId ?? '')), false);
});

test('legacy segment search remains available and uses corrected terminology', () => {
  const results = searchInventory(pilot, 'C172');
  assert.ok(results.some(result => result.route.view === 'cable' && result.category === 'კაბელის მონაკვეთი'));
});

test('legacy IDs remain valid in deep links', () => {
  const parsed = parseRoute('#/cable/172');
  assert.deepEqual(parsed, { view: 'cable', id: '172' });
  assert.equal(parsed?.view === 'cable' ? findCable(pilot, parsed.id)?.id : undefined, 'CAB-000172');
});

test('canonical segment routes and import routes serialize without changing IDs', () => {
  assert.equal(routeHash({ view: 'cable', id: 'CAB-000172' }), '#/cable/CAB-000172');
  assert.equal(routeHash({ view: 'import', runId: 'IR-caae4badc9c8' }), '#/import/IR-caae4badc9c8');
  assert.deepEqual(parseRoute('#/import/IR-caae4badc9c8'), { view: 'import', runId: 'IR-caae4badc9c8' });
});

test('identical reimport is idempotent and does not duplicate candidates', () => {
  const existing = buildTsageriImportRun();
  const merged = reconcileImportRun(existing, buildTsageriImportRun(tsageriEvidence));
  assert.equal(merged.candidates.length, existing.candidates.length);
  assert.deepEqual(merged.candidates.map(candidate => candidate.id), existing.candidates.map(candidate => candidate.id));
  assert.equal(merged.conflicts.length, 0);
});

test('identical reimport preserves an accepted decision and accepted record reference', () => {
  const existing = buildTsageriImportRun();
  existing.candidates[0] = reviewed(existing.candidates[0], 'accepted');
  const merged = reconcileImportRun(existing, buildTsageriImportRun());
  assert.equal(merged.candidates[0].reviewState, 'accepted');
  assert.equal(merged.candidates[0].acceptedRecordId, existing.candidates[0].acceptedRecordId);
  assert.equal(candidateFingerprint(merged.candidates[0]), candidateFingerprint(existing.candidates[0]));
});

test('changed evidence conflicts with an accepted record and never overwrites its fingerprint', () => {
  const existing = buildTsageriImportRun();
  existing.candidates[0] = reviewed(existing.candidates[0], 'accepted');
  const acceptedFingerprint = existing.candidates[0].acceptedFingerprint;
  const incoming = buildTsageriImportRun();
  incoming.candidates[0] = { ...incoming.candidates[0], interpreted: { ...incoming.candidates[0].interpreted, fiberCount: 999 } };
  const merged = reconcileImportRun(existing, incoming);
  assert.equal(merged.candidates[0].reviewState, 'conflict');
  assert.equal(merged.candidates[0].acceptedFingerprint, acceptedFingerprint);
  assert.deepEqual(merged.conflicts, [incoming.candidates[0].naturalKey]);
});

test('human review records accept, correct, reject, and unresolved decisions explicitly', () => {
  const candidate = buildTsageriImportRun().candidates[0];
  assert.equal(reviewed(candidate, 'accepted').reviewState, 'accepted');
  assert.equal(reviewed(candidate, 'corrected', 'fiberCount=24').decision?.correction, 'fiberCount=24');
  assert.equal(reviewed(candidate, 'rejected').acceptedRecordId, undefined);
  assert.equal(reviewed(candidate, 'unresolved').reviewState, 'unresolved');
});
