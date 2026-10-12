import {useEffect,useMemo,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import type {AssetRef,CableRoute,Inventory,ViewProps} from '../domain/types';
import {apPhysicalContext,apPortCount,apWorkspaceRoute,inspectedAPObject,selectedAPPort,type WorkspaceRoute} from '../domain/iteration28j';
import {currentAssetLabel,resolveCurrentFiberPath} from '../domain/currentFiberPath';
import {hasConstructionConflict,localLegLabel,orderedJourneySteps,type RouteStep} from '../domain/iteration28i';
import {portOperationalView} from '../domain/iteration28g';
import {workspaceSelectionKey,type WorkspaceSelection} from '../domain/routeWorkspace';
import {sourceBAP} from '../domain/iteration28d';
import {NetworkTopologyCanvas} from './NetworkTopologyCanvas';
import {RouteDiagram,RouteWalkthrough,useRouteWalkthrough} from './RouteJourney';

const key=(ref:AssetRef)=>`${ref.kind}:${ref.id}`;
const occupancy={in_use:'გამოიყენება',unused:'არ გამოიყენება',unknown:'დაუდგენელია'};

/** The workspace target is independent of Port and inspection selection. No connectivity is created here. */
export function APWorkspace({data,navigate,route,state,target,renderInspector}:{data:Inventory;navigate:ViewProps['navigate'];route:CableRoute;state:WorkspaceRoute;target:AssetRef;renderInspector:(s:WorkspaceSelection,onSelect:(s:WorkspaceSelection)=>void)=>ReactNode}) {
 const context=useMemo(()=>apPhysicalContext(data,target,route,state.origin,state.physicalPath),[data,target.kind,target.id,route,state.origin,state.physicalPath]);
 const portNumber=selectedAPPort(data,target,state),mode=state.mode??(portNumber?'fiber':'physical'),inspected=inspectedAPObject(state,target,portNumber),inspectedKey=workspaceSelectionKey(inspected);
 const ports=useMemo(()=>Array.from({length:apPortCount(data,target)},(_,i)=>portOperationalView(data,'ap',target.id,i+1,false)),[data,target.kind,target.id]);
 const port=ports.find(p=>p.portNumber===portNumber),sourceAP=target.kind==='network_node'?sourceBAP(target.id):undefined,sourceA=target.kind==='ap'?data.accessPoints.find(a=>a.id===target.id):undefined;
 const path=useMemo(()=>port?.segmentId&&port.fiberNumber?resolveCurrentFiberPath(data,port.segmentId,port.fiberNumber):null,[data,port?.segmentId,port?.fiberNumber]);
 const journeys=useMemo(()=>path?orderedJourneySteps(data,path):[],[data,path]);
 const opticalSelection=useMemo<WorkspaceSelection>(()=>mode==='fiber'&&portNumber?{type:'port',ownerType:'ap',ownerId:target.id,number:portNumber}:{type:'route',id:route.id},[mode,portNumber,target.id,route.id]);
 const opticalLegs=useMemo(()=>new Map(path?.sides.flatMap(s=>s.legs).map(l=>[l.segmentId,l.fiberNumber])??[]),[path]);
 const physicalSteps:RouteStep[]=useMemo(()=>context.path?.nodes.map((node,i)=>({node,label:currentAssetLabel(data,node),remap:null,legAfter:i<context.path!.segmentIds.length?{segmentId:context.path!.segmentIds[i],fiberNumber:0}:null,stopKind:null,stopLabel:null}))??[],[data,context.path]);
 const steps=mode==='physical'?physicalSteps:journeys.length===1?journeys[0]:[];
 const walk=useRouteWalkthrough(steps,`${target.kind}:${target.id}:${portNumber}:${mode}`,`${state.inspect}:${state.overview}`);
 const {active,playing,phase,setPlaying,setPhase}=walk;
 const rail=useRef<HTMLDivElement>(null),[scrollable,setScrollable]=useState(false);
 const update=(changes:Parameters<typeof apWorkspaceRoute>[3],replace=false)=>navigate(apWorkspaceRoute(state,target,context.origin,changes),{replace});
 useEffect(()=>{if(!state.target)navigate(apWorkspaceRoute(state,target,context.origin,{port:portNumber??undefined,mode}),{replace:true});},[state.target,target.kind,target.id]);
 useEffect(()=>{const el=rail.current;if(!el)return;const check=()=>setScrollable(el.scrollHeight>el.clientHeight+1),observer=new ResizeObserver(check);observer.observe(el);for(const child of el.children)observer.observe(child);check();return()=>observer.disconnect();},[portNumber,inspectedKey]);
 const inspect=(selection:WorkspaceSelection)=>{setPlaying(false);setPhase('dwell');if(selection.type==='port'&&selection.ownerType==='ap'&&selection.ownerId===target.id){update({port:selection.number,mode:'fiber',inspect:undefined});return;}update({inspect:workspaceSelectionKey(selection)},true);};
 const choosePort=(number:number)=>{setPlaying(false);update({port:number,mode:'fiber',inspect:undefined});};
 const evidence=(shapeId:string,sourceFile?:string)=>{setPlaying(false);navigate({view:'import',runId:/alpana|tvishi/i.test(sourceFile??sourceAP?.source.file??'')?'SOURCE-B-28D':undefined,shapeId});};
 const inspectedRef='id'in inspected?{kind:inspected.type,id:inspected.id} as AssetRef:null;
 const retarget=()=>{if(!inspectedRef)return;setPlaying(false);navigate({view:'route',id:route.id,selection:workspaceSelectionKey(inspected),origin:state.origin});};
 const diagram=(items:RouteStep[],optical:boolean)=><RouteDiagram data={data} items={items} optical={optical} mode={mode} opticalLegs={opticalLegs} activePath={items===steps} walk={walk} inspectedKey={inspectedKey} onInspect={inspect}/>;
 const inspectionIsPort=inspected.type==='port'&&inspected.ownerId===target.id&&inspected.number===portNumber;
 return <div className="ap-workspace" data-ap-workspace={target.id} data-current-path-signature={path?.signature} data-mode={mode} data-selected-port={portNumber??''} data-origin={context.origin?.id??''} data-playing={playing} data-active-step={active} data-phase={phase}>
  <header className="ap-context-bar"><div><span>ქსელი / {context.origin?currentAssetLabel(data,context.origin):'საწყისი წერტილი დაუდგენელია'}</span><h1>AP{target.id}{portNumber?` · Port ${portNumber}`:''}</h1></div><div className="ap-context-controls"><button onClick={()=>update({overview:!state.overview})}>{state.overview?'AP-ის გზაზე დაბრუნება':'მთლიანი ქსელი'}</button><label>კონტექსტის დასაწყისი<select aria-label="კონტექსტის დასაწყისი" value={context.origin?key(context.origin):''} onChange={e=>{setPlaying(false);navigate({...state,origin:e.target.value||undefined,physicalPath:undefined});}}><option value="">აირჩიეთ აგრეგაცია</option>{context.origins.map(o=><option key={key(o)} value={key(o)}>{currentAssetLabel(data,o)}</option>)}</select></label></div></header>
  <div className="ap-workspace-body">
   <aside className="ap-rail" aria-label={`AP${target.id} პორტები და დეტალები`}><header className="ap-rail-identity"><strong>AP{target.id} · {ports.length} პორტი{portNumber?` / Port ${portNumber}`:''}</strong><small>{sourceAP?.place??sourceA?.name}</small>{port?<span data-header-occupancy={port.occupancyState}>პორტი: {occupancy[port.occupancyState]}</span>:ports.some(p=>p.occupancyState==='unknown')&&<span>{ports.filter(p=>p.occupancyState==='unknown').length} პორტის სტატუსი დაუდგენელია</span>}</header>
    <div className="ap-rail-scroll" ref={rail} tabIndex={0} aria-label="პორტებისა და დეტალების გადახვევა">
     <section className="ap-port-section"><h2>პორტის არჩევა</h2><div className="ap-port-bank">{ports.map(p=><button type="button" key={p.portNumber} data-ap-port={p.portNumber} data-occupancy={p.occupancyState} aria-label={`AP${target.id} Port ${p.portNumber} · ${occupancy[p.occupancyState]}`} aria-pressed={portNumber===p.portNumber} className={`is-${p.occupancyState}`} onClick={()=>choosePort(p.portNumber)}><strong>{p.portNumber}</strong><small>{occupancy[p.occupancyState]}</small></button>)}</div><p className="ap-note">პორტის ფიზიკური სტატუსი და ჟილის გამოყენება დამოუკიდებელი ჩანაწერებია.</p></section>
     {port&&<section className="ap-port-facts"><h2>Port {portNumber}</h2><p data-detail-occupancy={port.occupancyState}>პორტის ფიზიკური სტატუსი: <strong>{occupancy[port.occupancyState]}</strong></p><p data-fiber-use={port.usageState??'unknown'}>ჟილის გამოყენება: <strong>{port.usageState==='review_required'?'გადასამოწმებელია':port.usageState==='in_use'?'გამოყენებაშია':port.usageState==='unused'?'არ გამოიყენება':'დაუდგენელია'}</strong>{port.organization&&` · ${port.organization}`}</p>{port.bindingId?<p>F{String(port.fiberNumber).padStart(2,'0')} · {port.fiberColor??'ფერი დაუდგენელია'}<br/>ტუბი {port.tubeNumber??'?'} · {port.tubeColor??'ფერი დაუდგენელია'}</p>:<p className="ap-gap">ზუსტი Port ↔ Fiber მიბმა დაუდგენელია.</p>}{port.segmentId&&hasConstructionConflict(data,port.segmentId,port.fiberNumber??undefined)&&<p className="ap-gap">ტუბის ფერის წყაროთა კონფლიქტი · ორივე ჩანაწერი შენარჩუნებულია</p>}</section>}
     <section className="ap-inspection" data-inspected={inspectedKey}><h2>არჩეული დეტალი</h2>{inspectionIsPort?<p>AP{target.id} / Port {portNumber} · პორტის ჩანაწერი ზემოთ; ცნობილი გზა მარშრუტზე.</p>:inspectedKey===key(target)?<p>AP{target.id} რჩება მარშრუტის დანიშნულებად. კვანძის ან კაბელის არჩევა აქ ცვლის მხოლოდ დეტალებს.</p>:<>{renderInspector(inspected,inspect)}{inspectedRef&&<button data-open-destination onClick={retarget}>დანიშნულებად გახსნა</button>}</>}</section>
     {path&&<section className="ap-transition-evidence"><h2>გადასვლები და საზღვრები</h2>{path.sides.map((s,i)=><p key={i}>{currentAssetLabel(data,s.stop.node)} · {s.stop.kind==='port'?'პორტთან აღწევს':s.stop.kind==='termination'?'აქ მთავრდება':'გაგრძელება დაუდგენელია'}</p>)}{path.sides.flatMap(s=>s.transitions).map((t,i)=><div key={i}><strong>{currentAssetLabel(data,t.node)}</strong><p>{localLegLabel(data,t.from)} → {t.to?localLegLabel(data,t.to):'აქ მთავრდება'}</p><button onClick={()=>evidence(t.evidence.source.shapeIds[0],t.evidence.source.file)}>გადასვლის წყარო · {t.evidence.source.shapeIds[0]}</button></div>)}</section>}
     <section className="ap-source-actions"><h2>წყაროს ჩანაწერები</h2><p>{sourceAP?.source.file??sourceA?.source.file}</p>{sourceAP?.ports.map(p=><button key={p.number} data-port-evidence={p.number} onClick={()=>evidence(p.shapeId)}>Port {p.number} · წყაროს ნახვა</button>)}{sourceAP&&<button data-last-evidence onClick={()=>evidence(sourceAP.rootShapeId)}>AP{target.id} · წყაროს ნახვა</button>}{sourceA?.source.shapeIds.map((id,i)=><button data-last-evidence={i===sourceA.source.shapeIds.length-1?true:undefined} key={id} onClick={()=>evidence(id,sourceA.source.file)}>AP{target.id} · წყაროს ნახვა · {id}</button>)}</section>
    </div>{scrollable&&<small className="ap-scroll-hint">↕ პორტები და წყარო — გადახვევა / PageDown</small>}
   </aside>
   <section className="ap-route-canvas" aria-label="AP-ის მარშრუტი"><div className="ap-mode-controls"><button aria-pressed={mode==='physical'} onClick={()=>update({mode:'physical'})}>ფიზიკური გზა</button><button disabled={!portNumber} aria-pressed={mode==='fiber'} onClick={()=>update({mode:'fiber'})}>ჟილის ცნობილი გზა</button><span>{mode==='physical'?'ფიზიკური კაბელი · ოპტიკური კავშირი არ იგულისხმება':'ნეიტრალური კაბელი / გამოკვეთილი ცნობილი ჟილა'}</span></div>
    {context.paths.length>1&&<label className="ap-path-choice">ფიზიკური გზის არჩევა<select value={context.path?.id??''} onChange={e=>update({physicalPath:e.target.value})}>{context.paths.map((p,i)=><option key={p.id} value={p.id}>{i+1} · {p.nodes.map(n=>currentAssetLabel(data,n)).join(' ↔ ')}</option>)}</select></label>}
    {context.invalidChoice&&<p className="ap-gap">არჩეული კონტექსტი ამ AP-ს არ უკავშირდება. აირჩიეთ ნაჩვენები აგრეგაცია / გზა.</p>}{context.truncated&&<p className="ap-gap">გზების სია შეზღუდულია; ოპტიკური გზა ამ არჩევანით არ დგინდება.</p>}
    {state.overview?<NetworkTopologyCanvas data={data} selection={inspected} opticalSelection={opticalSelection} collapsedKeys={state.collapsed??[]} onSelect={inspect} onCollapsedChange={collapsed=>update({collapsed},true)}/>:<><h2>ფიზიკური კონტექსტი · {context.origin?currentAssetLabel(data,context.origin):'დასაწყისი უცნობია'} ↔ AP{target.id}</h2>{physicalSteps.length?diagram(physicalSteps,false):<><p className="ap-gap">აგრეგაციიდან ფიზიკური გზა არ არის დადგენილი. ნაჩვენებია ცნობილი ქვექსელი.</p><NetworkTopologyCanvas data={data} selection={inspected} opticalSelection={opticalSelection} collapsedKeys={state.collapsed??[]} onSelect={inspect} onCollapsedChange={collapsed=>update({collapsed},true)}/></>}
     {mode==='fiber'&&<section className="ap-optical-context"><h2>Port {portNumber} · ჟილის მაქსიმალური ცნობილი გზა</h2>{journeys.map((j,i)=><div key={i}>{diagram(j,true)}</div>)}{!path&&<p className="ap-gap">ზუსტი ჟილა დაუდგენელია · ფიზიკური გზა ოპტიკურ კავშირს არ ქმნის.</p>}{path?.sides.some(s=>s.stop.node.kind==='aggregation'&&s.stop.kind!=='port')&&<p className="ap-gap">აგრეგაციამდე აღწევს; აგრეგაციის ზუსტი პორტი დაუდგენელია.</p>}{context.origin&&path&&!path.sides.some(s=>key(s.stop.node)===key(context.origin!))&&<p className="ap-gap" data-upstream-gap>აგრეგაციამდე ოპტიკური გაგრძელება დაუდგენელია. ზემოთ კაბელები მხოლოდ ფიზიკური კონტექსტია.</p>}{path?.state==='ambiguous'&&<p className="ap-gap">რამდენიმე ალტერნატივა · ერთიანი გავლა გამორთულია.</p>}</section>}
     <RouteWalkthrough steps={steps} walk={walk} modeLabel={mode==='physical'?'კაბელი':'ჟილა'}/>
    </>}
   </section>
  </div>
 </div>;
}


