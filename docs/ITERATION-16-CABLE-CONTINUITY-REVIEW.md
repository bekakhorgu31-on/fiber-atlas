# Iteration 16 Cable Continuity Review

Date: 2026-09-27  
Source boundary: `Tsageri-Lentekhi 2025.vsdx`, page `ცაგერი-ლენტეხი`  
Route context: `ROUTE-TSAGERI-LENTEKHI-CORE`

## Review result

Iteration 16 adds a first-class `CableContinuation` record for evidence-backed Fiber-bundle continuation at a node. It remains separate from:

- a `Cable Segment`, which is the local span between its recorded endpoints;
- a `PhysicalCable`, which is a sheath-level identity with independently reviewed Segment membership;
- a `Fiber Trace`, which follows exact per-Fiber connectivity and respects strict or candidate review mode.

Seven continuation records are persisted. They contain 54 exact source connection references: 52 at SC218, one at SC217, and one at AP51. No new optical relationship was inferred from route adjacency, equal capacity, matching colors, equal Tube numbers, or connector proximity.

The route-relative words **upstream** and **downstream** are derived from the selected Cable Route. Original Segment endpoint A/B values are unchanged.

## Primary C172 case

| At | Source | Continuation | Review meaning |
|---|---|---|---|
| SC217 | C172 F29 | C171 F29 | Documented / reviewed continuation |
| SC218 | C172 F01–F28 | C174 F01–F28 | Possible continuation; 28 candidate mappings |
| SC218 | C172 F29–F40 | C173 F01–F12 | Mixed: F29→F01 reviewed; remaining 11 candidate |
| SC218 | C172 F41–F48 | No established mapping | Unresolved; absence is not proof that Fibers are free or disconnected |

C172 construction remains four documented Tubes of 12 Fibers. The continuation boundary cuts across construction:

- T1, F01–F12: one possible destination, C174 F01–F12.
- T2, F13–F24: one possible destination, C174 F13–F24.
- T3, F25–F36: split by Fiber range. F25–F28 may continue to C174 F25–F28; F29–F36 may continue to C173 F01–F08.
- T4, F37–F48: partial. F37–F40 may continue to C173 F09–F12; F41–F48 has no established mapping.

Tube identity is never carried across a Closure merely because Tube number or color appears to match. C172 F29–F40 crosses the C172 T3/T4 boundary, while the destination range falls within C173 group 1; this is represented as a Fiber-range mapping rather than a Tube-to-Tube assertion.

## Cable Segment audit

Construction states use **confirmed**, **partial**, **proposed**, and **unknown**. “Proposed” means a source-supported working grouping whose physical Tube number and Tube color still require verification.

| Segment | Local endpoints | Route-relative context | Construction | Fiber continuity review |
|---|---|---|---|---|
| C148 | AGG5 ↔ SC205 | AGG5 → SC205 | Unknown | SC205 F01–F192: no established mapping |
| C149 | SC205 ↔ AP41 | SC205 → AP41 | Unknown | SC205 F01–F24: no established mapping; exact AP termination not established |
| C150 | SC205 ↔ SC206 | SC205 → SC206 | Unknown | F01–F192 unresolved at both Closures |
| C151 | SC206 ↔ SC207 boundary | SC206 → external SC207 direction | Unknown | SC206 F01–F144: no established mapping; later route is in another document |
| C169 | SC206 ↔ SC216 | SC206 → SC216 | Proposed groups | F01–F48 unresolved at both Closures |
| C170 | SC216 ↔ AP50 | SC216 → AP50 | Proposed groups | SC216 F01–F24: no established mapping; exact AP termination not established |
| C171 | SC216 ↔ SC217 | SC216 → SC217 | Proposed groups | SC216 F01–F48 unresolved; SC217 F29→C172 F29 reviewed; remaining SC217 Fibers unresolved |
| C172 | SC217 ↔ SC218 | SC217 → SC218 | Confirmed, 4 documented Tubes | SC217 F29←C171 F29 reviewed; SC218 ranges are detailed above |
| C173 | SC218 ↔ AP51 | SC218 → AP51 | Partial: group 1 documented | SC218 F01–F12←C172 F29–F40 mixed; F13–F24←C174 F29–F40 candidate; F01→AP51 reviewed, exact AP port unknown |
| C174 | SC218 ↔ SC219 | SC218 → SC219 | Proposed groups | SC218 F01–F28←C172 candidate; F29–F40→C173 candidate; F41–F48 unresolved; SC219 F01–F48 unresolved |
| C175 | SC219 ↔ AP52 | SC219 → AP52 | Unknown | SC219 F01–F24: no established mapping; exact AP termination not established |
| C176 | SC219 ↔ SC220 | SC219 → SC220 | Unknown | F01–F48 unresolved at both Closures |
| C177 | SC220 ↔ SC221 | SC220 → SC221 | Unknown | F01–F48 unresolved at both Closures |
| C178 | SC221 ↔ SC222 | SC221 → SC222 | Unknown | F01–F48 unresolved at both Closures |
| C179 | SC222 ↔ SC223 | SC222 → SC223 | Unknown | F01–F48 unresolved at both Closures |
| C180 | SC223 ↔ SC224 | SC223 → SC224 | Unknown | F01–F48 unresolved at both Closures |
| C181 | SC224 ↔ SC225 | SC224 → SC225 | Unknown | F01–F24 unresolved at both Closures |
| C182 | SC225 ↔ AP53 | SC225 → AP53 | Unknown | SC225 F01–F24: no established mapping; exact AP termination not established |
| C183 | SC225 ↔ AP54 | SC225 → AP54 | Unknown | SC225 F01–F24: no established mapping; exact AP termination not established |
| C184 | Lentekhi boundary ↔ SC224 | SC224 → unresolved Lentekhi aggregation | Unknown | SC224 F01–F48: no established mapping; aggregation identity conflict remains visible |

## Closure audit

| Closure | Attached Segments | Established or candidate continuation evidence |
|---|---|---|
| SC205 | C148, C149, C150 | None. Route adjacency creates no Fiber mapping. |
| SC206 | C150, C151, C169 | None. The C151 external direction remains a documentation boundary. |
| SC216 | C169, C170, C171 | None. Proposed construction groups do not establish continuity. |
| SC217 | C171, C172 | C171 F29 ↔ C172 F29, documented / reviewed. All other local Fiber relationships remain unresolved. |
| SC218 | C172, C173, C174 | Five grouped records: C172 F01–F28↔C174 F01–F28 candidate; C172 F29–F40↔C173 F01–F12 mixed; C172 F41–F48 unresolved; C174 F29–F40↔C173 F13–F24 candidate; C174 F41–F48 unresolved. |
| SC219 | C174, C175, C176 | None. Route branches do not establish Fiber continuity. |
| SC220 | C176, C177 | None. |
| SC221 | C177, C178 | None. |
| SC222 | C178, C179 | None. |
| SC223 | C179, C180 | None. |
| SC224 | C180, C181, C184 | None. The Lentekhi aggregation identity remains conflicting. |
| SC225 | C181, C182, C183 | None. AP53 and AP54 branches have no exact Fiber mapping. |

## Connector and optical mapping review

- The source contains 203 Connect rows grouped by 148 connector shapes.
- Twelve generated connector assertions match the SC218 line-shape interpretation; 136 connector shapes remain unresolved.
- The complete 52-record SC218 interpretation set remains preserved in source evidence.
- No unresolved connector geometry was promoted during Iteration 16.
- Exact ODF Port-to-Fiber mapping remains absent. No `FiberTermination` record was created.
- C173 F01 reaches AP51 as a reviewed asset-level endpoint. The AP51 port and AP/ODF containment remain unresolved.

## Product behavior reviewed

- The Route Workspace shows a compact construction ribbon on each Segment.
- Expanding a Segment exposes its documented Tubes or clearly marked proposed groups; expanding a Tube exposes individual Fibers directly on the route.
- Selecting a Tube opens a Tube Inspector with its number, physical color state, Fiber range, member colors, and continuation state.
- Segment, Tube, Fiber, and Closure Inspectors use the same review language: **Documented / reviewed continuation**, **Possible continuation**, and **No established mapping**.
- Closure Inspector presents compact grouped forks before the detailed connection ledger.
- Strict Cable Continuity excludes candidate mappings. Candidate mode includes them while retaining their review state.
- Manager View reduces engineering controls but keeps uncertainty and continuation status visible.

## Verification outcome

The continuation validator reports no duplicate identities, invalid ranges, unsupported documented Tube references, missing source connections, flattened mixed review states, or promoted unresolved ranges. Focused Iteration 16 tests cover domain separation, route-relative direction, all primary mappings, split/partial Tube behavior, deep links, every Segment and Closure, UI wording, and Manager View uncertainty.
