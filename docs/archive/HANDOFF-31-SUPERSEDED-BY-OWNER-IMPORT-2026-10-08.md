# Fiber Atlas — current handoff

Updated: 2026-10-08. **Next priority: Iteration 31 — clean Visio import from an empty network.** This is the owner's requested test before further activation work. Requirements are prepared; no clean-test database or import has been run by this planning pass.

Read [Iteration 31 requirements](docs/ITERATION-31-CLEAN-VISIO-IMPORT-REPLAY.md). Complete earlier worker notes and results are preserved in [handoff before clean-import testing](docs/archive/HANDOFF-THROUGH-30-BEFORE-CLEAN-IMPORT-2026-10-08.md).

## Current delivered state

- Iteration 29 local Laravel/PostgreSQL pilot is delivered, preserving the React/TypeScript map and current graph authority. Latest reported domain suite: 807/807. Source interpretation support remains scoped to two reviewed documents.
- Iteration 30 schema inspection/configuration/isolation tasks are Done. The owner's server `10.0.61.15:5432`, database `on`, schema/login `bkhorguashvili`, contains the migrated and seeded reviewed baseline. TLS require and schema targeting were independently checked. The latest read-only check found 31 base tables.
- Server revision `NETWORK-28L-397cb29f8c3b0280-OP1-8109aecedeb6` is imported and verified but not active; active revision was NULL at the last check. Automatic approval review previously rejected activation without explicit approval. The owner has now requested clean-import testing; this request does not approve that remote activation. Task 30-03 remains Blocked/pending and is not the immediate next action.
- Current reviewed combined reference: 37 Cable Segments, 2,088 Fibers, 1,631 active transitions, 384 exact Port bindings, 473 current Lineages. It includes source corrections and owner decisions, so raw-source-only reconstruction must be measured separately from reviewed reconstruction.
- Existing file upload stages source bytes/candidates. A complete fresh-source-to-active-network workflow is not already certified. The next iteration must expose and implement the missing bounded steps for these two known documents, rather than seed the prepared snapshot and call it import.

Evidence: [29 delivery](docs/ITERATION-29-IMPLEMENTATION-REVIEW.md), [30 server progress](docs/ITERATION-30-SERVER-PERSISTENCE.md), [validation](docs/VALIDATION.md).

## Scope and status contract

Use existing isolated local PostgreSQL `fiber_atlas_test` with a dedicated disposable schema such as `fiber_import_replay_31` and a separate application profile/process. Validate the actual connection and schema before reset operations. Preserve the owner's `.env`, remote `on` database, `bkhorguashvili` schema, original Visio files and reviewed baseline. Do not run a remote reset or activation. No new source upload, database deletion or test execution occurred in this planning chat.

Statuses: **Ready**, **In progress**, **Needs review**, **Blocked**, **Done**. Update each task's worker notes with actual commands, changed files, evidence and remaining gaps. Continue independent work while a specific mapping/tool issue is investigated. No renewed generic permission is needed for the authorized isolated local test. Never silently use reference records or offline data to make an incomplete import appear successful.

## Active tasks

### 31-01 — Prepare and prove the blank network

Priority: **P1**. Status: **Ready**. Dependencies: existing local runtime.

Follow specification 31-01 and isolation boundary. Create an independently guarded disposable local schema, schema-only migrations and minimum identified test account. Prove zero network/source/import/review records and no active revision. Open the actual database-backed client in a fresh browser context; it must show a useful empty state with an import action. Distinguish empty network from backend failure. Save target/count/API/screenshot evidence and test-profile start instructions.

Worker notes: Not started.

### 31-02 — Import original Source A without the prepared baseline

Priority: **P1**. Status: **Ready**. Dependencies: 31-01.

Import `Tsageri-Lentekhi 2025.vsdx` through the app from the original bytes. Isolate fresh artifacts/caches and audit consumed inputs. Reuse existing extraction/interpreter/resolver code, not fixture authority. Implement any missing known-source candidate-to-validated-projection/review/atomic local activation bridge. Record exact unsupported semantics and every manual decision. Show the resulting Source A-only network in the existing map. No baseline seed or copied historical transitions as a substitute.

Worker notes: Not started.

### 31-03 — Import Source B and reconcile cross-document continuity

Priority: **P1**. Status: **Ready**. Dependencies: 31-02.

Import `Tsageri-Alpana-Tvishi.vsdx` into the same test network while preserving active Source A during staging. Reconcile shared objects/Cables with retained source evidence, distinct C172 identities, exact C151/C152 boundary transitions, remaps and F118 gap. Validate and atomically activate only the supported combined test revision. Prove failed/unresolved candidates do not mutate accepted topology or fabricate edges.

Worker notes: Not started.

### 31-04 — Compare automatic results and explicit review replay

Priority: **P1 correctness gate**. Status: **Ready**. Dependencies: 31-02 and 31-03.

Keep fresh source-derived and reviewed-reconstruction results separate. Enumerate every historical owner-only assertion needed for parity; reapply only with explicit source scope/provenance. Regenerate SC217 F10/F12 evidence from the actual source geometry. Compare every local path, transition, binding, identity and conflict against the reference, classify each delta and resolve unexplained errors. Exercise all golden journeys from the specification across map, search, summary, Port/Fiber and animation entry points. Matching headline counts alone is not acceptance.

Worker notes: Not started.

### 31-05 — Repeat from zero and deliver the test application

Priority: **P1 delivery gate**. Status: **Ready**. Dependencies: 31-01 through 31-04.

Verify unchanged/renamed reimport deduplication, changed/unsupported source staging without active-graph mutation, and a second clean A-then-B run using the exact guarded disposable schema. Prove deterministic normalized results with explicit review replay, restart persistence and a fresh browser session. Deliver the test URL/start instructions, screenshots, stage counts, provenance/dependency manifest, complete semantic diff, manual-decision list and actual validation evidence. No claim of universal or unseen-family import support. Keep the full milestone incomplete if required semantic/activation steps remain unimplemented or unexplained correctness deltas remain.

Worker notes: Not started.

## Preservation and later work

Keep SC217 corrections, F11/AP49 remaps, F32/AP52, Port38/SC225 termination, AP42 Port16/SC207 gap, unknown Tsageri binding, C148 Tube-color conflict, distinct C172 identities and F12 Silknet/Skytel use conflict as explicit comparison cases. Source-derived truth and owner claims stay separate. Physical adjacency, equal numbers/colors and company names do not establish optical continuity.

After the clean-import test, return to the separately pending server activation/API/review/browser acceptance in task 30-03. The earlier approval rejection and exact operation are in the archived handoff/server report; do not bypass them through this test. Broad Engineer-answer simplification, visual polish and small features remain deferred. Concise, correct answers remain the intended UX direction.
