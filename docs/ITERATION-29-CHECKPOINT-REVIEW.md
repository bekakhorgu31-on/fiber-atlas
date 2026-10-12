# Iteration 29 — independent delivery checkpoint

2026-10-05. Report/code review and worker requirements; no backend implementation or runtime installation performed here.

## Accepted progress

- Task 29-01's log records 801/801 passing tests and four successful browser journeys. The C171 summary now reports the active F01–F48 continuation. Independently hashed `fiber-prototype.html`: `fdbafd333981c79c1f3f0d4b09b572a243118b88996942c82df71877e5157ff6`, matching the new delivery. No fresh test or browser execution occurred in this review.
- The persistence contract preserves the existing React/TypeScript application, canonical identities, evidence, current graph authority, revision-consistent reads and explicit offline mode. The reproducible migration baseline is useful.
- The importer report correctly limits support to reviewed sources and separates staged extraction from approved topology. The worker explicitly reports its later TypeScript test-launch failure rather than treating the earlier run as a fresh pass.
- No Laravel application, PostgreSQL persistence or API integration is delivered yet. Missing runtime tools block execution and integration validation. This review also found no PHP, Composer, PostgreSQL or Docker command on PATH; that alone is not an exhaustive machine-wide installation audit.

## R1 — qualify and complete marker-geometry coverage

`scripts/marker_geometry.py` tests an axis-aligned ellipse using world pin and bounds width/height. It has no orientation or inverse affine transform. Existing extractor rotation/flip tests do not exercise this endpoint-containment helper.

Synthetic counterexample: an ellipse with local radii 2 and 1 rotated 45 degrees has world bounding-box half-width/height sqrt(2.5). For world point (1,-1), the current bounds-based ellipse test returns 0.8 <= 1 (inside); the actual rotated local ellipse test returns 2 > 1 (outside). This identifies a generalization risk, not a newly observed defect in the circular SC217 markers.

Worker action: implement local-space containment through a validated inverse transform, with integrated rotated/nonuniform-scale/nested/flip tests, or explicitly restrict the helper to proven supported geometry and return an unsupported disposition otherwise. Distinguish unsupported geometry from a genuine no-hit. Preserve ambiguous multiple hits and the exact scoped SC217 correction. Verify fresh source-audit regeneration as well as assertions against saved JSON; fixture assertions alone do not prove the changed generator reproduces it.

Task 29-05 returns to Needs review until this scope/coverage issue is resolved. The original successful Python results remain historical evidence.

## R2 — correct stale source coverage wording

The 29-05 report says Source B Ports/bindings are not certified. That repeats the historical 27D limitation and omits Iteration 28D. The later [Source B AP/Port audit](ITERATION-28D-SOURCE-B-AP-PORT-GRAMMAR.md) covers 216 source Port/binding representations across AP41–49, with 192 new active Ports/bindings for AP42–49 and AP41 overlap retained separately. Preserve specific unresolved cases such as the additional Source B C172-to-AP44 correspondence; do not describe all Source B Ports as unsupported.

Update the support matrix to distinguish historical extraction-stage counts from current activated enrichment. Current active transition count includes the two scoped SC217 additions; do not describe the old 838-source-transition comparison as exhaustive current completeness.

## R3 — separate the migration archive from startup data

The captured Inventory is 74,662,857 bytes uncompressed, including raw evidence and historical derivations. Its 2.7 MB compressed size does not establish acceptable browser parsing, memory or startup behavior. The contract currently proposes returning an Inventory-compatible aggregate without specifying which bulk fields startup actually requires.

Worker action: inventory the fields consumed at startup and by the route resolver; define a compact operational response with all required current authority, and revision-pinned lazy endpoints for raw Shape evidence/history/detail. Retain the complete snapshot for migration/reproducibility. Preserve domain types or adapt them explicitly; never omit required records and silently treat them as empty or unresolved. No second graph resolver is needed.

Measure actual API bytes, parse/load time, memory where practical, and usable-map time against the delivered prototype on the same host. Record a justified initial budget and show that evidence-on-demand still works. Compression alone is not a performance acceptance test. This is a contract clarification before database integration, not a request to redesign the UI.

## R4 — turn the environment blocker into an actionable setup task

Investigate a project-local PHP/Composer/PostgreSQL development runtime before concluding that installing system services is the only option. Use official distribution documentation and supported compatible versions. Keep any downloaded tools/database files in designated development directories, out of source control. Prefer process-scoped configuration and loopback-only development listeners; avoid changing system PATH, registering services, or installing Docker/WSL without an actual need.

If a required operation crosses the available permission boundary, use the normal approval mechanism for that exact operation. Do not characterize an unattempted operation as an automatic-review rejection. If provisioning is unavailable, record the precise operation/dependency and continue implementable migrations/API scaffolding independently. Keep actual database execution and integration gates Blocked until a real runtime is available; do not substitute a file-backed database or mark unexecuted integration Done.

The worker, not this planning chat, performs setup and implementation under the existing local-backend authorization. No public deployment is included.
