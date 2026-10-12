import type { AssetRef, Inventory } from './types';
import { typedAssetLabel } from './network';

export interface PhysicalTopologyNode { key: string; ref: AssetRef; label: string; degree: number }
export interface PhysicalTopologyEdge { id: string; cableId: string; legacyCableId: string; from: string; to: string; fiberCount: number; routeRank: number | null; sourceFiles: string[] }
export interface PhysicalTopologyComponent { id: string; nodeKeys: string[]; edgeIds: string[]; rootKey: string }
export interface NetworkTopologyProjection { nodes: PhysicalTopologyNode[]; edges: PhysicalTopologyEdge[]; components: PhysicalTopologyComponent[]; treeEdgeIds: string[]; crossLinkEdgeIds: string[]; omittedCableIds: string[] }

export const topologyNodeKey = (ref: AssetRef) => `${ref.kind}:${ref.id}`;
const cmp = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
const edgeOrder = (a: PhysicalTopologyEdge, b: PhysicalTopologyEdge) => (a.routeRank ?? Number.MAX_SAFE_INTEGER) - (b.routeRank ?? Number.MAX_SAFE_INTEGER) || Number(a.legacyCableId) - Number(b.legacyCableId) || cmp(a.cableId, b.cableId);
const nodeLabel = (ref: AssetRef, degree: number, data: Inventory) => {
  if (ref.kind !== 'network_node') return typedAssetLabel(ref);
  const sourceNode = data.networkNodes?.find(item => item.id === ref.id);
  if (sourceNode?.assetType === 'closure' || sourceNode?.assetType === 'ap') return sourceNode.displayName;
  return degree === 1 ? `Endpoint ${ref.id}` : sourceNode?.displayName ?? `Node ${ref.id}`;
};

export function buildNetworkTopologyProjection(data: Inventory): NetworkTopologyProjection {
  const rankByCable = new Map<string, number>();
  for (const route of data.cableRoutes ?? []) for (const leg of route.legs) if (leg.segmentId && !rankByCable.has(leg.segmentId)) rankByCable.set(leg.segmentId, leg.sequence);
  const nodeMap = new Map<string, PhysicalTopologyNode>();
  const edges = data.cables.map(cable => {
    for (const ref of [cable.endpointA, cable.endpointB]) {
      const key = topologyNodeKey(ref);
      if (!nodeMap.has(key)) nodeMap.set(key, { key, ref, label: typedAssetLabel(ref), degree: 0 });
      nodeMap.get(key)!.degree += 1;
    }
    return { id: cable.id, cableId: cable.id, legacyCableId: cable.legacyCableId, from: topologyNodeKey(cable.endpointA), to: topologyNodeKey(cable.endpointB), fiberCount: cable.fiberCount, routeRank: rankByCable.get(cable.id) ?? null, sourceFiles: [...new Set([cable.source.file, ...(cable.sourceRepresentations?.map(s => s.file) ?? [])])].sort(cmp) };
  }).sort(edgeOrder);
  for (const node of nodeMap.values()) node.label = nodeLabel(node.ref, node.degree, data);
  const nodes = [...nodeMap.values()].sort((a, b) => cmp(a.key, b.key));
  const byNode = new Map(nodes.map(node => [node.key, [] as PhysicalTopologyEdge[]]));
  for (const edge of edges) { byNode.get(edge.from)?.push(edge); byNode.get(edge.to)?.push(edge); }
  for (const incident of byNode.values()) incident.sort(edgeOrder);
  const components: PhysicalTopologyComponent[] = [], remaining = new Set(nodes.map(node => node.key));
  while (remaining.size) {
    const seed = [...remaining].sort(cmp)[0], queue = [seed], componentNodes: string[] = [], componentEdges = new Set<string>(); remaining.delete(seed);
    for (let i = 0; i < queue.length; i++) {
      const key = queue[i]; componentNodes.push(key);
      for (const edge of byNode.get(key) ?? []) {
        componentEdges.add(edge.id); const next = edge.from === key ? edge.to : edge.from;
        if (remaining.delete(next)) queue.push(next);
      }
    }
    const rootKey = componentNodes.slice().sort((a, b) => rootRank(nodeMap.get(a)!) - rootRank(nodeMap.get(b)!) || cmp(a, b))[0];
    components.push({ id: `component:${rootKey}`, nodeKeys: componentNodes.sort(cmp), edgeIds: [...componentEdges].sort((a,b) => edgeOrder(edges.find(e=>e.id===a)!,edges.find(e=>e.id===b)!)).map(id => id), rootKey });
  }
  components.sort((a,b) => Number(b.nodeKeys.includes('closure:206')) - Number(a.nodeKeys.includes('closure:206')) || Number(b.nodeKeys.length > 1) - Number(a.nodeKeys.length > 1) || cmp(a.rootKey,b.rootKey));
  const visited = new Set<string>(), tree = new Set<string>(), cross = new Set<string>();
  for (const component of components) {
    const seenNodes = new Set([component.rootKey]), queue = [component.rootKey];
    for (let i=0;i<queue.length;i++) for (const edge of byNode.get(queue[i]) ?? []) {
      const next = edge.from === queue[i] ? edge.to : edge.from;
      if (!seenNodes.has(next)) { seenNodes.add(next); queue.push(next); tree.add(edge.id); }
      else if (!tree.has(edge.id)) cross.add(edge.id);
      visited.add(edge.id);
    }
  }
  return { nodes, edges, components, treeEdgeIds: [...tree], crossLinkEdgeIds: [...cross], omittedCableIds: data.cables.filter(c => !visited.has(c.id)).map(c => c.id).sort(cmp) };
}

function rootRank(node: PhysicalTopologyNode) { return node.ref.kind === 'aggregation' && node.ref.id === '5' ? 0 : node.ref.kind === 'aggregation' ? 1 : node.ref.kind === 'closure' ? 2 : 3; }

export interface TopologyTreeNode { key: string; children: Array<{ edge: PhysicalTopologyEdge; node: TopologyTreeNode }> }
export function buildTopologyTree(projection: NetworkTopologyProjection, component: PhysicalTopologyComponent): TopologyTreeNode {
  const edgeByNode = new Map<string,PhysicalTopologyEdge[]>();
  for(const edge of projection.edges) { edgeByNode.set(edge.from,[...(edgeByNode.get(edge.from)??[]),edge]); edgeByNode.set(edge.to,[...(edgeByNode.get(edge.to)??[]),edge]); }
  for(const list of edgeByNode.values()) list.sort(edgeOrder);
  const built = new Map<string,TopologyTreeNode>([[component.rootKey,{key:component.rootKey,children:[]}]]), visitedNodes=new Set([component.rootKey]), visitedEdges=new Set<string>(), queue=[component.rootKey];
  for(let i=0;i<queue.length;i++) { const key=queue[i], parent=built.get(key)!; for(const edge of edgeByNode.get(key)??[]) { if(visitedEdges.has(edge.id)) continue; visitedEdges.add(edge.id); const next=edge.from===key?edge.to:edge.from; if(visitedNodes.has(next)) continue; visitedNodes.add(next); const child={key:next,children:[]}; built.set(next,child); parent.children.push({edge,node:child}); queue.push(next); } }
  return built.get(component.rootKey) ?? {key:component.rootKey,children:[]};
}

export function componentForCable(projection: NetworkTopologyProjection, cableId: string) { return projection.components.find(component => component.edgeIds.includes(cableId)); }
