import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import pilotJson from '../src/data/pilot.json';
import { applyIteration10AggregationTopology } from '../src/domain/aggregationTopology';
import { applyIteration08CableRoute, findCableRoute } from '../src/domain/cableRoutes';
import {
  applyIteration16CableContinuity, cableContinuityPath, closureContinuationForks,
  constructionTubeViews, exactFiberContinuations, segmentContinuationGroups,
  segmentOrientation, tubeContinuationSummary, validateCableContinuations,
} from '../src/domain/cableContinuity';
import { applyConfirmedC172Construction } from '../src/domain/colors';
import { applyIteration09Foundations } from '../src/domain/foundations';
import { applyIteration12FullMigration } from '../src/domain/fullMigration';
import { findCable } from '../src/domain/network';
import { applyIteration07PathReview } from '../src/domain/pathReview';
import { parseWorkspaceSelection, workspaceSelectionKey } from '../src/domain/routeWorkspace';
import { applyIteration15Showcase, segmentConstructionAssessment } from '../src/domain/showcase';
import type { Inventory } from '../src/domain/types';

const workspaceSource = readFileSync(new URL('../src/views/RouteWorkspace.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const build12 = () => applyIteration12FullMigration(applyIteration10AggregationTopology(applyIteration09Foundations(applyIteration08CableRoute(applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory))))));
const build = () => applyIteration16CableContinuity(applyIteration15Showcase(build12()));
const routeId = 'ROUTE-TSAGERI-LENTEKHI-CORE';
const groups = (data: Inventory, legacyId: string) => segmentContinuationGroups(data, routeId, findCable(data, legacyId)!.id);

test('1 CableContinuation is a first-class persisted record', () => assert.equal(build().cableContinuations?.length, 7));
test('2 CableContinuation does not alter Cable Segment identity', () => { const data = build(); assert.equal(data.cables.length, 20); assert.equal(findCable(data, '172')!.id, 'CAB-000172'); });
test('3 CableContinuation does not add PhysicalCable membership', () => { const data = build(); assert.deepEqual(data.physicalCables![0].segmentMemberships.map(item => item.segmentId), ['CAB-000172', 'CAB-000171']); });
test('4 one Segment can continue to more than one destination', () => { const targets = new Set(groups(build(), '172').filter(item => item.direction === 'downstream').map(item => item.targetSegmentId)); assert.deepEqual(targets, new Set(['CAB-000174', 'CAB-000173', null])); });
test('5 ranges are structured numbers rather than label parsing', () => { const record = build().cableContinuations![0]; assert.deepEqual(record.sideA.kind === 'segment' ? record.sideA.fiberRange : null, { startFiberNumber: 1, endFiberNumber: 28 }); });
test('6 mixed groups retain per-fiber review status', () => { const group = groups(build(), '172').find(item => item.sourceStart === 29 && item.direction === 'downstream')!; assert.deepEqual([group.authoritativeCount, group.candidateCount], [1, 11]); });
test('7 C172 F1–28 has a candidate C174 continuation', () => { const group = groups(build(), '172').find(item => item.sourceStart === 1 && item.direction === 'downstream')!; assert.deepEqual([group.targetSegmentId, group.targetStart, group.targetEnd, group.operationalStatus], ['CAB-000174', 1, 28, 'candidate']); });
test('8 C172 F29–40 maps to C173 F1–12', () => { const group = groups(build(), '172').find(item => item.sourceStart === 29 && item.direction === 'downstream')!; assert.deepEqual([group.targetSegmentId, group.targetStart, group.targetEnd, group.mappingMode], ['CAB-000173', 1, 12, 'offset']); });
test('9 C172 F29 individual mapping is authoritative', () => { const exact = exactFiberContinuations(build(), routeId, 'CAB-000172', 29).find(item => item.direction === 'downstream')!; assert.deepEqual([exact.targetSegmentId, exact.targetFiberNumber, exact.operationalStatus], ['CAB-000173', 1, 'authoritative']); });
test('10 C172 F30 remains candidate inside the same group', () => { const exact = exactFiberContinuations(build(), routeId, 'CAB-000172', 30).find(item => item.direction === 'downstream')!; assert.deepEqual([exact.targetFiberNumber, exact.operationalStatus], [2, 'candidate']); });
test('11 C172 F41–48 remains explicitly unresolved', () => { const group = groups(build(), '172').find(item => item.sourceStart === 41 && item.direction === 'downstream')!; assert.deepEqual([group.sourceEnd, group.targetSegmentId, group.operationalStatus], [48, null, 'unresolved']); });
test('12 C171 F29 to C172 F29 is authoritative at SC217', () => { const exact = exactFiberContinuations(build(), routeId, 'CAB-000171', 29).find(item => item.direction === 'downstream')!; assert.deepEqual([exact.node.id, exact.targetSegmentId, exact.targetFiberNumber, exact.operationalStatus], ['217', 'CAB-000172', 29, 'authoritative']); });
test('13 C173 F01 reaches AP51 without inventing a port', () => { const exact = exactFiberContinuations(build(), routeId, 'CAB-000173', 1).find(item => item.targetAsset?.id === '51')!; assert.deepEqual([exact.targetAsset, exact.targetFiberNumber, exact.operationalStatus], [{ kind: 'ap', id: '51' }, null, 'authoritative']); assert.equal(build().fiberTerminations?.length, 0); });
test('14 strict downstream path excludes candidate C172 F1 continuation', () => { const path = cableContinuityPath(build(), routeId, 'CAB-000172', 1, 'downstream', 'strict'); assert.equal(path.status, 'unresolved'); assert.match(path.stopReason, /Candidate continuation excluded/); });
test('15 candidate downstream path includes C174 F1', () => { const path = cableContinuityPath(build(), routeId, 'CAB-000172', 1, 'downstream', 'candidate'); assert.ok(path.steps.some(item => item.segmentId === 'CAB-000174' && item.fiberNumber === 1)); });
test('16 strict C171 F29 path reaches AP51', () => { const path = cableContinuityPath(build(), routeId, 'CAB-000171', 29, 'downstream', 'strict'); assert.equal(path.status, 'authoritative'); assert.ok(path.steps.some(item => item.asset?.kind === 'ap' && item.asset.id === '51')); });
test('17 route-relative orientation preserves C172 endpoint A and B', () => { const data = build(), cable = findCable(data, '172')!, before = structuredClone([cable.endpointA, cable.endpointB]); const orientation = segmentOrientation(data, routeId, cable.id)!; assert.deepEqual([orientation.upstreamAsset, orientation.downstreamAsset], [{ kind: 'closure', id: '217' }, { kind: 'closure', id: '218' }]); assert.deepEqual([cable.endpointA, cable.endpointB], before); });
test('18 C172 construction exposes four documented Tubes', () => { const views = constructionTubeViews(build(), 'CAB-000172'); assert.equal(views.length, 4); assert.ok(views.every(item => item.state === 'documented')); });
test('19 C172 Tube ranges are 1–12, 13–24, 25–36, 37–48', () => assert.deepEqual(constructionTubeViews(build(), 'CAB-000172').map(item => [item.fiberStart, item.fiberEnd]), [[1, 12], [13, 24], [25, 36], [37, 48]]));
test('20 C172 Tube 3 is split across C174 and C173', () => { const summary = tubeContinuationSummary(build(), routeId, 'CAB-000172', 3)!; assert.equal(summary.state, 'split'); assert.deepEqual(summary.groups.map(item => [item.sourceStart, item.sourceEnd, item.targetLabel]), [[25, 28, 'C174 / F25–F28'], [29, 36, 'C173 / F01–F08']]); });
test('21 C172 Tube 4 is partial with F41–48 unresolved', () => { const summary = tubeContinuationSummary(build(), routeId, 'CAB-000172', 4)!; assert.equal(summary.state, 'partial'); assert.deepEqual(summary.unresolvedMembers, [41, 42, 43, 44, 45, 46, 47, 48]); });
test('22 Tube identity is not propagated to an outgoing Segment', () => { const record = build().cableContinuations!.find(item => item.id.includes('C172-29-40'))!; const sourceTube = record.sideA.kind === 'segment' ? record.sideA.tubeId : null, targetTube = record.sideZ.kind === 'segment' ? record.sideZ.tubeId : null; assert.equal(sourceTube, null); assert.ok(targetTube); assert.notEqual(sourceTube, targetTube); });
test('23 proposed group construction remains visibly provisional', () => { const views = constructionTubeViews(build(), 'CAB-000171'); assert.ok(views.length > 0); assert.ok(views.every(item => item.state === 'proposed' && item.tubeColor === null)); });
test('24 unknown construction creates no Tube sequence', () => { const data = build(), c151 = findCable(data, '151')!; assert.equal(segmentConstructionAssessment(data, c151).state, 'unknown'); assert.deepEqual(constructionTubeViews(data, c151.id), []); });
test('25 PhysicalCable C172 end remains SC218', () => { const physical = build().physicalCables![0]; assert.equal(physical.endB.state === 'known' ? physical.endB.asset.id : null, '218'); });
test('26 continuity beyond SC218 does not extend PhysicalCable identity', () => { const data = build(); assert.ok(groups(data, '172').some(item => item.targetSegmentId === 'CAB-000174')); assert.ok(!data.physicalCables![0].segmentMemberships.some(item => item.segmentId === 'CAB-000174')); });
test('27 Tube workspace selection round-trips', () => { const selection = { type: 'tube' as const, cableId: 'CAB-000172', number: 3 }; assert.deepEqual(parseWorkspaceSelection(workspaceSelectionKey(selection)), selection); });
test('28 Closure SC218 exposes grouped continuation forks', () => { const forks = closureContinuationForks(build(), '218'); assert.equal(forks.length, 5); assert.ok(forks.some(item => item.sourceLabel === 'C172' && item.targetLabel.includes('C173'))); });
test('29 Closures without evidence expose no fake forks', () => assert.deepEqual(closureContinuationForks(build(), '206'), []));
test('30 all 20 Segments have route-relative orientation', () => { const data = build(); assert.equal(data.cables.length, 20); for (const cable of data.cables) assert.ok(segmentOrientation(data, routeId, cable.id), cable.legacyCableId); });
test('31 all 12 Closures can be audited deterministically', () => { const data = build(); assert.equal(data.closures.length, 12); for (const closure of data.closures) assert.ok(Array.isArray(closureContinuationForks(data, closure.id))); });
test('32 persisted continuation validation has no errors', () => assert.deepEqual(validateCableContinuations(build()), []));
test('33 repeated builds produce deterministic continuation records', () => assert.deepEqual(build().cableContinuations, build().cableContinuations));
test('34 Route Workspace renders construction and individual Fibers directly', () => { assert.match(workspaceSource, /route-tube-ribbon/); assert.match(workspaceSource, /route-fiber-ribbon/); assert.match(workspaceSource, /TubeInspector/); });
test('35 user-facing continuation language keeps uncertainty explicit', () => { assert.match(workspaceSource, /დადასტურებული გაგრძელება/); assert.match(workspaceSource, /სავარაუდო გაგრძელება/); assert.match(workspaceSource, /გაგრძელება დაუდგენელია/); });
test('36 Manager View keeps continuation uncertainty visible', () => { assert.doesNotMatch(styles, /is-manager-mode .*continuation-group-list/); assert.doesNotMatch(styles, /is-manager-mode .*closure-continuity-fork/); });
test('37 continuity data remains available without internal vocabulary in the primary UI', () => { assert.match(workspaceSource, /segmentContinuationGroups/); assert.match(workspaceSource, /დამატებითი ინფორმაცია/); assert.doesNotMatch(workspaceSource, />Cable Continuity/); });
test('38 route inventory still resolves the primary route', () => assert.ok(findCableRoute(build(), routeId)));
