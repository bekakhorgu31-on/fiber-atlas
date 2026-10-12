import inventoryJson from '../data/source-b-ap-inventory.json';
import type { AssetRef, Inventory, NetworkUseAssignment, SourceRef } from './types';
import { applyIteration28C } from './iteration28c';

export interface SourceBPort {
  id: string; apNumber: number; number: number; shapeId: string; occupancy: 'in_use'|'unused'|'unknown';
  administrativeAllocation: 'unknown'; commercialAvailability: 'unknown'; physicalCondition: 'unknown'; sourceState: string|null;
  certification: { bank: boolean; number: boolean; occupancy: boolean; binding: boolean };
  binding: { cable: string; fiberNumber: number; markerShapeId: string; numberShapeId: string; connectorShapeId: string }|null;
  alignment: Record<string,unknown>; reviewId: string|null; source: SourceRef;
}
export interface SourceBAP { apNumber:number; place:string; capacity:number; rootShapeId:string; numberShapeId:string; capacityShapeId:string; placeShapeId:string; grammarId:string; certification:{block:boolean;portBank:boolean};ports:SourceBPort[]; cableTokens:string[];source:SourceRef }
export interface CanonicalAPPort extends SourceBPort { canonicalNode: AssetRef; bindingId:string|null }
export interface SourceReviewCase {id:string;category:string;status:string;source:SourceRef;affectedIds:string[];question:string;observation:string;suspiciousReason:string;candidates:unknown[];proposal:unknown;interpretationBasis:string;engineerOptions:string[];confirmation:null;fieldVerified:false;bounds:unknown[]}
export const sourceBAPInventory = inventoryJson as unknown as {
  schemaVersion:number;grammarId:string;sourceSha256:string;counts:Record<string,number>;blocks:SourceBAP[];
  ownerConfirmations:Array<{id:string;basis:string;statement:string;fieldVerified:boolean}>;
  reviewCases:SourceReviewCase[];
  evidenceShapes:Array<{id:string;text:string;attributes:Record<string,string>;parentId:string|null;rootId:string;masterId:string|null;masterShapeId:string|null;geometry:Record<string,unknown>;effectiveStyle:Record<string,unknown>;properties:Record<string,string>;cells:unknown[];connects:unknown[]}>;
  assignments:Array<{id:string;organization:string;scope:'fiber';fibers:Array<{cable:string;fiberNumber:number}>;occurrenceIds:string[];sourceShapeIds:string[];source:SourceRef}>;
};
export const sourceBAP = (id:string) => sourceBAPInventory.blocks.find(b=>String(b.apNumber)===id);
export const sourceBPort = (id:string,number:number) => sourceBAP(id)?.ports.find(p=>p.number===number);
export const sourceBNode = (data:Inventory,id:string):AssetRef|undefined => data.networkNodes?.some(n=>n.id===id&&n.assetType==='ap')?{kind:'network_node',id}:data.accessPoints.some(a=>a.id===id)?{kind:'ap',id}:undefined;
export const sourceReviewCategories=['ap_symbol_uncertain','port_bank_uncertain','port_number_uncertain','port_status_uncertain','fiber_port_alignment_misaligned','fiber_port_binding_ambiguous','company_scope_uncertain','company_multiple_candidate_fibers','company_multiple_candidate_ports','duplicate_asset_candidate','source_inconsistency','possible_missing_asset'] as const;
export function validateIteration28D(data:Inventory):string[] {
  const errors:string[]=[];
  for(const block of sourceBAPInventory.blocks.filter(b=>!data.accessPoints.some(a=>a.id===String(b.apNumber)))) {
    const node=data.networkNodes?.find(n=>n.id===String(block.apNumber));
    if(node?.assetType!=='ap'||node.apEvidence?.rootShapeId!==block.rootShapeId) errors.push('Uncertified canonical AP '+block.apNumber);
    for(const p of block.ports) {
      const projected=data.apPorts?.find(port=>port.id===p.id);
      if(!projected||projected.occupancy!==p.occupancy||projected.commercialAvailability!=='unknown'||projected.administrativeAllocation!=='unknown') errors.push('AP Port claim drift '+p.id);
      const binding=data.portTopologyBindings?.find(b=>b.id==='28D-'+p.id), cable=binding?data.cables.find(c=>c.id===binding.segmentId):undefined;
      if(p.binding&&(!binding||binding.fiberNumber!==p.binding.fiberNumber||cable?.legacyCableId!==p.binding.cable.slice(1)||binding.canonicalNode?.id!==String(block.apNumber)||binding.canonicalNode?.kind!=='network_node'||binding.source.shapeIds.join(',')!==p.source.shapeIds.join(','))) errors.push('Unsupported AP binding '+p.id);
      if(!p.binding&&binding) errors.push('Fabricated AP binding '+p.id);
    }
  }
  for(const assignment of sourceBAPInventory.assignments) {
    const use=data.networkUseAssignments?.find(u=>u.id===assignment.id);
    if(!use||use.scope!=='fiber'||use.sourceShapeIds.join(',')!==assignment.sourceShapeIds.join(',')||use.fibers.length!==assignment.fibers.length||!use.fibers.every(f=>assignment.fibers.some(expected=>expected.fiberNumber===f.fiberNumber&&data.cables.find(c=>c.id===f.segmentId)?.legacyCableId===expected.cable.slice(1)))) errors.push('Company scope drift '+assignment.id);
  }
  return errors;
}
/** Source A's AP41 remains frozen. New Source B APs enrich the same canonical neutral nodes. */
export function applyIteration28D(data:Inventory):Inventory {
  for(const block of sourceBAPInventory.blocks) {
    const id=String(block.apNumber), node=data.networkNodes?.find(n=>n.id===id);
    if(data.accessPoints.some(a=>a.id===id)) continue;
    if(!node) { if(!data.accessPoints.some(a=>a.id===id)) throw Error('AP enrichment has no canonical asset '+id); continue; }
    node.assetType='ap';node.displayName='AP'+id;node.verification='documentation_reviewed';
    node.apEvidence={grammarId:block.grammarId,number:block.apNumber,place:block.place,capacity:block.capacity,rootShapeId:block.rootShapeId,source:block.source};
    node.notes=[...new Set([...node.notes,`${block.place} · ${block.capacity} Ports · ${block.grammarId} · root Shape ${block.rootShapeId}. Source interpreted, not field verified.`])];
    for(const port of block.ports) if(port.binding) {
      const local=port.binding;
      const cable=data.cables.find(c=>c.legacyCableId===local.cable.slice(1)&&[c.endpointA,c.endpointB].some(n=>n.kind==='network_node'&&n.id===id));
      const fiber=data.fibers.find(f=>f.cableId===cable?.id&&f.number===local.fiberNumber);
      const tube=data.tubes.find(t=>t.id===fiber?.tubeId);
      if(!cable||!fiber) throw Error(`Certified AP${id}/P${port.number} binding ${local.cable}/F${local.fiberNumber} is outside canonical Cable/Fiber inventory.`);
      const bindingId='28D-'+port.id;
      if(!(data.portTopologyBindings??=[]).some(p=>p.id===bindingId)) data.portTopologyBindings.push({id:bindingId,canonicalNode:{kind:'network_node',id},ownerType:'ap',ownerId:id,portNumber:port.number,segmentId:cable.id,fiberNumber:fiber.number,tubeNumber:tube?.number??null,tubeColor:tube?.physicalColor??null,fiberColor:fiber.physicalColor??null,role:'ap_ingress',directionLabel:`${cable.legacyLabels[0]} ↔ AP${id}`,routeId:null,orientation:'to_port',lineageIds:[],projectionStatus:'source_interpreted',source:port.source,notes:['Exact numbered marker, bank-local alignment and individual drawn connector. Physical operation unknown.']});
    }
  }
  data.apPorts=sourceBAPInventory.blocks.filter(b=>data.networkNodes?.some(n=>n.id===String(b.apNumber)&&n.assetType==='ap')).flatMap(b=>b.ports.map(p=>({...p,canonicalNode:{kind:'network_node' as const,id:String(b.apNumber)},bindingId:p.binding?'28D-'+p.id:null})));
  data.sourceReviewCases=sourceBAPInventory.reviewCases;
  const sourceDocument=data.sourceDocuments?.find(d=>d.sourceSha256===sourceBAPInventory.sourceSha256);
  if(sourceDocument) {
    sourceDocument.counts.accessPointOdfAssets=sourceBAPInventory.blocks.length;
    sourceDocument.counts.logicalApPorts=sourceBAPInventory.counts.ports;
    sourceDocument.completeness=sourceDocument.completeness.filter(c=>!['port_topology','ap_grammar','port_occupancy','company_use'].includes(c.id));
    sourceDocument.completeness.push(
      {id:'ap_grammar',label:'AP graphical grammar',state:'complete',summary:'Nine source AP blocks certified; AP41 overlap preserves the frozen physical object.',known:9,total:9},
      {id:'port_topology',label:'AP Port inventory and exact binding',state:'complete',summary:'216 source Ports / exact numbered Fiber bindings;192 new active bindings. Source B C172 additional AP44 correspondence remains review-only.',known:216,total:216},
      {id:'port_occupancy',label:'AP Port physical occupancy',state:'partial',summary:'13 in_use,202 unused,1 red status unknown. Green/Shape Data inconsistencies remain visible; commercial availability unknown.',known:215,total:216},
      {id:'company_use',label:'Company / network-use scope',state:'complete',summary:'All24 source occurrences have exact local Fiber attachment;22 assignments preserve duplicates.',known:24,total:24}
    );
    sourceDocument.notes=[...sourceDocument.notes.filter(n=>!n.includes('remain non-blocking enrichment')), 'Iteration28D: AP/Port/company evidence certified independently of unchanged Fiber transitions; eight structured review cases remain.'];
  }
  for(const item of sourceBAPInventory.assignments) {
    const name=item.organization.replace(/ \(Georgian label\)$/,''), organization=data.organizations.find(o=>o.name.toLowerCase()===name.toLowerCase()||o.aliases.some(a=>a.toLowerCase()===name.toLowerCase()));
    if(!organization) throw Error('Unknown Source B organization '+name);
    const pairs=item.fibers.map(f=>{
      const cable=data.cables.find(c=>c.legacyCableId===f.cable.slice(1)&&c.sourceRepresentations?.some(s=>/alpana|tvishi/i.test(s.file)))??data.cables.find(c=>c.legacyCableId===f.cable.slice(1)&&/alpana|tvishi/i.test(c.source.file));
      if(!cable) throw Error('Unresolved company canonical Cable '+f.cable);
      return {segmentId:cable.id,fiberNumber:f.fiberNumber};
    });
    const assignment:NetworkUseAssignment={id:item.id,organizationId:organization.id,scope:'fiber',fibers:pairs,fiberIds:pairs.map(p=>data.fibers.find(f=>f.cableId===p.segmentId&&f.number===p.fiberNumber)!.id),lineageIds:[],sourceShapeIds:item.sourceShapeIds,occurrenceIds:item.occurrenceIds,purpose:null,projectionStatus:'source_interpreted',interpretationRule:'source-b-company-numbered-line-attachment/1',source:item.source,notes:['Scope is the uniquely numbered marker attached to the transformed label-bearing line. No ownership, service, allocation or IRU inferred. Repeated occurrences retained.']};
    if(!(data.networkUseAssignments??=[]).some(a=>a.id===assignment.id)) data.networkUseAssignments.push(assignment);
  }
  // Same 28C authority; new certified Port stops may extend prior partial display paths.
  const result=applyIteration28C(data);
  for(const binding of result.portTopologyBindings??[]) if(binding.id.startsWith('28D-')) binding.lineageIds=(result.currentFiberLineages??[]).filter(l=>l.legs.some(leg=>leg.segmentId===binding.segmentId&&leg.fiberNumber===binding.fiberNumber)).map(l=>l.id);
  for(const use of result.networkUseAssignments??[]) if(use.id.startsWith('SOURCE-B-')) use.lineageIds=(result.currentFiberLineages??[]).filter(l=>l.legs.some(leg=>use.fibers.some(f=>f.segmentId===leg.segmentId&&f.fiberNumber===leg.fiberNumber))).map(l=>l.id);
  const errors=validateIteration28D(result);if(errors.length)throw Error(errors.join('; '));
  return result;
}
