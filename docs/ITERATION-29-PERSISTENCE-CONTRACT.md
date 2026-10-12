# Iteration 29 — persistence and API contract

Status: Implemented for the bounded local milestone; see [delivery review](ITERATION-29-IMPLEMENTATION-REVIEW.md). Original decision date: 2026-10-05; delivery: 2026-10-06. This does not certify public-production readiness or universal Visio support.

## Baseline and runtime

The repeatable baseline comes from `repository.load()` after the accepted 28L source correction. `scripts/export-iteration29-baseline.ts` writes a deterministic gzip of the complete active `Inventory` plus a reviewable manifest. Generate with `node node_modules/tsx/dist/cli.mjs scripts/export-iteration29-baseline.ts`; verify with the same command plus `--check`.

Current manifest: `migration/iteration29/baseline/active-28l-manifest.json`. The gzip contains 74,662,857 bytes of normalized JSON and is 2,707,534 bytes compressed. Uncompressed SHA-256: `397cb29f8c3b02806e02d0852bba40eb356602870c0c38885b78ccf6476b9433`; compressed SHA-256: `49e10d5acfd1afe8fa1a3bed6b2fd98bb24fd8fbaa18003016f4d252d427c21b`. A fresh `--check` reproduced both hashes and verified the graph payload.

Baseline authority: snapshot label `2026-09-24 · fresh VSDX caae4badc9c8 · Iteration 25 exhaustive interpretation · TSAGERI-LENTEKHI-REFERENCE-V1`; two source-document identities; 37 Cable Segments; 2,088 Fibers; 174 Tubes; 1,631 active node-local transitions; 384 exact Port bindings; 2,088 current paths and Journey Summaries; 473 current Lineages. Active topology revision is `canonical-active-fiber-path/1/48990ab60b0f5dc0`; port bindings are independently hashed. The complete snapshot also retains all source records, claims, review cases/events, historical derivations and projections as loaded by the repository.

Local tool check: project Node 24.19.0 with existing tsx, TypeScript and Vite packages; the managed workspace also provides Python for the existing extractor. PHP, Composer, PostgreSQL CLI/server and `pg_ctl` are not on PATH, no PostgreSQL Windows service was found, and local port 5432 is closed. This does not block the contract or baseline tasks; it means the database-backed implementation and integration tests still need an available local PHP/PostgreSQL runtime. No package or service was installed during task 29-02.

## Relational schema decision

PostgreSQL is the system of record. Model canonical identities and relationships relationally; use JSONB only for extensible attributes, interpreter payloads and raw geometry/evidence that is not a stable join key.

- `network_revisions` records immutable staged, active and superseded network snapshots, source-set digest, topology/projection revisions, validation state, timestamps and prior revision. A singleton `active_network_state` points to exactly one validated revision.
- `source_documents` holds a stable document identity independent from its filename or bytes. `source_revisions` holds immutable content SHA-256, safe stored object key, source metadata and the parent document. `import_runs` records interpreter/rule versions and stage results against one source revision. Same bytes under a renamed file do not create a new canonical asset; a new hash does not by itself prove a new physical document.
- `canonical_assets` holds stable node identities and type. `cable_segments` references endpoint nodes and stores segment-local capacity/labels. `fibers` has a unique `(cable_segment_id, fiber_number)` identity. `tubes` belongs to one Cable Segment; Tube/Fiber construction evidence remains local to that Segment.
- `ports` holds canonical AP/ODF/Aggregation Port identity. `port_topology_bindings` links one exact Fiber to one Port, with source revision and evidence references. Port occupancy, usage, allocation, availability, ownership and condition remain separate assertions/claims rather than columns inferred from the binding.
- `node_fiber_transitions` stores one explicit local transition at one canonical node, with foreign keys to local Fiber endpoints and optional Port/termination semantics. It must never derive a Fiber edge from route adjacency, matching numbers/colors or Cable membership. Cross-record node-end validity is checked transactionally against Cable endpoints and independently validated by the existing TypeScript graph resolver.
- `source_shapes` and `asset_representations` map source objects to canonical entities. Shape uniqueness is scoped by `(source_revision_id, page_id, shape_id)`; labels such as C172 and SC values are not global primary keys. Many source representations and evidence records may support one canonical asset or transition.
- `evidence_records`, `assertions`, `claim_evidence`, `assertion_review_events` and specialized use/occupancy claims preserve provenance and competing values. Review events are append-only and include actor, timestamp, evidence/source revision, reason, correction payload and prior network revision. Accepting a review changes review state only; it never silently creates topology.
- `projection_snapshots` binds derived Fiber paths, Journey Summaries, Lineages and operational search projections to exactly one `network_revision_id` and topology revision. Persist normalized legs/transitions or a versioned projection payload with relational identity links; never treat a stale projection from another revision as active.

Stable application IDs remain explicit columns/keys. Source file SHA identifies file content only. Legacy labels and external references are non-unique, scoped representations. Reimport and rerun uniqueness is based on source revision plus interpreter/rule version, not filename.

## API and single path authority

Task 29-07 refines the startup boundary in [the operational payload contract](ITERATION-29-07-OPERATIONAL-PAYLOAD.md). The 74.7 MB complete snapshot is migration/reference data. Startup returns all current authority and operational projections in lossless shared-object transport, regenerates repeated path copies through the existing resolver, and declares revision-pinned deferred engineering/history fields. Missing graph records fail visibly. The adapter preserves `Inventory` compatibility after decoding and exposes explicit `dataAvailability` for deferred evidence; detail views wait rather than infer absence. Actual API/browser timing remains a 29-06 gate.

Persistence retains JSON field ordering for the existing v1 signature: application payloads use PostgreSQL JSON, and immutable wire projections use text plus SHA-256. JSONB remains appropriate for raw metadata, extensible evidence and review correction values. A network/projection revision can share the same reviewed authority hash with another version; each retained response remains immutable and revision-pinned.

Laravel serves a same-origin versioned API to the existing React client. `GET /api/v1/network` returns `apiVersion`, one immutable `networkRevision`, `topologyRevision`, `displayRevision`, required counts, explicit deferred fields and lossless packed `inventory`. The adapter produces the existing `NetworkRepository.load()` domain shape with availability metadata. Every response is selected from one retained immutable revision; it does not combine records from changing current pointers. Source-set identity is captured by the reviewed authority digest and linked source revisions.

The frontend repository adapter has explicit `database` and `offline-demo` modes. Database mode validates the response contract/revisions and uses the existing TypeScript resolver as the only Fiber routing authority. It does not silently substitute bundled data after an API error. Offline mode is an explicit demo/reference choice. Laravel does not implement a second PHP route or Fiber traversal algorithm.

Reviewer writes use `POST /api/v1/review-events` behind Laravel authentication, CSRF protection and a server-side reviewer Gate/Policy. The actor comes from the authenticated session, never from the request body. Require `expectedNetworkRevision` (or an equivalent `If-Match`) and append the event in a transaction. A stale revision returns HTTP 409 with the active revision; validation errors never overwrite or delete claims. The event does not create a `NodeFiberTransition` unless a separate reviewed topology-activation workflow later processes explicit evidence.

Network activation locks the singleton active pointer, validates the candidate records and resolver-produced projections, then switches the pointer in one transaction. A failed seed, validation or projection build leaves the prior revision active. Previous revisions remain queryable for rollback. Readers obtain the revision ID first and constrain every subsequent read/projection to it.

## Seeding and compatibility

The first repeatable seed maps the reviewed baseline into normalized records using canonical IDs from the baseline. Seed operations use stable source/canonical keys and upserts guarded by revision IDs; repeating the same seed does not duplicate assets, bindings, evidence or review decisions. Frozen V1 remains a separately identified immutable historical dataset.

`NetworkRepository.load()` remains the frontend port. The new adapter returns the same domain `Inventory` shape after checking schema/API version and active revision. Existing views and the current graph resolver do not depend on Laravel-specific names. Additions to the response are versioned and validated; missing required authority fails visibly instead of defaulting to an empty network.

## Original planning boundary and delivered scope

Tasks 29-03 through 29-06 now deliver Laravel migrations, the API adapter, reviewer login, staged source uploads/UI, bounded baseline activation/rollback and actual PostgreSQL integration tests. Core identity/relationships are constrained relationally; extensible evidence/claim/history items retain individual records and logical identities. General new-source topology activation and held-out drawing-family acceptance remain open; the two reviewed sources are not universal import certification.
