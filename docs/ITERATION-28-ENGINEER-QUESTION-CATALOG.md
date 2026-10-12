# Iteration 28 — Engineer Question Catalog

The executable catalog is in `tests/iteration28-engineer-query.test.ts`. It runs all questions through the production query service using `repository.load()` and verifies the result class. This document records the operator-facing acceptance cases.

| # | Input | Resolved intent / entities | Expected answer and data basis | Class |
|---:|---|---|---|---|
| 1 | `C151/F1 სად მიდის?` | TraceFiber · canonical C151/F1 | Crosses neutral Node 207 through active local transitions into C152/F1 and continues to C164/F13. | PARTIAL_BY_SOURCE |
| 2 | `C151/F118 სად მიდის?` | TraceFiber · C151/F118 | Reaches Node 207; no active transition to C152/F118 is recorded. | PARTIAL_BY_SOURCE |
| 3 | `SC211-ში რა კაბელები ერთდება?` | GetNodeConnections · Node 211 | Lists physical incident Cables from canonical endpoints/active node relationships. | PASS |
| 4 | `SC211-ში როგორ არის გადაერთებული Fibers?` | GetNodeFiberTransitions · Node 211 | Groups exact local transition edges by Cable pair; 106 individual transitions are available on expansion. | PASS |
| 5 | `C159-ზე რომელი Fiber-ები გადადის?` | GetFibersLeadingToSegment · C159 | Returns 24 active local mappings, including C158/F65 → C159/F1. | PASS |
| 6 | `C169 სად მიდის?` | FindEntity / endpoints · C169 | Returns source-supported SC206 and SC216 endpoints. | PASS |
| 7 | `169-206-216-48` | FindEntity · exact legacy label | Resolves to canonical C169. | PASS |
| 8 | `C172` | FindEntity · legacy Cable token | Presents separate V1 and Source B C172 Cables with endpoint/source labels. | DISAMBIGUATION_REQUIRED |
| 9 | `C172/F1 სად მიდის?` | TraceFiber · ambiguous legacy C172/F1 | Does not choose a source; presents the two Cable choices. | DISAMBIGUATION_REQUIRED |
| 10 | `Lentekhi Port38-ის გზა` | Port binding + TraceFiber · Port38/C184/F38 | Certified Port binding enters C184/F38, transitions at SC224 to C181/F06 and reaches source-confirmed termination at SC225. | PASS |
| 11 | `SC225 F06` | GetNodeFiberTransitions · SC225/F06 | Shows the active intentional termination for C181/F06. | PASS |
| 12 | `C176/F32 სად მიდის?` | TraceFiber · C176/F32 | Shows black local Fiber; SC219 maps to C175/F24 and AP52/Port24; opposite side traverses C177–C184 to Lentekhi/Port32. AP51 is absent. | PASS |
| 13 | `AP51 Port3` | FindEntity / Port · AP51/Port3 | Resolves the certified binding to C173/F03. | PASS |
| 14 | `C148 Tube` | ExplainConflict · C148 Tube colors | Discloses the source conflict only for affected Tube-color positions F121–F192; topology remains usable. | CONFLICT_DISCLOSED |
| 15 | `C151/F118 terminated არის?` | ExplainUnknown · C151/F118 | States that the path stops at Node 207 because the next transition is not represented; no termination is recorded. | UNKNOWN_DISCLOSED |
| 16 | `Magti რომელ Fiber-ებს იყენებს?` | SearchOrganizationOccurrences · Magti | Reports exact existing assignments separately; Source B organization text is not asserted as Fiber usage. | PARTIAL_BY_SOURCE |
| 17 | `ეს Fiber თავისუფალია?` | Availability · unspecified Fiber | Availability cannot be established from topology or unused appearance. | UNKNOWN_DISCLOSED |
| 18 | `Node 207 რა არის?` | FindEntity · Node 207 | Returns the neutral physical Node and discloses that equipment type is unknown. | UNKNOWN_DISCLOSED |
| 19 | `ალპანა` | SearchAnnotations · place mention | Returns a source place annotation, not a physical network object. | PASS |
| 20 | `ლენტეხი-ხელედის მიმართულება` | SearchAnnotations · direction note | Returns the source direction annotation without creating optical continuity. | PASS |

The suite also checks parser variants, exact search, C172 collision safety, Fiber/Tube/Port lookup, query result semantics, graph-only traces, and required F32/Port38 exclusions. The frozen V1 and Iteration 27D regression suite runs with the same full test command.
