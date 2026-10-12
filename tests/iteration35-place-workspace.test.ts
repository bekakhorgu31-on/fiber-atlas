import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from './fixtures/shida-ap16-ap17-source.json';
import type {Inventory} from '../src/domain/types';
import {questionJourney,placeInventory,localNeighborhood,focusedSelectionRoute,placeNavigationTarget,placeSourceIds} from '../src/domain/placeWorkspace';
import {createCurrentFiberPathResolver} from '../src/domain/currentFiberPath';
import {orderedJourneySteps} from '../src/domain/iteration28i';
import {parseRoute,routeHash} from '../src/domain/navigation';
import {createEngineerQueryService} from '../src/domain/engineerQuery';
import {compactJourneyOptions,compactJourneyGroups} from '../src/domain/compactJourney';
import {repository} from '../src/data/repository';
const load=()=>structuredClone(fixture) as unknown as Inventory;
test('35 source-scoped places preserve repeated AP identities and unconnected places',()=>{
 const data=load(),first=data.networkNodes!.find(n=>n.apEvidence?.number===16)!;
 data.networkNodes!.push({...structuredClone(first),id:'OTHER-AP16',displayName:'AP16 · other source',source:{...first.source,documentId:'OTHER'}});
 const all=placeInventory(data);assert.equal(all.filter(p=>p.label.startsWith('AP16')).length,2);assert.ok(all.some(p=>p.ref.id==='OTHER-AP16'));
 const doc={id:'SHIDA',title:'Shida',sourceSha256:'sha',importedAssetIds:[first.id]};data.sourceDocuments=[doc] as unknown as NonNullable<Inventory['sourceDocuments']>;assert.ok(placeSourceIds(data,first.id,first.source).includes(doc.id));doc.importedAssetIds.push('closure:COLLIDING-ID');assert.deepEqual(placeSourceIds(data,'COLLIDING-ID',undefined,'ap'),[]);assert.deepEqual(placeSourceIds(data,'COLLIDING-ID',undefined,'closure'),['SHIDA']);assert.deepEqual(placeSourceIds(data,'UNKNOWN',{...first.source,documentId:'OTHER',sourceRevision:undefined,sourceSha256:undefined}),[]);
});
test('35 bounded physical neighborhood preserves parallel edges and cycles without an optical inference',()=>{
 const data=load(),a=data.cables[0];data.cables.push({...structuredClone(a),id:'PARALLEL'});
 const b=data.cables[1];data.cables.push({...structuredClone(a),id:'CYCLE',endpointA:a.endpointB,endpointB:b.endpointB});
 const key=a.endpointA.kind+':'+a.endpointA.id,n=localNeighborhood(data,key,[],64);
 assert.ok(n.cables.some(c=>c.id==='PARALLEL'));assert.ok(n.cables.some(c=>c.id===a.id));
 const bounded=localNeighborhood(data,key,[],1);assert.equal(bounded.cables.length,1);assert.equal(bounded.total,n.total);
 const resolver=createCurrentFiberPathResolver(data);assert.equal(resolver.resolve(a.id,1).sides.flatMap(s=>s.transitions).length,0);
});
test('35 direct Port navigation keeps canonical owner, scope, expansion and selection through URL',()=>{
 const data=load(),node=data.networkNodes!.find(n=>n.apEvidence?.number===16)!;
 const route=focusedSelectionRoute(data,{type:'port',ownerType:'ap',ownerId:node.id,number:13},{view:'place',source:'SHIDA',query:'AP16',expanded:['network_node:X'],limit:32});
 const restored=parseRoute(routeHash(route));assert.equal(restored?.view,'place');if(restored?.view!=='place')return;
 assert.equal(restored.focus,'network_node:'+node.id);assert.equal(restored.selection,route.selection);assert.equal(restored.source,'SHIDA');assert.deepEqual(restored.expanded,route.expanded);assert.equal(restored.query,'AP16');assert.equal(restored.limit,32);
});
test('35 old Fiber links focus on exact object; advanced overview remains explicit',()=>{
 const data=load(),c=data.cables[0],r=placeNavigationTarget(data,{view:'trace',cableId:c.id,fiber:13});assert.equal(r.view,'place');if(r.view==='place')assert.equal(r.selection,'fiber:'+c.id+':13');
 assert.deepEqual(placeNavigationTarget(data,{view:'route',id:'ANY',overview:true}),{view:'route',id:'ANY',overview:true});
});
for(const number of [1,13,14,24])test(`35 presentation preserves source Fiber ${number} path signature and gaps`,()=>{
 const data=load(),c=data.cables.find(c=>c.legacyCableId==='25-123')!,resolver=createCurrentFiberPathResolver(data),path=resolver.resolve(c.id,number),before=JSON.stringify(path),steps=orderedJourneySteps(data,path);
 assert.equal(JSON.stringify(path),before);assert.equal(resolver.resolve(c.id,number).signature,path.signature);
 const legs=steps.flatMap(s=>s.flatMap(n=>n.legAfter?[n.legAfter.segmentId]:[]));assert.ok(!legs.some(id=>data.cables.find(c=>c.id===id)?.legacyCableId==='25-122'));
 if(number===1){assert.equal(path.state,'partial');assert.ok(steps.flat().some(s=>s.stopKind==='no_transition'));}else assert.equal(path.state,'exact');
});
test('35 question result resolves the same exact selected Fiber as place Port13',()=>{
 const data=load(),answer=createEngineerQueryService(data).run('AP16 Port13'),node=data.networkNodes!.find(n=>n.apEvidence?.number===16)!,b=data.portTopologyBindings!.find(b=>b.ownerId===node.id&&b.portNumber===13)!;
 assert.deepEqual(questionJourney(data,answer),{cableId:b.segmentId,fiberNumber:13});
 assert.deepEqual(questionJourney(data,{...answer,actions:[{view:'route',id:'PHYSICAL-CONTEXT',selection:`port:ap:${b.ownerId}:13`,target:`port:ap:${b.ownerId}:13`}],results:[]}),{cableId:b.segmentId,fiberNumber:13});
 assert.ok(answer.actions.some(r=>(r.view==='fiber'||r.view==='trace')&&r.cableId===b.segmentId&&r.fiber===13));
});
test('35 long journey grouping preserves branch decisions, selected neighbors, remaps and unknown ends',async()=>{
 const data=await repository.load(),c=data.cables.find(c=>c.legacyCableId==='172')!,path=createCurrentFiberPathResolver(data).resolve(c.id,1),steps=compactJourneyOptions(data,path)[0],groups=compactJourneyGroups(data,path,steps,0,false);
 const visible=new Set(groups.flatMap(g=>'index'in g?[g.index]:[]));
 steps.forEach((s,i)=>{const degree=data.cables.filter(c=>c.endpointA.id===s.node.id||c.endpointB.id===s.node.id).length;if(degree>2||s.remap||s.stopKind||s.node.id===c.endpointA.id||s.node.id===c.endpointB.id)assert.ok(visible.has(i));});
 assert.ok(groups.some(g=>'count'in g));assert.equal(groups.reduce((n,g)=>n+('count'in g?g.count:1),0),steps.length);assert.equal(compactJourneyGroups(data,path,steps,0,true).length,steps.length);
});
test('35 ambiguous path alternatives each include selected local Fiber without merging paths',()=>{
 const data=load(),c=data.cables.find(c=>c.legacyCableId==='25-123')!,path=createCurrentFiberPathResolver(data).resolve(c.id,13),before=JSON.stringify(path);
 path.sides[0].ambiguous=true;path.state='ambiguous';const options=compactJourneyOptions(data,path);assert.equal(options.length,2);for(const steps of options)assert.deepEqual(steps[0].legAfter,{segmentId:c.id,fiberNumber:13});
 path.sides[0].ambiguous=false;path.state='exact';assert.equal(JSON.stringify(path),before);
});
