import { resolveCurrentFiberPath, currentStopLabel, currentEndpointLabel } from './currentFiberPath';
import type {
  FiberJourneySummary, Inventory, OdfPort, PortRangeAssignment, PortTopologyBinding,
  PortTopologyRole, SourceRef, SourceRepresentation,
} from './types';
import { getSegmentDisplayName, typedAssetLabel } from './network';
import { LENTEKHI_AGGREGATION_ID } from './iteration19';
import { TSAGERI_ODF_ID, TSAGERI_ROUTE_ID, portRangeFor } from './aggregationTopology';

export const PORT_TOPOLOGY_RULE = 'tsageri-lentekhi-port-topology/1';
export const FIBER_JOURNEY_RULE = 'tsageri-lentekhi-maximum-known-journey/1';
export const LENTEKHI_ODF_ID = 'ODF-LENTEKHI-01';

const source = (shapeIds: string[], note: string, rawValue?: string, rule = PORT_TOPOLOGY_RULE): SourceRef => ({
  file: 'Tsageri-Lentekhi 2025.vsdx', page: 'ცაგერი-ლენტეხი', pageId: '4', part: 'visio/pages/page1.xml',
  shapeIds, rawValue, interpretationRule: rule, note,
});

const ownerLabel = (binding: Pick<PortTopologyBinding, 'ownerType' | 'ownerId'>) => binding.ownerType === 'ap'
  ? `AP${binding.ownerId}`
  : binding.ownerId === TSAGERI_ODF_ID ? 'AGG5' : 'ლენტეხის აგრეგაცია';

function fiberIdentity(data: Inventory, segmentId: string, fiberNumber: number) {
  const fiber = data.fibers.find(item => item.cableId === segmentId && item.number === fiberNumber);
  const tube = fiber ? data.tubes.find(item => item.id === fiber.tubeId) : undefined;
  return { fiber, tube };
}

function tsageriRole(data: Inventory, port: number): PortTopologyRole {
  const range = portRangeFor(data, TSAGERI_ODF_ID, port);
  if (range?.continuity === 'stops_at_destination') return 'local_termination';
  if (range?.destination.type === 'named_direction') return 'external_direction';
  return 'route_continuation';
}

function buildTsageriBindings(data: Inventory): PortTopologyBinding[] {
  const cable = data.cables.find(item => item.legacyCableId === '148');
  if (!cable) return [];
  return Array.from({ length: 192 }, (_, index) => {
    const portNumber = index + 1;
    const { fiber, tube } = fiberIdentity(data, cable.id, portNumber);
    const range = portRangeFor(data, TSAGERI_ODF_ID, portNumber);
    const lineageIds = (data.fiberLineages ?? []).filter(item => item.origin.asset?.kind === 'aggregation' && item.origin.asset.id === '5' && item.origin.portNumber === portNumber).map(item => item.id);
    const directionLabel = range?.destination.type === 'named_direction' ? range.destination.name : range?.destination.label ?? typedAssetLabel(cable.endpointB);
    return {
      id: `PORTBIND-TSAGERI-P${String(portNumber).padStart(3, '0')}`, ownerType: 'odf', ownerId: TSAGERI_ODF_ID, portNumber,
      segmentId: cable.id, fiberNumber: portNumber, tubeNumber: tube?.number ?? null, tubeColor: tube?.physicalColor ?? null,
      fiberColor: fiber?.physicalColor ?? null, role: tsageriRole(data, portNumber), directionLabel, routeId: TSAGERI_ROUTE_ID,
      orientation: 'from_port', lineageIds, projectionStatus: portNumber === 145 || portNumber === 175 ? 'owner_confirmed' : 'source_interpreted',
      source: source(['12426', '43429', '43832'], `Mirrored 192-position ODF and C148 marker banks preserve the same ordered position. Port${portNumber} maps to C148/F${portNumber}; owner anchors Port145/F145 and Port175/F175 validate the ordering rule.`, String(portNumber)),
      notes: ['The Port range destination and the local C148 Fiber identity are separate facts.', 'This binding does not classify an internal splice, patch or jumper.'],
    };
  });
}

function apRole(flowRole: string): PortTopologyRole {
  if (flowRole === 'return' || flowRole === 'transit') return 'ap_return';
  if (flowRole === 'local_termination') return 'local_termination';
  return 'ap_ingress';
}

function buildApBindings(data: Inventory): PortTopologyBinding[] {
  return (data.apPortFlows ?? []).flatMap(flow => {
    if (!flow.incoming?.segmentId || flow.incoming.fiberNumber == null) return [];
    const incoming = flow.incoming;
    const segmentId = incoming.segmentId as string;
    const fiberNumber = incoming.fiberNumber as number;
    return [{
      id: `PORTBIND-AP${flow.accessPointId}-P${String(flow.portNumber).padStart(2, '0')}`, ownerType: 'ap' as const,
      ownerId: flow.accessPointId, portNumber: flow.portNumber, segmentId,
      fiberNumber, tubeNumber: incoming.tubeNumber, tubeColor: incoming.tubeColor,
      fiberColor: incoming.fiberColor, role: apRole(flow.primaryRole), directionLabel: flow.outgoing?.direction ?? `AP${flow.accessPointId}`,
      routeId: (data.cableRoutes ?? []).find(route => route.legs.some(leg => leg.segmentId === segmentId) || route.branches.some(branch => branch.segmentIds.includes(segmentId)))?.id ?? null,
      orientation: 'to_port' as const, lineageIds: [...flow.lineageIds], projectionStatus: flow.projectionStatus, source: flow.source,
      notes: [...flow.notes, 'Projected from the existing APPortFlow; no second AP topology is introduced.'],
    }];
  });
}

function lentekhiRepresentation(port: number, groupShapeId: string, role: SourceRepresentation['role']): SourceRepresentation {
  return {
    id: `${LENTEKHI_ODF_ID}-P${String(port).padStart(2, '0')}-${role}`, role,
    source: source([groupShapeId], `Bank-level source reference for Lentekhi logical position ${port}.`),
    geometry: { context: '48-position Lentekhi aggregation/C184 marker bank' }, style: { lineColor: null, fillColor: null },
    groupShapeId, interpretationRule: PORT_TOPOLOGY_RULE, reviewState: 'accepted',
  };
}

function ensureLentekhiPorts(data: Inventory) {
  if (!(data.odfs ?? []).some(item => item.id === LENTEKHI_ODF_ID)) (data.odfs ??= []).push({
    id: LENTEKHI_ODF_ID, displayLabel: 'ლენტეხის აგრეგაციის ODF', containedBy: { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID },
    vendor: null, model: null, panelCount: null, portCapacity: 48, connectorType: null, status: 'active', verification: 'documentation_reviewed',
    notes: ['The paired 48-position aggregation and C184 banks support ordered Port/Fiber binding.', 'The conflicting numeric aggregation identity remains separate.'],
    source: source(['36475', '36531', '37188'], 'Lentekhi 48-position aggregation/C184 endpoint bank.'), externalReferences: [],
  });
  const existing = new Set((data.odfPorts ?? []).filter(item => item.odfId === LENTEKHI_ODF_ID).map(item => item.number));
  const ports: OdfPort[] = [];
  for (let number = 1; number <= 48; number += 1) if (!existing.has(number)) ports.push({
    id: `${LENTEKHI_ODF_ID}-P${String(number).padStart(2, '0')}`, odfId: LENTEKHI_ODF_ID, panelId: null, number,
    faceMode: 'single', connectorType: null, physicalOccupancy: 'unknown', allocation: 'unknown', condition: 'unknown',
    verification: 'documentation_reviewed', source: source(['36475', '36531', '37188'], String(number), `Ordered Lentekhi logical Port ${number}.`),
    sourceRepresentations: [lentekhiRepresentation(number, '36531', 'internal_odf_port'), lentekhiRepresentation(number, '37188', 'aggregation_boundary_port')], externalReferences: [],
  });
  (data.odfPorts ??= []).push(...ports);
  if (!(data.portRangeAssignments ?? []).some(item => item.odfId === LENTEKHI_ODF_ID)) {
    const range: PortRangeAssignment = {
      id: 'PRA-LENTEKHI-001-048', odfId: LENTEKHI_ODF_ID, startPort: 1, endPort: 48,
      destination: { type: 'cable_route', routeId: TSAGERI_ROUTE_ID, label: 'SC224 / Tsageri direction' }, routeId: TSAGERI_ROUTE_ID,
      physicalCableId: null, continuity: 'continues_on_route', physicalConnection: 'known_range', verification: 'documentation_reviewed',
      source: source(['36475', '36531', '37188'], 'Ports 1–48 align with C184/F1–48.'), ownerConfirmed: false,
      notes: ['Exact same-index binding is source-interpreted from the paired ordered banks.'],
    };
    data.portRangeAssignments!.push(range);
  }
}

function buildLentekhiBindings(data: Inventory): PortTopologyBinding[] {
  const cable = data.cables.find(item => item.legacyCableId === '184');
  if (!cable) return [];
  return Array.from({ length: 48 }, (_, index) => {
    const portNumber = index + 1;
    const { fiber, tube } = fiberIdentity(data, cable.id, portNumber);
    const lineageIds = (data.fiberLineages ?? []).filter(item => (item.origin.asset?.id === LENTEKHI_AGGREGATION_ID || item.destination.asset?.id === LENTEKHI_AGGREGATION_ID) && (item.origin.portNumber === portNumber || item.destination.portNumber === portNumber) && item.legs.some(leg => leg.segmentId === cable.id && leg.fiberNumber === portNumber)).map(item => item.id);
    return {
      id: `PORTBIND-LENTEKHI-P${String(portNumber).padStart(2, '0')}`, ownerType: 'odf', ownerId: LENTEKHI_ODF_ID, portNumber,
      segmentId: cable.id, fiberNumber: portNumber, tubeNumber: tube?.number ?? null, tubeColor: tube?.physicalColor ?? null,
      fiberColor: fiber?.physicalColor ?? null, role: 'aggregation_termination', directionLabel: 'SC224 / ცაგერის მიმართულება', routeId: TSAGERI_ROUTE_ID,
      orientation: 'to_port', lineageIds, projectionStatus: 'source_interpreted',
      source: source(['36475', '36531', '37188'], `Paired ordered 48-position banks map C184/F${portNumber} to Lentekhi Port${portNumber}.`, String(portNumber)),
      notes: ['Numeric aggregation identity conflict does not affect the known endpoint or ordered Port/Fiber position.'],
    };
  });
}

function routeForSegment(data: Inventory, segmentId: string) {
  return (data.cableRoutes ?? []).find(route => route.legs.some(leg => leg.segmentId === segmentId) || route.branches.some(branch => branch.segmentIds.includes(segmentId)));
}

function journeyStop(scope: FiberJourneySummary['scope'], destination: string) {
  if (scope === 'full_lineage') return 'სრული ცნობილი გზა ნაჩვენებია.';
  if (scope === 'external_boundary') return 'შემდეგი რეგიონული დოკუმენტი იმპორტირებული არ არის.';
  if (scope === 'termination') return 'SC225-ზე მთავრდება; ეს ცნობილი საბოლოო წერტილია.';
  return `${destination}-ის შემდეგ ზუსტი ჟილური კავშირი ამ წყაროდან დაუდგენელია.`;
}

function buildJourneySummaries(data: Inventory, correctedGraph = false): FiberJourneySummary[] {
  return data.fibers.map(fiber => {
    const cable = data.cables.find(item => item.id === fiber.cableId)!;
    const lineage = (data.fiberLineages ?? []).find(item => item.legs.some(leg => leg.segmentId === fiber.cableId && leg.fiberNumber === fiber.number));
    const bindings = (data.portTopologyBindings ?? []).filter(item => item.segmentId === fiber.cableId && item.fiberNumber === fiber.number);
    const fromBinding = bindings.find(item => item.orientation === 'from_port');
    const toBinding = bindings.find(item => item.orientation === 'to_port');
    const route = routeForSegment(data, fiber.cableId);
    const lineageHasTermination = !!lineage && (data.nodeFiberTransitions ?? []).some(transition => transition.active && transition.transitionType === 'intentional_termination'
      && lineage.legs.some(leg => leg.segmentId === transition.a.segmentId && leg.fiberNumber === transition.a.fiberNumber));
    const lineageComplete = !!lineage && (!correctedGraph || (!lineage.warnings.length && !lineage.origin.label.includes('დაუდგენელია') && !lineage.destination.label.includes('დაუდგენელია')));
    let scope: FiberJourneySummary['scope'] = lineage ? lineageHasTermination ? 'termination' : lineageComplete ? 'full_lineage' : 'partial' : 'local_only';
    if (!lineage && (cable.endpointA.kind === 'boundary' || cable.endpointB.kind === 'boundary')) scope = 'external_boundary';
    else if (!lineage && bindings.some(item => item.role === 'local_termination')) scope = 'termination';
    else if (!lineage && (bindings.length || route)) scope = 'partial';
    const knownFrom = lineage?.origin.label ?? (fromBinding ? `${ownerLabel(fromBinding)} / Port ${fromBinding.portNumber}` : typedAssetLabel(cable.endpointA));
    const knownTo = lineage?.destination.label ?? (toBinding ? `${ownerLabel(toBinding)} / Port ${toBinding.portNumber}` : typedAssetLabel(cable.endpointB));
    return {
      id: `JOURNEY-${fiber.cableId}-F${String(fiber.number).padStart(3, '0')}`, fiberId: fiber.id, segmentId: fiber.cableId,
      fiberNumber: fiber.number, routeId: lineage?.routeId ?? route?.id ?? null, scope, lineageId: lineage?.id ?? null,
      portBindingIds: bindings.map(item => item.id), knownFrom, knownTo, stopReasonKa: journeyStop(scope, knownTo),
      projectionStatus: lineage?.projectionStatus ?? (bindings.some(item => item.projectionStatus === 'owner_confirmed') ? 'owner_confirmed' : 'source_interpreted'),
      source: source([...new Set([cable.source.shapeIds, ...bindings.map(item => item.source.shapeIds)].flat())], `Maximum-known journey for ${getSegmentDisplayName(cable)} / F${fiber.number}.`, undefined, FIBER_JOURNEY_RULE),
    };
  });
}

export function rebuildFiberJourneySummaries(data: Inventory): Inventory {
  data.fiberJourneySummaries = buildJourneySummaries(data, true);
  return data;
}

export const portTopologyBinding = (data: Inventory, ownerType: PortTopologyBinding['ownerType'], ownerId: string, portNumber: number) =>
  data.portTopologyBindings?.find(item => item.ownerType === ownerType && item.ownerId === ownerId && item.portNumber === portNumber);
export const portBindingsForFiber = (data: Inventory, segmentId: string, fiberNumber: number) =>
  (data.portTopologyBindings ?? []).filter(item => item.segmentId === segmentId && item.fiberNumber === fiberNumber);
export const fiberJourneySummary = (data: Inventory, segmentId: string, fiberNumber: number) => {
  const record = data.fiberJourneySummaries?.find(item => item.segmentId === segmentId && item.fiberNumber === fiberNumber);
  if (!data.fiberPathProjection || !record) return record;
  const path = resolveCurrentFiberPath(data,segmentId,fiberNumber);
  return {...record,pathSignature:path.signature,topologyRevision:path.topologyRevision,knownFrom:currentEndpointLabel(data,path.sides[0].stop),knownTo:currentEndpointLabel(data,path.sides.at(-1)!.stop),stopReasonKa:path.sides.filter(s=>s.stop.kind!=='port').map(s=>currentStopLabel(data,s.stop)).join(' · ') || 'სრული ცნობილი გზა ნაჩვენებია.',transitionIds:[...new Set(path.sides.flatMap(s=>s.transitions.map(t=>t.id)))].sort(),scope:path.state==='termination'?'termination' as const:path.state==='exact'?'full_lineage' as const:path.sides.some(s=>s.stop.kind==='external_boundary')?'external_boundary' as const:'partial' as const};
};

export function validateIteration20(data: Inventory): string[] {
  const errors: string[] = [];
  const bindings = data.portTopologyBindings ?? [];
  if (bindings.length !== 384) errors.push(`Expected 384 PortTopologyBindings; found ${bindings.length}.`);
  if (new Set(bindings.map(item => item.id)).size !== bindings.length) errors.push('Duplicate PortTopologyBinding ID.');
  for (const item of bindings) {
    if (!data.fibers.some(fiber => fiber.cableId === item.segmentId && fiber.number === item.fiberNumber)) errors.push(`Unknown bound Fiber: ${item.id}.`);
  }
  if (data.fiberJourneySummaries?.length !== data.fibers.length) errors.push(`Fiber Journey coverage is ${data.fiberJourneySummaries?.length ?? 0}/${data.fibers.length}.`);
  const c148 = data.cables.find(item => item.legacyCableId === '148');
  const f23 = c148 ? fiberJourneySummary(data, c148.id, 23) : undefined;
  if (!f23 || f23.knownFrom !== 'AGG5 / Port 23' || f23.knownTo !== 'SC205' || !f23.stopReasonKa.includes('SC205')) errors.push('C148/F23 maximum-known journey mismatch.');
  if (!portTopologyBinding(data, 'odf', TSAGERI_ODF_ID, 175)?.lineageIds.includes('LINEAGE-AP51-NORTH-03')) errors.push('AGG5 Port175 lineage binding mismatch.');
  if (!portTopologyBinding(data, 'ap', '51', 3)?.lineageIds.includes('LINEAGE-AP51-NORTH-03')) errors.push('AP51 Port3 lineage binding mismatch.');
  return errors;
}

export function applyIteration20(data: Inventory): Inventory {
  ensureLentekhiPorts(data);
  data.portTopologyBindings = [...buildTsageriBindings(data), ...buildApBindings(data), ...buildLentekhiBindings(data)];
  data.fiberJourneySummaries = buildJourneySummaries(data);
  const document = data.sourceDocuments?.[0];
  if (document) {
    document.counts.logicalOdfPorts = data.odfPorts?.length ?? 0;
    const ports = document.completeness.find(item => item.id === 'port_topology');
    if (ports) { ports.state = 'complete'; ports.known = 384; ports.total = 384; ports.summary = 'All 384 modeled ODF/AP Ports have a reviewed local Fiber binding; optical continuation remains explicitly partial where evidence stops.'; }
  }
  if (data.migrationCoverage) data.migrationCoverage.logicalPorts = data.portTopologyBindings.length;
  return data;
}
