import sourceEvidenceJson from '../data/source-evidence.json';
import { c172PhysicalEvidence } from './colors';
import { targetPathEvidence } from './pathReview';
import type {
  ImportCandidate,
  ImportReviewDecision,
  ImportReviewState,
  ImportRun,
  SourceRef,
} from './types';

type EvidenceSource = {
  file: string;
  page: string;
  page_id?: string;
  part?: string;
  shape_ids: string[];
};
type EvidenceDocument = {
  analysis_date: string;
  source_sha256: string;
  method: string;
  counts: Record<string, number>;
  aggregations: Array<Record<string, unknown> & { id_candidate: string; name: string; capacity_ports?: number; capacity_evidence?: string; conflicting_property_id?: string; source: EvidenceSource }>;
  closures: Array<Record<string, unknown> & { id: string; model: string; declared_cable_count: number; closure_role_raw: string; mounting_raw: string | null; coordinates_raw: string; coordinate_status: string; source: EvidenceSource }>;
  access_points: Array<Record<string, unknown> & { id: string; entity_type: string; legacy_symbol_type: string; address_raw: string; capacity_ports: number; asset_vs_panel_relationship: string; source: EvidenceSource }>;
  cables: Array<Record<string, unknown> & { id: string; legacy_label: string; end_a: { id: string; kind: string }; end_z: { id: string; kind: string }; fiber_count: number; source: EvidenceSource }>;
  closure_218_connection_candidates: Array<Record<string, unknown> & { closure: string; from_cable: string; from_fiber: number; to_cable: string; to_fiber: number; evidence: string; approval: string; operation_kind: string; line_shape: string; endpoint_label_shapes: string[]; line_color: string; source: EvidenceSource }>;
  issues: Array<Record<string, unknown> & { id: string; severity: string; topic: string; evidence: string; action: string; shape_ids?: string[]; translation?: string }>;
};

export const tsageriEvidence = sourceEvidenceJson as unknown as EvidenceDocument;

function stableValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableValue(item)}`).join(',')}}`;
  return JSON.stringify(value);
}

function hash(value: string): string {
  let h = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    h ^= value.charCodeAt(index);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

const sourceRef = (source: EvidenceSource, rawValue?: string, interpretationRule?: string): SourceRef => ({
  file: source.file,
  page: source.page,
  pageId: source.page_id,
  part: source.part,
  shapeIds: source.shape_ids,
  rawValue,
  interpretationRule,
});

function candidate(
  document: EvidenceDocument,
  input: Omit<ImportCandidate, 'id' | 'reviewState' | 'verification' | 'provenance'> & {
    source: EvidenceSource;
    rawValue?: string;
    rule: string;
    method: ImportCandidate['provenance']['evidenceMethod'];
  },
): ImportCandidate {
  const { source, rawValue, rule, method, ...rest } = input;
  return {
    ...rest,
    id: `IC-${hash(`${document.source_sha256}:${rest.kind}:${rest.naturalKey}:${source.shape_ids.join(',')}`)}`,
    reviewState: 'unreviewed',
    verification: 'needs_verification',
    provenance: {
      sourceSha256: document.source_sha256,
      source: sourceRef(source, rawValue, rule),
      extractor: 'fiber-atlas-vsdx-raw/1',
      interpreter: 'tsageri-lentekhi-2025/2',
      evidenceMethod: method,
    },
  };
}

export function candidateFingerprint(item: ImportCandidate): string {
  return hash(stableValue({ kind: item.kind, naturalKey: item.naturalKey, interpreted: item.interpreted, source: item.provenance.source }));
}

export function buildTsageriImportRun(document: EvidenceDocument = tsageriEvidence): ImportRun {
  const candidates: ImportCandidate[] = [];

  for (const segment of document.cables) {
    candidates.push(candidate(document, {
      kind: 'cable_segment',
      naturalKey: `legacy-segment:${segment.id}`,
      title: `კაბელის მონაკვეთი C${segment.id}`,
      summary: `${segment.end_a.kind}:${segment.end_a.id} ↔ ${segment.end_z.kind}:${segment.end_z.id} · ${segment.fiber_count}F`,
      interpreted: {
        legacySegmentId: segment.id,
        legacyLabel: segment.legacy_label,
        endpointAType: segment.end_a.kind,
        endpointAId: segment.end_a.id,
        endpointZType: segment.end_z.kind,
        endpointZId: segment.end_z.id,
        fiberCount: segment.fiber_count,
        physicalCableId: null,
      },
      source: segment.source,
      rawValue: segment.legacy_label,
      rule: 'ოთხნაწილიანი წარწერა იკითხება როგორც მონაკვეთის ID / A ბოლო / Z ბოლო / ჟილების რაოდენობა.',
      method: 'label_grammar',
      warnings: ['კანდიდატი ჯერ არ არის მიღებული ინვენტარში.', 'ეს არის მონაკვეთი; საერთო ფიზიკურ კაბელთან კავშირი წყაროში არ დასტურდება.'],
      relatedIds: [segment.end_a.id, segment.end_z.id],
    }));
  }

  for (const closure of document.closures) {
    candidates.push(candidate(document, {
      kind: 'closure',
      naturalKey: `closure:${closure.id}`,
      title: `ქურო SC${closure.id}`,
      summary: `${closure.closure_role_raw} · ${closure.model}`,
      interpreted: {
        closureId: closure.id,
        model: closure.model,
        declaredCableCount: closure.declared_cable_count,
        role: closure.closure_role_raw,
        mounting: closure.mounting_raw,
        coordinatesRaw: closure.coordinates_raw,
        coordinateStatus: closure.coordinate_status,
      },
      source: closure.source,
      rawValue: closure.coordinates_raw,
      rule: 'ადგილობრივი Shape Data ველები ინახება როგორც ქუროს კანდიდატი; კოორდინატის ნედლი მნიშვნელობა უცვლელია.',
      method: 'property',
      warnings: closure.coordinate_status.includes('unconfirmed') ? ['კოორდინატის CRS/ღერძები დასადასტურებელია.'] : [],
      relatedIds: [],
    }));
  }

  for (const accessPoint of document.access_points) {
    candidates.push(candidate(document, {
      kind: 'access_point',
      naturalKey: `access-point:${accessPoint.id}`,
      title: `წვდომის წერტილი AP${accessPoint.id}`,
      summary: `${accessPoint.address_raw} · ${accessPoint.capacity_ports} პორტი`,
      interpreted: {
        accessPointId: accessPoint.id,
        legacySymbolType: accessPoint.legacy_symbol_type,
        address: accessPoint.address_raw,
        portCapacity: accessPoint.capacity_ports,
        assetPanelRelationship: accessPoint.asset_vs_panel_relationship,
      },
      source: accessPoint.source,
      rawValue: `${accessPoint.legacy_symbol_type} ${accessPoint.id}`,
      rule: 'იისფერი ODF სტენსილი ქმნის AP კანდიდატს; მოწყობილობა/პანელის კავშირი ცალკე გადამოწმებას მოითხოვს.',
      method: 'property',
      warnings: ['ODF არის ძველი სიმბოლო; აქტივისა და პანელის ურთიერთობა დასადასტურებელია.'],
      relatedIds: [],
    }));
  }

  for (const aggregation of document.aggregations) {
    const conflict = Boolean(aggregation.conflicting_property_id);
    candidates.push(candidate(document, {
      kind: 'aggregation',
      naturalKey: `aggregation:${aggregation.id_candidate}:${aggregation.name}`,
      title: `აგრეგაციის კანდიდატი ${aggregation.name}`,
      summary: `AGG${aggregation.id_candidate} · ${aggregation.capacity_ports == null ? 'ტევადობა უცნობია' : `${aggregation.capacity_ports} პორტი`}`,
      interpreted: {
        aggregationIdCandidate: aggregation.id_candidate,
        name: aggregation.name,
        portCapacity: aggregation.capacity_ports ?? null,
        capacityEvidence: aggregation.capacity_evidence ?? null,
        conflictingPropertyId: aggregation.conflicting_property_id ?? null,
      },
      source: aggregation.source,
      rawValue: `${aggregation.name} / ${aggregation.id_candidate}`,
      rule: 'ყვითელი აგრეგაციის სიმბოლო და მისი Shape Data გაერთიანებულია ერთ კანდიდატად.',
      method: 'property',
      warnings: conflict ? ['სათაური და Shape Data ID ერთმანეთს ეწინააღმდეგება; მიღებამდე საჭიროა იდენტობის გადაწყვეტა.'] : [],
      relatedIds: [],
    }));
  }

  for (const connection of document.closure_218_connection_candidates) {
    const isReviewedTarget = connection.closure === '218' && connection.from_cable === '172' && connection.from_fiber === 29 && connection.to_cable === '173' && connection.to_fiber === 1;
    const interpreted = candidate(document, {
      kind: 'connection',
      naturalKey: `SC${connection.closure}:C${connection.from_cable}/F${connection.from_fiber}:C${connection.to_cable}/F${connection.to_fiber}`,
      title: `SC${connection.closure} · C${connection.from_cable}/F${connection.from_fiber} → C${connection.to_cable}/F${connection.to_fiber}`,
      summary: `ხაზის ფერი ${connection.line_color} · ოპერაცია უცნობია`,
      interpreted: {
        closureId: connection.closure,
        fromSegmentId: connection.from_cable,
        fromFiber: connection.from_fiber,
        toSegmentId: connection.to_cable,
        toFiber: connection.to_fiber,
        operation: connection.operation_kind,
        approved: isReviewedTarget,
        opticalConnectivity: isReviewedTarget ? 'accepted' : 'candidate',
        operationVerification: 'unknown',
        lineColor: connection.line_color,
      },
      source: connection.source,
      rawValue: `${connection.line_shape} / ${connection.endpoint_label_shapes.join(', ')}`,
      rule: isReviewedTarget ? targetPathEvidence.interpretationRule : 'გეომეტრიული ბოლოების სიახლოვე ქმნის მხოლოდ კავშირის კანდიდატს; ფერი და ჟილის ნომერი უწყვეტობას არ ადასტურებს.',
      method: 'geometry',
      warnings: isReviewedTarget ? ['ოპტიკური კავშირი მიღებულია; ფიზიკური ოპერაცია და კასეტა უცნობია.', 'მეზობელი გეომეტრიული კანდიდატები ავტომატურად არ არის მიღებული.'] : ['გეომეტრიული კანდიდატი არ არის დამტკიცებული კავშირი.', 'ორივე ბოლოს ჟილის ნომერი და ფერი დამოუკიდებელი იდენტობაა.'],
      relatedIds: [`C${connection.from_cable}`, `C${connection.to_cable}`, `SC${connection.closure}`],
    });
    if (isReviewedTarget) {
      const accepted: ImportCandidate = {
        ...interpreted,
        reviewState: 'accepted',
        verification: 'documentation_reviewed',
        decision: { action: 'accepted', decidedAt: targetPathEvidence.review.reviewedAt, reviewer: targetPathEvidence.review.reviewer, note: targetPathEvidence.review.basis },
        acceptedRecordId: 'sc218-33098',
      };
      accepted.acceptedFingerprint = candidateFingerprint(accepted);
      candidates.push(accepted);
    } else {
      candidates.push(interpreted);
    }
  }

  for (const physical of c172PhysicalEvidence.records) {
    const source: EvidenceSource = {
      file: c172PhysicalEvidence.source.file,
      page: c172PhysicalEvidence.source.page,
      page_id: c172PhysicalEvidence.source.pageId,
      part: c172PhysicalEvidence.source.part,
      shape_ids: [c172PhysicalEvidence.source.groupShapeId, physical.markerShapeId, physical.labelShapeId],
    };
    const interpreted = candidate(document, {
      kind: 'fiber_physical',
      naturalKey: `C172/F${physical.fiberNumber}:physical`,
      title: `C172 / F${String(physical.fiberNumber).padStart(2, '0')} · ფიზიკური მარკერი`,
      summary: `ტუბი ${physical.tubeNumber} · პოზიცია ${physical.positionInTube} · ${physical.fiberColorKey ?? 'unresolved'} / ${physical.tubeColorKey}`,
      interpreted: {
        segmentId: 'CAB-000172',
        fiberNumber: physical.fiberNumber,
        sourceMarkerShape: physical.markerShapeId,
        sourceLabelShape: physical.labelShapeId,
        rawInnerColor: physical.rawInnerColor,
        fiberColorKey: physical.fiberColorKey,
        rawOuterRingColor: physical.rawOuterColor,
        observedOuterColorKey: physical.observedOuterColorKey,
        interpretedTubeColorKey: physical.tubeColorKey,
        tubeNumber: physical.tubeNumber,
        positionInTube: physical.positionInTube,
        interpretationRule: c172PhysicalEvidence.interpretationRule,
        connectorLineColorUsed: false,
      },
      source,
      rawValue: `inner=${physical.rawInnerColor}; outer=${physical.rawOuterColor}`,
      rule: c172PhysicalEvidence.interpretationRule,
      method: 'style',
      warnings: physical.warnings,
      relatedIds: ['CAB-000172', `CAB-000172:F${String(physical.fiberNumber).padStart(3, '0')}`, 'SC218'],
    });
    const accepted: ImportCandidate = {
      ...interpreted,
      reviewState: 'accepted',
      verification: 'documentation_reviewed',
      decision: {
        action: 'accepted',
        decidedAt: '2026-09-25T00:00:00.000Z',
        reviewer: 'network-owner',
        note: '12-fiber construction and marker/ring semantics confirmed for C172.',
      },
      acceptedRecordId: `CAB-000172:F${String(physical.fiberNumber).padStart(3, '0')}`,
    };
    accepted.acceptedFingerprint = candidateFingerprint(accepted);
    candidates.push(accepted);
  }

  const issueSource: EvidenceSource = { file: 'Tsageri-Lentekhi 2025.vsdx', page: 'ცაგერი-ლენტეხი', page_id: '4', part: 'visio/pages/page1.xml', shape_ids: [] };
  for (const issue of document.issues) {
    const source = { ...issueSource, shape_ids: issue.shape_ids ?? [] };
    candidates.push(candidate(document, {
      kind: 'annotation',
      naturalKey: `issue:${issue.id}`,
      title: `${issue.id} · ${issue.topic}`,
      summary: issue.action,
      interpreted: { severity: issue.severity, evidence: issue.evidence, translation: issue.translation ?? null, proposedAction: issue.action },
      source,
      rawValue: issue.evidence,
      rule: 'გაურკვეველი შენიშვნა ინახება ცალკე საკვლევ ჩანაწერად და არ ქმნის ოპტიკურ კავშირს ან მიღებულ აქტივს.',
      method: issue.severity.includes('owner') ? 'owner_confirmation' : 'annotation',
      warnings: issue.severity === 'resolved_by_owner' ? [] : ['საჭიროა ადამიანის განხილვა.'],
      relatedIds: [],
    }));
  }

  return {
    id: `IR-${document.source_sha256.slice(0, 12)}`,
    sourceFile: 'Tsageri-Lentekhi 2025.vsdx',
    sourceSha256: document.source_sha256,
    extractedAt: document.analysis_date,
    extractionMethod: document.method,
    rawArtifact: 'migration/tsageri-lentekhi.raw.json.gz',
    rawSummary: {
      pages: document.counts.pages,
      allShapes: document.counts.all_page_shapes_including_subshapes,
      topLevelShapes: document.counts.top_level_shapes,
      textShapes: document.counts.direct_text_shapes,
      localPropertyShapes: document.counts.shapes_with_local_property_sections,
      connectRows: document.counts.connect_rows,
    },
    interpreter: 'tsageri-lentekhi-2025/2',
    candidates,
    acceptedRecordIds: [...new Set(candidates.flatMap(item => item.acceptedRecordId ? [item.acceptedRecordId] : []))],
    conflicts: [],
  };
}

export function reviewCandidate(item: ImportCandidate, decision: ImportReviewDecision): ImportCandidate {
  const state: ImportReviewState = decision.action;
  const reviewed = { ...item, reviewState: state, decision };
  if (state === 'accepted' || state === 'corrected') {
    reviewed.acceptedFingerprint = candidateFingerprint(reviewed);
    reviewed.acceptedRecordId = item.acceptedRecordId ?? `accepted:${item.kind}:${item.naturalKey}`;
  } else {
    delete reviewed.acceptedFingerprint;
    delete reviewed.acceptedRecordId;
  }
  return reviewed;
}

/**
 * Reimport is repeatable: identical candidates keep review decisions. Changed evidence
 * for an accepted/corrected natural key becomes an explicit conflict and never overwrites it.
 */
export function reconcileImportRun(existing: ImportRun, incoming: ImportRun): ImportRun {
  const priorByNaturalKey = new Map(existing.candidates.map(item => [`${item.kind}:${item.naturalKey}`, item]));
  const conflicts: string[] = [];
  const candidates = incoming.candidates.map(next => {
    const prior = priorByNaturalKey.get(`${next.kind}:${next.naturalKey}`);
    if (!prior) return next;
    if (candidateFingerprint(prior) === candidateFingerprint(next)) {
      return { ...next, reviewState: prior.reviewState, decision: prior.decision, acceptedRecordId: prior.acceptedRecordId, acceptedFingerprint: prior.acceptedFingerprint };
    }
    if (prior.reviewState === 'accepted' || prior.reviewState === 'corrected') {
      conflicts.push(next.naturalKey);
      return {
        ...next,
        reviewState: 'conflict' as const,
        acceptedRecordId: prior.acceptedRecordId,
        acceptedFingerprint: prior.acceptedFingerprint,
        warnings: [...next.warnings, 'ახალი წყარო განსხვავდება მიღებული ჩანაწერისგან; მიღებული მონაცემი ავტომატურად არ შეცვლილა.'],
      };
    }
    return next;
  });
  return {
    ...incoming,
    candidates,
    acceptedRecordIds: [...new Set(candidates.flatMap(item => item.acceptedRecordId ? [item.acceptedRecordId] : []))],
    conflicts,
  };
}
