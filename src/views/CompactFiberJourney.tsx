import {useMemo,useState} from 'react';
import type {Inventory} from '../domain/types';
import type {WorkspaceSelection} from '../domain/routeWorkspace';
import {currentAssetLabel,currentEndpointLabel,resolveCurrentFiberPath} from '../domain/currentFiberPath';
import {localLegLabel,type RouteStep} from '../domain/iteration28i';
import {compactJourneyOptions,compactJourneyGroups} from '../domain/compactJourney';
import {RouteWalkthrough,useRouteWalkthrough,routeNodeSelection} from './RouteJourney';

/** Compact presentation of the existing resolver; no layout-derived optical edges. */
export function CompactFiberJourney({data,cableId,fiberNumber,onSelect,selectionKey=''}:{data:Inventory;cableId:string;fiberNumber:number;selectionKey?:string;onSelect:(s:WorkspaceSelection)=>void}) {
 const path=useMemo(()=>resolveCurrentFiberPath(data,cableId,fiberNumber),[data,cableId,fiberNumber]);
 const options=compactJourneyOptions(data,path),steps=options.length===1?options[0]:[],walk=useRouteWalkthrough(steps,`${cableId}:${fiberNumber}`,path.signature+':'+selectionKey);
 const [expanded,setExpanded]=useState(false),local=path.sides[0].legs[0];
 const usage=data.fiberUsageProjection?.localViews.find(v=>v.segmentId===cableId&&v.fiberNumber===fiberNumber);
 const render=(items:RouteStep[],option:number)=>{
   const groups=compactJourneyGroups(data,path,items,walk.active,expanded);
   return <ol className="compact-journey-stops" data-journey-option={option}>{groups.map(g=>'count'in g?<li key={'group'+g.start}><button onClick={()=>setExpanded(true)} data-grouped-stops={g.count}>შუალედური ადგილები · {g.count}<small>გაშლა</small></button></li>:<li key={g.index} data-journey-node={items[g.index].node.id} className={options.length===1&&walk.active===g.index?'is-current':''}><button onClick={()=>{walk.choose(g.index);onSelect(routeNodeSelection(items[g.index].node));}}><strong>{items[g.index].label}</strong>{items[g.index].remap&&<small>{items[g.index].remap}</small>}{items[g.index].stopKind&&<small className="ap-gap">{items[g.index].stopLabel}</small>}</button>{items[g.index].legAfter&&<button className="compact-journey-leg" data-local-leg={`${items[g.index].legAfter!.segmentId}/F${items[g.index].legAfter!.fiberNumber}`} data-animated-edge={options.length===1&&walk.playing&&walk.phase==='travel'&&walk.active===g.index?items[g.index].legAfter!.segmentId:undefined} onClick={()=>onSelect({type:'fiber',cableId:items[g.index].legAfter!.segmentId,number:items[g.index].legAfter!.fiberNumber})}>{localLegLabel(data,items[g.index].legAfter!)}</button>}</li>)}</ol>;
 };
 return <section className="compact-fiber-journey" data-current-path-signature={path.signature}>
 <header><span>არჩეული ჟილის გზა</span><h2>{path.sides.map(s=>currentEndpointLabel(data,s.stop)).join(' ↔ ')}</h2><p>F{String(fiberNumber).padStart(2,'0')} · {local.fiberColor?.nameKa??local.fiberColor?.nameEn??'ფერი დაუდგენელია'} · ტუბი {local.tubeNumber??'დაუდგენელია'}</p></header>
 {usage&&<p data-fiber-usage={usage.usageState}>გამოყენება: {usage.usageState==='in_use'?'გამოიყენება':usage.usageState==='unused'?'არ გამოიყენება':usage.usageState==='review_required'?'გადასამოწმებელია':'უცნობია'}{usage.organization?' · '+usage.organization:''} · ხელმისაწვდომობა ცალკე დასადგენია</p>}
 <div className="compact-endpoints">{path.sides.map((s,i)=>{const binding=data.portTopologyBindings?.find(b=>b.id===s.stop.portBindingId);return <div key={i}><strong>{currentEndpointLabel(data,s.stop)}</strong><small>{s.stop.kind==='port'?'ზუსტი პორტი':s.stop.kind==='termination'?'წყაროთი დადასტურებული დასრულება':s.stop.kind==='loop'?'ციკლი · კვალი შეჩერებულია':s.stop.kind==='external_boundary'?'გარე დოკუმენტის საზღვარი':'გაგრძელება დაუდგენელია'}</small>{binding&&<button onClick={()=>onSelect({type:'port',ownerType:binding.ownerType,ownerId:binding.ownerId,number:binding.portNumber})}>პორტის ნახვა</button>}</div>})}</div>
 {options.length>1&&<p className="ap-gap">ალტერნატივები ან ციკლი · გზები ცალ-ცალკეა; ერთიანი გავლა გამორთულია.</p>}
 {options.map(render)}
 {expanded&&<button onClick={()=>setExpanded(false)}>შუალედური ადგილების შეკუმშვა</button>}
 {options.length===1&&<details className="compact-playback"><summary>ნაბიჯობრივი დათვალიერება</summary><RouteWalkthrough steps={steps} walk={walk} modeLabel="ცნობილი გზა"/></details>}
 <details className="compact-path-details"><summary>ჟილების ფერები, გადასვლები და წყარო</summary>{path.sides.map((side,i)=><div key={i}><h3>{currentAssetLabel(data,side.startNode)}-ის მიმართულებით</h3>{side.legs.map((leg,j)=><button key={j} onClick={()=>onSelect({type:'fiber',cableId:leg.segmentId,number:leg.fiberNumber})}>{localLegLabel(data,leg)} · ტუბი {leg.tubeNumber??'?'} / {leg.tubeColor?.nameKa??'?'} · {leg.fiberColor?.nameKa??'ფერი დაუდგენელია'}</button>)}</div>)}{path.sides.flatMap(s=>s.transitions).map((t,i)=><p key={i} data-path-transition-id={t.id}>{currentAssetLabel(data,t.node)} · {localLegLabel(data,t.from)} → {t.to?localLegLabel(data,t.to):'დადასტურებული დასრულება'}<small>{t.evidence.source.file} · Shape {t.evidence.source.shapeIds.join(', ')}</small></p>)}</details>
 </section>;
}
