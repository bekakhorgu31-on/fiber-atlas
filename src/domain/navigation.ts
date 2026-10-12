import type { Route } from './types';

export function routeHash(route: Route): string {
  if(route.view==='place'){const p=new URLSearchParams();for(const [key,value] of Object.entries({focus:route.focus,select:route.selection,strand:route.strand,source:route.source,q:route.query,kind:route.kind,page:route.page,limit:route.limit,expanded:route.expanded?.join(',')}))if(value!==undefined&&value!=='')p.set(key,String(value));return '#/place'+(p.size?'?'+p:'');}
  if (route.view === 'dashboard') return '#/';
  if (route.view === 'engineer') {const params=new URLSearchParams();if(route.query)params.set('q',route.query);if(route.report)params.set('report','1');return '#/engineer'+(params.size?`?${params}`:'');}
  if(route.view==='organization'){const params=new URLSearchParams();for(const name of ['strand','inspect','mode'] as const)if(route[name])params.set(name,route[name]);if(route.query)params.set('q',route.query);if(route.collapsed?.length)params.set('collapsed',route.collapsed.join(','));return `#/organization/${route.id}`+(params.size?`?${params}`:'');}
  if (route.view === 'document') return `#/document/${route.id}`;
  if (route.view === 'route') {
    const params = new URLSearchParams();
    if (route.selection) params.set('select', route.selection);
    if (route.collapsed?.length) params.set('collapsed', [...new Set(route.collapsed)].sort().join(','));
    for(const key of ['target','origin','mode','context','inspect','physicalPath'] as const)if(route[key])params.set(key,route[key]);
    if(route.port!==undefined)params.set('port',String(route.port));
    if(route.overview)params.set('overview','1');
    return `#/route/${route.id}${params.size ? `?${params}` : ''}`;
  }
  if (route.view === 'fiber' || route.view === 'trace') return `#/${route.view}/${route.cableId}/${route.fiber}`;
  if (route.view === 'odf_port') return `#/odf-port/${route.odfId}/${route.port}`;
  if (route.view === 'splice') {
    const query = new URLSearchParams();
    if (route.relationshipId) query.set('sheet', route.relationshipId);
    if (route.focus) query.set('focus', route.focus);
    return `#/splice/${route.nodeKind}/${route.nodeId}${query.size ? `?${query}` : ''}`;
  }
  if(route.view==='review'){const p=new URLSearchParams();for(const [key,value] of Object.entries({q:route.query,revision:route.revision,run:route.runId,source:route.source,case:route.caseId,category:route.category,status:route.status,group:route.group,page:route.page,coverage:route.coverage})){if(value!==undefined)p.set(key,String(value));}return '#/review'+(p.size?'?'+p:'');}
  if (route.view === 'import') {
    const query = new URLSearchParams();
    if (route.shapeId) query.set('shape', route.shapeId);
    return '#/import' + (route.runId ? `/${route.runId}` : '') + (query.size ? `?${query}` : '');
  }
  if ('id' in route) return `#/${route.view}/${route.id}`;
  return '#/';
}
export function parseRoute(hash: string): Route | null {
  const [path, query] = hash.replace(/^#/, '').split('?');
  if (!path || path === '/') return { view: 'dashboard' };
  const parts = path.split('/').filter(Boolean), [view, id, n] = parts;
  if(view==='place'&&parts.length===1){const p=new URLSearchParams(query);return {view,focus:p.get('focus')??undefined,selection:p.get('select')??undefined,strand:p.get('strand')??undefined,source:p.get('source')??undefined,query:p.get('q')??undefined,kind:p.get('kind')==='cables'?'cables':'places',page:Math.max(1,Number(p.get('page'))||1),limit:Math.max(16,Math.min(64,Number(p.get('limit'))||16)),expanded:(p.get('expanded')??'').split(',').filter(Boolean).slice(0,8)};}
  if(view==='review'&&parts.length===1){const p=new URLSearchParams(query),status=p.get('status');return {view,query:p.get('q')??undefined,revision:p.get('revision')??undefined,runId:p.get('run')??undefined,source:p.get('source')??undefined,caseId:p.get('case')??undefined,category:p.get('category')??undefined,group:p.get('group')??undefined,...(['banks','annotations','raw_ports','local_links','aggregation_ports','construction','endpoints'].includes(p.get('coverage')??'')?{coverage:p.get('coverage') as Extract<Route,{view:'review'}>['coverage']}:{}),...(['all','open','reviewed'].includes(status??'')?{status:status as 'all'|'open'|'reviewed'}:{}),...(p.get('page')?{page:Math.max(1,Number(p.get('page'))||1)}:{})};}
  if (view === 'engineer' && parts.length === 1) {const params=new URLSearchParams(query);return {view,query:params.get('q')??undefined,...(params.get('report')==='1'?{report:true}:{})};}
  if(view==='organization'&&parts.length===2&&/^[a-z0-9_-]+$/i.test(id??'')){const params=new URLSearchParams(query),mode=params.get('mode');return{view,id,...(params.get('q')?{query:params.get('q')!}:{}),...(params.get('strand')?{strand:params.get('strand')!}:{}),...(params.get('inspect')?{inspect:params.get('inspect')!}:{}),...(mode==='footprint'||mode==='path'||mode==='network'?{mode}:{}),...(params.get('collapsed')?{collapsed:params.get('collapsed')!.split(',')}:{} )};}
  if (view === 'import' && parts.length <= 2) {
    const shapeId = new URLSearchParams(query).get('shape');
    return shapeId ? { view, runId: id, shapeId } : { view, runId: id };
  }
  if ((view === 'fiber' || view === 'trace') && /^[a-z0-9_-]+$/i.test(id ?? '') && /^\d+$/.test(n ?? '') && parts.length === 3) return { view, cableId: id, fiber: Number(n) };
  if (view === 'odf-port' && /^[a-z0-9_-]+$/i.test(id ?? '') && /^\d+$/.test(n ?? '') && parts.length === 3) return { view: 'odf_port', odfId: id, port: Number(n) };
  if (view === 'splice' && ['closure', 'aggregation', 'ap', 'network_node'].includes(id ?? '') && /^[a-z0-9_-]+$/i.test(n ?? '') && parts.length === 3) {
    const params = new URLSearchParams(query);
    return { view: 'splice', nodeKind: id as 'closure' | 'aggregation' | 'ap' | 'network_node', nodeId: n, relationshipId: params.get('sheet') ?? undefined, focus: params.get('focus') ?? undefined };
  }
  if (view === 'route' && /^[a-z0-9_-]+$/i.test(id ?? '') && parts.length === 2) {
    const params = new URLSearchParams(query), selection = params.get('select');
    const collapsed = (params.get('collapsed') ?? '').split(',').filter(value => /^(?:closure|ap|odf|aggregation|network_node):[a-z0-9_-]+$/i.test(value));
    const target=params.get('target')??undefined,origin=params.get('origin')??undefined,inspect=params.get('inspect')??undefined,physicalPath=params.get('physicalPath')??undefined,mode=params.get('mode'),context=params.get('context'),port=params.get('port');
    return { view, id, ...(selection ? { selection } : {}), ...(collapsed.length ? { collapsed } : {}),...(target?{target}:{}),...(origin?{origin}:{}),...(inspect?{inspect}:{}),...(physicalPath?{physicalPath}:{}),...(mode==='physical'||mode==='fiber'?{mode}:{}),...(context==='network'||context==='route'?{context}:{}),...(port&&/^\d+$/.test(port)?{port:Number(port)}:{}),...(params.get('overview')==='1'?{overview:true}:{}) };
  }
  if (['document', 'cable', 'closure', 'ap', 'aggregation'].includes(view) && /^[a-z0-9_-]+$/i.test(id ?? '') && parts.length === 2) return { view: view as 'document' | 'cable' | 'closure' | 'ap' | 'aggregation', id };
  return null;
}
