import { AlertTriangle, ArrowRight, Cable, CircleHelp, Database, FileText, MapPin, Network, Route as RouteIcon } from 'lucide-react';
import type { ShowcaseCompletenessState, ViewProps } from '../domain/types';
import { findSourceDocument } from '../domain/showcase';
import { parentWorkspaceRoute, routeWithSelection } from '../domain/routeWorkspace';
import { PageHeader } from '../components/ui';
import { ITERATION24_IMPORT_DATE } from '../domain/iteration24';

const stateLabel: Record<ShowcaseCompletenessState, string> = {
  complete: 'Complete', partial: 'Partial', unresolved: 'Unresolved', not_present_in_source: 'Not present in source',
};

export function DocumentOverview({ data, navigate, id }: ViewProps & { id: string }) {
  const document = findSourceDocument(data, id);
  if (!document) return <div className="empty-state"><h1>Source document not found</h1><button className="button" onClick={() => navigate({ view: 'dashboard' })}>Dashboard</button></div>;
  const rootRoute = (data.cableRoutes ?? []).find(route => parentWorkspaceRoute(data, route).id === route.id);
  const sc207 = data.externalBoundaries?.find(item => item.id === 'BOUNDARY-SC207');
  const lentekhi = data.aggregations.find(item => item.id === 'AGG-LENTEKHI');
  const counts = document.counts;
  return <div className="document-overview">
    <PageHeader eyebrow="Source Network Document" title={document.title} description={`${document.sourceFile} · page ${document.sourcePages[0]?.name} · one reviewed Fiber Atlas import package.`} action={rootRoute ? <button className="button button-primary" onClick={() => navigate({ view: 'route', id: rootRoute.id })}>Open Route Workspace <ArrowRight size={17} /></button> : undefined} />
    <p className="document-source-revision"><strong>Active source:</strong> {document.sourceFile} · imported {ITERATION24_IMPORT_DATE} · SHA-256 {document.sourceSha256.slice(0, 12)}</p>
    <section className="document-hero" aria-label="Document completeness summary">
      <div className="document-hero-copy"><FileText size={24} /><div><span>Reviewed import package</span><h2>Everything meaningful on this page is accounted for.</h2><p>Unresolved facts remain visible as uncertainty, conflicts, or external continuations. The source document never becomes the identity of a Cable, Closure, AP, or Route.</p></div></div>
      <dl className="document-count-grid">
        <div><dt>Aggregations</dt><dd>{counts.aggregations}</dd></div><div><dt>Closures</dt><dd>{counts.closures}</dd></div><div><dt>Cable Segments</dt><dd>{counts.cableSegments}</dd></div><div><dt>Logical Fibers</dt><dd>{counts.logicalFibers.toLocaleString()}</dd></div><div><dt>AP / ODF assets</dt><dd>{counts.accessPointOdfAssets}</dd></div><div><dt>Known ODF Ports</dt><dd>{counts.logicalOdfPorts}</dd></div><div><dt>Routes</dt><dd>{counts.routes}</dd></div><div><dt>External boundaries</dt><dd>{counts.externalContinuations}</dd></div>
      </dl>
    </section>
    <section className="document-section"><div className="document-section-heading"><div><span>Completeness by domain</span><h2>Known, partial, and unresolved are kept separate</h2></div><p>No combined percentage is used.</p></div><div className="completeness-list">{document.completeness.map(item => <article className={`completeness-row is-${item.state}`} key={item.id}><div><strong>{item.label}</strong><span>{stateLabel[item.state]}</span></div><p>{item.summary}</p><small>{item.total ? `${item.known.toLocaleString()} known / ${item.total.toLocaleString()} reviewed scope` : 'No exact records established'}</small></article>)}</div></section>
    {counts.logicalApPorts!=null&&<p>Source AP logical Ports: {counts.logicalApPorts} · <button className="context-link" onClick={()=>navigate({view:'import',runId:'SOURCE-B-28D'})}>AP / Port evidence and review</button></p>}
    <section className="document-section"><div className="document-section-heading"><div><span>Network directions</span><h2>Main route and external continuations</h2></div></div><div className="document-direction-grid">
      {rootRoute && <article><RouteIcon size={21} /><div><strong>Main Tsageri–Lentekhi direction</strong><p>{rootRoute.origin.label} → {rootRoute.destination.label}</p><button type="button" onClick={() => navigate({ view: 'route', id: rootRoute.id })}>Explore route <ArrowRight size={15} /></button></div></article>}
      {sc207 && rootRoute && <article className="is-external"><Network size={21} /><div><strong>Alpana–Tvishi–Ambrolauri</strong><p>Current document ends at the SC207 boundary. The network continues in another regional source document.</p><button type="button" onClick={() => navigate(routeWithSelection(rootRoute.id, { type: 'boundary', id: sc207.id }))}>Inspect continuation <ArrowRight size={15} /></button></div></article>}
      {lentekhi && rootRoute && <article className="is-conflict"><AlertTriangle size={21} /><div><strong>ლენტეხის აგრეგაცია</strong><p>Destination is known; numeric legacy identifier is conflicting. AGG6 heading and property ID5 are both retained.</p><button type="button" onClick={() => navigate(routeWithSelection(rootRoute.id, { type: 'aggregation', id: lentekhi.id }))}>Inspect endpoint <ArrowRight size={15} /></button></div></article>}
    </div></section>
    <section className="document-section"><div className="document-section-heading"><div><span>Explorable inventory</span><h2>One page, connected operational context</h2></div></div><div className="document-inventory-links">
      <button onClick={() => rootRoute && navigate(routeWithSelection(rootRoute.id, { type: 'aggregation', id: '5' }))}><Database size={19} /><span><strong>Tsageri aggregation</strong><small>ODF-TSAGERI-01 · 192 ports · four reviewed ranges</small></span></button>
      <button onClick={() => rootRoute && navigate(routeWithSelection(rootRoute.id, { type: 'segment', id: 'CAB-000172' }))}><Cable size={19} /><span><strong>C172 construction showcase</strong><small>4 confirmed tubes · 48 documented fiber colors · PhysicalCable context</small></span></button>
      <button onClick={() => rootRoute && navigate(routeWithSelection(rootRoute.id, { type: 'ap', id: '41' }))}><MapPin size={19} /><span><strong>AP41 non-tree topology</strong><small>Tsageri ingress · Ambrolauri ports 3–22 backfeed</small></span></button>
      <button onClick={() => navigate({ view: 'review' })}><CircleHelp size={19} /><span><strong>{counts.unresolvedAssertions} unresolved · {counts.conflictingAssertions} conflicting assertions</strong><small>Open the engineering review workspace</small></span></button>
    </div></section>
  </div>;
}

