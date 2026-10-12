import bindingJson from '../data/iteration24-port-bindings.json';
import occupancyJson from '../data/iteration24-port-occupancy.json';
import summaryJson from '../data/iteration24-fresh-summary.json';
import type { Inventory, PortTopologyBinding, SourceRef } from './types';
import { TSAGERI_ROUTE_ID } from './aggregationTopology';

export const ITERATION24_SOURCE_SHA256 = 'caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa';
export const ITERATION24_IMPORT_DATE = '2026-09-29';
export const ITERATION24_RULE = 'tsageri-lentekhi-source-fidelity/2';

type FreshBinding = {
  id: string; ownerType: 'odf' | 'ap'; ownerId: string; portNumber: number;
  legacySegmentId: string; fiberNumber: number; basis: string[]; sourceShapeIds: string[]; alignmentDelta: number;
};
type FreshPort = {
  ownerType: 'odf' | 'ap'; ownerId: string; portNumber: number;
  physicalUsage: 'in_use' | 'unused' | 'unknown'; sourceShapeIds: string[];
  rawFill: string | null; effectiveFill: string | null; fillPattern: string | null;
};

const bindings = (bindingJson as { bindings: FreshBinding[] }).bindings;
const occupancy = (occupancyJson as { ports: FreshPort[] }).ports;

function source(shapeIds: string[], note: string, rawValue?: string): SourceRef {
  return {
    file: 'Tsageri-Lentekhi 2025.vsdx', page: 'ცაგერი-ლენტეხი', pageId: '4', part: 'visio/pages/page1.xml',
    shapeIds, rawValue, interpretationRule: ITERATION24_RULE, note,
  };
}

function freshBindings(data: Inventory): PortTopologyBinding[] {
  return bindings.flatMap((item): PortTopologyBinding[] => {
    const cable = data.cables.find(candidate => candidate.legacyCableId === item.legacySegmentId);
    if (!cable) return [];
    const fiber = data.fibers.find(candidate => candidate.cableId === cable.id && candidate.number === item.fiberNumber);
    const tube = fiber ? data.tubes.find(candidate => candidate.id === fiber.tubeId) : undefined;
    const lineageIds = (data.fiberLineages ?? []).filter(lineage => lineage.lifecycleStatus !== 'superseded' && lineage.legs.some(leg => leg.segmentId === cable.id && leg.fiberNumber === item.fiberNumber)).map(lineage => lineage.id);
    return [{
      id: item.id, ownerType: item.ownerType, ownerId: item.ownerId, portNumber: item.portNumber,
      segmentId: cable.id, fiberNumber: item.fiberNumber, tubeNumber: tube?.number ?? null,
      tubeColor: tube?.physicalColor ?? null, fiberColor: fiber?.physicalColor ?? null,
      role: item.ownerType === 'ap' ? 'ap_ingress' : 'aggregation_termination',
      directionLabel: item.ownerType === 'ap' ? `AP${item.ownerId} ↔ C${item.legacySegmentId}` : `ლენტეხის ODF ↔ C${item.legacySegmentId}`,
      routeId: TSAGERI_ROUTE_ID, orientation: 'from_port', lineageIds,
      projectionStatus: 'source_interpreted',
      source: source(item.sourceShapeIds, `Port ${item.portNumber} aligns with C${item.legacySegmentId}/F${item.fiberNumber} in the fresh VSDX extraction.`, `${item.basis.join('+')} · Δx=${item.alignmentDelta}`),
      notes: ['Fiber number comes from the explicit marker/label identity and geometric alignment, not shape enumeration order.'],
    }];
  });
}

export function applyIteration24CertifiedSource(data: Inventory): Inventory {
  for (const item of summaryJson.inventory.cables) {
    const cable = data.cables.find(candidate => candidate.legacyCableId === item.legacySegmentId);
    if (!cable) continue;
    cable.fiberCount = item.capacity;
    cable.legacyLabels = [item.exactLabel, ...cable.legacyLabels.filter(label => label !== item.exactLabel)];
    cable.source = source([item.shapeId], `Cable Segment C${item.legacySegmentId} identity, endpoints and capacity were rediscovered from the fresh VSDX label.`, item.exactLabel);
    cable.notes = [...cable.notes.filter(note => !note.startsWith('Iteration 24 fresh identity')), `Iteration 24 fresh identity: ${item.exactLabel}.`];
  }
  for (const item of summaryJson.inventory.assetEvidence.closures) {
    const closure = data.closures.find(candidate => candidate.id === item.id);
    if (closure) closure.source = source(item.cableLabelShapeIds, `SC${item.id} was rediscovered from adjacent fresh Cable Segment endpoint labels.`, `SC${item.id}`);
  }
  for (const item of summaryJson.inventory.assetEvidence.accessPoints) {
    const ap = data.accessPoints.find(candidate => candidate.id === item.id);
    if (ap) ap.source = source([item.groupShapeId, ...item.labelShapeIds], `AP${item.id} and its 24-position Port graphic were rediscovered from the fresh VSDX group.`, `AP${item.id}`);
  }
  for (const item of summaryJson.inventory.assetEvidence.aggregations) {
    const aggregation = data.aggregations.find(candidate => candidate.id === item.id);
    if (aggregation) aggregation.source = source(item.cableLabelShapeIds, `${aggregation.name} was revalidated from the fresh endpoint Cable label.`, item.id);
  }
  data.portTopologyBindings = freshBindings(data);
  const status = new Map(occupancy.map(item => [`${item.ownerType}:${item.ownerId}:${item.portNumber}`, item]));
  data.apPortFlows = (data.apPortFlows ?? []).map(flow => {
    const item = status.get(`ap:${flow.accessPointId}:${flow.portNumber}`);
    return item ? { ...flow, physicalUsage: item.physicalUsage, commercialAvailability: 'unknown', source: source(item.sourceShapeIds, `Effective Port fill ${item.effectiveFill ?? item.rawFill ?? 'unresolved'} projects ${item.physicalUsage}; availability remains unknown.`) } : flow;
  });
  data.prototypePortMappings = (data.prototypePortMappings ?? []).map(mapping => {
    const item = status.get(`ap:${mapping.accessPointId}:${mapping.portNumber}`);
    return item ? { ...mapping, physicalUsage: item.physicalUsage, commercialAvailability: 'unknown' } : mapping;
  });
  data.odfPorts = (data.odfPorts ?? []).map(port => {
    const item = status.get(`odf:${port.odfId}:${port.number}`);
    if (!item) return port;
    return { ...port, physicalOccupancy: item.physicalUsage === 'in_use' ? 'observed_occupied_unknown' : item.physicalUsage === 'unused' ? 'empty' : 'unknown', source: source(item.sourceShapeIds, `Fresh effective Port style: ${item.effectiveFill ?? 'no standalone filled Port graphic'}; physical usage ${item.physicalUsage}.`) };
  });
  data.odfs = (data.odfs ?? []).map(odf => {
    const binding = bindings.find(item => item.ownerType === 'odf' && item.ownerId === odf.id);
    const port = occupancy.find(item => item.ownerType === 'odf' && item.ownerId === odf.id);
    const shapeIds = [...new Set([...(binding?.sourceShapeIds ?? []), ...(port?.sourceShapeIds ?? [])])];
    return shapeIds.length ? { ...odf, source: source(shapeIds, `${odf.displayLabel} was revalidated from the fresh logical Port/bank representations.`) } : odf;
  });
  data.sourceDocuments = (data.sourceDocuments ?? []).map(document => ({
    ...document, sourceFile: 'Tsageri-Lentekhi 2025.vsdx', sourceSha256: ITERATION24_SOURCE_SHA256,
    source: source(summaryJson.inventory.cables.map(item => item.shapeId), 'Active Source Network Document revision and core inventory were regenerated from the current desktop VSDX.'),
    notes: [...document.notes.filter(note => !note.includes('Iteration 24')), `Iteration 24 clean import: ${summaryJson.rawCounts.all_page_shapes_including_subshapes} shapes, ${summaryJson.rawCounts.connect_rows} Connect rows; imported ${ITERATION24_IMPORT_DATE}.`],
  }));
  if (data.migrationCoverage) {
    data.migrationCoverage.sourceShapes = summaryJson.rawCounts.all_page_shapes_including_subshapes;
    data.migrationCoverage.topLevelShapes = summaryJson.rawCounts.top_level_shapes;
    data.migrationCoverage.directTextShapes = summaryJson.rawCounts.direct_text_shapes;
    data.migrationCoverage.comments = summaryJson.rawCounts.comments;
    data.migrationCoverage.connectRows = summaryJson.rawCounts.connect_rows;
    data.migrationCoverage.notes = [...data.migrationCoverage.notes.filter(note => !note.startsWith('Iteration 24 fresh extraction')), `Iteration 24 fresh extraction ${ITERATION24_SOURCE_SHA256.slice(0, 12)} is the active count source.`];
  }
  data.snapshot = `${data.snapshot.split(' · ')[0]} · fresh VSDX ${ITERATION24_SOURCE_SHA256.slice(0, 12)}`;
  return data;
}

