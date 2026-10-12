# Iteration 32 — owner-operated import and empty server

Status: **Done — worker readiness verified**. Updated 2026-10-09. The server app network is empty and ready for the owner to import personally. Owner acceptance/imports have not been performed.

## Implemented flow

The local app exposes Network, Visio Import and Needs Review. Login, first-owner setup, staged history and exact run-scoped Shape evidence work without an active network or dummy Inventory. A null active revision returns an explicit empty response; unavailable schema, missing state and corrupt projections remain errors. Account setup uses a short-lived private loopback ticket, only when no account exists. The owner chooses their actual name, email and password; test accounts stay in isolated local storage.

Uploaded bytes are hashed and retained. The extractor indexes their actual Shapes. `interpret-upload.py` adapts the existing source grammars without their historical comparison inputs. SC217 endpoint containment is recomputed from the uploaded affine geometry. `compile-upload.ts` decodes source symbols, reconciles full cable labels and local endpoints, validates node-local transitions, and invokes the existing current-path resolver for every Fiber. It produces revision-bound operational/detail projections. Add to network checks the candidate file digest and the expected active revision, persists constrained records, and atomically updates the active pointer with an attributed activation event.

Subsequent uploads rebuild from the accepted sources' actual extraction/grammar artifacts and the new upload. They do not read the prepared migration baseline. A changed accepted document replaces that document's interpretation; other accepted documents are retained. Byte-identical renamed uploads reuse their source/run and decisions. Unsupported renumbering/layouts remain staged. Failed interpretation cannot change the active network. The historical-seed staging regression also verifies that historical snapshots cannot enter this fresh path.

## Source concepts and persistence

| Source concept | Table/columns and normalization | Identity, evidence and uncertainty |
|---|---|---|
| Document and original file | `source_documents.id/title`, `source_revisions.document_id/sha256/original_name/stored_path/metadata` | SHA-256 identifies immutable bytes; document identity remains distinct from revision/file name. Shared physical files are retained. |
| Extractor, grammar and run | `import_runs.source_revision/extractor_version/interpreter_version/extraction_status/semantic_status/network_status/artifact_path/summary/actor_id` | Independent stage statuses; versioned source-only proposal and durable failures. |
| Page/Shape | `source_shapes.source_revision/import_run/page_id/shape_id/payload` | Composite scope prevents cross-document Shape ID collisions; raw geometry, styles and properties are evidence. |
| Node, Closure, AP, Aggregation | `canonical_nodes.network_revision/id/kind/local_id`, corresponding `domain_records.collection/logical_id/payload` | Source symbols establish type; unresolved endpoint tokens remain `network_node`. Accepted overlap anchors reconcile shared nodes. |
| Cable Segment | `cable_segments.network_revision/id/endpoint_a/endpoint_b/fiber_count/legacy_label` | Complete label/endpoints/capacity, rather than legacy number alone. Distinct C172 assets remain distinct. Source representations retained. |
| Tube | `tubes.network_revision/id/cable_id/number/payload` | Segment-local Tube identity; decoded outer marker color and independent uncertainty in the existing per-record payload. |
| Fiber | `fibers.network_revision/id/cable_id/number/tube_id/payload` | Actual segment-local number and FK; decoded inner marker color, allocation, condition, service and rights remain independent attributes. |
| Port | `ports.network_revision/id/owner_kind/owner_id/number/payload` and Port domain records | Logical owner/number; observed occupancy is independent from commercial availability and allocation. Transparent labels do not establish white occupancy. |
| Exact Port–Fiber binding | `port_topology_bindings.network_revision/id/port_id/fiber_id/payload` | Source-numbered marker/Port alignment and connector geometry. Unknown Tsageri bindings remain unknown. |
| Optical continuation | `node_fiber_transitions.network_revision/id/node_id/fiber_a/fiber_z/active/transition_type/payload` | Real node-local endpoints; SQL FKs and node trigger enforce continuity. Physical operation remains unknown unless established. No route-adjacency edges. |
| Organization/use | `domain_records` for attributed use assignments and usage projections | Source text/recognized line grammar; propagation only through the accepted graph, stopping at uncertainty. Conflicts stay visible; no ownership inferred. |
| Coordinates/GIS reference | Closure/NetworkNode domain record payload and raw Shape evidence | Supported DMS is normalized; original values and unknown CRS retained. |
| Paths and summaries | `fiber_paths.network_revision/id/fiber_id/signature/payload`, summary/Lineage domain records | Every inventory Fiber has a resolver-validated path bound to the same revision. |
| Reviews/activation | `review_events`, `review_subject_versions`, `activation_events` | Authorized actor, rationale and optimistic concurrency. Append-only safeguards retained. |

JSON payloads retain independent extension/evidence attributes in the established per-record design. Required core identity, capacity, local numbering and relationship keys populate actual constrained columns; an Inventory blob is not the authority.

## Fresh-source findings and comparison policy

- C176/F32 is black and reaches AP52 through SC219/C175/F24/Port24; the other side reaches Lentekhi Port32. SC218/C174/C173/AP51 are absent.
- SC217 F10/F11/F12 continuations to Lentekhi 10/11/12 are regenerated from source geometry.
- Lentekhi Port38/C184/F38 reaches C181/F06 and SC225. Source-only interpretation does not assert an intentional termination there: that historical claim requires an explicit owner decision. It does not invent an AP-side continuation or route backward through SC223.
- Historical Silknet/Skytel owner assertions are not silently inserted to force the reviewed reference's conflict/counts. Fresh source claims and historical owner claims remain distinguishable.
- Both original uploads reconcile five shared Cables into 37 canonical Segments and 2,088 Fibers. The expected source-only transition inventory is 1,615; the reviewed reference's additional 16 SC225 termination records are owner decisions.
- AP43/Port22 has a drawn, slightly offset connector. Bank/Port pitch-based unique alignment establishes C155/F22 without a color/offset-number formula.
- C148 construction differences remain source conflicts. Unknown Tsageri exact Port binding and the SC207/F118 missing continuation remain unresolved.

Only the established single-page Tsageri–Lentekhi and Tsageri–Alpana–Tvishi drawing families are supported. New cable numbering/layout families are staged for interpretation, rather than silently run through the wrong grammar. Source-only import can contain partial journeys; validated local topology is not a claim that every end-to-end path or owner assertion is complete.

## Verification and cleanup gates

Final checks: TypeScript **808/808**; Python source extractor **21/21**; full backend **7 tests / 8,511 assertions**; final source-gap/revision replay **2 tests / 6,323 assertions**. TypeScript/compiler/build and standalone export pass. Desktop/390px owner workflow passes **18 journeys, zero JavaScript errors**. The affected provenance/API checks pass **14 tests**. Real server empty/auth/setup checks pass **3 journeys** without submitting an account or importing a file. Evidence is in the iteration32 test and browser reports.

Fresh combined output: 37 Segments, 2,088 Fibers, 1,615 active transitions, 384 bindings, 473 generated current Lineages and 2,088 summaries. 369 selected-Fiber paths are exact; 1,719 are partial; zero false stops, false terminations or unsupported edges; 100% of accepted source transitions participate. There are 72 C148 construction conflicts and 639 source review cases. Lineage count is generated, never a fixed-count gate.

Five Source B ellipse-only candidates (Shapes 20933, 29642, 29644, 40442, 41025) stay review-only under its established center-alignment grammar. In particular, C151/F118 still stops at SC207; the Source A ellipse rule does not close that gap. The historical F12 owner callout is also gated on recorded provenance, so it does not appear in fresh imports.

The local web process now allows bounded 300-second requests with bounded child interpreters. Interrupted semantic processing records a durable failure and preserves the active network. Missing web encryption/runtime settings were added without replacing the protected database credentials or existing settings; first-owner secrets remain outside reports/chat.

Schema-only backup is in protected ignored `.dev-runtime/iteration32-backup/`. Restoration in loopback `fiber_atlas_restore32/bkhorguashvili` matches every row fingerprint, constraint, function and trigger. Fingerprints use byte ordering to avoid Windows/Linux collation differences. Exact cleanup and rollback have been proven in that restored database. The authorized exact cleanup committed on 2026-10-08 after the corrected local replay passed. All network/source/import/review business tables now have zero rows and the active revision is NULL. Accounts, migrations, functions, triggers and constraints are preserved. See iteration32-server-cleanup.json and iteration32-server-empty-qa.json.

Cleanup removes only the identified seeded revision and its source/import/network records. It preserves table definitions, migrations, users/account records, the null active-state singleton, configuration, unrelated schemas, original VSDX files and shared physical artifacts. It locks the exact tables, rechecks the backup fingerprints, temporarily handles only the affected named immutable triggers inside the transaction, restores them, and verifies exclusions. No schema/database drop, broad cascade reset or physical source deletion occurs.

## Local entry points

Owner launcher: `Start Fiber Atlas.cmd`. Stop: `Stop Fiber Atlas.cmd`. Verified owner URL: `http://127.0.0.1:8000/`, connected to the protected server profile. Port8010 is isolated QA only. The launcher provides first-owner setup privately if necessary. Internal-network connectivity to the database is required.

The owner imports their files after delivery. Worker verification imports only into the isolated local schema. No public web deployment or owner acceptance is claimed.
