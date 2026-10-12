import test from 'node:test';
import assert from 'node:assert/strict';
import pilotJson from '../src/data/pilot.json';
import type { Inventory } from '../src/domain/types';
import { applyConfirmedC172Construction } from '../src/domain/colors';
import { applyIteration07PathReview } from '../src/domain/pathReview';
import { applyIteration08CableRoute } from '../src/domain/cableRoutes';
import { applyIteration09Foundations } from '../src/domain/foundations';
import { applyIteration10AggregationTopology } from '../src/domain/aggregationTopology';
import { applyIteration12FullMigration } from '../src/domain/fullMigration';
import { applyIteration15Showcase } from '../src/domain/showcase';
import { applyIteration16CableContinuity } from '../src/domain/cableContinuity';
import {
  FIBER_LINEAGE_RULE, ap51PortMapping, applyIteration17FiberLineage, compactLineageJourney,
  lineageForFiber, lineagesForSegment, lineagesForTube, useAssignmentsForLineage, validateFiberLineages,
} from '../src/domain/fiberLineage';

const build = () => applyIteration17FiberLineage(applyIteration16CableContinuity(applyIteration15Showcase(applyIteration12FullMigration(applyIteration10AggregationTopology(applyIteration09Foundations(applyIteration08CableRoute(applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory)))))))));
const lineage = (data: Inventory, id: string) => data.fiberLineages!.find(item => item.id === id)!;
const leg = (data: Inventory, id: string, segment: string) => lineage(data, id).legs.find(item => item.sourceSegmentLabel === segment)!;

test('1 builds 68 source-supported Fiber Lineages', () => assert.equal(build().fiberLineages?.length, 68));
test('2 all lineages use the versioned Iteration 17 interpreter', () => assert.ok(build().fiberLineages!.every(item => item.interpretationRule === FIBER_LINEAGE_RULE)));
test('3 only owner-confirmed and source-interpreted lineages enter normal prototype data', () => assert.ok(build().fiberLineages!.every(item => item.projectionStatus !== 'source_ambiguous')));
test('4 C172/F01 resolves to the core lineage', () => assert.equal(lineageForFiber(build(), '172', 1)?.id, 'LINEAGE-CORE-001'));
test('5 C172/F01 begins at AGG5 Port145', () => assert.equal(lineage(build(), 'LINEAGE-CORE-001').origin.portNumber, 145));
test('6 C172/F01 ends at Lentekhi Port-Fiber1', () => assert.equal(lineage(build(), 'LINEAGE-CORE-001').destination.portNumber, 1));
test('7 C172/F01 uses Blue Tube and Blue Fiber locally', () => { const item = leg(build(), 'LINEAGE-CORE-001', 'C172'); assert.deepEqual([item.tubeColor.key, item.fiberColor.key], ['blue', 'blue']); });
test('8 C172/F01 aggregation-side leg is C148/F145 Green Tube Blue Fiber', () => { const item = leg(build(), 'LINEAGE-CORE-001', 'C148'); assert.deepEqual([item.fiberNumber, item.tubeColor.key, item.fiberColor.key], [145, 'green', 'blue']); });
test('9 C172/F01 crosses every expected route section', () => assert.deepEqual(lineage(build(), 'LINEAGE-CORE-001').legs.map(item => item.sourceSegmentLabel), ['C148', 'C150', 'C169', 'C171', 'C172', 'C174', 'C176', 'C177', 'C178', 'C179', 'C180', 'C184']));
test('10 C184 reaches the documentation boundary without inventing a canonical aggregation', () => { const data = build(), item = leg(data, 'LINEAGE-CORE-001', 'C184'), cable = data.cables.find(entry => entry.legacyCableId === '184')!; assert.equal(item.sourceOnly, false); assert.ok([cable.endpointA.kind, cable.endpointB.kind].includes('boundary')); assert.equal(data.aggregations.some(entry => entry.id === '6'), false); });
test('11 C172/F31 resolves to an owner-confirmed AP51 lineage', () => { const item = lineageForFiber(build(), '172', 31)!; assert.equal(item.id, 'LINEAGE-AP51-NORTH-03'); assert.equal(item.projectionStatus, 'owner_confirmed'); });
test('12 C172/F31 locally is Green Tube Red Fiber', () => { const item = leg(build(), 'LINEAGE-AP51-NORTH-03', 'C172'); assert.deepEqual([item.fiberNumber, item.tubeColor.key, item.fiberColor.key], [31, 'green', 'red']); });
test('13 C172/F31 maps to C173/F03 Blue Tube Green Fiber', () => { const item = leg(build(), 'LINEAGE-AP51-NORTH-03', 'C173'); assert.deepEqual([item.fiberNumber, item.tubeColor.key, item.fiberColor.key], [3, 'blue', 'green']); });
test('14 C172/F31 begins at AGG5 Port175', () => assert.equal(lineage(build(), 'LINEAGE-AP51-NORTH-03').origin.portNumber, 175));
test('15 C172/F31 aggregation side is Grey Tube F175 Red Fiber', () => { const item = leg(build(), 'LINEAGE-AP51-NORTH-03', 'C148'); assert.deepEqual([item.fiberNumber, item.tubeColor.key, item.fiberColor.key], [175, 'slate', 'red']); });
test('16 C172/F31 ends at AP51 Port3', () => assert.equal(lineage(build(), 'LINEAGE-AP51-NORTH-03').destination.portNumber, 3));
test('17 SC206 transition records F175 to F31 number and Tube change', () => { const item = lineage(build(), 'LINEAGE-AP51-NORTH-03').transitions.find(entry => entry.node.id === '206')!; assert.deepEqual([item.fromFiberNumber, item.toFiberNumber, item.numberChanged, item.tubeChanged], [175, 31, true, true]); });
test('18 SC218 transition records F31 to F03 plus Tube and Fiber color change', () => { const item = lineage(build(), 'LINEAGE-AP51-NORTH-03').transitions.find(entry => entry.node.id === '218')!; assert.deepEqual([item.fromFiberNumber, item.toFiberNumber, item.numberChanged, item.tubeChanged, item.fiberColorChanged], [31, 3, true, true, true]); });
test('19 no SC208 asset is invented', () => assert.ok(build().fiberLineages!.every(item => item.transitions.every(step => step.node.id !== '208'))));
test('20 existing C172/F29 path remains C171/F29 to C172/F29 to C173/F01', () => { const item = lineage(build(), 'LINEAGE-AP51-NORTH-01'); assert.deepEqual(item.legs.filter(entry => ['C171', 'C172', 'C173'].includes(entry.sourceSegmentLabel)).map(entry => [entry.sourceSegmentLabel, entry.fiberNumber]), [['C171', 29], ['C172', 29], ['C173', 1]]); });
test('21 AP51 has all 24 same-index prototype Fiber-to-Port mappings', () => { const data = build(); assert.equal(data.prototypePortMappings?.length, 24); assert.ok(data.prototypePortMappings!.every(item => item.fiberNumber === item.portNumber)); });
test('22 AP51 Port3 is in use and owner confirmed', () => { const item = ap51PortMapping(build(), 3)!; assert.deepEqual([item.physicalUsage, item.projectionStatus], ['in_use', 'owner_confirmed']); });
test('23 AP51 white Port1 is unused but commercial availability stays unknown', () => { const item = ap51PortMapping(build(), 1)!; assert.deepEqual([item.physicalUsage, item.commercialAvailability, item.administrativeAllocation], ['unused', 'unknown', 'unknown']); });
test('24 AP51 Port3 carries the OTDR annotation without a distance value', () => { const item = ap51PortMapping(build(), 3)!; assert.ok(item.sourceAnnotationIds.includes('ANN-UNRESOLVED-OTDR-34281')); assert.equal(build().distanceObservations?.length, 0); });
test('25 C173/F13 comes from Lentekhi and ends at AP51 Port13', () => { const item = lineageForFiber(build(), '173', 13)!; assert.equal(item.origin.asset?.kind, 'boundary'); assert.equal(item.destination.portNumber, 13); });
test('26 C172/F41 remains a partial lineage ending unresolved at SC218', () => { const item = lineageForFiber(build(), '172', 41)!; assert.equal(item.destination.label, 'SC218 / continuation unresolved'); assert.ok(item.warnings.length); });
test('27 OpenNet usage applies to lineages 1 through 4', () => assert.deepEqual(build().fiberUseAssignments?.[0].lineageIds, ['LINEAGE-CORE-001', 'LINEAGE-CORE-002', 'LINEAGE-CORE-003', 'LINEAGE-CORE-004']));
test('28 OpenNet relationship is usage and does not create Fiber rights', () => { const data = build(); assert.equal(data.fiberUseAssignments?.[0].scope, 'lineage'); assert.equal(data.rights.length, 0); });
test('29 selected OpenNet lineage exposes its use assignment', () => assert.equal(useAssignmentsForLineage(build(), 'LINEAGE-CORE-001')[0].organizationId, 'opennet'));
test('30 non-OpenNet lineage has no inherited usage assignment', () => assert.equal(useAssignmentsForLineage(build(), 'LINEAGE-CORE-005').length, 0));
test('31 compact C172/F01 journey collapses unchanged stretches', () => { const rows = compactLineageJourney(lineage(build(), 'LINEAGE-CORE-001')); assert.ok(rows.length < 12); assert.ok(rows.some(item => item.segmentLabels.length > 1)); });
test('32 compact C172/F31 journey preserves its two physical identity changes', () => assert.equal(compactLineageJourney(lineage(build(), 'LINEAGE-AP51-NORTH-03')).length, 3));
test('33 Segment C172 reports 48 carried lineages', () => assert.equal(lineagesForSegment(build(), '172').length, 48));
test('34 C172 Tube3 carries 12 projected journeys', () => assert.equal(lineagesForTube(build(), '172', 3).length, 12));
test('35 C173 carries 24 lineages to AP51', () => { const items = lineagesForSegment(build(), '173'); assert.equal(items.length, 24); assert.ok(items.every(item => item.destination.asset?.kind === 'ap')); });
test('36 local Fiber numbers remain per-leg and no global Fiber number is created', () => { const item = lineage(build(), 'LINEAGE-AP51-NORTH-03'); assert.deepEqual([...new Set(item.legs.map(entry => entry.fiberNumber))], [175, 31, 3]); });
test('37 every automatically projected fact retains source and rule provenance', () => assert.ok(build().fiberLineages!.every(item => item.legs.every(entry => entry.source.file && entry.source.shapeIds.length && entry.source.interpretationRule === FIBER_LINEAGE_RULE))));
test('38 Fiber Lineage validation passes', () => assert.deepEqual(validateFiberLineages(build()), []));
