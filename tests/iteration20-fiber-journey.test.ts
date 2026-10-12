import assert from 'node:assert/strict';
import test from 'node:test';
import pilotJson from '../src/data/pilot.json' with { type: 'json' };
import { applyConfirmedC172Construction } from '../src/domain/colors';
import { applyIteration07PathReview } from '../src/domain/pathReview';
import { applyIteration08CableRoute } from '../src/domain/cableRoutes';
import { applyIteration09Foundations } from '../src/domain/foundations';
import { applyIteration10AggregationTopology } from '../src/domain/aggregationTopology';
import { applyIteration12FullMigration } from '../src/domain/fullMigration';
import { applyIteration15Showcase } from '../src/domain/showcase';
import { applyIteration16CableContinuity } from '../src/domain/cableContinuity';
import { applyIteration17FiberLineage } from '../src/domain/fiberLineage';
import { applyIteration19 } from '../src/domain/iteration19';
import { applyIteration20, fiberJourneySummary, portBindingsForFiber } from '../src/domain/iteration20';
import type { Inventory } from '../src/domain/types';

const build = () => applyIteration20(applyIteration19(applyIteration17FiberLineage(applyIteration16CableContinuity(applyIteration15Showcase(applyIteration12FullMigration(applyIteration10AggregationTopology(applyIteration09Foundations(applyIteration08CableRoute(applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory)))))))))));

test('1 every inventory Fiber receives one maximum-known journey', () => { const data = build(); assert.equal(data.fiberJourneySummaries?.length, 1176); assert.equal(new Set(data.fiberJourneySummaries?.map(item => item.fiberId)).size, 1176); });
test('2 existing full Fiber Lineages take priority', () => assert.deepEqual([fiberJourneySummary(build(), 'CAB-000172', 31)?.scope, fiberJourneySummary(build(), 'CAB-000172', 31)?.lineageId], ['full_lineage','LINEAGE-AP51-NORTH-03']));
test('3 C148/F23 starts at AGG5 Port23 and reaches SC205', () => assert.deepEqual([fiberJourneySummary(build(), 'CAB-000148', 23)?.knownFrom, fiberJourneySummary(build(), 'CAB-000148', 23)?.knownTo], ['AGG5 / Port 23','SC205']));
test('4 C148/F23 stops precisely after SC205', () => assert.match(fiberJourneySummary(build(), 'CAB-000148', 23)?.stopReasonKa ?? '', /SC205.*ზუსტი ჟილური კავშირი.*დაუდგენელია/));
test('5 C148/F23 has Orange Tube and Rose Fiber evidence', () => { const data = build(); const fiber = data.fibers.find(item => item.cableId === 'CAB-000148' && item.number === 23)!; const tube = data.tubes.find(item => item.id === fiber.tubeId)!; assert.deepEqual([tube.number,tube.physicalColor.key,fiber.physicalColor.key], [2,'orange','rose']); });
test('6 AGG5 Port175 and AP51 Port3 converge on the same full journey', () => { const data = build(); assert.equal(portBindingsForFiber(data, 'CAB-000148', 175)[0].lineageIds[0], 'LINEAGE-AP51-NORTH-03'); assert.equal(fiberJourneySummary(data, 'CAB-000173', 3)?.lineageId, 'LINEAGE-AP51-NORTH-03'); });
test('7 AP41 Port18 has a partial journey with an exact evidence stop', () => { const item = fiberJourneySummary(build(), 'CAB-000149', 18)!; assert.equal(item.scope, 'partial'); assert.match(item.stopReasonKa, /ზუსტი ჟილური კავშირი.*დაუდგენელია/); });
test('8 Lentekhi C184/F31 keeps its known Port31 endpoint inside the higher-priority full journey', () => { const item = fiberJourneySummary(build(), 'CAB-000184', 31)!; assert.equal(item.knownFrom, 'ლენტეხის აგრეგაცია / Port-Fiber 31'); assert.equal(portBindingsForFiber(build(), 'CAB-000184', 31).find(binding => binding.ownerId === 'ODF-LENTEKHI-01')?.portNumber, 31); });
test('9 all partial summaries state a Georgian stop reason', () => assert.ok(build().fiberJourneySummaries?.filter(item => item.scope !== 'full_lineage').every(item => /[ა-ჰ]/.test(item.stopReasonKa) && item.stopReasonKa.length > 20)));
test('10 journey summaries never create new Fiber Lineages', () => { const data = build(); assert.equal(data.fiberLineages?.length, 68); assert.equal(data.fiberJourneySummaries?.length, data.fibers.length); });
