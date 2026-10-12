# Iteration 32 — empty server network and owner-operated Visio import

2026-10-08. This replaces Iteration 31 as the delivery objective. Planning only: no database clearing or application changes have been performed by this chat.

**Owner correction, 2026-10-09:** Engineer Search is a required primary workflow, not an extra or unused item. Section 32-04 now requires four primary entries. Follow task 32-07 in [HANDOFF.md](../HANDOFF.md) to restore the entry removed by the original delivery. Historical three-entry requirements are superseded.

## Owner's corrected request

The owner will import the Visio files and inspect the network personally. Prepare the application and database for that workflow, with an empty network and a clean left sidebar. Do not deliver a pre-imported demonstration as the result.

The owner has **no web server** and explicitly chose **a local app URL connected to the existing server database**. Keep the Laravel/web process on loopback, using server `10.0.61.15:5432`, database `on`, schema/login `bkhorguashvili`, with the existing protected credentials and TLS setting. This is not a public web deployment. Deliver the actual working local URL and start/stop instructions; the owner needs internal-network connectivity.

The owner explicitly requests clearing the app's current network data in their schema. That authorization is scoped to this application's network/import/demo records in `bkhorguashvili`, not the shared `on` database, other schemas, user accounts, schema definitions or original Visio files. Preserve necessary authentication, migrations and technical configuration so the app remains usable. Finish and verify the empty-network/import workflow in isolated local tests before performing the final scoped server cleanup.

The former plan to activate the seeded reference is superseded. Do not activate that baseline. Do not treat the older activation approval rejection as permission to bypass controls. If automatic review blocks a concrete newly authorized cleanup operation, report the exact rejection and use the normal resolution path; never broaden the reset target or bypass the reviewer.

## Confirmed implementation gaps

1. `backend/app/Services/ImportStore.php` presently stores source bytes/Shapes and candidate labels, then finishes with `semantic_status=not_evaluated` and `network_status=staged`. It does not populate a complete accepted network from the uploaded file.
2. `NetworkStore::seedBaseline()` loads prepared historical JSON. That is a migration/reference route, not an upload-to-network implementation, and must not become the owner's import button.
3. `src/App.tsx` renders Import/Review only after a network Inventory is loaded. `NetworkController::current()` expects an active revision. The first-import workflow must work when there is no active revision or network data.
4. The sidebar contains an example Cable link, nested engineering navigation and a global evidence-loading control. Database mode is labeled as a local database even when it targets the server. Remove those prototype assumptions. Preserve Engineer Search as a primary workflow alongside the global search.

## 32-01 — implement the empty application and independent import access

Define a first-class empty-network API state distinct from authentication failure, connection failure and missing/corrupt projection. The app shell, login, file upload, import history and review of staged files must work without an active network revision, network-dependent props or a dummy dataset. Source/run evidence must be accessible by its actual source scope before network activation; do not require a fabricated active revision for the first upload.

The landing screen with zero data is a simple “No network imported yet” message and a prominent “Import Visio” action. Use existing Georgian UI conventions. No sample topology, old counters, hardcoded Cable selection, offline fallback or endless loading. Search should communicate that there is nothing to search yet.

Provide authenticated owner/reviewer access using protected credentials and the actual session flow. Do not migrate generated demo accounts into the server or force the owner to use test credentials. Preserve existing owner accounts. If an account must be provisioned, establish the actual owner identity through the app/setup flow and keep secrets outside reports/chat.

## 32-02 — complete upload-to-table interpretation and validation

Reuse the existing VSDX extractor, source grammar interpreters, geometry resolver and TypeScript network resolver. Wire fresh uploaded bytes through semantic candidates, evidence-based canonical reconciliation, validation, persistence and revision-bound projections. Remove dependencies that import prebuilt snapshot records or static pilot data into this path. Freshly regenerate source-supported corrections, including SC217, from source geometry. Owner-only assertions must remain explicit reviewed decisions; do not silently inject historical owner claims.

Produce an implementation mapping from each supported source concept to actual table/column, normalization rule, identity key, evidence link and unknown/conflict behavior. Validate values and references before committing. At minimum:

| Source concept | Persistence requirement |
| --- | --- |
| File, page, Shape, grammar/run | Immutable source revision, original bytes, raw evidence and versioned import run |
| Node, Closure, AP, Aggregation | Stable canonical node identity/type; retain untyped nodes and source representations where unresolved |
| Cable Segment, Tube, Fiber | Segment-local construction, counts, local numbering and colors with source-backed independent fields |
| Port and exact Fiber binding | Correct owner/number, local Fiber foreign key and source evidence; occupancy remains independent |
| Optical transition/termination | Exact node-local endpoints and remaps with operation/endpoint uncertainty preserved |
| Organization/use/other status | Attributed independent claims; conflicting evidence remains visible, not overwritten |
| Coordinates and references | Preserve source values; normalize only supported formats and known coordinate semantics |
| Paths and summaries | Derived from the accepted graph; tied to the same active network revision |

Required core columns/keys must be populated relationally; putting all imported information into one JSON blob is not complete. JSON evidence/extension payloads are appropriate where already designed. Do not add unused duplicate columns/tables as a shortcut. Foreign keys, per-document Shape scope, canonical/source identity separation and constraints remain enforced.

Unknown objects/styles/ambiguous connections are recorded with a precise review reason and source reference. A valid ZIP/XML or a populated Shape table does not mean the network was imported correctly. Never invent optical continuity from adjacency, equal numbers/colors or organization labels. Keep the supported drawing grammar explicit; unknown future families remain staged rather than silently using the wrong parser.

## 32-03 — give the owner a complete import interaction

Keep the normal flow short:

1. Select a `.vsdx` file and identify new document versus a new revision of an existing one when needed.
2. Show meaningful processing progress; prevent duplicate submission and retain a durable result if the browser reloads.
3. Show a compact result: recognized objects/connections, changes to existing network, and unresolved items. Put technical evidence behind details. Distinguish blocking topology problems from non-blocking missing metadata.
4. Offer **Add to network** when the proposed revision passes the declared gates. This is the owner's explicit action to atomically apply that upload's validated network changes. Unsupported or ambiguous topology stays reviewable; never silently mark incomplete topology complete.
5. Open the resulting live map and retain an import-history entry with provenance and actual status.

The first file starts the network. The second file reconciles shared assets and cross-document transitions without duplicating them. Equal-name different assets (the two C172 cables) remain separate. Repeat/renamed-byte-identical upload does not duplicate data or decisions; changed content/tool versions produce a staged revision/diff. Failed upload/interpretation/review leaves any previously active network unchanged. Review decisions and activation must be attributable, authorized and concurrency-checked.

The owner performs all actual Visio imports into the prepared server schema after handoff. Worker verification may import the known original files into isolated **local** test storage/database only. Do not perform a final “example import” into the owner's schema, leave hidden seed records there, or activate the old reference for convenience.

## 32-04 — reduce the production-facing sidebar

Keep four primary entries, in this order:

- **Network** — main map/current imported network; useful empty state before the first import.
- **Engineer Search** — dedicated engineering questions and precise answers about routes, Cables, Fibers, Ports, connections and organization use. Always directly accessible, with a useful empty state before import.
- **Visio Import** — upload and previous import results; directly reachable, not inside a collapsed engineering menu.
- **Needs Review** — unresolved/conflicting import/network items with an accurate count and a concise zero-items state.

Keep one global search in the top bar and the dedicated Engineer Search sidebar entry. Remove “Cable example” / `მონაკვეთის მაგალითი` and the nested Engineering Work section; promote Engineer Search directly into primary navigation. Fold useful Overview content into the Network landing/context rather than retaining a redundant primary page. Remove the global “load engineering evidence” sidebar control; load evidence at the relevant item on demand. Account/sign-out belongs in a compact footer/menu.

Remove production-facing demo/offline selectors, prototype labels, artificial sample metrics and duplicate navigation. Preserve offline reference as a separate development artifact, not the default user experience. Label the database connection accurately; the existing remote-backed mode must not claim it is a local database. Avoid exposing internal IDs or schema/server details as routine navigation content.

Keep the accepted persistent route map, Port/Fiber navigation, scrollable Inspector, animations, keyboard support and URL history. Cable/Port/Closure details and useful Engineer query results remain accessible from search/map context; hiding redundant navigation is not authorization to discard the underlying domain features or evidence. Remove genuinely unreachable demo code/assets only after a consumer audit. Do not drop database fields solely because their feature is no longer a sidebar entry.

## 32-05 — clear only the owner's app network after readiness checks

Before any destructive operation, make a schema-scoped backup of the current app data/structure outside the target database, protect its contents and demonstrate restoration in isolated local PostgreSQL. Produce a concrete cleanup manifest listing exact fully qualified tables/record scope, exclusions, dependent files/cache entries and expected row counts. Freshly inspect the target to ensure no new owner data has appeared since the manifest was prepared; abort and refresh the plan if it has.

The cleanup target is only existing app network data (seeded revisions, network entities, projections, source/import rows, review/activation history tied to those seeded records). Preserve schema/table definitions, constraints/triggers, migration bookkeeping, real users/auth setup and unrelated application/account records. Keep the active-state singleton with a null network revision. Any newer non-seed owner data must be explicitly identified before deletion; do not assume every row is a demo row.

Validate actual server/database/schema/role and that the application is in a maintenance/quiescent state before cleanup. Use one narrow, audited cleanup path with a transaction where supported; never `DROP DATABASE`, `DROP SCHEMA`, `migrate:fresh`, blanket remote TRUNCATE CASCADE or a generic integration-test reset. Preserve immutability protections in normal operation; any maintenance handling needed for the approved cleanup must be narrow, reversible, locally tested and documented. Check foreign-key dependencies stay inside the authorized scope.

Clear or invalidate only this app's stale network caches and database references to seeded artifacts. Preserve original Visio files and backup/reference evidence outside the live app. Physical shared content-addressed source files must not be deleted while another profile/source revision still references them; never recursively delete broad storage folders. A new owner upload must not reuse a deleted run or silently find old accepted records.

Recheck zero network/source/import/review business records, no active revision, preserved account/migration rows, intact schema constraints and working login/upload. Show the empty app from a fresh browser session using the real remote database connection. Do not upload a source to the remote schema after this final reset; leave it empty for the owner.

## 32-06 — deliver the owner's local URL and empty database

First verify locally: empty state and first upload without any active revision, source-to-column mapping, both known source uploads, cross-document identity, exact path/Port regressions, missing/unknown cases, repeated upload, failure recovery, atomic apply, independent session persistence and simplified navigation. Use original source bytes rather than the prepared baseline; reference data is comparison-only. Use the existing golden journeys, including SC217/F12 conflict, F11/AP49, F32/AP52, Port38/SC225, SC207/F118 gap and separate C172 identities. Synthetic/new-family coverage limits must be explicit.

Then finish server empty-state/authentication/connectivity checks without importing user files. Deliver:

- Actual local URL and short start/stop instructions for the owner; remote PostgreSQL access is required.
- A concise owner guide: sign in, open Visio Import, select file, inspect result, Add to network, inspect map, import the next file.
- Real verification results, schema cleanup/backup/restore evidence, source-to-table mapping and remaining supported-format limits in the implementation report and VALIDATION.md.
- Final HANDOFF.md statuses that distinguish worker readiness from the owner's later import acceptance. Task Done means a functioning empty app ready for owner upload, not that the owner has already imported or approved its results.

Do not call a staging-only uploader production-ready. If the source-to-network bridge is still missing, complete it before clearing the server and presenting the app as ready. Full public-hosting rollout and universal Visio support are not this milestone.
