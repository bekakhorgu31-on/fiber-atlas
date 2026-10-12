import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import type {Inventory} from '../src/domain/types';
import {packJson,unpackJson,buildOperationalPayload,hydrateOperationalPayload} from '../src/domain/operationalPayload';

test('shared JSON transport roundtrips repeated objects and literal reference-like keys',()=>{
  const record={text:'evidence'.repeat(50),number:17};
  const value={records:[record,structuredClone(record)],literal:{$faRef:0},nested:{$faLiteral:{$faRef:1}}};
  assert.deepEqual(unpackJson(packJson(value)),value);
  assert.throws(()=>unpackJson({format:'fiber-atlas-shared-json/1',root:{$faRef:0},dictionary:[{$faRef:0}]}),/cyclic/);
});
test('operational response preserves all 2088 path structures and every transition/binding',()=>{
  const baseline=JSON.parse(gunzipSync(readFileSync(new URL('../migration/iteration29/baseline/active-28l-inventory.json.gz',import.meta.url))).toString()) as Inventory;
  const authority=JSON.parse(gunzipSync(readFileSync(new URL('../migration/iteration29/baseline/active-28l-authority.json.gz',import.meta.url))).toString()) as Inventory;
  assert.deepEqual(authority,baseline);
  const payload=buildOperationalPayload(authority,'TEST-28L'),live=hydrateOperationalPayload(JSON.parse(JSON.stringify(payload)));
  assert.deepEqual(live.fiberPathProjection!.paths,baseline.fiberPathProjection!.paths);
  assert.deepEqual(live.nodeFiberTransitions,baseline.nodeFiberTransitions);
  assert.deepEqual(live.portTopologyBindings,baseline.portTopologyBindings);
  assert.deepEqual(live.currentFiberLineages,baseline.currentFiberLineages);
  assert.deepEqual(live.fiberJourneySummaries,baseline.fiberJourneySummaries);
  assert.equal(live.fiberLineages,undefined);
  assert.ok(live.dataAvailability!.deferredFields.includes('fiberLineages'));
  assert.throws(()=>hydrateOperationalPayload({...payload,counts:{...payload.counts,fibers:2087}}),/Incomplete/);
  assert.throws(()=>hydrateOperationalPayload({...payload,topologyRevision:'wrong'}),/mismatch/);
});
