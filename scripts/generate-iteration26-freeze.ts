import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { repository } from '../src/data/repository';
import { validateIteration26 } from '../src/domain/iteration26';

const output = resolve(process.argv[2] ?? 'reference');
mkdirSync(output, { recursive: true });
const data = await repository.load();
const errors = validateIteration26(data);
if (errors.length) throw new Error(errors.join('\n'));

const stable = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const sha = (buffer: Buffer | string) => createHash('sha256').update(buffer).digest('hex');
const write = (name: string, value: unknown) => { const body = stable(value); writeFileSync(join(output, name), body); return sha(body); };
const canonical = <T extends { id: string }>(items: T[] | undefined) => [...(items ?? [])].sort((a,b) => a.id.localeCompare(b.id));

const inventory = {
  referenceDataset: data.referenceDataset,
  counts: { cables: data.cables.length, fibers: data.fibers.length, tubes: data.tubes.length, closures: data.closures.length, accessPoints: data.accessPoints.length,
    aggregations: data.aggregations.length, portTopologyBindings: data.portTopologyBindings?.length ?? 0, nodeFiberTransitions: data.nodeFiberTransitions?.length ?? 0,
    activeFiberLineages: data.fiberLineages?.length ?? 0, supersededFiberLineages: data.supersededFiberLineages?.length ?? 0, journeySummaries: data.fiberJourneySummaries?.length ?? 0,
    companyAssignments: data.networkUseAssignments?.length ?? 0 },
  cables: canonical(data.cables).map(c => ({ id:c.id, legacyCableId:c.legacyCableId, legacyLabels:c.legacyLabels, fiberCount:c.fiberCount, endpointA:c.endpointA, endpointB:c.endpointB })),
  boundaries: canonical(data.externalBoundaries),
};
const transitions = canonical(data.nodeFiberTransitions).map(t => ({ id:t.id, node:t.node, a:t.a, z:t.z, port:t.port, transitionType:t.transitionType, operation:t.operation,
  projectionStatus:t.projectionStatus, active:t.active, interpretationBasis:t.interpretationBasis, source:t.source, notes:t.notes }));
const lineages = canonical(data.fiberLineages).map(l => ({ id:l.id, endpointA:l.endpointA, endpointB:l.endpointB, legs:l.legs, transitions:l.transitions,
  projectionStatus:l.projectionStatus, lifecycleStatus:l.lifecycleStatus, interpretationRule:l.interpretationRule, warnings:l.warnings }));
const lineageByFiber = (segmentId:string, fiberNumber:number) => lineages.find(l => l.legs.some(leg => leg.segmentId===segmentId && leg.fiberNumber===fiberNumber));
const golden = {
  c172: [1,29,31].map(number => ({ number, lineage: lineageByFiber('CAB-000172', number) })),
  sc219F32: lineageByFiber('CAB-000176',32),
  lentekhiPort32: { binding: data.portTopologyBindings?.find(b=>b.ownerId==='ODF-LENTEKHI-01'&&b.portNumber===32), lineage: lineageByFiber('CAB-000184',32) },
  lentekhiPort38: { binding: data.portTopologyBindings?.find(b=>b.ownerId==='ODF-LENTEKHI-01'&&b.portNumber===38), lineage: lineageByFiber('CAB-000184',38), journey:data.fiberJourneySummaries?.find(j=>j.segmentId==='CAB-000184'&&j.fiberNumber===38) },
  sc225: transitions.filter(t=>t.node.id==='225'&&t.a.segmentId==='CAB-000181'),
  ap51Port3: data.portTopologyBindings?.find(b=>b.ownerType==='ap'&&b.ownerId==='51'&&b.portNumber===3),
  companyExamples: canonical(data.networkUseAssignments).slice(0,8),
  occupancyExamples: (data.apPortFlows ?? []).filter(f=>['in_use','unused'].includes(f.physicalUsage)).slice(0,8),
};
const semantics = {
  status: data.referenceDataset?.status, pendingManualReview: 0, fieldVerification: 'none', categories: data.referenceDataset?.semanticCounts,
  sc225: { ap54: [1,2,3,4], terminating:[5,6,7,8,9,10,11,12,17,18,19,20,21,22,23,24], ap53:[13,14,15,16] },
  gaps: [
    { id:'lentekhi-legacy-number', category:'source_conflict', reason:'The heading identifies 6 while the source Property identifies 5; canonical endpoint AGG-LENTEKHI remains known.' },
    { id:'splice-mechanism', category:'not_present_in_source', reason:'The current Visio does not encode splice tray, mechanism, pigtail, patch cord, field condition, manufacturer or model.' },
    { id:'ambrolauri-continuation', category:'external_document_boundary', reason:'Continuation is documented in another Visio that has not been supplied or imported.' },
  ],
};
const hashes: Record<string,string> = {};
hashes['tsageri-lentekhi-v1.inventory.json'] = write('tsageri-lentekhi-v1.inventory.json', inventory);
hashes['tsageri-lentekhi-v1.transitions.json'] = write('tsageri-lentekhi-v1.transitions.json', transitions);
hashes['tsageri-lentekhi-v1.lineages.json'] = write('tsageri-lentekhi-v1.lineages.json', lineages);
hashes['tsageri-lentekhi-v1.golden-fixtures.json'] = write('tsageri-lentekhi-v1.golden-fixtures.json', golden);
hashes['tsageri-lentekhi-v1.semantic-summary.json'] = write('tsageri-lentekhi-v1.semantic-summary.json', semantics);
const externalFiles = [
  resolve('..','Tsageri-Lentekhi 2025.vsdx'), resolve('migration/iteration24/tsageri-lentekhi.iteration24.raw.json.gz'),
  resolve('src/data/iteration25-company-usage.json'), resolve('src/data/iteration25-port-interpretation.json'), resolve('src/data/source-annotations.json'),
];
for (const file of externalFiles) hashes[basename(file)] = sha(readFileSync(file));
writeFileSync(join(output,'tsageri-lentekhi-v1.manifest.json'), stable({
  id:'TSAGERI-LENTEKHI-REFERENCE-V1', status:'READY', source:{ file:'Tsageri-Lentekhi 2025.vsdx', sha256:data.referenceDataset?.sourceSha256 },
  versions:{ importer:data.referenceDataset?.importerVersion, geometryStyleResolver:data.referenceDataset?.geometryResolverVersion, interpreter:data.referenceDataset?.interpreterVersion },
  generatedAt:data.referenceDataset?.generatedAt, ownerConfirmationRevision:data.referenceDataset?.ownerConfirmationRevision,
  counts:inventory.counts, fieldVerified:false, pendingManualReview:0, hashes,
  canonicalMatchingRules:['Match across documents using source provenance, endpoint context and geometry together.','Never merge by displayed number, name or Fiber number alone.','Leave next document and linked route nullable until the second source is imported.'],
}));
console.log(`Generated ${Object.keys(hashes).length + 1} deterministic reference records in ${output}`);
