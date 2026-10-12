import test from 'node:test';
import assert from 'node:assert/strict';
import audit from '../migration/iteration28b/source-b-closure-grammar.json';
import { evaluateClosureGrammar, parseCoordinatePair } from '../scripts/source-b-closure-grammar.mjs';
import { loadFrozenV1Reference } from '../src/data/repository';
import { applyIteration27D } from '../src/domain/iteration27d';
import { applyIteration28B, closureSymbolInventory, parseSourceCoordinatePair } from '../src/domain/iteration28b';
import { createEngineerQueryService, traceFiberThroughTransitions } from '../src/domain/engineerQuery';
import type { Inventory } from '../src/domain/types';

let baselinePromise: Promise<Inventory> | undefined;
const baseline = () => baselinePromise ??= loadFrozenV1Reference().then(applyIteration27D);
const report = audit as unknown as { candidates: Array<any>; negativeGoldenCases: Array<{ shapeId: string; expected: string }>; inventory: Record<string, any>; inventoryCounts: Record<string, any>; grammar: any };

test('28B golden SC207 comes from the actual grouped Closure master and its own Shape Data', () => {
  const item = report.candidates.find(candidate => candidate.rootShapeId === '19954');
  assert.ok(item);
  assert.equal(item.disposition, 'certified_closure_grammar_match');
  assert.equal(item.closureNumber, 207);
  assert.equal(item.root.masterId, '23');
  assert.equal(item.root.masterShapeId, '5');
  assert.equal(item.root.masterName, 'ქურო');
  assert.equal(item.root.fill, '#bfbfbf');
  assert.equal(item.root.line, '#00ff00');
  assert.equal(item.root.propertyRows.find((row: any) => row.key === 'Row_1').value, '207');
  assert.equal(item.coordinates.rawCoordinateText, '42°47\'38.509"E  42°39\'12.421"N ');
  assert.equal(item.externalReference.rawText, 'GJS  - 3019A');
  assert.deepEqual(item.children.map((child: any) => child.masterShapeId).sort(), ['6', '7', '8']);
  assert.equal(item.evidence.numberShapeId, '19957');
  assert.equal(item.evidence.coordinateShapeId, '19956');
  assert.equal(item.evidence.externalReferenceShapeId, '19955');
  assert.deepEqual(item.evidence.connectedCableEvidence.map((cable: any) => cable.legacyId), ['151', '152']);
  assert.equal(item.evidence.ownerConfirmationId, 'OWNER-CONFIRMED-28B-CLOSURE-GRAMMAR');
  assert.equal(item.evidence.fieldVerified, false);
  assert.equal(item.coordinates.crs, 'unknown');
});

test('28B source grammar evaluates grouped number, DMS, external code and one-to-one callouts', () => {
  const valid = evaluateClosureGrammar({
    isTopLevel: true, groupType: 'Group', masterId: '23', masterShapeId: '5', masterRootName: 'ქურო', fill: '#bfbfbf',
    numberText: '207', coordinateText: '42°47\'38.509"E  42°39\'12.421"N ', externalReferenceText: 'GJS  - 3019A',
    numberCalloutField: '207', coordinateCalloutField: '42°47\'38.509"E  42°39\'12.421"N ', externalReferenceCalloutField: 'GJS  - 3019A', childMasterShapeIds: ['6', '7', '8'],
  });
  assert.equal(valid.matched, true);
  assert.equal(valid.closureNumber, 207);
  assert.equal(evaluateClosureGrammar({ ...{
    isTopLevel: true, groupType: 'Group', masterId: '23', masterShapeId: '5', masterRootName: 'ქურო', fill: '#bfbfbf',
    numberText: '207', coordinateText: '42°47\'38.509"E  42°39\'12.421"N ', externalReferenceText: 'GJS  - 3019A',
    numberCalloutField: '207', coordinateCalloutField: '42°47\'38.509"E  42°39\'12.421"N ', externalReferenceCalloutField: 'GJS  - 3019A', childMasterShapeIds: ['6', '7', '8', '7'],
  } }).matched, false, 'a duplicate coordinate callout must reject the exact three-child grammar');
  assert.equal(evaluateClosureGrammar({
    isTopLevel: true, groupType: 'Group', masterId: 'other', masterShapeId: '5', masterRootName: 'ქურო', fill: '#bfbfbf',
    numberText: '207', coordinateText: '42°47\'38.509"E  42°39\'12.421"N ', externalReferenceText: 'GJS - 3019A',
    numberCalloutField: '207', coordinateCalloutField: '42°47\'38.509"E  42°39\'12.421"N ', externalReferenceCalloutField: 'GJS - 3019A', childMasterShapeIds: ['6', '7', '8'],
  }).matched, false);
});

test('28B structural scan classifies each 207–215 node independently and rejects negative examples', () => {
  for (let number = 207; number <= 215; number++) {
    const match = report.candidates.find(candidate => candidate.closureNumber === number);
    assert.equal(match?.disposition, 'certified_closure_grammar_match', `SC${number}`);
    assert.equal(Object.values(match.grammarChecks).every(Boolean), true, `SC${number} checks`);
  }
  for (const negative of report.negativeGoldenCases) assert.equal(negative.expected, 'reject');
  const negativeGroup = report.candidates.find(candidate => candidate.rootShapeId === '23800');
  assert.equal(negativeGroup?.disposition, 'rejected_non_closure_or_incomplete_symbol');
  assert.equal(negativeGroup?.root.fill, '#cc99ff');
  assert.equal(report.candidates.filter(candidate => candidate.disposition === 'certified_closure_grammar_match').length, report.inventoryCounts.certifiedClosures);
});

test('28B source coordinate parser preserves axis order, hemisphere signs and unknown CRS', () => {
  const parsed = parseCoordinatePair('42°47\'38.509"E  42°39\'12.421"N ');
  assert.ok(parsed);
  assert.equal(parsed.longitude.hemisphere, 'E');
  assert.equal(parsed.latitude.hemisphere, 'N');
  assert.ok(Math.abs(parsed.longitude.decimalDegrees - 42.79403027777778) < 1e-12);
  assert.ok(Math.abs(parsed.latitude.decimalDegrees - 42.65345027777778) < 1e-12);
  assert.equal(parsed.crs, 'unknown');
  assert.equal(parseCoordinatePair(' 42° 47′ 38.509″ W   42° 39′ 12.421″ S ' )?.longitude.decimalDegrees, -42.79403027777778);
  assert.equal(parseCoordinatePair('42°47\'38.509"E 42°39\'12.421"') , null, 'hemisphere is required');
  assert.equal(parseCoordinatePair('42°60\'00"E 42°39\'12"N'), null, 'minutes must be below 60');
  assert.equal(parseCoordinatePair('181°00\'00"E 42°39\'12"N'), null, 'longitude bounds are enforced');
  assert.equal(parseCoordinatePair('42°47\'38.509"N 42°39\'12.421"E'), null, 'source-specific axis suffixes are enforced');
  assert.equal(parseCoordinatePair('unparsed source string'), null);
  assert.deepEqual(parseSourceCoordinatePair('42°47\'38.509"E  42°39\'12.421"N '), parsed);
});

test('28B GIS source reference duplicates are preserved and reported without merging Closures', () => {
  const repeated = report.inventoryCounts.duplicateExternalReferences as Array<{ key: string; closureNumbers: number[] }>;
  assert.ok(repeated.length > 0);
  const record207 = report.inventory['207'];
  assert.equal(record207.externalReferences[0].system, 'GJS');
  assert.equal(record207.externalReferences[0].value, '3019A');
  assert.equal(record207.externalReferences[0].rawText, 'GJS  - 3019A');
  assert.equal(report.inventoryCounts.uniqueExternalReferenceValues, 1);
  assert.ok(repeated.some(item => item.key === 'GJS:3019A' && item.closureNumbers.includes(207)));
});

test('28B enriches existing canonical nodes and preserves physical and optical graph records exactly', async () => {
  const before = await baseline();
  const after = applyIteration28B(before);
  assert.equal(after.cables.length, 37);
  assert.equal(after.fibers.length, 2088);
  assert.equal(after.nodeFiberTransitions?.length, before.nodeFiberTransitions?.length);
  assert.equal(after.fiberLineages?.length, before.fiberLineages?.length);
  assert.equal(after.fiberJourneySummaries?.length, before.fiberJourneySummaries?.length);
  assert.deepEqual(after.cables, before.cables);
  assert.deepEqual(after.fibers, before.fibers);
  assert.deepEqual(after.nodeFiberTransitions, before.nodeFiberTransitions);
  assert.deepEqual(after.fiberLineages, before.fiberLineages);
  assert.deepEqual(after.fiberJourneySummaries, before.fiberJourneySummaries);
  for (const number of [205, 206]) assert.ok(after.closures.find(item => item.id === String(number))?.sourceSymbolEvidence);
  for (let number = 207; number <= 215; number++) {
    const node = after.networkNodes?.find(item => item.id === String(number));
    assert.ok(node);
    assert.equal(node.assetType, 'closure');
    assert.equal(node.displayName, `SC${number}`);
    assert.equal(node.closureEvidence?.closureNumber, number);
    assert.equal(node.closureEvidence?.sourceRepresentation.source.shapeIds[0], node.closureEvidence?.sourceRepresentation.rootShapeId);
  }
  assert.equal(after.networkNodes?.find(item => item.id === '207')?.id, '207');
  assert.equal(after.cables.find(item => item.legacyCableId === '151')?.endpointB.kind, 'network_node');
  assert.deepEqual(closureSymbolInventory().map(item => item.closureNumber), report.candidates.filter(item => item.disposition === 'certified_closure_grammar_match').map(item => item.closureNumber).sort((a, b) => a - b));
});

test('28B keeps C151 F1 and the partial F118 trace topology unchanged', async () => {
  const before = await baseline();
  const after = applyIteration28B(before);
  const c151 = before.cables.find(cable => cable.legacyCableId === '151')!;
  for (const fiber of [1, 118]) {
    const simplify = (trace: ReturnType<typeof traceFiberThroughTransitions>) => trace.sides.map(side => ({
      legs: side.legs,
      transitions: side.transitions.map(edge => ({ from: edge.from, to: edge.to, source: edge.source, localIdentity: edge.localIdentity })),
      terminal: side.terminal, complete: side.complete, ambiguous: side.ambiguous,
    }));
    assert.deepEqual(simplify(traceFiberThroughTransitions(after, c151.id, fiber)), simplify(traceFiberThroughTransitions(before, c151.id, fiber)));
  }
  const f118 = traceFiberThroughTransitions(after, c151.id, 118);
  assert.ok(f118.sides.some(side => side.legs.length === 1 && !side.complete && /SC207|Node 207/.test(side.stop)));
});

test('28B preserves old Node 207 identity aliases and makes SC/GIS search source-aware', async () => {
  const after = applyIteration28B(await baseline());
  const service = createEngineerQueryService(after);
  for (const query of ['207', 'Node 207', 'SC207']) assert.ok(service.search(query).some(result => result.id === 'node:207'), query);
  assert.equal(service.search('GIS-3019A').filter(result => result.category === 'Closure').length, report.inventoryCounts.gisReferenceRecords);
  const duplicate = service.run('GIS-3019A');
  assert.equal(duplicate.state, 'disambiguation');
  assert.match(duplicate.answer, /same GJS reference/i);
});
