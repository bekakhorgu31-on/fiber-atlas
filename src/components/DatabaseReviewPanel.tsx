import {useEffect,useState} from 'react';
import type {Inventory} from '../domain/types';

type Session={csrfToken:string;user:{id:number;name:string;role:string}|null};
type Event={id:string;subject_id:string;version:number;action:string;reason:string;actor_name:string;created_at:string};
export function DatabaseReviewPanel({data}:{data:Inventory}) {
  const revision=data.dataAvailability?.networkRevision;
  const [session,setSession]=useState<Session|null>(null),[events,setEvents]=useState<Event[]>([]),[error,setError]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[reason,setReason]=useState(''),[action,setAction]=useState('unresolved'),[subject,setSubject]=useState(data.sourceReviewCases?.[0]?.id??data.assertions?.[0]?.id??''),[busy,setBusy]=useState(false);
  const refresh=async()=>{
    const [s,e]=await Promise.all([fetch('/api/v1/session',{headers:{Accept:'application/json'}}),fetch(`/api/v1/network/${encodeURIComponent(revision!)}/review-events`,{headers:{Accept:'application/json'}})]);
    if(!s.ok||!e.ok)throw new Error('მიმოხილვის მონაცემები ვერ ჩაიტვირთა.');
    setSession(await s.json());setEvents((await e.json()).events);
  };
  useEffect(()=>{const change=()=>{if(revision)refresh().catch(e=>setError(String(e.message)));};change();window.addEventListener('fiber-session-changed',change);return()=>window.removeEventListener('fiber-session-changed',change);},[revision]);
  if(!revision)return null;
  const post=async(path:string,body:unknown)=>{
    const response=await fetch('/api/v1/'+path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json','X-CSRF-TOKEN':session!.csrfToken},body:JSON.stringify(body)});
    const result=await response.json();
    if(!response.ok)throw new Error(response.status===409?'მიმოხილვა შეიცვალა. განაახლეთ და სცადეთ თავიდან.':result.message??'შენახვა ვერ შესრულდა.');
    if(path==='review-events')window.dispatchEvent(new Event('fiber-review-changed'));
    return result;
  };
  const run=async(work:()=>Promise<void>)=>{setBusy(true);setError('');try{await work();}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
  const choices=[...(data.sourceReviewCases??[]).map(c=>({id:c.id,label:c.question})),...(data.assertions??[]).map(a=>({id:a.id,label:a.subjectId+' · '+a.claimType}))];
  const version=Math.max(0,...events.filter(e=>e.subject_id===subject).map(e=>e.version));
  return <section className="panel" aria-label="ბაზაში შენახული მიმოხილვა"><h2>ბაზაში შენახული მიმოხილვა</h2>
    {error&&<p role="alert">{error}</p>}
    {!session?<p>იტვირთება…</p>:!session.user?<form onSubmit={e=>{e.preventDefault();void run(async()=>{setSession(await post('login',{email,password}));setPassword('');await refresh();});}}><label className="field"><span>ელფოსტა</span><input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label className="field"><span>პაროლი</span><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="button" disabled={busy}>შესვლა</button></form>:<>
      <p>{session.user.name} · {session.user.role==='reviewer'?'მიმომხილველი':'მხოლოდ ნახვა'}</p>
      <form onSubmit={e=>{e.preventDefault();void run(async()=>{await post('review-events',{expectedNetworkRevision:revision,subjectId:subject,expectedReviewVersion:version,action,reason});setReason('');await refresh();});}}>
        <label className="field"><span>საკითხი</span><select value={subject} onChange={e=>setSubject(e.target.value)}>{choices.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
        <label className="field"><span>გადაწყვეტილება</span><select value={action} onChange={e=>setAction(e.target.value)}><option value="unresolved">ჯერ დაუდგენელია</option><option value="accepted">მიღებულია</option><option value="rejected">უარყოფილია</option></select></label>
        <label className="field"><span>მიზეზი</span><textarea value={reason} onChange={e=>setReason(e.target.value)} required maxLength={2000}/></label>
        <button className="button" disabled={busy||session.user.role!=='reviewer'||!subject}>შენახვა ბაზაში</button>
      </form>
    </>}
    <button className="button" type="button" onClick={()=>void run(refresh)} disabled={busy}>განახლება</button>
    <ul>{events.filter(e=>e.subject_id===subject).map(e=><li key={e.id}>{e.action} · {e.reason} · {e.actor_name} · {e.created_at}</li>)}</ul>
  </section>;
}
