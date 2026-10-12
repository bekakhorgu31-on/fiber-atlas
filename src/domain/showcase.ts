import type { Cable, Inventory, ShowcaseCompletenessDimension, SourceNetworkDocument } from './types';

export const TSAGERI_SOURCE_DOCUMENT_ID = 'DOC-TSAGERI-LENTEKHI-2025';
export const TSAGERI_SOURCE_SHA256 = '51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a';

export interface SegmentConstructionAssessment {
  cableId: string;
  state: 'confirmed' | 'partial' | 'source_supported_candidate' | 'unknown';
  documentedTubeCount: number;
  candidateTubeCount: number;
  documentedFiberColors: number;
  proposedFiberColors: number;
  patternRecognized: boolean;
  summary: string;
  warnings: string[];
}

export function segmentConstructionAssessment(data: Inventory, cable: Cable): SegmentConstructionAssessment {
  const tubes = data.tubes.filter(item => item.cableId === cable.id);
  const documentedTubes = tubes.filter(item => item.basis === 'documented');
  const candidateTubes = tubes.filter(item => item.basis === 'provisional');
  const fibers = data.fibers.filter(item => item.cableId === cable.id);
  const documentedFiberColors = fibers.filter(item => item.physicalColor.basis === 'documented').length;
  const proposedFiberColors = fibers.filter(item => item.proposedColor?.basis === 'proposed_standard').length;
  const complete = documentedTubes.length > 0 && documentedFiberColors === cable.fiberCount;
  const partial = documentedTubes.length > 0 || documentedFiberColors > 0;
  const candidate = !partial && (candidateTubes.length > 0 || proposedFiberColors > 0);
  const state = complete ? 'confirmed' : partial ? 'partial' : candidate ? 'source_supported_candidate' : 'unknown';
  const summary = complete
    ? `${documentedTubes.length} tubes × ${Math.floor(cable.fiberCount / documentedTubes.length)} fibers; tube and fiber colors documented.`
    : partial
      ? `${documentedFiberColors} of ${cable.fiberCount} fiber colors and ${documentedTubes.length} tube group${documentedTubes.length === 1 ? '' : 's'} documented.`
      : candidate
        ? 'A provisional 12-position pattern exists, but current-source physical construction is not established.'
        : `${cable.fiberCount} logical fibers; tube construction is not established from this source.`;
  return {
    cableId: cable.id,
    state,
    documentedTubeCount: documentedTubes.length,
    candidateTubeCount: candidateTubes.length,
    documentedFiberColors,
    proposedFiberColors,
    patternRecognized: complete || partial || candidate,
    summary,
    warnings: complete ? [] : ['Do not treat proposed colors, equal capacity or adjacent route position as physical construction evidence.'],
  };
}

export function showcaseCompleteness(data: Inventory): ShowcaseCompletenessDimension[] {
  const construction = data.cables.map(cable => segmentConstructionAssessment(data, cable));
  const constructionKnown = construction.filter(item => item.state === 'confirmed' || item.state === 'partial').length;
  const authoritativeConnections = data.connections.filter(item => item.operationalStatus === 'authoritative' || item.review?.state === 'accepted').length;
  const exactTerminations = data.fiberTerminations?.length ?? 0;
  const ports = data.odfPorts?.length ?? 0;
  return [
    { id: 'inventory', label: 'Inventory coverage', state: 'complete', summary: 'Every source-supported asset and meaningful annotation on this page is accounted for.', known: 20 + 12 + 6 + 2, total: 20 + 12 + 6 + 2 },
    { id: 'topology', label: 'Topology interpretation', state: 'partial', summary: 'The main route, documented branches and external boundaries are represented; physical operations remain unresolved.', known: data.cableRoutes?.length ?? 0, total: data.cableRoutes?.length ?? 0 },
    { id: 'construction', label: 'Physical construction', state: 'partial', summary: 'C172 is confirmed and C173 is partial; other Segment construction remains candidate or unknown.', known: constructionKnown, total: data.cables.length },
    { id: 'optical_mapping', label: 'Optical mapping', state: 'partial', summary: 'Reviewed strand relationships are preserved; most logical fibers have no exact accepted continuation.', known: authoritativeConnections, total: data.connections.length },
    { id: 'port_topology', label: 'Port topology', state: exactTerminations ? 'partial' : 'unresolved', summary: exactTerminations ? 'Some exact terminations are established.' : 'Port ranges are reviewed, but exact Port-to-Fiber terminations are not established from this source.', known: exactTerminations, total: ports },
  ];
}

export function buildTsageriSourceDocument(data: Inventory): SourceNetworkDocument {
  const assertions = data.assertions ?? [];
  return {
    id: TSAGERI_SOURCE_DOCUMENT_ID,
    title: 'Tsageri–Lentekhi Network',
    sourceFile: 'Tsageri-Lentekhi 2025.vsdx',
    sourceSha256: TSAGERI_SOURCE_SHA256,
    sourcePages: [{ id: '4', name: 'ცაგერი-ლენტეხი' }],
    reviewState: 'reviewed_no_change',
    importedAssetIds: [
      ...data.aggregations.map(item => `aggregation:${item.id}`),
      ...data.closures.map(item => `closure:${item.id}`),
      ...data.accessPoints.map(item => `ap:${item.id}`),
      ...data.cables.map(item => `segment:${item.id}`),
      ...(data.odfs ?? []).map(item => `odf:${item.id}`),
    ],
    routeIds: (data.cableRoutes ?? []).map(item => item.id),
    externalBoundaryIds: (data.externalBoundaries ?? []).map(item => item.id),
    counts: {
      aggregations: data.sourceCounts.aggregations,
      closures: data.sourceCounts.closures,
      cableSegments: data.sourceCounts.cables,
      logicalFibers: data.fibers.length,
      accessPointOdfAssets: data.sourceCounts.accessPoints,
      logicalOdfPorts: data.odfPorts?.length ?? 0,
      routes: data.cableRoutes?.length ?? 0,
      externalContinuations: data.externalBoundaries?.length ?? 0,
      unresolvedAssertions: assertions.filter(item => item.operationalStatus === 'unresolved').length,
      conflictingAssertions: assertions.filter(item => item.operationalStatus === 'conflicting').length,
    },
    completeness: showcaseCompleteness(data),
    source: { file: 'Tsageri-Lentekhi 2025.vsdx', page: 'ცაგერი-ლენტეხი', pageId: '4', part: 'visio/pages/page1.xml', shapeIds: [], interpretationRule: 'tsageri-lentekhi-showcase/1' },
    notes: [
      'This document is a source and review boundary, not an identity namespace for network assets.',
      'Future regional documents may add evidence to the same canonical assets or link through External Documentation Boundaries.',
    ],
  };
}

export function applyIteration15Showcase(data: Inventory): Inventory {
  data.externalBoundaries = (data.externalBoundaries ?? []).map(boundary => ({
    ...boundary,
    currentSourceDocumentId: TSAGERI_SOURCE_DOCUMENT_ID,
    externalDirectionKey: boundary.id === 'BOUNDARY-SC207' ? 'alpana-tvishi-ambrolauri' : 'lentekhi-aggregation',
    nextSourceDocumentId: null,
    boundaryAssetId: null,
    status: boundary.id === 'BOUNDARY-LENTEKHI-AGG' ? 'conflicting' : 'unresolved_document',
    evidenceIds: (data.evidenceRecords ?? []).filter(item => item.affectedIds.includes(boundary.id)).map(item => item.id),
    reviewState: boundary.id === 'BOUNDARY-LENTEKHI-AGG' ? 'disputed' : 'needs_review',
    notes: [...boundary.notes, boundary.id === 'BOUNDARY-SC207' ? 'Current document ends here for this direction. The regional continuation can be linked when its source document is imported.' : 'The boundary remains usable while the canonical aggregation identity is conflicting.'],
  }));
  data.sourceDocuments = [buildTsageriSourceDocument(data)];
  return data;
}

export function findSourceDocument(data: Inventory, id: string): SourceNetworkDocument | undefined {
  return data.sourceDocuments?.find(item => item.id === id);
}
