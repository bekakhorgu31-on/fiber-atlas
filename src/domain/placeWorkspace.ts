import type { AssetRef, Inventory, Route, SourceRef } from './types';
import { currentAssetLabel, nodeKey } from './currentFiberPath';
import { getSegmentDisplayName } from './network';
import { parseWorkspaceSelection, workspaceSelectionKey, type WorkspaceSelection } from './routeWorkspace';
import type {EngineerAnswer} from './engineerQuery';

export type PlaceState = Extract<Route, {view:'place'}>;
export interface PlaceEntry {key:string; ref:AssetRef; label:string; detail:string; sources:string[]}
/** Source identity uses provenance/membership, never a public AP number or filename. */
export function placeSourceIds(data:Inventory,id:string,source?:SourceRef,kind?:AssetRef['kind']|'segment'):string[] {
  return (data.sourceDocuments??[]).filter(d=>source?.documentId===d.id || source?.sourceRevision===d.id+'/'+d.sourceSha256 || !!source?.sourceSha256&&source.sourceSha256===d.sourceSha256 || (d.importedAssetIds.includes(id)||!!kind&&d.importedAssetIds.includes(kind+':'+id))).map(d=>d.id);
}
export function placeInventory(data:Inventory):PlaceEntry[] {
  const nodes=new Map<string,PlaceEntry>();
  const add=(ref:AssetRef,source?:SourceRef,detail='')=>{const key=nodeKey(ref),old=nodes.get(key);nodes.set(key,{key,ref,label:currentAssetLabel(data,ref),detail:detail||old?.detail||'',sources:[...new Set([...(old?.sources??[]),...placeSourceIds(data,ref.id,source,ref.kind)])]});};
  for(const n of data.networkNodes??[])add({kind:'network_node',id:n.id},n.source,n.apEvidence?.place??'');
  for(const a of data.accessPoints)add({kind:'ap',id:a.id},a.source,a.name);
  for(const c of data.closures)add({kind:'closure',id:c.id},c.source);
  for(const a of data.aggregations)add({kind:'aggregation',id:a.id},a.source,a.name);
  for(const o of data.odfs??[])add(o.containedBy,o.source);
  for(const c of data.cables)for(const ref of [c.endpointA,c.endpointB]){add(ref,c.source);const p=nodes.get(nodeKey(ref))!;p.sources=[...new Set([...p.sources,...placeSourceIds(data,c.id,c.source,'segment')])];}
  return [...nodes.values()].sort((a,b)=>a.label.localeCompare(b.label,undefined,{numeric:true})||a.key.localeCompare(b.key));
}
export function localNeighborhood(data:Inventory,focus:string,expanded:string[]=[],limit=16) {
  const places=placeInventory(data),byKey=new Map(places.map(p=>[p.key,p]));
  const allowed=new Set([focus,...expanded.slice(0,8)]),all=data.cables.filter(c=>allowed.has(nodeKey(c.endpointA))||allowed.has(nodeKey(c.endpointB)));
  const cables=all.slice(0,Math.max(1,Math.min(64,limit))),keys=new Set([focus,...cables.flatMap(c=>[nodeKey(c.endpointA),nodeKey(c.endpointB)])]);
  return {places:[...keys].map(k=>byKey.get(k)).filter((p):p is PlaceEntry=>!!p),cables,total:all.length,remaining:Math.max(0,all.length-cables.length)};
}
export function portNode(data:Inventory,ownerType:'ap'|'odf',ownerId:string):AssetRef|undefined {
  if(ownerType==='odf')return data.odfs?.find(o=>o.id===ownerId)?.containedBy;
  return data.apPorts?.find(p=>p.canonicalNode.id===ownerId)?.canonicalNode??data.portTopologyBindings?.find(b=>b.ownerType===ownerType&&b.ownerId===ownerId)?.canonicalNode??placeInventory(data).find(p=>p.ref.id===ownerId&&p.ref.kind==='ap')?.ref;
}
export function placeForSelection(data:Inventory,selection:WorkspaceSelection):string|undefined {
  if(selection.type==='fiber'||selection.type==='tube'||selection.type==='segment'){
    const id='cableId'in selection?selection.cableId:selection.id,c=data.cables.find(c=>c.id===id);return c?nodeKey(c.endpointA):undefined;
  }
  if(selection.type==='port'){const node=portNode(data,selection.ownerType,selection.ownerId);return node&&nodeKey(node);}
  return 'id'in selection?placeInventory(data).find(p=>p.key===selection.type+':'+selection.id)?.key:undefined;
}
export function focusedSelectionRoute(data:Inventory,selection:WorkspaceSelection,base?:PlaceState):PlaceState {
  return {...base,view:'place',focus:base?.focus??placeForSelection(data,selection),selection:workspaceSelectionKey(selection)};
}
/** Adapt old object links, leaving explicit advanced Route workspaces intact. */
export function placeNavigationTarget(data:Inventory,route:Route):Route {
  let s:WorkspaceSelection|undefined;
  if(route.view==='fiber'||route.view==='trace')s={type:'fiber',cableId:route.cableId,number:route.fiber};
  if(route.view==='cable')s={type:'segment',id:route.id};
  if(['ap','aggregation','closure'].includes(route.view)&&'id'in route)s={type:route.view as 'ap'|'aggregation'|'closure',id:route.id};
  if(route.view==='odf_port')s={type:'port',ownerType:'odf',ownerId:route.odfId,number:route.port};
  if(route.view==='route'&&route.selection&&!route.overview&&(!route.target||/^(port|fiber):/.test(route.target))&&!route.physicalPath){const candidate=parseWorkspaceSelection(route.selection);if(candidate)return focusedSelectionRoute(data,candidate);}
  return s?focusedSelectionRoute(data,s):route;
}
export const cableFinderText=(data:Inventory,id:string)=>{const c=data.cables.find(c=>c.id===id)!;return getSegmentDisplayName(c,data)+' '+c.legacyCableId+' '+c.legacyLabels.join(' ');};

/** A question opens one exact selected strand, never combines several result journeys. */
export function questionJourney(data:Inventory,answer:EngineerAnswer|null):{cableId:string;fiberNumber:number}|null {
  if(!answer||answer.state==='disambiguation')return null;
  const candidates=new Map<string,{cableId:string;fiberNumber:number}>();
  const add=(cableId:string,fiberNumber:number)=>candidates.set(cableId+':'+fiberNumber,{cableId,fiberNumber});
  for(const result of answer.results){
    if(result.id.startsWith('port-binding:')){const b=data.portTopologyBindings?.find(b=>b.id===result.id.slice(13));if(b)add(b.segmentId,b.fiberNumber);}
    const selected=parseWorkspaceSelection(result.id);if(selected?.type==='fiber')add(selected.cableId,selected.number);
  }
  for(const r of answer.actions){
    if(r.view==='fiber'||r.view==='trace')add(r.cableId,r.fiber);
    if(r.view==='route'){const s=parseWorkspaceSelection(r.selection);if(s?.type==='fiber')add(s.cableId,s.number);if(s?.type==='port'){const b=data.portTopologyBindings?.find(b=>b.ownerType===s.ownerType&&b.ownerId===s.ownerId&&b.portNumber===s.number);if(b)add(b.segmentId,b.fiberNumber);}}
  }
  return candidates.size===1?[...candidates.values()][0]:null;
}
