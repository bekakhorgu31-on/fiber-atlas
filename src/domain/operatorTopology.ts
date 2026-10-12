import type { AssetRef, Cable, CableRoute, CableRouteBranch, Inventory, PhysicalCable } from './types';

export interface OperatorBranch {
  id: string;
  from: string;
  label: string;
  status: 'documented' | 'unresolved' | 'conflict';
  children: string[];
  segmentIds: string[];
  continuationKind?: 'external_document';
}

export interface SegmentOperatorSummary {
  source: string;
  localEndpoints: string;
  path: string[];
  selectedToken: string;
  finalRouteEndpoint: string;
  routeId: string | null;
  branches: OperatorBranch[];
  physicalCable: string;
  physicalCableEndpoint: string;
  routeContinuesAfterPhysicalCable: boolean;
  unresolved: string[];
}

export interface ClosureOperatorSummary {
  source: string;
  incoming: string[];
  mainContinuation: string | null;
  branches: OperatorBranch[];
  finalRouteEndpoint: string;
  routeId: string | null;
  unresolved: string[];
}

export interface AccessPointOperatorSummary {
  source: string;
  incomingSegment: string;
  upstreamClosure: string;
  path: string[];
  role: 'terminal' | 'interconnect_backfeed' | 'unresolved';
  portSummary: string;
  unresolved: string[];
  routeId: string | null;
}

const sameAsset = (a: AssetRef | null | undefined, b: AssetRef | null | undefined) => !!a && !!b && a.kind === b.kind && a.id === b.id;
const nodes = (route: CableRoute) => [...route.nodes].sort((a, b) => a.sequence - b.sequence);
const legs = (route: CableRoute) => [...route.legs].sort((a, b) => a.sequence - b.sequence);
const cableById = (data: Inventory, id: string | null | undefined) => id ? data.cables.find(item => item.id === id) : undefined;
const cableToken = (data: Inventory, id: string | null | undefined, fallback = 'უცნობი მონაკვეთი') => {
  const cable = cableById(data, id);
  return cable ? `C${cable.legacyCableId}` : fallback;
};
const assetLabel = (data: Inventory, asset: AssetRef | null | undefined) => {
  if (!asset) return 'უცნობი საზღვარი';
  if (asset.kind === 'closure') return `SC${asset.id}`;
  if (asset.kind === 'ap') {
    const ap = data.accessPoints.find(item => item.id === asset.id);
    return `AP${asset.id}${ap?.name ? ` · ${ap.name}` : ''}`;
  }
  if (asset.kind === 'aggregation') {
    const aggregation = data.aggregations.find(item => item.id === asset.id);
    return `AGG${asset.id}${aggregation?.name ? ` · ${aggregation.name}` : ''}`;
  }
  if (asset.kind === 'boundary') return data.externalBoundaries?.find(item => item.id === asset.id)?.directionLabel ?? asset.id;
  if (asset.kind === 'network_node') return data.networkNodes?.find(item => item.id === asset.id)?.displayName ?? `Node ${asset.id}`;
  return `${asset.kind.toUpperCase()}${asset.id}`;
};

function routeContainingSegment(data: Inventory, cable: Cable): { route: CableRoute; legIndex: number; branch?: CableRouteBranch } | null {
  for (const route of data.cableRoutes ?? []) {
    const legIndex = legs(route).findIndex(leg => leg.segmentId === cable.id || (!leg.segmentId && leg.sourceLabel?.startsWith(`${cable.legacyCableId}-`)));
    if (legIndex >= 0) return { route, legIndex };
    const branch = route.branches.find(item => item.segmentIds.includes(cable.id));
    if (branch) return { route, legIndex: -1, branch };
  }
  return null;
}

function parentRouteAtOrigin(data: Inventory, route: CableRoute): CableRoute | null {
  if (route.origin.state !== 'known') return null;
  const originAsset = route.origin.asset;
  return (data.cableRoutes ?? []).find(candidate => candidate.id !== route.id && candidate.nodes.some(node => sameAsset(node.asset, originAsset))) ?? null;
}

function routePrefix(data: Inventory, route: CableRoute, throughNodeId?: string): string[] {
  const ordered = nodes(route);
  const stop = throughNodeId ? ordered.findIndex(node => node.id === throughNodeId) : ordered.length - 1;
  const own = ordered.slice(0, Math.max(0, stop) + 1).map(node => node.label);
  const parent = parentRouteAtOrigin(data, route);
  if (!parent || route.origin.state !== 'known') return own;
  const originAsset = route.origin.asset;
  const parentNodes = nodes(parent);
  const parentStop = parentNodes.findIndex(node => sameAsset(node.asset, originAsset));
  return [...parentNodes.slice(0, parentStop + 1).map(node => node.label), ...own.slice(1)];
}

function routeEndLabel(route: CableRoute) {
  if (route.destination.state === 'known') return route.destination.label;
  return `${route.destination.label}${route.destination.candidateAssetLabel ? ` · ${route.destination.candidateAssetLabel}` : ''} · unresolved`;
}

function branchLabel(data: Inventory, branch: CableRouteBranch): OperatorBranch {
  const segment = branch.segmentIds[0] ? cableToken(data, branch.segmentIds[0]) : '';
  const direction = branch.targetDirectionText?.replace(' directiion', ' direction') || (branch.destination ? assetLabel(data, branch.destination) : branch.sourceLabel ?? 'უცნობი მიმართულება');
  const destination = branch.destination ? assetLabel(data, branch.destination) : direction;
  const unresolved = branch.destinationRole === 'external_direction' || branch.verification === 'needs_verification';
  return {
    id: branch.id,
    from: branch.fromNodeId,
    label: [direction, segment && branch.destination ? `${segment} → ${destination}` : ''].filter(Boolean).join(' · '),
    status: unresolved ? 'unresolved' : 'documented',
    children: [],
    segmentIds: [...branch.segmentIds],
    continuationKind: branch.destinationRole === 'external_direction' ? 'external_document' : undefined,
  };
}

function branchesAtNode(data: Inventory, route: CableRoute, nodeId: string): OperatorBranch[] {
  const direct = route.branches.filter(branch => branch.fromNodeId === nodeId).map(branch => branchLabel(data, branch));
  const named = direct.find(item => item.label.toLocaleLowerCase().includes('alpana'));
  const boundary = direct.find(item => item.label.includes('SC207'));
  let result = direct;
  if (named && boundary && named.id !== boundary.id) {
    result = direct.filter(item => item !== named && item !== boundary);
    result.unshift({ ...named, id: `${named.id}+${boundary.id}`, label: 'Alpana–Tvishi–Ambrolauri direction · C151 → SC207 boundary', status: 'unresolved', continuationKind: 'external_document' });
  }
  const node = nodes(route).find(item => item.id === nodeId);
  if (node?.asset) {
    for (const child of data.cableRoutes ?? []) {
      if (child.id === route.id || child.origin.state !== 'known' || !sameAsset(child.origin.asset, node.asset)) continue;
      const firstLeg = legs(child)[0];
      const children = child.branches.map(item => branchLabel(data, item).label);
      result.push({ id: `linked-${child.id}`, from: nodeId, label: `${cableToken(data, firstLeg?.segmentId)} → ${child.destination.label}`, status: 'documented', children, segmentIds: child.legs.flatMap(item => item.segmentId ? [item.segmentId] : []) });
    }
  }
  return result;
}

export function routeNodeOperatorBranches(data: Inventory, route: CableRoute, nodeId: string): OperatorBranch[] {
  return branchesAtNode(data, route, nodeId);
}

function physicalCableEnd(physicalCable: PhysicalCable | undefined) {
  if (!physicalCable) return 'Unresolved · containing PhysicalCable is not established';
  return physicalCable.endB.label;
}

export function segmentOperatorSummary(data: Inventory, cable: Cable): SegmentOperatorSummary {
  const match = routeContainingSegment(data, cable);
  const physicalCable = (data.physicalCables ?? []).find(item => item.id === cable.physicalCableId);
  const unresolved = ['Exact closure operation', 'Service state and fiber rights'];
  if (!physicalCable) unresolved.unshift('Containing PhysicalCable identity and endpoint');
  if (!match) return {
    source: 'Source direction unresolved', localEndpoints: `${assetLabel(data, cable.endpointA)} ↔ ${assetLabel(data, cable.endpointB)}`,
    path: [assetLabel(data, cable.endpointA), `C${cable.legacyCableId}`, assetLabel(data, cable.endpointB)], selectedToken: `C${cable.legacyCableId}`,
    finalRouteEndpoint: cable.endpointB.kind === 'boundary' ? `${assetLabel(data, cable.endpointB)} · unresolved` : assetLabel(data, cable.endpointB), routeId: null,
    branches: [], physicalCable: physicalCable?.displayLabel ?? 'Unresolved', physicalCableEndpoint: physicalCableEnd(physicalCable), routeContinuesAfterPhysicalCable: false, unresolved,
  };
  const { route, legIndex, branch } = match;
  const root = parentRouteAtOrigin(data, route) ?? route;
  let path: string[] = [];
  let branches: OperatorBranch[] = [];
  let finalRouteEndpoint = routeEndLabel(route);
  if (branch) {
    path = [...routePrefix(data, route, branch.fromNodeId), `C${cable.legacyCableId}`, branch.destination ? assetLabel(data, branch.destination) : branch.targetDirectionText ?? 'External direction'];
    branches = branchesAtNode(data, route, branch.fromNodeId);
    if (branch.destinationRole !== 'external_direction') branches = branches.filter(item => item.id !== branch.id);
    finalRouteEndpoint = branch.destination ? assetLabel(data, branch.destination) : `${branch.targetDirectionText ?? 'External direction'} · unresolved`;
  } else {
    const orderedNodes = nodes(route);
    const ownPath = orderedNodes.flatMap((node, index) => index === legIndex ? [node.label, `C${cable.legacyCableId}`] : [node.label]);
    const parentPrefix = routePrefix(data, route, orderedNodes[0]?.id).slice(0, -1);
    path = [...parentPrefix, ...ownPath];
    branches = [...branchesAtNode(data, route, orderedNodes[legIndex]?.id ?? ''), ...branchesAtNode(data, route, orderedNodes[legIndex + 1]?.id ?? '')];
  }
  let routeContinuesAfterPhysicalCable = false;
  if (physicalCable && route.id === physicalCable.routeId && physicalCable.endB.state === 'known') {
    const physicalEnd = physicalCable.endB.asset;
    routeContinuesAfterPhysicalCable = nodes(route).some((node, index) => sameAsset(node.asset, physicalEnd) && index < nodes(route).length - 1);
  }
  return {
    source: root.origin.label,
    localEndpoints: `${assetLabel(data, cable.endpointA)} ↔ ${assetLabel(data, cable.endpointB)}`,
    path, selectedToken: `C${cable.legacyCableId}`, finalRouteEndpoint, routeId: route.id, branches,
    physicalCable: physicalCable?.displayLabel ?? 'Unresolved · no proven parent cable',
    physicalCableEndpoint: physicalCableEnd(physicalCable), routeContinuesAfterPhysicalCable, unresolved,
  };
}

export function closureOperatorSummary(data: Inventory, closureId: string): ClosureOperatorSummary {
  const asset: AssetRef = { kind: 'closure', id: closureId };
  const related = (data.cableRoutes ?? []).filter(route => route.nodes.some(node => sameAsset(node.asset, asset)));
  const route = [...related].sort((a, b) => b.nodes.length - a.nodes.length)[0];
  if (!route) return { source: 'Source direction unresolved', incoming: [], mainContinuation: null, branches: [], finalRouteEndpoint: 'Unresolved', routeId: null, unresolved: ['Route role and continuation'] };
  const orderedNodes = nodes(route), orderedLegs = legs(route), index = orderedNodes.findIndex(node => sameAsset(node.asset, asset));
  const incoming = index > 0 ? [`${cableToken(data, orderedLegs[index - 1]?.segmentId, orderedLegs[index - 1]?.sourceLabel?.split('-')[0] ? `C${orderedLegs[index - 1].sourceLabel!.split('-')[0]}` : 'უცნობი მონაკვეთი')} ← ${orderedNodes[index - 1].label}`] : [];
  const nextLeg = orderedLegs[index];
  const nextNode = orderedNodes[index + 1];
  const mainContinuation = nextLeg && nextNode ? `${cableToken(data, nextLeg.segmentId, nextLeg.sourceLabel?.split('-')[0] ? `C${nextLeg.sourceLabel!.split('-')[0]}` : 'Unresolved segment')} → ${nextNode.label}` : null;
  return {
    source: (parentRouteAtOrigin(data, route) ?? route).origin.label,
    incoming,
    mainContinuation,
    branches: branchesAtNode(data, route, orderedNodes[index].id),
    finalRouteEndpoint: routeEndLabel(parentRouteAtOrigin(data, route) ?? route),
    routeId: route.id,
    unresolved: ['Exact closure treatment', 'Tray/splice/pass-through detail'],
  };
}

export function accessPointOperatorSummary(data: Inventory, apId: string): AccessPointOperatorSummary {
  const ap = data.accessPoints.find(item => item.id === apId);
  const cable = data.cables.find(item => sameAsset(item.endpointA, { kind: 'ap', id: apId }) || sameAsset(item.endpointB, { kind: 'ap', id: apId }));
  if (!cable || !ap) return { source: 'Source direction unresolved', incomingSegment: 'Unresolved', upstreamClosure: 'Unresolved', path: [], role: 'unresolved', portSummary: 'Port information unresolved', unresolved: ['Incoming topology'], routeId: null };
  const remote = sameAsset(cable.endpointA, { kind: 'ap', id: apId }) ? cable.endpointB : cable.endpointA;
  const segment = segmentOperatorSummary(data, cable);
  const path = segment.path.length ? segment.path : [segment.source, assetLabel(data, remote), `C${cable.legacyCableId}`, `AP${apId}`];
  return {
    source: segment.source,
    incomingSegment: `C${cable.legacyCableId} · ${assetLabel(data, cable.endpointA)} ↔ ${assetLabel(data, cable.endpointB)}`,
    upstreamClosure: assetLabel(data, remote),
    path,
    role: apId === '41' ? 'interconnect_backfeed' : 'terminal',
    portSummary: `${ap.portCount} documented ports`,
    unresolved: apId === '41' ? ['Internal ingress-to-egress mapping'] : ['Exact AP/ODF containment', 'Exact fiber-to-port termination'],
    routeId: segment.routeId,
  };
}
