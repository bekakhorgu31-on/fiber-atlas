import type {Inventory,PortTopologyBinding,SourceRef} from './types';
import {createCurrentFiberPathResolver,nodeKey,currentAssetLabel,currentEndpointLabel} from './currentFiberPath';
import {getSegmentDisplayName} from './network';
import {applyIteration28C} from './iteration28c';
import {projectImportedUsage} from './importedUsage';
import {projectPortBankRemap} from './portBankRemap';

export interface OperatorPortCorrection {
 id:string;portId:string;subjectId:string;sourceRevision:string;actorId:number;reason:string;
 evidenceBasis:'source_geometry'|'owner_confirmation'|'engineer_review';evidence:SourceRef;
 oldBinding:PortTopologyBinding|null;newBinding:PortTopologyBinding|null;
 operation:'set'|'remap'|'revert';reverts?:string;fieldVerified:false;networkRevision:string;
 groupId?:string;groupPortIds?:string[];groupSegmentId?:string;affectedSubjectIds?:string[];
}
export interface ImportCorrectionReconciliation {draftId:string;portId:string;portLabel:string;status:'agrees_with_source'|'requires_owner_decision'|'superseded_by_source';previous:PortTopologyBinding;proposed:PortTopologyBinding[];runId:string;actorId?:number;reason?:string}
const connectionKey=(b:PortTopologyBinding)=>[b.ownerType,b.ownerId,b.portNumber,b.segmentId,b.fiberNumber,b.canonicalNode?.kind,b.canonicalNode?.id].join('/');
export function reconcileImportCorrections(previous:Inventory,candidate:Inventory,runId:string):ImportCorrectionReconciliation[]{
 candidate.operatorPortCorrections=structuredClone(previous.operatorPortCorrections??[]);
 candidate.operatorImportReconciliations=structuredClone(previous.operatorImportReconciliations??[]);
 const latest=new Map<string,OperatorPortCorrection>();for(const c of previous.operatorPortCorrections??[])latest.set(c.portId,c);
 const rows:ImportCorrectionReconciliation[]=[];
 for(const c of latest.values()){
   if(!c.newBinding||previous.operatorImportReconciliations?.some(r=>r.draftId===c.id&&r.status==='superseded_by_source'))continue;
   const proposed=(candidate.portTopologyBindings??[]).filter(b=>b.ownerType===c.newBinding!.ownerType&&b.ownerId===c.newBinding!.ownerId&&b.portNumber===c.newBinding!.portNumber);
   rows.push({draftId:c.id,portId:c.portId,portLabel:currentAssetLabel(previous,c.newBinding.canonicalNode??{kind:'ap',id:c.newBinding.ownerId})+' / Port '+c.newBinding.portNumber,status:proposed.length===1&&connectionKey(proposed[0])===connectionKey(c.newBinding)?'agrees_with_source':'requires_owner_decision',previous:c.newBinding,proposed,runId});
 }
 candidate.operatorImportReconciliations.push(...rows);return rows;
}
export interface PortCorrectionInput extends Omit<OperatorPortCorrection,'oldBinding'|'newBinding'|'networkRevision'|'fieldVerified'> {
 portId:string;segmentId?:string;fiberNumber?:number;
}
export interface PortCorrectionFailure {
 code:string;message:string;
 selected?:{portLabel:string;segmentLabel:string;fiberNumber:number};
 conflicts?:Array<{bindingId:string;portLabel:string;ownerType:'ap'|'odf';ownerId:string;portNumber:number}>;
}
export class PortCorrectionValidationError extends Error {
 constructor(public readonly failure:PortCorrectionFailure){super(failure.message);this.name='PortCorrectionValidationError';}
}
/** Known domain refusals are safe, actionable output; internal exceptions remain private. */
export function portCorrectionFailure(error:unknown):PortCorrectionFailure {
 if(error instanceof PortCorrectionValidationError)return error.failure;
 const messages:Record<string,string>={
  'Exact canonical Port required.':'ზუსტი პორტი ამ რევიზიაში ვერ მოიძებნა.',
  'Physical Port identity is ambiguous.':'პორტის ფიზიკური იდენტობა ერთმნიშვნელოვანი არ არის.',
  'Ambiguous existing Port bindings require another correction type.':'პორტს რამდენიმე მიბმა აქვს; საჭიროა მათი ცალკე განხილვა.',
  'Reversal is stale or belongs to another subject.':'უკუქცევის ჩანაწერი მოძველდა ან სხვა საკითხს ეკუთვნის.',
  'Fiber must exist on an incident Cable.':'აირჩიეთ ამ პორტის კვანძთან დაკავშირებული კაბელის არსებული ჟილა.',
  'Port binding conflicts with an explicit local continuation/termination.':'არჩეულ ჟილას ამ კვანძზე სხვა მიღებული გადასვლა ან დასრულება აქვს. შეამოწმეთ მისი გზა.',
  'Correction comparison exceeds the supported 25,000-Fiber snapshot bound.':'ეს ქსელი შესწორების შედარების მხარდაჭერილ ზომას აღემატება.',
  'Correction comparison exceeds the supported fact bound; no partial preview is accepted.':'შედარება მხარდაჭერილ ზომას აღემატება; არასრული წინასწარი ნახვა არ გამოიყენება.'
 };
 return {code:error instanceof Error&&messages[error.message]?'correction_refused':'validator_unavailable',message:error instanceof Error&&messages[error.message]?messages[error.message]:'ვალიდაცია ვერ დასრულდა. ხელახლა სცადეთ; თუ განმეორდა, საჭიროა ვალიდატორის შემოწმება.'};
}
export function projectPortCorrection(data:Inventory,input:PortCorrectionInput,revision:string):Inventory {
 if(input.operation==='remap'||input.operation==='revert'&&data.operatorPortCorrections?.find(c=>c.id===input.reverts)?.groupId)return projectPortBankRemap(data,input,revision);
 const port=data.apPorts?.find(p=>p.id===input.portId);if(!port)throw Error('Exact canonical Port required.');
 if((data.apPorts??[]).filter(p=>p.number===port.number&&nodeKey(p.canonicalNode)===nodeKey(port.canonicalNode)).length!==1)throw Error('Physical Port identity is ambiguous.');
 const samePort=(b:PortTopologyBinding)=>b.ownerType==='ap'&&b.ownerId===port.canonicalNode.id&&b.portNumber===port.number;
 const existing=(data.portTopologyBindings??[]).filter(samePort);if(existing.length>1)throw Error('Ambiguous existing Port bindings require another correction type.');
 const oldBinding=existing[0]??null;
 let target:PortTopologyBinding|null=null;
 if(input.operation==='revert'){
   const previous=data.operatorPortCorrections?.find(c=>c.id===input.reverts);
   if(!previous||previous.subjectId!==input.subjectId||JSON.stringify(previous.newBinding)!==JSON.stringify(oldBinding))throw Error('Reversal is stale or belongs to another subject.');
   target=previous.oldBinding;
 }else{
   const cable=data.cables.find(c=>c.id===input.segmentId),fiber=data.fibers.find(f=>f.cableId===input.segmentId&&f.number===input.fiberNumber);
   if(!cable||!fiber||![cable.endpointA,cable.endpointB].some(n=>nodeKey(n)===nodeKey(port.canonicalNode)))throw Error('Fiber must exist on an incident Cable.');
   const occupied=(data.portTopologyBindings??[]).filter(b=>{
     const node=b.canonicalNode??(b.ownerType==='odf'?data.odfs?.find(o=>o.id===b.ownerId)?.containedBy:null);
     const sameEndpoint=node?nodeKey(node)===nodeKey(port.canonicalNode):b.ownerType==='ap'&&b.ownerId===port.canonicalNode.id;
     return !samePort(b)&&b.segmentId===cable.id&&b.fiberNumber===fiber.number&&sameEndpoint;
   });
   if(occupied.length){
     const portLabel=currentAssetLabel(data,port.canonicalNode)+' / Port '+port.number,segmentLabel=getSegmentDisplayName(cable,data);
     const conflicts=occupied.map(b=>({bindingId:b.id,portLabel:b.ownerType==='odf'?(data.odfs?.find(o=>o.id===b.ownerId)?.displayLabel??'ODF '+b.ownerId)+' / Port '+b.portNumber:currentAssetLabel(data,b.canonicalNode??port.canonicalNode)+' / Port '+b.portNumber,ownerType:b.ownerType,ownerId:b.ownerId,portNumber:b.portNumber}));
     throw new PortCorrectionValidationError({code:'fiber_endpoint_occupied',message:`F${fiber.number} უკვე მიბმულია: ${conflicts.map(c=>c.portLabel).join(', ')}. მეორე პორტზე მიბმა ვერ დაემატება არსებული კავშირის განხილვის გარეშე.`,selected:{portLabel,segmentLabel,fiberNumber:fiber.number},conflicts});
   }
   const tube=data.tubes.find(t=>t.id===fiber.tubeId);
   target={id:'OPERATOR-BINDING-'+input.id,canonicalNode:port.canonicalNode,ownerType:'ap',ownerId:port.canonicalNode.id,portNumber:port.number,segmentId:cable.id,fiberNumber:fiber.number,tubeNumber:tube?.number??null,tubeColor:tube?.physicalColor??null,fiberColor:fiber.physicalColor,role:'local_termination',directionLabel:'Operator-reviewed Port '+port.number,routeId:null,orientation:'from_port',lineageIds:[],projectionStatus:'owner_confirmed',source:{...input.evidence,interpretationRule:'operator-port-binding/1'},notes:['Operator interpretation; not automatically source-decoded; field verification not established.',input.reason]};
 }
 const next=structuredClone(data);next.portTopologyBindings=(next.portTopologyBindings??[]).filter(b=>!samePort(b));if(target)next.portTopologyBindings.push(target);
 if(target){const path=createCurrentFiberPathResolver(next).resolve(target.segmentId,target.fiberNumber);if(!path.sides.some(s=>s.stop.portBindingId===target!.id))throw Error('Port binding conflicts with an explicit local continuation/termination.');}
 const correction:OperatorPortCorrection={...input,oldBinding,newBinding:target,networkRevision:revision,fieldVerified:false};
 next.operatorPortCorrections=[...(next.operatorPortCorrections??[]),correction];
 applyIteration28C(next);projectImportedUsage(next,next.fiberUsageProjection?.sourceEvidence??[]);
 if(target?.id.startsWith('OPERATOR-BINDING-')){
   for(const lineage of next.currentFiberLineages??[])if(lineage.legs.some(l=>l.segmentId===target!.segmentId&&l.fiberNumber===target!.fiberNumber))lineage.projectionStatus='owner_confirmed';
   for(const summary of next.fiberJourneySummaries??[])if(summary.portBindingIds.includes(target.id))summary.projectionStatus='owner_confirmed';
 }
 return next;
}
/** Entire changed paths/facts are retained privately and paginated; no impact is dropped. */
export function correctionImpact(before:Inventory,after:Inventory){
 if(Math.max(before.fibers.length,after.fibers.length)>25000)throw Error('Correction comparison exceeds the supported 25,000-Fiber snapshot bound.');
 const old=createCurrentFiberPathResolver(before),next=createCurrentFiberPathResolver(after);
 const compact=(data:Inventory,path:ReturnType<typeof old.resolve>)=>({signature:path.signature,state:path.state,sides:path.sides.map(s=>({start:currentAssetLabel(data,s.startNode),legs:s.legs.map(l=>({segmentId:l.segmentId,label:getSegmentDisplayName(data.cables.find(c=>c.id===l.segmentId)!,data),fiberNumber:l.fiberNumber,fiberColor:l.fiberColor?.nameKa??l.fiberColor?.nameEn??null,tubeNumber:l.tubeNumber})),transitions:s.transitions.map(t=>({id:t.id,node:currentAssetLabel(data,t.node),from:t.from,to:t.to})),stop:{...s.stop,label:currentEndpointLabel(data,s.stop)},ambiguous:s.ambiguous}))});
 const originals=new Map(before.fibers.map(f=>[f.cableId+':'+f.number,f])),revised=new Map(after.fibers.map(f=>[f.cableId+':'+f.number,f]));
 const paths=[...new Set([...originals.keys(),...revised.keys()])].flatMap(key=>{const a=originals.get(key),b=revised.get(key),previous=a?old.resolve(a.cableId,a.number):null,current=b?next.resolve(b.cableId,b.number):null;if(previous&&current&&previous.signature===current.signature)return [];const f=b??a!;return [{id:f.id,cableId:f.cableId,fiberNumber:f.number,before:previous?compact(before,previous):null,after:current?compact(after,current):null}];});
 const facts:Array<{collection:string;id:string;before:unknown;after:unknown}>=[];
 const semantic=(v:unknown)=>JSON.stringify(v,(key,value)=>['topologyRevision','displayRevision'].includes(key)?undefined:value);
 const diff=(collection:string,a:unknown,b:unknown)=>{
   if(semantic(a)===semantic(b))return;
   if(Array.isArray(a)&&Array.isArray(b)){
     const id=(v:Record<string,unknown>,i:number)=>String(v.id??(v.segmentId&&v.fiberNumber?`${v.segmentId}/F${v.fiberNumber}`:i));
     const previous=new Map(a.map((v,i)=>[id(v,i),v])),current=new Map(b.map((v,i)=>[id(v,i),v]));
     for(const key of new Set([...previous.keys(),...current.keys()]))if(semantic(previous.get(key))!==semantic(current.get(key)))facts.push({collection,id:key,before:previous.get(key)??null,after:current.get(key)??null});
   }else if(a&&b&&typeof a==='object'&&typeof b==='object'){
     for(const key of new Set([...Object.keys(a),...Object.keys(b)]))if(!['topologyRevision','displayRevision'].includes(key))diff(collection+'.'+key,(a as Record<string,unknown>)[key],(b as Record<string,unknown>)[key]);
   }else facts.push({collection,id:collection,before:a??null,after:b??null});
 };
 for(const collection of ['cables','fibers','tubes','networkNodes','nodeFiberTransitions','apPorts','sourceDocuments','sourceReviewCases','portTopologyBindings','currentFiberLineages','fiberJourneySummaries','fiberUsageProjection','organizationNetworkProjection','aggregationOperationalProjection'] as const){
   diff(collection,before[collection],after[collection]);
 }
 if(facts.length>200000)throw Error('Correction comparison exceeds the supported fact bound; no partial preview is accepted.');
 const latest=after.operatorPortCorrections?.at(-1),bankRows=latest?.groupId?(after.operatorPortCorrections??[]).filter(c=>c.groupId===latest.groupId).map(c=>({portId:c.portId,portNumber:c.newBinding?.portNumber??c.oldBinding?.portNumber??after.apPorts?.find(p=>p.id===c.portId)?.number,before:c.oldBinding,after:c.newBinding})):[];
 return {paths,facts,bankRows,counts:{changedPaths:paths.length,changedFacts:facts.length,comparedFibers:new Set([...originals.keys(),...revised.keys()]).size,beforeFibers:before.fibers.length,afterFibers:after.fibers.length},fieldVerified:false};
}
