import assert from 'node:assert/strict';
import test from 'node:test';
import pilotJson from '../src/data/pilot.json';
import {
  STANDARD_12_COLOR_SEQUENCE,
  applyConfirmedC172Construction,
  c172PhysicalEvidence,
  decodeTsageriVisioColor,
  interpretTsageriMarker,
  standardColor,
} from '../src/domain/colors';
import { buildTsageriImportRun } from '../src/domain/import';
import { applyIteration07PathReview } from '../src/domain/pathReview';
import { fiberConnections, fiberTube, findFiber, traceFiber, validateInventory } from '../src/domain/network';
import type { Inventory } from '../src/domain/types';

const buildPilot = () => applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory));
const c172 = 'CAB-000172';

test('every documented C172 tube contains exactly 12 strand positions', () => {
  const data = buildPilot();
  for (const tube of data.tubes.filter(item => item.cableId === c172)) {
    const fibers = data.fibers.filter(fiber => fiber.tubeId === tube.id);
    assert.equal(fibers.length, 12);
    assert.deepEqual(fibers.map(fiber => fiber.positionInTube).sort((a, b) => Number(a) - Number(b)), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  }
});

test('the standard sequence begins with Blue and covers 12 unique positions and keys', () => {
  assert.equal(STANDARD_12_COLOR_SEQUENCE[0].key, 'blue');
  assert.equal(STANDARD_12_COLOR_SEQUENCE.length, 12);
  assert.equal(new Set(STANDARD_12_COLOR_SEQUENCE.map(color => color.position)).size, 12);
  assert.equal(new Set(STANDARD_12_COLOR_SEQUENCE.map(color => color.key)).size, 12);
});

test('C172 F01 through F12 map to Tube 1 positions 1 through 12', () => {
  const data = buildPilot();
  for (let number = 1; number <= 12; number += 1) {
    const fiber = findFiber(data, c172, number)!;
    assert.equal(fiberTube(data, fiber)?.number, 1);
    assert.equal(fiber.positionInTube, number);
  }
});

test('C172 F13 starts Tube 2 at position 1', () => {
  const data = buildPilot();
  const fiber = findFiber(data, c172, 13)!;
  assert.equal(fiberTube(data, fiber)?.number, 2);
  assert.equal(fiber.positionInTube, 1);
});

test('C172 F48 resolves to Tube 4 position 12', () => {
  const data = buildPilot();
  const fiber = findFiber(data, c172, 48)!;
  assert.equal(fiberTube(data, fiber)?.number, 4);
  assert.equal(fiber.positionInTube, 12);
});

test('inner Visio marker color maps to fiber physical color', () => {
  assert.equal(interpretTsageriMarker({ innerFill: '#ff0000', outerRing: '4' }).fiberColor.key, 'red');
});

test('outer Visio ring color maps to tube physical color', () => {
  assert.equal(interpretTsageriMarker({ innerFill: '#ff0000', outerRing: '#008000' }).tubeColor.key, 'green');
});

test('connector line color is retained as ignored evidence and cannot override physical colors', () => {
  const decoded = interpretTsageriMarker({ innerFill: '#ff0000', outerRing: '#008000', connectorLine: '#0000ff' });
  assert.equal(decoded.fiberColor.key, 'red');
  assert.equal(decoded.tubeColor.key, 'green');
  assert.equal(decoded.ignoredConnectorLine, '#0000ff');
});

test('unsupported raw Visio color remains unresolved', () => {
  const color = decodeTsageriVisioColor('#123456');
  assert.equal(color.basis, 'unknown');
  assert.equal(color.key, null);
  assert.equal(color.hex, null);
});

test('changing physical color does not change fiber identity', () => {
  const data = buildPilot();
  const fiber = findFiber(data, c172, 7)!;
  const id = fiber.id;
  fiber.physicalColor = standardColor('aqua');
  assert.equal(fiber.id, id);
  assert.equal(findFiber(data, c172, 7)?.id, id);
});

test('matching physical colors do not create connectivity', () => {
  const data = buildPilot();
  const first = findFiber(data, c172, 1)!;
  const thirteenth = findFiber(data, c172, 13)!;
  assert.equal(first.physicalColor.key, 'blue');
  assert.equal(thirteenth.physicalColor.key, 'blue');
  assert.equal(data.connections.some(connection => {
    const endpoints = [connection.a, connection.z];
    return endpoints.some(end => end.kind === 'fiber' && end.cableId === c172 && end.fiber === 1)
      && endpoints.some(end => end.kind === 'fiber' && end.cableId === c172 && end.fiber === 13);
  }), false);
});

test('mismatched physical colors do not prevent an explicit connection record', () => {
  const data = buildPilot();
  const from = findFiber(data, c172, 29)!;
  const to = findFiber(data, 'CAB-000173', 1)!;
  to.physicalColor = standardColor('blue');
  assert.notEqual(from.physicalColor.key, to.physicalColor.key);
  assert.ok(fiberConnections(data, c172, 29).some(connection => [connection.a, connection.z].some(end => end.kind === 'fiber' && end.cableId === 'CAB-000173' && end.fiber === 1)));
});

test('explicit reviewed C172/F29 to C173/F01 traces by endpoint identity', () => {
  const trace = traceFiber(buildPilot(), c172, 29, false);
  assert.ok(trace.steps.some(step => step.kind === 'cable' && step.cableId === 'CAB-000173' && step.fiber === 1 && !step.candidate));
});

test('one reviewed SC218 relationship is accepted and the other 51 remain candidates', () => {
  const data = buildPilot();
  const candidates = data.connections.filter(connection => connection.location.kind === 'closure' && connection.location.id === '218');
  assert.equal(candidates.length, 52);
  assert.equal(candidates.filter(connection => connection.approved).length, 1);
  assert.equal(candidates.filter(connection => !connection.approved && connection.verification === 'needs_verification').length, 51);
});

test('segments and groups outside C172 and reviewed C173 Tube 1 remain provisional', () => {
  const data = buildPilot();
  const otherTubes = data.tubes.filter(tube => tube.cableId !== c172 && !(tube.cableId === 'CAB-000173' && tube.number === 1));
  assert.ok(otherTubes.length > 0);
  assert.ok(otherTubes.every(tube => tube.basis === 'provisional' && tube.number === null && tube.physicalColor.basis === 'unknown'));
});

test('raw marker and ring values remain attached to every accepted physical candidate', () => {
  const candidates = buildTsageriImportRun().candidates.filter(candidate => candidate.kind === 'fiber_physical');
  assert.equal(candidates.length, 48);
  assert.ok(candidates.every(candidate => typeof candidate.interpreted.rawInnerColor === 'string' && typeof candidate.interpreted.rawOuterRingColor === 'string'));
  assert.ok(candidates.every(candidate => candidate.provenance.source.shapeIds.length === 3 && candidate.provenance.source.interpretationRule === c172PhysicalEvidence.interpretationRule));
});

test('alternate orange and conflicting Tube 2 ring evidence are preserved without changing accepted tube identity', () => {
  const data = buildPilot();
  const f13 = findFiber(data, c172, 13)!;
  const f22 = findFiber(data, c172, 22)!;
  assert.equal(f13.physicalEvidence?.rawOuterColor, '4');
  assert.ok(f13.physicalEvidence?.warnings.some(warning => warning.includes('Tube 2')));
  assert.equal(f22.physicalEvidence?.rawOuterColor, '#ea700d');
  assert.equal(fiberTube(data, f13)?.physicalColor.key, 'orange');
  assert.equal(fiberTube(data, f22)?.physicalColor.key, 'orange');
});

test('the accepted C172 construction satisfies inventory integrity rules', () => {
  assert.deepEqual(validateInventory(buildPilot()), []);
});
