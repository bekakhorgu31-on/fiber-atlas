# Fiber Atlas — current handoff

Updated: 2026-10-08. **Next priority: Iteration 32 — empty server network, working owner-operated Visio import, and clean navigation.** The owner corrected the previous plan: they will import and inspect the Visio files personally. They have no web server and explicitly want a **local app URL connected to the existing server PostgreSQL database**.

Read [Iteration 32 requirements](docs/ITERATION-32-OWNER-IMPORT-EMPTY-SERVER-UI.md). The former clean-test handoff is [archived](docs/archive/HANDOFF-31-SUPERSEDED-BY-OWNER-IMPORT-2026-10-08.md). Its isolated checks remain useful verification; a pre-imported test app is no longer the delivery objective.

## Required outcome

Deliver a working local URL, authenticated owner access, an empty app network in `10.0.61.15:5432/on`, schema `bkhorguashvili`, and a complete upload/review/Add to network workflow. The owner imports the first and subsequent Visio files through the UI. Do not perform the owner's final imports, pre-seed a demonstration, or activate the old reviewed baseline.

The owner's request authorizes clearing this application's existing network/import/demo data in their named schema. Preserve the database/schema/table definitions, migrations, real accounts, configuration, other schemas and original source files. Implement and verify the import/empty-state workflow locally first; back up and verify the exact target before the final server cleanup. No database has been cleared by this planning update.

## Current state and gap

- Iteration 29 local Laravel/PostgreSQL pilot and Iteration 30 named-schema configuration/migration/seed are delivered. Server profile, `bkhorguashvili` search path and TLS require are configured; latest read-only check found 31 base tables and a null active revision.
- The old seed is verified reference data, not proof of a fresh upload-to-network pipeline. Current upload code ends at Shapes/label candidates with semantic status not evaluated and network status staged. Complete the missing semantic/reconciliation/persistence/apply flow for supported source grammars.
- Import/login/review must work without an active network. The existing frontend currently gates those screens on loaded network data. An empty network must be a useful state, not an error or offline demo.
- Keep existing source/domain authority: the current reviewed comparison reference has 37 Cable Segments, 2,088 Fibers, 1,631 active transitions, 384 bindings and 473 current Lineages. It includes owner decisions; do not silently inject them into a fresh source-only import to force parity.
- The former task 30-03 proposal to activate the old seeded reference is superseded. Its historical approval rejection remains recorded; this iteration does not bypass it or activate that dataset.

Evidence: [29 delivery](docs/ITERATION-29-IMPLEMENTATION-REVIEW.md), [30 server state](docs/ITERATION-30-SERVER-PERSISTENCE.md), [validation](docs/VALIDATION.md).

## Status contract

Use **Ready**, **In progress**, **Needs review**, **Blocked**, **Done**. Record actual files/checks/evidence and precise remaining gaps. Continue independent work while a specific issue is investigated. The user already authorized this preparation and scoped empty-network cleanup; do not ask for generic confirmation again. If a concrete operation is rejected by automatic review, report that operation and stated reason rather than bypassing the control. Keep credentials protected.

## Active tasks

### 32-01 — Make the blank application usable before any import

Priority: **P1**. Status: **In progress**. Dependencies: existing runtime/backend.

Follow specification 32-01. Separate empty network from connection/auth/projection failure. Enable app shell, owner login, first upload, staged-file history/review and source evidence with no active network revision. Show one clear empty-state Import Visio action; no sample records, stale counts or offline fallback. Preserve real owner accounts and establish usable owner access without copying demo credentials.

Worker notes: Implementation and isolated validation are in progress; see docs/ITERATION-32-IMPLEMENTATION-REVIEW.md. Final server cleanup has not been performed.

### 32-02 — Map fresh Visio data into the correct relational records

Priority: **P1 correctness**. Status: **In progress**. Dependencies: none for pipeline implementation; integrate with 32-01.

Follow specification 32-02. Implement fresh uploaded bytes -> extraction -> supported grammar -> semantic candidates -> canonical reconciliation -> validated relational authority/projections. Reuse the existing resolver. Deliver a source-concept-to-table/column mapping with required keys, independent status fields, evidence and unknown/conflict behavior. Populate real relational fields; no snapshot seed or opaque JSON-only substitute. Regenerate source corrections; owner-only assertions require explicit review. Unknown styles/mappings remain reviewable.

Worker notes: Implementation and isolated validation are in progress; see docs/ITERATION-32-IMPLEMENTATION-REVIEW.md. Final server cleanup has not been performed.

### 32-03 — Complete the owner's upload, review and Add to network flow

Priority: **P1**. Status: **In progress**. Dependencies: 32-01 and 32-02.

Follow specification 32-03. Provide file selection, durable progress, concise object/connection/change summary, review of actual blockers, and an authorized atomic Add to network action. First upload establishes the network; later uploads reconcile overlap and preserve prior accepted data on failure. Test identity collisions, renumbering, duplicate/renamed reimport and changed revisions. The owner's final server imports are their own actions, not worker demonstration uploads.

Worker notes: Implementation and isolated validation are in progress; see docs/ITERATION-32-IMPLEMENTATION-REVIEW.md. Final server cleanup has not been performed.

### 32-04 — Remove prototype and duplicate sidebar elements

Priority: **P1 UX**. Status: **In progress**. Dependencies: none; coordinate empty/import states.

Follow specification 32-04. Keep Network, Visio Import and Needs Review as the three main entries; keep one top-bar search and compact account/sign-out access. Remove Cable example, duplicate Engineer Search link, nested Engineering Work menu, redundant Overview navigation, global evidence-load control and production-facing demo/offline selectors. Keep useful detailed views/contextual evidence, accepted map/ports/animation/history and accessibility. Remove unused demo code after a consumer audit; do not drop useful database fields simply because a sidebar item is removed. Show the server connection state accurately in plain language.

Worker notes: Implementation and isolated validation are in progress; see docs/ITERATION-32-IMPLEMENTATION-REVIEW.md. Final server cleanup has not been performed.

### 32-05 — Back up and empty only the app's server network

Priority: **P1 final preparation**. Status: **In progress**. Dependencies: 32-01 through 32-03 verified locally; cleanup plan and restored-backup check.

Follow specification 32-05 exactly. Snapshot the named app schema/data, verify restoration locally, prepare exact cleanup scope/exclusions, and recheck actual target/current rows. Perform the authorized narrow cleanup of seeded network/import/review/projection records while preserving table structure, constraints, migrations, owner accounts and unrelated data. Keep active revision null. Do not drop schema/database, use broad CASCADE reset, or disable normal safeguards globally. Recheck zero network business rows and working owner login/upload. Preserve source/reference files; scope cache/artifact invalidation to deleted records. Leave the server empty for the owner; do not upload Visio afterward.

Worker notes: Implementation and isolated validation are in progress; see docs/ITERATION-32-IMPLEMENTATION-REVIEW.md. Final server cleanup has not been performed. Schema backup/restoration and exact local cleanup/rollback proof passed. Server deletion awaits completed browser delivery checks.

### 32-06 — Deliver the local URL ready for the owner's first import

Priority: **P1 delivery gate**. Status: **In progress**. Dependencies: 32-01 through 32-05.

Follow specification 32-06. Verify the complete fresh import pipeline against original files in isolated local tests, including cross-document continuity and all existing golden journeys, then verify only the empty/auth/connection state against the prepared server. Deliver actual local URL/start-stop steps, a short owner import guide, schema mapping, cleanup/backup evidence, screenshots and actual validation. Mark Done only when the owner can start from empty and import through the UI; staging-only upload is insufficient. Record supported-family limits honestly. Do not claim owner acceptance or a public deployment.

Worker notes: Implementation and isolated validation are in progress; see docs/ITERATION-32-IMPLEMENTATION-REVIEW.md. Final server cleanup has not been performed.

## Preserve in implementation and comparison

Keep the accepted persistent route map and scrollable Inspector, source/canonical identity separation, exact local Fiber/Port mappings, remaps, SC217 evidence, F12 use conflict, AP49/AP52 branches, SC225 termination, SC207/F118 gap, unknown Tsageri binding and C148 Tube conflict. A database field that preserves evidence/uncertainty is not unnecessary because it is hidden from the sidebar. Improve answer clarity within affected screens; a broad search redesign is not needed to complete this import milestone.
