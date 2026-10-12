import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import pilotJson from '../src/data/pilot.json';
import { applyIteration10AggregationTopology } from '../src/domain/aggregationTopology';
import { applyIteration08CableRoute } from '../src/domain/cableRoutes';
import { applyConfirmedC172Construction } from '../src/domain/colors';
import { applyIteration09Foundations } from '../src/domain/foundations';
import { applyIteration12FullMigration } from '../src/domain/fullMigration';
import { searchInventory, traceFiber } from '../src/domain/network';
import { accessPointOperatorSummary, closureOperatorSummary, segmentOperatorSummary } from '../src/domain/operatorTopology';
import { applyIteration07PathReview } from '../src/domain/pathReview';
import type { Inventory } from '../src/domain/types';

const build = () => applyIteration12FullMigration(applyIteration10AggregationTopology(applyIteration09Foundations(applyIteration08CableRoute(applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory))))));
const cable = (data: Inventory, legacyId: string) => data.cables.find(item => item.legacyCableId === legacyId)!;
const viewSource = readFileSync(new URL('../src/views/NetworkViews.tsx', import.meta.url), 'utf8');
const importSource = readFileSync(new URL('../src/views/ImportReview.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const report = readFileSync(new URL('../docs/ITERATION-12-FULL-MIGRATION-REVIEW.md', import.meta.url), 'utf8');

test('SC206 has one clear main continuation and one consolidated named direction branch', () => {
  const summary = closureOperatorSummary(build(), '206');
  assert.match(summary.mainContinuation!, /C169.*SC216/);
  assert.equal(summary.branches.filter(item => item.label.includes('Alpana')).length, 1);
  assert.match(summary.branches.find(item => item.label.includes('Alpana'))!.label, /SC207/);
});

test('SC206 named direction remains unresolved and creates no optical connectivity', () => {
  const data = build();
  assert.equal(closureOperatorSummary(data, '206').branches.find(item => item.label.includes('Alpana'))?.status, 'unresolved');
  assert.equal(data.connections.some(item => item.location.kind === 'closure' && item.location.id === '206'), false);
});

test('SC218 separates C174 main continuation from C173 AP51 branch', () => {
  const summary = closureOperatorSummary(build(), '218');
  assert.match(summary.mainContinuation!, /C174.*SC219/);
  assert.ok(summary.branches.some(item => /C173.*AP51/.test(item.label)));
});

test('SC219 separates C176 main continuation from C175 AP52 branch', () => {
  const summary = closureOperatorSummary(build(), '219');
  assert.match(summary.mainContinuation!, /C176.*SC220/);
  assert.ok(summary.branches.some(item => /C175.*AP52/.test(item.label)));
});

test('SC224 keeps the Lentekhi main boundary and shows the SC225 branch', () => {
  const summary = closureOperatorSummary(build(), '224');
  assert.match(summary.mainContinuation!, /C184/);
  assert.ok(summary.branches.some(item => /C181.*SC225/.test(item.label)));
});

test('SC225 exposes AP53 and AP54 as nested branches', () => {
  const summary = closureOperatorSummary(build(), '225');
  assert.ok(summary.branches.some(item => /C182.*AP53/.test(item.label)));
  assert.ok(summary.branches.some(item => /C183.*AP54/.test(item.label)));
});

test('Segment Detail model exposes route source and selected position', () => {
  const summary = segmentOperatorSummary(build(), cable(build(), '172'));
  assert.match(summary.source, /AGG5/);
  assert.ok(summary.path.includes('C172'));
});

test('Segment Detail model exposes the final route endpoint', () => {
  assert.match(segmentOperatorSummary(build(), cable(build(), '172')).finalRouteEndpoint, /ლენტეხ|Lentekhi|unresolved/i);
});

test('Segment Detail keeps PhysicalCable endpoint separate', () => {
  const summary = segmentOperatorSummary(build(), cable(build(), '172'));
  assert.match(summary.physicalCableEndpoint, /^SC218/);
  assert.notEqual(summary.physicalCableEndpoint, summary.finalRouteEndpoint);
});

test('route continuation after the C172-containing PhysicalCable is explicit', () => {
  assert.equal(segmentOperatorSummary(build(), cable(build(), '172')).routeContinuesAfterPhysicalCable, true);
});

test('AP41 is an interconnect/backfeed rather than a simple terminal', () => {
  assert.equal(accessPointOperatorSummary(build(), '41').role, 'interconnect_backfeed');
});

test('AP41 keeps internal ingress-to-egress mapping unresolved', () => {
  assert.ok(accessPointOperatorSummary(build(), '41').unresolved.some(item => item.includes('ingress-to-egress')));
});

test('Tsageri aggregation ranges remain exact', () => {
  const ranges = build().portRangeAssignments!.map(item => [item.startPort, item.endPort]);
  assert.deepEqual(ranges, [[1,116],[117,130],[131,144],[145,192]]);
});

test('search cards include operational topology context', () => {
  const data = build();
  assert.match(searchInventory(data, 'C172').find(item => item.id === 'c-CAB-000172')!.subtitle, /PhysicalCable end: SC218/);
  assert.match(searchInventory(data, 'SC206').find(item => item.id === 'sc-206')!.subtitle, /Main.*SC216.*Branch.*Alpana/s);
  assert.match(searchInventory(data, 'AP41').find(item => item.id === 'ap-41')!.subtitle, /backfeed toward Ambrolauri/);
  assert.match(searchInventory(data, 'AGG5').find(item => item.id === 'agg-5')!.subtitle, /192 ports/);
});

test('operator pages group unresolved facts', () => assert.match(viewSource, /ClarificationSummary/));
test('operator pages keep evidence collapsed by default', () => assert.match(viewSource, /<details className="evidence"><summary>Technical details and evidence/));
test('Migration Review remains the detailed evidence workflow', () => assert.match(importSource, /Evidence Basis, human Review State and Operational Status/));
test('Fiber Detail remains compact and path driven', () => { assert.match(viewSource, /fiber-operational-detail/); assert.match(viewSource, /Optical Path \/ ჟილის გზა/); });

test('Strict Trace remains authoritative-only', () => {
  const result = traceFiber(build(), '172', 1, false);
  assert.equal(result.steps.some(item => item.candidate), false);
});

test('Candidate Trace still exposes candidate relationships', () => {
  assert.equal(traceFiber(build(), '172', 1, true).steps.some(item => item.candidate), true);
});

test('Iteration 12 verification dimensions remain independent', () => {
  const item = build().assertions!.find(record => record.id === 'AST-CABLE-172-COUNT')!;
  assert.deepEqual([item.reviewState, item.operationalStatus, item.fieldVerified], ['reviewed_no_change', 'authoritative', false]);
});

test('all 20 Cable Segments remain available to operator summaries', () => assert.equal(build().cables.filter(item => segmentOperatorSummary(build(), item).path.length > 0).length, 20));
test('all 12 closures remain available to operator summaries', () => assert.equal(build().closures.filter(item => closureOperatorSummary(build(), item.id)).length, 12));
test('all six AP records remain available to operator summaries', () => assert.equal(build().accessPoints.filter(item => accessPointOperatorSummary(build(), item.id)).length, 6));
test('both aggregation contexts remain accessible', () => assert.deepEqual(build().aggregations.map(item => item.id).sort(), ['5','LENTEKHI-CONFLICT']));

test('migration report assertion wording is internally consistent', () => {
  assert.doesNotMatch(report, /0 individual assertions;[^\n]*individual assertions retained/i);
  assert.doesNotMatch(report, /52 have SC218 endpoint interpretations and the rest remain unresolved/i);
  assert.match(report, /12 generated connector assertions match SC218 connector IDs and 136 remain unresolved source geometry/);
  assert.match(report, /12 SC218-matched connector assertions and 136 unresolved connector-shape assertions/);
  assert.match(report, /all 52 interpreted SC218 source relationships remain preserved/);
});

test('390px rules keep topology nested without fixed page width', () => {
  assert.match(styles, /@media \(max-width:560px\)[\s\S]*\.operator-facts,\.operator-split\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.doesNotMatch(styles, /\.operator-summary\{[^}]*width:\s*\d{3,}px/);
});
