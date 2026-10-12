# Fiber Atlas — current handoff

Updated: 2026-10-03. Delivered baseline: **28I — simpler UI and focused route view**. Active work: **none queued**. Overall status: **Done**.

This file is the current delivery handoff. Iteration 28I is complete; no next task is queued. Do not execute historical task lists.

## Read first

- [28I requirements and review](docs/ITERATION-28I-SIMPLE-ROUTE-UI.md): current scope, display rules and acceptance criteria.
- [28I delivery](docs/ITERATION-28I-IMPLEMENTATION-REVIEW.md): completed implementation, verification and remaining limits.
- [28H delivery](docs/ITERATION-28H-SEARCH-CORRECTNESS.md): prior implementation and baseline evidence.
- [Validation record](docs/VALIDATION.md): prior verification evidence; add a clearly dated 28I result after testing.
- [Archived handoff through 28H](docs/archive/HANDOFF-THROUGH-28H-2026-10-03.md): complete prior handoff, preserved verbatim. Use for historical domain decisions and reference only.

## Current state

28I delivered and verified. See [implementation review](docs/ITERATION-28I-IMPLEMENTATION-REVIEW.md) and [artifact-bound browser evidence](docs/iteration28i-after-browser-qa.json). The previous 28H observations below are historical baseline evidence. No next iteration is authorized or queued here.

28H reports 770/770 tests, TypeScript/build/export and 18 offline browser flows passing. These are the worker's recorded results, not a new test run by this planning session. The latest screenshots still show duplicate search/navigation/context, dense Cable results, AP42 ranked below a Cable and many Ports, and repeated network statistics.

28H measured the 48-Port grid at 92 ms versus 746 ms previously. Cold startup was about 6.27 seconds in the final run with a 5.35-second long task; earlier measurements varied. Startup remains an open performance concern, not a certified production pass.

Delivery artifact: `../fiber-prototype.html`. No production deployment, backend or field verification is implied.

## Worker rules

- Statuses: **Ready**, **In progress**, **Needs review**, **Blocked**, **Done**. Update each task below in place.
- Record changed files, actual before/after behavior, verification and limitations in Worker notes. Blockers must name the exact missing input or failed check. Continue independent work.
- Reproduce review findings before changing behavior. Do not copy prior test totals as current results.
- Follow 28I scope without waiting for another approval. Prefer small edits to the existing app. Backend, new imports, deployment and a complete UI framework rewrite are out of scope.
- Cleanup means removing redundant presentation and unnecessary eager loading. Preserve authoritative source records, uncertainty, provenance and review decisions. Archive history rather than deleting evidence.

## Completed tasks — 28I

### 28I-01 — One search and a quieter main screen

Priority: P1. Status: **Done**. Dependencies: none.

Implement requirements A and B in the 28I document: one search per visible workspace, exact-object results first, concise cards, no automatic Port-result flood, and no repeated network totals or engineering text above the route. Keep engineering functions accessible through a secondary entry.

Worker notes: One visible search; exact AP42 primary result; five suggestions plus all-results; source-scoped C172 preserved. Verified offline at three widths.

### 28I-02 — Show the requested route first

Priority: P1. Status: **Done**. Dependencies: 28I-01.

Implement requirement C: a compact physical Cable view and a distinct ordered Fiber-path view using existing authorities. A search selection opens its relevant path rather than forcing the user to scan the entire network. Keep branches and the full network reachable; preserve selection and Back.

Worker notes: Focused physical Cable and ordered Fiber journey implemented through existing resolver. Port38, F11, F118 and full-network selection verified.

### 28I-03 — Reveal details when needed

Priority: P1. Status: **Done**. Dependencies: 28I-02.

Implement requirement D: one selected-object detail area, concise Port/Fiber grids, Tube and source detail disclosures, and consistent Georgian operator labels. Critical unknown, conflict and termination states stay visible.

Worker notes: Lazy desktop side/mobile inline details; source evidence remains available. AP47 unknown, Tsageri unbound and C148 conflict verified. Port detail roles use current graph endpoints.

### 28I-04 — Optional route walkthrough

Priority: P2. Status: **Done**. Dependencies: 28I-02.

Implement requirement E: manual Previous/Next and optional Play/Pause over the same ordered path. No autoplay, infinite looping or implied live traffic. Honor reduced motion and stop at the exact documented endpoint/gap. Static route use remains complete.

Worker notes: Static path plus optional discrete walkthrough; keyboard stepping, manual pause, termination and reduced motion verified. Synthetic revisit/loop fixture passes.

### 28I-05 — Reduce startup work without losing offline evidence

Priority: P2. Status: **Done**. Dependencies: none; measure again after UI changes.

Implement requirement F: profile parse/evaluation, inventory construction and first render separately. Remove proven duplicate work and unnecessary eager rendering; keep evidence accessible offline. Do not claim that hiding UI panels fixes startup or delete records to reduce bundle size.

Worker notes: Transition indexing and snapshot-local resolver memoization preserve all six complete projection hashes. Cold median 3319→2165 ms (34.8% improvement); startup task and bundle size remain limitations.

### 28I-06 — Validate simplicity and correctness

Priority: P1 delivery gate. Status: **Done**. Dependencies: 28I-01 through 28I-05.

Run requirement G acceptance, relevant regressions, full suite and build/export. Test the final standalone at 1440px and emulated 390px, plus 320px layout/reduced motion. Save screenshots and artifact-bound evidence. Update VALIDATION.md and this queue with actual outcomes, remaining limitations and final artifact hash. Do not mark the overall iteration Done while any required check is unverified.

Worker notes: 777/777 tests, TypeScript/build/export and offline Edge QA pass at 1440/390/320. 45 authoritative file hashes unchanged. Final artifact SHA-256: 117fd2e39bba4daf111d09033ce1a3044cbf83116f30f796b5046cb0db1b309c.

## Domain constraints that remain current

- Physical Cable adjacency never establishes optical continuity. Active NodeFiberTransitions and the existing 28C resolver determine Fiber journeys.
- Local Fiber/Tube identities and remaps remain visible when needed. Cable route is not proof of one common sheath or one shared Fiber journey.
- Port identity requires a real owner/Port record. Fiber identity requires one exact PortTopologyBinding; equal numbers are not evidence.
- Source Port occupancy, Fiber use, organization, physical color, condition and commercial availability are separate facts. Unknown is not unused; unused is not available.
- Keep 37 Cables, 2,088 local Fibers, 1,629 transition records, 48 exact Lentekhi bindings, 192 Tsageri logical Ports and zero C148 Port bindings. Verify authoritative file hashes as well as counts.
- Preserve Port38: Lentekhi → C184/F38 → SC224 remap to C181/F06 → SC225 termination. Preserve F11 remaps/AP49 endpoint, F118's genuine partial stop, F32/AP52, C148 Tube-color conflict and source-scoped C172 identities.
- Frozen V1 manifest SHA-256: `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.
- A source-interpreted or owner-reviewed fact is not automatically field-verified. No missing binding, transition, service, ownership, right or availability may be invented for a cleaner screen.

