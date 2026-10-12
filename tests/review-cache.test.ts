import test from 'node:test';
import assert from 'node:assert/strict';
import {BoundedReviewCache} from '../src/data/reviewRequests';
test('immutable evidence cache deduplicates in-flight revisits, preserves identity and evicts oldest entries',async()=>{
 const cache=new BoundedReviewCache<{source:string}>(2,1024),value={source:'DOC-A/RUN-A/PAGE-0/SHAPE-50/DIAG-A'};let finish!:(v:typeof value)=>void,calls=0;
 const load=()=>{calls++;return new Promise<typeof value>(r=>finish=r);};const a=cache.read('A',load),same=cache.read('A',load);assert.equal(a,same);finish(value);assert.equal(await a,value);assert.equal(calls,1);
 await cache.read('B',async()=>({source:'DOC-B/RUN-B/PAGE-0/SHAPE-50/DIAG-B'}));assert.equal(cache.peek('A'),value);await cache.read('C',async()=>({source:'C'}));assert.equal(cache.peek('B'),undefined);assert.equal(cache.peek('A'),value);
});
test('authentication invalidation prevents an old in-flight response repopulating private geometry',async()=>{
 const cache=new BoundedReviewCache<string>();let finish!:(s:string)=>void;
 const old=cache.read('staged',()=>new Promise(r=>finish=r));cache.clear();finish('previous reviewer data');await old;assert.equal(cache.peek('staged'),undefined);
 await cache.read('staged',async()=>{throw Error('Unauthorized');}).catch(()=>{});assert.equal(cache.peek('staged'),undefined);
 const publicValue=await cache.read('active',async()=>'same source, current context');assert.equal(cache.peek('active'),publicValue);
});
test('oversized evidence and failed requests are not retained, and TTL expiry forces a new validation',async()=>{
 const cache=new BoundedReviewCache<string>(10,64,1);await cache.read('large',async()=>'x'.repeat(100));assert.equal(cache.peek('large'),undefined);
 await cache.read('failed',async()=>{throw Error('Missing exact run');}).catch(()=>{});assert.equal(await cache.read('failed',async()=>'retry succeeds'),'retry succeeds');
 await new Promise(r=>setTimeout(r,5));assert.equal(cache.peek('failed'),undefined);
});
