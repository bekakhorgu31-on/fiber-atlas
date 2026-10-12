import type {
  AccessPointPortRange, Inventory, OdfPort, PhysicalCable, PortRangeAssignment,
  PortTraceResult, SourceRef, SourceRepresentation,
} from './types';

export const TSAGERI_ODF_ID = 'ODF-TSAGERI-01';
export const TSAGERI_ROUTE_ID = 'ROUTE-TSAGERI-LENTEKHI-CORE';
export const C172_PHYSICAL_CABLE_ID = 'PC-TSAGERI-SC218-01';
const RULE = 'tsageri-lentekhi-aggregation/1';

const source = (shapeIds: string[], rawValue?: string, note?: string): SourceRef => ({
  file: 'Tsageri-Lentekhi 2025.vsdx', page: 'ცაგერი-ლენტეხი', pageId: '4',
  part: 'visio/pages/page1.xml', shapeIds, rawValue, interpretationRule: RULE, note,
});

const bankRepresentation = (port: number, role: SourceRepresentation['role']): SourceRepresentation => {
  const internal = role === 'internal_odf_port';
  return {
    id: `${TSAGERI_ODF_ID}-P${String(port).padStart(3, '0')}-${internal ? 'INTERNAL' : 'BOUNDARY'}`,
    role,
    source: source(
      [internal ? '43429' : '43832'],
      undefined,
      `Bank-level source reference for logical port ${port}; the exact individual marker-to-number index remains unresolved.`,
    ),
    geometry: internal
      ? { pinX: 36.34375070501117, pinY: 595.4062538919969, width: 17.953125, height: 0.2382584064328057, context: 'internal/fan-out port bank at the aggregation lower edge' }
      : { pinX: 36.3359375, pinY: 588.2910042032164, width: 17.953125, height: 0.2382584064328057, context: 'mirrored outgoing/boundary port bank below the aggregation' },
    style: { lineColor: null, fillColor: null }, groupShapeId: internal ? '43429' : '43832',
    interpretationRule: RULE, reviewState: 'accepted',
  };
};

const buildPorts = (): OdfPort[] => Array.from({ length: 192 }, (_, index) => {
  const number = index + 1;
  return {
    id: `${TSAGERI_ODF_ID}-P${String(number).padStart(3, '0')}`, odfId: TSAGERI_ODF_ID,
    panelId: null, number, faceMode: 'single', connectorType: null,
    physicalOccupancy: 'unknown', allocation: 'unknown', condition: 'unknown',
    verification: 'documentation_reviewed',
    source: source(['12426', '43429', '43832'], String(number), 'Logical numbering is owner-confirmed; exact marker-to-number geometry is unresolved.'),
    sourceRepresentations: [bankRepresentation(number, 'internal_odf_port'), bankRepresentation(number, 'aggregation_boundary_port')],
    externalReferences: [],
  };
});

const rangeAssignments = (): PortRangeAssignment[] => [
  { id: 'PRA-TSAGERI-001-116', odfId: TSAGERI_ODF_ID, startPort: 1, endPort: 116, destination: { type: 'named_direction', name: 'Ambrolauri direction' }, routeId: null, physicalCableId: null, continuity: 'direction_only', physicalConnection: 'known_range', verification: 'documentation_reviewed', source: source(['12426'], '1–116 → Ambrolauri direction'), ownerConfirmed: true, notes: ['Directional/physical assignment only; it does not establish active service, customer, rights, or availability.', 'Exact downstream asset and per-fiber optical mapping remain unresolved.'] },
  { id: 'PRA-TSAGERI-117-130', odfId: TSAGERI_ODF_ID, startPort: 117, endPort: 130, destination: { type: 'asset', asset: { kind: 'closure', id: '205' }, label: 'SC205' }, routeId: TSAGERI_ROUTE_ID, physicalCableId: null, continuity: 'stops_at_destination', physicalConnection: 'known_range', verification: 'documentation_reviewed', source: source(['12428'], '117–130 → SC205; intentional end'), ownerConfirmed: true, notes: ['Intentionally cut/ended at SC205 and does not continue beyond it.', 'This is not a damaged-cable state.', 'Exact tray/splice treatment is unresolved.'] },
  { id: 'PRA-TSAGERI-131-144', odfId: TSAGERI_ODF_ID, startPort: 131, endPort: 144, destination: { type: 'asset', asset: { kind: 'ap', id: '41' }, label: 'AP Chkhuteli' }, routeId: null, physicalCableId: null, continuity: 'unresolved', physicalConnection: 'known_range', verification: 'documentation_reviewed', source: source(['12432', '14250'], '131–144 → AP Chkhuteli'), ownerConfirmed: true, notes: ['Known ingress range to AP Chkhuteli.', 'No one-to-one mapping to AP ports 3–22 is asserted.'] },
  { id: 'PRA-TSAGERI-145-192', odfId: TSAGERI_ODF_ID, startPort: 145, endPort: 192, destination: { type: 'cable_route', routeId: TSAGERI_ROUTE_ID, label: 'Lentekhi direction' }, routeId: TSAGERI_ROUTE_ID, physicalCableId: null, continuity: 'continues_on_route', physicalConnection: 'known_range', verification: 'documentation_reviewed', source: source(['12426', '12428'], '145–192 → Lentekhi direction'), ownerConfirmed: true, notes: ['Range-level infrastructure direction is reviewed.', 'Exact fiber endpoint, splice, patch, and final port mapping remain unresolved.'] },
];

const chkhuteliRanges = (): AccessPointPortRange[] => [{
  id: 'APR-CHKHUTELI-003-022', accessPointId: '41', startPort: 3, endPort: 22, role: 'egress',
  destination: { type: 'named_direction', name: 'Ambrolauri direction' }, internalMapping: 'unresolved',
  verification: 'documentation_reviewed', source: source(['12484', '13907'], 'AP Chkhuteli ports 3–22 → Ambrolauri direction'),
  notes: ['Return/backfeed range; AP Chkhuteli is an interconnect/transit point.', 'Internal mapping from Tsageri ingress ports 131–144 is unresolved.', 'No splice or one-to-one port continuity is created.'],
}];

const physicalCable = (): PhysicalCable => ({
  id: C172_PHYSICAL_CABLE_ID, displayLabel: 'Physical cable ending at SC218',
  endA: { state: 'unresolved', direction: 'toward Tsageri aggregation', label: 'Upstream of SC217; exact physical origin unresolved' },
  endB: { state: 'known', asset: { kind: 'closure', id: '218' }, label: 'SC218 · physical cable end' },
  segmentMemberships: [
    { segmentId: 'CAB-000172', sequence: 1, state: 'accepted', verification: 'documentation_reviewed', basis: 'Owner-confirmed terminal local segment of this physical cable; source establishes C172 as SC217↔SC218.', source: source(['34626'], 'C172 / SC217–SC218') },
    { segmentId: 'CAB-000171', sequence: null, state: 'candidate', verification: 'needs_verification', basis: 'The owner confirms the same physical cable extends upstream beyond SC217; adjacency and 48F count support review but do not prove whole-segment membership.', source: source(['34626'], 'upstream beyond SC217') },
  ],
  routeId: TSAGERI_ROUTE_ID, fiberCount: 48, constructionType: null, owner: { state: 'unknown' },
  manufacturer: null, model: null, status: 'unknown', verification: 'documentation_reviewed',
  source: source(['34626'], 'Physical cable continues upstream beyond SC217 and ends at SC218'),
  notes: ['The accepted extent includes C172; the exact upstream physical origin is unresolved.', 'C171 is a candidate membership only. Equal capacity or adjacency never approves membership.', 'The Tsageri–Lentekhi Cable Route continues beyond SC218 on a different physical cable.', 'Fiber Trace may continue through a reviewed optical connection independently of this sheath ending.'],
});

export function applyIteration10AggregationTopology(inventory: Inventory): Inventory {
  const aggregation = inventory.aggregations.find(item => item.id === '5');
  if (!aggregation) throw new Error('Iteration 10 requires Tsageri aggregation 5');
  aggregation.contextOnly = false;
  aggregation.portCount = 192;
  const ap = inventory.accessPoints.find(item => item.id === '41');
  if (!ap) inventory.accessPoints.push({
    id: '41', legacySymbol: 'ODF', identityNote: 'The source identifies ODF/AP 41 at Chkhuteli; exact internal AP/ODF asset separation remains unresolved.',
    aliases: ['ODF41', 'AP Chkhuteli', 'ჩხუტელი'], name: 'ჩხუტელი', portCount: 24,
    verification: 'documentation_reviewed', source: source(['12432'], 'ODF#41 · ჩხუტელი · 24'),
    notes: ['Source capacity is 24.', 'Ports 3–22 form a reviewed return/backfeed range toward Ambrolauri.', 'The AP is mixed/interconnect topology, not a leaf endpoint.'],
    owner: { state: 'unknown' }, externalReferences: [],
  });
  inventory.odfs = [{ id: TSAGERI_ODF_ID, displayLabel: 'Tsageri aggregation ODF', containedBy: { kind: 'aggregation', id: '5' }, vendor: null, model: null, panelCount: null, portCapacity: 192, connectorType: null, status: 'active', verification: 'documentation_reviewed', notes: ['Logical ports 1–192 are owner-confirmed.', 'No panel/module subdivision is asserted.', 'Internal and lower-boundary markers are mirrored representations of the same logical ports.'], source: source(['12426', '43429', '43832'], 'Tsageri aggregation ODF · 192 logical ports'), externalReferences: [] }];
  inventory.odfPanels = [];
  inventory.odfPorts = buildPorts();
  inventory.portRangeAssignments = rangeAssignments();
  inventory.accessPointPortRanges = chkhuteliRanges();
  inventory.physicalCables = [physicalCable()];
  const c172 = inventory.cables.find(item => item.id === 'CAB-000172');
  if (!c172) throw new Error('Iteration 10 requires C172');
  c172.physicalCableId = C172_PHYSICAL_CABLE_ID;
  return inventory;
}

export const portRangeFor = (inventory: Inventory, odfId: string, port: number) =>
  (inventory.portRangeAssignments ?? []).find(item => item.odfId === odfId && port >= item.startPort && port <= item.endPort);

export function traceFromOdfPort(inventory: Inventory, odfId: string, portNumber: number): PortTraceResult {
  const port = (inventory.odfPorts ?? []).find(item => item.odfId === odfId && item.number === portNumber);
  const assignment = portRangeFor(inventory, odfId, portNumber);
  if (!port || !assignment) return { portId: port?.id ?? `${odfId}:${portNumber}`, infrastructurePath: [], exactOpticalPath: [], stopped: true, stopCode: 'no_assignment', reason: 'No reviewed port range assignment exists.' };
  const label = assignment.destination.type === 'named_direction' ? assignment.destination.name : assignment.destination.label;
  const infrastructurePath = [`${odfId} / Port ${portNumber}`, label];
  if (assignment.continuity === 'stops_at_destination') infrastructurePath.push('No continuation beyond destination');
  return { portId: port.id, infrastructurePath, exactOpticalPath: [port.id], stopped: true, stopCode: 'exact_mapping_unresolved', reason: 'Range-level direction is known, but exact fiber endpoint, splice, patch and downstream port mapping are unresolved.' };
}

export function validateIteration10(inventory: Inventory): string[] {
  const errors: string[] = [];
  const odf = inventory.odfs?.find(item => item.id === TSAGERI_ODF_ID);
  const ports = (inventory.odfPorts ?? []).filter(item => item.odfId === TSAGERI_ODF_ID);
  const ranges = (inventory.portRangeAssignments ?? []).filter(item => item.odfId === TSAGERI_ODF_ID).sort((a, b) => a.startPort - b.startPort);
  if (!odf || odf.containedBy.kind !== 'aggregation' || odf.containedBy.id !== '5') errors.push('Tsageri ODF containment mismatch');
  if (ports.length !== 192 || new Set(ports.map(item => item.number)).size !== 192) errors.push('Tsageri logical port inventory must contain exactly 192 unique ports');
  ports.forEach(port => {
    if (!port.sourceRepresentations.some(item => item.role === 'internal_odf_port') || !port.sourceRepresentations.some(item => item.role === 'aggregation_boundary_port')) errors.push(`Missing mirrored source representation: ${port.id}`);
  });
  for (let index = 0; index < ranges.length; index += 1) {
    const item = ranges[index];
    if (item.startPort < 1 || item.endPort > 192 || item.startPort > item.endPort) errors.push(`Invalid port range: ${item.id}`);
    if (index && ranges[index - 1].endPort >= item.startPort) errors.push(`Overlapping port range: ${item.id}`);
  }
  for (let number = 1; number <= 192; number += 1) if (ranges.filter(item => number >= item.startPort && number <= item.endPort).length !== 1) errors.push(`Port range coverage mismatch: ${number}`);
  const physical = inventory.physicalCables?.find(item => item.id === C172_PHYSICAL_CABLE_ID);
  if (!physical || !physical.segmentMemberships.some(item => item.segmentId === 'CAB-000172' && item.state === 'accepted')) errors.push('C172 physical cable membership mismatch');
  if (physical?.endB.state !== 'known' || physical.endB.asset.kind !== 'closure' || physical.endB.asset.id !== '218') errors.push('C172 physical cable must end at SC218');
  return errors;
}
