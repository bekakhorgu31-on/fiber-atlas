import test from 'node:test';
import assert from 'node:assert/strict';
import { repository } from '../src/data/repository';
import { portOperationalView, portOperationalLabel, portOperationalRoute, compactSearchResult } from '../src/domain/iteration28g';
import { createEngineerQueryService } from '../src/domain/engineerQuery';

const dataPromise=repository.load();

test('28G Lentekhi Port view presents exact bound Fiber operation while preserving unknown occupancy',async()=>{
  const data=await dataPromise,view=portOperationalView(data,'odf',data.odfs!.find(o=>o.containedBy.id==='AGG-LENTEKHI')!.id,38);
  assert.equal(view.legacyCableId,'184');assert.equal(view.fiberNumber,38);assert.equal(view.occupancy,'პორტის ფიზიკური სტატუსი წყაროდან არ არის დადგენილი');
  assert.ok(view.tubeNumber&&view.tubeColor&&view.fiberColor);assert.ok(view.pathSummary?.includes('SC224'));assert.equal(portOperationalRoute(view).view,'fiber');
});

test('28G never paints Tsageri Port from C148 Fiber use without exact binding',async()=>{
  const data=await dataPromise,odf=data.odfs!.find(o=>o.containedBy.id==='5')!,view=portOperationalView(data,'odf',odf.id,20);
  assert.equal(view.bindingId,null);assert.equal(view.segmentId,null);assert.equal(view.usageState,null);assert.equal(view.organization,null);
});

test('28G exact Fiber search returns construction identity, short path and direct Fiber route',async()=>{
  const data=await dataPromise,service=createEngineerQueryService(data),r=service.search('C158/F20').map(x=>compactSearchResult(data,x))[0];
  assert.equal(r.category,'Fiber');assert.match(r.subtitle,/Tube \d+ · .+ · F20 · .+/);assert.equal(r.route.view,'fiber');assert.ok(r.pathSummary);
});

test('28G cable search is summarized and organization search returns logical path cards',async()=>{
  const data=await dataPromise,service=createEngineerQueryService(data),cable=service.search('C158').map(x=>compactSearchResult(data,x))[0],org=service.search('Magti');
  assert.equal(cable.category,'Cable');assert.match(cable.subtitle,/\d+F/);assert.ok(org.length>1);assert.ok(org.slice(1).some(x=>x.category==='Fiber'));assert.ok(org.filter(x=>x.category==='Company annotation').length<=1);
});

test('28G Port search resolves exact Port selection in the persistent route workspace',async()=>{
  const data=await dataPromise,service=createEngineerQueryService(data),result=service.search('Lentekhi Port38')[0];
  assert.ok(result);assert.equal(result.category,'Port');assert.equal(result.route.view,'route');assert.equal(result.route.view==='route'?result.route.selection:undefined,'port:odf:ODF-LENTEKHI-01:38');assert.match(portOperationalLabel(portOperationalView(data,'odf',data.odfs!.find(o=>o.containedBy.id==='AGG-LENTEKHI')!.id,38)),/C184\/F38/);
});

test('28G scoped Tsageri Port search never borrows C148 Fiber identity',async()=>{
  const data=await dataPromise,service=createEngineerQueryService(data),result=service.search('Tsageri Port175')[0];
  assert.equal(result?.category,'Port');assert.equal(result?.route.view,'route');assert.match(JSON.stringify(result),/port:odf:/);assert.doesNotMatch(JSON.stringify(result),/C148\/F175|Fnull/);
});

test('28G source label stays a canonical Cable result with compact operational facts',async()=>{
  const data=await dataPromise,service=createEngineerQueryService(data),result=service.search('154-208-209-144').map(x=>compactSearchResult(data,x))[0];
  assert.ok(result.id.startsWith('cable:'));assert.equal(result.category,'Cable');assert.ok(result.facts?.some(x=>/Tube/.test(x)));
});

test('28G closure, AP, and Aggregation search cards provide route-focused operational context',async()=>{
  const data=await dataPromise,service=createEngineerQueryService(data);
  const closure=service.search('SC211').map(x=>compactSearchResult(data,x)).find(x=>x.category==='Closure');
  const ap=service.search('AP42').map(x=>compactSearchResult(data,x)).find(x=>x.category==='AP');
  const aggregation=service.search('ლენტეხის აგრეგაცია').map(x=>compactSearchResult(data,x)).find(x=>x.category==='Aggregation');
  assert.ok(closure?.subtitle.includes('C'));assert.equal(closure?.route.view,'closure');
  assert.ok(ap?.subtitle.includes('Ports'));assert.equal(ap?.route.view,'route');
  assert.ok(aggregation?.subtitle.includes('48'));assert.equal(aggregation?.route.view,'aggregation');
  const port=service.search('AP42 Port1')[0];assert.equal(port?.category,'Port');assert.equal(port?.route.view,'route');assert.equal(port?.route.view==='route'?port.route.selection:undefined,'port:ap:42:1');
});
