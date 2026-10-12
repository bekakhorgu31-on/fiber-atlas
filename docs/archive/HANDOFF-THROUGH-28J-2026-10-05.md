# Fiber Atlas — current handoff

Updated: 2026-10-03. Delivered iteration: **28J — persistent AP workspace, reachable details and complete route context**. Overall status: **Done**.

This is the current worker order. The user reported navigation confusion, hidden Ports, an unscrollable right panel and missing aggregation-to-AP context after the 28I delivery. 28J now implements and verifies that workflow. The linked implementation report records the final artifact and browser-profile limits.

## Read first

- [28J delivered implementation and validation](docs/ITERATION-28J-IMPLEMENTATION-REVIEW.md) — final artifact, acceptance evidence and limits.
- [28J UX specification and reproduced findings](docs/ITERATION-28J-PERSISTENT-AP-WORKSPACE.md) — requirements and acceptance journeys.
- [Planning reproduction](docs/iteration28j-review-reproduction.json) — actual AP42/Port1 behavior and scroll measurements.
- [28I delivery](docs/ITERATION-28I-IMPLEMENTATION-REVIEW.md) — previous changes and performance gains to retain.
- [Archived handoff through 28I](docs/archive/HANDOFF-THROUGH-28I-2026-10-03.md) — completed tasks and history.
- [Validation](docs/VALIDATION.md) — append actual 28J outcomes; do not reuse old pass counts.

## Status contract

Use **Ready**, **In progress**, **Needs review**, **Blocked**, **Done**. Update each task below in place with changed files, verification, unresolved limits and blocker details. Reproduce first; finish independent work when another task is blocked. Done requires its acceptance evidence, not merely implemented markup. This scoped UI correction is authorized; no extra confirmation is needed. No new imports, backend, deployment or framework restart.

## Tasks

### 28J-01 — Make desktop details genuinely scrollable
Priority: **P0**. Status: **Done**. Dependencies: none.

Fix the height/overflow ownership through workspace, grid and inspector. Keep an independently scrollable right rail with a visible identity header. At 1440×900 and 1366×768, actual wheel and keyboard use must reach Port24 and the last source action without scrolling the route canvas. Include 200% zoom and mobile document-flow checks. An overflowing child under an overflow-hidden parent must not pass.

Worker notes: APWorkspace/styles give the rail its own bounded scroll owner and fixed identity. Real wheel, PageDown and Tab reach Port24/last evidence at both desktop sizes without moving the canvas; mobile and zoom reflow are recorded in final QA.

### 28J-02 — Correct Port occupancy across all views
Priority: **P1**. Status: **Done**. Dependencies: none.

Fix the localized occupancy label versus raw enum comparison in FocusedRoute/PortOperationalView. Keep typed occupancy separate from its display label and from Fiber use. Verify AP42 Port1/3 in-use, Port2 unused and AP47's unknown Port across search, grid, header and details. Port1's Fiber-use review state must not overwrite in-use physical occupancy.

Worker notes: Typed occupancyState is separate from display text and Fiber use. AP42 Port1/3, Port2 and the actual AP47 unknown Port agree in grid/header/details/search. Domain tests and all four browser profiles pass.

### 28J-03 — Separate destination, inspected object and selected Port
Priority: **P1**. Status: **Done**. Dependencies: none.

Implement the specification's persistent state contract. Clicking an AP opens its Ports immediately. Selecting a Port or inspecting a route node updates the workspace in place and does not close details, erase AP context or retarget the route. Add persistent origin/destination/Port context and reliable Back/Forward/deep-link restoration. Use explicit navigation for changing the destination.

Worker notes: Route URL state separates target/origin/mode/Port/inspection/overview. Inspection replaces history; ordinary selection retains AP42. Back/Forward/reload/evidence return and explicit AP49 retarget/Back pass.

### 28J-04 — Show aggregation-to-AP physical context and exact Fiber overlay
Priority: **P1**. Status: **Done**. Dependencies: 28J-03.

Derive the physical route from existing typed Cable endpoints and chosen aggregation/context; handle multiple origins/paths explicitly. Show full known physical context upon AP selection. Selecting a Port overlays its existing resolver path, preserving remaps/stops. AP42 Port1 reaches AGG5 with exact AGG Port unknown; Port16's Fiber starts at SC207 despite visible upstream physical context. Never fill the optical gap by adjacency.

Worker notes: View-only physical path enumeration uses typed endpoints and exposes origin/path alternatives. Resolver-only optical overlay preserves Port1 aggregation-Port uncertainty and Port16 SC207 gap; whole-network inspection retains the selected overlay. Six projection hashes are unchanged.

### 28J-05 — Deliver the connected diagram and readable AP rail
Priority: **P1**. Status: **Done**. Dependencies: 28J-01, 28J-03, 28J-04.

Use the 28J layout: compact breadcrumbs, connected Cable/node diagram, immediate numbered Port bank and one contextual details area. Replace blank AP screens and oversized step cards. Node/Cable clicks inspect in place. Maintain Georgian operator labels, stable identifiers, distinct physical/Fiber modes and critical unknown/conflict states. Responsive layout must preserve orientation without tiny labels or clipped controls.

Worker notes: Connected physical diagram and exact optical diagram, immediate Port bank, Georgian context and one inspection rail are delivered. 1440/1366/390/320 layouts and initial mobile route-node visibility pass.

### 28J-06 — Animate the known route with useful controls
Priority: **P2**. Status: **Done**. Dependencies: 28J-04, 28J-05.

Add user-triggered line/marker walkthrough, readable remap dwell, Play/Pause, Previous/Next and Replay. Use the same ordered data as the static diagram. Stop at documented boundaries, retain static context, pause on user inspection/Port changes/tab hiding, and honor reduced motion. Do not imply live traffic or animate through SC207's missing Fiber edge.

Worker notes: 850 ms travel + 550 ms dwell, finite marker traversal and complete controls are delivered. Pause retains progress, whole-network return retains the step, reduced motion is discrete and manual/visibility changes pause. Hidden visibility is simulated under the headless browser; see report limits.

### 28J-07 — Verify the whole AP workflow and export
Priority: **P1 delivery gate**. Status: **Done**. Dependencies: 28J-01 through 28J-06.

Execute all eight acceptance journeys in the 28J specification, not only isolated search/visibility checks. Save before/after desktop/mobile screenshots and actual scrolling/state/animation assertions. Run relevant/full tests, TypeScript, build and standalone export. Verify authoritative hashes and retain startup gains. Update VALIDATION.md, add a concise 28J implementation report and record final artifact SHA-256. Overall Done requires reachable details, stable AP context, correct AGG/path scope and verified occupancy.

Worker notes: 782/782 tests, TypeScript, build/export and 40 offline workflow flows pass. 45 authoritative file hashes, six complete projection hashes and frozen inventory match. Final SHA-256 and all profile limitations are in docs/ITERATION-28J-IMPLEMENTATION-REVIEW.md.

## Current evidence and domain invariants

- Planning review checked standalone SHA-256 `117fd2e39bba4daf111d09033ce1a3044cbf83116f30f796b5046cb0db1b309c`. 28I historically reports 777 tests passed; that is not a 28J test run.
- The 28I indexing gain is retained. Paired 28J cold-load medians are 2056 → 2061 ms; a substantial startup task remains. Final artifact SHA-256: 6bb6bacff39d3d2c7e5ac646a79ae1950eafed49f4749665e93aad54ebf45e8e.
- Physical Cable adjacency never establishes optical Fiber continuity. Use current physical projection for context and 28C resolver for optical paths. Port/Fiber binding requires one exact match.
- Preserve source occupancy, Fiber use, physical color, organization and commercial availability as distinct facts. Unknown is not unused; unused is not available.
- Keep 37 Cables, 2,088 Fibers, 1,629 transition records, 48 Lentekhi exact bindings, 192 Tsageri Ports and zero C148 Port bindings. Verify authoritative hashes as well as counts.
- Preserve Port38/SC224 remap/SC225 termination, F11/AP49 remaps, F118/SC207 gap, F32/AP52, C148 Tube-color conflict and source-scoped C172 identities.
- Frozen V1 manifest SHA-256: `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`. Do not delete source evidence or history to simplify the screen.


