import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {repository,loadIteration28KReference} from '../src/data/repository';
import {createCurrentFiberPathResolver,type CurrentFiberPath} from '../src/domain/currentFiberPath';
import {orderedJourneySteps,visibleJourneyGroups,operatorSearchCard,hasConstructionConflict,type RouteStep} from '../src/domain/iteration28i';
import {createEngineerQueryService} from '../src/domain/engineerQuery';
const ready=repository.load();
test('28I construction conflict is visible only for its source-affected Fiber range',async()=>{
 const data=await ready,c=data.cables.find(c=>c.legacyCableId==='148')!;assert.equal(hasConstructionConflict(data,c.id),true);assert.equal(hasConstructionConflict(data,c.id,121),true);assert.equal(hasConstructionConflict(data,c.id,192),true);assert.equal(hasConstructionConflict(data,c.id,120),false);assert.equal(hasConstructionConflict(data,data.cables.find(c=>c.legacyCableId==='184')!.id),false);
});

test('28I performance indexing preserves complete authoritative derived projections',async()=>{
 // Historical performance preservation; current authorized deltas are verified by 28L.
 const data=await loadIteration28KReference(),before=JSON.parse(readFileSync('docs/iteration28i-projection-before.json','utf8'));
 for(const [key,hash]of Object.entries(before.hashes))assert.equal(createHash('sha256').update(JSON.stringify(data[key as keyof typeof data])).digest('hex'),hash,key);
});
test('28I Port38 display follows ordered graph steps, remap and termination',async()=>{
 const data=await ready,c=data.cables.find(c=>c.legacyCableId==='184')!,resolver=createCurrentFiberPathResolver(data),path=resolver.resolve(c.id,38);
 const [steps]=orderedJourneySteps(data,path);
 assert.deepEqual(steps.map(s=>s.node.id),['AGG-LENTEKHI','224','225']);
 assert.match(steps[0].label,/Port 38/);assert.equal(steps[1].remap,'C184/F38 → C181/F06');assert.equal(steps[2].stopKind,'termination');
 assert.deepEqual(steps.slice(0,2).map(s=>s.legAfter?.fiberNumber),[38,6]);
 assert.equal(resolver.resolve(c.id,38).signature,path.signature);
});
test('28I F118 gap and F11 remaps remain visible',async()=>{
 const data=await ready,r=createCurrentFiberPathResolver(data),c151=data.cables.find(c=>c.legacyCableId==='151')!,c152=data.cables.find(c=>c.legacyCableId==='152')!;
 const gap=orderedJourneySteps(data,r.resolve(c151.id,118)).flat().find(s=>s.node.id==='207');assert.equal(gap?.stopKind,'no_transition');
 const steps=orderedJourneySteps(data,r.resolve(c152.id,11)).flat();assert.ok(steps.some(s=>s.remap));assert.ok(steps.some(s=>s.node.id==='49'));assert.ok(steps.some(s=>s.remap?.includes('F11')));
});
test('28I loop display retains non-adjacent repeated nodes and explicit stop',async()=>{
 const data=await ready,c=data.cables.find(c=>c.legacyCableId==='184')!,base=createCurrentFiberPathResolver(data).resolve(c.id,38),side=base.sides.find(s=>s.transitions.length>0)!;
 const transition=side.transitions[0],a=transition.node,b={kind:'closure' as const,id:'225'};
 const loop:CurrentFiberPath={...base,sides:[{...side,startNode:a,transitions:[transition,{...transition,node:b},{...transition,node:a}],stop:{...side.stop,node:a,kind:'loop'}}]};
 const [steps]=orderedJourneySteps(data,loop);assert.deepEqual(steps.map(s=>s.node.id),['224','225','224']);assert.equal(steps.at(-1)?.stopKind,'loop');
});
test('28I compressed middles retain remaps, stops and exact omitted counts',()=>{
 const steps:RouteStep[]=Array.from({length:14},(_,i)=>({node:{kind:'closure',id:String(i)},label:String(i),remap:i===6?'F1 → F2':null,stopKind:i===13?'termination':null,stopLabel:null,legAfter:null}));
 const groups=visibleJourneyGroups(steps,8,false),visible=groups.filter(g=>'index'in g).map(g=>g.index);
 assert.ok(visible.includes(6));assert.ok(visible.includes(8));assert.ok(visible.includes(13));assert.equal(groups.reduce((n,g)=>n+('count'in g?g.count:1),0),14);
 assert.equal(visibleJourneyGroups(steps,8,true).length,14);
});
test('28I exact AP search has one primary object; Cable collisions remain distinct',async()=>{
 const data=await ready,s=createEngineerQueryService(data);assert.equal(s.search('AP42').length,1);assert.equal(s.search('AP42')[0].id,'node:42');assert.equal(s.search('AP42 Port1')[0].category,'Port');
 assert.equal(s.search('C172').filter(r=>r.category==='Cable').length,2);
 const card=operatorSearchCard(data,s.search('C158')[0]);assert.match(card.title,/C158.*SC210.*SC211/);assert.deepEqual(card.facts,[]);assert.match(card.subtitle,/96 ჟილა/);
});

