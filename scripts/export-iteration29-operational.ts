import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync,gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {isDeepStrictEqual} from 'node:util';
import {repository} from '../src/data/repository';
import type {Inventory} from '../src/domain/types';
import {buildOperationalPayload,hydrateOperationalPayload,DEFERRED_NETWORK_FIELDS,packJson} from '../src/domain/operationalPayload';

const directory = new URL('../migration/iteration29/baseline/',import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('active-28l-manifest.json',directory),'utf8'));
const bytes = gunzipSync(readFileSync(new URL('active-28l-inventory.json.gz',directory)));
const sha = (v:Buffer|string)=>createHash('sha256').update(v).digest('hex');
if(sha(bytes)!==manifest.content.uncompressedSha256) throw new Error('Baseline integrity mismatch.');
const baseline = JSON.parse(bytes.toString('utf8')) as Inventory;
let revision = 'NETWORK-28L-'+manifest.content.uncompressedSha256.slice(0,16);
// The existing v1 signature includes JSON property order. Preserve that order
// at the persistence boundary without changing its graph or identifier rules.
const authorityJson = JSON.stringify(await repository.load());
const authority = JSON.parse(authorityJson) as Inventory;
if (!isDeepStrictEqual(authority,baseline)) throw new Error('Operational authority differs from the reviewed baseline.');
const payload = buildOperationalPayload(authority,revision);
revision += '-OP1-'+sha(JSON.stringify(payload.inventory)).slice(0,12);
payload.networkRevision = revision;
const json = JSON.stringify(payload);
const start = performance.now(), hydrated = hydrateOperationalPayload(JSON.parse(json)), hydrationMs = performance.now()-start;
for(const [key,path] of Object.entries(baseline.fiberPathProjection!.paths)) {
  if(!isDeepStrictEqual(path,hydrated.fiberPathProjection!.paths[key])) throw new Error('Path changed: '+key);
}
const detail = Object.fromEntries(DEFERRED_NETWORK_FIELDS.map(field=>[field,baseline[field]]));
detail.fiberPathAudit = baseline.fiberPathProjection!.audit;
const detailJson = JSON.stringify({apiVersion:1,networkRevision:revision,inventory:packJson(detail)});
const compressed = gzipSync(json,{level:9,mtime:0});
writeFileSync(new URL('active-28l-operational.json.gz',directory),compressed);
writeFileSync(new URL('active-28l-authority.json.gz',directory),gzipSync(authorityJson,{level:9,mtime:0}));
writeFileSync(new URL('active-28l-details.json.gz',directory),gzipSync(detailJson,{level:9,mtime:0}));
const metrics = {networkRevision:revision,baselineBytes:bytes.length,authoritySha256:sha(authorityJson),operationalBytes:Buffer.byteLength(json),operationalGzipBytes:compressed.length,operationalSha256:sha(json),pathsCompared:baseline.fibers.length,hydrationMs,detailBytes:Buffer.byteLength(detailJson)};
writeFileSync(new URL('active-28l-operational-manifest.json',directory),JSON.stringify(metrics,null,2)+'\n');
console.log(JSON.stringify(metrics));
