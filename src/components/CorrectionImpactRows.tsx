import {stopMeaning} from '../domain/iteration28i';
import type {CurrentStopKind} from '../domain/currentFiberPath';
type Path={state:string;sides:Array<{start:string;legs:Array<{label?:string;segmentId:string;fiberNumber:number;fiberColor?:string|null}>;stop:{kind:CurrentStopKind;label:string};ambiguous:boolean}>};
const labels:Record<string,string>={cables:'კაბელები',fibers:'ჟილები',tubes:'ტუბები',nodeFiberTransitions:'კვანძის გადასვლები',apPorts:'პორტები',sourceDocuments:'წყაროები',sourceReviewCases:'წყაროს საკითხები',portTopologyBindings:'პორტის მიბმები',currentFiberLineages:'ჟილის გზები',fiberJourneySummaries:'ცნობილი გზის შეჯამება',fiberUsageProjection:'გამოყენება',organizationNetworkProjection:'ორგანიზაციის კავშირები',aggregationOperationalProjection:'აგრეგაციის კავშირები'};
function PathView({value}:{value:unknown}){
 if(!value)return <p>ამ რევიზიაში ჟილა არ არის.</p>;
 const path=value as Path;
 return <div><strong>{path.state==='exact'?'სრული ცნობილი გზა':path.state==='ambiguous'?'ალტერნატივები':'ნაწილობრივი ცნობილი გზა'}</strong>{path.sides.map((s,i)=><div key={i}><h5>{s.stop.label}</h5><small>{stopMeaning(s.stop.kind)}</small>{s.ambiguous&&<p>ზუსტი ალტერნატივა</p>}<ol>{s.legs.map((l,j)=><li key={j}>{l.label??l.segmentId} · F{l.fiberNumber}{l.fiberColor?' · '+l.fiberColor:''}</li>)}</ol></div>)}</div>;
}
export function CorrectionImpactRows({rows,facet}:{rows:Array<Record<string,unknown>>;facet:'paths'|'facts'}){
 return <>{rows.map((row,i)=><article key={i} data-correction-impact={facet}><strong>{facet==='paths'?'ჟილა F'+row.fiberNumber:labels[String(row.collection).split('.')[0]]??'ქსელის ჩანაწერი'}</strong>{facet==='paths'?<div className="port-impact-columns"><section><h4>მანამდე</h4><PathView value={row.before}/></section><section><h4>შემდეგ</h4><PathView value={row.after}/></section></div>:<p>ამ ჩანაწერის მიღებული მნიშვნელობა ან წარმოებული პროექცია იცვლება.</p>}<details><summary>ტექნიკური შედარება და იდენტობები</summary><pre>{JSON.stringify(row,null,2)}</pre></details></article>)}</>;
}
