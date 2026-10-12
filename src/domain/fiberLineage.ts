import { currentAssetLabel, currentTopologyRevision } from './currentFiberPath';
import { STANDARD_12_COLOR_SEQUENCE, standardColor } from './colors';
import type {
  AssetRef, FiberLineage, FiberLineageEndpoint, FiberLineageLeg, FiberLineageTransition,
  FiberUseAssignment, Inventory, PhysicalColor, PrototypePortMapping, PrototypeProjectionStatus, SourceRef,
} from './types';

export const FIBER_LINEAGE_RULE = 'tsageri-lentekhi-fiber-lineage/1';
const ROUTE_ID = 'ROUTE-TSAGERI-LENTEKHI-CORE';
const SOURCE_FILE = 'Tsageri-Lentekhi 2025.vsdx';
const SOURCE_PAGE = 'ცაგერი-ლენტეხი';
const SOURCE_PART = 'visio/pages/page1.xml';
const findCable = (data: Inventory, id: string) => data.cables.find(item => item.id === id || item.legacyCableId === id || `C${item.legacyCableId}` === id);
const findFiber = (data: Inventory, cableId: string, number: number) => data.fibers.find(item => item.cableId === cableId && item.number === number);

const asset = (kind: AssetRef['kind'], id: string): AssetRef => ({ kind, id });
const source = (shapeIds: string[], note: string, rawValue?: string): SourceRef => ({
  file: SOURCE_FILE, page: SOURCE_PAGE, pageId: '4', part: SOURCE_PART, shapeIds,
  rawValue, interpretationRule: FIBER_LINEAGE_RULE, note,
});

const nodeSequence: Record<string, AssetRef> = {
  AGG5: asset('aggregation', '5'), SC205: asset('closure', '205'), SC206: asset('closure', '206'),
  SC216: asset('closure', '216'), SC217: asset('closure', '217'), SC218: asset('closure', '218'),
  SC219: asset('closure', '219'), SC220: asset('closure', '220'), SC221: asset('closure', '221'),
  SC222: asset('closure', '222'), SC223: asset('closure', '223'), SC224: asset('closure', '224'),
  AP51: asset('ap', '51'), LENTEKHI: asset('boundary', 'BOUNDARY-LENTEKHI-AGG'),
};

const routeSegments = [
  ['148', 'AGG5', 'SC205'], ['150', 'SC205', 'SC206'], ['169', 'SC206', 'SC216'],
  ['171', 'SC216', 'SC217'], ['172', 'SC217', 'SC218'], ['174', 'SC218', 'SC219'],
  ['176', 'SC219', 'SC220'], ['177', 'SC220', 'SC221'], ['178', 'SC221', 'SC222'],
  ['179', 'SC222', 'SC223'], ['180', 'SC223', 'SC224'], ['184', 'SC224', 'LENTEKHI'],
] as const;

function fiberColor(number: number): PhysicalColor {
  return standardColor(STANDARD_12_COLOR_SEQUENCE[(number - 1) % 12].key);
}

function tubeIdentity(segmentLegacyId: string, number: number): { number: number; color: PhysicalColor } {
  if (segmentLegacyId === '148' || segmentLegacyId === '150') {
    const index = Math.max(0, Math.floor((number - 145) / 12));
    return { number: 13 + index, color: standardColor((['green', 'brown', 'slate', 'white'] as const)[index] ?? 'white') };
  }
  const index = Math.floor((number - 1) / 12);
  return { number: 1 + index, color: standardColor((['blue', 'orange', 'green', 'brown'] as const)[index] ?? 'brown') };
}

function leg(
  data: Inventory, sequence: number, legacyId: string, fiberNumber: number, start: AssetRef, end: AssetRef,
  status: PrototypeProjectionStatus, note: string,
): FiberLineageLeg {
  const cable = findCable(data, legacyId);
  const fiber = cable ? findFiber(data, cable.id, fiberNumber) : undefined;
  const tube = tubeIdentity(legacyId, fiberNumber);
  const sourceOnly = !cable;
  return {
    sequence,
    segmentId: cable?.id ?? `CAB-SOURCE-${legacyId.padStart(6, '0')}`,
    sourceSegmentLabel: `C${legacyId}`,
    sourceOnly,
    fiberId: fiber?.id ?? null,
    fiberNumber,
    tubeId: fiber?.tubeId ?? null,
    tubeNumber: tube.number,
    tubeColor: tube.color,
    fiberColor: fiberColor(fiberNumber),
    startNode: start,
    endNode: end,
    source: source(cable?.source.shapeIds ?? ['36475', '37059'], note, cable?.legacyLabels[0] ?? `184-6-224-48`),
    basis: note,
    projectionStatus: status,
  };
}

function transition(sequence: number, before: FiberLineageLeg, after: FiberLineageLeg, node: AssetRef, status: PrototypeProjectionStatus): FiberLineageTransition {
  const atApBranch = node.kind === 'closure' && node.id === '218' && after.sourceSegmentLabel === 'C173';
  const numberChanged = before.fiberNumber !== after.fiberNumber;
  const tubeChanged = before.tubeNumber !== after.tubeNumber || before.tubeColor.key !== after.tubeColor.key;
  const fiberColorChanged = before.fiberColor.key !== after.fiberColor.key;
  const shapes = atApBranch ? ['33098', '34429', '34377'] : [...new Set([...before.source.shapeIds, ...after.source.shapeIds])];
  return {
    sequence, node, fromSegmentId: before.segmentId, fromFiberNumber: before.fiberNumber,
    toSegmentId: after.segmentId, toFiberNumber: after.fiberNumber,
    beforeTubeNumber: before.tubeNumber, beforeTubeColor: before.tubeColor, beforeFiberColor: before.fiberColor,
    afterTubeNumber: after.tubeNumber, afterTubeColor: after.tubeColor, afterFiberColor: after.fiberColor,
    operation: numberChanged || tubeChanged || fiberColorChanged ? 'spliced' : 'continuity',
    numberChanged, tubeChanged, fiberColorChanged,
    sourceGeometry: atApBranch ? { context: 'Aligned C172/C173 marker rows and dedicated SC218 connector geometry.' } : { context: 'Repeated ordered marker bank and continuation-line geometry.' },
    source: source(shapes, numberChanged || tubeChanged || fiberColorChanged ? 'Local identity changes at this source-drawn continuation.' : 'Local identity remains aligned across the source-drawn continuation.'),
    projectionStatus: status,
  };
}

function endpoint(assetRef: AssetRef | null, label: string, portNumber: number | null, fiberNumber: number | null): FiberLineageEndpoint {
  return { asset: assetRef, label, portNumber, fiberNumber };
}

function makeLineage(id: string, legs: FiberLineageLeg[], origin: FiberLineageEndpoint, destination: FiberLineageEndpoint, status: PrototypeProjectionStatus, warnings: string[] = []): FiberLineage {
  const transitions = legs.slice(1).map((current, index) => transition(index + 1, legs[index], current, legs[index].endNode, status));
  return {
    id, routeId: ROUTE_ID, origin, destination, legs, transitions, projectionStatus: status,
    interpretationRule: FIBER_LINEAGE_RULE,
    source: source([...new Set(legs.flatMap(item => item.source.shapeIds))], 'Ordered Fiber Lineage projected from source marker ordering, connector geometry, cable labels, route structure and owner-confirmed golden cases.'),
    warnings,
  };
}

function forwardLegs(data: Inventory, selectedFiber: number, throughLentekhi: boolean, status: PrototypeProjectionStatus): FiberLineageLeg[] {
  const selected: Array<[string, number, string, string]> = [
    ['148', selectedFiber + 144, 'AGG5', 'SC205'], ['150', selectedFiber + 144, 'SC205', 'SC206'],
    ['169', selectedFiber, 'SC206', 'SC216'], ['171', selectedFiber, 'SC216', 'SC217'],
    ['172', selectedFiber, 'SC217', 'SC218'],
  ];
  if (throughLentekhi) selected.push(...routeSegments.slice(5).map(([segment, start, end]) => [segment, selectedFiber, start, end] as [string, number, string, string]));
  return selected.map(([segment, fiber, start, end], index) => leg(data, index + 1, segment, fiber, nodeSequence[start], nodeSequence[end], status,
    segment === '148' || segment === '150' ? `Aggregation-side identity uses F${fiber}; the +144 remap is anchored by owner-confirmed F145 and F175 examples.` : 'Same-number marker alignment is repeated through this route section.'));
}

function reversedLentekhiLegs(data: Inventory, fiber: number, status: PrototypeProjectionStatus): FiberLineageLeg[] {
  return [...routeSegments.slice(5)].reverse().map(([segment, start, end], index) => leg(data, index + 1, segment, fiber, nodeSequence[end], nodeSequence[start], status, 'Lentekhi-side same-number marker alignment is repeated through this route section.'));
}

export function buildTsageriFiberLineages(data: Inventory): FiberLineage[] {
  const lineages: FiberLineage[] = [];
  for (let fiber = 1; fiber <= 28; fiber++) {
    const status: PrototypeProjectionStatus = fiber === 1 ? 'owner_confirmed' : 'source_interpreted';
    lineages.push(makeLineage(`LINEAGE-CORE-${String(fiber).padStart(3, '0')}`, forwardLegs(data, fiber, true, status),
      endpoint(nodeSequence.AGG5, `AGG5 / Port ${fiber + 144}`, fiber + 144, fiber + 144),
      endpoint(nodeSequence.LENTEKHI, `Lentekhi aggregation / Port-Fiber ${fiber}`, fiber, fiber), status,
      fiber === 1 ? ['Owner-confirmed golden path. Prototype interpretation is not field verification.'] : []));
  }
  for (let fiber = 29; fiber <= 40; fiber++) {
    const status: PrototypeProjectionStatus = fiber === 29 || fiber === 31 ? 'owner_confirmed' : 'source_interpreted';
    const legs = forwardLegs(data, fiber, false, status);
    const branchFiber = fiber - 28;
    legs.push(leg(data, legs.length + 1, '173', branchFiber, nodeSequence.SC218, nodeSequence.AP51, status, 'SC218 offset marker ordering maps C172/F29–40 to C173/F01–12.'));
    lineages.push(makeLineage(`LINEAGE-AP51-NORTH-${String(branchFiber).padStart(2, '0')}`, legs,
      endpoint(nodeSequence.AGG5, `AGG5 / Port ${fiber + 144}`, fiber + 144, fiber + 144),
      endpoint(nodeSequence.AP51, `AP51 / Port ${branchFiber}`, branchFiber, branchFiber), status,
      fiber === 29 ? ['Preserves the existing reviewed C171/F29 → C172/F29 → C173/F01 path.'] : fiber === 31 ? ['Owner-confirmed C172/F31 golden path; aligned AP51 geometry establishes C173/F03 → Port3.'] : []));
  }
  for (let fiber = 29; fiber <= 40; fiber++) {
    const status: PrototypeProjectionStatus = 'source_interpreted';
    const legs = reversedLentekhiLegs(data, fiber, status);
    const branchFiber = fiber - 16;
    legs.push(leg(data, legs.length + 1, '173', branchFiber, nodeSequence.SC218, nodeSequence.AP51, status, 'SC218 offset marker ordering maps C174/F29–40 to C173/F13–24.'));
    lineages.push(makeLineage(`LINEAGE-AP51-SOUTH-${String(branchFiber).padStart(2, '0')}`, legs,
      endpoint(nodeSequence.LENTEKHI, `Lentekhi aggregation / Port-Fiber ${fiber}`, fiber, fiber),
      endpoint(nodeSequence.AP51, `AP51 / Port ${branchFiber}`, branchFiber, branchFiber), status));
  }
  for (let fiber = 41; fiber <= 48; fiber++) {
    const status: PrototypeProjectionStatus = 'source_interpreted';
    lineages.push(makeLineage(`LINEAGE-NORTH-PARTIAL-${fiber}`, forwardLegs(data, fiber, false, status),
      endpoint(nodeSequence.AGG5, `AGG5 / Port ${fiber + 144}`, fiber + 144, fiber + 144),
      endpoint(nodeSequence.SC218, 'SC218 / continuation unresolved', null, null), status, ['No defensible outgoing mapping is established for C172/F41–48.']));
    lineages.push(makeLineage(`LINEAGE-SOUTH-PARTIAL-${fiber}`, reversedLentekhiLegs(data, fiber, status),
      endpoint(nodeSequence.LENTEKHI, `Lentekhi aggregation / Port-Fiber ${fiber}`, fiber, fiber),
      endpoint(nodeSequence.SC218, 'SC218 / continuation unresolved', null, null), status, ['No defensible outgoing mapping is established for C174/F41–48.']));
  }
  return lineages;
}

export function buildAp51PrototypePortMappings(data: Inventory): PrototypePortMapping[] {
  const cable = findCable(data, '173');
  if (!cable) return [];
  return Array.from({ length: 24 }, (_, index) => {
    const number = index + 1;
    return {
      id: `PROTO-AP51-C173-F${String(number).padStart(2, '0')}-P${String(number).padStart(2, '0')}`,
      accessPointId: '51', segmentId: cable.id, fiberNumber: number, portNumber: number,
      physicalUsage: number === 3 ? 'in_use' as const : 'unused' as const,
      administrativeAllocation: 'unknown' as const, commercialAvailability: 'unknown' as const,
      sourceAnnotationIds: number === 3 ? ['ANN-UNRESOLVED-OTDR-34281'] : [],
      projectionStatus: number === 3 ? 'owner_confirmed' as const : 'source_interpreted' as const,
      source: source([String(34279 + index), String(34267 + index), String(34315 + index)], `C173/F${number} and AP51/Port${number} share the same source X alignment. Port3 green=in use; white ports=unused in this AP51 representation only.`),
    };
  });
}

export function buildFiberUseAssignments(): FiberUseAssignment[] {
  return [{
    id: 'USE-OPENNET-LINEAGES-001-004', organizationId: 'opennet', scope: 'lineage',
    fiberIds: [], lineageIds: ['LINEAGE-CORE-001', 'LINEAGE-CORE-002', 'LINEAGE-CORE-003', 'LINEAGE-CORE-004'],
    segmentIds: [], purpose: 'Source-labelled operational use', projectionStatus: 'source_interpreted',
    source: source(['17661', '17662', '17663', '17664', '38538', '38539', '38540', '38541', '19063', '19064', '19065', '19066', '33257', '33258', '33259', '33260'], 'Four OpenNet-labelled green continuation lines connect the aggregation-side F145–148 marker positions to the aligned route-side F01–04 positions.'),
    notes: ['Usage is distinct from cable ownership, strand rights, service provider, customer and commercial availability.'],
  }];
}

export function applyIteration17FiberLineage(data: Inventory): Inventory {
  data.fiberLineages = buildTsageriFiberLineages(data);
  data.prototypePortMappings = buildAp51PrototypePortMappings(data);
  data.fiberUseAssignments = buildFiberUseAssignments();
  return data;
}

export const lineageForFiber = (data: Inventory, cableId: string, fiberNumber: number): FiberLineage | undefined => {
  const matches = data.cables.filter(c=>c.id===cableId || c.legacyCableId===cableId || `C${c.legacyCableId}`===cableId);
  const cable = data.cables.find(c=>c.id===cableId) ?? (matches.length===1 ? matches[0] : undefined);
  if (!cable) return undefined;
  const revision = data.currentFiberLineages ? currentTopologyRevision(data) : undefined;
  return (data.currentFiberLineages ?? data.fiberLineages)?.find(item => (!revision || item.topologyRevision===revision) && item.legs.some(leg => leg.segmentId === cable.id && leg.fiberNumber === fiberNumber));
};
export const lineagesForSegment = (data: Inventory, cableId: string): FiberLineage[] => {
  const cable = findCable(data, cableId);
  return (data.currentFiberLineages ?? data.fiberLineages ?? []).filter(item => item.legs.some(leg => leg.segmentId === (cable?.id ?? cableId)));
};
export const lineagesForTube = (data: Inventory, cableId: string, tubeNumber: number): FiberLineage[] => {
  const cable = findCable(data, cableId);
  return (data.currentFiberLineages ?? data.fiberLineages ?? []).filter(item => item.legs.some(leg => leg.segmentId === (cable?.id ?? cableId) && leg.tubeNumber === tubeNumber));
};
export const useAssignmentsForLineage = (data: Inventory, lineageId: string): FiberUseAssignment[] =>
  (data.fiberUseAssignments ?? []).filter(item => item.lineageIds.includes(lineageId));
export const ap51PortMapping = (data: Inventory, portNumber: number): PrototypePortMapping | undefined =>
  data.prototypePortMappings?.find(item => item.accessPointId === '51' && item.portNumber === portNumber);

export interface CompactLineageJourneyRow {
  id: string;
  location: string;
  segmentLabels: string[];
  tubeNumber: number | null;
  tubeColor: PhysicalColor;
  fiberNumber: number;
  fiberColor: PhysicalColor;
  event: string;
  legSequences: number[];
}

export function compactLineageJourney(lineage: FiberLineage, data?: Inventory): CompactLineageJourneyRow[] {
  const rows: CompactLineageJourneyRow[] = [];
  for (const leg of lineage.legs) {
    const last = rows.at(-1);
    const same = last && last.fiberNumber === leg.fiberNumber && last.tubeNumber === leg.tubeNumber && last.tubeColor.key === leg.tubeColor.key && last.fiberColor.key === leg.fiberColor.key;
    if (same) {
      last.segmentLabels.push(leg.sourceSegmentLabel);
      last.legSequences.push(leg.sequence);
      last.location = `${last.location.split(' → ')[0]} → ${(data ? currentAssetLabel(data,leg.endNode) : labelAsset(leg.endNode))}`;
      last.event = `Unchanged through ${last.segmentLabels.length} segments`;
    } else rows.push({
      id: `${lineage.id}-${leg.sequence}`, location: `${(data ? currentAssetLabel(data,leg.startNode) : labelAsset(leg.startNode))} → ${(data ? currentAssetLabel(data,leg.endNode) : labelAsset(leg.endNode))}`,
      segmentLabels: [leg.sourceSegmentLabel], tubeNumber: leg.tubeNumber, tubeColor: leg.tubeColor,
      fiberNumber: leg.fiberNumber, fiberColor: leg.fiberColor,
      event: leg.sequence === 1 ? 'Origin section' : 'Identity change', legSequences: [leg.sequence],
    });
  }
  return rows;
}

export function labelAsset(ref: AssetRef): string {
  if (ref.kind === 'closure') return `SC${ref.id}`;
  if (ref.kind === 'aggregation') return ref.id === 'AGG-LENTEKHI' ? 'ლენტეხის აგრეგაცია' : `AGG${ref.id}`;
  if (ref.kind === 'ap') return `AP${ref.id}`;
  if (ref.kind === 'boundary') return 'Lentekhi aggregation';
  if (ref.kind === 'network_node') return `Node ${ref.id}`;
  return `${ref.kind.toUpperCase()}${ref.id}`;
}

export function validateFiberLineages(data: Inventory): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const lineage of data.fiberLineages ?? []) {
    if (ids.has(lineage.id)) errors.push(`Duplicate FiberLineage: ${lineage.id}`); else ids.add(lineage.id);
    if (!lineage.legs.length) errors.push(`Empty FiberLineage: ${lineage.id}`);
    if (![FIBER_LINEAGE_RULE, 'tsageri-lentekhi-branch-aware-lineage/1'].includes(lineage.interpretationRule)) errors.push(`Wrong FiberLineage rule: ${lineage.id}`);
    lineage.legs.forEach((item, index) => {
      if (item.sequence !== index + 1) errors.push(`FiberLineage leg sequence: ${lineage.id}`);
      if (!item.sourceOnly && (!data.cables.some(cable => cable.id === item.segmentId) || !data.fibers.some(fiber => fiber.cableId === item.segmentId && fiber.number === item.fiberNumber))) errors.push(`Unknown FiberLineage identity: ${lineage.id}/${item.segmentId}/F${item.fiberNumber}`);
      if (![FIBER_LINEAGE_RULE, 'tsageri-lentekhi-branch-aware-lineage/1'].includes(item.source.interpretationRule ?? '')) errors.push(`Missing FiberLineage provenance: ${lineage.id}/${item.sequence}`);
    });
    lineage.transitions.forEach((item, index) => {
      const before = lineage.legs[index], after = lineage.legs[index + 1];
      if (item.sequence !== index + 1 || item.fromSegmentId !== before?.segmentId || item.toSegmentId !== after?.segmentId) errors.push(`FiberLineage transition mismatch: ${lineage.id}/${item.sequence}`);
      if (before && after && (before.endNode.kind !== after.startNode.kind || before.endNode.id !== after.startNode.id)) errors.push(`FiberLineage node discontinuity: ${lineage.id}/${item.sequence}`);
    });
  }
  const mappings = data.prototypePortMappings ?? [];
  if (new Set(mappings.map(item => item.id)).size !== mappings.length) errors.push('Duplicate prototype port mapping');
  mappings.forEach(item => {
    if (!data.accessPoints.some(ap => ap.id === item.accessPointId) || !data.fibers.some(fiber => fiber.cableId === item.segmentId && fiber.number === item.fiberNumber)) errors.push(`Invalid prototype port mapping: ${item.id}`);
    if (item.physicalUsage === 'unused' && item.commercialAvailability === 'available') errors.push(`Unused port claimed commercially available: ${item.id}`);
  });
  for (const use of data.fiberUseAssignments ?? []) {
    if (!data.organizations.some(org => org.id === use.organizationId)) errors.push(`Unknown FiberUse organization: ${use.id}`);
    if (use.lineageIds.some(id => !ids.has(id))) errors.push(`Unknown FiberUse lineage: ${use.id}`);
  }
  return errors;
}
