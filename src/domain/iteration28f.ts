import type { Inventory, NetworkUseAssignment, PortTopologyBinding, SourceRef } from './types';
import { createCurrentFiberPathResolver, currentAssetLabel, nodeKey, stableSignature } from './currentFiberPath';

export const ORGANIZATION_NETWORK_RULE='fiber-usage-to-network-context/1';
export const ORGANIZATION_ALIASES:Record<string,string[]>={
  MAGTI:['Magti','მაგთი'], OPENNET:['OpenNet','Open Net','ოპენნეტი'], SILKNET:['Silknet','სილქნეტი'], SKYTEL:['Skytel','სკაიტელი'],
};
export const ORGANIZATION_QUERY_CATALOG=['Magti','მაგთი','Magti რომელ კაბელებს იყენებს?','Magti რომელ Fiber-ებს იყენებს?','Magti რომელ აგრეგაციაზეა?','Magti რომელ პორტზეა?','OpenNet','OpenNet OTDR','Silknet','Skytel','Tsageri Aggregation-ზე ვინ იყენებს Fiber-ებს?','Lentekhi Aggregation-ზე რომელი Port/Fiber გამოიყენება?','C158-ს ვინ იყენებს?','SC211-ში რომელი ორგანიზაციების Fiber-ები გადის?'] as const;
export interface OrganizationNetworkStrand {
  id:string; organizationId:string; usageState:'in_use'|'unused'|'review_required'|'unknown'; purpose:string|null;
  claimIds:string[]; localFiberLegs:Array<{segmentId:string;fiberNumber:number}>; cableIds:string[];
  portBindingIds:string[]; apIds:string[]; aggregationIds:string[]; closureIds:string[];
  sourceOccurrenceIds:string[]; sourceLabelShapeIds:string[]; pathSignatures:string[]; pathEndpoints:string[];
  unknownPort:boolean; conflicts:string[]; reviewCaseIds:string[];
}
export interface OrganizationNetworkProjection {rule:string;topologyRevision:string;usageRule:string;organizations:Array<{organizationId:string;name:string;aliases:string[];strands:OrganizationNetworkStrand[];localFiberLegs:Array<{segmentId:string;fiberNumber:number}>;cableIds:string[];portBindingIds:string[];apIds:string[];aggregationIds:string[];closureIds:string[];sourceOccurrenceIds:string[];conflicts:string[];reviewCaseIds:string[]}>;counts:{organizations:number;strands:number;localFiberLegs:number;cables:number;portBindings:number;aggregations:number;closures:number}}
export interface AggregationOperationalFiber {segmentId:string;legacyCableId:string;fiberNumber:number;fiberColor:string|null;tubeNumber:number|null;tubeColor:string|null;usageState:'in_use'|'unused'|'review_required'|'unknown';organization:string|null;purpose:string|null;portBindingId:string|null;portNumber:number|null;portOwnerType:string|null;portOccupancy:'in_use'|'unused'|'unknown';portUnknownReason:string|null;pathSignature:string|null;pathEndpoints:string[];sourceShapeIds:string[];sourceOccurrenceIds:string[]}
export interface AggregationOperationalProjection {rule:string;topologyRevision:string;usageRule:string;aggregations:Array<{aggregationId:string;name:string;sourceIdentityClaims?:string[];cableIds:string[];fibers:AggregationOperationalFiber[];portCount:number|null;exactPortBindings:number;unknownPortFibers:number;usageCounts:Record<string,number>;organizationCounts:Record<string,number>;unknownReasons:string[]}>}
const pairKey=(segmentId:string,fiberNumber:number)=>segmentId+'/F'+fiberNumber;
const uniq=<T>(items:T[])=>[...new Set(items)];
const normalize=(s:string)=>s.toLocaleLowerCase().replace(/[↔→·/_,–—-]+/g,' ').replace(/\s+/g,' ').trim();
const colorName=(v:{nameKa:string|null;nameEn:string|null}|null|undefined)=>v?.nameKa??v?.nameEn??null;
function canonicalOrg(data:Inventory,name:string|null):string|null {
  if(!name)return null; const n=normalize(name);
  const exactAlias=Object.entries(ORGANIZATION_ALIASES).find(([,aliases])=>aliases.some(a=>normalize(a)===n));
  if(exactAlias){const byId=data.organizations.find(o=>o.id===exactAlias[0]);if(byId)return byId.id;}
  return data.organizations.find(o=>normalize(o.name)===n||o.aliases.some(a=>normalize(a)===n))?.id??null;
}
const portsAt=(data:Inventory,segmentId:string,fiberNumber:number)=> (data.portTopologyBindings??[]).filter(p=>p.segmentId===segmentId&&p.fiberNumber===fiberNumber);
function pathContext(data:Inventory,segmentId:string,fiberNumber:number,resolver=createCurrentFiberPathResolver(data)){
  const path=resolver.resolve(segmentId,fiberNumber),apIds:string[]=[],aggregationIds:string[]=[],closureIds:string[]=[],bindingIds:string[]=[],endpoints:string[]=[];
  for(const side of path.sides){endpoints.push(currentAssetLabel(data,side.stop.node));const stop=side.stop.node;
    if(stop.kind==='aggregation')aggregationIds.push(stop.id);
    if(stop.kind==='ap'||(stop.kind==='network_node'&&data.networkNodes?.some(n=>n.id===stop.id&&n.assetType==='ap')))apIds.push(stop.id);
    if(stop.kind==='closure'||(stop.kind==='network_node'&&data.networkNodes?.some(n=>n.id===stop.id&&n.assetType==='closure')))closureIds.push(stop.id);
    for(const b of portsAt(data,side.stop.segmentId,side.stop.fiberNumber)) if(!side.stop.node||!b.canonicalNode||nodeKey(side.stop.node)===nodeKey(b.canonicalNode)) bindingIds.push(b.id);
    for(const t of side.transitions){if(t.node.kind==='closure'||(t.node.kind==='network_node'&&data.networkNodes?.some(n=>n.id===t.node.id&&n.assetType==='closure')))closureIds.push(t.node.id);if(t.node.kind==='ap'||(t.node.kind==='network_node'&&data.networkNodes?.some(n=>n.id===t.node.id&&n.assetType==='ap')))apIds.push(t.node.id);}
  }
  return {path,apIds:uniq(apIds),aggregationIds:uniq(aggregationIds),closureIds:uniq(closureIds),bindingIds:uniq(bindingIds),endpoints:uniq(endpoints)};
}
function sourceRefsForAssignment(assignments:NetworkUseAssignment[],ids:string[]):SourceRef[]{return assignments.filter(a=>ids.includes(a.id)).map(a=>a.source);}
export function buildOrganizationNetworkProjection(data:Inventory):OrganizationNetworkProjection {
  if(!data.fiberUsageProjection||!data.fiberPathProjection)throw new Error('28F requires active 28E usage and current-path projections.');
  const resolver=createCurrentFiberPathResolver(data),assignments=data.networkUseAssignments??[],views=new Map(data.fiberUsageProjection.localViews.map(v=>[pairKey(v.segmentId,v.fiberNumber),v]));
  const claims=data.fiberUsageProjection.claims.map(claim=>({claim,organizationId:canonicalOrg(data,claim.organization)})).filter((x):x is {claim:typeof data.fiberUsageProjection.claims[number];organizationId:string}=>!!x.organizationId);
  const organizations=data.organizations.map(org=>{
    const orgClaims=claims.filter(x=>x.organizationId===org.id),byStrand=new Map<string,typeof orgClaims>();
    for(const item of orgClaims){const key=item.claim.logicalLineageKey;byStrand.set(key,[...(byStrand.get(key)??[]),item]);}
    const strands:OrganizationNetworkStrand[]=[];
    for(const [key,items] of byStrand){
      const legs=uniq(items.flatMap(x=>x.claim.localFiberLegs.map(l=>pairKey(l.segmentId,l.fiberNumber)))).map(k=>{const [segmentId,n]=k.split('/F');return {segmentId,fiberNumber:Number(n)};});
      const contexts=legs.map(l=>pathContext(data,l.segmentId,l.fiberNumber,resolver));
      const claimIds=uniq(items.map(x=>x.claim.id)),stateSet=uniq(items.map(x=>x.claim.usageState)),reviewCaseIds=data.fiberUsageProjection!.reviewCases.filter(c=>c.fullKnownPath.some(l=>legs.some(x=>x.segmentId===l.segmentId&&x.fiberNumber===l.fiberNumber))).map(c=>c.id);
      strands.push({id:'ORG-STRAND-'+org.id+'-'+stableSignature([resolver.revision,key]),organizationId:org.id,usageState:stateSet.includes('review_required')||stateSet.length>1?'review_required':stateSet[0]??'unknown',purpose:uniq(items.map(x=>x.claim.purpose).filter((x):x is string=>!!x)).join(', ')||null,claimIds,localFiberLegs:legs,cableIds:uniq(legs.map(x=>x.segmentId)),portBindingIds:uniq(contexts.flatMap(x=>x.bindingIds)),apIds:uniq(contexts.flatMap(x=>x.apIds)),aggregationIds:uniq(contexts.flatMap(x=>x.aggregationIds)),closureIds:uniq(contexts.flatMap(x=>x.closureIds)),sourceOccurrenceIds:uniq(items.flatMap(x=>x.claim.sourceOccurrenceIds)),sourceLabelShapeIds:uniq(items.flatMap(x=>x.claim.sourceLabelShapeIds)),pathSignatures:uniq(items.map(x=>x.claim.currentPathSignature)),pathEndpoints:uniq(contexts.flatMap(x=>x.endpoints)),unknownPort:contexts.some(x=>x.aggregationIds.length>0&&x.bindingIds.length===0),conflicts:stateSet.length>1?['Conflicting usage claims share a projected logical path.']:[],reviewCaseIds});
    }
    strands.sort((a,b)=>a.id.localeCompare(b.id));const all=strands;
    return {organizationId:org.id,name:org.name,aliases:uniq([...org.aliases,...(ORGANIZATION_ALIASES[org.id]??[])]),strands:all,localFiberLegs:legsUnique(all),cableIds:uniq(all.flatMap(s=>s.cableIds)),portBindingIds:uniq(all.flatMap(s=>s.portBindingIds)),apIds:uniq(all.flatMap(s=>s.apIds)),aggregationIds:uniq(all.flatMap(s=>s.aggregationIds)),closureIds:uniq(all.flatMap(s=>s.closureIds)),sourceOccurrenceIds:uniq(all.flatMap(s=>s.sourceOccurrenceIds)),conflicts:uniq(all.flatMap(s=>s.conflicts)),reviewCaseIds:uniq(all.flatMap(s=>s.reviewCaseIds))};
  });
  const active=organizations.filter(o=>o.strands.length),flat=active.flatMap(o=>o.strands);
  return {rule:ORGANIZATION_NETWORK_RULE,topologyRevision:resolver.revision,usageRule:data.fiberUsageProjection.projectionRule,organizations:active,counts:{organizations:active.length,strands:flat.length,localFiberLegs:uniq(flat.flatMap(s=>s.localFiberLegs.map(l=>pairKey(l.segmentId,l.fiberNumber)))).length,cables:uniq(flat.flatMap(s=>s.cableIds)).length,portBindings:uniq(flat.flatMap(s=>s.portBindingIds)).length,aggregations:uniq(flat.flatMap(s=>s.aggregationIds)).length,closures:uniq(flat.flatMap(s=>s.closureIds)).length}};
}
function legsUnique(strands:OrganizationNetworkStrand[]){const m=new Map<string,{segmentId:string;fiberNumber:number}>();for(const s of strands)for(const l of s.localFiberLegs)m.set(pairKey(l.segmentId,l.fiberNumber),l);return [...m.values()];}
function occupancy(data:Inventory,binding:PortTopologyBinding|null):'in_use'|'unused'|'unknown' {
  if(!binding)return 'unknown';
  if(binding.ownerType==='ap'){const p=data.apPorts?.find(x=>x.number===binding.portNumber&&(x.canonicalNode?x.canonicalNode.id===binding.ownerId:String(x.apNumber)===binding.ownerId));return p?.occupancy??'unknown';}
  const p=data.odfPorts?.find(x=>x.number===binding.portNumber&&x.odfId===binding.ownerId);return p?.physicalOccupancy==='empty'?'unused':p&&p.physicalOccupancy!=='unknown'?'in_use':'unknown';
}
export function buildAggregationOperationalProjection(data:Inventory):AggregationOperationalProjection {
  if(!data.fiberUsageProjection||!data.fiberPathProjection)throw new Error('28F requires active 28E usage and current-path projections.');
  const resolver=createCurrentFiberPathResolver(data),views=new Map(data.fiberUsageProjection.localViews.map(v=>[pairKey(v.segmentId,v.fiberNumber),v]));
  const aggregations=data.aggregations.map(agg=>{
    const aggregationRef={kind:'aggregation' as const,id:agg.id};
    const cables=data.cables.filter(c=>[c.endpointA,c.endpointB].some(e=>nodeKey(e)===nodeKey(aggregationRef)));
    const fibers=cables.flatMap(c=>data.fibers.filter(f=>f.cableId===c.id).map(f=>{
      const view=views.get(pairKey(c.id,f.number)),bindings=portsAt(data,c.id,f.number),binding=bindings.length===1?bindings[0]:null,ctx=pathContext(data,c.id,f.number,resolver),tube=data.tubes.find(t=>t.id===f.tubeId);
      return {segmentId:c.id,legacyCableId:c.legacyCableId,fiberNumber:f.number,fiberColor:colorName(f.physicalColor),tubeNumber:tube?.number??null,tubeColor:colorName(tube?.physicalColor),usageState:view?.usageState??'unknown',organization:view?.organization??null,purpose:view?.purpose??null,portBindingId:binding?.id??null,portNumber:binding?.portNumber??null,portOwnerType:binding?.ownerType??null,portOccupancy:occupancy(data,binding),portUnknownReason:bindings.length>1?'Multiple exact Port bindings require review.':binding?occupancy(data,binding)==='unknown'?'Port occupancy is not established independently from Fiber use.':null:'No exact Port-to-Fiber binding is established from current source.',pathSignature:resolver.resolve(c.id,f.number).signature,pathEndpoints:ctx.endpoints,sourceShapeIds:view?.sourceLineShapeIds??[],sourceOccurrenceIds:(data.fiberUsageProjection!.claims.filter(cl=>cl.localFiberLegs.some(l=>l.segmentId===c.id&&l.fiberNumber===f.number)).flatMap(cl=>cl.sourceOccurrenceIds))};
    }));
    const usageCounts=Object.fromEntries(['in_use','unused','review_required','unknown'].map(s=>[s,fibers.filter(f=>f.usageState===s).length]));
    const organizationCounts=Object.fromEntries(uniq(fibers.map(f=>f.organization).filter((x):x is string=>!!x)).sort().map(name=>[name,fibers.filter(f=>f.organization===name).length]));
    return {aggregationId:agg.id,name:agg.name,sourceIdentityClaims:agg.legacyIdentityClaims?.map(x=>`${x.field}: ${x.value}`),cableIds:cables.map(c=>c.id),fibers,portCount:agg.portCount,exactPortBindings:fibers.filter(f=>f.portBindingId).length,unknownPortFibers:fibers.filter(f=>!f.portBindingId).length,usageCounts,organizationCounts,unknownReasons:uniq(fibers.map(f=>f.portUnknownReason).filter((x):x is string=>!!x))};
  });
  return {rule:'aggregation-fiber-usage-port-separation/1',topologyRevision:resolver.revision,usageRule:data.fiberUsageProjection.projectionRule,aggregations};
}
export function validateIteration28F(data:Inventory):string[]{
  const e:string[]=[],o=data.organizationNetworkProjection,a=data.aggregationOperationalProjection;
  if(!o||!a)return ['28F organization/aggregation projections are missing.'];
  if(o.topologyRevision!==data.fiberPathProjection?.topologyRevision||a.topologyRevision!==data.fiberPathProjection?.topologyRevision)e.push('28F projection has stale topology revision.');
  const tsageri=a.aggregations.find(x=>x.aggregationId==='5');
  if(tsageri){if(tsageri.portCount!==192)e.push('Tsageri logical port count changed.');if(tsageri.fibers.some(f=>f.segmentId==='C148'&&f.portNumber!==null))e.push('Fabricated Tsageri C148 per-port binding.');if(tsageri.fibers.some(f=>f.segmentId==='C148'&&f.portOccupancy!=='unknown'))e.push('C148 use was promoted to Tsageri Port occupancy.');}
  for(const agg of a.aggregations)for(const f of agg.fibers){if(f.usageState==='in_use'&&f.portOccupancy!=='unknown'&&!f.portBindingId)e.push('Port status exists without an exact binding: '+pairKey(f.segmentId,f.fiberNumber));if(f.portBindingId&&!data.portTopologyBindings?.some(b=>b.id===f.portBindingId&&b.segmentId===f.segmentId&&b.fiberNumber===f.fiberNumber))e.push('Aggregation projection has non-exact Port binding: '+f.portBindingId);}
  const claims=new Map((data.fiberUsageProjection?.claims??[]).map(c=>[c.id,c])),closureCache=new Map<string,Set<string>>(),resolver=createCurrentFiberPathResolver(data);
  for(const org of o.organizations)for(const strand of org.strands){const strandClaims=strand.claimIds.map(id=>claims.get(id)).filter((x):x is NonNullable<typeof x>=>!!x);if(strand.localFiberLegs.some(l=>!strandClaims.some(c=>c.localFiberLegs.some(x=>x.segmentId===l.segmentId&&x.fiberNumber===l.fiberNumber))))e.push('Organization strand contains unsupported Fiber leg: '+strand.id);if(strand.closureIds.some(id=>!strand.localFiberLegs.some(l=>{const key=pairKey(l.segmentId,l.fiberNumber);let set=closureCache.get(key);if(!set){set=resolverTransitionNodes(resolver,l.segmentId,l.fiberNumber);closureCache.set(key,set);}return set.has(id);})))e.push('Organization Closure context is not traversed by an exact transition: '+strand.id);}
  return e;
}
function resolverTransitionNodes(resolver:ReturnType<typeof createCurrentFiberPathResolver>,segmentId:string,fiberNumber:number){return new Set(resolver.resolve(segmentId,fiberNumber).sides.flatMap(s=>[...s.transitions.map(t=>t.node.id),s.stop.node.id]));}
export function applyIteration28F(data:Inventory):Inventory {data.organizationNetworkProjection=buildOrganizationNetworkProjection(data);data.aggregationOperationalProjection=buildAggregationOperationalProjection(data);const errors=validateIteration28F(data);if(errors.length)throw new Error(errors.join('; '));return data;}
