import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ApiNetworkRepository,selectNetworkRepository,EmptyNetworkError} from '../src/data/apiRepository';
import type {Inventory} from '../src/domain/types';

test('the default browser fetch retains its required global receiver',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=(async function(this:unknown){assert.equal(this,globalThis);return new Response('Unavailable',{status:503});}) as typeof fetch;
  try {await assert.rejects(new ApiNetworkRepository().load(),/HTTP 503/);}finally{globalThis.fetch=original;}
});

test('database failure rejects visibly and never substitutes an offline snapshot',async()=>{
  let calls=0;
  const request=(async()=>{calls++;return new Response('Unavailable',{status:503});}) as typeof fetch;
  await assert.rejects(new ApiNetworkRepository('/api/v1',request).load(),/HTTP 503/);
  assert.equal(calls,1);
});
test('deferred evidence is pinned and cannot cross network revisions',async()=>{
  let requested='';
  const request=(async(url:RequestInfo|URL)=>{requested=String(url);return Response.json({apiVersion:1,networkRevision:'OTHER'});}) as typeof fetch;
  const data={dataAvailability:{mode:'database',networkRevision:'REV-A',deferredFields:['fiberLineages']}} as Inventory;
  await assert.rejects(new ApiNetworkRepository('/api/v1',request).loadDetails(data),/revision mismatch/);
  assert.equal(requested,'/api/v1/network/REV-A/details');
});
test('an unknown requested data mode fails rather than silently switching modes',async()=>{
  await assert.rejects(selectNetworkRepository('?data=unknown').load(),/Unknown data mode/);
});
test('an explicit empty response is separate from corrupt authority and API failure',async()=>{
 const request=(async()=>Response.json({apiVersion:1,networkState:'empty',networkRevision:null})) as typeof fetch;
 await assert.rejects(new ApiNetworkRepository('/api/v1',request).load(),EmptyNetworkError);
 const corrupt=(async()=>Response.json({apiVersion:1,networkRevision:'corrupt'})) as typeof fetch;
 await assert.rejects(new ApiNetworkRepository('/api/v1',corrupt).load(),error=>!(error instanceof EmptyNetworkError));
});
