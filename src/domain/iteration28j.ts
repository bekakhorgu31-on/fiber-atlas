import type {AssetRef,CableRoute,Inventory,Route} from './types';
import {buildNetworkTopologyProjection,topologyNodeKey,type NetworkTopologyProjection} from './networkTopology';
import {parseWorkspaceSelection,workspaceSelectionKey,type WorkspaceSelection} from './routeWorkspace';

export type WorkspaceRoute=Extract<Route,{view:'route'}>;
export type APRouteMode='physical'|'fiber';
export interface PhysicalContextPath {id:string;nodes:AssetRef[];segmentIds:string[]}
const asset=(value?:string):AssetRef|null=>{const parsed=parseWorkspaceSelection(value);return parsed&&'id'in parsed&&['aggregation','closure','ap','network_node','boundary'].includes(parsed.type)?{kind:parsed.type as AssetRef['kind'],id:parsed.id}:null;};
export function apWorkspaceTarget(data:Inventory,state:WorkspaceRoute):AssetRef|null {
 const selected=parseWorkspaceSelection(state.target);
 const ref=selected?.type==='port'&&selected.ownerType==='ap'?(data.accessPoints.some(a=>a.id===selected.ownerId)?{kind:'ap' as const,id:selected.ownerId}:{kind:'network_node' as const,id:selected.ownerId}):asset(state.target);
 return ref&&(ref.kind==='ap'&&data.accessPoints.some(a=>a.id===ref.id)||ref.kind==='network_node'&&data.networkNodes?.some(n=>n.id===ref.id&&n.assetType==='ap'))?ref:null;
}
export function apPortCount(data:Inventory,target:AssetRef):number {
 return target.kind==='ap'?data.accessPoints.find(a=>a.id===target.id)?.portCount??0:data.networkNodes?.find(n=>n.id===target.id)?.apEvidence?.capacity??0;
}
export function selectedAPPort(data:Inventory,target:AssetRef,state:WorkspaceRoute):number|null {
 const legacy=parseWorkspaceSelection(state.selection),number=state.port??(legacy?.type==='port'&&legacy.ownerType==='ap'&&legacy.ownerId===target.id?legacy.number:undefined);
 return number!==undefined&&Number.isInteger(number)&&number>=1&&number<=apPortCount(data,target)?number:null;
}
/** View-only simple paths in the physical projection. These never create optical edges. */
export function physicalContextPaths(projection:NetworkTopologyProjection,origin:AssetRef,target:AssetRef,limit=64):{paths:PhysicalContextPath[];truncated:boolean} {
 const from=topologyNodeKey(origin),to=topologyNodeKey(target),nodes=new Map(projection.nodes.map(n=>[n.key,n.ref])),paths:PhysicalContextPath[]=[],byNode=new Map<string,typeof projection.edges>();let truncated=false;
 for(const edge of projection.edges)for(const key of [edge.from,edge.to])byNode.set(key,[...(byNode.get(key)??[]),edge]);
 const visit=(at:string,keys:string[],segments:string[])=>{
  if(at===to){if(paths.length>=limit){truncated=true;return;}paths.push({id:segments.join('~'),nodes:keys.map(k=>nodes.get(k)!),segmentIds:segments});return;}
  for(const edge of byNode.get(at)??[]){if(truncated)return;const next=edge.from===at?edge.to:edge.from;if(!keys.includes(next))visit(next,[...keys,next],[...segments,edge.cableId]);}
 };
 if(nodes.has(from)&&nodes.has(to))visit(from,[from],[]);
 return{paths,truncated};
}
export function apPhysicalContext(data:Inventory,target:AssetRef,route:CableRoute,originKey?:string,pathId?:string) {
 const projection=buildNetworkTopologyProjection(data),component=projection.components.find(c=>c.nodeKeys.includes(topologyNodeKey(target)));
 const origins=projection.nodes.filter(n=>n.ref.kind==='aggregation'&&component?.nodeKeys.includes(n.key)).map(n=>n.ref);
 const requested=asset(originKey),established=route.origin.state==='known'&&route.origin.asset.kind==='aggregation'?route.origin.asset:null;
 const valid=(ref:AssetRef|null):ref is AssetRef=>!!ref&&origins.some(o=>topologyNodeKey(o)===topologyNodeKey(ref));
 const origin=originKey?(valid(requested)?requested:null):valid(established)?established:origins.length===1?origins[0]:null;
 const enumerated=origin?physicalContextPaths(projection,origin,target):{paths:[],truncated:false};
 const selected=pathId?enumerated.paths.find(p=>p.id===pathId)??null:enumerated.paths[0]??null;
 return{projection,origins,origin,paths:enumerated.paths,path:selected,truncated:enumerated.truncated,invalidChoice:!!originKey&&!origin||!!pathId&&!selected};
}
export function apWorkspaceRoute(base:WorkspaceRoute,target:AssetRef,origin:AssetRef|null,changes:Partial<Omit<WorkspaceRoute,'view'|'id'|'target'|'selection'|'origin'>>={}):WorkspaceRoute {
 const key=workspaceSelectionKey({type:target.kind==='ap'?'ap':'network_node',id:target.id});
 return{...base,target:key,selection:key,origin:origin?topologyNodeKey(origin):base.origin,...changes};
}
export function inspectedAPObject(state:WorkspaceRoute,target:AssetRef,port:number|null):WorkspaceSelection {
 return parseWorkspaceSelection(state.inspect)??(port!==null?{type:'port',ownerType:'ap',ownerId:target.id,number:port}:{type:target.kind==='ap'?'ap':'network_node',id:target.id});
}
