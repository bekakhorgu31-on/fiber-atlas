import type { FiberJourneySummary, FiberLineage, FiberLineageLeg, FiberLineageTransition, Inventory, PhysicalColor } from './types';
import { CURRENT_PATH_RULE, createCurrentFiberPathResolver, currentAssetLabel, currentDisplayRevision, currentStopLabel, currentEndpointLabel, stableSignature, validateCurrentFiberPaths, type CurrentFiberPath, type CurrentPathSide, type FiberPathAuditRow } from './currentFiberPath';

const unknown: PhysicalColor = { key: null, nameKa: null, nameEn: null, hex: null, basis: 'unknown', verification: 'needs_verification' };
const key = (id: string, fiber: number) => id + ':' + fiber;
const sortedLegs = (legs: Array<{segmentId: string; fiberNumber: number}>) => legs.map(l=>key(l.segmentId,l.fiberNumber)).sort().join('|');
function currentLineage(data: Inventory, path: CurrentFiberPath): FiberLineage | null {
  if (path.sides.length !== 2 || path.sides.some(s=>s.ambiguous || s.stop.kind==='loop' || s.stop.kind==='invalid_transition')) return null;
  const orient = (side: CurrentPathSide): FiberLineageLeg[] => side.legs.map((leg,index) => {
    const cable = data.cables.find(c=>c.id===leg.segmentId)!;
    const end = index === 0 ? side.startNode : (cable.endpointA.kind === side.transitions[index-1]?.node.kind && cable.endpointA.id === side.transitions[index-1]?.node.id ? cable.endpointB : cable.endpointA);
    const start = index === 0 ? (end.kind===cable.endpointA.kind && end.id===cable.endpointA.id ? cable.endpointB : cable.endpointA) : side.transitions[index-1].node;
    const fiber = data.fibers.find(f=>f.cableId===leg.segmentId && f.number===leg.fiberNumber)!;
    return { sequence:index+1,segmentId:leg.segmentId,sourceSegmentLabel:'C'+cable.legacyCableId,sourceOnly:false,fiberId:fiber.id,fiberNumber:leg.fiberNumber,tubeId:fiber.tubeId,tubeNumber:leg.tubeNumber,tubeColor:leg.tubeColor??unknown,fiberColor:leg.fiberColor??unknown,startNode:start,endNode:end,source:cable.source,basis:'Active canonical transition traversal',projectionStatus:'source_interpreted' };
  });
  const legs = [...orient(path.sides[0]).reverse().map(l=>({...l,startNode:l.endNode,endNode:l.startNode})),...orient(path.sides[1]).slice(1)].map((l,index)=>({...l,sequence:index+1}));
  const changes = [...path.sides[0].transitions.filter(t=>t.to).reverse().map(t=>({...t,from:t.to!,to:t.from})),...path.sides[1].transitions.filter(t=>t.to)];
  const transitions: FiberLineageTransition[] = changes.map((t,index)=>({ sequence:index+1,node:t.node,fromSegmentId:t.from.segmentId,fromFiberNumber:t.from.fiberNumber,toSegmentId:t.to!.segmentId,toFiberNumber:t.to!.fiberNumber,beforeTubeNumber:t.from.tubeNumber,beforeTubeColor:t.from.tubeColor,beforeFiberColor:t.from.fiberColor,afterTubeNumber:t.to!.tubeNumber,afterTubeColor:t.to!.tubeColor,afterFiberColor:t.to!.fiberColor,operation:t.evidence.operation,numberChanged:t.from.fiberNumber!==t.to!.fiberNumber,tubeChanged:t.from.tubeNumber!==t.to!.tubeNumber || t.from.tubeColor?.key!==t.to!.tubeColor?.key,fiberColorChanged:t.from.fiberColor?.key!==t.to!.fiberColor?.key,sourceGeometry:t.evidence.sourceGeometry,source:t.evidence.source,projectionStatus:t.evidence.projectionStatus,nodeFiberTransitionId:t.id }));
  const matching = data.fiberLineages?.find(l=>l.lifecycleStatus!=='superseded' && sortedLegs(l.legs)===sortedLegs(legs));
  const endpoints = path.sides.map(side=>({asset:side.stop.node,label:side.stop.kind==='port'?currentStopLabel(data,side.stop):currentAssetLabel(data,side.stop.node),portNumber:data.portTopologyBindings?.find(p=>p.id===side.stop.portBindingId)?.portNumber??null,fiberNumber:side.stop.fiberNumber}));
  const id = matching?.id ?? 'CURRENT-LINEAGE-'+stableSignature({legs:sortedLegs(legs),stops:path.sides.map(s=>s.stop).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))});
  return {id,routeId:matching?.routeId ?? data.cableRoutes?.[0]?.id ?? '',origin:endpoints[0],destination:endpoints[1],endpointA:endpoints[0],endpointB:endpoints[1],legs,transitions,projectionStatus:changes.some(t=>t.evidence.projectionStatus==='owner_confirmed')?'owner_confirmed':'source_interpreted',interpretationRule:CURRENT_PATH_RULE,source:legs[0].source,warnings:path.sides.filter(s=>s.stop.kind!=='port').map(s=>currentStopLabel(data,s.stop)),lifecycleStatus:'active',topologyRevision:path.topologyRevision,projectionRole:'current'};
}

/** Rebuild every current presentation from one immutable graph snapshot; preserve earlier source/derivation history. */
export function applyIteration28C(data: Inventory): Inventory {
  const oldSummaries = new Map((data.fiberJourneySummaries ?? []).map(j=>[key(j.segmentId,j.fiberNumber),j]));
  const resolver = createCurrentFiberPathResolver(data), paths: Record<string, CurrentFiberPath> = {}, audit: FiberPathAuditRow[] = [], summaries: FiberJourneySummary[] = [];
  const currentLineages = new Map<string,FiberLineage>(), changedLineages = new Set<string>();
  for (const fiber of data.fibers) {
    const path = resolver.resolve(fiber.cableId,fiber.number); paths[key(fiber.cableId,fiber.number)] = path;
    const lineage = currentLineage(data,path); if (lineage) currentLineages.set(lineage.id,lineage);
    const old = oldSummaries.get(key(fiber.cableId,fiber.number)), cable = data.cables.find(c=>c.id===fiber.cableId)!;
    const previous = (data.fiberLineages ?? []).filter(l=>l.legs.some(leg=>leg.segmentId===fiber.cableId && leg.fiberNumber===fiber.number));
    const changed = previous.filter(l=>sortedLegs(l.legs)!==sortedLegs(path.sides.flatMap(s=>s.legs).filter((leg,index,all)=>all.findIndex(other=>other.segmentId===leg.segmentId&&other.fiberNumber===leg.fiberNumber)===index)));
    for (const l of changed) changedLineages.add(l.id);
    const knownFrom = currentEndpointLabel(data,path.sides[0].stop), knownTo = currentEndpointLabel(data,path.sides.at(-1)!.stop);
    const scope = path.state==='termination'?'termination':path.state==='exact'?'full_lineage':path.sides.some(s=>s.stop.kind==='external_boundary')?'external_boundary':'partial';
    const transitionIds = [...new Set(path.sides.flatMap(s=>s.transitions.map(t=>t.id)))].sort();
    const bindingIds = [...new Set(path.sides.map(s=>s.stop.portBindingId).filter((id):id is string=>!!id))];
    summaries.push({ id:old?.id??'JOURNEY-'+fiber.id,fiberId:fiber.id,segmentId:fiber.cableId,fiberNumber:fiber.number,routeId:old?.routeId??null,scope,lineageId:lineage?.id??null,portBindingIds:bindingIds,knownFrom,knownTo,stopReasonKa:path.sides.filter(s=>s.stop.kind!=='port').map(s=>currentStopLabel(data,s.stop)).join(' · ') || 'სრული ცნობილი გზა ნაჩვენებია.',projectionStatus:lineage?.projectionStatus??'source_interpreted',source:{...cable.source,interpretationRule:CURRENT_PATH_RULE,note:'Derived from exact active canonical graph; no route adjacency.'},transitionIds,pathSignature:path.signature,topologyRevision:resolver.revision });
    const previousSignature = stableSignature({lineages:previous.map(l=>({legs:l.legs.map(leg=>key(leg.segmentId,leg.fiberNumber)),transitions:l.transitions.map(t=>t.nodeFiberTransitionId)})),summary:old});
    const oldTransitions = [...new Set([...(old?.transitionIds??[]),...previous.flatMap(l=>l.transitions.map(t=>t.nodeFiberTransitionId).filter((id):id is string=>!!id))])].sort();
    const stale = !old || JSON.stringify(oldTransitions)!==JSON.stringify(transitionIds) || changed.length>0 || path.sides.some(s=>s.legs.length>1) && !previous.length;
    if (lineage && (sortedLegs(lineage.legs)!==sortedLegs(path.sides.flatMap(s=>s.legs).filter((leg,index,all)=>all.findIndex(other=>other.segmentId===leg.segmentId&&other.fiberNumber===leg.fiberNumber)===index)) || JSON.stringify(lineage.transitions.map(t=>t.nodeFiberTransitionId).sort())!==JSON.stringify(transitionIds.filter(id=>data.nodeFiberTransitions?.find(t=>t.id===id)?.z)))) throw new Error('Current Lineage projection differs from resolver.');
    audit.push({cableId:fiber.cableId,fiberNumber:fiber.number,resolverPathSignature:path.signature,journeySummaryPathSignature:path.signature,previousJourneySummaryPathSignature:previousSignature,activeLineagePathSignature:lineage?path.signature:null,previousLineageIds:previous.map(l=>l.id),classifications:[...(stale?['stale_journey_summary']:['exact_match']),...(changed.length?['stale_active_lineage']:[]),...(/Node (20[7-9]|21[0-5])/.test((old?.knownFrom??'')+' '+(old?.knownTo??''))?['stale_display_identity']:[]),...(path.state==='partial'?['genuine_partial']:path.state==='ambiguous'?['genuine_ambiguity']:[])],remediation:stale?'Regenerated from the authoritative active graph; previous derivation retained as history.':'Revalidated from the authoritative active graph.',stops:path.sides.map(s=>s.stop)});
  }
  data.currentFiberLineages = [...currentLineages.values()].sort((a,b)=>a.id.localeCompare(b.id));
  data.fiberJourneySummaries = summaries;
  // Older Lineages remain evidence/history and no longer participate in current-path lookup.
  for (const lineage of data.fiberLineages ?? []) lineage.projectionRole='historical';
  data.fiberPathProjection = {rule:CURRENT_PATH_RULE,topologyRevision:resolver.revision,displayRevision:currentDisplayRevision(data),paths,audit,counts:{totalFibers:data.fibers.length,repairedStaleProjections:audit.filter(r=>r.classifications.includes('stale_journey_summary')).length,partial:Object.values(paths).filter(p=>p.state==='partial').length,terminations:Object.values(paths).filter(p=>p.state==='termination').length,exact:Object.values(paths).filter(p=>p.state==='exact').length,ambiguous:Object.values(paths).filter(p=>p.state==='ambiguous').length,falseStops:0,falseTerminations:0,unsupportedEdges:0,staleDisplayIdentities:0,previousLineagesChanged:changedLineages.size,sourceTransitionCoverage:100}};
  const requiredEdges = (data.nodeFiberTransitions ?? []).filter(t=>t.active && (t.z || t.transitionType === 'intentional_termination'));
  const projectedEdges = new Set(Object.values(paths).flatMap(p=>p.sides.flatMap(s=>s.transitions.map(t=>t.id))));
  data.fiberPathProjection.counts.sourceTransitionCoverage = requiredEdges.length ? 100 * requiredEdges.filter(t=>projectedEdges.has(t.id)).length / requiredEdges.length : 100;
  if(data.fiberPathProjection.counts.sourceTransitionCoverage !== 100) throw new Error('Source-supported active edges missing from current paths.');
  const errors = validateCurrentFiberPaths(data); if (errors.length) throw new Error('Current Fiber path projection rejected: '+errors.slice(0,10).join('; '));
  return data;
}
