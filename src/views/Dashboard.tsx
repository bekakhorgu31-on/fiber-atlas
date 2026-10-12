import { ArrowRight, CircleHelp, FileText, Route as RouteIcon, Search } from 'lucide-react';
import type { ViewProps } from '../domain/types';
import { parentWorkspaceRoute, routeInventoryCounts } from '../domain/routeWorkspace';
import { buildNetworkTopologyProjection } from '../domain/networkTopology';
import { PageHeader } from '../components/ui';

export function Dashboard({ data, navigate }: ViewProps) {
  const routes = (data.cableRoutes ?? []).filter(route => parentWorkspaceRoute(data, route).id === route.id);
  const topology = buildNetworkTopologyProjection(data);
  const primaryRoute = routes[0];
  const sourceDocuments = data.sourceDocuments ?? [];
  const annotations = ((data as unknown as { sourceAnnotations?: Array<Record<string, unknown>> }).sourceAnnotations ?? []);
  const annotationScope = (annotation: Record<string, unknown>) => String(annotation.scope ?? annotation.associationScope ?? annotation.reviewState ?? '').toLowerCase();
  const sourceReport = data.sourceAnnotationReport;
  const annotationReport = {
    total: sourceReport?.totalCandidateTexts ?? annotations.length,
    associated: sourceReport?.associated ?? annotations.filter(annotation => ['asset', 'group', 'route'].some(scope => annotationScope(annotation).includes(scope))).length,
    unresolved: sourceReport?.unresolvedAssociation ?? annotations.filter(annotation => annotationScope(annotation).includes('unresolved')).length,
  };
  return <div className="route-first-dashboard">
    <PageHeader eyebrow="Fiber Atlas · ოპტიკური ქსელის ციფრული ატლასი" title="აქტიური ქსელი" description="ორი Visio წყაროდან შეჯერებული ერთი canonical ფიზიკური ქსელი. Cable მარშრუტი და Fiber continuity ცალ-ცალკე ნაჩვენებია." action={<button className="button button-quiet" onClick={() => document.querySelector<HTMLInputElement>('#network-search')?.focus()}><Search size={17} /> ქსელში ძიება</button>} />
    <section className="dashboard-combined-network"><div><span>COMBINED NETWORK</span><h2>ერთი ქსელი · {data.sourceDocuments?.length ?? 0} source documents</h2><p>SC206-ზე ფიზიკურად გრძელდება C169-ით ლენტეხის მიმართულებით და C151-ით SC207 → C152-ისკენ.</p><div className="dashboard-network-facts"><strong>{data.cables.length} Cable</strong><strong>{data.fibers.length.toLocaleString()} Fiber</strong><strong>{topology.components.length} component</strong><strong>{topology.omittedCableIds.length} omitted</strong></div></div>{primaryRoute && <button className="button button-primary" onClick={() => navigate({ view: 'route', id: primaryRoute.id })}>ქსელის სქემის გახსნა <ArrowRight size={17} /></button>}</section>
    {sourceDocuments.length > 0 && <section className="dashboard-document-list" aria-label="Imported source documents"><h2>Source document records</h2>{sourceDocuments.map(sourceDocument => <article className="dashboard-document-card" key={sourceDocument.id}><div className="dashboard-document-icon"><FileText size={23} /></div><div><span>Imported source · {sourceDocument.counts.cableSegments} represented Cable Segments</span><h3>{sourceDocument.title}</h3><p>{sourceDocument.counts.logicalFibers.toLocaleString()} logical Fiber positions · source-specific evidence and completeness</p></div><button type="button" onClick={() => navigate({ view: 'document', id: sourceDocument.id })}>Open source details <ArrowRight size={17} /></button></article>)}</section>}
    <section className="route-choice-section" aria-labelledby="route-choice-title">
      <div className="route-choice-heading"><div><span>Optional route context</span><h2 id="route-choice-title">კურირებული მარშრუტები</h2></div><p>ეს მარშრუტები ქსელის მხოლოდ შერჩეული ფიზიკური კონტექსტებია.</p></div>
      <div className="route-card-grid">{routes.map(route => {
        const counts = routeInventoryCounts(data, route);
        return <article className="route-choice-card" key={route.id}>
          <div className="route-card-icon"><RouteIcon size={22} /></div>
          <div className="route-card-copy"><span>Cable Route</span><h3>{route.displayName}</h3><p>{route.origin.label} <b>→</b> {route.destination.label}</p></div>
          <dl><div><dt>Route nodes</dt><dd>{route.nodes.length}</dd></div><div><dt>Main segments</dt><dd>{route.legs.filter(leg => !!leg.segmentId).length}</dd></div><div><dt>Branches / APs</dt><dd>{route.branches.length} / {counts.apIds.size}</dd></div><div><dt>Needs attention</dt><dd>{counts.unresolved}</dd></div></dl>
          <button className="route-card-action" type="button" onClick={() => navigate({ view: 'route', id: route.id })}>Open Route Workspace <ArrowRight size={17} /></button>
        </article>;
      })}</div>
    </section>
    <div className="dashboard-secondary-actions"><button type="button" onClick={() => document.querySelector<HTMLInputElement>('#network-search')?.focus()}><Search size={18} /><span><strong>Find an asset</strong><small>Search Cable Segment, Closure, AP, Fiber or place</small></span></button><button type="button" onClick={() => navigate({ view: 'review' })}><CircleHelp size={18} /><span><strong>{data.issues.filter(issue => issue.state === 'open').length} open review issues</strong><small>Identity conflicts and unresolved records</small></span></button></div>
    <details className="dashboard-source-review"><summary>Source and migration administration</summary><p>Tsageri-Lentekhi 2025.vsdx · snapshot {data.snapshot}</p><p>{data.sourceCounts.cables} Cable Segment labels · {data.sourceCounts.closures} Closure records · {data.sourceCounts.accessPoints} AP/ODF records · {data.sourceCounts.aggregations} aggregation symbols.</p><p>{annotationReport.total} source annotations · {annotationReport.associated} associated · {annotationReport.unresolved} unresolved associations.</p><button className="button button-quiet" onClick={() => navigate({ view: 'import' })}>Open Migration Review <ArrowRight size={17} /></button></details>
  </div>;
}
