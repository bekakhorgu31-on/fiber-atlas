import {readReviewJson} from './data/reviewRequests';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, CircleHelp, Database, Network, Route as RouteIcon, Search, X } from 'lucide-react';
import { selectNetworkRepository,EmptyNetworkError } from './data/apiRepository';
import { ReviewInbox } from './components/ReviewInbox';
import { OwnerImportPanel } from './components/OwnerImportPanel';
import { DatabaseAccountPanel } from './components/DatabaseAccountPanel';
import { findCable } from './domain/network';
import type { Inventory, Route, SearchResult, ViewProps } from './domain/types';
import { parseRoute, routeHash } from './domain/navigation';
import { workspaceNavigationTarget } from './domain/routeWorkspace';
import { createEngineerQueryService, parseNetworkQuery } from './domain/engineerQuery';
import { compactSearchResult, compactRouteAction } from './domain/iteration28g';
import {operatorSearchCard} from './domain/iteration28i';
import {PlaceWorkspace} from './views/PlaceWorkspace';
import {placeNavigationTarget,focusedSelectionRoute} from './domain/placeWorkspace';
import { DocumentOverview } from './views/DocumentOverview';
import { AccessPointView, AggregationView, CableView, ClosureView, FiberView, OdfPortView, ReviewView, TraceView } from './views/NetworkViews';
import { ImportReviewView } from './views/ImportReview';
import { RouteWorkspace } from './views/RouteWorkspace';
import { SpliceWorkspace } from './views/SpliceWorkspace';
import { EngineerWorkspace } from './views/EngineerWorkspace';
import {OrganizationWorkspace} from './views/OrganizationWorkspace';
import {exactOrganizationEntry} from './domain/organizationEntry';

export default function App() {
  const [data, setData] = useState<Inventory | null>(null), [error, setError] = useState(false);
  const [empty,setEmpty]=useState(false);
  const [reviewCount,setReviewCount]=useState<number|null>(null);
  const [repository] = useState(()=>selectNetworkRepository(location.search));
  const [detailLoading,setDetailLoading]=useState(false),[detailError,setDetailError]=useState('');
  const [route, setRoute] = useState<Route | null>(() => parseRoute(location.hash));
  const [query, setQuery] = useState(''), [showSearch, setShowSearch] = useState(false), [selection, setSelection] = useState(0);
  const [navigationOpen,setNavigationOpen]=useState(()=>window.matchMedia('(min-width:761px)').matches);
  const mainRef = useRef<HTMLElement>(null), searchRef = useRef<HTMLDivElement>(null);
  const databaseMode=new URLSearchParams(location.search).get('data')==='database'||location.protocol!=='file:'&&new URLSearchParams(location.search).get('data')!=='offline-demo';
  const networkPending=useRef<Promise<Inventory>|null>(null);
  const prepareNetwork=useCallback(async(expected?:string)=>{if(data&&(!expected||data.dataAvailability?.networkRevision===expected))return data;if(!networkPending.current){networkPending.current=repository.load().then(v=>{setData(v);setError(false);return v;}).finally(()=>{networkPending.current=null;});}const graph=await networkPending.current;if(expected&&graph.dataAvailability?.networkRevision!==expected)throw Error('ქსელის რევიზია შეიცვალა. განაახლეთ საკითხი.');return graph;},[data,repository]);
  const reloadNetwork=useCallback(()=>{setData(null);setError(false);setEmpty(false);repository.load().then(setData).catch(e=>{if(e instanceof EmptyNetworkError){setData(null);setEmpty(true);}else setError(true);});},[repository]);
  useEffect(()=>{if(databaseMode&&(route?.view==='review'||route?.view==='import')||data||networkPending.current)return;void prepareNetwork().catch(e=>{if(e instanceof EmptyNetworkError)setEmpty(true);else setError(true);});},[databaseMode,route?.view,data,prepareNetwork]);
  const loadDetails=useCallback(async()=>{
    if(!data?.dataAvailability?.deferredFields.length||!repository.loadDetails)return;
    setDetailLoading(true);setDetailError('');
    try{setData(await repository.loadDetails(data));}catch(e){setDetailError(e instanceof Error?e.message:String(e));}finally{setDetailLoading(false);}
  },[data,repository]);

  useEffect(()=>{if(!databaseMode)return;const update=()=>{readReviewJson<{reviewCount?:number}>('session').then(v=>setReviewCount(v.reviewCount??null)).catch(()=>setReviewCount(null));};update();window.addEventListener('fiber-review-changed',update);window.addEventListener('fiber-session-changed',update);return()=>{window.removeEventListener('fiber-review-changed',update);window.removeEventListener('fiber-session-changed',update);};},[databaseMode]);
  const requiresDetail=route?.view==='splice';
  useEffect(()=>{if(requiresDetail&&data?.dataAvailability?.deferredFields.length&&!detailLoading&&!detailError)void loadDetails();},[requiresDetail,data,detailLoading,detailError,loadDetails]);
  useEffect(()=>{if(!data||route?.view!=='engineer'||route.report||!route.query)return;const org=exactOrganizationEntry(data,route.query);if(!org)return;const next:Route={view:'organization',id:org.organizationId,query:route.query};window.history.replaceState(null,'',`${location.pathname}${location.search}${routeHash(next)}`);setRoute(next);},[data,route]);
  useEffect(()=>{if(data)performance.measure('fiber-atlas:first-render',{start:0,end:performance.now()});},[data]);
  const engineerQuery = useMemo(() => {if(!data)return null;const start=performance.now(),service=createEngineerQueryService(data);performance.measure('fiber-atlas:search-index',{start,duration:performance.now()-start});return service;}, [data]);
  useEffect(() => {
    const change = () => {
      const next = parseRoute(location.hash);
      setRoute(previous => {
        const sameWorkspace = (previous?.view === 'route' && next?.view === 'route'||previous?.view==='organization'&&next?.view==='organization') && previous.id === next.id;
        if (!sameWorkspace && !(previous?.view==='place'&&next?.view==='place')) { window.scrollTo(0, 0); requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true })); }
        return next;
      });
      setQuery(''); setShowSearch(false);
    };
    const outside = (e: MouseEvent) => { if (!searchRef.current?.contains(e.target as Node)) setShowSearch(false); };
    const shortcut = (e: KeyboardEvent) => { const target = e.target as HTMLElement | null; const typing = !!target?.closest('input,textarea,select,[contenteditable="true"]'); if (!typing && (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'))) { e.preventDefault(); document.querySelector<HTMLInputElement>('#network-search, #engineer-query')?.focus(); } };
    window.addEventListener('hashchange', change); document.addEventListener('mousedown', outside); document.addEventListener('keydown', shortcut);
    return () => { window.removeEventListener('hashchange', change); document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', shortcut); };
  }, []);
  const navigate:ViewProps['navigate'] = (input,options) => { const r=data?placeNavigationTarget(data,input):input; setShowSearch(false); setQuery('');if(options?.replace){window.history.replaceState(null,'',`${location.pathname}${location.search}${routeHash(r)}`);window.dispatchEvent(new HashChangeEvent('hashchange'));}else location.hash = routeHash(r); };
  const navigateSearchResult = (result: SearchResult) => {
    const r=result.route;
    let target=data?workspaceNavigationTarget(data,r)??r:r;
    const binding=result.id.startsWith('port-binding:')?data?.portTopologyBindings?.find(b=>b.id===result.id.slice('port-binding:'.length)):undefined;
    if(binding&&data)target=focusedSelectionRoute(data,{type:'port',ownerType:binding.ownerType,ownerId:binding.ownerId,number:binding.portNumber});
    if(route?.view!=='engineer'&&target.view!=='engineer'&&query.trim())window.history.pushState(null,'',`${location.pathname}${location.search}${routeHash({view:'engineer',query:query.trim(),...(target.view==='organization'?{report:true}:{})})}`);
    navigate(target);
  };
  const results = useMemo(()=>engineerQuery && data ? engineerQuery.search(query).filter(result=>!result.id.startsWith('organization-source-label:')).map(result => operatorSearchCard(data, result)) : [],[engineerQuery,data,query]);
  const suggestions=results.slice(0,5);
  const view = route?.view;
  const props = data ? { data, navigate } : null;
  let screen;
  if(databaseMode&&route?.view==='import')screen=<OwnerImportPanel navigate={navigate} onApplied={reloadNetwork} runId={route.runId} shapeId={route.shapeId}/>;
  else if(databaseMode&&route?.view==='review')screen=<ReviewInbox state={route} navigate={navigate} data={data} prepareNetwork={prepareNetwork} onApplied={()=>{setData(null);setError(false);}}/>;
  else if (error) screen = <div className="error-state"><h1>მონაცემები ვერ ჩაიტვირთა</h1><p>ბაზასთან კავშირი ან ქსელის მონაცემები შესამოწმებელია.</p><button className="button" onClick={reloadNetwork}>ხელახლა ცდა</button></div>;
  else if(empty&&route?.view==='engineer')screen=<section className="empty-state engineer-empty-state"><Search size={24} aria-hidden="true"/><h1>ინჟინრის ძიება</h1><p>ქსელის ობიექტებისა და კავშირების ძიება ხელმისაწვდომი გახდება Visio ქსელის იმპორტის შემდეგ. ამჟამად აქტიური ქსელი ცარიელია.</p><button className="button button-primary" onClick={()=>navigate({view:'import'})}>Visio იმპორტი</button></section>;
  else if(empty)screen=<section className="empty-state"><h1>ქსელი ჯერ არ არის იმპორტირებული</h1><p>ქსელის მოსამზადებლად ატვირთეთ Visio ფაილი.</p><button className="button" onClick={()=>navigate({view:'import'})}>Visio იმპორტი</button></section>;
  else if (!props) screen = <div className="loading-state" role="status">მონაცემები იტვირთება…</div>;
  else if(requiresDetail&&data?.dataAvailability?.deferredFields.length) screen=<div className="loading-state" role="status">{detailError?<><p role="alert">ინჟინრული მტკიცებულება ვერ ჩაიტვირთა.</p><button className="button" onClick={()=>void loadDetails()}>ხელახლა ცდა</button></>:<>ინჟინრული მტკიცებულება იტვირთება…</>}</div>;
  else if (!route) screen = <div className="empty-state"><h1>გვერდი ვერ მოიძებნა</h1><button className="button" onClick={() => navigate({ view: 'dashboard' })}>მთავარზე დაბრუნება</button></div>;
  else if(placeNavigationTarget(props.data,route).view==='place'){screen=<PlaceWorkspace {...props} onApplied={databaseMode?reloadNetwork:undefined} state={placeNavigationTarget(props.data,route) as Extract<Route,{view:'place'}>}/>;}
  else switch (route.view) {
    case 'dashboard': screen = <PlaceWorkspace {...props} onApplied={databaseMode?reloadNetwork:undefined} state={{view:'place'}} />; break;
    case 'place': screen=<PlaceWorkspace {...props} onApplied={databaseMode?reloadNetwork:undefined} state={route}/>;break;
    case 'engineer': screen = <EngineerWorkspace {...props} query={route.query ?? ''} />; break;
    case 'organization': screen=<OrganizationWorkspace {...props} state={route}/>;break;
    case 'document': screen = <DocumentOverview {...props} id={route.id} />; break;
    case 'route': screen = <RouteWorkspace {...props} id={route.id} selection={route.selection} collapsed={route.collapsed} workspaceState={route} />; break;
    case 'cable': screen = <CableView key={`c-${route.id}`} {...props} id={route.id} />; break;
    case 'closure': screen = <ClosureView key={`sc-${route.id}`} {...props} id={route.id} />; break;
    case 'fiber': screen = <FiberView {...props} cableId={route.cableId} fiber={route.fiber} />; break;
    case 'trace': screen = <TraceView key={`${route.cableId}/${route.fiber}`} {...props} cableId={route.cableId} fiber={route.fiber} />; break;
    case 'ap': screen = <AccessPointView {...props} id={route.id} />; break;
    case 'aggregation': screen = <AggregationView {...props} id={route.id} />; break;
    case 'odf_port': screen = <OdfPortView {...props} odfId={route.odfId} port={route.port} />; break;
    case 'splice': screen = <SpliceWorkspace {...props} nodeKind={route.nodeKind} nodeId={route.nodeId} relationshipId={route.relationshipId} focus={route.focus} />; break;
    case 'review': screen = <ReviewView {...props} query={route.query} />; break;
    case 'import': screen = <ImportReviewView {...props} key={`${route.runId}:${route.shapeId}`} runId={route.runId} shapeId={route.shapeId} />; break;
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); mainRef.current?.focus(); }}>შიგთავსზე გადასვლა</a>
    <aside className="sidebar">
      <div className="data-source-status" role="status">{databaseMode?(error?'ბაზასთან კავშირი შესამოწმებელია':empty?'ქსელი ცარიელია':data||reviewCount!==null?'მონაცემთა ბაზასთან დაკავშირებულია':'კავშირი მოწმდება…'):'საცნობარო არტეფაქტი'}</div>
      <button className="brand" onClick={() => navigate({ view: 'dashboard' })} aria-label="Fiber Atlas — მთავარი"><Network size={27} /><span>Fiber Atlas<small>ოპტიკური ქსელის ციფრული ატლასი</small></span></button>
      <details className="app-navigation" open={navigationOpen} onToggle={e=>setNavigationOpen(e.currentTarget.open)}><summary>მენიუ</summary><nav aria-label="მთავარი ნავიგაცია">
        <button className={`nav-link ${view === 'route'||view==='dashboard'||view==='place' ? 'active' : ''}`} aria-current={view === 'route'||view==='dashboard'||view==='place' ? 'page' : undefined} onClick={() => navigate({view:'place'})}><RouteIcon size={19} /> ქსელი</button>
        <button className={`nav-link ${view === 'engineer' ? 'active' : ''}`} aria-current={view === 'engineer' ? 'page' : undefined} onClick={() => navigate({ view: 'engineer' })}><Search size={19} /> ინჟინრის ძიება</button>
        <button className={`nav-link ${view === 'import' ? 'active' : ''}`} aria-current={view === 'import' ? 'page' : undefined} onClick={() => navigate({ view: 'import' })}><Database size={19} /> Visio იმპორტი</button>
        <button className={`nav-link ${view === 'review' ? 'active' : ''}`} aria-current={view === 'review' ? 'page' : undefined} onClick={() => navigate({ view: 'review' })}><CircleHelp size={19} /> შესამოწმებელი {reviewCount!==null&&<span>{reviewCount}</span>}</button>
        </nav></details>
      {databaseMode&&<DatabaseAccountPanel/>}
    </aside>
    <div className="workspace">
      <header className="topbar">
        {view!=='engineer'&&<div className="global-search" ref={searchRef} onKeyDown={e => {
          if (e.key === 'Escape') setShowSearch(false);
          if (e.key === 'ArrowDown') { e.preventDefault(); setSelection(i => Math.min(i + 1, suggestions.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setSelection(i => Math.max(0, i - 1)); }
          if (e.key === 'Enter' && query.trim()) { e.preventDefault(); const parsed = parseNetworkQuery(query); const ambiguousFiber = parsed.intent === 'trace_fiber' && results.length > 1; const legacyCollision = /^\s*C?172\s*$/i.test(query) && results.filter(r => r.category === 'Cable').length > 1; if (ambiguousFiber || legacyCollision || /[?]|სად|როგორ|რომელი|რა\s|არის|მიდის|გადადის|ერთდება|იყენებს|თავისუფალ/i.test(query) || ['availability','company_usage','node_connections','node_transitions','fibers_to_segment','conflict'].includes(parsed.intent)) { navigate({ view: 'engineer', query }); } else if (results[selection]) navigateSearchResult(results[selection]); else navigate({ view: 'engineer', query }); }
        }}>
          <Search size={19} aria-hidden="true" /><label className="sr-only" htmlFor="network-search">ძებნა: კაბელის მარშრუტი, მონაკვეთი, ქურო, ჟილა, ადგილი ან კომპანია</label>
          <input type="search" id="network-search" autoComplete="off" disabled={empty} value={query} placeholder={empty?'ძებნა ხელმისაწვდომი იქნება იმპორტის შემდეგ':'მოძებნე ან ჰკითხე Fiber Atlas-ს…'} role="combobox" aria-expanded={showSearch && !!query.trim()} aria-controls="search-results" aria-autocomplete="list" aria-activedescendant={showSearch && results[selection] ? `search-${selection}` : undefined} onFocus={() => setShowSearch(true)} onChange={e => { setQuery(e.target.value); setShowSearch(true); setSelection(0); }} />
          {query && <button className="search-clear" aria-label="ძებნის გასუფთავება" onClick={() => { setQuery(''); document.querySelector<HTMLInputElement>('#network-search, #engineer-query')?.focus(); }}><X size={16} /></button>}
          {showSearch && query.trim() && <div className="search-results" id="search-results" role="listbox" aria-label="ძებნის შედეგები">{suggestions.length ? suggestions.map((result, i) => <button className={`search-result ${selection === i ? 'is-selected' : ''}`} role="option" aria-selected={selection === i} id={`search-${i}`} key={result.id} onMouseEnter={() => setSelection(i)} onClick={() => navigateSearchResult(result)}><span><strong>{result.title}</strong><small>{result.subtitle}</small>{result.facts?.slice(0,1).map((fact,n)=><small key={n}>{fact}</small>)}<em>{data && compactRouteAction(data,result)}</em></span><ChevronRight size={18} /></button>) : !data&&databaseMode?<button className="search-all" onClick={()=>navigate({view:'engineer',query})}>ძიების გახსნა</button>:<div className="empty-state" role="status"><strong>ჩანაწერი ვერ მოიძებნა</strong></div>}{results.length>5&&<button className="search-all" onClick={()=>navigate({view:'engineer',query})}>ყველა შედეგი · {results.length}</button>}</div>}
        </div>}
      </header>
      <main id="main-content" className={`page${view === 'route'||view==='organization' ? ' route-workspace-page' : ''}${view === 'splice' ? ' splice-workspace-page' : ''}`} tabIndex={-1} ref={mainRef}>{screen}</main>
    </div>
  </div>;
}




