import test from 'node:test';
import assert from 'node:assert/strict';
import { repository, loadFrozenV1Reference } from '../src/data/repository';
import { applyIteration27D } from '../src/domain/iteration27d';
import { applyIteration28B } from '../src/domain/iteration28b';
import { applyIteration28C } from '../src/domain/iteration28c';
import { createCurrentFiberPathResolver, currentTopologyRevision, resolveCurrentFiberPath, validateCurrentFiberPaths } from '../src/domain/currentFiberPath';
import { createEngineerQueryService } from '../src/domain/engineerQuery';
import { getSegmentDisplayName } from '../src/domain/network';
import { lineageForFiber } from '../src/domain/fiberLineage';
import { transitionPathCableIds } from '../src/views/NetworkTopologyCanvas';
let ready: ReturnType<typeof repository.load>;
// This suite certifies the historical 28C snapshot; 28D intentionally adds certified AP Port stops.
const current = () => ready ??= loadFrozenV1Reference().then(applyIteration27D).then(applyIteration28B).then(applyIteration28C);
const cable = (data: Awaited<ReturnType<typeof current>>, legacy: string) => data.cables.find(c=>c.legacyCableId===legacy)!;

test('28C F11 traverses the exact SC208 connector and both source-supported remaps', async()=>{
  const data=await current(), c152=cable(data,'152'), path=resolveCurrentFiberPath(data,c152.id,11);
  const onward=path.sides.find(s=>s.startNode.id==='208')!;
  assert.ok(onward.transitions.some(t=>t.id.includes('NFT-208-15797')&&t.from.fiberNumber===11&&t.to?.segmentId===cable(data,'154').id));
  assert.deepEqual(onward.legs.map(l=>[data.cables.find(c=>c.id===l.segmentId)!.legacyCableId,l.fiberNumber]),[['152',11],['154',11],['156',11],['158',11],['161',11],['164',23],['166',23],['167',23],['168',11]]);
  assert.equal(onward.stop.node.id,'49'); assert.equal(onward.stop.node.kind,'network_node'); assert.equal(onward.stop.kind,'no_transition');
  assert.deepEqual(path.sides.find(s=>s.startNode.id==='207')!.legs.map(l=>data.cables.find(c=>c.id===l.segmentId)!.legacyCableId),['152','151','150','148']);
  assert.equal(path.state,'partial');
});
test('28C Query, JourneySummary, current Lineage and overlay use the same exact graph projection',async()=>{
  const data=await current(), c152=cable(data,'152'), path=resolveCurrentFiberPath(data,c152.id,11);
  assert.equal(createEngineerQueryService(data).run('C152/F11 სად მიდის?').pathSignature,path.signature);
  assert.equal(data.fiberJourneySummaries?.find(j=>j.segmentId===c152.id&&j.fiberNumber===11)?.pathSignature,path.signature);
  assert.deepEqual([...transitionPathCableIds(data,c152.id,11)].sort(),[...new Set(path.sides.flatMap(s=>s.legs.map(l=>l.segmentId)))].sort());
  const lineage=lineageForFiber(data,c152.id,11)!; assert.equal(lineage.projectionRole,'current'); assert.equal(lineage.topologyRevision,path.topologyRevision);
  assert.deepEqual(lineage.transitions.map(t=>t.nodeFiberTransitionId).sort(),path.sides.flatMap(s=>s.transitions.map(t=>t.id)).sort());
});
test('28C all 2088 canonical Fibers have graph-verified current journeys',async()=>{
  const data=await current(); assert.equal(Object.keys(data.fiberPathProjection!.paths).length,2088); assert.equal(data.fiberJourneySummaries?.length,2088);
  assert.deepEqual(validateCurrentFiberPaths(data),[]); assert.equal(data.fiberPathProjection?.counts.sourceTransitionCoverage,100);
  const resolver=createCurrentFiberPathResolver(data);
  for(const p of Object.values(data.fiberPathProjection!.paths))for(const s of p.sides)if(s.stop.kind==='no_transition')assert.equal(resolver.matchingTransitions(s.stop.node,s.stop.segmentId,s.stop.fiberNumber).length,0);
});
test('28C F118 preserves the source gap at SC207 without inferring termination',async()=>{
  const data=await current(), path=resolveCurrentFiberPath(data,cable(data,'151').id,118);
  const stop=path.sides.find(s=>s.stop.node.id==='207')!;assert.equal(stop.stop.kind,'no_transition');assert.equal(stop.legs.length,1);assert.equal(path.state,'partial');
});
test('28C Port38 preserves exact SC225 termination and F32 preserves AP52',async()=>{
  const data=await current(), p38=resolveCurrentFiberPath(data,cable(data,'184').id,38),f32=resolveCurrentFiberPath(data,cable(data,'176').id,32);
  assert.ok(p38.sides.some(s=>s.stop.kind==='termination'&&s.stop.node.id==='225'&&s.legs.some(l=>l.segmentId===cable(data,'181').id&&l.fiberNumber===6)));
  assert.equal(createEngineerQueryService(data).run('Lentekhi Port38-ის გზა').pathSignature,p38.signature);
  assert.ok(f32.sides.some(s=>s.stop.kind==='port'&&s.stop.node.id==='52'&&s.legs.some(l=>l.segmentId===cable(data,'175').id&&l.fiberNumber===24)));
  assert.ok(f32.sides.every(s=>s.transitions.every(t=>t.node.id!=='218')&&s.legs.every(l=>l.segmentId!==cable(data,'173').id)));
});
test('28C SC211 nonidentity mapping remains C158/F65 to C159/F1',async()=>{
  const data=await current(),p=resolveCurrentFiberPath(data,cable(data,'158').id,65);
  assert.ok(p.sides.some(s=>s.transitions.some(t=>t.node.id==='211'&&t.from.fiberNumber===65&&t.to?.segmentId===cable(data,'159').id&&t.to.fiberNumber===1)));
});
test('28C display enrichment changes Cable naming without changing connectivity revision or path',async()=>{
  const data=await current(),c152=cable(data,'152'); assert.equal(getSegmentDisplayName(c152,data),'SC207 ↔ SC208 · 144F');
  const neutral={...data,networkNodes:data.networkNodes?.map(n=>n.id==='208'?{...n,assetType:'unknown' as const,displayName:'Node 208'}:n)};
  assert.equal(currentTopologyRevision(neutral),currentTopologyRevision(data));
  assert.equal(createCurrentFiberPathResolver(neutral).resolve(c152.id,11).signature,resolveCurrentFiberPath(data,c152.id,11).signature);
  assert.equal(getSegmentDisplayName(c152,neutral),'SC207 ↔ Node 208 · 144F');
});
test('28C physical adjacency alone does not provide a Fiber edge',async()=>{
  const data=await current(),empty={...data,nodeFiberTransitions:[],fiberPathProjection:undefined};
  assert.ok(createCurrentFiberPathResolver(empty).resolve(cable(data,'152').id,11).sides.every(s=>s.legs.length===1&&s.stop.kind==='no_transition'));
});
test('28C stale graph and summary revisions are rejected',async()=>{
  const data=await current(),p=resolveCurrentFiberPath(data,cable(data,'152').id,11);
  const stale={...data,nodeFiberTransitions:data.nodeFiberTransitions?.map(t=>t.id.includes('NFT-208-15797')?{...t,active:false}:t)};
  assert.ok(validateCurrentFiberPaths(stale,[p]).some(e=>e.includes('Stale topology revision')));
  const staleSummary={...data,fiberJourneySummaries:data.fiberJourneySummaries?.map(j=>j.segmentId===p.cableId&&j.fiberNumber===11?{...j,pathSignature:'old-cache'}:j)};
  assert.ok(validateCurrentFiberPaths(staleSummary,[p]).some(e=>e.includes('Stale JourneySummary')));
  const staleLineages={...data,currentFiberLineages:data.currentFiberLineages?.map(l=>({...l,topologyRevision:'old-cache'}))};
  assert.equal(lineageForFiber(staleLineages,p.cableId,11),undefined);
  assert.ok(validateCurrentFiberPaths(staleLineages,[p]).some(e=>e.includes('Stale current Lineage revision')));
});

test('28C resolver requires canonical Cable identity and a real starting endpoint',async()=>{
  const data=await current(),c152=cable(data,'152'),resolver=createCurrentFiberPathResolver(data);
  assert.throws(()=>resolver.resolve('C172',1),/exact canonical Cable/);
  assert.equal(lineageForFiber(data,'172',1),undefined);
  const selected=resolver.resolve(c152.id,11,c152.endpointB);assert.equal(selected.sides.length,1);assert.equal(selected.sides[0].startNode.id,c152.endpointB.id);
  assert.throws(()=>resolver.resolve(c152.id,11,{kind:'closure',id:'218'}),/not on selected Cable/);
});

test('28C exact cyclic local transitions stop on repeated canonical state',async()=>{
  const data=await current(),template=cable(data,'152'),edge=data.nodeFiberTransitions![0];
  const n=(id:string)=>({kind:'closure' as const,id});
  const cables=[{...template,id:'LOOP-A',endpointA:n('1'),endpointB:n('2')},{...template,id:'LOOP-B',endpointA:n('2'),endpointB:n('3')},{...template,id:'LOOP-C',endpointA:n('3'),endpointB:n('1')}];
  const side=(id:string)=>({...edge.a,segmentId:id,fiberNumber:1});
  const transitions=[{...edge,id:'LOOP-2',node:n('2'),a:side('LOOP-A'),z:side('LOOP-B')},{...edge,id:'LOOP-3',node:n('3'),a:side('LOOP-B'),z:side('LOOP-C')},{...edge,id:'LOOP-1',node:n('1'),a:side('LOOP-C'),z:side('LOOP-A')}].map(t=>({...t,active:true}));
  const synthetic={...data,cables,fibers:cables.map(c=>({...data.fibers[0],cableId:c.id,number:1})),nodeFiberTransitions:transitions,fiberPathProjection:undefined};
  const path=createCurrentFiberPathResolver(synthetic).resolve('LOOP-A',1);
  assert.ok(path.sides.every(s=>s.stop.kind==='loop'&&s.transitions.length===3));
});
test('28C ambiguity enumerates every exact alternative without a silent branch choice',async()=>{
  const data=await current(),c152=cable(data,'152'),edge=data.nodeFiberTransitions!.find(t=>t.id.includes('NFT-208-15797'))!;
  const branch=data.cables.find(c=>c.id!==c152.id&&c.id!==edge.z?.segmentId&&[c.endpointA,c.endpointB].some(n=>n.kind==='network_node'&&n.id==='208'))!;
  const alternate={...edge,id:'TEST-ALTERNATIVE',a:{...edge.a,segmentId:c152.id,fiberNumber:11},z:{...edge.a,segmentId:branch.id,fiberNumber:1}};
  const synthetic={...data,fiberPathProjection:undefined,nodeFiberTransitions:[...data.nodeFiberTransitions!,alternate]};
  const path=createCurrentFiberPathResolver(synthetic).resolve(c152.id,11);
  assert.equal(path.state,'ambiguous');assert.equal(path.sides.filter(s=>s.startNode.id==='208').length,2); assert.ok(path.sides.filter(s=>s.startNode.id==='208').every(s=>s.ambiguous));
  const unresolved={...alternate,id:'TEST-UNRESOLVED-ALTERNATIVE',z:null,transitionType:'ap_side_unresolved' as const};
  const withUnknown={...synthetic,nodeFiberTransitions:[...data.nodeFiberTransitions!,unresolved]};
  const alternatives=createCurrentFiberPathResolver(withUnknown).resolve(c152.id,11);
  assert.equal(alternatives.state,'ambiguous');assert.ok(alternatives.sides.some(s=>s.stop.kind==='unresolved_transition'&&s.stop.transitionIds.includes(unresolved.id)));
});
test('28C false termination and unsupported projection edges fail validation',async()=>{
  const data=await current(),path=structuredClone(resolveCurrentFiberPath(data,cable(data,'152').id,11));
  path.sides[1].stop.kind='termination';path.sides[1].stop.transitionIds=[];
  assert.ok(validateCurrentFiberPaths(data,[path]).some(e=>e.includes('False termination')));
  path.sides[1].transitions[0].id='UNSUPPORTED';assert.ok(validateCurrentFiberPaths(data,[path]).some(e=>e.includes('Unsupported path edge')));
});
test('28C reconciliation preserves exact source topology, Ports, conflicts, and Closure grammar evidence',async()=>{
  const before=applyIteration28B(applyIteration27D(await loadFrozenV1Reference()));
  const snapshot=JSON.stringify({cables:before.cables,fibers:before.fibers,transitions:before.nodeFiberTransitions,bindings:before.portTopologyBindings,conflicts:before.sourceConflicts,closureEvidence:before.networkNodes?.map(n=>n.closureEvidence),assignments:before.networkUseAssignments});
  const after=applyIteration28C(before);assert.equal(after.cables.length,37);assert.equal(after.fibers.length,2088);assert.equal(after.nodeFiberTransitions?.length,1629);
  assert.equal(JSON.stringify({cables:after.cables,fibers:after.fibers,transitions:after.nodeFiberTransitions,bindings:after.portTopologyBindings,conflicts:after.sourceConflicts,closureEvidence:after.networkNodes?.map(n=>n.closureEvidence),assignments:after.networkUseAssignments}),snapshot);
  assert.ok(after.fiberLineages?.every(l=>l.projectionRole==='historical'));
});
