# Iteration 27 — overlap reconciliation

**Decision: source cross-validation is complete for several shared identities, but canonical activation remains withheld until whole-document semantic certification.** The frozen source remains unchanged. Matching display numbers alone are insufficient, and incomplete Fiber evidence must not be represented as active topology.

| Anchor | Source A representation | Source B representation | Evidence / differences | State |
|---|---|---|---|---|
| Tsageri Aggregation | V1 aggregation context `5`, adjacent to C148 `148-5-205-192` and SC205 | Shape 12427 text `Aagregacia #5` / `cageri`; C148 is Shape 15769 | Text, aggregation number and C148/SC205 layout agree. Exact aggregation/ODF representation still needs geometry review. | `strong_candidate` |
| SC205 | V1 Closure SC205; C148/C149/C150 | B has the same three full labels; C148 Shape15769, C149 Shape14250, C150 Shape15770 | Construction/transition evidence reproduces 16 C148↔C149, 174 C148↔C150, and 6 C149↔C150 pairs exactly. | `exact_match` evidence; not activated |
| SC206 | V1 Closure SC206; C150/C151/C169 | B has the same labels; C150 Shape15770, C151 Shape15772, C169 Shape34056 | Construction and transitions reproduce all 132 C150↔C151 pairs and all 48 C150↔C169 pairs. No route-derived edges are used. | `exact_match` evidence; not activated |
| C169 / `169-206-216-48` | `CAB-000169`, 48F, SC206 ↔ SC216 | Exact label Shape34056; 48F; 48-position bank Group33254 | All 48 Fiber colors, Tube number/color positions, and C150↔C169 transition pairs at SC206 match V1. See the detailed [C169 comparison](ITERATION-27-C169-FIBER-CROSS-VALIDATION.md). | `exact_match` evidence; not activated |
| C148 physical identity / construction | V1 C148 is 192F | B repeats the full cable label and has two 192-position marker banks | Label, endpoints/capacity, 192 Fiber colors and tested SC205 transitions agree; physical identity is a strong candidate. Separately preserve the 72-position Tube-color conflict. | `identity_candidate_with_attribute_conflict` |
| C149/C150/C151 construction | V1 C149 24F, C150 192F, C151 144F | B has same full labels and two banks for each | Both B representations match the V1 Fiber color, Tube number, and Tube color at every position: 24/24, 192/192, 144/144. | `exact_match` evidence; not activated |
| V1 boundary near SC207 | V1 C151 / external boundary `BOUNDARY-SC207` | B repeats C151 and adds `152-207-208-144` | B contains further physical topology from SC207. Preserve the historical boundary and both source representations; canonical boundary/segment links await certification. | `strong_candidate` |

## C169 cross-validation

| Field | Frozen V1 | Source B | Result |
|---|---|---|---|
| Exact label | `169-206-216-48` | `169-206-216-48` (Shape 34056) | Agreement |
| Legacy cable alias | C169 | C169, source-scoped | Agreement; alias alone is not identity |
| Capacity | 48F | 48F | Agreement |
| Endpoint tokens | SC206 ↔ SC216 | 206 ↔ 216 | Agreement |
| Direction context | V1 segment SC206 ↔ SC216 | Exact `ლენტეხი-ხელედის მიმართულება` text is present (Shape 40991) | Consistent named context; geometry/route association still to certify |
| Tube count/colors | V1 construction exists in frozen package | 4 Tubes / 48 positions decoded from Shape33254 | 48/48 Tube positions agree |
| Per-Fiber colors/numbers | V1 construction exists in frozen package | 48 Fiber positions decoded from Shape33254 | 48/48 Fiber colors agree |
| SC206 local transition mapping | V1 has 48 C150↔C169 transitions | B has 48 C150↔C169 transitions from connector/marker geometry | 48/48 exact pairs reproduced; zero source-only edges |
| Company use | V1 assignments remain frozen | B labels are present but their marker alignment is not decoded | Not compared |

The detailed 48-row shape-level comparison is `docs/ITERATION-27-C169-FIBER-CROSS-VALIDATION.md`. Cross-document agreement is a documentation correspondence, never field verification. These exact object matches have not been activated because full source-B certification remains incomplete; V1 data and its manifest are unchanged.

## Shared transition matrices

Each value is the count of individual local Fiber transition pairs found independently in both sources and compared by Closure token, Segment identity, and Fiber positions.

| Node | Source-supported Segment pair | Source A | Source B | Exact pairs | Result |
|---|---|---:|---:|---:|---|
| SC205 | C148 ↔ C149 | 16 | 16 | 16 | exact_match |
| SC205 | C148 ↔ C150 | 174 | 174 | 174 | exact_match |
| SC205 | C149 ↔ C150 | 6 | 6 | 6 | exact_match |
| SC206 | C150 ↔ C151 | 132 | 132 | 132 | exact_match |
| SC206 | C150 ↔ C169 | 48 | 48 | 48 | exact_match |

The source-B local matrix continues through SC207–SC215 and is recorded in the complete source interpretation artifact. The source-specific candidate graph contains 1,151 connector/marker transitions; no route-only adjacency edge was added. Canonical segment/Fiber merges, boundary promotion, and active combined routes remain empty until semantic certification and the C148 conflict review are complete.

## C148 structured source conflict

The source claims are kept separately. V1 Tube colors come from marker group Shape 43832. Source B repeats the differing claim in marker-bank groups Shapes 16115 and 15124. Fiber colors match at all 192 positions, while these six Tube groups conflict:

| Fiber range | Tube | V1 Tube color | Source B Tube color |
|---|---:|---|---|
| F121–F132 | 11 | Blue | Violet |
| F133–F144 | 12 | Orange | Rose |
| F145–F156 | 13 | Green | Blue |
| F157–F168 | 14 | Brown | Orange |
| F169–F180 | 15 | Slate | Green |
| F181–F192 | 16 | White | Brown |

Resolution remains `unresolved_source_conflict`; no source is selected, and the V1 construction is unchanged. Physical C148 correspondence remains a strong candidate independent of this attribute conflict. Whole-document activation is withheld.

## Iteration 27B correspondence state

The final Source B semantic decision is **NOT CERTIFIED**. The 376 tested SC205/SC206 pairs are cross-document duplicate evidence; 775 additional local transition candidates remain without a semantic disposition. The network manifest stores overlap correspondence candidates and the structured C148 conflict, while all canonical merges and cross-document Fiber links remain empty. See [the semantic reconciliation report](ITERATION-27B-SOURCE-B-SEMANTIC-RECONCILIATION.md).


## Iteration 27C staged decisions

Source-local transition decoding is complete and does not change the frozen reference: SC205/SC206 retain 376 duplicate-overlap transitions; the other 775 connector-to-marker edges are source-local transitions in the staged Source B graph. C149, C150, C151 and C169 remain exact construction correspondences as previously documented. C148 remains a preserved source conflict at Tube colors F121–F192; no V1 data was overwritten. SC207 has 143 source-supported local C151↔C152 transitions; the physical C151 correspondence is exact, but Closure identity/boundary link is withheld because no literal SC207 label is in Source B. No canonical merge or network link is active.
