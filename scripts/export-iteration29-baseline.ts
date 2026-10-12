import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repository } from '../src/data/repository';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(projectRoot, 'migration/iteration29/baseline');
const inventoryPath = resolve(outputDirectory, 'active-28l-inventory.json.gz');
const manifestPath = resolve(outputDirectory, 'active-28l-manifest.json');
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const stable = (value: unknown): unknown => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stable(item)]))
    : value;

const inventory = await repository.load();
const json = JSON.stringify(stable(inventory)) + '\n';
const compressed = gzipSync(Buffer.from(json), { level: 9, mtime: 0 });
const paths = inventory.fiberPathProjection?.paths ?? {};
const sourceDocuments = (inventory.sourceDocuments ?? []).map(item => ({
  id: item.id, title: item.title, sourceFile: item.sourceFile, sourceSha256: item.sourceSha256,
  reviewState: item.reviewState, importedAssetIds: [...item.importedAssetIds].sort(), routeIds: [...item.routeIds].sort(),
})).sort((a, b) => a.id.localeCompare(b.id));
const manifest = {
  format: 'fiber-atlas-active-inventory-baseline',
  formatVersion: 1,
  baseline: 'active-28l',
  repositorySnapshot: inventory.snapshot,
  activeGraph: {
    pathRule: inventory.fiberPathProjection?.rule ?? null,
    topologyRevision: inventory.fiberPathProjection?.topologyRevision ?? null,
    displayRevision: inventory.fiberPathProjection?.displayRevision ?? null,
    fiberPathCount: Object.keys(paths).length,
    pathSignatureSha256: hash(JSON.stringify(Object.entries(paths).map(([key, path]) => [key, path.signature, path.state]).sort(([a], [b]) => String(a).localeCompare(String(b))))),
    activeTransitionCount: (inventory.nodeFiberTransitions ?? []).filter(item => item.active).length,
    activeTransitionSha256: hash(JSON.stringify(stable((inventory.nodeFiberTransitions ?? []).filter(item => item.active).sort((a, b) => a.id.localeCompare(b.id))))),
    portBindingCount: (inventory.portTopologyBindings ?? []).length,
    portBindingSha256: hash(JSON.stringify(stable([...(inventory.portTopologyBindings ?? [])].sort((a, b) => a.id.localeCompare(b.id))))),
    currentLineageCount: (inventory.currentFiberLineages ?? []).length,
    journeySummaryCount: (inventory.fiberJourneySummaries ?? []).length,
  },
  counts: {
    cables: inventory.cables.length, fibers: inventory.fibers.length, tubes: inventory.tubes.length,
    closures: inventory.closures.length, accessPoints: inventory.accessPoints.length,
    aggregations: inventory.aggregations.length, nodeFiberTransitions: inventory.nodeFiberTransitions?.length ?? 0,
    portTopologyBindings: inventory.portTopologyBindings?.length ?? 0,
    odfPorts: inventory.odfPorts?.length ?? 0, apPorts: inventory.apPorts?.length ?? 0,
    connections: inventory.connections.length, evidenceRecords: inventory.evidenceRecords?.length ?? 0,
    assertions: inventory.assertions?.length ?? 0, assertionReviewEvents: inventory.assertionReviewEvents?.length ?? 0,
    sourceAnnotations: inventory.sourceAnnotations?.length ?? 0, sourceReviewCases: inventory.sourceReviewCases?.length ?? 0,
    fiberUsageAssignments: inventory.fiberUseAssignments?.length ?? 0, networkUseAssignments: inventory.networkUseAssignments?.length ?? 0,
    sourceDocuments: inventory.sourceDocuments?.length ?? 0, importRuns: inventory.importRuns?.length ?? 0,
  },
  sourceDocuments,
  imports: (inventory.importRuns ?? []).map(run => ({ id: run.id, sourceFile: run.sourceFile, sourceSha256: run.sourceSha256, extractionMethod: run.extractionMethod, interpreter: run.interpreter })),
  content: { path: 'active-28l-inventory.json.gz', uncompressedBytes: Buffer.byteLength(json), uncompressedSha256: hash(json), compressedBytes: compressed.byteLength, compressedSha256: hash(compressed) },
};
const manifestText = JSON.stringify(stable(manifest), null, 2) + '\n';

mkdirSync(outputDirectory, { recursive: true });
if (process.argv.includes('--check')) {
  const existingInventory = readFileSync(inventoryPath);
  const existingManifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as typeof manifest;
  if (hash(existingInventory) !== manifest.content.compressedSha256 || JSON.stringify(stable(existingManifest)) !== JSON.stringify(stable(manifest))) {
    throw new Error('The active baseline is not reproducible from the current repository snapshot.');
  }
  if (hash(gunzipSync(existingInventory)) !== manifest.content.uncompressedSha256) throw new Error('The baseline gzip payload does not match its manifest.');
  console.log(JSON.stringify({ status: 'reproducible', ...manifest.content, topologyRevision: manifest.activeGraph.topologyRevision }));
} else {
  writeFileSync(inventoryPath, compressed);
  writeFileSync(manifestPath, manifestText);
  console.log(JSON.stringify({ status: 'written', ...manifest.content, topologyRevision: manifest.activeGraph.topologyRevision }));
}
