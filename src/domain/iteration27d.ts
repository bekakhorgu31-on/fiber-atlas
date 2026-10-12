import projection from '../data/iteration27d-network-projection.json';
import ownerConfirmations from '../data/iteration27d-owner-confirmations.json';
import type { AssetRef, Cable, Connection, Fiber, Inventory, NetworkNode, NodeFiberTransition, PhysicalColorKey, SourceAnnotation, SourceNetworkDocument, SourceRef, Tube } from './types';
import { standardColor } from './colors';
import { rebuildFiberJourneySummaries } from './iteration20';
import { buildConnectionSheets } from './iteration22';

export const ITERATION27D_SOURCE_SHA256 = '419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d';
const DOCUMENT = 'SRC-TSAGERI-ALPANA-TVISHI-419DEF34';
type Projection = typeof projection;
const sourceData = projection as Projection;
const verifiedCounts = { labels: 22, fibers: 1512, candidates: 1151, exact: 775, duplicate: 376 };

function source(shapeIds: string[], rawValue?: string): SourceRef {
  return { file: 'Tsageri-Alpana-Tvishi.vsdx', page: 'სვანეთი', pageId: '4', part: 'visio/pages/page1.xml', shapeIds, rawValue, interpretationRule: 'tsageri-alpana-tvishi-marker-and-transition-candidate/2', note: 'Iteration 27D: exact source marker-bank construction and connector geometry.' };
}
function nodeRef(token: string, data: Inventory): AssetRef {
  if (token === '5' && data.aggregations.some(item => item.id === '5')) return { kind: 'aggregation', id: '5' };
  if (['205', '206', '216'].includes(token) && data.closures.some(item => item.id === token)) return { kind: 'closure', id: token };
  return { kind: 'network_node', id: token };
}
function color(key: string) { return standardColor(key as PhysicalColorKey, 'documented'); }
function sourceCableId(legacyId: string) { return `${DOCUMENT}-C${legacyId}`; }
function canonicalCable(data: Inventory, legacyId: string, label: string): Cable | undefined {
  const matches = data.cables.filter(item => item.legacyCableId === legacyId && item.legacyLabels.includes(label));
  return matches.length === 1 ? matches[0] : undefined;
}

/** Builds a candidate projection completely, validates its critical invariants, then returns it as one activation. */
export function applyIteration27D(input: Inventory): Inventory {
  const data = structuredClone(input) as Inventory;
  const rows = sourceData.cables;
  const allFibers = rows.reduce((sum, item) => sum + item.fiberCount, 0);
  const disposition = sourceData.transitionAccounting.dispositionCounts as Record<string, number>;
  if (sourceData.sourceSha256 !== ITERATION27D_SOURCE_SHA256 || rows.length !== verifiedCounts.labels || allFibers !== verifiedCounts.fibers || sourceData.transitions.length !== verifiedCounts.exact || disposition.exact_source_transition !== verifiedCounts.exact || disposition.duplicate_overlap_evidence !== verifiedCounts.duplicate || sourceData.transitionAccounting.candidateTransitions !== verifiedCounts.candidates || sourceData.transitionAccounting.unexplained !== 0) {
    throw new Error('Iteration 27D topology evidence failed its source/count integrity gate.');
  }

  const shared = new Set(['148', '149', '150', '151', '169']);
  const cableIds = new Map<string, string>();
  const sourceCableRows = new Map<string, (typeof rows)[number]>();
  const candidateCables: Cable[] = [];
  const candidateFibers: Fiber[] = [];
  const candidateTubes: Tube[] = [];
  const nodes = new Map<string, NetworkNode>();
  const sourceNodes = new Set(rows.flatMap(item => item.endpoints).filter(token => !(['5', '205', '206', '216'].includes(token))));
  for (const token of [...sourceNodes].sort((a, b) => Number(a) - Number(b))) {
    const id = token === '207' && data.networkNodes?.some(item => item.id === token) ? token : token;
    const shapeIds = [...new Set(rows.filter(row => row.endpoints.includes(token)).flatMap(row => row.sourceShapeIds))];
    nodes.set(token, { id, displayName: `Node ${token}`, sourceEndpointTokens: [token], assetType: 'unknown', verification: 'documentation_reviewed', source: source(shapeIds, token), notes: ['Physical endpoint identity is source-token based. Equipment type and owner display name are not established by this source.'] });
  }

  for (const row of rows) {
    sourceCableRows.set(row.legacyId, row);
    sourceCableRows.set(`C${row.legacyId}`, row);
    const existing = shared.has(row.legacyId) ? canonicalCable(data, row.legacyId, row.label) : undefined;
    if (shared.has(row.legacyId) && !existing) throw new Error(`Shared Cable C${row.legacyId} lacks a unique exact canonical match.`);
    const id = existing?.id ?? sourceCableId(row.legacyId);
    cableIds.set(row.legacyId, id);
    cableIds.set(`C${row.legacyId}`, id);
    if (existing) {
      if (existing.fiberCount !== row.fiberCount) throw new Error(`Shared Cable C${row.legacyId} capacity conflict.`);
      const representation = source(row.sourceShapeIds, row.label);
      existing.sourceRepresentations = [...(existing.sourceRepresentations ?? [existing.source]), representation];
      const sourceTubeIds = new Set(row.fibers.map(item => `${id}-T${String(item.tubeNumber).padStart(2, '0')}`));
      for (const tube of data.tubes.filter(item => sourceTubeIds.has(item.id))) tube.sourceRepresentations = [...(tube.sourceRepresentations ?? [tube.physicalEvidence?.source ?? existing.source]), representation];
      for (const fiber of data.fibers.filter(item => item.cableId === id)) fiber.sourceRepresentations = [...(fiber.sourceRepresentations ?? [fiber.physicalEvidence?.source ?? existing.source]), representation];
      if (row.legacyId === '151') {
        const priorEndpoint = existing.endpointB;
        const neutral: AssetRef = { kind: 'network_node', id: '207' };
        existing.endpointB = neutral;
        existing.routeNodes = existing.routeNodes.map(item => item.sequence === Math.max(...existing.routeNodes.map(node => node.sequence)) ? { ...item, asset: neutral, verification: 'documentation_reviewed', source: source(row.sourceShapeIds, row.label) } : item);
        const linked = nodes.get('207');
        if (linked) linked.notes.push(`Reconciles the prior ${priorEndpoint.kind}:${priorEndpoint.id} document-boundary alias to the exact shared C151 physical endpoint; Closure type/name remain unconfirmed.`);
      }
      continue;
    }
    const endpointA = nodeRef(row.endpoints[0], data), endpointB = nodeRef(row.endpoints[1], data);
    const ref = source(row.sourceShapeIds, row.label);
    candidateCables.push({
      id, recordType: 'cable_segment', legacyCableId: row.legacyId, legacyLabels: [row.label, `C${row.legacyId}`], fiberCount: row.fiberCount,
      endpointA, endpointB,
      routeNodes: [{ sequence: 0, asset: endpointA, accessType: 'unknown', verification: 'documentation_reviewed', source: ref }, { sequence: 1, asset: endpointB, accessType: 'unknown', verification: 'documentation_reviewed', source: ref }],
      routeCompleteness: 'endpoints_only', manufacturer: null, manufacturerVerification: 'needs_verification', model: null, productCode: null,
      cableType: null, constructionType: 'fiber_optic', tubeCount: Math.ceil(row.fiberCount / 12), colorScheme: 'source-specific decoded construction', territoryId: input.area.id,
      owner: { state: 'unknown' }, lengthM: null, verification: 'documentation_reviewed', notes: ['Source B identity is scoped to its source document. Cable number is not globally unique.'],
      source: ref, physicalCableId: null, physicalCondition: 'unknown', physicalConditionVerification: 'needs_verification',
      sourceRepresentations: [ref],
    });
    const fiberMap = new Map(row.fibers.map(item => [item.fiberNumber, item]));
    const tubeCount = Math.ceil(row.fiberCount / 12);
    for (let tubeNo = 1; tubeNo <= tubeCount; tubeNo++) candidateTubes.push({ id: `${id}-T${String(tubeNo).padStart(2, '0')}`, cableId: id, number: tubeNo, proposedNumber: null, physicalColor: color(fiberMap.get((tubeNo - 1) * 12 + 1)?.tubeColorKey ?? 'blue'), basis: 'documented', verification: 'documentation_reviewed', sourceRepresentations: [ref], physicalEvidence: { source: ref, ruleVersion: 'tsageri-alpana-tvishi-marker-and-transition-candidate/2', convention: 'Source B marker-bank ring color; source-specific, not used for continuity.', rawInnerColor: null, rawOuterColor: fiberMap.get((tubeNo - 1) * 12 + 1)?.tubeColorKey ?? null, warnings: [] } });
    for (const item of row.fibers) candidateFibers.push({
      id: `${id}-F${String(item.fiberNumber).padStart(3, '0')}`, cableId: id, number: item.fiberNumber, tubeId: `${id}-T${String(item.tubeNumber).padStart(2, '0')}`,
      physicalColor: color(item.fiberColorKey), proposedColor: null, positionInTube: item.positionInTube, proposedPositionInTube: null,
      allocation: 'unknown', condition: 'unknown', connectivity: 'unknown', verification: 'documentation_reviewed', rights: { state: 'unknown' }, service: { state: 'unknown' }, notes: ['Source B Fiber inventory; company, service and Port semantics were not inferred.'],
      sourceRepresentations: [ref],
      physicalEvidence: { source: ref, ruleVersion: 'tsageri-alpana-tvishi-marker-and-transition-candidate/2', convention: 'Fiber inner fill is local Fiber color; Tube ring is stored independently.', rawInnerColor: item.fiberColorKey, rawOuterColor: item.tubeColorKey, warnings: row.legacyId === '148' && item.fiberNumber >= 121 ? ['Source-specific Tube-color claim conflicts with frozen V1; both claims are preserved in the 27D conflict artifact.'] : [] },
    });
  }

  const addedNodeIds = new Set((data.networkNodes ?? []).map(item => item.id));
  data.networkNodes = [...(data.networkNodes ?? []), ...[...nodes.values()].filter(item => !addedNodeIds.has(item.id))];
  const agg5 = data.aggregations.find(item => item.id === '5');
  if (agg5) agg5.legacyIdentityClaims = [...(agg5.legacyIdentityClaims ?? []), { field: 'source_document_identity', value: 'Aagregacia #5 / cageri; reconciled by exact shared C148 and SC205 context; no ODF Port semantics implied', sourceShapeId: '12427' }];
  const promote207Alias = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    if (!Array.isArray(value) && (value as { kind?: string; id?: string }).kind === 'boundary' && (value as { id?: string }).id === 'BOUNDARY-SC207') {
      (value as { kind: string; id: string }).kind = 'network_node'; (value as { kind: string; id: string }).id = '207'; return;
    }
    for (const item of Array.isArray(value) ? value : Object.values(value)) promote207Alias(item);
  };
  promote207Alias(data.cableRoutes ?? []);
  promote207Alias(data.cableContinuations ?? []);
  data.cables = [...data.cables, ...candidateCables];
  data.tubes = [...data.tubes, ...candidateTubes];
  data.fibers = [...data.fibers, ...candidateFibers];

  const existingTransitions = data.nodeFiberTransitions ?? [];
  const transitions = [...existingTransitions];
  const connections = [...data.connections];
  const edgeKey = (node: AssetRef, aId: string, aF: number, zId: string, zF: number) => `${node.kind}:${node.id}|${[`${aId}/${aF}`, `${zId}/${zF}`].sort().join('|')}`;
  const knownEdges = new Map<string, NodeFiberTransition>();
  for (const item of transitions) if (item.z) knownEdges.set(edgeKey(item.node, item.a.segmentId, item.a.fiberNumber, item.z.segmentId, item.z.fiberNumber), item);
  const seenSourceEdges = new Set<string>();
  for (const item of sourceData.transitions) {
    const cableA = cableIds.get(item.segmentA), cableB = cableIds.get(item.segmentB), rowA = sourceCableRows.get(item.segmentA), rowB = sourceCableRows.get(item.segmentB);
    if (!cableA || !cableB || !rowA || !rowB) throw new Error(`Transition ${item.id} references an unprojected Cable.`);
    const atNodeA = item.node.replace(/^SC/, '');
    if (!rowA.endpoints.includes(atNodeA) || !rowB.endpoints.includes(atNodeA)) throw new Error(`Transition ${item.id} node is not an endpoint of both Cables.`);
    const node = nodeRef(atNodeA, data);
    const key = edgeKey(node, cableA, item.fiberA, cableB, item.fiberB);
    if (seenSourceEdges.has(key)) throw new Error(`Duplicate Source B local edge ${item.id}.`);
    seenSourceEdges.add(key);
    const existing = knownEdges.get(key);
    const sourceRef = source([item.connectorShape, item.markerShapeA, item.markerShapeB], item.id);
    if (existing) {
      existing.evidenceSources = [...(existing.evidenceSources ?? []), sourceRef];
      continue;
    }
    const side = (segmentId: string, fiberNumber: number, tubeNumber: number, tubeColor: string, fiberColor: string) => ({ segmentId, fiberNumber, tubeNumber, tubeColor: color(tubeColor), fiberColor: color(fiberColor) });
    const transition: NodeFiberTransition = {
      id: `27D-${item.id}`, node,
      a: side(cableA, item.fiberA, item.tubeA, item.tubeColorA, item.fiberColorA),
      z: side(cableB, item.fiberB, item.tubeB, item.tubeColorB, item.fiberColorB), port: null,
      transitionType: 'optical_continuation', operation: 'unknown', sourceGeometry: { context: `Connector Shape ${item.connectorShape}; endpoint marker Shapes ${item.markerShapeA} and ${item.markerShapeB}` },
      source: sourceRef, interpretationBasis: 'Exact source connector geometry with unique marker alignment at both endpoints. Route adjacency, number, and color are not transition keys.',
      projectionStatus: 'source_interpreted', active: true, notes: [],
    };
    transitions.push(transition); knownEdges.set(key, transition);
    const conn: Connection = {
      id: `27D-${item.id}`,
      a: { kind: 'fiber', cableId: cableA, fiber: item.fiberA, at: node }, z: { kind: 'fiber', cableId: cableB, fiber: item.fiberB, at: node },
      location: node, operation: 'unknown', verification: 'documentation_reviewed', approved: false, operationalStatus: 'authoritative', evidenceIds: [item.id], tray: null, source: sourceRef,
      inference: 'Source geometry directly supports local optical continuation; physical operation is not asserted.',
    };
    connections.push(conn);
  }
  let overlapEvidence = 0;
  for (const item of sourceData.overlapTransitions) {
    const cableA = cableIds.get(item.segmentA), cableB = cableIds.get(item.segmentB);
    if (!cableA || !cableB) throw new Error(`Overlap evidence ${item.id} references an unprojected Cable.`);
    const nodeToken = item.node.replace(/^SC/, '');
    const key = edgeKey(nodeRef(nodeToken, data), cableA, item.fiberA, cableB, item.fiberB);
    const canonical = knownEdges.get(key);
    if (!canonical) throw new Error(`Duplicate overlap evidence ${item.id} has no exact canonical transition to enrich.`);
    canonical.evidenceSources = [...(canonical.evidenceSources ?? []), source([item.connectorShape, item.markerShapeA, item.markerShapeB], item.id)];
    overlapEvidence++;
  }
  if (overlapEvidence !== verifiedCounts.duplicate) throw new Error(`Expected ${verifiedCounts.duplicate} overlap evidence records; found ${overlapEvidence}.`);
  data.nodeFiberTransitions = transitions;
  data.connections = connections;
  data.connectionSheets = buildConnectionSheets(data);
  rebuildFiberJourneySummaries(data);

  const annotations: SourceAnnotation[] = sourceData.annotations.map(item => ({
    id: `27D-${item.id}`, rawText: item.rawText, normalizedSummary: null,
    category: item.category === 'direction_annotation' ? 'direction' : item.category === 'source_instruction' ? 'instruction' : item.category === 'service_commercial_note' ? 'service_commercial_note' : item.category === 'technical_annotation' ? 'general' : item.category === 'capacity_note' ? 'construction_change' : 'general',
    scope: 'unresolved', sourceSha256: ITERATION27D_SOURCE_SHA256, source: source([item.sourceShapeId], item.rawText), sourceGeometry: item.geometry ? { width: item.geometry.width, height: item.geometry.height, context: `rotation=${item.rotation ?? 'unknown'}; groupPath=${JSON.stringify(item.groupPath ?? [])}` } : null,
    associatedAssets: [], associatedRouteIds: [], associatedRouteNodeIds: [], associatedOrganizationIds: [], associationState: 'unresolved', verification: 'needs_verification', warnings: [item.category === 'source_instruction' ? 'Source instruction; execution status is unknown.' : item.category === 'service_commercial_note' ? 'Organization occurrence preserved; no Fiber/Port/Cable-use assignment inferred.' : item.category === 'direction_annotation' ? 'Direction wording is annotation only and creates no Fiber edge.' : item.category === 'capacity_note' ? 'Raw capacity wording retained without independently creating Fiber records.' : 'Source annotation scope remains unresolved.'], importedAt: '2026-09-30', extractionRunId: 'ITERATION-27D-SOURCE-B', sourceMetadata: item as Record<string, unknown>,
  }));
  data.sourceAnnotations = [...(data.sourceAnnotations ?? []), ...annotations];
  if (data.sourceAnnotationReport) data.sourceAnnotationReport = { ...data.sourceAnnotationReport, totalCandidateTexts: data.sourceAnnotationReport.totalCandidateTexts + annotations.length, annotationIds: [...new Set(data.sourceAnnotations.map(item => item.id))] };
  data.sourceConflicts = [...(data.sourceConflicts ?? []), ...sourceData.sourceConflicts];

  const sourceDocument: SourceNetworkDocument = {
    id: DOCUMENT, title: 'Tsageri–Alpana–Tvishi', sourceFile: 'Tsageri-Alpana-Tvishi.vsdx', sourceSha256: ITERATION27D_SOURCE_SHA256,
    sourcePages: [{ id: '4', name: 'სვანეთი' }], reviewState: 'reviewed_no_change', importedAssetIds: [...new Set([...cableIds.values(), ...rows.flatMap(row => row.endpoints.map(token => { const ref = nodeRef(token, data); return `${ref.kind}:${ref.id}`; }))])], routeIds: [], externalBoundaryIds: [],
    counts: { aggregations: 0, closures: 0, cableSegments: rows.length, logicalFibers: allFibers, accessPointOdfAssets: 0, logicalOdfPorts: 0, routes: 0, externalContinuations: 0, unresolvedAssertions: 0, conflictingAssertions: 1 },
    completeness: [
      { id: 'inventory', label: 'Cable and Fiber inventory', state: 'complete', summary: '22 Cable labels and 1,512 Fiber positions accounted.', known: 22, total: 22 },
      { id: 'topology', label: 'Local optical topology', state: 'complete', summary: '775 exact transitions activated; 376 duplicate overlap proofs attached to canonical edges.', known: 1151, total: 1151 },
      { id: 'construction', label: 'Tube and Fiber construction', state: 'complete', summary: 'All Fiber positions decoded; C148 Tube-color conflict retained separately.', known: 1512, total: 1512 },
      { id: 'optical_mapping', label: 'Full end-to-end journeys', state: 'partial', summary: 'Source-local partial journeys are valid; no unsupported continuation is fabricated.', known: 0, total: 1512 },
      { id: 'port_topology', label: 'Port topology', state: 'not_present_in_source', summary: 'Port inventory and bindings are not established from this source.', known: 0, total: 0 },
    ],
    source: source([], 'Tsageri-Alpana-Tvishi.vsdx'), notes: [`CERTIFIED FOR NETWORK ACTIVATION from physical/optical source evidence; ${sourceData.textAccounting.meaningfulTextOccurrencesPreserved} meaningful source text occurrences accounted.`, 'Asset typing, logical Ports, company use and annotation scope remain non-blocking enrichment.'],
  };
  data.sourceDocuments = [...(data.sourceDocuments ?? []).filter(item => item.id !== DOCUMENT), sourceDocument];
  const errors = validateIteration27D(data);
  if (errors.length) throw new Error(`Iteration 27D activation rejected atomically: ${errors.join('; ')}`);
  return data;
}

export function validateIteration27D(data: Inventory): string[] {
  const errors: string[] = [];
  const doc = data.sourceDocuments?.find(item => item.id === DOCUMENT);
  const active = (data.nodeFiberTransitions ?? []).filter(item => item.active && item.id.startsWith('27D-'));
  const cables = data.cables.filter(item => item.id.startsWith(`${DOCUMENT}-C`));
  const fibers = data.fibers.filter(item => item.cableId.startsWith(`${DOCUMENT}-C`));
  if (!doc || doc.counts.cableSegments !== 22 || doc.counts.logicalFibers !== 1512 || cables.length !== 17 || doc.routeIds.length !== 0 && !doc.routeIds.every(id => (data.cableRoutes ?? []).some(route => route.id === id))) errors.push('Source document inventory activation is incomplete.');
  if (active.length !== 775 || fibers.length + data.cables.filter(item => ['148','149','150','151','169'].includes(item.legacyCableId) && !item.id.startsWith(`${DOCUMENT}-C`)).reduce((n, cable) => n + cable.fiberCount, 0) !== 1512) errors.push('Activated Source B transition/Fiber inventory totals are inconsistent.');
  if ((data.networkUseAssignments ?? []).some(item => item.id.startsWith('27D-')) || (data.portTopologyBindings ?? []).some(item => item.id.startsWith('27D-'))) errors.push('Iteration 27D must not invent company use or Port bindings.');
  if (data.cables.some(item => item.id === 'CAB-000172' && item.legacyLabels.includes('172-225-44-24'))) errors.push('Source-scoped C172 collided with frozen V1 C172.');
  if (sourceData.overlapTransitions.length !== 376 || (data.nodeFiberTransitions ?? []).reduce((sum, item) => sum + (item.evidenceSources?.filter(ref => ref.file === 'Tsageri-Alpana-Tvishi.vsdx').length ?? 0), 0) !== 376) errors.push('The 376 duplicate overlap proofs are not attached to canonical transition records.');
  if ((data.sourceAnnotations ?? []).filter(item => item.id.startsWith('27D-ORG-')).length !== 24 || (data.sourceAnnotations ?? []).filter(item => item.id.startsWith('27D-CUT-')).length !== 3) errors.push('Source organization/cut-note occurrences were not preserved.');
  if ((data.portTopologyBindings ?? []).filter(item => item.id.startsWith('27D-')).length !== 0 || (data.networkUseAssignments ?? []).filter(item => item.id.startsWith('27D-')).length !== 0) errors.push('Optional Ports/company assignments were fabricated.');
  return errors;
}

/** Owner typing enriches the same stable node ID; all Cable/transition references remain unchanged. */
export function enrichNetworkNode(data: Inventory, nodeId: string, enrichment: { assetType: Exclude<NetworkNode['assetType'], 'unknown'>; displayName: string; source: SourceRef }): Inventory {
  const target = data.networkNodes?.find(item => item.id === nodeId);
  if (!target) throw new Error(`Unknown physical node ${nodeId}.`);
  target.assetType = enrichment.assetType; target.displayName = enrichment.displayName; target.verification = 'documentation_reviewed';
  target.source = enrichment.source;
  return data;
}

export { ownerConfirmations };
