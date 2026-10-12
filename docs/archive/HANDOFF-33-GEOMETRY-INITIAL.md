# Fiber Atlas — current handoff

Updated: 2026-10-09. **Iteration 32 and task 32-07 are complete. The owner now reports a staged Shida Kartli upload with unsupported interpretation. Next capability: Iteration 33 — full interpretation of that actual large drawing.** The prior upload/staging-only repair succeeded within its scope; a usable Shida Kartli network is not yet delivered. Preserve the owner's upload and any subsequent data; do not repeat the earlier empty-schema cleanup.

## Next worker tasks — Shida Kartli interpretation

Read [Iteration 33 requirements and exact diagnosis](docs/ITERATION-33-SHIDA-KARTLI-NETWORK-IMPORT.md). The reported message is an explicit inventory-only early return, not proof that semantic analysis ran and rejected the drawing. Existing source bytes are available; do not ask the owner to keep re-uploading unchanged content.

- **33-01 — In progress:** source identity, scale, first label inventory and candidate marker/line geometry are measured in [the source audit](docs/ITERATION-33-SOURCE-AUDIT.md). Endpoint, bank, connector and label-field semantics still need full source-specific classification before interpreter rules are selected.
- **33-02 — In progress:** a bounded streaming geometry extractor now completes on the actual source and passes focused tests. Authenticated reprocessing, durable versioned artifact persistence, route/UI status, failure/retry behavior and end-to-end resource checks remain.
- **33-03 — Ready; depends on 33-01/02:** interpret and validate source-supported relational entities/optical connections with the existing resolver. Prepare a reviewable proposal; preserve genuine ambiguities and active-network isolation.
- **33-04 — In progress; depends on 33-02/03:** a reviewer-only, versioned stored-source geometry reprocess route and clear Georgian inventory/geometry statuses are implemented. Dedicated-isolation database/browser verification and the source-specific topology proposal remain. Owner retains the final server Add to network action. Preserve Engineer Search and the four primary navigation entries.

Worker notes: Iteration 33-01 continues against the exact local source whose SHA-256 matches the staged inventory. The bounded extractor decodes all 62,670 Shapes (21,576 roots), validates 330/330 page-local Connect references, and completed the latest actual-source run in 29.797s at 53,821,440-byte peak working set. Python suite: 32/32. TypeScript project tests: 808/808. Controller authorization tests: 2/2. Vite production bundle and standalone export pass. The reviewer-only reprocess endpoint creates a separate versioned geometry-evidence run and cannot create a topology proposal. Candidate geometry joins numbered Fiber-marker ellipses, but label semantics, complete bank pairing, AP/Aggregation/Closure identity and complete transition disposition are not certified. The actual large geometry NDJSON remains worker-local under `tmp`; the owner's staged upload/history remains unchanged. The local PostgreSQL feature suite skips because its configured schema is not `fiber_isolation`; no remote database, source history or active network was modified. Do not mark 33-01 through 33-04 Done until source-specific topology interpretation and end-to-end isolated database/browser verification are complete.

## Large-source upload and staging repair — completed 2026-10-09

Historical delivery notes below describe their recorded checkpoints. In particular, the later paragraph stating zero network/source/import rows describes the earlier cleanup; the owner has since staged a source file. Do not treat those old zero counts as current server state.

The owner selected **upload and staging only** for `შიდა ქართლი 2026.vsdx`; full source/topology decoding is a separate task. Its 6,757,465-byte ZIP has a 113,255,345-byte page XML and 62,670 Shapes. The previous 64 MiB per-entry guard rejected it before staging; the full Shape index also has a 50,000-record bound.

`ImportStore` now admits bounded packages up to 128 MiB per entry / 256 MiB total expanded bytes, retaining the existing 20 MiB compressed upload cap. Packages above 64 MiB expanded use `scripts/stage-vsdx-inventory.py`, a streaming source inventory capped at 100,000 Shapes, 6,000,000 XML elements and 128 nesting levels. It rejects DTD/entity declarations and duplicate local Shape IDs. Existing smaller-source geometry extraction and certified interpretation continue through the prior pipeline.

Large-source staging preserves checksum-verified original bytes, page/Shape IDs, hierarchy, attributes, text and literal-label candidates in the existing source/import tables. `extractionScope=package_inventory`, `geometryDecoded=false` and `topologyProjected=false` explicitly limit the evidence. The summary is the inventory artifact; it must never be passed to the full geometry interpreter/compiler. `ImportedNetworkStore` assigns a non-ready review proposal; no active graph or Fiber facts are projected. No schema migration was added.

The Import/Needs Review screens display the stored-file status and source-object count. The real owner file passed local API staging, original-byte retention, exact record count, Shape evidence access, duplicate reuse and activation refusal: **2 tests / 29 assertions**. Python checks: **27/27**. Existing Tsageri original/revision replay also passes. Desktop/390px mock-response QA, TypeScript, production build, PHP syntax/formatting and standalone export pass. The streaming benchmark took 7.19 seconds with a sampled 24.29 MiB peak working set. See `docs/VALIDATION.md`. Worker verification used local fixtures only; the owner should refresh the app and retry their upload. Source-specific Shida Kartli topology interpretation remains pending.

## Owner correction — Engineer Search is a core feature

The owner explicitly rejected removing Engineer Search. Its sidebar entry was incorrectly classified as redundant during requirements planning. **Restore it as a primary, directly accessible sidebar item.** This correction supersedes every earlier instruction to remove “duplicate Engineer Search” or limit navigation to three entries. Global search does not replace the dedicated Engineer Search workspace.

Required sidebar order: **Network · Engineer Search · Visio Import · Needs Review**. Remove only genuine demo/unused elements; keep the sample Cable link and obsolete engineering-menu grouping removed.

### 32-07 — Restore and verify the Engineer Search entry

Priority: **P1 owner correction**. Status: **Done**. Dependencies: delivered Iteration 32 UI.

- Restore a direct sidebar link to the existing Engineer Search workspace (`engineer` route), with the established Georgian label, icon, active state and keyboard accessibility. Reuse the existing query service and result-navigation behavior; do not introduce another search implementation.
- Keep the top-bar global search. Preserve Engineer Search questions about routes, Cables, Fibers, Ports, connections and organization use, including links back into the persistent map, query restoration and Back/Forward behavior.
- The entry remains accessible before the owner imports anything. Show a useful empty-network explanation and an Import Visio action; do not inject demo data, fabricate results or require an active revision just to open the workspace.
- Retain the user's answer preference: answer the exact question first, keep summaries concise, and disclose full routes/evidence on demand. A broad search rewrite is not required for this restoration and must not delay it.
- Verify the four-item sidebar and Engineer Search on desktop/mobile, direct navigation, keyboard access, active state, empty network, and populated search-to-map/Back behavior. Use isolated local fixtures for populated verification; do not import files into, reset or modify the owner's server network.
- Update navigation assertions, owner guide and validation evidence where they assume three entries or describe Engineer Search as removed. Report the original three-entry delivery as historical; do not rewrite past test results as four-entry verification. Mark this task Done only after the actual UI restoration and checks.

Worker notes: Restored the direct Engineer Search link in the required four-item sidebar and added a dedicated empty-network explanation with an Import Visio action. Existing query service, query URL, global search, result navigation and map return behavior remain in use. Desktop and 390px local browser checks cover empty-network keyboard entry, active link state, direct workspace access, populated search→map→Back query restoration, and no horizontal overflow. The focused run passed 4 journeys with 0 browser errors and 0 owner-server writes; populated checks used the isolated local QA network. The original three-link Iteration 32 evidence remains historical and unchanged. See `docs/iteration32-07-engineer-search-qa.json` and `docs/VALIDATION.md`.

The local app is ready at **http://127.0.0.1:8000/**, connected to the existing PostgreSQL `10.0.61.15:5432/on`, schema/login `bkhorguashvili`, with the protected server profile and TLS `require`. Start it with **Start Fiber Atlas.cmd**; stop with **Stop Fiber Atlas.cmd**. The launcher opens a private first-owner setup link when no account exists. The owner chooses their real name, email and password in the app. No generated demo credentials were copied to the server.

The authorized seeded-network cleanup is complete. All network/source/import/review business records are zero; the active-state singleton remains NULL. Table definitions, migrations, account records, constraints, triggers and functions are preserved. Original VSDX files and shared physical artifacts were not deleted. No Visio file was uploaded to the server by the worker after cleanup. The old reviewed baseline was never activated for this delivery.

Read the [owner guide](docs/ITERATION-32-OWNER-GUIDE.md) and [implementation/schema mapping](docs/ITERATION-32-IMPLEMENTATION-REVIEW.md). The [Iteration 32 specification](docs/ITERATION-32-OWNER-IMPORT-EMPTY-SERVER-UI.md) remains the requirements authority; [pre-delivery handoff](docs/archive/HANDOFF-32-PRE-DELIVERY-2026-10-09.md) preserves the previous task state.

## Delivery tasks

- **32-01 — Done.** Explicit empty-network state; independent account setup/login, import history and scoped source evidence. Missing/corrupt state and connection failures remain errors. No dummy Inventory or offline fallback.
- **32-02 — Done.** Fresh uploaded bytes → extraction/Shapes → bounded source grammar → canonical reconciliation → existing graph resolver → constrained relational records and revision-bound projections. No historical baseline input. SC217 geometry is regenerated; owner-only assertions are not injected.
- **32-03 — Done.** Real owner UI processes both known files, reviews counts/uncertainties and atomically adds a pinned, digest-checked proposal. Original/renamed duplicate, changed revision, unsupported renumbering, authorization and stale-activation recovery are verified locally.
- **32-04 — Original delivery Done; navigation requirement superseded by 32-07.** The delivered three-entry sidebar removed Engineer Search under the earlier mistaken instruction. Restore it per the owner's correction above; keep the other prototype/demo cleanup.
- **32-05 — Done.** Schema-only backup restored and compared in isolated local PostgreSQL; exact cleanup/rollback proven locally. Locked server fingerprints rechecked before the scoped transaction. Cleanup and exclusions verified; safeguards restored and unchanged.
- **32-06 — Done.** Actual local URL/start-stop files, owner guide, source-to-column mapping, final validation and desktop/390px screenshots delivered. Real server checks used only empty/auth/setup GETs, without account submission or source import.

## Verified results

- TypeScript: **808/808**; Python extractor: **21/21**.
- Full backend: **7 tests, 8,511 assertions**. Final fresh-source gap/revision replay: **2 tests, 6,323 assertions**. Final affected provenance/API checks: **14/14**.
- Isolated desktop/mobile owner workflow: **18 browser journeys, zero JavaScript errors**. Real empty-server/setup check: **3 journeys**, no server import/account writes.
- TypeScript/compiler validation, build, PHP syntax/formatting and standalone export pass. The standalone is a development reference artifact, not the owner’s active database.

Reports: [validation](docs/VALIDATION.md), [cleanup](docs/iteration32-server-cleanup.json), [owner browser QA](docs/iteration32-owner-browser-qa.json), [real server QA](docs/iteration32-server-empty-qa.json). Backup and private setup/credential files stay in ignored `.dev-runtime`; secrets are not in reports/chat.

## Current interpretation and actual unknowns

Fresh combined source output is **37 Segments, 2,088 Fibers, 1,615 transitions, 384 bindings, 473 generated current Lineages, 2,088 summaries**. 369 selected-Fiber paths are exact; 1,719 partial. Accepted source-transition coverage is 100%; no unsupported edges/false terminations. Count equality with the reference is not a correctness gate.

- C176/F32 is black; SC219 maps it to C175/F24/AP52 Port24. Its other endpoint is Lentekhi Port32. No SC218/C174/C173/AP51 in its optical path.
- SC217/F10–F12 reach Lentekhi 10–12 through fresh geometry. Historical owner-use assertions stay separate and their callout does not appear without provenance.
- Lentekhi Port38/C184/F38 follows C181/F06 to SC225. The source-only path stops as unknown there; the historical 16 SC225 termination assertions require explicit owner review.
- Source B’s five ellipse-only candidates remain review-only under its own grammar. The SC207/C151-F118 gap remains genuine; no Source A tolerance rule closes it.
- AP43/Port22 uses measured bank/Port pitch and its actual connector to bind C155/F22. Source number/color alone does not establish it.
- C148’s 72 construction conflicts, unknown Tsageri exact Port binding and distinct C172 identities remain preserved. Fresh review inventory contains 639 cases.

Only the established single-page Tsageri–Lentekhi and Tsageri–Alpana–Tvishi drawing families are supported. New numbering/layout families stay staged. Validated source-local topology can contain partial journeys; it is not universal Visio certification or owner acceptance.

## Continue from here

The owner starts the app and imports/inspects their files personally. Preserve schema isolation, source/canonical identity separation, immutable validated revisions, independent color/use/occupancy/allocation fields, explicit node-local transitions and all source gaps. Do not seed or activate the historical baseline to fill an empty app, and do not perform the owner’s server imports without a new explicit instruction.
