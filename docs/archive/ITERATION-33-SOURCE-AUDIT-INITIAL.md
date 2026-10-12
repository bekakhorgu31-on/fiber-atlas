# Iteration 33-01 — Shida Kartli source-family audit

Status: **in progress**. This is a measured source inventory and grammar checkpoint; it is not a certified network interpretation and has not projected topology.

## Source identity and scale

The local owner file `შიდა ქართლი 2026.vsdx` matches the staged source checksum exactly: SHA-256 `e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060`. It is 6,757,465 bytes, contains 29 ZIP entries and one Visio page. `visio/pages/page1.xml` expands to 113,255,345 bytes. The page contains 62,670 Shapes, 23,343 non-empty text shapes and no duplicate page-local Shape IDs. Shape nesting reaches two levels.

The page has 14 Master definitions, including the Georgian `სადგური` symbol and `Dynamic connector`. The source references the station Master 125 times and the connector Master 1,029 times. There are 330 explicit Visio `Connect` rows. The page contains 62,657 Geometry sections, 118,773 `LineTo` rows, 60,671 `MoveTo` rows and 38,744 `EllipticalArcTo` rows. It also contains 1,917 Property sections, 1,320 Connection sections and 2,640 Connection rows. These counts establish that connector attachment and local drawing geometry are material evidence; `Connect` rows alone are not interpreted as optical transitions.

The package is single-page but not in either certified Tsageri drawing family. Its object names, label grammar and geometry rules must be audited independently. The existing full extractor materializes the whole XML tree and the current source index rejects more than 50,000 Shapes, so neither is suitable for this source as-is.

## Observed label and symbol evidence

The source contains 178 complete five-number labels shaped like `25-<number>-<number>-<number>-<capacity>`, representing 177 distinct literal values. Capacities are 20F (1 label), 24F (90), 48F (37), 72F (17), 96F (10) and 144F (23). The first field is `25` on every observed label. Its meaning remains unresolved.

The second field has 171 distinct values across the 178 labels. Values `178`, `112`, `190`, `247` and `303` appear more than once; in these cases the same token is associated with different endpoint-token pairs, and token `178` also has an exact duplicate label. Preserve each source Shape occurrence separately. Do not use this field alone as a unique physical Segment identity.

Across the third and fourth fields there are 183 distinct endpoint tokens. A corresponding numeric text Shape exists for 174 of those tokens; the remaining tokens are `2082`, `2118`, `2119`, `25004`, `25040`, `25090`, `25138`, `250142` and `250143`. A matching number is an investigation anchor only; it does not prove endpoint identity or connector attachment.

There are 120 coordinate-formatted text shapes and 125 station-Master references. Their one-to-one association and whether every station represents a Closure, AP, Aggregation or another node have not yet been established. The drawing contains explicit AP and Aggregation text, village/site labels, cable-capacity labels and Georgian reserve/use notes; those annotations remain unclassified until their geometry and source context are resolved.

## Evidence sufficiency and next audit steps

### Geometry pass 1 — marker-bank and line-end anchors

A source-specific geometry scan normalized Shapes one root group at a time and compared explicit `BeginX/BeginY` and `EndX/EndY` positions with the individual colored Fiber-marker centers. The initial bank association is a proximity candidate (capacity-matched marker groups above/below each cable label), not yet an accepted universal grammar.

| Measurement | Result | Interpretation |
|---|---:|---|
| Cable-label Shapes | 178 | Same literal inventory as the stream scan |
| Labels with two candidate endpoint banks | 154 | Needs endpoint-role validation |
| Selected endpoint banks | 308 | Capacities match the label's last field |
| Markers in selected banks | 14,256 | Numbered, colored ellipse candidates |
| Shapes with explicit begin/end coordinates | 19,131 | Broadly includes connector-like and drawing shapes |
| Begin ends uniquely matching a selected Fiber marker | 10,764 | Geometry anchor; not by itself a transition |
| End ends uniquely matching a selected Fiber marker | 9,362 | Geometry anchor; not by itself a transition |
| Shapes whose two ends uniquely match selected Fiber markers | 2,703 | Candidate local Fiber-to-Fiber links |
| Explicit Connect rows targeting a selected marker Shape | 222 / 330 | Separate attachment evidence; do not conflate with line geometry |

The candidate endpoints produce repeated local mappings such as Shape `13075` at numeric anchor `25017`, connecting marker 24 in the bank associated with label endpoint token `124` to marker 24 in the bank associated with `123`. For the sampled 24F pair, Shapes `13075`–`13086` visibly connect F24 down through F13, with each line endpoint landing uniquely on the corresponding numbered markers. At anchor `25009`, the sampled 48F lines include marker numbers 3–12 and 25–32 between endpoint banks `113` and `109`; the pattern is not necessarily a complete all-Fiber mapping. Exact line position, marker number and source Shape remain the evidence; a shared endpoint number alone is not used to create an edge.

The provisional proximity scan cannot yet certify the complete cable-family grammar. Eleven labels have only one candidate bank and thirteen have none; ambiguous candidate groups and out-of-band text remain to be classified. Two groups were selected by two labels. Some endpoint tokens are absent as independent numeric text Shapes. The 2,703 double-ended line Shapes must be inventoried by local object/master/style, endpoint label occurrence, Fiber numbers, line appearance and connector semantics before assigning complete source coverage. The scan has found source-backed local links, not yet a complete network or a proposal.

| Claim | Evidence found | Current disposition |
|---|---|---|
| Source identity | File checksum equals the staged inventory checksum | Verified |
| Source scale | ZIP, page, Shape, text and geometry counts | Measured |
| Cable-label syntax | 178 source text Shapes with five numeric fields | Observed; field roles need geometry confirmation |
| Cable capacity | Last field values include 20, 24, 48, 72, 96 and 144 | Observed; preserve literal per occurrence |
| Cable token uniqueness | Repeated second-field tokens point to different endpoint pairs | Not unique by token alone |
| Endpoint symbols | Most endpoint tokens also appear as numeric text Shapes | Candidate references only; no topology edge established |
| Connector semantics | 1,029 Dynamic connector master references and 330 Connect rows | Requires source-specific endpoint/marker alignment audit |
| Fiber/Tube construction and colors | 14,256 selected numbered ellipse markers; 2,703 line Shapes with both ends uniquely on selected markers | Per-bank construction is observed; full line disposition and Tube interpretation remain in progress |
| Node/Port/route identity | Site names, coordinates and AP/Aggregation text exist | Not yet certified |

The next audit pass must classify these line Shapes against source-local cable-label occurrences, resolve repeated numeric anchors by geometry rather than token, establish the role of each label field, distinguish repeated physical cable occurrences, decode Tube/Fiber/color evidence and inventory AP/Aggregation/Closure symbols. No route order, Port binding, occupancy or Fiber usage is asserted by this checkpoint. Candidate line-to-marker attachment is now demonstrated for sampled objects, but the source-family rules and completeness remain uncertified.

## Bounded geometry extraction milestone

Added `scripts/extract-vsdx-geometry-stream.py`, which processes one top-level Shape subtree at a time and reuses the existing transform, master, style and geometry resolver. It emits compressed, page-scoped Shape and Connect NDJSON plus a versioned summary; the original VSDX remains the byte-for-byte source of record. It does not produce semantic topology.

The actual staged Shida Kartli source completed extraction with matching SHA-256, **62,670 Shapes including subshapes, 21,576 top-level Shapes, 330/330 page-local Connect rows resolving, and 2,752,941 page XML elements**. The shape artifact is 13,065,047 compressed bytes; Connect evidence is 2,728 bytes. The latest measured extraction took **29.797 seconds** and peaked at **53,821,440 bytes** of working set on this local Windows runtime. Limits are 20 MiB compressed source, 256 MiB expanded package, 128 MiB per entry, 6 million page XML elements, 100,000 Shapes, 128 XML nesting levels, 25,000 Shapes / 1,000,000 XML elements per root subtree, and 300 seconds. The existing upload flow's 90-second process bound has room for the measured run; database persistence and retry behavior still need end-to-end verification.

The extractor rejects DTD/entity declarations across XML package parts, unsafe/duplicate ZIP paths, encrypted entries, missing package parts, duplicate page-local Shape IDs and dangling evidence is recorded rather than promoted. It intentionally omits duplicate raw XML from the derived artifact because the original file is retained. Focused Python tests pass **31/31**, including nested transform preservation, page-local Connect validation, DTD rejection and duplicate-ID rejection. The large-source output was written to a worker-local `tmp` directory for this run and is not yet a versioned ImportRun artifact.

The authenticated reviewer reprocess route now creates a new versioned ImportRun from the preserved inventory-only run, stores compressed geometry evidence and literal five-field label candidates, and explicitly leaves `semantic_status=not_evaluated`, `topologyProjected=false`, and the active network unchanged. The owner screen distinguishes inventory-only from decoded-geometry status and exposes the reprocess action. The original source bytes and earlier run are preserved. There is no automatic topology proposal.

This advances 33-02 and 33-04 but does not complete either: the route has not been exercised end-to-end against the dedicated `fiber_isolation` database/browser workflow, the stored 62,670-Shape geometry has not been loaded into a versioned run by the worker, and no Shida source interpreter has been connected to the existing compiler. The local PostgreSQL feature suite skipped because the current configured schema is not `fiber_isolation`; no owner-server writes were attempted. Current verification: Python extractor suite **32/32**, controller auth unit tests **2/2**, TypeScript project tests **808/808**, production bundle and standalone export pass. Full mobile/desktop browser QA is still pending.
