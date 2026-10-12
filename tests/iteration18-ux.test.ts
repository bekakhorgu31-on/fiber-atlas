import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
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
import { ap51PortMapping, applyIteration17FiberLineage, lineageForFiber, useAssignmentsForLineage } from '../src/domain/fiberLineage';

const source = readFileSync(new URL('../src/views/RouteWorkspace.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const build = () => applyIteration17FiberLineage(applyIteration16CableContinuity(applyIteration15Showcase(applyIteration12FullMigration(applyIteration10AggregationTopology(applyIteration09Foundations(applyIteration08CableRoute(applyIteration07PathReview(applyConfirmedC172Construction(structuredClone(pilotJson) as Inventory)))))))));

test('1 proposed groups render as fiber ranges without fake Tube identifiers', () => { assert.match(source, /ჟილები \$\{rangeLabel/); assert.match(source, /ტუბის ფერი\/ნომერი დაუდგენელია/); assert.doesNotMatch(source, /'G'\}\$\{view\.displayNumber/); });
test('2 documented Tube renders number, color and member range', () => { assert.match(source, /ტუბი \$\{number\} · \$\{colorKa/); assert.match(source, /rangeLabel\(tube\.fiberStart, tube\.fiberEnd\)/); });
test('3 Cable primary view starts with topology and construction', () => { assert.match(source, /საიდან მოდის/); assert.match(source, /ეს მონაკვეთი/); assert.match(source, /სად მიდის ჟილები/); assert.match(source, /კაბელის შემადგენლობა/); });
test('4 Cable metadata is collapsed by default', () => { assert.match(source, /<InspectorDisclosure><p>\{physical/); assert.match(source, /წყარო და ტექნიკური დეტალები/); });
test('5 Closure primary view prioritizes incoming, main path and branch', () => { assert.match(source, />შემოდის</); assert.match(source, />მთავარი გზა</); assert.match(source, />განშტოება</); assert.match(source, /title="ქუროს დეტალები"/); });
test('6 Closure details retain model, mounting and coordinates', () => { assert.match(source, /closure\.model/); assert.match(source, /closure\.mounting/); assert.match(source, /closure\.coordinatesRaw/); });
test('7 empty Closure branches are conditionally omitted', () => assert.match(source, /summary\.branches\.length > 0/));
test('8 Fiber primary labels are Georgian and full journey remains', () => { assert.match(source, />საიდან მოდის</); assert.match(source, />აქ</); assert.match(source, />სად მიდის</); assert.match(source, /title="სრული გზა"/); });
test('9 Iteration 32 removes the prototype banner and repeated card notices', () => { assert.doesNotMatch(readFileSync(new URL("../src/App.tsx", import.meta.url),"utf8"), /className="prototype-about"/); assert.doesNotMatch(source, /className="prototype-provenance"/); });
test('10 engineering disclosures use the shared hierarchy', () => { assert.match(source, /დამატებითი ინფორმაცია/); assert.match(source, /წყარო და ტექნიკური დეტალები/); assert.match(styles, /\.inspector-disclosure/); });
test('11 all 68 Fiber Lineages remain unchanged', () => assert.equal(build().fiberLineages?.length, 68));
test('12 AP51 Port3 remains in use with OTDR annotation', () => { const data = build(), port = ap51PortMapping(data, 3)!; assert.equal(port.physicalUsage, 'in_use'); assert.ok(port.sourceAnnotationIds.includes('ANN-UNRESOLVED-OTDR-34281')); });
test('13 OpenNet usage remains attached to applicable golden journeys', () => { const data = build(), lineage = lineageForFiber(data, '172', 1)!; assert.ok(useAssignmentsForLineage(data, lineage.id).some(item => item.organizationId === 'opennet')); });
test('14 Manager mode does not hide primary operational content', () => { assert.doesNotMatch(styles, /is-manager-mode .*inspector-story/); assert.doesNotMatch(styles, /is-manager-mode .*lineage-journey/); });
test('15 mobile rules prevent inspector overflow', () => { assert.match(styles, /max-width:100vw;overflow-x:hidden/); assert.doesNotMatch(styles, /min-width:\s*390px/); });

