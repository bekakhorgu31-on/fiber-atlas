import { cableRoutesForSegment } from './cableRoutes';
import {
  allocationLabels, assetLabel, cableDisplayName, colorLabel, commercialRoles, conditionLabels,
  fiberConnections, fiberLabel, fiberTube, findCable, findFiber, otherEnd, sameAsset, traceFiber,
  typedAssetLabel,
} from './network';
import { relationshipState } from './pathReview';
import type { Connection, Fiber, Inventory, OpticalEnd, PhysicalCable, RelationshipReviewState, Route, SourceRef } from './types';

export type OperationalPathKind = 'direction' | 'fiber' | 'closure' | 'connection' | 'odf' | 'port' | 'patch_cord' | 'ap' | 'passive_component' | 'destination' | 'stop';
export type OperationalPathState = 'current' | 'accepted' | 'candidate' | 'conflicting' | 'unresolved';
export interface OperationalPathStep {
  id: string;
  kind: OperationalPathKind;
  label: string;
  detail: string;
  state: OperationalPathState;
  route?: Route;
  source?: SourceRef;
}
export interface FiberContinuation {
  id: string;
  state: RelationshipReviewState | 'unmapped';
  label: string;
  legacyLabel: string;
  operation: string;
  locationLabel: string;
  destinationContext: string;
  sourceColor: string;
  destinationColor: string | null;
  other: OpticalEnd;
  connection: Connection;
}
export interface FiberDetailModel {
  fiber: Fiber;
  cableId: string;
  cableLegacyId: string;
  fiberLabel: string;
  segmentLabel: string;
  compactPhysical: string;
  primaryPhysicalColor: string;
  pathSteps: OperationalPathStep[];
  currentClosure: { id: string; label: string };
  continuations: FiberContinuation[];
  acceptedContinuations: FiberContinuation[];
  candidateContinuations: FiberContinuation[];
  conflictingContinuations: FiberContinuation[];
  currentEventSummary: string;
  physicalCable: PhysicalCable | null;
  physicalCableRelation: 'accepted' | 'candidate' | 'unresolved';
  physicalCableCandidate: PhysicalCable | null;
  routeId: string | null;
  routeLabel: string;
  routeContext: string;
  upstreamSummary: string;
  exactUpstreamOdfPort: null;
  broaderDestination: string;
  condition: string;
  availability: 'Assigned' | 'Reserved' | 'Confirmed Available' | 'Blocked/Damaged' | 'Unknown';
  usage: string;
  commercialDetails: ReturnType<typeof commercialRoles>;
  needsClarification: string[];
  strictStopReasons: string[];
  evidenceSources: SourceRef[];
  technical: { canonicalFiberId: string; canonicalSegmentId: string; legacyCableId: string; legacyFullLabels: string[] };
}

const isAccepted = (connection: Connection) => relationshipState(connection) === 'accepted';
const stateFor = (connection: Connection): OperationalPathState => {
  const state = relationshipState(connection);
  return state === 'accepted' ? 'accepted' : state === 'candidate' ? 'candidate' : state === 'conflicting' ? 'conflicting' : 'unresolved';
};
const otherFiberColor = (data: Inventory, end: OpticalEnd) => end.kind === 'fiber' ? colorLabel(findFiber(data, end.cableId, end.fiber)?.physicalColor) : null;
const endShortLabel = (data: Inventory, end: OpticalEnd) => end.kind === 'fiber'
  ? `C${findCable(data, end.cableId)?.legacyCableId ?? end.cableId}/${fiberLabel(end.fiber)}`
  : end.kind === 'port' ? `${typedAssetLabel(end.at)} / Port ${end.port}` : typedAssetLabel(end.asset);

function destinationContext(data: Inventory, end: OpticalEnd, locationId: string): string {
  if (end.kind === 'asset') return typedAssetLabel(end.asset);
  if (end.kind === 'port') return `${typedAssetLabel(end.at)} / Port ${end.port}`;
  const cable = findCable(data, end.cableId);
  if (!cable) return 'Destination unresolved';
  const next = sameAsset(cable.endpointA, { kind: 'closure', id: locationId }) ? cable.endpointB : cable.endpointA;
  return `toward ${typedAssetLabel(next)}`;
}

function continuation(data: Inventory, cableId: string, number: number, connection: Connection): FiberContinuation {
  const other = otherEnd(connection, cableId, number, data);
  return {
    id: connection.id, state: relationshipState(connection), label: endShortLabel(data, other),
    legacyLabel: endShortLabel(data, other), operation: connection.operation === 'unknown' ? 'Operation unknown' : connection.operation,
    locationLabel: assetLabel(connection.location), destinationContext: destinationContext(data, other, connection.location.id),
    sourceColor: colorLabel(findFiber(data, cableId, number)?.physicalColor), destinationColor: otherFiberColor(data, other), other, connection,
  };
}

function mapTraceSteps(data: Inventory, cableId: string, number: number): OperationalPathStep[] {
  const result = traceFiber(data, cableId, number, true);
  return result.steps.map(step => {
    if (step.kind === 'cable') {
      const cable = findCable(data, step.cableId!);
      return { id: step.id, kind: 'fiber', label: `C${cable?.legacyCableId ?? step.cableId}/${fiberLabel(step.fiber!)}`, detail: cable ? cableDisplayName(cable, data) : step.detail, state: step.cableId === cableId && step.fiber === number ? 'current' : step.candidate ? 'candidate' : 'accepted', route: step.route, source: step.source };
    }
    if (step.kind === 'connection') return { id: step.id, kind: 'closure', label: step.title, detail: step.detail, state: step.candidate ? 'candidate' : step.relationshipState === 'accepted' ? 'accepted' : step.relationshipState === 'conflicting' ? 'conflicting' : 'unresolved', route: step.route, source: step.source };
    if (step.kind === 'port') return { id: step.id, kind: 'port', label: step.title, detail: step.detail, state: step.candidate ? 'candidate' : 'accepted', route: step.route, source: step.source };
    return { id: step.id, kind: step.title.startsWith('AP') ? 'ap' : 'destination', label: step.title, detail: step.detail, state: step.candidate ? 'candidate' : 'accepted', route: step.route, source: step.source };
  });
}

function availabilityFor(data: Inventory, fiber: Fiber): FiberDetailModel['availability'] {
  if (fiber.condition === 'damaged' || fiber.condition === 'blocked') return 'Blocked/Damaged';
  if (fiber.allocation === 'assigned') return 'Assigned';
  if (fiber.allocation === 'reserved') return 'Reserved';
  const noObligation = fiber.rights.state === 'none' && fiber.service.state === 'none' && !data.assignments.some(item => item.fiberId === fiber.id) && !data.rights.some(item => item.fiberId === fiber.id);
  if (fiber.allocation === 'unallocated' && fiber.condition === 'serviceable' && noObligation && ['documentation_reviewed', 'field_verified'].includes(fiber.verification)) return 'Confirmed Available';
  return 'Unknown';
}

function usageFor(data: Inventory, fiber: Fiber): string {
  const internal = (data.internalUses ?? []).find(item => item.fiberIds.includes(fiber.id));
  if (internal) return 'OpenNet internal use';
  if (fiber.rights.state === 'known' || data.rights.some(item => item.fiberId === fiber.id)) return 'Dark fiber / strand right';
  if (fiber.service.state === 'known' || data.assignments.some(item => item.fiberId === fiber.id)) return 'Service assigned';
  if (fiber.allocation === 'reserved') return 'Reserved';
  if (availabilityFor(data, fiber) === 'Confirmed Available') return 'Confirmed available';
  return 'Unknown';
}

export function buildFiberDetailModel(data: Inventory, cableToken: string, number: number): FiberDetailModel | null {
  const cable = findCable(data, cableToken), fiber = findFiber(data, cableToken, number);
  if (!cable || !fiber) return null;
  const tube = fiberTube(data, fiber);
  const physicalCable = (data.physicalCables ?? []).find(item => item.id === cable.physicalCableId) ?? null;
  const physicalCableCandidate = physicalCable ? null : (data.physicalCables ?? []).find(item => item.segmentMemberships.some(member => member.segmentId === cable.id && member.state === 'candidate')) ?? null;
  const route = cableRoutesForSegment(data, cable.id)[0] ?? null;
  const currentAsset = cable.endpointB.kind === 'closure' ? cable.endpointB : cable.endpointA;
  const allConnections = fiberConnections(data, cable.id, number);
  const eventConnections = allConnections.filter(item => sameAsset(item.location, currentAsset));
  const continuations = eventConnections.map(item => continuation(data, cable.id, number, item));
  const acceptedContinuations = continuations.filter(item => item.state === 'accepted');
  const candidateContinuations = continuations.filter(item => item.state === 'candidate');
  const conflictingContinuations = continuations.filter(item => item.state === 'conflicting');
  const currentEventSummary = conflictingContinuations.length
    ? `Conflicting source evidence at ${typedAssetLabel(currentAsset)}`
    : acceptedContinuations.length ? `Accepted continuation: ${acceptedContinuations.map(item => item.label).join(' · ')}`
      : candidateContinuations.length ? `No accepted connection at ${typedAssetLabel(currentAsset)} · ${candidateContinuations.length} candidate continuation${candidateContinuations.length === 1 ? '' : 's'}`
        : `No accepted connection at ${typedAssetLabel(currentAsset)} · no candidate mapping`;
  const commercialDetails = commercialRoles(data, cable.id, number);
  const clarification = new Set<string>();
  if (eventConnections.some(item => item.operation === 'unknown')) clarification.add('Physical operation at current closure');
  clarification.add('Exact upstream ODF port');
  clarification.add('Fiber termination / patch mapping');
  if (physicalCable?.endA.state === 'unresolved' || !physicalCable) clarification.add('PhysicalCable upstream origin');
  if (fiber.condition === 'unknown') clarification.add('Fiber condition');
  if (fiber.allocation === 'unknown') clarification.add('Administrative allocation');
  if (fiber.rights.state === 'unknown') clarification.add('Strand rights');
  if (usageFor(data, fiber) === 'Unknown') clarification.add('Service / use');
  if (!acceptedContinuations.length) clarification.add(`Exact continuation at ${typedAssetLabel(currentAsset)}`);
  const strict = traceFiber(data, cable.id, number, false);
  const acceptedDestination = strict.steps.filter(step => step.kind === 'asset' || step.kind === 'port').at(-1)?.title;
  const destination = acceptedDestination ?? route?.destination.label ?? 'Direction unresolved';
  const primaryColor = colorLabel(fiber.physicalColor);
  const compactPhysical = tube?.basis === 'documented'
    ? `Tube ${tube.number} · Position ${fiber.positionInTube ?? 'unknown'}/12 · ${primaryColor}`
    : `Tube: not confirmed${tube?.proposedNumber ? ` · Proposed group ${tube.proposedNumber}` : ''} · Fiber color: ${primaryColor}`;
  const evidenceSources = [cable.source, ...eventConnections.map(item => item.source), ...(fiber.physicalEvidence ? [fiber.physicalEvidence.source] : [])];
  return {
    fiber, cableId: cable.id, cableLegacyId: cable.legacyCableId, fiberLabel: fiberLabel(number),
    segmentLabel: `C${cable.legacyCableId} · ${cableDisplayName(cable, data)}`, compactPhysical, primaryPhysicalColor: primaryColor,
    pathSteps: mapTraceSteps(data, cable.id, number), currentClosure: { id: currentAsset.id, label: typedAssetLabel(currentAsset) },
    continuations, acceptedContinuations, candidateContinuations, conflictingContinuations, currentEventSummary,
    physicalCable, physicalCableRelation: physicalCable ? 'accepted' : physicalCableCandidate ? 'candidate' : 'unresolved', physicalCableCandidate,
    routeId: route?.id ?? null, routeLabel: route?.displayName ?? 'Cable Route unresolved',
    routeContext: route ? `… → ${typedAssetLabel(cable.endpointA)} → [C${cable.legacyCableId}] → ${typedAssetLabel(cable.endpointB)} → …` : 'Route context unresolved',
    upstreamSummary: physicalCable?.endA.state === 'unresolved' ? physicalCable.endA.label : physicalCable?.endA.label ?? (route ? `Toward ${route.origin.label}; exact fiber origin unresolved` : 'Upstream physical origin unknown'),
    exactUpstreamOdfPort: null, broaderDestination: destination,
    condition: conditionLabels[fiber.condition], availability: availabilityFor(data, fiber), usage: usageFor(data, fiber), commercialDetails,
    needsClarification: [...clarification], strictStopReasons: strict.stops.map(item => item.message), evidenceSources,
    technical: { canonicalFiberId: fiber.id, canonicalSegmentId: cable.id, legacyCableId: cable.legacyCableId, legacyFullLabels: [...cable.legacyLabels] },
  };
}

export const fiberDetailAvailability = availabilityFor;
export const fiberDetailUsage = usageFor;
export const fiberContinuationIsAccepted = isAccepted;
