import { mkdir, writeFile } from 'node:fs/promises';
import { repository } from '../src/data/repository';
import { resolveCurrentFiberPath, stableSignature } from '../src/domain/currentFiberPath';
const generate = async () => {
  const data = await repository.load(); const projection = data.fiberPathProjection!;
  const c152 = data.cables.find(c=>c.legacyCableId==='152')!;
  const f11 = resolveCurrentFiberPath(data,c152.id,11);
  return JSON.stringify({schemaVersion:1,rule:projection.rule,topologyRevision:projection.topologyRevision,displayRevision:projection.displayRevision,counts:{cables:data.cables.length,fibers:data.fibers.length,transitions:data.nodeFiberTransitions?.length,sourceBExactTransitions:data.nodeFiberTransitions?.filter(t=>t.id.startsWith('27D-')).length,currentLineages:data.currentFiberLineages?.length,historicalLineages:data.fiberLineages?.length,...projection.counts},sourceImmutabilitySignature:stableSignature({cables:data.cables,fibers:data.fibers,transitions:data.nodeFiberTransitions,bindings:data.portTopologyBindings,conflicts:data.sourceConflicts}),goldenC152F11:f11,records:projection.audit},null,2)+'\n';
};
const first = await generate(), second = await generate(); if(first!==second)throw new Error('Current path audit is not byte-deterministic');
await mkdir('migration/iteration28c',{recursive:true}); await writeFile('migration/iteration28c/fiber-path-consistency.json',first);
console.log(JSON.stringify({deterministic:true,...JSON.parse(first).counts,golden:JSON.parse(first).goldenC152F11.sides.map((s:any)=>({legs:s.legs.map((l:any)=>l.segmentId+'/F'+l.fiberNumber),stop:s.stop}))},null,2));
