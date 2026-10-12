export type Verification = 'imported' | 'documentation_reviewed' | 'field_verified' | 'conflicting' | 'needs_verification';
export type Allocation = 'unallocated' | 'reserved' | 'assigned' | 'unknown';
export type Condition = 'serviceable' | 'damaged' | 'blocked' | 'suspect' | 'unknown';
export type RouteCondition = 'serviceable' | 'damaged' | 'broken' | 'suspect' | 'unknown';
export type Connectivity = 'spliced' | 'continuity' | 'terminated' | 'unconnected' | 'parked' | 'passive_branch' | 'unknown';
export type AssetKind = 'closure' | 'ap' | 'odf' | 'aggregation' | 'site' | 'boundary' | 'network_node';
export interface AssetRef { kind: AssetKind; id: string }
export interface SourceRef {
  documentId?: string;
  sourceRevision?: string;
  importRunId?: string;
  sourceSha256?: string;
  file: string;
  page: string;
  shapeIds: string[];
  pageId?: string;
  part?: string;
  rawValue?: string;
  interpretationRule?: string;
  note?: string;
}
export type EvidenceBasis = 'source_document' | 'source_geometry' | 'owner_confirmation' | 'engineer_review' | 'field_verification' | 'external_system' | 'measurement' | 'derived' | 'unknown';
export type ClaimReviewState = 'unreviewed' | 'reviewed_no_change' | 'corrected' | 'rejected' | 'needs_review' | 'disputed' | 'superseded';
export type OperationalStatus = 'authoritative' | 'candidate' | 'unresolved' | 'conflicting' | 'historical' | 'not_applicable';
export type AssertionEntityType = 'cable_segment' | 'cable_continuation' | 'closure' | 'access_point' | 'aggregation' | 'fiber' | 'connection' | 'physical_cable' | 'port_range' | 'annotation' | 'external_boundary' | 'organization';
export interface EvidenceRecord {
  readonly id: string;
  basis: EvidenceBasis;
  summary: string;
  source: SourceRef | null;
  recordedAt: string;
  recordedBy: string | null;
  affectedIds: string[];
  fieldVerified: boolean;
  notes: string[];
}
export interface AssertionRecord {
  readonly id: string;
  entityType: AssertionEntityType;
  subjectId: string;
  claimType: string;
  value: string | number | boolean | null | Record<string, unknown>;
  evidenceIds: string[];
  reviewState: ClaimReviewState;
  operationalStatus: OperationalStatus;
  fieldVerified: boolean;
  supersedesAssertionId: string | null;
  warnings: string[];
  routeOrDirection: string | null;
  locationId: string | null;
  sourcePage: string;
  version: number;
}
export type AssertionReviewAction = 'confirm_interpretation' | 'correct_interpretation' | 'mark_authoritative' | 'keep_candidate' | 'mark_unresolved' | 'reject_interpretation' | 'mark_disputed' | 'supersede';
export interface AssertionReviewEvent { readonly id: string; assertionId: string; reviewer: string; timestamp: string; previousAssertion: unknown; newAssertion: unknown; action: AssertionReviewAction; rationale: string; evidenceIds: string[]; revision: number }
export interface AssertionGroup { readonly id: string; title: string; memberAssertionIds: string[]; sourcePattern: string; containsConflict: boolean; reviewState: ClaimReviewState; notes: string[] }
export type ExternalContinuationStatus = 'unresolved_document' | 'document_known_not_imported' | 'linked' | 'conflicting';
export interface ExternalDocumentationBoundary {
  readonly id: string;
  directionLabel: string;
  sourceFile: string;
  sourcePage: string;
  currentSourceDocumentId: string;
  externalDirectionKey: string;
  likelyContinuationName: string | null;
  nextSourceDocumentId: string | null;
  linkedRouteId: string | null;
  boundaryAssetId: string | null;
  originatingNode?: AssetRef | null;
  status: ExternalContinuationStatus;
  evidenceIds: string[];
  reviewState: ClaimReviewState;
  source: SourceRef;
  notes: string[];
}
export type ShowcaseCompletenessState = 'complete' | 'partial' | 'unresolved' | 'not_present_in_source';
export interface ShowcaseCompletenessDimension {
  id: 'inventory' | 'topology' | 'construction' | 'optical_mapping' | 'port_topology' | 'ap_grammar' | 'port_occupancy' | 'company_use';
  label: string;
  state: ShowcaseCompletenessState;
  summary: string;
  known: number;
  total: number;
}
export interface SourceNetworkDocument {
  readonly id: string;
  title: string;
  sourceFile: string;
  sourceSha256: string;
  sourcePages: Array<{ id: string; name: string }>;
  reviewState: ClaimReviewState;
  importedAssetIds: string[];
  routeIds: string[];
  externalBoundaryIds: string[];
  counts: {
    aggregations: number;
    closures: number;
    cableSegments: number;
    logicalFibers: number;
    accessPointOdfAssets: number;
    logicalOdfPorts: number;
    logicalApPorts?: number;
    routes: number;
    externalContinuations: number;
    unresolvedAssertions: number;
    conflictingAssertions: number;
  };
  completeness: ShowcaseCompletenessDimension[];
  source: SourceRef;
  notes: string[];
}
export interface MigrationCoverage {
  sourceShapes: number; topLevelShapes: number; directTextShapes: number; comments: number; connectRows: number;
  meaningfulAnnotations: number; cableSegmentLabels: number; interpretedCableSegments: number; closures: number;
  aggregationContexts: number; accessPointOdfRecords: number; logicalPorts: number; logicalFibers: number;
  connectionAssertions: number; authoritativeAssertions: number; candidateAssertions: number; unresolvedAssertions: number;
  conflictingAssertions: number; rejectedOrNonOperational: number; unclassifiedMeaningfulText: number;
  structuredTextOccurrences: number; annotationOccurrences: number; layoutOccurrences: number; totalTextAndComments: number;
  notes: string[];
}
export interface ExternalReference {
  system: string;
  externalId: string;
  rawText?: string;
  url?: string | null;
  observedAt?: string | null;
  syncedAt?: string | null;
  source?: SourceRef;
}
export type SourceAnnotationCategory = 'direction' | 'construction_change' | 'added_asset' | 'planned_work' | 'completed_work' | 'investigation_issue' | 'fiber_mapping_note' | 'service_commercial_note' | 'operational_warning' | 'historical_note' | 'instruction' | 'general' | 'unknown';
export type SourceAnnotationScope = 'asset' | 'group_range' | 'route' | 'page_general' | 'unresolved';
export interface SourceGeometryContext { pinX?: number | null; pinY?: number | null; width?: number | null; height?: number | null; beginX?: number | null; beginY?: number | null; endX?: number | null; endY?: number | null; context?: string }
export interface SourceAnnotation {
  readonly id: string;
  rawText: string;
  normalizedSummary: string | null;
  category: SourceAnnotationCategory;
  scope: SourceAnnotationScope;
  sourceSha256: string;
  source: SourceRef;
  sourceGeometry: SourceGeometryContext | null;
  associatedAssets: AssetRef[];
  associatedRouteIds: string[];
  associatedRouteNodeIds: string[];
  associatedOrganizationIds: string[];
  associationState: 'confirmed' | 'candidate' | 'unresolved';
  verification: Verification;
  warnings: string[];
  importedAt: string;
  extractionRunId: string;
  /** Lossless source-specific annotation interpretation payload (geometry/group/nearby evidence/status). */
  sourceMetadata?: Record<string, unknown>;
}
export interface SourceAnnotationReport {
  directTextShapes: number;
  uniqueDirectTexts: number;
  commentEntries: number;
  totalCandidateTexts: number;
  associated: number;
  groupAssociated: number;
  routeAssociated: number;
  pageGeneral: number;
  unresolvedAssociation: number;
  deliberatelyIgnored: number;
  structuredSourceTexts: number;
  annotationIds: string[];
  notes: string[];
}
export interface KnownRef { state: 'unknown' | 'known' | 'none'; id?: string }
export type PhysicalColorKey = 'blue' | 'orange' | 'green' | 'brown' | 'slate' | 'white' | 'red' | 'black' | 'yellow' | 'violet' | 'rose' | 'aqua';
export interface PhysicalColor { key?: PhysicalColorKey | null; nameKa: string | null; nameEn: string | null; hex: string | null; basis: 'unknown' | 'documented' | 'proposed_standard'; verification: Verification }
export interface PhysicalAttributeEvidence {
  source: SourceRef;
  ruleVersion: string;
  convention: string;
  rawInnerColor?: string | null;
  rawOuterColor?: string | null;
  warnings: string[];
}
export interface RouteNode { sequence: number; asset: AssetRef; accessType: 'unknown' | 'pass_through' | 'opened' | 'terminated'; verification: Verification; source?: SourceRef }
/** A documented span between two typed endpoints. It is not a whole physical cable. */
export interface CableSegment {
  readonly id: string;
  readonly recordType?: 'cable_segment';
  legacyCableId: string;
  legacyLabels: string[];
  fiberCount: number;
  endpointA: AssetRef;
  endpointB: AssetRef;
  routeNodes: RouteNode[];
  routeCompleteness: 'endpoints_only' | 'ordered_documented';
  manufacturer: string | null;
  manufacturerVerification: Verification;
  model: string | null;
  productCode: string | null;
  cableType: string | null;
  constructionType: string | null;
  tubeCount: number | null;
  colorScheme: string | null;
  territoryId: string;
  owner: KnownRef;
  lengthM: number | null;
  verification: Verification;
  notes: string[];
  source: SourceRef;
  /** Optional future parent. Absence must not be interpreted as a shared physical cable. */
  physicalCableId?: string | null;
  /** Physical segment condition is independent from fiber allocation and service state. */
  physicalCondition?: RouteCondition;
  physicalConditionVerification?: Verification;
  externalReferences?: ExternalReference[];
  sourceRepresentations?: SourceRef[];
}
/** Compatibility alias retained for existing routes and stored pilot records. */
export type Cable = CableSegment;
export interface Tube { id: string; cableId: string; number: number | null; proposedNumber: number | null; physicalColor: PhysicalColor; basis: 'provisional' | 'documented'; verification: Verification; physicalEvidence?: PhysicalAttributeEvidence; sourceRepresentations?: SourceRef[] }
export interface Fiber {
  id: string; cableId: string; number: number; tubeId: string | null;
  physicalColor: PhysicalColor; proposedColor: PhysicalColor | null;
  positionInTube: number | null; proposedPositionInTube: number | null;
  allocation: Allocation; condition: Condition; connectivity: Connectivity; verification: Verification;
  rights: KnownRef; service: KnownRef; notes: string[]; physicalEvidence?: PhysicalAttributeEvidence; sourceRepresentations?: SourceRef[];
}
export interface Closure { id: string; territoryId: string; role: string; model: string; mounting: string | null; coordinatesRaw: string; latitude?: number; longitude?: number; owner: KnownRef; verification: Verification; notes: string[]; lastApprovedChange: string | null; lastVerified: string | null; source: SourceRef; contextOnly: boolean; externalReferences?: ExternalReference[]; sourceSymbolEvidence?: ClosureSymbolEvidence }
export interface AccessPoint { id: string; legacySymbol: 'ODF' | null; identityNote: string; aliases: string[]; name: string; portCount: number; verification: Verification; source: SourceRef; notes: string[]; owner: KnownRef; externalReferences?: ExternalReference[] }
export interface Aggregation { id: string; name: string; portCount: number | null; verification: Verification; source: SourceRef; contextOnly: boolean; owner: KnownRef; legacyIdentityClaims?: Array<{ field: string; value: string; sourceShapeId: string }>; externalReferences?: ExternalReference[] }
export type CableRouteTreatment = 'through' | 'cable_cut' | 'mid_span_access' | 'termination' | 'branch_point' | 'drop_to_ap' | 'aggregation_termination' | 'unknown';
export type CableRouteEndpoint =
  | { state: 'known'; asset: AssetRef; label: string; verification: Verification; source: SourceRef }
  | { state: 'unresolved'; label: string; candidateAssetLabel?: string; verification: Verification; source: SourceRef; warnings: string[] };
export interface CableRouteNode {
  id: string;
  sequence: number;
  asset: AssetRef | null;
  label: string;
  treatment: CableRouteTreatment;
  treatmentVerification: Verification;
  verification: Verification;
  source: SourceRef;
  warnings: string[];
}
export interface CableRouteLeg {
  id: string;
  sequence: number;
  fromNodeId: string;
  toNodeId: string;
  segmentId: string | null;
  relationship: 'segment' | 'documented_gap' | 'unresolved_leg';
  sourceLabel?: string | null;
  verification: Verification;
  source: SourceRef;
  warnings: string[];
}
export interface CableRouteBranch {
  id: string;
  fromNodeId: string;
  destination: AssetRef | null;
  segmentIds: string[];
  role: 'branch';
  branchKind?: 'asset_branch' | 'named_direction';
  sourceLabel?: string;
  targetDirectionText?: string | null;
  linkedRouteId?: string | null;
  destinationRole: 'ap_termination' | 'odf_termination' | 'site_termination' | 'external_direction' | 'unresolved';
  treatment: CableRouteTreatment;
  treatmentVerification: Verification;
  verification: Verification;
  source: SourceRef;
  warnings: string[];
}
/** Ordered operational/topological path. It is not a Cable Segment, Fiber Trace, or PhysicalCable identity. */
export interface CableRoute {
  readonly id: string;
  displayName: string;
  origin: CableRouteEndpoint;
  destination: CableRouteEndpoint;
  nodes: CableRouteNode[];
  legs: CableRouteLeg[];
  branches: CableRouteBranch[];
  condition: RouteCondition;
  conditionVerification: Verification;
  documentation: 'complete' | 'incomplete';
  verification: Verification;
  physicalCableId: string | null;
  allowCircular: boolean;
  source: SourceRef;
  warnings: string[];
  externalReferences?: ExternalReference[];
}
export interface Organization { id: string; name: string; aliases: string[]; annotationOnly: boolean; externalReferences?: ExternalReference[] }
export type InfrastructureRole = 'physical_infrastructure_owner' | 'cable_owner' | 'network_operator';
export interface InfrastructureRoleAssignment { id: string; subjectType: 'route' | 'cable_segment' | 'physical_cable' | 'asset'; subjectId: string; organizationId: string; role: InfrastructureRole; verification: Verification; source: SourceRef; notes: string[] }
export interface FiberRight { id: string; holderId: string; fiberId: string; category: 'lease' | 'iru' | 'allocation' | 'other' | 'unknown'; validFrom: string | null; validTo: string | null; verification: Verification }
export interface ServicePathElement { sequence: number; kind: 'fiber' | 'connection' | 'odf_port_face' | 'patch_cord' | 'passive_component' | 'endpoint'; refId: string; verification: Verification }
export interface Service { id: string; name: string; provider: KnownRef; customer: KnownRef; verification: Verification; kind?: 'l2' | 'other' | 'unknown'; path?: ServicePathElement[]; externalReferences?: ExternalReference[] }
export interface ServiceAssignment { id: string; fiberId: string; serviceId: string; verification: Verification }
export interface InternalUse { id: string; organizationId: string; fiberIds: string[]; serviceId: string | null; purpose: string | null; verification: Verification; source: SourceRef }
export interface Site { id: string; name: string; verification: Verification; source: SourceRef; externalReferences?: ExternalReference[] }
export interface ClosureCoordinateEvidence {
  rawCoordinateText: string;
  longitudeDms: { degrees: number; minutes: number; seconds: number; hemisphere: 'E' | 'W'; decimalDegrees: number } | null;
  latitudeDms: { degrees: number; minutes: number; seconds: number; hemisphere: 'N' | 'S'; decimalDegrees: number } | null;
  longitudeDecimalDegrees: number | null;
  latitudeDecimalDegrees: number | null;
  crs: string | null;
  source: SourceRef;
}
export interface ClosureSymbolEvidence {
  closureNumber: number;
  grammarId: string;
  sourceHash: string;
  coordinates: ClosureCoordinateEvidence;
  externalReferences: ExternalReference[];
  sourceRepresentation: {
    source: SourceRef;
    rootShapeId: string;
    childShapeIds: string[];
    numberShapeId: string;
    coordinateShapeId: string;
    externalReferenceShapeId: string;
    masterId: string;
    masterShapeId: string;
    masterChildShapeIds: string[];
    bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
    connectedCableEvidence: Array<{ legacyId: string; label: string; sourceShapeIds: string[]; endpointTokens: string[] }>;
    directConnectRows: Array<{ FromCell: string; FromPart: string; FromSheet: string; ToCell: string; ToPart: string; ToSheet: string }>;
  };
  evidenceBasis: EvidenceBasis[];
  ownerConfirmationId: string;
  verification: Verification;
  fieldVerified: false;
}
/** A source-proven physical junction whose equipment class may be progressively established from source symbol grammar. */
export interface NetworkNode { id: string; displayName: string; sourceEndpointTokens: string[]; assetType: 'unknown' | 'closure' | 'ap' | 'odf' | 'aggregation'; verification: Verification; source: SourceRef; notes: string[]; closureEvidence?: ClosureSymbolEvidence; apEvidence?: { grammarId:string; number:number; place:string; capacity:number; rootShapeId:string; source:SourceRef }; externalReferences?: ExternalReference[] }
export interface OpticalDistributionFrame { id: string; displayLabel: string; containedBy: AssetRef; vendor: string | null; model: string | null; panelCount: number | null; portCapacity: number | null; connectorType: string | null; status: 'active' | 'planned' | 'retired' | 'unknown'; verification: Verification; notes: string[]; source: SourceRef; externalReferences?: ExternalReference[] }
export interface OdfPanel { id: string; odfId: string; position: string; portStart: number | null; portEnd: number | null; connectorType: string | null; verification: Verification; source: SourceRef }
export type PortFace = 'front' | 'rear' | 'single';
export type PortPhysicalOccupancy = 'empty' | 'fiber_terminated' | 'patch_connected' | 'terminated_and_patched' | 'observed_occupied_unknown' | 'unknown';
export type PortAllocation = 'unallocated' | 'reserved' | 'assigned' | 'blocked' | 'unknown';
export type SourceRepresentationRole = 'internal_odf_port' | 'aggregation_boundary_port' | 'label_anchor' | 'other';
export interface SourceRepresentation { id: string; role: SourceRepresentationRole; source: SourceRef; geometry: SourceGeometryContext | null; style: { lineColor: string | null; fillColor: string | null }; groupShapeId: string | null; interpretationRule: string; reviewState: RelationshipReviewState }
export interface OdfPort { id: string; odfId: string; panelId: string | null; number: number; faceMode: 'single' | 'front_rear'; connectorType: string | null; physicalOccupancy: PortPhysicalOccupancy; allocation: PortAllocation; condition: RouteCondition; verification: Verification; source: SourceRef; sourceRepresentations: SourceRepresentation[]; externalReferences?: ExternalReference[] }
export type PortRangeDestination =
  | { type: 'named_direction'; name: string }
  | { type: 'asset'; asset: AssetRef; label: string }
  | { type: 'cable_route'; routeId: string; label: string };
export interface PortRangeAssignment { id: string; odfId: string; startPort: number; endPort: number; destination: PortRangeDestination; routeId: string | null; physicalCableId: string | null; continuity: 'direction_only' | 'stops_at_destination' | 'continues_on_route' | 'unresolved'; physicalConnection: 'known_range' | 'unknown'; verification: Verification; source: SourceRef; ownerConfirmed: boolean; notes: string[] }
export interface AccessPointPortRange { id: string; accessPointId: string; startPort: number; endPort: number; role: 'ingress' | 'egress' | 'transit' | 'unknown'; destination: PortRangeDestination; internalMapping: 'known' | 'unresolved'; verification: Verification; source: SourceRef; notes: string[] }
export interface PhysicalCableSegmentMembership { segmentId: string; sequence: number | null; state: 'accepted' | 'candidate' | 'unresolved'; verification: Verification; basis: string; source: SourceRef }
export type PhysicalCableEnd = { state: 'known'; asset: AssetRef; label: string } | { state: 'unresolved'; direction: string; label: string };
export interface PhysicalCable { id: string; displayLabel: string; endA: PhysicalCableEnd; endB: PhysicalCableEnd; segmentMemberships: PhysicalCableSegmentMembership[]; routeId: string | null; fiberCount: number | null; constructionType: string | null; owner: KnownRef; manufacturer: string | null; model: string | null; status: RouteCondition; verification: Verification; source: SourceRef; notes: string[] }
export interface PortFaceRef { kind: 'port_face'; portId: string; face: PortFace }
export interface FiberEndpointRef { kind: 'fiber_endpoint'; cableId: string; fiber: number; at: AssetRef }
export interface FiberTermination { id: string; fiber: FiberEndpointRef; port: PortFaceRef; terminationType: string | null; connectorType: string | null; pigtail: string | null; condition: RouteCondition; verification: Verification; source: SourceRef; notes: string[] }
export interface PatchCord { id: string; a: PortFaceRef; z: PortFaceRef; connectorA: string | null; connectorZ: string | null; label: string | null; lengthM: number | null; condition: RouteCondition; verification: Verification; source: SourceRef; installed: boolean | null; notes: string[] }
export type ExplicitTopologyEndpoint = FiberEndpointRef | PortFaceRef;
export type DistanceSourceType = 'manual' | 'external_system' | 'gis' | 'survey' | 'documentation' | 'otdr' | 'imported_legacy' | 'unknown';
export interface DistanceObservation { id: string; routeLegId: string | null; cableSegmentId: string | null; distanceM: number | null; originalValue: string | number | null; originalUnit: string | null; sourceType: DistanceSourceType; measurementMethod: string | null; externalReference: ExternalReference | null; observedAt: string | null; recordedAt: string; verification: Verification; source: SourceRef; note: string | null; resolution: 'preferred' | 'active' | 'superseded' | 'conflicting' }
export interface RouteDistanceSummary { state: 'complete' | 'partial' | 'unknown' | 'conflicting'; knownMeters: number | null; knownLegs: number; missingLegs: number; conflictingLegs: number }
export type OpticalEnd = { kind: 'fiber'; cableId: string; fiber: number; at: AssetRef } | { kind: 'port'; assetId: string; port: number; at: AssetRef } | { kind: 'asset'; asset: AssetRef; at: AssetRef };
export interface PassiveComponent { id: string; location: AssetRef; type: 'splitter' | 'coupler' | 'other'; verification: Verification; source: SourceRef }
export type RelationshipReviewState = 'accepted' | 'candidate' | 'conflicting' | 'unresolved';
export interface ConnectionReview {
  state: RelationshipReviewState;
  endpointAIdentity: Verification;
  endpointZIdentity: Verification;
  opticalConnectivity: Verification;
  operation: Verification;
  destinationAsset?: Verification;
  port?: Verification;
  candidatePort?: number | null;
  containment?: Verification;
  sourceSha256: string;
  reviewer: string;
  reviewedAt: string;
  basis: string;
  warnings: string[];
}
export interface Connection { id: string; a: OpticalEnd; z: OpticalEnd; location: AssetRef; operation: Connectivity; verification: Verification; approved: boolean; operationalStatus?: OperationalStatus; evidenceIds?: string[]; assertionId?: string; passiveComponentId?: string | null; tray: string | null; source: SourceRef; inference: string; review?: ConnectionReview }
export interface FiberNumberRange { startFiberNumber: number; endFiberNumber: number }
export type CableContinuationScope = 'whole_segment_bundle' | 'fiber_range' | 'tube_group' | 'individual_fiber' | 'unresolved_range';
export type CableContinuationMappingMode = 'same_number' | 'offset' | 'explicit' | 'unresolved';
export interface CableContinuationSegmentSide { kind: 'segment'; segmentId: string; fiberRange: FiberNumberRange; tubeId: string | null }
export interface CableContinuationAssetSide { kind: 'asset'; asset: AssetRef; fiberRange: null; tubeId: null }
export interface CableContinuationUnresolvedSide { kind: 'unresolved'; label: string; fiberRange: null; tubeId: null }
export type CableContinuationSide = CableContinuationSegmentSide | CableContinuationAssetSide | CableContinuationUnresolvedSide;
export interface CableContinuationFiberMapping {
  sourceFiberNumber: number;
  targetFiberNumber: number | null;
  operationalStatus: OperationalStatus;
  connectionId: string | null;
  evidenceIds: string[];
}
/**
 * Evidence-backed bundle continuity at one node. Sides are neutral source identities;
 * upstream/downstream is derived only inside a Cable Route and never changes Segment A/B.
 * This is not PhysicalCable membership and does not assert a shared sheath.
 */
export interface CableContinuation {
  readonly id: string;
  node: AssetRef;
  sideA: CableContinuationSide;
  sideZ: CableContinuationSide;
  mappingScope: CableContinuationScope;
  mappingMode: CableContinuationMappingMode;
  individualMappings: CableContinuationFiberMapping[];
  routeIds: string[];
  operation: Connectivity;
  operationalStatus: OperationalStatus;
  reviewState: ClaimReviewState;
  evidenceIds: string[];
  sourceConnectionIds: string[];
  source: SourceRef;
  warnings: string[];
}
export type PrototypeProjectionStatus = 'owner_confirmed' | 'source_interpreted' | 'source_ambiguous';
export interface FiberLineageEndpoint {
  asset: AssetRef | null;
  label: string;
  portNumber: number | null;
  fiberNumber: number | null;
}
export interface FiberLineageLeg {
  sequence: number;
  segmentId: string;
  sourceSegmentLabel: string;
  sourceOnly: boolean;
  fiberId: string | null;
  fiberNumber: number;
  tubeId: string | null;
  tubeNumber: number | null;
  tubeColor: PhysicalColor;
  fiberColor: PhysicalColor;
  startNode: AssetRef;
  endNode: AssetRef;
  source: SourceRef;
  basis: string;
  projectionStatus: PrototypeProjectionStatus;
}
export interface FiberLineageTransition {
  sequence: number;
  node: AssetRef;
  fromSegmentId: string | null;
  fromFiberNumber: number | null;
  toSegmentId: string | null;
  toFiberNumber: number | null;
  beforeTubeNumber: number | null;
  beforeTubeColor: PhysicalColor | null;
  beforeFiberColor: PhysicalColor | null;
  afterTubeNumber: number | null;
  afterTubeColor: PhysicalColor | null;
  afterFiberColor: PhysicalColor | null;
  operation: Connectivity;
  numberChanged: boolean;
  tubeChanged: boolean;
  fiberColorChanged: boolean;
  sourceGeometry: SourceGeometryContext | null;
  source: SourceRef;
  projectionStatus: PrototypeProjectionStatus;
  nodeFiberTransitionId?: string;
}
/** One logical strand journey. Local Fiber and Tube identities remain on each leg. */
export interface FiberLineage {
  topologyRevision?: string;
  projectionRole?: 'current' | 'historical';
  readonly id: string;
  routeId: string;
  origin: FiberLineageEndpoint;
  destination: FiberLineageEndpoint;
  legs: FiberLineageLeg[];
  transitions: FiberLineageTransition[];
  projectionStatus: PrototypeProjectionStatus;
  interpretationRule: string;
  source: SourceRef;
  warnings: string[];
  lifecycleStatus?: 'active' | 'superseded';
  endpointA?: FiberLineageEndpoint;
  endpointB?: FiberLineageEndpoint;
  supersededByIds?: string[];
  supersessionReason?: string | null;
}

export type NodeFiberTransitionType = 'optical_continuation' | 'branch_continuation' | 'ap_side_unresolved' | 'intentional_termination';
export interface NodeFiberTransitionSide {
  segmentId: string;
  fiberNumber: number;
  tubeNumber: number | null;
  tubeColor: PhysicalColor | null;
  fiberColor: PhysicalColor | null;
}
/** One source-supported local Fiber edge at one node; it is independent from route adjacency. */
export interface NodeFiberTransition {
  readonly id: string;
  node: AssetRef;
  a: NodeFiberTransitionSide;
  z: NodeFiberTransitionSide | null;
  port: { ownerType: 'odf' | 'ap'; ownerId: string; portNumber: number } | null;
  transitionType: NodeFiberTransitionType;
  operation: 'unknown' | 'continuity' | 'spliced' | 'terminated';
  sourceGeometry: SourceGeometryContext | null;
  source: SourceRef;
  interpretationBasis: string;
  projectionStatus: PrototypeProjectionStatus;
  active: boolean;
  notes: string[];
  /** Additional source-document evidence for a canonical transition; does not create another edge. */
  evidenceSources?: SourceRef[];
}

export interface FiberLineageAuditRecord {
  readonly id: string;
  previousLineageId: string;
  classification: 'preserved' | 'corrected' | 'superseded' | 'unresolved';
  oldPath: string[];
  correctedLineageIds: string[];
  correctedPath: string[];
  reason: string;
}
export interface PrototypePortMapping {
  readonly id: string;
  accessPointId: string;
  segmentId: string;
  fiberNumber: number;
  portNumber: number;
  physicalUsage: 'in_use' | 'unused' | 'unknown';
  administrativeAllocation: PortAllocation;
  commercialAvailability: 'available' | 'unavailable' | 'unknown';
  sourceAnnotationIds: string[];
  projectionStatus: PrototypeProjectionStatus;
  source: SourceRef;
}
export type APPortRole = 'ingress' | 'egress' | 'transit' | 'return' | 'local_termination' | 'unused' | 'unknown';
export type APPortPhysicalUsage = 'in_use' | 'unused' | 'unknown';
export interface APPortFlowSide {
  segmentId: string | null;
  fiberNumber: number | null;
  tubeNumber: number | null;
  tubeColor: PhysicalColor | null;
  fiberColor: PhysicalColor | null;
  direction: string;
}
/** Source-oriented AP port participation. Role, usage, allocation and availability are deliberately independent. */
export interface APPortFlow {
  readonly id: string;
  accessPointId: string;
  portNumber: number;
  incoming: APPortFlowSide | null;
  outgoing: APPortFlowSide | null;
  roles: APPortRole[];
  primaryRole: APPortRole;
  physicalUsage: APPortPhysicalUsage;
  administrativeAllocation: PortAllocation;
  commercialAvailability: 'available' | 'unavailable' | 'unknown';
  lineageIds: string[];
  internalContinuation: 'unknown';
  projectionStatus: PrototypeProjectionStatus;
  source: SourceRef;
  notes: string[];
}

export type PortTopologyOwnerType = 'odf' | 'ap';
export type PortTopologyRole = 'external_direction' | 'local_termination' | 'route_continuation' | 'ap_ingress' | 'ap_return' | 'aggregation_termination';
/** A reviewed logical Port-to-Fiber association. It does not imply a splice, patch cord or service. */
export interface PortTopologyBinding {
  readonly id: string;
  /** Existing canonical physical node; equipment enrichment never rewrites Cable endpoints. */
  canonicalNode?: AssetRef;
  ownerType: PortTopologyOwnerType;
  ownerId: string;
  portNumber: number;
  segmentId: string;
  fiberNumber: number;
  tubeNumber: number | null;
  tubeColor: PhysicalColor | null;
  fiberColor: PhysicalColor | null;
  role: PortTopologyRole;
  directionLabel: string;
  routeId: string | null;
  orientation: 'from_port' | 'to_port';
  lineageIds: string[];
  projectionStatus: PrototypeProjectionStatus;
  source: SourceRef;
  notes: string[];
}

export type FiberJourneyScope = 'full_lineage' | 'partial' | 'local_only' | 'external_boundary' | 'termination';
/** Maximum-known optical context for one inventory Fiber; uncertainty is an explicit stop, never a fabricated edge. */
export interface FiberJourneySummary {
  readonly id: string;
  fiberId: string;
  segmentId: string;
  fiberNumber: number;
  routeId: string | null;
  scope: FiberJourneyScope;
  lineageId: string | null;
  portBindingIds: string[];
  knownFrom: string;
  knownTo: string;
  stopReasonKa: string;
  projectionStatus: PrototypeProjectionStatus;
  source: SourceRef;
  transitionIds?: string[];
  pathSignature?: string;
  topologyRevision?: string;
}
export interface APPortDirectionGroup {
  id: string;
  accessPointId: string;
  startPort: number;
  endPort: number;
  role: APPortRole;
  labelKa: string;
  direction: string;
  projectionStatus: PrototypeProjectionStatus;
  notes: string[];
}
export interface APFlowProfile {
  accessPointId: string;
  incomingSegmentId: string;
  upstreamClosureId: string;
  routeOriginLabel: string;
  continuationState: 'owner_described_return' | 'known_end' | 'source_unresolved';
  sourceRule: string;
  directionGroups: APPortDirectionGroup[];
  source: SourceRef;
  notes: string[];
}
export interface SegmentPhysicalColorCoverage {
  segmentId: string;
  legacySegmentId: string;
  fiberCount: number;
  tubeCount: number;
  decodedFiberColors: number;
  decodedTubeColors: number;
  confidence: PrototypeProjectionStatus;
  groupShapeIds: string[];
  unresolved: string[];
}
export interface FiberUseAssignment {
  readonly id: string;
  organizationId: string;
  scope: 'fiber' | 'fiber_range' | 'segment' | 'lineage';
  fiberIds: string[];
  lineageIds: string[];
  segmentIds: string[];
  purpose: string | null;
  projectionStatus: PrototypeProjectionStatus;
  source: SourceRef;
  notes: string[];
}
export interface NetworkUseAssignment {
  readonly id: string;
  organizationId: string;
  scope: 'fiber' | 'fiber_range' | 'port' | 'port_range' | 'cable' | 'asset' | 'lineage' | 'general_note' | 'unresolved';
  portIds?: string[];
  cableIds?: string[];
  assetRefs?: AssetRef[];
  fibers: Array<{ segmentId: string; fiberNumber: number }>;
  fiberIds: string[];
  lineageIds: string[];
  sourceShapeIds: string[];
  occurrenceIds: string[];
  purpose: string | null;
  projectionStatus: PrototypeProjectionStatus;
  interpretationRule: string;
  source: SourceRef;
  notes: string[];
}
export type ConnectionBankEndpointType = 'cable_fiber' | 'odf_port' | 'ap_port' | 'unresolved' | 'termination';
export type PortOperationalStatus = 'in_use' | 'unused' | 'reserved' | 'unavailable' | 'unknown';
export interface ConnectionBankRow {
  readonly id: string;
  endpointType: ConnectionBankEndpointType;
  segmentId: string | null;
  fiberNumber: number | null;
  portOwnerType: PortTopologyOwnerType | null;
  portOwnerId: string | null;
  portNumber: number | null;
  tubeNumber: number | null;
  tubeColor: PhysicalColor | null;
  fiberColor: PhysicalColor | null;
  status: PortOperationalStatus;
  organizationUseIds: string[];
  label: string;
}
export interface ConnectionSheetRow {
  readonly id: string;
  left: ConnectionBankRow;
  right: ConnectionBankRow;
  nodeFiberTransitionId: string | null;
  portTopologyBindingId: string | null;
  state: 'exact' | 'termination' | 'unresolved' | 'unmapped';
  numberChanged: boolean;
  tubeChanged: boolean;
  fiberColorChanged: boolean;
  lineageIds: string[];
  evidenceLabel: string;
}
export interface ConnectionSheetBank {
  endpointType: ConnectionBankEndpointType;
  title: string;
  subtitle: string;
  segmentId: string | null;
  legacyCableId: string | null;
  sourceLabel: string | null;
  capacity: number;
}
export interface ConnectionSheet {
  readonly id: string;
  node: AssetRef;
  nodeLabel: string;
  relationshipLabel: string;
  routeId: string | null;
  leftBank: ConnectionSheetBank;
  rightBank: ConnectionSheetBank;
  rows: ConnectionSheetRow[];
  source: SourceRef;
  notes: string[];
}
export interface ClosurePhoto {
  readonly id: string;
  closureId: string;
  imageUrl: string;
  capturedDate: string | null;
  caption: string;
  angleType: 'overview' | 'tray' | 'label' | 'other';
  note: string;
  isPrimary: boolean;
  storageMode: 'session';
}
export interface Issue { id: string; title: string; description: string; action: string; state: 'open' | 'resolved' | 'legacy'; source: SourceRef; assetIds: string[] }
export type ImportCandidateKind = 'cable_segment' | 'closure' | 'access_point' | 'aggregation' | 'connection' | 'fiber_physical' | 'annotation';
export type ImportReviewState = 'unreviewed' | 'accepted' | 'corrected' | 'rejected' | 'unresolved' | 'conflict';
export interface ImportProvenance {
  sourceSha256: string;
  source: SourceRef;
  extractor: string;
  interpreter: string;
  evidenceMethod: 'property' | 'label_grammar' | 'geometry' | 'style' | 'annotation' | 'owner_confirmation';
}
export interface ImportReviewDecision {
  action: Exclude<ImportReviewState, 'unreviewed' | 'conflict'>;
  decidedAt: string;
  reviewer: string;
  correction?: string;
  note?: string;
}
export interface ImportCandidate {
  id: string;
  kind: ImportCandidateKind;
  naturalKey: string;
  title: string;
  summary: string;
  interpreted: Record<string, string | number | boolean | null>;
  reviewState: ImportReviewState;
  verification: Verification;
  provenance: ImportProvenance;
  warnings: string[];
  relatedIds: string[];
  decision?: ImportReviewDecision;
  acceptedRecordId?: string;
  acceptedFingerprint?: string;
}
export interface RawExtractionSummary {
  pages: number;
  allShapes: number;
  topLevelShapes: number;
  textShapes: number;
  localPropertyShapes: number;
  connectRows: number;
  comments?: number;
}
export interface ImportRun {
  id: string;
  sourceFile: string;
  sourceSha256: string;
  extractedAt: string;
  extractionMethod: string;
  rawArtifact: string;
  rawSummary: RawExtractionSummary;
  interpreter: string;
  candidates: ImportCandidate[];
  acceptedRecordIds: string[];
  conflicts: string[];
}
export interface PortTraceResult { portId: string; infrastructurePath: string[]; exactOpticalPath: string[]; stopped: boolean; stopCode: 'exact_mapping_unresolved' | 'no_assignment' | null; reason: string | null }
export interface ReferenceDatasetRecord { id: string; status: 'READY' | 'NOT_READY'; sourceFile: string; sourceSha256: string; importerVersion: string; geometryResolverVersion: string; interpreterVersion: string; generatedAt: string; ownerConfirmationRevision: string; pendingManualReview: number; fieldVerified: boolean; manifestPath: string; semanticCounts: Record<string, number> }
export interface Inventory { apPorts?: import('./iteration28d').CanonicalAPPort[]; sourceReviewCases?: import('./iteration28d').SourceReviewCase[]; fiberPathProjection?: import('./currentFiberPath').CurrentPathProjection; fiberUsageProjection?: import('./iteration28e').FiberUsageProjection; organizationNetworkProjection?: import('./iteration28f').OrganizationNetworkProjection; aggregationOperationalProjection?: import('./iteration28f').AggregationOperationalProjection; currentFiberLineages?: FiberLineage[]; area: { id: string; name: string }; cables: Cable[]; cableRoutes?: CableRoute[]; fibers: Fiber[]; tubes: Tube[]; closures: Closure[]; accessPoints: AccessPoint[]; aggregations: Aggregation[]; organizations: Organization[]; rights: FiberRight[]; services: Service[]; assignments: ServiceAssignment[]; connections: Connection[]; cableContinuations?: CableContinuation[]; nodeFiberTransitions?: NodeFiberTransition[]; connectionSheets?: ConnectionSheet[]; closurePhotos?: ClosurePhoto[]; fiberLineages?: FiberLineage[]; supersededFiberLineages?: FiberLineage[]; fiberLineageAudit?: FiberLineageAuditRecord[]; prototypePortMappings?: PrototypePortMapping[]; apPortFlows?: APPortFlow[]; apFlowProfiles?: APFlowProfile[]; portTopologyBindings?: PortTopologyBinding[]; fiberJourneySummaries?: FiberJourneySummary[]; physicalColorCoverage?: SegmentPhysicalColorCoverage[]; fiberUseAssignments?: FiberUseAssignment[]; networkUseAssignments?: NetworkUseAssignment[]; passiveComponents: PassiveComponent[]; issues: Issue[]; sourceCounts: { cables: number; closures: number; accessPoints: number; aggregations: number }; snapshot: string; importRuns?: ImportRun[]; sourceAnnotations?: SourceAnnotation[]; sourceAnnotationReport?: SourceAnnotationReport; infrastructureRoles?: InfrastructureRoleAssignment[]; internalUses?: InternalUse[]; sites?: Site[]; networkNodes?: NetworkNode[]; sourceConflicts?: Array<Record<string, unknown>>; odfs?: OpticalDistributionFrame[]; odfPanels?: OdfPanel[]; odfPorts?: OdfPort[]; portRangeAssignments?: PortRangeAssignment[]; accessPointPortRanges?: AccessPointPortRange[]; physicalCables?: PhysicalCable[]; fiberTerminations?: FiberTermination[]; patchCords?: PatchCord[]; distanceObservations?: DistanceObservation[]; evidenceRecords?: EvidenceRecord[]; assertions?: AssertionRecord[]; assertionGroups?: AssertionGroup[]; assertionReviewEvents?: AssertionReviewEvent[]; externalBoundaries?: ExternalDocumentationBoundary[]; migrationCoverage?: MigrationCoverage; sourceDocuments?: SourceNetworkDocument[]; referenceDataset?: ReferenceDatasetRecord }
export type Route = { view: 'place'; focus?:string; selection?:string; strand?:string; source?:string; query?:string; kind?:'places'|'cables'; page?:number; expanded?:string[]; limit?:number } | { view: 'dashboard' } | { view: 'engineer'; query?: string; report?: boolean } | { view: 'organization'; id: string; strand?: string; inspect?: string; mode?: 'footprint' | 'path' | 'network'; query?: string; collapsed?: string[] } | { view: 'document'; id: string } | { view: 'route'; id: string; selection?: string; collapsed?: string[]; target?: string; origin?: string; mode?: 'physical' | 'fiber'; context?: 'network' | 'route'; port?: number; inspect?: string; physicalPath?: string; overview?: boolean } | { view: 'cable'; id: string } | { view: 'closure'; id: string } | { view: 'fiber' | 'trace'; cableId: string; fiber: number } | { view: 'ap' | 'aggregation'; id: string } | { view: 'odf_port'; odfId: string; port: number } | { view: 'splice'; nodeKind: 'closure' | 'aggregation' | 'ap' | 'network_node'; nodeId: string; relationshipId?: string; focus?: string } | { view: 'review'; query?: string; revision?: string; runId?: string; source?: string; caseId?: string; category?: string; status?: 'all'|'open'|'reviewed'; group?: string; page?: number; coverage?: 'banks'|'annotations'|'raw_ports'|'local_links'|'aggregation_ports'|'construction'|'endpoints' } | { view: 'import'; runId?: string; shapeId?: string };
export interface Inventory { dataAvailability?: {mode:'database';networkRevision:string;deferredFields:string[]}; connectionSheetIndex?: Array<{id:string;node:AssetRef}> }
export interface ViewProps { data: Inventory; navigate: (route: Route, options?: {replace?: boolean}) => void }
export interface ConnectionRow { key: string; cableId: string; fiber: number; other: OpticalEnd | null; connection: Connection | null; record: Fiber; location: AssetRef }
export interface SearchResult { id: string; title: string; subtitle: string; category: string; route: Route; facts?: string[]; pathSummary?: string; details?: string[]; tubeColorHex?: string; fiberColorHex?: string; compactFormatted?: boolean }
export interface TraceStep { id: string; kind: 'cable' | 'connection' | 'asset' | 'port'; title: string; detail: string; verification: Verification; candidate: boolean; cableId?: string; fiber?: number; operation?: Connectivity; source?: SourceRef; route?: Route; relationshipState?: RelationshipReviewState }
export interface TraceStop { side: 'a' | 'b'; at: string; code: 'unapproved' | 'missing' | 'boundary' | 'ambiguous' | 'cycle' | 'terminal' | 'port_unknown' | 'limit' | 'route_unknown' | 'component' | 'conflicting'; message: string }
export interface TraceResult { steps: TraceStep[]; stops: TraceStop[]; includesCandidates: boolean; complete: boolean }



export interface Inventory {operatorPortCorrections?: import("./portCorrection").OperatorPortCorrection[]}
export interface Inventory {operatorImportReconciliations?: import('./portCorrection').ImportCorrectionReconciliation[]}
