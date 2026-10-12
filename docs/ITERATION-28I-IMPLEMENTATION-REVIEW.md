# Iteration 28I — implementation and validation

Completed 2026-10-03. Artifact-bound browser run: 2026-10-03T11:45:13.448Z. Status: Done.

## Operator behavior

- One search per visible workspace. Exact AP42 opens AP42 directly, without Cable/Port flooding. Suggestions stop at five; larger queries have an all-results action. C172's two source identities remain separate. Cable cards show endpoints and capacity; construction and evidence stay in details.
- Cable C184 opens its two physical endpoints. Lentekhi Port38 opens the ordered optical path: Lentekhi Port38 → C184/F38 → SC224 remap C181/F06 → SC225 termination. It includes neither SC223 nor AP51. C152/F11 retains both remaps and AP49; C151/F118 retains the SC207 gap. Display steps are derived from the existing 28C resolver, never physical adjacency.
- Branches on a selected physical Cable remain behind counted disclosures. Uninterrupted middle Fiber steps can collapse with exact omitted counts; remaps, stops and the active step stay visible. A synthetic revisit/loop test preserves non-adjacent repeated nodes and the loop stop.
- One lazy detail area: side panel on desktop, ordinary inline disclosure on mobile. Source evidence, Port/Fiber grids and engineering pages remain accessible. AP47's unknown Port, unbound Tsageri Port175 and affected C148 Tube conflicts remain explicit. The Port Inspector now uses graph-derived endpoints; legacy range direction is secondary context.
- Previous/Next and optional Play/Pause use the same ordered steps as the static path. No autoplay or continuous loop. Manual stepping pauses playback; route changes unmount it. Reduced motion uses discrete selection changes. Full network retains the selected object and authoritative path signature.

## Measured startup work

The profile located repeated whole-transition scans in usage projection, rather than attributing all latency to bundle parsing. A snapshot-local transition-count index replaces those scans; Fiber-existence validation uses a Set. The resolver caches exact requests only within an explicit graph snapshot. No runtime snapshot, network lazy import or source deletion was introduced.

Isolated Node stage measurements: usage projection 2,014 → 152 ms. Before/after SHA-256 hashes match for the complete current path projection, current Lineages, JourneySummaries, usage projection, transitions and Port bindings. A regression checks these six complete projections against the pre-optimization baseline.

Same offline Edge 154.0.4258.48, fresh context per load, 1440×900, reduced motion, three cold loads before and after. Final timing run followed test completion so the test suite was not running concurrently.

| Measurement | Before | After |
|---|---:|---:|
| Ready UI median | 3319 ms | 2165 ms |
| Ready UI range | 3246–3402 ms | 2073–2386 ms |
| Largest startup long task | 2850 ms | 1912 ms |

Median startup improvement: 34.8%. After instrumentation separates module-ready (median 249 ms from navigation), individual inventory stages (28D 1101 ms; 28E 99 ms), search-index creation (9 ms) and the first-render milestone (2092 ms from navigation). Module-ready includes document/script parsing and module evaluation; it is not a V8-only parsing measurement. First render includes preceding inventory work, so these milestones must not be added together.

Search interaction after ready UI: median 31 ms, range 7–120 ms across 30 recorded queries and widths. The 28I before run did not separately record interaction delay; 28H's historical 27–84 ms measurements are available for context, not a controlled paired comparison. No search-speed improvement is claimed.

## Verification and evidence

- 777/777 repository tests pass, including seven new 28I behavioral regressions. Historical UI text assertions were updated for the moved global notice and focused view; domain expectations were preserved.
- TypeScript, production build and standalone export pass. The existing large-bundle advisory remains (about 9.85 MB JavaScript before compression).
- Offline desktop 1440×900 and emulated touch 390×844 / 320×844 checks pass: exact-result keyboard selection, Space-operated step control, pause/end behavior, full-network selection, Back/query restoration, touch menu open/close, selected Port details, unknown/conflict states and document width. Zero page errors and unexpected external requests. Emulation is not real-device or field certification.
- All 45 top-level authoritative JSON files in src/data and reference retain their baseline hashes. Inventory stays 37 Cables, 2,088 Fibers, 1,629 active transitions, 48 Lentekhi exact bindings, 192 Tsageri Ports and zero C148 Port bindings. Frozen manifest remains 59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125.
- Standalone SHA-256: 117fd2e39bba4daf111d09033ce1a3044cbf83116f30f796b5046cb0db1b309c.

Reproducible checks: scripts/iteration28i-browser-qa.mjs; tests/iteration28i-focused-route.test.ts. Raw evidence: iteration28i-before-browser-qa.json, iteration28i-after-browser-qa.json, iteration28i-projection-{before,after}.json and iteration28i-tests.txt in this folder. Search screenshots compare both baseline widths; final selected-object/detail screenshots cover 1440, 390 and 320 pixels. Baseline selected-detail screenshots were not captured for every query; historical 28H screenshots remain archived. Current selected-detail behavior is verified by assertions and screenshots.

## Changed files and remaining limits

Application: App.tsx, main.tsx, styles.css, FocusedRoute.tsx, RouteWorkspace.tsx, NetworkTopologyCanvas.tsx and EngineerWorkspace.tsx. Domain/pipeline: iteration28i.ts, engineerQuery.ts, currentFiberPath.ts, iteration28e.ts and repository.ts. Tests and QA/report scripts accompany these changes.

Cold startup still has a substantial main-thread task and the standalone still embeds full offline evidence. No production-readiness claim follows from this UI iteration. Source unknowns and review decisions remain unchanged. No backend, new Visio import, architecture restart or deployment occurred.
