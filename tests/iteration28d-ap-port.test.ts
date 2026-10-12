import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import audit from '../migration/iteration28d/source-b-ap-port-audit.json';
import companyAudit from '../migration/iteration28d/source-b-network-use-audit.json';
import { evaluateAPGrammar,uniqueAlignment } from '../scripts/source-b-ap-grammar.mjs';
import { repository,loadFrozenV1Reference } from '../src/data/repository';
import { applyIteration27D } from '../src/domain/iteration27d';
import { applyIteration28B } from '../src/domain/iteration28b';
import { applyIteration28C } from '../src/domain/iteration28c';
import { applyIteration28D,sourceBAPInventory,sourceBPort } from '../src/domain/iteration28d';
import { currentAssetLabel, resolveCurrentFiberPath,validateCurrentFiberPaths } from '../src/domain/currentFiberPath';
import { createEngineerQueryService } from '../src/domain/engineerQuery';
const ready=repository.load();
const base=loadFrozenV1Reference().then(applyIteration27D).then(applyIteration28B).then(applyIteration28C);

test('28D actual AP42 source grammar owns number, capacity, place and complete numbered bank',()=>{
 const b=audit.blocks.find(b=>b.apNumber===42)!;
 assert.equal(b.rootShapeId,'23800');assert.equal(b.place,'ორბელი');assert.equal(b.capacity,24);
 assert.deepEqual(b.ports.map(p=>p.number),Array.from({length:24},(_,i)=>i+1));
 assert.deepEqual(b.ports.map(p=>p.binding?.fiberNumber),Array.from({length:24},(_,i)=>i+1));
 assert.ok(b.ports.every(p=>p.binding?.cable==='C153'&&p.binding.connectorShapeId&&p.alignment.candidates.length===1));
});
test('28D complete source scan and independent extraction fingerprints agree',()=>{
 assert.equal(audit.scan.totalPageShapes,9707);assert.equal(new Set(audit.extractionFingerprints).size,1);
 assert.equal(createHash('sha256').update(readFileSync('imports/inbox/Tsageri-Alpana-Tvishi.vsdx')).digest('hex'),audit.sourceSha256);
 assert.deepEqual(audit.blocks.map(b=>b.apNumber),[41,42,43,44,45,46,47,48,49]);
 assert.equal(audit.counts.ports,216);assert.equal(audit.counts.boundPorts,216);
 assert.ok(audit.verifiedTransitionMarkers>2000);
});
test('28D real negative shapes never become APs, Ports or occupancy records',()=>{
 for(const fixture of audit.negativeGoldenCases) {
   assert.ok(!audit.blocks.some(b=>b.rootShapeId===fixture.shapeId));
   assert.ok(!audit.blocks.flatMap(b=>b.ports).some(p=>p.shapeId===fixture.shapeId));
 }
 assert.ok(audit.negativeGoldenCases.some(g=>g.expected==='green_fiber_marker_not_port'));
});
test('28D actual slight drawing offsets remain inside bank-specific nonoverlapping tolerances',()=>{
 const ports=audit.blocks.flatMap(b=>b.ports);
 assert.ok(ports.some(p=>p.alignment.deltaX!=null&&Math.abs(p.alignment.deltaX)>.004));
 for(const p of ports) {
  assert.ok(p.alignment.deltaX!=null&&Math.abs(p.alignment.deltaX)<p.alignment.xTolerance);
  assert.ok(p.alignment.xTolerance<p.alignment.portPitch/2);
  assert.equal(p.alignment.connectorIds.length,1);assert.equal(p.alignment.candidates.length,1);
 }
});
test('28D purple fill, number/name or endpoint token alone cannot certify AP grammar',()=>{
 const original=audit.blocks.find(b=>b.apNumber===42)!;
 const c={group:{parent_id:null,attributes:{Type:'Group'},effective_style:{FillForegnd:{rgb:'#cc99ff'},FillPattern:{value:'1'}}},properties:{Row_1:'42',Row_2:'ორბელი',Row_3:'24'},children:[{text:'42',callout:'42'},{text:'ორბელი',callout:'ორბელი'},{text:'24',callout:'24'}]};
 assert.equal(evaluateAPGrammar(c).matched,true);assert.equal(original.grammarId,evaluateAPGrammar(c).matched&&sourceBAPInventory.grammarId);
 assert.equal(evaluateAPGrammar({...c,children:[]}).matched,false);
 assert.equal(evaluateAPGrammar({...c,properties:{...c.properties,Row_2:''}}).matched,false);
 assert.equal(evaluateAPGrammar({...c,group:{...c.group,effective_style:{...c.group.effective_style,FillForegnd:{rgb:'#ffffff'}}}}).matched,false);
});
test('28D alignment tolerates local drawing error but rejects competition and missing markers',()=>{
 assert.equal(uniqueAlignment({x:1,y:2},[{x:1.012,y:2,id:'a'}],.025,.003).certified,true);
 assert.equal(uniqueAlignment({x:1,y:2},[{x:1.012,y:2,id:'a'},{x:1.018,y:2,id:'b'}],.025,.003).certified,false);
 assert.equal(uniqueAlignment({x:1,y:2},[{x:1.09,y:2,id:'a'}],.025,.003).certified,false);
});
test('28D occupancy is independent of numbering/binding and never creates commercial availability',()=>{
 assert.equal(sourceBPort('42',1)?.occupancy,'in_use');assert.equal(sourceBPort('42',3)?.occupancy,'in_use');assert.equal(sourceBPort('42',2)?.occupancy,'unused');
 assert.equal(sourceBPort('47',3)?.occupancy,'unknown');assert.ok(sourceBPort('47',3)?.binding);
 for(const b of sourceBAPInventory.blocks)for(const p of b.ports){assert.equal(p.administrativeAllocation,'unknown');assert.equal(p.commercialAvailability,'unknown');assert.equal(p.physicalCondition,'unknown');}
 assert.ok(sourceBAPInventory.reviewCases.some(c=>c.category==='port_status_uncertain'&&c.source.shapeIds.includes('28576')));
});
test('28D enriches existing canonical nodes without duplicates or endpoint/transition mutation',async()=>{
 // Exercise the historical 28D stage in isolation; 28L legitimately adds two later edges.
 const before=await base,after=applyIteration28D(structuredClone(before));
 assert.deepEqual(after.cables.map(c=>[c.id,c.endpointA,c.endpointB]),before.cables.map(c=>[c.id,c.endpointA,c.endpointB]));
 assert.deepEqual(after.nodeFiberTransitions,before.nodeFiberTransitions);assert.equal(after.nodeFiberTransitions?.length,1629);
 assert.equal(after.cables.length,37);assert.equal(after.fibers.length,2088);
 assert.deepEqual(after.accessPoints,before.accessPoints);
 for(let id=42;id<=49;id++){assert.equal(after.networkNodes?.filter(n=>n.id===String(id)).length,1);assert.equal(after.networkNodes?.find(n=>n.id===String(id))?.assetType,'ap');assert.equal(currentAssetLabel(after,{kind:'network_node',id:String(id)}),'AP'+id);}
 assert.equal(after.apPorts?.length,192);assert.equal(after.portTopologyBindings?.filter(p=>p.id.startsWith('28D-')).length,192);
 assert.deepEqual(after.portTopologyBindings?.filter(p=>!p.id.startsWith('28D-')),before.portTopologyBindings);
 const sourceDoc=after.sourceDocuments?.find(d=>/Alpana/.test(d.sourceFile));assert.equal(sourceDoc?.counts.logicalApPorts,216);assert.equal(sourceDoc?.counts.accessPointOdfAssets,9);
 assert.ok(!sourceDoc?.completeness.some(c=>c.id==='port_topology'&&c.state==='not_present_in_source'));
});
test('28D certified AP42 Port1 opens same current C153/F1 graph journey',async()=>{
 const data=await ready,c=data.cables.find(c=>c.legacyCableId==='153')!;
 const p=resolveCurrentFiberPath(data,c.id,1);assert.ok(p.sides.some(s=>s.stop.kind==='port'&&s.stop.node.id==='42'));
 const q=createEngineerQueryService(data);assert.equal(q.run('AP42 Port1').pathSignature,p.signature);assert.equal(q.run('C153/F1').pathSignature,p.signature);
 assert.ok(q.run('AP42 occupied Ports').answer.includes('1, 3'));
 assert.ok(q.search('AP42').some(r=>r.id==='node:42'));assert.ok(q.search('ორბელი').some(r=>r.id==='node:42'));
});
test('28D F11 gains certified AP49 Port11 while preserving every 28C transition',async()=>{
 const data=await ready,before=await base,c=data.cables.find(c=>c.legacyCableId==='152')!;
 const path=resolveCurrentFiberPath(data,c.id,11),old=resolveCurrentFiberPath(before,c.id,11);
 assert.deepEqual(path.sides.flatMap(s=>s.transitions.map(t=>t.id)),old.sides.flatMap(s=>s.transitions.map(t=>t.id)));
 assert.equal(path.sides.find(s=>s.stop.node.id==='49')?.stop.kind,'port');assert.equal(path.state,'partial');
 assert.ok(data.portTopologyBindings?.some(b=>b.id===path.sides.find(s=>s.stop.node.id==='49')?.stop.portBindingId&&b.portNumber===11));
});
test('28D all paths remain graph verified and F118, Port38, F32 regressions survive',async()=>{
 const data=await ready;assert.deepEqual(validateCurrentFiberPaths(data),[]);assert.equal(data.fiberJourneySummaries?.length,2088);
 assert.equal(resolveCurrentFiberPath(data,'CAB-000151',118).sides.find(s=>s.stop.node.id==='207')?.stop.kind,'no_transition');
 const p38=resolveCurrentFiberPath(data,'CAB-000184',38);assert.ok(p38.sides.some(s=>s.stop.kind==='termination'&&s.stop.node.id==='225'));
 const f32=resolveCurrentFiberPath(data,'CAB-000176',32);assert.ok(f32.sides.some(s=>s.stop.node.id==='52'));assert.ok(!JSON.stringify(f32).includes('"id":"218"'));
});
test('28D all 24 rotated company labels have source-specific dispositions and scopes',()=>{
 assert.equal(companyAudit.occurrences.length,24);assert.equal(companyAudit.assignments.length,22);
 assert.ok(companyAudit.occurrences.every(o=>o.status==='source_interpreted'&&o.scope==='fiber'&&o.observations.some(p=>p.certified&&p.candidates.length===1)));
 assert.equal(companyAudit.occurrences.filter(o=>o.organization==='Magti').length,10);assert.equal(companyAudit.occurrences.filter(o=>o.organization.startsWith('OpenNet')).length,8);assert.equal(companyAudit.occurrences.filter(o=>o.organization==='Silknet').length,5);assert.equal(companyAudit.occurrences.filter(o=>o.organization==='Skytel').length,1);
 assert.ok(companyAudit.assignments.some(a=>a.occurrenceIds.length===2&&a.fibers[0].cable==='C161'&&a.fibers[0].fiberNumber===20));
});
test('28D assignments retain provenance without generating rights or services',async()=>{
 const data=await ready,before=await base;
 assert.equal(data.networkUseAssignments?.filter(u=>u.id.startsWith('SOURCE-B-')).length,22);
 assert.deepEqual(data.services,before.services);assert.deepEqual(data.rights,before.rights);assert.deepEqual(data.assignments,before.assignments);
 assert.ok(createEngineerQueryService(data).run('Skytel uses which fibers?').facts.some(f=>f.includes('F156')));
});
test('28D real review cases preserve source, precise questions and separate confirmations',()=>{
 assert.equal(sourceBAPInventory.reviewCases.length,8);
 for(const c of sourceBAPInventory.reviewCases){assert.ok(c.question&&c.observation&&c.source.shapeIds.length&&c.affectedIds.length);assert.equal(c.confirmation,null);assert.equal(c.fieldVerified,false);assert.ok(c.engineerOptions.length);}
 assert.ok(sourceBAPInventory.reviewCases.some(c=>c.category==='fiber_port_binding_ambiguous'&&c.affectedIds.includes('SRC-TSAGERI-ALPANA-TVISHI-419DEF34-C172')));
});
test('28D application is idempotent and never changes frozen reference manifest',async()=>{
 const data=structuredClone(await ready),before=JSON.stringify(data.portTopologyBindings);applyIteration28D(data);assert.equal(JSON.stringify(data.portTopologyBindings),before);
 assert.equal(createHash('sha256').update(readFileSync('reference/tsageri-lentekhi-v1.manifest.json')).digest('hex'),'59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125');
});
