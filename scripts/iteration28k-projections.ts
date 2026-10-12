import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {repository} from '../src/data/repository';
const data=await repository.load(),baseline=JSON.parse(readFileSync('docs/iteration28j-projection-preservation.json','utf8'));
const hashes:Record<string,string>={};
for(const [name,expected]of Object.entries(baseline.hashes)){
 const actual=createHash('sha256').update(JSON.stringify(data[name as keyof typeof data])).digest('hex');assert.equal(actual,expected,name);hashes[name]=actual;
}
const c148=data.cables.find(c=>c.legacyCableId==='148')!;
const counts={cables:data.cables.length,fibers:data.fibers.length,activeTransitions:data.nodeFiberTransitions!.filter(t=>t.active).length,lentekhiBindings:data.portTopologyBindings!.filter(b=>b.ownerType==='odf'&&b.ownerId.includes('LENTEKHI')).length,tsageriPorts:data.odfPorts!.filter(p=>data.odfs!.some(o=>o.id===p.odfId&&o.containedBy.id==='5')).length,c148Bindings:data.portTopologyBindings!.filter(b=>b.segmentId===c148.id).length};
assert.deepEqual(counts,{cables:37,fibers:2088,activeTransitions:1629,lentekhiBindings:48,tsageriPorts:192,c148Bindings:0});
const frozenManifest=createHash('sha256').update(readFileSync('reference/tsageri-lentekhi-v1.manifest.json')).digest('hex');assert.equal(frozenManifest,'59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125');
const output={timestamp:new Date().toISOString(),hashes,counts,frozenManifest,status:'passed'};writeFileSync('docs/iteration28k-projection-preservation.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
