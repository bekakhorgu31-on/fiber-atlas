# Iteration 29-07 — operational API boundary

Updated 2026-10-06. The complete 74,662,857-byte snapshot remains an immutable migration/reference artifact. Startup uses a separate current-network response. Task 29-06 browser performance acceptance passes.

## Startup consumer inventory

`App.tsx` loads the repository, builds the Engineer query service and opens the combined Route workspace. That workspace, Port/Fiber Inspectors and query service need all Cable/Fiber/Tube identities, node/asset identities, exact active transitions, bindings, physical construction, current Lineages/Journey Summaries, Port occupancy, usage claims/local views, organizations and current organization/aggregation projections. All these authority/current records remain in the operational response. No required transition/binding or unresolved record is replaced by an empty array.

The resolver uses Cables, Fibers, Tubes, node-local transitions, Port bindings and ODF containment. Stored copies of the 2,088 complete paths repeat their legs and evidence many times. The client rebuilds them once through the existing `createCurrentFiberPathResolver`; there is no additional path algorithm. Export and regression tests compare every regenerated path structure, signature, local identity and endpoint to the reviewed baseline.

Historical `fiberLineages`, `supersededFiberLineages`, `fiberLineageAudit`, full `connectionSheets`, old `importRuns`, and `fiberPathProjection.audit` are revision-pinned detail data. The response declares these deferred fields. Connection Sheet identity/node indexes remain at startup, preserving navigation before the sheet is downloaded. Entering Import, Review or Splice waits for the detail response; an evidence-load failure is shown explicitly. An engineering-evidence button can load the same pinned revision from the map. Historical data is never treated as an absent network fact.

## Response and endpoints

- `GET /api/v1/network`: one immutable network/projection revision, topology/display revisions, complete authority counts, explicit deferred fields and a lossless shared-object JSON transport.
- `GET /api/v1/network/{revision}/details`: historical/detail fields for that exact retained revision; changing the active pointer does not change what this endpoint returns.
- `GET /api/v1/network/{revision}/records/{collection}`: bounded reviewed-core collections for engineering validation (Cable, Tube, Fiber, transition or binding records).
- Future raw Shape/import artifacts are separate source-revision endpoints in task 29-04. They are not included in startup.

`packJson`/`unpackJson` only deduplicate repeated JSON values. Literal values resembling reference tokens are escaped and roundtrip unchanged. Invalid/cyclic references are rejected. The API adapter checks required authority, counts, graph/display revisions and current projection metadata. Database errors never load the offline adapter.

Offline mode remains explicit (`?data=offline-demo`); local API mode is `?data=database`. Both show their data origin. The immutable projection revision includes its transport fingerprint, allowing a changed projection format to be activated/rolled back independently of an unchanged optical graph.

## Signature serialization compatibility

The existing v1 signature hashes JSON with its insertion order. Sorting object keys in the reference exporter, or storing those objects as PostgreSQL JSONB, can change an otherwise identical fingerprint. The materializer verifies semantic equality with the sorted archive and writes a separate order-preserving authority artifact. Constrained application payload columns use PostgreSQL JSON (which retains textual key order), and transport projections use immutable text plus SHA-256. Raw evidence/metadata and review correction values can use JSONB. This avoids changing the graph algorithm or existing identifiers during migration. A future canonical-signature version would be a separate deliberate migration.

## Measured serialization budget

Final artifact manifest: `migration/iteration29/baseline/active-28l-operational-manifest.json`.

| Measurement | Result |
|---|---:|
| Complete reference JSON | 74,662,857 bytes |
| Operational response JSON | 17,143,884 bytes |
| Gzip level 9 operational response | 809,575 bytes |
| Deferred detail JSON | 5,315,059 bytes |
| Node-host hydrate/rebuild measurement | approximately 261 ms |
| Exact path structures compared | 2,088 / 2,088 |

Initial same-host budget: operational response at most 20 MiB decoded / 1 MiB gzip, parse plus hydrate within 1 second, usable map within 4 seconds and no more than 1 second slower than the delivered offline baseline. These are initial local-pilot targets, not production guarantees. HTTP level-6 compressed bytes, browser parse/hydrate/usable-map time and memory where available must be measured in 29-06. A Node timing or compressed archive size alone does not satisfy that acceptance.

Actual Edge acceptance (three loads per mode): HTTP level-6 response 890,717 compressed bytes / 17,143,884 decoded; median API usable map 2,398 ms versus 2,227 ms offline; median parse plus hydrate approximately 294 ms; exposed heap approximately 62.3 MB API / 97.4 MB offline. All initial budgets pass. Evidence: `iteration29-api-browser-qa.json`; memory values remain browser/host observations.

Implementation: `src/domain/operationalPayload.ts`, `src/data/apiRepository.ts`, `scripts/export-iteration29-operational.ts`. Tests cover lossless transport, cyclic/literal reference cases, all 2,088 paths, every transition/binding and incomplete/revision-mismatched payload rejection.
