import assert from 'node:assert/strict';
import test from 'node:test';
import pilotJson from '../src/data/pilot.json';
import { applyConfirmedC172Construction } from '../src/domain/colors';
import { parseRoute, routeHash } from '../src/domain/navigation';
import { findFiber, searchInventory, traceFiber, validateInventory } from '../src/domain/network';
import { applyIteration07PathReview, relationshipState, targetPathEvidence, targetPathSummary } from '../src/domain/pathReview';
import type { Connection, Inventory } from '../src/domain/types';

const buildPilot = () => applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory));
const reviewed = (data: Inventory, id: string): Connection => data.connections.find(connection => connection.id === id)!;

test('strict trace contains only accepted relationship steps', () => {
  const trace = traceFiber(buildPilot(), 'CAB-000171', 29, false);
  const relationships = trace.steps.filter(step => step.kind === 'connection');
  assert.equal(relationships.length, 3);
  assert.ok(relationships.every(step => step.relationshipState === 'accepted' && !step.candidate));
  assert.equal(trace.includesCandidates, false);
});

test('candidate trace adds the unresolved AP51 Port 1 suggestion', () => {
  const trace = traceFiber(buildPilot(), 'CAB-000171', 29, true);
  const port = trace.steps.find(step => step.kind === 'port');
  assert.equal(port?.title, 'AP51 / პორტი 1');
  assert.equal(port?.candidate, true);
  assert.equal(port?.relationshipState, 'candidate');
});

test('all three accepted optical relationships retain unknown operation mechanisms', () => {
  const data = buildPilot();
  for (const id of ['sc217-34089', 'sc218-33098', 'ap51-34267']) {
    const connection = reviewed(data, id);
    assert.equal(connection.operation, 'unknown');
    assert.equal(connection.review?.operation, 'needs_verification');
    assert.equal(connection.review?.opticalConnectivity, 'documentation_reviewed');
  }
});

test('unknown operation does not interrupt accepted optical continuity', () => {
  const trace = traceFiber(buildPilot(), 'CAB-000171', 29, false);
  assert.ok(trace.steps.some(step => step.kind === 'cable' && step.cableId === 'CAB-000173' && step.fiber === 1));
  assert.ok(trace.steps.some(step => step.kind === 'asset' && step.title === 'AP51'));
});

test('an unreviewed candidate is excluded from strict trace', () => {
  const data = buildPilot();
  const candidate = data.connections.find(connection => connection.location.kind === 'closure' && connection.location.id === '218' && !connection.approved)!;
  const end = candidate.a.kind === 'fiber' ? candidate.a : candidate.z;
  assert.equal(end.kind, 'fiber');
  const trace = traceFiber(data, end.cableId, end.fiber, false);
  assert.ok(!trace.steps.some(step => step.id === candidate.id));
  assert.ok(trace.stops.some(stop => stop.code === 'unapproved'));
});

test('SC218 review identifies the exact C172/F29 and C173/F01 endpoints', () => {
  const connection = reviewed(buildPilot(), 'sc218-33098');
  assert.deepEqual(connection.a, { kind: 'fiber', cableId: 'CAB-000172', fiber: 29, at: { kind: 'closure', id: '218' } });
  assert.deepEqual(connection.z, { kind: 'fiber', cableId: 'CAB-000173', fiber: 1, at: { kind: 'closure', id: '218' } });
});

test('different physical colors do not block the accepted SC218 relationship', () => {
  const data = buildPilot();
  assert.equal(findFiber(data, 'CAB-000172', 29)?.physicalColor.key, 'slate');
  assert.equal(findFiber(data, 'CAB-000173', 1)?.physicalColor.key, 'blue');
  assert.equal(relationshipState(reviewed(data, 'sc218-33098')), 'accepted');
});

test('different strand numbers do not block the accepted SC218 relationship', () => {
  const connection = reviewed(buildPilot(), 'sc218-33098');
  assert.ok(connection.a.kind === 'fiber' && connection.z.kind === 'fiber');
  assert.deepEqual([connection.a.fiber, connection.z.fiber], [29, 1]);
  assert.equal(connection.approved, true);
});

test('matching strand numbers alone do not create accepted connectivity', () => {
  const data = buildPilot();
  const sameNumber = data.connections.find(connection => connection.location.kind === 'closure' && connection.location.id === '218'
    && connection.a.kind === 'fiber' && connection.z.kind === 'fiber'
    && connection.a.fiber === connection.z.fiber && connection.id !== 'sc218-33098');
  assert.ok(sameNumber);
  assert.equal(relationshipState(sameNumber), 'candidate');
});

test('matching physical colors alone do not create a connection record', () => {
  const data = buildPilot();
  const one = findFiber(data, 'CAB-000172', 1)!;
  const thirteen = findFiber(data, 'CAB-000172', 13)!;
  assert.equal(one.physicalColor.key, thirteen.physicalColor.key);
  assert.equal(data.connections.some(connection => [connection.a, connection.z].every(end => end.kind === 'fiber' && end.cableId === 'CAB-000172' && [1, 13].includes(end.fiber))), false);
});

test('strict trace accepts AP51 while stopping at an unknown port', () => {
  const trace = traceFiber(buildPilot(), 'CAB-000173', 1, false);
  assert.ok(trace.steps.some(step => step.kind === 'asset' && step.title === 'AP51' && !step.candidate));
  assert.ok(!trace.steps.some(step => step.kind === 'port'));
  assert.ok(trace.stops.some(stop => stop.code === 'port_unknown'));
});

test('conflicting reviewed evidence stops before the affected relationship', () => {
  const data = buildPilot();
  const connection = reviewed(data, 'sc218-33098');
  connection.review!.state = 'conflicting';
  connection.review!.opticalConnectivity = 'conflicting';
  connection.verification = 'conflicting';
  connection.approved = false;
  const trace = traceFiber(data, 'CAB-000172', 29, false);
  assert.ok(trace.stops.some(stop => stop.code === 'conflicting'));
  assert.ok(!trace.steps.some(step => step.cableId === 'CAB-000173'));
});

test('SC218 contains one accepted review and 51 remaining candidates', () => {
  const relationships = buildPilot().connections.filter(connection => connection.location.kind === 'closure' && connection.location.id === '218');
  assert.equal(relationships.filter(connection => relationshipState(connection) === 'accepted').length, 1);
  assert.equal(relationships.filter(connection => relationshipState(connection) === 'candidate').length, 51);
});

test('SC216 shared presence remains unmapped', () => {
  const data = buildPilot();
  assert.equal(data.connections.filter(connection => connection.location.kind === 'closure' && connection.location.id === '216').length, 0);
  const trace = traceFiber(data, 'CAB-000171', 29, false);
  assert.ok(trace.stops.some(stop => stop.at.includes('216') && stop.code === 'missing'));
});

test('target strand search and deep links keep legacy cable identifiers valid', () => {
  const result = searchInventory(buildPilot(), '172/29').find(item => item.id === 'fiber-CAB-000172-29');
  assert.deepEqual(result?.route, { view: 'fiber', cableId: 'CAB-000172', fiber: 29 });
  assert.deepEqual(parseRoute('#/trace/172/29'), { view: 'trace', cableId: '172', fiber: 29 });
  assert.equal(routeHash({ view: 'trace', cableId: '172', fiber: 29 }), '#/trace/172/29');
});

test('Iteration 07 leaves all four documented C172 tubes unchanged', () => {
  const data = buildPilot();
  const tubes = data.tubes.filter(tube => tube.cableId === 'CAB-000172').sort((a, b) => Number(a.number) - Number(b.number));
  assert.deepEqual(tubes.map(tube => [tube.number, tube.physicalColor.key, tube.basis]), [
    [1, 'blue', 'documented'], [2, 'orange', 'documented'], [3, 'green', 'documented'], [4, 'brown', 'documented'],
  ]);
  assert.equal(data.fibers.filter(fiber => fiber.cableId === 'CAB-000172' && fiber.positionInTube != null).length, 48);
});

test('only C173 Tube 1 is accepted as physical structure', () => {
  const data = buildPilot();
  const tubes = data.tubes.filter(tube => tube.cableId === 'CAB-000173');
  assert.equal(tubes.filter(tube => tube.basis === 'documented' && tube.number === 1).length, 1);
  assert.ok(tubes.filter(tube => tube.number !== 1).every(tube => tube.basis === 'provisional' && tube.number === null));
  assert.equal(data.fibers.filter(fiber => fiber.cableId === 'CAB-000173' && fiber.positionInTube != null).length, 12);
});

test('accepted and candidate steps expose distinct relationship states', () => {
  const trace = traceFiber(buildPilot(), 'CAB-000171', 29, true);
  assert.ok(trace.steps.filter(step => step.kind === 'connection').every(step => step.relationshipState === 'accepted' && !step.candidate));
  assert.ok(trace.steps.some(step => step.kind === 'port' && step.relationshipState === 'candidate' && step.candidate));
});

test('relationship evidence remains granular and source-addressable', () => {
  const data = buildPilot();
  const connection = reviewed(data, 'ap51-34267');
  assert.equal(connection.review?.destinationAsset, 'documentation_reviewed');
  assert.equal(connection.review?.port, 'needs_verification');
  assert.equal(connection.review?.containment, 'needs_verification');
  assert.equal(connection.review?.candidatePort, 1);
  assert.equal(connection.review?.sourceSha256, targetPathEvidence.sourceSha256);
  assert.ok(connection.source.shapeIds.includes('34267'));
});

test('target-path summary reports accepted hops, candidate port, and physical scope', () => {
  assert.deepEqual(targetPathSummary(buildPilot()), {
    target: 'C171/F29 → C172/F29 → C173/F01 → AP51',
    acceptedOpticalHops: 3,
    candidateHops: 1,
    unresolvedOperations: 3,
    conflicts: 0,
    strictEndpoint: 'AP51 · პორტი უცნობია',
    candidateEndpoint: 'AP51 / Port 1 · სავარაუდო',
    physicalCoverage: 'C171 უცნობი · C172 48/48 · C173 12/24',
  });
  assert.deepEqual(validateInventory(buildPilot()), []);
});
