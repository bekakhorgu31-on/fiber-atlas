import test from 'node:test';
import assert from 'node:assert/strict';
import {correctionFixture,bankRemapFixture,partialBankRemapFixture} from './fixtures/port-correction';
import {projectPortCorrection,correctionImpact,reconcileImportCorrections,PortCorrectionValidationError,portCorrectionFailure,type PortCorrectionInput} from '../src/domain/portCorrection';
import {createCurrentFiberPathResolver} from '../src/domain/currentFiberPath';
import {shiftedPortBankCandidates} from '../src/domain/portBankRemap';
import {planPortBankRange} from '../src/domain/portBankRange';
const input=(data:ReturnType<typeof correctionFixture>):PortCorrectionInput=>({id:'11111111-2222-4333-8444-555555555555',subjectId:'TEST-CASE',sourceRevision:data.sourceDocuments![0].id+'/'+data.sourceDocuments![0].sourceSha256,portId:'TEST-PORT',segmentId:data.cables.find(c=>c.legacyCableId==='25-123')!.id,fiberNumber:13,actorId:1,operation:'set',evidenceBasis:'engineer_review',evidence:data.apPorts!.find(p=>p.id==='TEST-PORT')!.source,reason:'Known test source geometry confirms this connection.'});
test('typed correction changes only an exact selected endpoint after projection; original remains immutable',()=>{
 const data=correctionFixture(),draft=input(data),old=JSON.stringify(data),before=createCurrentFiberPathResolver(data).resolve(draft.segmentId!,13),after=projectPortCorrection(data,draft,'CORRECTED');
 assert.equal(before.state,'partial');assert.equal(JSON.stringify(data),old);const path=createCurrentFiberPathResolver(after).resolve(draft.segmentId!,13);assert.equal(path.state,'exact');assert.notEqual(path.signature,before.signature);
 assert.equal(after.operatorPortCorrections![0].newBinding!.portNumber,7);assert.equal(after.operatorPortCorrections![0].oldBinding,null);assert.equal(after.operatorPortCorrections![0].newBinding!.fiberNumber,13);assert.equal(after.operatorPortCorrections![0].fieldVerified,false);assert.equal(after.apPorts!.find(p=>p.id==='TEST-PORT')!.certification.binding,false);
 const impact=correctionImpact(data,after);assert.ok(impact.counts.changedPaths>=2);assert.equal(impact.counts.comparedFibers,data.fibers.length);assert.ok(impact.facts.some(f=>f.collection==='portTopologyBindings'));assert.ok(impact.facts.length<data.fibers.length*2);
});
test('owner-confirmed whole-bank Remap replaces shifted bindings atomically and preserves provenance',()=>{
 const data=bankRemapFixture(),draft={...input(data),operation:'remap' as const,evidenceBasis:'owner_confirmation' as const},original=JSON.stringify(data);
 const after=projectPortCorrection(data,draft,'BANK');assert.equal(JSON.stringify(data),original);
 assert.equal(shiftedPortBankCandidates(data).find(c=>c.portId==='TEST-PORT')?.offset,1);assert.ok(!shiftedPortBankCandidates(after).some(c=>c.portId==='TEST-PORT'));
 const owner=data.apPorts!.find(p=>p.id==='TEST-PORT')!.canonicalNode.id,bank=after.portTopologyBindings!.filter(b=>b.ownerId===owner);
 assert.equal(bank.length,24);assert.ok(bank.every(b=>b.portNumber===b.fiberNumber));assert.equal(after.operatorPortCorrections!.length,24);
 assert.equal(new Set(after.operatorPortCorrections!.map(c=>c.id)).size,24);
 assert.equal(after.operatorPortCorrections![0].oldBinding,null);assert.equal(after.operatorPortCorrections![1].oldBinding!.fiberNumber,1);
 assert.equal(correctionImpact(data,after).bankRows.length,24);
 assert.deepEqual(after.apPorts,data.apPorts);assert.deepEqual(after.nodeFiberTransitions,data.nodeFiberTransitions);
 for(const b of bank)assert.ok(createCurrentFiberPathResolver(after).resolve(b.segmentId,b.fiberNumber).sides.some(s=>s.stop.portBindingId===b.id));
 const restored=projectPortCorrection(after,{...draft,id:'22222222-2222-4333-8444-555555555555',operation:'revert',reverts:draft.id},'REVERSED');
 assert.deepEqual(restored.portTopologyBindings!.filter(b=>b.ownerId===owner),data.portTopologyBindings!.filter(b=>b.ownerId===owner));
 const fresh=bankRemapFixture(),rows=reconcileImportCorrections(after,fresh,'NEW-SOURCE');assert.equal(rows.length,24);assert.ok(rows.every(r=>r.status==='requires_owner_decision'));assert.ok(!fresh.portTopologyBindings!.some(b=>b.id.startsWith('OPERATOR-')));
});
test('bank Remap rejects missing/duplicate numbering, mixed source, mixed Cable, foreign endpoints and stale reversal',()=>{
 const data=bankRemapFixture(),draft={...input(data),operation:'remap' as const,evidenceBasis:'owner_confirmation' as const};
 assert.throws(()=>projectPortCorrection(data,{...draft,evidenceBasis:'engineer_review'},'X'),PortCorrectionValidationError);
 for(const change of [ (d:typeof data)=>{d.apPorts!.find(p=>p.id==='TEST-PORT')!.number=2;},(d:typeof data)=>{d.apPorts!.find(p=>p.id==='TEST-PORT')!.source.sourceRevision='OTHER';},(d:typeof data)=>{d.portTopologyBindings!.find(b=>b.id==='SHIFTED-2')!.segmentId='OTHER';},(d:typeof data)=>{d.fibers=d.fibers.filter(f=>f.cableId!==draft.segmentId||f.number!==24);},(d:typeof data)=>{const b=structuredClone(d.portTopologyBindings!.find(b=>b.id==='SHIFTED-2')!);d.portTopologyBindings!.push({...b,id:'FOREIGN',ownerType:'odf',ownerId:'OTHER',portNumber:1});}]){const invalid=structuredClone(data);change(invalid);assert.throws(()=>projectPortCorrection(invalid,draft,'X'),PortCorrectionValidationError);}
 const after=projectPortCorrection(data,draft,'BANK'),edited=projectPortCorrection(after,{...draft,id:'33333333-2222-4333-8444-555555555555',operation:'set',fiberNumber:1},'EDITED');
 assert.throws(()=>projectPortCorrection(edited,{...draft,operation:'revert',reverts:draft.id},'X'),PortCorrectionValidationError);
 // The established, intentionally different Port7→F13 fixture is never automatically remapped.
 assert.throws(()=>projectPortCorrection(correctionFixture(),draft,'X'),PortCorrectionValidationError);
});
test('older unqualified Port evidence inherits only unambiguous canonical-node source membership',()=>{
 const data=bankRemapFixture(true),anchor=data.apPorts!.find(p=>p.apNumber===9001&&p.number===1)!,draft={...input(bankRemapFixture()),portId:anchor.id,operation:'remap' as const,evidenceBasis:'owner_confirmation' as const};
 assert.equal(projectPortCorrection(data,draft,'LEGACY').operatorPortCorrections!.length,24);
 const other={...structuredClone(data.sourceDocuments![0]),id:'OTHER-DOCUMENT'};const c=data.cables.find(c=>c.id===draft.segmentId)!;
 c.source={...c.source};delete c.source.documentId;delete c.source.sourceRevision;delete c.source.sourceSha256;data.sourceDocuments!.push(other);
 assert.throws(()=>projectPortCorrection(data,draft,'AMBIGUOUS'),PortCorrectionValidationError);
});
test('20-Fiber bank Remap maps only Ports1–20, preserves outside bindings, reverses and reconciles only affected members',()=>{
 const data=partialBankRemapFixture(),draft={...input(data),operation:'remap' as const,evidenceBasis:'owner_confirmation' as const},owner=data.apPorts!.find(p=>p.id==='TEST-PORT')!.canonicalNode.id;
 // An unrelated Cable on Port24 must survive the replacement and its reversal byte-for-byte.
 const cable={...structuredClone(data.cables.find(c=>c.id===draft.segmentId)!),id:'OTHER-LOCAL-CABLE',legacyCableId:'OTHER-LOCAL'};data.cables.push(cable);data.sourceDocuments![0].importedAssetIds.push(cable.id);
 data.fibers.push(...data.fibers.filter(f=>f.cableId===draft.segmentId).map(f=>({...structuredClone(f),id:'OTHER-'+f.id,cableId:cable.id})));
 const spare={...structuredClone(data.portTopologyBindings![0]),id:'OUTSIDE-RANGE',canonicalNode:data.apPorts!.find(p=>p.id==='TEST-PORT')!.canonicalNode,ownerId:owner,portNumber:24,segmentId:cable.id,fiberNumber:1};data.portTopologyBindings!.push(spare);
 const original=JSON.stringify(data),after=projectPortCorrection(data,draft,'TWENTY');assert.equal(JSON.stringify(data),original);
 const bank=after.portTopologyBindings!.filter(b=>b.ownerId===owner);assert.equal(bank.length,21);assert.deepEqual(bank.find(b=>b.id===spare.id),spare);
 assert.equal(after.operatorPortCorrections!.length,20);assert.ok(after.operatorPortCorrections!.every(c=>c.newBinding!.fiberNumber===c.newBinding!.portNumber&&c.newBinding!.portNumber<=20));
 assert.equal(correctionImpact(data,after).bankRows.length,20);assert.deepEqual(after.apPorts,data.apPorts);assert.deepEqual(after.nodeFiberTransitions,data.nodeFiberTransitions);
 const reversed=projectPortCorrection(after,{...draft,id:'22222222-2222-4333-8444-555555555555',operation:'revert',reverts:draft.id},'REVERSE');assert.deepEqual(reversed.portTopologyBindings!.filter(b=>b.ownerId===owner),[spare]);
 const rows=reconcileImportCorrections(after,structuredClone(data),'FRESH');assert.equal(rows.length,20);assert.ok(rows.every(r=>r.status==='requires_owner_decision'));
});
test('shifted bindings outside the target range are explicitly cleared and exactly restored by group reversal',()=>{
 const data=partialBankRemapFixture(),draft={...input(data),operation:'remap' as const,evidenceBasis:'owner_confirmation' as const},owner=data.apPorts!.find(p=>p.id==='TEST-PORT')!.canonicalNode.id;
 const shifted={...structuredClone(data.portTopologyBindings![0]),id:'SHIFTED-21',canonicalNode:data.apPorts!.find(p=>p.id==='TEST-PORT')!.canonicalNode,ownerId:owner,portNumber:21,segmentId:draft.segmentId!,fiberNumber:20};data.portTopologyBindings!.push(shifted);
 const after=projectPortCorrection(data,draft,'SHIFT');assert.equal(after.operatorPortCorrections!.length,21);
 const cleared=after.operatorPortCorrections!.find(c=>c.portId==='TEST-BANK-PORT-21')!;assert.deepEqual(cleared.oldBinding,shifted);assert.equal(cleared.newBinding,null);
 assert.ok(!after.portTopologyBindings!.some(b=>b.ownerId===owner&&b.portNumber===21));assert.equal(correctionImpact(data,after).bankRows.find(r=>r.portNumber===21)!.after,null);
 const reverse=projectPortCorrection(after,{...draft,id:'22222222-2222-4333-8444-555555555555',operation:'revert',reverts:draft.id},'UNDO');assert.deepEqual(reverse.portTopologyBindings!.filter(b=>b.ownerId===owner),[shifted]);
});
test('shared bank range planner accepts a smaller complete Cable but refuses occupied targets, oversized and incomplete ranges',()=>{
 const ports=Array.from({length:24},(_,i)=>({id:'P'+(i+1),number:i+1})),fibers=Array.from({length:20},(_,i)=>({number:i+1})),base={ports,fibers,fiberCount:20,bindings:[],segmentId:'C',anchorId:'P1'};
 assert.deepEqual(planPortBankRange(base),{ready:true,rows:ports.slice(0,20).map(p=>({portId:p.id,portNumber:p.number,fiberNumber:p.number})),mappedCount:20,untouchedCount:4,clearedCount:0});
 const spare={portNumber:24,fiberNumber:1,segmentId:'OTHER'};assert.equal(planPortBankRange({...base,bindings:[spare]}).ready,true);
 for(const patch of [{bindings:[{...spare,portNumber:20}]},{fiberCount:25},{fibers:fibers.slice(1)},{ports:ports.map(p=>p.number===24?{...p,number:23}:p)},{ports:ports.map(p=>p.number===24?{...p,id:'P1'}:p)},{anchorId:'P24'},{bindings:[{portNumber:21,fiberNumber:21,segmentId:'C'}]},{bindings:[spare,spare]},{restorePortIds:['P1']}])assert.equal(planPortBankRange({...base,...patch}).ready,false);
});
test('unbound number matching, foreign Cable, nonexistent Fiber and occupied endpoint do not create a candidate',()=>{
 const data=correctionFixture(),draft=input(data);assert.throws(()=>projectPortCorrection(data,{...draft,portId:'WRONG'},'X'),/canonical/);assert.throws(()=>projectPortCorrection(data,{...draft,segmentId:data.cables.find(c=>c.legacyCableId==='25-122')!.id},'X'),/incident/);assert.throws(()=>projectPortCorrection(data,{...draft,fiberNumber:999},'X'),/incident/);
 assert.throws(()=>projectPortCorrection(data,{...draft,fiberNumber:1},'X'),(e:unknown)=>e instanceof PortCorrectionValidationError&&e.failure.code==='fiber_endpoint_occupied');
 try{projectPortCorrection(data,{...draft,fiberNumber:1},'X');assert.fail('Occupied endpoint accepted');}catch(e){const failure=portCorrectionFailure(e);assert.equal(failure.conflicts?.[0].portNumber,1);assert.equal(failure.selected?.fiberNumber,1);assert.ok(!failure.message.includes('portCorrection.ts'));}
 assert.ok(!portCorrectionFailure(new Error('private runtime/path.ts')).message.includes('private runtime'));
 for(const b of data.portTopologyBindings!)if(b.fiberNumber===1)b.canonicalNode=undefined;assert.throws(()=>projectPortCorrection(data,{...draft,fiberNumber:1},'X'),(e:unknown)=>e instanceof PortCorrectionValidationError&&e.failure.code==='fiber_endpoint_occupied');
});
test('explicit validated reversal restores original unknown endpoint and preserves both decisions',()=>{
 const data=correctionFixture(),draft=input(data),after=projectPortCorrection(data,draft,'FIRST'),reverse=projectPortCorrection(after,{...draft,id:'REVERSE',operation:'revert',reverts:draft.id},'SECOND');
 assert.equal(createCurrentFiberPathResolver(reverse).resolve(draft.segmentId!,13).signature,createCurrentFiberPathResolver(data).resolve(draft.segmentId!,13).signature);assert.equal(reverse.operatorPortCorrections!.length,2);assert.equal(reverse.operatorPortCorrections![1].newBinding,null);
 assert.throws(()=>projectPortCorrection(reverse,{...draft,id:'AGAIN',operation:'revert',reverts:draft.id},'THIRD'),/stale/);
 const fresh=correctionFixture(),manual=after.operatorPortCorrections![0].newBinding!;
 fresh.portTopologyBindings!.push({...structuredClone(manual),id:'FRESH-SOURCE-BINDING',projectionStatus:'source_interpreted'});
 const bindings=JSON.stringify(fresh.portTopologyBindings);const agreed=reconcileImportCorrections(after,fresh,'FRESH-RUN');assert.equal(agreed[0].status,'agrees_with_source');assert.equal(JSON.stringify(fresh.portTopologyBindings),bindings);assert.equal(fresh.operatorPortCorrections!.length,1);
 const unknown=correctionFixture();const rejected=reconcileImportCorrections(after,unknown,'CHANGED-RUN');assert.equal(rejected[0].status,'requires_owner_decision');assert.ok(!unknown.portTopologyBindings!.some(b=>b.id===manual.id));assert.equal(unknown.operatorPortCorrections!.length,1);
});
