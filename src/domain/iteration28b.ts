import sourceInventory from '../data/source-b-closure-inventory.json';
import type { AssetRef, ClosureCoordinateEvidence, ClosureSymbolEvidence, ExternalReference, Inventory, NetworkNode, SourceRef } from './types';
import { parseCoordinatePair } from '../../scripts/source-b-closure-grammar.mjs';
import type { ParsedCoordinatePair } from '../../scripts/source-b-closure-grammar.mjs';

export const ITERATION28B_GRAMMAR_ID = 'tsageri-alpana-tvishi-closure-block/1';
export const ITERATION28B_OWNER_CONFIRMATION_ID = 'OWNER-CONFIRMED-28B-CLOSURE-GRAMMAR';

export type ParsedSourceCoordinates = NonNullable<ReturnType<typeof parseCoordinatePair>>;
/** Parses the observed Source B order (longitude E/W first, latitude N/S second) without assigning a datum. */
export const parseSourceCoordinatePair = parseCoordinatePair;

type SourceInventoryRow = {
  canonicalId: string;
  sourceEndpointToken: string;
  closureNumber: number;
  displayName: string;
  coordinates: {
    rawCoordinateText: string;
    longitudeDms: ParsedCoordinatePair['longitude'] | null;
    latitudeDms: ParsedCoordinatePair['latitude'] | null;
    longitudeDecimalDegrees: number | null;
    latitudeDecimalDegrees: number | null;
    crs: string;
    sourceShapeId: string | null;
  };
  externalReferences: Array<{ system: string; value: string; rawText: string; sourceShapeId: string }>;
  sourceRepresentation: Record<string, any>;
  verification: 'documentation_reviewed';
  fieldVerified: false;
};

const rows = (sourceInventory as { records: Record<string, SourceInventoryRow> }).records;
const makeSourceRef = (base: Record<string, any>, shapeIds: string[], rawValue?: string): SourceRef => ({
  file: base.file,
  page: base.page,
  pageId: base.pageId,
  part: base.part,
  shapeIds,
  rawValue,
  interpretationRule: ITERATION28B_GRAMMAR_ID,
  note: `Owner-confirmed Closure symbol grammar; ${ITERATION28B_OWNER_CONFIRMATION_ID}. Source documentation review only, not field verified.`,
});

function toClosureEvidence(row: SourceInventoryRow): ClosureSymbolEvidence {
  const representation = row.sourceRepresentation;
  const base = representation.source as Record<string, any>;
  const coordinatesRaw = row.coordinates.rawCoordinateText;
  const parsed = parseSourceCoordinatePair(coordinatesRaw);
  const coordinateSource = makeSourceRef(base, row.coordinates.sourceShapeId ? [row.coordinates.sourceShapeId] : [], coordinatesRaw);
  const externalReferences: ExternalReference[] = row.externalReferences.map(reference => ({
    system: reference.system,
    externalId: reference.value,
    rawText: reference.rawText,
    source: makeSourceRef(base, [reference.sourceShapeId], reference.rawText),
  }));
  const coordinates: ClosureCoordinateEvidence = {
    rawCoordinateText: coordinatesRaw,
    longitudeDms: parsed?.longitude ?? null,
    latitudeDms: parsed?.latitude ?? null,
    longitudeDecimalDegrees: parsed?.longitude.decimalDegrees ?? null,
    latitudeDecimalDegrees: parsed?.latitude.decimalDegrees ?? null,
    crs: parsed?.crs ?? null,
    source: coordinateSource,
  };
  const rootBounds = representation.root.bounds;
  return {
    closureNumber: row.closureNumber,
    grammarId: ITERATION28B_GRAMMAR_ID,
    sourceHash: row.sourceRepresentation.sourceHash,
    coordinates,
    externalReferences,
    sourceRepresentation: {
      source: makeSourceRef(base, representation.source.shapeIds, String(row.closureNumber)),
      rootShapeId: representation.rootShapeId,
      childShapeIds: representation.childShapeIds,
      numberShapeId: representation.numberShapeId,
      coordinateShapeId: representation.coordinateShapeId,
      externalReferenceShapeId: representation.externalReferenceShapeId,
      masterId: representation.masterReference.masterId,
      masterShapeId: representation.masterReference.rootShapeId,
      masterChildShapeIds: representation.masterReference.childShapeIds,
      bounds: { minX: rootBounds.min_x, minY: rootBounds.min_y, maxX: rootBounds.max_x, maxY: rootBounds.max_y, width: rootBounds.width, height: rootBounds.height },
      connectedCableEvidence: representation.connectedCableEvidence,
      directConnectRows: representation.directVisioConnectRowsToSymbol,
    },
    evidenceBasis: ['source_document', 'source_geometry', 'owner_confirmation'],
    ownerConfirmationId: ITERATION28B_OWNER_CONFIRMATION_ID,
    verification: row.verification,
    fieldVerified: false,
  };
}

const referenceKey = (reference: ExternalReference) => `${reference.system}:${reference.externalId}:${reference.source?.file ?? ''}:${reference.source?.shapeIds.join(',') ?? ''}`;
function appendReferences(current: ExternalReference[] | undefined, additions: ExternalReference[]) {
  const merged = [...(current ?? [])];
  const seen = new Set(merged.map(referenceKey));
  for (const reference of additions) if (!seen.has(referenceKey(reference))) { merged.push(reference); seen.add(referenceKey(reference)); }
  return merged;
}

function topologySignature(data: Inventory) {
  return JSON.stringify({ cables: data.cables, fibers: data.fibers, transitions: data.nodeFiberTransitions, lineages: data.fiberLineages, supersededLineages: data.supersededFiberLineages, journeys: data.fiberJourneySummaries });
}

/** Enriches the existing canonical objects with Closure symbol semantics without changing any physical or optical edge. */
export function applyIteration28B(input: Inventory): Inventory {
  const data = structuredClone(input) as Inventory;
  const before = topologySignature(data);
  for (const row of Object.values(rows).sort((a, b) => a.closureNumber - b.closureNumber)) {
    const evidence = toClosureEvidence(row);
    const expectedKind = row.canonicalId.split(':')[0] as AssetRef['kind'];
    let canonicalRef: AssetRef | undefined;
    if (expectedKind === 'closure') {
      const closure = data.closures.find(item => item.id === String(row.closureNumber));
      if (closure) {
        closure.sourceSymbolEvidence = evidence;
        closure.externalReferences = appendReferences(closure.externalReferences, evidence.externalReferences);
        canonicalRef = { kind: 'closure', id: closure.id };
      }
    } else if (expectedKind === 'network_node') {
      const node = data.networkNodes?.find(item => item.id === String(row.closureNumber));
      if (node) {
        node.displayName = row.displayName;
        node.assetType = 'closure';
        node.closureEvidence = evidence;
        node.externalReferences = appendReferences(node.externalReferences, evidence.externalReferences);
        node.verification = 'documentation_reviewed';
        node.notes = node.notes.filter(note => !/equipment type and owner display name are not established/i.test(note) && !/Previously displayed as a neutral Node before certification of tsageri-alpana-tvishi-closure-block\/1/.test(note));
        node.notes.push(`Previously displayed as a neutral Node before certification of ${ITERATION28B_GRAMMAR_ID}; the same canonical endpoint identity is retained.`);
        canonicalRef = { kind: 'network_node', id: node.id };
      }
    }
    if (!canonicalRef || `${canonicalRef.kind}:${canonicalRef.id}` !== row.canonicalId) throw new Error(`Closure grammar record ${row.closureNumber} does not resolve to its existing canonical identity (${row.canonicalId}).`);
  }
  const document = data.sourceDocuments?.find(item => item.id === 'SRC-TSAGERI-ALPANA-TVISHI-419DEF34');
  if (document) {
    document.counts.closures = Object.keys(rows).length;
    const note = 'Iteration 28B: the Source B closure-block grammar identified Closure numbers from Shape Data, enriched shared canonical Closures 205/206 and typed the existing neutral nodes 207–215; no parallel objects or topology edges were created.';
    if (!document.notes.includes(note)) document.notes.push(note);
  }
  if (topologySignature(data) !== before) throw new Error('Iteration 28B Closure typing changed Cable/Fiber/transition/Lineage/Journey topology.');
  return data;
}

export function closureSymbolInventory() {
  return Object.values(rows).sort((a, b) => a.closureNumber - b.closureNumber).map(row => ({ canonicalId: row.canonicalId, closureNumber: row.closureNumber, displayName: row.displayName, coordinates: row.coordinates, externalReferences: row.externalReferences, source: row.sourceRepresentation.source, grammarId: ITERATION28B_GRAMMAR_ID, verification: row.verification, fieldVerified: row.fieldVerified }));
}

export function isClosureTypedNode(node: NetworkNode | undefined): boolean { return node?.assetType === 'closure' && !!node.closureEvidence; }
