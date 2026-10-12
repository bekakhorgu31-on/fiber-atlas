# Fiber Atlas — current handoff

Updated: 2026-10-05. Delivered baseline: **28L**. Active work: none. **Iteration 28L is Done** for its scoped SC217 correction and persistent map inspection delivery.

The user reports that Silknet F12 continues beyond SC217 to Lentekhi (AGG6), although the app drops it, and rejects the old sparse object/stacked Fiber views opened by overall-flow clicks. Treat this as both a targeted data-correction investigation and a UI consistency task.

## Read first

- [28L completed source audit and prepared UI continuation](docs/ITERATION-28L-SC217-SOURCE-AUDIT.md).

- [28L requirements, user correction and acceptance](docs/ITERATION-28L-SC217-CONTINUITY-AND-MAP-INSPECTION.md).
- [Actual path reproduction](docs/iteration28l-path-reproduction.json).
- User screenshots: [Fiber view](docs/iteration28l-user-fiber-view.png), [SC206 view](docs/iteration28l-user-sc206-view.png).
- [28K delivered baseline](docs/ITERATION-28K-IMPLEMENTATION-REVIEW.md).
- [Archived handoff through 28K](docs/archive/HANDOFF-THROUGH-28K-2026-10-05.md).

## Confirmed findings

- C169/F10 and C169/F12 both stop at SC217 in the current resolver presentation; C169/F11 already reaches Lentekhi Port11.
- C184/F12 has a downstream path back to SC217 on C172/F12, currently labeled Skytel. Same-number local Fibers must not be joined by assumption or their organization labels overwritten.
- The user's first screenshot is C148/F154, upstream of C169/F10; the explicit user correction concerns F12. Audit both adjacent cases without conflating them.
- Prior source-derived transition files include SC217 F9/F11/F13 but omit F10/F12. Inspect raw source/connector dispositions to explain why. This is not established as a display-only bug.
- Generic RouteWorkspace selection still resets full-map/details state and renders FocusedRoute for non-AP objects. That causes the rejected screenshot views; extend persistent inspection to the overall flow.

## Status contract

Statuses: **Ready**, **In progress**, **Needs review**, **Blocked**, **Done**. Update Worker notes with changed files, evidence, verification and remaining gaps. Implement independent UI tasks while any mapping question is investigated. Do not mark continuity fixed without exact evidence. Ask only a precise unresolved mapping/evidence question after the available audit, not a generic request to reconfirm the report.

## Active tasks

### 28L-01 — Audit the SC217 break and record the user correction
Priority: **P0**. Status: **Done**. Dependencies: none.

Follow specification A. Compare F10/F11/F12 source markers, connector geometry/Connect rows, importer dispositions and active edges in both directions. F11 is the positive control. Record the user-reported F12-to-Lentekhi endpoint continuity as dated owner evidence without inventing a local splice pair. Produce the per-Fiber incoming/outgoing/endpoint/use audit and identify the actual missing authority or importer defect.

Worker notes: Done (2026-10-05): raw audit identified actual SC217 banks 34109/C171 and 34524/Source A C172. Lines 34070/34072 uniquely attach F10/F12 through their actual marker ellipses; fixed ±0.015 X tolerance omitted their Begin ends. F11/34071 is the unchanged positive control. Prior Iteration09 raw endpoint cells corroborate both new pairs. Dated F12 owner endpoint/use report recorded separately, without an owner-confirmed splice or field-verification claim. See scripts/audit-iteration28l-sc217.py, docs/iteration28l-sc217-source-audit.json and docs/ITERATION-28L-SC217-SOURCE-AUDIT.md.

### 28L-02 — Correct established continuity and rebuild its dependent views
Priority: **P1**. Status: **Done**. Dependencies: 28L-01.

Follow specification B. Apply an evidence-backed interpretation or separately recorded owner correction at the authority layer, preserving raw source and frozen V1. Reconcile Silknet/Skytel/review use evidence independently from connectivity. Rebuild current paths, signatures, Lineages, journey/use/organization projections, search and overlays. Report actual count/hash deltas; old four-group/transition totals must not block a justified correction. If exact mapping remains unresolved, record the specific pending decision and keep this task Needs review/Blocked rather than claiming a fixed full route.

Worker notes: Done at authority/projection layer (2026-10-05): src/domain/iteration28l.ts adds only NFT-SC217-34070 (C171/F10↔C172/F10) and NFT-SC217-34072 (F12↔F12), backed by new src/data/iteration28l-sc217-corrections.json. Runs before the established 28D/28C rebuild; no new resolver, global tolerance change or display-only patch. F10/F12 now reach exact Lentekhi Ports10/12 from both directions. F11 and all unrelated paths are structurally unchanged. Active transitions 1629→1631; current Lineages 475→473; 24 affected local paths. Silknet groups4→3, legs28→36, exact existing binding associations2→3; Skytel groups4→3, legs18 unchanged. F12 use conflict remains across12 local views. PortTopologyBinding hash and all45 original JSON hashes unchanged. 794/794 tests and TypeScript pass. Full diffs in docs/iteration28l-projection-diff.json. Standalone export is still historical28K until remaining UI work finishes.

### 28L-03 — Persistent inspection for the whole network
Priority: **P1**. Status: **Done**. Dependencies: none.

Follow specification C. Overall-flow clicks on Closure, Cable, Fiber, Aggregation and Port inspect/select in the accepted map without replacing it with the legacy neighbor-list/large-card views. Separate inspected object from workspace target and selected Fiber. Keep useful details open in a scrollable rail, preserve context and URL history, and reserve destination changes for an explicit action. Reuse shared RouteJourney/AP/organization components.

Worker notes: Done (2026-10-05): persistent map and scrollable Inspector now separate `inspect`, Fiber/Port `selection`, explicit destination `target`, and network/route `context`. Generic object inspection retains the selected optical path; only explicit destination action opens the AP workspace. URL Back/Forward and direct Fiber/Port searches are covered. See `src/views/RouteWorkspace.tsx`, `src/domain/navigation.ts`, `src/domain/engineerQuery.ts` and browser evidence `docs/iteration28l-browser-qa.json`.

### 28L-04 — Make path gaps, use boundaries and continuations explicit
Priority: **P1**. Status: **Done**. Dependencies: 28L-03; reconcile with 28L-01/02.

Follow specification D. Do not hide connected Fibers because organization use changes, or show a collapsed/filtered path as a physical end. Before resolution show the exact optical gap plus known physical downstream context and the user's reported Lentekhi destination. After correction show/animate the precise established transition. Keep full-route orientation visible for long paths without unreadable scaling or oversized stacked cards.

Worker notes: Done (2026-10-05): selected-path endpoint context and shared finite playback render alongside physical topology; corrected C169/F10 and F12 reach exact Lentekhi Ports10/12. F12 keeps the dated owner report and Silknet/Skytel conflict separate from source-derived transition evidence. F32 overlay follows AP52 and excludes C173/C174; Port38 follows C181 to SC225 without SC223/SC218/AP51. Responsive map/rail layout, 390/320 widths and 200% zoom are covered by final browser QA.

### 28L-05 — Verify continuity in every entry point and deliver
Priority: **P1 delivery gate**. Status: **Done**. Dependencies: 28L-01 through 28L-04.

Run all six acceptance journeys in the specification. Compare both ends and F10/F11/F12 identities against source evidence; check Silknet, overall flow, direct Fiber, Cable inventory and Lentekhi Port entry points. Verify persistent SC206/C169/SC217 inspection, navigation, real rail scrolling, responsive layouts and animation boundaries. Run full tests/build/export. Save source/active/projection diffs, screenshots, artifact hash, actual results and unresolved limits in VALIDATION.md and a 28L implementation report. Overall Done requires the scoped work to be resolved, not just the UI checks passing.

Worker notes: Done (2026-10-05): 796/796 repository tests, TypeScript, Vite build, standalone export, and final standalone Edge QA pass. QA covers the six requested entry journeys, selected overlay exclusions for F32 and Port38, history, rail scrolling, playback, desktop/mobile and zoom; zero runtime errors and no horizontal overflow. Final artifact SHA-256 `72111b6eae31c3ad90f4722d4087380bc7080479915a6473f24dc91b7f12884a`. Full results in `docs/VALIDATION.md`, `docs/iteration28l-browser-qa.json` and `docs/iteration28l-tests.txt`.

## Preservation and correction boundaries

- Raw source documents and frozen V1 remain immutable. Frozen manifest SHA-256: `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.
- Evidence-backed correction of the reported SC217 issue is now in scope. Earlier UI-only all-hashes/counts-unchanged rules do not forbid that correction. Preserve all unrelated records; explain and test every intended delta.
- Source-supported NodeFiberTransitions and the existing current resolver determine optical continuity. Physical adjacency, organization labels and equal Fiber numbers do not establish a splice.
- Local identities may remap. Organization use, physical Port occupancy, Fiber color, ownership and availability stay separate. Preserve conflicting source/owner claims with provenance.
- Preserve unrelated genuine gaps (including AP42 Port16/SC207), Port38/SC225 termination, AP49 remaps, Tsageri unbound Ports, C148 Tube conflict and C172 source identity separation.
- Keep canonical Lentekhi identity; AGG6 is the user's legacy wording, not an instruction to erase the existing numeric-identity conflict. Owner-reported continuity is not automatically field verification.
- Retain the accepted 28J/28K map, animation and performance behavior. No new source import, backend, deployment or unrelated graph cleanup.
