# Iteration 21 — Branch Fiber Routing Review

## Algorithm correction

Iteration 21 removes the assumption that ordered Cable Route adjacency is optical continuity. The Route remains physical and geographic context. An active FiberLineage is now a connected component built only by traversing an explicit NodeFiberTransition at each shared Closure, AP, aggregation, or supported boundary. Matching Fiber number, Tube, color, capacity, or neighboring Route position creates no edge.

The source interpreter decoded 838 exact two-sided local transitions from the Visio connector and marker geometry. One additional owner-confirmed transition records the unresolved AP-side continuation of C181/F06 at SC225 without guessing AP53 versus AP54. Every active multi-leg Lineage transition carries its node ID and NodeFiberTransition provenance.

## Golden Case A — C176/F32 → AP52 ↔ Lentekhi

- Fixture: `GOLDEN-SC219-F32-AP52-LENTEKHI`.
- Local identity: C176/F32, black Fiber.
- Exact SC219 transition: C176/F32 ↔ C175/F24, connector shape 37487.
- AP endpoint: AP52/Port24 through C175.
- Opposite path: C184/F32 → C180/F32 → C179/F32 → C178/F32 → C177/F32 → C176/F32 → C175/F24.
- SC218, C174, C173, and AP51 are absent.

## Golden Case B — Lentekhi Port38 → SC224 → SC225 → AP side

- Fixture: `GOLDEN-LENTEKHI-P38-SC225-AP`.
- Lentekhi Port38 binds C184/F38.
- Exact SC224 transition: C184/F38 ↔ C181/F06, connector shape 37064.
- Maximum defensible path: C184/F38 → C181/F06 → SC225 → AP53–AP54 direction unresolved.
- The source does not distinguish C181/F06 to C182/AP53 or C183/AP54. No AP is guessed.
- SC223, SC218, and AP51 are absent after the SC224 branch.

## Node routing matrices

These compressed ranges are generated from individual source-supported local transitions. They are summaries of exact edges, not global formulas.

### SC205

| Incoming Segment/Fiber | Outgoing Segment/Fiber | Destination/basis |
|---|---|---|
| C148/F129–F144 | C149/F01–F16 | source connector |
| C148/F01–F126 | C150/F01–F126 | source connector |
| C148/F145–F192 | C150/F145–F192 | source connector |
| C149/F17–F22 | C150/F127–F132 | source connector |

### SC206

| Incoming Segment/Fiber | Outgoing Segment/Fiber | Destination/basis |
|---|---|---|
| C150/F01–F132 | C151/F01–F132 | source connector |
| C150/F145–F192 | C169/F01–F48 | source connector |

### SC216

| Incoming Segment/Fiber | Outgoing Segment/Fiber | Destination/basis |
|---|---|---|
| C169/F33–F48 | C170/F01–F16 | source connector |
| C169/F01–F32 | C171/F01–F32 | source connector |
| C170/F17–F24 | C171/F33–F40 | source connector |

### SC218

| Incoming Segment/Fiber | Outgoing Segment/Fiber | Destination/basis |
|---|---|---|
| C172/F29–F40 | C173/F01–F12 | source connector |
| C172/F01–F28 | C174/F01–F28 | source connector |
| C173/F13–F24 | C174/F29–F40 | source connector |

### SC219

| Incoming Segment/Fiber | Outgoing Segment/Fiber | Destination/basis |
|---|---|---|
| C174/F25–F40 | C175/F01–F16 | AP52 branch |
| C174/F01–F24 | C176/F01–F24 | source connector |
| C175/F17–F24 | C176/F25–F32 | AP52 branch |

### SC224

| Incoming Segment/Fiber | Outgoing Segment/Fiber | Destination/basis |
|---|---|---|
| C180/F01–F32 | C184/F01–F32 | source connector |
| C181/F01–F16 | C184/F33–F48 | source connector |

### SC225

| Incoming Segment/Fiber | Outgoing Segment/Fiber | Destination/basis |
|---|---|---|
| C181/F13–F16 | C182/F01–F04 | SC225 local matrix |
| C181/F01–F04 | C183/F01–F04 | SC225 local matrix |
| C182/F05–F16 | C183/F13–F24 | SC225 local matrix |
| C181/F06 | unresolved | AP-side unresolved |

## Old Lineage audit

The previous 68 prototype interpretations were audited individually. 26 are reproduced exactly by the local-transition graph. 42 conflict with the corrected graph and their old records are retained only as superseded provenance. Those corrected records resolve into 84 active graph components because one old route projection can split into more than one real optical path.

| Previous Lineage | Classification | Active replacement(s) | Corrected path example |
|---|---|---|---|
| LINEAGE-CORE-001 | preserved | LINEAGE-CORE-001 | C148/F145 → C150/F145 → C169/F01 → C171/F01 → C172/F01 → C174/F01 → C176/F01 → C177/F01 → C178/F01 → C179/F01 → C180/F01 → C184/F01 |
| LINEAGE-CORE-002 | preserved | LINEAGE-CORE-002 | C148/F146 → C150/F146 → C169/F02 → C171/F02 → C172/F02 → C174/F02 → C176/F02 → C177/F02 → C178/F02 → C179/F02 → C180/F02 → C184/F02 |
| LINEAGE-CORE-003 | preserved | LINEAGE-CORE-003 | C148/F147 → C150/F147 → C169/F03 → C171/F03 → C172/F03 → C174/F03 → C176/F03 → C177/F03 → C178/F03 → C179/F03 → C180/F03 → C184/F03 |
| LINEAGE-CORE-004 | preserved | LINEAGE-CORE-004 | C148/F148 → C150/F148 → C169/F04 → C171/F04 → C172/F04 → C174/F04 → C176/F04 → C177/F04 → C178/F04 → C179/F04 → C180/F04 → C184/F04 |
| LINEAGE-CORE-005 | preserved | LINEAGE-CORE-005 | C148/F149 → C150/F149 → C169/F05 → C171/F05 → C172/F05 → C174/F05 → C176/F05 → C177/F05 → C178/F05 → C179/F05 → C180/F05 → C184/F05 |
| LINEAGE-CORE-006 | preserved | LINEAGE-CORE-006 | C148/F150 → C150/F150 → C169/F06 → C171/F06 → C172/F06 → C174/F06 → C176/F06 → C177/F06 → C178/F06 → C179/F06 → C180/F06 → C184/F06 |
| LINEAGE-CORE-007 | preserved | LINEAGE-CORE-007 | C148/F151 → C150/F151 → C169/F07 → C171/F07 → C172/F07 → C174/F07 → C176/F07 → C177/F07 → C178/F07 → C179/F07 → C180/F07 → C184/F07 |
| LINEAGE-CORE-008 | preserved | LINEAGE-CORE-008 | C148/F152 → C150/F152 → C169/F08 → C171/F08 → C172/F08 → C174/F08 → C176/F08 → C177/F08 → C178/F08 → C179/F08 → C180/F08 → C184/F08 |
| LINEAGE-CORE-009 | preserved | LINEAGE-CORE-009 | C148/F153 → C150/F153 → C169/F09 → C171/F09 → C172/F09 → C174/F09 → C176/F09 → C177/F09 → C178/F09 → C179/F09 → C180/F09 → C184/F09 |
| LINEAGE-CORE-010 | corrected; old record superseded | LINEAGE-GRAPH-213, LINEAGE-GRAPH-136 | C184/F10 → C180/F10 → C179/F10 → C178/F10 → C177/F10 → C176/F10 → C174/F10 → C172/F10 |
| LINEAGE-CORE-011 | preserved | LINEAGE-CORE-011 | C148/F155 → C150/F155 → C169/F11 → C171/F11 → C172/F11 → C174/F11 → C176/F11 → C177/F11 → C178/F11 → C179/F11 → C180/F11 → C184/F11 |
| LINEAGE-CORE-012 | corrected; old record superseded | LINEAGE-GRAPH-214, LINEAGE-GRAPH-138 | C184/F12 → C180/F12 → C179/F12 → C178/F12 → C177/F12 → C176/F12 → C174/F12 → C172/F12 |
| LINEAGE-CORE-013 | preserved | LINEAGE-CORE-013 | C148/F157 → C150/F157 → C169/F13 → C171/F13 → C172/F13 → C174/F13 → C176/F13 → C177/F13 → C178/F13 → C179/F13 → C180/F13 → C184/F13 |
| LINEAGE-CORE-014 | preserved | LINEAGE-CORE-014 | C148/F158 → C150/F158 → C169/F14 → C171/F14 → C172/F14 → C174/F14 → C176/F14 → C177/F14 → C178/F14 → C179/F14 → C180/F14 → C184/F14 |
| LINEAGE-CORE-015 | preserved | LINEAGE-CORE-015 | C148/F159 → C150/F159 → C169/F15 → C171/F15 → C172/F15 → C174/F15 → C176/F15 → C177/F15 → C178/F15 → C179/F15 → C180/F15 → C184/F15 |
| LINEAGE-CORE-016 | preserved | LINEAGE-CORE-016 | C148/F160 → C150/F160 → C169/F16 → C171/F16 → C172/F16 → C174/F16 → C176/F16 → C177/F16 → C178/F16 → C179/F16 → C180/F16 → C184/F16 |
| LINEAGE-CORE-017 | preserved | LINEAGE-CORE-017 | C148/F161 → C150/F161 → C169/F17 → C171/F17 → C172/F17 → C174/F17 → C176/F17 → C177/F17 → C178/F17 → C179/F17 → C180/F17 → C184/F17 |
| LINEAGE-CORE-018 | preserved | LINEAGE-CORE-018 | C148/F162 → C150/F162 → C169/F18 → C171/F18 → C172/F18 → C174/F18 → C176/F18 → C177/F18 → C178/F18 → C179/F18 → C180/F18 → C184/F18 |
| LINEAGE-CORE-019 | preserved | LINEAGE-CORE-019 | C148/F163 → C150/F163 → C169/F19 → C171/F19 → C172/F19 → C174/F19 → C176/F19 → C177/F19 → C178/F19 → C179/F19 → C180/F19 → C184/F19 |
| LINEAGE-CORE-020 | preserved | LINEAGE-CORE-020 | C148/F164 → C150/F164 → C169/F20 → C171/F20 → C172/F20 → C174/F20 → C176/F20 → C177/F20 → C178/F20 → C179/F20 → C180/F20 → C184/F20 |
| LINEAGE-CORE-021 | preserved | LINEAGE-CORE-021 | C148/F165 → C150/F165 → C169/F21 → C171/F21 → C172/F21 → C174/F21 → C176/F21 → C177/F21 → C178/F21 → C179/F21 → C180/F21 → C184/F21 |
| LINEAGE-CORE-022 | preserved | LINEAGE-CORE-022 | C148/F166 → C150/F166 → C169/F22 → C171/F22 → C172/F22 → C174/F22 → C176/F22 → C177/F22 → C178/F22 → C179/F22 → C180/F22 → C184/F22 |
| LINEAGE-CORE-023 | preserved | LINEAGE-CORE-023 | C148/F167 → C150/F167 → C169/F23 → C171/F23 → C172/F23 → C174/F23 → C176/F23 → C177/F23 → C178/F23 → C179/F23 → C180/F23 → C184/F23 |
| LINEAGE-CORE-024 | preserved | LINEAGE-CORE-024 | C148/F168 → C150/F168 → C169/F24 → C171/F24 → C172/F24 → C174/F24 → C176/F24 → C177/F24 → C178/F24 → C179/F24 → C180/F24 → C184/F24 |
| LINEAGE-CORE-025 | corrected; old record superseded | LINEAGE-GRAPH-167, LINEAGE-GRAPH-234 | C148/F169 → C150/F169 → C169/F25 → C171/F25 → C172/F25 → C174/F25 → C175/F01 |
| LINEAGE-CORE-026 | corrected; old record superseded | LINEAGE-GRAPH-168, LINEAGE-GRAPH-233 | C148/F170 → C150/F170 → C169/F26 → C171/F26 → C172/F26 → C174/F26 → C175/F02 |
| LINEAGE-CORE-027 | corrected; old record superseded | LINEAGE-GRAPH-169, LINEAGE-GRAPH-232 | C148/F171 → C150/F171 → C169/F27 → C171/F27 → C172/F27 → C174/F27 → C175/F03 |
| LINEAGE-CORE-028 | corrected; old record superseded | LINEAGE-GRAPH-170, LINEAGE-GRAPH-231 | C148/F172 → C150/F172 → C169/F28 → C171/F28 → C172/F28 → C174/F28 → C175/F04 |
| LINEAGE-AP51-NORTH-01 | preserved | LINEAGE-AP51-NORTH-01 | C148/F173 → C150/F173 → C169/F29 → C171/F29 → C172/F29 → C173/F01 |
| LINEAGE-AP51-NORTH-02 | preserved | LINEAGE-AP51-NORTH-02 | C148/F174 → C150/F174 → C169/F30 → C171/F30 → C172/F30 → C173/F02 |
| LINEAGE-AP51-NORTH-03 | preserved | LINEAGE-AP51-NORTH-03 | C148/F175 → C150/F175 → C169/F31 → C171/F31 → C172/F31 → C173/F03 |
| LINEAGE-AP51-NORTH-04 | preserved | LINEAGE-AP51-NORTH-04 | C148/F176 → C150/F176 → C169/F32 → C171/F32 → C172/F32 → C173/F04 |
| LINEAGE-AP51-NORTH-05 | corrected; old record superseded | LINEAGE-GRAPH-181, LINEAGE-GRAPH-200 | C148/F177 → C150/F177 → C169/F33 → C170/F01 |
| LINEAGE-AP51-NORTH-06 | corrected; old record superseded | LINEAGE-GRAPH-182, LINEAGE-GRAPH-199 | C148/F178 → C150/F178 → C169/F34 → C170/F02 |
| LINEAGE-AP51-NORTH-07 | corrected; old record superseded | LINEAGE-GRAPH-183, LINEAGE-GRAPH-197 | C148/F179 → C150/F179 → C169/F35 → C170/F03 |
| LINEAGE-AP51-NORTH-08 | corrected; old record superseded | LINEAGE-GRAPH-184, LINEAGE-GRAPH-198 | C148/F180 → C150/F180 → C169/F36 → C170/F04 |
| LINEAGE-AP51-NORTH-09 | corrected; old record superseded | LINEAGE-GRAPH-185, LINEAGE-GRAPH-201 | C148/F181 → C150/F181 → C169/F37 → C170/F05 |
| LINEAGE-AP51-NORTH-10 | corrected; old record superseded | LINEAGE-GRAPH-186, LINEAGE-GRAPH-202 | C148/F182 → C150/F182 → C169/F38 → C170/F06 |
| LINEAGE-AP51-NORTH-11 | corrected; old record superseded | LINEAGE-GRAPH-187, LINEAGE-GRAPH-203 | C148/F183 → C150/F183 → C169/F39 → C170/F07 |
| LINEAGE-AP51-NORTH-12 | corrected; old record superseded | LINEAGE-GRAPH-188, LINEAGE-GRAPH-204 | C148/F184 → C150/F184 → C169/F40 → C170/F08 |
| LINEAGE-AP51-SOUTH-13 | corrected; old record superseded | LINEAGE-GRAPH-230, LINEAGE-GRAPH-222 | C184/F29 → C180/F29 → C179/F29 → C178/F29 → C177/F29 → C176/F29 → C175/F21 |
| LINEAGE-AP51-SOUTH-14 | corrected; old record superseded | LINEAGE-GRAPH-229, LINEAGE-GRAPH-221 | C184/F30 → C180/F30 → C179/F30 → C178/F30 → C177/F30 → C176/F30 → C175/F22 |
| LINEAGE-AP51-SOUTH-15 | corrected; old record superseded | LINEAGE-GRAPH-227, LINEAGE-GRAPH-220 | C184/F31 → C180/F31 → C179/F31 → C178/F31 → C177/F31 → C176/F31 → C175/F23 |
| LINEAGE-AP51-SOUTH-16 | corrected; old record superseded | GOLDEN-SC219-F32-AP52-LENTEKHI, LINEAGE-GRAPH-219 | C184/F32 → C180/F32 → C179/F32 → C178/F32 → C177/F32 → C176/F32 → C175/F24 |
| LINEAGE-AP51-SOUTH-17 | corrected; old record superseded | LINEAGE-GRAPH-235, LINEAGE-GRAPH-218 | C176/F33 → C177/F33 → C178/F33 → C179/F33 → C180/F33 |
| LINEAGE-AP51-SOUTH-18 | corrected; old record superseded | LINEAGE-GRAPH-236, LINEAGE-GRAPH-217 | C176/F34 → C177/F34 → C178/F34 → C179/F34 → C180/F34 |
| LINEAGE-AP51-SOUTH-19 | corrected; old record superseded | LINEAGE-GRAPH-237, LINEAGE-GRAPH-215 | C176/F35 → C177/F35 → C178/F35 → C179/F35 → C180/F35 |
| LINEAGE-AP51-SOUTH-20 | corrected; old record superseded | LINEAGE-GRAPH-238, LINEAGE-GRAPH-216 | C176/F36 → C177/F36 → C178/F36 → C179/F36 → C180/F36 |
| LINEAGE-AP51-SOUTH-21 | corrected; old record superseded | LINEAGE-GRAPH-239, LINEAGE-GRAPH-223 | C176/F37 → C177/F37 → C178/F37 → C179/F37 → C180/F37 |
| LINEAGE-AP51-SOUTH-22 | corrected; old record superseded | LINEAGE-GRAPH-240, LINEAGE-GRAPH-224 | C176/F38 → C177/F38 → C178/F38 → C179/F38 → C180/F38 |
| LINEAGE-AP51-SOUTH-23 | corrected; old record superseded | LINEAGE-GRAPH-241, LINEAGE-GRAPH-225 | C176/F39 → C177/F39 → C178/F39 → C179/F39 → C180/F39 |
| LINEAGE-AP51-SOUTH-24 | corrected; old record superseded | LINEAGE-GRAPH-242, LINEAGE-GRAPH-226 | C176/F40 → C177/F40 → C178/F40 → C179/F40 → C180/F40 |
| LINEAGE-NORTH-PARTIAL-41 | corrected; old record superseded | LINEAGE-GRAPH-189, LINEAGE-GRAPH-205 | C148/F185 → C150/F185 → C169/F41 → C170/F09 |
| LINEAGE-SOUTH-PARTIAL-41 | corrected; old record superseded | LINEAGE-GRAPH-243, LINEAGE-GRAPH-259 | C176/F41 → C177/F41 → C178/F41 → C179/F41 → C180/F41 |
| LINEAGE-NORTH-PARTIAL-42 | corrected; old record superseded | LINEAGE-GRAPH-190, LINEAGE-GRAPH-206 | C148/F186 → C150/F186 → C169/F42 → C170/F10 |
| LINEAGE-SOUTH-PARTIAL-42 | corrected; old record superseded | LINEAGE-GRAPH-244, LINEAGE-GRAPH-260 | C176/F42 → C177/F42 → C178/F42 → C179/F42 → C180/F42 |
| LINEAGE-NORTH-PARTIAL-43 | corrected; old record superseded | LINEAGE-GRAPH-191, LINEAGE-GRAPH-207 | C148/F187 → C150/F187 → C169/F43 → C170/F11 |
| LINEAGE-SOUTH-PARTIAL-43 | corrected; old record superseded | LINEAGE-GRAPH-245, LINEAGE-GRAPH-261 | C176/F43 → C177/F43 → C178/F43 → C179/F43 → C180/F43 |
| LINEAGE-NORTH-PARTIAL-44 | corrected; old record superseded | LINEAGE-GRAPH-192, LINEAGE-GRAPH-208 | C148/F188 → C150/F188 → C169/F44 → C170/F12 |
| LINEAGE-SOUTH-PARTIAL-44 | corrected; old record superseded | LINEAGE-GRAPH-246, LINEAGE-GRAPH-262 | C176/F44 → C177/F44 → C178/F44 → C179/F44 → C180/F44 |
| LINEAGE-NORTH-PARTIAL-45 | corrected; old record superseded | LINEAGE-GRAPH-193, LINEAGE-GRAPH-209 | C148/F189 → C150/F189 → C169/F45 → C170/F13 |
| LINEAGE-SOUTH-PARTIAL-45 | corrected; old record superseded | LINEAGE-GRAPH-247, LINEAGE-GRAPH-263 | C176/F45 → C177/F45 → C178/F45 → C179/F45 → C180/F45 |
| LINEAGE-NORTH-PARTIAL-46 | corrected; old record superseded | LINEAGE-GRAPH-194, LINEAGE-GRAPH-210 | C148/F190 → C150/F190 → C169/F46 → C170/F14 |
| LINEAGE-SOUTH-PARTIAL-46 | corrected; old record superseded | LINEAGE-GRAPH-248, LINEAGE-GRAPH-264 | C176/F46 → C177/F46 → C178/F46 → C179/F46 → C180/F46 |
| LINEAGE-NORTH-PARTIAL-47 | corrected; old record superseded | LINEAGE-GRAPH-195, LINEAGE-GRAPH-211 | C148/F191 → C150/F191 → C169/F47 → C170/F15 |
| LINEAGE-SOUTH-PARTIAL-47 | corrected; old record superseded | LINEAGE-GRAPH-249, LINEAGE-GRAPH-265 | C176/F47 → C177/F47 → C178/F47 → C179/F47 → C180/F47 |
| LINEAGE-NORTH-PARTIAL-48 | corrected; old record superseded | LINEAGE-GRAPH-196, LINEAGE-GRAPH-212 | C148/F192 → C150/F192 → C169/F48 → C170/F16 |
| LINEAGE-SOUTH-PARTIAL-48 | corrected; old record superseded | LINEAGE-GRAPH-250, LINEAGE-GRAPH-266 | C176/F48 → C177/F48 → C178/F48 → C179/F48 → C180/F48 |

## Rebuilt inventory

| Measure | Result |
|---|---:|
| Active FiberLineage records | 278 |
| Preserved old Lineages | 26 |
| Corrected active Lineages | 84 |
| Superseded old records | 42 |
| Newly discovered graph components | 168 |
| Partial active Lineages | 168 |
| NodeFiberTransition records | 839 |
| JourneySummary full-lineage participants | 584 |
| JourneySummary partial | 576 |
| JourneySummary intentional stops | 4 |
| JourneySummary external boundaries | 12 |
| JourneySummary total | 1176 |

## AP branch coverage

| AP | Required physical branch | Active endpoint Lineages | Result |
|---|---|---:|---|
| AP50 | C170 | 24 | Exact local Port/Fiber binding projected. |
| AP51 | C173 | 24 | Any AP51 Lineage must traverse C173. |
| AP52 | C175 | 24 | Exact local Port/Fiber binding projected; F32 anchor resolves to Port24. |
| AP53 | C182 | 16 | Four SC225 root-branch strands plus twelve C182↔C183 components. |
| AP54 | C183 | 16 | Four SC225 root-branch strands plus twelve C182↔C183 components. |

The validator rejects AP51 without C173, AP52 without C175, AP53 without C182, AP54 without C183, and any root-route entry to SC225 that skips C181. It also rejects missing node-local edges, node discontinuities, transition identity mismatches, route-only hops, and active use of a superseded interpretation.

## Remaining gaps

- C181/F05–F12 reach SC225 from C184/F37–F44, but the source geometry does not establish which individual strands continue to AP53 or AP54. These journeys stop at the AP-side boundary.
- SC205 Ports117–130 retain intentional stopping behavior from the established ODF range model; no Fiber transition is invented beyond the documented stop.
- The SC206 Ambrolauri direction remains an external-document boundary where the current source package has no next-document Fiber identity.
- Physical operation names remain unknown unless explicitly established. NodeFiberTransition records assert optical continuation, not an invented splice, patch, or jumper.
