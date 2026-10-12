import routingEvidenceJson from '../data/iteration24-fresh-transitions.json';
import ownerConfirmationJson from '../data/iteration23-owner-confirmations.json';
import type {
  AssetRef, FiberLineage, FiberLineageAuditRecord, FiberLineageEndpoint, FiberLineageLeg,
  FiberLineageTransition, Inventory, NodeFiberTransition, PhysicalColor, PrototypeProjectionStatus, SourceRef,
} from './types';
import { LENTEKHI_AGGREGATION_ID } from './iteration19';
import { LENTEKHI_ODF_ID, rebuildFiberJourneySummaries } from './iteration20';
import { TSAGERI_ODF_ID, TSAGERI_ROUTE_ID } from './aggregationTopology';

export const NODE_FIBER_TRANSITION_RULE = 'tsageri-lentekhi-node-fiber-transition/2';
export const BRANCH_LINEAGE_RULE = 'tsageri-lentekhi-branch-aware-lineage/1';
export const GOLDEN_F32_LINEAGE_ID = 'GOLDEN-SC219-F32-AP52-LENTEKHI';
export const GOLDEN_PORT38_LINEAGE_ID = 'GOLDEN-LENTEKHI-P38-SC225-AP';

type EvidenceSide = { legacySegmentId: string; fiberNumber: number; bankIndex: number; markerShapeId: string };
type EvidenceEdge = {
  id: string; nodeId: string; connectorShapeId: string; a: EvidenceSide; z: EvidenceSide;
  basis: string[]; geometry: { begin: { x: number; y: number } | null; end: { x: number; y: number } | null };
};
const routingEvidence = routingEvidenceJson as { exactConnectorEdges: EvidenceEdge[] };
const ownerConfirmationIds = new Set((ownerConfirmationJson as { confirmations: Array<{ id: string }> }).confirmations.map(item => item.id));

const source = (shapeIds: string[], note: string, rawValue?: string, rule = NODE_FIBER_TRANSITION_RULE): SourceRef => ({
  file: 'Tsageri-Lentekhi 2025.vsdx', page: 'ცაგერი-ლენტეხი', pageId: '4', part: 'visio/pages/page1.xml',
  shapeIds, rawValue, interpretationRule: rule, note,
});
const sameAsset = (a: AssetRef, b: AssetRef) => a.kind === b.kind && a.id === b.id;
const key = (segmentId: string, fiberNumber: number) => `${segmentId}:${fiberNumber}`;
const fiberIdentity = (data: Inventory, segmentId: string, fiberNumber: number) => {
  const fiber = data.fibers.find(item => item.cableId === segmentId && item.number === fiberNumber);
  const tube = fiber ? data.tubes.find(item => item.id === fiber.tubeId) : undefined;
  return { fiber, tube };
};
const assetForNode = (nodeId: string): AssetRef => nodeId.startsWith('SC')
  ? { kind: 'closure', id: nodeId.slice(2) }
  : nodeId.startsWith('AP') ? { kind: 'ap', id: nodeId.slice(2) }
  : nodeId === 'AGG5' ? { kind: 'aggregation', id: '5' }
  : nodeId === 'LENTEKHI' ? { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID }
  : { kind: 'boundary', id: nodeId };
const nodeLabel = (asset: AssetRef) => asset.kind === 'closure' ? `SC${asset.id}`
  : asset.kind === 'ap' ? `AP${asset.id}`
  : asset.kind === 'aggregation' ? asset.id === '5' ? 'AGG5' : 'ლენტეხის აგრეგაცია'
  : asset.id.replace(/^BOUNDARY-/, '');

function side(data: Inventory, value: EvidenceSide) {
  const cable = data.cables.find(item => item.legacyCableId === value.legacySegmentId);
  if (!cable) return null;
  const identity = fiberIdentity(data, cable.id, value.fiberNumber);
  if (!identity.fiber) return null;
  return {
    segmentId: cable.id, fiberNumber: value.fiberNumber, tubeNumber: identity.tube?.number ?? null,
    tubeColor: identity.tube?.physicalColor ?? null, fiberColor: identity.fiber.physicalColor,
  };
}

function isBranchEdge(nodeId: string, segmentIds: string[]) {
  const branchByNode: Record<string, string[]> = {
    SC205: ['CAB-000149'], SC206: ['CAB-000151'], SC216: ['CAB-000170'], SC218: ['CAB-000173'],
    SC219: ['CAB-000175'], SC224: ['CAB-000181'], SC225: ['CAB-000182', 'CAB-000183'],
  };
  return segmentIds.some(id => branchByNode[nodeId]?.includes(id));
}

function buildNodeTransitions(data: Inventory): NodeFiberTransition[] {
  const transitions = routingEvidence.exactConnectorEdges.flatMap((edge): NodeFiberTransition[] => {
    const a = side(data, edge.a), z = side(data, edge.z);
    if (!a || !z) return [];
    const ownerConfirmed = ownerConfirmationIds.has('GOLDEN-SC219-F32-AP52-LENTEKHI') && edge.nodeId === 'SC219' && [[a.segmentId, a.fiberNumber], [z.segmentId, z.fiberNumber]].some(([id, fiber]) => id === 'CAB-000176' && fiber === 32)
      || ownerConfirmationIds.has('GOLDEN-LENTEKHI-P38-SC225-AP') && edge.nodeId === 'SC224' && [[a.segmentId, a.fiberNumber], [z.segmentId, z.fiberNumber]].some(([id, fiber]) => id === 'CAB-000184' && fiber === 38);
    return [{
      id: edge.id, node: assetForNode(edge.nodeId), a, z, port: null,
      transitionType: isBranchEdge(edge.nodeId, [a.segmentId, z.segmentId]) ? 'branch_continuation' : 'optical_continuation',
      operation: 'unknown',
      sourceGeometry: { beginX: edge.geometry.begin?.x, beginY: edge.geometry.begin?.y, endX: edge.geometry.end?.x, endY: edge.geometry.end?.y, context: edge.basis.join(' + ') },
      source: source([edge.connectorShapeId, edge.a.markerShapeId, edge.z.markerShapeId], `${edge.nodeId}: source connector resolves ${edge.a.legacySegmentId}/F${edge.a.fiberNumber} ↔ ${edge.z.legacySegmentId}/F${edge.z.fiberNumber}.`, edge.basis.join('+')),
      interpretationBasis: edge.basis.includes('explicit_connect') ? 'Visio Connect row plus decoded marker endpoint.' : 'Both line endpoints align to decoded marker positions within the bounded source tolerance.',
      projectionStatus: ownerConfirmed ? 'owner_confirmed' : 'source_interpreted', active: true,
      notes: ['This is a node-local optical transition. Route adjacency, matching number and color are not transition keys.'],
    }];
  });
  const c181 = data.cables.find(item => item.legacyCableId === '181');
  if (c181) {
    for (const fiberNumber of [...Array.from({ length: 8 }, (_, index) => index + 5), ...Array.from({ length: 8 }, (_, index) => index + 17)]) {
      const terminal = side(data, { legacySegmentId: '181', fiberNumber, bankIndex: fiberNumber - 1, markerShapeId: `SC225-C181-F${String(fiberNumber).padStart(2, '0')}` });
      if (!terminal) continue;
      transitions.push({
        id: `NFT-SC225-C181-F${String(fiberNumber).padStart(2, '0')}-TERMINATION`, node: { kind: 'closure', id: '225' }, a: terminal, z: null, port: null,
        transitionType: 'intentional_termination', operation: 'terminated', sourceGeometry: { context: 'The C181 marker/connector ends at SC225 without a C182/C183 continuation; the network owner confirms intentional termination.' },
        source: source(['37984', fiberNumber <= 12 ? '32572' : '23293'], `Owner confirms C181/F${String(fiberNumber).padStart(2, '0')} terminates at SC225.`, `C181/F${String(fiberNumber).padStart(2, '0')}→SC225→termination`),
        interpretationBasis: 'Latest owner confirmation, supported by the absence of a source connector into C182/C183.', projectionStatus: 'owner_confirmed', active: true,
        notes: ['Known intentional termination; this is not an unresolved continuation.', 'Not field verified.'],
      });
    }
  }
  return transitions;
}

type Adjacency = { transition: NodeFiberTransition; otherKey: string };

function bindingEndpoint(data: Inventory, segmentId: string, fiberNumber: number, asset: AssetRef): FiberLineageEndpoint | null {
  const binding = (data.portTopologyBindings ?? []).find(item => item.segmentId === segmentId && item.fiberNumber === fiberNumber && (
    item.ownerType === 'ap' ? asset.kind === 'ap' && asset.id === item.ownerId
      : item.ownerId === TSAGERI_ODF_ID ? asset.kind === 'aggregation' && asset.id === '5'
      : item.ownerId === LENTEKHI_ODF_ID ? asset.kind === 'aggregation' && asset.id === LENTEKHI_AGGREGATION_ID : false
  ));
  if (!binding) return null;
  const label = binding.ownerType === 'ap' ? `AP${binding.ownerId}` : binding.ownerId === TSAGERI_ODF_ID ? 'AGG5' : 'ლენტეხის აგრეგაცია';
  return { asset, label: `${label} / Port ${binding.portNumber}`, portNumber: binding.portNumber, fiberNumber };
}

function endpointFor(data: Inventory, segmentId: string, fiberNumber: number, asset: AssetRef, transitions: NodeFiberTransition[]): FiberLineageEndpoint {
  const bound = bindingEndpoint(data, segmentId, fiberNumber, asset);
  if (bound) return bound;
  const terminal = transitions.find(item => item.active && item.z === null && sameAsset(item.node, asset) && item.a.segmentId === segmentId && item.a.fiberNumber === fiberNumber);
  if (terminal?.transitionType === 'intentional_termination') return { asset, label: `${nodeLabel(asset)} / აქ მთავრდება`, portNumber: null, fiberNumber };
  if (terminal) return { asset, label: `${nodeLabel(asset)} / AP მხარე დაუდგენელია`, portNumber: null, fiberNumber };
  return { asset, label: `${nodeLabel(asset)} / გაგრძელება დაუდგენელია`, portNumber: null, fiberNumber };
}

function endpointPriority(endpoint: FiberLineageEndpoint) {
  if (endpoint.asset?.kind === 'aggregation' && endpoint.asset.id === '5') return 0;
  if (endpoint.asset?.kind === 'aggregation') return 1;
  if (endpoint.asset?.kind === 'ap') return 2;
  if (endpoint.asset?.kind === 'boundary') return 3;
  return 4;
}

function makeLeg(data: Inventory, sequence: number, segmentId: string, fiberNumber: number, startNode: AssetRef, endNode: AssetRef, status: PrototypeProjectionStatus): FiberLineageLeg {
  const cable = data.cables.find(item => item.id === segmentId)!;
  const identity = fiberIdentity(data, segmentId, fiberNumber);
  return {
    sequence, segmentId, sourceSegmentLabel: `C${cable.legacyCableId}`, sourceOnly: false, fiberId: identity.fiber?.id ?? null,
    fiberNumber, tubeId: identity.tube?.id ?? null, tubeNumber: identity.tube?.number ?? null,
    tubeColor: identity.tube!.physicalColor, fiberColor: identity.fiber!.physicalColor,
    startNode, endNode, source: source(cable.source.shapeIds, `Local identity on C${cable.legacyCableId}/F${fiberNumber}.`, cable.legacyLabels[0], BRANCH_LINEAGE_RULE),
    basis: 'Segment-local Fiber identity reached only through node-local transition edges.', projectionStatus: status,
  };
}

function makeLineageTransition(sequence: number, before: FiberLineageLeg, after: FiberLineageLeg, transition: NodeFiberTransition, status: PrototypeProjectionStatus): FiberLineageTransition {
  const numberChanged = before.fiberNumber !== after.fiberNumber;
  const tubeChanged = before.tubeNumber !== after.tubeNumber || before.tubeColor?.key !== after.tubeColor?.key;
  const fiberColorChanged = before.fiberColor?.key !== after.fiberColor?.key;
  return {
    sequence, node: transition.node, fromSegmentId: before.segmentId, fromFiberNumber: before.fiberNumber,
    toSegmentId: after.segmentId, toFiberNumber: after.fiberNumber, beforeTubeNumber: before.tubeNumber,
    beforeTubeColor: before.tubeColor, beforeFiberColor: before.fiberColor, afterTubeNumber: after.tubeNumber,
    afterTubeColor: after.tubeColor, afterFiberColor: after.fiberColor, operation: 'unknown', numberChanged, tubeChanged,
    fiberColorChanged, sourceGeometry: transition.sourceGeometry, source: transition.source, projectionStatus: status,
    nodeFiberTransitionId: transition.id,
  };
}

function buildGraphLineages(data: Inventory, transitions: NodeFiberTransition[], previous: FiberLineage[]): FiberLineage[] {
  const activeEdges = transitions.filter(item => item.active && item.z);
  const adjacency = new Map<string, Adjacency[]>();
  const add = (from: string, value: Adjacency) => adjacency.set(from, [...(adjacency.get(from) ?? []), value]);
  for (const transition of activeEdges) {
    const aKey = key(transition.a.segmentId, transition.a.fiberNumber);
    const zKey = key(transition.z!.segmentId, transition.z!.fiberNumber);
    add(aKey, { transition, otherKey: zKey }); add(zKey, { transition, otherKey: aKey });
  }
  const visited = new Set<string>();
  const lineages: FiberLineage[] = [];
  for (const startKey of adjacency.keys()) {
    if (visited.has(startKey)) continue;
    const component = new Set<string>(); const queue = [startKey]; visited.add(startKey);
    while (queue.length) {
      const current = queue.pop()!; component.add(current);
      for (const item of adjacency.get(current) ?? []) if (!visited.has(item.otherKey)) { visited.add(item.otherKey); queue.push(item.otherKey); }
    }
    const terminals: Array<{ vertexKey: string; asset: AssetRef; endpoint: FiberLineageEndpoint }> = [];
    for (const vertexKey of component) {
      const split = vertexKey.lastIndexOf(':'); const segmentId = vertexKey.slice(0, split), fiberNumber = Number(vertexKey.slice(split + 1));
      const cable = data.cables.find(item => item.id === segmentId)!;
      const usedNodes = (adjacency.get(vertexKey) ?? []).map(item => item.transition.node);
      for (const asset of [cable.endpointA, cable.endpointB]) if (!usedNodes.some(node => sameAsset(node, asset))) terminals.push({ vertexKey, asset, endpoint: endpointFor(data, segmentId, fiberNumber, asset, transitions) });
    }
    if (terminals.length < 2) continue;
    terminals.sort((a, b) => endpointPriority(a.endpoint) - endpointPriority(b.endpoint) || a.endpoint.label.localeCompare(b.endpoint.label));
    const first = terminals[0];
    const ordered: Array<{ vertexKey: string; segmentId: string; fiberNumber: number; startNode: AssetRef; endNode: AssetRef; transitionToNext?: NodeFiberTransition }> = [];
    let currentKey = first.vertexKey, entryNode = first.asset; const walked = new Set<string>();
    while (!walked.has(currentKey)) {
      walked.add(currentKey);
      const split = currentKey.lastIndexOf(':'); const segmentId = currentKey.slice(0, split), fiberNumber = Number(currentKey.slice(split + 1));
      const cable = data.cables.find(item => item.id === segmentId)!;
      const exitNode = sameAsset(cable.endpointA, entryNode) ? cable.endpointB : cable.endpointA;
      const next = (adjacency.get(currentKey) ?? []).find(item => sameAsset(item.transition.node, exitNode) && !walked.has(item.otherKey));
      ordered.push({ vertexKey: currentKey, segmentId, fiberNumber, startNode: entryNode, endNode: exitNode, transitionToNext: next?.transition });
      if (!next) break;
      currentKey = next.otherKey; entryNode = exitNode;
    }
    if (ordered.length !== component.size) continue;
    const componentKeys = new Set(ordered.map(item => item.vertexKey));
    const f32 = componentKeys.has(key('CAB-000176', 32));
    const p38 = componentKeys.has(key('CAB-000184', 38));
    const oldExact = previous.find(item => {
      const oldKeys = new Set(item.legs.filter(leg => !leg.sourceOnly).map(leg => key(leg.segmentId, leg.fiberNumber)));
      return oldKeys.size === componentKeys.size && [...componentKeys].every(itemKey => oldKeys.has(itemKey));
    });
    const id = f32 ? GOLDEN_F32_LINEAGE_ID : p38 ? GOLDEN_PORT38_LINEAGE_ID : oldExact?.id ?? `LINEAGE-GRAPH-${String(lineages.length + 1).padStart(3, '0')}`;
    const ownerGolden = f32 || p38 || componentKeys.has(key('CAB-000172', 1)) || componentKeys.has(key('CAB-000172', 29)) || componentKeys.has(key('CAB-000172', 31));
    const status: PrototypeProjectionStatus = ownerGolden ? 'owner_confirmed' : 'source_interpreted';
    const legs = ordered.map((item, index) => makeLeg(data, index + 1, item.segmentId, item.fiberNumber, item.startNode, item.endNode, status));
    const lineageTransitions = ordered.slice(0, -1).map((item, index) => makeLineageTransition(index + 1, legs[index], legs[index + 1], item.transitionToNext!, status));
    const last = ordered.at(-1)!;
    const endpointA = endpointFor(data, ordered[0].segmentId, ordered[0].fiberNumber, ordered[0].startNode, transitions);
    const endpointB = endpointFor(data, last.segmentId, last.fiberNumber, last.endNode, transitions);
    const unresolved = endpointA.label.includes('დაუდგენელია') || endpointB.label.includes('დაუდგენელია');
    lineages.push({
      id, routeId: TSAGERI_ROUTE_ID, origin: endpointA, destination: endpointB, endpointA, endpointB, legs,
      transitions: lineageTransitions, projectionStatus: status, interpretationRule: BRANCH_LINEAGE_RULE,
      source: source([...new Set(lineageTransitions.flatMap(item => item.source.shapeIds))], 'Branch-aware Fiber Lineage generated only by traversing active NodeFiberTransition edges.', undefined, BRANCH_LINEAGE_RULE),
      warnings: unresolved ? ['ნაჩვენებია მაქსიმალური დასაბუთებული გზა; შემდეგი ზუსტი ჟილა ან AP ამ წყაროდან დაუდგენელია.'] : [], lifecycleStatus: 'active',
    });
  }
  return lineages;
}

function auditPrevious(previous: FiberLineage[], current: FiberLineage[]): FiberLineageAuditRecord[] {
  return previous.map(old => {
    const oldKeys = new Set(old.legs.filter(leg => !leg.sourceOnly).map(leg => key(leg.segmentId, leg.fiberNumber)));
    const ranked = current.map(item => ({ item, overlap: item.legs.filter(leg => oldKeys.has(key(leg.segmentId, leg.fiberNumber))).length })).filter(item => item.overlap).sort((a, b) => b.overlap - a.overlap);
    const exact = ranked.find(({ item }) => item.legs.length === oldKeys.size && item.legs.every(leg => oldKeys.has(key(leg.segmentId, leg.fiberNumber))));
    const classification: FiberLineageAuditRecord['classification'] = exact ? 'preserved' : ranked.length ? 'corrected' : 'unresolved';
    const replacements = exact ? [exact.item] : ranked.slice(0, 2).map(item => item.item);
    return {
      id: `AUDIT-${old.id}`, previousLineageId: old.id, classification,
      oldPath: old.legs.map(leg => `${leg.sourceSegmentLabel}/F${String(leg.fiberNumber).padStart(2, '0')}`),
      correctedLineageIds: replacements.map(item => item.id),
      correctedPath: replacements[0]?.legs.map(leg => `${leg.sourceSegmentLabel}/F${String(leg.fiberNumber).padStart(2, '0')}`) ?? [],
      reason: exact ? 'The old leg set is reproduced by node-local transition traversal.' : ranked.length ? 'The old route-adjacency projection is replaced by the overlapping node-local transition component.' : 'No active node-local transition component supports this previous projection.',
    };
  });
}

function refreshLineageLinks(data: Inventory) {
  for (const binding of data.portTopologyBindings ?? []) binding.lineageIds = (data.fiberLineages ?? []).filter(lineage =>
    lineage.legs.some(leg => leg.segmentId === binding.segmentId && leg.fiberNumber === binding.fiberNumber)
    && [lineage.endpointA, lineage.endpointB, lineage.origin, lineage.destination].some(endpoint => endpoint?.portNumber === binding.portNumber && (
      binding.ownerType === 'ap' ? endpoint.asset?.kind === 'ap' && endpoint.asset.id === binding.ownerId
        : binding.ownerId === TSAGERI_ODF_ID ? endpoint.asset?.kind === 'aggregation' && endpoint.asset.id === '5'
        : endpoint.asset?.kind === 'aggregation' && endpoint.asset.id === LENTEKHI_AGGREGATION_ID
    ))).map(lineage => lineage.id);
  for (const flow of data.apPortFlows ?? []) {
    const binding = data.portTopologyBindings?.find(item => item.ownerType === 'ap' && item.ownerId === flow.accessPointId && item.portNumber === flow.portNumber);
    flow.lineageIds = binding?.lineageIds ?? [];
  }
}

export const nodeTransitionsForFiber = (data: Inventory, segmentId: string, fiberNumber: number) =>
  (data.nodeFiberTransitions ?? []).filter(item => item.a.segmentId === segmentId && item.a.fiberNumber === fiberNumber || item.z?.segmentId === segmentId && item.z.fiberNumber === fiberNumber);

export function validateIteration21(data: Inventory): string[] {
  const errors: string[] = [];
  const active = data.fiberLineages ?? [];
  const transitions = new Map((data.nodeFiberTransitions ?? []).filter(item => item.active).map(item => [item.id, item]));
  const staleIds = new Set((data.supersededFiberLineages ?? []).map(item => item.id));
  for (const lineage of active) {
    if (lineage.lifecycleStatus !== 'active') errors.push(`Inactive Lineage in active inventory: ${lineage.id}`);
    if (staleIds.has(lineage.id) && lineage.interpretationRule !== BRANCH_LINEAGE_RULE) errors.push(`Superseded Lineage remains active: ${lineage.id}`);
    for (let index = 0; index < lineage.legs.length - 1; index += 1) {
      const before = lineage.legs[index], after = lineage.legs[index + 1], item = lineage.transitions[index];
      const local = item?.nodeFiberTransitionId ? transitions.get(item.nodeFiberTransitionId) : undefined;
      if (!local || !sameAsset(before.endNode, after.startNode) || !sameAsset(local.node, before.endNode)) errors.push(`Missing node-local transition: ${lineage.id}/${index + 1}`);
      const pair = new Set([key(before.segmentId, before.fiberNumber), key(after.segmentId, after.fiberNumber)]);
      if (local?.z && (!pair.has(key(local.a.segmentId, local.a.fiberNumber)) || !pair.has(key(local.z.segmentId, local.z.fiberNumber)))) errors.push(`Transition identity mismatch: ${lineage.id}/${index + 1}`);
    }
    const endpointSegments = [lineage.legs[0]?.segmentId, lineage.legs.at(-1)?.segmentId];
    for (const endpoint of [lineage.endpointA ?? lineage.origin, lineage.endpointB ?? lineage.destination]) {
      if (endpoint.asset?.kind === 'ap') {
        const required: Record<string, string> = { '51': 'CAB-000173', '52': 'CAB-000175', '53': 'CAB-000182', '54': 'CAB-000183' };
        if (required[endpoint.asset.id] && !endpointSegments.includes(required[endpoint.asset.id])) errors.push(`AP${endpoint.asset.id} endpoint skips its branch Segment: ${lineage.id}`);
      }
    }
    if (lineage.legs.some(leg => leg.startNode.kind === 'closure' && leg.startNode.id === '225' || leg.endNode.kind === 'closure' && leg.endNode.id === '225')
      && lineage.legs.some(leg => ['CAB-000180', 'CAB-000184'].includes(leg.segmentId)) && !lineage.legs.some(leg => leg.segmentId === 'CAB-000181')) errors.push(`SC225 path skips C181: ${lineage.id}`);
  }
  const f32 = active.find(item => item.id === GOLDEN_F32_LINEAGE_ID);
  if (!f32 || !f32.legs.some(leg => leg.segmentId === 'CAB-000175' && leg.fiberNumber === 24) || f32.legs.some(leg => ['CAB-000174', 'CAB-000173'].includes(leg.segmentId))) errors.push('Golden C176/F32 branch topology mismatch.');
  const p38 = active.find(item => item.id === GOLDEN_PORT38_LINEAGE_ID);
  if (!p38 || !p38.legs.some(leg => leg.segmentId === 'CAB-000181' && leg.fiberNumber === 6) || p38.legs.some(leg => ['CAB-000180', 'CAB-000174', 'CAB-000173'].includes(leg.segmentId))) errors.push('Golden Lentekhi Port38 topology mismatch.');
  if (data.fiberJourneySummaries?.length !== data.fibers.length) errors.push('Fiber Journey coverage is incomplete.');
  return errors;
}

export function applyIteration21(data: Inventory): Inventory {
  const previous = structuredClone(data.fiberLineages ?? []);
  data.nodeFiberTransitions = buildNodeTransitions(data);
  data.fiberLineages = buildGraphLineages(data, data.nodeFiberTransitions, previous);
  data.fiberLineageAudit = auditPrevious(previous, data.fiberLineages);
  const preserved = new Set(data.fiberLineageAudit.filter(item => item.classification === 'preserved').map(item => item.previousLineageId));
  data.supersededFiberLineages = previous.filter(item => !preserved.has(item.id)).map(item => ({
    ...item, lifecycleStatus: 'superseded' as const,
    supersededByIds: data.fiberLineageAudit?.find(record => record.previousLineageId === item.id)?.correctedLineageIds ?? [],
    supersessionReason: 'Superseded by Iteration 21 node-local Fiber transition traversal.',
  }));
  refreshLineageLinks(data);
  rebuildFiberJourneySummaries(data);
  for (const summary of data.fiberJourneySummaries ?? []) {
    const lineage = summary.lineageId ? data.fiberLineages.find(item => item.id === summary.lineageId) : undefined;
    summary.transitionIds = lineage?.transitions.flatMap(item => item.nodeFiberTransitionId ? [item.nodeFiberTransitionId] : []) ?? [];
  }
  return data;
}

