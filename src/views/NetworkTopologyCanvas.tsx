import { createContext,useContext,useMemo } from 'react';
import { ChevronDown, ChevronRight, CircleDot, Network } from 'lucide-react';
import type { Inventory } from '../domain/types';
import { buildNetworkTopologyProjection, buildTopologyTree, type NetworkTopologyProjection, type PhysicalTopologyEdge, type TopologyTreeNode } from '../domain/networkTopology';
import { cableDisplayName, typedAssetLabel } from '../domain/network';
import type { WorkspaceSelection } from '../domain/routeWorkspace';
import { workspaceSelectionKey } from '../domain/routeWorkspace';
import { traceFiberThroughTransitions } from '../domain/engineerQuery';
const MembershipContext=createContext<ReadonlyMap<string,number[]>|null>(null);

/** Open physical ancestors needed to reveal the selected optical legs. This
 * changes presentation only; it never adds an optical edge to the selection. */
export function selectedTopologyExpansion(projection:NetworkTopologyProjection,opticalEdges:ReadonlySet<string>,selectedNodeKey?:string){
 const targets=new Set(projection.edges.filter(e=>opticalEdges.has(e.id)).flatMap(e=>[e.from,e.to]));
 if(selectedNodeKey)targets.add(selectedNodeKey);
 const expanded=new Set<string>();
 const visit=(tree:TopologyTreeNode):boolean=>{const childMatches=tree.children.map(child=>visit(child.node));const found=targets.has(tree.key)||childMatches.some(Boolean);if(found)expanded.add(tree.key);return found;};
 for(const component of projection.components)visit(buildTopologyTree(projection,component));
 return expanded;
}

function TopologyBranch({ data, projection, tree, selectedKey, opticalEdges, onSelect, collapsed, onToggle }: { data: Inventory; projection: NetworkTopologyProjection; tree: TopologyTreeNode; selectedKey: string; opticalEdges: Set<string>; onSelect: (selection: WorkspaceSelection) => void; collapsed: Set<string>; onToggle: (key: string) => void }) {
  const node = projection.nodes.find(item => item.key === tree.key)!;
  const nodeSelection: WorkspaceSelection = node.ref.kind === 'closure' ? { type: 'closure', id: node.ref.id } : node.ref.kind === 'aggregation' ? { type: 'aggregation', id: node.ref.id } : node.ref.kind === 'ap' ? { type: 'ap', id: node.ref.id } : node.ref.kind === 'odf' ? { type: 'odf', id: node.ref.id } : node.ref.kind === 'network_node' ? { type: 'network_node', id: node.ref.id } : { type: 'boundary', id: node.ref.id };
  const key = workspaceSelectionKey(nodeSelection);
  const sourceNode = node.ref.kind === 'network_node' ? data.networkNodes?.find(item => item.id === node.ref.id) : undefined;
  const cableIds = (data.cables.filter(cable => `${cable.endpointA.kind}:${cable.endpointA.id}` === node.key || `${cable.endpointB.kind}:${cable.endpointB.id}` === node.key).map(cable => cable.id));
  const closed = collapsed.has(tree.key), transitionCount = (data.nodeFiberTransitions ?? []).filter(t => t.active && t.node.kind === node.ref.kind && t.node.id === node.ref.id).length;
  const card = <div className={`network-node-card${selectedKey === key ? ' is-selected' : ''}${opticalEdges.size && [...opticalEdges].some(id => cableIds.includes(id)) ? ' has-optical-path' : ''}`} data-workspace-key={key}>
    <button type="button" className="network-node-main" onClick={() => onSelect(nodeSelection)}>{sourceNode?.assetType === 'closure' ? <CircleDot size={16} /> : <Network size={16} />}<span><strong>{node.label}</strong><small>{node.ref.kind === 'network_node' ? sourceNode?.assetType === 'closure' ? 'ქურო · Closure' : sourceNode?.assetType === 'ap' ? 'დაშვების წერტილი · AP' : 'ტიპი დაუდგენელია · Source endpoint' : typedAssetLabel(node.ref)} · {node.degree} დაკავშირებული Cable</small></span></button>
    {tree.children.length > 0 && <button className="network-node-collapse" type="button" aria-label={closed ? `${node.label} connections expand` : `${node.label} connections collapse`} onClick={() => onToggle(tree.key)}>{closed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}<span>{closed ? 'გაშლა' : 'დაკეცვა'} · {tree.children.length}</span></button>}
  </div>;
  return <li className="network-tree-node" data-node-key={tree.key}>
    {card}
    {tree.children.length > 1 && <div className="network-fork-overview" aria-label={`${node.label} physical Cable fork`}>{tree.children.map(({ edge, node: child }) => { const cable = data.cables.find(item => item.id === edge.cableId)!; return <button type="button" key={edge.id} onClick={() => onSelect({ type: 'segment', id: edge.cableId })}><span>{cableDisplayName(cable, data)}<small>Connected Cable · Legacy C{cable.legacyCableId} · {projection.nodes.find(item => item.key === child.key)?.label}</small></span><ChevronRight size={15} /></button>; })}</div>}
    {!closed && tree.children.length > 0 && <ul className="network-tree-children">{tree.children.map(({ edge, node: child }) => <li className="network-tree-edge" key={edge.id}>
      <CableCard data={data} edge={edge} selectedKey={selectedKey} optical={opticalEdges.has(edge.id)} onSelect={onSelect} />
      <TopologyBranch data={data} projection={projection} tree={child} selectedKey={selectedKey} opticalEdges={opticalEdges} onSelect={onSelect} collapsed={collapsed} onToggle={onToggle} />
    </li>)}</ul>}
  </li>;
}

function CableCard({ data, edge, selectedKey, optical, onSelect }: { data: Inventory; edge: PhysicalTopologyEdge; selectedKey: string; optical: boolean; onSelect: (selection: WorkspaceSelection) => void }) {
  const membership=useContext(MembershipContext),fibers=membership?.get(edge.cableId)??[];
  const cable = data.cables.find(item => item.id === edge.cableId)!;
  const key = `segment:${cable.id}`;
  const representations = cable.sourceRepresentations?.length ?? 1;
  return <div className={`network-cable-card${selectedKey === key ? ' is-selected' : ''}${optical ? ' is-optical-active' : ''}`} data-workspace-key={key} data-workspace-segment-key={key}>
    <span className="network-cable-connector" aria-hidden="true" />
    <button type="button" className="network-cable-main" onClick={() => onSelect({ type: 'segment', id: cable.id })}><strong>{cableDisplayName(cable, data)}</strong><small>Cable · {cable.fiberCount}F · Legacy C{cable.legacyCableId}{representations > 1 ? ` · ${representations} source representations` : ''}</small></button>
    <button type="button" className="network-cable-expand" aria-label={`${cableDisplayName(cable, data)} Fibers`} onClick={() => onSelect({ type: 'segment', id: cable.id })}>F</button>
    {!!fibers.length&&<div className="organization-member-legs" aria-label="ცნობილი გამოყენების ადგილობრივი ჟილები">{fibers.map(number=><button key={number} data-org-leg={`${cable.id}/F${number}`} onClick={()=>onSelect({type:'fiber',cableId:cable.id,number})}>F{String(number).padStart(2,'0')}</button>)}</div>}
  </div>;
}

function ComponentView({ data, projection, component, selectedKey, opticalEdges, onSelect, collapsed, onToggle }: { data: Inventory; projection: NetworkTopologyProjection; component: NetworkTopologyProjection['components'][number]; selectedKey: string; opticalEdges: Set<string>; onSelect: (selection: WorkspaceSelection) => void; collapsed: Set<string>; onToggle: (key: string) => void }) {
  const tree = useMemo(() => buildTopologyTree(projection, component), [projection, component]);
  const nonTree = component.edgeIds.filter(id => projection.crossLinkEdgeIds.includes(id));
  return <section className="network-component" data-component-id={component.id}>
    {component.id !== projection.components[0]?.id && <h3>სხვა ქსელური კომპონენტი</h3>}
    <ol className="network-topology-tree"><TopologyBranch data={data} projection={projection} tree={tree} selectedKey={selectedKey} opticalEdges={opticalEdges} onSelect={onSelect} collapsed={collapsed} onToggle={onToggle} /></ol>
    {!!nonTree.length && <details className="network-cross-links" open={nonTree.some(id=>opticalEdges.has(id))||undefined}><summary>დამატებითი ფიზიკური კავშირები · {nonTree.length}</summary>{nonTree.map(id => { const edge = projection.edges.find(item => item.id === id)!; return <CableCard key={id} data={data} edge={edge} selectedKey={selectedKey} optical={opticalEdges.has(id)} onSelect={onSelect} />; })}</details>}
  </section>;
}

export function NetworkTopologyCanvas({ data, selection, opticalSelection, useLegs,usageLabel,showAllComponents,collapsedKeys, onSelect, onCollapsedChange }: { data: Inventory; selection: WorkspaceSelection; opticalSelection?: WorkspaceSelection;useLegs?:Array<{segmentId:string;fiberNumber:number}>;usageLabel?:string;showAllComponents?:boolean; collapsedKeys: string[]; onSelect: (selection: WorkspaceSelection) => void; onCollapsedChange: (keys: string[]) => void }) {
  const projection = useMemo(() => buildNetworkTopologyProjection(data), [data]);
  const selectedKey = workspaceSelectionKey(selection);
  const pathSelection=opticalSelection??selection;
  const membership=useMemo(()=>{if(!useLegs)return null;const map=new Map<string,number[]>();for(const l of useLegs)map.set(l.segmentId,[...new Set([...(map.get(l.segmentId)??[]),l.fiberNumber])]);return map;},[useLegs]);
  const selectedPath=useMemo(()=>{
    if(pathSelection.type==='fiber')return traceFiberThroughTransitions(data,pathSelection.cableId,pathSelection.number);
    if(pathSelection.type==='port'){const bindings=(data.portTopologyBindings??[]).filter(b=>b.ownerType===pathSelection.ownerType&&b.ownerId===pathSelection.ownerId&&b.portNumber===pathSelection.number);if(bindings.length===1)return traceFiberThroughTransitions(data,bindings[0].segmentId,bindings[0].fiberNumber);}
    return null;
  },[data,pathSelection]);
  const opticalEdges = useMemo(() => {
    return membership?new Set(membership.keys()):new Set(selectedPath?.sides.flatMap(side => side.legs.map(leg => leg.cableId))??[]);
  }, [selectedPath,membership]);
  const collapsed=useMemo(()=>{const expanded=selectedTopologyExpansion(projection,opticalEdges,selectedKey);return new Set(collapsedKeys.filter(key=>!expanded.has(key)));},[projection,opticalEdges,selectedKey,collapsedKeys]);
  const selectedOtherComponent=projection.components.slice(1).some(c=>c.edgeIds.some(id=>opticalEdges.has(id))||c.nodeKeys.includes(selectedKey));
  const primary = projection.components[0];
  const nodeByKey = new Map(projection.nodes.map(node => [node.key, node]));
  const branchCableCount = projection.edges.filter(edge => (nodeByKey.get(edge.from)?.degree ?? 0) > 2 || (nodeByKey.get(edge.to)?.degree ?? 0) > 2).length;
  const isolatedCableCount = projection.components.filter(component => component.edgeIds.length === 1).reduce((count, component) => count + component.edgeIds.length, 0);
  const summary = <div className="network-topology-summary"><div><strong>{data.cables.length}</strong><span>აქტიური Cable</span></div><div><strong>{data.fibers.length.toLocaleString()}</strong><span>Fiber</span></div><div><strong>{projection.components.length}</strong><span>ფიზიკური კომპონენტი</span></div><div><strong>{data.sourceDocuments?.length ?? 0}</strong><span>წყარო დოკუმენტი · ერთი ქსელი</span></div></div>;
  const toggleCollapsed = (key: string) => { const next = new Set(collapsed); next.has(key) ? next.delete(key) : next.add(key); onCollapsedChange([...next].sort()); };
  const tree = (component: NetworkTopologyProjection['components'][number]) => <ComponentView key={component.id} data={data} projection={projection} component={component} selectedKey={selectedKey} opticalEdges={opticalEdges} onSelect={onSelect} collapsed={collapsed} onToggle={toggleCollapsed} />;
  return <MembershipContext.Provider value={membership}><div className="network-topology-view" data-network-topology="combined" data-current-path-signature={selectedPath?.signature}>
    {!!opticalEdges.size && <div className="route-path-legend"><span><i className="is-physical" /> ფიზიკური Cable კავშირი</span><span><i className="is-fiber" /> {usageLabel??'არჩეული Fiber-ის დადასტურებული გზა'}</span></div>}
    <div className="network-topology-main">{primary && tree(primary)}</div>
    {projection.components.slice(1).length > 0 && <details className="network-other-components" open={showAllComponents||selectedOtherComponent||undefined}><summary>სხვა ქსელური კომპონენტები · {projection.components.length - 1}</summary>{projection.components.slice(1).map(tree)}</details>}
    {!!projection.omittedCableIds.length && <p className="network-coverage-warning">ტოპოლოგიაში ვერ განთავსდა {projection.omittedCableIds.length} აქტიური Cable.</p>}
    <details className="network-engineering-coverage"><summary>ტოპოლოგიის დაფარვა და წყაროები</summary><p>აქტიური Cable: {data.cables.length} · ძირითადი კომპონენტი: {primary?.edgeIds.length ?? 0} · სხვა კომპონენტები: {projection.components.slice(1).map(item => item.edgeIds.length).join(', ') || '0'} · branch-node-სთან დაკავშირებული Cable: {branchCableCount} · იზოლირებული Cable: {isolatedCableCount} · გამოტოვებული: {projection.omittedCableIds.length}.</p><p>Route არის შერჩეული საინჟინრო კონტექსტი; ქსელის კვანძები და Cable კავშირები აქტიური canonical Inventory-დან მოდის.</p><div className="network-source-annotations"><strong>მიმართულების source annotations · topology edge არ არის</strong>{(data.sourceAnnotations ?? []).filter(annotation => annotation.category === 'direction').map(annotation => <p key={annotation.id}>{annotation.rawText} · {annotation.source.file} · scope: {annotation.scope} · {annotation.associationState}</p>)}</div>{nodeByKey.get('network_node:207') && <p>BOUNDARY-SC207 provenance შენარჩუნებულია SC207-ის ტექნიკურ ჩანაწერში; SC207 კვლავ იმავე C151↔C152 ფიზიკურ კვანძს აღნიშნავს.</p>}</details>
  </div></MembershipContext.Provider>;
}

export function transitionPathCableIds(data: Inventory, cableId: string, fiber: number) {
  return new Set(traceFiberThroughTransitions(data, cableId, fiber).sides.flatMap(side => side.legs.map(leg => leg.cableId)));
}
