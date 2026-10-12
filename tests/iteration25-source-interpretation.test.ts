import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import company from '../src/data/iteration25-company-usage.json';
import routing from '../src/data/iteration25-sc225-routing.json';
import ports from '../src/data/iteration25-port-interpretation.json';
import unresolved from '../src/data/iteration25-unresolved-evidence.json';
import { repository } from '../src/data/repository';
import { validateIteration25 } from '../src/domain/iteration25';

const data = await repository.load();
const rows = routing.rows;

test('25.1 reconciles all 31 company occurrences', () => assert.equal(company.counts.rawOccurrences, 31));
test('25.2 company counts preserve all four names', () => assert.deepEqual(company.counts.byOrganization, { Magti: 6, OpenNet: 12, Silknet: 6, Skytel: 7 }));
test('25.3 every occurrence has geometry evidence', () => assert.ok(company.occurrences.every(item => item.geometry.begin && item.geometry.end)));
test('25.4 every occurrence resolves at least one exact Fiber endpoint', () => assert.ok(company.occurrences.every(item => item.begin || item.end)));
test('25.5 company assignments are graph-deduplicated', () => assert.equal(company.assignments.length, 13));
test('25.6 deduplication retains all Shape IDs', () => assert.equal(new Set(company.assignments.flatMap(item => item.sourceShapeIds)).size, 31));
test('25.7 no assignment infers ownership rights service or availability', () => assert.ok(company.assignments.every(item => !item.rightsInferred && !item.ownershipInferred && !item.serviceInferred)));
test('25.8 generic decoder rule applies to every company', () => assert.equal(company.interpretationRule, 'tsageri-lentekhi-company-usage/1'));
test('25.9 source-labelled C148 F145-F148 are OpenNet', () => assert.deepEqual(company.occurrences.filter(item => item.organizationId === 'OpenNet' && item.begin?.legacySegmentId === '148').map(item => item.begin!.fiberNumber), [145,146,147,148]));
test('25.10 source-labelled C184 includes all four companies', () => assert.deepEqual([...new Set(company.occurrences.filter(item => item.begin?.legacySegmentId === '184').map(item => item.organizationId))].sort(), ['Magti','OpenNet','Silknet','Skytel']));
test('25.11 C183 F03-F04 carry exact Skytel endpoint labels', () => assert.deepEqual(company.occurrences.filter(item => item.begin?.legacySegmentId === '183').map(item => item.begin!.fiberNumber).sort((a,b)=>a-b), [3,4]));
test('25.12 active Source A inventory retains all organizations and source shapes', () => { const uses=data.networkUseAssignments?.filter(u=>u.source.file==='Tsageri-Lentekhi 2025.vsdx'); assert.deepEqual([...new Set(uses?.map(item => item.organizationId))].sort(), ['magti','opennet','silknet','skytel']); assert.equal(new Set(uses?.flatMap(item => item.sourceShapeIds)).size, 31); });

test('25.13 SC225 reconciles C181/F01-F24 exactly once', () => assert.deepEqual(rows.map(item => item.incomingFiberNumber), Array.from({length:24},(_,i)=>i+1)));
test('25.14 C181/F01-F04 route to C183/F01-F04', () => assert.deepEqual(rows.slice(0,4).map(item => [item.outgoing?.outgoingLegacySegmentId,item.outgoing?.outgoingFiberNumber]), [['183',1],['183',2],['183',3],['183',4]]));
test('25.15 C181/F13-F16 route to C182/F01-F04', () => assert.deepEqual(rows.slice(12,16).map(item => [item.outgoing?.outgoingLegacySegmentId,item.outgoing?.outgoingFiberNumber]), [['182',1],['182',2],['182',3],['182',4]]));
test('25.16 C181/F05-F12 are not guessed', () => assert.ok(rows.slice(4,12).every(item => item.outgoing === null)));
test('25.17 historical Iteration25 artifact preserves the superseded F06 statement', () => { const row=rows[5]; assert.equal(row.ownerConfirmedAPSide,true); assert.match(row.unresolvedReason!,/no source connector reaches C182 or C183/); });
test('25.18 historical Iteration25 artifact preserves its pre-correction unresolved range', () => assert.ok(rows.slice(16).every(item => item.classification === 'unresolved' && item.unresolvedReason?.includes('no termination symbol'))));
test('25.19 eight SC225 branch routes are exact', () => assert.equal(routing.counts.exactC181Routes, 8));
test('25.20 twelve source connectors support C182-C183 relationships', () => assert.equal(routing.c182ToC183Transitions.length, 12));
test('25.21 every retained C182-C183 relationship has source geometry', () => assert.ok(routing.c182ToC183Transitions.every(item => item.geometry.begin && item.geometry.end)));
test('25.22 unresolved evidence contains 16 precise rows', () => assert.equal(unresolved.records.length, 16));
test('25.23 source cable labels settle AP identities', () => assert.deepEqual([routing.cableLabels['182'].exactLabel,routing.cableLabels['183'].exactLabel], ['182-225-53-24','183-225-54-24']));
test('25.24 expected AP swap is explicitly rejected by certified source', () => assert.match(routing.identityConflict.resolution,/No swap is projected/));

test('25.25 AP53 bindings use C182', () => assert.ok(ports.apBindings.filter(item => item.ownerId === '53').every(item => item.legacySegmentId === '182')));
test('25.26 AP54 bindings use C183', () => assert.ok(ports.apBindings.filter(item => item.ownerId === '54').every(item => item.legacySegmentId === '183')));
test('25.27 AP53 and AP54 each retain 24 source-aligned Ports', () => assert.deepEqual([ports.apBindings.filter(item => item.ownerId === '53').length,ports.apBindings.filter(item => item.ownerId === '54').length],[24,24]));
test('25.28 Lentekhi identity remains neutral', () => assert.equal(ports.aggregationIdentity, 'AGG-LENTEKHI'));
test('25.29 aggregation occupancy remains unknown by policy', () => assert.match(ports.occupancyPolicy,/remains unknown/));
test('25.30 domain validation passes', () => assert.deepEqual(validateIteration25(data), []));
test('25.31 Splice Workspace implements a combinable company filter', () => { const source=readFileSync(new URL('../src/views/SpliceWorkspace.tsx',import.meta.url),'utf8'); assert.match(source,/companyFilter/); assert.match(source,/კომპანიის ფილტრი/); });
