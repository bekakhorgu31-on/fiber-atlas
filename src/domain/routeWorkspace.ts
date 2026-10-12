import { cableRoutesForAsset, cableRoutesForSegment, orderedCableRouteLegs, orderedCableRouteNodes } from './cableRoutes';
import { findCable, getSegmentDisplayName } from './network';
import type { AssetRef, CableRoute, Inventory, Route } from './types';

export type WorkspaceSelection =
  | { type: 'route'; id: string }
  | { type: 'aggregation' | 'closure' | 'segment' | 'ap' | 'odf' | 'branch' | 'boundary' | 'network_node'; id: string }
  | { type: 'tube'; cableId: string; number: number }
  | { type: 'fiber'; cableId: string; number: number }
  | { type: 'port'; ownerType: 'odf' | 'ap'; ownerId: string; number: number };

export interface WorkspaceSearchResult {
  key: string;
  label: string;
  detail: string;
  typeLabel: string;
}

const sameAsset = (a: AssetRef | null | undefined, b: AssetRef | null | undefined) => !!a && !!b && a.kind === b.kind && a.id === b.id;

export function workspaceSelectionKey(selection: WorkspaceSelection): string {
  if (selection.type === 'fiber') return `fiber:${selection.cableId}:${selection.number}`;
  if (selection.type === 'tube') return `tube:${selection.cableId}:${selection.number}`;
  if (selection.type === 'port') return `port:${selection.ownerType}:${selection.ownerId}:${selection.number}`;
  return `${selection.type}:${selection.id}`;
}

export function parseWorkspaceSelection(value: string | null | undefined): WorkspaceSelection | null {
  if (!value) return null;
  const [type, a, b, c] = value.split(':');
  if (type === 'fiber' && a && /^\d+$/.test(b ?? '') && !c) return { type, cableId: a, number: Number(b) };
  if (type === 'tube' && a && /^\d+$/.test(b ?? '') && !c) return { type, cableId: a, number: Number(b) };
  if (type === 'port' && (a === 'odf' || a === 'ap') && b && /^\d+$/.test(c ?? '')) return { type, ownerType: a, ownerId: b, number: Number(c) };
  if (['route', 'aggregation', 'closure', 'segment', 'ap', 'odf', 'branch', 'boundary', 'network_node'].includes(type) && a && !b) return { type: type as Exclude<WorkspaceSelection, { type: 'fiber' } | { type: 'tube' } | { type: 'port' }>['type'], id: a };
  return null;
}

export function routeWithSelection(routeId: string, selection?: WorkspaceSelection | null, collapsed?: string[]): Extract<Route, { view: 'route' }> {
  return { view: 'route', id: routeId, ...(selection ? { selection: workspaceSelectionKey(selection) } : {}), ...(collapsed?.length ? { collapsed: [...new Set(collapsed)].sort() } : {}) };
}

export function parentWorkspaceRoute(data: Inventory, route: CableRoute): CableRoute {
  if (route.origin.state !== 'known') return route;
  const originAsset = route.origin.asset;
  return (data.cableRoutes ?? []).find(candidate => candidate.id !== route.id && candidate.nodes.some(node => sameAsset(node.asset, originAsset))) ?? route;
}

export function relatedWorkspaceRoutes(data: Inventory, route: CableRoute): CableRoute[] {
  const root = parentWorkspaceRoute(data, route);
  const result = [root];
  const seen = new Set([root.id]);
  for (let index = 0; index < result.length; index += 1) {
    const current = result[index];
    for (const candidate of data.cableRoutes ?? []) {
      if (seen.has(candidate.id) || candidate.origin.state !== 'known') continue;
      const originAsset = candidate.origin.asset;
      if (current.nodes.some(node => sameAsset(node.asset, originAsset))) {
        seen.add(candidate.id);
        result.push(candidate);
      }
    }
  }
  return result;
}

function routeForAsset(data: Inventory, asset: AssetRef): CableRoute | undefined {
  const direct = cableRoutesForAsset(data, asset)[0];
  if (direct) return parentWorkspaceRoute(data, direct);
  if (asset.kind === 'aggregation') return (data.cableRoutes ?? []).find(route => route.origin.state === 'known' && sameAsset(route.origin.asset, asset));
  return undefined;
}

export function workspaceNavigationTarget(data: Inventory, target: Route): Route | null {
  if (target.view === 'route') return target;
  let route: CableRoute | undefined;
  let selection: WorkspaceSelection | null = null;
  if (target.view === 'cable') {
    const cable = findCable(data, target.id);
    route = cable ? cableRoutesForSegment(data, cable.id)[0] ?? (data.cableRoutes ?? [])[0] : undefined;
    if (cable) selection = { type: 'segment', id: cable.id };
  } else if (target.view === 'closure') {
    route = routeForAsset(data, { kind: 'closure', id: target.id }); selection = { type: 'closure', id: target.id };
  } else if (target.view === 'ap') {
    route = routeForAsset(data, { kind: 'ap', id: target.id }); selection = { type: 'ap', id: target.id };
  } else if (target.view === 'aggregation') {
    route = routeForAsset(data, { kind: 'aggregation', id: target.id }); selection = { type: 'aggregation', id: target.id };
  } else if (target.view === 'fiber') {
    const cable = findCable(data, target.cableId);
    route = cable ? cableRoutesForSegment(data, cable.id)[0] ?? (data.cableRoutes ?? [])[0] : undefined;
    if (cable) selection = { type: 'fiber', cableId: cable.id, number: target.fiber };
  } else if (target.view === 'odf_port') {
    const odf = (data.odfs ?? []).find(item => item.id === target.odfId);
    route = odf ? routeForAsset(data, odf.containedBy) : undefined;
    selection = { type: 'port', ownerType: 'odf', ownerId: target.odfId, number: target.port };
  }
  return route && selection ? routeWithSelection(parentWorkspaceRoute(data, route).id, selection) : null;
}

function destinationLabel(destination: NonNullable<Inventory['portRangeAssignments']>[number]['destination']) {
  return destination.type === 'named_direction' ? destination.name : destination.label;
}

export function routeScopedSearch(data: Inventory, route: CableRoute, query: string, currentSegmentId?: string): WorkspaceSearchResult[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [];
  const routes = relatedWorkspaceRoutes(data, route);
  const results: WorkspaceSearchResult[] = [];
  const add = (selection: WorkspaceSelection, label: string, detail: string, typeLabel: string, terms: string[]) => {
    if (terms.some(term => term.toLocaleLowerCase().includes(q))) results.push({ key: workspaceSelectionKey(selection), label, detail, typeLabel });
  };
  const segmentIds = new Set<string>();
  const assets = new Map<string, AssetRef>();
  for (const item of routes) {
    for (const leg of orderedCableRouteLegs(item)) {
      if (leg.segmentId) segmentIds.add(leg.segmentId);
      else {
        const legacy = leg.sourceLabel?.split('-')[0];
        const cable = legacy ? findCable(data, legacy) : undefined;
        if (cable) segmentIds.add(cable.id);
      }
    }
    for (const branch of item.branches) {
      branch.segmentIds.forEach(id => segmentIds.add(id));
      if (branch.destination) assets.set(`${branch.destination.kind}:${branch.destination.id}`, branch.destination);
      const branchLabel = branch.targetDirectionText ?? branch.sourceLabel ?? branch.id;
      add({ type: 'branch', id: branch.id }, branchLabel, `Branch from ${branch.fromNodeId}`, 'Branch', [branchLabel, branch.id]);
    }
    for (const node of orderedCableRouteNodes(item)) if (node.asset) assets.set(`${node.asset.kind}:${node.asset.id}`, node.asset);
  }
  for (const cable of data.cables) segmentIds.add(cable.id);
  for (const node of data.networkNodes ?? []) assets.set(`network_node:${node.id}`, { kind: 'network_node', id: node.id });
  for (const id of segmentIds) {
    const cable = findCable(data, id);
    if (!cable) continue;
    add({ type: 'segment', id: cable.id }, getSegmentDisplayName(cable, data), `Legacy C${cable.legacyCableId}`, 'Cable Segment', [cable.id, `C${cable.legacyCableId}`, cable.legacyCableId, ...cable.legacyLabels, getSegmentDisplayName(cable, data)]);
  }
  for (const asset of assets.values()) {
    if (asset.kind === 'closure') add({ type: 'closure', id: asset.id }, `SC${asset.id}`, 'Closure on route', 'Closure', [asset.id, `SC${asset.id}`]);
    if (asset.kind === 'ap') {
      const ap = data.accessPoints.find(item => item.id === asset.id);
      add({ type: 'ap', id: asset.id }, `AP${asset.id} · ${ap?.name ?? ''}`, `${ap?.portCount ?? 0} ports`, 'Access Point', [asset.id, `AP${asset.id}`, ap?.name ?? '', ...(ap?.aliases ?? [])]);
    }
    if (asset.kind === 'aggregation') {
      const agg = data.aggregations.find(item => item.id === asset.id);
      add({ type: 'aggregation', id: asset.id }, `AGG${asset.id} · ${agg?.name ?? ''}`, `${agg?.portCount ?? 'Unknown'} ports`, 'Aggregation', [asset.id, `AGG${asset.id}`, agg?.name ?? '']);
    }
    if (asset.kind === 'boundary') add({ type: 'boundary', id: asset.id }, data.externalBoundaries?.find(item => item.id === asset.id)?.directionLabel ?? asset.id, 'Documentation boundary', 'Boundary', [asset.id]);
    if (asset.kind === 'network_node') {
      const node = data.networkNodes?.find(item => item.id === asset.id);
      const isClosure = node?.assetType === 'closure';
      const isAP = node?.assetType === 'ap' && !!node.apEvidence;
      const externalAliases = (node?.externalReferences ?? []).flatMap(reference => [reference.externalId, reference.rawText ?? '', `${reference.system}-${reference.externalId}`, `GIS-${reference.externalId}`, `GIS ${reference.externalId}`]);
      add({ type: 'network_node', id: asset.id }, isClosure ? `${node!.displayName} · Closure` : node?.displayName ?? `Node ${asset.id}`, isClosure ? 'ქურო · source-symbol certified' : isAP?`${node.apEvidence!.place} · ${node.apEvidence!.capacity} Ports`:'Neutral source endpoint · type unknown', isClosure ? 'Closure' : isAP?'AP':'Node', [asset.id, `Node ${asset.id}`, `${isAP?'AP':'SC'}${asset.id}`, node?.displayName ?? '',node?.apEvidence?.place??'', ...(node?.sourceEndpointTokens ?? []), ...externalAliases]);
    }
  }
  for (const aggregation of data.aggregations.filter(item => item.contextOnly)) add({ type: 'aggregation', id: aggregation.id }, aggregation.name, aggregation.verification === 'conflicting' ? 'Conflicting aggregation context' : 'Aggregation context', 'Aggregation', [aggregation.id, aggregation.name, 'Lentekhi', 'AGG6', 'property ID5']);
  for (const boundary of data.externalBoundaries ?? []) add({ type: 'boundary', id: boundary.id }, boundary.directionLabel, boundary.status === 'conflicting' ? 'Conflicting documentation boundary' : 'Continues in another network document', 'External boundary', [boundary.id, boundary.directionLabel, boundary.likelyContinuationName ?? '', boundary.externalDirectionKey ?? '']);
  const odfs = (data.odfs ?? []).filter(odf => odf.containedBy.kind === 'aggregation' && assets.has(`aggregation:${odf.containedBy.id}`));
  for (const odf of odfs) add({ type: 'odf', id: odf.id }, odf.displayLabel, `${odf.portCapacity ?? 'Unknown'} ports`, 'ODF', [odf.id, odf.displayLabel]);
  const compoundFiber = q.match(/(?:c(?:able)?\s*)?(\d+)\s*(?:\/|\s+)\s*f(?:iber)?\s*0*(\d+)/i);
  if (compoundFiber) {
    const [, legacyId, numberText] = compoundFiber, number = Number(numberText);
    for (const cable of data.cables.filter(item => item.legacyCableId === legacyId && number >= 1 && number <= item.fiberCount)) add({ type: 'fiber', cableId: cable.id, number }, `${getSegmentDisplayName(cable, data)} / F${String(number).padStart(2,'0')}`, `Legacy C${cable.legacyCableId}`, 'Fiber', [cable.id, cable.legacyCableId]);
  }
  if (/^(?:port\s*)?\d+$/i.test(q)) {
    const number = Number(q.replace(/\D/g, ''));
    for (const odf of odfs) {
      const port = (data.odfPorts ?? []).find(item => item.odfId === odf.id && item.number === number);
      if (!port) continue;
      const range = (data.portRangeAssignments ?? []).find(item => item.odfId === odf.id && number >= item.startPort && number <= item.endPort);
      results.unshift({ key: workspaceSelectionKey({ type: 'port', ownerType: 'odf', ownerId: odf.id, number }), label: `${odf.id} / Port ${number}`, detail: range ? destinationLabel(range.destination) : 'Assignment unresolved', typeLabel: 'ODF Port' });
    }
    for (const asset of assets.values()) {
      if (asset.kind !== 'ap') continue;
      const ap = data.accessPoints.find(item => item.id === asset.id);
      const flow = data.apPortFlows?.find(item => item.accessPointId === asset.id && item.portNumber === number);
      if (!ap || !flow) continue;
      const segment = findCable(data, flow.incoming?.segmentId ?? '');
      results.unshift({ key: workspaceSelectionKey({ type: 'port', ownerType: 'ap', ownerId: asset.id, number }), label: `AP${asset.id} / Port ${number}`, detail: `${segment ? getSegmentDisplayName(segment, data) : 'მონაკვეთი დაუდგენელია'} / F${String(flow.incoming?.fiberNumber ?? number).padStart(2, '0')} · ${flow.primaryRole}`, typeLabel: 'AP Port' });
    }
  }
  const fiberMatch = q.match(/^f(?:iber\s*)?0*(\d+)$/i);
  if (fiberMatch) {
    const number = Number(fiberMatch[1]);
    const ordered = [...segmentIds].sort((a, b) => a === currentSegmentId ? -1 : b === currentSegmentId ? 1 : 0);
    for (const id of ordered) {
      const cable = findCable(data, id);
      if (!cable || number < 1 || number > cable.fiberCount) continue;
      results.push({ key: workspaceSelectionKey({ type: 'fiber', cableId: cable.id, number }), label: `${getSegmentDisplayName(cable, data)} / F${String(number).padStart(2, '0')}`, detail: `Legacy C${cable.legacyCableId}`, typeLabel: 'Fiber' });
    }
  }
  return [...new Map(results.map(item => [item.key, item])).values()].slice(0, 24);
}

export function routeInventoryCounts(data: Inventory, route: CableRoute) {
  const routes = relatedWorkspaceRoutes(data, route);
  const segmentIds = new Set(routes.flatMap(item => [...item.legs.flatMap(leg => {
    if (leg.segmentId) return [leg.segmentId];
    const legacy = leg.sourceLabel?.split('-')[0];
    const cable = legacy ? findCable(data, legacy) : undefined;
    return cable ? [cable.id] : [];
  }), ...item.branches.flatMap(branch => branch.segmentIds)]));
  const closureIds = new Set(routes.flatMap(item => item.nodes.flatMap(node => node.asset?.kind === 'closure' ? [node.asset.id] : [])));
  const apIds = new Set(routes.flatMap(item => item.branches.flatMap(branch => branch.destination?.kind === 'ap' ? [branch.destination.id] : [])));
  const aggregationIds = new Set([...routes.flatMap(item => [
    ...(item.origin.state === 'known' && item.origin.asset.kind === 'aggregation' ? [item.origin.asset.id] : []),
    ...(item.destination.state === 'known' && item.destination.asset.kind === 'aggregation' ? [item.destination.asset.id] : []),
  ]), ...data.aggregations.filter(item => item.contextOnly).map(item => item.id)]);
  const unresolved = routes.reduce((count, item) => count + (item.destination.state === 'unresolved' ? 1 : 0) + item.branches.filter(branch => branch.verification === 'needs_verification' || branch.destinationRole === 'external_direction').length, 0);
  return { routes, segmentIds, closureIds, apIds, aggregationIds, unresolved };
}
