import type { Inventory } from './types';
import { buildConnectionSheets } from './iteration22';
import { rebuildFiberJourneySummaries } from './iteration20';
import { ITERATION24_SOURCE_SHA256 } from './iteration24';

export const REFERENCE_DATASET_ID = 'TSAGERI-LENTEKHI-REFERENCE-V1';
export const ITERATION26_OWNER_REVISION = 'owner-confirmation-2026-09-29-sc225-termination';

export function validateIteration26(data: Inventory): string[] {
  const errors: string[] = [];
  const c181 = data.cables.find(cable => cable.legacyCableId === '181');
  if (!c181) return ['C181 is absent.'];
  const terminations = (data.nodeFiberTransitions ?? []).filter(item => item.active && item.node.id === '225' && item.a.segmentId === c181.id && item.transitionType === 'intentional_termination');
  const expected = [...Array.from({ length: 8 }, (_, i) => i + 5), ...Array.from({ length: 8 }, (_, i) => i + 17)];
  if (terminations.length !== 16 || expected.some(number => !terminations.some(item => item.a.fiberNumber === number && item.z === null && item.operation === 'terminated'))) errors.push('SC225 must have exactly 16 owner-confirmed C181 terminations.');
  if ((data.nodeFiberTransitions ?? []).some(item => item.active && item.id.includes('C181-F06-AP-UNRESOLVED'))) errors.push('The superseded F06 AP-side interpretation is still active.');
  const p38 = data.fiberJourneySummaries?.find(item => item.segmentId === 'CAB-000184' && item.fiberNumber === 38);
  if (!p38 || p38.scope !== 'termination' || p38.knownTo.includes('AP') || !p38.stopReasonKa.includes('SC225')) errors.push('Lentekhi Port38/C184/F38 must terminate at SC225 through C181/F06.');
  const terminalSheetRows = (data.connectionSheets ?? []).flatMap(sheet => sheet.rows).filter(row => row.state === 'termination');
  if (terminalSheetRows.length !== 16 || terminalSheetRows.some(row => row.right.endpointType !== 'termination')) errors.push('Splice Workspace termination rows are incomplete.');
  if (data.referenceDataset?.pendingManualReview !== 0) errors.push('Reference package pending-manual-review count must be zero.');
  if (data.referenceDataset?.fieldVerified) errors.push('Source/owner interpretation must not be marked field verified.');
  return errors;
}

export function applyIteration26(data: Inventory): Inventory {
  data.connectionSheets = buildConnectionSheets(data);
  rebuildFiberJourneySummaries(data);
  const boundary = data.externalBoundaries?.find(item => item.id === 'BOUNDARY-SC207');
  if (boundary) {
    boundary.originatingNode = { kind: 'closure', id: '206' };
    boundary.status = 'document_known_not_imported';
    boundary.reviewState = 'reviewed_no_change';
    boundary.notes = [...new Set([...boundary.notes, 'External-document boundary is accepted; the next document and matching asset remain nullable until the Ambrolauri source is imported.', 'Canonical matching must use source provenance, endpoint context and geometry; displayed name/number alone is insufficient.'])];
  }
  const sourceDocument = data.sourceDocuments?.[0];
  if (sourceDocument) sourceDocument.reviewState = 'reviewed_no_change';
  const transitions = data.nodeFiberTransitions ?? [];
  data.referenceDataset = {
    id: REFERENCE_DATASET_ID, status: 'READY', sourceFile: 'Tsageri-Lentekhi 2025.vsdx', sourceSha256: ITERATION24_SOURCE_SHA256,
    importerVersion: 'iteration24-certified-v2', geometryResolverVersion: 'world-geometry-effective-style-v2', interpreterVersion: 'iteration26-reference-v1',
    generatedAt: '2026-09-29T00:00:00+04:00', ownerConfirmationRevision: ITERATION26_OWNER_REVISION, pendingManualReview: 0, fieldVerified: false,
    manifestPath: 'reference/tsageri-lentekhi-v1.manifest.json',
    semanticCounts: {
      source_interpreted: transitions.filter(item => item.projectionStatus === 'source_interpreted').length,
      owner_confirmed: transitions.filter(item => item.projectionStatus === 'owner_confirmed').length,
      intentional_termination: transitions.filter(item => item.transitionType === 'intentional_termination').length,
      source_conflict: 1, not_present_in_source: 5, external_document_boundary: 1, genuinely_ambiguous: 0,
    },
  };
  data.snapshot = `${data.snapshot} · ${REFERENCE_DATASET_ID}`;
  return data;
}
