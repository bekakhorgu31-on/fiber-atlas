import test from 'node:test';
import assert from 'node:assert/strict';
import {repository} from '../src/data/repository';
import {apPhysicalContext,apWorkspaceRoute,apWorkspaceTarget,selectedAPPort,inspectedAPObject,physicalContextPaths,type WorkspaceRoute} from '../src/domain/iteration28j';
import {portOperationalView} from '../src/domain/iteration28g';
import {parseRoute,routeHash} from '../src/domain/navigation';
import {orderedJourneySteps} from '../src/domain/iteration28i';
import {resolveCurrentFiberPath} from '../src/domain/currentFiberPath';
import {createEngineerQueryService} from '../src/domain/engineerQuery';
const ready=repository.load();
test('28J explicit AP destination survives Port selection and separate node/Cable inspection',async()=>{
 const data=await ready,route=data.cableRoutes![0],target={kind:'network_node' as const,id:'42'};
 const selectedOnly:WorkspaceRoute={view:'route',id:route.id,selection:'port:ap:42:1'};assert.equal(apWorkspaceTarget(data,selectedOnly),null);
 const legacy:WorkspaceRoute={...selectedOnly,target:'port:ap:42:1'};
 assert.deepEqual(apWorkspaceTarget(data,legacy),target);assert.equal(selectedAPPort(data,target,legacy),1);
 const state=apWorkspaceRoute(legacy,target,{kind:'aggregation',id:'5'},{port:1,mode:'fiber',inspect:'network_node:208',overview:true});
 assert.deepEqual(apWorkspaceTarget(data,state),target);assert.equal(selectedAPPort(data,target,state),1);assert.deepEqual(inspectedAPObject(state,target,1),{type:'network_node',id:'208'});
 assert.deepEqual(parseRoute(routeHash(state)),state);
 const cableState={...state,inspect:'segment:152'};assert.deepEqual(apWorkspaceTarget(data,cableState),target);assert.equal(selectedAPPort(data,target,{...state,port:25}),null);
});
test('28J physical AP42 context uses all typed Cable endpoints, independently of Fiber gaps',async()=>{
 const data=await ready,target={kind:'network_node' as const,id:'42'},context=apPhysicalContext(data,target,data.cableRoutes![0]);
 assert.ok(context.origin);assert.deepEqual(context.path!.nodes.map(n=>n.id),['5','205','206','207','208','42']);
 assert.deepEqual(context.path!.segmentIds.map(id=>data.cables.find(c=>c.id===id)!.legacyCableId),['148','150','151','152','153']);
 const p=portOperationalView(data,'ap','42',16,false),path=resolveCurrentFiberPath(data,p.segmentId!,p.fiberNumber!),steps=orderedJourneySteps(data,path).flat();
 assert.deepEqual(steps.map(s=>s.node.id),['207','208','42']);assert.equal(steps[0].stopKind,'no_transition');assert.equal(steps[1].remap,'C152/F118 → C153/F16');
 assert.ok(!path.sides.flatMap(s=>s.legs).some(l=>['148','150','151'].includes(data.cables.find(c=>c.id===l.segmentId)!.legacyCableId)));
});
test('28J explicit origin/path selection rejects unreachable choices and preserves alternatives',async()=>{
 const data=await ready,target={kind:'network_node' as const,id:'42'},context=apPhysicalContext(data,target,data.cableRoutes![0]);
 assert.ok(context.origins.length>1);const alternative=context.origins.find(o=>o.id!==context.origin!.id)!;
 const changed=apPhysicalContext(data,target,data.cableRoutes![0],`${alternative.kind}:${alternative.id}`);assert.deepEqual(changed.origin,alternative);assert.equal(changed.path!.nodes[0].id,alternative.id);
 assert.equal(apPhysicalContext(data,target,data.cableRoutes![0],'aggregation:missing').invalidChoice,true);
 assert.equal(apWorkspaceRoute({view:'route',id:data.cableRoutes![0].id,origin:'aggregation:missing'},target,null).origin,'aggregation:missing','invalid explicit origin stays visible until the user chooses another');
 assert.equal(apPhysicalContext(data,target,data.cableRoutes![0],undefined,'missing').invalidChoice,true);
 const projected={...context.projection,edges:[...context.projection.edges,{...context.projection.edges.find(e=>e.cableId===context.path!.segmentIds[0])!,id:'parallel',cableId:'parallel'}]};
 const paths=physicalContextPaths(projected,context.origin!,target);assert.ok(paths.paths.length>context.paths.length);assert.ok(paths.paths.some(p=>p.segmentIds.includes('parallel')));
});
test('28J raw occupancy and translated labels agree while Fiber use remains independent',async()=>{
 const data=await ready,s=createEngineerQueryService(data);
 const unknown=data.apPorts!.find(p=>p.apNumber===47&&p.occupancy==='unknown')!;
 for(const [ap,number,state]of [['42',1,'in_use'],['42',2,'unused'],['42',3,'in_use'],['47',unknown.number,'unknown']] as const){
  const view=portOperationalView(data,'ap',ap,number,false);assert.equal(view.occupancyState,state);const result=s.search(`AP${ap} Port${number}`)[0];assert.ok(result.facts?.includes(view.occupancy));
 }
 assert.equal(portOperationalView(data,'ap','42',1,false).usageState,'review_required');
});
test('28J Port1 display reaches aggregation without inventing an aggregation Port',async()=>{
 const data=await ready,p=portOperationalView(data,'ap','42',1,false),path=resolveCurrentFiberPath(data,p.segmentId!,p.fiberNumber!),steps=orderedJourneySteps(data,path).flat();
 assert.deepEqual(steps.map(s=>s.node.id),['5','205','206','207','208','42']);assert.equal(steps[0].stopKind,'no_transition');assert.equal(steps[4].remap,'C152/F103 → C153/F01');assert.equal(path.sides.find(s=>s.stop.node.kind==='aggregation')?.stop.portBindingId,null);
});
