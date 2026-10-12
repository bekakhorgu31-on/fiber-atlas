import sourceLineEvidenceJson from '../data/source-b-fiber-usage-evidence.json';
import type { Inventory } from './types';
import { createCurrentFiberPathResolver, currentAssetLabel, type CurrentFiberPath, type CurrentPathLeg } from './currentFiberPath';

export const FIBER_USAGE_LINE_GRAMMAR = 'tsageri-alpana-tvishi-fiber-usage-line/1';
export const FIBER_USAGE_PROJECTION_RULE = 'exact-current-fiber-path-usage/1';

export interface FiberUsageSourceLine {
  shapeId: string; rootShapeId: string; parentShapeId: string | null; masterId: string | null;
  source: {file:string;page:string;pageId:string;shapeIds:string[];part?:string;sourceSha256?:string};
  rawLineCells?: Record<string,string>; effectiveLineColor: {rgb:string|null;formula?:string|null;source_id?:string|null;source_kind?:string|null}|null;
  effectiveLinePattern: {value:string|null;formula?:string|null;source_id?:string|null;source_kind?:string|null}|null;
  effectiveLineWeight?: {value:string|null;formula?:string|null;source_id?:string|null;source_kind?:string|null}|null;
  beginWorld:{x:number;y:number}; endWorld:{x:number;y:number};
  associatedFibers:Array<{cable:string;fiberNumber:number|null;markerShapeId:string;bankShapeId:string;residual:number;physicalColor:string|null}>;
  physicalFiberColor:string|null;
  endpointResiduals:unknown; disposition:string; usageState:'in_use'|'unused'|'review_required'|'unknown'|null;
  organization:string|null; purpose:string|null; reason:string|null; companyLabelShapeIds:string[]; companyOccurrenceIds:string[];
  otdrAnnotationShapeIds:string[]; decodedTransitionId:string|null; decodedTransitionNode:string|null; evidenceBasis:string[];
}
const sourceEvidence = sourceLineEvidenceJson as unknown as {schema:string;grammarId:string;sourceSha256:string;counts:Record<string,number>;lines:FiberUsageSourceLine[]};
const projectionCache=new Map<string,FiberUsageProjection>();

export interface FiberUsageClaim {
  id:string; usageState:'in_use'|'unused'|'review_required'|'unknown'; organization:string|null; purpose:string|null;
  originSegmentId:string; originFiberNumber:number; localFiberLegs:Array<{segmentId:string;fiberNumber:number}>; currentPathSignature:string;
  logicalLineageKey:string; sourceLineShapeIds:string[]; sourceLabelShapeIds:string[]; sourceOccurrenceIds:string[];
  evidenceBasis:string[]; projectionRule:string; pathState:CurrentFiberPath['state']; stoppedAt:Array<{node:string;segmentId:string;fiberNumber:number;kind:string}>;
}
export interface FiberOperationalView {
  segmentId:string; fiberNumber:number; usageState:'in_use'|'unused'|'review_required'|'unknown'; organization:string|null; purpose:string|null;
  condition:'unknown'; administrativeAllocation:'unknown'; availability:'unknown'; conflict:boolean; claimIds:string[]; sourceLineShapeIds:string[]; sourceLabelShapeIds:string[];
}
export interface FiberUsageReviewCase {
  id:string;category:string;status:'needs_review';question:string;sourceLineShapeId:string|null;sourceLabelShapeIds:string[];
  sourceLineColor:string|null;sourceLinePattern:string|null;fiber:string|null;fullKnownPath:Array<{segmentId:string;fiberNumber:number;nodeAfter?:string}>;
  endpoints:string[];neighboringStyles:Array<{shapeId:string;color:string|null;pattern:string|null;disposition:string}>;reason:string;
  decisionOptions:Array<'in_use'|'damaged'|'reserved_special'|'historical'|'drawing_artifact'|'other'|'unresolved'>;
}
export interface FiberUsageProjection {
  grammarId:string;projectionRule:string;sourceSha256:string;topologyRevision:string;sourceEvidence:FiberUsageSourceLine[];
  claims:FiberUsageClaim[]; localViews:FiberOperationalView[]; reviewCases:FiberUsageReviewCase[];
  counts:{lineShapes:number;attached:number;ambiguous:number;rejected:number;unknownStyle:number;redDashed:number;fiberLegs:Record<string,number>;logicalClaims:Record<string,number>;conflicts:number};
}

const fiberKey=(segmentId:string,fiberNumber:number)=>`${segmentId}/F${fiberNumber}`;
const canonicalCable=(data:Inventory,legacy:string)=>data.cables.find(c=>c.legacyCableId===legacy.replace(/^C/,''));
const endpointName=(data:Inventory,path:CurrentFiberPath)=>path.sides.map(side=>currentAssetLabel(data,side.stop.node));
function pathLegsUntilUncertainty(data:Inventory,path:CurrentFiberPath,localCounts?:Map<string,number>):{legs:CurrentPathLeg[];stoppedAt:FiberUsageClaim['stoppedAt']} {
  const kept=new Map<string,CurrentPathLeg>(),stops:FiberUsageClaim['stoppedAt']=[];
  for(const side of path.sides){
    if(side.legs[0])kept.set(fiberKey(side.legs[0].segmentId,side.legs[0].fiberNumber),side.legs[0]);
    for(let index=0;index<side.transitions.length;index++){
      const transition=side.transitions[index];
      const key=fiberKey(transition.from.segmentId,transition.from.fiberNumber);
      const count=localCounts?.get(transition.node.kind+':'+transition.node.id+'/'+key)??(data.nodeFiberTransitions??[]).filter(edge=>edge.active&&edge.node.kind===transition.node.kind&&edge.node.id===transition.node.id&&[edge.a,...(edge.z?[edge.z]:[])].some(end=>fiberKey(end.segmentId,end.fiberNumber)===key)).length;
      if(count>1){
        stops.push({node:transition.node.kind+':'+transition.node.id,segmentId:transition.from.segmentId,fiberNumber:transition.from.fiberNumber,kind:'ambiguous_transition'}); break;
      }
      const next=side.legs[index+1];if(transition.to&&next)kept.set(fiberKey(next.segmentId,next.fiberNumber),next);
      if(!transition.to)break;
    }
    if(['no_transition','termination','external_boundary','unresolved_transition','invalid_transition','loop'].includes(side.stop.kind)) stops.push({node:side.stop.node.kind+':'+side.stop.node.id,segmentId:side.stop.segmentId,fiberNumber:side.stop.fiberNumber,kind:side.stop.kind});
  }
  return {legs:[...kept.values()],stoppedAt:stops};
}

export function validateIteration28E(data:Inventory):string[] {
  const errors:string[]=[]; const projection=data.fiberUsageProjection;
  if(!projection) return ['Fiber usage projection is missing.'];
  const presentFibers=new Set(data.fibers.map(f=>fiberKey(f.cableId,f.number)));
  if(projection.topologyRevision!==data.fiberPathProjection?.topologyRevision) errors.push('Fiber usage projection has a stale topology revision.');
  for(const view of projection.localViews){
    if(view.usageState==='unused'&&(view.availability!=='unknown'||view.administrativeAllocation!=='unknown'))errors.push('Unused Fiber was incorrectly promoted to availability/allocation: '+fiberKey(view.segmentId,view.fiberNumber));
    if(view.conflict&&view.usageState!=='review_required')errors.push('Conflicting local use evidence must require review: '+fiberKey(view.segmentId,view.fiberNumber));
  }
  for(const claim of projection.claims) for(const leg of claim.localFiberLegs){
    if(!presentFibers.has(fiberKey(leg.segmentId,leg.fiberNumber)))errors.push('Usage projection references absent Fiber '+fiberKey(leg.segmentId,leg.fiberNumber));
  }
  return errors;
}

export function applyIteration28E(data:Inventory):Inventory {
  if(!data.fiberPathProjection)throw new Error('Iteration 28E requires the active 28C current path projection.');
  const resolver=createCurrentFiberPathResolver(data),resolve=resolver.resolve;
  const cacheKey=resolver.revision+'::'+JSON.stringify(data.networkUseAssignments??[]);
  const cached=projectionCache.get(cacheKey);if(cached){data.fiberUsageProjection=cached;return data;}
  const localCounts=new Map<string,number>();
  for(const edge of data.nodeFiberTransitions??[])if(edge.active)for(const endpoint of new Set([edge.a,...(edge.z?[edge.z]:[])].map(end=>fiberKey(end.segmentId,end.fiberNumber)))){const key=edge.node.kind+':'+edge.node.id+'/'+endpoint;localCounts.set(key,(localCounts.get(key)??0)+1);}
  const project=(path:CurrentFiberPath)=>pathLegsUntilUncertainty(data,path,localCounts);
  const claims:FiberUsageClaim[]=[];
  const sourceLineByShape=new Map(sourceEvidence.lines.map(line=>[line.shapeId,line]));
  const rawClaims:Array<{originSegmentId:string;originFiberNumber:number;usageState:FiberUsageClaim['usageState'];organization:string|null;purpose:string|null;line:FiberUsageSourceLine|null;sourceLabelShapeIds:string[];sourceOccurrenceIds:string[];evidenceBasis:string[]}>=[];
  for(const line of sourceEvidence.lines){
    const local=[...new Map(line.associatedFibers.filter(f=>f.fiberNumber!=null).map(f=>[fiberKey(f.cable,f.fiberNumber!),f])).values()];
    for(const item of local){const cable=canonicalCable(data,item.cable);if(!cable)continue;
      if(line.usageState)rawClaims.push({originSegmentId:cable.id,originFiberNumber:item.fiberNumber!,usageState:line.usageState,organization:line.organization,purpose:line.purpose,line,sourceLabelShapeIds:line.companyLabelShapeIds,sourceOccurrenceIds:line.companyOccurrenceIds,evidenceBasis:line.evidenceBasis});
    }
  }
  for(const assignment of data.networkUseAssignments??[]) for(const fiber of assignment.fibers){
    const cable=data.cables.find(c=>c.id===fiber.segmentId); if(!cable)continue;
    const exactLines=sourceEvidence.lines.filter(line=>line.associatedFibers.some(item=>item.cable==='C'+cable.legacyCableId&&item.fiberNumber===fiber.fiberNumber));
    const line=exactLines[0]??null;
    rawClaims.push({originSegmentId:fiber.segmentId,originFiberNumber:fiber.fiberNumber,usageState:'in_use',organization:data.organizations.find(o=>o.id===assignment.organizationId)?.name??assignment.organizationId,purpose:assignment.purpose,line,sourceLabelShapeIds:assignment.sourceShapeIds,sourceOccurrenceIds:assignment.occurrenceIds,evidenceBasis:['source_label','exact_fiber_scope']});
  }
  const seen=new Set<string>();
  for(const raw of rawClaims){
    const path=resolve(raw.originSegmentId,raw.originFiberNumber);
    const projected=project(path);
    const legIds=projected.legs.map(leg=>fiberKey(leg.segmentId,leg.fiberNumber)).sort();
    const logicalLineageKey=legIds.join('|');
    const key=[raw.usageState,raw.organization??'',raw.purpose??'',logicalLineageKey,raw.line?.shapeId??'',raw.sourceLabelShapeIds.join(',')].join('::');
    if(seen.has(key))continue;seen.add(key);
    claims.push({id:'28E-USE-'+(claims.length+1).toString().padStart(5,'0'),usageState:raw.usageState,organization:raw.organization,purpose:raw.purpose,originSegmentId:raw.originSegmentId,originFiberNumber:raw.originFiberNumber,localFiberLegs:projected.legs.map(leg=>({segmentId:leg.segmentId,fiberNumber:leg.fiberNumber})),currentPathSignature:path.signature,logicalLineageKey,sourceLineShapeIds:raw.line?[raw.line.shapeId]:[],sourceLabelShapeIds:raw.sourceLabelShapeIds,sourceOccurrenceIds:raw.sourceOccurrenceIds,evidenceBasis:raw.evidenceBasis,projectionRule:FIBER_USAGE_PROJECTION_RULE,pathState:path.state,stoppedAt:projected.stoppedAt});
  }
  const byLeg=new Map<string,FiberUsageClaim[]>();
  for(const claim of claims)for(const leg of claim.localFiberLegs){const key=fiberKey(leg.segmentId,leg.fiberNumber),items=byLeg.get(key)??[];items.push(claim);byLeg.set(key,items);}
  const localViews:FiberOperationalView[]=[];
  for(const fiber of data.fibers){const key=fiberKey(fiber.cableId,fiber.number),items=byLeg.get(key)??[];
    const stateSet=new Set(items.map(item=>item.usageState).filter(state=>state==='in_use'||state==='unused'));
    const orgs=new Set(items.map(item=>item.organization).filter((value):value is string=>!!value&&value!=='unknown'));
    const conflict=stateSet.size>1||orgs.size>1;
    const state=conflict||items.some(item=>item.usageState==='review_required')?'review_required':stateSet.size===1?[...stateSet][0]:'unknown';
    localViews.push({segmentId:fiber.cableId,fiberNumber:fiber.number,usageState:state,organization:orgs.size===1?[...orgs][0]:null,purpose:[...new Set(items.map(item=>item.purpose).filter((value):value is string=>!!value))].join(', ')||null,condition:'unknown',administrativeAllocation:'unknown',availability:'unknown',conflict,claimIds:items.map(item=>item.id),sourceLineShapeIds:[...new Set(items.flatMap(item=>item.sourceLineShapeIds))],sourceLabelShapeIds:[...new Set(items.flatMap(item=>item.sourceLabelShapeIds))]});
  }
  const redDashed=sourceEvidence.lines.filter(line=>line.disposition==='red_dashed_review_required');
  const reviewCases:FiberUsageReviewCase[]=redDashed.map(line=>{
    const local=line.associatedFibers.find(item=>item.fiberNumber!=null),cable=local?canonicalCable(data,local.cable):undefined;
    const path=cable&&local?.fiberNumber?resolve(cable.id,local.fiberNumber):null;
    const projected=path?project(path):null;
    const neighbors=sourceEvidence.lines.filter(candidate=>candidate.shapeId!==line.shapeId&&candidate.associatedFibers.some(item=>item.cable===local?.cable&&item.fiberNumber!=null&&Math.abs(item.fiberNumber-(local.fiberNumber??0))<=1)).slice(0,12);
    return {id:'28E-RED-DASHED-'+line.shapeId,category:'red_dashed_semantics',status:'needs_review',question:'This Fiber is drawn as a red dashed line. What does this source convention mean here: in use, damaged, reserved/special, or another state?',sourceLineShapeId:line.shapeId,sourceLabelShapeIds:line.companyLabelShapeIds,sourceLineColor:line.effectiveLineColor?.rgb??null,sourceLinePattern:line.effectiveLinePattern?.value??null,fiber:local?`${local.cable}/F${local.fiberNumber}`:null,fullKnownPath:(projected?.legs??[]).map((leg,index)=>({segmentId:leg.segmentId,fiberNumber:leg.fiberNumber,nodeAfter:path?.sides.flatMap(side=>side.transitions).find(t=>t.from.segmentId===leg.segmentId&&t.from.fiberNumber===leg.fiberNumber)?.node.kind+':'+path?.sides.flatMap(side=>side.transitions).find(t=>t.from.segmentId===leg.segmentId&&t.from.fiberNumber===leg.fiberNumber)?.node.id})),endpoints:path?endpointName(data,path):[],neighboringStyles:neighbors.map(item=>({shapeId:item.shapeId,color:item.effectiveLineColor?.rgb??null,pattern:item.effectiveLinePattern?.value??null,disposition:item.disposition})),reason:line.reason??'Owner meaning is unresolved.',decisionOptions:['in_use','damaged','reserved_special','historical','drawing_artifact','other','unresolved']};
  });
  for(const line of sourceEvidence.lines.filter(line=>line.disposition==='ambiguous_fiber_association'||line.disposition==='other_style_unknown'))reviewCases.push({id:'28E-LINE-'+line.shapeId,category:line.disposition==='ambiguous_fiber_association'?'line_fiber_alignment_ambiguous':'unknown_line_style',status:'needs_review',question:'Confirm the Fiber association or operational meaning of this source line.',sourceLineShapeId:line.shapeId,sourceLabelShapeIds:line.companyLabelShapeIds,sourceLineColor:line.effectiveLineColor?.rgb??null,sourceLinePattern:line.effectiveLinePattern?.value??null,fiber:null,fullKnownPath:[],endpoints:[],neighboringStyles:[],reason:line.reason??'Ambiguous source association.',decisionOptions:['in_use','damaged','reserved_special','historical','drawing_artifact','other','unresolved']});
  for(const line of sourceEvidence.lines.filter(line=>line.disposition==='red_solid_in_use_organization_unknown')){
    const local=line.associatedFibers.find(item=>item.fiberNumber!=null),cable=local?canonicalCable(data,local.cable):undefined;
    const path=cable&&local?.fiberNumber?resolver.resolve(cable.id,local.fiberNumber):null,projected=path?project(path):null;
    reviewCases.push({id:'28E-RED-ORG-'+line.shapeId,category:'red_in_use_without_organization',status:'needs_review',question:'This red solid Fiber is in use. Which organization, if any, is supported by this source evidence?',sourceLineShapeId:line.shapeId,sourceLabelShapeIds:line.companyLabelShapeIds,sourceLineColor:line.effectiveLineColor?.rgb??null,sourceLinePattern:line.effectiveLinePattern?.value??null,fiber:local?`${local.cable}/F${local.fiberNumber}`:null,fullKnownPath:(projected?.legs??[]).map(leg=>({segmentId:leg.segmentId,fiberNumber:leg.fiberNumber})),endpoints:path?endpointName(data,path):[],neighboringStyles:[],reason:'Red solid confirms in-use only; no exact source organization label is attached.',decisionOptions:['in_use','damaged','reserved_special','historical','drawing_artifact','other','unresolved']});
  }
  for(const view of localViews.filter(item=>item.conflict)){
    const conflictClaims=(byLeg.get(fiberKey(view.segmentId,view.fiberNumber))??[]),path=resolver.resolve(view.segmentId,view.fiberNumber),states=[...new Set(conflictClaims.map(item=>item.usageState))],organizations=[...new Set(conflictClaims.map(item=>item.organization).filter(Boolean))];
    reviewCases.push({id:'28E-CONFLICT-'+view.segmentId.replace(/[^A-Za-z0-9]/g,'-')+'-'+view.fiberNumber,category:organizations.length>1?'organization_conflict':'lineage_usage_conflict',status:'needs_review',question:'Conflicting operational use evidence appears on this current Fiber path. Are these different path sections, concurrent use, historical labels, or an inconsistent drawing?',sourceLineShapeId:view.sourceLineShapeIds[0]??null,sourceLabelShapeIds:view.sourceLabelShapeIds,sourceLineColor:null,sourceLinePattern:null,fiber:fiberKey(view.segmentId,view.fiberNumber),fullKnownPath:project(path).legs.map(leg=>({segmentId:leg.segmentId,fiberNumber:leg.fiberNumber})),endpoints:endpointName(data,path),neighboringStyles:[],reason:`Conflicting states: ${states.join(', ')||'none'}; organizations: ${organizations.join(', ')||'none'}.`,decisionOptions:['in_use','damaged','reserved_special','historical','drawing_artifact','other','unresolved']});
  }
  const logicalClaims=Object.fromEntries(['in_use','unused','review_required','unknown'].map(state=>[state,new Set(claims.filter(claim=>claim.usageState===state).map(claim=>claim.logicalLineageKey)).size]));
  const counts={lineShapes:sourceEvidence.lines.length,attached:sourceEvidence.lines.filter(line=>line.associatedFibers.length>0&&line.disposition!=='ambiguous_fiber_association').length,ambiguous:sourceEvidence.lines.filter(line=>line.disposition==='ambiguous_fiber_association').length,rejected:sourceEvidence.lines.filter(line=>line.disposition==='rejected_non_fiber_graphic').length,unknownStyle:sourceEvidence.lines.filter(line=>line.disposition==='other_style_unknown').length,redDashed:redDashed.length,fiberLegs:Object.fromEntries(['in_use','unused','review_required','unknown'].map(state=>[state,localViews.filter(view=>view.usageState===state).length])),logicalClaims,conflicts:localViews.filter(view=>view.conflict).length};
  data.fiberUsageProjection={grammarId:FIBER_USAGE_LINE_GRAMMAR,projectionRule:FIBER_USAGE_PROJECTION_RULE,sourceSha256:sourceEvidence.sourceSha256,topologyRevision:data.fiberPathProjection.topologyRevision,sourceEvidence:sourceEvidence.lines,claims,localViews,reviewCases,counts};
  projectionCache.set(cacheKey,data.fiberUsageProjection);
  const errors=validateIteration28E(data);if(errors.length)throw new Error(errors.join('; '));
  return data;
}

export const fiberUsageSourceLine=(data:Inventory,shapeId:string)=>data.fiberUsageProjection?.sourceEvidence.find(line=>line.shapeId===shapeId);
export const fiberUsageAt=(data:Inventory,segmentId:string,fiberNumber:number)=>data.fiberUsageProjection?.localViews.find(view=>view.segmentId===segmentId&&view.fiberNumber===fiberNumber);

