import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from './fixtures/shida-ap16-ap17-source.json';
import type {Inventory} from '../src/domain/types';
import {createCurrentFiberPathResolver} from '../src/domain/currentFiberPath';
import {createEngineerQueryService} from '../src/domain/engineerQuery';
import {portOperationalView,compactSearchResult} from '../src/domain/iteration28g';
import {buildNetworkTopologyProjection} from '../src/domain/networkTopology';
import {selectedTopologyExpansion} from '../src/views/NetworkTopologyCanvas';

// Reduced from the actual full-source proposal, SHA e417131f…; printed banks
// and real strokes 12539/12809 establish AP16 F1, not a synthetic offset rule.
const load=()=>structuredClone(fixture) as unknown as Inventory;
for(const number of [13,14,24]) test(`33 source AP16 Port${number} reaches AP17 at SC25017`,()=>{
 const data=load(),c=data.cables.find(c=>c.legacyCableId==='25-123')!,fiber=data.fibers.find(f=>f.cableId===c.id&&f.number===number)!;
 const path=createCurrentFiberPathResolver(data).resolve(c.id,number);
 assert.equal(path.state,'exact');
 const ends=path.sides.map(s=>data.portTopologyBindings!.find(b=>b.id===s.stop.portBindingId)!);
 assert.deepEqual(ends.map(b=>data.networkNodes!.find(n=>n.id===b.ownerId)!.apEvidence!.number).sort(),[16,17]);
 assert.ok(ends.every(b=>b.portNumber===number));
 assert.ok(path.sides.flatMap(s=>s.transitions).every(t=>data.networkNodes!.find(n=>n.id===t.node.id)!.displayName==='SC25017'));
 assert.ok(path.sides.flatMap(s=>s.legs).every(l=>data.cables.find(c=>c.id===l.segmentId)!.legacyCableId!=='25-122'));
 assert.equal(fiber.physicalColor.key,number===13?'blue':number===14?'orange':'aqua');
 assert.equal(fiber.tubeId,null);
});
test('33 route ordering and matching colors cannot restore a missing local transition',()=>{
 const data=load(),c=data.cables.find(c=>c.legacyCableId==='25-123')!;
 data.nodeFiberTransitions=[];
 const path=createCurrentFiberPathResolver(data).resolve(c.id,24);
 assert.equal(path.state,'partial');assert.equal(path.sides.flatMap(s=>s.transitions).length,0);
 assert.ok(path.sides.every(s=>s.legs.every(l=>l.segmentId===c.id)));
});
test('33 scoped AP Port view uses canonical node and preserves unknown occupancy',()=>{
 const data=load(),node=data.networkNodes!.find(n=>n.apEvidence?.number===16)!;
 const view=portOperationalView(data,'ap',node.id,1);
 assert.equal(view.fiberNumber,1);assert.equal(view.fiberColor,'ლურჯი');assert.equal(view.occupancyState,'unknown');
 assert.equal(portOperationalView(data,'ap','16',1).bindingId,null);
 const service=createEngineerQueryService(data);
 assert.equal(service.search('AP16')[0].id,'node:'+node.id);
 const results=service.search('AP16 Port1');assert.equal(results.length,1);assert.match(results[0].subtitle,/F1/);
 assert.equal(service.run('AP16 Port1').state,'exact');
 assert.match(compactSearchResult(data,service.search('AP16')[0]).subtitle,/24 Ports/);
 assert.ok(service.search('SC25017').some(r=>r.category==='Closure'));
});
test('33 AP16 Port1 local blue Fiber remains partial at SC25017 instead of borrowing F13 branch',()=>{
 const data=load(),c=data.cables.find(c=>c.legacyCableId==='25-123')!,path=createCurrentFiberPathResolver(data).resolve(c.id,1);
 assert.equal(path.state,'partial');assert.equal(path.sides.flatMap(s=>s.transitions).length,0);
 assert.equal(path.sides.filter(s=>s.stop.kind==='port').length,1);
 assert.ok(path.sides.some(s=>s.stop.kind==='no_transition'&&data.networkNodes!.find(n=>n.id===s.stop.node.id)?.displayName==='SC25017'));
});
test('33 AP numbers shared by regions produce choices without merging Port owners',()=>{
 const data=load(),original=data.networkNodes!.find(n=>n.apEvidence?.number===16)!,other={...structuredClone(original),id:'OTHER-REGION-AP16',displayName:'AP16 · other region'};
 data.networkNodes!.push(other);
 const b={...data.portTopologyBindings!.find(b=>b.ownerId===original.id&&b.portNumber===1)!,id:'OTHER-BINDING',ownerId:other.id,canonicalNode:{kind:'network_node' as const,id:other.id}};
 data.portTopologyBindings!.push(b);
 const service=createEngineerQueryService(data);
 assert.equal(service.search('AP16').length,2);assert.equal(service.search('AP16 Port1').length,2);
 assert.equal(service.run('AP16 Port1').state,'disambiguation');
});
test('33 collapsed mobile physical tree reveals selected branch without selecting the core edge',()=>{
 const data=load(),projection=buildNetworkTopologyProjection(data),optical=new Set(data.cables.filter(c=>['25-123','25-124'].includes(c.legacyCableId)).map(c=>c.id));
 const expanded=selectedTopologyExpansion(projection,optical);
 for(const edge of projection.edges.filter(e=>optical.has(e.id))){assert.ok(expanded.has(edge.from));assert.ok(expanded.has(edge.to));}
 assert.ok(!optical.has(data.cables.find(c=>c.legacyCableId==='25-122')!.id));
});
