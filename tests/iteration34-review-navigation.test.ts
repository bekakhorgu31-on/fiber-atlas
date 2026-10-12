import test from 'node:test';
import assert from 'node:assert/strict';
import {routeHash,parseRoute} from '../src/domain/navigation';
import type {Route} from '../src/domain/types';
import {readFileSync} from 'node:fs';
test('34 revision/run/source/case and review filters survive a stable URL round trip',()=>{
 const route:Route={view:'review',revision:'UPLOAD-abc',runId:'source-run',source:'DOC/sha',caseId:'SHIDA-REVIEW-x',category:'source_conflict',status:'open',group:'conflict:cable',page:2,query:'SC25075 F10',coverage:'banks'};
 assert.deepEqual(parseRoute(routeHash(route)),route);
});
test('34 review navigation does not trigger the unrelated deferred lineage/sheet loader',()=>{
 const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
 assert.match(app,/const requiresDetail=route\?\.view==='splice'/);assert.match(app,/route\?\.view==='review'\)screen=<ReviewInbox/);
});
