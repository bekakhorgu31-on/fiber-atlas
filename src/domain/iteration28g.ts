import type { Inventory, PortTopologyBinding, SearchResult } from './types';
import { createCurrentFiberPathResolver, currentAssetLabel, currentTopologyRevision, type CurrentFiberPath } from './currentFiberPath';
import { routeWithSelection } from './routeWorkspace';
import { segmentContinuationGroups, tubeContinuationSummary } from './cableContinuity';

export const PORT_OPERATIONAL_VIEW_RULE = 'port-operational-view-exact-binding/1';
export type FiberUseState = 'in_use' | 'unused' | 'review_required' | 'unknown';
export interface PortOperationalView {
  portId: string; ownerType: PortTopologyBinding['ownerType']; ownerId: string; portNumber: number;
  bindingId: string | null; segmentId: string | null; legacyCableId: string | null; fiberNumber: number | null;
  tubeNumber: number | null; tubeColor: string | null; fiberColor: string | null;
  usageState: FiberUseState | null; organization: string | null; purpose: string | null;
  occupancyState: 'in_use' | 'unused' | 'unknown'; occupancy: string; pathSummary: string | null; evidenceStatus: string;
}

const color = (c: { nameKa: string | null; nameEn: string | null } | null | undefined) => c?.nameKa ?? c?.nameEn ?? null;
const status = (v: string | undefined) => v === 'in_use' ? 'გამოყენებაშია' : v === 'unused' ? 'გამოუყენებელი' : v === 'review_required' ? 'გადასამოწმებელია' : 'გამოყენება დაუდგენელია';
const usageLabel=(state:string|undefined,organization?:string|null)=>state==='in_use'&&!organization?'გამოყენებაშია · მომხმარებელი დაუდგენელია':organization?`${organization} · ${status(state)}`:status(state);
const endpointLabel = (data: Inventory, node: { kind: string; id: string }) => currentAssetLabel(data, node as Parameters<typeof currentAssetLabel>[1]);
const resolverCache = new WeakMap<Inventory, ReturnType<typeof createCurrentFiberPathResolver>>();
function currentResolver(data: Inventory) {
  const revision = currentTopologyRevision(data), cached = resolverCache.get(data);
  if (cached?.revision === revision) return cached;
  const resolver = createCurrentFiberPathResolver(data);
  resolverCache.set(data, resolver);
  return resolver;
}
const fiberLabel = (data: Inventory, segmentId: string, number: number) => `C${data.cables.find(c => c.id === segmentId)?.legacyCableId ?? segmentId}/F${number}`;
function orderedPath(data: Inventory, path: CurrentFiberPath): string {
  type Point = { key: string; label: string };
  const key = (node: {kind:string;id:string}) => `${node.kind}:${node.id}`;
  const stopPoint = (side: CurrentFiberPath['sides'][number]): Point => {
    const stop=side.stop, port=stop.kind==='port'?data.portTopologyBindings?.find(p=>p.id===stop.portBindingId):undefined;
    const suffix=port?` / Port ${port.portNumber}`:stop.kind==='termination'?' / აქ მთავრდება':stop.kind==='no_transition'||stop.kind==='unresolved_transition'?' / გაგრძელება დაუდგენელია':'';
    return {key:key(stop.node),label:currentAssetLabel(data,stop.node)+suffix};
  };
  const renderSide = (side: CurrentFiberPath['sides'][number], reverse: boolean): Point[] => {
    const transitions=(reverse?side.transitions.slice().reverse():side.transitions).map(t=>{
      const from=reverse?t.to:t.from,to=reverse?t.from:t.to;
      const mapping=from&&to?` (${fiberLabel(data,from.segmentId,from.fiberNumber)} → ${fiberLabel(data,to.segmentId,to.fiberNumber)})`:'';
      return {key:key(t.node),label:currentAssetLabel(data,t.node)+mapping};
    });
    const start={key:key(side.startNode),label:currentAssetLabel(data,side.startNode)};
    return reverse?[stopPoint(side),...transitions,start]:[start,...transitions,stopPoint(side)];
  };
  const originIndex = path.sides.findIndex(s => s.stop.kind === 'port' && s.stop.node.kind === 'aggregation');
  const firstIndex = originIndex >= 0 ? originIndex : 0;
  const raw=[...(path.sides[firstIndex]?renderSide(path.sides[firstIndex],true):[]),...path.sides.filter((_,i)=>i!==firstIndex).flatMap(side=>renderSide(side,false))];
  const ordered:Point[]=[];
  for(const point of raw){const previous=ordered.at(-1);if(previous?.key===point.key){if(point.label.length>previous.label.length)ordered[ordered.length-1]=point;}else ordered.push(point);}
  const labels=ordered.map(point=>point.label);
  if(labels.length <= 8) return labels.join(' → ');
  return [...labels.slice(0,3),'…',...labels.slice(-3)].join(' → ');
}

/** One derived presentation record; only an exact PortTopologyBinding supplies Fiber identity. */
export function portOperationalView(data: Inventory, ownerType: PortTopologyBinding['ownerType'], ownerId: string, portNumber: number, includePath = true): PortOperationalView {
  const matches = (data.portTopologyBindings ?? []).filter(b => b.ownerType === ownerType && b.ownerId === ownerId && b.portNumber === portNumber);
  const binding = matches.length === 1 ? matches[0] : null;
  const cable = binding && data.cables.find(c => c.id === binding.segmentId);
  const fiber = binding && data.fibers.find(f => f.cableId === binding.segmentId && f.number === binding.fiberNumber);
  const tube = fiber && data.tubes.find(t => t.id === fiber.tubeId);
  const use = binding && data.fiberUsageProjection?.localViews.find(v => v.segmentId === binding.segmentId && v.fiberNumber === binding.fiberNumber);
  let occupancyState:PortOperationalView['occupancyState']='unknown';
  if(ownerType==='ap'){
    const p=data.apPorts?.find(x=>(x.canonicalNode?x.canonicalNode.id===ownerId:String(x.apNumber)===ownerId)&&x.number===portNumber);
    const sourceState=p?.occupancy??data.apPortFlows?.find(p=>p.accessPointId===ownerId&&p.portNumber===portNumber)?.physicalUsage;
    occupancyState=sourceState==='in_use'||sourceState==='unused'?sourceState:'unknown';
  }
  if (ownerType === 'odf') {
    const p = data.odfPorts?.find(x => x.odfId === ownerId && x.number === portNumber);
    occupancyState=p?.physicalOccupancy==='empty'?'unused':p?.physicalOccupancy&&p.physicalOccupancy!=='unknown'?'in_use':'unknown';
  }
  const occupancy=occupancyState==='in_use'?'დაკავებულია წყაროში':occupancyState==='unused'?'ცარიელია წყაროში':'პორტის ფიზიკური სტატუსი წყაროდან არ არის დადგენილი';
  let pathSummary: string | null = null;
  if (binding && includePath) {
    pathSummary = orderedPath(data, currentResolver(data).resolve(binding.segmentId, binding.fiberNumber));
  }
  return { portId: `${ownerType}:${ownerId}:${portNumber}`, ownerType, ownerId, portNumber,
    bindingId: binding?.id ?? null, segmentId: binding?.segmentId ?? null, legacyCableId: cable?.legacyCableId ?? null,
    fiberNumber: binding?.fiberNumber ?? null, tubeNumber: tube?.number ?? binding?.tubeNumber ?? null,
    tubeColor: color(tube?.physicalColor) ?? color(binding?.tubeColor), fiberColor: color(fiber?.physicalColor) ?? color(binding?.fiberColor),
    usageState: binding ? (use?.usageState ?? 'unknown') : null, organization: use?.organization ?? null, purpose: use?.purpose ?? null,
    occupancyState, occupancy, pathSummary, evidenceStatus: matches.length > 1 ? 'Exact Port binding is ambiguous.' : binding ? 'Fiber identity comes from exact PortTopologyBinding.' : 'Exact Port-to-Fiber binding is not established.' };
}

export function portOperationalLabel(view: PortOperationalView) {
  if (!view.bindingId) return `Port ${view.portNumber} · მიბმა დაუდგენელია`;
  const identity = `C${view.legacyCableId}/F${view.fiberNumber}`;
  const use = usageLabel(view.usageState ?? undefined,view.organization);
  return `${identity} · ${use}`;
}

export function portOperationalRoute(view: PortOperationalView, data?: Inventory) {
  if(view.segmentId&&view.fiberNumber)return {view:'fiber' as const,cableId:view.segmentId,fiber:view.fiberNumber};
  if(view.ownerType==='ap')return data?.networkNodes?.some(n=>n.id===view.ownerId&&n.assetType==='ap')&&data.cableRoutes?.[0]
    ? {...routeWithSelection(data.cableRoutes[0].id,{type:'network_node',id:view.ownerId}),target:`network_node:${view.ownerId}`}
    : {view:'ap' as const,id:view.ownerId};
  return {view:'odf_port' as const,odfId:view.ownerId,port:view.portNumber};
}

export function compactPath(data: Inventory, segmentId: string, fiberNumber: number) {
  return orderedPath(data, currentResolver(data).resolve(segmentId, fiberNumber));
}

export function compactSearchResult(data: Inventory, result: SearchResult): SearchResult {
  if(result.compactFormatted) return result;
  return {...formatCompactSearchResult(data,result),compactFormatted:true};
}

export function compactRouteAction(data: Inventory, result: SearchResult): string {
  if(result.route.view==='organization')return result.route.strand?'ჟილის გზის ჩვენება':'ქსელის გამოყენების ჩვენება';
  if(result.category==='Organization'&&result.route.view==='engineer')return 'საინჟინრო პასუხის ნახვა';
  return result.category==='Tube'&&result.route.view==='fiber'
    ? `ნიმუში Fiber ${fiberLabel(data,result.route.cableId,result.route.fiber)} გახსენი`
    : 'Route-ზე ნახვა';
}

function formatCompactSearchResult(data: Inventory, result: SearchResult): SearchResult {
  const facts = [...(result.facts ?? [])];
  const fiber = /^fiber:([^:]+):(\d+)$/.exec(result.id);
  if (fiber) {
    const segmentId = fiber[1], number = Number(fiber[2]), cable = data.cables.find(c => c.id === segmentId), f = data.fibers.find(x => x.cableId === segmentId && x.number === number), tube = f && data.tubes.find(t => t.id === f.tubeId), use = data.fiberUsageProjection?.localViews.find(v => v.segmentId === segmentId && v.fiberNumber === number);
    if (cable && f) { const path = compactPath(data, segmentId, number); return { ...result, subtitle: `Tube ${tube?.number ?? '?'} · ${color(tube?.physicalColor) ?? 'ფერი დაუდგენელია'} · F${number} · ${color(f.physicalColor) ?? 'ფერი დაუდგენელია'}`, facts: [usageLabel(use?.usageState,use?.organization), path], pathSummary: path, details:[result.subtitle], tubeColorHex:tube?.physicalColor.hex??undefined,fiberColorHex:f.physicalColor.hex??undefined,route: { view: 'fiber', cableId: segmentId, fiber: number } }; }
  }
  if (result.category === 'Cable') {
    const cable = data.cables.find(c => `cable:${c.id}` === result.id);
    if (cable) { const fibers = data.fibers.filter(f => f.cableId === cable.id), uses = data.fiberUsageProjection?.localViews.filter(v => v.segmentId === cable.id) ?? [], count = (s: string) => uses.filter(x => x.usageState === s).length;
      const tubes = data.tubes.filter(t => t.cableId === cable.id).map(t => `Tube ${t.number ?? '?'} ${color(t.physicalColor) ?? ''}`).join(' · ');
      const identity=`C${cable.legacyCableId} · ${fibers.length}F · ${currentAssetLabel(data,cable.endpointA)} ↔ ${currentAssetLabel(data,cable.endpointB)}`;
      const cableFacts=[tubes, `${count('in_use')} in use · ${count('unused')} unused · ${count('review_required')} review · ${count('unknown')} unknown`];
      const routeId=data.cableRoutes?.find(route=>route.legs.some(leg=>leg.segmentId===cable.id))?.id??data.cableRoutes?.[0]?.id;
      const continuations=routeId?segmentContinuationGroups(data,routeId,cable.id).map(group=>`${currentAssetLabel(data,group.node)} · ${group.direction} · F${group.sourceStart}–F${group.sourceEnd} → ${group.targetLabel} · ${group.operationalStatus}`):[];
      const source=/alpana|tvishi/i.test(cable.source.file)?'ცაგერი–ალპანა–ტვიში':'ცაგერი–ლენტეხი';
      return { ...result, subtitle: identity, facts:[...cableFacts,source,...continuations], details: [result.subtitle,...cable.legacyLabels,'Operational Fiber continuation is derived from current node-local transitions. Historical CableContinuation interpretation remains separately preserved.'], route: { view: 'cable', id: cable.id } };
    }
  }
  if(result.category==='Tube'){
    const id=result.id.replace(/^tube:/,''),tube=data.tubes.find(t=>t.id===id),c=tube&&data.cables.find(x=>x.id===tube.cableId);
    if(tube&&c){const fibers=data.fibers.filter(f=>f.tubeId===tube.id),uses=data.fiberUsageProjection?.localViews.filter(v=>v.segmentId===c.id&&fibers.some(f=>f.number===v.fiberNumber))??[],sample=fibers[0],sampleId=sample?`C${c.legacyCableId}/F${sample.number}`:null,path=sample?compactPath(data,c.id,sample.number):undefined,routeId=data.cableRoutes?.find(route=>route.legs.some(leg=>leg.segmentId===c.id))?.id??data.cableRoutes?.[0]?.id,tubePath=routeId?tubeContinuationSummary(data,routeId,c.id,tube.number??tube.proposedNumber??0):null,continuations=tubePath?.groups.map(group=>`${currentAssetLabel(data,group.node)} · F${group.sourceStart}–F${group.sourceEnd} → ${group.targetLabel} · ${group.operationalStatus}`)??[];return {...result,subtitle:`C${c.legacyCableId} · Tube ${tube.number??'?'} · ${color(tube.physicalColor)??'ფერი უცნობია'} · ${fibers.length}F`,facts:[`F${fibers[0]?.number??'?'}–F${fibers.at(-1)?.number??'?'}`,`${uses.filter(v=>v.usageState==='in_use').length} in use · ${uses.filter(v=>v.usageState==='unused').length} unused · ${uses.filter(v=>v.usageState==='review_required').length} review · ${uses.filter(v=>v.usageState==='unknown').length} unknown`,...continuations,sampleId?`Sample Fiber ${sampleId} · opens ${sampleId}`:'',path?`Sample Fiber ${sampleId} path: ${path}`:''].filter(Boolean),pathSummary:path,details:[result.subtitle,'Tube continuation is derived from current node-local Fiber transitions.'],tubeColorHex:tube.physicalColor.hex??undefined,route:sample?{view:'fiber' as const,cableId:c.id,fiber:sample.number}:{view:'cable' as const,id:c.id}};}
  }
  if (result.category === 'Closure') {
    const id=result.id.replace(/^closure:/,''),closure=data.closures.find(c=>c.id===id),cables=data.cables.filter(c=>[c.endpointA,c.endpointB].some(e=>e.id===id));
    const orgs=(data.organizationNetworkProjection?.organizations??[]).filter(o=>o.closureIds.includes(id)).map(o=>o.name);
    const transitions=data.nodeFiberTransitions?.filter(t=>t.active&&t.node.id===id).length??0;
    return {...result,subtitle:`Closure · ${cables.map(c=>`C${c.legacyCableId}`).join(', ')||'კაბელები დაუდგენელია'} · ${transitions} Fiber transitions`,facts:[...facts,...(orgs.length?[orgs.join(' · ')]:[])],details:[result.subtitle],route:{view:'closure',id}};
  }
  if(result.category==='AP'){
    const id=result.id.replace(/^(?:ap|node):/,''),ap=data.accessPoints.find(x=>x.id===id),node=data.networkNodes?.find(x=>x.id===id&&x.assetType==='ap'),source=data.apPorts?.filter(p=>p.canonicalNode?p.canonicalNode.id===id:String(p.apNumber)===id),orgs=(data.organizationNetworkProjection?.organizations??[]).filter(o=>o.apIds.includes(id)).map(o=>o.name);
    const ref=ap?{kind:'ap',id}:{kind:'network_node',id}, cables=data.cables.filter(x=>[x.endpointA,x.endpointB].some(e=>e.kind===ref.kind&&e.id===id));
    return {...result,subtitle:[ap?.name??node?.apEvidence?.place,cables.map(c=>`C${c.legacyCableId}`).join(', '),`${ap?.portCount??node?.apEvidence?.capacity??source?.length??'?'} Ports`].filter(Boolean).join(' · '),facts:[...(source?.length?[`${source.filter(p=>p.occupancy==='in_use').length} used · ${source.filter(p=>p.occupancy==='unused').length} unused · ${source.filter(p=>p.occupancy==='unknown').length} unknown`]:['Port occupancy unknown']),...(orgs.length?[orgs.join(' · ')]:[])],details:[result.subtitle],route:node&&data.cableRoutes?.[0]?{...routeWithSelection(data.cableRoutes[0].id,{type:'network_node',id}),target:`network_node:${id}`}:{view:'ap',id}};
  }
  if (result.category === 'Aggregation') {
    const id=result.id.replace(/^aggregation:/,''),projection=data.aggregationOperationalProjection?.aggregations.find(a=>a.aggregationId===id);
    if(projection){const orgs=Object.keys(projection.organizationCounts);return {...result,subtitle:`${projection.cableIds.map(c=>`C${data.cables.find(x=>x.id===c)?.legacyCableId}`).join(', ')} · ${projection.portCount??'?'} Ports · ${projection.exactPortBindings} exact bindings`,facts:[`${projection.usageCounts.in_use??0} in use · ${projection.usageCounts.unused??0} unused · ${projection.usageCounts.review_required??0} review · ${projection.usageCounts.unknown??0} unknown`,orgs.join(' · '),...(projection.exactPortBindings?[]:['Port binding not established'])].filter(Boolean),details:[result.subtitle],route:{view:'aggregation',id}};}
    return { ...result, facts, details: [result.subtitle] };
  }
  return { ...result, facts };
}
