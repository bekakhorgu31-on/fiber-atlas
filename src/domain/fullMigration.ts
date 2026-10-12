import fullPageJson from '../data/full-page-migration.json';
import type {
  AccessPoint, Aggregation, AssertionGroup, AssertionRecord, AssetRef, Cable, CableRoute,
  ClaimReviewState, Closure, EvidenceRecord, ExternalDocumentationBoundary, Fiber, Inventory,
  MigrationCoverage, OperationalStatus, SourceRef,
} from './types';

const RULE = 'tsageri-lentekhi-full-page/1';
const PAGE = 'ცაგერი-ლენტეხი';
const file = 'Tsageri-Lentekhi 2025.vsdx';
type SourceAsset = { id: string; address_raw: string; capacity_ports: number; legacy_symbol_type: 'ODF'; source: { shape_ids: string[] } };
type SourceClosure = { id: string; model: string; closure_role_raw: string; mounting_raw: string | null; coordinates_raw: string; normalized_coordinates?: { latitude: number; longitude: number }; source: { shape_ids: string[] } };
type SourceCable = { id: string; legacy_label: string; fiber_count: number; end_a: { id: string; kind: string }; end_z: { id: string; kind: string }; source: { shape_ids: string[] } };
type FullPageData = {
  sourceSha256: string;
  coverage: MigrationCoverage;
  sourceInventory: { closures: SourceClosure[]; accessPoints: SourceAsset[]; cables: SourceCable[] };
  evidenceRecords: EvidenceRecord[];
  assertions: AssertionRecord[];
  assertionGroups: AssertionGroup[];
  externalBoundaries: ExternalDocumentationBoundary[];
};
const data = fullPageJson as unknown as FullPageData;

const source = (shapeIds: string[], rawValue?: string): SourceRef => ({ file, page: PAGE, pageId: '4', part: 'visio/pages/page1.xml', shapeIds, rawValue, interpretationRule: RULE });
const unknownColor = () => ({ key: null, nameKa: null, nameEn: null, hex: null, basis: 'unknown' as const, verification: 'needs_verification' as const });
const endpoint = (item: { id: string; kind: string }): AssetRef => {
  if (item.kind === 'aggregation_point' && item.id === '6') return { kind: 'boundary', id: 'BOUNDARY-LENTEKHI-AGG' };
  if (item.kind === 'unresolved_boundary') return { kind: 'boundary', id: `BOUNDARY-SC${item.id}` };
  return { kind: item.kind === 'aggregation_point' ? 'aggregation' : item.kind === 'access_point' ? 'ap' : 'closure', id: item.id };
};

function segmentFromSource(item: SourceCable): Cable {
  const endpointA = endpoint(item.end_a), endpointB = endpoint(item.end_z);
  return {
    id: `CAB-${item.id.padStart(6, '0')}`, recordType: 'cable_segment', legacyCableId: item.id,
    legacyLabels: [item.legacy_label], fiberCount: item.fiber_count, endpointA, endpointB,
    routeNodes: [
      { sequence: 0, asset: endpointA, accessType: 'unknown', verification: endpointA.kind === 'boundary' ? 'conflicting' : 'documentation_reviewed', source: source(item.source.shape_ids, item.legacy_label) },
      { sequence: 1, asset: endpointB, accessType: 'unknown', verification: endpointB.kind === 'boundary' ? 'needs_verification' : 'documentation_reviewed', source: source(item.source.shape_ids, item.legacy_label) },
    ],
    routeCompleteness: 'endpoints_only', manufacturer: null, manufacturerVerification: 'needs_verification', model: null,
    productCode: null, cableType: null, constructionType: null, tubeCount: null, colorScheme: null,
    territoryId: 'tsageri-lentekhi', owner: { state: 'unknown' }, lengthM: null,
    verification: endpointA.kind === 'boundary' || endpointB.kind === 'boundary' ? 'needs_verification' : 'documentation_reviewed',
    physicalCableId: null, physicalCondition: 'unknown', physicalConditionVerification: 'needs_verification',
    notes: ['The source label establishes segment identity and logical fiber count.', endpointA.kind === 'boundary' || endpointB.kind === 'boundary' ? 'One endpoint is an explicit external/conflicting documentation boundary.' : 'Endpoint identity is documentation reviewed.', 'Physical construction, ownership, condition, distance and optical continuity remain separate claims.'],
    source: source(item.source.shape_ids, item.legacy_label), externalReferences: [],
  };
}

function fibersFor(segment: Cable): Fiber[] {
  return Array.from({ length: segment.fiberCount }, (_, index) => ({
    id: `${segment.id}-F${String(index + 1).padStart(3, '0')}`, cableId: segment.id, number: index + 1,
    tubeId: null, physicalColor: unknownColor(), proposedColor: null, positionInTube: null, proposedPositionInTube: null,
    allocation: 'unknown', condition: 'unknown', connectivity: 'unknown', verification: 'needs_verification',
    rights: { state: 'unknown' }, service: { state: 'unknown' },
    notes: ['Logical fiber identity exists from documented segment capacity; tube, color, condition, use and connectivity are not inferred.'],
  }));
}

function upsertClosures(inventory: Inventory) {
  for (const item of data.sourceInventory.closures) {
    const record: Closure = {
      id: item.id, territoryId: 'tsageri-lentekhi', role: item.closure_role_raw || 'უცნობია', model: item.model || 'უცნობია',
      mounting: item.mounting_raw, coordinatesRaw: item.coordinates_raw, latitude: item.normalized_coordinates?.latitude,
      longitude: item.normalized_coordinates?.longitude, owner: { state: 'unknown' }, verification: 'documentation_reviewed',
      notes: ['Identity, source properties and raw coordinates are documentation reviewed.', 'Coordinate datum/CRS and physical treatment remain unresolved; no cut, pass-through, splice or tray is inferred.'],
      lastApprovedChange: null, lastVerified: null, source: source(item.source.shape_ids, item.coordinates_raw), contextOnly: false, externalReferences: [],
    };
    const index = inventory.closures.findIndex(existing => existing.id === item.id);
    if (index >= 0) inventory.closures[index] = record; else inventory.closures.push(record);
  }
}

function upsertAccessPoints(inventory: Inventory) {
  for (const item of data.sourceInventory.accessPoints) {
    const record: AccessPoint = {
      id: item.id, legacySymbol: item.legacy_symbol_type, identityNote: 'The source uses an ODF stencil for an access-point record; exact AP/ODF containment remains unresolved.',
      aliases: [`ODF${item.id}`, `AP ${item.address_raw}`, item.address_raw], name: item.address_raw, portCount: item.capacity_ports,
      verification: 'documentation_reviewed', source: source(item.source.shape_ids, `ODF#${item.id} · ${item.address_raw} · ${item.capacity_ports}`),
      notes: ['Identity/place and displayed capacity are source-document facts.', 'No one-to-one port, fiber, patch or internal-continuity mapping is inferred.'], owner: { state: 'unknown' }, externalReferences: [],
    };
    const index = inventory.accessPoints.findIndex(existing => existing.id === item.id);
    if (index >= 0) inventory.accessPoints[index] = { ...record, notes: [...new Set([...record.notes, ...inventory.accessPoints[index].notes])] }; else inventory.accessPoints.push(record);
  }
}

const branchSource = (shape: string, raw: string) => source([shape], raw);
function expandRoutes(inventory: Inventory) {
  const core = inventory.cableRoutes?.find(route => route.id === 'ROUTE-TSAGERI-LENTEKHI-CORE');
  if (!core) throw new Error('Iteration 12 requires the reviewed core route');
  const additions = [
    { id: 'branch-sc205-ap41', fromNodeId: 'node-sc205', destination: { kind: 'ap', id: '41' } as AssetRef, segmentIds: ['CAB-000149'], sourceLabel: '149-205-41-24', destinationRole: 'ap_termination' as const, src: branchSource('14250', '149-205-41-24') },
    { id: 'branch-sc206-boundary207', fromNodeId: 'node-sc206', destination: { kind: 'boundary', id: 'BOUNDARY-SC207' } as AssetRef, segmentIds: ['CAB-000151'], sourceLabel: '151-206-207-144', destinationRole: 'external_direction' as const, src: branchSource('15772', '151-206-207-144') },
    { id: 'branch-sc219-ap52', fromNodeId: 'node-sc219', destination: { kind: 'ap', id: '52' } as AssetRef, segmentIds: ['CAB-000175'], sourceLabel: '175-219-52-24', destinationRole: 'ap_termination' as const, src: branchSource('35121', '175-219-52-24') },
  ];
  for (const item of additions) if (!core.branches.some(branch => branch.id === item.id)) core.branches.push({
    id: item.id, fromNodeId: item.fromNodeId, destination: item.destination, segmentIds: item.segmentIds, role: 'branch', branchKind: 'asset_branch',
    sourceLabel: item.sourceLabel, targetDirectionText: item.destination.kind === 'boundary' ? 'Alpana–Tvishi–Ambrolauri direction / SC207 boundary' : null,
    linkedRouteId: null, destinationRole: item.destinationRole, treatment: 'unknown', treatmentVerification: 'needs_verification',
    verification: item.destination.kind === 'boundary' ? 'needs_verification' : 'documentation_reviewed', source: item.src,
    warnings: ['Cable-label adjacency does not establish splice, pass-through or PhysicalCable membership.'],
  });
  const branchRoute: CableRoute = {
    id: 'ROUTE-SC224-TSANA-KHELEDI', displayName: 'SC224 → SC225 → წანაში / ხელედი',
    origin: { state: 'known', asset: { kind: 'closure', id: '224' }, label: 'SC224', verification: 'documentation_reviewed', source: branchSource('37984', '181-224-225-24') },
    destination: { state: 'known', asset: { kind: 'closure', id: '225' }, label: 'SC225 branch point', verification: 'documentation_reviewed', source: branchSource('37984', '181-224-225-24') },
    nodes: [
      { id: 'node-branch-sc224', sequence: 0, asset: { kind: 'closure', id: '224' }, label: 'SC224', treatment: 'unknown', treatmentVerification: 'needs_verification', verification: 'documentation_reviewed', source: branchSource('36985', 'SC224'), warnings: [] },
      { id: 'node-branch-sc225', sequence: 1, asset: { kind: 'closure', id: '225' }, label: 'SC225', treatment: 'branch_point', treatmentVerification: 'needs_verification', verification: 'documentation_reviewed', source: branchSource('37984', 'SC225'), warnings: ['Branch geometry does not establish internal splice or cut treatment.'] },
    ],
    legs: [{ id: 'leg-sc224-sc225-c181', sequence: 0, fromNodeId: 'node-branch-sc224', toNodeId: 'node-branch-sc225', segmentId: 'CAB-000181', relationship: 'segment', sourceLabel: '181-224-225-24', verification: 'documentation_reviewed', source: branchSource('37984', '181-224-225-24'), warnings: [] }],
    branches: [
      { id: 'branch-sc225-ap53', fromNodeId: 'node-branch-sc225', destination: { kind: 'ap', id: '53' }, segmentIds: ['CAB-000182'], role: 'branch', branchKind: 'asset_branch', sourceLabel: '182-225-53-24', targetDirectionText: null, linkedRouteId: null, destinationRole: 'ap_termination', treatment: 'unknown', treatmentVerification: 'needs_verification', verification: 'documentation_reviewed', source: branchSource('37907', '182-225-53-24'), warnings: [] },
      { id: 'branch-sc225-ap54', fromNodeId: 'node-branch-sc225', destination: { kind: 'ap', id: '54' }, segmentIds: ['CAB-000183'], role: 'branch', branchKind: 'asset_branch', sourceLabel: '183-225-54-24', targetDirectionText: null, linkedRouteId: null, destinationRole: 'ap_termination', treatment: 'unknown', treatmentVerification: 'needs_verification', verification: 'documentation_reviewed', source: branchSource('38438', '183-225-54-24'), warnings: [] },
    ],
    condition: 'unknown', conditionVerification: 'needs_verification', documentation: 'complete', verification: 'documentation_reviewed',
    physicalCableId: null, allowCircular: false, source: branchSource('37984', 'SC224 → SC225 → AP53/AP54'),
    warnings: ['This route groups source-supported segments; it does not assert a common physical sheath or internal splice mapping.'], externalReferences: [],
  };
  if (!inventory.cableRoutes?.some(route => route.id === branchRoute.id)) inventory.cableRoutes?.push(branchRoute);
}

export function applyIteration12FullMigration(inventory: Inventory): Inventory {
  inventory.externalBoundaries = structuredClone(data.externalBoundaries);
  const lentekhiConflict: Aggregation = { id: 'LENTEKHI-CONFLICT', name: 'ლენტეხი · AGG6 სათაური / property ID5', portCount: null, verification: 'conflicting', source: source(['36475', '37059'], 'Aagregacia #6 lentexi / Row_1=5'), contextOnly: true, owner: { state: 'unknown' }, externalReferences: [] };
  if (!inventory.aggregations.some(item => item.id === lentekhiConflict.id)) inventory.aggregations.push(lentekhiConflict);
  upsertClosures(inventory);
  upsertAccessPoints(inventory);
  for (const item of data.sourceInventory.cables) {
    const existing = inventory.cables.find(candidate => candidate.legacyCableId === item.id);
    if (existing) continue;
    const segment = segmentFromSource(item);
    inventory.cables.push(segment);
    inventory.fibers.push(...fibersFor(segment));
  }
  expandRoutes(inventory);
  inventory.connections.forEach(connection => {
    const authoritative = connection.review?.state === 'accepted' || connection.approved;
    connection.operationalStatus = authoritative ? 'authoritative' : connection.review?.state === 'conflicting' ? 'conflicting' : 'candidate';
    connection.assertionId = connection.source.shapeIds.includes('33098') ? 'AST-CONNECT-33098' : connection.id.includes('SC217') ? 'AST-CONNECT-SC217-TARGET' : connection.id.includes('AP51') ? 'AST-CONNECT-AP51-TARGET' : undefined;
    connection.evidenceIds = connection.assertionId ? ['EVD-ENGINEER-TARGET-PATH'] : connection.source.shapeIds.map(shapeId => `EVD-GEOMETRY-${shapeId}`).filter(id => data.evidenceRecords.some(item => item.id === id));
  });
  inventory.evidenceRecords = structuredClone(data.evidenceRecords);
  inventory.assertions = structuredClone(data.assertions);
  inventory.assertionGroups = structuredClone(data.assertionGroups);
  inventory.assertionReviewEvents = [];
  inventory.migrationCoverage = structuredClone(data.coverage);
  inventory.sourceCounts = { cables: 20, closures: 12, accessPoints: 6, aggregations: 2 };
  return inventory;
}

export const evidenceBasisLabels: Record<EvidenceRecord['basis'], string> = {
  source_document: 'Source document', source_geometry: 'Source geometry', owner_confirmation: 'Owner confirmation', engineer_review: 'Engineer review',
  field_verification: 'Field verification', external_system: 'External system', measurement: 'Measurement', derived: 'Derived', unknown: 'Unknown basis',
};
export const claimReviewLabels: Record<ClaimReviewState, string> = {
  unreviewed: 'Unreviewed', reviewed_no_change: 'Reviewed · no change', corrected: 'Corrected', rejected: 'Rejected', needs_review: 'Needs review', disputed: 'Disputed', superseded: 'Superseded',
};
export const operationalStatusLabels: Record<OperationalStatus, string> = {
  authoritative: 'Operationally authoritative', candidate: 'Candidate', unresolved: 'Unresolved', conflicting: 'Conflicting', historical: 'Historical', not_applicable: 'Not applicable',
};

export function reviewAssertion(assertion: AssertionRecord, action: 'confirm_interpretation' | 'mark_authoritative' | 'keep_candidate' | 'mark_unresolved' | 'reject_interpretation' | 'mark_disputed'): AssertionRecord {
  const mapping: Record<typeof action, { reviewState: ClaimReviewState; operationalStatus: OperationalStatus }> = {
    confirm_interpretation: { reviewState: 'reviewed_no_change', operationalStatus: assertion.operationalStatus },
    mark_authoritative: { reviewState: 'reviewed_no_change', operationalStatus: 'authoritative' },
    keep_candidate: { reviewState: 'reviewed_no_change', operationalStatus: 'candidate' },
    mark_unresolved: { reviewState: 'needs_review', operationalStatus: 'unresolved' },
    reject_interpretation: { reviewState: 'rejected', operationalStatus: 'not_applicable' },
    mark_disputed: { reviewState: 'disputed', operationalStatus: 'conflicting' },
  };
  return { ...assertion, ...mapping[action], version: assertion.version + 1 };
}
