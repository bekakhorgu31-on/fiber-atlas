import primaryRouteEvidenceJson from '../data/primary-route-evidence.json';
import type { AssetRef, CableRoute, CableRouteEndpoint, CableRouteLeg, CableRouteNode, Inventory, RouteCondition } from './types';

type PrimaryRouteEvidence = {
  schemaVersion: number;
  sourceSha256: string;
  interpretationRule: string;
  review: { reviewer: string; reviewedAt: string };
  route: CableRoute;
};

export const primaryRouteEvidence = primaryRouteEvidenceJson as unknown as PrimaryRouteEvidence;

export const routeConditionLabels: Record<RouteCondition, string> = {
  serviceable: 'გამართული', damaged: 'დაზიანებული', broken: 'გაწყვეტილი', suspect: 'საეჭვო', unknown: 'უცნობია',
};

export const routeTreatmentLabels = {
  through: 'ტრანზიტი',
  cable_cut: 'კაბელი გაჭრილია',
  mid_span_access: 'შუალედური წვდომა',
  termination: 'ტერმინაცია',
  branch_point: 'განშტოების წერტილი',
  drop_to_ap: 'AP-მდე განშტოება',
  aggregation_termination: 'აგრეგაციაზე დასრულება',
  unknown: 'ფიზიკური დამუშავება უცნობია',
} as const;

export function applyIteration08CableRoute(inventory: Inventory): Inventory {
  inventory.cables.forEach(cable => {
    cable.physicalCondition ??= 'unknown';
    cable.physicalConditionVerification ??= 'needs_verification';
  });
  inventory.cableRoutes = [structuredClone(primaryRouteEvidence.route)];
  return inventory;
}

export const orderedCableRouteNodes = (route: CableRoute): CableRouteNode[] => [...route.nodes].sort((a, b) => a.sequence - b.sequence);
export const orderedCableRouteLegs = (route: CableRoute): CableRouteLeg[] => [...route.legs].sort((a, b) => a.sequence - b.sequence);

export function findCableRoute(inventory: Inventory, token: string): CableRoute | undefined {
  const query = token.trim().toLocaleLowerCase();
  return inventory.cableRoutes?.find(route => route.id.toLocaleLowerCase() === query || route.displayName.toLocaleLowerCase() === query);
}

export const cableRoutesForSegment = (inventory: Inventory, segmentId: string): CableRoute[] =>
  (inventory.cableRoutes ?? []).filter(route => route.legs.some(leg => leg.segmentId === segmentId) || route.branches.some(branch => branch.segmentIds.includes(segmentId)));

export const cableRoutesForAsset = (inventory: Inventory, asset: AssetRef): CableRoute[] =>
  (inventory.cableRoutes ?? []).filter(route => route.nodes.some(node => node.asset && sameAsset(node.asset, asset))
    || route.branches.some(branch => branch.destination && sameAsset(branch.destination, asset)));

export const cableRouteEndpointLabel = (endpoint: CableRouteEndpoint): string => endpoint.label;

const sameAsset = (a: AssetRef, b: AssetRef) => a.kind === b.kind && a.id === b.id;
const assetKey = (asset: AssetRef) => `${asset.kind}:${asset.id}`;
const assetExists = (inventory: Inventory, asset: AssetRef) =>
  (asset.kind === 'closure' ? inventory.closures
    : asset.kind === 'ap' ? inventory.accessPoints
      : asset.kind === 'aggregation' ? inventory.aggregations
        : asset.kind === 'odf' ? inventory.odfs ?? []
          : asset.kind === 'site' ? inventory.sites ?? []
            : asset.kind === 'boundary' ? inventory.externalBoundaries ?? [] : inventory.networkNodes ?? []).some(item => item.id === asset.id);

function endpointMatchesSegment(inventory: Inventory, segmentId: string, a: AssetRef, z: AssetRef): boolean {
  const segment = inventory.cables.find(cable => cable.id === segmentId);
  return !!segment && ((sameAsset(segment.endpointA, a) && sameAsset(segment.endpointB, z)) || (sameAsset(segment.endpointA, z) && sameAsset(segment.endpointB, a)));
}

export function validateCableRoutes(inventory: Inventory): string[] {
  const errors: string[] = [];
  const routes = inventory.cableRoutes ?? [];
  if (new Set(routes.map(route => route.id)).size !== routes.length) errors.push('Duplicate Cable Route identity');
  for (const route of routes) {
    const nodes = orderedCableRouteNodes(route);
    const legs = orderedCableRouteLegs(route);
    const nodeIds = new Set(nodes.map(node => node.id));
    if (nodeIds.size !== nodes.length || new Set(nodes.map(node => node.sequence)).size !== nodes.length || nodes.some((node, index) => node.sequence !== index)) errors.push(`Invalid Cable Route node order: ${route.id}`);
    const assets = nodes.flatMap(node => node.asset ? [assetKey(node.asset)] : []);
    if (!route.allowCircular && new Set(assets).size !== assets.length) errors.push(`Circular Cable Route not allowed: ${route.id}`);
    nodes.forEach(node => { if (node.asset && !assetExists(inventory, node.asset)) errors.push(`Unsupported Cable Route asset: ${route.id}/${node.id}`); });
    if (legs.length !== Math.max(0, nodes.length - 1) || new Set(legs.map(leg => leg.sequence)).size !== legs.length) errors.push(`Invalid Cable Route leg order: ${route.id}`);
    const mainSegments = new Set<string>();
    legs.forEach((leg, index) => {
      const from = nodes[index], to = nodes[index + 1];
      if (!from || !to || leg.sequence !== index || leg.fromNodeId !== from.id || leg.toNodeId !== to.id || !nodeIds.has(leg.fromNodeId) || !nodeIds.has(leg.toNodeId)) {
        errors.push(`Cable Route leg is not adjacent: ${route.id}/${leg.id}`);
        return;
      }
      if (leg.relationship === 'segment') {
        if (!leg.segmentId || !from.asset || !to.asset || !endpointMatchesSegment(inventory, leg.segmentId, from.asset, to.asset)) errors.push(`Cable Route segment endpoint mismatch: ${route.id}/${leg.id}`);
        else mainSegments.add(leg.segmentId);
      } else if (leg.segmentId !== null) errors.push(`Cable Route unresolved leg has segment identity: ${route.id}/${leg.id}`);
    });
    route.branches.forEach(branch => {
      const from = nodes.find(node => node.id === branch.fromNodeId);
      if (!from?.asset) errors.push(`Invalid Cable Route branch origin: ${route.id}/${branch.id}`);
      if (branch.branchKind === 'named_direction') {
        if (branch.destination !== null || branch.segmentIds.length !== 0 || branch.destinationRole !== 'external_direction' || !branch.targetDirectionText?.trim()) errors.push(`Invalid named Cable Route direction: ${route.id}/${branch.id}`);
        if (branch.linkedRouteId && !routes.some(candidate => candidate.id === branch.linkedRouteId)) errors.push(`Unknown linked Cable Route direction: ${route.id}/${branch.id}`);
        return;
      }
      if (!branch.destination || !assetExists(inventory, branch.destination)) errors.push(`Invalid Cable Route branch endpoint: ${route.id}/${branch.id}`);
      if (branch.segmentIds.length === 0) errors.push(`Cable Route branch has no segment: ${route.id}/${branch.id}`);
      branch.segmentIds.forEach(segmentId => {
        if (mainSegments.has(segmentId)) errors.push(`Cable Route branch promoted to main path: ${route.id}/${branch.id}/${segmentId}`);
        if (from?.asset && branch.destination && !endpointMatchesSegment(inventory, segmentId, from.asset, branch.destination)) errors.push(`Cable Route branch segment mismatch: ${route.id}/${branch.id}/${segmentId}`);
      });
    });
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (route.origin.state === 'known' && (!first?.asset || !sameAsset(route.origin.asset, first.asset) || !assetExists(inventory, route.origin.asset))) errors.push(`Invalid Cable Route origin: ${route.id}`);
    if (route.destination.state === 'known' && (!last?.asset || !sameAsset(route.destination.asset, last.asset) || !assetExists(inventory, route.destination.asset))) errors.push(`Invalid Cable Route destination: ${route.id}`);
    if (route.destination.state === 'unresolved' && last?.asset) errors.push(`Unresolved Cable Route destination linked to asset: ${route.id}`);
    if (route.physicalCableId !== null) errors.push(`Unsupported inferred PhysicalCable: ${route.id}`);
  }
  return errors;
}
