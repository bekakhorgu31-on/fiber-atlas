import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=name=>JSON.parse(readFileSync(name,'utf8'));
const before=read('docs/iteration28i-before-browser-qa.json'),after=read('docs/iteration28i-after-browser-qa.json');
assert.equal(after.status,'passed');assert.deepEqual(after.authoritativeHashes,before.authoritativeHashes);
assert.equal(createHash('sha256').update(readFileSync('../fiber-prototype.html')).digest('hex'),after.sha256);
assert.match(readFileSync('docs/iteration28i-tests.txt','utf8'),/pass 777/);
const median=values=>values.slice().sort((a,b)=>a-b)[Math.floor(values.length/2)];
const range=values=>`${Math.min(...values).toFixed(0)}–${Math.max(...values).toFixed(0)}`;
const b=before.coldLoads.map(r=>r.elapsed),a=after.coldLoads.map(r=>r.elapsed),gain=(100*(1-median(a)/median(b))).toFixed(1);
const searches=after.searchDelays.map(s=>s.ms),phase=name=>median(after.coldLoads.map(r=>r.marks.find(m=>m.name==='fiber-atlas:'+name)?.duration??0)).toFixed(0);
const largest=r=>Math.max(...r.coldLoads.flatMap(c=>c.longTasks));
const review=`# Iteration 28I — implementation and validation

Completed 2026-10-03. Artifact-bound browser run: ${after.timestamp}. Status: Done.

## Operator behavior

- One search per visible workspace. Exact AP42 opens AP42 directly, without Cable/Port flooding. Suggestions stop at five; larger queries have an all-results action. C172's two source identities remain separate. Cable cards show endpoints and capacity; construction and evidence stay in details.
- Cable C184 opens its two physical endpoints. Lentekhi Port38 opens the ordered optical path: Lentekhi Port38 → C184/F38 → SC224 remap C181/F06 → SC225 termination. It includes neither SC223 nor AP51. C152/F11 retains both remaps and AP49; C151/F118 retains the SC207 gap. Display steps are derived from the existing 28C resolver, never physical adjacency.
- Branches on a selected physical Cable remain behind counted disclosures. Uninterrupted middle Fiber steps can collapse with exact omitted counts; remaps, stops and the active step stay visible. A synthetic revisit/loop test preserves non-adjacent repeated nodes and the loop stop.
- One lazy detail area: side panel on desktop, ordinary inline disclosure on mobile. Source evidence, Port/Fiber grids and engineering pages remain accessible. AP47's unknown Port, unbound Tsageri Port175 and affected C148 Tube conflicts remain explicit. The Port Inspector now uses graph-derived endpoints; legacy range direction is secondary context.
- Previous/Next and optional Play/Pause use the same ordered steps as the static path. No autoplay or continuous loop. Manual stepping pauses playback; route changes unmount it. Reduced motion uses discrete selection changes. Full network retains the selected object and authoritative path signature.

## Measured startup work

The profile located repeated whole-transition scans in usage projection, rather than attributing all latency to bundle parsing. A snapshot-local transition-count index replaces those scans; Fiber-existence validation uses a Set. The resolver caches exact requests only within an explicit graph snapshot. No runtime snapshot, network lazy import or source deletion was introduced.

Isolated Node stage measurements: usage projection 2,014 → 152 ms. Before/after SHA-256 hashes match for the complete current path projection, current Lineages, JourneySummaries, usage projection, transitions and Port bindings. A regression checks these six complete projections against the pre-optimization baseline.

Same offline Edge ${after.browser}, fresh context per load, 1440×900, reduced motion, three cold loads before and after. Final timing run followed test completion so the test suite was not running concurrently.

| Measurement | Before | After |
|---|---:|---:|
| Ready UI median | ${median(b).toFixed(0)} ms | ${median(a).toFixed(0)} ms |
| Ready UI range | ${range(b)} ms | ${range(a)} ms |
| Largest startup long task | ${largest(before).toFixed(0)} ms | ${largest(after).toFixed(0)} ms |

Median startup improvement: ${gain}%. After instrumentation separates module-ready (median ${median(after.coldLoads.map(r=>r.moduleReady)).toFixed(0)} ms from navigation), individual inventory stages (28D ${phase('inventory:28D')} ms; 28E ${phase('inventory:28E')} ms), search-index creation (${phase('search-index')} ms) and the first-render milestone (${phase('first-render')} ms from navigation). Module-ready includes document/script parsing and module evaluation; it is not a V8-only parsing measurement. First render includes preceding inventory work, so these milestones must not be added together.

Search interaction after ready UI: median ${median(searches).toFixed(0)} ms, range ${range(searches)} ms across 30 recorded queries and widths. The 28I before run did not separately record interaction delay; 28H's historical 27–84 ms measurements are available for context, not a controlled paired comparison. No search-speed improvement is claimed.

## Verification and evidence

- 777/777 repository tests pass, including seven new 28I behavioral regressions. Historical UI text assertions were updated for the moved global notice and focused view; domain expectations were preserved.
- TypeScript, production build and standalone export pass. The existing large-bundle advisory remains (about 9.85 MB JavaScript before compression).
- Offline desktop 1440×900 and emulated touch 390×844 / 320×844 checks pass: exact-result keyboard selection, Space-operated step control, pause/end behavior, full-network selection, Back/query restoration, touch menu open/close, selected Port details, unknown/conflict states and document width. Zero page errors and unexpected external requests. Emulation is not real-device or field certification.
- All ${Object.keys(after.authoritativeHashes).length} top-level authoritative JSON files in src/data and reference retain their baseline hashes. Inventory stays 37 Cables, 2,088 Fibers, 1,629 active transitions, 48 Lentekhi exact bindings, 192 Tsageri Ports and zero C148 Port bindings. Frozen manifest remains 59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125.
- Standalone SHA-256: ${after.sha256}.

Reproducible checks: scripts/iteration28i-browser-qa.mjs; tests/iteration28i-focused-route.test.ts. Raw evidence: iteration28i-before-browser-qa.json, iteration28i-after-browser-qa.json, iteration28i-projection-{before,after}.json and iteration28i-tests.txt in this folder. Search screenshots compare both baseline widths; final selected-object/detail screenshots cover 1440, 390 and 320 pixels. Baseline selected-detail screenshots were not captured for every query; historical 28H screenshots remain archived. Current selected-detail behavior is verified by assertions and screenshots.

## Changed files and remaining limits

Application: App.tsx, main.tsx, styles.css, FocusedRoute.tsx, RouteWorkspace.tsx, NetworkTopologyCanvas.tsx and EngineerWorkspace.tsx. Domain/pipeline: iteration28i.ts, engineerQuery.ts, currentFiberPath.ts, iteration28e.ts and repository.ts. Tests and QA/report scripts accompany these changes.

Cold startup still has a substantial main-thread task and the standalone still embeds full offline evidence. No production-readiness claim follows from this UI iteration. Source unknowns and review decisions remain unchanged. No backend, new Visio import, architecture restart or deployment occurred.
`;
writeFileSync('docs/ITERATION-28I-IMPLEMENTATION-REVIEW.md',review);
let handoff=readFileSync('HANDOFF.md','utf8').replace('Delivered baseline: **28H**. Active work: **28I — simpler UI and focused route view**. Overall status: **In progress**.','Delivered baseline: **28I — simpler UI and focused route view**. Active work: **none queued**. Overall status: **Done**.').replace('## Active tasks','## Completed tasks — 28I').replaceAll('Status: **In progress**','Status: **Done**');
const notes=[
 'One visible search; exact AP42 primary result; five suggestions plus all-results; source-scoped C172 preserved. Verified offline at three widths.',
 'Focused physical Cable and ordered Fiber journey implemented through existing resolver. Port38, F11, F118 and full-network selection verified.',
 'Lazy desktop side/mobile inline details; source evidence remains available. AP47 unknown, Tsageri unbound and C148 conflict verified. Port detail roles use current graph endpoints.',
 'Static path plus optional discrete walkthrough; keyboard stepping, manual pause, termination and reduced motion verified. Synthetic revisit/loop fixture passes.',
 `Transition indexing and snapshot-local resolver memoization preserve all six complete projection hashes. Cold median ${median(b).toFixed(0)}→${median(a).toFixed(0)} ms (${gain}% improvement); startup task and bundle size remain limitations.`,
 `777/777 tests, TypeScript/build/export and offline Edge QA pass at 1440/390/320. ${Object.keys(after.authoritativeHashes).length} authoritative file hashes unchanged. Final artifact SHA-256: ${after.sha256}.`
];let index=0;handoff=handoff.replace(/^Worker notes:.*$/gm,()=>`Worker notes: ${notes[index++]}`);
if(!handoff.includes('28I delivered and verified.'))handoff=handoff.replace('## Current state\n','## Current state\n\n28I delivered and verified. See [implementation review](docs/ITERATION-28I-IMPLEMENTATION-REVIEW.md) and [artifact-bound browser evidence](docs/iteration28i-after-browser-qa.json). The previous 28H observations below are historical baseline evidence. No next iteration is authorized or queued here.\n');
writeFileSync('HANDOFF.md',handoff);
let validation=readFileSync('docs/VALIDATION.md','utf8');validation=validation.replace(/^# Validation record[^\n]*/, '# Validation record — 2026-10-03').replace(/\n\n## Iteration 28I[\s\S]*?(?=\n## Iteration 28H)/,'\n');
const section=`\n\n## Iteration 28I — simpler operator UI and focused routes\n\n- **777/777 tests pass**, with TypeScript, production build and standalone export. Offline Edge ${after.browser} at 1440×900, touch-emulated 390×844 and 320×844 passes all recorded assertions; zero page errors/external requests or document overflow.\n- Cable C184 and Lentekhi Port38 have distinct physical/optical views. Port38 remaps at SC224 to C181/F06 and terminates at SC225; F11/AP49, F118 gap, AP47 unknown, Tsageri unbound, C148 conflict, source evidence and Back/query restoration remain visible and verified. Manual/optional playback uses the same ordered path; synthetic revisit/loop regression passes.\n- Three paired cold loads: median ${median(b).toFixed(0)}→${median(a).toFixed(0)} ms; ranges ${range(b)}→${range(a)} ms; largest startup tasks ${largest(before).toFixed(0)}→${largest(after).toFixed(0)} ms. Final ready-UI search delays ${range(searches)} ms. Detailed methodology and limitations: [28I review](ITERATION-28I-IMPLEMENTATION-REVIEW.md).\n- Six complete derived projection hashes and ${Object.keys(after.authoritativeHashes).length} authoritative JSON hashes unchanged. Certified inventory and frozen manifest unchanged. Standalone SHA-256: ${after.sha256}. Raw QA: iteration28i-after-browser-qa.json; full test log: iteration28i-tests.txt.\n`;
validation=validation.replace(/\n\n## Iteration 28H/,section+'\n## Iteration 28H');writeFileSync('docs/VALIDATION.md',validation);
console.log(JSON.stringify({status:after.status,hash:after.sha256,medianBefore:median(b),medianAfter:median(a),gain,searchRange:range(searches),sourceFiles:Object.keys(after.authoritativeHashes).length}));
