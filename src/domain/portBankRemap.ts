import type {Inventory,PortTopologyBinding} from './types';
import {nodeKey,createCurrentFiberPathResolver} from './currentFiberPath';
import {applyIteration28C} from './iteration28c';
import {projectImportedUsage} from './importedUsage';
import {planPortBankRange} from './portBankRange';
import {PortCorrectionValidationError,type PortCorrectionInput,type OperatorPortCorrection} from './portCorrection';

function refuse(message:string):never{throw new PortCorrectionValidationError({code:'bank_remap_refused',message});}
function bankSourceRevision(data:Inventory,port:NonNullable<Inventory['apPorts']>[number]):string|null{
 if(port.source.sourceRevision)return port.source.sourceRevision;
 if(port.source.documentId){const doc=data.sourceDocuments?.find(d=>d.id===port.source.documentId&&(!port.source.sourceSha256||d.sourceSha256===port.source.sourceSha256));return doc?doc.id+'/'+doc.sourceSha256:null;}
 // Older accepted Ports inherit scope from their exact canonical node's incident inventory.
 // Multiple documents at a shared node are ambiguous; filename/Port number never selects a source.
 const incident=data.cables.filter(c=>[c.endpointA,c.endpointB].some(n=>nodeKey(n)===nodeKey(port.canonicalNode)));
 const docs=(data.sourceDocuments??[]).filter(d=>incident.some(c=>c.source.sourceRevision?c.source.sourceRevision===d.id+'/'+d.sourceSha256:c.source.documentId?c.source.documentId===d.id&&(!c.source.sourceSha256||c.source.sourceSha256===d.sourceSha256):d.importedAssetIds.includes(c.id)||d.importedAssetIds.includes('segment:'+c.id)));
 return docs.length===1?docs[0].id+'/'+docs[0].sourceSha256:null;
}
/** Uniform displacement is a review signal, never permission to create connections. */
export function shiftedPortBankCandidates(data:Inventory){
 const banks=new Map<string,NonNullable<Inventory['apPorts']>>();
 for(const port of data.apPorts??[]){const key=nodeKey(port.canonicalNode),bank=banks.get(key)??[];bank.push(port);banks.set(key,bank);}
 return [...banks.values()].flatMap(ports=>{
   const bindings=(data.portTopologyBindings??[]).filter(b=>b.ownerType==='ap'&&b.ownerId===ports[0].canonicalNode.id);
   if(bindings.length<3||new Set(bindings.map(b=>b.segmentId)).size!==1)return [];
   const offsets=new Set(bindings.map(b=>b.portNumber-b.fiberNumber));if(offsets.size!==1||offsets.has(0))return [];
   const anchor=ports.reduce((a,b)=>a.number<b.number?a:b);
   try{const plan=portBankPlan(data,anchor.id,bindings[0].segmentId);return [{node:anchor.canonicalNode,portId:anchor.id,segmentId:plan.cable.id,portCount:ports.length,bindingCount:bindings.length,offset:[...offsets][0],status:'review_candidate' as const}];}catch{return [];}
 });
}
/** A complete Cable range within one selected, complete physical bank. This is an operator decision, never a decoder rule. */
export function portBankPlan(data:Inventory,portId:string,segmentId:string,restorePortIds?:string[]){
 const anchor=data.apPorts?.find(p=>p.id===portId),cable=data.cables.find(c=>c.id===segmentId);
 if(!anchor||!cable||![cable.endpointA,cable.endpointB].some(n=>nodeKey(n)===nodeKey(anchor.canonicalNode)))return refuse('აირჩიეთ ამ AP-სთან დაკავშირებული ზუსტი კაბელი.');
 const ports=(data.apPorts??[]).filter(p=>nodeKey(p.canonicalNode)===nodeKey(anchor.canonicalNode)).sort((a,b)=>a.number-b.number);
 const fibers=data.fibers.filter(f=>f.cableId===cable.id).sort((a,b)=>a.number-b.number);
 const source=bankSourceRevision(data,anchor);
 if(!source||ports.some(p=>bankSourceRevision(data,p)!==source))return refuse('ბანკის ყველა პორტი ერთსა და იმავე წყაროს რევიზიას უნდა ეკუთვნოდეს.');
 const bindings=(data.portTopologyBindings??[]).filter(b=>b.ownerType==='ap'&&b.ownerId===anchor.canonicalNode.id);
 const range=planPortBankRange({ports,fiberCount:cable.fiberCount,fibers,bindings,segmentId,anchorId:portId,restorePortIds});
 if(!range.ready)return refuse(range.reason);
 return {anchor,cable,ports:ports.filter(p=>range.rows.some(r=>r.portId===p.id)),rows:range.rows.map(r=>({...r,before:bindings.find(b=>b.portNumber===r.portNumber)??null})),bindings,untouchedCount:range.untouchedCount};
}
/** Batch removal precedes batch insertion: shifted bindings never block one another. */
export function projectPortBankRemap(data:Inventory,input:PortCorrectionInput,revision:string):Inventory{
 const prior=input.operation==='revert'?data.operatorPortCorrections?.find(c=>c.id===input.reverts):undefined;
 if(input.operation==='revert'&&(!prior?.groupId||prior.subjectId!==input.subjectId&&!prior.affectedSubjectIds?.includes(input.subjectId)))return refuse('ბანკის უკუქცევის ჩანაწერი სხვა საკითხს ეკუთვნის.');
 const segmentId=prior?.groupSegmentId??input.segmentId!;
 const plan=portBankPlan(data,input.portId,segmentId,prior?.groupPortIds);
 if(input.evidenceBasis!=='owner_confirmation'&&input.operation==='remap')return refuse('ბანკის 1→1 Remap მოითხოვს მფლობელის დადასტურებას.');
 const source=bankSourceRevision(data,plan.anchor);
 if(source!==input.sourceRevision)return refuse('არჩეული ბანკი სხვა წყაროს რევიზიას ეკუთვნის.');
 const cableSource=plan.cable.source,doc=data.sourceDocuments?.find(d=>d.id+'/'+d.sourceSha256===input.sourceRevision);
 if(!doc||!(cableSource.sourceRevision?cableSource.sourceRevision===input.sourceRevision:cableSource.documentId?cableSource.documentId===doc.id&&(!cableSource.sourceSha256||cableSource.sourceSha256===doc.sourceSha256):doc.importedAssetIds.some(id=>id===segmentId||id==='segment:'+segmentId)))return refuse('Remap ვერ გადადის სხვა წყაროს კაბელზე.');
 const originals=prior?(data.operatorPortCorrections??[]).filter(c=>c.groupId===prior.groupId):[];
 if(prior&&(originals.length!==plan.ports.length||originals.some(c=>!plan.ports.some(p=>p.id===c.portId)||JSON.stringify(plan.rows.find(r=>r.portId===c.portId)?.before??null)!==JSON.stringify(c.newBinding)||(data.operatorPortCorrections??[]).filter(v=>v.portId===c.portId).at(-1)?.id!==c.id)))return refuse('ბანკის ერთი ან მეტი მიბმა უკვე შეიცვალა. ძველი ჯგუფის უკუქცევა ვერ გამოიყენება.');
 const next=structuredClone(data),sameBank=(b:PortTopologyBinding)=>b.ownerType==='ap'&&b.ownerId===plan.anchor.canonicalNode.id&&plan.ports.some(p=>p.number===b.portNumber);
 next.portTopologyBindings=(next.portTopologyBindings??[]).filter(b=>!sameBank(b));
 const ordered=[plan.anchor,...plan.ports.filter(p=>p.id!==plan.anchor.id)];
 const records:OperatorPortCorrection[]=ordered.map((port,i)=>{
   const id=i===0?input.id:input.id.slice(0,24)+(BigInt('0x'+input.id.slice(24))+BigInt(i)).toString(16).padStart(12,'0').slice(-12);
   const row=plan.rows.find(r=>r.portId===port.id)!,fiber=row.fiberNumber===null?undefined:data.fibers.find(f=>f.cableId===segmentId&&f.number===row.fiberNumber),tube=data.tubes.find(t=>t.id===fiber?.tubeId);
   const previous=originals.find(c=>c.portId===port.id);
   const target:PortTopologyBinding|null=prior?previous!.oldBinding:!fiber?null:{id:'OPERATOR-BINDING-'+id,canonicalNode:port.canonicalNode,ownerType:'ap',ownerId:port.canonicalNode.id,portNumber:port.number,segmentId,fiberNumber:fiber.number,tubeNumber:tube?.number??null,tubeColor:tube?.physicalColor??null,fiberColor:fiber.physicalColor,role:'local_termination',directionLabel:'Owner-confirmed bank Remap / Port '+port.number,routeId:null,orientation:'from_port',lineageIds:[],projectionStatus:'owner_confirmed',source:{...input.evidence,interpretationRule:'operator-ap-bank-remap/1'},notes:['Owner-confirmed bank correction; original geometry preserved; field verification not established.',input.reason]};
   const affectedSubjectIds=(data.sourceReviewCases??[]).filter(c=>c.category==='fiber_port_binding_ambiguous'&&c.affectedIds.includes(port.id)).map(c=>c.id);
   const subjectId=port.id===input.portId?input.subjectId:affectedSubjectIds[0]??input.subjectId;
   return {...input,id,portId:port.id,subjectId,affectedSubjectIds,oldBinding:plan.rows.find(r=>r.portId===port.id)!.before,newBinding:target,networkRevision:revision,fieldVerified:false,groupId:input.id,groupPortIds:plan.ports.map(p=>p.id),groupSegmentId:segmentId};
 });
 for(const record of records)if(record.newBinding){
   const b=record.newBinding;
   if(next.portTopologyBindings.some(v=>v.segmentId===b.segmentId&&v.fiberNumber===b.fiberNumber&&nodeKey(v.canonicalNode??(v.ownerType==='odf'?data.odfs?.find(o=>o.id===v.ownerId)?.containedBy:undefined)??{kind:'ap',id:v.ownerId})===nodeKey(plan.anchor.canonicalNode)))return refuse('ჟილის ბოლო სხვა პორტს ეკუთვნის არჩეული ბანკის გარეთ.');
   next.portTopologyBindings.push(structuredClone(b));
 }
 const resolver=createCurrentFiberPathResolver(next);
 for(const record of records)if(record.newBinding&&!resolver.resolve(record.newBinding.segmentId,record.newBinding.fiberNumber).sides.some(s=>s.stop.portBindingId===record.newBinding!.id))return refuse('ბანკის მიბმა მიღებულ ადგილობრივ გადასვლას ან დასრულებას ეწინააღმდეგება.');
 next.operatorPortCorrections=[...(next.operatorPortCorrections??[]),...records];
 applyIteration28C(next);projectImportedUsage(next,next.fiberUsageProjection?.sourceEvidence??[]);
 const ids=new Set(records.flatMap(c=>c.newBinding?.id.startsWith('OPERATOR-BINDING-')?[c.newBinding.id]:[]));
 for(const summary of next.fiberJourneySummaries??[])if(summary.portBindingIds.some(id=>ids.has(id)))summary.projectionStatus='owner_confirmed';
 for(const lineage of next.currentFiberLineages??[])if(records.some(c=>c.newBinding?.id.startsWith('OPERATOR-BINDING-')&&lineage.legs.some(l=>l.segmentId===c.newBinding!.segmentId&&l.fiberNumber===c.newBinding!.fiberNumber)))lineage.projectionStatus='owner_confirmed';
 return next;
}
