import test from 'node:test';
import assert from 'node:assert/strict';
import { repository } from '../src/data/repository';
import { createEngineerQueryService, parseNetworkQuery } from '../src/domain/engineerQuery';

test('mixed Cable/Fiber shorthand resolves without merging source-scoped identities', () => {
  assert.deepEqual(parseNetworkQuery('C151/F1').cableToken, 'C151');
  assert.equal(parseNetworkQuery('158 f65').fiberNumber, 65);
  assert.deepEqual(parseNetworkQuery('Fiber 65 C158').cableToken, 'C158');
  assert.equal(parseNetworkQuery('SC211-ში რა კაბელები ერთდება?').intent, 'node_connections');
});

test('global search returns explicit source-scoped C172 Cable and Fiber choices', async () => {
  const service = createEngineerQueryService(await repository.load());
  const cables = service.search('C172').filter(item => item.category === 'Cable');
  assert.equal(cables.length, 2);
  assert.notEqual(cables[0].route, cables[1].route);
  assert.ok(cables.every(item => item.subtitle.includes('ცაგერი')));
  const fibers = service.search('C172/F1');
  assert.equal(fibers.length, 2);
  assert.ok(fibers.every(item => item.category === 'Fiber'));
  assert.equal(service.run('C172/F1 სად მიდის?').state, 'disambiguation');
  assert.ok(service.search('Fiber 65 C158').some(item => item.title.startsWith('C158/F65')));
});

test('exact source labels, annotations, and neutral nodes resolve through the unified search index', async () => {
  const service = createEngineerQueryService(await repository.load());
  assert.ok(service.search('169-206-216-48').some(item => item.title.includes('SC206')));
  assert.ok(service.search('172-225-44-24').some(item => item.title.includes('Endpoint 225')));
  assert.ok(service.search('Node 207').some(item => item.id === 'node:207' && item.category === 'Closure'));
  assert.ok(service.search('ალპანა').some(item => item.category === 'Place annotation'));
  assert.ok(service.search('Magti').some(item => item.category === 'Company annotation'));
  assert.ok(service.search('Lentekhi Port38').some(item => item.category === 'Port'));
  assert.ok(service.search('C148 Tube 11').some(item => item.category === 'Tube'));
  assert.equal(service.search('SC206').filter(item => item.category === 'Closure').length, 1);
});

test('cross-document F1 is traceable and F118 remains a truthful partial boundary', async () => {
  const service = createEngineerQueryService(await repository.load());
  const f1 = service.run('C151/F1 სად მიდის?');
  assert.ok(['exact','partial'].includes(f1.state));
  assert.ok(f1.actions.some(route => route.view === 'engineer' && route.query === 'CAB-000151/F1'));
  assert.ok(f1.answer.includes('C152/F01') || f1.answer.includes('C152/F1'));
  assert.ok(f1.transitions.some(edge => edge.at === 'SC207' && edge.from === 'C151/F1' && edge.to === 'C152/F1'));
  const f118 = service.run('C151 F118 სად მიდის?');
  assert.equal(f118.state, 'partial');
  assert.ok(!f118.answer.includes('C152'));
  assert.equal(f118.transitions.some(edge => edge.from.includes('C151/F118') && edge.to.includes('C152/F118')), false);
  assert.ok(f118.facts.some(fact => /დადგენილი|არ არის|ვერ მოიძებნა/i.test(fact)));
  const notTerminated = service.run('C151/F118 terminated არის?');
  assert.ok(notTerminated.facts.some(fact => fact.includes('terminated-ად არ არის მონიშნული')));
});

test('node answers use local transitions, including the SC225/F06 termination', async () => {
  const service = createEngineerQueryService(await repository.load());
  const attached = service.run('SC211-ში რა კაბელები ერთდება?');
  assert.equal(attached.title, 'რა ერთდება აქ');
  assert.ok(attached.facts.length > 0);
  const mappings = service.run('SC211-ში როგორ არის გადაერთებული Fibers?');
  assert.ok(mappings.transitions.length > 0);
  assert.ok(mappings.transitions.every(edge => edge.at === 'SC211'));
  const terminated = service.run('SC225 F06');
  assert.ok(terminated.facts.some(fact => fact.includes('ცნობილი დასრულება')));
  assert.ok(terminated.transitions.some(edge => edge.from === 'C181/F6' && edge.to === 'ცნობილი დასრულება'));
});

test('deterministic operational catalog preserves conflict, unknown, annotation, and Port semantics', async () => {
  const service = createEngineerQueryService(await repository.load());
  const catalog: Array<[string, string]> = [
    ['C151/F1 სად მიდის?', 'partial'], ['C151/F118 სად მიდის?', 'partial'],
    ['SC211-ში რა კაბელები ერთდება?', 'exact'], ['SC211-ში როგორ არის გადაერთებული Fibers?', 'exact'],
    ['C159-ზე რომელი Fiber-ები გადადის?', 'exact'], ['C169 სად მიდის?', 'exact'],
    ['169-206-216-48', 'exact'], ['C172', 'disambiguation'], ['C172/F1 სად მიდის?', 'disambiguation'],
    ['Lentekhi Port38-ის გზა', 'exact'], ['SC225 F06', 'exact'], ['C176/F32 სად მიდის?', 'exact'],
    ['AP51 Port3', 'exact'], ['C148 Tube', 'conflict'], ['C151/F118 terminated არის?', 'partial'],
    ['Magti რომელ Fiber-ებს იყენებს?', 'exact'], ['ეს Fiber თავისუფალია?', 'unknown'], ['Node 207 რა არის?', 'exact'],
    ['ალპანა', 'annotation'], ['ლენტეხი-ხელედის მიმართულება', 'annotation'],
  ];
  const observed = catalog.map(([question]) => ({ question, answer: service.run(question) }));
  for (let i = 0; i < catalog.length; i++) assert.equal(observed[i].answer.state, catalog[i][1], `${catalog[i][0]}: ${observed[i].answer.answer}`);
  assert.match(observed[4].answer.answer, /local mapping|mapping/i);
  assert.ok(observed[5].answer.facts.some(fact => fact.includes('SC206') || fact.includes('216')));
  assert.match(observed[9].answer.facts.join(' '), /C184.*F38/);
  assert.match(observed[9].answer.facts.join(' '), /C181.*F6.*SC225|SC225.*დასრულება/i);
  assert.match(observed[11].answer.answer, /AP52/i);
  assert.match(observed[11].answer.answer, /C176\/F32.*C175\/F24/);
  assert.doesNotMatch(`${observed[11].answer.answer} ${observed[11].answer.facts.join(' ')}`, /AP51/i);
  assert.match(observed[13].answer.answer, /F121.F192|Tube/i);
  assert.ok(observed[13].answer.facts.some(fact => /V1 .* ↔ Source B/.test(fact)));
  assert.match(observed[15].answer.answer, /წყაროთი ინტერპრეტირებული assignment/);
  assert.ok(observed[15].answer.facts.some(fact => fact.startsWith('C') && fact.includes('/F')));
  assert.match(observed[16].answer.answer, /თავისუფლებას არ ადასტურებს/);
});
