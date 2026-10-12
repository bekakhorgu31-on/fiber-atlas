import evidenceJson from '../data/iteration24-physical-construction.json';
import { standardColor } from './colors';
import type {
  APFlowProfile, APPortDirectionGroup, APPortFlow, APPortRole, FiberLineage, Inventory,
  PhysicalColorKey, PrototypeProjectionStatus, SegmentPhysicalColorCoverage, SourceRef, Tube,
} from './types';

export const AP_PORT_FLOW_RULE = 'tsageri-lentekhi-ap-port-flow/1';
export const PHYSICAL_COLOR_RULE = 'tsageri-lentekhi-marker-colors/3';
export const LENTEKHI_AGGREGATION_ID = 'AGG-LENTEKHI';
const SOURCE_FILE = 'Tsageri-Lentekhi 2025.vsdx';
const SOURCE_PAGE = 'ცაგერი-ლენტეხი';
const SOURCE_PART = 'visio/pages/page1.xml';

type EvidenceRecord = {
  fiberNumber: number; tubeNumber: number; positionInTube: number; markerShapeId: string;
  rawInnerColor: string; fiberColorKey: PhysicalColorKey | null; rawOuterColor: string;
  observedOuterColorKey: PhysicalColorKey | null; tubeColorKey: PhysicalColorKey | null; warnings: string[];
};
type SegmentEvidence = {
  segmentId: string; legacySegmentId: string; fiberCount: number; tubeCount: number;
  groupShapeIds: string[]; corroboratingGroupShapeIds: string[]; pairedBanksAgree: boolean;
  decodedFiberColors: number; decodedTubeColors: number; confidence: PrototypeProjectionStatus;
  records: EvidenceRecord[]; unresolved: string[];
};
const physicalEvidence = evidenceJson as { sourceSha256: string; convention: string; segments: SegmentEvidence[] };

const source = (shapeIds: string[], note: string, rawValue?: string, rule = AP_PORT_FLOW_RULE): SourceRef => ({
  file: SOURCE_FILE, page: SOURCE_PAGE, pageId: '4', part: SOURCE_PART, shapeIds,
  rawValue, interpretationRule: rule, note,
});

const AP_CONFIG = [
  { apId: '41', segment: '149', closure: '205', symbol: '12432', label: '14250', groups: ['14251', '13910'] },
  { apId: '50', segment: '170', closure: '216', symbol: '33591', label: '33699', groups: ['33752', '33700'] },
  { apId: '51', segment: '173', closure: '218', symbol: '34263', label: '34371', groups: ['34424', '34372'] },
  { apId: '52', segment: '175', closure: '219', symbol: '35041', label: '35121', groups: ['35174', '35122'] },
  { apId: '53', segment: '182', closure: '225', symbol: '37759', label: '37907', groups: ['37908', '37855'] },
  { apId: '54', segment: '183', closure: '225', symbol: '38310', label: '38438', groups: ['38439', '38386'] },
] as const;

function applyPhysicalConstruction(data: Inventory) {
  for (const segment of physicalEvidence.segments) {
    const cable = data.cables.find(item => item.id === segment.segmentId || item.legacyCableId === segment.legacySegmentId);
    if (!cable) continue;
    cable.tubeCount = segment.tubeCount;
    cable.constructionType = '12 fibers per Tube/module';
    cable.colorScheme = 'Source-decoded physical marker colors';
    cable.notes = [...cable.notes.filter(note => !note.includes('12-ჟილიანი ჯგუფი')), 'Tube and Fiber physical colors decoded from the repeated Visio marker convention; cable/connector line colors excluded.'];
    const existing = data.tubes.filter(item => item.cableId === cable.id);
    const tubes: Tube[] = [];
    for (let tubeNumber = 1; tubeNumber <= segment.tubeCount; tubeNumber += 1) {
      const records = segment.records.filter(item => item.tubeNumber === tubeNumber);
      const first = records.find(item => item.tubeColorKey);
      const tube = existing.find(item => item.number === tubeNumber || item.proposedNumber === tubeNumber) ?? {
        id: `TUBE-${cable.id}-T${String(tubeNumber).padStart(2, '0')}`, cableId: cable.id,
        number: tubeNumber, proposedNumber: null, physicalColor: first?.tubeColorKey ? standardColor(first.tubeColorKey) : standardColor('white', 'proposed_standard'),
        basis: 'documented' as const, verification: 'documentation_reviewed' as const,
      };
      tube.number = tubeNumber;
      tube.proposedNumber = null;
      tube.basis = 'documented';
      tube.verification = 'documentation_reviewed';
      tube.physicalColor = first?.tubeColorKey ? standardColor(first.tubeColorKey) : { key: null, nameKa: null, nameEn: null, hex: null, basis: 'unknown', verification: 'needs_verification' };
      tube.physicalEvidence = {
        source: source([...segment.groupShapeIds, ...records.map(item => item.markerShapeId)], `Tube ${tubeNumber} ring color is the repeated value across its 12-position marker group.`, undefined, PHYSICAL_COLOR_RULE),
        ruleVersion: PHYSICAL_COLOR_RULE, convention: physicalEvidence.convention,
        rawOuterColor: [...new Set(records.map(item => item.rawOuterColor))].join(', '), warnings: [...new Set(records.flatMap(item => item.warnings))],
      };
      tubes.push(tube);
    }
    data.tubes = [...data.tubes.filter(item => item.cableId !== cable.id), ...tubes];
    for (const record of segment.records) {
      const fiber = data.fibers.find(item => item.cableId === cable.id && item.number === record.fiberNumber);
      const tube = tubes.find(item => item.number === record.tubeNumber);
      if (!fiber || !tube) continue;
      fiber.tubeId = tube.id;
      fiber.positionInTube = record.positionInTube;
      fiber.proposedPositionInTube = null;
      fiber.proposedColor = null;
      fiber.physicalColor = record.fiberColorKey ? standardColor(record.fiberColorKey) : { key: null, nameKa: null, nameEn: null, hex: null, basis: 'unknown', verification: 'needs_verification' };
      fiber.verification = 'documentation_reviewed';
      fiber.physicalEvidence = {
        source: source([...segment.groupShapeIds, record.markerShapeId], `Fiber ${record.fiberNumber}: inner fill is Fiber color; the enclosing repeated ring identifies Tube ${record.tubeNumber}.`, `inner=${record.rawInnerColor}; outer=${record.rawOuterColor}`, PHYSICAL_COLOR_RULE),
        ruleVersion: PHYSICAL_COLOR_RULE, convention: physicalEvidence.convention,
        rawInnerColor: record.rawInnerColor, rawOuterColor: record.rawOuterColor, warnings: [...record.warnings],
      };
    }
  }
  data.physicalColorCoverage = physicalEvidence.segments.map((item): SegmentPhysicalColorCoverage => ({
    segmentId: item.segmentId, legacySegmentId: item.legacySegmentId, fiberCount: item.fiberCount,
    tubeCount: item.tubeCount, decodedFiberColors: item.decodedFiberColors, decodedTubeColors: item.decodedTubeColors,
    confidence: item.confidence, groupShapeIds: [...item.groupShapeIds, ...item.corroboratingGroupShapeIds], unresolved: [...item.unresolved],
  }));
}

function ap41Groups(): APPortDirectionGroup[] {
  return [
    { id: 'AP41-GROUP-INGRESS-01-16', accessPointId: '41', startPort: 1, endPort: 16, role: 'ingress', labelKa: 'შემოდის', direction: 'SC205 → C149 → AP41', projectionStatus: 'owner_confirmed', notes: ['Latest owner explanation.'] },
    { id: 'AP41-GROUP-RETURN-16-22', accessPointId: '41', startPort: 16, endPort: 22, role: 'return', labelKa: 'ბრუნდება მარშრუტზე', direction: 'SC205 / მთავარი მარშრუტის მიმართულება', projectionStatus: 'owner_confirmed', notes: ['Port16 deliberately overlaps the incoming and return groups.'] },
    { id: 'AP41-GROUP-LOCAL-23-24', accessPointId: '41', startPort: 23, endPort: 24, role: 'local_termination', labelKa: 'აქ მთავრდება', direction: 'SC205 / ადგილობრივი მხარე', projectionStatus: 'owner_confirmed', notes: ['Latest owner explanation.'] },
  ];
}

function roleFor(apId: string, port: number): { roles: APPortRole[]; primaryRole: APPortRole } {
  if (apId !== '41') return { roles: ['ingress'], primaryRole: 'ingress' };
  if (port <= 15) return { roles: ['ingress'], primaryRole: 'ingress' };
  if (port === 16) return { roles: ['ingress', 'return', 'transit'], primaryRole: 'transit' };
  if (port <= 22) return { roles: ['return'], primaryRole: 'return' };
  return { roles: ['local_termination'], primaryRole: 'local_termination' };
}

function buildAPFlows(data: Inventory) {
  const profiles: APFlowProfile[] = [];
  const flows: APPortFlow[] = [];
  for (const config of AP_CONFIG) {
    const cable = data.cables.find(item => item.legacyCableId === config.segment);
    const ap = data.accessPoints.find(item => item.id === config.apId);
    if (!cable || !ap) continue;
    const groups = config.apId === '41' ? ap41Groups() : [{
      id: `AP${config.apId}-GROUP-ARRIVAL-01-24`, accessPointId: config.apId, startPort: 1, endPort: 24,
      role: 'ingress' as const, labelKa: 'შემოდის', direction: `SC${config.closure} → C${config.segment} → AP${config.apId}`,
      projectionStatus: 'source_interpreted' as const, notes: ['The 24-position Fiber marker bank structurally aligns with the 24 numbered AP positions. Internal continuation remains unknown.'],
    }];
    profiles.push({
      accessPointId: config.apId, incomingSegmentId: cable.id, upstreamClosureId: config.closure,
      routeOriginLabel: 'AGG5 · ცაგერი', continuationState: config.apId === '41' ? 'owner_described_return' : 'source_unresolved',
      sourceRule: AP_PORT_FLOW_RULE, directionGroups: groups,
      source: source([config.symbol, config.label, ...config.groups], `AP${config.apId} 24-position bank independently matched to C${config.segment} and the numbered AP layout.`),
      notes: config.apId === '41'
        ? ['Latest owner ranges are 1–16 incoming, 16–22 return, 23–24 local end.', 'Older owner statement described Ports3–22 as Ambrolauri backfeed. Both statements remain in provenance; Port16 overlap is preserved.']
        : ['Arriving cable and same-index marker alignment are source-interpreted. AP internal continuation, operation and final service state remain unknown.'],
    });
    for (let port = 1; port <= ap.portCount; port += 1) {
      const fiber = data.fibers.find(item => item.cableId === cable.id && item.number === port);
      const tube = fiber ? data.tubes.find(item => item.id === fiber.tubeId) : undefined;
      const prior = data.prototypePortMappings?.find(item => item.accessPointId === config.apId && item.portNumber === port);
      const roles = roleFor(config.apId, port);
      const lineages = (data.fiberLineages ?? []).filter(lineage => lineage.legs.some(leg => leg.segmentId === cable.id && leg.fiberNumber === port) && lineageVisitsAP(lineage, config.apId));
      const isReturn = config.apId === '41' && port >= 16 && port <= 22;
      const isLocal = config.apId === '41' && port >= 23;
      flows.push({
        id: `APFLOW-${config.apId}-P${String(port).padStart(2, '0')}`, accessPointId: config.apId, portNumber: port,
        incoming: { segmentId: cable.id, fiberNumber: port, tubeNumber: tube?.number ?? null, tubeColor: tube?.physicalColor ?? null, fiberColor: fiber?.physicalColor ?? null, direction: `SC${config.closure} → C${config.segment}` },
        outgoing: isReturn || isLocal ? { segmentId: null, fiberNumber: null, tubeNumber: null, tubeColor: null, fiberColor: null, direction: isReturn ? 'SC205 / მთავარი მარშრუტი' : 'SC205 / ადგილობრივი მხარე' } : null,
        roles: roles.roles, primaryRole: roles.primaryRole,
        physicalUsage: prior?.physicalUsage ?? 'unknown', administrativeAllocation: prior?.administrativeAllocation ?? 'unknown',
        commercialAvailability: prior?.commercialAvailability ?? 'unknown', lineageIds: lineages.map(item => item.id),
        internalContinuation: 'unknown', projectionStatus: config.apId === '41' ? 'owner_confirmed' : prior?.projectionStatus ?? 'source_interpreted',
        source: source([config.symbol, config.label, ...config.groups], `C${config.segment}/F${port} and AP${config.apId}/Port${port} share the same source marker position. Internal AP continuation is not classified as splice, patch or jumper.`),
        notes: port === 16 && config.apId === '41' ? ['Port16 belongs to both owner-described groups; transit is used as the primary display role without removing ingress or return.'] : [],
      });
    }
  }
  data.apFlowProfiles = profiles;
  data.apPortFlows = flows;
}

function canonicalizeLentekhi(data: Inventory) {
  const prior = data.aggregations.find(item => item.id === 'LENTEKHI-CONFLICT');
  data.aggregations = data.aggregations.filter(item => item.id !== 'LENTEKHI-CONFLICT');
  data.externalBoundaries = (data.externalBoundaries ?? []).filter(item => item.id !== 'BOUNDARY-LENTEKHI-AGG');
  data.aggregations.push({
    id: LENTEKHI_AGGREGATION_ID, name: 'ლენტეხის აგრეგაცია', portCount: 48,
    verification: 'conflicting', contextOnly: false, owner: { state: 'unknown' }, externalReferences: prior?.externalReferences ?? [],
    legacyIdentityClaims: [{ field: 'heading', value: '6', sourceShapeId: '37059' }, { field: 'property', value: '5', sourceShapeId: '36475' }],
    source: source(['36475', '37059', '15991', '36531', '37188'], 'Destination is known; numeric legacy identifier is conflicting.', 'heading=6; property=5', 'tsageri-lentekhi-lentekhi-identity/1'),
  });
  const route = data.cableRoutes?.find(item => item.id === 'ROUTE-TSAGERI-LENTEKHI-CORE');
  if (route) {
    route.displayName = 'ცაგერი → ლენტეხი';
    route.destination = { state: 'known', asset: { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID }, label: 'ლენტეხის აგრეგაცია', verification: 'documentation_reviewed', source: source(['36475', '37059', '15991'], 'Known route endpoint. The heading/property number conflict is retained on the entity.') };
    const node = route.nodes.find(item => item.id === 'node-lentekhi-boundary');
    if (node) {
      node.id = 'node-agg-lentekhi';
      node.asset = { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID }; node.label = 'ლენტეხის აგრეგაცია';
      node.treatment = 'aggregation_termination'; node.treatmentVerification = 'documentation_reviewed'; node.verification = 'documentation_reviewed';
      node.warnings = ['Destination is known; numeric legacy identifier is conflicting.'];
    }
    const leg = route.legs.find(item => item.id === 'route-leg-c184-unresolved-endpoint');
    if (leg) {
      leg.id = 'route-leg-c184'; leg.toNodeId = 'node-agg-lentekhi'; leg.segmentId = data.cables.find(item => item.legacyCableId === '184')?.id ?? 'CAB-000184';
      leg.relationship = 'segment'; leg.verification = 'documentation_reviewed'; leg.warnings = ['Aggregation number conflict does not block the known C184 endpoint.'];
    }
    route.documentation = 'complete';
    route.warnings = route.warnings.filter(item => !item.includes('C184 remains'));
  }
  const c184 = data.cables.find(item => item.legacyCableId === '184');
  if (c184) {
    if (c184.endpointA.kind === 'boundary' || c184.endpointA.kind === 'aggregation') c184.endpointA = { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID };
    if (c184.endpointB.kind === 'boundary' || c184.endpointB.kind === 'aggregation') c184.endpointB = { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID };
    for (const node of c184.routeNodes) if (node.asset.kind === 'boundary' && node.asset.id === 'BOUNDARY-LENTEKHI-AGG') {
      node.asset = { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID };
      node.verification = 'documentation_reviewed';
    }
  }
  for (const lineage of data.fiberLineages ?? []) {
    if (lineage.origin.asset?.kind === 'boundary' && lineage.origin.asset.id === 'BOUNDARY-LENTEKHI-AGG') lineage.origin.asset = { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID };
    if (lineage.destination.asset?.kind === 'boundary' && lineage.destination.asset.id === 'BOUNDARY-LENTEKHI-AGG') lineage.destination.asset = { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID };
    if (lineage.origin.label.startsWith('Lentekhi')) lineage.origin.label = lineage.origin.label.replace('Lentekhi aggregation', 'ლენტეხის აგრეგაცია');
    if (lineage.destination.label.startsWith('Lentekhi')) lineage.destination.label = lineage.destination.label.replace('Lentekhi aggregation', 'ლენტეხის აგრეგაცია');
    for (const leg of lineage.legs) {
      if (leg.startNode.kind === 'boundary' && leg.startNode.id === 'BOUNDARY-LENTEKHI-AGG') leg.startNode = { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID };
      if (leg.endNode.kind === 'boundary' && leg.endNode.id === 'BOUNDARY-LENTEKHI-AGG') leg.endNode = { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID };
      const fiber = data.fibers.find(item => item.cableId === leg.segmentId && item.number === leg.fiberNumber);
      const tube = fiber ? data.tubes.find(item => item.id === fiber.tubeId) : undefined;
      if (fiber && tube) { leg.tubeId = tube.id; leg.tubeNumber = tube.number; leg.tubeColor = tube.physicalColor; leg.fiberColor = fiber.physicalColor; }
    }
    for (const transition of lineage.transitions) if (transition.node.kind === 'boundary' && transition.node.id === 'BOUNDARY-LENTEKHI-AGG') transition.node = { kind: 'aggregation', id: LENTEKHI_AGGREGATION_ID };
  }
  for (const document of data.sourceDocuments ?? []) {
    document.importedAssetIds = document.importedAssetIds.map(item => item === 'aggregation:LENTEKHI-CONFLICT' ? `aggregation:${LENTEKHI_AGGREGATION_ID}` : item);
    document.externalBoundaryIds = document.externalBoundaryIds.filter(item => item !== 'BOUNDARY-LENTEKHI-AGG');
    document.counts.externalContinuations = document.externalBoundaryIds.length;
    const construction = document.completeness.find(item => item.id === 'construction');
    if (construction) {
      construction.state = 'complete'; construction.known = 20; construction.total = 20;
      construction.summary = 'All 20 source Segment marker banks have decoded Tube and Fiber physical colors under the bounded page convention.';
    }
    const ports = document.completeness.find(item => item.id === 'port_topology');
    if (ports) {
      ports.state = 'partial'; ports.known = 144; ports.total = 336;
      ports.summary = 'All 144 AP Ports have source-oriented Fiber context; exact Tsageri ODF-to-Fiber terminations and AP internal operations remain unresolved.';
    }
  }
}

export function lineageVisitsAP(lineage: FiberLineage, apId: string): boolean {
  return lineage.origin.asset?.kind === 'ap' && lineage.origin.asset.id === apId
    || lineage.destination.asset?.kind === 'ap' && lineage.destination.asset.id === apId
    || lineage.legs.some(item => item.startNode.kind === 'ap' && item.startNode.id === apId || item.endNode.kind === 'ap' && item.endNode.id === apId);
}

export const apPortFlow = (data: Inventory, accessPointId: string, portNumber: number) =>
  data.apPortFlows?.find(item => item.accessPointId === accessPointId && item.portNumber === portNumber);
export const apFlowProfile = (data: Inventory, accessPointId: string) => data.apFlowProfiles?.find(item => item.accessPointId === accessPointId);

export function validateIteration19(data: Inventory): string[] {
  const errors: string[] = [];
  for (const ap of data.accessPoints) {
    const ports = (data.apPortFlows ?? []).filter(item => item.accessPointId === ap.id);
    if (ports.length !== ap.portCount) errors.push(`AP${ap.id} has ${ports.length}/${ap.portCount} AP Port Flow records.`);
    if (ports.some(item => item.commercialAvailability === 'available' && item.physicalUsage === 'unused')) errors.push(`AP${ap.id} infers availability from unused state.`);
    if (ports.some(item => item.internalContinuation !== 'unknown')) errors.push(`AP${ap.id} classifies an unsupported internal operation.`);
  }
  const p16 = apPortFlow(data, '41', 16);
  if (!p16?.roles.includes('ingress') || !p16.roles.includes('return')) errors.push('AP41 Port16 overlap is missing.');
  if (data.physicalColorCoverage?.length !== 20) errors.push('Physical color coverage does not contain all 20 source segments.');
  if (data.fiberLineages?.length !== 68) errors.push('Fiber Lineage count changed.');
  if (data.cableRoutes?.find(item => item.id === 'ROUTE-TSAGERI-LENTEKHI-CORE')?.destination.state !== 'known') errors.push('Lentekhi destination is not known.');
  return errors;
}

export function applyIteration19(data: Inventory): Inventory {
  applyPhysicalConstruction(data);
  canonicalizeLentekhi(data);
  buildAPFlows(data);
  return data;
}

