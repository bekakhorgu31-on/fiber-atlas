import usageJson from '../data/iteration25-company-usage.json';
import routingJson from '../data/iteration25-sc225-routing.json';
import type { FiberUseAssignment, Inventory, NetworkUseAssignment, SourceRef } from './types';
import { buildConnectionSheets } from './iteration22';

export const ITERATION25_RULE = 'tsageri-lentekhi-company-usage/1';
export const ITERATION25_INTERPRETER = 'interpret-iteration25-source.py/1';

type RawAssignment = {
  id: string; organizationId: string; scope: 'fiber' | 'lineage';
  fibers: Array<{ segmentId: string; fiberNumber: number }>;
  sourceShapeIds: string[]; occurrenceIds: string[]; purpose: string | null; notes: string[];
};

function source(shapeIds: string[]): SourceRef {
  return { file: 'Tsageri-Lentekhi 2025.vsdx', page: 'ცაგერი-ლენტეხი', pageId: '4', part: 'visio/pages/page1.xml',
    shapeIds, interpretationRule: ITERATION25_RULE,
    note: 'Company text is carried by the source line Shape itself and is attributed through exact endpoint-to-Fiber marker alignment.' };
}

function buildNetworkUseAssignments(data: Inventory): NetworkUseAssignment[] {
  return (usageJson.assignments as RawAssignment[]).map(item => {
    const organizationId = item.organizationId.toLowerCase();
    const fiberIds = item.fibers.flatMap(ref => data.fibers.find(fiber => fiber.cableId === ref.segmentId && fiber.number === ref.fiberNumber)?.id ?? []);
    const lineageIds = (data.fiberLineages ?? []).filter(lineage => item.fibers.some(ref => lineage.legs.some(leg => leg.segmentId === ref.segmentId && leg.fiberNumber === ref.fiberNumber))).map(lineage => lineage.id);
    return { ...item, organizationId, fiberIds, lineageIds, projectionStatus: 'source_interpreted', interpretationRule: ITERATION25_RULE, source: source(item.sourceShapeIds) };
  });
}

function compatibilityAssignments(items: NetworkUseAssignment[]): FiberUseAssignment[] {
  return items.map(item => ({ id: item.id, organizationId: item.organizationId, scope: item.lineageIds.length ? 'lineage' : 'fiber',
    fiberIds: item.fiberIds, lineageIds: item.lineageIds, segmentIds: [...new Set(item.fibers.map(fiber => fiber.segmentId))],
    purpose: item.purpose, projectionStatus: item.projectionStatus, source: item.source, notes: item.notes }));
}

export function validateIteration25(data: Inventory): string[] {
  const errors: string[] = [];
  // This certificate covers Source A only. Other source grammars have independent validators.
  const uses = (data.networkUseAssignments ?? []).filter(use=>use.source.file==='Tsageri-Lentekhi 2025.vsdx');
  if (usageJson.counts.rawOccurrences !== 31) errors.push('All 31 company occurrences must be reconciled.');
  if (new Set(uses.flatMap(item => item.sourceShapeIds)).size !== 31) errors.push('Company occurrence provenance is incomplete.');
  for (const item of uses) {
    if (!data.organizations.some(org => org.id === item.organizationId)) errors.push(`Unknown company: ${item.organizationId}`);
    if (item.source.interpretationRule !== ITERATION25_RULE) errors.push(`Wrong company rule: ${item.id}`);
    if (item.notes.some(note => /ownership|rights|service|availability/i.test(note)) && !item.notes.some(note => note.includes('does not establish'))) errors.push(`Forbidden inference: ${item.id}`);
  }
  const rows = routingJson.rows;
  if (rows.length !== 24 || rows.filter(row => row.classification === 'exact').length !== 8) errors.push('SC225 C181/F01–F24 reconciliation mismatch.');
  const f6 = rows.find(row => row.incomingFiberNumber === 6);
  if (!f6?.ownerConfirmedAPSide || f6.outgoing !== null) errors.push('The frozen Iteration 25 F06 interpretation artifact was altered; Iteration 26 supersedes it only in active topology.');
  if (routingJson.identityConflict.actualCertifiedSource['182'] !== '182-225-53-24' || routingJson.identityConflict.actualCertifiedSource['183'] !== '183-225-54-24') errors.push('AP53/AP54 source identities were altered.');
  return errors;
}

export function applyIteration25(data: Inventory): Inventory {
  data.networkUseAssignments = buildNetworkUseAssignments(data);
  data.fiberUseAssignments = compatibilityAssignments(data.networkUseAssignments);
  data.connectionSheets = buildConnectionSheets(data);
  data.snapshot = `${data.snapshot} · Iteration 25 exhaustive interpretation`;
  return data;
}
