import assert from 'node:assert/strict';
import test from 'node:test';
import { repository } from '../src/data/repository';
import { constructionTubeViews, historicalSegmentContinuationGroups, segmentContinuationGroups, tubeContinuationSummary } from '../src/domain/cableContinuity';
import { compactSearchResult } from '../src/domain/iteration28g';
import { createEngineerQueryService } from '../src/domain/engineerQuery';
import { findCable } from '../src/domain/network';

const dataPromise = repository.load();
const routeId = 'ROUTE-TSAGERI-LENTEKHI-CORE';

test('29-01 active Cable summary uses SC217 current transitions for C171/F10-F12', async () => {
  const data = await dataPromise, cable = findCable(data, '171')!;
  const groups = segmentContinuationGroups(data, routeId, cable.id).filter(group => group.direction === 'downstream' && group.node.kind === 'closure' && group.node.id === '217');
  for (const number of [10, 11, 12]) {
    const mapping = groups.flatMap(group => group.memberMappings).find(item => item.sourceFiberNumber === number);
    assert.deepEqual(mapping, { sourceFiberNumber: number, targetFiberNumber: number, operationalStatus: 'authoritative' });
    assert.ok(groups.some(group => group.targetSegmentId === 'CAB-000172' && number >= group.sourceStart && number <= group.sourceEnd));
    assert.ok(!groups.some(group => group.operationalStatus === 'unresolved' && number >= group.sourceStart && number <= group.sourceEnd));
  }
  assert.ok(!groups.some(group => group.operationalStatus === 'unresolved' && group.sourceStart <= 10 && group.sourceEnd >= 12), 'the stale F01–F28 unresolved range must not be shown');
});

test('29-01 historical CableContinuation evidence remains separate and unchanged', async () => {
  const data = await dataPromise, cable = findCable(data, '171')!;
  const historical = historicalSegmentContinuationGroups(data, routeId, cable.id).filter(group => group.direction === 'downstream');
  assert.ok(historical.some(group => group.sourceStart === 29 && group.sourceEnd === 29 && group.targetSegmentId === 'CAB-000172'));
  assert.ok(!historical.some(group => group.sourceStart <= 10 && group.sourceEnd >= 10));
});

test('29-01 Tube continuation summary agrees with current graph inside C171 Tube 1', async () => {
  const data = await dataPromise, cable = findCable(data, '171')!;
  const tube = constructionTubeViews(data, cable.id).find(item => item.fiberStart <= 10 && item.fiberEnd >= 12);
  assert.ok(tube, 'C171 Tube 1 construction should be available');
  const summary = tubeContinuationSummary(data, routeId, cable.id, tube.displayNumber)!;
  for (const number of [10, 11, 12]) {
    assert.ok(summary.groups.some(group => group.memberMappings.some(item => item.sourceFiberNumber === number && item.targetFiberNumber === number && item.operationalStatus === 'authoritative')));
    assert.ok(!summary.unresolvedMembers.includes(number));
  }
});

test('29-01 Cable search shows current SC217 mappings and excludes the stale unresolved range', async () => {
  const data = await dataPromise, service = createEngineerQueryService(data);
  const result = service.search('C171').map(item => compactSearchResult(data, item)).find(item => item.id === 'cable:CAB-000171');
  assert.ok(result);
  const continuationFacts = result.facts?.filter(fact => fact.includes('SC217')) ?? [];
  assert.ok(continuationFacts.some(fact => /F1–F48.*C172 \/ F01–F48/.test(fact)), JSON.stringify(continuationFacts));
  assert.ok(!continuationFacts.some(fact => /unresolved/i.test(fact) && /F01.*F28/.test(fact)));
});

test('29-01 Tube search shows the same current SC217 mapping as its Fiber paths', async () => {
  const data = await dataPromise, service = createEngineerQueryService(data);
  const result = service.search('C171 Tube 1').map(item => compactSearchResult(data, item)).find(item => item.id === 'tube:CAB-000171:GROUP-1');
  assert.ok(result);
  assert.ok(result.facts?.some(fact => /SC217.*F1–F12.*C172 \/ F01–F12/.test(fact)), JSON.stringify(result.facts));
  assert.ok(!result.facts?.some(fact => /unresolved/i.test(fact) && /F01.*F12/.test(fact)));
});
