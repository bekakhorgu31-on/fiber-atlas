import type { Inventory } from './types';
import { createCurrentFiberPathResolver, currentDisplayRevision } from './currentFiberPath';

export const DEFERRED_NETWORK_FIELDS = ['fiberLineages','supersededFiberLineages','fiberLineageAudit','connectionSheets','importRuns'] as const;
export interface PackedJson { format: 'fiber-atlas-shared-json/1'; dictionary: unknown[]; root: unknown }
export interface OperationalNetworkPayload {
  apiVersion: 1; networkRevision: string; topologyRevision: string; displayRevision: string;
  deferredFields: readonly string[];
  counts: { cables: number; fibers: number; transitions: number; bindings: number };
  inventory: PackedJson;
}
/** Lossless JSON transport deduplication only; no topology interpretation. */
export function packJson(value: unknown): PackedJson {
  const counts = new Map<string,number>();
  const key = (v: unknown): string | null => {
    if (!v || typeof v !== 'object') return null;
    const text = JSON.stringify(v); return text.length >= 96 ? text : null;
  };
  const count = (v: unknown) => {
    const text = key(v); if (text) counts.set(text,(counts.get(text)??0)+1);
    if (Array.isArray(v)) v.forEach(count);
    else if (v && typeof v === 'object') Object.values(v).forEach(count);
  };
  count(value);
  const dictionary: unknown[] = [], ids = new Map<string,number>();
  const encode = (v: unknown, literal = false): unknown => {
    const text = key(v);
    if (!literal && text && counts.get(text)! > 1) {
      let id = ids.get(text);
      if (id === undefined) { id = dictionary.length; ids.set(text,id); dictionary.push(null); dictionary[id] = encode(v,true); }
      return {$faRef:id};
    }
    if (Array.isArray(v)) return v.map(item=>encode(item));
    if (v && typeof v === 'object') {
      const result = Object.fromEntries(Object.entries(v).map(([k,item])=>[k,encode(item)]));
      return Object.hasOwn(result,'$faRef') || Object.hasOwn(result,'$faLiteral') ? {$faLiteral:result} : result;
    }
    return v;
  };
  return {format:'fiber-atlas-shared-json/1',dictionary,root:encode(value)};
}
export function unpackJson(packed: PackedJson): unknown {
  if (packed.format !== 'fiber-atlas-shared-json/1' || !Array.isArray(packed.dictionary)) throw new Error('Unsupported network encoding.');
  const decode = (v: unknown, literal = false, chain = new Set<number>()): unknown => {
    if (Array.isArray(v)) return v.map(item=>decode(item,false,chain));
    if (v && typeof v === 'object') {
      const object = v as Record<string,unknown>;
      if (!literal && Object.keys(object).length === 1 && Object.hasOwn(object,'$faLiteral')) return decode(object.$faLiteral,true,chain);
      if (!literal && Object.keys(object).length === 1 && Object.hasOwn(object,'$faRef')) {
        const id = object.$faRef;
        if (typeof id !== 'number' || !Number.isInteger(id) || id < 0 || id >= packed.dictionary.length || chain.has(id)) throw new Error('Invalid or cyclic network reference.');
        return decode(packed.dictionary[id],false,new Set([...chain,id]));
      }
      return Object.fromEntries(Object.entries(object).map(([k,item])=>[k,decode(item,false,chain)]));
    }
    return v;
  };
  return decode(packed.root);
}
export function buildOperationalPayload(data: Inventory, networkRevision: string): OperationalNetworkPayload {
  if (!data.fiberPathProjection) throw new Error('A revision-bound current projection is required.');
  const current: Record<string,unknown> = {...data};
  for (const field of DEFERRED_NETWORK_FIELDS) delete current[field];
  current.connectionSheetIndex = (data.connectionSheets??[]).map(sheet=>({id:sheet.id,node:sheet.node}));
  const {paths:_paths,audit:_audit,...pathMetadata} = data.fiberPathProjection;
  current.fiberPathProjection = pathMetadata;
  return {apiVersion:1,networkRevision,topologyRevision:data.fiberPathProjection.topologyRevision,displayRevision:data.fiberPathProjection.displayRevision,
    deferredFields:[...DEFERRED_NETWORK_FIELDS,'fiberPathProjection.audit'],
    counts:{cables:data.cables.length,fibers:data.fibers.length,transitions:data.nodeFiberTransitions?.length??0,bindings:data.portTopologyBindings?.length??0},inventory:packJson(current)};
}
/** Rehydrate with the existing resolver; missing authority must fail visibly. */
export function hydrateOperationalPayload(payload: OperationalNetworkPayload): Inventory {
  if (payload.apiVersion !== 1 || !payload.networkRevision || !payload.topologyRevision) throw new Error('Missing network revision.');
  const data = unpackJson(payload.inventory) as Inventory;
  for (const field of ['cables','fibers','tubes','closures','accessPoints','aggregations','organizations','nodeFiberTransitions','portTopologyBindings','currentFiberLineages','fiberJourneySummaries'] as const) {
    if (!Array.isArray(data?.[field])) throw new Error('Missing operational authority: '+field);
  }
  const counts = {cables:data.cables.length,fibers:data.fibers.length,transitions:data.nodeFiberTransitions!.length,bindings:data.portTopologyBindings!.length};
  if (Object.keys(counts).some(k=>counts[k as keyof typeof counts] !== payload.counts[k as keyof typeof counts])) throw new Error('Incomplete operational authority.');
  const resolver = createCurrentFiberPathResolver(data);
  if (resolver.revision !== payload.topologyRevision || currentDisplayRevision(data) !== payload.displayRevision) throw new Error('Network revision mismatch.');
  const paths = Object.fromEntries(data.fibers.map(f=>[f.cableId+':'+f.number,resolver.resolve(f.cableId,f.number)]));
  if (!data.fiberPathProjection || data.fiberPathProjection.topologyRevision !== payload.topologyRevision) throw new Error('Missing current projection metadata.');
  data.fiberPathProjection = {...data.fiberPathProjection,paths,audit:[]};
  data.dataAvailability = {mode:'database',networkRevision:payload.networkRevision,deferredFields:[...payload.deferredFields]};
  return data;
}
