# Iteration 23 — Full Connection Reconciliation

Fresh projection: **838 exact local Fiber transitions**, **192 defensible Port↔Fiber bindings**, and **32 active connection sheets / 1,038 rows** after the separate owner-confirmed unresolved SC225 overlay. Iteration 22 had 838 exact transitions, 384 bindings, 33 sheets and 1,230 rows. The transition count reproduced exactly; 192 Tsageri same-index Port bindings were removed from active projection because the fresh source has mirrored logical positions without a distinct per-Port termination proof.

## Source basis

Each exact mapping records source connector, both marker shape IDs, node, local Fiber numbers, geometry and one or more of `explicit_connect`, `source_geometry`, and `ordered_marker_alignment`. Owner confirmations are held in `iteration23-owner-confirmations.json` and applied after fresh interpretation.

## Relationship reconciliation

| Node | Left bank | Right bank | Capacity | Exact | Number changes | Tube changes | Fiber-color changes | Terminations | Other relationship | Unresolved | Conflicts | Basis |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| SC205 | C148 | C149 | 192 | 16 | 16 | 16 | 16 | 0 | 174 | 2 | 0 | explicit_connect+source_geometry: 16 |
| SC205 | C148 | C150 | 192 | 174 | 0 | 54 | 0 | 0 | 16 | 2 | 0 | source_geometry: 174 |
| SC205 | C149 | C150 | 24 | 6 | 6 | 6 | 6 | 0 | 16 | 2 | 0 | explicit_connect+source_geometry: 6 |
| SC206 | C150 | C151 | 192 | 132 | 0 | 0 | 0 | 0 | 48 | 12 | 0 | source_geometry: 132 |
| SC206 | C150 | C169 | 192 | 48 | 48 | 48 | 0 | 0 | 132 | 12 | 0 | explicit_connect: 23, explicit_connect+source_geometry: 25 |
| SC216 | C169 | C170 | 48 | 16 | 16 | 16 | 16 | 0 | 32 | 0 | 0 | explicit_connect: 3, explicit_connect+source_geometry: 1, source_geometry: 12 |
| SC216 | C169 | C171 | 48 | 32 | 0 | 0 | 0 | 0 | 16 | 0 | 0 | source_geometry: 32 |
| SC216 | C170 | C171 | 24 | 8 | 8 | 8 | 8 | 0 | 16 | 0 | 0 | explicit_connect: 4, explicit_connect+source_geometry: 4 |
| SC217 | C171 | C172 | 48 | 46 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | source_geometry: 46 |
| SC218 | C172 | C173 | 48 | 12 | 12 | 12 | 12 | 0 | 28 | 8 | 0 | source_geometry: 12 |
| SC218 | C172 | C174 | 48 | 28 | 0 | 0 | 0 | 0 | 12 | 8 | 0 | source_geometry: 28 |
| SC218 | C173 | C174 | 24 | 12 | 12 | 12 | 12 | 0 | 12 | 0 | 0 | explicit_connect: 4, explicit_connect+source_geometry: 8 |
| SC219 | C174 | C175 | 48 | 16 | 16 | 16 | 0 | 0 | 24 | 8 | 0 | explicit_connect: 11, explicit_connect+source_geometry: 1, source_geometry: 4 |
| SC219 | C174 | C176 | 48 | 24 | 0 | 0 | 0 | 0 | 16 | 8 | 0 | source_geometry: 24 |
| SC219 | C175 | C176 | 24 | 8 | 8 | 8 | 8 | 0 | 16 | 0 | 0 | explicit_connect: 8 |
| SC220 | C176 | C177 | 48 | 48 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | source_geometry: 48 |
| SC221 | C177 | C178 | 48 | 48 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | source_geometry: 48 |
| SC222 | C178 | C179 | 48 | 48 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | source_geometry: 48 |
| SC223 | C179 | C180 | 48 | 48 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | source_geometry: 48 |
| SC224 | C180 | C184 | 48 | 32 | 0 | 0 | 0 | 0 | 0 | 16 | 0 | source_geometry: 32 |
| SC224 | C181 | C184 | 24 | 16 | 16 | 16 | 16 | 0 | 0 | 8 | 0 | explicit_connect+source_geometry: 16 |
| SC225 | C181 | C182 | 24 | 4 | 4 | 4 | 0 | 0 | 4 | 16 | 0 | explicit_connect+source_geometry: 4 |
| SC225 | C181 | C183 | 24 | 4 | 0 | 0 | 0 | 0 | 4 | 16 | 0 | source_geometry: 4 |
| SC225 | C182 | C183 | 24 | 12 | 12 | 8 | 12 | 0 | 4 | 8 | 0 | explicit_connect+source_geometry: 12 |

Every row reconciles: exact + termination + other relationship + unresolved equals the relevant left-bank capacity. “Other relationship” prevents a branch Fiber from being counted as silently missing in a second relationship sheet.

## Golden raw-source mappings

- SC218: C172/F29 ↔ C173/F01, connector shape 33098.
- SC219: C176/F32 ↔ C175/F24, connector shape 37487; owner confirmation keeps AP52 and excludes SC218/AP51.
- SC224: C184/F38 ↔ C181/F06, connector shape 37064; owner confirmation continues to the unresolved AP side at SC225.

## Old versus fresh transitions

- Reproduced exactly: 838
- Changed: 0
- Not found in fresh source: 0
- Newly discovered: 0

The equality is an observed result, not a protected target. The fresh interpreter did not read the old transition fixture until after all fresh outputs had been written.

## Physical differences

Connection sheets preserve both local Tube and Fiber identities. Number, Tube and Fiber-color changes are calculated from the two local sides and can be filtered independently. Straight same-number rows remain explicit at SC220–SC223.

## Remaining gaps

- C181/F05–F12 reach SC225 without a source-distinguishable AP53/AP54 choice; only owner-confirmed F06 receives the AP-side unresolved overlay.
- AP-internal ingress/return pairing remains unresolved.
- Transition operation remains “unknown”; optical continuity does not imply a named splice operation.
- Tsageri exact per-Port Fiber bindings are withheld pending stronger source or owner evidence.
