import type {Inventory,Route,AssetRef} from './types';
import {createCurrentFiberPathResolver,currentAssetLabel} from './currentFiberPath';
import {orderedJourneySteps} from './iteration28i';
import {portOperationalView} from './iteration28g';
export type OrganizationRoute=Extract<Route,{view:'organization'}>;
export const organizationLegKey=(l:{segmentId:string;fiberNumber:number})=>`${l.segmentId}/F${l.fiberNumber}`;
/** One immutable inventory snapshot and one resolver, reused for all rows and selections. */
export function createOrganizationMapModel(data:Inventory,id:string){
 const org=data.organizationNetworkProjection?.organizations.find(o=>o.organizationId===id);if(!org)return null;
 const resolver=createCurrentFiberPathResolver(data),claimIndex=new Map(data.fiberUsageProjection?.claims.map(c=>[c.id,c])??[]);
 const strands=org.strands.map(strand=>{const leg=strand.localFiberLegs[0],path=resolver.resolve(leg.segmentId,leg.fiberNumber),journeys=orderedJourneySteps(data,path),claims=strand.claimIds.flatMap(id=>claimIndex.get(id)?[claimIndex.get(id)!]:[]);
  const missingPort=path.sides.some(s=>s.stop.node.kind==='aggregation'&&s.stop.kind!=='port');
  const status=strand.conflicts.length?'წყაროთა კონფლიქტი':strand.usageState==='review_required'?'გამოყენება გადასამოწმებელია':path.state==='ambiguous'?'რამდენიმე ალტერნატივა':missingPort||strand.unknownPort?'ზუსტი პორტის მიბმა დაუდგენელია':path.state==='partial'?'ნაწილობრივი ცნობილი გზა':path.state==='termination'?'დადასტურებული გაჩერება':'წყაროთი მხარდაჭერილი ცნობილი გზა';
  const bindings=strand.portBindingIds.flatMap(id=>{const b=data.portTopologyBindings?.find(b=>b.id===id);if(!b)return[];const owner:AssetRef|undefined=b.canonicalNode??(b.ownerType==='ap'?data.networkNodes?.some(n=>n.id===b.ownerId&&n.assetType==='ap')?{kind:'network_node',id:b.ownerId}:{kind:'ap',id:b.ownerId}:data.odfs?.find(o=>o.id===b.ownerId)?.containedBy);return[{binding:b,label:`${owner?currentAssetLabel(data,owner):b.ownerId} / Port ${b.portNumber}`,view:portOperationalView(data,b.ownerType,b.ownerId,b.portNumber,false)}];});
  const evidence=claims.flatMap(c=>{const assignment=data.networkUseAssignments?.find(a=>a.occurrenceIds.some(id=>c.sourceOccurrenceIds.includes(id))),source=data.fiberUsageProjection?.sourceEvidence.find(l=>c.sourceLineShapeIds.includes(l.shapeId))?.source??assignment?.source??data.cables.find(x=>x.id===c.originSegmentId)!.source;return [...new Set([...c.sourceLabelShapeIds,...c.sourceLineShapeIds])].map(shapeId=>({shapeId,file:source.file,claimId:c.id,directLeg:organizationLegKey({segmentId:c.originSegmentId,fiberNumber:c.originFiberNumber})}));});
  return{strand,leg,path,journeys,claims,bindings,status,missingPort,membership:new Set(strand.localFiberLegs.map(organizationLegKey)),evidence:[...new Map(evidence.map(e=>[e.file+':'+e.shapeId,e])).values()]};
 });
 return{org,strands,membership:new Set(org.localFiberLegs.map(organizationLegKey)),topologyRevision:resolver.revision};
}
