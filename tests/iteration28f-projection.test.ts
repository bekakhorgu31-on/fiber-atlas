import test from 'node:test';
import assert from 'node:assert/strict';
import { repository } from '../src/data/repository';
import { createEngineerQueryService, parseNetworkQuery } from '../src/domain/engineerQuery';
import { createCurrentFiberPathResolver } from '../src/domain/currentFiberPath';
import { buildAggregationOperationalProjection, buildOrganizationNetworkProjection, validateIteration28F, ORGANIZATION_QUERY_CATALOG } from '../src/domain/iteration28f';
import { sourceBAPInventory } from '../src/domain/iteration28d';

const dataPromise=repository.load();
const key=(id:string,f:number)=>`${id}/F${f}`;

test('28F projections retain the current topology revision and validate',async()=>{
  const data=await dataPromise;
  assert.deepEqual(validateIteration28F(data),[]);
  assert.equal(data.organizationNetworkProjection?.topologyRevision,data.fiberPathProjection?.topologyRevision);
  assert.equal(data.aggregationOperationalProjection?.topologyRevision,data.fiberPathProjection?.topologyRevision);
  assert.equal(data.nodeFiberTransitions?.filter(t=>t.active).length,1631);
  assert.equal(sourceBAPInventory.counts.ports,216);
  assert.equal(data.apPorts?.length,192);
  assert.equal(data.portTopologyBindings?.filter(b=>b.id.startsWith('28D-')).length,192);
});

test('both 28F machine projections regenerate deterministically',async()=>{
  const data=await dataPromise;
  assert.deepEqual(buildOrganizationNetworkProjection(data),data.organizationNetworkProjection);
  assert.deepEqual(buildAggregationOperationalProjection(data),data.aggregationOperationalProjection);
});

test('Tsageri shows C148 operational use without inventing a per-Port Fiber binding or occupancy',async()=>{
  const data=await dataPromise,tsageri=data.aggregationOperationalProjection!.aggregations.find(a=>a.aggregationId==='5')!;
  const c148=tsageri.fibers.filter(f=>f.legacyCableId==='148');
  assert.equal(c148.length,192);
  assert.equal(tsageri.portCount,192);
  assert.equal(tsageri.exactPortBindings,0);
  assert.ok(c148.every(f=>f.portNumber===null&&f.portBindingId===null&&f.portOccupancy==='unknown'));
  assert.ok(c148.some(f=>f.usageState==='in_use'&&f.organization==='Magti'));
});

test('Lentekhi exposes all 48 exact C184 Port bindings while occupancy stays independent',async()=>{
  const data=await dataPromise,lentekhi=data.aggregationOperationalProjection!.aggregations.find(a=>a.aggregationId==='AGG-LENTEKHI')!;
  const c184=lentekhi.fibers.filter(f=>f.legacyCableId==='184');
  assert.equal(c184.length,48);
  assert.equal(lentekhi.exactPortBindings,48);
  assert.ok(c184.every(f=>f.portNumber!==null&&f.portBindingId!==null));
  assert.ok(c184.every(f=>f.portOccupancy==='unknown'));
  assert.ok(c184.some(f=>f.usageState==='in_use'&&f.portOccupancy==='unknown'));
});

test('organization aliases resolve as first-class results and approximate names do not',async()=>{
  const data=await dataPromise,service=createEngineerQueryService(data);
  for(const q of ['Magti','მაგთი','OpenNet','Open Net','ოპენნეტი','Silknet','სილქნეტი','Skytel','სკაიტელი']){
    assert.equal(parseNetworkQuery(q).intent,'organization_network',q);
    assert.equal(service.search(q)[0]?.category,'Organization',q);
  }
  assert.ok(!service.search('Magtix').some(r=>r.category==='Organization'));
});

test('all 14 requested queries have deterministic intents and useful outcomes',async()=>{
  const data=await dataPromise,service=createEngineerQueryService(data);
  assert.equal(ORGANIZATION_QUERY_CATALOG.length,14);
  for(const query of ORGANIZATION_QUERY_CATALOG){
    const parsed=parseNetworkQuery(query),answer=service.run(query);
    assert.ok(!['search','unknown'].includes(parsed.intent),query);
    assert.ok(answer.title.length>0,query);
  }
});

test('Magti result cables and aggregations require exact local usage and traversed paths',async()=>{
  const data=await dataPromise,projection=data.organizationNetworkProjection!.organizations.find(o=>o.organizationId==='magti')!;
  for(const cableId of projection.cableIds)assert.ok(projection.localFiberLegs.some(l=>l.segmentId===cableId&&data.fiberUsageProjection!.claims.some(c=>c.organization==='Magti'&&c.localFiberLegs.some(x=>x.segmentId===cableId&&x.fiberNumber===l.fiberNumber))));
  for(const id of projection.aggregationIds)assert.ok(projection.localFiberLegs.some(l=>createCurrentFiberPathResolver(data).resolve(l.segmentId,l.fiberNumber).sides.some(s=>s.stop.node.kind==='aggregation'&&s.stop.node.id===id)));
  for(const id of projection.closureIds)assert.ok(projection.localFiberLegs.some(l=>createCurrentFiberPathResolver(data).resolve(l.segmentId,l.fiberNumber).sides.some(s=>s.transitions.some(t=>t.node.id===id)||s.stop.node.id===id)));
});

test('organization search retains original source-label evidence and reports network-use semantics',async()=>{
  const data=await dataPromise,service=createEngineerQueryService(data),answer=service.run('Magti which cables and ports?');
  assert.equal(answer.title,'Magti · Network usage');
  assert.ok(answer.facts.some(f=>f.includes('Fiber legs')));
  assert.ok(answer.results.some(r=>r.category==='Source evidence'));
  assert.ok(answer.facts.includes('Cables / local Fibers'));
  assert.ok(answer.facts.includes('Certified APs / exact Ports'));
  assert.ok(answer.facts.includes('Closure path context'));
  assert.ok(answer.answer.includes('ownership'));
  for(const id of data.organizationNetworkProjection!.organizations.find(o=>o.organizationId==='magti')!.apIds)assert.ok(answer.results.some(r=>r.category==='AP'&&r.title.includes(id)));
});

test('Lentekhi exact Port/Fiber pairs remain clickable via the active binding records',async()=>{
  const data=await dataPromise;
  for(const row of data.aggregationOperationalProjection!.aggregations.find(a=>a.aggregationId==='AGG-LENTEKHI')!.fibers){
    const binding=data.portTopologyBindings!.find(b=>b.id===row.portBindingId);
    assert.ok(binding&&binding.segmentId===row.segmentId&&binding.fiberNumber===row.fiberNumber);
    assert.equal(binding!.portNumber,row.portNumber);
  }
});

test('Lentekhi Port38 path shows its exact SC224 to SC225 branch and AP/termination endpoint',async()=>{
  const data=await dataPromise,c=data.cables.find(x=>x.legacyCableId==='184')!,path=createCurrentFiberPathResolver(data).resolve(c.id,38);
  assert.ok(path.sides.some(s=>s.transitions.some(t=>t.node.id==='224'&&t.to?.segmentId===data.cables.find(c=>c.legacyCableId==='181')?.id)));
  assert.ok(path.sides.some(s=>s.transitions.some(t=>t.node.id==='225')));
  assert.ok(path.sides.some(s=>s.transitions.some(t=>t.node.id==='225')&&s.stop.node.id==='225'));
  assert.ok(path.sides.every(s=>s.stop.node.id!=='218'&&s.stop.node.id!=='51'));
});

test('Tsageri unknown-Port search keeps the aggregation context visible',async()=>{
  const data=await dataPromise,answer=createEngineerQueryService(data).run('Tsageri Aggregation-ზე ვინ იყენებს Fiber-ებს?');
  assert.ok(answer.facts.some(f=>f.includes('Fiber')||f.includes('in_use')));
  assert.ok(answer.facts.some(f=>f.includes('პორტის')||f.includes('Port')));
});

test('28F projection contains no duplicate local cable/fiber identity within an organization',async()=>{
  const data=await dataPromise;
  for(const org of data.organizationNetworkProjection!.organizations)assert.equal(new Set(org.localFiberLegs.map(l=>key(l.segmentId,l.fiberNumber))).size,org.localFiberLegs.length,org.name);
});
