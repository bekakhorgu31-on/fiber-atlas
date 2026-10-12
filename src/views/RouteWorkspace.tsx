import { CurrentFiberJourney } from './CurrentFiberJourney';
import { APWorkspace } from './APWorkspace';
import { apWorkspaceTarget, type WorkspaceRoute } from '../domain/iteration28j';
import { SourceBAPInspector } from './SourceBAP';
import { currentAssetLabel, resolveCurrentFiberPath } from '../domain/currentFiberPath';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Cable, ChevronDown, ExternalLink, FileText, Focus, MapPin, Network, Presentation, Search, Split, X } from 'lucide-react';
import type { AssetRef, CableRoute, FiberLineageEndpoint, Inventory, PortRangeAssignment, Route, ViewProps } from '../domain/types';
import { findCableRoute, orderedCableRouteLegs, orderedCableRouteNodes } from '../domain/cableRoutes';
import { accessPointOperatorSummary, closureOperatorSummary, routeNodeOperatorBranches, segmentOperatorSummary } from '../domain/operatorTopology';
import {
  parentWorkspaceRoute, parseWorkspaceSelection, relatedWorkspaceRoutes, routeInventoryCounts, routeScopedSearch,
  workspaceSelectionKey, type WorkspaceSelection,
} from '../domain/routeWorkspace';
import {
  attachedCables, cableDisplayName, cableFibers, colorLabel, fiberLabel, fiberTube, findCable, findFiber, getSegmentDisplayName,
  rowsForClosure, typedAssetLabel,
} from '../domain/network';
import { buildFiberDetailModel } from '../domain/fiberDetail';
import { portRangeFor, traceFromOdfPort } from '../domain/aggregationTopology';
import { relationshipState } from '../domain/pathReview';
import { segmentConstructionAssessment } from '../domain/showcase';
import {
  cableContinuityPath, closureContinuationForks, constructionTubeViews, exactFiberContinuations, historicalSegmentContinuationGroups,
  segmentContinuationGroups, segmentOrientation, tubeContinuationSummary,
} from '../domain/cableContinuity';
import {
  ap51PortMapping, compactLineageJourney, labelAsset, lineageForFiber,
  lineagesForTube, useAssignmentsForLineage,
} from '../domain/fiberLineage';
import { apFlowProfile, apPortFlow, LENTEKHI_AGGREGATION_ID } from '../domain/iteration19';
import { fiberJourneySummary, portBindingsForFiber, portTopologyBinding } from '../domain/iteration20';
import { connectionSheetForFiberAtNode, connectionSheetForPort, connectionSheetForTransition, portOperationalStatus } from '../domain/iteration22';
import { NetworkTopologyCanvas } from './NetworkTopologyCanvas';
import { buildNetworkTopologyProjection } from '../domain/networkTopology';

const destinationLabel = (range: PortRangeAssignment) => range.destination.type === 'named_direction' ? range.destination.name : range.destination.label;
const rangeLabel = (start: number, end: number) => start === end ? `F${String(start).padStart(2, '0')}` : `F${String(start).padStart(2, '0')}–F${String(end).padStart(2, '0')}`;
const assetKey = (asset: AssetRef) => `${asset.kind}:${asset.id}`;
const sameAsset = (a: AssetRef | null | undefined, b: AssetRef | null | undefined) => !!a && !!b && a.kind === b.kind && a.id === b.id;
const colorKa = (color: { nameKa: string | null; nameEn: string | null } | null | undefined) => color?.nameKa ?? color?.nameEn ?? 'დაუდგენელია';
const continuationStateKa = (state: string) => state === 'authoritative' ? 'დადასტურებული გაგრძელება' : state === 'candidate' ? 'სავარაუდო გაგრძელება' : state === 'conflicting' ? 'მონაცემები წინააღმდეგობრივია' : 'გაგრძელება დაუდგენელია';
const apRoleKa = (role: string) => role === 'ingress' ? 'შემოდის' : role === 'return' ? 'ბრუნდება' : role === 'transit' ? 'ტრანზიტი' : role === 'egress' ? 'გრძელდება' : role === 'local_termination' ? 'აქ მთავრდება' : role === 'unused' ? 'გამოუყენებელია' : 'მიმართულება უცნობია';
const humanizeSegmentTokens = (data: Inventory, value: string) => value.replace(/\bC(\d+)\b/g, (token, legacyId) => {
  const segment = findCable(data, legacyId);
  return segment ? getSegmentDisplayName(segment, data) : token;
});

function InspectorDisclosure({ title = 'დამატებითი ინფორმაცია', children, technical = false }: { title?: string; children: ReactNode; technical?: boolean }) {
  return <details className={`inspector-disclosure${technical ? ' is-technical' : ''}`}><summary>{title}<ChevronDown size={14} /></summary><div>{children}</div></details>;
}

function WorkspaceFact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="workspace-fact"><span>{label}</span><strong>{children}</strong></div>;
}

function InspectorSection({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="inspector-section"><div className="inspector-section-header"><h3>{title}</h3>{action}</div>{children}</section>;
}

function Clarification({ items }: { items: string[] }) {
  const unique = [...new Set(items)].filter(Boolean);
  if (!unique.length) return null;
  return <details className="workspace-clarification"><summary>Needs clarification · {unique.length}</summary><ul>{unique.map(item => <li key={item}>{item}</li>)}</ul></details>;
}

function FullDetailButton({ navigate, route, children = 'Open full detail' }: { navigate: (route: Route) => void; route: Route; children?: ReactNode }) {
  return <button className="workspace-text-action workspace-engineering-action" type="button" onClick={() => navigate(route)}>{children}<ExternalLink size={14} /></button>;
}

function TubeSwatch({ name, hex, context }: { name: string; hex: string | null; context: string }) {
  return <span className="physical-chip"><i style={hex ? { backgroundColor: hex } : undefined} className={hex ? '' : 'is-unknown'} aria-hidden="true" /><span>{name}</span><small>{context}</small></span>;
}

function selectionForAsset(asset: AssetRef): WorkspaceSelection {
  if (asset.kind === 'aggregation') return { type: 'aggregation', id: asset.id };
  if (asset.kind === 'closure') return { type: 'closure', id: asset.id };
  if (asset.kind === 'ap') return { type: 'ap', id: asset.id };
  if (asset.kind === 'odf') return { type: 'odf', id: asset.id };
  if (asset.kind === 'network_node') return { type: 'network_node', id: asset.id };
  return { type: 'boundary', id: asset.id };
}

function RouteAssetButton({ data, asset, label, selected, onSelect, subtitle }: { data: Inventory; asset: AssetRef | null; label: string; selected: boolean; onSelect: (selection: WorkspaceSelection) => void; subtitle?: string }) {
  if (!asset) return <button className={`workspace-node is-boundary${selected ? ' is-selected' : ''}`} type="button" data-workspace-key="boundary:route-destination" onClick={() => onSelect({ type: 'boundary', id: 'route-destination' })}><span>{label}</span><small>{subtitle ?? 'Unresolved boundary'}</small></button>;
  const selection = selectionForAsset(asset);
  const aggregation = asset.kind === 'aggregation' ? data.aggregations.find(item => item.id === asset.id) : undefined;
  const odf = asset.kind === 'aggregation' ? (data.odfs ?? []).find(item => sameAsset(item.containedBy, asset)) : undefined;
  return <button className={`workspace-node is-${asset.kind}${selected ? ' is-selected' : ''}`} type="button" data-workspace-key={workspaceSelectionKey(selection)} onClick={() => onSelect(selection)}>
    <span>{label}</span>
    <small>{aggregation && odf ? `ODF · ${odf.portCapacity ?? aggregation.portCount ?? '—'} ports` : subtitle ?? (asset.kind === 'closure' ? 'Closure' : typedAssetLabel(asset))}</small>
  </button>;
}

function SegmentButton({ data, route, segmentId, sourceLabel, selected, onSelect, compact = false, expanded, expandedTube, onToggleExpanded, onExpandTube, lineageSegmentIds, lineageFiberBySegment }: { data: Inventory; route: CableRoute; segmentId: string | null; sourceLabel?: string | null; selected: boolean; onSelect: (selection: WorkspaceSelection) => void; compact?: boolean; expanded: boolean; expandedTube: string | null; onToggleExpanded: (segmentId: string) => void; onExpandTube: (key: string) => void; lineageSegmentIds?: Set<string>; lineageFiberBySegment?: Map<string, number> }) {
  const cable = segmentId ? findCable(data, segmentId) : sourceLabel ? findCable(data, sourceLabel.split('-')[0]) : undefined;
  if (!cable) return <div className="workspace-segment is-unresolved"><span>Segment unresolved</span><small>{sourceLabel ?? 'No canonical segment'}</small></div>;
  const selection: WorkspaceSelection = { type: 'segment', id: cable.id };
  const construction = segmentConstructionAssessment(data, cable);
  const tubeViews = constructionTubeViews(data, cable.id);
  const downstream = selected ? segmentContinuationGroups(data, route.id, cable.id).filter(item => item.direction === 'downstream') : [];
  const lineageActive = lineageSegmentIds?.has(cable.id) ?? false;
  const lineageFiber = lineageFiberBySegment?.get(cable.id);
  const usageViews=(data.fiberUsageProjection?.localViews??[]).filter(view=>view.segmentId===cable.id);
  const usageCounts={inUse:usageViews.filter(view=>view.usageState==='in_use').length,unused:usageViews.filter(view=>view.usageState==='unused').length,review:usageViews.filter(view=>view.usageState==='review_required').length};
  return <div className={`workspace-segment-shell${compact ? ' is-compact' : ''}${selected ? ' is-selected' : ''}${lineageActive ? ' is-lineage-active' : ''}`} data-workspace-key={workspaceSelectionKey(selection)}>
    <button className={`workspace-segment${compact ? ' is-compact' : ''}${selected ? ' is-selected' : ''}`} type="button" onClick={() => onSelect(selection)}>
      <span>{getSegmentDisplayName(cable, data)}</span>
      <em>Legacy C{cable.legacyCableId}</em>
      <small>{construction.state === 'confirmed' ? `${construction.documentedTubeCount} ტუბი` : construction.state === 'partial' ? 'ტუბების ნაწილი დადასტურებულია' : construction.state === 'source_supported_candidate' ? `${cable.fiberCount}F · ტუბები დაუდგენელია` : `${typedAssetLabel(cable.endpointA)} ↔ ${typedAssetLabel(cable.endpointB)}`}</small>
    </button>
    {lineageActive && <div className="route-lineage-overlay"><span>Selected Fiber journey</span><strong>F{String(lineageFiber).padStart(2, '0')}</strong></div>}
    {!!usageViews.length&&<div className="route-usage-summary" aria-label="Fiber usage summary"><span>ჟილების გამოყენება</span><strong>{usageCounts.inUse} გამოიყენება</strong><strong>{usageCounts.unused} არ გამოიყენება</strong>{!!usageCounts.review&&<strong>{usageCounts.review} გადასამოწმებელია</strong>}</div>}
    {construction.state === 'confirmed' || construction.state === 'partial' ? <div className={`route-tube-ribbon is-${construction.state}`} aria-label={`C${cable.legacyCableId} construction`}>
      {tubeViews.filter(view => view.state === 'documented').map(view => <span className={`route-tube-chip is-${view.state}`} key={view.tube.id}><i style={view.tubeColor?.hex ? { backgroundColor: view.tubeColor.hex } : undefined} /><b>T{view.displayNumber}</b><small>{colorKa(view.tubeColor)}</small></span>)}
    </div> : <div className="route-construction-unknown">{cable.fiberCount}F · ტუბები დაუდგენელია</div>}
    {!!tubeViews.length && <button className="route-construction-toggle" type="button" onClick={() => onToggleExpanded(cable.id)}>{expanded ? 'შემადგენლობის დახურვა' : 'შემადგენლობის ნახვა'}<ChevronDown size={14} /></button>}
    {expanded && <div className="route-construction-panel">{tubeViews.map(view => {
      const tubeKey = `${cable.id}:${view.displayNumber}`, isOpen = expandedTube === tubeKey;
      return <div className={`route-tube-row is-${view.state}${isOpen ? ' is-open' : ''}`} key={view.tube.id}>
        <button type="button" data-workspace-key={workspaceSelectionKey({ type: 'tube', cableId: cable.id, number: view.displayNumber })} onClick={() => { onSelect({ type: 'tube', cableId: cable.id, number: view.displayNumber }); onExpandTube(tubeKey); }}><TubeSwatch name={view.state === 'documented' ? colorKa(view.tubeColor) : 'ტუბის ფერი დაუდგენელია'} hex={view.tubeColor?.hex ?? null} context={view.state === 'documented' ? `ტუბი ${view.displayNumber}` : '12-ჟილიანი ჯგუფი'} /><span>{rangeLabel(view.fiberStart, view.fiberEnd)}<small>{view.state === 'proposed' ? 'ტუბის ნომერი დაუდგენელია' : 'დადასტურებულია'}</small></span></button>
        {isOpen && <div className="route-fiber-ribbon">{view.fibers.map(item => <button title={`F${String(item.fiber.number).padStart(2, '0')} · ${item.displayColor?.nameKa ?? item.displayColor?.nameEn ?? 'ფერი დაუდგენელია'}${view.state === 'documented' ? ` · ტუბი ${view.displayNumber} ${colorKa(view.tubeColor)}` : ''}`} className={`is-${item.colorState}`} type="button" key={item.fiber.id} onClick={() => onSelect({ type: 'fiber', cableId: cable.id, number: item.fiber.number })}><i style={item.displayColor?.hex ? { backgroundColor: item.displayColor.hex } : undefined} /><span>{String(item.fiber.number).padStart(2, '0')}</span></button>)}</div>}
      </div>;
    })}</div>}
    {!!downstream.length && <div className="route-destination-summary">{downstream.map(group => <button type="button" key={group.id} disabled={!group.targetSegmentId} onClick={() => group.targetSegmentId && onSelect({ type: 'segment', id: group.targetSegmentId })}><strong>{rangeLabel(group.sourceStart, group.sourceEnd)}</strong><span>→ {group.targetSegmentId ? group.targetLabel : 'გაგრძელება დაუდგენელია'}</span>{group.operationalStatus === 'candidate' && <small>სავარაუდო გაგრძელება</small>}</button>)}</div>}
  </div>;
}

function ChildRoute({ data, route, selectedKey, onSelect, showBranches, expandedSegmentId, expandedTube, onToggleExpanded, onExpandTube, lineageSegmentIds, lineageFiberBySegment }: { data: Inventory; route: CableRoute; selectedKey: string; onSelect: (selection: WorkspaceSelection) => void; showBranches: boolean; expandedSegmentId: string | null; expandedTube: string | null; onToggleExpanded: (segmentId: string) => void; onExpandTube: (key: string) => void; lineageSegmentIds: Set<string>; lineageFiberBySegment: Map<string, number> }) {
  const nodes = orderedCableRouteNodes(route), legs = orderedCableRouteLegs(route);
  return <div className="workspace-child-route" aria-label={`${route.displayName} nested branch`}>
    <span className="child-route-label">Nested route · {route.displayName}</span>
    {legs.map((leg, index) => <div className="child-route-step" key={leg.id}>
      <SegmentButton data={data} route={route} segmentId={leg.segmentId} sourceLabel={leg.sourceLabel} selected={!!leg.segmentId && selectedKey === `segment:${leg.segmentId}`} onSelect={onSelect} compact expanded={expandedSegmentId === leg.segmentId} expandedTube={expandedTube} onToggleExpanded={onToggleExpanded} onExpandTube={onExpandTube} lineageSegmentIds={lineageSegmentIds} lineageFiberBySegment={lineageFiberBySegment} />
      {nodes[index + 1] && <RouteAssetButton data={data} asset={nodes[index + 1].asset} label={nodes[index + 1].label} selected={!!nodes[index + 1].asset && selectedKey === workspaceSelectionKey(selectionForAsset(nodes[index + 1].asset!))} onSelect={onSelect} />}
      {showBranches && nodes[index + 1] && <div className="workspace-branch-list">{route.branches.filter(branch => branch.fromNodeId === nodes[index + 1].id).map(branch => {
        const cable = branch.segmentIds[0] ? findCable(data, branch.segmentIds[0]) : undefined;
        const profile = branch.destination?.kind === 'ap' ? apFlowProfile(data, branch.destination.id) : undefined;
        const ap = branch.destination?.kind === 'ap' ? data.accessPoints.find(item => item.id === branch.destination!.id) : undefined;
        return <button className={`workspace-branch${selectedKey === `branch:${branch.id}` || (cable && selectedKey === `segment:${cable.id}`) ? ' is-selected' : ''}`} type="button" data-workspace-key={`branch:${branch.id}`} data-workspace-segment-key={cable ? `segment:${cable.id}` : undefined} key={branch.id} onClick={() => onSelect({ type: 'branch', id: branch.id })}><Split size={16} /><span>{ap ? `AP${ap.id} · ${ap.name}` : cable ? getSegmentDisplayName(cable, data) : branch.targetDirectionText ?? 'Branch'}<small>{profile ? `${ap?.portCount} პორტი · ${profile.directionGroups.map(group => `${group.startPort}–${group.endPort} ${group.labelKa}`).join(' · ')}` : cable ? `Legacy C${cable.legacyCableId}` : branch.destination ? typedAssetLabel(branch.destination) : branch.targetDirectionText}</small></span></button>;
      })}</div>}
    </div>)}
  </div>;
}

function RouteSchematic({ data, route, selection, onSelect, showBranches, expandedSegmentId, expandedTube, onToggleExpanded, onExpandTube }: { data: Inventory; route: CableRoute; selection: WorkspaceSelection; onSelect: (selection: WorkspaceSelection) => void; showBranches: boolean; expandedSegmentId: string | null; expandedTube: string | null; onToggleExpanded: (segmentId: string) => void; onExpandTube: (key: string) => void }) {
  const nodes = orderedCableRouteNodes(route), legs = orderedCableRouteLegs(route), selectedKey = workspaceSelectionKey(selection);
  const childRoutes = relatedWorkspaceRoutes(data, route).filter(item => item.id !== route.id);
  const selectedLineage = selection.type === 'fiber' ? lineageForFiber(data, selection.cableId, selection.number) : undefined;
  const lineageSegmentIds = new Set(selectedLineage?.legs.filter(item => !item.sourceOnly).map(item => item.segmentId) ?? []);
  const lineageFiberBySegment = new Map(selectedLineage?.legs.filter(item => !item.sourceOnly).map(item => [item.segmentId, item.fiberNumber] as const) ?? []);
  return <ol className="workspace-route-rail" aria-label={`${route.displayName} interactive topology`}>
    {nodes.map((node, index) => {
      const leg = legs[index];
      const linkedChildren = node.asset ? childRoutes.filter(child => child.origin.state === 'known' && sameAsset(child.origin.asset, node.asset)) : [];
      const linkedChildIds = new Set(linkedChildren.map(child => `linked-${child.id}`));
      const branchSummaries = showBranches ? routeNodeOperatorBranches(data, route, node.id).filter(branch => !linkedChildIds.has(branch.id)) : [];
      const key = node.asset ? workspaceSelectionKey(selectionForAsset(node.asset)) : 'boundary:route-destination';
      return <li className="workspace-route-step" key={node.id}>
        <RouteAssetButton data={data} asset={node.asset} label={node.label} selected={selectedKey === key} onSelect={onSelect} subtitle={index === 0 ? 'მარშრუტის დასაწყისი' : index === nodes.length - 1 ? 'დოკუმენტის ბოლო წერტილი' : 'მთავარი მარშრუტი'} />
        {!!branchSummaries.length && <div className="workspace-branch-list">{branchSummaries.map(branch => { const activeLeg = selectedLineage?.legs.find(item => branch.segmentIds.includes(item.segmentId)); const rawBranch = relatedWorkspaceRoutes(data, route).flatMap(item => item.branches).find(item => item.segmentIds.some(segmentId => branch.segmentIds.includes(segmentId))); const apId = rawBranch?.destination?.kind === 'ap' ? rawBranch.destination.id : undefined; const ap = apId ? data.accessPoints.find(item => item.id === apId) : undefined; const profile = apId ? apFlowProfile(data, apId) : undefined; return <button className={`workspace-branch is-${branch.status}${branch.continuationKind === 'external_document' ? ' is-external-document' : ''}${selectedKey === `branch:${branch.id}` || branch.segmentIds.some(segmentId => selectedKey === `segment:${segmentId}`) ? ' is-selected' : ''}${activeLeg ? ' is-lineage-active' : ''}`} type="button" data-workspace-key={`branch:${branch.id}`} data-workspace-segment-key={branch.segmentIds[0] ? `segment:${branch.segmentIds[0]}` : undefined} key={branch.id} onClick={() => onSelect({ type: 'branch', id: branch.id })}><Split size={16} /><span>{ap ? `AP${ap.id} · ${ap.name}` : branch.label}<small>{activeLeg ? `არჩეული ჟილა · F${String(activeLeg.fiberNumber).padStart(2, '0')}` : profile ? `${ap?.portCount} პორტი · ${profile.directionGroups.map(group => `${group.startPort}–${group.endPort} ${group.labelKa}`).join(' · ')}` : branch.continuationKind === 'external_document' ? 'სხვა ქსელის დოკუმენტში აგრძელებს' : branch.status === 'unresolved' ? 'მიმართულება დაუზუსტებელია' : 'განშტოება'}</small></span></button>; })}</div>}
        {linkedChildren.map(child => <ChildRoute key={child.id} data={data} route={child} selectedKey={selectedKey} onSelect={onSelect} showBranches={showBranches} expandedSegmentId={expandedSegmentId} expandedTube={expandedTube} onToggleExpanded={onToggleExpanded} onExpandTube={onExpandTube} lineageSegmentIds={lineageSegmentIds} lineageFiberBySegment={lineageFiberBySegment} />)}
        {leg && <SegmentButton data={data} route={route} segmentId={leg.segmentId} sourceLabel={leg.sourceLabel} selected={selectedKey === `segment:${leg.segmentId ?? (leg.sourceLabel ? findCable(data, leg.sourceLabel.split('-')[0])?.id ?? '' : '')}`} onSelect={onSelect} expanded={expandedSegmentId === (leg.segmentId ?? (leg.sourceLabel ? findCable(data, leg.sourceLabel.split('-')[0])?.id ?? null : null))} expandedTube={expandedTube} onToggleExpanded={onToggleExpanded} onExpandTube={onExpandTube} lineageSegmentIds={lineageSegmentIds} lineageFiberBySegment={lineageFiberBySegment} />}
      </li>;
    })}
  </ol>;
}

function RouteOverviewInspector({ data, route, onSelect }: { data: Inventory; route: CableRoute; onSelect: (selection: WorkspaceSelection) => void }) {
  const counts = routeInventoryCounts(data, route);
  const knownAps = [...counts.apIds].map(id => data.accessPoints.find(item => item.id === id)).filter(Boolean);
  return <>
    <div className="inspector-heading"><span>Route overview</span><h2>{route.displayName}</h2><p>{route.origin.label} → {route.destination.label}</p></div>
    <div className="workspace-fact-grid"><WorkspaceFact label="Closures">{counts.closureIds.size}</WorkspaceFact><WorkspaceFact label="Segments">{counts.segmentIds.size}</WorkspaceFact><WorkspaceFact label="AP branches">{counts.apIds.size}</WorkspaceFact><WorkspaceFact label="Needs attention">{counts.unresolved}</WorkspaceFact></div>
    <InspectorSection title="Operational context"><p>The route rail is the persistent physical-infrastructure context. Select any node, segment or branch to inspect it here.</p></InspectorSection>
    <InspectorSection title="Aggregation and ODF">{[...counts.aggregationIds].map(id => {
      const odf = (data.odfs ?? []).find(item => item.containedBy.kind === 'aggregation' && item.containedBy.id === id);
      const aggregation = data.aggregations.find(item => item.id === id);
      return <button className="inspector-list-row" type="button" key={id} onClick={() => onSelect({ type: 'aggregation', id })}><Network size={17} /><span><strong>{id === LENTEKHI_AGGREGATION_ID ? aggregation?.name : `AGG${id}`}</strong><small>{odf ? `${odf.displayLabel} · ${odf.portCapacity} ports` : id === LENTEKHI_AGGREGATION_ID ? 'ცნობილი ბოლო წერტილი · numeric ID conflict' : 'ODF context unresolved'}</small></span></button>;
    })}</InspectorSection>
    <InspectorSection title="Known access points">{knownAps.map(ap => ap && <button className="inspector-list-row" type="button" key={ap.id} onClick={() => onSelect({ type: 'ap', id: ap.id })}><MapPin size={17} /><span><strong>AP{ap.id} · {ap.name}</strong><small>{ap.portCount} ports</small></span></button>)}</InspectorSection>
    <Clarification items={[route.destination.state === 'unresolved' ? 'Final route endpoint identity' : '', 'Closure treatment and exact optical operations']} />
  </>;
}

function CombinedNetworkInspector({ data, route, onSelect }: { data: Inventory; route: CableRoute; onSelect: (selection: WorkspaceSelection) => void }) {
  const projection = buildNetworkTopologyProjection(data), primary = projection.components[0];
  const sc206 = data.cables.filter(cable => [cable.endpointA, cable.endpointB].some(ref => ref.kind === 'closure' && ref.id === '206'));
  return <>
    <div className="inspector-heading"><span>Combined Network</span><h2>Fiber Atlas · აქტიური ქსელი</h2><p>ერთი physical topology · {data.sourceDocuments?.length ?? 0} იმპორტირებული წყარო</p></div>
    <div className="workspace-fact-grid"><WorkspaceFact label="Canonical Cables">{data.cables.length}</WorkspaceFact><WorkspaceFact label="Logical Fibers">{data.fibers.length.toLocaleString()}</WorkspaceFact><WorkspaceFact label="Connected components">{projection.components.length}</WorkspaceFact><WorkspaceFact label="Primary Cable component">{primary?.edgeIds.length ?? 0}</WorkspaceFact><WorkspaceFact label="Omitted Cable records">{projection.omittedCableIds.length}</WorkspaceFact><WorkspaceFact label="Cable Route context">{route.displayName}</WorkspaceFact></div>
    <InspectorSection title="SC206 · ორი ფიზიკური გაგრძელება">{sc206.map(cable => <button key={cable.id} className="inspector-list-row" type="button" onClick={() => onSelect({ type: 'segment', id: cable.id })}><Cable size={16} /><span><strong>{cableDisplayName(cable, data)}</strong><small>{cable.fiberCount}F · Connected Cable</small></span></button>)}</InspectorSection>
    <InspectorSection title="ქსელის წესი"><p>ფიზიკური Cable მეზობლობა topology-ს აჩვენებს. Fiber optical path მხოლოდ active NodeFiberTransition-ებით და სერტიფიცირებული Port binding-ებით ინიშნება.</p></InspectorSection>
    <InspectorDisclosure title="Source documents და reconciliation"><p>{(data.sourceDocuments ?? []).map(document => `${document.title} · ${document.counts.cableSegments} source representations`).join('\n')}</p><p>Shared physical objects render once; overlapping drawing evidence remains attached to canonical records.</p></InspectorDisclosure>
  </>;
}

function ContinuationGroupList({ data, groups, onSelect }: { data: Inventory; groups: ReturnType<typeof segmentContinuationGroups>; onSelect: (selection: WorkspaceSelection) => void }) {
  if (!groups.length) return <p className="inspector-note">No established continuation record at this side.</p>;
  return <div className="continuation-group-list">{groups.map(group => {
    const target = group.targetSegmentId ? findCable(data, group.targetSegmentId) : undefined;
    const stateLabel = continuationStateKa(group.operationalStatus);
    return <button className={`continuation-group-row is-${group.operationalStatus}`} type="button" disabled={!target} key={group.id} onClick={() => target && onSelect({ type: 'segment', id: target.id })}>
      <span className="continuation-fork" aria-hidden="true">├</span><span><strong>{rangeLabel(group.sourceStart, group.sourceEnd)} → {group.targetLabel}</strong><small>{stateLabel}</small></span>
    </button>;
  })}</div>;
}

function SegmentInspector({ data, route, id, onSelect, navigate }: { data: Inventory; route: CableRoute; id: string; onSelect: (selection: WorkspaceSelection) => void; navigate: (route: Route) => void }) {
  const cable = findCable(data, id);
  const [showFibers, setShowFibers] = useState(false);
  const [fiberQuery, setFiberQuery] = useState('');
  if (!cable) return <p>Segment not found.</p>;
  const summary = segmentOperatorSummary(data, cable);
  const physical = (data.physicalCables ?? []).find(item => item.id === cable.physicalCableId || item.segmentMemberships.some(member => member.segmentId === cable.id));
  const tubeViews = constructionTubeViews(data, cable.id);
  const construction = segmentConstructionAssessment(data, cable);
  const orientation = segmentOrientation(data, route.id, cable.id);
  const continuationGroups = segmentContinuationGroups(data, route.id, cable.id);
  const historicalContinuations = historicalSegmentContinuationGroups(data, route.id, cable.id);
  const downstreamGroups = continuationGroups.filter(item => item.direction === 'downstream');
  const fibers = cableFibers(data, cable.id).filter(fiber => !fiberQuery || `F${String(fiber.number).padStart(2, '0')}`.toLocaleLowerCase().includes(fiberQuery.toLocaleLowerCase()));
  const cableConnections = data.connections.filter(item => (item.a.kind === 'fiber' && item.a.cableId === cable.id) || (item.z.kind === 'fiber' && item.z.cableId === cable.id));
  const acceptedMappings = cableConnections.filter(item => relationshipState(item) === 'accepted').length;
  const candidateMappings = cableConnections.filter(item => relationshipState(item) === 'candidate').length;
  const position = summary.path.join(' → ');
  const selectedIndex = summary.path.indexOf(`C${cable.legacyCableId}`);
  const upstreamPath = selectedIndex > 0 ? summary.path.slice(0, selectedIndex).join(' → ') : orientation?.upstreamLabel ?? 'მიმართულება დაუდგენელია';
  const destinationText = (label: string) => label.includes('unresolved') || label.includes('Unresolved') || label.includes('No established mapping') ? 'გაგრძელება დაუდგენელია' : humanizeSegmentTokens(data, label);
  const spliceNode = [cable.endpointA, cable.endpointB].find(endpoint => endpoint.kind === 'closure' && connectionSheetForFiberAtNode(data, endpoint, cable.id, 1));
  return <>
    <div className="inspector-heading"><button className="inspector-back" type="button" onClick={() => onSelect({ type: 'route', id: route.id })}><ArrowLeft size={15} /> მარშრუტი</button><span>კაბელის მონაკვეთი</span><h2>{getSegmentDisplayName(cable, data)}</h2><p>Legacy C{cable.legacyCableId}</p></div>
    <div className="inspector-story">
      <section><span>საიდან მოდის</span><strong>{upstreamPath}</strong></section>
      <section><span>ეს მონაკვეთი</span><strong>{getSegmentDisplayName(cable, data)}</strong></section>
      <section><span>სად მიდის ჟილები</span><div className="destination-lines">{downstreamGroups.length ? downstreamGroups.map(group => <button type="button" key={group.id} disabled={!group.targetSegmentId} onClick={() => group.targetSegmentId && onSelect({ type: 'segment', id: group.targetSegmentId })}><b>{rangeLabel(group.sourceStart, group.sourceEnd)}</b><span>→ {destinationText(group.targetLabel)}</span></button>) : <p>გაგრძელება დაუდგენელია</p>}</div></section>
    </div>
    <InspectorSection title="კაბელის შემადგენლობა"><p className="construction-count">{cable.fiberCount} ჟილა{construction.documentedTubeCount ? ` · ${construction.documentedTubeCount} ტუბი` : ''}</p>{tubeViews.length ? <div className="tube-summary-list">{tubeViews.map(view => <button type="button" key={view.tube.id} className={`tube-summary-button is-${view.state}`} onClick={() => onSelect({ type: 'tube', cableId: cable.id, number: view.displayNumber })}><TubeSwatch name={view.state === 'documented' ? colorKa(view.tubeColor) : 'ტუბის ფერი დაუდგენელია'} hex={view.tubeColor?.hex ?? null} context={view.state === 'documented' ? `ტუბი ${view.displayNumber}` : '12-ჟილიანი ჯგუფი'} /><strong>{rangeLabel(view.fiberStart, view.fiberEnd)}</strong></button>)}</div> : <div className="inspector-callout"><strong>{cable.fiberCount} ჟილა</strong><p>ტუბების ფიზიკური განაწილება ამ Visio-დან ზუსტად ვერ განისაზღვრა</p></div>}</InspectorSection>
    <div className="inspector-actions"><button className="button button-primary" type="button" onClick={() => setShowFibers(value => !value)}>ჟილების ნახვა</button><button className="button button-quiet" type="button" onClick={() => onSelect({ type: 'fiber', cableId: cable.id, number: 1 })}>სრული გზა</button>{spliceNode && <button className="button button-quiet" type="button" onClick={() => navigate({ view: 'splice', nodeKind: 'closure', nodeId: spliceNode.id, focus: `fiber:${cable.id}:1` })}>შეერთებების სქემა</button>}</div>
    {showFibers && <InspectorSection title="ჟილები" action={<button className="workspace-text-action" type="button" onClick={() => setShowFibers(false)}>დახურვა</button>}>
      {showFibers && <><label className="inspector-search"><Search size={15} /><span className="sr-only">Search fibers in selected segment</span><input value={fiberQuery} onChange={event => setFiberQuery(event.target.value)} placeholder="F29" /></label><div className="inspector-fiber-grid">{fibers.map(fiber => <button type="button" key={fiber.id} onClick={() => onSelect({ type: 'fiber', cableId: cable.id, number: fiber.number })}><span>F{String(fiber.number).padStart(2, '0')}</span><small>{colorLabel(fiber.physicalColor)}</small></button>)}</div></>}
    </InspectorSection>}
    <InspectorDisclosure><p>{physical && summary.routeContinuesAfterPhysicalCable ? `ფიზიკური კაბელი სრულდება ${physical.endB.label.split(' · ')[0]}-ზე; ჟილები სხვა კაბელებში აგრძელებენ.` : 'ფიზიკური კაბელის ცალკე დასასრულის შესახებ დამატებითი ფაქტი არ არის.'}</p><p>მარშრუტის კონტექსტი: {summary.source} → {summary.finalRouteEndpoint}</p><InspectorDisclosure title="წყარო და ტექნიკური დეტალები" technical><div className="workspace-fact-grid"><WorkspaceFact label="წყაროს აღნიშვნა">{cable.legacyLabels[0]}</WorkspaceFact><WorkspaceFact label="მარშრუტში მდებარეობა">{position}</WorkspaceFact><WorkspaceFact label="ოპტიკური კავშირები">{acceptedMappings} მიღებული · {candidateMappings} სავარაუდო</WorkspaceFact><WorkspaceFact label="ფიზიკური კაბელის ID">{physical?.id ?? 'დაუდგენელია'}</WorkspaceFact></div><p>ოპერაციული გაგრძელება ითვლება აქტიური ადგილობრივი Fiber გადასვლებიდან; მარშრუტი მხოლოდ ფიზიკურ კონტექსტს აჩვენებს.</p><p>{cable.source.file} · გვერდი {cable.source.page}</p><FullDetailButton navigate={navigate} route={{ view: 'cable', id: cable.id }}>სრული ტექნიკური ჩანაწერი</FullDetailButton><InspectorDisclosure title="ისტორიული გაგრძელების ინტერპრეტაცია" technical><p>ქვემოთ მოცემული ძველი ჩანაწერები ისტორიული მტკიცებულებაა და მიმდინარე ოპერაციულ გაგრძელებას არ განსაზღვრავს.</p>{historicalContinuations.map(group => <p key={group.id}>{typedAssetLabel(group.node)} · {rangeLabel(group.sourceStart, group.sourceEnd)} → {group.targetLabel} · {continuationStateKa(group.operationalStatus)}</p>)}</InspectorDisclosure></InspectorDisclosure></InspectorDisclosure>
  </>;
}

function TubeInspector({ data, route, cableId, number, onSelect }: { data: Inventory; route: CableRoute; cableId: string; number: number; onSelect: (selection: WorkspaceSelection) => void }) {
  const cable = findCable(data, cableId);
  const summary = tubeContinuationSummary(data, route.id, cableId, number);
  if (!cable || !summary) return <p>Tube or proposed group not found.</p>;
  const { tube } = summary;
  const carriedLineages = lineagesForTube(data, cableId, number);
  const destinationText = (label: string) => label.includes('unresolved') || label.includes('Unresolved') || label.includes('No established mapping') ? 'გაგრძელება დაუდგენელია' : humanizeSegmentTokens(data, label);
  return <>
    <div className="inspector-heading"><button className="inspector-back" type="button" onClick={() => onSelect({ type: 'segment', id: cable.id })}><ArrowLeft size={15} /> მონაკვეთი</button><span>{tube.state === 'documented' ? 'ტუბი' : 'ჟილების ჯგუფი'}</span><h2>{tube.state === 'documented' ? `ტუბი ${number} · ${colorKa(tube.tubeColor)}` : `ჟილები ${rangeLabel(tube.fiberStart, tube.fiberEnd)}`}</h2><p>{tube.state === 'documented' ? `${getSegmentDisplayName(cable, data)} · ${rangeLabel(tube.fiberStart, tube.fiberEnd)}` : 'ტუბის ფერი/ნომერი დაუდგენელია'}</p></div>
    {summary.groups.length > 0 && <InspectorSection title="სად მიდიან ჟილები"><div className="destination-lines">{summary.groups.map(group => <button type="button" key={group.id} disabled={!group.targetSegmentId} onClick={() => group.targetSegmentId && onSelect({ type: 'segment', id: group.targetSegmentId })}><b>{rangeLabel(group.sourceStart, group.sourceEnd)}</b><span>→ {destinationText(group.targetLabel)}</span></button>)}</div></InspectorSection>}
    <InspectorSection title="ჟილები"><div className="tube-fiber-list">{tube.fibers.map(item => <button type="button" className={`is-${item.colorState}`} key={item.fiber.id} onClick={() => onSelect({ type: 'fiber', cableId, number: item.fiber.number })}><i style={item.displayColor?.hex ? { backgroundColor: item.displayColor.hex } : undefined} /><span><strong>F{String(item.fiber.number).padStart(2, '0')} · {item.displayColor?.nameKa ?? item.displayColor?.nameEn ?? 'ფერი დაუდგენელია'}</strong></span></button>)}</div></InspectorSection>
    <InspectorDisclosure><p>{carriedLineages.length} ჟილის სრული გზა ხელმისაწვდომია.</p><p>{summary.unresolvedMembers.length ? `${summary.unresolvedMembers.length} ჟილის გაგრძელება დაუდგენელია.` : 'ამ ჯგუფში ყველა არსებული გაგრძელება ნაჩვენებია.'}</p><InspectorDisclosure title="წყარო და ტექნიკური დეტალები" technical><p>ადგილობრივი მონაკვეთი: C{cable.legacyCableId} · {typedAssetLabel(cable.endpointA)} ↔ {typedAssetLabel(cable.endpointB)}</p><p>გაგრძელების მდგომარეობა: {summary.state.replaceAll('_', ' ')}</p></InspectorDisclosure></InspectorDisclosure>
  </>;
}

function FiberInspector({ data, route, cableId, number, onSelect, navigate }: { data: Inventory; route: CableRoute; cableId: string; number: number; onSelect: (selection: WorkspaceSelection) => void; navigate: (route: Route) => void }) {
  const model = buildFiberDetailModel(data, cableId, number);
  if (!model) return <p>Fiber not found.</p>;
  if (data.fiberPathProjection) return <CurrentFiberJourney data={data} cableId={model.cableId} fiberNumber={number} onSelect={onSelect} navigate={navigate} />;
  const fiber = findFiber(data, cableId, number)!;
  const tube = fiberTube(data, fiber);
  const exact = exactFiberContinuations(data, route.id, model.cableId, number);
  const upstream = exact.filter(item => item.direction === 'upstream');
  const downstream = exact.filter(item => item.direction === 'downstream');
  const strictUpstreamPath = cableContinuityPath(data, route.id, model.cableId, number, 'upstream', 'strict');
  const strictDownstreamPath = cableContinuityPath(data, route.id, model.cableId, number, 'downstream', 'strict');
  const candidateDownstreamPath = cableContinuityPath(data, route.id, model.cableId, number, 'downstream', 'candidate');
  const lineage = lineageForFiber(data, model.cableId, number);
  const maximumJourney = fiberJourneySummary(data, model.cableId, number);
  const portBindings = portBindingsForFiber(data, model.cableId, number);
  const currentLeg = lineage?.legs.find(item => item.segmentId === model.cableId && item.fiberNumber === number);
  const journey = lineage ? compactLineageJourney(lineage, data) : [];
  const uses = lineage ? useAssignmentsForLineage(data, lineage.id) : [];
  const useNames = [...new Set(uses.map(use => data.organizations.find(org => org.id === use.organizationId)?.name ?? use.organizationId))];
  const terminalTransition = lineage ? (data.nodeFiberTransitions ?? []).find(transition => transition.active && transition.transitionType === 'intentional_termination'
    && lineage.legs.some(leg => leg.segmentId === transition.a.segmentId && leg.fiberNumber === transition.a.fiberNumber)) : undefined;
  const hasOtdr = !!lineage?.legs.some(item => item.sourceSegmentLabel === 'C173' && item.fiberNumber === 3);
  const correctedAudits = lineage ? (data.fiberLineageAudit ?? []).filter(item => item.classification !== 'preserved' && item.correctedLineageIds.includes(lineage.id)) : [];
  const endpointCard = (endpoint: FiberLineageEndpoint, label: string) => {
    const odf = endpoint.asset?.kind === 'aggregation' ? (data.odfs ?? []).find(item => sameAsset(item.containedBy, endpoint.asset)) : undefined;
    const selection: WorkspaceSelection | null = endpoint.portNumber == null || !endpoint.asset ? null
      : endpoint.asset.kind === 'ap' ? { type: 'port', ownerType: 'ap', ownerId: endpoint.asset.id, number: endpoint.portNumber }
        : endpoint.asset.kind === 'aggregation' && odf ? { type: 'port', ownerType: 'odf', ownerId: odf.id, number: endpoint.portNumber } : null;
    return <div><span className="sr-only">{label === 'ერთი ბოლო' ? 'საიდან მოდის' : 'სად მიდის'}</span><span>{label}</span>{selection ? <button className="lineage-endpoint-action" type="button" data-lineage-endpoint={endpoint.label} onClick={() => onSelect(selection)}>{endpoint.label}</button> : <strong>{endpoint.label}</strong>}</div>;
  };
  const pathSummary = (path: ReturnType<typeof cableContinuityPath>) => {
    const traversed = path.steps.filter(step => step.kind === 'segment');
    const last = traversed.at(-1);
    if (path.status === 'partial_authoritative' && traversed.length > 1 && last) return `Reviewed through ${last.label}; ${path.stopReason}`;
    if (path.status === 'candidate' && traversed.length > 1 && last && !path.stopReason.startsWith('Known endpoint')) return `Possible through ${last.label}; ${path.stopReason}`;
    return path.stopReason;
  };
  const renderExact = (items: typeof exact, empty: string) => items.length ? <div className="exact-continuity-list">{items.map(item => {
    const targetCable = item.targetSegmentId ? findCable(data, item.targetSegmentId) : undefined;
    const targetFiber = targetCable && item.targetFiberNumber != null ? findFiber(data, targetCable.id, item.targetFiberNumber) : undefined;
    return <button type="button" disabled={!targetCable} className={`mapping-row is-${item.operationalStatus}`} key={`${item.continuationId}-${item.direction}-${item.node.id}`} onClick={() => targetCable && onSelect({ type: 'fiber', cableId: targetCable.id, number: item.targetFiberNumber! })}><strong>{item.targetLabel}</strong><small>{typedAssetLabel(item.node)} · {continuationStateKa(item.operationalStatus)}{targetFiber ? ` · ${colorLabel(fiber.physicalColor)} → ${colorLabel(targetFiber.physicalColor)}` : ''}</small></button>;
  })}</div> : <p className="inspector-note">{empty}</p>;
  return <>
    <div className="inspector-heading"><button className="inspector-back" type="button" onClick={() => onSelect({ type: 'segment', id: model.cableId })}><ArrowLeft size={15} /> მონაკვეთი</button><span>ჟილა</span><h2>{getSegmentDisplayName(findCable(data, model.cableId)!, data)} / {model.fiberLabel}</h2><p>Legacy C{model.cableLegacyId}</p></div>
    {lineage ? <div data-lineage-id={lineage.id}>
      <div className="lineage-answer-grid">
        {endpointCard(lineage.endpointA ?? lineage.origin, 'ერთი ბოლო')}
        <div><span>აქ</span><strong>{getSegmentDisplayName(findCable(data, model.cableId)!, data)} · {currentLeg?.tubeNumber ? `${colorKa(currentLeg.tubeColor)} ტუბი` : 'ტუბი დაუდგენელია'} · F{String(number).padStart(2, '0')} · {colorKa(currentLeg?.fiberColor)}</strong></div>
        {endpointCard(lineage.endpointB ?? lineage.destination, 'მეორე ბოლო')}
      </div>
      {!!lineage.warnings.length && <div className="inspector-callout is-warning"><strong>მაქსიმალური ცნობილი გზა</strong><p>{lineage.warnings.join(' ')}</p></div>}
      {!!useNames.length && <div className="lineage-usage"><strong>იყენებს: {useNames.join(', ')}</strong></div>}
      {hasOtdr && <div className="lineage-annotation"><strong>შენიშვნა: OTDR</strong></div>}
      <InspectorSection title="არჩეული ჟილის გადასვლა"><div className="node-transition-list">{lineage.transitions.map(change => {
        const from = change.fromSegmentId ? findCable(data, change.fromSegmentId) : undefined;
        const to = change.toSegmentId ? findCable(data, change.toSegmentId) : undefined;
        const sheet = change.nodeFiberTransitionId ? connectionSheetForTransition(data, change.nodeFiberTransitionId) : undefined;
        return <div className="node-transition-action" data-transition-node={currentAssetLabel(data,change.node)} key={change.nodeFiberTransitionId ?? `${lineage.id}-${change.sequence}`}><button type="button" disabled={!change.toSegmentId || change.toFiberNumber == null} onClick={() => change.toSegmentId && change.toFiberNumber != null && onSelect({ type: 'fiber', cableId: change.toSegmentId, number: change.toFiberNumber })}><strong>{currentAssetLabel(data,change.node)}</strong><span>C{from?.legacyCableId}/F{String(change.fromFiberNumber).padStart(2, '0')} → C{to?.legacyCableId}/F{String(change.toFiberNumber).padStart(2, '0')}</span><small>{colorKa(change.beforeFiberColor)} → {colorKa(change.afterFiberColor)}</small></button>{sheet && <button className="transition-splice-link" type="button" onClick={() => navigate({ view: 'splice', nodeKind: change.node.kind as 'closure' | 'aggregation' | 'ap' | 'network_node', nodeId: change.node.id, relationshipId: sheet.id, focus: `fiber:${change.fromSegmentId}:${change.fromFiberNumber}` })}>შეერთების ნახვა</button>}</div>;
      })}{terminalTransition && <div className="node-transition-action is-termination" data-transition-node="SC225"><button type="button" disabled><strong>SC225</strong><span>C181/F{String(terminalTransition.a.fiberNumber).padStart(2, '0')} → აქ მთავრდება</span><small>მფლობელის დადასტურება · ადგილზე არ არის გადამოწმებული</small></button></div>}</div></InspectorSection>
      <InspectorSection title="სრული გზა"><div className="lineage-journey">{journey.map(row => {
        const change = lineage.transitions.find(item => item.sequence === row.legSequences[0] - 1);
        const events = change ? [change.numberChanged ? `F${String(change.fromFiberNumber).padStart(2, '0')} → F${String(change.toFiberNumber).padStart(2, '0')}` : '', change.tubeChanged ? `${colorKa(change.beforeTubeColor)} ტუბი → ${colorKa(change.afterTubeColor)} ტუბი` : '', change.fiberColorChanged ? `${colorKa(change.beforeFiberColor)} → ${colorKa(change.afterFiberColor)}` : ''].filter(Boolean) : [];
        const target = lineage.legs.find(item => item.sequence === row.legSequences[0]);
        return <button className={`lineage-journey-row${events.length ? ' has-change' : ''}`} type="button" key={row.id} disabled={!target || target.sourceOnly} onClick={() => target && !target.sourceOnly && onSelect({ type: 'fiber', cableId: target.segmentId, number: target.fiberNumber })}>{events.length ? <em>ცვლილება {change ? currentAssetLabel(data,change.node) : ''}-ზე</em> : row.legSequences.length > 1 ? <em>უცვლელად</em> : null}<span className="lineage-location">{row.location}</span><span className="lineage-segments">{row.segmentLabels.map(label => humanizeSegmentTokens(data, label)).join(' → ')}</span><span className="lineage-identity"><i style={row.tubeColor.hex ? { backgroundColor: row.tubeColor.hex } : undefined} />{row.tubeNumber ? `${colorKa(row.tubeColor)} ტუბი` : 'ტუბი დაუდგენელია'} · F{String(row.fiberNumber).padStart(2, '0')} · {colorKa(row.fiberColor)}</span>{events.length > 0 && <strong>{events.join(' · ')}</strong>}</button>;
      })}{terminalTransition && <div className="lineage-journey-row is-termination"><em>ცნობილი დასრულება</em><span className="lineage-location">SC225</span><span className="lineage-segments">აქ მთავრდება</span><strong>შემდგომი ოპტიკური კავშირი არ არსებობს</strong></div>}</div></InspectorSection>
    </div> : maximumJourney ? <>
      <div className="lineage-answer-grid">
        <div><span className="sr-only">საიდან მოდის</span><span>ერთი ბოლო</span><strong>{maximumJourney.knownFrom}</strong></div>
        <div><span>აქ</span><strong>{getSegmentDisplayName(findCable(data, model.cableId)!, data)} · {tube?.number ? `ტუბი ${tube.number} · ${colorKa(tube.physicalColor)}` : 'ტუბი დაუდგენელია'} · {model.fiberLabel} · {colorKa(fiber.physicalColor)}</strong></div>
        <div><span className="sr-only">სად მიდის</span><span>მეორე ბოლო</span><strong>{maximumJourney.knownTo}</strong></div>
      </div>
      <InspectorSection title="მაქსიმალური ცნობილი გზა"><p className="inspector-path-text">{maximumJourney.knownFrom} → {getSegmentDisplayName(findCable(data, model.cableId)!, data)} / {model.fiberLabel} → {maximumJourney.knownTo}</p><p className="inspector-stop">{maximumJourney.stopReasonKa}</p></InspectorSection>
    </> : null}
    {portBindings.length > 0 && <InspectorSection title="დაკავშირებული პორტი"><div className="exact-continuity-list">{portBindings.map(binding => <button type="button" className="mapping-row is-authoritative" key={binding.id} onClick={() => onSelect({ type: 'port', ownerType: binding.ownerType, ownerId: binding.ownerId, number: binding.portNumber })}><strong>{binding.ownerType === 'ap' ? `AP${binding.ownerId}` : binding.ownerId === 'ODF-TSAGERI-01' ? 'AGG5' : 'ლენტეხის აგრეგაცია'} / Port {binding.portNumber}</strong><small>{binding.directionLabel}</small></button>)}</div></InspectorSection>}
    <InspectorDisclosure><div className="fiber-engineering-details">
    <div className="physical-primary"><TubeSwatch name={model.primaryPhysicalColor} hex={fiber.physicalColor.hex} context={`${model.fiberLabel} physical color`} /><p>{tube?.basis === 'documented' ? `Tube ${tube.number} · ${colorLabel(tube.physicalColor)} · position ${fiber.positionInTube}/12` : 'Tube identity is not confirmed.'}</p></div>
    <div className="workspace-fact-grid"><WorkspaceFact label="Current Segment">C{model.cableLegacyId} / {model.fiberLabel}</WorkspaceFact><WorkspaceFact label="Comes from · strict">{pathSummary(strictUpstreamPath)}</WorkspaceFact><WorkspaceFact label="Goes to · strict">{pathSummary(strictDownstreamPath)}</WorkspaceFact><WorkspaceFact label="Candidate endpoint">{pathSummary(candidateDownstreamPath)}</WorkspaceFact><WorkspaceFact label="Broader route context">{model.broaderDestination}</WorkspaceFact><WorkspaceFact label="PhysicalCable">{model.physicalCable?.id ?? 'Unresolved'}</WorkspaceFact><WorkspaceFact label="Usage / availability">{model.usage} · {model.availability}</WorkspaceFact></div>
    <InspectorSection title="Comes from · საიდან მოდის">{renderExact(upstream, 'No established upstream Fiber continuation.')}</InspectorSection>
    <InspectorSection title="Goes to · სად აგრძელებს">{renderExact(downstream.filter(item => item.operationalStatus === 'authoritative'), 'No reviewed downstream continuation.')}</InspectorSection>
    <InspectorSection title="Candidate continuation">{renderExact(downstream.filter(item => item.operationalStatus === 'candidate'), 'No candidate downstream continuation.')}</InspectorSection>
    <InspectorSection title="Final known endpoint"><p className={strictDownstreamPath.status === 'authoritative' ? 'inspector-path-text' : 'inspector-stop'}>{strictDownstreamPath.stopReason}</p>{candidateDownstreamPath.status === 'candidate' && <p className="inspector-note">Candidate mode: {candidateDownstreamPath.stopReason}</p>}<small>Numbers and physical colors may differ across an explicit valid mapping; neither is used as the continuity key.</small></InspectorSection>
    <details className="inspector-ledger workspace-engineering-action"><summary>Existing Fiber Detail interpretation</summary><p>{model.currentEventSummary}</p>{model.acceptedContinuations.map(item => <p key={item.id}>{item.label} · {item.locationLabel}</p>)}{model.strictStopReasons.map(reason => <p key={reason}>{reason}</p>)}</details>
    {correctedAudits.length > 0 && <InspectorDisclosure title="ძველი და შესწორებული გზა" technical>{correctedAudits.map(item => <div className="lineage-audit-comparison" key={item.id}><strong>{item.previousLineageId}</strong><p><span>ძველი:</span> {item.oldPath.join(' → ')}</p><p><span>შესწორებული:</span> {item.correctedPath.join(' → ')}</p><small>{item.reason}</small></div>)}</InspectorDisclosure>}
    <InspectorDisclosure title="წყარო და ტექნიკური დეტალები" technical><p>პროექციის სტატუსი: {lineage?.projectionStatus.replaceAll('_', ' ') ?? 'unresolved'}</p><p>წყაროს მონაცემები და ვერიფიკაციის სტრუქტურა შენარჩუნებულია.</p><FullDetailButton navigate={navigate} route={{ view: 'fiber', cableId: model.cableId, fiber: number }}>სრული ტექნიკური ჩანაწერი</FullDetailButton></InspectorDisclosure>
    </div></InspectorDisclosure>
  </>;
}

function AggregationInspector({ data, route, id, onSelect, navigate }: { data: Inventory; route: CableRoute; id: string; onSelect: (selection: WorkspaceSelection) => void; navigate: (route: Route) => void }) {
  const aggregation = data.aggregations.find(item => item.id === id);
  const odf = (data.odfs ?? []).find(item => item.containedBy.kind === 'aggregation' && item.containedBy.id === id);
  const ranges = (data.portRangeAssignments ?? []).filter(item => item.odfId === odf?.id).sort((a, b) => a.startPort - b.startPort);
  const [expandedRange, setExpandedRange] = useState<string | null>(null);
  if (!aggregation) return <p>Aggregation context not found.</p>;
  if (!odf) return <>
    <div className="inspector-heading"><button className="inspector-back" type="button" onClick={() => onSelect({ type: 'route', id: route.id })}><ArrowLeft size={15} /> მარშრუტი</button><span>აგრეგაცია</span><h2>{aggregation.name}</h2><p>მარშრუტის ცნობილი ბოლო წერტილი</p></div>
    <div className="inspector-story"><section><span>შემოდის</span><strong>SC224 → C184 → {aggregation.name}</strong></section><section><span>პორტები</span><strong>{aggregation.portCount ?? '48 source positions'}</strong></section></div>
    <div className="inspector-callout is-positive"><strong>დანიშნულება ცნობილია</strong><p>რიცხვითი legacy იდენტიფიკატორი წინააღმდეგობრივია; ეს მარშრუტის დასრულებას არ აჩერებს.</p></div>
    <InspectorDisclosure><div className="workspace-fact-grid"><WorkspaceFact label="სათაურის ჩანაწერი">AGG6</WorkspaceFact><WorkspaceFact label="Property ჩანაწერი">ID5</WorkspaceFact><WorkspaceFact label="კანონიკური იდენტობა">{LENTEKHI_AGGREGATION_ID}</WorkspaceFact><WorkspaceFact label="C184">48F · SC224-დან</WorkspaceFact></div><p>ორივე რიცხვითი ჩანაწერი დაცულია; არცერთი არ არის არჩეული გამარჯვებულად.</p><InspectorDisclosure title="წყარო და ტექნიკური დეტალები" technical><p>Destination is known; numeric legacy identifier is conflicting.</p><FullDetailButton navigate={navigate} route={{ view: 'aggregation', id }}>სრული ტექნიკური ჩანაწერი</FullDetailButton></InspectorDisclosure></InspectorDisclosure>
  </>;
  return <>
    <div className="inspector-heading"><button className="inspector-back" type="button" onClick={() => onSelect({ type: 'route', id: route.id })}><ArrowLeft size={15} /> მარშრუტი</button><span>აგრეგაცია</span><h2>{id === LENTEKHI_AGGREGATION_ID ? aggregation.name : `${aggregation.name} · AGG${id}`}</h2><p>ODF · {odf.portCapacity} პორტი</p></div>
    <div className="inspector-actions"><button className="button button-primary" type="button" onClick={() => navigate({ view: 'splice', nodeKind: 'aggregation', nodeId: id })}>შეერთებების სქემა</button></div>
    <InspectorSection title="მიმართულებები და პორტები">{ranges.length > 0 ? <div className="port-range-browser">{ranges.map(range => <div className={`port-range-group${expandedRange === range.id ? ' is-open' : ''}`} key={range.id}><button type="button" onClick={() => setExpandedRange(value => value === range.id ? null : range.id)}><span><strong>პორტები {range.startPort}–{range.endPort}</strong><small>{destinationLabel(range)}</small></span><ChevronDown size={16} /></button>{expandedRange === range.id && <div className="workspace-port-grid">{Array.from({ length: range.endPort - range.startPort + 1 }, (_, index) => range.startPort + index).map(number => { const status = portOperationalStatus(data, 'odf', odf.id, number); return <button type="button" className={`port-status-${status}`} key={number} title={`${number} · ${status}`} onClick={() => onSelect({ type: 'port', ownerType: 'odf', ownerId: odf.id, number })}>{number}<small>{status === 'in_use' ? 'გამოიყენება' : status === 'reserved' ? 'დაჯავშნილია' : status === 'unavailable' ? 'მიუწვდომელია' : status === 'unused' ? 'არ გამოიყენება' : 'უცნობია'}</small></button>; })}</div>}</div>)}</div> : <div className="workspace-port-grid is-direct-odf" aria-label={`${aggregation.name} ports`}>{Array.from({ length: odf.portCapacity ?? aggregation.portCount ?? 0 }, (_, index) => index + 1).map(number => { const status = portOperationalStatus(data, 'odf', odf.id, number); return <button type="button" className={`port-status-${status}`} key={number} aria-label={`${aggregation.name} Port ${number}`} onClick={() => onSelect({ type: 'port', ownerType: 'odf', ownerId: odf.id, number })}>{number}<small>{status}</small></button>; })}</div>}</InspectorSection>
    <InspectorDisclosure><p>{route.displayName}</p><p>{route.origin.label} → {route.destination.label}</p><InspectorDisclosure title="წყარო და ტექნიკური დეტალები" technical><p>ODF: {odf.id}</p><FullDetailButton navigate={navigate} route={{ view: 'aggregation', id }}>სრული ტექნიკური ჩანაწერი</FullDetailButton></InspectorDisclosure></InspectorDisclosure>
  </>;
}

function PortInspector({ data, route, selection, onSelect, navigate }: { data: Inventory; route: CableRoute; selection: Extract<WorkspaceSelection, { type: 'port' }>; onSelect: (selection: WorkspaceSelection) => void; navigate: (route: Route) => void }) {
  if(selection.ownerType==='ap' && data.networkNodes?.some(n=>n.id===selection.ownerId&&n.assetType==='ap')) return <SourceBAPInspector data={data} id={selection.ownerId} portNumber={selection.number} onSelect={onSelect} navigate={navigate}/>;
  const isOdf = selection.ownerType === 'odf';
  const odf = isOdf ? (data.odfs ?? []).find(item => item.id === selection.ownerId) : undefined;
  const port = isOdf ? (data.odfPorts ?? []).find(item => item.odfId === selection.ownerId && item.number === selection.number) : undefined;
  const ap = !isOdf ? data.accessPoints.find(item => item.id === selection.ownerId) : undefined;
  const range = isOdf ? portRangeFor(data, selection.ownerId, selection.number) : undefined;
  const apRange = !isOdf ? (data.accessPointPortRanges ?? []).find(item => item.accessPointId === selection.ownerId && selection.number >= item.startPort && selection.number <= item.endPort) : undefined;
  const direction = range ? destinationLabel(range) : apRange ? (apRange.destination.type === 'named_direction' ? apRange.destination.name : apRange.destination.label) : 'Direction unresolved';
  const trace = isOdf ? traceFromOdfPort(data, selection.ownerId, selection.number) : null;
  const prototypeMapping = !isOdf && selection.ownerId === '51' ? ap51PortMapping(data, selection.number) : undefined;
  const flow = !isOdf ? apPortFlow(data, selection.ownerId, selection.number) : undefined;
  const binding = portTopologyBinding(data, selection.ownerType, selection.ownerId, selection.number);
  const spliceSheet = connectionSheetForPort(data, selection.ownerType, selection.ownerId, selection.number);
  const boundCable = binding ? findCable(data, binding.segmentId) : undefined;
  const boundJourney = binding ? fiberJourneySummary(data, binding.segmentId, binding.fiberNumber) : undefined;
  const portLineage = (data.currentFiberLineages ?? data.fiberLineages ?? []).find(item => flow?.lineageIds.includes(item.id) || (isOdf
    ? item.origin.asset?.kind === 'aggregation' && item.origin.asset.id === '5' && item.origin.portNumber === selection.number
    : item.destination.asset?.kind === 'ap' && item.destination.asset.id === selection.ownerId && item.destination.portNumber === selection.number));
  if ((isOdf && (!odf || !port)) || (!isOdf && (!ap || selection.number < 1 || selection.number > ap.portCount))) return <p>Port not found.</p>;
  const usage = flow?.physicalUsage ?? prototypeMapping?.physicalUsage;
  const occupancy=usage??port?.physicalOccupancy;
  const usageKa = occupancy === 'in_use' ? 'გამოიყენება' : occupancy === 'unused' ? 'გამოუყენებელია' : 'სტატუსი დაუდგენელია';
  const operationalStatus = portOperationalStatus(data, selection.ownerType, selection.ownerId, selection.number);
  const organizations = binding ? [...new Set(binding.lineageIds.flatMap(lineageId => useAssignmentsForLineage(data, lineageId).map(item => data.organizations.find(org => org.id === item.organizationId)?.name ?? item.organizationId)))] : [];
  const portOwnerLabel = isOdf ? selection.ownerId === 'ODF-TSAGERI-01' ? 'AGG5' : 'ლენტეხის აგრეგაცია' : `AP${ap!.id}`;
  const roleLabel=boundJourney?`${boundJourney.knownFrom} ↔ ${boundJourney.knownTo}`:flow?flow.roles.map(apRoleKa).join(' · '):'ჟილის ზუსტი გზა დაუდგენელია';
  return <>
    <div className="inspector-heading"><button className="inspector-back" type="button" onClick={() => onSelect(isOdf ? { type: 'aggregation', id: odf!.containedBy.id } : { type: 'ap', id: ap!.id })}><ArrowLeft size={15} /> {isOdf ? 'აგრეგაცია' : `AP${ap!.id}`}</button><span>{isOdf ? 'ODF პორტი' : 'AP პორტი'}</span><h2>{portOwnerLabel} · პორტი {selection.number}</h2></div>
    <div className="inspector-story"><section><span>ცნობილი ჟილის ბოლოები</span><strong>{roleLabel}</strong></section><section><span>ფიზიკური სტატუსი</span><strong className={`port-status-label is-${operationalStatus}`}>{usageKa}</strong>{organizations.length > 0 && <p>იყენებს: {organizations.join(', ')}</p>}</section></div>
    {spliceSheet && <div className="inspector-actions"><button className="button button-primary" type="button" onClick={() => navigate({ view: 'splice', nodeKind: spliceSheet.node.kind as 'closure' | 'aggregation' | 'ap', nodeId: spliceSheet.node.id, relationshipId: spliceSheet.id, focus: `port:${selection.ownerId}:${selection.number}` })}>შეერთებების სქემა</button></div>}
    {flow?.incoming && <InspectorSection title="ჟილა და მიმართულება"><p className="inspector-path-text">{humanizeSegmentTokens(data, flow.incoming.direction)} / F{String(flow.incoming.fiberNumber).padStart(2, '0')} → AP{flow.accessPointId} / Port {flow.portNumber}</p><div className="ap-flow-color-row"><TubeSwatch name={colorKa(flow.incoming.tubeColor)} hex={flow.incoming.tubeColor?.hex ?? null} context={`ტუბი ${flow.incoming.tubeNumber ?? '—'}`} /><TubeSwatch name={colorKa(flow.incoming.fiberColor)} hex={flow.incoming.fiberColor?.hex ?? null} context={`ჟილა ${flow.incoming.fiberNumber ?? '—'}`} /></div>{flow.outgoing && <p>მიმართულება: {flow.outgoing.direction}. შიდა ოპერაცია დაუდგენელია.</p>}{portLineage && <button className="workspace-text-action" type="button" onClick={() => { const current = portLineage.legs.find(item => !item.sourceOnly && item.segmentId === flow.incoming?.segmentId && item.fiberNumber === flow.incoming?.fiberNumber) ?? portLineage.legs.find(item => !item.sourceOnly); if (current) onSelect({ type: 'fiber', cableId: current.segmentId, number: current.fiberNumber }); }}>სრული გზის ნახვა</button>}</InspectorSection>}
    {binding && boundCable && <InspectorSection title="პორტი → ჟილა → ტუბი → მონაკვეთი"><p className="inspector-path-text">{portOwnerLabel} / Port {selection.number} ↔ {getSegmentDisplayName(boundCable, data)} / F{String(binding.fiberNumber).padStart(2, '0')}</p><div className="ap-flow-color-row"><TubeSwatch name={colorKa(binding.tubeColor)} hex={binding.tubeColor?.hex ?? null} context={`ტუბი ${binding.tubeNumber ?? '—'}`} /><TubeSwatch name={colorKa(binding.fiberColor)} hex={binding.fiberColor?.hex ?? null} context={`ჟილა ${binding.fiberNumber}`} /></div>{boundJourney && <><p>{boundJourney.knownFrom} → {boundJourney.knownTo}</p><p className="inspector-stop">{boundJourney.stopReasonKa}</p></>}<button className="workspace-text-action" type="button" onClick={() => onSelect({ type: 'fiber', cableId: binding.segmentId, number: binding.fiberNumber })}>ჟილის გზის ნახვა</button></InspectorSection>}
    {!flow && !binding && <InspectorSection title="ჟილის გზა">{prototypeMapping ? <p className="inspector-path-text">C173 / F{String(prototypeMapping.fiberNumber).padStart(2, '0')} → AP51 / Port {prototypeMapping.portNumber}</p> : portLineage ? <p className="inspector-path-text">{portLineage.origin.label} → {portLineage.destination.label}</p> : <p className="inspector-stop">Visio-დან ზუსტი პორტი და ჟილა ვერ განისაზღვრა.</p>}</InspectorSection>}
    {!isOdf && selection.ownerId === '51' && selection.number === 3 && <div className="lineage-annotation"><strong>შენიშვნა: OTDR</strong></div>}
    <InspectorDisclosure><p>ძველი პორტის დიაპაზონის კონტექსტი: {direction}</p><p>ადმინისტრაციული განაწილება: {flow?.administrativeAllocation ?? prototypeMapping?.administrativeAllocation ?? port?.allocation ?? 'დაუდგენელია'}</p><p>კომერციული ხელმისაწვდომობა: {flow?.commercialAvailability ?? prototypeMapping?.commercialAvailability ?? 'დაუდგენელია'}</p>{range?.continuity === 'stops_at_destination' && <p>ეს მიმართულება SC205-ზე სრულდება.</p>}{apRange && <p>პორტები {apRange.startPort}–{apRange.endPort} → {direction}</p>}<InspectorDisclosure title="წყარო და ტექნიკური დეტალები" technical><p>{flow ? 'შიდა გაგრძელება უცნობია; splice/patch/jumper ოპერაცია არ არის მინიჭებული.' : trace?.reason ?? 'ზუსტი პორტი/ჟილის კავშირი დაუდგენელია'}</p>{isOdf && <FullDetailButton navigate={navigate} route={{ view: 'odf_port', odfId: selection.ownerId, port: selection.number }}>სრული ტექნიკური ჩანაწერი</FullDetailButton>}</InspectorDisclosure></InspectorDisclosure>
  </>;
}

function APInspector({ data, route, id, onSelect, navigate }: { data: Inventory; route: CableRoute; id: string; onSelect: (selection: WorkspaceSelection) => void; navigate: (route: Route) => void }) {
  const ap = data.accessPoints.find(item => item.id === id);
  if (!ap) return <p>AP not found.</p>;
  const summary = accessPointOperatorSummary(data, id);
  const ranges = (data.accessPointPortRanges ?? []).filter(item => item.accessPointId === id);
  const prototypeMappings = (data.prototypePortMappings ?? []).filter(item => item.accessPointId === id);
  const profile = apFlowProfile(data, id);
  const flows = (data.apPortFlows ?? []).filter(item => item.accessPointId === id);
  return <>
    <div className="inspector-heading"><button className="inspector-back" type="button" onClick={() => onSelect({ type: 'route', id: route.id })}><ArrowLeft size={15} /> მარშრუტი</button><span>წვდომის წერტილი</span><h2>AP{id} · {ap.name}</h2><p>{ap.portCount} პორტი</p></div>
    <div className="inspector-story">
      <section><span>საიდან მოდის</span><strong>{profile ? `${profile.routeOriginLabel} / ${findCable(data, profile.incomingSegmentId) ? getSegmentDisplayName(findCable(data, profile.incomingSegmentId)!, data) : `SC${profile.upstreamClosureId}`} → AP${id}` : `${summary.upstreamClosure} → ${summary.incomingSegment}`}</strong></section>
      <section><span>პორტები</span><strong>{ap.portCount}</strong>{prototypeMappings.some(item => item.physicalUsage === 'in_use') && <p>{prototypeMappings.filter(item => item.physicalUsage === 'in_use').map(item => `Port${item.portNumber} · გამოიყენება`).join(' · ')}</p>}</section>
    </div>
    {(data.connectionSheets??data.connectionSheetIndex)?.some(sheet => sheet.node.kind === 'ap' && sheet.node.id === id) && <div className="inspector-actions"><button className="button button-primary" type="button" onClick={() => navigate({ view: 'splice', nodeKind: 'ap', nodeId: id })}>შეერთებების სქემა</button></div>}
    {profile && <InspectorSection title="პორტების მიმართულებები"><div className="ap-direction-groups">{profile.directionGroups.map(group => <div className={`is-${group.role}`} key={group.id}><strong>{group.startPort}–{group.endPort}</strong><span>{group.labelKa}</span><small>{humanizeSegmentTokens(data, group.direction)}</small></div>)}</div></InspectorSection>}
    {id === '51' && <div className="lineage-annotation"><strong>შენიშვნა: OTDR</strong></div>}
    <InspectorSection title="24 პორტი"><div className="workspace-port-grid is-ap is-flow">{Array.from({ length: ap.portCount }, (_, index) => index + 1).map(number => { const mapping = prototypeMappings.find(item => item.portNumber === number); const flow = flows.find(item => item.portNumber === number); const status = portOperationalStatus(data, 'ap', ap.id, number); return <button title={flow ? `Port${number} · ${apRoleKa(flow.primaryRole)} · F${String(flow.incoming?.fiberNumber ?? number).padStart(2, '0')} · ${status}` : `Port${number} · ${status}`} className={`${ranges.some(range => number >= range.startPort && number <= range.endPort) ? 'has-range ' : ''}${flow ? `role-${flow.primaryRole} usage-${flow.physicalUsage} ` : mapping ? `usage-${mapping.physicalUsage} ` : ''}port-status-${status}`} type="button" key={number} onClick={() => onSelect({ type: 'port', ownerType: 'ap', ownerId: ap.id, number })}><span>{number}</span>{flow?.incoming?.fiberColor?.hex && <i style={{ backgroundColor: flow.incoming.fiberColor.hex }} aria-label={`Fiber color ${colorKa(flow.incoming.fiberColor)}`} />}{flow && <small>F{String(flow.incoming?.fiberNumber ?? number).padStart(2, '0')} · {apRoleKa(flow.primaryRole)}</small>}<em>{status === 'in_use' ? 'გამოიყენება' : status === 'unused' ? 'არ გამოიყენება' : status === 'reserved' ? 'დაჯავშნილია' : status === 'unavailable' ? 'მიუწვდომელია' : 'უცნობია'}</em></button>; })}</div><div className="ap-port-legend"><span className="status-in-use">● გამოიყენება</span><span className="status-unused">○ არ გამოიყენება</span><span className="status-reserved">◆ დაჯავშნილია</span><span className="status-unavailable">■ მიუწვდომელია</span><span className="status-unknown">□ უცნობია</span><span><i /> ფიზიკური ფერი</span></div></InspectorSection>
    <InspectorDisclosure><p>{summary.path.join(' → ')}</p>{profile?.notes.map(note => <p key={note}>{note}</p>)}{ranges.map(range => <p key={range.id}>ძველი ჩანაწერი: პორტები {range.startPort}–{range.endPort} → {range.destination.type === 'named_direction' ? range.destination.name : range.destination.label}</p>)}<InspectorDisclosure title="წყარო და ტექნიკური დეტალები" technical><p>შიდა გაგრძელების ოპერაცია დაუდგენელია.</p><FullDetailButton navigate={navigate} route={{ view: 'ap', id }}>სრული ტექნიკური ჩანაწერი</FullDetailButton></InspectorDisclosure></InspectorDisclosure>
  </>;
}

function ClosureInspector({ data, route, id, onSelect, navigate }: { data: Inventory; route: CableRoute; id: string; onSelect: (selection: WorkspaceSelection) => void; navigate: (route: Route) => void }) {
  const closure = data.closures.find(item => item.id === id);
  if (!closure) return <p>Closure not found.</p>;
  const summary = closureOperatorSummary(data, id);
  const cables = attachedCables(data, { kind: 'closure', id });
  const rows = cables.flatMap(cable => rowsForClosure(data, id, cable.id));
  const accepted = rows.filter(row => row.connection && relationshipState(row.connection) === 'accepted').length;
  const candidate = rows.filter(row => row.connection && relationshipState(row.connection) === 'candidate').length;
  const unresolved = rows.filter(row => !row.connection).length;
  const routeNode = (data.cableRoutes ?? []).flatMap(item => item.nodes).find(node => node.asset?.kind === 'closure' && node.asset.id === id);
  const treatment = routeNode?.treatment && routeNode.treatment !== 'unknown' ? `${routeNode.treatment.replaceAll('_', ' ')} · ${routeNode.treatmentVerification.replaceAll('_', ' ')}` : 'Unresolved from current source';
  const annotations = (data.sourceAnnotations ?? []).filter(item => item.associatedAssets.some(asset => asset.kind === 'closure' && asset.id === id));
  const continuationForks = closureContinuationForks(data, id);
  const lineageTransitions = (data.currentFiberLineages ?? data.fiberLineages ?? []).flatMap(lineage => lineage.transitions.filter(item => item.node.kind === 'closure' && item.node.id === id).map(item => ({ lineage, item })));
  const changedTransitions = lineageTransitions.filter(({ item }) => item.numberChanged || item.tubeChanged || item.fiberColorChanged);
  const terminatingFibers = (data.nodeFiberTransitions ?? []).filter(item => item.active && item.node.kind === 'closure' && item.node.id === id && item.transitionType === 'intentional_termination').length;
  const incomingText = humanizeSegmentTokens(data, summary.incoming[0]?.replace(/^(C\d+) ← (SC\d+)$/, '$1 · $2-დან') ?? '');
  const incomingLegacyId = summary.incoming[0]?.match(/^C(\d+)/)?.[1];
  const incomingCable = incomingLegacyId ? data.cables.find(item => item.legacyCableId === incomingLegacyId) : undefined;
  const relevantForks = continuationForks.filter(item => !incomingCable || item.sourceSegmentId === incomingCable.id);
  const simpleBranchLabel = (label: string) => humanizeSegmentTokens(data, label);
  return <>
    <div className="inspector-heading"><button className="inspector-back" type="button" onClick={() => onSelect({ type: 'route', id: route.id })}><ArrowLeft size={15} /> მარშრუტი</button><span>ქურო</span><h2>SC{id}</h2></div>
    <div className="inspector-story">
      {!!incomingText && <section><span>შემოდის</span><strong>{incomingText}</strong></section>}
      {!!summary.mainContinuation && <section><span>მთავარი გზა</span><strong>{humanizeSegmentTokens(data, summary.mainContinuation)}</strong></section>}
      {summary.branches.length > 0 && <section><span>განშტოება</span>{summary.branches.map(branch => <button className="story-link" type="button" key={branch.id} onClick={() => onSelect({ type: 'branch', id: branch.id })}>{simpleBranchLabel(branch.label)}</button>)}</section>}
    </div>
    <div className="inspector-actions"><button className="button button-primary" type="button" onClick={() => navigate({ view: 'splice', nodeKind: 'closure', nodeId: id })}>შეერთებების სქემა</button><button className="button button-quiet" type="button" onClick={() => navigate({ view: 'splice', nodeKind: 'closure', nodeId: id })}>ფოტოები</button></div>
    {closure.sourceSymbolEvidence && <div className="closure-source-facts"><WorkspaceFact label="Coordinates">{closure.sourceSymbolEvidence.coordinates.rawCoordinateText.trim()}</WorkspaceFact><WorkspaceFact label="External GIS reference">{closure.sourceSymbolEvidence.externalReferences.map(reference => reference.rawText?.trim() ?? `${reference.system} ${reference.externalId}`).join(' · ')}</WorkspaceFact></div>}
    {id === '225' && <div className="inspector-callout"><strong>ჟილების შედეგი</strong><p>4 ჟილა → AP54 · 4 ჟილა → AP53 · 16 ჟილა მთავრდება SC225-ზე</p></div>}
    {id !== '225' && terminatingFibers > 0 && <p className="closure-unchanged">{terminatingFibers} ჟილა ამ ქუროში მთავრდება</p>}
    {relevantForks.length > 0 ? <p className="closure-unchanged">{relevantForks.length} მიმართულება · {lineageTransitions.length} ზუსტი გადასვლა · {changedTransitions.length} ნომრის/ფერის ცვლილება</p> : summary.incoming.length > 0 && summary.mainContinuation && <p className="closure-unchanged">ჟილები ამ მონაკვეთში უცვლელად აგრძელებენ</p>}
    <InspectorDisclosure title="ქუროს დეტალები"><div className="workspace-fact-grid"><WorkspaceFact label="მოდელი">{closure.model || 'Visio-ში არ არის'}</WorkspaceFact><WorkspaceFact label="მონტაჟი">{closure.mounting || 'Visio-ში არ არის'}</WorkspaceFact><WorkspaceFact label="კოორდინატები">{closure.coordinatesRaw || 'Visio-ში არ არის'}</WorkspaceFact><WorkspaceFact label="დამუშავება">{treatment}</WorkspaceFact></div>{annotations.map(item => <div className="annotation-summary" key={item.id}><strong>{item.normalizedSummary ?? item.rawText}</strong></div>)}<InspectorDisclosure title="წყარო და ტექნიკური დეტალები" technical><div className="connection-summary"><span><strong>{accepted}</strong> მიღებული</span><span><strong>{candidate}</strong> სავარაუდო</span><span><strong>{unresolved}</strong> დაუკავშირებელი</span></div><details className="inspector-ledger"><summary>ჟილების კავშირები</summary>{rows.slice(0, 80).map(row => <div className="inspector-connection-row" key={row.key}><span>C{findCable(data, row.cableId)?.legacyCableId}/F{String(row.fiber).padStart(2, '0')}</span><strong>{row.other ? row.other.kind === 'fiber' ? `C${findCable(data, row.other.cableId)?.legacyCableId}/F${String(row.other.fiber).padStart(2, '0')}` : row.other.kind === 'port' ? `Port ${row.other.port}` : typedAssetLabel(row.other.asset) : 'გაგრძელება დაუდგენელია'}</strong></div>)}</details><FullDetailButton navigate={navigate} route={{ view: 'closure', id }}>სრული ტექნიკური ჩანაწერი</FullDetailButton></InspectorDisclosure></InspectorDisclosure>
  </>;
}

function BranchInspector({ data, route, id, onSelect }: { data: Inventory; route: CableRoute; id: string; onSelect: (selection: WorkspaceSelection) => void }) {
  const routes = relatedWorkspaceRoutes(data, route);
  const operator = routes.flatMap(item => orderedCableRouteNodes(item).flatMap(node => routeNodeOperatorBranches(data, item, node.id).map(branch => ({ branch, route: item, node })))).find(item => item.branch.id === id || item.branch.id.split('+').includes(id) || id.split('+').some(part => item.branch.id.includes(part)));
  const rawCandidates = routes.flatMap(item => item.branches.map(branch => ({ branch, route: item }))).filter(item => item.branch.id === id || id.includes(item.branch.id));
  const raw = rawCandidates.find(item => item.branch.destinationRole === 'external_direction') ?? rawCandidates[0];
  const linked = id.startsWith('linked-') ? routes.find(item => item.id === id.slice('linked-'.length)) : undefined;
  const segmentIds = raw?.branch.segmentIds ?? (linked ? orderedCableRouteLegs(linked).flatMap(leg => leg.segmentId ? [leg.segmentId] : []) : []);
  const sourceNode = operator?.node.label ?? raw?.route.nodes.find(node => node.id === raw.branch.fromNodeId)?.label ?? linked?.origin.label ?? 'Source unresolved';
  const label = operator?.branch.label ?? raw?.branch.targetDirectionText ?? raw?.branch.sourceLabel ?? linked?.displayName ?? id;
  const boundary = raw?.branch.destination?.kind === 'boundary' ? data.externalBoundaries?.find(item => item.id === raw.branch.destination!.id) : undefined;
  const currentDocument = boundary ? data.sourceDocuments?.find(item => item.id === boundary.currentSourceDocumentId) : undefined;
  return <>
    <div className="inspector-heading"><button className="inspector-back" type="button" onClick={() => onSelect({ type: 'route', id: route.id })}><ArrowLeft size={15} /> Route</button><span>Route branch</span><h2>{label}</h2><p>Leaves the main route at {sourceNode}</p></div>
    <div className="workspace-fact-grid"><WorkspaceFact label="Source node">{sourceNode}</WorkspaceFact><WorkspaceFact label="Known segment">{segmentIds.map(segmentId => findCable(data, segmentId) ? getSegmentDisplayName(findCable(data, segmentId)!, data) : segmentId).join(' · ') || 'None established'}</WorkspaceFact><WorkspaceFact label="Boundary / destination">{raw?.branch.destination ? typedAssetLabel(raw.branch.destination) : linked?.destination.label ?? 'External direction'}</WorkspaceFact><WorkspaceFact label="Connectivity">{raw?.branch.destinationRole === 'external_direction' ? 'Not proven optical connectivity' : 'Physical route context only'}</WorkspaceFact></div>
    {boundary && <div className="external-continuation-card"><FileText size={20} /><div><span>External documentation continuation</span><strong>Current document ends here for this direction.</strong><p>Continues in another regional Visio / Source Network Document.</p><dl><div><dt>Current document</dt><dd>{currentDocument?.title ?? boundary.sourceFile}</dd></div><div><dt>Direction key</dt><dd>{boundary.externalDirectionKey}</dd></div><div><dt>Continuation status</dt><dd>{boundary.status.replaceAll('_', ' ')}</dd></div><div><dt>Next document</dt><dd>{boundary.nextSourceDocumentId ?? 'Not yet imported or identified'}</dd></div></dl><button type="button" disabled={!boundary.linkedRouteId} onClick={() => boundary.linkedRouteId && onSelect({ type: 'route', id: boundary.linkedRouteId })}>Open continuation · {boundary.linkedRouteId ? 'linked' : 'document not imported'}</button><button type="button" onClick={() => onSelect({ type: 'boundary', id: boundary.id })}>View documentation boundary</button></div></div>}
    {!!segmentIds.length && <InspectorSection title="Related Cable Segments">{segmentIds.map(segmentId => { const segment = findCable(data, segmentId); return <button className="inspector-list-row" type="button" key={segmentId} onClick={() => onSelect({ type: 'segment', id: segmentId })}><Cable size={17} /><span><strong>{segment ? getSegmentDisplayName(segment, data) : segmentId}</strong><small>{segment ? `Legacy C${segment.legacyCableId}` : ''}</small></span></button>; })}</InspectorSection>}
    <Clarification items={['Exact physical operation at source closure', 'Optical continuity through the branch', raw?.branch.destinationRole === 'external_direction' ? 'Continuation beyond documentation boundary' : 'Exact fiber mappings']} />
  </>;
}

function BoundaryInspector({ data, route, id, onSelect, navigate }: { data: Inventory; route: CableRoute; id: string; onSelect: (selection: WorkspaceSelection) => void; navigate: (route: Route) => void }) {
  const boundary = data.externalBoundaries?.find(item => item.id === id) ?? (id === 'route-destination' ? data.externalBoundaries?.find(item => route.destination.label.includes(item.likelyContinuationName ?? item.directionLabel) || item.directionLabel.includes('Lentekhi')) : undefined);
  const conflict = data.aggregations.find(item => item.id === 'LENTEKHI-CONFLICT');
  const likelyContinuation = boundary?.likelyContinuationName ?? (route.destination.state === 'unresolved' ? route.destination.candidateAssetLabel ?? 'Unresolved' : route.destination.label);
  const currentDocument = boundary ? data.sourceDocuments?.find(item => item.id === boundary.currentSourceDocumentId) : undefined;
  return <>
    <div className="inspector-heading"><button className="inspector-back" type="button" onClick={() => onSelect({ type: 'route', id: route.id })}><ArrowLeft size={15} /> Route</button><span>Documentation boundary</span><h2>{boundary?.directionLabel ?? route.destination.label}</h2><p>{boundary?.status === 'conflicting' || route.destination.state === 'unresolved' ? 'Identity unresolved / conflicting' : 'Documented boundary'}</p></div>
    <div className="workspace-fact-grid"><WorkspaceFact label="Originating route">{route.displayName}</WorkspaceFact><WorkspaceFact label="Likely continuation">{likelyContinuation}</WorkspaceFact><WorkspaceFact label="Current source document">{currentDocument?.title ?? boundary?.sourceFile ?? 'Current package'}</WorkspaceFact><WorkspaceFact label="Source page">{boundary?.sourcePage ?? route.source.page}</WorkspaceFact><WorkspaceFact label="Continuation status">{boundary?.status.replaceAll('_', ' ') ?? 'unresolved document'}</WorkspaceFact><WorkspaceFact label="Next source document">{boundary?.nextSourceDocumentId ?? 'Not yet imported or identified'}</WorkspaceFact><WorkspaceFact label="Linked route">{boundary?.linkedRouteId ?? 'Not linked'}</WorkspaceFact><WorkspaceFact label="Canonical endpoint asset">{boundary?.boundaryAssetId ?? 'Unresolved'}</WorkspaceFact></div>
    {boundary?.id === 'BOUNDARY-SC207' && <div className="external-continuation-card"><FileText size={20} /><div><span>Legitimate external continuation</span><strong>Current document ends here for this direction.</strong><p>The network continues toward Alpana–Tvishi–Ambrolauri in another regional document. This is outside the current package, not a failed import.</p><button type="button" disabled>Open continuation · document not imported</button></div></div>}
    {conflict && <div className="inspector-callout is-conflict"><strong>Lentekhi identity conflict</strong><p>AGG6 heading and property ID5 are both preserved. No winner is selected.</p></div>}
    {conflict && <FullDetailButton navigate={navigate} route={{ view: 'aggregation', id: conflict.id }}>Inspect both claims</FullDetailButton>}
    <Clarification items={['Canonical aggregation identity', 'Exact C184 endpoint', 'Continuation outside this source page']} />
  </>;
}

function NetworkNodeInspector({ data, route, id, onSelect, navigate }: { data: Inventory; route: CableRoute; id: string; onSelect: (selection: WorkspaceSelection) => void; navigate: (route: Route) => void }) {
  const node = data.networkNodes?.find(item => item.id === id);
  if(node?.assetType==='ap') return <SourceBAPInspector data={data} id={id} onSelect={onSelect} navigate={navigate}/>;
  const ref: AssetRef = { kind: 'network_node', id };
  const cables = data.cables.filter(cable => sameAsset(cable.endpointA, ref) || sameAsset(cable.endpointB, ref)).sort((a,b) => Number(a.legacyCableId)-Number(b.legacyCableId));
  const isClosure = node?.assetType === 'closure';
  const displayName = node?.displayName ?? (cables.length === 1 ? `Endpoint ${id}` : `Node ${id}`);
  const transitionCount = (data.nodeFiberTransitions ?? []).filter(item => item.active && sameAsset(item.node, ref)).length;
  return <>
    <div className="inspector-heading"><button className="inspector-back" type="button" onClick={() => onSelect({ type: 'route', id: route.id })}><ArrowLeft size={15} /> ქსელი</button><span>{isClosure ? 'Source-symbol certified Closure' : 'Neutral physical endpoint'}</span><h2>{displayName}</h2><p>{isClosure ? 'ქურო · Closure' : 'Physical node · equipment type unknown'}</p></div>
    {node?.closureEvidence && <div className="closure-source-facts"><WorkspaceFact label="Coordinates">{node.closureEvidence.coordinates.rawCoordinateText.trim()}</WorkspaceFact><WorkspaceFact label="External GIS reference">{node.closureEvidence.externalReferences.map(reference => reference.rawText?.trim() ?? `${reference.system} ${reference.externalId}`).join(' · ')}</WorkspaceFact></div>}
    <div className="workspace-fact-grid"><WorkspaceFact label="Source endpoint token">{node?.sourceEndpointTokens.join(', ') ?? id}</WorkspaceFact><WorkspaceFact label="Equipment type">{isClosure ? 'ქურო · Closure' : 'დაუდგენელია'}</WorkspaceFact><WorkspaceFact label="Connected Cables">{cables.length}</WorkspaceFact><WorkspaceFact label="Exact local Fiber transitions">{transitionCount}</WorkspaceFact></div>
    {isClosure && <div className="inspector-actions"><button className="button button-primary" type="button" onClick={() => navigate({ view: 'splice', nodeKind: 'network_node', nodeId: id })}>შეერთებების სქემა</button></div>}
    {id === '207' && <p className="notice notice-success">BOUNDARY-SC207 შენარჩუნებულია ისტორიულ provenance-ად. აქტიური ფიზიკური კვანძი ახლა SC207 Closure-ად არის დადასტურებული C151-სა და C152-ს შორის.</p>}
    <InspectorSection title="დაკავშირებული Cable-ები">{cables.map(cable => <button className="inspector-list-row" key={cable.id} type="button" onClick={() => onSelect({ type: 'segment', id: cable.id })}><Cable size={16} /><span><strong>{cableDisplayName(cable, data)}</strong><small>{cable.fiberCount}F · Legacy C{cable.legacyCableId}</small></span></button>)}</InspectorSection>
    <InspectorDisclosure title="წყარო და ტექნიკური მტკიცებულება" technical><p>{node?.closureEvidence?.sourceRepresentation.source.file ?? node?.source.file ?? 'Source endpoint record'} · {node?.closureEvidence?.sourceRepresentation.source.page ?? node?.source.page ?? 'Page not recorded'}</p>{node?.closureEvidence && <><p>Grammar: {node!.closureEvidence!.grammarId} · Master {node!.closureEvidence!.sourceRepresentation.masterId} / Shape {node!.closureEvidence!.sourceRepresentation.masterShapeId} · root Shape {node!.closureEvidence!.sourceRepresentation.rootShapeId} · child Shapes {node!.closureEvidence!.sourceRepresentation.childShapeIds.join(', ')}.</p><p>GIS code is not unique in this source: {node!.closureEvidence!.externalReferences[0]?.externalId} is repeated across matched Closure blocks. CRS/datum: {node!.closureEvidence!.coordinates.crs ?? 'unknown'} · field verified: no.</p></>}<p>{node?.notes.join(' ')}</p><p>Current workspace context: {route.displayName}</p></InspectorDisclosure>
  </>;
}

export function ContextInspector({ data, route, selection, onSelect, navigate, onClose, networkMode, footer }: { data: Inventory; route: CableRoute; selection: WorkspaceSelection; onSelect: (selection: WorkspaceSelection) => void; navigate: (route: Route) => void; onClose: () => void; networkMode: boolean; footer?: ReactNode }) {
  let content: ReactNode;
  if (selection.type === 'route') content = networkMode ? <CombinedNetworkInspector data={data} route={route} onSelect={onSelect} /> : <RouteOverviewInspector data={data} route={route} onSelect={onSelect} />;
  else if (selection.type === 'segment') content = <SegmentInspector data={data} route={route} id={selection.id} onSelect={onSelect} navigate={navigate} />;
  else if (selection.type === 'tube') content = <TubeInspector data={data} route={route} cableId={selection.cableId} number={selection.number} onSelect={onSelect} />;
  else if (selection.type === 'fiber') content = <FiberInspector data={data} route={route} cableId={selection.cableId} number={selection.number} onSelect={onSelect} navigate={navigate} />;
  else if (selection.type === 'aggregation') content = <AggregationInspector data={data} route={route} id={selection.id} onSelect={onSelect} navigate={navigate} />;
  else if (selection.type === 'port') content = <PortInspector data={data} route={route} selection={selection} onSelect={onSelect} navigate={navigate} />;
  else if (selection.type === 'ap') content = <APInspector data={data} route={route} id={selection.id} onSelect={onSelect} navigate={navigate} />;
  else if (selection.type === 'closure') content = <ClosureInspector data={data} route={route} id={selection.id} onSelect={onSelect} navigate={navigate} />;
  else if (selection.type === 'branch') content = <BranchInspector data={data} route={route} id={selection.id} onSelect={onSelect} />;
  else if (selection.type === 'boundary') content = <BoundaryInspector data={data} route={route} id={selection.id} onSelect={onSelect} navigate={navigate} />;
  else if (selection.type === 'network_node') content = <NetworkNodeInspector data={data} route={route} id={selection.id} onSelect={onSelect} navigate={navigate} />;
  else content = <RouteOverviewInspector data={data} route={route} onSelect={onSelect} />;
  return <aside className={`context-inspector${selection.type === 'route' ? ' is-overview' : ' is-open'}`} aria-label="Context Inspector" data-inspected={workspaceSelectionKey(selection)} tabIndex={0}><button className="inspector-mobile-close" type="button" aria-label="Close inspector" onClick={onClose}><X size={18} /></button>{content}{footer}</aside>;
}

function RouteInventory({ data, route, onSelect }: { data: Inventory; route: CableRoute; onSelect: (selection: WorkspaceSelection) => void }) {
  const counts = routeInventoryCounts(data, route);
  return <details className="route-inventory"><summary>Route inventory <span>{counts.segmentIds.size} segments · {counts.closureIds.size} closures · {counts.apIds.size} APs</span></summary><div className="route-inventory-groups">
    <section><h3>Cable Segments</h3>{[...counts.segmentIds].map(id => { const cable = findCable(data, id); return cable && <button type="button" key={id} onClick={() => onSelect({ type: 'segment', id })}>{getSegmentDisplayName(cable, data)}<small>Legacy C{cable.legacyCableId}</small></button>; })}</section>
    <section><h3>Closures</h3>{[...counts.closureIds].map(id => <button type="button" key={id} onClick={() => onSelect({ type: 'closure', id })}>SC{id}</button>)}</section>
    <section><h3>Access Points</h3>{[...counts.apIds].map(id => { const ap = data.accessPoints.find(item => item.id === id); return <button type="button" key={id} onClick={() => onSelect({ type: 'ap', id })}>AP{id}<small>{ap?.name}</small></button>; })}</section>
    <section><h3>Aggregations</h3>{[...counts.aggregationIds].map(id => { const aggregation = data.aggregations.find(item => item.id === id); return <button type="button" key={id} onClick={() => onSelect({ type: 'aggregation', id })}>{id === LENTEKHI_AGGREGATION_ID ? 'ლენტეხი' : `AGG${id}`}<small>{aggregation?.name}</small></button>; })}</section>
    <section><h3>External boundaries</h3>{(data.externalBoundaries ?? []).filter(boundary => boundary.id !== 'BOUNDARY-LENTEKHI-AGG').map(boundary => <button type="button" key={boundary.id} onClick={() => onSelect({ type: 'boundary', id: boundary.id })}>Ambrolauri direction<small>{boundary.status.replaceAll('_', ' ')}</small></button>)}</section>
  </div></details>;
}

export function RouteWorkspace({ data, navigate, id, selection: selectionValue, collapsed: collapsedValue, workspaceState }: ViewProps & { id: string; selection?: string; collapsed?: string[]; workspaceState?: WorkspaceRoute }) {
  const found = findCableRoute(data, id);
  const route = found ? parentWorkspaceRoute(data, found) : undefined;
  const [query, setQuery] = useState(''), [showBranches, setShowBranches] = useState(true), [managerMode, setManagerMode] = useState(true);
  const diagramMode = workspaceState?.context ?? 'network';
  const [compactViewport,setCompactViewport]=useState(()=>typeof window!=='undefined'&&window.innerWidth<=760);
  useEffect(()=>{const update=()=>setCompactViewport(window.innerWidth<=760);window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update);},[]);
  const [expandedSegmentId, setExpandedSegmentId] = useState<string | null>(null), [expandedTube, setExpandedTube] = useState<string | null>(null);
  const topologyRef = useRef<HTMLDivElement>(null);
  const parsed = parseWorkspaceSelection(selectionValue);
  const mobileCollapsedNodes = useMemo(() => {
    if (!compactViewport) return [];
    return buildNetworkTopologyProjection(data).nodes.filter(node => node.degree > 1).map(node => node.key).sort();
  }, [data,compactViewport]);
  const collapsedNodes = collapsedValue ?? mobileCollapsedNodes;
  const selection: WorkspaceSelection = parsed ?? (route ? { type: 'route', id: route.id } : { type: 'route', id });
  const currentSegmentId = selection.type === 'segment' ? selection.id : selection.type === 'fiber' || selection.type === 'tube' ? selection.cableId : undefined;
  const results = useMemo(() => route ? routeScopedSearch(data, route, query, currentSegmentId) : [], [data, route, query, currentSegmentId]);
  const activeLineage = selection.type === 'fiber' ? lineageForFiber(data, selection.cableId, selection.number) : undefined;
  useEffect(() => {
    const key = workspaceSelectionKey(selection);
    const bindings=selection.type==='port'?(data.portTopologyBindings??[]).filter(b=>b.ownerType===selection.ownerType&&b.ownerId===selection.ownerId&&b.portNumber===selection.number):[];
    const segmentId=selection.type==='fiber'?selection.cableId:bindings.length===1?bindings[0].segmentId:selection.type==='segment'?selection.id:null;
    const segmentKey=segmentId?`segment:${segmentId}`:null;
    const element = topologyRef.current?.querySelector<HTMLElement>(`[data-workspace-key="${CSS.escape(key)}"]`) ?? (segmentKey ? topologyRef.current?.querySelector<HTMLElement>(`[data-workspace-segment-key="${CSS.escape(segmentKey)}"]`) : null);
    if (element) element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  }, [selectionValue, expandedSegmentId, expandedTube]);
  useEffect(() => {
    if (selection.type === 'tube') {
      setExpandedSegmentId(selection.cableId);
      setExpandedTube(`${selection.cableId}:${selection.number}`);
    } else if (selection.type === 'fiber') {
      const fiber = findFiber(data, selection.cableId, selection.number);
      const tube = fiber ? fiberTube(data, fiber) : undefined;
      const number = tube?.number ?? tube?.proposedNumber;
      setExpandedSegmentId(selection.cableId);
      if (number != null) setExpandedTube(`${selection.cableId}:${number}`);
    }
  }, [data, selectionValue]);
  if (!route) return <div className="workspace-missing"><h1>Network workspace not found</h1><button className="button" onClick={() => navigate({ view: 'dashboard' })}>Dashboard</button></div>;
  const state=workspaceState??{view:'route',id,selection:selectionValue,collapsed:collapsedValue};
  const target=apWorkspaceTarget(data,state);
  if(target)return <APWorkspace data={data} navigate={navigate} route={route} state={state} target={target} renderInspector={(inspected,onSelect)=><ContextInspector data={data} route={route} selection={inspected} onSelect={onSelect} navigate={navigate} networkMode onClose={()=>{}}/>}/>;
  const inspected = parseWorkspaceSelection(state.inspect) ?? selection;
  const select = (next: WorkspaceSelection) => {
    if (next.type === 'route') {
      navigate({ ...state, selection: selection.type === 'route' ? undefined : workspaceSelectionKey(selection), inspect: workspaceSelectionKey({type:'route',id:route.id}), target: undefined, collapsed: collapsedNodes });
      return;
    }
    const key = workspaceSelectionKey(next);
    const changes = next.type === 'fiber' || next.type === 'port'
      ? { selection: key, inspect: key, target: undefined }
      : { inspect: key };
    navigate({ ...state, ...changes, collapsed: collapsedNodes });
  };
  const openDestination = () => {
    if (inspected.type !== 'ap' && !(inspected.type === 'port' && inspected.ownerType === 'ap') && !(inspected.type === 'network_node' && data.networkNodes?.some(node => node.id === inspected.id && node.assetType === 'ap'))) return;
    const key = workspaceSelectionKey(inspected);
    navigate({ ...state, target: key, selection: key, inspect: key, collapsed: collapsedNodes });
  };
  const chooseResult = (key: string) => { const next = parseWorkspaceSelection(key); if (next) { select(next); setQuery(''); } };
  return <div className="route-workspace is-manager-mode">
    <header className="route-workspace-header">
      <h1>ქსელის ტოპოლოგია</h1>
      <div className="route-workspace-tools"><button type="button" className={diagramMode==='network'?'is-active':''} aria-pressed={diagramMode==='network'} onClick={()=>navigate({...state,context:'network'})}>მთლიანი ქსელი</button><button type="button" className={diagramMode==='route'?'is-active':''} aria-pressed={diagramMode==='route'} onClick={()=>navigate({...state,context:'route'})}>ცაგერი–ლენტეხის საკაბელო მარშრუტი</button></div>
    </header>
    <div className="route-workspace-body">
      <section className="route-canvas" ref={topologyRef} aria-label="Interactive route schematic">
        {diagramMode === 'route' && activeLineage && <div className="route-path-legend" data-active-lineage={activeLineage.id}><span><i className="is-physical" /> ფიზიკური საკაბელო მარშრუტი</span><span><i className="is-fiber" /> არჩეული ჟილის საკუთარი გზა</span></div>}
        {diagramMode === 'network' ? <><NetworkTopologyCanvas data={data} selection={inspected} opticalSelection={selection.type === 'fiber' || selection.type === 'port' ? selection : undefined} collapsedKeys={collapsedNodes} onSelect={select} onCollapsedChange={keys => navigate({...state,collapsed:keys})} />{mobileCollapsedNodes.length>0&&collapsedValue===undefined&&<p className="network-mobile-fold-note">მობილურზე მთავარი კვანძები დაკეცილია რუკის ორიენტირებისთვის. ქსელის გასაგრძელებლად გამოიყენეთ „გაშლა“.</p>}</> : <><RouteSchematic data={data} route={route} selection={selection} onSelect={select} showBranches={showBranches} expandedSegmentId={expandedSegmentId} expandedTube={expandedTube} onToggleExpanded={segmentId => setExpandedSegmentId(current => { const closing = current === segmentId; if (closing) setExpandedTube(null); return closing ? null : segmentId; })} onExpandTube={key => setExpandedTube(current => current === key ? null : key)} /><RouteInventory data={data} route={route} onSelect={select} /></>}
      </section>
      <ContextInspector data={data} route={route} selection={inspected} onSelect={select} navigate={navigate} networkMode={diagramMode === 'network'} onClose={()=>navigate({...state,inspect:workspaceSelectionKey({type:'route',id:route.id})})} footer={(inspected.type === 'ap' || inspected.type === 'port' && inspected.ownerType === 'ap' || inspected.type === 'network_node' && data.networkNodes?.some(node => node.id === inspected.id && node.assetType === 'ap')) ? <button className="route-destination-action" type="button" onClick={openDestination}>AP სამუშაო სივრცედ გახსნა</button> : undefined} />
    </div>
  </div>;
}
