import test from 'node:test';
import assert from 'node:assert/strict';
import {repository,loadIteration28KReference,loadFrozenV1Reference} from '../src/data/repository';
import {applyIteration28L,sc217OwnerReport} from '../src/domain/iteration28l';
import {resolveCurrentFiberPath,validateCurrentFiberPaths} from '../src/domain/currentFiberPath';
import {orderedJourneySteps} from '../src/domain/iteration28i';
import {createEngineerQueryService} from '../src/domain/engineerQuery';
import {parseRoute,routeHash} from '../src/domain/navigation';
const current=repository.load(),prior=loadIteration28KReference();
test('28L adds only the two source-backed SC217 pairs; repeated application is idempotent',async()=>{
 const data=await current,before=await prior,added=data.nodeFiberTransitions!.filter(t=>!before.nodeFiberTransitions!.some(b=>b.id===t.id));
 assert.deepEqual(added.map(t=>t.id),['NFT-SC217-34070','NFT-SC217-34072']);assert.ok(added.every(t=>t.operation==='unknown'&&t.projectionStatus==='source_interpreted'&&t.source.shapeIds.length===3));
 const count=data.nodeFiberTransitions!.length;applyIteration28L(data);assert.equal(data.nodeFiberTransitions!.length,count);
 for(const old of before.nodeFiberTransitions!)assert.deepEqual(data.nodeFiberTransitions!.find(t=>t.id===old.id),old);
});
test('28L F10/F12 reach exact Lentekhi Ports from both ends through a real SC217 edge',async()=>{
 const data=await current;
 for(const n of [10,12]){
  for(const [id,f]of [['CAB-000169',n],['CAB-000171',n],['CAB-000172',n],['CAB-000184',n],['CAB-000148',n+144]] as const){
   const p=resolveCurrentFiberPath(data,id,f),steps=orderedJourneySteps(data,p).flat();assert.equal(p.sides.some(s=>s.stop.kind==='port'&&s.stop.node.id==='AGG-LENTEKHI'&&s.stop.fiberNumber===n),true);
   assert.equal(p.sides.some(s=>s.stop.node.id==='5'),true);assert.ok(steps.some(s=>s.node.id==='217'));assert.ok(p.sides.flatMap(s=>s.transitions).some(t=>t.id===`NFT-SC217-${n===10?'34070':'34072'}`));assert.ok(!p.sides.some(s=>s.stop.node.id==='217'));
   const use=data.fiberUsageProjection!.localViews.find(v=>v.segmentId===id&&v.fiberNumber===f);if(n===12)assert.equal(use?.conflict,true);
  }
 }
});
test('28L F11 is unchanged; unrelated genuine gaps, termination and remaps remain valid',async()=>{
 const data=await current,before=await prior;
 const shape=(d:typeof data,id:string,f:number)=>{const p=resolveCurrentFiberPath(d,id,f);return p.sides.map(s=>({legs:s.legs,transitions:s.transitions,stop:s.stop}));};
 for(const [id,f]of [['CAB-000169',11],['CAB-000184',38],['CAB-000176',32],['CAB-000151',118]] as const)assert.deepEqual(shape(data,id,f),shape(before,id,f));
 assert.deepEqual(validateCurrentFiberPaths(data),[]);
});
test('28L owner endpoint report does not become a fabricated owner-confirmed splice or overwritten use claim',async()=>{
 const data=await current;assert.equal(sc217OwnerReport.selectedFiberNumber,12);assert.equal(sc217OwnerReport.fieldVerified,false);assert.equal(sc217OwnerReport.reportedEndpoint.id,'AGG-LENTEKHI');
 const path=resolveCurrentFiberPath(data,'CAB-000169',12),claims=data.fiberUsageProjection!.claims.filter(c=>c.localFiberLegs.some(l=>l.segmentId==='CAB-000169'&&l.fiberNumber===12));
 assert.ok(claims.some(c=>c.organization==='Silknet'));assert.ok(claims.some(c=>c.organization==='Skytel'));assert.ok(path.sides.flatMap(s=>s.transitions).find(t=>t.node.id==='217')?.evidence.projectionStatus==='source_interpreted');
});
test('28L recomputes groups and search from corrected authority; no obsolete four-group rule',async()=>{
 const data=await current,silk=data.organizationNetworkProjection!.organizations.find(o=>o.name==='Silknet')!;
 assert.equal(silk.strands.length,3);assert.equal(silk.localFiberLegs.length,36);assert.equal(data.currentFiberLineages!.length,473);assert.equal(data.fiberJourneySummaries!.length,2088);
 const result=createEngineerQueryService(data).run('C169/F12');assert.ok(JSON.stringify(result).includes('AGG-LENTEKHI')||JSON.stringify(result).includes('ლენტეხის'));assert.equal(data.fiberJourneySummaries!.find(s=>s.segmentId==='CAB-000169'&&s.fiberNumber===12)!.pathSignature,resolveCurrentFiberPath(data,'CAB-000169',12).signature);
});
test('28L corrections remain outside the immutable frozen V1 adapter',async()=>{
 const frozen=await loadFrozenV1Reference();assert.ok(!frozen.nodeFiberTransitions!.some(t=>t.id==='NFT-SC217-34070'||t.id==='NFT-SC217-34072'));
});
test('28L workspace URL preserves context, inspected object, selected Fiber and collapsed branches independently',()=>{
 const route={view:'route' as const,id:'ROUTE-TSAGERI-LENTEKHI',context:'network' as const,selection:'fiber:CAB-000169:12',inspect:'network_node:217',collapsed:['network_node:206','network_node:217']};
 assert.deepEqual(parseRoute(routeHash(route)),route);
});
test('28L direct Fiber lookup opens the shared Route workspace with the exact Fiber selected',async()=>{
 const data=await current,result=createEngineerQueryService(data).search('C169/F12')[0];
 assert.equal(result.category,'Fiber');assert.deepEqual(result.route,{view:'route',id:'ROUTE-TSAGERI-LENTEKHI-CORE',selection:'fiber:CAB-000169:12'});
});
test('28L never silently overrides a competing active SC217 interpretation',async()=>{
 const before=structuredClone(await prior),template=before.nodeFiberTransitions!.find(t=>t.node.kind==='closure'&&t.node.id==='217')!;
 before.nodeFiberTransitions!.push({...template,id:'competing-interpretation',a:{...template.a,segmentId:'CAB-000171',fiberNumber:10}});
 assert.throws(()=>applyIteration28L(before),/conflicts with an active local transition/);
});
