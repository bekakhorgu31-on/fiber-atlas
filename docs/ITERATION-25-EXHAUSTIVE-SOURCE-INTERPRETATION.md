# Iteration 25 — Exhaustive Source Interpretation

## Scope and fixed foundation

Iteration 25 reads the certified Iteration 24 raw artifact for `Tsageri-Lentekhi 2025.vsdx`, source SHA-256 `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`. The v3 extractor and its geometry/style resolver were not changed. Laravel/PostgreSQL and additional Visio documents remain out of scope.

The interpreter is `scripts/interpret-iteration25-source.py/1`. Two runs produced byte-identical copies of all six semantic artifacts. Active generated files are `src/data/iteration25-*`; comparison copies are under `migration/iteration25/run-a`, `run-b`, and `candidate`.

## SC225 source result

Every C181 Fiber is reconciled individually from the SC225-side marker to source connector geometry:

| C181 Fiber | Source result | Destination |
|---|---|---|
| F01–F04 | exact same-number transition to C183/F01–F04 | AP54 |
| F05 | no connector from C181 marker to C182/C183 | unresolved |
| F06 | no connector to C182/C183; owner confirms AP-side only | exact AP unresolved |
| F07–F12 | no connector from C181 marker to C182/C183 | unresolved |
| F13–F16 | exact transition to C182/F01–F04 | AP53 |
| F17–F24 | no connector and no termination symbol | unresolved |

The result contains 8 exact C181 branch transitions and 16 unresolved rows. The short vertical lines for F05–F12 connect C181's two local marker banks and stop at the SC225 bank; they do not reach C182 or C183. This is why the F06 owner anchor cannot be generalized into an AP53/AP54 choice.

Twelve separate C182/F05–F16 ↔ C183/F13–F24 relationships have actual connector Shapes and source geometry. They remain active. Shared presence at SC225 was not used as connectivity evidence.

## AP53/AP54 identity conflict

The expected cable labels in the continuation brief are reversed relative to the certified file. The actual source Shapes are:

- Shape 37907: `182-225-53-24`, so C182 is SC225↔AP53.
- Shape 38438: `183-225-54-24`, so C183 is SC225↔AP54.

The source identities remain active. No swap was projected. This follows the brief's instruction to report different actual source identities rather than force the expected labels.

## Network-wide transition reaudit

The certified transition graph was re-consumed without a protected expected count. Its 838 exact local edges remain: SC205 196, SC206 180, SC216 56, SC217 46, SC218 52, SC219 48, SC220–SC224 48 each, and SC225 20. No route-adjacency, same-number, color, Tube, capacity, or co-location rule created an edge. The focused SC225 audit classifies the remaining C181 positions individually instead of extending the graph from neighboring patterns.

## Company usage result

All 31 company occurrences are line Shapes carrying their own label. Endpoint alignment resolves 29 at both Fiber-bank ends and the two AP54-side Skytel lines at the exact C183/F03 and F04 endpoint. The generic rule `tsageri-lentekhi-company-usage/1` creates 13 graph-deduplicated logical usage assignments while retaining every one of the 31 source Shape IDs.

Usage does not infer cable ownership, Fiber rights, services, customers, or availability. Port physical status remains independent. White source Port graphics remain observed unused, never commercially available; aggregation occupancy remains unknown without a distinct physical Port graphic.

## UI projection

`NetworkUseAssignment` is the canonical generic record. Compatibility `FiberUseAssignment` rows are derived from it so the existing Fiber, Port and Splice Inspectors can use the same evidence without duplicating rules. Splice Workspace now shows compact company badges and an independent company selector that combines with Tube/group, change, unresolved and search filters.

Lentekhi remains `AGG-LENTEKHI`; the heading/property numeric conflict is not resolved by this iteration.

## Remaining evidence gaps

- C181/F05–F12 lack exact C182/C183 transitions; only F06 has owner-confirmed AP-side continuation.
- C181/F17–F24 have neither branch connectors nor source termination symbols.
- AP internal operation, trays, splice mechanism, patching, ownership, rights, services and commercial availability remain unknown.
- Field verification is still required for facts outside the certified document evidence.
