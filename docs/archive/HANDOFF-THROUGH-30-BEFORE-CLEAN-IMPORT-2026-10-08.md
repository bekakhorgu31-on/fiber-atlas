# Fiber Atlas — current handoff

Updated: 2026-10-08. Delivered baseline: **Iteration 29 local Laravel/PostgreSQL pilot**, preserving 28L optical authority and 29-01 summary correction. Tasks 29-00 through 29-07 are **Done** within the bounded local milestone. Next authorized work: **Iteration 30 — use the owner's existing PostgreSQL database, schema `bkhorguashvili`**. Target: **10.0.61.15:5432 / database `on` / login `bkhorguashvili`**, inside the owner's network. **Read-only authentication/schema access verified over TLSv1.3**; no server changes made. Full read-only inventory found zero scoped objects. Inventory/mapping and isolation are complete. Owner selected require mode and enabled writes; additive server migrations and reviewed seed/reseed succeed. All 2,088 server paths/core data match. Active revision is still NULL; activation awaits explicit approval after automatic review rejected that operation. See docs/ITERATION-30-SERVER-PERSISTENCE.md. Read [connection check](docs/ITERATION-30-CONNECTION-CHECK.md), [server requirements](docs/ITERATION-30-EXISTING-SERVER-DATABASE.md), [29 implementation review](docs/ITERATION-29-IMPLEMENTATION-REVIEW.md), [local setup](docs/ITERATION-29-LOCAL-SETUP.md), and [validation](docs/VALIDATION.md).

## Direction

The user agrees to move toward the backend/database now and improve UI/UX and smaller features afterward. Retain the existing React map, TypeScript domain resolver, Python VSDX extractor and previously chosen Laravel/PostgreSQL direction. Engineer answers need to be shorter and answer the exact question; broad redesign is deferred. Contradictory operational facts remain correctness work.

This iteration supersedes the completed 28L restriction on backend work. It does not authorize public deployment, a frontend rewrite, or automatic activation of arbitrary new Visio files.

Read [Iteration 29 requirements and readiness assessment](docs/ITERATION-29-BACKEND-FOUNDATION.md). Historical tasks/worker notes are preserved in [handoff through 28L](docs/archive/HANDOFF-THROUGH-28L-2026-10-05.md). That archive contains superseded pre-fix findings and intermediate export notes; use the final 28L delivery below as the baseline.

## Verified baseline and honest limits

- The delivered 29-01 report/log records 801/801 tests and four focused browser journeys, following the 28L delivery. The historical checkpoint independently matched the then-current standalone SHA-256: `fdbafd333981c79c1f3f0d4b09b572a243118b88996942c82df71877e5157ff6`. It did not rerun tests or browser QA. The later 29-05 TypeScript run was blocked before discovery; do not conflate these runs.
- Current graph: 37 Cable Segments, 2,088 Fibers, 1,631 active transitions, 473 current Lineages. SC217 F10/F12 now reach Lentekhi Ports10/12; F11 remains correct. The F12 Silknet/Skytel use conflict remains visible.
- Cross-document links are established for the two reviewed sources, including shared assets and C151-to-C152 transitions. This does not certify any future Visio. Extraction, source grammar, optical continuity and cross-document reconciliation are separate validation layers.
- SC217 proved that familiar symbols can still produce missed connections. The two scoped corrections do not constitute a generalized geometry/importer fix.
- Resolved by 29-01: the historical C171 summary contradicted the current Fiber paths. The active summary now uses the current graph; old continuation evidence is explicitly historical.

Evidence: [28L source audit](docs/ITERATION-28L-SC217-SOURCE-AUDIT.md), [validation](docs/VALIDATION.md), [browser results](docs/iteration28l-browser-qa.json).

## Status contract

Use **Ready**, **In progress**, **Needs review**, **Blocked**, **Done**. Record changed files, actual checks/evidence and remaining gaps under each task. A task is Done only when its acceptance criteria pass. Missing tooling or an unseen-source validation file must be stated precisely; continue independent work. Do not request renewed permission for this authorized local backend milestone.

## Tasks

### 30-01 — Inspect existing server tables and map the application model

Priority: **P1**. Status: **Done**. Inventory/mapping and owner-selected encrypted TLS configuration verified.

Follow the Iteration 30 specification. Read-only first: verify `bkhorguashvili`, actual privileges, table definitions and reported empty state. Produce a table-by-table reuse/adaptation/addition plan against the implemented backend. Preserve other schemas and existing definitions. Do not infer database name or username from the schema name.

Worker notes: Done (2026-10-08): full pre-migration read-only inventory/mapping verified no existing scoped objects. Owner explicitly configured sslmode=require and enabled writes; TLSv1.3 verified. This preserves encryption without claiming CA/hostname verification. Scoped additive plan and protected credentials are retained.

### 30-02 — Configure and test the named schema locally

Priority: **P1**. Status: **Done**. Dependencies: existing 29 local runtime; can begin before server credentials arrive.

Replace the current hardcoded `public` search path with explicit profile configuration. Audit migrations, migration bookkeeping, raw SQL, sequences and functions/triggers for schema isolation. Verify with a non-public schema/restricted role in local PostgreSQL and same-name sentinel objects elsewhere. Keep server credentials out of source control/output and prevent destructive test/reset helpers from targeting the remote profile. Preserve the local runtime for tests.

Worker notes: Done (2026-10-06): explicit local/server profiles and DB_SCHEMA, protected local credentials, preserved owner .env, scope/HTTP/CLI guards, qualified/pinned trigger functions, and remote reset/test-account refusal implemented. Restricted-role non-public-schema suite passes 5 tests / 2,191 assertions; same-named public tables/functions remain unchanged. See docs/ITERATION-30-PROFILES-AND-ISOLATION.md and docs/iteration30-schema-full-tests.txt. Server writes remain disabled until the TLS requirement is resolved.

### 30-03 — Connect the application to the existing server schema

Priority: **P1 delivery gate**. Status: **Blocked**. Dependencies: 30-01 and 30-02.

Apply compatible additive migrations and repeatable reviewed seed in `bkhorguashvili` after the mapping and isolation checks pass. Never run fresh/reset/drop/truncate against the server or overwrite incompatible existing objects. Resolve concrete schema conflicts before replacement. Verify actual server-backed API reads, unchanged paths/bindings, repeat seed, durable attributed review and no other-schema writes. Deliver sanitized setup, changes, rollback instructions and browser/connection evidence. Database integration is not a public deployment.

Worker notes: Additive migrations and reviewed seed/reseed completed (2026-10-08) only in bkhorguashvili. Read-only server parity verifies all 2,088 paths/core records, 1,631 transitions and 384 bindings, with no cross-schema FK. TLS require is owner-selected and encrypted; no local demo accounts imported. Automatic approval review rejected activation without explicit approval; active revision remains NULL. Await approval to initially activate NETWORK-28L-397cb29f8c3b0280-OP1-8109aecedeb6, then finish server API/review/browser acceptance. Evidence: docs/ITERATION-30-SERVER-PERSISTENCE.md and iteration30-server-* files.

## Completed Iteration 29 tasks

### 29-00 — Establish the local backend runtime

Priority: **P1 unblocker**. Status: **Done**. Dependencies: none.

Follow checkpoint review R4. Investigate a supported project-local PHP/Composer/PostgreSQL setup using official sources; do not assume Docker/WSL or system services are mandatory. Keep development files out of source control and use loopback-only listeners. Continue authorized workspace preparation. Use the normal approval mechanism only for concrete operations that actually require it. Record exact runtime versions, paths, start/stop instructions and a real connection test. If unavailable, identify the specific blocked operation and continue independent migrations/API scaffolding; actual integration remains unverified.

Worker notes: Done (2026-10-06): project-local PHP 8.3.35, Composer 2.10.3, PostgreSQL 18.6 and Laravel 13.34.0 run successfully. Official ZIP checksums and Microsoft-signed application-local DLLs are verified; no service/system PATH/system DLL modification. Setup helper replay and real SQL start/stop/connection checks pass. See docs/ITERATION-29-00-LOCAL-RUNTIME.md and scripts/setup-local-runtime.ps1.
### 29-01 — Remove contradictory cable and tube continuation summaries

Priority: **P1 correctness**. Status: **Done**. Dependencies: none.

Reproduce the C171 summary discrepancy documented in the specification. Use current node-transition/path authority for operational Cable/Tube summaries and their search consumers, with correct end direction, remaps, branch/gap semantics and topology revision invalidation. Preserve historical evidence separately. Verify F10/F11/F12 at SC217 agree with their exact current paths and are not covered by a false unresolved range. Audit related consumers of the same historical helper. Do not change graph records to repair display summaries.

Worker notes: Done (2026-10-05): `segmentContinuationGroups` now uses active node-local `NodeFiberTransition` records whenever that graph exists; it compresses only contiguous mappings with a shared target/offset/status and generates unresolved gaps from missing active edges. Historical `CableContinuation` remains available through `historicalSegmentContinuationGroups` and an explicitly labeled collapsed Inspector disclosure. Cable and Tube search facts use the same active projection. C171 at SC217 now reports F01–F48 → C172/F01–F48 from active graph evidence; F10/F11/F12 are exact, and none appear in a false unresolved range. 5 added regressions cover those three fibers, historical preservation, Tube summary, Cable search and Tube search. Full suite: 801/801; TypeScript/build/export pass; 4 offline Edge journeys pass with zero errors. See `docs/iteration29-01-*`.

### 29-02 — Define the persistence contract and capture the migration baseline

Priority: **P1**. Status: **Done**. Dependencies: none; can proceed independently of 29-01.

Follow specification A. Inspect available local runtimes and existing domain types, capture a reproducible active 28L baseline, and write the bounded schema/API decision record. Preserve canonical/source identities, raw evidence, independent status dimensions, exact transitions/bindings, append-only review history and versioned derived projections. Separate source document identity from file hash and filename. Define `NetworkRepository.load()` compatibility and the single existing TypeScript path authority. Proceed into implementation after recording routine decisions; no additional design-approval pause is required.

Worker notes: Done (2026-10-05): `docs/ITERATION-29-PERSISTENCE-CONTRACT.md` records the normalized relational schema boundaries, document/revision identity, revision-consistent API, existing TypeScript resolver authority, explicit offline mode, append-only reviews and activation rules. `scripts/export-iteration29-baseline.ts` exports the complete active Inventory deterministically and its `--check` command verifies gzip and JSON hashes. Baseline: 74,662,857 uncompressed bytes / 2,707,534 compressed; topology `canonical-active-fiber-path/1/48990ab60b0f5dc0`; 37 Cables, 2,088 Fibers, 1,631 active transitions, 384 Port bindings, 2,088 paths/Journey Summaries, 473 current Lineages. TypeScript and repeatability check pass. Runtime inspection: Node 24 and managed Python are available; PHP, Composer, PostgreSQL, Docker, package managers are absent; WSL is not installed; TCP/5432 is closed. No system tool was installed. This was the historical absence check; verified project-local runtime setup in 29-00 now supersedes that execution blocker. Resource policy recommendation for the schema decision was GPT-6 Sol · Medium · Fast off.

### 29-03 — Implement PostgreSQL persistence and the API-backed map

Priority: **P1**. Status: **Done**. Dependencies: 29-02.

Follow specification B. Add local Laravel/PostgreSQL setup, migrations, relational core records, idempotent reviewed-baseline seed, revision-consistent API loading and a frontend repository adapter. Demonstrate map/search/Port/Fiber behavior against persisted data. Keep offline mode explicit; never hide API failure by silently showing the bundled snapshot. Persist an attributed review decision across restart and a second client session. Protect write endpoints, reject stale writes and preserve evidence. Do not introduce a second routing algorithm or a monolithic JSON-only database.

Worker notes: Done (2026-10-06): constrained relational core, immutable authority/projection revisions, idempotent reviewed seed, existing TypeScript resolver, explicit API/offline adapter and pinned details are implemented. Anonymous/viewer writes, stale updates and invalid references are rejected; attributed reviews are append-only. API-backed Manager paths pass desktop/390px; a review survives actual API/PostgreSQL restart and a second browser context. See backend/, docs/ITERATION-29-IMPLEMENTATION-REVIEW.md and docs/iteration29-postgres-tests.txt. The earlier missing-runtime assumption is superseded by verified 29-00 setup.
### 29-04 — Persist staged imports and safe revision changes

Priority: **P1**. Status: **Done**. Dependencies: 29-02 and core persistence from 29-03.

Follow specification C. Store immutable source files/revisions, extraction artifacts, import jobs/status, candidates, warnings and review events. Reuse the existing Python extractor. Distinguish extraction success, semantic validation and active-network status. Verify identical reimport, new content revision and changed interpreter version without duplicating assets or overwriting accepted decisions. Unknown grammar or unresolved joins stay staged. Implement atomic reviewed-baseline activation, failed-activation preservation and rollback with revision-consistent projections. A generic new-source topology activation workflow is not required to claim this bounded staging task Done.

Worker notes: Done (2026-10-06): immutable source bytes/revisions, versioned bounded extraction, raw artifacts, source/run-scoped Shape indexes, label/Shape change candidates, unresolved canonical impact and append-only candidate review are persisted. Duplicate/renamed content, same-name changed bytes and changed tool/rule versions retain accepted decisions and leave active topology unchanged. Atomic reviewed-baseline activation, failed activation and rollback pass actual PostgreSQL tests. Import UI passes 7 desktop/mobile/error journeys. Generic new-source topology activation remains intentionally staged.
### 29-05 — Add importer coverage and cross-document regression gates

Priority: **P1**. Status: **Done**. Dependencies: 29-02 for the persisted contract; source tests can begin immediately.

Checkpoint R1/R2 were resolved and verified. The historical review is retained in the checkpoint report; current coverage is documented below.

Follow specification D. Record per-source coverage and connector dispositions; separate unsupported interpretation from a genuine endpoint. Add SC217 geometry/ambiguous-hit tests and cross-document cases covering verified overlap, duplicate C172 labels, remapped Fibers, unresolved boundaries, source revisions and repeat import. Retain scoped source corrections until a general rule proves equivalent. Do not equate detected-feature accounting with exhaustive source correctness.

Deliver a support matrix stating what is tested on existing sources, synthetic cases and any genuinely new real source. A previously unreviewed drawing-family acceptance test remains a later support gate if no suitable file is available; state that limitation instead of blocking all database work or claiming universal import support.

Worker notes: Done after checkpoint corrections (2026-10-06): inverse-affine local ellipse containment is integrated with rotated non-circular, nonuniform-scale, nested, flip, singular/non-finite and ambiguous-hit tests. The actual SC217 generator reproduces both evidence files byte-for-byte. Source coverage wording incorporates 28D active Ports/bindings and specific unresolved C172/AP44 correspondence. Python: 21/21 plus inbox 6/6; final domain/API suite 807/807. The prior Node runner failure is resolved by the normal Windows execution token. Source support remains scoped to two reviewed real packages and synthetic cases; held-out family acceptance remains a later gate.
### 29-06 — Prove the local persistence milestone end to end

Priority: **P1 delivery gate**. Status: **Done**. Dependencies: 29-01 through 29-05, 29-07 and actual PostgreSQL runtime from 29-00/29-03.

Follow specification delivery acceptance. Test against actual PostgreSQL: fresh setup, seed/reseed, API load, restart, persistent review, authorization/stale writes, import staging, failed activation and rollback. Compare all 2,088 Fiber path structures, transitions and bindings to the baseline. Run existing domain/importer tests and relevant backend integration checks, TypeScript/build and targeted browser QA using the API. Preserve the offline export. Deliver setup instructions, commands/results, semantic comparison, screenshots, implementation report and updated VALIDATION.md. State local-pilot versus public-production limits clearly.

Worker notes: Done (2026-10-06): actual PostgreSQL fresh migrations, seed/reseed, all 2,088 stored paths/core data, immutable/node constraints, authorization/stale writes, durable review, staging, failed activation and rollback pass 4 integration tests / 2,174 assertions. Domain suite 807/807, Python 21/21 + 6/6, TypeScript/build/export pass. Edge API QA: 21 journeys; import/review/error QA: 7 journeys; desktop and 390px layouts verified. Median API usable map 2.40 s vs offline 2.23 s; parse/hydrate about 0.29 s; actual transfer 890,717 gzip bytes / 17,143,884 decoded. Initial local budgets pass. Public production and new-family importer certification remain outside this delivery.
### 29-07 — Bound the operational API payload before integration

Priority: **P1**. Status: **Done**. Dependencies: 29-02; independent of runtime provisioning.

Follow checkpoint R3. Treat the 74.7 MB complete snapshot as a migration/reference artifact. Inventory startup consumers and specify a compact current-network response plus revision-pinned on-demand evidence/history endpoints. Preserve every record the existing resolver needs; missing payload fields must not create false network gaps. Amend the API contract and implement the boundary in 29-03. Record actual response size and browser load/parse/usable-map measurements during 29-06; a small compressed archive alone is not proof of fast startup.

Worker notes: Done (2026-10-06): startup consumers and every required current-authority collection are inventoried. Explicit revision-pinned deferred fields and Connection Sheet indexes prevent false absent/gap facts. Lossless shared-object transport and the existing resolver reproduce all 2,088 paths, transitions, bindings and current Lineages exactly. Actual API bytes/browser timings meet documented budgets. Order-preserving JSON/text storage keeps existing v1 fingerprints stable. See docs/ITERATION-29-07-OPERATIONAL-PAYLOAD.md.
## Preserve throughout


Raw VSDX/evidence and frozen V1 remain immutable. Current node-local transitions and the established resolver determine optical continuity; physical adjacency, equal numbers/colors and organization labels do not establish a splice. Preserve SC217 corrections, F12 conflicting use, AP42 Port16/SC207 gap, Port38/SC225 termination, AP49 remaps, F32/AP52, unknown Tsageri bindings, C148 Tube-color conflict and separate source C172 identities. Keep canonical Lentekhi identity and the recorded AGG-number conflict. Retain the accepted persistent map, Inspector scrolling, URL history and finite animation.

## Deferred UX backlog

Engineer search should lead with the exact answer and only the relevant route/compact table, with details and evidence expandable. Avoid full inventories and repeated provenance for simple questions. Capture concrete excessive-answer examples during API QA for the next UI iteration; broad redesign and unrelated features are outside this milestone.
