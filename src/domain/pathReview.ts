import targetPathEvidenceJson from '../data/target-path-evidence.json';
import { standardColor } from './colors';
import type { Connection, ConnectionReview, Inventory, PhysicalColorKey, SourceRef } from './types';

type RelationshipEvidence = {
  connectionId: string;
  reviewResult: 'accepted_connectivity' | 'accepted_to_asset_port_candidate';
  operation: 'unknown';
  candidatePort?: number;
  sourceShapeIds: string[];
  rawGeometry: Record<string, number | number[]>;
  basis: string;
  warnings: string[];
};

type C173PhysicalRecord = {
  fiberNumber: number;
  tubeNumber: 1;
  positionInTube: number;
  fiberColorKey: PhysicalColorKey;
  tubeColorKey: 'blue';
  rawInnerColor: string;
  rawOuterColor: string;
  sc218: { groupShapeId: string; markerShapeId: string; labelShapeId: string };
  ap51: { groupShapeId: string; markerShapeId: string; labelShapeId: string };
};

type TargetPathEvidence = {
  sourceSha256: string;
  source: { file: string; page: string; pageId: string; part: string };
  interpretationRule: string;
  colorRule: string;
  review: { reviewer: string; reviewedAt: string; basis: string };
  relationships: RelationshipEvidence[];
  c173FirstTube: { segmentId: string; reviewResult: string; records: C173PhysicalRecord[] };
};

export const targetPathEvidence = targetPathEvidenceJson as unknown as TargetPathEvidence;

function relationshipSource(item: RelationshipEvidence): SourceRef {
  return {
    file: targetPathEvidence.source.file,
    page: targetPathEvidence.source.page,
    pageId: targetPathEvidence.source.pageId,
    part: targetPathEvidence.source.part,
    shapeIds: item.sourceShapeIds,
    rawValue: JSON.stringify(item.rawGeometry),
    interpretationRule: targetPathEvidence.interpretationRule,
    note: item.basis,
  };
}

function reviewFor(item: RelationshipEvidence): ConnectionReview {
  const assetLevel = item.reviewResult === 'accepted_to_asset_port_candidate';
  return {
    state: 'accepted',
    endpointAIdentity: 'documentation_reviewed',
    endpointZIdentity: 'documentation_reviewed',
    opticalConnectivity: 'documentation_reviewed',
    operation: 'needs_verification',
    destinationAsset: assetLevel ? 'documentation_reviewed' : undefined,
    port: assetLevel ? 'needs_verification' : undefined,
    candidatePort: item.candidatePort ?? null,
    containment: assetLevel ? 'needs_verification' : undefined,
    sourceSha256: targetPathEvidence.sourceSha256,
    reviewer: targetPathEvidence.review.reviewer,
    reviewedAt: targetPathEvidence.review.reviewedAt,
    basis: item.basis,
    warnings: [...item.warnings],
  };
}

function applyReviewedRelationship(inventory: Inventory, item: RelationshipEvidence): void {
  const connection = inventory.connections.find(record => record.id === item.connectionId);
  if (!connection) throw new Error(`Missing target-path connection ${item.connectionId}`);
  connection.approved = true;
  connection.operation = 'unknown';
  connection.verification = 'documentation_reviewed';
  connection.review = reviewFor(item);
  connection.source = relationshipSource(item);
  connection.inference = item.basis;
  if (item.reviewResult === 'accepted_to_asset_port_candidate') {
    connection.z = { kind: 'asset', asset: { kind: 'ap', id: '51' }, at: { kind: 'ap', id: '51' } };
  }
}

function applyReviewedC173FirstTube(inventory: Inventory): void {
  const segmentId = targetPathEvidence.c173FirstTube.segmentId;
  const tube = inventory.tubes.find(record => record.cableId === segmentId && record.proposedNumber === 1);
  if (!tube) throw new Error('Missing provisional C173 group 1');
  const records = targetPathEvidence.c173FirstTube.records;
  tube.number = 1;
  tube.proposedNumber = null;
  tube.basis = 'documented';
  tube.verification = 'documentation_reviewed';
  tube.physicalColor = standardColor('blue');
  tube.physicalEvidence = {
    source: {
      file: targetPathEvidence.source.file,
      page: targetPathEvidence.source.page,
      pageId: targetPathEvidence.source.pageId,
      part: targetPathEvidence.source.part,
      shapeIds: [...new Set(records.flatMap(record => [record.sc218.groupShapeId, record.sc218.markerShapeId, record.ap51.groupShapeId, record.ap51.markerShapeId]))],
      rawValue: 'outer=4 at SC218 and AP51',
      interpretationRule: targetPathEvidence.colorRule,
      note: 'Only C173 Tube 1 / F01–F12 was reviewed. Tube 2 remains provisional.',
    },
    ruleVersion: targetPathEvidence.colorRule,
    convention: 'user-confirmed-12-fibers-per-tube/1',
    rawOuterColor: '4',
    warnings: ['Only the first C173 tube is accepted; the remaining group is not upgraded.'],
  };

  for (const record of records) {
    const fiber = inventory.fibers.find(item => item.cableId === segmentId && item.number === record.fiberNumber);
    if (!fiber) throw new Error(`Missing C173/F${record.fiberNumber}`);
    fiber.tubeId = tube.id;
    fiber.positionInTube = record.positionInTube;
    fiber.physicalColor = standardColor(record.fiberColorKey);
    fiber.proposedColor = null;
    fiber.proposedPositionInTube = null;
    fiber.verification = 'documentation_reviewed';
    fiber.physicalEvidence = {
      source: {
        file: targetPathEvidence.source.file,
        page: targetPathEvidence.source.page,
        pageId: targetPathEvidence.source.pageId,
        part: targetPathEvidence.source.part,
        shapeIds: [record.sc218.groupShapeId, record.sc218.markerShapeId, record.sc218.labelShapeId, record.ap51.groupShapeId, record.ap51.markerShapeId, record.ap51.labelShapeId],
        rawValue: `inner=${record.rawInnerColor}; outer=${record.rawOuterColor}`,
        interpretationRule: targetPathEvidence.colorRule,
        note: 'Matching marker style is present at both reviewed C173 endpoints.',
      },
      ruleVersion: targetPathEvidence.colorRule,
      convention: 'user-confirmed-12-fibers-per-tube/1',
      rawInnerColor: record.rawInnerColor,
      rawOuterColor: record.rawOuterColor,
      warnings: [],
    };
    fiber.notes = fiber.notes.filter(note => !note.includes('12-ჟილიანი ჯგუფი'));
    fiber.notes.push('C173-ის პირველი ტუბის ფიზიკური ატრიბუტები ემთხვევა SC218-ისა და AP51-ის ორივე მარკერულ რიგში; მეორე ტუბი არ არის მიღებული.');
  }

  const cable = inventory.cables.find(record => record.id === segmentId)!;
  cable.notes.push('მხოლოდ ტუბი 1 / F01–F12 არის ფიზიკურად განხილული და მიღებული; C173-ის დარჩენილი ჯგუფი კვლავ სავარაუდოა.');
}

export function applyIteration07PathReview(inventory: Inventory): Inventory {
  applyReviewedC173FirstTube(inventory);
  targetPathEvidence.relationships.forEach(item => applyReviewedRelationship(inventory, item));
  return inventory;
}

export function relationshipState(connection: Connection | null | undefined): ConnectionReview['state'] | 'unmapped' {
  if (!connection) return 'unmapped';
  if (connection.review) return connection.review.state;
  if (connection.verification === 'conflicting') return 'conflicting';
  return connection.approved ? 'accepted' : 'candidate';
}

export function targetPathSummary(inventory: Inventory) {
  const targetIds = new Set(targetPathEvidence.relationships.map(item => item.connectionId));
  const relationships = inventory.connections.filter(connection => targetIds.has(connection.id));
  return {
    target: 'C171/F29 → C172/F29 → C173/F01 → AP51',
    acceptedOpticalHops: relationships.filter(connection => relationshipState(connection) === 'accepted').length,
    candidateHops: relationships.filter(connection => relationshipState(connection) === 'candidate').length + relationships.filter(connection => connection.review?.candidatePort != null && connection.review.port === 'needs_verification').length,
    unresolvedOperations: relationships.filter(connection => connection.operation === 'unknown').length,
    conflicts: relationships.filter(connection => relationshipState(connection) === 'conflicting').length,
    strictEndpoint: 'AP51 · პორტი უცნობია',
    candidateEndpoint: 'AP51 / Port 1 · სავარაუდო',
    physicalCoverage: 'C171 უცნობი · C172 48/48 · C173 12/24',
  };
}
