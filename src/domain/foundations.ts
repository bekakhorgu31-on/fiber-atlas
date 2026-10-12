import annotationJson from '../data/source-annotations.json';
import sourceEvidenceJson from '../data/source-evidence.json';
import type {
  AssetRef, Cable, DistanceObservation, ExplicitTopologyEndpoint, Fiber, Inventory,
  PortFaceRef, RouteDistanceSummary, SourceAnnotation, SourceAnnotationReport, SourceRef,
} from './types';

const SOURCE_SHA = '51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a';
const RULE = 'tsageri-lentekhi-iteration-09/1';
const ROUTE_ID = 'ROUTE-TSAGERI-LENTEKHI-CORE';
const annotations = annotationJson.annotations as SourceAnnotation[];
const annotationReport = annotationJson.report as SourceAnnotationReport;

type SourceCable = { id: string; legacy_label: string; end_a: { id: string; kind: string }; end_z: { id: string; kind: string }; fiber_count: number; source: { file: string; page: string; page_id: string; part: string; shape_ids: string[] } };
const sourceCables = (sourceEvidenceJson as { cables: SourceCable[] }).cables;
const importedLegacyIds = ['148', '150', '176', '177', '178', '179', '180'] as const;
const closureShapeIds: Record<string, string> = { '205': '12428', '220': '36212', '221': '43124', '222': '42417', '223': '36309', '224': '36985' };

const sourceRef = (shapeIds: string[], rawValue?: string): SourceRef => ({
  file: 'Tsageri-Lentekhi 2025.vsdx', page: 'ცაგერი-ლენტეხი', pageId: '4',
  part: 'visio/pages/page1.xml', shapeIds, rawValue, interpretationRule: RULE,
});
const assetKind = (kind: string): AssetRef['kind'] => kind === 'aggregation_point' ? 'aggregation' : kind === 'access_point' ? 'ap' : 'closure';
const unknownColor = () => ({ key: null, nameKa: null, nameEn: null, hex: null, basis: 'unknown' as const, verification: 'needs_verification' as const });

function buildSegment(source: SourceCable): Cable {
  const endpointA: AssetRef = { kind: assetKind(source.end_a.kind), id: source.end_a.id };
  const endpointB: AssetRef = { kind: assetKind(source.end_z.kind), id: source.end_z.id };
  return {
    id: `CAB-${source.id.padStart(6, '0')}`, recordType: 'cable_segment', legacyCableId: source.id,
    legacyLabels: [source.legacy_label], fiberCount: source.fiber_count, endpointA, endpointB,
    routeNodes: [
      { sequence: 0, asset: endpointA, accessType: 'unknown', verification: 'documentation_reviewed', source: sourceRef(source.source.shape_ids, source.legacy_label) },
      { sequence: 1, asset: endpointB, accessType: 'unknown', verification: 'documentation_reviewed', source: sourceRef(source.source.shape_ids, source.legacy_label) },
    ],
    routeCompleteness: 'endpoints_only', manufacturer: null, manufacturerVerification: 'needs_verification',
    model: null, productCode: null, cableType: null, constructionType: null, tubeCount: null, colorScheme: null,
    territoryId: 'tsageri-lentekhi', owner: { state: 'unknown' }, lengthM: null,
    verification: 'documentation_reviewed', physicalCableId: null, physicalCondition: 'unknown',
    physicalConditionVerification: 'needs_verification',
    notes: ['Source label establishes this node-to-node Cable Segment and fiber quantity only.', 'Tube grouping, colors, manufacturer, physical condition, ownership and distance remain unknown.'],
    source: sourceRef(source.source.shape_ids, source.legacy_label), externalReferences: [],
  };
}

function buildFibers(segment: Cable): Fiber[] {
  return Array.from({ length: segment.fiberCount }, (_, index) => ({
    id: `${segment.id}-F${String(index + 1).padStart(3, '0')}`, cableId: segment.id, number: index + 1,
    tubeId: null, physicalColor: unknownColor(), proposedColor: null, positionInTube: null,
    proposedPositionInTube: null, allocation: 'unknown', condition: 'unknown', connectivity: 'unknown',
    verification: 'needs_verification', rights: { state: 'unknown' }, service: { state: 'unknown' },
    notes: ['Fiber position exists from the documented segment capacity; physical grouping, color, state and connectivity are not established.'],
  }));
}

export function applyIteration09Foundations(inventory: Inventory): Inventory {
  const route = inventory.cableRoutes?.find(item => item.id === ROUTE_ID);
  if (!route) throw new Error(`Iteration 09 requires ${ROUTE_ID}`);
  for (const id of Object.keys(closureShapeIds)) {
    if (inventory.closures.some(item => item.id === id)) continue;
    inventory.closures.push({
      id, territoryId: 'tsageri-lentekhi', role: 'უცნობია', model: 'უცნობია', mounting: null,
      coordinatesRaw: '', owner: { state: 'unknown' }, verification: 'documentation_reviewed',
      notes: ['Route node identity is documented; closure treatment, model, mounting, coordinates and ownership remain unknown.'],
      lastApprovedChange: null, lastVerified: null, source: sourceRef([closureShapeIds[id]]), contextOnly: true, externalReferences: [],
    });
  }
  for (const legacyId of importedLegacyIds) {
    if (inventory.cables.some(item => item.legacyCableId === legacyId)) continue;
    const evidence = sourceCables.find(item => item.id === legacyId);
    if (!evidence) throw new Error(`Missing reviewed source segment C${legacyId}`);
    const segment = buildSegment(evidence);
    inventory.cables.push(segment);
    inventory.fibers.push(...buildFibers(segment));
  }
  const opennet = inventory.organizations.find(item => item.id === 'opennet');
  if (!opennet) throw new Error('OpenNet organization is missing');
  opennet.annotationOnly = false;
  if (!opennet.aliases.includes('ოუფენ ნეტი')) opennet.aliases.push('ოუფენ ნეტი');
  inventory.sourceAnnotations = structuredClone(annotations);
  inventory.sourceAnnotationReport = structuredClone(annotationReport);
  inventory.infrastructureRoles = [
    { id: 'ROLE-TL-OPENNET-PHYSICAL-OWNER', subjectType: 'route', subjectId: ROUTE_ID, organizationId: 'opennet', role: 'physical_infrastructure_owner', verification: 'documentation_reviewed', source: sourceRef(['17661', '17662', '17663', '17664', '37550', '37551', '37552', '37553', '38538', '38539', '38540', '38541'], 'Open Net / Open net / ოუფენ ნეტი'), notes: ['Owner-confirmed route context; this does not assign cable-segment ownership, fiber rights, service provider, or customer roles.'] },
    { id: 'ROLE-TL-OPENNET-OPERATOR', subjectType: 'route', subjectId: ROUTE_ID, organizationId: 'opennet', role: 'network_operator', verification: 'documentation_reviewed', source: sourceRef(['17661', '17662', '17663', '17664', '37550', '37551', '37552', '37553', '38538', '38539', '38540', '38541'], 'Open Net / Open net / ოუფენ ნეტი'), notes: ['Owner-confirmed route context; commercial and per-fiber roles remain independent.'] },
  ];
  inventory.internalUses = [];
  inventory.sites = [];
  inventory.odfs = [];
  inventory.odfPanels = [];
  inventory.odfPorts = [];
  inventory.portRangeAssignments = [];
  inventory.accessPointPortRanges = [];
  inventory.physicalCables = [];
  inventory.fiberTerminations = [];
  inventory.patchCords = [];
  inventory.distanceObservations = [];
  return inventory;
}

export const annotationsForAsset = (inventory: Inventory, asset: AssetRef): SourceAnnotation[] =>
  (inventory.sourceAnnotations ?? []).filter(annotation => annotation.associatedAssets.some(item => item.kind === asset.kind && item.id === asset.id));
export const annotationsForRoute = (inventory: Inventory, routeId: string): SourceAnnotation[] =>
  (inventory.sourceAnnotations ?? []).filter(annotation => annotation.associatedRouteIds.includes(routeId));
export const groupAnnotationsForRouteNode = (inventory: Inventory, nodeId: string): SourceAnnotation[] =>
  (inventory.sourceAnnotations ?? []).filter(annotation => annotation.scope === 'group_range' && annotation.associatedRouteNodeIds.includes(nodeId));
export const routeInfrastructureRoles = (inventory: Inventory, routeId: string) =>
  (inventory.infrastructureRoles ?? []).filter(role => role.subjectType === 'route' && role.subjectId === routeId);

export function routeDistanceSummary(inventory: Inventory, routeId: string): RouteDistanceSummary {
  const route = inventory.cableRoutes?.find(item => item.id === routeId);
  if (!route) return { state: 'unknown', knownMeters: null, knownLegs: 0, missingLegs: 0, conflictingLegs: 0 };
  let knownMeters = 0, knownLegs = 0, missingLegs = 0, conflictingLegs = 0;
  for (const leg of route.legs) {
    const observations = (inventory.distanceObservations ?? []).filter(item => item.routeLegId === leg.id && item.resolution !== 'superseded');
    const values = [...new Set(observations.filter(item => item.distanceM != null).map(item => item.distanceM as number))];
    if (observations.some(item => item.resolution === 'conflicting' || item.verification === 'conflicting') || values.length > 1) conflictingLegs += 1;
    else if (values.length === 1) { knownLegs += 1; knownMeters += values[0]; }
    else missingLegs += 1;
  }
  return { state: conflictingLegs ? 'conflicting' : knownLegs === route.legs.length ? 'complete' : knownLegs ? 'partial' : 'unknown', knownMeters: knownLegs ? knownMeters : null, knownLegs, missingLegs, conflictingLegs };
}

export const explicitTopologyKey = (endpoint: ExplicitTopologyEndpoint): string => endpoint.kind === 'port_face'
  ? `port:${endpoint.portId}:${endpoint.face}`
  : `fiber:${endpoint.cableId}:${endpoint.fiber}@${endpoint.at.kind}:${endpoint.at.id}`;

export function traceExplicitTopology(inventory: Inventory, start: ExplicitTopologyEndpoint): string[] {
  const adjacency = new Map<string, Set<string>>();
  const connect = (a: ExplicitTopologyEndpoint, z: ExplicitTopologyEndpoint) => {
    const ak = explicitTopologyKey(a), zk = explicitTopologyKey(z);
    (adjacency.get(ak) ?? adjacency.set(ak, new Set()).get(ak)!).add(zk);
    (adjacency.get(zk) ?? adjacency.set(zk, new Set()).get(zk)!).add(ak);
  };
  for (const termination of inventory.fiberTerminations ?? []) connect(termination.fiber, termination.port);
  for (const port of inventory.odfPorts ?? []) if (port.faceMode === 'front_rear') connect({ kind: 'port_face', portId: port.id, face: 'front' }, { kind: 'port_face', portId: port.id, face: 'rear' });
  for (const patch of inventory.patchCords ?? []) connect(patch.a, patch.z);
  const first = explicitTopologyKey(start), visited = new Set([first]), queue = [first];
  while (queue.length) for (const next of adjacency.get(queue.shift()!) ?? []) if (!visited.has(next)) { visited.add(next); queue.push(next); }
  return [...visited];
}

const unique = (values: string[]) => new Set(values).size === values.length;
const validPortFace = (inventory: Inventory, ref: PortFaceRef, use: 'termination' | 'patch') => {
  const port = inventory.odfPorts?.find(item => item.id === ref.portId);
  if (!port) return false;
  if (port.faceMode === 'single') return ref.face === 'single';
  return use === 'termination' ? ref.face === 'rear' : ref.face === 'front';
};
const fiberEndpointExists = (inventory: Inventory, endpoint: { cableId: string; fiber: number; at: AssetRef }) => {
  const segment = inventory.cables.find(item => item.id === endpoint.cableId);
  return !!segment && inventory.fibers.some(item => item.cableId === endpoint.cableId && item.number === endpoint.fiber)
    && segment.routeNodes.some(node => node.asset.kind === endpoint.at.kind && node.asset.id === endpoint.at.id);
};

export function validateFoundations(inventory: Inventory): string[] {
  const errors: string[] = [];
  const anns = inventory.sourceAnnotations ?? [];
  if (!unique(anns.map(item => item.id))) errors.push('Duplicate source annotation identity');
  anns.forEach(item => { if (!item.rawText || item.source.rawValue !== item.rawText) errors.push(`Source annotation raw text mismatch: ${item.id}`); });
  if (inventory.sourceAnnotationReport && (!unique(inventory.sourceAnnotationReport.annotationIds) || inventory.sourceAnnotationReport.annotationIds.length !== anns.length || inventory.sourceAnnotationReport.annotationIds.some(id => !anns.some(item => item.id === id)))) errors.push('Source annotation report mismatch');
  const group = anns.filter(item => item.id === 'ANN-GROUP-SC220-SC223-ADDED');
  if (anns.length && (group.length !== 1 || group[0].scope !== 'group_range' || group[0].associatedAssets.length !== 4)) errors.push('Shared SC220-SC223 annotation mismatch');
  const roles = inventory.infrastructureRoles ?? [];
  if (!unique(roles.map(item => item.id))) errors.push('Duplicate infrastructure role identity');
  roles.forEach(item => {
    if (!inventory.organizations.some(org => org.id === item.organizationId)) errors.push(`Unknown infrastructure role organization: ${item.id}`);
    if (item.subjectType === 'route' && !inventory.cableRoutes?.some(route => route.id === item.subjectId)) errors.push(`Unknown infrastructure role subject: ${item.id}`);
  });
  const odfs = inventory.odfs ?? [], panels = inventory.odfPanels ?? [], ports = inventory.odfPorts ?? [];
  if (!unique(odfs.map(item => item.id)) || !unique(panels.map(item => item.id)) || !unique(ports.map(item => item.id))) errors.push('Duplicate ODF inventory identity');
  odfs.forEach(item => { if (!((item.containedBy.kind === 'site' && inventory.sites?.some(site => site.id === item.containedBy.id)) || (item.containedBy.kind === 'ap' && inventory.accessPoints.some(ap => ap.id === item.containedBy.id)) || (item.containedBy.kind === 'aggregation' && inventory.aggregations.some(aggregation => aggregation.id === item.containedBy.id)))) errors.push(`Unknown ODF container: ${item.id}`); });
  panels.forEach(item => { if (!odfs.some(odf => odf.id === item.odfId)) errors.push(`Unknown ODF panel parent: ${item.id}`); });
  ports.forEach(item => {
    const panel = item.panelId ? panels.find(candidate => candidate.id === item.panelId) : null;
    if (!odfs.some(odf => odf.id === item.odfId) || item.panelId && (!panel || panel.odfId !== item.odfId) || !Number.isInteger(item.number) || item.number < 1) errors.push(`Invalid ODF port: ${item.id}`);
  });
  const terms = inventory.fiberTerminations ?? [], patches = inventory.patchCords ?? [];
  if (!unique(terms.map(item => item.id)) || !unique(patches.map(item => item.id))) errors.push('Duplicate explicit topology identity');
  terms.forEach(item => {
    const port = ports.find(candidate => candidate.id === item.port.portId);
    const odf = odfs.find(candidate => candidate.id === port?.odfId);
    const sameLocation = odf?.containedBy.kind === item.fiber.at.kind && odf.containedBy.id === item.fiber.at.id;
    if (!fiberEndpointExists(inventory, item.fiber) || !validPortFace(inventory, item.port, 'termination') || !sameLocation) errors.push(`Invalid fiber termination: ${item.id}`);
  });
  patches.forEach(item => { if (!validPortFace(inventory, item.a, 'patch') || !validPortFace(inventory, item.z, 'patch') || explicitTopologyKey(item.a) === explicitTopologyKey(item.z)) errors.push(`Invalid patch cord: ${item.id}`); });
  const distances = inventory.distanceObservations ?? [];
  if (!unique(distances.map(item => item.id))) errors.push('Duplicate distance observation identity');
  distances.forEach(item => {
    if ((item.routeLegId === null) === (item.cableSegmentId === null) || item.distanceM != null && (!Number.isFinite(item.distanceM) || item.distanceM < 0)) errors.push(`Invalid distance observation: ${item.id}`);
    if (item.routeLegId && !inventory.cableRoutes?.some(route => route.legs.some(leg => leg.id === item.routeLegId))) errors.push(`Unknown distance route leg: ${item.id}`);
    if (item.cableSegmentId && !inventory.cables.some(segment => segment.id === item.cableSegmentId)) errors.push(`Unknown distance cable segment: ${item.id}`);
    if (item.sourceType === 'external_system' && !item.externalReference) errors.push(`Missing distance external reference: ${item.id}`);
  });
  return errors;
}

export type { DistanceObservation };
