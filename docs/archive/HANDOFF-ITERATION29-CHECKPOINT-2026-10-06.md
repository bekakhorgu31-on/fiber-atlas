# Fiber Atlas — current handoff

Updated: 2026-10-05. Delivered application baseline: **28L + 29-01**. Active milestone: **Iteration 29 — local database/API foundation**. Tasks 29-01 and 29-02 are Done; 29-05 is **Needs review** after independent geometry/coverage review. Backend execution tasks remain blocked on runtime availability. New tasks 29-00 and 29-07 are Ready to resolve setup and startup-payload requirements. Read [independent checkpoint review](docs/ITERATION-29-CHECKPOINT-REVIEW.md).

## Direction

The user agrees to move toward the backend/database now and improve UI/UX and smaller features afterward. Retain the existing React map, TypeScript domain resolver, Python VSDX extractor and previously chosen Laravel/PostgreSQL direction. Engineer answers need to be shorter and answer the exact question; broad redesign is deferred. Contradictory operational facts remain correctness work.

This iteration supersedes the completed 28L restriction on backend work. It does not authorize public deployment, a frontend rewrite, or automatic activation of arbitrary new Visio files.

Read [Iteration 29 requirements and readiness assessment](docs/ITERATION-29-BACKEND-FOUNDATION.md). Historical tasks/worker notes are preserved in [handoff through 28L](docs/archive/HANDOFF-THROUGH-28L-2026-10-05.md). That archive contains superseded pre-fix findings and intermediate export notes; use the final 28L delivery below as the baseline.

## Verified baseline and honest limits

- The delivered 29-01 report/log records 801/801 tests and four focused browser journeys, following the 28L delivery. Independent review matched the current standalone SHA-256: `fdbafd333981c79c1f3f0d4b09b572a243118b88996942c82df71877e5157ff6`. It did not rerun tests or browser QA. The later 29-05 TypeScript run was blocked before discovery; do not conflate these runs.
- Current graph: 37 Cable Segments, 2,088 Fibers, 1,631 active transitions, 473 current Lineages. SC217 F10/F12 now reach Lentekhi Ports10/12; F11 remains correct. The F12 Silknet/Skytel use conflict remains visible.
- Cross-document links are established for the two reviewed sources, including shared assets and C151-to-C152 transitions. This does not certify any future Visio. Extraction, source grammar, optical continuity and cross-document reconciliation are separate validation layers.
- SC217 proved that familiar symbols can still produce missed connections. The two scoped corrections do not constitute a generalized geometry/importer fix.
- Resolved by 29-01: the historical C171 summary contradicted the current Fiber paths. The active summary now uses the current graph; old continuation evidence is explicitly historical.

Evidence: [28L source audit](docs/ITERATION-28L-SC217-SOURCE-AUDIT.md), [validation](docs/VALIDATION.md), [browser results](docs/iteration28l-browser-qa.json).

## Status contract

Use **Ready**, **In progress**, **Needs review**, **Blocked**, **Done**. Record changed files, actual checks/evidence and remaining gaps under each task. A task is Done only when its acceptance criteria pass. Missing tooling or an unseen-source validation file must be stated precisely; continue independent work. Do not request renewed permission for this authorized local backend milestone.

## Tasks

### 29-00 — Establish the local backend runtime

Priority: **P1 unblocker**. Status: **Ready**. Dependencies: none.

Follow checkpoint review R4. Investigate a supported project-local PHP/Composer/PostgreSQL setup using official sources; do not assume Docker/WSL or system services are mandatory. Keep development files out of source control and use loopback-only listeners. Continue authorized workspace preparation. Use the normal approval mechanism only for concrete operations that actually require it. Record exact runtime versions, paths, start/stop instructions and a real connection test. If unavailable, identify the specific blocked operation and continue independent migrations/API scaffolding; actual integration remains unverified.

Worker notes: Not started. The previous absence check is evidence of missing tooling, not proof that all local provisioning options require system changes.

### 29-01 — Remove contradictory cable and tube continuation summaries

Priority: **P1 correctness**. Status: **Done**. Dependencies: none.

Reproduce the C171 summary discrepancy documented in the specification. Use current node-transition/path authority for operational Cable/Tube summaries and their search consumers, with correct end direction, remaps, branch/gap semantics and topology revision invalidation. Preserve historical evidence separately. Verify F10/F11/F12 at SC217 agree with their exact current paths and are not covered by a false unresolved range. Audit related consumers of the same historical helper. Do not change graph records to repair display summaries.

Worker notes: Done (2026-10-05): `segmentContinuationGroups` now uses active node-local `NodeFiberTransition` records whenever that graph exists; it compresses only contiguous mappings with a shared target/offset/status and generates unresolved gaps from missing active edges. Historical `CableContinuation` remains available through `historicalSegmentContinuationGroups` and an explicitly labeled collapsed Inspector disclosure. Cable and Tube search facts use the same active projection. C171 at SC217 now reports F01–F48 → C172/F01–F48 from active graph evidence; F10/F11/F12 are exact, and none appear in a false unresolved range. 5 added regressions cover those three fibers, historical preservation, Tube summary, Cable search and Tube search. Full suite: 801/801; TypeScript/build/export pass; 4 offline Edge journeys pass with zero errors. See `docs/iteration29-01-*`.

### 29-02 — Define the persistence contract and capture the migration baseline

Priority: **P1**. Status: **Done**. Dependencies: none; can proceed independently of 29-01.

Follow specification A. Inspect available local runtimes and existing domain types, capture a reproducible active 28L baseline, and write the bounded schema/API decision record. Preserve canonical/source identities, raw evidence, independent status dimensions, exact transitions/bindings, append-only review history and versioned derived projections. Separate source document identity from file hash and filename. Define `NetworkRepository.load()` compatibility and the single existing TypeScript path authority. Proceed into implementation after recording routine decisions; no additional design-approval pause is required.

Worker notes: Done (2026-10-05): `docs/ITERATION-29-PERSISTENCE-CONTRACT.md` records the normalized relational schema boundaries, document/revision identity, revision-consistent API, existing TypeScript resolver authority, explicit offline mode, append-only reviews and activation rules. `scripts/export-iteration29-baseline.ts` exports the complete active Inventory deterministically and its `--check` command verifies gzip and JSON hashes. Baseline: 74,662,857 uncompressed bytes / 2,707,534 compressed; topology `canonical-active-fiber-path/1/48990ab60b0f5dc0`; 37 Cables, 2,088 Fibers, 1,631 active transitions, 384 Port bindings, 2,088 paths/Journey Summaries, 473 current Lineages. TypeScript and repeatability check pass. Runtime inspection: Node 24 and managed Python are available; PHP, Composer, PostgreSQL, Docker, package managers are absent; WSL is not installed; TCP/5432 is closed. No system tool was installed. This exact environment limitation is recorded for 29-03. Resource policy recommendation for the schema decision was GPT-6 Sol · Medium · Fast off.

### 29-03 — Implement PostgreSQL persistence and the API-backed map

Priority: **P1**. Status: **Blocked**. Dependencies: 29-02.

Follow specification B. Add local Laravel/PostgreSQL setup, migrations, relational core records, idempotent reviewed-baseline seed, revision-consistent API loading and a frontend repository adapter. Demonstrate map/search/Port/Fiber behavior against persisted data. Keep offline mode explicit; never hide API failure by silently showing the bundled snapshot. Persist an attributed review decision across restart and a second client session. Protect write endpoints, reject stale writes and preserve evidence. Do not introduce a second routing algorithm or a monolithic JSON-only database.

Worker notes: Blocked after 29-02. Full Laravel/PostgreSQL integration cannot run in the current host: PHP/Composer/PostgreSQL tooling and a local database are absent, port 5432 is closed, and Docker/WSL package runtimes are unavailable. Continue with independent contract/source work; do not claim API persistence or integration verification until a local runtime exists. A runtime installation would alter the host and is outside the workspace-only filesystem permissions currently exposed to this task.

Review qualification: the final sentence above is the worker's earlier assumption, not a verified restriction on all workspace-local runtimes. Task 29-00 investigates the actual available route. Executable integration is blocked; independently implementable backend source work need not stop.

### 29-04 — Persist staged imports and safe revision changes

Priority: **P1**. Status: **Blocked**. Dependencies: 29-02 and core persistence from 29-03.

Follow specification C. Store immutable source files/revisions, extraction artifacts, import jobs/status, candidates, warnings and review events. Reuse the existing Python extractor. Distinguish extraction success, semantic validation and active-network status. Verify identical reimport, new content revision and changed interpreter version without duplicating assets or overwriting accepted decisions. Unknown grammar or unresolved joins stay staged. Implement atomic reviewed-baseline activation, failed-activation preservation and rollback with revision-consistent projections. A generic new-source topology activation workflow is not required to claim this bounded staging task Done.

Worker notes: Blocked pending 29-03 persistence. Do not build a parallel file-backed substitute for the authorized relational source-of-truth milestone.

### 29-05 — Add importer coverage and cross-document regression gates

Priority: **P1**. Status: **Needs review**. Dependencies: 29-02 for the persisted contract; source tests can begin immediately.

Independent review follow-up: resolve checkpoint R1/R2 before restoring Done. The marker helper does not account for rotated non-circular ellipses, and separate extractor transform tests do not establish its correctness. Implement/test transformed containment or explicitly reject unsupported geometry. Regenerate the real audit to verify generator behavior. Correct the report's outdated blanket Source B Port limitation using the later 28D certification. Prior worker notes below describe the delivered scope and historical results.

Follow specification D. Record per-source coverage and connector dispositions; separate unsupported interpretation from a genuine endpoint. Add SC217 geometry/ambiguous-hit tests and cross-document cases covering verified overlap, duplicate C172 labels, remapped Fibers, unresolved boundaries, source revisions and repeat import. Retain scoped source corrections until a general rule proves equivalent. Do not equate detected-feature accounting with exhaustive source correctness.

Deliver a support matrix stating what is tested on existing sources, synthetic cases and any genuinely new real source. A previously unreviewed drawing-family acceptance test remains a later support gate if no suitable file is available; state that limitation instead of blocking all database work or claiming universal import support.

Worker notes: Done (2026-10-05): added `scripts/marker_geometry.py` as the shared transformed marker-ellipse matcher and routed the SC217 audit through it. The matcher returns every hit, so ambiguous overlaps remain unresolved. Added real-source assertions for connector Shapes 34070/34071/34072 (C171/C172 F10/F11/F12), unique `[1,1]` ellipse hits, no Visio Connect rows, and the old center-tolerance miss/control pattern; unit tests cover ellipse center/boundary/outside and ambiguous hits. Python importer suite: 17/17 pass; staged inbox importer suite: 6/6 pass. TypeScript project compilation passes. Current TS test launch could not start because Node 24's `os.userInfo()` fails on this host with `uv_os_get_passwd returned ENOMEM`; no TS test result is claimed for this run. Source coverage matrix and limits: `docs/ITERATION-29-05-SOURCE-COVERAGE.md`. The report is scoped to the two reviewed packages and existing cross-document regressions; no held-out drawing-family support is claimed.

### 29-06 — Prove the local persistence milestone end to end

Priority: **P1 delivery gate**. Status: **Blocked**. Dependencies: 29-01 through 29-05, 29-07 and actual PostgreSQL runtime from 29-00/29-03.

Follow specification delivery acceptance. Test against actual PostgreSQL: fresh setup, seed/reseed, API load, restart, persistent review, authorization/stale writes, import staging, failed activation and rollback. Compare all 2,088 Fiber path structures, transitions and bindings to the baseline. Run existing domain/importer tests and relevant backend integration checks, TypeScript/build and targeted browser QA using the API. Preserve the offline export. Deliver setup instructions, commands/results, semantic comparison, screenshots, implementation report and updated VALIDATION.md. State local-pilot versus public-production limits clearly.

Worker notes: Blocked until Laravel/PostgreSQL setup and staged import persistence are available. It cannot be honestly accepted with in-memory or bundled-data substitutes.

### 29-07 — Bound the operational API payload before integration

Priority: **P1**. Status: **Ready**. Dependencies: 29-02; independent of runtime provisioning.

Follow checkpoint R3. Treat the 74.7 MB complete snapshot as a migration/reference artifact. Inventory startup consumers and specify a compact current-network response plus revision-pinned on-demand evidence/history endpoints. Preserve every record the existing resolver needs; missing payload fields must not create false network gaps. Amend the API contract and implement the boundary in 29-03. Record actual response size and browser load/parse/usable-map measurements during 29-06; a small compressed archive alone is not proof of fast startup.

Worker notes: Not started.

## Preserve throughout


Raw VSDX/evidence and frozen V1 remain immutable. Current node-local transitions and the established resolver determine optical continuity; physical adjacency, equal numbers/colors and organization labels do not establish a splice. Preserve SC217 corrections, F12 conflicting use, AP42 Port16/SC207 gap, Port38/SC225 termination, AP49 remaps, F32/AP52, unknown Tsageri bindings, C148 Tube-color conflict and separate source C172 identities. Keep canonical Lentekhi identity and the recorded AGG-number conflict. Retain the accepted persistent map, Inspector scrolling, URL history and finite animation.

## Deferred UX backlog

Engineer search should lead with the exact answer and only the relevant route/compact table, with details and evidence expandable. Avoid full inventories and repeated provenance for simple questions. Capture concrete excessive-answer examples during API QA for the next UI iteration; broad redesign and unrelated features are outside this milestone.
