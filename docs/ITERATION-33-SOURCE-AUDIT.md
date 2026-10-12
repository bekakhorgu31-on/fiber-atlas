# Iteration 33 — Shida Kartli source and geometry review

Updated 2026-10-09. **The full-source audit now supports a validated partial Shida proposal.** The [semantic review](ITERATION-33-SEMANTIC-REVIEW.md) and `iteration33-semantic-review.json` describe the current gap-aware graph, coverage and remaining unknowns. Earlier geometry-only counts/statuses below remain historical diagnostic evidence. The initial tentative audit is preserved in the archive.

## Exact source and label context

The desktop owner file and preserved inventory have SHA-256 `e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060`. The original is 6,757,465 bytes, 29 ZIP entries, one Visio page, and a 113,255,345-byte main page XML. All 62,670 Shapes (21,576 roots and 23,343 text-bearing Shapes) are decoded. The actual page size comes from `PageSheet` in `visio/pages/pages.xml`: width 313.9015748031496, height 575.3110236220472; both drawing/page scales are 0.03937007874015748. Earlier extraction cleared sheet children or assumed the sheet existed in page contents; those bugs are corrected and covered by tests.

There are 178 five-field label occurrences, 177 distinct full literal labels and 171 distinct leading references. Example: `25-113-25009-25012-48`.

The owner clarified that fields before the Closure references vary by constructor/contract or construction ID and matter for future use. Preserve **both leading fields verbatim as an opaque construction/contract reference**; do not treat `113` or `25-113` alone as a unique physical Cable or Cable Segment ID. Focus current interpretation on the endpoint references and Fiber quantity after them. Exact prefix semantics remain nullable. References `25-178`, `25-112`, `25-190`, `25-247`, `25-260` and `25-303` recur; the `25-178` group includes an exact repeated full label. Preserve source occurrences and prove representation equivalence before merging them.

Observed label capacities: 20F (1), 24F (90), 48F (37), 72F (17), 96F (10), 144F (23). These are literal capacities, not a certified canonical Fiber total. Nine endpoint tokens have no exact matching standalone numeric text: `2082`, `2118`, `2119`, `25004`, `25040`, `25090`, `25138`, `250142`, `250143`. Apparent spelling/numbering corrections remain source conflicts or unknowns until geometry supports them.

## Audited symbols and construction

The reproducible audit is `scripts/audit-iteration33-shida.py`. Its evidence is in `migration/iteration33/source-audit.json` and a reusable compact geometry index. It creates no active facts.

- **120 grey Closure groups** use Master 2, each with one numeric identity and one coordinate text. These are the source's numbered Closure callouts, rather than station-Master references.
- **55 AP groups, numbers 10–64**, have a three-corner triangle carrying the AP number, a separate boxed `24` capacity, a rectangular AP body and name text where present. The triangle's extra text-baseline subpath must not be mistaken for additional polygon corners. Latin and Georgian names are preserved; AP62–64 retain their source number placeholders. AP1–9 are not present in the observed endpoint labels.
- **Four normalized station-Master references** exist (three root shapes and one nested). The earlier claim of 125 station symbols was incorrect. Explicit `გორი AGG #26` and `AGG წეროვანი` text exists; aggregation/Port associations still need their own source-specific certification. A coincident AP/aggregation number must not merge those different assets.
- **363 numbered Fiber-marker banks** are structurally decoded: 175 × 24F, 90 × 48F, 34 × 72F, 19 × 96F, 45 × 144F. Every bank has a complete printed 1–N number row with unique marker-to-number alignment. Inner fill and outer ring are retained individually. Color repetition never supplies a missing Fiber number or a transition key.
- There is no 20-marker bank corresponding to the 20F label. Tube numbering, ring exceptions and physical Tube meaning remain separate interpretation work; no universal 12-Fiber construction standard is imposed.

The page contains 19,372 ellipse Shapes (38,744 EllipticalArcTo rows). Of these, 19,272 belong to the 363 banks; the remaining 100 are not assigned by this bank grammar. Bank-marker occurrences are not canonical Fibers.

## Connector evidence and optical limits

All 330 explicit Visio Connect rows resolve their page-local Shape references. This verifies references, not optical semantics. The complete 19,131-Shape Begin/End line ledger is classified against the actual transformed marker ellipses:

| Disposition | Lines |
|---|---:|
| Two distinct, unique ellipse attachments | 6,253 |
| One ellipse attachment | 8,196 |
| No ellipse attachment | 4,304 |
| Ambiguous marker attachment | 378 |

An additional **270 open drawing paths have no 1D Begin/End cells**. Their IDs and path geometry are retained as a separate unprojected source-grammar ledger. They have not been assigned optical meaning.

The initial proximity bank pairing gives 154 two-bank labels, 11 single-bank labels and 13 without a bank pair. Only 53 candidate pairs are corroborated by strict drawn endpoint links; 125 label occurrences still depend on the proximity candidate rule. **Do not activate that rule as optical truth.**

A stronger source-container audit identifies one node owner for 316 banks and leaves 47 unowned. It finds 47 label/bank pairs backed by actual drawing links between distinct node containers, matching declared endpoints and capacity, with no unsupported internal number remap. From these associations it derives **825 candidate local transitions** at one actual node; 2,947 additional same-node drawn links still lack a unique Cable association. These are engineering candidates, not active FiberLineages. The less constrained strict-ellipse/proximity pass has 1,867 candidates; the earlier rectangular-distance count of 2,703 is retained only as historical preliminary evidence.

### Owner-confirmed drafting-gap continuation — 2026-10-09

At AP16 (Tsveri), blue marker Shape `12643` in bank `12640` is printed F01. Shape `12809` ends at `(96.57468011811025, 512.7042710542378)`, while Shape `12539` begins at `(96.57544390463127, 512.7727391296622)`. Both align with the marker row, but stop roughly 0.003–0.007 page units short of its ellipse outline. Neither has an explicit Connect row. The sampled strokes **do** have Begin/End cells; their issue is the small drawing gap, while the separate 270-path class remains another audit scope.

The owner has confirmed that these small, uniquely aligned gaps denote intended Cable/Fiber continuation. Confirmation ID: `OWNER-SHIDA-DRAFTING-GAP-CONTINUITY-2026-10-09`. The source-convention question is resolved. The interpreter may recover continuation from an actual stroke/path and unique numbered-marker/bank/local-node correspondence without requiring literal ellipse contact or a Connect row. It must preserve source IDs, measured residuals and this confirmation as evidence, validate multiple structurally matching cases and retain genuinely ambiguous matches. No universal tolerance, Fiber/Port offset formula or physical splice operation is supplied by this confirmation.

The strict-containment counts above are the pre-gap-aware audit baseline and will be recomputed by the implementation. They are not final coverage limits. A failed containment test or a small drafting gap does not prove a cut/termination; proximity, route adjacency, number/color equality and crossings alone still do not create an optical edge. The confirmed source-specific instruction is recorded in `ITERATION-33-SHIDA-KARTLI-NETWORK-IMPORT.md`. No code or active mappings were changed by this documentation update.

The source geometry crop `migration/iteration33/source-25017.png` shows Closure 25017 and the AP16/AP17 branches (Tsveri/Aradeti). It is a geometry debug rendering, not a font-perfect Visio export. Labels `25-123-25017-16-24` and `25-124-25017-17-24`, their printed Fiber banks, and Closure-local stroke `13075` provide review anchors. Final paths must be generated from accepted local transitions, never hard-coded from these examples.

## Versioned reprocess flow and limits — verified

A reviewer-authenticated action reprocesses the existing inventory-only upload into a new ImportRun on the same document/source revision. Original bytes and the older run remain intact. The extractor streams one root subtree at a time, reuses established transform/master/style resolution, and writes compressed Shape/Connect evidence. Shape payloads are indexed in bounded batches in `source_shapes`; literal source labels enter `import_candidates` without optical facts.

The new run remains `completed / not_evaluated / staged`, with `extractionScope=geometry_evidence`, `topologyProjected=false`. There is no topology proposal or Add to network action. The UI explains inventory-only, processing, failed extraction and decoded-geometry states in Georgian. Technical errors stay expandable. Progress is durable, and the review badge counts source revisions rather than duplicate attempts. A decoded source awaiting interpretation is visible in Needs Review.

Safeguards: 20 MiB compressed file; 128 MiB expanded entry; 256 MiB expanded package; 6 million page XML elements; 100,000 Shapes; 128 nesting levels; 25,000 Shapes / 1 million elements per root subtree; 300-second extractor limit and existing 90-second subprocess timeout. Windows working set is actively checked against **256 MiB**. DTD/entities, encrypted/unsafe/duplicate ZIP entries, missing or duplicate page-local IDs, and digest/count mismatches fail explicitly. Raw XML remains in the original package rather than being duplicated into the derived evidence. The Shape artifact is 13,065,047 compressed bytes; Connect evidence is 2,728 bytes.

Cache keys include both streaming and underlying geometry-extractor implementations. Reuse verifies artifact digests. Failures, expired processing leases and damaged caches create new attempts while preserving earlier evidence/status history. Leases use explicit ISO timestamps and renew during indexing. PostgreSQL connections explicitly use UTC to match the application's UTC timestamp formatting; historical rows are not rewritten. Monotonic clocks measure duration.

## Actual local acceptance results

The browser run used the original 6.7 MB file, real API calls and PostgreSQL `fiber_atlas_test / fiber_isolation`. Its storage is `app/isolation-private`, and its port/logs are separate from the owner application. **Owner-server writes: zero.**

| Actual browser reprocess resource | Measurement |
|---|---:|
| Extraction | 43.906 s |
| Database indexing | 28.651 s |
| Total reprocess | 73.863 s |
| Python peak working set | 217,899,008 bytes |
| PHP peak allocation | 29,360,128 bytes |
| Decoded/indexed Shapes | 62,670 |
| Valid Connect references | 330 |

- Actual-source backend upload/reprocess acceptance: **1 test / 53 assertions**. It checks retained SHA-identical bytes, both runs, all Shape records, one exact blue marker, source-scoped evidence, duplicate reuse and refusal to activate unvalidated geometry.
- Final authorization, retry, lease/cache recovery, UTC and review-count checks: **4 tests / 34 assertions**, logged in `iteration33-reprocess-tests.txt`.
- Python extraction/audit regression suite: **39/39**. Missing IDs, PageSheet preservation/catalog fallback, limits, malformed XML, numbering ambiguity, polygon subpaths and absence of adjacency-created optical edges are covered. Existing Tsageri/SC217 source regressions remain included.
- Actual desktop/390px browser QA: **8 journeys**, zero JS errors, zero external requests, zero horizontal overflow. Includes upload, reprocess, reload, duplicate reuse, exact source evidence, fresh-session sign-in, pending-source review visibility and the four-entry navigation/Engineer Search flow. Evidence: `iteration33-reprocess-browser-qa.json` and `iteration33-geometry-1440.png` / `iteration33-geometry-390.png`.
- TypeScript/build, required PHP formatting and standalone export pass. The previously completed 808/808 domain suite is retained; domain topology code was not changed in this continuation.

## Historical geometry checkpoint — remaining work at that time

Implement and certify the owner-confirmed drafting-gap/docking rule from multiple structurally matching examples; no further answer about that convention is required. Classify the 270 open geometry-only paths. Complete Cable/bank association, AP/aggregation Port inventory and bindings, construction/ring conflicts, repeated representations, usage/reserve/planned-work annotations and unresolved endpoint tokens. Keep AP and aggregation identity source-context aware; Shida AP51–54 must not merge into Tsageri AP51–54 merely by display number.

Then implement the separate Shida drawing-family interpreter against the complete stream, feed defensible entities and node-local transitions into the existing graph resolver/compiler, and validate a partial-coverage proposal pinned to the current network. Physical Route order, equal Fiber numbers, colors, capacity and shared Closure labels must never create optical edges. Unknown continuation is not a termination. Full network/Port/Fiber/map parity and owner Add to network are still pending; this checkpoint certifies geometry and reprocessing only.


## Current gap-aware semantic acceptance

The confirmed bounded docking convention is implemented and source scoped. All 19,401 strokes, including 270 geometry-only paths, are classified. 87 physical bank/label pairs yield 1,759 exact local transitions and 766 exact AP Port bindings. The proposal preserves partial journeys: 176 Segments / 9,356 Fibers; 96 exact selected-Fiber paths / 9,260 partial. AP16 Ports13–24 reach AP17 at SC25017; Ports1/10 retain local bindings and unknown continuation. Full routing matrices are in `migration/iteration33/node-routing-tables.json`; the regenerated full stroke ledger is `source-audit-gap-aware.json`.

Actual desktop/390px source-to-proposal/local-Add QA passes 14 workflows, zero JS errors and no owner-server writes. This supersedes the pending-topology status of the earlier checkpoint. The semantic review documents the eight fill conflicts, incomplete bank/Port associations and untouched operational/Tube questions. The owner retains final server activation.
