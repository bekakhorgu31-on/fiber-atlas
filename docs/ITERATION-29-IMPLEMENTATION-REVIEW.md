# Iteration 29 — local persistence delivery

Delivered 2026-10-06. The existing Fiber Atlas map now runs against a real local Laravel/PostgreSQL backend. The offline reference/export remains explicit. All current optical paths retain the established TypeScript resolver and reviewed topology.

## Delivered behavior

- Project-local PHP 8.3.35, Composer 2.10.3, PostgreSQL 18.6 and locked Laravel 13.34.0; loopback-only listeners, ignored development files, generated private credentials, repeatable start/stop/setup helpers.
- Constrained relational Nodes, Cable Segments, Tubes, Fibers, Ports, node-local transitions and Port bindings. Other domain/evidence/history collections retain individual immutable records and indexed logical identities. Source documents/revisions, versioned extraction runs, Shape records, candidates, review events and activation history are separate tables. Extensible attributes/raw evidence stay in per-record JSON; the system of record is not an opaque Inventory blob.
- Reviewed-baseline seed/reseed with 37 Segments, 2,088 Fibers, 1,631 transitions, 384 bindings and 2,088 persisted paths. Each stored path, core collection and binding was compared to the reference. Current Lineages remain 473. No optical graph or physical construction change was made for persistence.
- Immutable validated snapshots, authority digests, projection SHA-256, a locked active-revision pointer, failed-activation preservation and retained-revision rollback. A transition cannot bypass its real Cable endpoint node.
- API/offline repository modes and visible provenance. API failures show an error. Current startup data preserves all required authority; repeated paths are reconstructed by the existing resolver. Engineering/history details and raw Shapes are loaded with explicit revision/run scope.
- Authenticated reviewer writes, viewer/anonymous rejection, stale network/review-version rejection, attributed append-only review events, request-forgery protection, restart persistence and a second-session read. Reviews do not create topology edges.
- Immutable hashed source storage, bounded package checks/extractor execution, raw artifacts, complete Shape indexing for the two reviewed packages, unreviewed label/change candidates, per-source/per-run evidence, detected Shape/label revision diffs and explicit unresolved canonical impact. Reimport and changed tool/rule versions retain previous review decisions. New document identity requires an explicit choice; filename/hash never decides physical identity.

## Checkpoint findings resolved

R1: marker containment now inverts the complete local-to-page affine transform and uses local ellipse bounds. Rotated non-circular, unequal scale, nested and flipped cases are exercised together. Unsupported/singular/non-finite geometry is distinguished from outside; ambiguous hits are retained. The real SC217 generator reproduces the audit and scoped correction files byte-for-byte.

R2: the support report incorporates 28D's 216 source Port/binding representations and 192 new active AP42–49 records, with AP41 overlap and the unresolved additional C172-to-AP44 correspondence stated separately.

R3: the complete 74.7 MB archive is migration/reference data. The operational response is 17,143,884 decoded bytes; actual HTTP gzip level-6 transfer is 890,717 bytes. Explicit deferred fields cover engineering history/sheets/import records; current authority is complete. JSON serialization order is preserved for existing v1 fingerprints rather than changing the graph/identifier algorithm.

R4: supported project-local ZIP runtimes work. The PostgreSQL crash was traced to the system's old C++ DLL; verified Microsoft-signed DLLs were placed beside the executable. The system DLLs, system PATH and service registry remain untouched.

## Actual validation

| Check | Result / evidence |
|---|---|
| Domain/API transport regressions | 807/807 pass; `iteration29-tests.txt` |
| PostgreSQL integration | 4 tests / 2,174 assertions pass; `iteration29-postgres-tests.txt` |
| Python VSDX/geometry | 21/21 pass; `iteration29-python-tests.txt` |
| Existing staged inbox tests | 6/6 pass; `iteration29-inbox-tests.txt` |
| TypeScript | pass; `iteration29-typescript.txt` |
| Production build / standalone | pass; `iteration29-build.txt`; existing embedded-bundle advisory remains |
| API-backed browser | 21 journeys, zero runtime/console errors; `iteration29-api-browser-qa.json` |
| Import/review/error browser | 7 journeys, zero runtime errors; `iteration29-import-browser-qa.json` |

PostgreSQL tests use only `fiber_atlas_test`, guarded before fresh migrations. They cover seed/reseed; all 2,088 persisted paths/core records; real-node/immutable-row guards; anonymous/viewer writes; attribution; stale writes; append-only history; reconnect; incomplete activation; atomic activation/rollback; pinned old reads; original Source A/B staging; renamed duplicate content; changed interpreter version; same-name changed bytes; colliding Shape17661 with different source text; detected revision changes; and preserved candidate review/active graph.

The browser checks run Edge 154.0.4258.53 headlessly at desktop and touch-emulated 390px. They cover F10/F11/F12, retained Silknet/Skytel conflict, F32/AP52 cross-navigation excluding SC218/AP51, Port38/SC225 excluding SC223/AP51, AP42 Port16/SC207 gap, Tsageri unknown binding, distinct C172 choices, C171 current summaries, evidence-on-demand, an actual review across API/PostgreSQL stop/start and an independent browser context. Import UI checks cover staging, candidate review, exact raw evidence, mobile layout, duplicate reimport and visible API outage without offline substitution. These are automated checks, not human/device usability certification.

## Same-host startup budget

Three isolated loads per mode: median API usable map **2,398 ms**, offline **2,227 ms**; difference **171 ms**. Median API parse plus hydrate approximately **294 ms**. Observed API heap approximately **62.3 MB**, offline **97.4 MB** where Chromium exposes it. All initial local budgets pass (20 MiB decoded, 1 MiB gzip, 1 second parse/hydrate, 4 second usable map and at most 1 second regression).

The API mode still shares the existing large offline/data-bearing frontend bundle. Its roughly 9.9 MB minified JS / 753 KB gzip remains a future splitting opportunity, not a claim that production-scale startup is optimized.

## Delivery files and remaining gates

Start instructions: [ITERATION-29-LOCAL-SETUP.md](ITERATION-29-LOCAL-SETUP.md). Runtime provenance: [ITERATION-29-00-LOCAL-RUNTIME.md](ITERATION-29-00-LOCAL-RUNTIME.md). Payload boundary: [ITERATION-29-07-OPERATIONAL-PAYLOAD.md](ITERATION-29-07-OPERATIONAL-PAYLOAD.md). Source support: [ITERATION-29-05-SOURCE-COVERAGE.md](ITERATION-29-05-SOURCE-COVERAGE.md).

The current standalone SHA-256 is `97f1834e555246ca415414f03aac84df6afbe7bf5c694dd1eefb8d5241aa84bf`. The immutable complete baseline remains `397cb29f8c3b02806e02d0852bba40eb356602870c0c38885b78ccf6476b9433` uncompressed, with topology `canonical-active-fiber-path/1/48990ab60b0f5dc0`. Active network/projection revision: `NETWORK-28L-397cb29f8c3b0280-OP1-8109aecedeb6`.

This is a local persistence pilot. General new-source topology activation, a genuinely unreviewed drawing-family acceptance test, production access/release review, backup/restore certification and operational monitoring remain open. Current staging intentionally stops short of semantic/topology certification. The deferred concise Engineer answers and broader UI/UX backlog remain available for the next iteration.
