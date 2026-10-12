import test from 'node:test';
import assert from 'node:assert/strict';
import {repository} from '../src/data/repository';
import {createEngineerQueryService} from '../src/domain/engineerQuery';
import {compactSearchResult, compactPath, compactRouteAction, portOperationalView} from '../src/domain/iteration28g';
import {createCurrentFiberPathResolver} from '../src/domain/currentFiberPath';

const dataPromise=repository.load();

test('28H Source B AP summaries use canonical AP evidence and source occupancy',async()=>{
  const data=await dataPromise, service=createEngineerQueryService(data);
  for(const n of [42,43,44,45,46,47,48,49]){
    const source=data.networkNodes!.find(x=>x.id===String(n))!, ports=data.apPorts!.filter(p=>p.apNumber===n);
    const result=service.search(`AP${n}`).map(r=>compactSearchResult(data,r)).find(r=>r.id===`node:${n}`)!;
    assert.ok(result);assert.match(result.subtitle,new RegExp(source.apEvidence!.place));
    assert.match(result.subtitle,new RegExp(`${source.apEvidence!.capacity} Ports`));
    assert.match(result.subtitle,/C\d+/);assert.equal(result.route.view,'route');
    assert.equal(result.facts![0],`${ports.filter(p=>p.occupancy==='in_use').length} used · ${ports.filter(p=>p.occupancy==='unused').length} unused · ${ports.filter(p=>p.occupancy==='unknown').length} unknown`);
  }
  const ap42=service.search('AP42').map(r=>compactSearchResult(data,r)).find(r=>r.id==='node:42')!;
  assert.match(ap42.subtitle,/ორბელი · C153 · 24 Ports/);
  assert.equal(ap42.facts![0],'2 used · 22 unused · 0 unknown');
  assert.equal(service.search('AP42').length,1); // 28I: exact AP lookup does not flood suggestions with Ports.
  const firstPort=service.search('AP42 Port1').find(r=>r.title==='AP42 / Port 1')!;
  assert.match(firstPort.subtitle,/C153\/F1/);assert.ok(firstPort.id.startsWith('port-binding:'));assert.equal(firstPort.route.view,'route');assert.equal(firstPort.route.view==='route'?firstPort.route.selection:undefined,'port:ap:42:1');
  const ap47=service.search('AP47').map(r=>compactSearchResult(data,r)).find(r=>r.id==='node:47')!;
  assert.match(ap47.facts![0],/1 unknown/);
});

test('28H Cable cards format once for direct and source-label lookup',async()=>{
  const data=await dataPromise,service=createEngineerQueryService(data);
  for(const q of ['C158','C148','154-208-209-144']){
    const raw=service.search(q)[0], once=compactSearchResult(data,raw), twice=compactSearchResult(data,once);
    assert.deepEqual(twice,once);assert.equal(once.category,'Cable');
    assert.equal(once.facts!.filter(f=>/ცაგერი–/.test(f)).length,1);
    assert.equal(once.facts!.filter(f=>/in use/.test(f)).length,1);
    assert.match(once.subtitle,/C\d+ · \d+F · .+ ↔ .+/);
  }
});

test('28H scoped Port search distinguishes nonexistent, unbound and ambiguous records',async()=>{
  const data=await dataPromise, service=createEngineerQueryService(data);
  for(const q of ['Lentekhi Port999','Lentekhi Port0','Tsageri Port0','Tsageri Port193','AP42 Port25'])assert.deepEqual(service.search(q),[],q);
  const lentekhi=service.search('Lentekhi Port38')[0];assert.equal(lentekhi.route.view,'route');assert.match(lentekhi.route.view==='route'?lentekhi.route.selection??'':'',/^port:odf:.+:38$/);
  const ap=service.search('AP42 Port1')[0];assert.equal(ap.route.view,'route');assert.equal(ap.route.view==='route'?ap.route.selection:undefined,'port:ap:42:1');
  const unbound=service.search('Tsageri Port175')[0];assert.equal(unbound.route.view,'route');assert.match(JSON.stringify(unbound),/port:odf:/);assert.doesNotMatch(JSON.stringify(unbound),/C148\/F175|Fnull/);
  const binding=data.portTopologyBindings!.find(b=>b.ownerType==='odf'&&b.portNumber===38&&b.ownerId.includes('LENTEKHI'))!;
  const ambiguous={...data,portTopologyBindings:[...data.portTopologyBindings!,{...binding,id:'28H-AMBIGUOUS'}]};
  const result=createEngineerQueryService(ambiguous).search('Lentekhi Port38')[0];
  assert.equal(result.route.view,'route');assert.doesNotMatch(JSON.stringify(result),/Fnull|Tube \d+|"view":"fiber"/);
});

test('28H Port and Fiber paths agree on ordered remap and stop semantics',async()=>{
  const data=await dataPromise,service=createEngineerQueryService(data),c184=data.cables.find(c=>c.legacyCableId==='184')!;
  const port=service.search('Lentekhi Port38')[0],fiber=compactSearchResult(data,service.search('C184/F38')[0]);
  assert.equal(port.pathSummary,fiber.pathSummary);
  assert.match(port.pathSummary!,/^ლენტეხის აგრეგაცია \/ Port 38 → SC224 \(C184\/F38 → C181\/F6\) → SC225 \/ აქ მთავრდება$/);
  assert.doesNotMatch(port.pathSummary!,/SC223|AP51/);
  const path=createCurrentFiberPathResolver(data).resolve(c184.id,38);
  assert.equal(path.sides.find(s=>s.stop.node.id==='225')?.stop.kind,'termination');
  assert.equal(compactPath(data,c184.id,11),compactSearchResult(data,service.search('C184/F11')[0]).pathSummary);
  assert.match(compactSearchResult(data,service.search('C151/F118')[0]).pathSummary!,/გაგრძელება დაუდგენელია/);
  assert.equal(portOperationalView(data,'odf',data.odfs!.find(o=>o.containedBy.id==='AGG-LENTEKHI')!.id,38).pathSummary,port.pathSummary);
});

test('28H Tube result labels its sample Fiber and exact route',async()=>{
  const data=await dataPromise,service=createEngineerQueryService(data),tube=compactSearchResult(data,service.search('C184 Tube 1')[0]);
  assert.equal(tube.category,'Tube');assert.equal(tube.route.view,'fiber');
  assert.match(tube.facts!.join(' '),/Sample Fiber C184\/F1/);
  assert.match(compactRouteAction(data,tube),/C184\/F1/);
  assert.match(tube.facts!.join(' '),/9 in use · 2 unused · 1 review · 0 unknown/);
  assert.notEqual(compactPath(data,tube.route.view==='fiber'?tube.route.cableId:'',1),compactPath(data,tube.route.view==='fiber'?tube.route.cableId:'',11));
});

test('28H shared resolver rebuilds when the active transition snapshot changes',async()=>{
  const data=await dataPromise,c184=data.cables.find(c=>c.legacyCableId==='184')!;
  const changed={...data,nodeFiberTransitions:data.nodeFiberTransitions!.map(t=>({...t}))};
  const before=compactPath(changed,c184.id,38);
  const transition=changed.nodeFiberTransitions.find(t=>t.active&&t.node.id==='224'&&[t.a,t.z].some(side=>side?.segmentId===c184.id&&side.fiberNumber===38))!;
  transition.active=false;
  const after=compactPath(changed,c184.id,38);
  assert.notEqual(after,before);assert.doesNotMatch(after,/C181\/F6/);
});

test('28H presentation changes preserve certified inventory and Port boundaries',async()=>{
  const data=await dataPromise;
  assert.equal(data.cables.length,37);assert.equal(data.fibers.length,2088);
  assert.equal(data.nodeFiberTransitions?.filter(t=>t.active).length,1631);
  assert.equal(data.portTopologyBindings?.filter(p=>p.ownerType==='odf'&&p.ownerId.includes('LENTEKHI')).length,48);
  assert.equal(data.odfPorts?.filter(p=>p.odfId.includes('TSAGERI')).length,192);
  assert.equal(data.portTopologyBindings?.filter(p=>p.segmentId===data.cables.find(c=>c.legacyCableId==='148')?.id).length,0);
});

