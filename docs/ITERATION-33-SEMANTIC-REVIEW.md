# Iteration 33 — Shida source-local semantic projection

Updated 2026-10-09. The actual Shida source now produces a validated **partial** network proposal through stored-source reprocessing. Worker verification uses only loopback PostgreSQL `fiber_atlas_test / fiber_isolation`, separate storage and port 8010. The owner performs the final Add to network on their server. Desktop/390px browser acceptance passes 14 workflows; recorded results distinguish worker-local verification from owner acceptance.

## Source and confirmed drafting convention

The supported revision is SHA-256 `e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060`, containing 62,670 Shapes. This is a source-specific prototype grammar, not universal Visio support. A changed, unaudited source revision remains preserved but unsupported.

`OWNER-SHIDA-DRAFTING-GAP-CONTINUITY-2026-10-09` records the owner's confirmation that small, uniquely aligned drafting gaps can indicate continuation. The implemented rule, `shida-numbered-marker-and-port-drafting-gap/2`, measures the actual transformed ellipse or Port rectangle, local bank/Port pitch, open stroke direction and transverse residual. It rejects excessive gaps, sideways strokes, wrong directions, ambiguous targets and missing printed-number evidence. No Connect row is required; no number, color, Tube, route order or nearest-marker winner establishes an edge.

AP16 F01 has two reviewed strokes just outside its marker. Their source Shapes and measured docking residuals are retained. Port10's 0.0015625-unit gap is also resolved from its actual rectangle/stroke. These are source anchors, not global tolerances.

The first two fields of labels such as `25-113-25009-25012-48` remain an opaque constructor/contract/construction reference. They vary by region, matter for future interpretation and are not asserted to identify a unique physical Cable. Current projection uses the later endpoint references and declared Fiber quantity. Repeated references remain separate source occurrences; duplicate full labels without a proven physical association are review-only.

## Coverage and actual graph

| Claim | Result |
|---|---:|
| Complete normalized source Shapes | 62,670 |
| Label occurrences / distinct full labels | 178 / 177 |
| Structurally numbered Fiber banks | 363 |
| Source Closure / AP symbols | 120 / 55 |
| Geometry-corroborated Cable/bank pairs | 87 |
| Canonical Cable Segments / logical Fibers | 176 / 9,356 |
| Explicit node-local optical transitions | 1,759 |
| Certified printed AP Port banks | 53 of 55 |
| Canonical printed Ports / exact bindings | 1,272 / 766 |
| Complete selected-Fiber paths / partial paths | 96 / 9,260 |
| Generated current Lineages, including partial paths | 7,597 |
| Preserved annotations / review cases / color conflicts | 579 / 606 / 8 |

Counts describe this source interpretation and are not fixed acceptance targets. All 9,356 canonical Fibers have current paths and JourneySummaries. Accepted transition coverage is 100%; unsupported edges, false stops and false terminations are zero. This does not certify every source connector or an end-to-end path for every Fiber.

All 19,401 relevant strokes are classified: 9,019 have two unique marker attachments, 8,299 have one, 1,695 have none and 388 remain ambiguous. This includes 270 geometry-only open paths. The marker rule recovers 5,140 drafting-gap endpoints. Of the source banks, 316 have a unique node container and 47 remain unowned. There are 2,627 local drawn links without a complete unique Cable association. Their evidence remains in the engineering audit; they do not enter the optical graph.

The 1,320 raw Port-shaped source records include 48 records in two irregular number banks. Those records remain source evidence and review cases. They are not invented as certified canonical Ports. Of the 1,272 certified Ports, 506 lack an exact Fiber binding. Raw State, fill and alignment are preserved independently; occupancy, usage, administrative allocation, physical condition and commercial availability stay unknown.

Artifacts: [semantic counts](iteration33-semantic-review.json), [complete gap-aware stroke audit](../migration/iteration33/source-audit-gap-aware.json), [per-node bidirectional routing tables](../migration/iteration33/node-routing-tables.json). The strict-containment audit is retained as a historical diagnostic baseline.

## AP16 / SC25017 / AP17 examples

| Selected context | Maximum source-supported result |
|---|---|
| AP16 Port1 | `25-123 / F01`, blue, reaches SC25017; continuation at that Closure remains unknown |
| AP16 Port10 | Exact local `25-123 / F10` binding; continuation at SC25017 remains unknown |
| AP16 Ports13–24 | Corresponding local Fibers continue at SC25017 into `25-124` and reach AP17 Ports13–24 |

Ports13, 14 and 24 are regression examples. Their selected optical path uses AP16 → SC25017 → AP17 and excludes `25-122` toward SC25016. The physical Cable context can continue toward SC25016 while this selected strand leaves for AP17. F01 must not inherit the F13–24 branch merely through matching numbering or color. No final rendered path is special-cased.

## Identity, persistence and user workflow

Shida canonical IDs are scoped by source document and source object. AP16 or AP51 in another region cannot merge merely by display number. Engineer Search returns choices when a public AP number has multiple canonical owners. Port operational lookup and relational Port keys use the canonical owner ID, preserving unknown occupancy. Source-derived Closure/AP names remain visible instead of hashed internal IDs.

The existing graph resolver and operational projection compiler are reused. Every traversal edge is an explicit node-local transition. The document's physical context has Cable endpoints/legs; its listing order creates no optical continuity. Source symbol geometry supplies typed nodes, while unclear endpoint tokens remain neutral. Explicit Gori/Tserovani aggregation names are retained; exact aggregation Port associations are unknown.

| Existing table / collection | Shida projection |
|---|---|
| `source_revisions`, `source_shapes`, `import_candidates` | Original digest, versioned full geometry and literal labels |
| `canonical_nodes` / `networkNodes` | Source-scoped Closure/AP identities and unresolved endpoints |
| `cable_segments` | Real endpoint foreign keys, capacity and preserved construction references |
| `fibers` | Exact logical number; measured local fill when consistent; Tube unknown |
| `node_fiber_transitions` | Actual node + both Segment/Fiber identities + connector/marker provenance |
| `ports`, `port_topology_bindings` | Canonical AP owner, printed Port, exact Fiber FK and independent status |
| `fiber_paths`, domain records and snapshots | Shared-resolver path signatures, partial journeys, reviews and annotations |

No schema migration or owner-server cleanup was introduced. Old source/import runs and original bytes remain preserved. A new interpreter version creates a linked attempt and reuses intact unchanged geometry/index rows. Current proposal reuse checks geometry/index integrity, candidate digest and active-network expectation. Damaged caches, interruptions and expired leases remain explicit failures with versioned retries.

Reprocessing produces a staged proposal; it never activates it. The UI offers only the latest validated proposal for a source. The API rejects older validated interpretations and stale active-network expectations. Add uses the existing digest checks, relational integrity validation and atomic activation. AP/Port/Fiber cross-navigation uses the same graph. Port evidence opens the exact run/page/Shape in the authenticated source viewer.

## Resource limits and validation

Geometry retains the established compressed/expanded ZIP, XML, depth and count guards, 256 MiB working-set bound and bounded subprocess. Semantic interpretation verifies geometry artifact digests and page-local uniqueness, caps Shapes at 100,000, time at 180 seconds and working set at 512 MiB. Measured standalone semantic pass: 40.766 seconds and 329,359,360 bytes peak working set. Existing PHP capacity is 1,536 MiB; actual large-source backend acceptance peaked at 1.00 GiB. No unbounded-memory workaround was added.

Initial semantic acceptance: 2 backend tests / 95 assertions, covering actual source staging, proposal, local apply, retries/cache integrity and history. Additional authorization, upgraded-interpreter geometry reuse and original Tsageri/revision replay: 3 tests / 6,348 assertions. TypeScript: 816/816; Python: 46/46. TypeScript/compiler checks, production build and standalone export pass. Final affected backend checks: 3 tests / 45 assertions. Browser: 14 workflows, zero JS errors/external requests/overflow, with exact source evidence navigation and selected-branch unfolding on mobile. Results are recorded in VALIDATION.md and `iteration33-semantic-browser-qa.json`. Full geometry reuse retained 62,670 index rows, took 3.89s indexing / 56.748s total reprocess, and peaked at 1,031,798,784 PHP bytes. The actual browser semantic pass took 40.437s / 328,605,696 bytes; its preserved original extractor measurement was 32.266s / 217,931,776 bytes.

## Remaining actual unknowns

Unpaired banks, unassociated local links, duplicate full-label identity, two irregular Port banks, source endpoint typos/types, aggregation Port relationships, Tube/ring meaning and usage/reserve/planned-work annotations remain explicit gaps. Eight conflicting local bank fills do not receive a preferred color. Unknown continuation is never relabeled as termination. Additional changed Shida revisions and other regional drawing conventions require their own evidence audit. The owner’s later server acceptance remains outstanding.
