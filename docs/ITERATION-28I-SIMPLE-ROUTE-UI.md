# Iteration 28I — simpler UI and focused route view

Requested: 2026-10-03. Status: **Ready for worker implementation**. This is a requirements document, not a completed implementation report. Task status lives in `../HANDOFF.md`.

## Review of the delivered 28H baseline

Reviewed the updated handoff, 28H report, current search/route source, and saved desktop/mobile QA screenshots. No fresh full application test suite was run during this planning review.

The current standalone SHA-256 was independently checked and matches the 28H delivery: `5fdb57701ad279d156995b4baa739bf97021acb6283767d143dae1c380b88a81`. This verifies artifact identity, not a new pass of all application flows.

28H has addressed the previous search data defects. Preserve its exact-binding rules, AP identity handling, explicit Tube sample, path ordering, valid-Port checks and offline evidence. Its reported performance gain for the Port grid is useful. Its reported cold-start stall remains unresolved.

The remaining problem is information hierarchy:

- App and Route Workspace each show a search box. Mobile navigation consumes substantial space before the requested answer.
- Route header, simple-mode banner, network heading, statistics cards and the default inspector repeat context. The diagram begins far down the screen.
- `AP42` search shows a Cable before the exact AP and lists individual Ports immediately. The AP is available, but finding it takes unnecessary scanning.
- Cable search repeats endpoint/capacity in title/subtitle and enumerates every Tube color. A correct result can still be too dense.
- The UI mixes Georgian with implementation terms such as canonical, source representation, local Fiber, exact binding and Combined Network.
- The default inspector displays whole-network statistics even when those values do not help answer the user's current question.

Do not treat a clean console or no horizontal overflow as proof of a clear UI. Acceptance below checks both content and the user's route through it.

## A. Screen hierarchy

Default operator screen: one compact application header, one search, the requested route, and at most one selected-object details area. Put the route's title and essential status directly above it.

Remove duplicate headings, the persistent simple-mode announcement, repeated prototype notices and repeated statistics from the normal route screen. Retain a small prototype/source-state indicator in one place and the full explanation in About/evidence details. Network-wide counts belong on Overview, not repeated in the diagram and inspector.

Keep Overview and Network readily reachable. Group Import, review queues, connection matrices and technical diagnostics under a clearly named engineering entry. Existing deep links must continue to work; moving a navigation item is not deleting the function. Mobile navigation collapses into a menu rather than consuming six always-visible entries.

Acceptance: on 1440×900 and 390×844, a selected route's identity, state and first meaningful path step are visible before scrolling. There is one active search input in the operator workspace, no repeated network KPI row and no empty/default inspector occupying a third of the desktop screen.

## B. Search answers the requested object first

Rank exact typed identity first: `AP42` → AP42; `C158` → C158; `Lentekhi Port38` → that Port; `C184/F38` → that Fiber. Keep source-scoped collisions disambiguated rather than arbitrarily choosing a Cable. Related objects appear after the exact result, not ahead of it.

For an exact AP query, return the AP as the primary result. Ports are discovered after opening the AP or by an explicit Port query. Do not return its entire Port bank in the dropdown. Use at most five initial suggestions with a visible “all results” action when more exist; preserve complete results in the expanded search view.

Each suggestion has identity, at most two compact summary lines, and one clearly named action. A Cable summary might be `C158 · SC210 ↔ SC211`, then `96 Fibers · 8 Tubes`, then grouped usage if requested/relevant. Full Tube color lists and source filenames belong in details. Do not repeat the same endpoint/capacity facts in both title and subtitle. An exact Fiber result keeps its local identity, use/organization and endpoint/stop summary; the full ordered path opens on selection.

Acceptance: AP42 is the first result and default keyboard selection; pressing Enter opens AP42. Ordinary AP42 search does not list 24 separate Ports. Cable/source-label search still finds the correct canonical object. Back restores the query and selection. Invalid Port and ambiguous-binding regressions remain intact.

## C. A simple route, with two clearly different meanings

### Physical Cable

Selecting a Cable first shows its documented endpoint pair and the selected segment label/capacity. Example: `SC224 — C184 · 48F — Lentekhi`. Display order is an orientation choice, not traffic direction. Show an actual documented multi-segment Cable Route when selected explicitly; do not infer a common sheath from adjacent segments.

Use a compact horizontal schematic where it fits and a vertical ordered list on mobile. Cable/node taps reveal the same selected-object details. Keep side branches collapsed behind a labeled branch count at the relevant node; expanding them preserves selection. A “Full network” action restores context. Collapsed branches remain discoverable and are never presented as nonexistent.

### Selected Fiber path

Selecting a Fiber or exactly bound Port shows only that Fiber's ordered journey initially. Use the existing resolver. Show local Cable/Fiber labels on edges and number changes at the transition node. Termination, partial source gap and ambiguity have different labels and symbols. Do not silently bridge a gap, drop a stop or shorten a route by deleting meaningful nodes.

Port38 example: `Lentekhi / Port38 — C184/F38 — SC224 — C181/F06 — SC225 / termination`. This is a Fiber journey across two Cable segments; it is not C184 continuing unchanged to SC225.

For long paths, collapse only uninterrupted middle stretches with an explicit step count and expansion control. Endpoints, remaps, selected step, conflicts and stop reasons stay discoverable; their state must not disappear behind a generic ellipsis. Existing full path and connection-sheet navigation remain available.

Acceptance: Cable C184 and Port38 open distinct, correctly scoped views. Port38 fits in a simple readable path with SC224's F38→F06 remap and SC225 termination. F11 reaches the established AP49 endpoint with both remaps. C151/F118 visibly stops at its known gap. “Full network” preserves the selected item. No new graph/resolver is introduced.

## D. Show detail on selection

Use one details area: a side panel on desktop and an inline expandable section below the selected path on mobile. Keep the route visible while reading details. Do not stack a full inspector, a second detail page and repeated route summary simultaneously.

Default details answer: what is selected, where it connects, what its operational state means, and what action is available. Put construction, all Tube colors, complete Fiber/Port inventories and source evidence in named disclosures. Critical missing binding, conflict, partial and termination labels remain in the main view.

Port/Fiber banks may use compact numbered cells with a small labeled legend and one selected-item summary. Use text/symbols as well as color. Label whether a status describes Fiber use or Port occupancy; do not paint bound-Fiber use as physical Port occupancy. Unbound Tsageri Ports must remain visibly unbound. A selected cell exposes local identity, physical colors, organization if known and route action.

Use consistent Georgian operator wording and retain stable AP/SC/C/F identifiers. Technical English terms may remain in engineering/evidence details. “Organization using Fiber” must not be relabeled customer or owner without evidence.

Acceptance: source evidence remains reachable from every affected object; keyboard and touch can open/close details and select grid cells. Color is never the sole indication of unknown/conflict/usage. Verify the source-certified AP47 unknown Port and Tsageri zero-binding case explicitly.

## E. Optional animation as a route walkthrough

The static route is complete on first render. Add Play/Pause, Previous and Next for a user-requested walkthrough; Replay is allowed after completion. Highlight one step and the connecting span, then reveal the local remap/stop explanation. Keep the user's selected Cable/Fiber identity visible.

No autoplay, infinite looping, pulsing all branches, moving background or particle field. Motion represents inspection order, not measured optical signal, latency, live traffic or service health. Label it as a walkthrough. Playback follows exactly the same ordered data as the static view, never a second route calculation. Reverse inspection does not rewrite endpoint orientation or imply bidirectional service.

Stop at known termination, partial gap, ambiguity or loop boundary. Pause when the user manually selects a step or leaves the route. With reduced motion, use discrete state changes and preserve manual navigation. The route must remain fully usable without animation.

Acceptance: Port38 playback visits Lentekhi, SC224 and SC225 in order, shows the remap and ends at termination. F118 never animates across its gap. Pause/Next/Previous, keyboard, route change and reduced-motion checks pass. Include a synthetic revisit/loop display regression: 28H recorded no active fixture for that case, so its preservation was not independently demonstrated.

## F. Remove unnecessary runtime work, preserve data

Profile startup before choosing an optimization. Separate script parsing/evaluation, chained inventory transformations, resolver/projection creation and first render. The recorded large bundle and long task are observations, not a proven single root cause.

Remove redundant derived copies only after locating consumers; avoid eager rendering/calculation for unopened detail panels. Consider a build-generated runtime snapshot or deferred evidence parsing only if measurements show material benefit and semantic equivalence can be verified. Maintain a self-contained offline standalone and accessible source evidence. Do not introduce network-only lazy imports into that artifact.

Do not delete source JSON, lineage history, unknown records, review queues, VSDX, authoritative evidence, tests or prior QA just because they are absent from the main screen. Archive redundant narrative documents and generated scratch outputs only after verifying references/consumers. Do not bulk-delete project directories. Completed handoff history has already been copied intact to `docs/archive/HANDOFF-THROUGH-28H-2026-10-03.md`.

Acceptance: use the same browser/profile for at least three before/after cold loads and report median/range, largest startup long task and search interaction delay. Show measured improvement for any performance claim. If no safe improvement is demonstrated, report Needs review with profiling evidence; do not hide the result behind a loading animation or mark the performance task Done without meeting its requirement.

## G. Delivery checks

- Preserve authoritative hashes, counts, frozen V1 manifest and all domain constraints in HANDOFF.md. Run behavior-focused tests, full repository tests, TypeScript, production build and standalone export.
- Capture before/after desktop and mobile for AP42 search, Cable C158/C184, Port38 path, F118 gap, Tsageri unbound Port and selected Port details. Assert result ordering and visible content, not only substring presence.
- Check keyboard-only use, Back/query restoration, touch, 320px and 390px layout, reduced motion, playback stop/pause and zero unexpected external requests/errors. Emulated widths are not real-device certification.
- Save artifact SHA-256, timestamp, browser/profile, actual expected/observed results and screenshots. Keep reports concise; archive historical validation prose rather than copying it into the new handoff.
- Record any deferred work as a specific task/status. Do not call the app production-ready based solely on this UI pass.

## Design preview scope

The planning session's interactive example illustrates Cable C184 versus the Port38 Fiber path and optional step playback. It is a concept based on documented identities, not a live inventory viewer or an implementation in the prototype. The worker should implement the behavior within the existing app and source authorities.

Concept source on this workstation: `C:/Users/Beka/.codex/visualizations/2026/10/02/01a0fd27-0367-72d2-8f0a-98aee608ae49/simple-route.html`. Browser checks of this concept only: headless Edge, 320/390/736px widths, no document overflow or page errors; manual next shows the SC224 remap; playback ends at SC225 with Replay available. Checks used reduced motion. Screenshots: `iteration28i-concept-mobile.png` and `iteration28i-concept-desktop.png`. These are design previews, not 28I application acceptance evidence.
