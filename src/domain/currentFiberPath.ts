import type { AssetRef, Inventory, NodeFiberTransition, NodeFiberTransitionSide, PortTopologyBinding } from './types';

export const CURRENT_PATH_RULE = 'canonical-active-fiber-path/1';
export const nodeKey = (node: AssetRef) => node.kind + ':' + node.id;
const fiberKey = (cableId: string, fiber: number) => cableId + ':' + fiber;
const stateKey = (node: AssetRef, cableId: string, fiber: number) => nodeKey(node) + '/' + fiberKey(cableId, fiber);
const sameNode = (a: AssetRef, b: AssetRef) => nodeKey(a) === nodeKey(b);
export function stableSignature(value: unknown): string {
  const text = JSON.stringify(value); let a = 2166136261, b = 2246822519;
  for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b ^ text.charCodeAt(i), 3266489917); }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}
export function currentAssetLabel(data: Inventory, node: AssetRef): string {
  if (node.kind === 'network_node') {
    const record = data.networkNodes?.find(n => n.id === node.id);
    if (record?.assetType === 'closure' || record?.assetType === 'ap') return record.displayName;
    const degree = data.cables.filter(c => sameNode(c.endpointA, node) || sameNode(c.endpointB, node)).length;
    return degree === 1 ? 'Endpoint ' + node.id : record?.displayName ?? 'Node ' + node.id;
  }
  if (node.kind === 'aggregation') return node.id === 'AGG-LENTEKHI' ? 'ლენტეხის აგრეგაცია' : node.id==='5'?'AGG5':data.aggregations.find(a=>a.id===node.id)?.name??'AGG'+node.id;
  if (node.kind === 'boundary') return node.id.replace(/^BOUNDARY-/, '') + ' boundary';
  return ({ closure: 'SC', ap: 'AP', odf: 'ODF', site: 'SITE' } as const)[node.kind] + node.id;
}
export type CurrentStopKind = 'no_transition' | 'termination' | 'port' | 'external_boundary' | 'unresolved_transition' | 'loop' | 'invalid_transition';
export interface CurrentPathLeg extends NodeFiberTransitionSide { cableId: string }
export interface CurrentPathTransition { id: string; node: AssetRef; from: NodeFiberTransitionSide; to: NodeFiberTransitionSide | null; evidence: NodeFiberTransition }
export interface CurrentPathStop { kind: CurrentStopKind; node: AssetRef; segmentId: string; fiberNumber: number; transitionIds: string[]; portBindingId: string | null }
export interface CurrentPathSide { startNode: AssetRef; legs: CurrentPathLeg[]; transitions: CurrentPathTransition[]; stop: CurrentPathStop; ambiguous: boolean }
export interface CurrentFiberPath { cableId: string; fiberNumber: number; topologyRevision: string; signature: string; sides: CurrentPathSide[]; state: 'exact' | 'partial' | 'termination' | 'ambiguous'; }
export interface FiberPathAuditRow { cableId: string; fiberNumber: number; resolverPathSignature: string; journeySummaryPathSignature: string; previousJourneySummaryPathSignature: string; activeLineagePathSignature: string | null; previousLineageIds: string[]; classifications: string[]; remediation: string; stops: CurrentPathStop[] }
export interface CurrentPathProjection {
  rule: string; topologyRevision: string; displayRevision: string; paths: Record<string, CurrentFiberPath>; audit: FiberPathAuditRow[];
  counts: { totalFibers: number; repairedStaleProjections: number; partial: number; terminations: number; exact: number; ambiguous: number; falseStops: number; falseTerminations: number; unsupportedEdges: number; staleDisplayIdentities: number; previousLineagesChanged: number; sourceTransitionCoverage: number };
}
export function currentTopologyRevision(data: Inventory): string {
  const sorted = <T>(items: T[]) => items.sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return CURRENT_PATH_RULE + '/' + stableSignature({
    cables: sorted(data.cables.map(c => [c.id, nodeKey(c.endpointA), nodeKey(c.endpointB)])),
    fibers: sorted(data.fibers.map(f => [f.cableId,f.number])),
    transitions: sorted((data.nodeFiberTransitions ?? []).filter(t => t.active).map(t => [t.id, nodeKey(t.node), t.a, t.z, t.port, t.transitionType])),
    bindings: sorted((data.portTopologyBindings ?? []).map(p => [p.id,p.segmentId,p.fiberNumber,p.ownerType,p.ownerId,p.portNumber,p.canonicalNode])),
    odfs: sorted((data.odfs ?? []).map(p => [p.id,nodeKey(p.containedBy)])),
  });
}
export function currentDisplayRevision(data: Inventory): string { return stableSignature((data.networkNodes ?? []).map(n => [n.id,n.assetType,n.displayName]).sort()); }

/** One graph snapshot. No Route, Lineage, display name, or document boundary participates in traversal. */
export function createCurrentFiberPathResolver(data: Inventory) {
  const revision = currentTopologyRevision(data);
  const cables = new Map(data.cables.map(c => [c.id,c]));
  const fibers = new Map(data.fibers.map(f => [fiberKey(f.cableId,f.number), f]));
  const tubes = new Map((data.tubes ?? []).map(t => [t.id,t]));
  const edges = new Map<string, NodeFiberTransition[]>();
  const bindings = new Map<string, PortTopologyBinding[]>();
  const identity = (segmentId: string, fiberNumber: number): CurrentPathLeg => {
    const fiber = fibers.get(fiberKey(segmentId,fiberNumber)); const tube = fiber ? tubes.get(fiber.tubeId ?? '') : undefined;
    return { cableId: segmentId, segmentId, fiberNumber, tubeNumber: tube?.number ?? null, tubeColor: tube?.physicalColor ?? null, fiberColor: fiber?.physicalColor ?? null };
  };
  for (const t of data.nodeFiberTransitions ?? []) if (t.active) for (const side of [t.a, ...(t.z ? [t.z] : [])]) {
    const key = stateKey(t.node, side.segmentId, side.fiberNumber); const list = edges.get(key) ?? []; if (!list.some(e => e.id === t.id)) list.push(t); edges.set(key,list);
  }
  for (const list of edges.values()) list.sort((a,b) => a.id.localeCompare(b.id));
  for (const p of data.portTopologyBindings ?? []) { const key = fiberKey(p.segmentId,p.fiberNumber); bindings.set(key,[...(bindings.get(key) ?? []),p]); }
  const atBindings = (node: AssetRef, segmentId: string, fiberNumber: number) => (bindings.get(fiberKey(segmentId,fiberNumber)) ?? []).filter(p => p.canonicalNode ? sameNode(node,p.canonicalNode) : p.ownerType === 'ap' ? sameNode(node,{ kind:'ap',id:p.ownerId }) : data.odfs?.some(o => o.id === p.ownerId && sameNode(o.containedBy,node)));
  // Cache only within this explicit graph snapshot, never across inventory revisions.
  const resolved = new Map<string, CurrentFiberPath>();
  const resolve = (cableId: string, fiberNumber: number, startingEndpoint?: AssetRef): CurrentFiberPath => {
    const lookup = fiberKey(cableId,fiberNumber) + '/' + (startingEndpoint ? nodeKey(startingEndpoint) : '*');
    const cached = resolved.get(lookup); if (cached) return cached;
    const cable = cables.get(cableId); if (!cable || !fibers.has(fiberKey(cableId,fiberNumber))) throw new Error('Current path requires an exact canonical Cable/Fiber: ' + fiberKey(cableId,fiberNumber));
    if (startingEndpoint && ![cable.endpointA,cable.endpointB].some(n => sameNode(n,startingEndpoint))) throw new Error('Starting endpoint is not on selected Cable.');
    const sides: CurrentPathSide[] = [];
    for (const startNode of startingEndpoint ? [startingEndpoint] : [cable.endpointA,cable.endpointB]) {
      type Work = { at: AssetRef; cableId: string; fiber: number; legs: CurrentPathLeg[]; transitions: CurrentPathTransition[]; seen: Set<string>; ambiguous: boolean };
      const queue: Work[] = [{ at:startNode,cableId,fiber:fiberNumber,legs:[identity(cableId,fiberNumber)],transitions:[],seen:new Set(),ambiguous:false }];
      const finish = (work: Work, kind: CurrentStopKind, ids: string[] = [], binding: string | null = null) => sides.push({ startNode, legs:work.legs, transitions:work.transitions, ambiguous:work.ambiguous, stop:{kind,node:work.at,segmentId:work.cableId,fiberNumber:work.fiber,transitionIds:ids,portBindingId:binding} });
      while (queue.length) {
        const work = queue.shift()!, key = stateKey(work.at,work.cableId,work.fiber);
        if (work.seen.has(key)) { finish(work,'loop'); continue; }
        const seen = new Set([...work.seen,key]); const local = edges.get(key) ?? [];
        if (!local.length) {
          const ports = atBindings(work.at,work.cableId,work.fiber);
          if (ports.length) { for (const p of ports) finish({...work,ambiguous:work.ambiguous || ports.length > 1},'port',[],p.id); }
          else finish(work, work.at.kind === 'boundary' ? 'external_boundary' : 'no_transition');
          continue;
        }
        const alternatives = local;
        for (const t of alternatives) {
          const from = t.a.segmentId === work.cableId && t.a.fiberNumber === work.fiber ? t.a : t.z!;
          const to = t.z ? (from === t.a ? t.z : t.a) : null;
          const transition: CurrentPathTransition = {id:t.id,node:t.node,from,to,evidence:t};
          const nextWork = {...work,seen,ambiguous:work.ambiguous || alternatives.length > 1};
          if (!to) {
            if (t.transitionType === 'intentional_termination') finish({...nextWork,transitions:[...work.transitions,transition]},'termination',[t.id]);
            else finish(nextWork,'unresolved_transition',[t.id]);
            continue;
          }
          const next = cables.get(to.segmentId);
          if (!next || !fibers.has(fiberKey(to.segmentId,to.fiberNumber)) || ![next.endpointA,next.endpointB].some(n => sameNode(n,t.node))) { finish(nextWork,'invalid_transition',[t.id]); continue; }
          queue.push({...nextWork,at:sameNode(next.endpointA,t.node)?next.endpointB:next.endpointA,cableId:to.segmentId,fiber:to.fiberNumber,legs:[...work.legs,identity(to.segmentId,to.fiberNumber)],transitions:[...work.transitions,transition]});
        }
      }
    }
    const canonical = sides.map(s=>({start:nodeKey(s.startNode),legs:s.legs.map(l=>fiberKey(l.segmentId,l.fiberNumber)),transitions:s.transitions.map(t=>[t.id,nodeKey(t.node),fiberKey(t.from.segmentId,t.from.fiberNumber),t.to?fiberKey(t.to.segmentId,t.to.fiberNumber):null]),stop:s.stop,ambiguous:s.ambiguous}));
    const state = sides.some(s=>s.ambiguous) ? 'ambiguous' : sides.some(s=>s.stop.kind === 'termination') ? 'termination' : sides.every(s=>s.stop.kind === 'port') ? 'exact' : 'partial';
    const result: CurrentFiberPath = {cableId,fiberNumber,topologyRevision:revision,signature:CURRENT_PATH_RULE + '/' + stableSignature(canonical),sides,state};
    resolved.set(lookup,result); return result;
  };
  return { resolve, revision, matchingTransitions: (node: AssetRef, segmentId: string, fiberNumber: number) => edges.get(stateKey(node,segmentId,fiberNumber)) ?? [] };
}
export function resolveCurrentFiberPath(data: Inventory, cableId: string, fiberNumber: number, startingEndpoint?: AssetRef): CurrentFiberPath {
  const stored = !startingEndpoint ? data.fiberPathProjection?.paths[fiberKey(cableId,fiberNumber)] : undefined;
  return stored && stored.topologyRevision === currentTopologyRevision(data) ? stored : createCurrentFiberPathResolver(data).resolve(cableId,fiberNumber,startingEndpoint);
}
export function currentStopLabel(data: Inventory, stop: CurrentPathStop): string {
  const name = currentAssetLabel(data,stop.node);
  if (stop.kind === 'termination') return name + '-ზე მთავრდება; წყაროთი დადასტურებული Fiber დასრულებაა.';
  if (stop.kind === 'port') { const port = data.portTopologyBindings?.find(p=>p.id===stop.portBindingId); return name + ' / Port ' + port?.portNumber; }
  if (stop.kind === 'external_boundary') return name + ' · გარე დოკუმენტაციის საზღვარი; შემდგომი ზუსტი გადასვლა არ არის წარმოდგენილი.';
  if (stop.kind === 'no_transition') return name + '-ზე შემდეგი local Fiber transition აქტიურ წყაროებში არ არის წარმოდგენილი; დასრულება არ დასტურდება.';
  if (stop.kind === 'unresolved_transition') return name + '-ზე წყაროს ჩანაწერი არსებობს, outgoing Fiber mapping არ არის დადგენილი.';
  if (stop.kind === 'loop') return name + '-ზე განმეორებითი node/Fiber მდგომარეობა გამოვლინდა; ციკლზე კვალი შეჩერდა.';
  return name + ' · internal projection consistency defect';
}
export function currentEndpointLabel(data: Inventory, stop: CurrentPathStop): string {
  return stop.kind === 'port' ? currentStopLabel(data,stop) : currentAssetLabel(data,stop.node) + (stop.kind === 'termination' ? ' / აქ მთავრდება' : '');
}
export function validateCurrentFiberPaths(data: Inventory, paths = Object.values(data.fiberPathProjection?.paths ?? {})): string[] {
  const resolver = createCurrentFiberPathResolver(data), errors: string[] = [];
  const legSet = (legs: Array<{segmentId:string;fiberNumber:number}>) => [...new Set(legs.map(l=>fiberKey(l.segmentId,l.fiberNumber)))].sort().join('|');
  for (const lineage of data.currentFiberLineages ?? []) {
    if (lineage.topologyRevision !== resolver.revision) errors.push('Stale current Lineage revision: '+lineage.id);
    const first = lineage.legs[0];
    if (!first) { errors.push('Empty current Lineage: '+lineage.id); continue; }
    const live = resolver.resolve(first.segmentId,first.fiberNumber);
    const expectedEdges = [...new Set(live.sides.flatMap(s=>s.transitions.filter(t=>t.to).map(t=>t.id)))].sort();
    if (legSet(lineage.legs)!==legSet(live.sides.flatMap(s=>s.legs)) || JSON.stringify(lineage.transitions.map(t=>t.nodeFiberTransitionId).sort())!==JSON.stringify(expectedEdges)) errors.push('Stale current Lineage projection: '+lineage.id);
  }
  for (const path of paths) {
    if (path.topologyRevision !== resolver.revision) errors.push('Stale topology revision: ' + path.cableId + '/' + path.fiberNumber);
    if (path.signature !== resolver.resolve(path.cableId,path.fiberNumber).signature) errors.push('Stale path projection: ' + path.cableId + '/' + path.fiberNumber);
    for (const side of path.sides) {
      const stop = side.stop, matching = resolver.matchingTransitions(stop.node,stop.segmentId,stop.fiberNumber);
      if (stop.kind === 'no_transition' && matching.length) errors.push('False partial at ' + nodeKey(stop.node));
      if (stop.kind === 'termination' && !matching.some(t=>t.transitionType==='intentional_termination' && !t.z && stop.transitionIds.includes(t.id))) errors.push('False termination at ' + nodeKey(stop.node));
      if (stop.kind === 'port' && !(data.portTopologyBindings ?? []).some(p=>p.id===stop.portBindingId && p.segmentId===stop.segmentId && p.fiberNumber===stop.fiberNumber && (p.canonicalNode?sameNode(stop.node,p.canonicalNode):p.ownerType==='ap'?sameNode(stop.node,{kind:'ap',id:p.ownerId}):data.odfs?.some(o=>o.id===p.ownerId&&sameNode(o.containedBy,stop.node))))) errors.push('Uncertified Port endpoint at ' + nodeKey(stop.node));
      if (stop.kind === 'invalid_transition') errors.push('Invalid transition at ' + nodeKey(stop.node));
      for (const t of side.transitions) if (!resolver.matchingTransitions(t.node,t.from.segmentId,t.from.fiberNumber).some(edge=>edge.id===t.id)) errors.push('Unsupported path edge: '+t.id);
    }
    const summary = data.fiberJourneySummaries?.find(s=>s.segmentId===path.cableId && s.fiberNumber===path.fiberNumber);
    if (data.fiberPathProjection && (!summary || summary.pathSignature !== path.signature || summary.topologyRevision !== resolver.revision)) errors.push('Stale JourneySummary: ' + path.cableId + '/' + path.fiberNumber);
  }
  return errors;
}
