import {CompactFiberJourney} from './CompactFiberJourney';
import {focusedSelectionRoute,questionJourney} from '../domain/placeWorkspace';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import type { ViewProps } from '../domain/types';
import { createEngineerQueryService } from '../domain/engineerQuery';
import { type WorkspaceSelection } from '../domain/routeWorkspace';
import { compactSearchResult, compactRouteAction } from '../domain/iteration28g';
import { Badge, PageHeader } from '../components/ui';

const examples = ['Magti','მაგთი','Magti რომელ კაბელებს იყენებს?','Magti რომელ Fiber-ებს იყენებს?','Magti რომელ აგრეგაციაზეა?','Magti რომელ პორტზეა?','OpenNet','OpenNet OTDR','Silknet','Skytel','Tsageri Aggregation-ზე ვინ იყენებს Fiber-ებს?','Lentekhi Aggregation-ზე რომელი Port/Fiber გამოიყენება?','C158-ს ვინ იყენებს?','SC211-ში რომელი ორგანიზაციების Fiber-ები გადის?','C151/F1 სად მიდის?','SC211-ში როგორ არის გადაერთებული Fibers?','Lentekhi Port38-ის გზა'];
const stateLabels = { exact: 'ზუსტი topology', partial: 'ნაწილობრივი ცნობილი გზა', conflict: 'წყაროთა კონფლიქტი', unknown: 'არ არის დადგენილი', disambiguation: 'აირჩიეთ წყარო/ობიექტი', annotation: 'წყაროს annotation' } as const;
const outcomeLabels={exact:'Direct exact evidence',partial:'Partial known path',conflict:'Conflict',unknown:'Unknown',disambiguation:'Needs selection',annotation:'Source annotation',derived_from_exact_lineage:'Derived from exact Fiber lineage',unknown_port:'Exact Port binding unknown',unknown_occupancy:'Port occupancy unknown',review_required:'Review required'} as const;

export function EngineerWorkspace({ data, navigate, query: initialQuery }: ViewProps & { query: string }) {
  const service = useMemo(() => createEngineerQueryService(data), [data]);
  const [query, setQuery] = useState(initialQuery);
  const [answer, setAnswer] = useState(() => initialQuery ? service.run(initialQuery) : null);
  const compactResults=answer?.results.map(result=>compactSearchResult(data,result))??[];
  const [history, setHistory] = useState<string[]>([]);
  const [showAllTransitions, setShowAllTransitions] = useState(false);
  useEffect(() => { setQuery(initialQuery); setAnswer(initialQuery ? service.run(initialQuery) : null); setShowAllTransitions(false); }, [initialQuery, service]);
  const submit = (value = query) => {
    const raw = value.trim(); if (!raw) return;
    setQuery(raw); setAnswer(service.run(raw)); setShowAllTransitions(false); setHistory(prev => [raw, ...prev.filter(x => x !== raw)].slice(0, 6));
    if (location.hash !== `#/engineer?q=${encodeURIComponent(raw)}`) navigate({ view: 'engineer', query: raw });
  };
  const networkSelectionForResult = (id: string): WorkspaceSelection | null => {
    const parts = id.split(':');
    if (parts[0] === 'fiber' && parts.length === 3) return { type: 'fiber', cableId: parts[1], number: Number(parts[2]) };
    if (parts[0] === 'cable' && parts[1]) return { type: 'segment', id: parts[1] };
    if (parts[0] === 'node' && parts[1]) return { type: 'network_node', id: parts[1] };
    if (['closure', 'ap', 'aggregation'].includes(parts[0]) && parts[1]) return { type: parts[0] as 'closure' | 'ap' | 'aggregation', id: parts[1] };
    return null;
  };
  const showInNetwork = (resultId: string) => {
    const selection = networkSelectionForResult(resultId);
    if (selection) navigate(focusedSelectionRoute(data,selection));
  };
  const journey=questionJourney(data,answer);
  return <div className="view-content engineer-workspace">
    <PageHeader eyebrow="Fiber Atlas · Engineer Workspace" title="მოძებნე ან ჰკითხე Fiber Atlas-ს" description="პასუხი ითვლება აქტიური Cable, Fiber, Node და local transition ჩანაწერებიდან. უცნობი მონაცემი უცნობად რჩება." />
    <form className="engineer-query-form" onSubmit={e => { e.preventDefault(); submit(); }}>
      <label className="sr-only" htmlFor="engineer-query">მოძებნე ან დასვი ქსელის კითხვა</label>
      <Search size={20} aria-hidden="true" />
      <input type="search" id="engineer-query" value={query} onChange={e => setQuery(e.target.value)} placeholder="მაგ. C151/F1 სად მიდის? · SC211-ში რა კაბელები ერთდება?" autoComplete="off" />
      <button className="button button-primary" type="submit">ძიება</button>
    </form>
    {!answer && <section className="engineer-examples"><h2>სწრაფი კითხვები</h2><div className="engineer-example-grid">{examples.map(item => <button key={item} onClick={() => submit(item)}>{item}<ArrowRight size={15} /></button>)}</div></section>}
    {answer && <section className="engineer-answer" data-current-path-signature={answer.pathSignature} aria-live="polite">
      <div className="engineer-answer-heading"><div><span className="eyebrow">{answer.query.raw}</span><h2>{answer.title}</h2><small>{outcomeLabels[answer.outcome]}</small></div><Badge tone={answer.state === 'conflict' ? 'danger' : answer.state === 'exact'&&['exact','derived_from_exact_lineage'].includes(answer.outcome) ? 'success' : 'warning'}>{['unknown_port','unknown_occupancy','review_required'].includes(answer.outcome)?outcomeLabels[answer.outcome]:stateLabels[answer.state]}</Badge></div>
      <p className="engineer-answer-text">{answer.answer}</p>
      {journey&&<CompactFiberJourney data={data} {...journey} onSelect={s=>navigate(focusedSelectionRoute(data,s))}/>}
      {!!answer.facts.length && <details className="engineer-evidence"><summary>დამატებითი ფაქტები</summary><div className="engineer-facts">{answer.facts.slice(0,['organization_network','aggregation_usage'].includes(answer.query.intent)?3:answer.facts.length).map((fact, i) => <div key={`${fact}-${i}`}>{fact}</div>)}</div>{answer.facts.length>3&&['organization_network','aggregation_usage'].includes(answer.query.intent)&&<details className="engineer-evidence"><summary>დამატებითი ქსელური დეტალები · {answer.facts.length-3}</summary><div className="engineer-facts">{answer.facts.slice(3).map((fact,i)=><div key={`${fact}-${i}`}>{fact}</div>)}</div></details>}</details>}
      {!!answer.transitions.length && <details className="engineer-transitions"><summary>Fiber გადასვლები · {answer.transitions.length}</summary><div className="engineer-transition-list">{answer.transitions.slice(0, showAllTransitions ? undefined : 80).map((edge,i) => <div key={`${edge.at}-${edge.from}-${i}`}><small>{edge.at}</small><strong>{edge.from} → {edge.to}</strong><span className="engineer-local-identity">{edge.localIdentity}</span><details><summary>წყარო</summary><span>{edge.source}</span></details></div>)}</div>{answer.transitions.length > 80 && <button type="button" className="button engineer-show-all" onClick={() => setShowAllTransitions(value => !value)}>{showAllTransitions ? 'მოკლე სია' : `ყველა გადასვლის ნახვა · ${answer.transitions.length}`}</button>}</details>}
      {!!answer.results.length && answer.state === 'disambiguation' && <div className="engineer-result-list">{answer.results.map(result => <div className="engineer-network-result" key={result.id}><button onClick={() => navigate(result.route)}><span><strong>{result.title}</strong><small>{result.category} · {result.subtitle}</small></span><ArrowRight size={17} /></button>{networkSelectionForResult(result.id) && <button className="context-link" onClick={() => showInNetwork(result.id)}>ქსელში ჩვენება</button>}</div>)}</div>}
      {!!answer.results.length && answer.state !== 'disambiguation' && answer.results.some(result => networkSelectionForResult(result.id)) && <div className="engineer-actions"><button className="button button-primary" onClick={() => { const result = answer.results.find(item => networkSelectionForResult(item.id)); if (result) showInNetwork(result.id); }}>ქსელში ჩვენება</button></div>}
      {!!answer.actions.length && <div className="engineer-actions">{answer.actions.map((route,i) => <button className="button" key={`${route.view}-${i}`} onClick={() => navigate(route)}>{route.view === 'trace' ? 'Fiber-ის სრული გზა' : route.view === 'cable' ? 'კაბელის გახსნა' : route.view === 'splice' ? 'შეერთებების ნახვა' : 'ობიექტის გახსნა'}</button>)}</div>}
      {!!compactResults.length && answer.state !== 'disambiguation' && <details className="engineer-evidence"><summary>შესაბამისი ქსელის ჩანაწერები · {compactResults.length}</summary>{compactResults.slice(0,12).map(result => <div className="engineer-network-result" key={result.id}><button onClick={() => navigate(result.route)}><span><strong>{result.title}</strong><small>{result.category} · {result.subtitle}</small>{result.facts?.map((fact,i)=><small key={i}>{fact}</small>)}<small className="route-action-label">{compactRouteAction(data,result)}</small></span><ArrowRight size={15} /></button>{networkSelectionForResult(result.id) && <button className="context-link" onClick={() => showInNetwork(result.id)}>ქსელში ჩვენება</button>}</div>)}</details>}
    </section>}
    {history.length > 0 && <section className="engineer-history"><h2>ბოლო ძიებები</h2>{history.map(item => <button key={item} onClick={() => submit(item)}>{item}</button>)}</section>}
    <p className="engineer-policy-note">კითხვების ენა მხოლოდ query ტიპს არჩევს. ყველა ქსელური ფაქტი deterministic Fiber Atlas მონაცემიდან მოდის.</p>
  </div>;
}

