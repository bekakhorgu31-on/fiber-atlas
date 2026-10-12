import test from 'node:test';
import assert from 'node:assert/strict';
import { repository } from '../src/data/repository';
import { buildNetworkTopologyProjection, buildTopologyTree } from '../src/domain/networkTopology';
import { routeScopedSearch, workspaceNavigationTarget } from '../src/domain/routeWorkspace';
import { parseRoute, routeHash } from '../src/domain/navigation';
import { routeWithSelection } from '../src/domain/routeWorkspace';

test('combined projection accounts for every active canonical Cable exactly once as a graph edge', async () => {
  const data = await repository.load(), projection = buildNetworkTopologyProjection(data);
  assert.equal(projection.edges.length, data.cables.length);
  assert.equal(new Set(projection.edges.map(edge => edge.cableId)).size, data.cables.length);
  assert.deepEqual(projection.omittedCableIds, []);
  assert.equal(projection.nodes.filter(node => node.key === 'closure:206').length, 1);
  assert.equal(projection.nodes.filter(node => node.key === 'closure:205').length, 1);
});

test('SC206 is the canonical physical fork for C169 and C151 into one combined component', async () => {
  const data = await repository.load(), projection = buildNetworkTopologyProjection(data), component = projection.components.find(item => item.nodeKeys.includes('closure:206'))!;
  assert.ok(component.edgeIds.includes(data.cables.find(c => c.legacyCableId === '169')!.id));
  assert.ok(component.edgeIds.includes(data.cables.find(c => c.legacyCableId === '151')!.id));
  assert.ok(component.edgeIds.includes(data.cables.find(c => c.legacyCableId === '152')!.id));
  const tree = buildTopologyTree(projection, component);
  const queue = [tree], labels: string[] = [];
  while (queue.length) { const node = queue.shift()!; labels.push(projection.nodes.find(item => item.key === node.key)!.label); queue.push(...node.children.map(child => child.node)); }
  assert.ok(labels.includes('SC207'));
  assert.ok(labels.includes('SC208'));
  assert.equal(projection.components.filter(item => item.nodeKeys.includes('closure:206')).length, 1);
});

test('Source B leaf types require certified AP grammar; unresolved source nodes remain neutral', async () => {
  const projection = buildNetworkTopologyProjection(await repository.load());
  assert.equal(projection.nodes.find(node => node.key === 'network_node:207')?.label, 'SC207');
  assert.equal(projection.nodes.find(node => node.key === 'network_node:208')?.label, 'SC208');
  assert.equal(projection.nodes.find(node => node.key === 'network_node:42')?.label, 'AP42');
  assert.equal(projection.nodes.find(node => node.key === 'network_node:49')?.label, 'AP49');
  assert.equal(projection.nodes.find(node=>node.key==='network_node:225')?.label,'Endpoint 225');
});

test('physical projection is independent from Fiber transition edges and preserves C172 identity collision', async () => {
  const data = await repository.load(), projection = buildNetworkTopologyProjection(data), noOpticalEdges = buildNetworkTopologyProjection({ ...data, nodeFiberTransitions: [] });
  assert.equal(projection.edges.length, data.cables.length);
  assert.deepEqual(projection.edges.map(edge => edge.id), noOpticalEdges.edges.map(edge => edge.id));
  assert.ok(projection.edges.some(edge => edge.legacyCableId === '172' && edge.cableId !== 'CAB-000172'));
  assert.ok(projection.edges.some(edge => edge.cableId === 'CAB-000172'));
});

test('combined workspace local search and engineer navigation can focus Source B objects', async () => {
  const data = await repository.load(), root = data.cableRoutes![0];
  const results = routeScopedSearch(data, root, 'C152');
  const cable = data.cables.find(item => item.legacyCableId === '152')!;
  assert.ok(results.some(result => result.key === `segment:${cable.id}`));
  const target = workspaceNavigationTarget(data, { view: 'cable', id: cable.id });
  assert.equal(target?.view, 'route');
  if (target?.view === 'route') assert.equal(target.selection, `segment:${cable.id}`);
  assert.ok(routeScopedSearch(data, root, 'Node 211').some(result => result.key === 'network_node:211'));
});

test('combined topology selection and collapsed branches round-trip through URL state', () => {
  const route = routeWithSelection('ROUTE-TSAGERI-LENTEKHI-CORE', { type: 'network_node', id: '207' }, ['network_node:208', 'closure:206']);
  assert.deepEqual(parseRoute(routeHash(route)), { view: 'route', id: 'ROUTE-TSAGERI-LENTEKHI-CORE', selection: 'network_node:207', collapsed: ['closure:206', 'network_node:208'] });
});
