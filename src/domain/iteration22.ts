import type {
  AssetRef, ConnectionBankRow, ConnectionSheet, ConnectionSheetBank, ConnectionSheetRow,
  Inventory, NodeFiberTransitionSide, PortOperationalStatus, PortTopologyBinding,
} from './types';
import { LENTEKHI_AGGREGATION_ID } from './iteration19';
import { LENTEKHI_ODF_ID } from './iteration20';
import { TSAGERI_ODF_ID, TSAGERI_ROUTE_ID } from './aggregationTopology';

export const SPLICE_WORKSPACE_RULE = 'tsageri-lentekhi-splice-workspace/1';

const sameAsset = (a: AssetRef, b: AssetRef) => a.kind === b.kind && a.id === b.id;
const pad = (value: number) => String(value).padStart(2, '0');
const assetLabel = (asset: AssetRef, data?: Inventory) => asset.kind === 'closure' ? `SC${asset.id}`
  : asset.kind === 'ap' ? `AP${asset.id}`
  : asset.kind === 'aggregation' ? asset.id === '5' ? 'AGG5 · ცაგერი' : 'ლენტეხის აგრეგაცია'
  : asset.kind === 'network_node' ? data?.networkNodes?.find(item => item.id === asset.id)?.displayName ?? `Node ${asset.id}`
  : asset.id;

const cableSourceLabel = (data: Inventory, segmentId: string) => {
  const cable = data.cables.find(item => item.id === segmentId);
  return cable?.legacyLabels.find(item => /^\d+-/.test(item)) ?? cable?.legacyLabels[0] ?? null;
};

const segmentBank = (data: Inventory, segmentId: string): ConnectionSheetBank => {
  const cable = data.cables.find(item => item.id === segmentId)!;
  return {
    endpointType: 'cable_fiber', title: `კაბელის ჟილები · C${cable.legacyCableId}`,
    subtitle: `${cable.fiberCount}F`, segmentId, legacyCableId: cable.legacyCableId,
    sourceLabel: cableSourceLabel(data, segmentId), capacity: cable.fiberCount,
  };
};

const portBank = (data: Inventory, binding: PortTopologyBinding): ConnectionSheetBank => {
  const isAp = binding.ownerType === 'ap';
  const odf = !isAp ? data.odfs?.find(item => item.id === binding.ownerId) : undefined;
  const ap = isAp ? data.accessPoints.find(item => item.id === binding.ownerId) : undefined;
  return {
    endpointType: isAp ? 'ap_port' : 'odf_port',
    title: isAp ? `AP${binding.ownerId} პორტები` : `${odf?.displayLabel ?? binding.ownerId} პორტები`,
    subtitle: isAp ? `${ap?.portCount ?? 0} პორტი` : `${odf?.portCapacity ?? 0} პორტი`,
    segmentId: null, legacyCableId: null,
    sourceLabel: isAp ? `AP${binding.ownerId}` : odf?.displayLabel ?? binding.ownerId,
    capacity: isAp ? ap?.portCount ?? 0 : odf?.portCapacity ?? 0,
  };
};

export function portOperationalStatus(data: Inventory, ownerType: 'odf' | 'ap', ownerId: string, portNumber: number): PortOperationalStatus {
  if (ownerType === 'ap') {
    const flow = data.apPortFlows?.find(item => item.accessPointId === ownerId && item.portNumber === portNumber);
    const mapping = data.prototypePortMappings?.find(item => item.accessPointId === ownerId && item.portNumber === portNumber);
    const allocation = flow?.administrativeAllocation ?? mapping?.administrativeAllocation;
    const availability = flow?.commercialAvailability ?? mapping?.commercialAvailability;
    if (allocation === 'reserved') return 'reserved';
    if (allocation === 'blocked' || availability === 'unavailable') return 'unavailable';
    const usage = flow?.physicalUsage ?? mapping?.physicalUsage;
    return usage === 'in_use' ? 'in_use' : usage === 'unused' ? 'unused' : 'unknown';
  }
  const port = data.odfPorts?.find(item => item.odfId === ownerId && item.number === portNumber);
  if (!port) return 'unknown';
  if (port.allocation === 'reserved') return 'reserved';
  if (port.allocation === 'blocked' || port.condition === 'broken' || port.condition === 'damaged') return 'unavailable';
  if (port.physicalOccupancy === 'empty') return 'unused';
  if (port.physicalOccupancy !== 'unknown') return 'in_use';
  return 'unknown';
}

export function organizationUsesForLineages(data: Inventory, lineageIds: string[]) {
  return [...new Set((data.fiberUseAssignments ?? []).filter(use => use.lineageIds.some(id => lineageIds.includes(id))).map(use => use.organizationId))];
}

function lineagesForFiber(data: Inventory, segmentId: string, fiberNumber: number) {
  return (data.fiberLineages ?? []).filter(lineage => lineage.lifecycleStatus !== 'superseded' && lineage.legs.some(leg => leg.segmentId === segmentId && leg.fiberNumber === fiberNumber)).map(lineage => lineage.id);
}

function fiberRow(data: Inventory, side: NodeFiberTransitionSide, lineageIds = lineagesForFiber(data, side.segmentId, side.fiberNumber)): ConnectionBankRow {
  const cable = data.cables.find(item => item.id === side.segmentId);
  return {
    id: `${side.segmentId}:F${side.fiberNumber}`, endpointType: 'cable_fiber', segmentId: side.segmentId,
    fiberNumber: side.fiberNumber, portOwnerType: null, portOwnerId: null, portNumber: null,
    tubeNumber: side.tubeNumber, tubeColor: side.tubeColor, fiberColor: side.fiberColor,
    status: 'unknown', organizationUseIds: organizationUsesForLineages(data, lineageIds),
    label: `C${cable?.legacyCableId ?? side.segmentId}/F${pad(side.fiberNumber)}`,
  };
}

function bindingFiberRow(data: Inventory, binding: PortTopologyBinding, lineageIds: string[]): ConnectionBankRow {
  return fiberRow(data, {
    segmentId: binding.segmentId, fiberNumber: binding.fiberNumber, tubeNumber: binding.tubeNumber,
    tubeColor: binding.tubeColor, fiberColor: binding.fiberColor,
  }, lineageIds);
}

function bindingPortRow(data: Inventory, binding: PortTopologyBinding, lineageIds: string[]): ConnectionBankRow {
  const owner = binding.ownerType === 'ap' ? `AP${binding.ownerId}` : binding.ownerId === TSAGERI_ODF_ID ? 'AGG5' : 'ლენტეხი';
  return {
    id: `${binding.ownerType}:${binding.ownerId}:P${binding.portNumber}`,
    endpointType: binding.ownerType === 'ap' ? 'ap_port' : 'odf_port', segmentId: null, fiberNumber: null,
    portOwnerType: binding.ownerType, portOwnerId: binding.ownerId, portNumber: binding.portNumber,
    tubeNumber: null, tubeColor: null, fiberColor: binding.fiberColor,
    status: portOperationalStatus(data, binding.ownerType, binding.ownerId, binding.portNumber),
    organizationUseIds: organizationUsesForLineages(data, lineageIds), label: `${owner}/Port${binding.portNumber}`,
  };
}

function nodeForBinding(data: Inventory, binding: PortTopologyBinding): AssetRef {
  if (binding.ownerType === 'ap') return { kind: 'ap', id: binding.ownerId };
  return { kind: 'aggregation', id: binding.ownerId === TSAGERI_ODF_ID ? '5' : LENTEKHI_AGGREGATION_ID };
}

function routeForSegments(data: Inventory, segmentIds: string[]) {
  return data.cableRoutes?.find(route => route.legs.some(leg => leg.segmentId && segmentIds.includes(leg.segmentId)) || route.branches.some(branch => branch.segmentIds.some(id => segmentIds.includes(id))))?.id ?? TSAGERI_ROUTE_ID;
}

function transitionSheets(data: Inventory): ConnectionSheet[] {
  const groups = new Map<string, typeof data.nodeFiberTransitions>();
  for (const transition of data.nodeFiberTransitions ?? []) {
    if (!transition.active) continue;
    const pair = transition.z ? [transition.a.segmentId, transition.z.segmentId].sort() : [transition.a.segmentId, transition.transitionType === 'intentional_termination' ? 'TERMINATION' : 'UNRESOLVED'];
    const groupKey = `${transition.node.kind}:${transition.node.id}:${pair.join(':')}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), transition]);
  }
  return [...groups.entries()].map(([groupKey, transitions]) => {
    const first = transitions![0];
    const leftSegmentId = first.a.segmentId;
    const rightSegmentId = first.z?.segmentId ?? null;
    const leftBank = segmentBank(data, leftSegmentId);
    const terminating = first.transitionType === 'intentional_termination';
    const rightBank = rightSegmentId ? segmentBank(data, rightSegmentId) : {
      endpointType: terminating ? 'termination' as const : 'unresolved' as const, title: terminating ? 'SC225-ზე დასრულება' : 'AP მხარე დაუზუსტებელია', subtitle: terminating ? 'ცნობილი საბოლოო წერტილი' : 'ზუსტი AP/ჟილა უცნობია',
      segmentId: null, legacyCableId: null, sourceLabel: null, capacity: leftBank.capacity,
    };
    const rows: ConnectionSheetRow[] = transitions!.map((transition): ConnectionSheetRow => {
      const lineageIds = lineagesForFiber(data, transition.a.segmentId, transition.a.fiberNumber);
      const unresolved: ConnectionBankRow = {
        id: `${transition.id}:unresolved`, endpointType: 'unresolved', segmentId: null, fiberNumber: null,
        portOwnerType: null, portOwnerId: null, portNumber: null, tubeNumber: null, tubeColor: null,
        fiberColor: null, status: 'unknown', organizationUseIds: [], label: 'გაგრძელება დაუდგენელია',
      };
      const terminal: ConnectionBankRow = { ...unresolved, id: `${transition.id}:termination`, endpointType: 'termination', label: 'მთავრდება SC225-ზე' };
      const right = transition.z ? fiberRow(data, transition.z, lineageIds) : transition.transitionType === 'intentional_termination' ? terminal : unresolved;
      return {
        id: `CSR-${transition.id}`, left: fiberRow(data, transition.a, lineageIds), right,
        nodeFiberTransitionId: transition.id, portTopologyBindingId: null,
        state: transition.z ? 'exact' : transition.transitionType === 'intentional_termination' ? 'termination' : 'unresolved',
        numberChanged: !!transition.z && transition.a.fiberNumber !== transition.z.fiberNumber,
        tubeChanged: !!transition.z && (transition.a.tubeNumber !== transition.z.tubeNumber || transition.a.tubeColor?.key !== transition.z.tubeColor?.key),
        fiberColorChanged: !!transition.z && transition.a.fiberColor?.key !== transition.z.fiberColor?.key,
        lineageIds, evidenceLabel: transition.interpretationBasis,
      };
    });
    rows.sort((a, b) => (a.left.fiberNumber ?? 0) - (b.left.fiberNumber ?? 0));
    return {
      id: `CS-${groupKey.replaceAll(':', '-')}`, node: first.node, nodeLabel: assetLabel(first.node, data),
      relationshipLabel: terminating ? `C${leftBank.legacyCableId} · მთავრდება SC225-ზე` : `${leftBank.legacyCableId ? `C${leftBank.legacyCableId}` : leftBank.title} ↔ ${rightBank.legacyCableId ? `C${rightBank.legacyCableId}` : rightBank.title}`,
      routeId: routeForSegments(data, [leftSegmentId, ...(rightSegmentId ? [rightSegmentId] : [])]),
      leftBank, rightBank, rows, source: first.source,
      notes: ['ერთი ხაზი წარმოადგენს ერთ ზუსტ ლოკალურ გადასვლას.', 'ხაზის ფერი მდგომარეობას აჩვენებს და არა ჟილის ფიზიკურ ფერს.'],
    };
  });
}

function portSheets(data: Inventory): ConnectionSheet[] {
  const groups = new Map<string, PortTopologyBinding[]>();
  for (const binding of data.portTopologyBindings ?? []) {
    const key = `${binding.ownerType}:${binding.ownerId}:${binding.segmentId}`;
    groups.set(key, [...(groups.get(key) ?? []), binding]);
  }
  return [...groups.entries()].map(([groupKey, bindings]) => {
    const first = bindings[0], node = nodeForBinding(data, first), leftBank = portBank(data, first), rightBank = segmentBank(data, first.segmentId);
    const rows: ConnectionSheetRow[] = bindings.map((binding): ConnectionSheetRow => {
      const lineageIds = binding.lineageIds.length ? binding.lineageIds : lineagesForFiber(data, binding.segmentId, binding.fiberNumber);
      return {
        id: `CSR-${binding.id}`, left: bindingPortRow(data, binding, lineageIds), right: bindingFiberRow(data, binding, lineageIds),
        nodeFiberTransitionId: null, portTopologyBindingId: binding.id, state: 'exact', numberChanged: binding.portNumber !== binding.fiberNumber,
        tubeChanged: false, fiberColorChanged: false, lineageIds, evidenceLabel: binding.notes[0] ?? binding.directionLabel,
      };
    }).sort((a, b) => (a.left.portNumber ?? 0) - (b.left.portNumber ?? 0));
    return {
      id: `CS-${groupKey.replaceAll(':', '-')}`, node, nodeLabel: assetLabel(node, data),
      relationshipLabel: `${leftBank.title} ↔ C${rightBank.legacyCableId}`, routeId: first.routeId,
      leftBank, rightBank, rows, source: first.source,
      notes: ['პორტის კავშირი PortTopologyBinding-იდანაა; იგი ფიზიკურ splice/patch ოპერაციას თავისით არ ამტკიცებს.'],
    };
  });
}

export function buildConnectionSheets(data: Inventory): ConnectionSheet[] {
  return [...transitionSheets(data), ...portSheets(data)].sort((a, b) => a.nodeLabel.localeCompare(b.nodeLabel, 'en') || a.relationshipLabel.localeCompare(b.relationshipLabel, 'en'));
}

export function connectionSheetsForNode(data: Inventory, node: AssetRef) {
  return (data.connectionSheets ?? []).filter(sheet => sameAsset(sheet.node, node));
}

export function connectionSheetForTransition(data: Inventory, transitionId: string) {
  return (data.connectionSheets ?? []).find(sheet => sheet.rows.some(row => row.nodeFiberTransitionId === transitionId));
}

export function connectionSheetForPort(data: Inventory, ownerType: 'odf' | 'ap', ownerId: string, portNumber: number) {
  return (data.connectionSheets ?? []).find(sheet => sheet.rows.some(row => row.left.portOwnerType === ownerType && row.left.portOwnerId === ownerId && row.left.portNumber === portNumber));
}

export function connectionSheetForFiberAtNode(data: Inventory, node: AssetRef, segmentId: string, fiberNumber: number) {
  return connectionSheetsForNode(data, node).find(sheet => sheet.rows.some(row => [row.left, row.right].some(side => side.segmentId === segmentId && side.fiberNumber === fiberNumber)));
}

export function applyIteration22(data: Inventory): Inventory {
  data.connectionSheets = buildConnectionSheets(data);
  data.closurePhotos = [];
  return data;
}
