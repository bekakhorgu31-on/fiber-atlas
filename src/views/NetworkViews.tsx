import { CurrentFiberJourney } from './CurrentFiberJourney';
import { routeWithSelection } from '../domain/routeWorkspace';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { AssetRef, Cable, CableRoute, ConnectionRow, Fiber, Inventory, OpticalEnd, Route, RouteNode, SourceRef, Tube, ViewProps } from '../domain/types';
import {
  allocationLabels, assetExists, assetLabel, assetRoute, attachedCables, availabilitySummary, cableDisplayName, cableFibers, cableLegacyLabel, colorLabel, commercialRoles, conditionLabels, connectivityLabels,
  endLabel, endLegacyLabel, fiberConnections, fiberLabel, fiberTube, findCable, findFiber, manufacturerLabel, orderedRouteNodes, otherEnd, routeSpans, routeSummary, rowsForClosure, traceFiber, tubeLabel, typedAssetLabel, verificationLabels,
} from '../domain/network';
import { cableRoutesForSegment, findCableRoute, orderedCableRouteLegs, orderedCableRouteNodes, routeConditionLabels, routeTreatmentLabels } from '../domain/cableRoutes';
import { relationshipState, targetPathSummary } from '../domain/pathReview';
import { portRangeFor, traceFromOdfPort } from '../domain/aggregationTopology';
import { portOperationalView, portOperationalLabel, portOperationalRoute } from '../domain/iteration28g';
import { buildFiberDetailModel, type OperationalPathState } from '../domain/fiberDetail';
import { accessPointOperatorSummary, closureOperatorSummary, routeNodeOperatorBranches, segmentOperatorSummary, type OperatorBranch } from '../domain/operatorTopology';
import { Badge, CommercialRoles, EmptyState, Evidence, FiberIdentity, PageHeader, PhysicalColorIdentity, VerificationBadge } from '../components/ui';

function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="panel"><div className="panel-header"><h2 className="section-title">{title}</h2>{action}</div>{children}</section>;
}

function Fact({ label, value, children }: { label: string; value?: ReactNode; children?: ReactNode }) {
  return <div className="fact"><div className="field-label">{label}</div><div>{children ?? value ?? 'უცნობია'}</div></div>;
}

function LinkButton({ children, onClick, quiet = true }: { children: ReactNode; onClick: () => void; quiet?: boolean }) {
  return <button className={`button ${quiet ? 'button-quiet' : 'button-primary'}`} type="button" onClick={onClick}>{children}</button>;
}

function OperationalPathStrip({ path, selected }: { path: string[]; selected?: string }) {
  return <div className="operator-path" aria-label="Route through">
    {path.map((item, index) => <span className={item === selected ? 'is-selected' : ''} key={`${index}-${item}`}>
      {index > 0 && <i aria-hidden="true">→</i>}<b>{item}</b>
    </span>)}
  </div>;
}

function OperatorBranches({ branches }: { branches: OperatorBranch[] }) {
  if (!branches.length) return <p className="operator-empty">No nearby branch is documented.</p>;
  return <div className="operator-branches">{branches.map(branch => <article className={`operator-branch is-${branch.status}`} key={branch.id}>
    <span className="operator-fork" aria-hidden="true">↳</span><div><strong>{branch.label}</strong>
      {branch.status === 'unresolved' && <small>Continuation is unresolved; this is not proven optical connectivity.</small>}
      {branch.status === 'conflict' && <small>Conflicting source claims are preserved.</small>}
      {branch.children.map(child => <span className="operator-child" key={child}>↳ {child}</span>)}
    </div>
  </article>)}</div>;
}

function ClarificationSummary({ items }: { items: string[] }) {
  return <div className="operator-clarification"><strong>Needs clarification</strong><span>{items.join(' · ')}</span></div>;
}

function AssetLink({ data, asset, navigate }: ViewProps & { asset: AssetRef }) {
  const route = assetExists(data, asset) ? assetRoute(asset) : null;
  return route ? <button className="context-link" type="button" onClick={() => navigate(route)}>{typedAssetLabel(asset)}</button> : <span>{typedAssetLabel(asset)}</span>;
}

function SourceNote({ source }: { source: SourceRef }) {
  return <Evidence source={source} />;
}

const relationshipLabels = { accepted: 'მიღებული', candidate: 'სავარაუდო', conflicting: 'კონფლიქტური', unresolved: 'გადაუწყვეტელი', unmapped: 'კავშირი უცნობია' } as const;
const relationshipTone = (state: keyof typeof relationshipLabels): 'success' | 'warning' | 'danger' | 'neutral' => state === 'accepted' ? 'success' : state === 'conflicting' ? 'danger' : state === 'candidate' || state === 'unresolved' ? 'warning' : 'neutral';

function RelationshipBadge({ connection }: { connection: ConnectionRow['connection'] }) {
  const state = relationshipState(connection);
  return <Badge tone={relationshipTone(state)}>{relationshipLabels[state]}</Badge>;
}

function ConnectionReviewEvidence({ connection }: { connection: NonNullable<ConnectionRow['connection']> }) {
  const review = connection.review;
  return <details className="evidence"><summary>კავშირის მტკიცებულება და განხილვის შედეგი</summary>
    <p>{connection.inference}</p>
    {review && <div className="facts-grid">
      <Fact label="კავშირის მდგომარეობა"><RelationshipBadge connection={connection} /></Fact>
      <Fact label="A ბოლოს იდენტობა"><VerificationBadge value={review.endpointAIdentity} /></Fact>
      <Fact label="Z ბოლოს იდენტობა"><VerificationBadge value={review.endpointZIdentity} /></Fact>
      <Fact label="ოპტიკური კავშირი"><VerificationBadge value={review.opticalConnectivity} /></Fact>
      <Fact label="ფიზიკური ოპერაცია"><VerificationBadge value={review.operation} /></Fact>
      {review.destinationAsset && <Fact label="დანიშნულების ობიექტი"><VerificationBadge value={review.destinationAsset} /></Fact>}
      {review.port && <Fact label={`პორტი${review.candidatePort ? ` ${review.candidatePort}` : ''}`}><VerificationBadge value={review.port} /></Fact>}
      {review.containment && <Fact label="AP/ODF კუთვნილება"><VerificationBadge value={review.containment} /></Fact>}
    </div>}
    {review && <><p><strong>განხილვის საფუძველი:</strong> {review.basis}</p><p className="muted">{review.reviewer} · {review.reviewedAt} · SHA-256 {review.sourceSha256}</p>{review.warnings.map(warning => <p className="notice notice-warning" key={warning}>{warning}</p>)}</>}
    <Evidence source={connection.source} />
  </details>;
}

function CableEndpoints({ cable, navigate, data }: ViewProps & { cable: Cable }) {
  return <div className="route-context"><span>A / B წერტილები</span><strong><AssetLink data={data} navigate={navigate} asset={cable.endpointA} /> ↔ <AssetLink data={data} navigate={navigate} asset={cable.endpointB} /></strong></div>;
}

const accessLabels: Record<RouteNode['accessType'], string> = { unknown: 'წვდომის ტიპი უცნობია', pass_through: 'გავლა', opened: 'მონაკვეთი გახსნილია (ჟილები გაჭრილად არ ითვლება)', terminated: 'ტერმინაცია წყაროში' };

function CableRoute({ data, cable, navigate }: ViewProps & { cable: Cable }) {
  const nodes = orderedRouteNodes(cable);
  const summary = routeSummary(cable);
  const spans = routeSpans(cable);
  return <Panel title="კაბელის მონაკვეთის მარშრუტი">
    <p className="muted">A და B მონაკვეთის საორიენტაციო ბოლოებია და არა ოპტიკური მოძრაობის მიმართულება. მონაკვეთის გზა ჟილის ოპტიკური კავშირისგან დამოუკიდებელია.</p>
    <div className="route-summary"><Fact label="A წერტილი" value={typedAssetLabel(cable.endpointA)} /><Fact label="B წერტილი" value={typedAssetLabel(cable.endpointB)} /><Fact label="ცნობილი შუალედური კვანძები" value={summary.intermediateCount == null ? 'უცნობია — შუალედური მარშრუტი არ არის აღწერილი' : String(summary.intermediateCount)} /><Fact label="აღწერილი ინტერვალები" value={String(spans.length)} /></div>
    <p className="muted">შუალედების რაოდენობა მხოლოდ ჩამოთვლილ მეზობელ კვანძებს ითვლის; ეს არ ადასტურებს გზის საველე დათვალიერებას.</p>
    {cable.routeCompleteness === 'endpoints_only' && <p className="notice notice-warning">წყარო ამ მონაკვეთისთვის მხოლოდ A და B ბოლოებს ასახელებს. შუალედური კვანძების არქონა დადასტურებული არ არის.</p>}
    <ol className="route-visual">{nodes.map((node, index) => <li className="route-node" key={`${node.sequence}-${node.asset.kind}-${node.asset.id}`}>
      <div><span className="field-label">{index === 0 ? 'A წერტილი' : index === nodes.length - 1 ? 'B წერტილი' : `შუალედური კვანძი ${index}`}</span><strong><AssetLink data={data} navigate={navigate} asset={node.asset} /></strong>
      <small>{accessLabels[node.accessType]} · {verificationLabels[node.verification]}</small></div>{node.source && <Evidence source={node.source} />}
    </li>)}</ol>
  </Panel>;
}

type UiRecord = Record<string, unknown>;
const uiText = (record: UiRecord, ...keys: string[]) => {
  for (const key of keys) if (typeof record[key] === 'string' && record[key]) return record[key] as string;
  return '';
};
const uiRecords = (data: Inventory, key: string): UiRecord[] => {
  const value = (data as unknown as UiRecord)[key];
  return Array.isArray(value) ? value.filter((item): item is UiRecord => !!item && typeof item === 'object') : [];
};
function annotationAssetIds(annotation: UiRecord): string[] {
  const values = annotation.associatedAssets ?? annotation.associatedAssetIds ?? annotation.relatedAssetIds ?? annotation.assetIds ?? annotation.associations;
  if (!Array.isArray(values)) return [];
  return values.flatMap(value => {
    if (typeof value === 'string') return [value.replace(/^(closure|sc)[:#-]?/i, '')];
    if (value && typeof value === 'object') {
      const item = value as UiRecord;
      const id = uiText(item, 'assetId', 'id');
      return id ? [id.replace(/^(closure|sc)[:#-]?/i, '')] : [];
    }
    return [];
  });
}
function annotationsForRoute(data: Inventory, route: CableRoute): UiRecord[] {
  const embedded = (route as unknown as UiRecord).annotations;
  const embeddedRows = Array.isArray(embedded) ? embedded.filter((item): item is UiRecord => !!item && typeof item === 'object') : [];
  const topLevel = uiRecords(data, 'sourceAnnotations').filter(annotation => {
    const routeId = uiText(annotation, 'routeId', 'associatedRouteId', 'targetRouteId');
    const associatedRoutes = annotation.associatedRouteIds;
    return routeId === route.id || (Array.isArray(associatedRoutes) && associatedRoutes.includes(route.id));
  });
  return [...embeddedRows, ...topLevel];
}
function annotationsForNode(data: Inventory, route: CableRoute, node: CableRoute['nodes'][number]): UiRecord[] {
  const ids = node.asset ? [node.asset.id, `${node.asset.kind}:${node.asset.id}`, `${node.asset.kind === 'closure' ? 'SC' : node.asset.kind.toUpperCase()}${node.asset.id}`] : [node.id];
  return uiRecords(data, 'sourceAnnotations').filter(annotation => {
    const associatedNodes = Array.isArray(annotation.associatedRouteNodeIds) ? annotation.associatedRouteNodeIds : [];
    return associatedNodes.includes(node.id) || annotationAssetIds(annotation).some(id => ids.includes(id));
  });
}
function annotationBadgeLabel(annotation: UiRecord): string {
  const summary = uiText(annotation, 'summary', 'normalizedSummary', 'shortLabel') || uiText(annotation, 'rawText', 'text', 'title') || 'წყაროს კომენტარი';
  const ids = annotationAssetIds(annotation).map(id => id.match(/(?:closure:|SC)?(\d+)/i)?.[1]).filter((id): id is string => !!id).map(Number).sort((a, b) => a - b);
  const scope = uiText(annotation, 'scope', 'associationScope').toLowerCase();
  const rangeText = ids.length > 1 ? `SC${ids[0]}–SC${ids[ids.length - 1]}` : '';
  const range = (scope.includes('group') || ids.length > 1) && rangeText && !summary.startsWith(rangeText) ? `${rangeText} · ` : '';
  const concise = summary.length > 75 ? `${summary.slice(0, 72)}…` : summary;
  return `${range}${concise}`;
}
function RouteAsset({ data, asset, label, navigate }: ViewProps & { asset: AssetRef | null; label: string }) {
  if (!asset || !assetExists(data, asset)) return <span className="route-step-label">{label}</span>;
  return <button className="context-link route-step-link" type="button" onClick={() => navigate(assetRoute(asset)!)}>{label}</button>;
}

function RouteTimeline({ data, route, navigate, selectedSegmentId }: ViewProps & { route: CableRoute; selectedSegmentId?: string }) {
  const nodes = orderedCableRouteNodes(route), legs = orderedCableRouteLegs(route);
  return <ol className="route-timeline operator-route" aria-label="კაბელის მარშრუტის დალაგებული გზა">
    {nodes.map((node, index) => {
      const leg = legs[index];
      const segment = leg?.segmentId ? findCable(data, leg.segmentId) : undefined;
      const sourceReferencedSegment = !segment && leg?.sourceLabel ? findCable(data, leg.sourceLabel.split('-')[0]) : undefined;
      const annotations = annotationsForNode(data, route, node);
      const inlineBranches = node.asset?.kind === 'closure' ? routeNodeOperatorBranches(data, route, node.id) : [];
      return <li className="route-timeline-item" key={node.id}>
        <div className={`route-step${node.asset ? '' : ' is-unresolved'}`}>
          <span className="route-step-index">{index + 1}</span>
          <div><RouteAsset data={data} navigate={navigate} asset={node.asset} label={node.label} />
            <small>{index === 0 ? 'Route start' : index === nodes.length - 1 ? 'Final documented boundary' : 'Main continuation'}</small>
            {!!annotations.length && <details className="route-node-annotation"><summary><Badge tone="neutral">{annotations.length} source note{annotations.length > 1 ? 's' : ''}</Badge></summary>{annotations.map((annotation, noteIndex) => <p key={uiText(annotation, 'id') || noteIndex}>{annotationBadgeLabel(annotation)}</p>)}</details>}
          </div>
        </div>
        {!!inlineBranches.length && <OperatorBranches branches={inlineBranches} />}
        {leg && <div className={`route-leg${leg.relationship !== 'segment' ? ' is-gap' : ''}${leg.segmentId === selectedSegmentId ? ' is-selected' : ''}`}>
          <span className="route-main-label">Main</span>
          {segment ? <button className="context-link" type="button" onClick={() => navigate({ view: 'cable', id: segment.id })}>{cableDisplayName(segment, data)}</button>
            : sourceReferencedSegment ? <span><button className="context-link" type="button" onClick={() => navigate({ view: 'cable', id: sourceReferencedSegment.id })}>C{sourceReferencedSegment.legacyCableId} · source segment imported</button> · endpoint conflict/unresolved</span>
              : <span>Continuation segment unresolved</span>}
          {leg.segmentId === selectedSegmentId && <Badge tone="success">Selected</Badge>}
        </div>}
      </li>;
    })}
  </ol>;
}

function routeDistanceSummary(data: Inventory, route: CableRoute) {
  const observations = uiRecords(data, 'distanceObservations');
  let knownMeters = 0, missingLegs = 0, conflicts = 0;
  for (const leg of orderedCableRouteLegs(route)) {
    const matches = observations.filter(item => {
      const target = item.target && typeof item.target === 'object' ? item.target as UiRecord : {};
      return uiText(item, 'routeLegId', 'targetRouteLegId', 'legId') === leg.id || uiText(target, 'routeLegId', 'legId', 'id') === leg.id || (!!leg.segmentId && (uiText(item, 'cableSegmentId', 'segmentId', 'targetId') === leg.segmentId || uiText(target, 'segmentId', 'id') === leg.segmentId));
    });
    const usable = matches.filter(item => typeof (item.distanceMeters ?? item.canonicalMeters ?? item.valueMeters ?? item.meters ?? item.distanceM) === 'number' && ['field_verified', 'documentation_reviewed'].includes(uiText(item, 'verification', 'reviewState')) && !['superseded', 'conflicting'].includes(uiText(item, 'resolution')));
    const preferred = usable.filter(item => item.preferred === true || item.isPreferred === true || ['preferred', 'active'].includes(uiText(item, 'resolution', 'resolutionState')));
    const candidates = preferred.length ? preferred : usable;
    const values = [...new Set(candidates.map(item => Number(item.distanceMeters ?? item.canonicalMeters ?? item.valueMeters ?? item.meters ?? item.distanceM)))];
    if (values.length === 1) knownMeters += values[0];
    else if (values.length > 1) conflicts++;
    else missingLegs++;
  }
  const kilometers = (knownMeters / 1000).toLocaleString('ka-GE', { maximumFractionDigits: 2 });
  return { knownMeters, missingLegs, conflicts, label: knownMeters ? `${kilometers} კმ ცნობილი მონაკვეთებიდან${missingLegs ? ` · ${missingLegs} უცნობი მონაკვეთი` : ''}` : 'მანძილის სანდო დაკვირვება არ არის' };
}

function organizationName(data: Inventory, value: unknown): string {
  const organizations = uiRecords(data, 'organizations');
  const ref = value && typeof value === 'object' ? value as UiRecord : null;
  const id = typeof value === 'string' ? value : ref ? uiText(ref, 'id', 'organizationId') : '';
  const state = ref ? uiText(ref, 'state') : 'known';
  if (!id || (state && state !== 'known')) return '';
  return organizations.find(org => uiText(org, 'id') === id)?.name as string ?? id;
}

function RouteNotes({ data, route }: { data: Inventory; route: CableRoute }) {
  const annotations = annotationsForRoute(data, route);
  const notes = annotations.filter(item => uiText(item, 'summary', 'normalizedSummary', 'shortLabel', 'rawText', 'text'));
  if (!notes.length && !route.warnings.length) return null;
  return <details className="panel operator-secondary"><summary>Important annotations</summary>
    {notes.map((annotation, index) => <div className="route-note" key={uiText(annotation, 'id') || `note-${index}`}><Badge tone="neutral">{uiText(annotation, 'category') || 'წყაროს კომენტარი'}</Badge><p>{uiText(annotation, 'summary', 'normalizedSummary', 'shortLabel', 'rawText', 'text')}</p></div>)}
    {route.warnings.map((warning, index) => <p className="notice notice-warning" key={`warning-${index}`}>{warning}</p>)}
    {!!annotations.length && <details className="evidence route-annotation-evidence"><summary>წყაროს კომენტარები და მტკიცებულება</summary>{annotations.map((annotation, index) => {
      const source = annotation.source && typeof annotation.source === 'object' ? annotation.source as SourceRef : undefined;
      return <article className="route-annotation-record" key={uiText(annotation, 'id') || `annotation-${index}`}><strong>{uiText(annotation, 'summary', 'normalizedSummary', 'shortLabel') || 'წყაროს კომენტარი'}</strong><p>{uiText(annotation, 'rawText', 'text', 'rawValue')}</p><small>{uiText(annotation, 'scope', 'associationScope')} · {uiText(annotation, 'verification', 'reviewState')}</small>{Array.isArray(annotation.warnings) && annotation.warnings.map((warning, i) => <p key={i}>{String(warning)}</p>)}{source && <Evidence source={source} />}</article>;
    })}</details>}
  </details>;
}

function RouteSecondarySummary({ data, route }: { data: Inventory; route: CableRoute }) {
  const record = route as unknown as UiRecord;
  const assignments = uiRecords(data, 'infrastructureRoles').filter(item => uiText(item, 'subjectType') === 'route' && uiText(item, 'subjectId') === route.id);
  const ownerAssignment = assignments.find(item => uiText(item, 'role') === 'physical_infrastructure_owner');
  const operatorAssignment = assignments.find(item => uiText(item, 'role') === 'network_operator');
  const owner = (ownerAssignment && organizationName(data, uiText(ownerAssignment, 'organizationId'))) || organizationName(data, record.physicalOwner ?? record.physicalOwnerId ?? record.physicalInfrastructureOwner ?? record.physicalInfrastructureOwnerId ?? record.infrastructureOwner ?? record.ownerOrganizationId ?? record.owner);
  const operator = (operatorAssignment && organizationName(data, uiText(operatorAssignment, 'organizationId'))) || organizationName(data, record.networkOperator ?? record.networkOperatorId ?? record.operator ?? record.operatorOrganizationId);
  const distance = routeDistanceSummary(data, route);
  return <details className="evidence route-secondary"><summary>მფლობელი, ოპერატორი და ნაწილობრივი მანძილი</summary><div className="facts-grid"><Fact label="ფიზიკური ინფრასტრუქტურის მფლობელი" value={owner || 'უცნობია'} /><Fact label="ქსელის ოპერატორი" value={operator || 'უცნობია'} /><Fact label="ცნობილი მანძილი" value={distance.label} /><Fact label="მანძილი უცნობია" value={`${distance.missingLegs} მონაკვეთი`} />{distance.conflicts > 0 && <Fact label="ურთიერთსაწინააღმდეგო გაზომვა" value={`${distance.conflicts} მონაკვეთი`} />}</div><p className="muted">უცნობი მანძილი ნულად არ ითვლება; რამდენიმე წყაროს დაკვირვება დამოუკიდებლად ინახება.</p></details>;
}

function CableRouteContext({ data, route, navigate, selectedSegmentId, compact = false }: ViewProps & { route: CableRoute; selectedSegmentId?: string; compact?: boolean }) {
  return <section className={`panel route-context-panel${compact ? ' is-compact' : ''}`}>
    <div className="panel-header"><div><h2 className="section-title">{compact ? 'Route context' : route.displayName}</h2></div>
      {compact && <button className="context-link" type="button" onClick={() => navigate({ view: 'route', id: route.id })}>მარშრუტის სრულად ნახვა</button>}
    </div>
    <div className="operator-facts route-operator-facts"><article><span>Start</span><strong>{route.origin.label}</strong></article><article><span>Final endpoint / boundary</span><strong>{route.destination.label}</strong></article><article><span>Path structure</span><strong>{route.nodes.length} nodes · branches shown at their origin</strong></article></div>
    <RouteTimeline data={data} navigate={navigate} route={route} selectedSegmentId={selectedSegmentId} />
    {route.destination.state === 'unresolved' && <p className="notice notice-warning route-boundary">მარშრუტის ბოლო დადასტურებული არ არის: {route.destination.label}{route.destination.candidateAssetLabel ? ` · კანდიდატი: ${route.destination.candidateAssetLabel}` : ''}</p>}
    <details className="evidence route-evidence"><summary>Technical details and evidence · წყარო და მტკიცებულება</summary><div className="facts-grid"><Fact label="Physical condition" value={routeConditionLabels[route.condition]} /><Fact label="Documentation" value={route.documentation === 'incomplete' ? 'Incomplete' : 'Complete'} /></div>{!!route.warnings.length && <p>{route.warnings.join(' ')}</p>}<Evidence source={route.source} />
      <div className="facts-grid">{orderedCableRouteNodes(route).map(node => <div className="fact" key={node.id}><strong>{node.label}</strong><p>{node.source.note ?? 'შენიშვნა არ არის'}</p><small>{node.source.file} · {node.source.page} · shapes {node.source.shapeIds.join(', ')}</small>{node.warnings.map(warning => <p key={warning}>{warning}</p>)}</div>)}</div>
      <div className="facts-grid">{orderedCableRouteLegs(route).map(leg => <div className="fact" key={leg.id}><strong>{leg.segmentId ? findCable(data, leg.segmentId) ? cableDisplayName(findCable(data, leg.segmentId)!, data) : leg.segmentId : 'დოკუმენტირებული მონაკვეთი'}</strong><p>{leg.source.note ?? 'შენიშვნა არ არის'}</p><small>{leg.source.file} · shapes {leg.source.shapeIds.join(', ')}</small>{leg.warnings.map(warning => <p key={warning}>{warning}</p>)}</div>)}</div>
      <div className="facts-grid">{route.branches.map(branch => <div className="fact" key={branch.id}><strong>განშტოება → {branch.destination ? typedAssetLabel(branch.destination) : branch.targetDirectionText || branch.sourceLabel || 'მიმართულება უცნობია'}</strong><p>{branch.source.note}</p><small>{branch.source.file} · shapes {branch.source.shapeIds.join(', ')}</small>{branch.warnings.map(warning => <p key={warning}>{warning}</p>)}</div>)}</div>
    </details>
  </section>;
}

export function CableRouteView({ data, navigate, id }: ViewProps & { id: string }) {
  const route = findCableRoute(data, id);
  if (!route) return <div className="view-content"><EmptyState title="კაბელის მარშრუტი ვერ მოიძებნა" description={`${id} მარშრუტის ჩანაწერი არ არსებობს.`} /></div>;
  return <div className="view-content"><PageHeader eyebrow="კაბელის მარშრუტი" title={route.displayName} description="ფიზიკური ქსელის დალაგებული გზა; ჟილის ოპტიკური კვალი ცალკე იკითხება." /><CableRouteContext data={data} navigate={navigate} route={route} /><RouteNotes data={data} route={route} /><RouteSecondarySummary data={data} route={route} />
    <details className="evidence"><summary>ამ მარშრუტის Cable Segment-ები</summary><div className="asset-list">{orderedCableRouteLegs(route).map(leg => { const segment = leg.segmentId ? findCable(data, leg.segmentId) : undefined; return segment ? <button className="asset-row" key={leg.id} type="button" onClick={() => navigate({ view: 'cable', id: segment.id })}><strong>{cableDisplayName(segment, data)}</strong><span>{cableLegacyLabel(segment)}</span></button> : null; })}</div><p>მარშრუტის წევრობა საერთო ფიზიკურ გარსს (PhysicalCable/CableRun) არ ადასტურებს.</p></details>
  </div>;
}

function tubeGroups(data: Inventory, fibers: Fiber[]) {
  const groups = new Map<string, { tube?: Tube; fibers: Fiber[] }>();
  for (const fiber of fibers) {
    const tube = fiberTube(data, fiber);
    const key = tube?.id ?? `unknown-${fiber.cableId}`;
    const group = groups.get(key) ?? { tube, fibers: [] };
    group.fibers.push(fiber);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function TubeFiberContext({ data, cableId, fiberNumber, navigate, showCable = true }: ViewProps & { cableId: string; fiberNumber: number; showCable?: boolean }) {
  const cable = findCable(data, cableId), fiber = findFiber(data, cableId, fiberNumber);
  if (!cable || !fiber) return <div className="muted">კაბელის მონაკვეთი ან ჟილა ვერ მოიძებნა.</div>;
  const tube = fiberTube(data, fiber);
  return <div className="fiber-context">
    {showCable && <><strong><button className="context-link" type="button" onClick={() => navigate({ view: 'cable', id: cable.id })}>{cableDisplayName(cable, data)}</button></strong>
    <small className="muted">{cableLegacyLabel(cable)}</small></>}
    <div className="pill-row"><FiberIdentity fiber={fiber} /><Badge>{tubeLabel(tube)}</Badge><span>ტუბის ფერი: <PhysicalColorIdentity color={tube?.physicalColor} /></span><span>პოზიცია ტუბში: {fiber.positionInTube ?? 'უცნობია'}</span></div>
  </div>;
}

function FiberPhysicalSummary({ data, fiber }: { data: Inventory; fiber: Fiber }) {
  const tube = fiberTube(data, fiber);
  return <small className="endpoint-physical muted">{tubeLabel(tube)} · პოზიცია {fiber.positionInTube ?? 'უცნობია'} · ჟილის ფერი: {colorLabel(fiber.physicalColor)} · ტუბის ფერი: {colorLabel(tube?.physicalColor)}</small>;
}

function CableIdentity({ cable }: { cable: Cable }) {
  return <details className="evidence"><summary>ტექნიკური ID</summary><p>{cable.id}</p></details>;
}

export function CableView({ data, navigate, id }: ViewProps & { id: string }) {
  const cable = findCable(data, id);
  if (!cable) return <div className="view-content"><EmptyState title="კაბელის მონაკვეთი ვერ მოიძებნა" description={`ჩანაწერი ${id} ამ საცავში არ არის.`} /></div>;
  const fibers = cableFibers(data, cable.id);
  const availability = availabilitySummary(data, fibers);
  const cableRoutes = cableRoutesForSegment(data, cable.id);
  const physicalCable = (data.physicalCables ?? []).find(item => item.id === cable.physicalCableId);
  const operator = segmentOperatorSummary(data, cable);
  const operatorRoute = operator.routeId ? findCableRoute(data, operator.routeId) : undefined;
  return <div className="view-content">
    <PageHeader eyebrow="Cable Segment" title={cableDisplayName(cable, data)} description={`Legacy C${cable.legacyCableId} · Local segment, route and physical-cable extents are shown separately.`} />
    <section className="operator-summary operator-segment-summary">
      <div className="operator-facts">
        <article><span>From aggregation / direction</span><strong>{operator.source}</strong></article>
        <article><span>Current local endpoints</span><strong>{operator.localEndpoints}</strong></article>
        <article><span>Final known route destination</span><strong>{operator.finalRouteEndpoint}</strong></article>
        <article><span>Containing PhysicalCable</span><strong>{operator.physicalCable}</strong></article>
        <article><span>PhysicalCable endpoint</span><strong>{operator.physicalCableEndpoint}</strong></article>
        <article><span>After the physical cable ends</span><strong>{operator.routeContinuesAfterPhysicalCable ? 'Route continues on another PhysicalCable' : 'No further same-route extent is established'}</strong></article>
      </div>
      <div className="operator-section"><span className="operator-label">Route through</span><OperationalPathStrip path={operator.path} selected={operator.selectedToken} /></div>
      <div className="operator-section"><span className="operator-label">Nearby branches</span><OperatorBranches branches={operator.branches} /></div>
      <ClarificationSummary items={operator.unresolved} />
    </section>
    <div className="pill-row segment-actions"><LinkButton quiet={false} onClick={() => document.querySelector('.tube-groups')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View fibers</LinkButton>{operatorRoute && <LinkButton onClick={() => navigate({ view: 'route', id: operatorRoute.id })}>Open full route</LinkButton>}<AssetLink data={data} navigate={navigate} asset={cable.endpointA} /><AssetLink data={data} navigate={navigate} asset={cable.endpointB} /><LinkButton onClick={() => navigate({ view: 'trace', cableId: cable.id, fiber: Math.min(29, cable.fiberCount) })}>Trace F{String(Math.min(29, cable.fiberCount)).padStart(2, '0')}</LinkButton></div>
    {physicalCable && <details className="evidence segment-technical"><summary>PhysicalCable membership and extent details</summary><div className="extent-compare"><article><span className="field-label">Local Segment</span><strong>{operator.localEndpoints}</strong></article><article><span className="field-label">Physical Cable extent</span><strong>{physicalCable.endA.label} → {physicalCable.endB.label}</strong></article><article><span className="field-label">Cable Route</span><strong>{operator.source} → {operator.finalRouteEndpoint}</strong></article></div><div className="membership-list">{physicalCable.segmentMemberships.map(member => <div className="asset-row" key={member.segmentId}><strong>{member.segmentId === cable.id ? cableDisplayName(cable, data) : member.segmentId}</strong><Badge tone={member.state === 'accepted' ? 'success' : 'warning'}>{member.state}</Badge><span>{member.basis}</span></div>)}</div></details>}
    <details className="evidence segment-technical"><summary>ტექნიკური კაბელის მონაცემები</summary><CableIdentity cable={cable} /><div className="facts-grid">
      <Fact label="მწარმოებელი"><span>{manufacturerLabel(cable)} <VerificationBadge value={cable.manufacturerVerification} /></span></Fact><Fact label="მოდელი" value={cable.model ?? 'უცნობია'} /><Fact label="პროდუქტის კოდი" value={cable.productCode ?? 'უცნობია'} /><Fact label="კაბელის ტიპი" value={cable.cableType ?? 'უცნობია'} /><Fact label="კონსტრუქცია" value={cable.constructionType ?? 'უცნობია'} /><Fact label="ტუბების რაოდენობა" value={cable.tubeCount == null ? 'უცნობია' : String(cable.tubeCount)} /><Fact label="ფერების სქემა" value={cable.colorScheme ?? 'უცნობია'} /><Fact label="სიგრძე" value={cable.lengthM == null ? 'უცნობია' : `${cable.lengthM} მ`} /><Fact label="ტერიტორია" value={data.area.name} /><Fact label="PhysicalCable / CableRun" value={cable.physicalCableId ?? 'უცნობია · ცალკე იდენტობა'} />
    </div><p>მემკვიდრეობითი მონაცემი: {cableLegacyLabel(cable)}</p><Evidence source={cable.source} /></details>
    {!operatorRoute && <CableRoute data={data} cable={cable} navigate={navigate} />}
    <Panel title="ჟილების მდგომარეობა">
      <div className="stats-grid capacity-stats">
        <div className="stat"><span className="field-label">თავისუფლად დადასტურებული</span><strong className="stat-value">{availability.available}</strong></div>
        <div className="stat"><span className="field-label">მინიჭებული · ცნობილია</span><strong className="stat-value">{availability.assigned}</strong></div>
        <div className="stat"><span className="field-label">რეზერვირებული · ცნობილია</span><strong className="stat-value">{availability.reserved}</strong></div>
        <div className="stat"><span className="field-label">დაზიანებული / ბლოკირებული</span><strong className="stat-value">{availability.damaged}</strong></div>
        <div className="stat"><span className="field-label">ხელმისაწვდომობა უცნობია</span><strong className="stat-value">{availability.unknown}</strong></div>
      </div>
      <p className="muted">0 ნიშნავს, რომ შესაბამისი მდგომარეობა არც ერთ ჟილაზე არ არის დადასტურებული. უცნობი ხელმისაწვდომს არ ნიშნავს.</p>
      <details className="evidence"><summary>წინა ფერთა სქემა — დაუდასტურებელი ვარაუდი</summary><p>წინა პროტოტიპის ფერთა ვარაუდი თითოეული ჟილის დამატებით მონაცემებშია შენახული. ის Visio-დან დადასტურებულ ფიზიკურ ფერს ან მწარმოებლის სქემას არ წარმოადგენს.</p></details>
      <div className="tube-groups" aria-label={`${cableDisplayName(cable, data)} ჟილების ტუბების ჯგუფები`}>
        {tubeGroups(data, fibers).map(group => <details className="tube-group" key={group.tube?.id ?? 'unknown'}>
          <summary className="tube-header"><strong>{group.tube?.basis === 'provisional' ? `${tubeLabel(group.tube)} · ფიზიკური ტუბის ნომერი უცნობია` : tubeLabel(group.tube)}</strong><span>ტუბის ფერი: {colorLabel(group.tube?.physicalColor)}</span><Badge>{group.fibers.length} ჟილა</Badge></summary>
          <div className="fiber-list">{group.fibers.map(fiber => <button className="fiber-row" key={fiber.id} type="button" onClick={() => navigate({ view: 'fiber', cableId: cable.id, fiber: fiber.number })} aria-label={`${cableDisplayName(cable, data)} · ${tubeLabel(group.tube)} · ${fiberLabel(fiber.number)}`}>
            <FiberIdentity fiber={fiber} /><small>{fiber.positionInTube == null ? 'პოზიცია უცნობია' : `პოზიცია ${fiber.positionInTube}`}</small>
          </button>)}</div>
        </details>)}
      </div>
      <details className="table-wrap"><summary>ცხრილის სახით ნახვა</summary>
        <table className="data-table"><thead><tr><th>ჟილა</th><th>ტუბი</th><th>ტუბის ფერი</th><th>პოზიცია ტუბში</th><th>განაწილება</th><th>მდგომარეობა</th><th>კავშირი</th><th>გადამოწმება</th><th>უფლებები და დანიშნულება</th></tr></thead>
          <tbody>{fibers.map(fiber => <tr key={fiber.id}>
            <td data-label="ჟილა"><FiberIdentity fiber={fiber} compact /></td><td data-label="ტუბი">{tubeLabel(fiberTube(data, fiber))}</td><td data-label="ტუბის ფერი">{colorLabel(fiberTube(data, fiber)?.physicalColor)}</td><td data-label="პოზიცია ტუბში">{fiber.positionInTube == null ? 'უცნობია' : fiber.positionInTube}</td>
            <td data-label="განაწილება">{allocationLabels[fiber.allocation]}</td><td data-label="მდგომარეობა">{conditionLabels[fiber.condition]}</td><td data-label="კავშირი">{connectivityLabels[fiber.connectivity]}</td><td data-label="გადამოწმება"><VerificationBadge value={fiber.verification} /></td>
            <td data-label="უფლებები და დანიშნულება"><details><summary>დეტალების ნახვა</summary><CommercialRoles data={data} cableId={cable.id} fiberNumber={fiber.number} /><p>{fiberConnections(data, cable.id, fiber.number).map(c => `${typedAssetLabel(c.location)} → ${endLabel(otherEnd(c, cable.id, fiber.number, data), data)}${c.approved ? '' : ' · სავარაუდო'}`).join('; ') || 'დანიშნულება უცნობია'}</p><details><summary>წინა ფერთა სქემა · სავარაუდო და დაუდასტურებელი</summary><p>ჟილის ფერი: {colorLabel(fiber.proposedColor)}</p><p>პოზიცია: {fiber.proposedPositionInTube ?? 'უცნობია'}</p></details><button className="context-link" type="button" onClick={() => navigate({ view: 'fiber', cableId: cable.id, fiber: fiber.number })}>ჟილის ჩანაწერი</button></details></td>
          </tr>)}</tbody>
        </table>
      </details>
    </Panel>
    <details className="evidence"><summary>უფლებები, სერვისი და შენიშვნები</summary><CommercialRoles data={data} cableId={cable.id} />{cable.notes.length > 0 && <ul>{cable.notes.map((note, i) => <li key={`${i}-${note}`}>{note}</li>)}</ul>}</details>
  </div>;
}

const ALL = 'ყველა';

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<string | { value: string; label: string }>; onChange: (value: string) => void }) {
  return <label className="field"><span className="field-label">{label}</span><select value={value} onChange={e => onChange(e.target.value)}><option value={ALL}>ყველა</option>{options.map(option => {
    const item = typeof option === 'string' ? { value: option, label: option } : option;
    return item.value !== ALL && <option key={item.value} value={item.value}>{item.label}</option>;
  })}</select></label>;
}

export function ClosureView({ data, navigate, id }: ViewProps & { id: string }) {
  const closure = data.closures.find(item => item.id === id);
  const cables = attachedCables(data, { kind: 'closure', id });
  const [cableId, setCableId] = useState(cables[0]?.id ?? '');
  const [fromFiber, setFromFiber] = useState('');
  const [toFiber, setToFiber] = useState('');
  const [allocation, setAllocation] = useState(ALL);
  const [operation, setOperation] = useState(ALL);
  const [owner, setOwner] = useState(ALL);
  const [service, setService] = useState(ALL);
  const [verification, setVerification] = useState(ALL);
  const [selectedKey, setSelectedKey] = useState('');
  const selectedFocusRef = useRef<HTMLDivElement>(null);
  const cable = findCable(data, cableId);
  const allRows = cable ? rowsForClosure(data, id, cableId) : [];
  const ownerOptions = [...new Set(allRows.map(row => roleValue(data, row, 0)))].sort();
  const serviceOptions = [...new Set(allRows.map(row => roleValue(data, row, 4)))].sort();
  const rows = allRows.filter(row => {
    const lo = fromFiber ? Number(fromFiber) : 1;
    const hi = toFiber ? Number(toFiber) : Number.MAX_SAFE_INTEGER;
    return row.fiber >= lo && row.fiber <= hi &&
      (allocation === ALL || allocationLabels[row.record.allocation] === allocation) &&
      (operation === ALL || connectivityLabels[row.connection?.operation ?? 'unknown'] === operation) &&
      (owner === ALL || roleValue(data, row, 0) === owner) &&
      (service === ALL || roleValue(data, row, 4) === service) &&
      (verification === ALL || verificationLabels[row.connection?.verification ?? row.record.verification] === verification);
  });
  const selected = rows.find(r => r.key === selectedKey);
  const selectedOther = selected?.other;
  useEffect(() => {
    if (selectedKey && selected) selectedFocusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedKey]);
  const clearSelection = () => setSelectedKey('');
  const clearFilters = () => { clearSelection(); setFromFiber(''); setToFiber(''); setAllocation(ALL); setOperation(ALL); setOwner(ALL); setService(ALL); setVerification(ALL); };
  if (!closure) return <div className="view-content"><EmptyState title="ქურო ვერ მოიძებნა" description={`ჩანაწერი ${id} საცავში არ არის.`} /></div>;
  const operator = closureOperatorSummary(data, id);
  return <div className="view-content">
    <PageHeader eyebrow="Closure" title={assetLabel({ kind: 'closure', id })} description="Network role and branch context" />
    {closure.contextOnly && <p className="notice notice-warning">ეს ქურო კონტექსტური საზღვრის ჩანაწერია; მთლიანი ობიექტის იმპორტი დადასტურებული არ არის.</p>}
    <section className="operator-summary operator-closure-summary">
      <div className="operator-facts">
        <article><span>From</span><strong>{operator.source}</strong></article>
        <article><span>Incoming / upstream</span><strong>{operator.incoming.join(' · ') || 'Route starts here'}</strong></article>
        <article className="is-main"><span>Main continuation</span><strong>{operator.mainContinuation ?? 'Main path ends here'}</strong></article>
        <article><span>Final known route destination</span><strong>{operator.finalRouteEndpoint}</strong></article>
      </div>
      <div className="operator-section"><span className="operator-label">Branches from SC{id}</span><OperatorBranches branches={operator.branches} /></div>
      <ClarificationSummary items={operator.unresolved} />
      <div className="pill-row">{operator.routeId && <LinkButton onClick={() => navigate({ view: 'route', id: operator.routeId! })}>Open route</LinkButton>}{cables.map(c => <LinkButton key={c.id} onClick={() => navigate({ view: 'cable', id: c.id })}>{cableDisplayName(c, data)}</LinkButton>)}</div>
    </section>
    <details className="evidence closure-technical"><summary>ქუროს დამატებითი მონაცემები</summary><div className="facts-grid">
      <Fact label="დამაგრება" value={closure.mounting ?? 'უცნობია'} /><Fact label="კოორდინატები" value={closure.coordinatesRaw || 'უცნობია'} />
      <Fact label="მფლობელი" value={knownValue(closure.owner)} />
    </div></details>
    <details className="evidence"><summary>ტერიტორია, ცვლილებები და შენიშვნები</summary>
      <div className="facts-grid"><Fact label="ტერიტორია" value={data.area.name} /><Fact label="ბოლო საველე გადამოწმება" value={closure.lastVerified ?? 'არ არის მითითებული'} /><Fact label="ბოლო დამტკიცებული ცვლილება" value={closure.lastApprovedChange ?? 'არ არის მითითებული'} /></div>
      <p className="muted">კოორდინატთა სისტემა დადასტურებული არ არის; ნედლი კოორდინატები საველე მონაცემად არ ითვლება.</p>
      {closure.notes.length > 0 && <ul>{closure.notes.map((note, i) => <li key={`${i}-${note}`}>{note}</li>)}</ul>}
      {data.issues.filter(issue => issue.assetIds.includes(id)).map(issue => <p key={issue.id}><strong>{issue.title}:</strong> {issue.description}</p>)}
    </details>
    <Panel title="კაბელის მონაკვეთების დაკავშირებული ჩანაწერები">
      {!cables.length ? <EmptyState title="კაბელის მონაკვეთი არ მოიძებნა" description="ამ ქუროსთან დაკავშირებული მონაკვეთი წყაროებში არ არის დაფიქსირებული." /> : <>
        <div className="filter-bar">
          <label className="field"><span className="field-label">კაბელის მონაკვეთი</span><select value={cableId} onChange={e => { setCableId(e.target.value); clearSelection(); }} aria-label="კაბელის მონაკვეთის არჩევა">{cables.map(c => <option key={c.id} value={c.id}>{cableDisplayName(c, data)} · ძველი C{c.legacyCableId}</option>)}</select></label>
          <label className="field"><span className="field-label">ჟილა, დან</span><input type="number" min="1" value={fromFiber} onChange={e => { setFromFiber(e.target.value); clearSelection(); }} placeholder="1" /></label>
          <label className="field"><span className="field-label">ჟილა, მდე</span><input type="number" min="1" value={toFiber} onChange={e => { setToFiber(e.target.value); clearSelection(); }} placeholder={String(cable?.fiberCount ?? '')} /></label>
        </div>
        <details className="filter-advanced"><summary>დამატებითი ფილტრები</summary><div className="filter-bar">
          <FilterSelect label="განაწილება" value={allocation} options={Object.values(allocationLabels)} onChange={v => { setAllocation(v); clearSelection(); }} />
          <FilterSelect label="ოპერაცია" value={operation} options={[...new Set(Object.values(connectivityLabels))]} onChange={v => { setOperation(v); clearSelection(); }} />
          <FilterSelect label="კაბელის მფლობელი" value={owner} options={ownerOptions} onChange={v => { setOwner(v); clearSelection(); }} />
          <FilterSelect label="სერვისი" value={service} options={serviceOptions} onChange={v => { setService(v); clearSelection(); }} />
          <FilterSelect label="გადამოწმება" value={verification} options={Object.values(verificationLabels)} onChange={v => { setVerification(v); clearSelection(); }} />
          <button className="button button-quiet" type="button" onClick={clearFilters}>ფილტრების გასუფთავება</button>
        </div></details>
        <p className="muted">ნაჩვენებია {selected ? 1 : rows.length} / {allRows.length} ჟილა. შეუხამებელი ჟილა უცნობ მდგომარეობას ნიშნავს. ორივე ბოლოს ნომერი და ფიზიკური ფერი დამოუკიდებლად იკითხება; ისინი უწყვეტობის გასაღები არ არის.</p>
        {selected && <div className="connection-focus" aria-live="polite" tabIndex={-1} ref={selectedFocusRef}>
          <div className="panel-header"><strong>{cableDisplayName(findCable(data, selected.cableId)!, data)} / {fiberLabel(selected.fiber)} — შერჩეული კავშირი</strong><button className="context-link" type="button" onClick={clearSelection}>ყველა ჟილის ჩვენება</button></div>
          <TubeFiberContext data={data} navigate={navigate} cableId={selected.cableId} fiberNumber={selected.fiber} />
          <div className="connection-middle"><RelationshipBadge connection={selected.connection} /><Badge>{connectivityLabels[selected.connection?.operation ?? 'unknown']}</Badge><VerificationBadge value={selected.connection?.verification ?? selected.record.verification} />{selected.connection && <span>{assetLabel(selected.connection.location)}</span>}</div>
          {selected.other?.kind === 'fiber' ? <TubeFiberContext data={data} navigate={navigate} cableId={selected.other.cableId} fiberNumber={selected.other.fiber} /> : <div className="connection-node">{selected.other ? endLabel(selected.other, data) : 'შესაბამისი ბოლო უცნობია'}</div>}
          <details className="evidence"><summary>მფლობელობა, უფლებები და სერვისი</summary><CommercialRoles data={data} cableId={cableId} fiberNumber={selected.fiber} /></details>
          {selected.connection && <ConnectionReviewEvidence connection={selected.connection} />}
          <div className="pill-row"><LinkButton onClick={() => navigate({ view: 'fiber', cableId, fiber: selected.fiber })}>ჟილის ჩანაწერი</LinkButton><LinkButton onClick={() => navigate({ view: 'trace', cableId, fiber: selected.fiber })}>მარშრუტის ნახვა</LinkButton>
            {selectedOther?.kind === 'fiber' && <LinkButton onClick={() => navigate({ view: 'fiber', cableId: selectedOther.cableId, fiber: selectedOther.fiber })}>მეორე ჟილის ჩანაწერი</LinkButton>}
          </div>
        </div>}
        <div className="table-wrap"><table className="data-table"><thead><tr><th>ჟილა</th><th>შესაბამისი ბოლო</th><th>ოპერაცია</th><th>გადამოწმება</th></tr></thead>
          <tbody>{(selected ? [selected] : rows).map(row => <tr key={row.key} className={selectedKey === row.key ? 'selected-row' : ''}>
            <td data-label="ჟილა"><button className="context-link" type="button" onClick={() => setSelectedKey(row.key)}>{cableDisplayName(findCable(data, row.cableId)!, data)}</button><FiberIdentity fiber={row.record} /><small className="muted">{endLegacyLabel({ kind: 'fiber', cableId: row.cableId, fiber: row.fiber, at: row.location }, data)}</small><FiberPhysicalSummary data={data} fiber={row.record} /></td>
            <td data-label="შესაბამისი ბოლო">{row.other ? row.other.kind === 'fiber' ? (() => { const otherFiber = findFiber(data, row.other.cableId, row.other.fiber)!; return <><span>{cableDisplayName(findCable(data, row.other.cableId)!, data)}</span><FiberIdentity fiber={otherFiber} /><small className="muted">{endLegacyLabel(row.other, data)}</small><FiberPhysicalSummary data={data} fiber={otherFiber} /></>; })() : <><span>{endLabel(row.other, data)}</span><small className="muted">{endLegacyLabel(row.other, data)}</small></> : 'უცნობია'}</td><td data-label="ოპერაცია">{connectivityLabels[row.connection?.operation ?? 'unknown']}</td><td data-label="გადამოწმება"><div className="pill-row"><RelationshipBadge connection={row.connection} /><VerificationBadge value={row.connection?.verification ?? row.record.verification} /></div></td>
          </tr>)}</tbody></table></div>
        {rows.length === 0 && <EmptyState title="ამ ფილტრებით ჟილა ვერ მოიძებნა" description="შეცვალეთ დიაპაზონი ან დამატებითი ფილტრები." />}
      </>}
    </Panel>
    <details className="evidence"><summary>მფლობელობა და კომერციული როლები</summary><CommercialRoles data={data} cableId={cableId || cables[0]?.id || ''} /></details>
    <SourceNote source={closure.source} />
  </div>;
}

function roleValue(data: Inventory, row: ConnectionRow, index: number) {
  const roles = commercialRoles(data, row.cableId, row.fiber);
  return roles[index]?.value ?? 'უცნობია';
}

function knownValue(ref: { state: string; id?: string }) { return ref.state === 'known' ? ref.id : ref.state === 'none' ? 'არ არის — დადასტურებული' : 'უცნობია'; }

export function FiberView({ data, navigate, cableId, fiber }: ViewProps & { cableId: string; fiber: number }) {
  const cable = findCable(data, cableId);
  const record = findFiber(data, cableId, fiber);
  const model = buildFiberDetailModel(data, cableId, fiber);
  if (!record || !cable || !model) return <div className="view-content"><EmptyState title="ჟილა ვერ მოიძებნა" description={`${cableId} / ${fiberLabel(fiber)} ჩანაწერი საცავში არ არის.`} /></div>;
  if (data.fiberPathProjection) return <div className="view-content"><CurrentFiberJourney data={data} cableId={cable.id} fiberNumber={fiber} navigate={navigate} onSelect={selection=>navigate(routeWithSelection(data.cableRoutes![0].id,selection))} /></div>;
  const stateLabel: Record<OperationalPathState, string> = { current: 'მიმდინარე ჟილა', accepted: 'მიღებული', candidate: 'სავარაუდო', conflicting: 'კონფლიქტური', unresolved: 'გადაუწყვეტელი' };
  const stateTone = (state: OperationalPathState): 'success' | 'warning' | 'danger' | 'neutral' => state === 'accepted' ? 'success' : state === 'candidate' || state === 'unresolved' ? 'warning' : state === 'conflicting' ? 'danger' : 'neutral';
  const physical = model.physicalCable;
  const candidatePhysical = model.physicalCableCandidate;
  const eventTone = model.conflictingContinuations.length ? 'danger' : model.acceptedContinuations.length ? 'success' : 'warning';
  return <div className="view-content fiber-operational-detail">
    <header className="fiber-identity-block">
      <div><span className="eyebrow">ჟილის ოპერაციული ჩანაწერი</span><h1>{model.fiberLabel}</h1><p className="fiber-segment-line">{model.segmentLabel}</p><p className="fiber-physical-line">{record.physicalColor.basis === 'documented' ? <><PhysicalColorIdentity color={record.physicalColor} /> <span>{model.compactPhysical.replace(` · ${model.primaryPhysicalColor}`, '')}</span></> : <span>{model.compactPhysical}</span>}</p></div>
      <div className="fiber-primary-actions"><LinkButton quiet={false} onClick={() => navigate({ view: 'trace', cableId: cable.id, fiber })}>ჟილის Trace</LinkButton><div className="fiber-secondary-actions">{model.routeId && <button className="context-link" type="button" onClick={() => navigate({ view: 'route', id: model.routeId! })}>Cable Route</button>}<button className="context-link" type="button" onClick={() => navigate({ view: 'cable', id: cable.id })}>მონაკვეთი</button><button className="context-link" type="button" onClick={() => navigate({ view: 'closure', id: model.currentClosure.id })}>{model.currentClosure.label}</button></div></div>
    </header>

    <Panel title="Optical Path / ჟილის გზა">
      <p className="operational-lead">სრული Trace-ის მოკლე ოპერაციული ხედი. მიღებული გზა არის უწყვეტი, კანდიდატი — წყვეტილი, ხოლო უცნობ საზღვარზე გზა ჩერდება.</p>
      <ol className="operational-path">{model.pathSteps.map(step => <li className={`operational-path-step state-${step.state}`} key={step.id}><span className="path-rail" aria-hidden="true" /><div className="path-card"><div className="pill-row"><Badge tone={stateTone(step.state)}>{stateLabel[step.state]}</Badge><small>{step.kind}</small></div><strong>{step.label}</strong><p>{step.detail}</p>{step.route && <button className="context-link" type="button" onClick={() => navigate(step.route!)}>ჩანაწერის გახსნა</button>}</div></li>)}</ol>
      {!model.pathSteps.length && <p className="notice notice-warning">ოპტიკური გზის არც ერთი ნაბიჯი არ არის დადასტურებული.</p>}
      <div className="path-stop-reasons">{model.strictStopReasons.map((reason, index) => <p className="notice notice-warning" key={`${index}-${reason}`}><strong>კვალი ჩერდება:</strong> {reason}</p>)}</div>
    </Panel>

    <Panel title={`At ${model.currentClosure.label} / ქუროში`}>
      <p className={`fiber-event-summary tone-${eventTone}`}><strong>{model.currentEventSummary}</strong></p>
      {!!model.continuations.length && <div className="continuation-list">{model.continuations.map(item => <article className={`continuation-card state-${item.state}`} key={item.id}><div className="pill-row"><Badge tone={item.state === 'accepted' ? 'success' : item.state === 'conflicting' ? 'danger' : 'warning'}>{item.state === 'accepted' ? 'მიღებული' : item.state === 'candidate' ? 'სავარაუდო' : item.state === 'conflicting' ? 'კონფლიქტური' : 'გადაუწყვეტელი'}</Badge><strong>C{model.cableLegacyId}/{model.fiberLabel} → {item.label}</strong></div><p>{item.operation} · {item.destinationContext}</p>{item.destinationColor && item.destinationColor !== item.sourceColor && <p className="color-mismatch">ფიზიკური ფერები: {model.fiberLabel} · {item.sourceColor} → {item.label} · {item.destinationColor}</p>}<details className="evidence"><summary>კავშირის დეტალები</summary><ConnectionReviewEvidence connection={item.connection} /></details></article>)}</div>}
      {!model.continuations.length && <p>ამ ჟილისთვის {model.currentClosure.label}-ზე არც მიღებული და არც სავარაუდო mapping არ არის.</p>}
      {model.candidateContinuations.length > 1 && <p className="notice notice-warning">{model.candidateContinuations.length} შესაძლო გაგრძელებაა. სისტემა არც ერთს ავტომატურად არ ირჩევს.</p>}
    </Panel>

    <section className="fiber-context-grid" aria-label="ჟილის ფიზიკური და მიმართულების კონტექსტი">
      <article className="fiber-context-card"><span className="field-label">Current Segment / მიმდინარე მონაკვეთი</span><strong>{cableDisplayName(cable, data)}</strong><p>Legacy C{model.cableLegacyId}</p><button className="context-link" type="button" onClick={() => navigate({ view: 'cable', id: cable.id })}>მონაკვეთის გახსნა</button></article>
      <article className="fiber-context-card"><span className="field-label">Physical Cable / ფიზიკური კაბელი</span>{physical ? <><strong>{physical.id}</strong><p>Upstream: {physical.endA.label}</p><p>Physical end: {physical.endB.label}</p><p>მარშრუტი SC218-ის შემდეგ სხვა ფიზიკური კაბელით გრძელდება.</p></> : candidatePhysical ? <><strong>მიღებული PhysicalCable უცნობია</strong><p>{candidatePhysical.id} · მხოლოდ სავარაუდო წევრობა</p><p>მომიჯნავეობა ან 48F რაოდენობა წევრობას არ ამტკიცებს.</p></> : <><strong>PhysicalCable უცნობია</strong><p>ამ მონაკვეთისთვის მიღებული ფიზიკური გარსი არ არის დადგენილი.</p></>}</article>
      <article className="fiber-context-card"><span className="field-label">Upstream / საიდან მოდის</span><strong>{model.upstreamSummary}</strong><p>Exact ODF port: unresolved</p><p>Direction-level knowledge does not create a Port→Fiber mapping.</p></article>
      <article className="fiber-context-card"><span className="field-label">Downstream / სად მიდის</span><strong>{model.currentEventSummary}</strong><p>Broader direction/destination: {model.broaderDestination}</p><p>Exact optical continuation and infrastructure direction are separate facts.</p></article>
    </section>

    <Panel title="Cable Route context"><div className="route-context-compact"><strong>{model.routeLabel}</strong><p>{model.routeContext}</p>{model.routeId && <button className="context-link" type="button" onClick={() => navigate({ view: 'route', id: model.routeId! })}>სრული ფიზიკური მარშრუტის ნახვა</button>}</div></Panel>

    <section className="fiber-status-summary" aria-label="გამოყენება და მდგომარეობა"><article><span className="field-label">Use / გამოყენება</span><strong>{model.usage}</strong></article><article><span className="field-label">Condition</span><strong>{model.condition}</strong></article><article><span className="field-label">Availability</span><strong>{model.availability}</strong></article></section>

    <details className="evidence clarification-disclosure"><summary>Needs clarification / დასაზუსტებელია · {model.needsClarification.length}</summary><div className="clarification-chips">{model.needsClarification.map(item => <span key={item}>{item}</span>)}</div><p>ეს ჯგუფი მხოლოდ ეკრანის იერარქიას ამარტივებს; underlying Unknown მნიშვნელობები უცვლელია.</p></details>
    <details className="evidence"><summary>Commercial details / კომერციული დეტალები</summary><CommercialRoles data={data} cableId={cable.id} fiberNumber={fiber} /></details>
    <details className="evidence"><summary>Technical Details</summary><div className="facts-grid"><Fact label="Canonical Fiber ID" value={model.technical.canonicalFiberId} /><Fact label="Canonical Segment ID" value={model.technical.canonicalSegmentId} /><Fact label="Legacy cable ID" value={model.technical.legacyCableId} /><Fact label="Legacy full label" value={model.technical.legacyFullLabels.join(' · ')} /><Fact label="Allocation" value={allocationLabels[record.allocation]} /><Fact label="Connectivity field" value={connectivityLabels[record.connectivity]} /><Fact label="Manufacturer" value={manufacturerLabel(cable)} /><Fact label="Tube color" value={colorLabel(fiberTube(data, record)?.physicalColor)} /></div>{record.notes.length > 0 && <ul>{record.notes.map((note, index) => <li key={`${index}-${note}`}>{note}</li>)}</ul>}{(record.proposedColor || record.proposedPositionInTube != null) && <p>Proposed group data: {colorLabel(record.proposedColor)} · position {record.proposedPositionInTube ?? 'unknown'}</p>}</details>
    <details className="evidence"><summary>Evidence / წყარო</summary>{model.evidenceSources.map((source, index) => <Evidence source={source} key={`${index}-${source.shapeIds.join('-')}`} />)}</details>
  </div>;
}

export function TraceView({ data, navigate, cableId, fiber }: ViewProps & { cableId: string; fiber: number }) {
  const [includeCandidates, setIncludeCandidates] = useState(false);
  const result = traceFiber(data, findCable(data, cableId)?.id ?? cableId, fiber, includeCandidates);
  const startCable = findCable(data, cableId);
  const startFiber = findFiber(data, cableId, fiber);
  const physicalRoutes = startCable ? cableRoutesForSegment(data, startCable.id) : [];
  const onReviewedPath = (startCable?.legacyCableId === '171' && fiber === 29) || (startCable?.legacyCableId === '172' && fiber === 29) || (startCable?.legacyCableId === '173' && fiber === 1);
  const pathSummary = targetPathSummary(data);
  if (data.fiberPathProjection && startCable && startFiber) return <div className="view-content"><CurrentFiberJourney data={data} cableId={startCable.id} fiberNumber={fiber} navigate={navigate} onSelect={selection=>navigate(routeWithSelection(data.cableRoutes![0].id,selection))} /></div>;
  return <div className="view-content">
    <PageHeader eyebrow="ჟილის ოპტიკური კვალი" title={`${startCable ? cableDisplayName(startCable, data) : cableId} / ${fiberLabel(fiber)}`} description={startCable ? cableLegacyLabel(startCable) : 'ნაბიჯები და გაჩერებები ითვლება კავშირის ჩანაწერებიდან.'} />
    {!!physicalRoutes.length && <p className="trace-route-link"><button className="context-link" type="button" onClick={() => navigate({ view: 'route', id: physicalRoutes[0].id })}>ფიზიკური კაბელის მარშრუტის ნახვა → {physicalRoutes[0].displayName}</button></p>}
    {startFiber && <div className="pill-row"><TubeFiberContext data={data} navigate={navigate} cableId={startFiber.cableId} fiberNumber={startFiber.number} showCable={false} /><details className="evidence"><summary>ჟილის კომერციული როლები</summary><CommercialRoles data={data} cableId={startFiber.cableId} fiberNumber={startFiber.number} /></details></div>}
    <div className="filter-bar"><label className="field"><span className="field-label">კავშირის რეჟიმი</span><span><input type="checkbox" checked={includeCandidates} onChange={e => setIncludeCandidates(e.target.checked)} /> სავარაუდო კავშირების ჩათვლით</span></label><Badge tone="warning">{includeCandidates ? 'კვლევითი რეჟიმი · სავარაუდო კავშირებით' : 'მკაცრი რეჟიმი · მხოლოდ დამტკიცებული'}</Badge><Badge tone="neutral">{result.complete ? 'გზის ორივე ბოლო პორტთან აღწევს' : 'გზის სრული აღწერა ჯერ არ გვაქვს'}</Badge></div>
    {onReviewedPath && <details className="evidence trace-review-summary"><summary>Iteration 07-ის განხილვის შეჯამება</summary><p><strong>{pathSummary.target}</strong></p><div className="facts-grid"><Fact label="მიღებული ოპტიკური გადასვლები" value={String(pathSummary.acceptedOpticalHops)} /><Fact label="სავარაუდო ნაბიჯები" value={String(pathSummary.candidateHops)} /><Fact label="უცნობი ოპერაციები" value={String(pathSummary.unresolvedOperations)} /><Fact label="კონფლიქტები" value={String(pathSummary.conflicts)} /><Fact label="მკაცრი კვალის ბოლო" value={pathSummary.strictEndpoint} /><Fact label="კანდიდატური კვალის ბოლო" value={pathSummary.candidateEndpoint} /><Fact label="ფიზიკური აგებულების დაფარვა" value={pathSummary.physicalCoverage} /></div></details>}
    {includeCandidates ? <p className="notice notice-warning">კვლევით რეჟიმში სავარაუდო კავშირებიც ჩნდება. ისინი წყაროთი დამტკიცებულ მარშრუტად არ ითვლება.</p> : <p className="notice notice-warning">მკაცრი რეჟიმი მხოლოდ დამტკიცებულ კავშირებს აჩვენებს; დაუმტკიცებელი კავშირის საზღვარზე კვალი ჩერდება.</p>}
    {result.steps.length === 0 ? <EmptyState title="დადასტურებული ნაბიჯები არ მოიძებნა" description="ეს არ ნიშნავს, რომ ჟილა ფიზიკურად გათიშულია; წყაროში დამტკიცებული მარშრუტი არ არის." /> : <div className="trace-list">{result.steps.filter(step => !(step.kind === 'connection' && step.route?.view === 'ap')).map((step, i) => {
      const stepCable = step.cableId ? findCable(data, step.cableId) : undefined;
      const stepFiber = step.cableId && step.fiber ? findFiber(data, step.cableId, step.fiber) : undefined;
      const stepConnection = step.kind === 'connection' ? data.connections.find(connection => connection.id === step.id) : undefined;
      return <article className="trace-step" key={step.id}>
      <div className="trace-marker" aria-hidden="true">{i + 1}</div><div className={`trace-card${step.kind === 'cable' ? ' trace-cable-card' : ''}${step.candidate ? ' is-candidate' : step.kind === 'cable' ? '' : ' is-accepted'}`}><div className="pill-row">{stepFiber && <FiberIdentity fiber={stepFiber} compact />}<strong>{step.kind === 'cable' && stepCable ? `${cableDisplayName(stepCable, data)} / ${fiberLabel(step.fiber!)}` : step.title}</strong>{stepCable && <small className="muted">{cableLegacyLabel(stepCable)}</small>}<Badge tone={step.candidate ? 'warning' : step.relationshipState === 'accepted' ? 'success' : 'neutral'}>{step.candidate ? 'სავარაუდო' : step.relationshipState === 'accepted' ? 'მიღებული' : 'მონაკვეთი'}</Badge><VerificationBadge value={step.verification} /></div><p>{step.detail}</p>{step.operation && <Badge>{connectivityLabels[step.operation]}</Badge>}
        {stepCable && stepFiber && <><TubeFiberContext data={data} navigate={navigate} cableId={stepCable.id} fiberNumber={stepFiber.number} showCable={false} /><details className="evidence"><summary>კომერციული როლები</summary><CommercialRoles data={data} cableId={stepCable.id} fiberNumber={stepFiber.number} /></details></>}
        {step.route && <button className="context-link" type="button" onClick={() => navigate(step.route!)}>ჩანაწერის გახსნა</button>}{stepConnection ? <ConnectionReviewEvidence connection={stepConnection} /> : step.source && <Evidence source={step.source} />}
      </div>
    </article>})}</div>}
    {result.stops.length > 0 && <Panel title="სად ჩერდება კვალი"><div className="trace-list">{result.stops.map((stop, i) => <article className={`trace-stop${stop.code === 'conflicting' ? ' is-conflicting' : ''}`} key={`${stop.side}-${stop.code}-${i}`}><Badge tone={stop.code === 'conflicting' ? 'danger' : 'warning'}>{stop.side === 'a' ? 'A წერტილი' : 'B წერტილი'}</Badge><strong>{stop.message}</strong><p className="muted">{stop.at}</p></article>)}</div></Panel>}
  </div>;
}

export function AccessPointView({ data, navigate, id }: ViewProps & { id: string }) {
  const ap = data.accessPoints.find(item => item.id === id);
  if (!ap) return <div className="view-content"><EmptyState title="დაშვების წერტილი ვერ მოიძებნა" description={`${id} ჩანაწერი პილოტში არ არის.`} /></div>;
  const odfRecords = uiRecords(data, 'odfs');
  const relatedOdfs = odfRecords.filter(odf => {
    const containedBy = odf.containedBy && typeof odf.containedBy === 'object' ? odf.containedBy as UiRecord : {};
    return uiText(odf, 'accessPointId', 'legacyAccessPointId', 'apId', 'assetId') === id || (uiText(containedBy, 'kind') === 'ap' && uiText(containedBy, 'id') === id);
  });
  const cables = attachedCables(data, { kind: 'ap', id });
  const endpointConnections = data.connections.filter(c => [c.a, c.z].some(e => (e.kind === 'port' && e.assetId === id) || (e.kind === 'asset' && e.asset.kind === 'ap' && e.asset.id === id)));
  const operator = accessPointOperatorSummary(data, id);
  const apSourcePorts=(data.apPorts??[]).filter(p=>p.canonicalNode?p.canonicalNode.id===id:String(p.apNumber)===id).sort((a,b)=>a.number-b.number);
  const extra = <Panel title="პორტების ჩანაწერები">
    {apSourcePorts.length>0&&<div className="operational-port-cards ap-operational-port-cards">{apSourcePorts.map(port=>{const view=portOperationalView(data,'ap',id,port.number,false);return <article className={`operational-port-card use-${view.usageState??'unknown'}`} key={view.portId}><button type="button" onClick={()=>view.bindingId&&navigate(portOperationalRoute(view))}><strong>Port {view.portNumber}</strong><span>{view.bindingId?portOperationalLabel(view):'Fiber მიბმა დაუდგენელია'}</span>{view.bindingId&&<small>Tube {view.tubeNumber??'?'} · {view.tubeColor??'?'} · F{view.fiberNumber} · {view.fiberColor??'?'}</small>}<em>{view.bindingId?'Route-ზე ნახვა':view.occupancy}</em></button>{view.bindingId&&<details><summary>ტექნიკური დეტალები</summary><span>{view.occupancy}</span></details>}</article>;})}</div>}
    {endpointConnections.map(connection => {
      const destination = [connection.a, connection.z].find(end => (end.kind === 'port' && end.assetId === id) || (end.kind === 'asset' && end.asset.kind === 'ap' && end.asset.id === id))!;
      const remote = connection.a === destination ? connection.z : connection.a;
      return <div key={connection.id} className="connection-focus"><div className="connection-node">{endLabel(destination, data)}{connection.review?.candidatePort && <small className="muted">წყაროს პორტის კანდიდატი: {connection.review.candidatePort}</small>}</div><div className="connection-middle"><RelationshipBadge connection={connection} /><Badge>{connectivityLabels[connection.operation]}</Badge><VerificationBadge value={connection.verification} /></div><div className="connection-node">{endLabel(remote, data)}</div>
        {remote.kind === 'fiber' && <button className="context-link" type="button" onClick={() => navigate({ view: 'fiber', cableId: remote.cableId, fiber: remote.fiber })}>ჟილის ჩანაწერის გახსნა</button>}<ConnectionReviewEvidence connection={connection} />
      </div>;
    })}
    {!endpointConnections.length && !apSourcePorts.length && <EmptyState title="პორტების კავშირები არ არის შემოტანილი" description="პორტების ფიზიკური მდგომარეობა უცნობია." />}
    <p className="muted">დანარჩენი პორტების კავშირები და ყველა პორტის დაკავება უცნობია. ეს გვერდი თავისუფალ პორტებს არ განსაზღვრავს.</p>
  </Panel>;
  const identity = <div className="notice notice-warning"><strong>იდენტობის შენიშვნა:</strong> {ap.identityNote}{ap.legacySymbol === 'ODF' && <p>ODF{id} ამავე ჩანაწერის ძველი სიმბოლოა და ცალკე ქუროს არ ნიშნავს.</p>}<p>ძებნის სახელები: {ap.aliases.join(' · ')}</p><p className="odf-structure-status">ODF / პანელის / პორტების სტრუქტურა: {relatedOdfs.length ? `${relatedOdfs.length} დაკავშირებული ODF ჩანაწერი; პორტების ბადე ამ წყაროში სრულად არ არის აღწერილი.` : 'გადაუჭრელია ან ამ AP-სთან დაკავშირებული ODF ჩანაწერი არ არის; პორტების ბადე არ არის ნაჩვენები.'}</p></div>;
  return <div className="view-content">
    <PageHeader eyebrow="Access Point" title={`AP${id} · ${ap.name}`} description={operator.role === 'interconnect_backfeed' ? 'Interconnect / backfeed point' : 'Route endpoint'} />
    <section className="operator-summary operator-ap-summary">
      <div className="operator-facts">
        <article><span>Fed from</span><strong>{operator.source}</strong></article>
        <article><span>Incoming Cable Segment</span><strong>{operator.incomingSegment}</strong></article>
        <article><span>Upstream closure</span><strong>{operator.upstreamClosure}</strong></article>
        <article><span>Current role</span><strong>{operator.role === 'interconnect_backfeed' ? 'Transit / interconnect with Ambrolauri backfeed' : operator.role === 'terminal' ? 'Documented AP endpoint' : 'Role unresolved'}</strong></article>
        <article><span>Port capacity</span><strong>{operator.portSummary}</strong></article>
      </div>
      <div className="operator-section"><span className="operator-label">Upstream path</span><OperationalPathStrip path={operator.path} /></div>
      {id === '41' && <div className="operator-split"><article><span>Incoming side</span><strong>Ports 1–16 · Tsageri → SC205 → C149 → AP41</strong></article><article><span>Return / local side</span><strong>Ports 16–22 return · Ports 23–24 end locally</strong><small>Port16 overlap is preserved. Internal operation remains unresolved.</small></article></div>}
      <ClarificationSummary items={operator.unresolved} />
      <div className="pill-row">{operator.routeId && <LinkButton onClick={() => navigate({ view: 'route', id: operator.routeId! })}>Open route</LinkButton>}{cables.map(cable => <LinkButton key={cable.id} onClick={() => navigate({ view: 'cable', id: cable.id })}>{cableDisplayName(cable, data)}</LinkButton>)}</div>
    </section>
    {extra}
    <details className="evidence"><summary>Technical details and evidence</summary>{identity}<div className="facts-grid"><Fact label="Owner" value={knownValue(ap.owner)} /><Fact label="Legacy symbol" value={ap.legacySymbol ?? 'None'} /><Fact label="Aliases" value={ap.aliases.join(' · ')} /></div>{ap.notes.length > 0 && <ul>{ap.notes.map(note => <li key={note}>{note}</li>)}</ul>}<SourceNote source={ap.source} /></details>
  </div>;
}

export function AggregationView({ data, navigate, id }: ViewProps & { id: string }) {
  const aggregation = data.aggregations.find(item => item.id === id);
  if (!aggregation) return <div className="view-content"><EmptyState title="აგრეგაციის წერტილი ვერ მოიძებნა" description={`${id} ჩანაწერი საცავში არ არის.`} /></div>;
  const conflictCable = id === 'AGG-LENTEKHI' ? findCable(data, '184') : undefined;
  const odf = (data.odfs ?? []).find(item => item.containedBy.kind === 'aggregation' && item.containedBy.id === id);
  if (id !== '5' || !odf) return <div className="view-content">
    <PageHeader eyebrow="Aggregation" title="ლენტეხის აგრეგაცია" description="Known endpoint · numeric legacy identifier conflict" />
    <section className="operator-summary">
      <div className="operator-facts"><article><span>Source identity claims</span><strong>AGG6 heading · property ID5</strong></article><article><span>Incoming route segment</span><strong>C184 · SC224 ↔ ლენტეხის აგრეგაცია · 48F</strong></article><article><span>Current operational state</span><strong>Known endpoint · numeric ID conflict</strong></article><article><span>Route context</span><strong>Final aggregation of the Tsageri → Lentekhi route</strong></article></div>
      <p className="operator-conflict">Destination is known; numeric legacy identifier is conflicting. Both claims remain preserved and neither is selected as the winner.</p>
      <div className="pill-row">{conflictCable && <LinkButton onClick={() => navigate({ view: 'cable', id: conflictCable.id })}>Open C184</LinkButton>}<LinkButton onClick={() => navigate({ view: 'route', id: 'ROUTE-TSAGERI-LENTEKHI-CORE' })}>Open route</LinkButton></div>
      <AggregationFiberUsagePanel data={data} navigate={navigate} aggregationId={id} />
      <LentekhiPortGrid data={data} navigate={navigate} aggregationId={id} />
      <ClarificationSummary items={['ODF panel structure', 'Exact port terminations']} />
    </section>
    <details className="evidence"><summary>Technical details and evidence</summary><SourceNote source={aggregation.source} /></details>
  </div>;
  const ports = (data.odfPorts ?? []).filter(item => item.odfId === odf.id).sort((a, b) => a.number - b.number);
  const ranges = (data.portRangeAssignments ?? []).filter(item => item.odfId === odf.id).sort((a, b) => a.startPort - b.startPort);
  const destination = (range: typeof ranges[number]) => range.destination.type === 'named_direction' ? range.destination.name : range.destination.label;
  return <div className="view-content aggregation-screen">
    <PageHeader eyebrow="Aggregation" title="AGG5 · Tsageri" description="Operational route and ODF entry point" />
    <section className="operator-summary aggregation-operator-summary">
      <div className="operator-facts"><article><span>ODF</span><strong>{odf.displayLabel}</strong></article><article><span>Reviewed logical capacity</span><strong>{ports.length} ports</strong></article><article><span>Main route</span><strong>Tsageri → Lentekhi boundary</strong></article><article><span>Outgoing destination groups</span><strong>{ranges.length} reviewed ranges</strong></article></div>
      <div className="operator-section"><span className="operator-label">Port destination ranges</span><div className="range-cards">{ranges.map((range, index) => <article className={`range-card range-${index + 1}`} key={range.id}><strong>Ports {range.startPort}–{range.endPort}</strong><span>→ {destination(range)}</span><small>{range.continuity === 'stops_at_destination' ? 'Ends at SC205' : range.destination.type === 'asset' ? 'Asset destination · internal mapping unresolved' : 'Direction-level assignment'}</small></article>)}</div></div>
      <AggregationFiberUsagePanel data={data} navigate={navigate} aggregationId={id} />
      <div className="operator-split"><article><span>Route continuation</span><strong>Ports 145–192 → Lentekhi direction</strong></article><article><span>Interconnect branch</span><strong>Ports 131–144 → AP41 / Chkhuteli</strong><small>AP41 ports 3–22 backfeed toward Ambrolauri.</small></article></div>
      <div className="pill-row"><LinkButton onClick={() => navigate({ view: 'route', id: 'ROUTE-TSAGERI-LENTEKHI-CORE' })}>Open main route</LinkButton><LinkButton onClick={() => navigate({ view: 'ap', id: '41' })}>Open AP41</LinkButton></div>
      <ClarificationSummary items={['Exact individual fiber terminations', 'AP41 internal ingress-to-egress mapping', 'Panel hierarchy']} />
    </section>
    <details className="panel operator-secondary"><summary>{odf.displayLabel} · full 192-port grid</summary><p className="muted">Choose a port. The four reviewed ranges above remain the primary operational summary.</p><div className="odf-port-grid" aria-label="Tsageri ODF logical ports">{ports.map(port => { const range = portRangeFor(data, odf.id, port.number); const group = range ? ranges.findIndex(item => item.id === range.id) + 1 : 0; return <button className={`odf-port range-${group}`} type="button" key={port.id} onClick={() => navigate({ view: 'odf_port', odfId: odf.id, port: port.number })} aria-label={`Port ${port.number} · ${range ? destination(range) : 'unassigned'}`}><span>{port.number}</span></button>; })}</div></details>
    <details className="evidence"><summary>Technical details and source representations</summary><p>Each logical port is shown once. Mirrored internal ODF and aggregation-boundary source markers remain attached as provenance.</p><p>Individual marker-to-number indexing remains unresolved; logical numbering 1–192 and the four ranges are owner-confirmed.</p><Evidence source={odf.source} /></details>
  </div>;
}

function LentekhiPortGrid({data,navigate,aggregationId}:{data:Inventory;navigate:(route:Route)=>void;aggregationId:string}) {
  if(aggregationId!=='AGG-LENTEKHI')return null;
  const cable=findCable(data,'184'),bindings=(data.portTopologyBindings??[]).filter(b=>b.ownerType==='odf'&&b.segmentId===cable?.id).sort((a,b)=>a.portNumber-b.portNumber);
  return <section className="operator-section operational-port-grid" aria-label="Lentekhi operational Port view">
    <span className="operator-label">48 პორტი · ზუსტი Fiber მიბმა</span>
    <p className="muted">მდგომარეობა აჩვენებს მიბმული Fiber-ის გამოყენებას. პორტის ფიზიკური სტატუსი წყაროდან დამოუკიდებლად დაუდგენელია.</p>
    <div className="operational-port-cards">{bindings.map(binding=>{const view=portOperationalView(data,'odf',binding.ownerId,binding.portNumber,false);return <article className={`operational-port-card use-${view.usageState??'unknown'}`} key={view.portId}>
      <button type="button" onClick={()=>navigate(portOperationalRoute(view))} aria-label={`Port ${view.portNumber}, ${portOperationalLabel(view)}, Route-ზე ნახვა`}><strong>Port {view.portNumber}</strong><span>{portOperationalLabel(view)}</span><small><i className="fiber-swatch" style={{backgroundColor:data.tubes.find(t=>t.cableId===view.segmentId&&t.number===view.tubeNumber)?.physicalColor.hex??'#ddd'}}/>Tube {view.tubeNumber===null?'?':view.tubeNumber} · {view.tubeColor??'ფერი დაუდგენელია'} <i className="fiber-swatch" style={{backgroundColor:data.fibers.find(f=>f.cableId===view.segmentId&&f.number===view.fiberNumber)?.physicalColor.hex??'#ddd'}}/>F{view.fiberNumber} · {view.fiberColor??'ფერი დაუდგენელია'}</small><em>Route-ზე ნახვა</em></button>
      <details><summary>ტექნიკური დეტალები</summary><span>{view.occupancy}</span></details>
    </article>;})}</div>
  </section>;
}

function AggregationFiberUsagePanel({data,navigate,aggregationId}:{data:Inventory;navigate:(route:Route)=>void;aggregationId:string}) {
  const projection=data.aggregationOperationalProjection?.aggregations.find(item=>item.aggregationId===aggregationId);
  if(!projection)return <section className="operator-section"><span className="operator-label">Fiber usage</span><p className="muted">ოპერაციული Fiber projection ვერ მოიძებნა.</p></section>;
  const cables=projection.cableIds.map(id=>({id,cable:data.cables.find(c=>c.id===id),fibers:projection.fibers.filter(f=>f.segmentId===id)})).filter(x=>x.cable);
  const status=(s:string)=>s==='in_use'?'გამოიყენება':s==='unused'?'არ გამოიყენება':s==='review_required'?'გადასამოწმებელია':'უცნობია';
  return <section className="operator-section aggregation-fiber-usage" data-aggregation-usage={aggregationId}>
    <span className="operator-label">Fiber usage · ცალკე Port occupancy-სგან</span>
    <div className="aggregation-usage-summary"><strong>{projection.fibers.length} local Fibers</strong><span>{projection.usageCounts.in_use??0} გამოიყენება · {projection.usageCounts.unused??0} არ გამოიყენება · {projection.usageCounts.review_required??0} გადასამოწმებელია · {projection.usageCounts.unknown??0} უცნობია</span></div>
    {aggregationId==='5'&&<p className="notice notice-warning">192 logical Ports. C148-ის Fiber↔Port ზუსტი მიბმა და Port occupancy წყაროდან დადგენილი არ არის. Fiber use ამ გაურკვევლობისგან დამოუკიდებელია.</p>}
    {cables.map(({id,cable,fibers})=><details className="aggregation-cable-fibers" key={id} open={aggregationId==='AGG-LENTEKHI'}><summary>C{cable!.legacyCableId} · {cableDisplayName(cable!,data)} · {fibers.length} Fibers</summary><div className="aggregation-fiber-grid">{fibers.map(f=><article key={`${f.segmentId}/${f.fiberNumber}`} className="aggregation-fiber-row" data-fiber-usage={f.usageState}>
      <button type="button" className="aggregation-fiber-link" onClick={()=>navigate({view:'fiber',cableId:f.segmentId,fiber:f.fiberNumber})}><strong>C{f.legacyCableId}/F{String(f.fiberNumber).padStart(2,'0')}</strong><span>{status(f.usageState)}</span></button>
      <small>{f.tubeNumber===null?'Tube ?':`Tube ${f.tubeNumber}`} · {f.fiberColor??'ფერი უცნობია'}</small>
      {f.organization&&<small>Organization: {f.organization}</small>}{f.purpose&&<small>Purpose: {f.purpose}</small>}
      {f.portBindingId&&f.portNumber!==null?<button type="button" className="aggregation-port-link" onClick={()=>f.portOwnerType==='odf'?navigate({view:'odf_port',odfId:data.portTopologyBindings?.find(b=>b.id===f.portBindingId)?.ownerId??'',port:f.portNumber!}):f.portOwnerType==='ap'?navigate({view:'ap',id:data.portTopologyBindings?.find(b=>b.id===f.portBindingId)?.ownerId??''}):undefined}>{f.portOwnerType==='ap'?'AP ':f.portOwnerType==='odf'?'ODF ':''}Port {f.portNumber} · Port occupancy {status(f.portOccupancy)}</button>:<small>პორტის ზუსტი მიბმა წყაროდან არ არის დადგენილი</small>}
      {f.pathEndpoints.length>0&&<small>Known path: {f.pathEndpoints.join(' ↔ ')}</small>}
    </article>)}</div></details>)}
    <details className="evidence aggregation-port-status"><summary>ODF / Port information · დამოუკიდებელი მდგომარეობა</summary><p>Logical Ports: {projection.portCount??'უცნობია'}</p><p>Exact Port↔Fiber bindings: {projection.exactPortBindings} · exact binding unknown: {projection.unknownPortFibers}</p><p>Port occupancy follows its own source status. Fiber usage never sets Port occupancy.</p></details>
  </section>;
}

export function OdfPortView({ data, navigate, odfId, port: portNumber }: ViewProps & { odfId: string; port: number }) {
  const odf = (data.odfs ?? []).find(item => item.id === odfId);
  const port = (data.odfPorts ?? []).find(item => item.odfId === odfId && item.number === portNumber);
  if (!odf || !port) return <div className="view-content"><EmptyState title="ODF პორტი ვერ მოიძებნა" description={`${odfId} / Port ${portNumber}`} /></div>;
  const range = portRangeFor(data, odfId, portNumber);
  const trace = traceFromOdfPort(data, odfId, portNumber);
  const operational = portOperationalView(data, 'odf', odfId, portNumber);
  const destination = range?.destination.type === 'named_direction' ? range.destination.name : range?.destination.label;
  const destinationAsset = range?.destination.type === 'asset' ? range.destination : null;
  const destinationRoute = destinationAsset ? assetRoute(destinationAsset.asset) : null;
  return <div className="view-content port-detail-screen">
    <PageHeader eyebrow="ODF logical port" title={`${odf.displayLabel} · Port ${portNumber}`} description={destination ?? 'დანიშნულება უცნობია'} action={<VerificationBadge value={port.verification} />} />
    <div className="pill-row"><LinkButton onClick={() => navigate({ view: 'aggregation', id: '5' })}>← Tsageri aggregation</LinkButton>{range?.routeId && <LinkButton onClick={() => navigate({ view: 'route', id: range.routeId! })}>Cable Route-ის გახსნა</LinkButton>}{destinationAsset && destinationRoute && <LinkButton onClick={() => navigate(destinationRoute)}>{destinationAsset.label}</LinkButton>}</div>
    <Panel title="ოპერაციული პასუხი"><div className="facts-grid"><Fact label="ODF" value={odf.displayLabel} /><Fact label="პორტი" value={String(port.number)} />{operational.bindingId&&<><Fact label="ზუსტი Fiber მიბმა" value={`C${operational.legacyCableId}/F${operational.fiberNumber}`} /><Fact label="Fiber გამოყენება" value={portOperationalLabel(operational)} /><Fact label="ფიზიკური იდენტობა" value={`Tube ${operational.tubeNumber??'?'} · ${operational.tubeColor??'?'} · F${operational.fiberNumber} · ${operational.fiberColor??'?'}`} /></>}<Fact label="მიმართულება / დანიშნულება" value={destination ?? 'უცნობია'} /><Fact label="ფიზიკური კავშირის დონე" value={range?.physicalConnection === 'known_range' ? 'ცნობილია დიაპაზონის დონეზე' : 'უცნობია'} /><Fact label="გაგრძელება" value={range?.continuity === 'stops_at_destination' ? 'SC205-ის შემდეგ არ გრძელდება' : range?.continuity === 'continues_on_route' ? 'Cable Route-ზე გრძელდება' : 'ზუსტი გაგრძელება უცნობია'} /><Fact label="პორტის ფიზიკური სტატუსი" value={operational.occupancy} /><Fact label="სერვისი / მომხმარებელი / უფლებები" value="უცნობია · არ გამომდინარეობს მიმართულებიდან" /></div>{operational.bindingId&&<LinkButton onClick={()=>navigate(portOperationalRoute(operational))}>Route-ზე ნახვა</LinkButton>}{range?.continuity === 'stops_at_destination' && <p className="notice notice-success">პორტი SC205-ზე განზრახ მთავრდება. დაზიანებულად მონიშნული არ არის.</p>}</Panel>
    <Panel title="Direction / infrastructure path"><ol className="simple-path">{trace.infrastructurePath.map(step => <li key={step}>{step}</li>)}</ol></Panel>
    <Panel title="Exact optical trace"><p className="notice notice-warning">კვალი შეჩერდა: {trace.reason}</p><p>არ შექმნილა fake per-fiber edge, splice, patch ან AP internal mapping.</p></Panel>
    <details className="evidence"><summary>Source representations: {port.sourceRepresentations.length}</summary>{port.sourceRepresentations.map(item => <div key={item.id}><strong>{item.role}</strong><Evidence source={item.source} /></div>)}</details>
  </div>;
}

export function ReviewView({ data, navigate, query = '' }: ViewProps & { query?: string }) {
  const [state, setState] = useState(ALL);
  const normalized = query.trim().toLocaleLowerCase();
  const issues = data.issues.filter(issue => (state === ALL || issue.state === state) && (!normalized || [issue.title, issue.description, issue.action, issue.id, issue.source.file, issue.source.page, ...issue.assetIds].some(part => part.toLocaleLowerCase().includes(normalized))));
  return <div className="view-content">
    <PageHeader eyebrow="წყაროს გადახედვა" title="შესამოწმებელი საკითხები" description={query ? `ძიება: ${query}` : 'დოკუმენტაციის წინააღმდეგობები და ღია გადამოწმების საკითხები.'} />
    <div className="filter-bar"><FilterSelect label="მდგომარეობა" value={state} options={[{ value: 'open', label: 'ღია' }, { value: 'resolved', label: 'მოგვარებული' }, { value: 'legacy', label: 'ძველი ჩანაწერი' }]} onChange={setState} />{query && <button type="button" className="button button-quiet" onClick={() => navigate({ view: 'review' })}>ძიების გასუფთავება</button>}</div>
    {!issues.length ? <EmptyState title="საკითხი ვერ მოიძებნა" description="ამ ფილტრებით შესაბამისი ჩანაწერი არ არის." /> : <div className="asset-list">{issues.map(issue => <article className="issue" key={issue.id}>
      <div className="panel-header"><h2 className="section-title">{issue.title}</h2><Badge tone={issue.state === 'open' ? 'warning' : issue.state === 'resolved' ? 'success' : 'neutral'}>{issue.state === 'open' ? 'ღია' : issue.state === 'resolved' ? 'მოგვარებული' : 'ძველი ჩანაწერი'}</Badge></div>
      <p>{issue.description}</p><p><strong>შემდეგი ნაბიჯი:</strong> {issue.action}</p>
      {issue.assetIds.length > 0 && <div className="pill-row">{issue.assetIds.map(assetId => <button className="context-link" key={assetId} type="button" onClick={() => openAsset(navigate, data, assetId)}>{assetId}</button>)}</div>}
      <Evidence source={issue.source} />
    </article>)}</div>}
  </div>;
}

function openAsset(navigate: (route: Route) => void, data: Inventory, id: string) {
  if (data.cables.some(c => c.id === id)) navigate({ view: 'cable', id });
  else if (data.closures.some(c => c.id === id)) navigate({ view: 'closure', id });
  else if (data.accessPoints.some(a => a.id === id)) navigate({ view: 'ap', id });
  else if (data.aggregations.some(a => a.id === id)) navigate({ view: 'aggregation', id });
}
