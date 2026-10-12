import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import fixture from './fixtures/shida-ap20-capacity-source.json';
import {compileShida} from '../scripts/compile-shida';
import {projectPortCorrection} from '../src/domain/portCorrection';
import {validateCurrentFiberPaths,createCurrentFiberPathResolver} from '../src/domain/currentFiberPath';
import type {Inventory} from '../src/domain/types';

function compile(semantic=structuredClone(fixture)){
 const directory=mkdtempSync(join('tmp','ap20-capacity-test-'));
 try{
  const file=join(directory,'proposal.json');
  compileShida(semantic,{documentId:'AP20-SOURCE-TEST',sourceRevision:'AP20-SOURCE-TEST/'+fixture.source.sha256,runId:'11111111-1111-4111-8111-111111111111',originalName:'Shida source fixture.vsdx',expectedRevision:null},file);
  return JSON.parse(readFileSync(file,'utf8')).authority as Inventory;
 }finally{rmSync(directory,{recursive:true,force:true});}
}
test('actual AP20 source imports 24 Fibers from FO24 banks and retains the contradictory 20F label',()=>{
 const data=compile(),cable=data.cables[0];
 assert.equal(cable.fiberCount,24);assert.equal(cable.legacyLabels![0],'25-134-25024-20-20');assert.equal(data.apPorts!.length,24);
 assert.deepEqual(data.fibers.map(f=>f.number),Array.from({length:24},(_,i)=>i+1));
 assert.equal(data.fibers.at(-1)!.physicalColor.key,'aqua');assert.equal(data.fibers[19].physicalColor.key,'black');
 assert.ok(['78894','11797','12096','11798','12097','11585'].every(id=>cable.source.shapeIds.includes(id)));
 const conflict=data.sourceConflicts!.find(c=>c.kind==='source_cable_capacity_conflict')!;
 assert.equal(conflict.declaredCapacity,20);assert.equal(conflict.resolvedCapacity,24);assert.equal(conflict.cableId,cable.id);
 const review=data.sourceReviewCases!.find(r=>r.category==='source_conflict')!;assert.deepEqual(review.affectedIds,[cable.id]);assert.ok(!review.affectedIds.includes('undefined'));
 assert.equal(data.nodeFiberTransitions!.length,0);assert.deepEqual(validateCurrentFiberPaths(data),[]);
});
test('capacity repair keeps the drawn Port shift until an explicit owner Remap maps all 24',()=>{
 const data=compile(),cable=data.cables[0],port=data.apPorts!.find(p=>p.number===1)!,doc=data.sourceDocuments![0];
 assert.equal(data.portTopologyBindings!.length,23);assert.ok(data.portTopologyBindings!.every(b=>b.portNumber===b.fiberNumber+1));
 const subject=data.sourceReviewCases!.find(r=>r.affectedIds.includes(port.id))!;
 const after=projectPortCorrection(data,{id:'11111111-2222-4333-8444-555555555555',subjectId:subject.id,sourceRevision:doc.id+'/'+doc.sourceSha256,portId:port.id,segmentId:cable.id,actorId:1,operation:'remap',evidenceBasis:'owner_confirmation',evidence:port.source,reason:'Owner confirms all 24 Fibers map to same-number Ports.'},'AP20-REMAP');
 assert.equal(after.portTopologyBindings!.length,24);assert.ok(after.portTopologyBindings!.every(b=>b.portNumber===b.fiberNumber));
 assert.equal(after.operatorPortCorrections!.length,24);assert.deepEqual(after.sourceConflicts,data.sourceConflicts);assert.deepEqual(after.apPorts,data.apPorts);
 const path=createCurrentFiberPathResolver(after).resolve(cable.id,24);assert.ok(path.sides.some(s=>s.stop.portBindingId===after.portTopologyBindings!.find(b=>b.portNumber===24)!.id));
 assert.deepEqual(validateCurrentFiberPaths(after),[]);
});
test('compiler refuses a capacity override without matching span evidence',()=>{
 const altered=structuredClone(fixture);altered.physicalBankPairs[0].status='unresolved_physical_label_association';assert.throws(()=>compile(altered),/Capacity resolution lacks matching source span evidence/);
 const missing=structuredClone(fixture);missing.labels[0].capacityEvidence.foShapeIds=[];missing.physicalBankPairs[0].capacityEvidence.foShapeIds=[];assert.throws(()=>compile(missing),/Capacity resolution lacks matching source span evidence/);
 const incomplete=structuredClone(fixture);incomplete.banks[0].markers.pop();assert.throws(()=>compile(incomplete),/Capacity resolution lacks matching source span evidence/);
});
