import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Database, FileSearch, Layers3, ShieldCheck } from 'lucide-react';
import { Badge, EmptyState, PageHeader } from '../components/ui';
import { claimReviewLabels, evidenceBasisLabels, operationalStatusLabels, reviewAssertion } from '../domain/fullMigration';
import type { AssertionEntityType, AssertionRecord, ClaimReviewState, EvidenceBasis, OperationalStatus, ViewProps } from '../domain/types';
import certificationJson from '../data/iteration24-certification.json';
import diagnosticsJson from '../data/iteration24-shape-diagnostics.json';
import companyUsageJson from '../data/iteration25-company-usage.json';
import alpanaTvishiSummary from '../../migration/iteration27/dashboard-summary.json';
import { FiberUsageReviewPanel, SourceBReviewPanel, SourceBShapeEvidence } from './SourceBAP';

const entityLabels: Record<AssertionEntityType, string> = {
  cable_segment: 'Cable Segment', cable_continuation: 'Cable Continuation', closure: 'Closure', access_point: 'AP / ODF-like asset', aggregation: 'Aggregation', fiber: 'Fiber',
  connection: 'Connection', physical_cable: 'PhysicalCable', port_range: 'Port range', annotation: 'Annotation', external_boundary: 'External boundary', organization: 'Organization',
};
const statusTone = (status: OperationalStatus): 'neutral' | 'warning' | 'success' | 'danger' =>
  status === 'authoritative' ? 'success' : status === 'candidate' || status === 'unresolved' ? 'warning' : status === 'conflicting' ? 'danger' : 'neutral';

type DiagnosticAnchor = (typeof diagnosticsJson.anchors)[number];

export function ImportReviewView({ data, navigate, shapeId, runId }: ViewProps & { runId?: string; shapeId?: string }) {
  const [assertions, setAssertions] = useState<AssertionRecord[]>(() => structuredClone(data.assertions ?? []));
  const [entity, setEntity] = useState<'all' | AssertionEntityType>('all');
  const [basis, setBasis] = useState<'all' | EvidenceBasis>('all');
  const [status, setStatus] = useState<'all' | OperationalStatus>('all');
  const [review, setReview] = useState<'all' | ClaimReviewState>('all');
  const [location, setLocation] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(assertions[0]?.id ?? '');
  const [rationale, setRationale] = useState('');
  const [shapeQuery, setShapeQuery] = useState(shapeId ?? '12484');
  const coverage = data.migrationCoverage;
  const evidence = data.evidenceRecords ?? [];
  const locations = [...new Set(assertions.flatMap(item => item.locationId ? [item.locationId] : []))].sort();
  const filtered = useMemo(() => assertions.filter(item => {
    const records = item.evidenceIds.map(id => evidence.find(record => record.id === id)).filter(Boolean);
    const haystack = `${item.id} ${item.subjectId} ${item.claimType} ${JSON.stringify(item.value)} ${item.routeOrDirection ?? ''}`.toLocaleLowerCase();
    return (entity === 'all' || item.entityType === entity)
      && (basis === 'all' || records.some(record => record?.basis === basis))
      && (status === 'all' || item.operationalStatus === status)
      && (review === 'all' || item.reviewState === review)
      && (location === 'all' || item.locationId === location)
      && (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase()));
  }), [assertions, entity, basis, status, review, location, query, evidence]);
  const selected = filtered.find(item => item.id === selectedId) ?? filtered[0];
  const selectedEvidence = selected ? selected.evidenceIds.map(id => evidence.find(item => item.id === id)).filter(item => item !== undefined) : [];
  const groups = (data.assertionGroups ?? []).filter(group => selected && group.memberAssertionIds.includes(selected.id));
  const act = (action: Parameters<typeof reviewAssertion>[1]) => {
    if (!selected) return;
    setAssertions(items => items.map(item => item.id === selected.id ? reviewAssertion(item, action) : item));
    setRationale('');
  };
  const diagnostic = runId==='SOURCE-B-28D'?undefined:(diagnosticsJson.anchors as DiagnosticAnchor[]).find(item => item.shapeId === shapeQuery.trim());
  const cert = certificationJson;
  const sc225Transitions = (data.nodeFiberTransitions ?? []).filter(item => item.active && item.node.kind === 'closure' && item.node.id === '225' && item.a.segmentId === 'CAB-000181');
  const sc225Terminations = sc225Transitions.filter(item => item.transitionType === 'intentional_termination');
  const sc225Exact = sc225Transitions.filter(item => item.z);

  if (!coverage) return <><PageHeader title="Migration Coverage" /><EmptyState title="Coverage record unavailable" description="Run the deterministic full-page interpreter before opening this workspace." /></>;
  return <>
    <SourceBReviewPanel navigate={navigate}/>
    <FiberUsageReviewPanel data={data} navigate={navigate}/>
    {runId==='SOURCE-B-28D'&&shapeId&&<SourceBShapeEvidence data={data} shapeId={shapeId}/>}
    <PageHeader eyebrow="Iteration 24 · engineering diagnostics" title="VSDX Import Certification & Evidence Review" description="Evidence Basis, human Review State and Operational Status remain independent. Package evidence, world geometry, effective styles and source interpretation stay separate; this workspace is for engineering audit and is not shown in Manager View." />
    <section className="panel source-certification" aria-label="VSDX importer certification">
      <div className="panel-header"><div><span className="eyebrow">Active certified source</span><h2>{cert.statement}</h2><p>{cert.source.file} · SHA-256 {cert.source.sha256.slice(0, 16)}…</p></div><Badge tone={cert.criticalLimitations === 0 ? 'success' : 'danger'}>{cert.gates.filter(item => item.passed).length} / {cert.gates.length} gates</Badge></div>
      <div className="migration-coverage-grid">
        <article><strong>{cert.counts.all_page_shapes_including_subshapes.toLocaleString()}</strong><span>Shapes</span></article><article><strong>{cert.counts.grouped_subshapes.toLocaleString()}</strong><span>grouped children</span></article><article><strong>{cert.counts.connect_rows_valid}</strong><span>valid Connect rows</span></article><article><strong>{cert.counts.exactTransitions}</strong><span>fresh transitions</span></article><article><strong>{cert.counts.companyOccurrences}</strong><span>company labels</span></article><article><strong>{cert.criticalLimitations}</strong><span>critical limits</span></article>
      </div>
      <details><summary>Certification gates and limitations</summary><ul>{cert.gates.map(item => <li key={item.number}>{item.passed ? '✓' : '✕'} {item.number}. {item.name}</li>)}</ul>{cert.limitations.map(item => <p key={item.area}><strong>{item.severity} · {item.area}</strong> — {item.detail}</p>)}</details>
    </section>

    <section className="panel source-certification" aria-label="Iteration 27D topology certification">
      <div className="panel-header"><div><span className="eyebrow">Iteration 27D · topology certification · Package {alpanaTvishiSummary.packageStatus}</span><h2>{alpanaTvishiSummary.filename}</h2><p>SHA-256 {alpanaTvishiSummary.sha256.slice(0, 16)}… · {alpanaTvishiSummary.certificationState}.</p></div><Badge tone={alpanaTvishiSummary.activation === 'ACTIVE' ? 'success' : 'danger'}>{alpanaTvishiSummary.activation === 'ACTIVE' ? 'Topology active' : 'Activation blocked'}</Badge></div>
      <div className="migration-coverage-grid"><article><strong>{alpanaTvishiSummary.cableLabelCount}</strong><span>literal Cable labels</span></article><article><strong>{Object.keys(alpanaTvishiSummary.overlapCandidates).length}</strong><span>cross-document anchors</span></article><article><strong>{alpanaTvishiSummary.transitionDisposition.duplicateOverlapEvidence}</strong><span>SC205/SC206 duplicate overlap</span></article><article><strong>{alpanaTvishiSummary.transitionDisposition.exactSourceTransitions}</strong><span>source-local transitions decoded</span></article><article><strong>{alpanaTvishiSummary.transitionDisposition.notSemanticallyReviewed}</strong><span>transitions unexplained</span></article></div>
      <div className="migration-coverage-grid" aria-label="Iteration 27D certification layers">{Object.entries(alpanaTvishiSummary.semanticGates).map(([gate, result]) => <article key={gate} title={result}><strong>{result.startsWith('PASS') ? 'PASS' : result.startsWith('FAIL') ? 'FAIL' : result.startsWith('PARTIAL') ? 'PARTIAL' : 'ENRICHMENT'}</strong><span>{gate}</span><small>{result}</small></article>)}</div>
      <p className="muted">Direction label retained: <strong>{alpanaTvishiSummary.directionLabel}</strong>. The label provides route context only; it does not create Fiber continuity.</p>
      <details><summary>Folder import instructions and overlap status</summary>
        <p>Copy a Visio file into <code>imports/inbox/</code>, then run <code>py -3 scripts/import-inbox.py</code> from the project folder. Optional polling uses <code>py -3 scripts/import-inbox.py --watch</code>. Both modes use the same local importer; this standalone browser cannot watch a Windows folder directly.</p>
        <ul>{Object.entries(alpanaTvishiSummary.overlapCandidates).map(([key, state]) => <li key={key}>{key}: {state}</li>)}</ul>
        <p><strong>C148:</strong> {alpanaTvishiSummary.c148Conflict} — Tube-color conflict at {alpanaTvishiSummary.c148ConflictRange}; both source claims are preserved.</p>
        <p><strong>SC207:</strong> {alpanaTvishiSummary.sc207Boundary}. The 143 local C151↔C152 transitions remain unchanged and use exact source construction and connector evidence; Closure type comes from the separate certified Source B symbol grammar.</p>
        <p>Topology status: {alpanaTvishiSummary.activation}. The frozen base remains {alpanaTvishiSummary.frozenReference}.</p>
      </details>
    </section>

    <section className="panel source-certification" aria-label="Reference dataset finalization">
      <div className="panel-header"><div><span className="eyebrow">Iteration 26 · frozen reference</span><h2>{data.referenceDataset?.id}</h2><p>Certified source interpretation and owner-confirmed termination are operational; field verification remains none.</p></div><Badge tone={data.referenceDataset?.status === 'READY' ? 'success' : 'danger'}>{data.referenceDataset?.status}</Badge></div>
      <div className="migration-coverage-grid"><article><strong>{companyUsageJson.counts.logicalAssignments}</strong><span>company assignments</span></article><article><strong>{sc225Exact.length}</strong><span>SC225 exact AP routes</span></article><article><strong>{sc225Terminations.length}</strong><span>SC225 intentional terminations</span></article><article><strong>{data.referenceDataset?.pendingManualReview ?? 0}</strong><span>pending manual review</span></article><article><strong>{data.referenceDataset?.fieldVerified ? 'yes' : 'none'}</strong><span>field verification</span></article></div>
      <details><summary>SC225 canonical C181/F01–F24 table</summary><table><thead><tr><th>Fiber</th><th>Classification</th><th>Outcome</th><th>Evidence</th></tr></thead><tbody>{sc225Transitions.sort((a,b) => a.a.fiberNumber-b.a.fiberNumber).map(row => <tr key={row.id}><td>C181/F{String(row.a.fiberNumber).padStart(2,'0')}</td><td>{row.transitionType === 'intentional_termination' ? 'owner_confirmed' : 'source_interpreted'}</td><td>{row.z ? `C${data.cables.find(c => c.id === row.z?.segmentId)?.legacyCableId}/F${String(row.z.fiberNumber).padStart(2,'0')}` : 'SC225-ზე მთავრდება'}</td><td>{row.interpretationBasis}</td></tr>)}</tbody></table></details>
      <p className="muted">C181/F01–F04 → C183 → AP54; F13–F16 → C182 → AP53; F05–F12 and F17–F24 terminate at SC225.</p>
    </section>

    <section className="panel source-evidence-inspector" aria-label="Source Evidence Inspector">
      <div className="panel-header"><div><span className="eyebrow">წყაროს მტკიცებულება</span><h2>Shape ID diagnostic viewer</h2><p>Raw fields and resolved render evidence from the certified VSDX import.</p></div></div>
      <form className="source-shape-search" onSubmit={event => { event.preventDefault(); navigate({ view: 'import', shapeId: shapeQuery.trim() }); }}><label className="field"><span>Source Shape ID</span><input value={shapeQuery} onChange={event => setShapeQuery(event.target.value.replace(/\D/g, ''))} placeholder="12484" /></label><button className="button button-primary" type="submit">Open evidence</button></form>
      {diagnostic ? <div className="source-evidence-grid">
        <section><span>Identity</span><strong>Shape {diagnostic.shapeId}</strong><p>Page {diagnostic.pageId} · {diagnostic.pageName}</p><p>Parent {diagnostic.parentShapeId ?? 'top level'} · root {diagnostic.rootShapeId} · depth {diagnostic.depth}</p><p>Master {diagnostic.masterId ?? 'none'} / shape {diagnostic.masterShapeId ?? 'none'}</p></section>
        <section><span>Exact source text</span><pre>{JSON.stringify(diagnostic.rawText)}</pre><small>Normalized: {diagnostic.normalizedText || '—'}</small></section>
        <section><span>World geometry</span><pre>{JSON.stringify({ bounds: diagnostic.geometry.world_bounds, angle: diagnostic.geometry.world_angle, pin: diagnostic.geometry.global_pin }, null, 2)}</pre></section>
        <section><span>Effective render style</span><pre>{JSON.stringify({ fill: diagnostic.effectiveStyle.FillForegnd, pattern: diagnostic.effectiveStyle.FillPattern, transparency: diagnostic.effectiveStyle.FillForegndTrans, line: diagnostic.effectiveStyle.LineColor, lineWeight: diagnostic.effectiveStyle.LineWeight }, null, 2)}</pre></section>
        <section><span>Raw Cells / formulas</span><pre>{JSON.stringify(diagnostic.cells, null, 2)}</pre></section>
        <section><span>Property / Shape Data</span><pre>{JSON.stringify(diagnostic.propertySections, null, 2)}</pre></section>
      </div> : <EmptyState title="Shape is not in the compact anchor set" description="The complete 7,349-Shape index and lossless raw artifact remain in migration/iteration24. Use one of the certified anchors: 12484, 12487, 15983, 34674, 43430, 43833, 44243, 17661 or 37584." />}
    </section>
    <div className="notice notice-warning"><AlertTriangle size={19} /><span><strong>Authoritative does not mean field verified</strong>Strict Trace uses authoritative optical connectivity. Candidate and unresolved assertions remain outside strict traversal, while all original evidence stays preserved.</span></div>

    <section className="migration-coverage-grid" aria-label="Full-page migration coverage">
      <article><FileSearch size={19} /><strong>{coverage.sourceShapes.toLocaleString()}</strong><span>source shapes</span></article>
      <article><Database size={19} /><strong>{coverage.cableSegmentLabels} / {coverage.interpretedCableSegments}</strong><span>segment labels accounted</span></article>
      <article><Layers3 size={19} /><strong>{coverage.closures} · {coverage.accessPointOdfRecords} · {coverage.aggregationContexts}</strong><span>closures · AP/ODF · aggregations</span></article>
      <article><ShieldCheck size={19} /><strong>{coverage.logicalFibers.toLocaleString()}</strong><span>logical fibers</span></article>
      <article><strong>{coverage.logicalPorts}</strong><span>reviewed logical ports</span></article>
      <article><strong>{coverage.connectionAssertions}</strong><span>connection assertions</span></article>
      <article><strong>{coverage.authoritativeAssertions}</strong><span>authoritative</span></article>
      <article><strong>{coverage.candidateAssertions}</strong><span>candidate</span></article>
      <article><strong>{coverage.unresolvedAssertions}</strong><span>unresolved</span></article>
      <article><strong>{coverage.conflictingAssertions}</strong><span>conflicting</span></article>
      <article><strong>{coverage.unclassifiedMeaningfulText}</strong><span>unclassified meaningful text</span></article>
    </section>

    <section className="panel migration-reconciliation">
      <div className="panel-header"><div><h2>Source accounting</h2><p>Every direct-text/comment occurrence is classified; raw extraction remains immutable.</p></div><Badge tone={coverage.unclassifiedMeaningfulText === 0 ? 'success' : 'danger'}>{coverage.unclassifiedMeaningfulText === 0 ? 'Reconciled' : 'Remainder exists'}</Badge></div>
      <div className="reconciliation-equation"><strong>{coverage.totalTextAndComments.toLocaleString()}</strong><span>=</span><span>{coverage.structuredTextOccurrences} structured</span><span>+</span><span>{coverage.annotationOccurrences} annotation</span><span>+</span><span>{coverage.layoutOccurrences.toLocaleString()} classified layout</span></div>
      <details><summary>Coverage notes</summary><ul>{coverage.notes.map(note => <li key={note}>{note}</li>)}</ul></details>
    </section>

    <section className="assertion-review-workspace">
      <aside className="panel assertion-list">
        <div className="panel-header"><div><h2>Assertions</h2><p>{filtered.length} of {assertions.length}</p></div></div>
        <div className="assertion-filters">
          <label className="field"><span>Entity</span><select value={entity} onChange={e => setEntity(e.target.value as typeof entity)}><option value="all">All entities</option>{Object.entries(entityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field"><span>Evidence basis</span><select value={basis} onChange={e => setBasis(e.target.value as typeof basis)}><option value="all">All evidence</option>{Object.entries(evidenceBasisLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field"><span>Operational status</span><select value={status} onChange={e => setStatus(e.target.value as typeof status)}><option value="all">All statuses</option>{Object.entries(operationalStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field"><span>Review state</span><select value={review} onChange={e => setReview(e.target.value as typeof review)}><option value="all">All review states</option>{Object.entries(claimReviewLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field"><span>Closure / AP / ODF</span><select value={location} onChange={e => setLocation(e.target.value)}><option value="all">All locations</option>{locations.map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="field"><span>Search</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="C184, SC218, port range…" /></label>
        </div>
        <div className="assertion-scroll">{filtered.length ? filtered.map(item => <button key={item.id} className={`candidate-row ${selected?.id === item.id ? 'is-selected' : ''}`} onClick={() => setSelectedId(item.id)}><span><strong>{item.subjectId} · {item.claimType}</strong><small>{entityLabels[item.entityType]} · {claimReviewLabels[item.reviewState]}</small></span><Badge tone={statusTone(item.operationalStatus)}>{operationalStatusLabels[item.operationalStatus]}</Badge></button>) : <EmptyState title="No assertions found" description="Change the filters or search text." />}</div>
      </aside>

      <article className="panel assertion-detail">{selected ? <>
        <div className="panel-header"><div><span className="eyebrow">{entityLabels[selected.entityType]} · {selected.id}</span><h2>{selected.subjectId} · {selected.claimType}</h2></div><Badge tone={statusTone(selected.operationalStatus)}>{operationalStatusLabels[selected.operationalStatus]}</Badge></div>
        <div className="assertion-questions">
          <section><span>What does the source say?</span><pre>{JSON.stringify(selected.value, null, 2)}</pre></section>
          <section><span>What does Fiber Atlas interpret?</span><strong>{entityLabels[selected.entityType]} / {selected.claimType}</strong><p>{selected.routeOrDirection ?? 'No route/direction assignment'}</p></section>
          <section><span>What evidence supports it?</span>{selectedEvidence.map(record => <div className="evidence-summary" key={record.id}><Badge>{evidenceBasisLabels[record.basis]}</Badge><strong>{record.summary}</strong><small>{record.fieldVerified ? 'Field verified / ადგილზე გადამოწმებული' : record.basis === 'owner_confirmation' ? 'Owner confirmed · not field verified' : 'Documentation evidence · not field verified'}</small></div>)}</section>
          <section><span>What does the system use operationally?</span><strong>{operationalStatusLabels[selected.operationalStatus]}</strong><p>Review: {claimReviewLabels[selected.reviewState]} · revision {selected.version}</p></section>
          <section><span>What remains unresolved?</span>{selected.warnings.length ? <ul>{selected.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul> : <p>No assertion-specific warning. Related object fields may still be unresolved.</p>}</section>
        </div>
        {groups.length > 0 && <div className="assertion-groups"><strong>Review group</strong>{groups.map(group => <p key={group.id}>{group.title} · {group.memberAssertionIds.length} individual assertions{group.containsConflict ? ' · contains conflict' : ''}</p>)}</div>}
        <label className="field"><span>Rationale for this session decision</span><textarea value={rationale} onChange={e => setRationale(e.target.value)} placeholder="Optional local rationale; persistence is deferred." /></label>
        <div className="review-actions" aria-label="Assertion review actions">
          <button className="button" onClick={() => act('confirm_interpretation')}><Check size={16} /> Confirm interpretation</button>
          <button className="button button-primary" onClick={() => act('mark_authoritative')}>Mark operationally authoritative</button>
          <button className="button" onClick={() => act('keep_candidate')}>Keep candidate</button>
          <button className="button" onClick={() => act('mark_unresolved')}>Mark unresolved</button>
          <button className="button" onClick={() => act('reject_interpretation')}>Reject interpretation</button>
          <button className="button" onClick={() => act('mark_disputed')}>Mark disputed</button>
        </div>
        <p className="muted">Correct and supersede are modeled as revision-producing review events; this static prototype does not persist edits yet.</p>
      </> : <EmptyState title="Select an assertion" description="Choose an item from the filtered assertion list." />}</article>
    </section>
  </>;
}
