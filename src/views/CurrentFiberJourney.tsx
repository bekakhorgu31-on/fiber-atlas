import {CompactFiberJourney} from './CompactFiberJourney';
import type { Inventory, Route } from '../domain/types';
import type { WorkspaceSelection } from '../domain/routeWorkspace';
import { currentAssetLabel, currentStopLabel, resolveCurrentFiberPath } from '../domain/currentFiberPath';
import { getSegmentDisplayName } from '../domain/network';
import { connectionSheetForTransition } from '../domain/iteration22';
import { lineageForFiber } from '../domain/fiberLineage';
import { sc217OwnerReport } from '../domain/iteration28l';
import { orderedJourneySteps } from '../domain/iteration28i';
import { workspaceSelectionKey } from '../domain/routeWorkspace';
import { RouteDiagram, RouteWalkthrough, useRouteWalkthrough } from './RouteJourney';

const color = (value: {nameKa:string|null;nameEn:string|null}|null) => value?.nameKa ?? value?.nameEn ?? 'დაუდგენელია';
const pad = (n:number) => String(n).padStart(2,'0');
/** Current path presentation only. Every step and stop is supplied by the shared domain resolver. */
export function CurrentFiberJourney({data,cableId,fiberNumber,onSelect,navigate}:{data:Inventory;cableId:string;fiberNumber:number;onSelect:(selection:WorkspaceSelection)=>void;navigate:(route:Route)=>void}) {
  const path = resolveCurrentFiberPath(data,cableId,fiberNumber), cable = data.cables.find(c=>c.id===cableId)!;
  const journeyOptions=orderedJourneySteps(data,path),walkSteps=journeyOptions.length===1?journeyOptions[0]:[];
  const walk=useRouteWalkthrough(walkSteps,`${cableId}:${fiberNumber}`,path.signature);
  const lineage = lineageForFiber(data,cableId,fiberNumber), local = path.sides[0].legs[0];
  const usageView = data.fiberUsageProjection?.localViews.find(view=>view.segmentId===cableId&&view.fiberNumber===fiberNumber);
  const usageClaims = (usageView?.claimIds??[]).map(id=>data.fiberUsageProjection?.claims.find(claim=>claim.id===id)).filter((claim):claim is NonNullable<typeof claim>=>!!claim);
  const uses = (data.networkUseAssignments ?? []).filter(use=>use.fibers.some(f=>f.segmentId===cableId && f.fiberNumber===fiberNumber));
  const useNames = [...new Set(uses.map(use=>data.organizations.find(o=>o.id===use.organizationId)?.name??use.organizationId))];
  const recordedOwnerContext=path.sides.flatMap(side=>side.transitions).some(t=>t.evidence.notes.some(note=>note.startsWith('Owner reports F12 reaching Lentekhi')));
  const sc217F12OwnerReport = recordedOwnerContext && cable.legacyCableId === '169' && fiberNumber === 12 ? sc217OwnerReport : null;
  const short = (node: typeof cable.endpointA) => currentAssetLabel(data,node);
  const ends = path.sides.map((side,index)=>{
    const binding=data.portTopologyBindings?.find(b=>b.id===side.stop.portBindingId);
    return <div key={index}><span>{index===0?'ერთი ბოლო':'მეორე ბოლო'}{side.ambiguous?' · ზუსტი ალტერნატივა':''}</span>{binding?<button className="lineage-endpoint-action" type="button" data-lineage-endpoint={currentStopLabel(data,side.stop)} onClick={()=>onSelect({type:'port',ownerType:binding.ownerType,ownerId:binding.ownerId,number:binding.portNumber})}>{currentStopLabel(data,side.stop)}</button>:<strong>{short(side.stop.node)}</strong>}</div>;
  });
  return <div data-current-path-signature={path.signature} data-lineage-id={lineage?.id} className="current-fiber-journey">
    <CompactFiberJourney data={data} cableId={cableId} fiberNumber={fiberNumber} onSelect={onSelect}/><details className="compact-engineering"><summary>ინჟინრული ჩანაწერი</summary>
    <div className="inspector-heading"><button className="inspector-back" onClick={()=>onSelect({type:'segment',id:cableId})}>მონაკვეთი</button><span>ჟილა</span><h2>{getSegmentDisplayName(cable,data)} / F{pad(fiberNumber)}</h2><p>Legacy C{cable.legacyCableId}</p></div>
    <div className="lineage-answer-grid">{ends}<div><span>აქ</span><strong>F{pad(fiberNumber)} · {color(local.fiberColor)}</strong><small>ტუბი {local.tubeNumber??'დაუდგენელია'} · {color(local.tubeColor)}</small></div></div>
    {usageView&&<div className={`lineage-usage fiber-usage-state-${usageView.usageState}`} data-fiber-usage={usageView.usageState}><strong>{usageView.usageState==='in_use'?'გამოყენებაშია':usageView.usageState==='unused'?'არ გამოიყენება':usageView.usageState==='review_required'?'გადასამოწმებელია':'გამოყენება უცნობია'}</strong>{!!usageView.organization&&<span> · {usageView.organization}</span>}{!!usageView.purpose&&<span> · {usageView.purpose}</span>}{usageView.usageState==='unused'&&<small> ხელმისაწვდომობა და ადმინისტრაციული განაწილება უცნობია.</small>}
      {!!usageClaims.length&&<details><summary>წყარო და ცნობილი გზის გამოყენება</summary>{usageClaims.map(claim=><div key={claim.id}><p>წყაროში ჩანს: {claim.originSegmentId}/F{pad(claim.originFiberNumber)} · გზა ვრცელდება მხოლოდ დადასტურებულ მონაკვეთებზე.</p>{claim.sourceLabelShapeIds.map(id=><button key={'label'+id} className="workspace-text-action" onClick={()=>navigate({view:'import',runId:'SOURCE-B-28D',shapeId:id})}>კომპანიის Shape {id}</button>)}{claim.sourceLineShapeIds.map(id=><button key={'line'+id} className="workspace-text-action" onClick={()=>navigate({view:'import',runId:'SOURCE-B-28D',shapeId:id})}>ხაზის Shape {id}</button>)}{claim.evidenceBasis.includes('owner_confirmation')&&<small> · მფლობელის დადასტურება + Visio ხაზის სტილი</small>}</div>)}</details>}</div>}
    {!!useNames.length&&<div className="lineage-usage">იყენებს: {useNames.join(', ')}<details><summary>ქსელის გამოყენების წყარო</summary>{uses.map(use=><div key={use.id}><p>{data.organizations.find(o=>o.id===use.organizationId)?.name} · {use.source.file} · ადგილობრივი scope, ownership/service არ იგულისხმება.</p>{use.sourceShapeIds.map(id=><button key={id} className="workspace-text-action" onClick={()=>navigate({view:'import',runId:/alpana|tvishi/i.test(use.source.file)?'SOURCE-B-28D':undefined,shapeId:id})}>Shape {id}</button>)}</div>)}</details></div>}
    {sc217F12OwnerReport&&<div className="inspector-callout is-conflict" data-owner-report={sc217F12OwnerReport.id}><strong>F12 · გამოყენების ჩანაწერები წინააღმდეგობრივია</strong><p>SC217-ზე წყაროს გეომეტრია ადასტურებს C171/F12 ↔ C172/F12 გადასვლას. 2026-10-05 მფლობელის ანგარიში აღწერს ლენტეხამდე გაგრძელებას და Silknet-ის გამოყენებას; Skytel-ის ცალკე ჩანაწერიც შენარჩუნებულია.</p><p>ეს ანგარიში არ ადასტურებს ადგილზე შემოწმებას და არ ცვლის ლოკალური შეერთების მტკიცებულებას.</p></div>}
    <section className="inspector-section"><h3>მაქსიმალური ცნობილი გზა</h3>{path.state==='ambiguous'&&<p className="inspector-note">რამდენიმე ზუსტი ალტერნატივაა; თითოეული გზა ცალ-ცალკე ნაჩვენებია.</p>}
      {path.sides.map((side,index)=><div data-path-side={index} className="current-path-side" key={index}><h4>{short(side.startNode)}-ის მიმართულებით</h4><div className="lineage-journey">{side.legs.map((leg,legIndex)=>{const item=data.cables.find(c=>c.id===leg.segmentId)!;return <button className="lineage-journey-row" type="button" key={legIndex} data-leg-key={leg.segmentId+':'+leg.fiberNumber} onClick={()=>onSelect({type:'fiber',cableId:leg.segmentId,number:leg.fiberNumber})}><span className="lineage-location">{getSegmentDisplayName(item,data)}</span><span className="lineage-segments">C{item.legacyCableId} / F{pad(leg.fiberNumber)}</span><span className="lineage-identity">ტუბი {leg.tubeNumber??'დაუდგენელია'} · {color(leg.tubeColor)} · F{pad(leg.fiberNumber)} · {color(leg.fiberColor)}</span></button>})}</div>
        <p className={'inspector-stop'+(side.stop.kind==='termination'?' is-termination':'')} data-stop-kind={side.stop.kind}>{currentStopLabel(data,side.stop)}</p>
      </div>)}
    </section>
    <details className="inspector-disclosure current-journey-playback"><summary>ნაბიჯობრივი დათვალიერება · დადასტურებული Fiber გზა</summary>{journeyOptions.length===1?<><RouteDiagram data={data} items={walkSteps} optical activePath walk={walk} inspectedKey={workspaceSelectionKey({type:'fiber',cableId,number:fiberNumber})} onInspect={onSelect}/><RouteWalkthrough steps={walkSteps} walk={walk} modeLabel="არჩეული ჟილა"/></>:<p className="inspector-note">ალტერნატიული გზები ცალ-ცალკეა ნაჩვენები; ერთიანი გავლა გამორთულია.</p>}</details>
    <section className="inspector-section"><h3>არჩეული ჟილის გადასვლა</h3><div className="node-transition-list">{path.sides.flatMap(side=>side.transitions).map((t,index)=>{const from=data.cables.find(c=>c.id===t.from.segmentId)!,to=t.to?data.cables.find(c=>c.id===t.to!.segmentId):undefined;const sheet=connectionSheetForTransition(data,t.id);return <div className="node-transition-action" key={index} data-path-transition-id={t.id} data-transition-node={short(t.node)}><button type="button" disabled={!t.to} onClick={()=>t.to&&onSelect({type:'fiber',cableId:t.to.segmentId,number:t.to.fiberNumber})}><strong>{short(t.node)}</strong><span>C{from.legacyCableId}/F{pad(t.from.fiberNumber)} → {t.to?'C'+to?.legacyCableId+'/F'+pad(t.to.fiberNumber):'აქ მთავრდება'}</span><small>ტუბი {t.from.tubeNumber??'?'} · {color(t.from.tubeColor)} / {color(t.from.fiberColor)} → ტუბი {t.to?.tubeNumber??'—'} · {color(t.to?.tubeColor??null)} / {color(t.to?.fiberColor??null)}</small></button>{sheet&&<button className="transition-splice-link" type="button" onClick={()=>navigate({view:'splice',nodeKind:t.node.kind as 'closure'|'network_node'|'ap'|'aggregation',nodeId:t.node.id,relationshipId:sheet.id,focus:'fiber:'+t.from.segmentId+':'+t.from.fiberNumber})}>შეერთების ნახვა</button>}<details><summary>წყარო</summary><p>{t.evidence.source.file} · Shape {t.evidence.source.shapeIds.join(', ')}</p></details></div>})}</div></section>
    <details className="inspector-disclosure"><summary>ფიზიკური ჩანაწერი და წყარო</summary><p>{cable.source.file} · {cable.source.shapeIds.join(', ')}</p><p>Fiber identity: {cableId}/F{fiberNumber}</p></details>
  </details></div>;
}
