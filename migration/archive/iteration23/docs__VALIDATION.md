# Iteration 23 validation — 2026-09-29

## Automated checks

- Clean v2 extraction from `C:\Users\Beka\Desktop\Visio Alt\Tsageri-Lentekhi 2025.vsdx` uses SHA-256 `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`. Two complete runs produced byte-identical compressed raw artifacts.
- Both clean extraction runs produced raw artifact SHA-256 `52f353aa6e9be12d94b6cd4cac3ae6db737655d865119d412b5df17e47effdb8`. Two complete interpretation/annotation/report runs then reproduced all eleven generated JSON/report artifacts byte-for-byte with zero changed artifacts.
- The extractor preserves 40 XML/relationship parts verbatim and projects 7,349 shapes, 22 masters, 7 styles, 203 Connect rows, effective styles and transformed nested geometry.
- The fresh interpreter reads only the new raw artifact. It regenerates 838 exact transitions, 192 Port bindings, 384 occupancy rows and 24 balanced relationship reconciliations. Its isolated comparison reports all 838 old transitions reproduced exactly with no changes/missing/new edges.
- Owner facts are held in `src/data/iteration23-owner-confirmations.json` and are applied after fresh source interpretation.
- Fresh physical construction now comes from the current raw artifact: 20 Segments, 1,176 Fibers and 98 Tubes under `tsageri-lentekhi-marker-colors/3`. All paired banks agree, all bounded colors decode, and each transition endpoint retains its own local Tube/Fiber identity.
- Core Cable, Closure, AP, Aggregation and ODF evidence is revalidated against the fresh source. The annotation pass classifies all 2,677 direct-text/comment occurrences under the current source SHA/import run while preserving raw text.
- 608 tests pass after the source-fidelity reset, including 32 focused Iteration 23 import/style/geometry/deduplication/inventory/annotation/physical-construction/topology/occupancy/UI checks. TypeScript validation passes.
- Active Splice Workspace projection is 32 sheets / 1,038 rows. The change from Iteration 22's 33 / 1,230 removes 192 unsupported Tsageri exact Port bindings and keeps all 838 source-derived Fiber transitions.

## Browser and build checks

- TypeScript validation, the production build and standalone export pass. Final assets are `index-C92ZDCHR.css` (111,344 bytes), `index-B39DxgSl.js` (2,404,907 bytes), and `fiber-prototype.html` (2,517,070 bytes; SHA-256 `6722cbef9adda57f390a7ff80e649d5c801d978839288bebd983de6bc45f8785`). Vite's large embedded-bundle advisory remains expected for the offline artifact.
- Desktop engineering QA passes 11 rendered sheet cases: Lentekhi ODF↔C184, SC220 straight-through, SC218/SC219/SC224 renumbered mappings, and one Port↔Fiber sheet for each of AP41/AP50/AP51/AP52/AP53/AP54. All rows expose source-fidelity metadata and remain within a 1,440px viewport.
- The AGG5 acceptance check confirms that the unsupported exact Port↔C148 sheet is withheld and a clear no-local-connection state is shown. This is the intended source-fidelity correction; the 192 logical Tsageri ports and owner-confirmed range semantics remain available elsewhere.
- The `ყველა შეერთება` view and reconciliation table pass at SC205, SC216, SC218, SC219, SC224 and SC225. Relationship-row counts are 3, 3, 3, 3, 2 and 3 respectively. Number, Tube, Fiber-color and combined-change filters all return the fresh SC218 mappings.
- Port status text is verified for occupied AP41/AP50/AP51/AP53/AP54 examples and an unused AP52 example. The UI never labels an unused Port available.
- Print media hides application navigation/actions, keeps the engineering sheet visible, and prints generation date `2026-09-29`, source filename and SHA prefix `caae4badc9c8`. Closure photo preview and its session-only warning continue to work with the rebuilt data.
- At 390×844, SC219/F32, SC224/Port38, AP41 occupied Port1 and the SC225 all-relationships table remain within the viewport. The sheet width is 372px and the document width is exactly 390px.
- The standalone file opens SC219/F32 with C175/F24↔C176/F32, black C176/F32 identity and no AP51. It uses one embedded script, no linked stylesheet, and has no horizontal overflow at 1,280px.
- The browser run recorded zero console warnings and zero page errors in `docs/iteration23-browser-qa.json`.

## Limits

Tsageri exact per-Port Fiber binding, aggregation Port occupancy, AP-internal Port pairing, splice mechanism/tray/patching and the C181/F05–F12 AP53/AP54 choice remain unresolved. White means unused only for an actual filled Port graphic and never means available.

---

# Iteration 22 validation — 2026-09-28

## Automated checks

- 576 tests pass, 0 fail. The 25 focused Iteration 22 tests cover exact transition reachability, all required nodes, relationship-pair isolation, SC218 F29, SC219 F32, Lentekhi Port38, SC224/C181, SC225 F05–F12 unresolved preservation, AP51 Port3, AGG5 Port175, 192F grouping, status semantics, exact organization-use scope, one-line provenance, URL round-trip, session photos, print CSS, SVG state encoding and Inspector entry points.
- The deterministic projection contains 33 sheets and 1,230 rows: 838 exact closure transitions, one owner-confirmed unresolved transition plus seven additional visibly unresolved SC225 positions, and 384 PortTopologyBinding rows.
- TypeScript compilation, production build and standalone export pass. Final assets are `index-CGbWoTBr.css` (109,999 bytes), `index-D_c7fpYy.js` (1,854,908 bytes), and `fiber-prototype.html` (1,965,726 bytes). The existing large embedded-bundle advisory remains expected for the offline artifact.
- `scripts/interpret-iteration21-routing.py` regenerated the immutable source audit twice with identical SHA-256 `66B09CFB1872BC8CCB59CBCA0F8847BB51EB1391DB0D92A6A240354AF9398D69`. `scripts/generate-iteration22-report.ts` regenerates `docs/ITERATION-22-SPLICE-WORKSPACE-REVIEW.md` from the live inventory (report SHA-256 `BEFE90F65B7C70754E8A1E0AAF4F05DDB8B98676373E60ADCA5B0683790EBF37`).

## Browser checks

- Desktop QA verifies SC218 C172/F29→C173/F01, SC219 C176/F32→C175/F24, AGG5 Port175→C148/F175, Lentekhi Port38/C184/F38→SC224→C181/F06, SC225 unresolved F05–F12, and AP51 Port3→C173/F03.
- Relationship switching, 12-position group filtering, quick search, selected-line highlighting, full-journey navigation and return to the Route Workspace work without console errors.
- Closure photo upload produces a local preview and primary-photo state while keeping the session-only warning visible.
- Print media renders the selected relationship sheet without application navigation. At 390px, the aligned banks and connection canvas remain usable without document-wide overflow.
- The standalone artifact exposes the same Splice Workspace and golden mappings.

## Limits

SC225 C181/F05–F12 remains unresolved toward AP53/AP54. Port state remains unknown where the source does not establish physical usage, allocation or unavailability. Closure photos are session-only. No field verification, Laravel/PostgreSQL, authentication, persistent editing, deployment or additional Visio import was added.

---

# Iteration 21 validation — 2026-09-28

## Automated checks

- 551 tests pass, 0 fail. The 32 focused Iteration 21 tests cover route-adjacency exclusion, mandatory node-local edges, main-route and nested-route branching, supersession, stale-record priority, AP51/AP52/AP53/AP54 physical-branch invariants, SC225/C181 continuity, skipped-node rejection, both Golden Cases, Port cross-linking, adjacent F37, all 1,176 journeys, node-matrix totals, AP coverage and full shared inventory validation.
- The rebuilt graph contains 838 exact two-sided source transitions plus one owner-confirmed unresolved SC225 AP-side transition. It produces 278 active Lineages. Of the previous 68 interpretations, 26 are preserved and 42 are retained only as superseded provenance.
- `GOLDEN-SC219-F32-AP52-LENTEKHI` proves C176/F32 is black, maps through SC219 to C175/F24 and AP52/Port24, reaches Lentekhi in the opposite direction, and contains no SC218/C174/C173/AP51 leg.
- `GOLDEN-LENTEKHI-P38-SC225-AP` proves Lentekhi Port38/C184/F38 maps at SC224 to C181/F06 and reaches SC225. The exact AP53/AP54 continuation remains unresolved, and SC223/SC218/AP51 are absent.
- `scripts/interpret-iteration21-routing.py` rereads the immutable compressed source package twice with identical SHA-256 output `66B09CFB1872BC8CCB59CBCA0F8847BB51EB1391DB0D92A6A240354AF9398D69`. The generated evidence reports SC205=196, SC206=180, SC216=56, SC218=52, SC219=48, SC224=48 and SC225=20 exact two-sided transitions.
- TypeScript compilation, full inventory validation and the Vite production build pass. Final assets are `index-DOvXyoNC.css` (99,473 bytes) and `index-DUG-j_Lw.js` (1,831,240 bytes). Vite's expected embedded-bundle size advisory remains non-blocking.
- The sibling `fiber-prototype.html` was regenerated at 1,931,532 bytes. It contains one embedded runtime script and no linked stylesheet.

## Browser checks

- Desktop Manager QA passes for the clicked Segment→F32 workflow, the clicked Lentekhi Aggregation→Port38→Fiber workflow and neighboring C184/F37, including AP52 endpoint Port cross-navigation and return to the same F32 journey.
- F32 displays black local identity, Lentekhi/Port32 and AP52/Port24 endpoints, and the explicit `SC219 · C176/F32 → C175/F24` transition. Its active overlay contains C176→C177→C178→C179→C180→C184 and the C175/AP52 branch. C174, C173, SC218 and AP51 are absent from both Inspector and overlay.
- Lentekhi Port38 opens C184/F38, then the active journey shows `SC224 · C184/F38 → C181/F06`, SC225 and the unresolved AP53–AP54 direction. The overlay switches to the nested C181 route at SC224 and does not highlight C180 toward SC223.
- Adjacent F37 independently follows C184/F37 → C181/F05 and stops unresolved at SC225. It does not inherit the previous AP51 path or the owner-only AP-side claim for F38.
- At 390×844, both Golden workflows use the fixed Inspector sheet with document and Inspector widths exactly 390px and no horizontal overflow.
- The standalone file opens directly through `file://`, preserves the F32 Golden Lineage and AP52 mapping, has one embedded script, zero linked styles and no horizontal overflow. Desktop, mobile and standalone browser logs contain zero warnings or errors.

Machine-readable results and reviewed screenshots are in `docs/iteration21-browser-qa.json`, `docs/iteration21-f32-desktop.png`, `docs/iteration21-port38-desktop.png`, `docs/iteration21-f37-desktop.png` and `docs/iteration21-port38-mobile.png`.

## Limits

C181/F05–F12 reach SC225 without a source-readable per-Fiber choice between AP53 and AP54. Only the owner-confirmed C181/F06 journey is labeled as reaching the unresolved AP-side direction; adjacent Fibers stop at SC225 unless their own source evidence establishes more. Closure operation names remain unknown. No Laravel/PostgreSQL, authentication, GIS, persisted editing, deployment or second Visio import was added.

---

# Iteration 20 validation — 2026-09-28

## Automated checks

- 519 tests pass, 0 fail. The 30 focused Iteration 20 tests comprise 8 Segment naming checks, 12 Port topology checks and 10 maximum-known Fiber Journey checks.
- All 20 Cable Segments have deterministic endpoint-based primary names. The required C148, C149, C151, C172 and C173 examples pass exactly. Legacy C-number and endpoint-token search both resolve to the same canonical Segment, with `Legacy C…` shown second.
- `PortTopologyBinding` validation passes for 384 records: 192 Tsageri ODF, 144 AP and 48 Lentekhi ODF. Every binding resolves to an inventory Fiber. AGG5 Port175 and AP51 Port3 both link to `LINEAGE-AP51-NORTH-03`.
- `FiberJourneySummary` covers all 1,176 inventory Fibers exactly once. The existing Fiber Lineage count remains 68. C148/F23 passes the required AGG5/Port23, SC205, Tube2 Orange, F23 Rose/Pink and exact-stop checks.
- TypeScript compilation and the Vite production build pass. Final assets are `index-DY23H-FC.css` (97.98 kB) and `index-JgcBZdxK.js` (1,479.76 kB). Vite's expected embedded-bundle size advisory remains non-blocking.
- The sibling `fiber-prototype.html` was regenerated at 1,578,556 bytes. It contains one embedded runtime script and no linked stylesheet.

## Browser checks

- Six focused desktop Manager/simple-view checks pass for endpoint-based Segment naming, C148/F23 partial journey, AGG5 Port175, AP51 Port3, AP41 Port18 and Lentekhi Port31.
- C148/F23 shows AGG5/Port23, `AGG5 ↔ SC205 · 192F`, Orange Tube2, Rose/Pink F23, destination SC205 and the exact Georgian stop. It contains no generic red/English unresolved card.
- Port175 and AP51 Port3 both expose Fiber, Tube, Segment and full-journey actions. AP51 keeps in-use and OTDR semantics. AP41 Port18 exposes C149/F18 and an exact partial stop without classifying splice or jumper.
- Lentekhi Port31 exposes C184/F31 and the higher-priority full journey while keeping numeric identity conflict out of the primary path.
- Route search accepts `C172` and `SC217`, shows `SC217 ↔ SC218 · 48F` first and `Legacy C172` second.
- At 390×844, AGG5 Port175 opens in the fixed bottom-sheet Inspector. Document and Inspector widths remain 390px with no horizontal overflow.
- The standalone file opens directly through `file://`, preserves the C148/F23 partial journey, has one embedded script, zero linked styles and no horizontal overflow. Production, mobile and standalone logs contain zero warnings or errors.

Machine-readable results and reviewed screenshots are in `docs/iteration20-browser-qa.json`, `docs/iteration20-c148-f23-desktop.png` and `docs/iteration20-port175-mobile.png`.

## Limits

Port topology bindings establish local Port/Fiber identity only. They do not establish an AP internal operation, service, rights, customer or commercial availability. A maximum-known journey stops at the last defensible endpoint and does not promote route context into optical continuity. Lentekhi's numeric legacy identity remains conflicting. No Laravel/PostgreSQL, authentication, GIS, persisted editing or second Visio import was added.

---

# Iteration 19 validation — 2026-09-28

## Automated checks

- 489 tests pass, 0 fail. The 38 focused Iteration 19 tests cover all six 24-Port AP inventories; AP41 groups and Port16 overlap; older/newer owner-statement reconciliation; AP role/use/allocation/availability separation; AP51 Port3, unused and Lineage behavior; unknown AP internal operations; intermediate-AP Lineage support; all 20 Segment color records; 1,176 Fiber colors and 98 Tube groups; connector-line exclusion; no visible provisional `G` identities; known Lentekhi endpoint semantics; neutral identity with both numeric claims; canonical C184; preserved 68 Lineages; Port search and normal-UI wording.
- `scripts/interpret-iteration19-evidence.py` deterministically rereads the compressed raw extraction and regenerates `src/data/iteration19-physical-evidence.json`. Every paired bank agrees. All marker fills and repeated Tube rings in the reviewed 20 Segment scope decode under `tsageri-lentekhi-marker-colors/2`.
- TypeScript compilation and the Vite production build pass. Final assets are `index-DhGJN-My.css` (97.90 kB) and `index-DZcmtpf7.js` (1,468.62 kB). Vite's expected large embedded-bundle advisory remains non-blocking.
- The sibling `fiber-prototype.html` was regenerated at 1,567,332 bytes. It has one embedded script and no linked stylesheet.
- `validateIteration19` reports no missing AP Port records, unused-as-available claims, classified unsupported AP operations, AP41 overlap loss, color coverage gaps, Lineage-count change or unresolved Lentekhi destination.

## Browser checks

- Eleven desktop checks pass for AP41, AP41 Port18, AP50, AP51, AP52, AP53, AP54, AP51 Port3, C149, C150 and Lentekhi Aggregation.
- AP41 shows `1–16 შემოდის`, `16–22 ბრუნდება მარშრუტზე` and `23–24 აქ მთავრდება`, plus 24 role-aware Ports. Port18 preserves its URL state and shows C149/F18, Tube2, physical colors and unknown internal operation.
- Every AP50–54 Inspector shows its real place name, arriving Segment, upstream Closure, 24 Ports and its independently sourced direction summary. AP51 Port3 remains in use, linked to C173/F03, OTDR and its full Fiber journey.
- C149 and C150 render decoded Tube ribbons with no unknown-construction or `G1/G2` label. The Lentekhi Inspector presents a known C184 endpoint and moves heading6/property5 conflict into detail.
- Route search finds AP41 Port18 and opens its URL-backed selection.
- At 390×844 the AP41 Port grid contains 24 cells in four columns. The document and Inspector widths equal the viewport with no horizontal overflow.
- The standalone file opens directly through `file://`, shows the known Lentekhi semantics, has one embedded script, zero linked styles and no horizontal overflow. Production, mobile and standalone browser logs contain zero warnings or errors.

Machine-readable results and reviewed screenshots are in `docs/iteration19-browser-qa.json`, `docs/iteration19-ap41-desktop.png` and `docs/iteration19-ap41-mobile.png`.

## Limits

AP Port Flow is source/owner interpretation, not field verification. AP internal continuation stays unknown and is not called splice, patch or jumper. AP50/AP52/AP53/AP54 usage and all AP commercial availability remain unknown. Physical colors are decoded only where the exact circular marker grammar matches. Optical continuity across Closures remains governed by the existing Fiber Lineage/Cable Continuity evidence. Lentekhi is known as an endpoint, while its numeric legacy identifier remains conflicting. No Laravel/PostgreSQL, authentication, GIS, persisted editing or second Visio import was added.

---

# Iteration 17 validation — 2026-09-27

## Automated checks

- 436 tests pass, 0 fail. The 38 focused Iteration 17 tests cover 68 Fiber Lineages; F01 and F31 golden cases; local number/Tube/color changes at SC206 and SC218; preserved F29; AP51 F01–F24 to Port1–24 alignment; Port3 in use; white-port unused semantics; separate allocation/availability; OTDR annotation without distance; OpenNet usage without ownership/rights; compact unchanged stretches; Segment/Tube carried paths; provenance and lineage validation.
- `scripts/interpret-fiber-lineage.mjs` rereads the compressed raw VSDX extraction and regenerates `src/data/fiber-lineage-evidence.json`. It verifies all 24 AP51 alignments and records the versioned `tsageri-lentekhi-fiber-lineage/1` method, Golden Cases, OpenNet geometry and full-page coverage/non-conversions.
- TypeScript project compilation and the Vite production build pass. Final assets are `index-DrP1K3zG.css` (91,695 bytes) and `index-D4H0Vflx.js` (1,187,714 bytes); Vite's expected bundle-size advisory remains non-blocking for the offline artifact.
- The sibling `fiber-prototype.html` was regenerated at 1,280,228 bytes. Browser inspection confirms one runtime script, no linked stylesheets and no external runtime requests.
- The lineage validator reports no duplicate identities, invalid local Fiber references, discontinuous nodes, transition mismatch, missing rule provenance, invalid AP51 mapping, unused-as-available claim or invalid FiberUse assignment.

## Browser checks

- Eight desktop checks pass for C172/F01, C172/F31, preserved C172/F29, AP51/Port3, AGG5/Port145, AGG5/Port175, OpenNet usage and Manager View. F31 shows `F175 → F31 → F03`, both Tube changes, the Fiber-color change, OTDR, AP51/Port3 and a highlighted C173 branch.
- Manager View hides the engineering/candidate detail while keeping genuine unresolved clarification visible.
- At 390×844 the document width equals the viewport width (390px), the Context Inspector is a fixed mobile sheet and the Journey uses a two-column compact layout. No horizontal overflow occurs.
- The standalone artifact passes at 1280×800 with no horizontal overflow, one runtime script and no linked stylesheet. Production and standalone browser logs contain zero warnings or errors.
- Machine-readable results are saved in `docs/iteration17-browser-qa.json`.

## Limits

Fiber Lineage is a source-derived prototype projection, not field verification or production approval. C170, C175 and C181–C183 have no exact projected lineage. C172/C174 F41–F48 stop unresolved at SC218. Lentekhi aggregation identity remains conflicting. No AP51 color rule is applied to another AP. No production persistence, Laravel/PostgreSQL implementation, authentication, GIS or external integration was added.

---

# Iteration 16 validation — 2026-09-27

## Automated checks

- 398 tests pass, 0 fail. The 38 focused Iteration 16 checks cover first-class CableContinuation persistence, Cable Segment/PhysicalCable separation, multiple destinations from one Segment, structured range and individual mappings, mixed authoritative/candidate state, explicit unresolved ranges, C172/C173/C174 mappings, SC217 and AP51 reviewed continuity, strict versus candidate paths, route-relative orientation without endpoint mutation, documented/proposed/unknown construction, Tube 3 split behavior, Tube 4 partial behavior, Tube identity non-propagation, Tube deep-link round-trip, SC218 grouped forks, every Segment and Closure, validation determinism, UI wording and Manager View uncertainty.
- TypeScript project compilation and the Vite production build pass. Final production assets are `index-D7W3BhmK.css` (88.01 kB) and `index-yyoFML1d.js` (1,172.04 kB). Vite's expected main-bundle advisory remains non-blocking for the one-file offline deliverable.
- The sibling `fiber-prototype.html` was regenerated from the final build with code, styles, fixtures, migration evidence and favicon embedded. It is 1,260,873 bytes, has one inline script, no linked stylesheet and no remote media references.
- `ITERATION-16-CABLE-CONTINUITY-REVIEW.md` audits all 20 Segments, all 12 Closures, the 148 connector-shape evidence records, the preserved 52-record SC218 interpretation set and absent exact ODF Port-to-Fiber terminations.
- The CableContinuation validator reports no duplicate IDs, invalid ranges, unsupported documented Tube references, missing source connections, promoted unresolved records or flattened mixed review state.

## Browser checks

- C172 opens with the documented four-Tube construction ribbon plus downstream summaries for 28 possible Fibers to C174, 12 possible Fibers to C173 with one reviewed member, and eight Fibers with no established mapping. Its Inspector shows route-relative upstream/downstream boundaries independently from local Segment endpoints and the PhysicalCable end.
- Expanding C172 exposes all four Tube rows and the 12 member Fibers in each Tube directly on the route. T3 opens a dedicated Tube Inspector and displays F25–F28→C174/F25–F28 plus F29–F36→C173/F01–F08 as separate possible ranges. T4 reports a partial continuation and names F41–F48 as unresolved.
- C172/F29 shows reviewed upstream C171/F29, reviewed downstream C173/F01 and final AP51 context. The strict upstream summary says the reviewed path reaches C171/F29 and that the earlier mapping is unresolved; it no longer collapses that partial reviewed path into a generic missing label.
- SC218 shows five compact grouped continuation forks before the detailed connection ledger. Candidate, mixed and unresolved states remain visually distinct. A Closure with no continuation evidence shows no fabricated fork.
- Desktop visual review confirmed that the expanded construction, route-relative summaries and Inspector remain readable with independent route/Inspector scrolling. At 390×844, the document and body are 375px wide inside the 390px viewport, with no horizontal overflow. The Closure Inspector is a scrollable 365px-wide bottom sheet.
- The production preview reported no browser warnings or errors. The regenerated standalone opened from a local static server, rendered the C172/T3 split state, reported no browser warnings/errors, and contained no external media, script or stylesheet references.

## Limits

This remains expert browser/source review, not employee or field acceptance. CableContinuation records preserve the reviewed/candidate relationships already present in source evidence; they do not establish closure operation, common sheath, Tube-to-Tube identity, exact tray, splice versus pass-through mechanism, AP port, ODF termination or field verification. C172 has the only complete documented construction; C173 remains partial; C169/C170/C171/C174 groups are proposed; 14 Segment constructions remain unknown. The 136 unresolved connector-shape assertions remain unresolved. No production persistence, authentication, GIS or external integration was added.

---

# Iteration 15 validation — 2026-09-27

## Automated checks

- 360 tests pass, 0 fail. The 35 focused Iteration 15 checks cover navigation for all 20 source Cable Segments, route context for all 12 closures, upstream context for all six APs, both aggregation contexts, explicit SC207 external-document semantics, nullable future links, no fabricated cross-document topology, exact manager counts, construction/color evidence boundaries, evidence-scoped PhysicalCable membership, AP41 backfeed, exact ODF ranges, absent Port-to-Fiber mapping, the Lentekhi conflict, interactive Manager View, URL-backed selection, mobile rules, unchanged Trace behavior and unchanged Iteration 12 verification semantics.
- TypeScript project compilation and the Vite production build pass. Final production assets are `index-BYWSF6Z1.css` (79.67 kB) and `index-DMrwvaug.js` (1,142.20 kB). Vite's expected main-bundle advisory remains non-blocking for the one-file offline deliverable.
- The sibling `fiber-prototype.html` was regenerated from the final build with code, styles, fixtures, migration evidence and favicon embedded. It is 1,222,694 bytes and contains zero external script or stylesheet references.
- The completeness audit in `ITERATION-15-SHOWCASE-COMPLETENESS.md` records source coverage, all assets, construction/color boundaries, connector review, absent exact terminations, both external directions, the cross-document link contract and the manager demo checklist.

## Browser checks

- The manager Document Overview identifies `Tsageri-Lentekhi 2025.vsdx`, page `ცაგერი-ლენტეხი`, and reports 2 aggregations, 12 closures, 20 Cable Segments, 1,176 logical fibers, 6 AP/ODF assets, 192 known ODF ports, 2 routes and 2 external boundaries. Inventory, topology, construction, optical mapping and port topology remain separate; no combined percentage or decorative chart is shown.
- Manager View remains interactive while hiding engineering review controls. The complete route rail and unresolved facts remain visible. All 20 Segment inspectors, all 12 Closure inspectors and all six AP inspectors opened successfully in the production UI.
- C172 shows confirmed 4×12 construction, exact tube ranges, accepted C172/candidate C171 PhysicalCable membership and the separate SC218 physical end. C184 remains construction-unknown with no proven PhysicalCable. AP41 shows AGG5→SC205→C149 ingress and ports 3–22 as an Ambrolauri backfeed with internal mapping unresolved.
- AGG5 exposes the four reviewed ranges. Port145 says Lentekhi direction and explicitly stops at “Exact port-to-fiber mapping not established from this source.” No termination, service, patch, splice or customer is invented.
- The SC207 boundary states that the current document ends here and the network continues in another regional document. Current document/page are visible; next document, linked route and canonical endpoint remain unresolved; the continuation button is disabled. The Lentekhi boundary keeps both conflicting identity claims and chooses no winner. C184 remains directly selectable.
- URL-backed C172 and C173 selections restore correctly with browser Back. At 390×844, both Document Overview and Route Workspace report a 375px document width inside the 390px viewport with no horizontal overflow; the selected external boundary is readable in the mobile Inspector sheet. The production browser log contains no warnings or errors.
- The regenerated standalone HTML opened through a local static server, rendered the same Document Overview counts and source-package statement, and produced no browser warnings or errors.

## Limits

This is expert browser/source review and a manager-ready showcase, not employee or field acceptance. C172 is the only fully confirmed construction showcase; C173 remains partial; C169/C170/C171/C174 remain source-supported candidates; the other 14 Segment constructions remain unknown. Exact Port-to-Fiber terminations, FiberTermination and PatchCord records remain absent. Closure treatments, most connector geometry, AP containment, operations, services, rights, customers, conditions and availability remain unresolved. The next regional source document is not imported and no cross-document topology is fabricated. Production Laravel/PostgreSQL implementation remains deferred until manager/operator acceptance.

---

# Iteration 14 validation — 2026-09-26

## Automated checks

- 325 tests pass, 0 fail. The 35 focused Iteration 14 tests cover Route Workspace selection and route context, C172/PhysicalCable separation, segment-scoped fiber browsing, F29 restoration, four Tsageri port ranges, Port145 and Port117 semantics, SC206/SC218/SC225 branch behavior, AP41 ports 3–22, route-scoped Segment/Closure/Port/Fiber search, URL selection and browser-history semantics, keyboard-native topology controls, absence of primary evidence detail, preserved strict/candidate Trace, preserved Iteration 12/13 semantics, non-inference rules, responsive CSS, global-search routing and nested-route inventory.
- TypeScript project compilation and the Vite production build pass. Final production assets are `index-CiznA-F6.css` (71.36 kB) and `index-C6z6vt0P.js` (1,120.19 kB). Vite's expected embedded-bundle size advisory remains non-blocking for the one-file offline deliverable.
- The sibling `fiber-prototype.html` was regenerated from the final build with scripts, styles, fixtures, migration evidence and favicon embedded; the final file is 1,192,375 bytes.

## Browser checks

- The route-first dashboard presents the root operational route and opens its Route Workspace by keyboard. The workspace keeps the full route and Context Inspector visible together at desktop width; the document has no horizontal overflow, while the route canvas and Inspector independently scroll within the viewport.
- C172 opens in place with local SC217↔SC218 endpoints, the wider route, accepted C172/candidate C171 PhysicalCable membership and the SC218 physical end. Its 48-fiber browser expands in place; F29 opens in the same workspace and retains the accepted C173/F01 continuation toward AP51 without assigning an exact port.
- AGG5 exposes exactly four reviewed destination ranges. Expanding 145–192 shows Port145, whose Inspector says Lentekhi direction and stops at unresolved exact Port→Fiber termination. Port117 retains the intentional SC205 stop and is not marked damaged.
- SC206 keeps C169→SC216 as main continuation and opens one consolidated named-direction branch whose Inspector states that optical connectivity is not proven. SC218 shows C174 as main and C173/AP51 as branch. SC225 exposes AP53/C182 and AP54/C183 once inside the nested route.
- AP41 shows AGG5→SC205→C149 ingress and ports 3–22 as an Ambrolauri backfeed. All 24 ports expand in place; Port3 retains direction-level context and an unresolved internal ingress-to-egress mapping.
- Route-scoped search finds C182 and focuses its Segment Inspector. URL selections restore direct C172/F29, Port and asset inspectors. Browser Back/Forward moved between AP41 and AP41/Port3 while preserving the matching Inspector.
- At the inspected 1,125×671 desktop viewport, document width equals viewport width; the 527px route canvas and 425px Inspector both have independent vertical overflow. At an explicit 390×844 viewport, document/body width is 375px with no horizontal overflow. Selected C172/F29 detail becomes a 365px fixed bottom sheet; closing it keeps the route canvas at the same 626px scroll position.

## Limits

This is expert browser/source review, not employee or field acceptance. The Route Workspace is a presentation and navigation layer over the existing model; it adds no topology or verification facts. Lentekhi identity, SC207 continuation, closure operations, exact ODF/fiber terminations, AP containment/internal mappings, most physical construction, services, rights, conditions and availability remain unresolved. No backend, persistence, authentication, Laravel/PostgreSQL implementation, GIS or live integration was added.

---

# Iteration 13 validation — 2026-09-26

## Automated checks

- 290 tests pass, 0 fail. The 27 focused Iteration 13 tests cover SC206's consolidated unresolved direction, SC218/SC219 main-versus-AP branches, SC224/SC225 nested branching, Segment source/final/PhysicalCable extents, AP41 interconnect semantics, exact AGG5 ranges, operational search, grouped unknowns, collapsed evidence, preserved Migration Review and Fiber Detail, unchanged strict/candidate Trace, unchanged Iteration 12 verification dimensions, complete asset access, report-count consistency and 390px layout rules.
- `scripts/interpret-full-page.mjs` regenerates 20 segments, 12 closures, six AP/ODF records, 1,176 fibers, 320 assertions and 218 evidence records. The report now distinguishes 12 generated connector assertions that match SC218 connector IDs from 136 unresolved connector-shape assertions; the separate complete 52-record SC218 interpretation set remains preserved.
- TypeScript compilation and the Vite production build pass. Final production assets are `index-DkqWrh4O.css` (50.96 kB) and `index-BL3LpYnH.js` (1,096.43 kB). Vite's expected large embedded-bundle advisory remains non-blocking for the one-file offline deliverable.
- The sibling `fiber-prototype.html` was regenerated from the final build with scripts, styles, fixtures, migration evidence and favicon embedded; the final file is 1,148,212 bytes.

## Browser checks

- Desktop walkthroughs covered both Cable Routes; all 12 closures; AP41 and AP50–AP54; both aggregation contexts; C149, C151, C169, C172, C175 and C181–C184; and representative accepted, candidate and unmapped fibers. Normal pages lead with operational topology and keep engineering detail collapsed.
- SC206 shows C169→SC216 as the main continuation and one consolidated Alpana–Tvishi–Ambrolauri/C151→SC207 branch, explicitly marked unresolved and not proven optical connectivity. SC218 and SC219 keep C174/C176 as main continuations and C173/C175 as AP branches.
- SC224 shows C184 toward the unresolved Lentekhi boundary as the main path and C181→SC225 as a nested branch. The branch route then exposes AP53 and AP54 at SC225 without repeating C181 as a branch. C181's Segment path includes the upstream AGG5→…→SC224 context.
- C172 separates its local SC217↔SC218 endpoints, the unresolved Lentekhi route destination, containing PhysicalCable and SC218 PhysicalCable endpoint. AP41 presents AGG5→SC205→C149→AP41 plus ports 3–22 backfeed with internal mapping unresolved. AGG5 presents 192 ports and the four exact ranges before the collapsed full port grid.
- Search checks for `C172`, `SC206`, `AP41` and `AGG5` return operational subtitles with route, main/branch, backfeed or capacity context.
- At 1280px, the long C151 title and collapsed 144-row fiber table no longer create page-wide overflow: document width is 1,265px inside a 1,280px viewport. At an explicit 390×844 viewport, SC206, C172, AP41, AGG5, SC218, SC224, SC225, C151, both routes and Fiber Detail each stay within the viewport; the rendered document width is 375px.

## Limits

This is expert browser/source review, not employee or field acceptance. The operator summaries are derived presentation data and do not change topology, evidence, verification or inventory. Lentekhi identity, SC207 continuation, 136 generated connector assertions, closure operations, exact ODF/fiber terminations, AP containment/internal mappings, most physical construction, services, rights, conditions and availability remain unresolved. No backend, persistence, authentication, Laravel/PostgreSQL implementation, GIS or live integration was added.

---

# Iteration 12 validation — 2026-09-26

## Automated checks

- `scripts/interpret-full-page.mjs` regenerated `src/data/full-page-migration.json` and `docs/ITERATION-12-FULL-MIGRATION-REVIEW.md` from the immutable current raw extraction plus the preserved source evidence and annotations. The reconciliation accounts for 7,349 shapes, all 2,677 direct-text/comment occurrences and all 203 Connect rows.
- Migration coverage is complete for the reviewed page boundary: 20/20 Cable Segment labels, 12/12 closures, 6/6 AP/ODF-like records, 2/2 aggregation contexts, 1,176 logical fibers, 192 reviewed logical ports, 320 assertions and 218 evidence records. Meaningful text reconciles exactly as 61 structured occurrences + 58 annotation occurrences + 2,558 classified layout occurrences, with zero unclassified meaningful text.
- 263 tests pass, 0 fail. The focused Iteration 12 suite covers independent Evidence Basis, Review State and Operational Status; authoritative Strict Trace without a field-verification requirement; candidate traversal; preserved conflicts and corrections; all page assets, labels, annotations and connector rows; explicit SC207/Lentekhi boundaries; C149/C151/C175/C181–C184; AP52–AP54; SC225; search/deep links; non-inference rules; and unchanged C172/F29, SC216, AP41 and 192-port ODF behavior.
- TypeScript project compilation and the Vite production build pass. Final production assets are `index-CYD6cQpI.css` (45.84 kB) and `index-Bf8UZ1Fo.js` (1,093.30 kB). Vite's expected large embedded-bundle advisory remains non-blocking for this one-file offline deliverable.
- The sibling `fiber-prototype.html` was regenerated from the final build with scripts, styles, fixtures, migration evidence and favicon embedded; the final file is 1,139,964 bytes.

## Browser checks

- The Migration & Verification Review renders the complete coverage dashboard and exact reconciliation, separates Evidence Basis, Review State and Operational Status, exposes the five review questions, and provides session-only assertion actions. It reports 138 authoritative, 13 candidate, 167 unresolved and 2 conflicting assertions.
- Desktop walkthroughs covered both routes, all 12 closures, all six AP records, both aggregation contexts, representative original and newly imported segments, and accepted/candidate/unmapped fiber states. Imported page assets remain reachable through normal search and detail views.
- The final core-route build links `C184 · source segment imported` and states that its endpoint remains conflicting/unresolved. The Lentekhi conflict record preserves both AGG6-heading and property-ID5 claims, chooses no winner, and links the imported C184 segment.
- At an explicit 390×844 viewport, the import workspace, core route and C172/F29 Fiber Detail each report 375px document width inside a 390px viewport, with no page-wide horizontal overflow. Browser warning/error logs are empty.

## Limits

Migration completeness means every meaningful source occurrence is accounted for; it does not make every claim authoritative or field verified. The Lentekhi identity, SC207 continuation, generated connector-shape assertions, closure treatments, exact ODF/fiber terminations, AP containment/internal mappings, most physical construction, services, rights, conditions and availability remain unresolved. No backend, persistence, approval audit store, authentication, Laravel/PostgreSQL implementation, GIS or live integration was added.

---

# Iteration 11 validation — 2026-09-25

## Automated checks

- 226 tests pass, 0 fail. The 27 focused Iteration11 tests cover one primary physical-color presentation, distinct accepted/candidate path states, explicit stops, C172/F29 accepted remapping, C172/F01 candidate isolation, C172/F41 non-inference, independent Segment/PhysicalCable/Route/Trace layers, SC218 sheath termination with optical continuation, unresolved exact ODF port, direction-level non-mapping, grouped unknown preservation, commercial unknowns, independent condition/availability, valid number/color mismatch, multiple-candidate handling, collapsed evidence, legacy links, responsive vertical layout, unchanged 192-port ODF and Chkhuteli behavior, unchanged strict/candidate Trace and unchanged SC216 non-inference.
- TypeScript project compilation and the Vite production build pass. The final production assets are `index-ysQP25CN.css` (43.28 kB) and `index-BeWm4otz.js` (781.68 kB). Vite's expected embedded-bundle size advisory remains non-blocking for the one-file offline deliverable.
- The sibling `fiber-prototype.html` was regenerated from the final build with scripts, styles, fixtures, evidence and favicon embedded; the final file is 825,779 bytes.

## Browser checks

- C172/F01 immediately shows C172, `PC-TSAGERI-SC218-01`, its unresolved upstream physical origin, physical end at SC218, no accepted continuation, one candidate C174/F01 continuation toward SC219, broader Lentekhi direction and exact unresolved facts. The primary physical color appears once; technical IDs, commercial detail and evidence are collapsed.
- C172/F29 immediately shows the accepted SC218 remapping to C173/F01, continues through AP51, and stops with the exact port and AP/ODF ownership unresolved. Accepted path cards are solid and the candidate Port1 step is visibly provisional.
- C172/F41 stops explicitly at SC218 with no accepted or candidate mapping and does not inherit nearby fiber relationships.
- C171/F29 follows the reviewed accepted path through SC217 → C172/F29 → SC218 → C173/F01 → AP51 while keeping C171's PhysicalCable membership candidate-only, its construction unknown and the exact AP51 port unresolved.
- At the normal 665px in-app viewport every inspected journey reports document width 650px. At an explicit 390×844 mobile viewport, C172/F01 reports document/body width 375px and renders the compact identity plus vertical path without page-wide horizontal overflow. Browser error/warning logs are empty.

## Limits

This is expert browser and source review, not employee or field acceptance. The current path model is ready to render future ODF, port, patch-cord, passive-component and service-aware steps, but none are fabricated. Exact Tsageri ODF-to-fiber terminations, PhysicalCable upstream origin, AP41 internal mapping, AP51 port/containment, closure operations, services, rights and availability remain unresolved. No backend, persistence, editing, authentication, Laravel/PostgreSQL implementation, GIS or broader route migration was added.

---

# Iteration 10 validation — 2026-09-25

## Automated checks

- `scripts/interpret-tsageri-aggregation.py` verified source SHA-256 `51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a` and regenerated `src/data/tsageri-aggregation-evidence.json` from the lossless raw extraction.
- The generated evidence retains exact aggregation container 12426, heading 12427, port-bank groups 43429/43832, AP/ODF Chkhuteli shape 12432, its direct 1–24 labels, and external cable label 14250. Dense connector-band counts remain evidence and are not used as logical capacity.
- 199 tests pass, 0 fail. Thirty-four Iteration10 tests cover aggregation/ODF containment, exactly 192 logical ports, mirrored representation deduplication and provenance, all four range boundaries, intentional SC205 termination without damage, independent commercial state, AP41 backfeed and unresolved mapping, port-start trace stopping, Cable Route/PhysicalCable/Segment/Trace separation, accepted/candidate physical memberships, SC218 sheath termination with route continuation, Iteration09 topology, strict AP51 trace, SC216 non-inference, search and deep links.
- TypeScript project compilation and the Vite production build pass. Vite reports the expected large embedded-bundle advisory for the one-file offline deliverable.
- The sibling `fiber-prototype.html` was regenerated from the final production build with scripts, styles, fixtures and evidence embedded.

## Browser checks

- Tsageri aggregation opens directly to one reviewed ODF, 192 logical ports, four text-labelled ranges and a 192-button grid. At the inspected 665px in-app viewport the page has no document-wide horizontal overflow.
- Port117 shows SC205, states that it does not continue beyond SC205, and explicitly says the intentional end is not marked damaged.
- Port145 shows Lentekhi direction and a Cable Route action. Port1 shows Ambrolauri direction. Both distinguish range-level infrastructure direction from unresolved exact optical mapping.
- Every inspected port detail stops exact trace at the unresolved fiber/termination/patch boundary and shows two collapsed source representations without duplicate inventory rows.
- AP41 / Chkhuteli shows Tsageri ports 131–144 as ingress and AP ports 3–22 as a separate Ambrolauri backfeed side. It states that internal mapping is unresolved and exposes no invented splice edge.
- C172 separates Local Segment `SC217 ↔ SC218`, upstream-unresolved PhysicalCable ending at SC218, Cable Route continuation beyond SC218 on another physical cable, and independent Fiber Trace continuation. C171 is visibly candidate only.
- A responsive-overflow issue caused by long PhysicalCable evidence text was found during browser QA and fixed. Recheck reports document width 650px inside a 665px viewport. Browser error/warning log is empty.

## Limits

The logical 1–192 port inventory and four ranges are owner-confirmed. Exact individual marker-to-port shape indexing, per-fiber terminations, AP41 ingress-port mapping, internal 131–144 ↔ 3–22 continuity, complete Ambrolauri topology and the exact upstream physical origin of the C172-containing cable remain unresolved. C171 is a candidate membership only. No field validation, employee usability study, backend, persistence, editing, authentication, Laravel/PostgreSQL implementation or full network migration was added.

---

# Iteration 09 validation — 2026-09-25

## Automated checks

- The current VSDX revision SHA-256 is `51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a`. A fresh raw extraction preserves 1 page, 7,349 shapes, 2,640 top-level shapes, 2,676 direct-text shapes, 218 local-property shapes, 203 Connect rows and 1 Visio comment. The prior evidence revision remains unchanged.
- `scripts/interpret-primary-route.py` regenerated 13 ordered nodes, 12 legs and 3 branches/directions after verifying every imported route label and the exact SC206 direction text.
- `scripts/interpret-source-annotations.py` classified all 2,677 direct-text/comment occurrences and generated 26 unique annotations covering 58 meaningful occurrences. Report buckets reconcile to the source total; raw values remain equal to source values.
- 165 tests pass, 0 fail. Iteration09 coverage includes explicit SC205 and SC220–SC224 topology, unresolved C184, named-direction non-connectivity, one shared four-asset comment, lossless annotation reporting, OpenNet’s separate route roles, ODF/panel/port identities, port faces, termination/patch coexistence, explicit patch-edge traversal, independent port state dimensions, service/right/internal-use separation, plural distance sources, partial/conflicting route totals and immutable external references. Earlier C172/C173/SC218, strict/candidate trace, SC216 non-inference and legacy-navigation tests still pass.
- TypeScript compilation and the Vite production build pass. The expected embedded-bundle size advisory remains non-blocking for the one-file offline deliverable.
- The sibling `fiber-prototype.html` was regenerated from the final passing build; it is 789,376 bytes and contains scripts, styles, data and favicon inline.

## Browser checks

- The production route view shows AGG5 → SC205 → SC206 → SC216 → SC217 → SC218 → SC219 → SC220 → SC221 → SC222 → SC223 → SC224 → unresolved Lentekhi boundary. C148/C150 and C176–C180 are clickable real segments; the final C184 leg says it is unknown/not yet imported.
- SC206 shows the Alpana–Tvishi–Ambrolauri direction separately from AP50/AP51 branches. It has no destination asset, segment or optical edge.
- The SC220–SC223 “დამატებული ქუროები” indicator appears once at the group start. Expanding it shows the raw Georgian comment; Route Notes also expose the normalized summary while source evidence stays collapsed.
- The secondary route disclosure shows OpenNet separately as physical-infrastructure owner and network operator. With no distance observations it reports no reliable distance and 12 missing legs rather than 0 km.
- AP51 states that ODF/panel/port structure is unresolved and renders no fabricated grid. Its earlier accepted asset endpoint and candidate Port1 remain distinguishable.
- Strict C171/F29 trace still reaches AP51 with the port unresolved. Candidate mode adds AP51/Port1 while preserving the reviewed SC217/SC218 path.
- The production preview and regenerated standalone route were opened in the browser. Both had empty browser logs. The vertical timeline is readable at the inspected desktop viewport and avoids a route-wide horizontal diagram.

## Limits

This remains expert source/browser review, not field or employee acceptance. C184/Lentekhi identity, closure treatments, physical condition, tube construction on new segments, ODF containment, port inventory, terminations, patch cords, rights/services/internal use and distances remain unpopulated because the source does not establish them. No production persistence, authentication, GIS, Laravel/PostgreSQL application or external integration was added.

---

# Iteration 08 validation — 2026-09-25

## Automated checks

- `scripts/interpret-primary-route.py` verifies the preserved source SHA-256 and the exact reviewed route/branch labels, then regenerates `src/data/primary-route-evidence.json` with7 ordered nodes,6 legs and2 branches.
- 111 tests pass, 0 fail. Twenty-seven focused Cable Route tests cover entity separation, ordered membership, adjacent endpoint integrity, AP51 branching, unresolved destination/treatments, nullable PhysicalCable identity, route/segment condition independence, strict Iteration07 trace preservation, SC216 non-inference, route search/deep links, source hash, invalid circular/duplicate/mismatched/promoted routes, and collapsed audit detail.
- TypeScript project compilation and the Vite production build pass. Vite reports the expected main-bundle size advisory because the offline deliverable embeds pilot data and evidence.
- The standalone sibling `fiber-prototype.html` was regenerated from the passing production build.

## Browser checks

- The Route screen shows AGG5 → SC206 → SC216 → SC217 → SC218 → SC219 → unresolved Lentekhi boundary in order, with explicit documented gaps before SC206 and after SC219. C169/C171/C172/C174 are main-route segments; C170→AP50 and C173→AP51 are shown as branches where the main route continues.
- Search `C172` returns separate, clearly typed Cable Route and Cable Segment results. The segment screen highlights C172 in the full route and exposes the nearby AP51 branch.
- SC218 shows its route/branch context above the existing ledger and identifies attached C172, C173 and C174 directions. C172/F29 presents separate physical Route and optical Trace actions.
- Strict C171/F29 trace reaches AP51 and reports the exact port as unresolved. Candidate mode adds AP51/Port1 as a visibly provisional step. Iteration07 behavior is unchanged.
- Dashboard, Route, C172, SC218, C172/F29 and C171/F29 Trace were visually inspected in the running production preview. Operational information leads; evidence, source hashes, raw shapes and detailed review fields remain collapsed. No browser console errors or warnings were observed.

## Limits

The five-role review is an expert self-review, not employee or field acceptance. Lentekhi aggregation identity, both documented route gaps, closure treatments, route/segment condition, common physical sheath identity and all field operations remain unresolved. No backend, persistence, editing, authentication, GIS route editor or network-wide route migration was added.

---

# Iteration 05 validation — 2026-09-25

## Automated checks

- The generic VSDX extractor ran against `Tsageri-Lentekhi 2025.vsdx`. Its SHA-256 matches the preserved evidence: `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`.
- Raw counts match the source investigation exactly:1 page,7,349 shapes including subshapes,2,640 top-level shapes,2,676 direct-text shapes,218 local Property-section shapes and203 Connect rows.
- 46 tests pass, 0 fail. Eighteen new import tests cover provenance, Cable Segment candidates, unverified candidate state, arbitrary endpoint remapping, number/color independence, strict/candidate traces, unknown/free rules, SC216 non-branching behavior, legacy search/deep links, idempotent reimport and accepted-record conflict protection.
- TypeScript project check and Vite production build pass. Vite reports the expected one-file bundle size warning because the offline app embeds the source evidence and pilot data.
- The production build generated the sibling `fiber-prototype.html` with scripts, styles, data and favicon embedded.

## Browser checks

- Import Review at1280×720 renders without document-wide horizontal overflow. It displays the actual source hash/counts,101 candidates and separate raw/candidate/accepted layers.
- Filtering `C172/F29` returns one result and synchronizes the detail view to `C172/F29 → C173/F01`. The detail displays both endpoint numbers independently, `approved=false`, operation `unknown`, drawing color as evidence only, exact shapes and interpretation rule.
- An explicit Accept action changes only the session review state and accepted counter; the warning that this does not modify the pilot/production inventory remains visible.
- Lentekhi renders as `AGG6 · ტევადობა უცნობია` and preserves conflicting property ID5 instead of displaying an invented capacity or merging it with Tsageri.
- SC218 renders48 ledger rows for the selected segment with independent endpoint identities and a visible rule that number/color are not continuity keys. SC216 renders the three separate segments and every displayed operation remains unknown; no three-way branch appears.
- Desktop screenshots were inspected at1280×720. The page has responsive breakpoints at1000,800,620 and560px; import columns, pipeline cards, filters, candidate rows, review actions, navigation and ledger tables collapse to single/two-column layouts without fixed-width page content. Existing narrow-layout rules remain covered by the iteration04 browser record below.

## Limits

Review decisions are session-only in this local read-only prototype. The raw extraction is complete package evidence, while the interpreted candidate set is deliberately source-specific and not an accepted full inventory. No field verification, engineer acceptance, production persistence, GIS publication or live integration is claimed.

---

# Iteration 04 validation — 2026-09-24

## Automated checks

- `npm test`: 28 tests passed, 0 failed. Covers six canonical IDs/240 fibers/20 provisional groups, immutable identity versus equal display routes, aliases, typed AP50/ODF50, route ordering, unknown manufacturer/colors, tube/fiber separation, primary/reverse mappings, independent commercial roles and availability. Negative cases cover malformed inventory/endpoints/ports, duplicate occupancy, unapproved/conflicting evidence, unknown intermediate continuity, parked fibers, passive branches, ambiguity and cycles.
- `npm run export`: TypeScript (app and tests) and Vite production build pass; standalone HTML generated. Vite reports the embedded bundle above500kB because source evidence and inventory are included in the offline app. This is a build warning, not a failed check; no code-splitting was added to compromise the one-file deliverable.
- Node26.1.0/npm11.13.0; dependency versions are pinned in package-lock.json. Tests use synthetic clones for known manufacturers, colors, roles and conflict scenarios; these do not appear as real pilot facts.
- Runner IPC and local server binding required sandbox escalation; no permission review rejected the work.

## Browser checks

Chromium through Playwright, current rendered iteration04:

- Eleven routes at1440/768/390px (33 checks): dashboard; canonical Cable172; full legacy label Cable170; SC218; SC216; canonical Fiber172/F29; canonical Trace172/F29; AP50; AP51; AGG5; review. No document-wide horizontal overflow. Desktop focused closure and mobile tube-group layouts visually inspected.
- Search:172, full172 label, SC217 SC218, complete new display name,172/29, canonical ID,170, full170 label, AP50, ODF50, Georgian place and Magti. Enter opens the canonical fiber route. AP50/ODF50 resolve to the same explicitly ambiguous AP record. SC50 and ZTT return no false matches. Known-manufacturer and commercial-role searches are covered by synthetic domain tests.
- SC218: C172/F29 isolates only C173/F01; reverse C173/F01 isolates C172/F29. Fiber context exposes provisional group numbers, unknown tube/strand physical colors and unknown actual positions. Unrelated ledger rows are hidden while selected.
- SC216: three distinct typed cable choices;169 and171 each show48 unknown local fiber ends,170 shows24. No AP50 port mapping or three-way optical branch is invented.
- Strict C172/F29: one starting cable record and two unapproved-join stops. Candidate mode: six visible steps through C171/F29 → SC217 → C172/F29 → SC218 → C173/F01 → AP51/port1. Five candidate cards are dashed; starting record stays neutral. UpstreamSC216 stops at missing optical mapping. C172/F41 remains one cable step with two missing joins.
- Actual physical colors remain neutral; the earlier proposed palette is only disclosed as an unverified prototype hypothesis. Manufacturer and actual tube numbers remain unknown.

## Standalone export

Seven final offline interaction checks passed, with one HTML document request, zero external asset requests and zero captured page errors. Exact results are recorded in `offline-browser-check.json`. The one-file artifact embeds scripts, data, styles and favicon; it requires no external assets. Browser tooling blocks file:// navigation, so testing uses localhost delivery followed by browser network disabled. Direct double-click launch is not automated.

## Limits

No physical network validation, engineer approval, real employee usability session, Safari/Firefox/device test, production database/API/authentication/persistence, GIS route geometry or live service integration. Intermediate cable routes are represented but no intermediate fiber continuity is assumed. Component port/internal branching is not modeled. This is a local read-only prototype; screenshots are UX evidence only.
# Iteration 18 validation — 2026-09-28

## Automated checks

- 451 tests pass, 0 fail. The added UX checks protect range-based unknown construction labels, confirmed Tube labels, Cable/Closure information hierarchy, collapsed source and hardware metadata, conditional empty sections, Georgian Fiber journey labels, the single global prototype notice, preserved 68-lineage inventory, AP51 Port3/OTDR, OpenNet usage, Manager-mode data consistency and 390px overflow rules.
- TypeScript project compilation and the Vite production build pass. The expected large-bundle advisory remains non-blocking for the embedded offline artifact.
- The sibling `fiber-prototype.html` was regenerated from the final production build.

## Browser checks

- Seven desktop flows pass: C172, SC218, SC221, C172 Tube3, C172/F31, AP51 → Port3 and AGG5 → Port175.
- C172 exposes upstream/local/split-destination context and four confirmed Tube rows without source labels, mapping counts, PhysicalCable IDs or internal group names in the primary view.
- SC218 exposes incoming/main/branch/range transitions before collapsed hardware detail. SC221 remains short and has no empty branch panel.
- C172/F31 retains Port175, both exact identity transitions, AP51 Port3 and OTDR while using the simplified Georgian journey hierarchy.
- At 390×844 the document and Inspector have no horizontal overflow, advanced detail is collapsed, and the journey remains readable in the mobile Inspector.
- The standalone file has one embedded script, zero linked styles and the same simplified journey. Production, mobile and standalone browser logs contain no warnings or errors.

Machine-readable results and reviewed screenshots are in `docs/iteration18-browser-qa.json`, `docs/iteration18-c172-desktop.png` and `docs/iteration18-f31-mobile.png`.

---
