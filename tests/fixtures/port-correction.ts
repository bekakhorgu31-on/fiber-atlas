import source from './shida-ap16-ap17-source.json';
import type {Inventory} from '../../src/domain/types';
import {projectImportedUsage} from '../../src/domain/importedUsage';
import {applyIteration28C} from '../../src/domain/iteration28c';
import {createHash} from 'node:crypto';
/** Known test connection from the existing AP16/AP17 fixture, with a synthetic Port7→F13 connection. Never AP18. */
export function correctionFixture():Inventory {
 const data=structuredClone(source) as unknown as Inventory;
 const nodes=data.networkNodes!,a=nodes.find(n=>n.apEvidence?.number===16)!,b=nodes.find(n=>n.apEvidence?.number===17)!;
 a.displayName='TEST AP A';b.displayName='TEST AP B';if(a.apEvidence)a.apEvidence.number=9001;if(b.apEvidence)b.apEvidence.number=9002;
 const src={file:'correction-fixture.vsdx',page:'test',pageId:'0',shapeIds:['PORT-A-7'],documentId:'CORRECTION-TEST',sourceRevision:'CORRECTION-TEST/'+('f'.repeat(64)),sourceSha256:'f'.repeat(64),importRunId:'11111111-1111-4111-8111-111111111111'};
 data.apPorts=data.apPorts!.filter(p=>p.canonicalNode.id!==a.id||p.number!==7);
 const p=data.apPorts!.find(p=>p.canonicalNode.id===a.id&&p.number===13)!;p.id='TEST-PORT';p.shapeId='PORT-A-7';p.number=7;p.apNumber=9001;p.source=src;p.bindingId=null;p.certification.binding=false;
 data.portTopologyBindings=data.portTopologyBindings!.filter(b=>b.ownerId!==a.id||![7,13].includes(b.portNumber));
 for(const c of data.cables)c.source={...src,shapeIds:['CABLE-'+c.legacyCableId]};
 for(const n of nodes)n.source=src;
 data.sourceDocuments=[{id:'CORRECTION-TEST',title:'Known synthetic Port correction fixture',sourceFile:src.file,sourceSha256:src.sourceSha256,sourcePages:[{id:'0',name:'test'}],reviewState:'reviewed_no_change',importedAssetIds:data.cables.map(c=>c.id),routeIds:[],externalBoundaryIds:[],counts:{aggregations:0,closures:1,cableSegments:data.cables.length,logicalFibers:data.fibers.length,accessPointOdfAssets:2,logicalOdfPorts:0,routes:0,externalContinuations:0,unresolvedAssertions:1,conflictingAssertions:0},completeness:[],source:src,notes:['Test fixture; no real AP18 binding.']}];
 data.sourceAnnotations=[];data.issues=[];data.sourceReviewCases=[{id:'TEST-CASE',category:'fiber_port_binding_ambiguous',status:'needs_review',source:src,affectedIds:[p.id],question:'Test Port connection',observation:'Exact known test mapping withheld until owner activation.',suspiciousReason:'test fixture',candidates:[],proposal:null,interpretationBasis:'test',engineerOptions:[],confirmation:null,fieldVerified:false,bounds:[]}];
 data.odfs=[];data.odfPorts=[];data.sourceConflicts=[];data.networkUseAssignments=[];
 data.operatorPortCorrections=[];applyIteration28C(data);projectImportedUsage(data,[]);return data;
}
/** Reproduces the owner's confirmed one-position bank shift, without using owner data. */
export function bankRemapFixture(legacy=false):Inventory{
 const data=correctionFixture(),anchor=data.apPorts!.find(p=>p.id==='TEST-PORT')!,node=anchor.canonicalNode;
 data.apPorts=data.apPorts!.filter(p=>p.canonicalNode.id!==node.id);
 for(let n=1;n<=24;n++)data.apPorts.push({...structuredClone(anchor),id:n===1?'TEST-PORT':'TEST-BANK-PORT-'+n,number:n,shapeId:'PORT-A-'+n});
 const cable=data.cables.find(c=>c.legacyCableId==='25-123')!,template=data.portTopologyBindings!.find(b=>b.ownerId===node.id)!;
 data.portTopologyBindings=data.portTopologyBindings!.filter(b=>b.ownerId!==node.id);
 for(let n=2;n<=24;n++)data.portTopologyBindings.push({...structuredClone(template),id:'SHIFTED-'+n,portNumber:n,segmentId:cable.id,fiberNumber:n-1});
 data.sourceReviewCases!.push({...structuredClone(data.sourceReviewCases![0]),id:'TEST-BANK-CASE-2',affectedIds:['TEST-BANK-PORT-2']});
 if(legacy){
   const ids=new Map<string,string>();
   for(const p of data.apPorts.filter(p=>p.canonicalNode.id===node.id)){
     const old=p.id;p.id='SHIDA-PORT-'+createHash('sha256').update('CORRECTION-TEST/'+p.shapeId).digest('hex').slice(0,24);ids.set(old,p.id);
     p.source={...p.source};delete p.source.documentId;delete p.source.sourceRevision;delete p.source.sourceSha256;delete p.source.importRunId;
   }
   for(const c of data.sourceReviewCases??[])c.affectedIds=c.affectedIds.map(id=>ids.get(id)??id);
 }
 applyIteration28C(data);projectImportedUsage(data,[]);return data;
}
/** Complete 24-Port hardware bank with a complete 20-Fiber Cable, as in AP20. */
export function partialBankRemapFixture():Inventory{
 const data=bankRemapFixture(),port=data.apPorts!.find(p=>p.id==='TEST-PORT')!,cable=data.cables.find(c=>c.legacyCableId==='25-123')!;
 cable.fiberCount=20;
 data.fibers=data.fibers.filter(f=>f.cableId!==cable.id||f.number<=20);
 data.nodeFiberTransitions=data.nodeFiberTransitions!.filter(t=>!(t.a.segmentId===cable.id&&t.a.fiberNumber>20)&&!(t.z?.segmentId===cable.id&&t.z.fiberNumber>20));
 data.portTopologyBindings=data.portTopologyBindings!.filter(b=>b.ownerId!==port.canonicalNode.id);
 data.sourceReviewCases!.push({...structuredClone(data.sourceReviewCases![0]),id:'TEST-BANK-CASE-24',affectedIds:['TEST-BANK-PORT-24']});
 applyIteration28C(data);projectImportedUsage(data,[]);return data;
}
