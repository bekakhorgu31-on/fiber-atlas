import type {Inventory} from './types';
import type {FiberUsageClaim,FiberUsageSourceLine,FiberOperationalView} from './iteration28e';
import {createCurrentFiberPathResolver,nodeKey,stableSignature} from './currentFiberPath';
import {buildOrganizationNetworkProjection,buildAggregationOperationalProjection} from './iteration28f';

/** Projects fresh, attributed observations only through explicit current transitions. */
export function projectImportedUsage(data:Inventory,lines:FiberUsageSourceLine[]):void{
 const resolver=createCurrentFiberPathResolver(data),claims:FiberUsageClaim[]=[];
 const observe=(id:string,segmentId:string,fiberNumber:number,state:FiberUsageClaim['usageState'],organization:string|null,lineIds:string[],labelIds:string[])=>{
  const path=resolver.resolve(segmentId,fiberNumber),legs=new Map<string,{segmentId:string;fiberNumber:number}>();
  const add=(s:string,n:number)=>legs.set(s+':'+n,{segmentId:s,fiberNumber:n});add(segmentId,fiberNumber);
  if(path.state!=='ambiguous')for(const side of path.sides)for(const leg of side.legs)add(leg.segmentId,leg.fiberNumber);
  const localFiberLegs=[...legs.values()],logicalLineageKey=stableSignature([...legs.keys()].sort());
  claims.push({id,usageState:state,organization,purpose:organization?.toLowerCase()==='opennet'?'internal':null,originSegmentId:segmentId,originFiberNumber:fiberNumber,localFiberLegs,currentPathSignature:path.signature,logicalLineageKey,sourceLineShapeIds:lineIds,sourceLabelShapeIds:labelIds,sourceOccurrenceIds:labelIds,evidenceBasis:['fresh_source','node_local_transition_graph'],projectionRule:'fresh-source-use/1',pathState:path.state,stoppedAt:path.sides.map(s=>({node:nodeKey(s.stop.node),segmentId:s.stop.segmentId,fiberNumber:s.stop.fiberNumber,kind:s.stop.kind}))});
 };
 for(const a of data.networkUseAssignments??[])for(const f of a.fibers)observe(a.id+'-'+f.segmentId+'-'+f.fiberNumber,f.segmentId,f.fiberNumber,'in_use',data.organizations.find(o=>o.id===a.organizationId)?.name??null,[],a.sourceShapeIds);
 for(const line of lines)for(const f of line.associatedFibers){if(f.fiberNumber!=null&&data.cables.some(c=>c.id===f.cable)&&data.fibers.some(x=>x.cableId===f.cable&&x.number===f.fiberNumber))observe('FRESH-LINE-'+line.source.sourceSha256+'-'+line.shapeId+'-'+f.cable+'-'+f.fiberNumber,f.cable,f.fiberNumber,line.usageState??'unknown',line.organization,[line.shapeId],line.companyLabelShapeIds);}
 const localViews=data.fibers.map<FiberOperationalView>(f=>{
  const matched=claims.filter(c=>c.localFiberLegs.some(l=>l.segmentId===f.cableId&&l.fiberNumber===f.number)),states=new Set(matched.map(c=>c.usageState).filter(s=>s!=='unknown')),orgs=[...new Set(matched.map(c=>c.organization).filter((s):s is string=>!!s))],conflict=states.size>1||orgs.length>1;
  return {segmentId:f.cableId,fiberNumber:f.number,usageState:conflict?'review_required' as const:states.values().next().value??'unknown',organization:orgs.length===1?orgs[0]:null,purpose:null,condition:'unknown' as const,administrativeAllocation:'unknown' as const,availability:'unknown' as const,conflict,claimIds:matched.map(c=>c.id),sourceLineShapeIds:matched.flatMap(c=>c.sourceLineShapeIds),sourceLabelShapeIds:matched.flatMap(c=>c.sourceLabelShapeIds)};
 });
 data.fiberUsageProjection={grammarId:'fresh-source-specific-use/1',projectionRule:'fresh-source-use/1',sourceSha256:data.sourceDocuments?.map(d=>d.sourceSha256).join('/')??'',topologyRevision:resolver.revision,sourceEvidence:lines,claims,localViews,reviewCases:[],counts:{lineShapes:lines.length,attached:lines.length,ambiguous:claims.filter(c=>c.pathState==='ambiguous').length,rejected:0,unknownStyle:lines.filter(l=>l.usageState==='unknown').length,redDashed:lines.filter(l=>l.usageState==='review_required').length,fiberLegs:{unknown:localViews.filter(v=>v.usageState==='unknown').length},logicalClaims:{total:claims.length},conflicts:localViews.filter(v=>v.conflict).length}};
 data.organizationNetworkProjection=buildOrganizationNetworkProjection(data);data.aggregationOperationalProjection=buildAggregationOperationalProjection(data);
}
