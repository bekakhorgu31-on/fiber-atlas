import assert from 'node:assert/strict';
import test from 'node:test';
import pilotJson from '../src/data/pilot.json' with { type: 'json' };
import { applyConfirmedC172Construction } from '../src/domain/colors';
import { applyIteration07PathReview } from '../src/domain/pathReview';
import { applyIteration08CableRoute, findCableRoute } from '../src/domain/cableRoutes';
import { applyIteration09Foundations } from '../src/domain/foundations';
import { applyIteration10AggregationTopology } from '../src/domain/aggregationTopology';
import { applyIteration12FullMigration } from '../src/domain/fullMigration';
import { applyIteration15Showcase } from '../src/domain/showcase';
import { applyIteration16CableContinuity } from '../src/domain/cableContinuity';
import { applyIteration17FiberLineage } from '../src/domain/fiberLineage';
import { applyIteration19 } from '../src/domain/iteration19';
import { applyIteration20 } from '../src/domain/iteration20';
import { findCable, getSegmentDisplayName, searchInventory } from '../src/domain/network';
import { routeScopedSearch } from '../src/domain/routeWorkspace';
import type { Inventory } from '../src/domain/types';

const build = () => applyIteration20(applyIteration19(applyIteration17FiberLineage(applyIteration16CableContinuity(applyIteration15Showcase(applyIteration12FullMigration(applyIteration10AggregationTopology(applyIteration09Foundations(applyIteration08CableRoute(applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory)))))))))));
const name = (data: Inventory, legacyId: string) => getSegmentDisplayName(findCable(data, legacyId)!);

test('1 C172 uses endpoint-based primary naming', () => assert.equal(name(build(), '172'), 'SC217 ↔ SC218 · 48F'));
test('2 C149 uses closure and AP endpoints', () => assert.equal(name(build(), '149'), 'SC205 ↔ AP41 · 24F'));
test('3 C148 uses aggregation and closure endpoints', () => assert.equal(name(build(), '148'), 'AGG5 ↔ SC205 · 192F'));
test('4 C173 uses closure and AP endpoints', () => assert.equal(name(build(), '173'), 'SC218 ↔ AP51 · 24F'));
test('5 unresolved closure endpoint is clearly a boundary', () => assert.equal(name(build(), '151'), 'SC206 ↔ SC207 boundary · 144F'));
test('6 all 20 Segment display names are deterministic and capacity-bearing', () => {
  const data = build();
  assert.equal(data.cables.length, 20);
  assert.ok(data.cables.every(cable => name(data, cable.legacyCableId) === getSegmentDisplayName(cable) && getSegmentDisplayName(cable).endsWith(`${cable.fiberCount}F`)));
});
test('7 legacy C-number search remains an alias while human name is primary', () => {
  const data = build(); const result = searchInventory(data, 'C172').find(item => item.route.view === 'cable');
  assert.equal(result?.title, 'SC217 ↔ SC218 · 48F');
});
test('8 route search accepts endpoint tokens and keeps Legacy C-number secondary', () => {
  const data = build(); const route = findCableRoute(data, 'ROUTE-TSAGERI-LENTEKHI-CORE')!;
  const endpoint = routeScopedSearch(data, route, 'SC217').find(item => item.key === 'segment:CAB-000172');
  const legacy = routeScopedSearch(data, route, 'C172').find(item => item.key === 'segment:CAB-000172');
  assert.equal(endpoint?.label, 'SC217 ↔ SC218 · 48F'); assert.equal(legacy?.detail, 'Legacy C172');
});
