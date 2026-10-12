/** Immutable geometry only. Mutable review state is never retained in this cache. */
export class BoundedReviewCache<T>{
 private values=new Map<string,{value:T;bytes:number;expires:number}>();
 private pending=new Map<string,Promise<T>>();private bytes=0;private epoch=0;
 constructor(private maxEntries=64,private maxBytes=32*1024*1024,private ttlMs=15*60*1000){}
 peek(key:string):T|undefined{const entry=this.values.get(key);if(!entry)return undefined;if(entry.expires<Date.now()){this.values.delete(key);this.bytes-=entry.bytes;return undefined;}this.values.delete(key);this.values.set(key,entry);return entry.value;}
 read(key:string,load:()=>Promise<T>):Promise<T>{const cached=this.peek(key);if(cached!==undefined)return Promise.resolve(cached);const pending=this.pending.get(key);if(pending)return pending;const epoch=this.epoch;
  const request=load().then(value=>{if(epoch!==this.epoch)return value;const bytes=new TextEncoder().encode(JSON.stringify(value)).byteLength;if(bytes<=this.maxBytes){this.values.set(key,{value,bytes,expires:Date.now()+this.ttlMs});this.bytes+=bytes;while(this.values.size>this.maxEntries||this.bytes>this.maxBytes){const oldest=this.values.keys().next().value!;this.bytes-=this.values.get(oldest)!.bytes;this.values.delete(oldest);}}return value;}).finally(()=>{if(this.pending.get(key)===request)this.pending.delete(key);});this.pending.set(key,request);return request;
 }
 clear(){this.epoch++;this.values.clear();this.pending.clear();this.bytes=0;}
}
let generation=0;const requests=new Map<string,Promise<unknown>>();
export function invalidateReviewReads(){generation++;requests.clear();}
export function readReviewJson<T>(path:string):Promise<T>{const key=generation+':'+path;let request=requests.get(key);if(!request){request=fetch('/api/v1/'+path,{headers:{Accept:'application/json'},credentials:'same-origin'}).then(async r=>{const value=await r.json();if(!r.ok)throw Error((r.status===409?'კონტექსტი ან მტკიცებულება შესამოწმებელია. ':r.status===401?'შესვლა საჭიროა. ':'ჩატვირთვა ვერ დასრულდა. ')+(value.message??''));return value;}).finally(()=>{if(requests.get(key)===request)requests.delete(key);});requests.set(key,request);}return request as Promise<T>;}
export function publishReviewChange(type:'review'|'session'){
 invalidateReviewReads();if(typeof window==='undefined')return;
 window.dispatchEvent(new Event('fiber-'+type+'-changed'));
 try{localStorage.setItem('fiber-'+type+'-generation',Date.now()+':'+Math.random());}catch{/* Disabled storage does not prevent same-tab refresh. */}
}
if(typeof window!=='undefined')window.addEventListener('storage',e=>{if(e.key==='fiber-review-generation'||e.key==='fiber-session-generation'){invalidateReviewReads();window.dispatchEvent(new Event(e.key==='fiber-review-generation'?'fiber-review-changed':'fiber-session-changed'));}});
