import type {
  AssetRef, Cable, CableContinuation, CableContinuationFiberMapping, CableContinuationSegmentSide,
  CableContinuationSide, CableRoute, ClaimReviewState, Connection, Fiber, Inventory, OperationalStatus,
  PhysicalColor, SourceRef, Tube,
} from './types';

const RULE = 'tsageri-lentekhi-cable-continuity/1';
const SOURCE_FILE = 'Tsageri-Lentekhi 2025.vsdx';
const SOURCE_PAGE = 'ცაგერი-ლენტეხი';

export type ContinuityMode = 'strict' | 'candidate';
export type RelativeDirection = 'upstream' | 'downstream' | 'at_endpoint' | 'unresolved';
export type CableContinuityPathStatus = 'authoritative' | 'partial_authoritative' | 'candidate' | 'conflict' | 'unresolved';

export interface SegmentOrientation {
  routeId: string;
  upstreamAsset: AssetRef | null;
  downstreamAsset: AssetRef | null;
  upstreamLabel: string;
  downstreamLabel: string;
  knownOrigin: string;
  knownDestination: string;
}

export interface SegmentContinuationGroup {
  id: string;
  continuationId: string | null;
  node: AssetRef;
  direction: RelativeDirection;
  sourceSegmentId: string;
  sourceStart: number;
  sourceEnd: number;
  targetSegmentId: string | null;
  targetAsset: AssetRef | null;
  targetLabel: string;
  targetStart: number | null;
  targetEnd: number | null;
  operationalStatus: OperationalStatus;
  reviewState: ClaimReviewState;
  authoritativeCount: number;
  candidateCount: number;
  conflictingCount: number;
  unresolvedCount: number;
  totalCount: number;
  mappingMode: CableContinuation['mappingMode'];
  memberMappings: Array<{ sourceFiberNumber: number; targetFiberNumber: number | null; operationalStatus: OperationalStatus }>;
  warnings: string[];
}

export interface ConstructionTubeView {
  tube: Tube;
  displayNumber: number;
  state: 'documented' | 'proposed';
  fiberStart: number;
  fiberEnd: number;
  tubeColor: PhysicalColor | null;
  fibers: Array<{ fiber: Fiber; displayColor: PhysicalColor | null; colorState: 'documented' | 'proposed' | 'unknown' }>;
}

export interface TubeContinuationSummary {
  tube: ConstructionTubeView;
  direction: RelativeDirection;
  state: 'established_together' | 'candidate_single' | 'split' | 'partial' | 'unresolved';
  groups: SegmentContinuationGroup[];
  unresolvedMembers: number[];
}

export interface ExactFiberContinuation {
  continuationId: string | null;
  direction: RelativeDirection;
  node: AssetRef;
  sourceSegmentId: string;
  sourceFiberNumber: number;
  targetSegmentId: string | null;
  targetFiberNumber: number | null;
  targetAsset: AssetRef | null;
  targetLabel: string;
  operationalStatus: OperationalStatus;
}

export interface CableContinuityPathStep {
  kind: 'segment' | 'node' | 'asset' | 'stop';
  label: string;
  segmentId?: string;
  fiberNumber?: number;
  asset?: AssetRef;
  operationalStatus: OperationalStatus;
}

export interface CableContinuityPath {
  id: string;
  mode: ContinuityMode;
  direction: 'upstream' | 'downstream';
  status: CableContinuityPathStatus;
  steps: CableContinuityPathStep[];
  stopReason: string;
}

export interface ClosureContinuationFork {
  id: string;
  sourceSegmentId: string;
  sourceLabel: string;
  sourceStart: number;
  sourceEnd: number;
  targetSegmentId: string | null;
  targetLabel: string;
  operationalStatus: OperationalStatus;
  authoritativeCount: number;
  candidateCount: number;
  unresolvedCount: number;
  warnings: string[];
}

const sameAsset = (a: AssetRef | null | undefined, b: AssetRef | null | undefined) => !!a && !!b && a.kind === b.kind && a.id === b.id;
const findCable = (data: Inventory, id: string) => data.cables.find(item => item.id === id || item.legacyCableId === id);
const assetLabel = (asset: AssetRef) => asset.kind === 'closure' ? `SC${asset.id}` : asset.kind === 'aggregation' ? `AGG${asset.id}` : asset.kind === 'ap' ? `AP${asset.id}` : asset.kind === 'boundary' ? asset.id.replace(/^BOUNDARY-/, '') : asset.kind === 'network_node' ? `Node ${asset.id}` : `${asset.kind.toUpperCase()}${asset.id}`;
const rangeLabel = (start: number, end: number) => start === end ? `F${String(start).padStart(2, '0')}` : `F${String(start).padStart(2, '0')}–F${String(end).padStart(2, '0')}`;

function sourceFor(connections: Connection[], note: string, fallback?: SourceRef): SourceRef {
  return {
    file: connections[0]?.source.file ?? fallback?.file ?? SOURCE_FILE,
    page: connections[0]?.source.page ?? fallback?.page ?? SOURCE_PAGE,
    pageId: connections[0]?.source.pageId ?? fallback?.pageId ?? '4',
    part: connections[0]?.source.part ?? fallback?.part ?? 'visio/pages/page1.xml',
    shapeIds: [...new Set(connections.flatMap(item => item.source.shapeIds))],
    interpretationRule: RULE,
    note,
  };
}

function statusForConnection(connection: Connection): OperationalStatus {
  if (connection.operationalStatus) return connection.operationalStatus;
  if (connection.review?.state === 'accepted' || connection.approved) return 'authoritative';
  if (connection.review?.state === 'conflicting' || connection.verification === 'conflicting') return 'conflicting';
  return 'candidate';
}

function knownTubeForRange(data: Inventory, segmentId: string, start: number, end: number): string | null {
  const fibers = data.fibers.filter(item => item.cableId === segmentId && item.number >= start && item.number <= end);
  if (fibers.length !== end - start + 1) return null;
  const tubeIds = new Set(fibers.map(item => item.tubeId).filter((id): id is string => !!id));
  if (tubeIds.size !== 1) return null;
  const tubeId = [...tubeIds][0];
  return data.tubes.find(item => item.id === tubeId && item.basis === 'documented') ? tubeId : null;
}

function segmentSide(data: Inventory, segmentId: string, start: number, end: number): CableContinuationSegmentSide {
  return { kind: 'segment', segmentId, fiberRange: { startFiberNumber: start, endFiberNumber: end }, tubeId: knownTubeForRange(data, segmentId, start, end) };
}

function fiberPair(connection: Connection, sideAId: string, sideZId: string): CableContinuationFiberMapping | null {
  if (connection.a.kind !== 'fiber' || connection.z.kind !== 'fiber') return null;
  const a = connection.a.cableId === sideAId && connection.z.cableId === sideZId
    ? { source: connection.a.fiber, target: connection.z.fiber }
    : connection.z.cableId === sideAId && connection.a.cableId === sideZId
      ? { source: connection.z.fiber, target: connection.a.fiber }
      : null;
  return a ? {
    sourceFiberNumber: a.source,
    targetFiberNumber: a.target,
    operationalStatus: statusForConnection(connection),
    connectionId: connection.id,
    evidenceIds: [...(connection.evidenceIds ?? [])],
  } : null;
}

function connectionsForRange(data: Inventory, node: AssetRef, sideAId: string, sideZId: string, start: number, end: number): Connection[] {
  return data.connections.filter(connection => sameAsset(connection.location, node) && connection.a.kind === 'fiber' && connection.z.kind === 'fiber' && (
    (connection.a.cableId === sideAId && connection.z.cableId === sideZId && connection.a.fiber >= start && connection.a.fiber <= end)
    || (connection.z.cableId === sideAId && connection.a.cableId === sideZId && connection.z.fiber >= start && connection.z.fiber <= end)
  ));
}

function continuationFromConnections(
  data: Inventory,
  options: { id: string; node: AssetRef; sideAId: string; sideAStart: number; sideAEnd: number; sideZId: string; sideZStart: number; sideZEnd: number; mappingMode: CableContinuation['mappingMode']; routeIds: string[] },
): CableContinuation {
  const connections = connectionsForRange(data, options.node, options.sideAId, options.sideZId, options.sideAStart, options.sideAEnd);
  const mappings = connections.map(item => fiberPair(item, options.sideAId, options.sideZId)).filter((item): item is CableContinuationFiberMapping => !!item).sort((a, b) => a.sourceFiberNumber - b.sourceFiberNumber);
  const statuses = new Set(mappings.map(item => item.operationalStatus));
  const operationalStatus: OperationalStatus = statuses.has('conflicting') ? 'conflicting' : statuses.size === 1 && statuses.has('authoritative') ? 'authoritative' : 'candidate';
  return {
    id: options.id,
    node: options.node,
    sideA: segmentSide(data, options.sideAId, options.sideAStart, options.sideAEnd),
    sideZ: segmentSide(data, options.sideZId, options.sideZStart, options.sideZEnd),
    mappingScope: options.sideAStart === options.sideAEnd ? 'individual_fiber' : 'fiber_range',
    mappingMode: options.mappingMode,
    individualMappings: mappings,
    routeIds: options.routeIds,
    operation: 'unknown',
    operationalStatus,
    reviewState: operationalStatus === 'authoritative' ? 'reviewed_no_change' : operationalStatus === 'conflicting' ? 'disputed' : 'needs_review',
    evidenceIds: [...new Set(connections.flatMap(item => item.evidenceIds ?? []))],
    sourceConnectionIds: connections.map(item => item.id),
    source: sourceFor(connections, `Range interpretation ${rangeLabel(options.sideAStart, options.sideAEnd)} between C${findCable(data, options.sideAId)?.legacyCableId} and C${findCable(data, options.sideZId)?.legacyCableId}.`),
    warnings: [
      'CableContinuation does not assert shared PhysicalCable identity.',
      ...(operationalStatus === 'candidate' ? ['Possible continuation from source geometry; do not call the range connected.'] : []),
      ...(statuses.has('authoritative') && statuses.has('candidate') ? ['Mixed review state: authoritative individual mappings coexist with candidate members.'] : []),
    ],
  };
}

function unresolvedContinuation(data: Inventory, id: string, node: AssetRef, segmentId: string, start: number, end: number, routeIds: string[]): CableContinuation {
  const cable = findCable(data, segmentId)!;
  return {
    id,
    node,
    sideA: segmentSide(data, segmentId, start, end),
    sideZ: { kind: 'unresolved', label: 'No established mapping', fiberRange: null, tubeId: null },
    mappingScope: 'unresolved_range',
    mappingMode: 'unresolved',
    individualMappings: Array.from({ length: end - start + 1 }, (_, index) => ({ sourceFiberNumber: start + index, targetFiberNumber: null, operationalStatus: 'unresolved' as const, connectionId: null, evidenceIds: [] })),
    routeIds,
    operation: 'unknown',
    operationalStatus: 'unresolved',
    reviewState: 'needs_review',
    evidenceIds: [],
    sourceConnectionIds: [],
    source: sourceFor([], `No interpreted continuation exists for ${rangeLabel(start, end)} at ${assetLabel(node)}.`, cable.source),
    warnings: ['Absence of a mapping is not evidence that fibers are free, spare, disconnected or terminated.'],
  };
}

function assetContinuation(data: Inventory, connectionId: string, routeIds: string[]): CableContinuation {
  const connection = data.connections.find(item => item.id === connectionId)!;
  if (connection.a.kind !== 'fiber' || connection.z.kind !== 'asset') throw new Error(`Invalid asset continuation ${connectionId}`);
  return {
    id: 'CONT-AP51-C173-F01',
    node: connection.location,
    sideA: segmentSide(data, connection.a.cableId, connection.a.fiber, connection.a.fiber),
    sideZ: { kind: 'asset', asset: connection.z.asset, fiberRange: null, tubeId: null },
    mappingScope: 'individual_fiber',
    mappingMode: 'explicit',
    individualMappings: [{ sourceFiberNumber: connection.a.fiber, targetFiberNumber: null, operationalStatus: statusForConnection(connection), connectionId: connection.id, evidenceIds: [...(connection.evidenceIds ?? [])] }],
    routeIds,
    operation: connection.operation,
    operationalStatus: statusForConnection(connection),
    reviewState: 'reviewed_no_change',
    evidenceIds: [...(connection.evidenceIds ?? [])],
    sourceConnectionIds: [connection.id],
    source: sourceFor([connection], 'Reviewed C173/F01 optical continuation to AP51 asset; exact AP port remains unresolved.'),
    warnings: ['Exact AP51 port and containment remain unresolved.'],
  };
}

export function buildTsageriCableContinuations(data: Inventory): CableContinuation[] {
  const routeIds = ['ROUTE-TSAGERI-LENTEKHI-CORE'];
  return [
    continuationFromConnections(data, { id: 'CONT-SC218-C172-01-28-C174-01-28', node: { kind: 'closure', id: '218' }, sideAId: 'CAB-000172', sideAStart: 1, sideAEnd: 28, sideZId: 'CAB-000174', sideZStart: 1, sideZEnd: 28, mappingMode: 'same_number', routeIds }),
    continuationFromConnections(data, { id: 'CONT-SC218-C172-29-40-C173-01-12', node: { kind: 'closure', id: '218' }, sideAId: 'CAB-000172', sideAStart: 29, sideAEnd: 40, sideZId: 'CAB-000173', sideZStart: 1, sideZEnd: 12, mappingMode: 'offset', routeIds }),
    unresolvedContinuation(data, 'CONT-SC218-C172-41-48-UNRESOLVED', { kind: 'closure', id: '218' }, 'CAB-000172', 41, 48, routeIds),
    continuationFromConnections(data, { id: 'CONT-SC218-C174-29-40-C173-13-24', node: { kind: 'closure', id: '218' }, sideAId: 'CAB-000174', sideAStart: 29, sideAEnd: 40, sideZId: 'CAB-000173', sideZStart: 13, sideZEnd: 24, mappingMode: 'offset', routeIds }),
    unresolvedContinuation(data, 'CONT-SC218-C174-41-48-UNRESOLVED', { kind: 'closure', id: '218' }, 'CAB-000174', 41, 48, routeIds),
    continuationFromConnections(data, { id: 'CONT-SC217-C171-F29-C172-F29', node: { kind: 'closure', id: '217' }, sideAId: 'CAB-000171', sideAStart: 29, sideAEnd: 29, sideZId: 'CAB-000172', sideZStart: 29, sideZEnd: 29, mappingMode: 'same_number', routeIds }),
    assetContinuation(data, 'ap51-34267', routeIds),
  ];
}

export function applyIteration16CableContinuity(data: Inventory): Inventory {
  data.cableContinuations = buildTsageriCableContinuations(data);
  return data;
}

function routeSegmentId(data: Inventory, leg: CableRoute['legs'][number]): string | null {
  if (leg.segmentId) return leg.segmentId;
  const legacy = leg.sourceLabel?.split('-')[0];
  return legacy ? findCable(data, legacy)?.id ?? null : null;
}

export function segmentOrientation(data: Inventory, routeId: string, segmentId: string): SegmentOrientation | null {
  const preferred = data.cableRoutes?.find(item => item.id === routeId);
  const routes = preferred ? [preferred, ...(data.cableRoutes ?? []).filter(item => item.id !== preferred.id)] : (data.cableRoutes ?? []);
  for (const route of routes) {
    const leg = route.legs.find(item => routeSegmentId(data, item) === segmentId);
    if (leg) {
      const from = route.nodes.find(item => item.id === leg.fromNodeId);
      const to = route.nodes.find(item => item.id === leg.toNodeId);
      return { routeId: route.id, upstreamAsset: from?.asset ?? null, downstreamAsset: to?.asset ?? null, upstreamLabel: from?.label ?? route.origin.label, downstreamLabel: to?.label ?? route.destination.label, knownOrigin: route.origin.label, knownDestination: route.destination.label };
    }
    for (const branch of route.branches) {
      if (!branch.segmentIds.includes(segmentId)) continue;
      const from = route.nodes.find(item => item.id === branch.fromNodeId);
      const destinationLabel = branch.destination ? assetLabel(branch.destination) : branch.targetDirectionText ?? 'Unresolved branch destination';
      return { routeId: route.id, upstreamAsset: from?.asset ?? null, downstreamAsset: branch.destination, upstreamLabel: from?.label ?? route.origin.label, downstreamLabel: destinationLabel, knownOrigin: route.origin.label, knownDestination: destinationLabel };
    }
  }
  return null;
}

function sideSegment(side: CableContinuationSide): CableContinuationSegmentSide | null {
  return side.kind === 'segment' ? side : null;
}

function directionAtNode(orientation: SegmentOrientation | null, node: AssetRef): RelativeDirection {
  if (!orientation) return 'unresolved';
  if (sameAsset(orientation.upstreamAsset, node)) return 'upstream';
  if (sameAsset(orientation.downstreamAsset, node)) return 'downstream';
  return 'unresolved';
}

function groupFor(data: Inventory, routeId: string, segmentId: string, continuation: CableContinuation): SegmentContinuationGroup | null {
  const a = sideSegment(continuation.sideA), z = sideSegment(continuation.sideZ);
  const selected = a?.segmentId === segmentId ? a : z?.segmentId === segmentId ? z : null;
  if (!selected) return null;
  const other: CableContinuationSide = selected === a ? continuation.sideZ : continuation.sideA;
  const reversed = selected === z;
  const mappings = continuation.individualMappings;
  const memberMappings = mappings.map(item => ({
    sourceFiberNumber: reversed ? item.targetFiberNumber ?? item.sourceFiberNumber : item.sourceFiberNumber,
    targetFiberNumber: reversed ? item.sourceFiberNumber : item.targetFiberNumber,
    operationalStatus: item.operationalStatus,
  })).sort((left, right) => left.sourceFiberNumber - right.sourceFiberNumber);
  const authoritativeCount = mappings.filter(item => item.operationalStatus === 'authoritative').length;
  const candidateCount = mappings.filter(item => item.operationalStatus === 'candidate').length;
  const conflictingCount = mappings.filter(item => item.operationalStatus === 'conflicting').length;
  const unresolvedCount = mappings.filter(item => item.operationalStatus === 'unresolved').length;
  return {
    id: `${continuation.id}:${segmentId}`,
    continuationId: continuation.id,
    node: continuation.node,
    direction: directionAtNode(segmentOrientation(data, routeId, segmentId), continuation.node),
    sourceSegmentId: segmentId,
    sourceStart: selected.fiberRange.startFiberNumber,
    sourceEnd: selected.fiberRange.endFiberNumber,
    targetSegmentId: other.kind === 'segment' ? other.segmentId : null,
    targetAsset: other.kind === 'asset' ? other.asset : null,
    targetLabel: other.kind === 'segment'
      ? `C${findCable(data, other.segmentId)?.legacyCableId ?? other.segmentId} / ${rangeLabel(other.fiberRange.startFiberNumber, other.fiberRange.endFiberNumber)}`
      : other.kind === 'asset' ? assetLabel(other.asset) : other.label,
    targetStart: other.kind === 'segment' ? other.fiberRange.startFiberNumber : null,
    targetEnd: other.kind === 'segment' ? other.fiberRange.endFiberNumber : null,
    operationalStatus: continuation.operationalStatus,
    reviewState: continuation.reviewState,
    authoritativeCount,
    candidateCount,
    conflictingCount,
    unresolvedCount,
    totalCount: selected.fiberRange.endFiberNumber - selected.fiberRange.startFiberNumber + 1,
    mappingMode: continuation.mappingMode,
    memberMappings,
    warnings: [...continuation.warnings, ...(reversed ? ['Displayed from the opposite side of the neutral continuation record.'] : [])],
  };
}

function gapRanges(total: number, covered: Set<number>): Array<{ start: number; end: number }> {
  const result: Array<{ start: number; end: number }> = [];
  let start: number | null = null;
  for (let number = 1; number <= total; number += 1) {
    if (!covered.has(number) && start == null) start = number;
    if ((covered.has(number) || number === total) && start != null) {
      const end = covered.has(number) ? number - 1 : number;
      result.push({ start, end });
      start = null;
    }
  }
  return result;
}

function derivedUnresolvedGroups(data: Inventory, routeId: string, cable: Cable, existing: SegmentContinuationGroup[]): SegmentContinuationGroup[] {
  const orientation = segmentOrientation(data, routeId, cable.id);
  if (!orientation) return [];
  const result: SegmentContinuationGroup[] = [];
  for (const [direction, node] of [['upstream', orientation.upstreamAsset], ['downstream', orientation.downstreamAsset]] as const) {
    if (!node || node.kind !== 'closure') continue;
    const atNode = existing.filter(item => item.direction === direction && sameAsset(item.node, node));
    const covered = new Set<number>();
    atNode.forEach(item => { for (let number = item.sourceStart; number <= item.sourceEnd; number += 1) covered.add(number); });
    for (const range of gapRanges(cable.fiberCount, covered)) {
      result.push({
        id: `DERIVED-${cable.id}-${node.id}-${range.start}-${range.end}`,
        continuationId: null,
        node,
        direction,
        sourceSegmentId: cable.id,
        sourceStart: range.start,
        sourceEnd: range.end,
        targetSegmentId: null,
        targetAsset: null,
        targetLabel: 'No established mapping',
        targetStart: null,
        targetEnd: null,
        operationalStatus: 'unresolved',
        reviewState: 'needs_review',
        authoritativeCount: 0,
        candidateCount: 0,
        conflictingCount: 0,
        unresolvedCount: range.end - range.start + 1,
        totalCount: range.end - range.start + 1,
        mappingMode: 'unresolved',
        memberMappings: Array.from({ length: range.end - range.start + 1 }, (_, index) => ({ sourceFiberNumber: range.start + index, targetFiberNumber: null, operationalStatus: 'unresolved' as const })),
        warnings: ['Derived coverage gap. This is not proof of spare, free, disconnected or terminated fibers.'],
      });
    }
  }
  return result;
}

export function segmentContinuationGroups(data: Inventory, routeId: string, segmentId: string): SegmentContinuationGroup[] {
  const cable = findCable(data, segmentId);
  if (!cable) return [];
  if (data.nodeFiberTransitions) {
    const active = activeGraphContinuationGroups(data, routeId, cable);
    return [...active, ...derivedUnresolvedGroups(data, routeId, cable, active)].sort((a, b) => {
      const directionOrder = { upstream: 0, downstream: 1, at_endpoint: 2, unresolved: 3 };
      return directionOrder[a.direction] - directionOrder[b.direction] || a.sourceStart - b.sourceStart || a.targetLabel.localeCompare(b.targetLabel);
    });
  }
  const persisted = (data.cableContinuations ?? []).map(item => groupFor(data, routeId, cable.id, item)).filter((item): item is SegmentContinuationGroup => !!item);
  return [...persisted, ...derivedUnresolvedGroups(data, routeId, cable, persisted)].sort((a, b) => {
    const directionOrder = { upstream: 0, downstream: 1, at_endpoint: 2, unresolved: 3 };
    return directionOrder[a.direction] - directionOrder[b.direction] || a.sourceStart - b.sourceStart;
  });
}

/** Read-only historical interpretation of CableContinuation records. Operational views use active node transitions. */
export function historicalSegmentContinuationGroups(data: Inventory, routeId: string, segmentId: string): SegmentContinuationGroup[] {
  const cable = findCable(data, segmentId);
  if (!cable) return [];
  return (data.cableContinuations ?? []).map(item => groupFor(data, routeId, cable.id, item)).filter((item): item is SegmentContinuationGroup => !!item);
}

function activeGraphContinuationGroups(data: Inventory, routeId: string, cable: Cable): SegmentContinuationGroup[] {
  const orientation = segmentOrientation(data, routeId, cable.id);
  if (!orientation) return [];
  const mapped: Array<{ transitionId: string; node: AssetRef; direction: RelativeDirection; sourceFiber: number; targetFiber: number | null; targetSegmentId: string | null; targetAsset: AssetRef | null; targetLabel: string; operationalStatus: OperationalStatus }> = [];
  const relevant = (data.nodeFiberTransitions ?? []).filter(item => item.active && (item.a.segmentId === cable.id || item.z?.segmentId === cable.id));
  const perSource = new Map<string, Set<string>>();
  for (const transition of relevant) {
    const sides = [transition.a, ...(transition.z ? [transition.z] : [])].filter(side => side.segmentId === cable.id);
    if (sides.length !== 1 || ![cable.endpointA, cable.endpointB].some(endpoint => sameAsset(endpoint, transition.node))) continue;
    const source = sides[0];
    const target = transition.a.segmentId === cable.id ? transition.z : transition.a;
    const targetSegmentId = target?.segmentId ?? null;
    const targetAsset: AssetRef | null = targetSegmentId ? null : transition.port ? { kind: transition.port.ownerType, id: transition.port.ownerId } : null;
    const targetLabel = targetSegmentId
      ? `C${findCable(data, targetSegmentId)?.legacyCableId ?? targetSegmentId} / F${String(target!.fiberNumber).padStart(2, '0')}`
      : transition.port ? `${transition.port.ownerType === 'ap' ? `AP${transition.port.ownerId}` : transition.port.ownerId} / Port ${transition.port.portNumber}`
        : transition.transitionType === 'intentional_termination' ? 'Intentional termination'
          : 'Continuation unresolved';
    const status: OperationalStatus = transition.transitionType === 'ap_side_unresolved' || transition.projectionStatus === 'source_ambiguous'
      ? transition.projectionStatus === 'source_ambiguous' ? 'conflicting' : 'unresolved'
      : 'authoritative';
    const sourceKey = `${transition.node.kind}:${transition.node.id}/${source.fiberNumber}`;
    const targetKey = targetSegmentId ? `${targetSegmentId}/${target!.fiberNumber}` : targetAsset ? `${targetAsset.kind}:${targetAsset.id}/${transition.port?.portNumber ?? ''}` : targetLabel;
    const alternatives = perSource.get(sourceKey) ?? new Set<string>(); alternatives.add(targetKey); perSource.set(sourceKey, alternatives);
    mapped.push({ transitionId: transition.id, node: transition.node, direction: directionAtNode(orientation, transition.node), sourceFiber: source.fiberNumber, targetFiber: target?.fiberNumber ?? null, targetSegmentId, targetAsset, targetLabel, operationalStatus: status });
  }
  for (const row of mapped) if ((perSource.get(`${row.node.kind}:${row.node.id}/${row.sourceFiber}`)?.size ?? 0) > 1) row.operationalStatus = 'conflicting';

  const groups = new Map<string, typeof mapped>();
  for (const row of mapped) {
    const delta = row.targetFiber == null ? 'terminal' : String(row.targetFiber - row.sourceFiber);
    const key = [row.node.kind, row.node.id, row.direction, row.targetSegmentId ?? '', row.targetAsset ? `${row.targetAsset.kind}:${row.targetAsset.id}` : '', row.targetSegmentId ? '' : row.targetLabel, row.operationalStatus, delta].join('|');
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const result: SegmentContinuationGroup[] = [];
  for (const [key, rows] of groups) {
    rows.sort((a, b) => a.sourceFiber - b.sourceFiber);
    let run: typeof rows = [];
    const flush = () => {
      if (!run.length) return;
      const first = run[0], last = run.at(-1)!;
      const targetFibers = run.map(item => item.targetFiber).filter((number): number is number => number != null);
      const targetLabel = first.targetSegmentId && targetFibers.length
        ? `C${findCable(data, first.targetSegmentId)?.legacyCableId ?? first.targetSegmentId} / ${rangeLabel(Math.min(...targetFibers), Math.max(...targetFibers))}`
        : first.targetLabel;
      const count = (status: OperationalStatus) => run.filter(item => item.operationalStatus === status).length;
      const status = first.operationalStatus;
      result.push({
        id: `ACTIVE-${first.node.kind}-${first.node.id}-${cable.id}-${first.sourceFiber}-${last.sourceFiber}-${first.targetSegmentId ?? first.targetLabel}`,
        continuationId: run.map(item => item.transitionId).join(','), node: first.node, direction: first.direction,
        sourceSegmentId: cable.id, sourceStart: first.sourceFiber, sourceEnd: last.sourceFiber,
        targetSegmentId: first.targetSegmentId, targetAsset: first.targetAsset, targetLabel,
        targetStart: targetFibers.length ? Math.min(...targetFibers) : null, targetEnd: targetFibers.length ? Math.max(...targetFibers) : null,
        operationalStatus: status, reviewState: status === 'authoritative' ? 'reviewed_no_change' : status === 'conflicting' ? 'disputed' : 'needs_review',
        authoritativeCount: count('authoritative'), candidateCount: count('candidate'), conflictingCount: count('conflicting'), unresolvedCount: count('unresolved'), totalCount: run.length,
        mappingMode: !first.targetSegmentId ? 'explicit' : new Set(run.map(item => item.sourceFiber === item.targetFiber)).size === 1 && first.sourceFiber === first.targetFiber ? 'same_number' : 'offset',
        memberMappings: run.map(item => ({ sourceFiberNumber: item.sourceFiber, targetFiberNumber: item.targetFiber, operationalStatus: item.operationalStatus })),
        warnings: [`Derived from active NodeFiberTransition records: ${run.map(item => item.transitionId).join(', ')}.`],
      });
      run = [];
    };
    for (const row of rows) {
      const previous = run.at(-1);
      const contiguous = !previous || (row.sourceFiber === previous.sourceFiber + 1 && (row.targetFiber == null || previous.targetFiber == null || row.targetFiber === previous.targetFiber + 1));
      if (!contiguous) flush();
      run.push(row);
    }
    flush();
  }
  return result;
}

export function constructionTubeViews(data: Inventory, segmentId: string): ConstructionTubeView[] {
  return data.tubes.filter(item => item.cableId === segmentId).map(tube => {
    const fibers = data.fibers.filter(item => item.cableId === segmentId && item.tubeId === tube.id).sort((a, b) => a.number - b.number);
    return {
      tube,
      displayNumber: tube.number ?? tube.proposedNumber ?? 0,
      state: tube.basis === 'documented' ? 'documented' as const : 'proposed' as const,
      fiberStart: fibers[0]?.number ?? 0,
      fiberEnd: fibers.at(-1)?.number ?? 0,
      tubeColor: tube.basis === 'documented' ? tube.physicalColor : null,
      fibers: fibers.map(fiber => ({
        fiber,
        displayColor: fiber.physicalColor.basis === 'documented' ? fiber.physicalColor : fiber.proposedColor?.basis === 'proposed_standard' ? fiber.proposedColor : null,
        colorState: fiber.physicalColor.basis === 'documented' ? 'documented' as const : fiber.proposedColor?.basis === 'proposed_standard' ? 'proposed' as const : 'unknown' as const,
      })),
    };
  }).sort((a, b) => a.displayNumber - b.displayNumber);
}

export function tubeContinuationSummary(data: Inventory, routeId: string, segmentId: string, tubeNumber: number): TubeContinuationSummary | null {
  const tube = constructionTubeViews(data, segmentId).find(item => item.displayNumber === tubeNumber);
  if (!tube) return null;
  const allGroups = segmentContinuationGroups(data, routeId, segmentId);
  const downstream = allGroups.filter(item => item.direction === 'downstream');
  const relevant = (downstream.length ? downstream : allGroups).filter(item => item.sourceEnd >= tube.fiberStart && item.sourceStart <= tube.fiberEnd).map(item => {
    const sourceStart = Math.max(item.sourceStart, tube.fiberStart), sourceEnd = Math.min(item.sourceEnd, tube.fiberEnd);
    const memberMappings = item.memberMappings.filter(mapping => mapping.sourceFiberNumber >= sourceStart && mapping.sourceFiberNumber <= sourceEnd);
    const targets = memberMappings.map(mapping => mapping.targetFiberNumber).filter((number): number is number => number != null);
    const targetStart = targets.length ? Math.min(...targets) : item.targetStart;
    const targetEnd = targets.length ? Math.max(...targets) : item.targetEnd;
    const targetCable = item.targetSegmentId ? findCable(data, item.targetSegmentId) : undefined;
    return {
      ...item,
      sourceStart,
      sourceEnd,
      targetStart,
      targetEnd,
      targetLabel: targetCable && targetStart != null && targetEnd != null
        ? `C${targetCable.legacyCableId} / ${rangeLabel(targetStart, targetEnd)}`
        : item.targetLabel,
      authoritativeCount: memberMappings.filter(mapping => mapping.operationalStatus === 'authoritative').length,
      candidateCount: memberMappings.filter(mapping => mapping.operationalStatus === 'candidate').length,
      conflictingCount: memberMappings.filter(mapping => mapping.operationalStatus === 'conflicting').length,
      unresolvedCount: memberMappings.filter(mapping => mapping.operationalStatus === 'unresolved').length,
      totalCount: sourceEnd - sourceStart + 1,
      memberMappings,
    };
  });
  const unresolvedMembers = tube.fibers.map(item => item.fiber.number).filter(number => relevant.some(group => number >= group.sourceStart && number <= group.sourceEnd && group.operationalStatus === 'unresolved'));
  const mapped = relevant.filter(item => item.operationalStatus !== 'unresolved');
  const destinations = new Set(mapped.map(item => item.targetSegmentId ?? (item.targetAsset ? `${item.targetAsset.kind}:${item.targetAsset.id}` : item.targetLabel)));
  const state: TubeContinuationSummary['state'] = !mapped.length ? 'unresolved'
    : unresolvedMembers.length ? 'partial'
      : destinations.size > 1 ? 'split'
        : mapped.every(item => item.operationalStatus === 'authoritative') && mapped.reduce((sum, item) => sum + item.totalCount, 0) >= tube.fibers.length ? 'established_together'
          : 'candidate_single';
  return { tube, direction: downstream.length ? 'downstream' : relevant[0]?.direction ?? 'unresolved', state, groups: relevant, unresolvedMembers };
}

function exactFromContinuation(data: Inventory, routeId: string, segmentId: string, fiberNumber: number, continuation: CableContinuation): ExactFiberContinuation | null {
  const a = sideSegment(continuation.sideA), z = sideSegment(continuation.sideZ);
  const selected = a?.segmentId === segmentId ? a : z?.segmentId === segmentId ? z : null;
  if (!selected || fiberNumber < selected.fiberRange.startFiberNumber || fiberNumber > selected.fiberRange.endFiberNumber) return null;
  const other: CableContinuationSide = selected === a ? continuation.sideZ : continuation.sideA;
  const reversed = selected === z;
  const mapping = continuation.individualMappings.find(item => reversed ? item.targetFiberNumber === fiberNumber : item.sourceFiberNumber === fiberNumber);
  const targetFiber = mapping ? (reversed ? mapping.sourceFiberNumber : mapping.targetFiberNumber) : null;
  return {
    continuationId: continuation.id,
    direction: directionAtNode(segmentOrientation(data, routeId, segmentId), continuation.node),
    node: continuation.node,
    sourceSegmentId: segmentId,
    sourceFiberNumber: fiberNumber,
    targetSegmentId: other.kind === 'segment' ? other.segmentId : null,
    targetFiberNumber: other.kind === 'segment' ? targetFiber : null,
    targetAsset: other.kind === 'asset' ? other.asset : null,
    targetLabel: other.kind === 'segment' ? `C${findCable(data, other.segmentId)?.legacyCableId} / F${String(targetFiber ?? 0).padStart(2, '0')}` : other.kind === 'asset' ? assetLabel(other.asset) : other.label,
    operationalStatus: mapping?.operationalStatus ?? continuation.operationalStatus,
  };
}

export function exactFiberContinuations(data: Inventory, routeId: string, segmentId: string, fiberNumber: number): ExactFiberContinuation[] {
  const persisted = (data.cableContinuations ?? []).map(item => exactFromContinuation(data, routeId, segmentId, fiberNumber, item)).filter((item): item is ExactFiberContinuation => !!item);
  const groups = segmentContinuationGroups(data, routeId, segmentId);
  const represented = new Set(persisted.map(item => `${item.direction}:${item.node.kind}:${item.node.id}`));
  for (const group of groups.filter(item => fiberNumber >= item.sourceStart && fiberNumber <= item.sourceEnd && !represented.has(`${item.direction}:${item.node.kind}:${item.node.id}`))) {
    persisted.push({ continuationId: group.continuationId, direction: group.direction, node: group.node, sourceSegmentId: segmentId, sourceFiberNumber: fiberNumber, targetSegmentId: null, targetFiberNumber: null, targetAsset: null, targetLabel: group.targetLabel, operationalStatus: group.operationalStatus });
  }
  return persisted.sort((a, b) => ({ upstream: 0, downstream: 1, at_endpoint: 2, unresolved: 3 })[a.direction] - ({ upstream: 0, downstream: 1, at_endpoint: 2, unresolved: 3 })[b.direction]);
}

export function cableContinuityPath(data: Inventory, routeId: string, segmentId: string, fiberNumber: number, direction: 'upstream' | 'downstream', mode: ContinuityMode): CableContinuityPath {
  const steps: CableContinuityPathStep[] = [];
  const visited = new Set<string>();
  let currentSegmentId = segmentId, currentFiber = fiberNumber;
  let stopReason = 'No established mapping.';
  let sawCandidate = false, sawAuthoritative = false, sawConflict = false, reachedEndpoint = false;
  for (let index = 0; index < 24; index += 1) {
    const cable = findCable(data, currentSegmentId);
    if (!cable) { stopReason = 'Segment record missing.'; break; }
    const key = `${currentSegmentId}:${currentFiber}:${direction}`;
    if (visited.has(key)) { stopReason = 'Continuity cycle detected.'; sawConflict = true; break; }
    visited.add(key);
    steps.push({ kind: 'segment', label: `C${cable.legacyCableId} / F${String(currentFiber).padStart(2, '0')}`, segmentId: currentSegmentId, fiberNumber: currentFiber, operationalStatus: 'authoritative' });
    const options = exactFiberContinuations(data, routeId, currentSegmentId, currentFiber).filter(item => item.direction === direction);
    const eligible = options.filter(item => item.operationalStatus === 'authoritative' || (mode === 'candidate' && item.operationalStatus === 'candidate'));
    if (!eligible.length) {
      const blockedCandidate = options.some(item => item.operationalStatus === 'candidate');
      stopReason = blockedCandidate && mode === 'strict' ? 'Candidate continuation excluded from Strict continuity.' : options[0]?.targetLabel ?? 'No established mapping.';
      steps.push({ kind: 'stop', label: stopReason, operationalStatus: blockedCandidate ? 'candidate' : 'unresolved' });
      break;
    }
    if (eligible.length > 1) { stopReason = 'Several eligible continuations require a route-specific decision.'; sawConflict = true; steps.push({ kind: 'stop', label: stopReason, operationalStatus: 'conflicting' }); break; }
    const next = eligible[0];
    sawCandidate ||= next.operationalStatus === 'candidate';
    sawAuthoritative ||= next.operationalStatus === 'authoritative';
    sawConflict ||= next.operationalStatus === 'conflicting';
    steps.push({ kind: 'node', label: assetLabel(next.node), asset: next.node, operationalStatus: next.operationalStatus });
    if (next.targetAsset) {
      reachedEndpoint = true;
      stopReason = `Known endpoint: ${assetLabel(next.targetAsset)}.`;
      steps.push({ kind: 'asset', label: assetLabel(next.targetAsset), asset: next.targetAsset, operationalStatus: next.operationalStatus });
      break;
    }
    if (!next.targetSegmentId || next.targetFiberNumber == null) { stopReason = next.targetLabel; steps.push({ kind: 'stop', label: stopReason, operationalStatus: next.operationalStatus }); break; }
    currentSegmentId = next.targetSegmentId;
    currentFiber = next.targetFiberNumber;
  }
  const status: CableContinuityPathStatus = sawConflict ? 'conflict' : sawCandidate ? 'candidate' : reachedEndpoint && sawAuthoritative ? 'authoritative' : sawAuthoritative ? 'partial_authoritative' : 'unresolved';
  return { id: `PATH-${mode}-${direction}-${segmentId}-${fiberNumber}`, mode, direction, status, steps, stopReason };
}

export function closureContinuationGroups(data: Inventory, routeId: string, closureId: string): SegmentContinuationGroup[] {
  const segmentIds = new Set((data.cableContinuations ?? []).filter(item => item.node.kind === 'closure' && item.node.id === closureId).flatMap(item => [sideSegment(item.sideA)?.segmentId, sideSegment(item.sideZ)?.segmentId].filter((id): id is string => !!id)));
  return [...segmentIds].flatMap(segmentId => segmentContinuationGroups(data, routeId, segmentId).filter(item => item.node.kind === 'closure' && item.node.id === closureId));
}

export function closureContinuationForks(data: Inventory, closureId: string): ClosureContinuationFork[] {
  return (data.cableContinuations ?? []).filter(item => item.node.kind === 'closure' && item.node.id === closureId).map(item => {
    const source = sideSegment(item.sideA);
    const target = item.sideZ;
    if (!source) return null;
    const authoritativeCount = item.individualMappings.filter(mapping => mapping.operationalStatus === 'authoritative').length;
    const candidateCount = item.individualMappings.filter(mapping => mapping.operationalStatus === 'candidate').length;
    const unresolvedCount = item.individualMappings.filter(mapping => mapping.operationalStatus === 'unresolved').length;
    return {
      id: item.id,
      sourceSegmentId: source.segmentId,
      sourceLabel: `C${findCable(data, source.segmentId)?.legacyCableId ?? source.segmentId}`,
      sourceStart: source.fiberRange.startFiberNumber,
      sourceEnd: source.fiberRange.endFiberNumber,
      targetSegmentId: target.kind === 'segment' ? target.segmentId : null,
      targetLabel: target.kind === 'segment'
        ? `C${findCable(data, target.segmentId)?.legacyCableId ?? target.segmentId} / ${rangeLabel(target.fiberRange.startFiberNumber, target.fiberRange.endFiberNumber)}`
        : target.kind === 'asset' ? assetLabel(target.asset) : target.label,
      operationalStatus: item.operationalStatus,
      authoritativeCount,
      candidateCount,
      unresolvedCount,
      warnings: item.warnings,
    };
  }).filter((item): item is ClosureContinuationFork => !!item);
}

export function validateCableContinuations(data: Inventory): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const continuation of data.cableContinuations ?? []) {
    if (ids.has(continuation.id)) errors.push(`Duplicate CableContinuation: ${continuation.id}`);
    ids.add(continuation.id);
    if (!continuation.node || !['closure', 'ap', 'odf', 'aggregation', 'site', 'boundary'].includes(continuation.node.kind)) errors.push(`Invalid CableContinuation node: ${continuation.id}`);
    const segmentSides = [continuation.sideA, continuation.sideZ].filter((side): side is CableContinuationSegmentSide => side.kind === 'segment');
    for (const side of segmentSides) {
      const cable = findCable(data, side.segmentId);
      if (!cable || side.fiberRange.startFiberNumber < 1 || side.fiberRange.endFiberNumber > (cable?.fiberCount ?? 0) || side.fiberRange.startFiberNumber > side.fiberRange.endFiberNumber) errors.push(`Invalid CableContinuation range: ${continuation.id}`);
      if (side.tubeId && !data.tubes.some(item => item.id === side.tubeId && item.cableId === side.segmentId && item.basis === 'documented')) errors.push(`Unsupported Tube reference: ${continuation.id}`);
    }
    for (const connectionId of continuation.sourceConnectionIds) if (!data.connections.some(item => item.id === connectionId)) errors.push(`Missing CableContinuation connection: ${continuation.id}/${connectionId}`);
    if (continuation.sideZ.kind === 'unresolved' && continuation.operationalStatus !== 'unresolved') errors.push(`Unresolved continuation promoted: ${continuation.id}`);
    if (continuation.operationalStatus === 'authoritative' && continuation.individualMappings.some(item => item.operationalStatus !== 'authoritative')) errors.push(`Flattened mixed review state: ${continuation.id}`);
    if (continuation.mappingMode !== 'unresolved' && !continuation.individualMappings.length) errors.push(`Empty CableContinuation mapping: ${continuation.id}`);
  }
  return errors;
}
