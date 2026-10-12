# Iteration 20 — Port/Fiber Topology Review

Reviewed 2026-09-28 against `Tsageri-Lentekhi 2025.vsdx`, page `ცაგერი-ლენტეხი` (page ID 4), source SHA-256 `51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a`.

## Result

Iteration 20 connects the navigation chain `Port → Fiber → Tube → Cable Segment → Fiber Journey` without inventing an optical operation. `PortTopologyBinding` is the shared local association layer. It projects the existing AP Port Flow records and adds reviewed ODF bindings. `FiberJourneySummary` gives every one of the 1,176 inventory Fibers the maximum journey supported by current evidence. The 68 existing `FiberLineage` records remain unchanged and take priority wherever they exist.

Segment primary labels now use endpoints and capacity. Canonical `CAB-…` IDs and legacy C-numbers are unchanged. C-numbers remain search aliases, technical metadata and valid deep links.

## Port coverage

| Port owner | Ports | Bound local Fiber | Confidence and limit |
|---|---:|---|---|
| Tsageri `ODF-TSAGERI-01` | 192 | C148/F01–F192 | Ordered mirrored banks; Port145/F145 and Port175/F175 are owner anchors. Range direction remains a separate fact. |
| AP41, AP50, AP51, AP52, AP53, AP54 | 144 | Each AP's arriving 24F Segment, same indexed F01–F24 | Projection of existing `APPortFlow`; no AP internal splice/patch/jumper is inferred. |
| Lentekhi `ODF-LENTEKHI-01` | 48 | C184/F01–F48 | Paired ordered 48-position endpoint banks; source interpreted. Numeric aggregation ID conflict remains separate. |
| **Total** | **384** | **384 local Port/Fiber bindings** | Every modeled meaningful Port is navigable. |

### Tsageri ranges

- Port1–116 keeps the owner-reviewed Ambrolauri direction. The binding exposes the local C148 Fiber identity; it does not claim the missing regional optical continuation.
- Port117–130 keeps the intentional stop at SC205. The status is a planned/intentional termination, not damage.
- Port131–144 keeps the AP41 direction. The exact AP41 internal/outgoing mapping remains unknown.
- Port145–192 has the strongest full-route evidence. Existing lineages connect Port145–192 to C148/F145–F192 and then preserve every local identity change.

## Representative paths

### C148/F23 — maximum-known partial journey

`AGG5 / Port23 → AGG5 ↔ SC205 · 192F / F23 → SC205`

- Tube2, Orange.
- Fiber F23, Rose/Pink.
- The local Port/Fiber association and destination are known.
- Exact Fiber mapping after SC205 is unknown, so the journey stops there in the normal UI.

### AGG5 Port175 — complete AP51 path

`AGG5/Port175 → C148/F175 → C150/F175 → C169/F31 → C171/F31 → C172/F31 → C173/F03 → AP51/Port3`

The existing `LINEAGE-AP51-NORTH-03` remains authoritative for the prototype. The Inspector shows the F175→F31 change at SC206 and F31→F03 at SC218. AP51 Port3 keeps its in-use state and OTDR annotation.

### AP51 Port3

AP51 Port3 binds to C173/F03: Blue Tube, Green Fiber. The Port can open the full Fiber Journey; selecting that Fiber exposes the same Port. Physical use is `in_use`; allocation and commercial availability remain unknown.

### AP41 Port18

AP41 Port18 binds to C149/F18 and retains the owner-described return role. The arriving Segment/Fiber/Tube/colors are known. The internal AP operation and exact outgoing Segment/Fiber are unknown, so the journey is partial and states that exact stop.

### Lentekhi Port31

Lentekhi Port31 binds to C184/F31. The known aggregation endpoint and Port/Fiber position are usable even though legacy heading `6` conflicts with property value `5`. Existing full lineages remain primary when they carry C184/F31 farther toward AP51.

## Maximum-known journey coverage

| Scope | Fiber summaries | Meaning |
|---|---:|---|
| Existing Fiber Lineage available | 600 | A Fiber belongs to one of the 68 multi-Segment lineages; the complete stored lineage is shown. |
| Partial | 416 | Local Segment and any Port endpoint are known; the next exact Fiber edge is not. |
| Intentional termination | 16 | The reviewed Port range ends at its destination. |
| External documentation boundary | 144 | The current source ends before the next regional document. |
| **Total** | **1,176** | Every inventory Fiber has an informative journey action. |

The count of 600 is per local Fiber record participating in a lineage, not 600 new lineages. The lineage count remains 68.

## Cable Segment naming map

| Legacy alias | Primary display name |
|---|---|
| C148 | AGG5 ↔ SC205 · 192F |
| C149 | SC205 ↔ AP41 · 24F |
| C150 | SC205 ↔ SC206 · 192F |
| C151 | SC206 ↔ SC207 boundary · 144F |
| C169 | SC206 ↔ SC216 · 48F |
| C170 | SC216 ↔ AP50 · 24F |
| C171 | SC216 ↔ SC217 · 48F |
| C172 | SC217 ↔ SC218 · 48F |
| C173 | SC218 ↔ AP51 · 24F |
| C174 | SC218 ↔ SC219 · 48F |
| C175 | SC219 ↔ AP52 · 24F |
| C176 | SC219 ↔ SC220 · 48F |
| C177 | SC220 ↔ SC221 · 48F |
| C178 | SC221 ↔ SC222 · 48F |
| C179 | SC222 ↔ SC223 · 48F |
| C180 | SC223 ↔ SC224 · 48F |
| C181 | SC224 ↔ SC225 · 24F |
| C182 | SC225 ↔ AP53 · 24F |
| C183 | SC225 ↔ AP54 · 24F |
| C184 | ლენტეხის აგრეგაცია ↔ SC224 · 48F |

## Exact facts and remaining gaps

Exact or source-interpreted facts now usable in normal navigation:

- all 384 modeled Ports have local Segment/Fiber/Tube/color context;
- all 1,176 Fibers have a maximum-known journey summary;
- Tsageri and Lentekhi ODF bindings preserve paired-bank provenance;
- AP bindings reuse `APPortFlow` and do not duplicate AP semantics;
- Port and Fiber selections cross-link and keep the route selection URL;
- endpoint-based Segment labels are used as primary names in workspace, Inspectors and search.

Remaining evidence gaps:

- Tsageri Port1–116 requires the next Ambrolauri regional document for downstream optical continuity;
- Tsageri Port131–144 does not establish exact AP41 internal Port-to-Port/Fiber mapping;
- AP internal continuation remains unknown unless an existing Fiber Lineage explicitly reaches the Port;
- most local Fibers do not have a defensible next Segment/Fiber edge;
- Lentekhi's numeric legacy identity remains conflicting;
- a topology binding does not establish service, rights, customer, availability, splice, patch cord or jumper.

## Validation

Focused Iteration 20 coverage contains 8 naming tests, 12 Port topology tests and 10 journey tests. The complete result is 519/519 tests, passing TypeScript and production build, a regenerated 1,578,556-byte standalone file, six focused desktop Manager/simple-view flows, a 390px bottom-sheet mobile check and standalone verification with zero browser warnings or errors. Full evidence is recorded in `docs/VALIDATION.md`.
