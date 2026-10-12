#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'src/data/source-evidence.json'), 'utf8'));
const annotationData = JSON.parse(fs.readFileSync(path.join(root, 'src/data/source-annotations.json'), 'utf8'));
const raw = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root, 'migration/tsageri-lentekhi-iteration09.raw.json.gz'))));
const page = raw.pages.find(item => item.id === '4');
const CURRENT_SHA = '51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a';
const PAGE = 'ცაგერი-ლენტეხი';
if (!page || raw.source.sha256 !== CURRENT_SHA) throw new Error('Unexpected full-page extraction or source hash');
if (source.cables.length !== 20 || source.closures.length !== 12 || source.access_points.length !== 6 || source.aggregations.length !== 2) throw new Error('Reviewed source inventory counts changed');

const src = (shapeIds, rawValue, rule = 'tsageri-lentekhi-full-page/1') => ({
  file: 'Tsageri-Lentekhi 2025.vsdx', page: 'ცაგერი-ლენტეხი', pageId: '4', part: 'visio/pages/page1.xml',
  shapeIds: shapeIds.map(String), rawValue: rawValue ?? undefined, interpretationRule: rule,
});
const evidence = [];
const assertions = [];
const addEvidence = (id, basis, summary, shapeIds = [], rawValue = null, affectedIds = [], recordedBy = null, fieldVerified = false, notes = []) => {
  evidence.push({ id, basis, summary, source: shapeIds.length ? src(shapeIds, rawValue) : null, recordedAt: '2026-09-26T00:00:00.000Z', recordedBy, affectedIds, fieldVerified, notes });
  return id;
};
const addAssertion = (id, entityType, subjectId, claimType, value, evidenceIds, reviewState, operationalStatus, options = {}) => assertions.push({
  id, entityType, subjectId, claimType, value, evidenceIds, reviewState, operationalStatus,
  fieldVerified: options.fieldVerified ?? false, supersedesAssertionId: options.supersedesAssertionId ?? null,
  warnings: options.warnings ?? [], routeOrDirection: options.routeOrDirection ?? null,
  locationId: options.locationId ?? null, sourcePage: 'ცაგერი-ლენტეხი', version: options.version ?? 1,
});

for (const cable of source.cables) {
  const subject = `CAB-${cable.id.padStart(6, '0')}`;
  const eid = addEvidence(`EVD-CABLE-${cable.id}`, 'source_document', cable.legacy_label, cable.source.shape_ids, cable.legacy_label, [subject]);
  addAssertion(`AST-CABLE-${cable.id}-IDENTITY`, 'cable_segment', subject, 'identity', { legacyCableId: cable.id, sourceLabel: cable.legacy_label }, [eid], 'reviewed_no_change', 'authoritative');
  const aStatus = cable.end_a.kind === 'unresolved_boundary' ? 'unresolved' : cable.id === '184' ? 'conflicting' : 'authoritative';
  const zStatus = cable.end_z.kind === 'unresolved_boundary' ? 'unresolved' : 'authoritative';
  addAssertion(`AST-CABLE-${cable.id}-END-A`, 'cable_segment', subject, 'endpoint_a', cable.end_a, [eid], aStatus === 'authoritative' ? 'reviewed_no_change' : 'needs_review', aStatus, { warnings: aStatus === 'conflicting' ? ['Lentekhi heading says aggregation 6 while the aggregation property says 5.'] : [] });
  addAssertion(`AST-CABLE-${cable.id}-END-Z`, 'cable_segment', subject, 'endpoint_z', cable.end_z, [eid], zStatus === 'authoritative' ? 'reviewed_no_change' : 'needs_review', zStatus, { warnings: zStatus === 'unresolved' ? ['Closure 207 is referenced by label but has no closure property record on this page.'] : [] });
  addAssertion(`AST-CABLE-${cable.id}-COUNT`, 'cable_segment', subject, 'fiber_count', cable.fiber_count, [eid], 'reviewed_no_change', 'authoritative');
}

for (const closure of source.closures) {
  const eid = addEvidence(`EVD-CLOSURE-${closure.id}`, 'source_document', `Closure ${closure.id} property record`, closure.source.shape_ids, closure.coordinates_raw, [`SC${closure.id}`]);
  addAssertion(`AST-CLOSURE-${closure.id}-IDENTITY`, 'closure', closure.id, 'identity', closure.id, [eid], 'reviewed_no_change', 'authoritative');
  addAssertion(`AST-CLOSURE-${closure.id}-COORDINATES`, 'closure', closure.id, 'coordinates', { raw: closure.coordinates_raw, normalized: closure.normalized_coordinates ?? null }, [eid], 'needs_review', 'unresolved', { warnings: ['Coordinate datum/CRS and axis interpretation are not field verified.'] });
  addAssertion(`AST-CLOSURE-${closure.id}-TREATMENT`, 'closure', closure.id, 'physical_treatment', null, [eid], 'needs_review', 'unresolved', { warnings: ['No cut, pass-through, mid-span access, termination, splice or tray structure is inferred.'] });
}

for (const ap of source.access_points) {
  const eid = addEvidence(`EVD-AP-${ap.id}`, 'source_document', `Legacy ODF/AP ${ap.id} · ${ap.address_raw} · ${ap.capacity_ports}`, ap.source.shape_ids, ap.address_raw, [`AP${ap.id}`]);
  addAssertion(`AST-AP-${ap.id}-IDENTITY`, 'access_point', ap.id, 'identity', { id: ap.id, place: ap.address_raw }, [eid], 'reviewed_no_change', 'authoritative');
  addAssertion(`AST-AP-${ap.id}-CAPACITY`, 'access_point', ap.id, 'port_capacity', ap.capacity_ports, [eid], 'reviewed_no_change', 'authoritative');
  addAssertion(`AST-AP-${ap.id}-CONTAINMENT`, 'access_point', ap.id, 'ap_odf_containment', null, [eid], 'needs_review', 'unresolved', { warnings: ['Legacy ODF stencil does not prove that AP and ODF are the same asset.'] });
}

const tsageriSource = source.aggregations[0].source.shape_ids;
const tsageriDoc = addEvidence('EVD-AGG-TSAGERI-SOURCE', 'source_document', 'Tsageri aggregation context', tsageriSource, 'Aagregacia #5 tsageri', ['5']);
const tsageriOwner = addEvidence('EVD-OWNER-TSAGERI-ODF', 'owner_confirmation', 'Tsageri ODF has 192 logical ports with four reviewed direction ranges.', [], null, ['5', 'ODF-TSAGERI-01'], 'network-owner', false, ['Owner confirmation is operational evidence, not field verification.']);
addAssertion('AST-AGG-TSAGERI-IDENTITY', 'aggregation', '5', 'identity', { id: '5', name: 'ცაგერი' }, [tsageriDoc], 'reviewed_no_change', 'authoritative');
addAssertion('AST-AGG-TSAGERI-CAPACITY', 'aggregation', '5', 'logical_port_capacity', 192, [tsageriDoc, tsageriOwner], 'reviewed_no_change', 'authoritative');
const lentekhi = source.aggregations[1];
const lentekhiEvidence = addEvidence('EVD-AGG-LENTEKHI-CONFLICT', 'source_document', 'Lentekhi aggregation heading/property identity conflict', lentekhi.source.shape_ids, 'heading=6; property=5', ['LENTEKHI-AGG-CONFLICT']);
addAssertion('AST-AGG-LENTEKHI-IDENTITY', 'aggregation', 'LENTEKHI-AGG-CONFLICT', 'identity', { headingId: '6', propertyId: '5', name: 'ლენტეხი' }, [lentekhiEvidence], 'disputed', 'conflicting', { warnings: ['Both source claims are preserved; no canonical numeric aggregation identity is chosen.'] });

const rangeClaims = [
  ['001-116', 1, 116, 'Ambrolauri direction'], ['117-130', 117, 130, 'SC205'],
  ['131-144', 131, 144, 'AP Chkhuteli'], ['145-192', 145, 192, 'Lentekhi direction'],
];
for (const [key, start, end, destination] of rangeClaims) addAssertion(`AST-PORT-RANGE-${key}`, 'port_range', `PRA-TSAGERI-${key}`, 'direction_assignment', { start, end, destination }, [tsageriOwner], 'reviewed_no_change', 'authoritative');
const backfeed = addEvidence('EVD-OWNER-AP41-BACKFEED', 'owner_confirmation', 'AP Chkhuteli ports 3–22 return/backfeed toward Ambrolauri.', [], null, ['41'], 'network-owner', false);
addAssertion('AST-AP41-BACKFEED', 'port_range', 'APR-CHKHUTELI-003-022', 'direction_assignment', { start: 3, end: 22, destination: 'Ambrolauri direction', internalMapping: 'unresolved' }, [backfeed], 'reviewed_no_change', 'authoritative');
const sheath = addEvidence('EVD-OWNER-PC-C172-END', 'owner_confirmation', 'The C172-containing physical sheath ends at SC218 and extends upstream beyond SC217.', [], null, ['PC-TSAGERI-SC218-01', 'CAB-000172'], 'network-owner', false);
addAssertion('AST-PC-C172-END', 'physical_cable', 'PC-TSAGERI-SC218-01', 'physical_extent', { acceptedSegment: 'CAB-000172', upstreamOrigin: null, physicalEnd: 'SC218' }, [sheath], 'reviewed_no_change', 'authoritative');
addAssertion('AST-PC-C171-MEMBERSHIP', 'physical_cable', 'PC-TSAGERI-SC218-01', 'segment_membership', { segmentId: 'CAB-000171' }, [sheath], 'needs_review', 'candidate', { warnings: ['Adjacency and equal fiber count do not prove same-sheath membership.'] });

const candidateByShape = new Map(source.closure_218_connection_candidates.map(item => [String(item.line_shape), item]));
const connectGroups = new Map();
page.connects.forEach((row, index) => {
  const key = String(row.FromSheet);
  if (!connectGroups.has(key)) connectGroups.set(key, []);
  connectGroups.get(key).push({ index, ...row });
});
for (const [shapeId, rows] of connectGroups) {
  const interpreted = candidateByShape.get(shapeId);
  const eid = addEvidence(`EVD-GEOMETRY-${shapeId}`, 'source_geometry', interpreted ? `SC218 geometry candidate ${interpreted.from_cable}/F${interpreted.from_fiber} → ${interpreted.to_cable}/F${interpreted.to_fiber}` : `Unresolved connector geometry from shape ${shapeId}`, [shapeId, ...rows.map(row => row.ToSheet)], null, [`CONNECT-${shapeId}`], null, false, ['Geometry alone does not establish physical or optical continuity.']);
  const authoritative = shapeId === '33098';
  addAssertion(`AST-CONNECT-${shapeId}`, 'connection', `CONNECT-${shapeId}`, 'optical_connectivity', interpreted ? { location: 'SC218', fromCable: interpreted.from_cable, fromFiber: interpreted.from_fiber, toCable: interpreted.to_cable, toFiber: interpreted.to_fiber, operation: null } : { sourceRows: rows }, [eid], authoritative ? 'reviewed_no_change' : 'needs_review', authoritative ? 'authoritative' : interpreted ? 'candidate' : 'unresolved', { locationId: interpreted ? 'SC218' : null, routeOrDirection: interpreted ? 'Tsageri–Lentekhi' : null, warnings: authoritative ? ['Connectivity is operationally authoritative; physical operation remains unresolved.'] : ['No automatic pattern approval.'] });
}
const engineer = addEvidence('EVD-ENGINEER-TARGET-PATH', 'engineer_review', 'Bounded documentation/geometry review of SC217 → SC218 → AP51 target path.', ['34089', '33098', '34267'], null, ['CONN-SC217-C171F29-C172F29', 'CONN-SC218-C172F29-C173F01', 'CONN-AP51-C173F01-ASSET'], 'iteration-07-reviewer', false);
for (const [id, location, value] of [
  ['AST-CONNECT-SC217-TARGET', 'SC217', { from: 'C171/F29', to: 'C172/F29', operation: null }],
  ['AST-CONNECT-AP51-TARGET', 'AP51', { from: 'C173/F01', to: 'AP51', port: null, operation: null }],
]) addAssertion(id, 'connection', id.replace('AST-', ''), 'optical_connectivity', value, [engineer], 'reviewed_no_change', 'authoritative', { locationId: location, warnings: ['Documentation reviewed; not field verified. Physical operation remains unresolved.'] });

for (const annotation of annotationData.annotations) {
  const eid = addEvidence(`EVD-${annotation.id}`, 'source_document', annotation.rawText, annotation.source.shapeIds, annotation.rawText, [annotation.id]);
  addAssertion(`AST-${annotation.id}`, 'annotation', annotation.id, 'raw_source_annotation', annotation.rawText, [eid], annotation.associationState === 'unresolved' ? 'needs_review' : 'reviewed_no_change', 'authoritative', { warnings: annotation.warnings });
}

const groupFor = (id, title, predicate, pattern, notes = []) => {
  const members = assertions.filter(predicate).map(item => item.id);
  return { id, title, memberAssertionIds: members, sourcePattern: pattern, containsConflict: members.some(mid => assertions.find(item => item.id === mid)?.operationalStatus === 'conflicting'), reviewState: 'needs_review', notes };
};
const groups = [
  groupFor('GRP-SC218-C172-C174-01-28', 'SC218 · C172/F01–28 ↔ C174/F01–28', item => item.entityType === 'connection' && item.locationId === 'SC218' && Number(item.value?.fromFiber) <= 28 && item.value?.fromCable === '172', 'group membership counts only generated connector assertions; the complete 52-record SC218 interpretation set remains preserved in source evidence'),
  groupFor('GRP-SC218-C172-C173-29-40', 'SC218 · C172/F29–40 ↔ C173/F01–12', item => item.entityType === 'connection' && item.locationId === 'SC218' && item.value?.fromCable === '172' && Number(item.value?.fromFiber) >= 29, 'group membership counts only generated connector assertions; the reviewed target relationship remains separately authoritative'),
  groupFor('GRP-SC218-C174-C173-29-40', 'SC218 · C174/F29–40 ↔ C173/F13–24', item => item.entityType === 'connection' && item.locationId === 'SC218' && item.value?.fromCable === '174', 'group membership counts only generated connector assertions'),
  groupFor('GRP-UNRESOLVED-CONNECT-GEOMETRY', 'Unresolved page connector geometry', item => item.entityType === 'connection' && item.operationalStatus === 'unresolved' && item.id.startsWith('AST-CONNECT-'), 'connector shapes not safely interpretable as optical topology', ['Review by location; never bulk-promote this mixed group.']),
];

const generatedConnectorAssertions = assertions.filter(item => item.id.startsWith('AST-CONNECT-') && !item.id.includes('TARGET'));
const interpretedConnectorAssertions = generatedConnectorAssertions.filter(item => item.locationId === 'SC218');
const unresolvedConnectorAssertions = generatedConnectorAssertions.filter(item => item.operationalStatus === 'unresolved');

const annotationOccurrences = annotationData.report.associated + annotationData.report.groupAssociated + annotationData.report.routeAssociated + annotationData.report.pageGeneral + annotationData.report.unresolvedAssociation;
const count = status => assertions.filter(item => item.operationalStatus === status).length;
const coverage = {
  sourceShapes: raw.summary.all_page_shapes_including_subshapes, topLevelShapes: raw.summary.top_level_shapes, directTextShapes: annotationData.report.directTextShapes,
  comments: annotationData.report.commentEntries, connectRows: page.connects.length, meaningfulAnnotations: annotationData.annotations.length,
  cableSegmentLabels: source.cables.length, interpretedCableSegments: source.cables.length, closures: source.closures.length,
  aggregationContexts: source.aggregations.length, accessPointOdfRecords: source.access_points.length, logicalPorts: 192,
  logicalFibers: source.cables.reduce((sum, item) => sum + item.fiber_count, 0), connectionAssertions: assertions.filter(item => item.entityType === 'connection').length,
  authoritativeAssertions: count('authoritative'), candidateAssertions: count('candidate'), unresolvedAssertions: count('unresolved'),
  conflictingAssertions: count('conflicting'), rejectedOrNonOperational: count('historical') + count('not_applicable'), unclassifiedMeaningfulText: 0,
  structuredTextOccurrences: annotationData.report.structuredSourceTexts, annotationOccurrences,
  layoutOccurrences: annotationData.report.deliberatelyIgnored, totalTextAndComments: annotationData.report.totalCandidateTexts,
  notes: [
    'Text/comment reconciliation: structured source text + annotation occurrences + classified numeric layout occurrences equals the full direct-text/comment total.',
    `All 203 Connect rows are grouped by ${connectGroups.size} FromSheet connector shapes. ${interpretedConnectorAssertions.length} generated connector assertions match SC218 line-shape interpretations and ${unresolvedConnectorAssertions.length} remain unresolved. The complete ${candidateByShape.size}-record SC218 interpretation set is preserved separately in source evidence.`,
    'No reliable distance text or exact patch-cord topology was found; those collections remain empty.',
  ],
};
if (coverage.structuredTextOccurrences + coverage.annotationOccurrences + coverage.layoutOccurrences !== coverage.totalTextAndComments) throw new Error('Meaningful text reconciliation failed');

const output = {
  schemaVersion: 1, sourceSha256: CURRENT_SHA, interpretationRule: 'tsageri-lentekhi-full-page/1',
  generatedAt: '2026-09-26T00:00:00.000Z', coverage,
  sourceInventory: { aggregations: source.aggregations, closures: source.closures, accessPoints: source.access_points, cables: source.cables },
  routesAndDirections: [
    { id: 'ROUTE-TSAGERI-LENTEKHI-CORE', label: 'Tsageri → Lentekhi', status: 'authoritative_with_unresolved_boundary' },
    { id: 'DIRECTION-ALPANA-TVISHI-AMBROLAURI', label: 'Alpana-Tvishi-Ambrolauri directiion', status: 'external_unresolved_continuation' },
    { id: 'ROUTE-SC224-TSANA-KHELEDI', label: 'SC224 → SC225 → AP53/AP54', status: 'source_documented_branch' },
  ],
  externalBoundaries: [
    { id: 'BOUNDARY-SC207', directionLabel: 'Continuation beyond SC206 toward closure 207 / Ambrolauri side', sourceFile: 'Tsageri-Lentekhi 2025.vsdx', sourcePage: 'ცაგერი-ლენტეხი', likelyContinuationName: 'SC207', linkedRouteId: null, status: 'unresolved', source: src(['15772'], '151-206-207-144'), notes: ['SC207 is label-referenced but has no closure property record on this page.'] },
    { id: 'BOUNDARY-LENTEKHI-AGG', directionLabel: 'Lentekhi aggregation boundary', sourceFile: 'Tsageri-Lentekhi 2025.vsdx', sourcePage: 'ცაგერი-ლენტეხი', likelyContinuationName: 'AGG6 heading / property ID5', linkedRouteId: null, status: 'conflicting', source: src(['36475', '37059', '15991'], '184-6-224-48'), notes: ['Aggregation identity conflict is preserved without choosing a winner.'] },
  ],
  physicalCableHypotheses: [{ id: 'PC-TSAGERI-SC218-01', authoritativeMembers: ['CAB-000172'], candidateMembers: ['CAB-000171'], unresolvedMembers: [], rejectedMembers: [], notes: ['Full-page adjacency does not promote C171.'] }],
  connectionGroups: groups,
  annotationClasses: Object.entries(annotationData.annotations.reduce((acc, item) => ((acc[item.category] = (acc[item.category] ?? 0) + 1), acc), {})).map(([category, records]) => ({ category, records })),
  commercialOrganizationReferences: ['opennet', 'magti', 'silknet', 'skytel'],
  unresolvedConflicts: ['Lentekhi aggregation heading/property identity', 'C151 external closure 207 boundary', 'fiber 5→9 note location', 'closure treatments', 'AP/ODF containment', 'exact ODF/fiber terminations', 'remaining connector geometry'],
  deliberatelyNotPromoted: ['numeric layout text', 'legacy Free values as availability', 'Loop as live continuity', 'OTDR text as distance', 'coordinates as route distance', 'company proximity as commercial relationship', 'ambiguous connector geometry as optical continuity', 'legacy ODF symbol as proven AP/ODF containment'],
  evidenceRecords: evidence, assertions, assertionGroups: groups,
};
fs.writeFileSync(path.join(root, 'src/data/full-page-migration.json'), `${JSON.stringify(output, null, 2)}\n`);
const table = (headers, rows) => [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`, ...rows.map(row => `| ${row.join(' | ')} |`)].join('\n');
const markdown = [
  '# Iteration 12 full migration review — Tsageri–Lentekhi',
  '',
  `Source: \`Tsageri-Lentekhi 2025.vsdx\`, page \`${PAGE}\` (ID 4), SHA-256 \`${CURRENT_SHA}\`. This report is generated by \`scripts/interpret-full-page.mjs\` from the immutable raw extraction and prior reviewed source interpretations. Documentation-reviewed and owner-confirmed facts are not described as field verified.`,
  '',
  '## Coverage and reconciliation',
  '',
  table(['Measure', 'Count'], [
    ['All source shapes', coverage.sourceShapes.toLocaleString()], ['Top-level shapes', coverage.topLevelShapes.toLocaleString()],
    ['Direct-text shapes + comments', coverage.totalTextAndComments.toLocaleString()], ['Structured source-text occurrences', String(coverage.structuredTextOccurrences)],
    ['Meaningful annotation occurrences', String(coverage.annotationOccurrences)], ['Classified numeric/layout occurrences', coverage.layoutOccurrences.toLocaleString()],
    ['Unclassified meaningful text', String(coverage.unclassifiedMeaningfulText)], ['Connect rows / connector shapes', `${coverage.connectRows} / ${connectGroups.size}`],
    ['Cable Segment labels', String(coverage.cableSegmentLabels)], ['Logical fibers', coverage.logicalFibers.toLocaleString()],
    ['Closure property records', String(coverage.closures)], ['AP/ODF-like records', String(coverage.accessPointOdfRecords)],
    ['Aggregation contexts', String(coverage.aggregationContexts)], ['Reviewed Tsageri logical ports', String(coverage.logicalPorts)],
    ['Assertion / evidence records', `${assertions.length} / ${evidence.length}`],
  ]),
  '',
  `Text accounting closes exactly: **${coverage.totalTextAndComments.toLocaleString()} = ${coverage.structuredTextOccurrences} structured + ${coverage.annotationOccurrences} annotation + ${coverage.layoutOccurrences.toLocaleString()} classified layout**. No meaningful text remains unexplained. All ${coverage.connectRows} Connect rows are retained through ${connectGroups.size} connector-shape evidence records; ${interpretedConnectorAssertions.length} generated connector assertions match SC218 connector IDs and ${unresolvedConnectorAssertions.length} remain unresolved source geometry. The complete ${candidateByShape.size}-record SC218 interpretation set remains preserved separately in source evidence.`,
  '',
  '## Aggregations', '',
  table(['Context', 'Source claim', 'Operational treatment'], [
    ['Tsageri', 'AGG5; owner-confirmed 192-port logical ODF', 'Identity and capacity authoritative; not field verified'],
    ['Lentekhi', 'Heading AGG6; property ID5', 'First-class conflicting assertion; neither value wins'],
  ]),
  '',
  '## AP / ODF-like source assets', '',
  table(['Source ID', 'Place', 'Capacity', 'Shape', 'Treatment'], source.access_points.map(item => [item.id, item.address_raw, String(item.capacity_ports), item.source.shape_ids.join(', '), item.id === '41' ? 'AP/ODF ambiguity; owner-confirmed backfeed 3–22; exact internal mapping unresolved' : 'AP identity/capacity imported; AP/ODF containment and exact port topology unresolved'])),
  '',
  '## Closures', '',
  table(['ID', 'Model', 'Declared cables', 'Role', 'Mounting', 'Coordinates', 'Treatment'], source.closures.map(item => [item.id, item.model, String(item.declared_cable_count), item.closure_role_raw, item.mounting_raw ?? 'not stated', item.coordinates_raw.replace(/\s+/g, ' ').trim(), 'identity/properties imported; physical treatment unresolved'])),
  '',
  '## Cable Segment labels', '',
  table(['C', 'Exact source label', 'Endpoint A', 'Endpoint Z', 'Fibers', 'Operational treatment'], source.cables.map(item => [item.id, `\`${item.legacy_label}\``, `${item.end_a.kind}:${item.end_a.id}`, `${item.end_z.kind}:${item.end_z.id}`, String(item.fiber_count), item.id === '151' ? 'segment/count authoritative; SC207 external boundary unresolved' : item.id === '184' ? 'segment/count authoritative; Lentekhi aggregation endpoint conflicting' : 'segment identity/endpoints/count authoritative'])),
  '',
  '## Routes and directions', '',
  ...output.routesAndDirections.map(item => `- **${item.label}** — ${item.status}.`),
  '',
  'The core Tsageri–Lentekhi route is preserved. New source-supported branches are C149 SC205→AP41, C151 SC206→external SC207/Ambrolauri-side boundary, C175 SC219→AP52, and the SC224→C181→SC225 branch with C182→AP53 and C183→AP54. C184 exists as a Cable Segment whose Lentekhi endpoint remains conflicting; the core route boundary stays unresolved.',
  '',
  '## PhysicalCable hypotheses', '',
  '- `PC-TSAGERI-SC218-01`: C172 remains the only authoritative member; C171 remains candidate; upstream origin remains unresolved; the sheath ends at SC218. Full-page adjacency does not promote any membership.',
  '',
  '## Fiber connection groups', '',
  ...groups.map(group => `- **${group.title}** — ${group.memberAssertionIds.length} individual assertions; ${group.sourcePattern}.${group.containsConflict ? ' Contains conflicting evidence.' : ''}`),
  '',
  `The generated connector assertion index contains ${interpretedConnectorAssertions.length} SC218-matched connector assertions and ${unresolvedConnectorAssertions.length} unresolved connector-shape assertions. Separately, all ${candidateByShape.size} interpreted SC218 source relationships remain preserved in source evidence and operational inventory. Matching number/color patterns never grant operational authority. SC217 C171/F29→C172/F29, SC218 C172/F29→C173/F01 and AP51 C173/F01→AP51 remain authoritative connectivity with unresolved physical operation and no field-verification claim.`,
  '',
  '## Annotation classes', '',
  table(['Class', 'Records'], output.annotationClasses.map(item => [item.category, String(item.records)])),
  '',
  '## Commercial organization references', '',
  '- OpenNet, Magti, Silknet and Skytel source labels are preserved. Only the owner-confirmed OpenNet route-level physical-infrastructure-owner and network-operator roles are operational relationships. Proximity does not create cable ownership, fiber rights, service-provider or customer assignments.',
  '',
  '## Unresolved conflicts and boundaries', '',
  ...output.unresolvedConflicts.map(item => `- ${item}`),
  '',
  'External Documentation Boundaries are explicit for source-referenced SC207 and the Lentekhi aggregation conflict. They retain source page/file and may link to a later imported route without inventing another VSDX.',
  '',
  '## Source information deliberately not promoted', '',
  ...output.deliberatelyNotPromoted.map(item => `- ${item}`),
  '',
  'No reliable route/segment distance, exact patch cord, fiber termination, AP ingress-to-egress one-to-one mapping, service path, rights assignment, or current availability assertion was found. These collections remain empty or unresolved rather than populated for demonstration.',
  '',
  '## Verification semantics', '',
  '- Evidence Basis records how a claim is supported and preserves weaker evidence when stronger evidence is added.',
  '- Review State records the human lifecycle independently from operational use.',
  '- Operational Status controls normal topology: authoritative, candidate, unresolved, conflicting, historical or not applicable.',
  '- Strict Trace follows authoritative optical connectivity. Field verification is a separate evidence fact and is not required for documentation-reviewed operational topology.',
  '- Group review retains every member assertion and blocks automatic pattern approval.',
  '',
].join('\n');
fs.writeFileSync(path.join(root, 'docs/ITERATION-12-FULL-MIGRATION-REVIEW.md'), markdown);
console.log(`Full-page migration: ${source.cables.length} segments, ${source.closures.length} closures, ${source.access_points.length} AP/ODF records, ${coverage.logicalFibers} fibers, ${assertions.length} assertions, ${evidence.length} evidence records.`);
