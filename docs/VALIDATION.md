# Validation record — 2026-10-12

## Iteration38 preparation — owner-approved drawing repairs and simpler corrections

- Owner confirms the pictured AP-side shift and marker gaps are mechanical drafting mistakes that the importer should correct automatically. Recognized fill/shade repairs should also leave the actionable review queue. The follow-up clarification preserves valid SC transitions such as orange/blue→blue/blue; equal color alone is not a connection rule.
- [Iteration38 worker brief](ITERATION-38-DRAWING-REPAIR-AND-SIMPLE-CORRECTIONS.md) and current HANDOFF replace the earlier mandatory-manual/no-replay policy for these approved patterns. Scope includes a family profile, gap/row normalization, legitimate color semantics, persistent Atlas edits, same-family updated files and one-panel preview/Save/Undo correction UX. Iteration37 requirements are incorporated, not marked implemented.
- Inspection linked screenshot B to label7858 `25-113-25009-25012-48`, complete48F banks8327(SC25009)/7886(SC25012), currently without an accepted physical pair in the regenerated semantic artifact. Also identified the exact-SHA eligibility gate in `interpret-shida-upload.py`, which must be replaced for normal revised-file support.
- Both owner screenshots are copied byte-for-byte to `iteration38-owner-ap20-displacement.png` and `iteration38-owner-sc25009-sc25012-gaps.png`. Prior HANDOFF is archived byte-for-byte at `archive/HANDOFF-BEFORE-38-2026-10-12.md` (SHA256 `a58ff0e1a210dfe5d3c1718c6027bdb8ccd1b53508f51c28ffd1d30e6b6af8fd`). Documentation/evidence preparation only: no new parser/editor implementation, revised-source import, app tests or owner database writes are claimed.

## Iteration 37 planning review — AP20 completeness and correction retention

- Independently checked preserved Shida SHA `e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060` and raw texts: Shape78894 `25-134-25024-20-20`, Shapes11798/12097 `FO 24`. The capacity contradiction is real. The worker's local regenerated artifact has the bounded 24F correction; live read-only AP20 review still says `SC25024 ↔ AP20 · Didi Sative · 20F` in `CORRECTION-dce024db-ad8c-4743-b748-16bb1162c524`, 606 total / 581 open.
- Independent focused checks passed: **3 AP20 TypeScript tests + 9 existing correction tests + 8 Python source-audit tests**. No full backend replay or broad suite rerun is claimed. Inspected regenerated semantic coverage and four remaining unresolved physical bank pairs. No owner reprocess, activation, schema or mapping write.
- Found a workflow limitation: current reconciliation can explicitly supersede all conflicting manual corrections with fresh source, but has no explicit retain-current-correction option. History preservation does not guarantee active binding preservation. New worker requirements and acceptance are in [Iteration 37 review](ITERATION-37-IMPORT-COMPLETENESS-REVIEW.md) and HANDOFF; implementation remains pending.

## AP20 source-capacity correction — import diagnosis supersedes the earlier 20F assumption

- The actual preserved source has complete F1–F24 marker banks 11797/12096, FO24 texts 11798/12097 and 24 drawn span lines 11562–11585. Label78894 retains raw `25-134-25024-20-20`. The importer had rejected those banks because their capacity differed from the label, thereby truncating the generated inventory to 20 Fibers.
- The bounded source rule now resolves 24F only when both complete numbered banks, explicit FO texts, complete uniquely docked same-number span lines, actual node ownership and unique local label association corroborate it. Unit tests reject missing/duplicate/remapped lines, incomplete/duplicate numbers, wrong/missing/ambiguous FO text, unequal banks, outside labels and duplicate label candidates. No Port capacity/color/route-only inference was introduced.
- **844/844 TypeScript tests**, **50/50 Python importer tests**, application/compiler type checks, required PHP formatting, production build and standalone export pass. The actual source fixture verifies 24 canonical Ports, all 24 Fibers and local colors, retained20-versus24 contradiction, exact source evidence and separate all 24 owner Remap. Capacity repair does not automatically correct the source's existing Port shift. The existing large-bundle advisory remains unchanged.
- Full-source local proposal:176 Segments, 9,360 Fibers, 1,759 transitions, 789 drawn-source bindings, 583 review cases. The outside-AP20 comparison in `ap20-capacity-source-audit.json` preserves Cable/Fiber topology, exact transitions and other AP identities/state/bindings, excluding interpreter-version fields and refreshed Port alignment diagnostics. These are regenerated source-only counts, not live-owner totals.
- The first actual-file backend replay exposed a pre-existing review-index assumption that every source conflict has a Fiber number. The review service now classifies Cable-capacity and Fiber-color cases separately. Final **7 affected backend tests / 143 assertions** pass: real6.7MB upload/staging, complete62,670-Shape geometry reprocess,24AP20 Ports/24Fibers, retained capacity-conflict source evidence, source/inventory history preservation, staged proposal and separate guarded-isolation Add; capacity-vs-color links/labels and existing review authentication/scope/stale-version checks. The completed run took6m25s and peak1.06GB; no live-owner mutation was performed. The disposable test database was stopped after verification.
- Read-only current owner probe: AP20 Cable remains 20F. No owner activation/reprocessing was performed. Corrected importer code is available, but existing stored data requires reprocessing the saved source, explicit human-correction reconciliation and separate Add before all 24 Remap. Earlier smaller-range browser/test results below certify generic range support, **not the incorrect AP20 20F interpretation**.

## AP20 follow-up — smaller Cable range within an AP bank

- Cause: AP20 has 24 canonical Ports and a complete 20-Fiber local Cable; the old equality guard disabled Remap despite owner acknowledgment. Shared UI/domain planning now accepts a complete Cable range within a larger complete hardware bank. F1–F20 map to Ports1–20; four remaining Ports are preserved, with no invented F21–F24 bindings.
- **841/841 TypeScript tests** and **14 affected backend tests / 256 assertions** pass. New tests cover outside-range other-Cable preservation, explicit clearing/restoration of shifted selected-Cable bindings beyond the target range, exact review-case identity, spare-Port cases remaining open, source reconciliation of only affected members, oversized/incomplete/duplicate range rejection and occupied target refusal. Both type checks, production build, required PHP formatting and standalone export pass; the pre-existing bundle-size advisory remains.
- Desktop 1440px/mobile 390px browser workflows for the 20-Fiber Cable and existing 24-Fiber bank pass: disabled save until checked, consistent owner confirmation even after choosing geometry in single-Port mode, complete mapping preview, persisted draft/preview, separate explicit Apply, current Port journey after reload and full group reversal. Zero JS errors or horizontal overflow. Report/screenshots: `ap20-partial-bank-browser-qa.json`, `ap20-partial-bank-preview-1440.png`, `ap20-partial-bank-preview-390.png`; existing equal-size report is refreshed. Mutation tests use guarded disposable isolation only.
- Individual Port7→F13 correction/review/journey/reversal also passes at both widths after the shared form change (`iteration35-correction-browser-qa.json`), bringing browser coverage to six workflows. Read-only owner-page verification confirms the latest rebuilt JS is served. No owner mapping, review event, activation, source reprocessing or schema change was performed. Both isolated QA services were stopped; the owner must refresh and separately save, validate and Apply their correction.

## Iteration 36 — review/source performance (2026-10-12)

- **838/838 TypeScript tests**, **23 backend tests / 2,467 assertions** pass. Application and compiler typechecks, build, required PHP formatting and standalone export pass; the large-bundle advisory remains. Importer algorithms and accepted topology were not changed.
- Full audited Shida QA copy: 9,356 Fibers/62,670 Shapes. SQL baseline selected context18queries/40–60ms; after batching and immutable metadata it uses7queries/~23–28ms. First Port crop ~480ms→~18–27ms; first two-crop ~933–1,039ms→~76–144ms. Same-region SQL plan446ms→0.085ms; framework/PDO phases and index-only rollback/reapply are recorded. Repeated derived crop ~7–42ms. Cached base geometry is source/run/page/version/bounds/anchor scoped; fresh authorization/run/anchor checks and contextual highlights remain separate. Corruption, TTL/size/count bounds, exact affected-Port matching and missing anchors are tested.
- **80 browser selections**, 20 first-pass +20 cached revisits each at1440/390px; four categories,13 distinct cases because sparse categories repeat. Actual click-event timings measure explanation and drawing independently, with two paint frames. Desktop p95: explanation347/371ms, drawing890/89ms; mobile viewport:346/353ms,895/91ms. All documented QA targets pass; these are not owner p95 or physical-phone results. Warm server/OS caches may be present in the initial pass.
- Initial review one list request/zero graph requests; case-only zero list requests; cached revisits/note/filter-only zero geometry requests. Pan30steps zero static builds; Fit restores viewBox. Late A/B failure/retry, role source revalidation, cross-tab list/history/count refresh and stale-version refusal pass; no JS errors or horizontal overflow.
- Known individual correction/explicit Apply/map/reversal, whole-bank Remap/reversal desktop/mobile, mobile staged source reconciliation/separate Add, and **12 standalone reference workflows** pass after optimization. Original source geometry/diagnostics and graph safeguards remain.
- Read-only live sample: detail444ms, drawing-repeat498ms (baseline1,486/2,429ms); sampled drawing gzip8.8KB transferred. First uncached drawing2,344ms remains dominated by1,902ms crop lookup because the tested index is not deployed on the owner schema. No owner writes, restart, migration or new source import/reprocessing. The observed revision stayed unchanged; later worker must re-read current state.
- Reports: `iteration36-local-read-baseline.json`, `iteration36-local-index-results.json`, `iteration36-index-roundtrip.json`, `iteration36-browser-performance.json`, `iteration36-cross-tab-qa.json`, `iteration36-live-read-comparison.json` plus correction/reconciliation/reference reports. Screenshots visually checked. Index-only migration/rollback is separately documented in `ITERATION-36-IMPLEMENTATION-REVIEW.md`. Full bundle/payload/concurrent-serving follow-ups and owner acceptance remain open.


## Iteration 36 planning — live read-only performance baseline (2026-10-12)

- Owner identifies opening review issues and source drawings as the main delay. Read-only local-app GET requests found active `CORRECTION-dce024db-ad8c-4743-b748-16bb1162c524`, 606 total / 581 open / 25 reviewed. This supersedes the earlier 605 open count; no current full-graph/binding audit is claimed.
- Selected Port-case list **1,484ms**, detail **1,486ms**, source **2,289ms**, same source again **2,429ms**. Concurrent list/detail/source, matching the UI's current selection requests, completed in **5,382ms**. Almost all time preceded the first byte. The source response was **170,895 bytes / 92 Shapes**, not truncated. All requests succeeded; no source import, activation, correction or topology mutation was performed.
- [Timing evidence](iteration36-review-performance-baseline.json) is a small HTTP diagnostic sample, not p95, browser rendering, a SQL plan or a cold-cache benchmark. The recorded timestamp is UTC; local date is October 12. Application code/runtime were unchanged. No implementation tests were run for this documentation-only work.
- [Iteration 36 requirements](ITERATION-36-REVIEW-PERFORMANCE.md) and [HANDOFF](../HANDOFF.md) now prioritize independent requests, selective server reads, exact-run crop caching/indexing and smooth drawing interaction. Implementation and before/after acceptance remain pending. The previous handoff is archived byte-for-byte in `archive/HANDOFF-THROUGH-35-2026-10-12.md`.

## Iteration 35 follow-up — applied Remap review status (2026-10-11)

- Read-only running-app verification confirmed active `CORRECTION-f56ebb5a-4100-4374-a432-6e9c8304ad5e`, 24/24 AP18 same-number bindings, Port1 issue resolved/closed, no match under Open, and reviewCount605. Initial review metadata wrongly chose Port24; after the exact affected-Port lookup fix the same live case reports Port1/F1. No worker server writes, activation or reprocessing.
- **13 targeted backend tests / 222 assertions** pass. The added regression starts Remap from the review case (not only the AP workspace), checks its exact member and open/history filters, preserves the historical unknown binding, then validates/Applies a reversal and proves Port1 reopens with null binding.
- Application typecheck, production build and standalone export pass; required PHP formatting applied. No topology algorithm/importer changes or extra dependencies. Prior broad test evidence is retained above/below as historical evidence; only affected checks were rerun.
- Desktop 1440px/mobile 390px correction workflows verify default Open excludes the applied case, Reviewed history labels it corrected/applied, the detail shows exact Port7↔F13 (the intentionally different-number fixture), and the original draft/Apply/reload/journey/reversal workflow remains functional. Report: `iteration35-correction-browser-qa.json`.
- Test mutations used guarded local isolation only. Current owner graph remains unchanged; both local QA services are stopped after checks. Source cases/history are retained rather than deleted.


## Iteration 35 follow-up — owner-confirmed AP bank Remap (2026-10-11)

- **834/834 full TypeScript tests** passed. The final focused correction suite **6/6** additionally checks compatibility with older source-scoped Port identities and ambiguous shared-node documents. Both application/compiler type checks, production build, required formatter and standalone export pass. Existing bundle-size advisory remains.
- Final affected PHP tests **12 / 196 assertions** pass: individual correction/reversal, complete-bank atomic replacement/reversal, all 24 reprocessing disagreements retained and explicitly reconciled, older Shida canonical shape/source identity, stale revisions/digests, concurrent review at another bank Port, roles/scope/evidence and generic-event spoof rejection. Mutations are confined to disposable loopback isolation.
- Previously saved actual AP18 draft snapshot: owner-confirmed **F1→Port1 … F24→Port24** projected locally; all 24 resolver endpoints verified, **24 changed journeys / 123 derived facts**, all **9,356 Fibers** compared. Other AP bindings, original Port geometry/certification and explicit local transitions are unchanged. Uniform-offset scan found one complete candidate (AP18); it does not certify incomplete/non-uniform banks. Report: `iteration35-bank-remap-source-audit.json`.
- Desktop 1440px/mobile 390px: whole-bank draft/validate reloads, complete mapping table, expandable path/fact comparisons, acknowledgment before Apply, one atomic revision, Port journey after reload and entire-group reversal pass. Zero JS errors or horizontal overflow. The bank table appears first and detailed impacts are expandable. Report/screenshots: `iteration35-bank-remap-browser-qa.json`, `iteration35-bank-remap-preview-1440.png`, `iteration35-bank-remap-preview-390.png`.
- Existing individual Port7→F13 correction/reversal desktop/mobile workflows were rerun and pass (`iteration35-correction-browser-qa.json`). They remain deliberately different-number mappings; there is no global 1→1 decoder rule. No Python importer code was changed; historical 47-test importer evidence is unchanged.
- Owner-server reads/writes/activations and new real Visio imports: **zero**. AP18 was evaluated using a saved local snapshot; the owner must separately Apply the correction. Original geometry, source-decoding backlog, uncertain onward continuity and owner acceptance remain preserved/open. Final QA services are stopped.


## Iteration 35 second delivery — typed corrections and source reconciliation

- Delivered 35-05 locally: immutable typed exact Port/Cable/Fiber drafts, existing-resolver validation, complete paginated before/after path/fact comparison, separate digest/version-pinned owner Apply, persisted original/history and explicit validated reversal. Historical/staged cases remain read-only; unsupported types remain proposal-only. No real AP18 mapping was guessed.
- Full TypeScript **832/832**; application/compiler checks include new correction/reconciliation scripts. Build/standalone export and required PHP formatting pass. Backend **16 tests / 6,579 assertions**, including the actual large-source regression; final affected correction/review guards **8 / 127 assertions** pass. Python source code was unchanged; first-delivery importer **47/47** remains historical evidence.
- Known synthetic **Port7→F13**: desktop/mobile each complete save/reload, validate/reload, full path/fact preview, disabled Apply before acknowledgment, explicit activation, updated Port journey/history and explicit reversal. Synthetic reprocess at 390px demonstrates blocked Add, complete comparison, explicit source-result reconciliation with unchanged active state, refreshed staged index/digest, separate Add and preserved human history. Reports: `iteration35-correction-browser-qa.json`, `iteration35-import-reconciliation-browser-qa.json`. Zero JS errors/overflow. Screenshots visually inspected.
- Actual preserved Shida **33 workflows** and preserved Tsageri standalone **12 workflows** were rerun after integration with zero JS errors; AP18 stays unknown, AP16/Port13 and partial Port1 retain signatures, and F32/Port38 regressions remain unchanged. No source tolerance, Route-derived optical edge, renumbering or shade rule was introduced.
- All test writes/activations remain in guarded loopback isolation. Owner-server operations, new real VSDX uploads and real AP18 corrections: **zero**. Source artifacts and earlier revisions/observations persist. Source disagreement is never silently replayed or discarded; stale candidates/review/network state, wrong scope/range/role/evidence/conflicts and changed digests are rejected.
- Owner/first-time-user acceptance remains pending. Prototype comparison/selector bounds, source backlog and initial payload limitations are documented in `ITERATION-35-PORT-CORRECTION-REVIEW.md`.

## Iteration 35 first delivery — places, journeys and review evidence

- Delivered **35-01–04 locally**. **35-05 is not delivered**: typed draft, impact validation and owner activation remain the second milestone. First-time-user/owner comprehension acceptance is pending.
- Full TypeScript **829/829**; final affected place/journey tests **11/11** after typed membership refinement. Python **47/47**. Affected PHP **5 tests / 61 assertions**. Both application/compiler type checks, build, Pint and standalone export pass. Existing large-bundle warning remains.
- Actual Shida at 1440/390px: **33 workflows**, plus **2 review-to-exact-Port/Back/keyboard workflows**. Preserved Tsageri standalone: **12 workflows**. Zero JavaScript errors, Shida external requests zero and no horizontal overflow. Reports: `iteration35-browser-qa.json`, `iteration35-navigation-browser-qa.json`, `iteration35-reference-browser-qa.json`. Desktop/mobile screenshots visually inspected.
- AP16/Port13 and partial Port1 retain resolver signatures; AP18/Port1 stays unknown with no playback. Exact Port12158/stroke12110/unresolved endpoint appears with explicitly missing older rejection metadata. All five categories, AP43/AP47 numbering, source failure/retry, notes/history and unchanged active revision pass. Tsageri F32 reaches AP52 through C175 and excludes SC218/AP51; Port38 retains its accepted SC224→SC225 path. C169/F12 and C172/F01/F29/F31 remain unchanged. Long-stop grouping, finite/reduced-motion playback and hidden-document pause pass.
- Initial operational response **40,871,497 decoded bytes**, about 1.1–1.4s locally; focus adds no graph request. Bounded AP18 evidence **170,953 bytes**, about 0.9–1.1s locally; at most 600 Shapes/crop. Neither the full proposal/details nor the 62,670-Shape drawing is loaded for a place. Initial payload reduction remains a follow-up.
- Reused audited candidate/hash-checked geometry in guarded local isolation. Owner-server queries/writes/activation and source changes: **zero**. No migration/dependency; source backlog remains open. QA API/PostgreSQL stopped after checks; final backend tests reset only disposable isolation. Preserved fixture files remain reusable.
- See `ITERATION-35-IMPLEMENTATION-REVIEW.md` and `ITERATION-35-OWNER-GUIDE.md` for behavior, before/after screenshots, limitations and acceptance steps.

## Iteration 35 preparation — design concept, product work pending

- Read current Iteration 34 implementation/diagnostics and default tree/review code. Confirmed AP18/Port1's candidate stroke12110 lacks a uniquely established opposite Fiber marker, and that current review proposals do not apply topology changes.
- Prepared two interactive concept entries, place-first Network and question-first Engineer Search, using three verified local source/resolver examples. Requirements cover bounded local graphs, one shared journey, honest uncertainty, concise source review and a typed correction → comparison → explicit activation workflow.
- Concept-only JavaScript syntax and final headless Edge interaction checks pass: seven checks, zero JS errors and no horizontal overflow at outer widths 1040/390/320px. Desktop/mobile screenshots were visually inspected. No production app tests or first-time-user comprehension tests are claimed. See `ITERATION-35-CONCEPT-REVIEW.md` and `tmp/iteration35-concept-qa.json` for scope and the repaired preview interaction.
- No app code, source or network data changed; owner-server requests/writes: zero. Iteration 34's completed handoff was archived byte-for-byte in `docs/archive/HANDOFF-THROUGH-34-2026-10-10.md`. Iteration 35 implementation tasks remain Ready.

## Iteration 34 — inspectable review inbox and digitization backlog

- Actual local Shida staging/reprocess produces a separate bounded, digest-pinned review index; its count opens before Add while active network is empty. Applying solely to the disposable fixture permits active review QA. No owner-server request/write, reset, import or activation was performed; no schema migration was added.
- Runtime persisted inventory: **606 unique cases = 506 Port bindings + 89 Cable/bank associations + 8 fill comparisons + 2 numbering banks + 1 duplicate identity**. All case IDs are reachable through 50-row pages; 23 canonical AP groups preserve child identities. Source-specific conflict links filter the existing eight cases, rather than adding them again. Active/staged/historical scopes, frozen totals, review dispositions and pending source imports remain distinct.
- Actual desktop 1440px/mobile 390px: **26 owner workflows**, plus **8 navigation/recovery/anomaly workflows**. All five categories have readable source geometry, both fill locations/duplicate labels, and the original AP43/AP47 irregular numbers. Exact AP18/Port1 and AP37/Port14 searches, grouped lists, deep-link reload, Back/Forward, exact-source failure/retry, notes/actor/history and unchanged graph after review-only writes pass. JS errors: **0**; external requests: **0**; horizontal overflow: **0**. Evidence: `iteration34-browser-qa.json`, `iteration34-recovery-browser-qa.json` and their actual case screenshots.
- No deferred `/network/{revision}/details` request is needed for review entry. Final measured list response maximum: **140,956 bytes**; detail: **17,852 bytes**; bounded two-crop source: **1,442,869 bytes**; maximum measured source read: **1426 ms** locally. Case index cap: 8 MiB / 10,000 cases; page cap: 50; source crop cap: 600 Shapes with truncation warning. The viewer redraws actual geometry/text/affine ellipses, rather than claiming pixel-identical Visio fonts. Missing exact-run evidence never falls back to a newer/other source.
- **TypeScript 818/818**, **Python 47/47**, application/compiler type checks, production build, PHP syntax/Pint and standalone export pass. Added coverage checks source/review URL state and rejected Port diagnostics without accepted bindings; existing optical-path regressions remain included. Final affected backend: **7 tests / 6,410 assertions**, 2m26.7s, 800 MiB peak. Covers viewer/reviewer, subject/source mismatch, proposal applied/fieldVerified forced false, concurrency/stale revisions, staged bounded-index integrity, historical pinned reads, superseded pending-import counts, append-only history and original Tsageri/cache replay. Earlier 3-test/41-assertion contract run is historical. These are affected suites, not a newly claimed full backend suite.
- The current-source investigation is reproducible with `scripts/audit-iteration34-review.py`, with input artifact hashes. It covers all 89 incomplete association candidates, 23 AP groups, 47 node-unassociated banks, five unlabelled physical pairs and all 2,627 rejected local links. Port patterns: 406 missing unique bank/Cable association candidates, 98 missing/ambiguous marker attachments and two undiagnosed cases (AP37/Port14, AP40/Port4). These are qualified diagnostic outcomes, not new optical mappings. The separate 579-occurrence purpose ledger retains unresolved note scope/status. Overlapping ledgers are not added to 606 or to 9,260 partial path impacts.
- All actual local case IDs link to a diagnostic/investigation record in `iteration34-case-diagnostic-links.json`; fixture identity/source provenance is in `iteration34-active-fixture-inventory.json`. Prepared audit IDs are not hard-coded into production. The prioritized next-worker tasks are in `ITERATION-34-DIGITIZATION-BACKLOG.md`.
- Review dispositions remain separate from physical facts. Original fills/numbers/links and immutable network revision remain unchanged after notes. Proposed corrections require a separate validated comparison and explicit owner activation. Under the existing active-revision event model, staged/historical reviews are inspectable but read-only; no notes are attached to an unrelated active graph. Old staged attempts without a lightweight index require explicit reprocessing. Older accepted snapshots may remain undiagnosed until a separately reviewed interpretation supplies rejection metadata.
- Initial QA exposed and repaired desktop return visibility and exact AP/Port search; subsequent reruns corrected a harness selector for repeated historical note text. Final reports have no failure. The QA API on port 8010 was stopped before isolated regression tests; local PostgreSQL is stopped after checks. Owner server credentials/TLS/schema and applied data remain unchanged.

## Iteration 34 preparation — review analysis, 2026-10-10

- **Analysis only; implementation pending.** The owner reports the matching Shida result is now added to the network. This review used local artifacts and the original VSDX; no owner database/API requests or writes were made. Earlier notes about the owner retaining final Add describe the earlier checkpoints.
- Reconciled all **606 unique sourceReviewCases**: 506 Port bindings, 89 Cable/bank associations, eight fill conflicts, two Port-numbering cases and one duplicate-label case. The eight conflicts are included in 606. The separate `issues` collection contains zero records; code inspection confirms the review list reads that empty collection while the case dropdown reads sourceReviewCases. No browser reproduction or application test run is claimed in this preparation.
- Grouped 506 Port cases into **23 APs**: 21 complete 24-Port banks plus AP18/Port1 and AP37/Port14. All eight fill conflicts share source label `25-206-25075-25081-96` and the same two fills. The 89 incomplete Segments contain 4,748 logical Fibers; the separate 2,627 rejected local links lack one bank association in 2,198 cases and both in 429.
- Direct read-only ZIP/XML spot checks confirmed source SHA `e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060`, AP43 Shapes 46525/46548 both containing `1`, AP47 Shape 67897 containing `0`, duplicate labels on Shapes 27117/29315, and F10 marker fills on Shapes 34469/35418. These observations do not authorize source or network corrections.
- Evidence: `docs/iteration34-review-inventory.json` contains case IDs, source/asset references, groups, original XML spot checks and input artifact hashes. The analysis and worker specification are `ITERATION-34-REVIEW-ANALYSIS.md` and `ITERATION-34-REVIEW-INBOX-AND-DIGITIZATION.md`. The previous handoff was archived byte-for-byte as `docs/archive/HANDOFF-THROUGH-33-2026-10-10.md`. Iteration 34 tasks remain **Ready**, not Done.

## Iteration 33 — validated partial Shida topology and owner workflow

- Actual audited source: SHA `e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060`. All 62,670 Shapes remain preserved. The source-specific, owner-confirmed docking rule classifies all 19,401 relevant strokes, including 270 geometry-only paths; 5,140 marker endpoints are recovered through bounded drafting-gap geometry. Route adjacency, numbers and colors create no optical edges.
- Validated partial proposal: **176 Segments / 9,356 Fibers / 1,759 node-local transitions / 1,272 certified printed Ports / 766 exact bindings**. All Fibers have current paths/JourneySummaries: **96 exact / 9,260 partial**, zero unsupported edges/false stops/false terminations. 7,597 current Lineages include partial paths. 606 review cases, eight conflicting bank fills and 579 annotations are preserved. Two repeated full-label occurrences and two irregular Port banks remain review-only. Counts are evidence results, not immutable inventory targets.
- AP16 Ports13–24 reach AP17 through SC25017 and exclude the `25-122` core toward SC25016. Source-neighbor fixtures 13, 14 and 24 use the shared resolver. AP16 F01 stays blue and partial at SC25017; it does not borrow the neighboring branch. Scoped AP search/Port lookup/relational keys cannot collapse regional AP numbers.
- TypeScript **816/816**, including node-local routing, missing-edge negative cases, source-scoped AP disambiguation and mobile selected-branch unfolding. Python **46/46**, including actual F01/Port10 docking anchors, wrong-direction/large-gap/sideways negatives, number-row ambiguity, source bounds and existing Tsageri/SC217 regressions. TypeScript application/compiler checks, PHP syntax/Pint, production build and refreshed standalone export pass; the existing large-bundle warning remains.
- Actual source staging → reprocess → candidate → local atomic apply, history/cache integrity and retry acceptance: **2 tests / 95 assertions**, 4m17.7s, peak 1.00 GiB PHP. Additional auth/interpreter-upgrade geometry reuse/original Tsageri revision replay: **3 tests / 6,348 assertions**. Final supersession/auth/cache checks: **3 tests / 45 assertions**. These are separate runs, not a summed full-backend-suite claim. No active graph is created during interpretation; stale expectation and older validated proposals are rejected before persistence.
- Actual API/PostgreSQL/Edge browser: **14 workflows**, 1440px and 390px, **zero JS errors, zero external requests, zero horizontal overflow**. Includes preserved upload, validated partial proposal, reload/idempotent reuse, stale Add refusal, local owner Add, Port↔Fiber path parity, branch highlight/core neutrality, blue partial F01, dedicated Engineer Search and exact stored Port Shape evidence. Folded mobile ancestors reveal the selected branch; this is presentation only. `iteration33-semantic-browser-qa.json` and proposal/journey screenshots are the evidence. Initial QA encountered an interpreter-version change and a too-short harness timeout, then a selector that counted the repeated playback stop; both were corrected. The mobile folded-path issue was fixed in the product and verified. Final report has no failure.
- The actual version upgrade reused **62,670** geometry/index rows without re-extracting original bytes: indexing **3.89s**, total reprocess **56.748s**, PHP peak **1,031,798,784 bytes** under the existing 1,536 MiB capacity. Its preserved original extraction was **32.266s / 217,931,776 bytes** under 256 MiB. Semantic pass: **40.437s / 328,605,696 bytes** under an enforced 512 MiB / 180s bound. Geometry artifact digests/counts, page-local identity and interpreter-version cache keys are verified. Earlier geometry-only timings remain historical.
- Source-to-table mapping, full routing matrices, source-family coverage and real unknowns are documented in `ITERATION-33-SEMANTIC-REVIEW.md`, `iteration33-semantic-review.json` and `migration/iteration33/node-routing-tables.json`. Tube/ring meaning, aggregation Ports, unmatched bank/endpoint identities and operational annotations remain unknown. No universal Visio support or end-to-end completeness is claimed.
- Worker writes were restricted to guarded loopback `fiber_atlas_test / fiber_isolation` and separate `app/isolation-private`. **Owner-server requests/writes: 0.** No schema migration, cleanup, server import or owner activation was performed. The separate QA API on port 8010 was stopped after verification; the owner retains final server Add to network.

## Historical Iteration 33 geometry-only checkpoint (local acceptance)

- The exact Shida Kartli source SHA is verified. All 62,670 Shapes, 21,576 roots, printed bank evidence, page-catalog dimensions and 330 resolving Connect references are decoded and persisted by a new versioned run on the same source revision. Original inventory/history and archive bytes remain intact; geometry is explicitly `not_evaluated / staged`, with no optical proposal or activation.
- Actual large-file backend acceptance: **1 test / 53 assertions**. Final auth/failure/retry/lease/cache/UTC/review-count checks: **4 tests / 34 assertions**, `iteration33-reprocess-tests.txt`. The earlier skipped test environment was replaced by the actual guarded loopback `fiber_atlas_test / fiber_isolation` profile; owner server writes remain **0**.
- Actual Edge browser/API/database QA passes **8 journeys** at 1440px/390px, with zero JS errors, horizontal overflow or external requests. It covers upload, geometry reprocess, byte/history identity, exact source inspection, reload/deduplication, fresh-session sign-in, the Needs Review count/decoded source, and four-entry Engineer Search navigation. Report/screenshots: `iteration33-reprocess-browser-qa.json`, `iteration33-geometry-1440.png`, `iteration33-geometry-390.png`.
- Actual reprocess: **43.906s extraction, 28.651s indexing, 73.863s total**, Python peak **217,899,008 bytes** under actively enforced 256 MiB, PHP peak **29,360,128 bytes**. Resource, ZIP/XML/count/depth/time/identity safeguards remain; source extraction and compressed evidence are distinct from inventory-only artifacts. Cache fingerprints cover both extractor layers; damaged evidence and expired ISO leases create attributable retry attempts.
- Python **39/39**, TypeScript/build, PHP Pint, and standalone export pass. The prior **808/808** domain suite is retained because domain graph logic did not change. This continuation does not certify Shida topology: 120 Closure groups, 55 AP groups and 363 numbered banks are audited, but docking gaps, Cable associations, geometry-only paths, Ports and annotation semantics remain open. The corrected engineering report is `ITERATION-33-SOURCE-AUDIT.md`; no candidate-count preservation or route-only optical edge is introduced.


## Large-source upload and staging repair

- Actual owner file `შიდა ქართლი 2026.vsdx`: 6,757,465 compressed bytes; main page 113,255,345 bytes; total expanded package 113,605,208 bytes. The streaming inventory scans 2,753,039 XML elements and retains all 62,670 Shapes / 23,343 text-bearing Shapes. Local benchmark: **7.19 s**, sampled peak working set **24.29 MiB**. Original archive is retained; no geometry or topology decoding is claimed.
- Guarded local API acceptance passes **2 tests / 29 assertions**: real multipart upload/staging, SHA-identical retained bytes, all source Shape records, scoped Shape evidence, renamed duplicate reuse, activation refusal and distinct per-entry/aggregate size errors before source records are created. Evidence: `iteration32-large-source-staging-tests.txt`. Remote server imports/writes performed by the worker: **0**.
- Existing Tsageri original/revision replay and account/empty-state checks passed in the initial combined run. That log (`iteration32-upload-staging-tests.txt`) also records two initial test-fixture failures caused by the Symfony upload type losing test mode; they were corrected to the project's Laravel UploadedFile convention and rerun successfully above. It is not an all-pass report.
- Python **27/27** checks pass, including six new streaming inventory cases for nested text/hierarchy, duplicate identities, shape count/nesting bounds and DTD/entity rejection. Archive guards remain bounded at 20 MiB compressed / 128 MiB per entry / 256 MiB expanded total; packages above 64 MiB use source inventory, with geometry/Fiber interpretation explicitly pending.
- Final desktop/390px browser rendering passes **2 journeys**, with zero errors, zero overflow and zero POSTs; fixtures include staged and failed imports. Needs Review includes the staged source and no Add to network action is offered. Evidence: `iteration32-staging-browser-qa.json`, `iteration32-large-staging-1440.png`, `iteration32-large-staging-390.png`. TypeScript, production build, PHP syntax/Pint and refreshed standalone export pass. The existing large-bundle warning remains.

## Iteration 32-07 — Engineer Search restoration

- Restored the sidebar order **Network → Engineer Search → Visio Import → Needs Review**. Direct Engineer Search navigation remains available on an empty network, where the workspace explains that results need an imported Visio network and offers an Import Visio action.
- Existing EngineerWorkspace/query service and search-to-map return behavior are retained. Local Edge browser QA passes **4 journeys** across desktop 1440px and mobile 390px: empty-state keyboard navigation, active state, direct populated route, and search→map→Back query restoration. Browser errors: **0**; horizontal overflow: **0**; owner server writes: **0**. Populated checks used isolated local QA data; empty-state behavior used a local empty API response.
- Evidence: `iteration32-07-engineer-search-qa.json`. The original Iteration 32 owner-browser and real-server-empty reports remain unchanged and document the earlier three-link state as historical. Navigation assertions in their scripts now expect four links for future runs.

## Iteration 32 — delivered empty server and owner import

- Source-only original/revision/reimport replay succeeds against the disposable local PostgreSQL schema. Source A: 20 Segments / 1,176 Fibers / 840 transitions / 192 bindings. Combined: 37 / 2,088 / 1,615 / 384, 473 generated current Lineages, 2,088 summaries. 100% accepted source-transition coverage; zero false terminations/unsupported edges. Exact paths 369; partial paths 1,719.
- F32 reaches AP52 through C175/F24 and Lentekhi Port32; SC218/AP51 are absent. Port38 switches into C181/F06 and reaches SC225; no invented termination/AP continuation. SC217 10–12 are recomputed. SC207/F118 remains a gap; five Source B ellipse-only candidates are review-only. Historical owner claims/callouts are not silently inserted into fresh imports. C148 conflicts and the distinct C172 identities are preserved.
- TypeScript 808/808; Python 21/21; full backend 7 tests / 8,511 assertions. Final source-gap/revision replay 2 tests / 6,323 assertions; final affected provenance/API 14/14. TypeScript/compiler validation, build, PHP syntax/formatting and standalone export pass.
- Desktop/390px owner UI: 18 browser journeys, zero JS errors; actual upload/review/Add to network, duplicates, session reload and outage states verified locally. The real remote-backed empty app/setup check passes 3 journeys, zero JS errors, zero source imports and zero account submissions.
- Schema-only backup SHA-256 10c941affc7df6f13c8bbd98804c8176b78cf0d59c7602d85ef762e414abf3ee. Restored rows/constraints/functions/triggers compare exactly with portable byte ordering. Exact cleanup/rollback proved locally before the owner-authorized scoped server transaction.
- Server network/source/import/review business rows are zero, active revision NULL. Accounts, migrations, table definitions and normal safeguards preserved. No original/shared physical file deleted. Cleanup report: iteration32-server-cleanup.json. No owner acceptance or final owner import is claimed.
- Owner URL http://127.0.0.1:8000/; Start Fiber Atlas.cmd / Stop Fiber Atlas.cmd. Missing local encryption/runtime settings added without replacing database credentials. Private setup ticket lets the owner choose actual credentials; no demo account migrated. Owner-web app sessions and source uploads use the protected server profile and existing TLS require policy.
- Known single-page drawing families only; unsupported/new numbering layouts stay staged. Source-local validation does not claim complete end-to-end or owner-confirmed semantics.

## Independent current configuration check — 2026-10-08

- Loaded Laravel's effective configuration without displaying credentials: server profile, schema `bkhorguashvili`, SSL mode `require`, scoped writes enabled, no configuration cache. Fresh read-only connection verifies the intended database/user/schema/search path and negotiated TLSv1.3.
- Found 31 base tables. Active revision remains NULL. Configuration is ready; activation and server-backed API/review/browser acceptance are still pending. No server data was changed and no full regression/parity suite was rerun in this check.

## Iteration 30 — remote migrations and non-active seed

- Owner explicitly set encrypted `require` mode and enabled scoped writes. Fresh empty-schema read-only check, additive migrations, baseline seed and repeat seed succeeded only in `bkhorguashvili`. No destructive server reset, unrelated grants/extensions or local demo-account import occurred.
- Read-only parity verifies **all 2,088 server path structures/core records**, 37 Cables, 174 Tubes, 1,631 transitions, 384 bindings and 473 current Lineages. Cross-schema foreign keys: **0**. Effective database/schema/path and TLSv1.3 match the declared target. Evidence: `iteration30-server-verification.json`, `iteration30-server-after-seed.json`, migration/seed/reseed logs.
- Active revision remains **NULL**. Automatic approval review rejected activation without explicit user approval; seed-only was the allowed safer alternative and was completed. Server-backed active API/review/browser delivery is still pending. See [server progress and exact next operation](ITERATION-30-SERVER-PERSISTENCE.md).

## Iteration 30 — read-only inventory and schema isolation

- Complete metadata-only remote inventory confirms `bkhorguashvili` is owned by the supplied login, with USAGE/CREATE, and contains zero tables/views/sequences/functions/types/indexes/constraints. TLSv1.3 is negotiated. No remote DDL, seed, user creation or data updates have run. Snapshot: `iteration30-server-inventory.json`; additive table mapping: `iteration30-table-plan.json`, [mapping report](ITERATION-30-SCHEMA-MAPPING.md).
- Local non-public restricted-role acceptance: **5 tests / 2,191 assertions pass**, including original full path/core, API/review/staging/rollback checks and same-named public sentinel protection. Evidence: `iteration30-schema-full-tests.txt`. Final pinning migration replay: **1 test / 17 assertions pass**, `iteration30-schema-tests.txt`. PHP syntax checks pass. No frontend/topology/standalone change.
- Explicit `DB_PROFILE`/`DB_SCHEMA`, preserved protected server credentials, separate local profile, real connection-scope checks, qualified/pinned function references, and loopback-test-only reset guards are implemented. Server test-account/reset operations are refused; server writes are disabled pending the specified TLS prerequisites.
- The required SSL policy/CA/server name remains unknown: configured `prefer`, no trusted CA configured. Task 30-03 remains Blocked and 30-01 awaits that policy. This is not a claim of completed server-backed integration. Details: [profile/isolation report](ITERATION-30-PROFILES-AND-ISOLATION.md) and [HANDOFF.md](../HANDOFF.md).

## Iteration 29 — completed local persistence pilot

- **807/807 domain/API tests pass**; actual PostgreSQL **4 integration tests / 2,174 assertions pass**; Python VSDX/geometry **21/21** and inbox **6/6** pass. TypeScript, production build and standalone export pass. Full results: `iteration29-tests.txt`, `iteration29-postgres-tests.txt`, `iteration29-python-tests.txt`, `iteration29-inbox-tests.txt`, `iteration29-typescript.txt`, `iteration29-build.txt`.
- All **2,088 persisted path structures**, core authority and exact bindings match the reviewed baseline. Graph remains **37 Segments / 2,088 Fibers / 1,631 transitions / 384 bindings / 473 current Lineages**. Current topology fingerprint and physical construction are unchanged. Validated snapshots are immutable; invalid node references, stale writes and incomplete activation fail; rollback and pinned old reads pass.
- The workspace-local runtime is verified: PHP 8.3.35, Composer 2.10.3, PostgreSQL 18.6 and Laravel 13.34.0. Setup replay, real loopback SQL connection and start/stop pass. No system service, system PATH or system DLL was modified. The prior runtime/Node-token blockers are resolved through exact normal-token operations; no automatic approval rejection occurred.
- Edge 154.0.4258.53 API browser QA passes **21 journeys** at desktop/390px with zero runtime/console errors; import/review/error QA passes **7 journeys** with zero runtime errors. A real attributed review survives API/PostgreSQL stop/start and is read by an independent browser context. Upload, candidate review, exact source/run evidence, duplicate reimport, mobile layout and visible API failure without offline substitution pass. Evidence: `iteration29-api-browser-qa.json`, `iteration29-import-browser-qa.json`, `iteration29-api-1440.png`, `iteration29-api-390.png`, `iteration29-import-390.png`.
- Three same-host loads per mode: median usable map **2,398 ms API / 2,227 ms offline**. API parse/hydrate approximately **294 ms**; actual response **17,143,884 decoded bytes / 890,717 HTTP gzip bytes**. Initial local budgets pass. Browser-exposed heap is approximately 62.3 MB API versus 97.4 MB offline; this is an observed Chromium metric, not a cross-browser guarantee.
- The SC217 inverse-affine matcher passes the rotated non-circular counterexample and combined scale/rotation/nesting/flip checks; ambiguous and unsupported geometry remain distinct. Regenerating the real audit reproduces both evidence files byte-for-byte. The source coverage report incorporates 28D Port enrichment and retains the held-out drawing-family gate.
- Final standalone SHA-256: `97f1834e555246ca415414f03aac84df6afbe7bf5c694dd1eefb8d5241aa84bf`. Complete reference baseline hashes remain unchanged. The existing large embedded-bundle advisory remains; API startup does not transfer the 74.7 MB migration archive.
- [Implementation review](ITERATION-29-IMPLEMENTATION-REVIEW.md), [local setup](ITERATION-29-LOCAL-SETUP.md), [payload boundary](ITERATION-29-07-OPERATIONAL-PAYLOAD.md) and [current handoff](../HANDOFF.md) describe the delivery. This is a local pilot: public release/access, backup/restore, monitoring, generic new-source activation and an unseen real drawing-family acceptance test remain open.

## Independent Iteration 29 delivery checkpoint — 2026-10-05

- Reviewed 29-01 logs and four recorded browser journeys. Independently verified current standalone SHA-256 `fdbafd333981c79c1f3f0d4b09b572a243118b88996942c82df71877e5157ff6`. No fresh test/browser execution was performed.
- 29-05 returns to Needs review: the new ellipse helper uses axis-aligned dimensions without an orientation transform, and the current endpoint-containment tests do not cover rotated non-circular markers. This is a generalization/coverage finding, not evidence that the scoped circular SC217 correction is wrong.
- The source coverage report also repeats an obsolete blanket limitation on Source B Ports; Iteration 28D subsequently certified AP/Port bindings. Worker must reconcile historical versus current coverage.
- Backend/database implementation remains undelivered. Added worker tasks to investigate workspace-local runtime provisioning and bound the startup API payload separately from the 74.7 MB migration snapshot. Existing successful tests below remain historical results for their stated scope.
- Findings, evidence and acceptance requirements: [checkpoint review](ITERATION-29-CHECKPOINT-REVIEW.md). No application code, runtime or database was changed by this review.

## Iteration 29 planning checkpoint — 2026-10-05

- The planning pass independently matched the recorded 28L standalone hash and identified the stale C171 F01–F28 unresolved summary; task 29-01 below records the completed fix.
- Existing source certifications remain scoped to reviewed documents and rule versions. The 28L correction does not certify arbitrary Visio imports; new-source semantic and cross-document validation remains necessary.
- [Iteration 29 requirements](ITERATION-29-BACKEND-FOUNDATION.md) and [current handoff](../HANDOFF.md) authorize the local Laravel/PostgreSQL persistence milestone. No database/API or production-readiness result is claimed yet.

## Iteration 29-01 — current Cable/Tube continuation summaries

- **801/801 repository tests pass**, including five regressions for C171/F10, F11 and F12 at SC217, retained historical evidence, Tube 1 summary, and Cable/Tube search. TypeScript compilation, production build and standalone export pass. The existing large embedded-source bundle warning remains.
- Standalone Edge 154.0.4258.53 QA passes four journeys: C171 Cable Inspector, Tube 1 Inspector, C171 search and C171 Tube 1 search. The active summary reports F01–F48 → C172/F01–F48; it does not show F01–F28 as unresolved. Browser errors: **0**. Evidence: `iteration29-01-browser-qa.json` and `iteration29-01-c171-cable.png`.
- Operational summaries now derive from active node-local transitions. Historical `CableContinuation` records are unchanged and explicitly labeled historical in technical details. No topology transition, Port binding, Fiber identity or path signature was changed.
- Refreshed standalone SHA-256: `fdbafd333981c79c1f3f0d4b09b572a243118b88996942c82df71877e5157ff6`. Report: [Iteration 29-01 correction](ITERATION-29-01-CABLE-SUMMARY-AUTHORITY.md).

## Iteration 29-02 — persistence contract and 28L baseline

- Wrote the bounded relational schema/API decision record in [ITERATION-29-PERSISTENCE-CONTRACT.md](ITERATION-29-PERSISTENCE-CONTRACT.md). It keeps canonical document identity separate from filename/content hash; models transitions, Ports, claims and evidence relationally; makes review events append-only; and binds projections/reads to one active revision. The existing TypeScript path resolver remains the only optical traversal authority. API failure must not fall back to offline demo data.
- Captured the complete active repository Inventory through `repository.load()` as `migration/iteration29/baseline/active-28l-inventory.json.gz`, with a reviewable manifest. Payload size: 74,662,857 bytes uncompressed / 2,707,534 compressed. SHA-256: uncompressed `397cb29f8c3b02806e02d0852bba40eb356602870c0c38885b78ccf6476b9433`; compressed `49e10d5acfd1afe8fa1a3bed6b2fd98bb24fd8fbaa18003016f4d252d427c21b`. A fresh `--check` regenerated and verified both hashes and the topology revision. TypeScript passes.
- Baseline records 37 Segments, 2,088 Fibers, 1,631 active transitions, 384 Port bindings, 2,088 current paths/Journey Summaries and 473 current Lineages. The active graph revision is `canonical-active-fiber-path/1/48990ab60b0f5dc0`.
- Environment check: Node 24.19.0 and managed Python are present. PHP, Composer, PostgreSQL CLI/server, Docker and package managers are unavailable; WSL is not installed; port 5432 is closed. No local database integration was attempted or claimed. The exact backend integration dependency is recorded under task 29-03 in [HANDOFF.md](../HANDOFF.md).

## Iteration 29-05 — source coverage and importer regression gates

- Python VSDX importer suite: **17/17 pass**. Added checks use the real SC217 source audit for connector Shapes 34070/34071/34072, verify C171↔C172 F10/F11/F12 unique transformed-marker ellipse hits, absence of Connect rows, and the old center-tolerance failures for F10/F12 with F11 as control. Ellipse unit checks include boundary, outside and ambiguous multiple hits; ambiguous results remain a list and are never arbitrarily selected.
- Staged inbox importer suite: **6/6 pass**, including duplicate content, same-name new revision, stable scan, locked scan, corrupt-package rejection and proof that staged files do not write to the active catalog.
- TypeScript project compilation (`tsc -b`) passes. A fresh TypeScript test run could not start: Node 24 `os.userInfo()` returns `uv_os_get_passwd returned ENOMEM` on this host before test discovery. No fresh TypeScript test result is claimed for 29-05.
- [Source coverage report](ITERATION-29-05-SOURCE-COVERAGE.md) records Source A/B package and grammar coverage, connector accounting, reviewed cross-document identities, repeat-import tests and limitations. No held-out drawing-family certification is claimed.
- 29-03 Laravel/PostgreSQL, 29-04 persisted staged imports and 29-06 end-to-end integration remain blocked by the recorded absence of PHP/Composer/PostgreSQL/Docker and a local database; no backend behavior is claimed.

## Iteration 28L — source correction and persistent map delivery, 2026-10-05

- **796/796 repository tests pass** (0 failures/skips). TypeScript `tsc -b` passes. Vite production build and standalone export pass. The build retains the known large-offline-bundle advisory (9.9 MB minified JS; 746 KB gzip), with no build failure.
- Final offline Edge 154.0.4258.53 QA ran **13 browser journeys** against the refreshed `fiber-prototype.html`. It covers the six requested journeys plus selected-overlay, history, playback and layout regressions: SC206/C169/F10 inspection and Back/Forward; direct F12 and retained Silknet/Skytel conflict; Silknet strand selection; Lentekhi Ports10/11/12; F32/AP52 cross-navigation and explicit AP destination; Port38/C181/SC225; shared finite playback; 1366px and 390/320px layouts; 200% zoom. Runtime errors: **0**; horizontal overflow: **0** at tested sizes. Screenshots: `iteration28l-map-desktop.png` and `iteration28l-map-mobile-390.png`.
- F32's selected overlay follows AP52 and excludes C173/C174; Port38 follows C181 and excludes C180, SC223, SC218 and AP51. The persistent Inspector keeps map context and selected optical Fiber separate. The browser results are in `iteration28l-browser-qa.json`.
- Source investigation resolves SC217 F10/F12 with exact lines 34070/34072 and unique actual-marker ellipse attachments, corroborated by Iteration09 raw endpoint cells. The old fixed X tolerance explains both omitted Begin-marker interpretations. F11 remains the unchanged positive control.
- The correction adds two transitions (1629→1631), changes 24 local paths and rebuilds Lineages (475→473). Silknet becomes 3 groups/36 local legs/3 associations to existing exact Lentekhi bindings. F12 use conflicts remain visible. All 45 old source/reference JSON hashes, prior transition records, actual Port binding hash and frozen manifest remain unchanged.
- Final standalone SHA-256: `72111b6eae31c3ad90f4722d4087380bc7080479915a6473f24dc91b7f12884a`. Full source/projection evidence: [28L source audit](ITERATION-28L-SC217-SOURCE-AUDIT.md), `iteration28l-sc217-source-audit.json`, and `iteration28l-projection-diff.json`. Build and TypeScript logs: `iteration28l-build.txt` and `iteration28l-typescript.txt`; full tests: `iteration28l-tests.txt`.

## Iteration 28K — organization search in the route map

- **787/787 tests pass**, 0 failures/skips. Full TypeScript compilation, Vite production build and standalone export pass; the existing offline-bundle size advisory remains.
- **91 browser flows pass** against the same final standalone: 45 organization, 6 supplemental and all 40 existing AP/domain regressions. Offline Edge 154.0.4258.53; no recorded page errors, main suites zero external requests. Exact names/aliases, legacy bookmark migration, complete chooser/membership, resolver legs/nodes/remaps/stops, actual binding owners, independent occupancy, source/destination return, Back/Forward/reload and qualified OTDR/C148/review scope verified.
- Silknet: 4 separate groups, 28 local legs, 12 Cables, two actual Lentekhi ODF bindings (Ports 10/11), no invented AP. OpenNet: all 17 groups accessible. Magti/Skytel aliases and complete chooser identities pass. Unknown Ports, partial boundaries, linked review and C148 conflicts remain visible.
- Desktop 1440×900/1366×768 actual wheel/PageDown reach rail controls without moving the canvas; OpenNet Tab reaches last evidence in 51 steps. Touch-emulated 390×844/320×844 have readable identity/chooser/diagram and no document overflow. Finite selected-path playback and reduced motion pass. 200% CSS scaling and 720×450 reflow pass. These are emulation; AP hidden visibility remains a simulated event, not native-tab certification.
- **45 authoritative JSON hashes and six complete derived projection hashes unchanged**; 37 Cables/2088 Fibers/1629 active transitions/48 Lentekhi bindings/192 Tsageri Ports/zero C148 bindings and frozen manifest unchanged. No source import or topology reinterpretation.
- Three isolated cold loads: baseline median 2133 ms (2097–2166), final median 2117 ms (2091–2190); startup profile preserved within local host variation. Final SHA-256: `4a38c04b060e7d3fe02493c135eceef2b0d2730792d92e5790879121859f9d3d`.
- Evidence and limits: [28K implementation review](ITERATION-28K-IMPLEMENTATION-REVIEW.md), `iteration28k-after-browser-qa.json`, `iteration28k-supplemental-qa.json`, `iteration28k-ap-regression.json`, `iteration28k-runtime-snapshot.json`, `iteration28k-projection-preservation.json` and `iteration28k-tests.txt`. Source A's compact Shape diagnostics remain limited to their existing anchors; claims and full migration evidence stay preserved.

## Iteration 28J — persistent AP workspace and complete context

- **782/782 repository tests pass**, with full TypeScript compilation, production build and standalone export. Final offline Edge 154.0.4258.48 QA records **40 passing flows covering all eight acceptance journeys** at 1440×900, 1366×768 and touch-emulated 390×844/320×844; zero page errors/external requests and horizontal overflow. Additional mobile checks confirm that the initial AGG5 route-node label is readable with Port1 selected.
- AP42 opens with all 24 Ports and its complete AGG5 physical context. Port/node/Cable inspection retains destination/origin/mode. Only explicit destination navigation retargets. Port1's F103→F01 remap and unknown aggregation Port, Port16's SC207 gap, whole-network optical-overlay persistence, source return, Back/Forward and reload pass. Occupancy agrees across grid/header/details/search independently of Fiber use.
- Real wheel changes the desktop rail scrollTop by 700 px at both sizes; PageDown changes it by 524/408 px. Tab reaches Port24 and the last evidence action without changing canvas scroll position. Finite normal/reduced-motion playback, pause/replay/manual-selection/mode/visibility behavior and stable keyboard focus pass. Hidden visibility uses a simulated event because headless tabs remain visible. Zoom checks use 200% CSS scaling plus 720×450 media-query reflow; these are emulation, not native browser-chrome or real-phone certification.
- All **45 authoritative JSON hashes** and **six complete derived projection hashes** remain unchanged. Inventory remains 37 Cables, 2,088 Fibers, 1,629 active transitions, 48 Lentekhi bindings, 192 Tsageri Ports and zero C148 bindings. Frozen manifest remains unchanged. Port38 termination, F11/AP49, F118 gap, F32/AP52, C148 conflict and separate source C172 identities pass.
- Three isolated paired cold-load medians: **2,056→2,061 ms**; ranges 2,038–2,282→2,041–2,103 ms. No material regression; the 28I startup gain is retained. Large offline bundle and startup task remain. Final standalone SHA-256: **`6bb6bacff39d3d2c7e5ac646a79ae1950eafed49f4749665e93aad54ebf45e8e`**.
- Evidence and limits: [28J implementation review](ITERATION-28J-IMPLEMENTATION-REVIEW.md), `iteration28j-after-browser-qa.json`, `iteration28j-mobile-orientation.json`, `iteration28j-projection-preservation.json`, `iteration28j-full-tests.txt`, and before/after screenshots. HANDOFF tasks 28J-01 through 28J-07 are Done.

## Iteration 28I — simpler operator UI and focused routes

- **777/777 tests pass**, with TypeScript, production build and standalone export. Offline Edge 154.0.4258.48 at 1440×900, touch-emulated 390×844 and 320×844 passes all recorded assertions; zero page errors/external requests or document overflow.
- Cable C184 and Lentekhi Port38 have distinct physical/optical views. Port38 remaps at SC224 to C181/F06 and terminates at SC225; F11/AP49, F118 gap, AP47 unknown, Tsageri unbound, C148 conflict, source evidence and Back/query restoration remain visible and verified. Manual/optional playback uses the same ordered path; synthetic revisit/loop regression passes.
- Three paired cold loads: median 3319→2165 ms; ranges 3246–3402→2073–2386 ms; largest startup tasks 2850→1912 ms. Final ready-UI search delays 7–120 ms. Detailed methodology and limitations: [28I review](ITERATION-28I-IMPLEMENTATION-REVIEW.md).
- Six complete derived projection hashes and 45 authoritative JSON hashes unchanged. Certified inventory and frozen manifest unchanged. Standalone SHA-256: 117fd2e39bba4daf111d09033ce1a3044cbf83116f30f796b5046cb0db1b309c. Raw QA: iteration28i-after-browser-qa.json; full test log: iteration28i-tests.txt.

## Iteration 28H — search correctness and reliable handoff

- **770/770 repository tests pass**. Focused regressions cover all eight Source B AP summaries, one-pass Cable cards, invalid/unbound/ambiguous scoped Ports, ordered Port/Fiber paths, Tube sample scope, topology-revision cache invalidation and certified counts. Full TypeScript compilation, Vite production build and standalone export pass. The large offline-bundle advisory remains.
- Final offline standalone SHA-256: `5fdb57701ad279d156995b4baa739bf97021acb6283767d143dae1c380b88a81`. Offline Edge QA at 1440×900 and emulated 390×844 passes 18 recorded flows: AP42 canonical navigation and occupancy, Cable/source-label summaries, invalid and unbound Ports, Port38/Fiber path agreement, Tube sample action, keyboard selection, Back-to-query from both search contexts, and the 48-Port grid. Browser errors: 0; external requests: 0; horizontal overflow: 0.
- Same offline desktop measurement setup: previous-to-latest cold load 3,566→6,270 ms; 48-Port grid 746→92 ms. Search updates range 27–84 ms in the latest run. Earlier final runs showed 3.6–3.8-second cold load and 59–62 ms grid; host variability is material. Cold-start main-thread stall remains around 5.3 seconds in the latest run. The 390px checks are emulation, not a real phone. Method and per-query results are in `docs/ITERATION-28H-SEARCH-CORRECTNESS.md` and `docs/iteration28h-{baseline,final}-browser-qa.json`.
- Authoritative source/topology inputs were not edited: 37 Cables, 2,088 Fibers, 1,629 active transitions, 48 Lentekhi exact bindings, 192 Tsageri logical Ports, zero C148 Port bindings. Frozen V1 manifest file SHA-256 remains `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`. AP inventory and transition ledger SHA-256 values are recorded in the 28H report.

## Iteration 28G — Operational Port policy and compact universal search

- **763/763 repository tests pass**, with full TypeScript compilation. Focused coverage verifies Lentekhi exact Port bindings and separate unknown occupancy, Tsageri zero-bindings/no-C148-inheritance, scoped AP/Aggregation Port lookup, Fiber construction and resolver path, Cable/source-label summaries, and Closure/AP/Aggregation result routes.
- One `PortOperationalView` policy now feeds AP Port cards, Lentekhi’s 48-Port grid, ODF Port Inspector, Connection Sheet Port cells, and exact Port search. The source distinction between Port occupancy and Fiber use remains intact.
- Global search cards are compact and route-first. The exact-Fiber result includes Cable, Tube and Fiber identity/colors, usage, organization and a short path; object-specific cards summarize Cable, Tube, Closure, AP, Port, Aggregation and organization context.
- Topology is unchanged: 37 Cables, 2,088 Fibers, 1,629 transitions, 48 C184 exact Port bindings, 192 Tsageri Ports, and zero C148 Port bindings.
- Production Vite build, TypeScript and offline standalone export pass. The existing large embedded-source bundle advisory remains.
- Standalone offline QA passes 4 desktop and 3 mobile 390px flows, including browser Back to search. Errors: 0; external requests: 0; horizontal overflow: 0. Evidence: `docs/iteration28g-browser-qa.json`, `iteration28g-lentekhi-ports-mobile.png`, and `iteration28g-search-mobile.png`.
- Detailed implementation and policy record: `docs/ITERATION-28G-OPERATIONAL-SEARCH-AND-PORT-POLICY.md`.

## Iteration 28F — aggregation operational projection and organization search

- **755/755 repository tests pass**, including 18 focused 28F/query tests. Coverage includes exact aliases, the 14-query catalog, no fabricated Tsageri C148 Port binding, all 48 Lentekhi C184 bindings, independent Port occupancy, source occurrence preservation, exact AP/Closure/Aggregation context, Port38's SC224→SC225 path, and no topology count changes (1,629 active Fiber transitions; 192 newly activated 28D Port records remain stable).
- Machine projections regenerate deterministically. `migration/iteration28f/determinism.json` records SHA-256 values for both projections and reports.
- Aggregation inventory: Tsageri 192 C148 Fibers / zero exact per-Port bindings / unknown Port occupancy; 33 in use, 156 unused, three review-required. Lentekhi 48 C184 Fibers / 48 exact Port bindings / all 48 Port occupancy states unknown; 12 in use, 14 unused, 22 unknown.
- Organization inventory: four exact-name organizations; 29 logical strand groups; 236 unique local Fiber legs on 27 Cable Segments; 22 exact Port bindings; two exact Aggregation paths; 21 traversed Closures. All remote context is derived from current exact Fiber paths; direct source-label occurrence IDs and Shape provenance are retained.
- TypeScript compilation passes. The Vite production build passes using its config runner (`vite build --configLoader runner`); the existing large embedded-evidence chunk advisory remains. The offline standalone export is regenerated.
- Desktop standalone QA passes seven 1440px flows and mobile QA passes three 390px flows: Organization-first Magti search, Tsageri unknown Port state, Lentekhi exact Port/Fiber inventory, organization/Cable/Closure query outcomes, and mobile layout. Browser errors/warnings: zero; external requests: zero; horizontal overflow: zero. Results: `docs/iteration28f-browser-qa.json`; mobile screenshots: `docs/iteration28f-aggregation-mobile.png` and `docs/iteration28f-organization-mobile.png`.
- Reports: `docs/ITERATION-28F-AGGREGATION-OPERATIONAL-PROJECTION.md` and `docs/ITERATION-28F-ORGANIZATION-SEARCH.md`. The 28F projections are read-only with respect to topology and usage assignments; changes to the topology revision, Port bindings, or 28E usage evidence require a rebuild.

## Iteration 28E — Fiber operational-use line grammar and path projection

- Source B style grammar: `tsageri-alpana-tvishi-fiber-usage-line/1`; source SHA verified against both cached extractions. The complete pass accounted for 3,092 colored line geometries and 2,928 numbered marker representations across 42 banks. Effective colors/patterns: blue `#0000FF`/1 = unused; green `#00B050`/1 and `#009945`/1 = OpenNet internal; red `#FF0000`/1 = in use; red `#FF0000`/2 = review required. No colored line remained unexplained.
- Dispositions: 2,603 blue unused; 230 green OpenNet (four exact OTDR); 30 red named organization; 192 red organization unknown; 28 per-occurrence red-dashed reviews; five alignment reviews; four rejected non-Fiber graphics.
- Current projection: all 2,088 local Fiber legs have an independent state, with 306 in use, 1,431 unused, 17 review required and 334 unknown. It is revision-bound to the 28C exact resolver. Every unused record retains unknown availability/allocation/condition. Four line/organization conflict records require review.
- **743/743 tests pass.** Focused 28E regressions verify effective-style counts, physical marker color independence, exact OTDR Shapes, named company evidence, C161/F11→C164/F23 remapping, 2,088 local views, unchanged 1,629 transition records, 216 Source B logical Ports, and 192 new active AP bindings. All prior topology, Source A, AP/Port, and source identity suites pass.
- TypeScript compilation and production build pass. Vite retains a large-chunk advisory; the app bundle is about 9.8 MB because operational-line evidence is embedded for standalone/offline use. The offline standalone prototype is regenerated.
- Desktop/standalone QA: seven flows at 1440px; mobile: two flows at 390px. QA covers the C148/F20 Magti label from the Cable Inspector, original label Shape evidence deep link, C161/F11→C164/F23, Magti/OTDR/unused/review queries, 28 separate red-dashed cases and append-only review decisions. Browser errors/warnings:0; external requests:0; horizontal overflow:0. Screenshots: `docs/iteration28e-fiber-mobile.png`, `docs/iteration28e-review-mobile.png`; machine results: `docs/iteration28e-browser-qa.json`.
- Two full line/projection generations are byte-identical. SHA-256 evidence: `migration/iteration28e/determinism.json`.
- Engineering review UI writes append-only browser-local decisions and does not mutate raw evidence or topology. Source line/label Shape links retain their Source B scope.
- Artifacts: `migration/iteration28e/fiber-usage-line-audit.json`, `fiber-lineage-usage.json`, `review-queue.json`, and `usage-summary.json`; browser evidence will be recorded in `docs/iteration28e-browser-qa.json`.

## Iteration 28D — Source B AP / Port grammar and network-use certification

- **737/737 tests pass**. Fifteen new tests cover AP42 evidence, all-source scan, independent extraction hashes, seven real negative Shapes, bank numbering, green Fiber/Port separation, actual drawing offsets, competing alignment rejection, independent occupancy, canonical enrichment, preserved Source A bindings, Port/Fiber/Query signature equality, F11's new AP49 endpoint, all-Fiber validity, F118/F32/Port38 regressions, all24 company dispositions, duplicate scopes, review provenance and idempotency/frozen manifest. Historical28C tests continue to certify the original28C snapshot. Log: `docs/iteration28d-test-output.txt`.
- Actual Source B SHA-256 remains `419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d`. All9,707 Shapes and64 top-level groups are scanned; AP grammar matches9/rejects55. All2,302 certified transition-marker endpoints independently agree with decoded numeric bank labels.
- Source inventory:216 Ports/bindings across AP41–49; AP41 is retained as overlapping source evidence without modifying its frozen entity/status/bindings. New active AP42–49 inventory:192 Ports/bindings,10 in_use/181 unused/1 unknown. Source AP47/Port3 is red and remains occupancy unknown with exact Fiber binding. Administrative/commercial/condition claims stay unknown.
- All24 company labels resolve a source-supported local numbered Fiber attachment and generate22 assignments. Source A's31 occurrences/13 assignments remain unchanged. Duplicate Magti occurrences preserve every Shape ID. No rights/services/ownership inferred. Eight precise review cases remain; confirmations are a separate local evidence layer.
- All37 Cables,2,088 Fibers and1,629 transition records remain unchanged; transition digests match28C exactly. New Port stops change801 endpoint-path signatures. Current paths:369 exact,1,695 partial,24 termination-participating Fibers,0 ambiguity.475 current Lineages remain; their count is not an invariant. False stops/terminations/unsupported edges/stale identities:0. Source-edge coverage100%. Every current signature validates against the same resolver.
- Two semantic generations and two active audit generations are **byte-identical** across five artifacts. Proof: `migration/iteration28d/determinism.json`. Frozen Source A manifest remains `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.
- TypeScript and production build pass. Log: `docs/iteration28d-build-output.txt`; previous large-bundle advisory remains. Export regenerated at `C:\Users\Beka\Desktop\Visio Alt\fiber-prototype.html`.
- Offline standalone QA: **17 desktop flows at1440px;6 mobile flows at390px**, all24 AP42 Ports, green/white/red status, bidirectional Fiber↔Port navigation, four AP/Fiber Queries, company source link, three actual review cases, F11 AP49 endpoint and prior golden regressions. Browser errors/warnings:0; external requests:0; horizontal overflow:0. Final visual review fixed the desktop status grid's text overlap and confirms readable desktop/mobile Port panels. Evidence: `docs/iteration28d-browser-qa.json`, `iteration28d-ap42-port1-desktop.png`, `iteration28d-ap42-port1-mobile.png`, `iteration28d-review-desktop.png`.
- Engineering reports: `docs/ITERATION-28D-SOURCE-B-AP-PORT-GRAMMAR.md` (all216 per-Port mappings) and `docs/ITERATION-28D-SOURCE-B-NETWORK-USE.md` (all24 company occurrences). No new source import or backend work.

---

## Iteration 28C — authoritative current Fiber paths (historical snapshot)

- **722/722 tests pass**, up from the 708-test baseline. Fourteen current-path tests cover F11's exact SC208 connector and both remaps, all-Fiber consistency, genuine F118 partial, Port38 termination, AP52/F32, C158/F65 remap, canonical identity, node enrichment, physical-adjacency rejection, alternatives, loops, stale projections and source immutability. Full output: `docs/iteration28c-test-run.log`.
- All **2,088 Fibers** and summaries reconcile to one active-graph resolver. **1,270 stale Fiber projections** repaired; **131 historical Lineages** have changed leg membership. **475 unique current Lineages** are generated; 278 previous records remain historical. Current categories: 172 exact Port-to-Port paths, 1,892 genuine partials, 24 participating termination-path Fibers, zero ambiguous paths.
- Critical gates: **zero false partials, zero false terminations, zero unsupported edges, zero stale operational Closure display identities; 100% active source-supported edge coverage**. All current derived signatures match. Two independent generations produce byte-identical audit JSON at `migration/iteration28c/fiber-path-consistency.json`.
- C152/F11 traverses SC208→C154/F11 and continues through SC212's F11→F23 and SC215's F23→F11 remaps to Endpoint49; its other side reaches AGG5 through C151/C150/C148. No endpoint Port/termination is invented. C151/F118 retains its SC207 gap. Port38 remains C184/F38→C181/F06→SC225 explicit termination. F32 remains black, C175/F24→AP52, with no SC218/AP51. C158/F65→C159/F01 remains exact.
- C152 displays **SC207 ↔ SC208 · 144F**. Node enrichment preserves path signatures. Closure grammar/coordinates/GJS, neutral leaf typing, C148 conflict, C172 collision, certified bindings and company assignments remain unchanged. Active counts stay 37 Cables, 2,088 Fibers, 1,629 transition records, including 775 new Source B exact records and 376 overlap proofs. Frozen V1 manifest remains SHA-256 `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.
- TypeScript and production build pass; log: `docs/iteration28c-build.log`. The existing large-chunk advisory remains non-blocking. Standalone regenerated at `C:\Users\Beka\Desktop\Visio Alt\fiber-prototype.html`, with one embedded script, zero linked stylesheets and zero external assets.
- Local-file standalone QA passes **11 desktop flows at 1440px and 4 mobile flows at 390px**. It checks normal selection, full overlay membership, Query/Inspector/overlay signature equality, exact SC208 Splice return, F118, Port38, AP52 Port navigation, SC211 remap, adjacent F12 and engineering diagnostics. Runtime errors/warnings: **0**. Horizontal overflow: **0**. Results: `docs/iteration28c-browser-qa.json`. Visually reviewed screenshots: `docs/iteration28c-f11-desktop.png`, `docs/iteration28c-f11-390px.png`, `docs/iteration28c-f11-remap-390px.png`.
- Root-cause proof, projection dependency hierarchy, metric definitions and remaining genuine source limits: `docs/ITERATION-28C-FIBER-PATH-CONSISTENCY.md`. No new source import, backend or source transition correction was performed.

---

## Iteration 28B — Source B Closure grammar, coordinates, and GIS references (2026-10-01)

- All **708/708 tests pass**. Tests cover source grammar acceptance/rejection, DMS parsing, duplicate reference behavior, stable node identity, unchanged graph data, and retained SC207 Fiber trace behavior.
- TypeScript and production build pass. The standalone export was regenerated at `C:\Users\Beka\Desktop\Visio Alt\fiber-prototype.html`; it embeds one script and no linked stylesheet.
- The source audit matches 11 of 64 structural Closure candidates (SC205–SC215). All repeat `GJS:3019A`; exact prefix/raw text are retained and GIS is a search alias. Coordinate CRS/datum is unknown.
- Browser QA against the exported standalone file passes four desktop flows for SC207/SC211/SC215 labels and Inspectors plus duplicate GIS-reference disambiguation, and one 390px mobile SC207 coordinate/reference flow. The earlier complete Iteration 28 Engineer regression also passed 13 desktop and 4 mobile flows with SC labels and clean logs. Current targeted browser logs: 0 errors/warnings; no tested viewport overflow. Results: `docs/iteration28b-browser-qa.json` and `docs/iteration28-engineer-browser-qa.json`.
- Cables, Fibers, transitions, lineages, JourneySummary, and frozen V1 manifest are unchanged. Existing node IDs/deep links remain; 207–215 display as SC207–SC215. C151/F1 and partial C151/F118 behavior is unchanged.
- Full evidence: `docs/ITERATION-28B-SOURCE-B-CLOSURE-GRAMMAR.md` and `migration/iteration28b/source-b-closure-grammar.json`.

---
## Iteration 28A — Combined Network Route Workspace

- All **700/700 tests pass**. TypeScript and production build pass; the expected non-blocking large JavaScript chunk advisory remains. Standalone export was regenerated at `C:\Users\Beka\Desktop\Visio Alt\fiber-prototype.html`.
- Combined topology covers all **37 active canonical Cables / 2,088 Fibers** across two source documents in one connected physical component. No active Cable is omitted. The SC206 fork displays C169 toward SC216 and C151 toward neutral Node 207 concurrently.
- Physical projection is based on active Cable endpoints. Fiber highlighting remains based on active node-local transitions; physical adjacency does not imply optical continuity. Source B nodes/endpoints without equipment classification remain neutral.
- Browser QA passes **6 desktop and 2 mobile flows** at 390px, including C152/Node 211 navigation, SC206 collapse and Back restoration, C151/F1 optical highlighting and C151/F118 stopping at Node 207. Iteration 28 regression passes **13 desktop and 4 mobile flows**. No horizontal overflow or browser log errors.
- Screenshots and machine-readable results: `docs/iteration28a-network-browser-qa.json` and `docs/iteration28a-*-desktop.png` / `docs/iteration28a-*-390px.png`. Full review: `docs/ITERATION-28A-COMBINED-NETWORK-REVIEW.md`.
- The frozen V1 manifest remains SHA-256 `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.

---

## Iteration 28 — Engineer Query Workspace

- All **694/694 tests pass**, including the query-focused checks and executable 20-question catalog evaluated against active repository data. Results cover exact, partial, conflict, unknown, annotation-only and disambiguation outcomes.
- TypeScript compilation and Vite production build pass. Assets: `index-CaCUoMzH.css` (115.63 kB) and `index-QUx1-gL5.js` (3,497.75 kB). The existing non-blocking large JavaScript chunk advisory remains.
- Standalone export regenerated at `C:\Users\Beka\Desktop\Visio Alt\fiber-prototype.html`: one embedded script, no linked stylesheet. The frozen V1 manifest remains SHA-256 `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`; the active combined manifest was not modified.
- Browser QA passes **13 desktop flows** at 1,440px and **4 mobile flows** at 390×844. All tested viewports have no horizontal overflow; browser logs have zero warnings/errors. Coverage includes cross-document C151/F1 and Back restoration, C151/F118 partial stop, 106 SC211 transitions, C159 mappings including F65→F1, C172 disambiguation, C148 Tube conflict, Port38 termination, F32→AP52 without AP51, Magti non-inference, availability unknown, and selected Source B C172.
- The same QA executed against the exported standalone `file://` artifact (one script, zero linked styles), with query flows and clean browser logs. Artifacts: `docs/iteration28-engineer-browser-qa.json`, `docs/iteration28-engineer-desktop.png`, `docs/iteration28-engineer-mobile-390px.png`.
- F32 is exact because active transitions plus certified Port bindings establish AP52/Port24 and Lentekhi/Port32. C151/F118 remains partial at Node 207; Port38 reaches the source-confirmed termination at SC225. No route-adjacency edge creates Fiber continuity.

---

## Iteration 27D — topology activation and regression (2026-09-30)

- The layered network projection is active after topology certification. Full suite: **688/688 tests pass**; TypeScript compilation and the Vite production build pass. The production bundle retains the existing non-blocking large-chunk advisory.
- Deterministic projection checks account for 1,151 candidates: 775 exact node-local transitions activated, 376 duplicate overlap proofs attached, and zero unexplained candidates. Inventory validation passes with 37 canonical Cables, 2,088 Fiber records, and JourneySummary coverage for every Fiber. C151/F118 remains partial at neutral Node 207; no continuation or termination is inferred.
- C148's 72 Tube-color conflict positions remain preserved. Source B creates no logical Port bindings or company-use assignments. The frozen V1 manifest remains unchanged at SHA-256 `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.
- The production Import Review passes at desktop 1440px, mobile 390px, and embedded standalone 1280px. Manager-facing Source B C172 and C151/F1/F118 desktop/mobile checks pass; the C151/F1 trace reaches C152 via Node 207, while F118 correctly stops there. The established Iteration 26 Port38 desktop/mobile and standalone regression also passes. All browser logs are clean, with no horizontal overflow.
- Standalone export is `C:\Users\Beka\Desktop\Visio Alt\fiber-prototype.html`. Machine-readable results and screenshots: `docs/iteration27-browser-qa.json`, `docs/iteration27d-manager-browser-qa.json`, `docs/iteration26-browser-qa.json`, plus the associated desktop/mobile PNGs.

The following Iteration 27 progress section is historical candidate-stage reporting; its “not active” decision was superseded by Iteration 27D above.

## Iteration 27 progress — 2026-09-30 (candidate is not active)

- The new inbox contains `Tsageri-Alpana-Tvishi.vsdx` (1,540,620 bytes; SHA-256 `419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d`). Generic package and extraction checks pass; two independent gzip outputs match at `05270a1ffc25008270dd434c1bf7f06de40161163f62656db2ecfce52a0c89ea`.
- New-source structural counts are 40 package parts, 1 page, 9,707 Shapes including subshapes, 311 valid Connect rows / zero dangling, 22 Masters, 7 Styles, 39 preserved XML parts, zero unresolved effective colors, and zero comments.
- The source-specific interpreter emits 22 source-scoped Cable label candidates, decodes 42 marker banks / 2,928 unique marker Shapes and derives 1,151 candidate node-local transitions from Visio Connect geometry and marker alignment. Two independent outputs match at `01abbcdc0827d972c0cc0c2272ef934d35cf81c43e594ac6b0e3dbf6b0c62ae3`.
- The exact source direction `ლენტეხი-ხელედის მიმართულება` is preserved at Shape40991; it is not a Fiber transition.
- SC205 and SC206 are exact identity evidence; C149 (24F), C150 (192F), C151 (144F), and C169 (48F) match frozen V1 marker construction at every position. C169 also reproduces all 48 SC206 C150↔C169 transitions. Tsageri Aggregation and C151/C152 remain candidates, not active merges.
- C148 remains a preserved source conflict: its two B marker banks agree, all Fiber colors match V1, and tested SC205 transitions reproduce V1, but Tube colors differ for F121–F192. Canonical merges and Fiber links remain empty.
- **Iteration 27B decision: NOT CERTIFIED; activation withheld.** No Source B canonical entity, Route, FiberLineage, Port binding, company assignment, or topology edge is active.
- Text accounting covers all 3,569 nonempty direct-text Shapes by broad lexical category. It locates 24 company labels and three cut/module notes; their operational assignment/status is unresolved. Port/ODF and full asset/route inventory are uncertified.
- Of 1,151 transition candidates, 376 SC205/SC206 pairs reproduce V1 as cross-document duplicate evidence; 775 candidates elsewhere have no semantic disposition. SC207 remains unresolved with 143 candidate C151↔C152 pairs.
- C148’s physical identity remains a strong candidate independent of its preserved Tube-color conflict. Six source-specific ranges account for F121–F192; no source claim overwrites frozen V1. C169 retains exact 48/48 construction and SC206 mapping evidence but remains unactivated.
- The machine-readable audit and deterministic report are `migration/iteration27/semantic-audit.json` and `docs/ITERATION-27B-SOURCE-B-SEMANTIC-RECONCILIATION.md`. Audit, report and network-manifest generation reproduced byte-identically on two runs.
- Final validation: 677/677 TypeScript/domain tests, 6/6 Iteration 27 inbox tests, TypeScript compilation and production build pass. Build assets: `index-6PBcXOzS.css` (112,554 bytes), `index-xm2pZMXk.js` (2,654,290 bytes; large-chunk advisory remains).
- Standalone export: `C:\Users\Beka\Desktop\Visio Alt\fiber-prototype.html`, 2,767,663 bytes, SHA-256 `01dff2cececaa9feaa9c088541bad2dd591ff7a2dba8796f394da96454ebbc95`.
- Staged import-dashboard QA passes at desktop 1440px, mobile 390px and standalone with one embedded script, no linked stylesheets, no overflow or browser errors/warnings. Combined-route/Closure QA is withheld because Source B is not certified.
- The V1 manifest remains byte-identical at SHA-256 `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.

The V1 manifest remains byte-identical at SHA-256 `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`. See the Iteration 27 reports and `HANDOFF.md` for remaining required work.

## Automated checks

- 667 TypeScript/domain tests pass, 0 fail. Twenty Iteration 26 tests protect the frozen identity, source hash, zero pending reference review, no false field-verification claim, all 24 canonical SC225 outcomes, sixteen termination records, superseded F06 AP-side state, final Port38 journey, Port/usage semantics and the Ambrolauri handoff contract.
- 12/12 certified Python importer tests pass. Iteration 24 package, world-geometry, effective-style and Connect-row behavior remains unchanged.
- TypeScript compilation and the Vite 7.3.6 production build pass. Final assets are `index-6PBcXOzS.css` (112,554 bytes) and `index-C8_mO1xK.js` (2,651,007 bytes). The expected embedded-bundle size advisory remains non-blocking.
- The reference generator ran twice. All six generated JSON files, including the manifest, were byte-identical. The temporary comparison directories were removed after the verified files were promoted to `reference/`.
- The source SHA remains `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`; the certified raw extraction SHA remains `e14e79f5930a1b063db11e4db53d2ac47925fb49ffc3a915449468a54cfb066f`.

## Browser checks

- Four desktop flows pass: the final Port38 route journey, SC225 F06 termination sheet, SC225 Closure outcome summary and engineering reference dashboard.
- The Port38 selected path highlights C184 and C181, stops at SC225, and does not highlight C180. Inspector text contains no AP51, AP53/AP54 candidate or SC223.
- The SC225 termination relationship shows sixteen rows. The `დასრულებული` filter returns exactly those sixteen rows, with no unresolved continuation language or fake outgoing line.
- SC225 Closure summary shows 4 Fibers→AP54, 4→AP53 and 16 known terminations.
- Two 390×844 flows pass for Port38 and SC225 F06 with no page-wide overflow.
- The standalone file loads the same final Port38 termination, contains one embedded script, no linked stylesheet, and has no overflow. All production, mobile and standalone browser logs contain zero warnings/errors.

Machine-readable QA is `docs/iteration26-browser-qa.json`. Screenshots are `docs/iteration26-port38-desktop.png` and `docs/iteration26-port38-mobile.png`.

## Standalone

`C:\Users\Beka\Desktop\Visio Alt\fiber-prototype.html` is 2,764,380 bytes. SHA-256: `5d26235f477894427fa68b467745d90117357775de54d7182cd39ec621fe85c9`.

## Reference acceptance

`TSAGERI-LENTEKHI-REFERENCE-V1` is **READY FOR REFERENCE DATASET V1**. This acceptance covers deterministic source interpretation and the latest owner-confirmed SC225 termination correction. Field verification remains none. Remaining gaps are the Lentekhi 6/5 legacy-number source conflict, details absent from the current Visio, and the unimported Ambrolauri document.

---

# Iteration 24 validation — 2026-09-29

## Importer certification

- The original desktop VSDX was read directly and remained unchanged: 1,223,326 bytes, SHA-256 `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`.
- Two complete v3 extractions produced byte-identical gzip SHA-256 `e14e79f5930a1b063db11e4db53d2ac47925fb49ffc3a915449468a54cfb066f`.
- Package/source counts pass: 41 parts, 40 verbatim XML parts, 1 page, 7,349 Shapes, 2,640 top-level Shapes, 4,709 grouped children, 2,676 direct-text Shapes, 218 Property-bearing Shapes, 203 valid Connect rows, 22 Masters, 7 StyleSheets and one comment.
- The 12-test dedicated Python importer suite passes package discovery, relationships, masters, hierarchy, exact text, translated/rotated/scaled/nested/flipped transforms, master/style resolution, green/white Port fills, Fiber/Tube marker color, Connect integrity, rotated company text and comment preservation.
- The TypeScript Iteration 24 suite covers all 15 certification gates, deterministic hashes, raw anchors, world geometry, effective-style provenance, same-number/remapped/Tube-change transitions, mirrored Port deduplication, company extraction, text reconciliation, active data and Shape-ID deep links.
- Fresh interpretation reproduces 838/838 exact transitions with zero missing/new and never uses Route adjacency. It rebuilds 20 Cable Segments, 1,176 Fibers, 98 Tubes, 192 Port bindings and 384 Port evidence records.
- Text reconciliation is exact: 2,677 = 61 structural + 58 meaningful annotation + 2,558 numeric/layout; unexplained meaningful text is zero.
- All 15 certification gates pass; Critical limitations are zero. The formal result is **CERTIFIED FOR NEXT INTERPRETATION ITERATION**.
- Dedicated importer tests pass 12/12. The complete TypeScript/domain suite passes 616/616, and TypeScript compilation passes.

## Engineering UI and artifacts

- Visio Import exposes the certification result, gate/limit disclosure, active/fresh counts and a Shape ID Source Evidence Inspector. Shape12484, 12487, 15983, 34674, 43430, 43833, 44243, 17661 and 37584 provide compact diagnostic anchors; the complete index remains under `migration/iteration24/`.
- Splice Workspace links source evidence to the engineering diagnostic. Route, Splice and Manager product behavior is otherwise unchanged.
- Certification and evidence reports are `ITERATION-24-VSDX-IMPORTER-CERTIFICATION.md` and `ITERATION-24-SOURCE-EVIDENCE-RECONCILIATION.md`.
- Production build passes with `index-CXzBjj_O.css` (112,175 bytes) and `index-DhmDzQ-W.js` (2,635,728 bytes). The expected large embedded-bundle advisory remains non-blocking for the one-file offline artifact.
- The regenerated sibling `fiber-prototype.html` is 2,748,722 bytes with SHA-256 `9ae391d7bb5e9699bb1542392b13c6063d4fc3a2c13bb2fd39e445b2c84ff519`.
- Browser QA passes two importer anchors, 11 desktop worksheets, the withheld AGG5 case, six branch-node reconciliation views, all change filters, print metadata, Closure photo workflow, five 390px cases including Shape37584, and standalone loading. Browser warnings/errors: zero. Machine-readable results are in `docs/iteration24-browser-qa.json`.

## Limits

There are no Critical importer limits for this file. Universal future-theme evaluation, complete curve tessellation and pixel-perfect native Visio rendering remain non-critical future-file checks. No new company assignment was created; Iteration 25 may now begin from certified evidence.

---

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

# Iteration 25 validation — 2026-09-29

## Deterministic interpretation

- `scripts/interpret-iteration25-source.py` reads the certified Iteration 24 raw artifact and verifies source SHA-256 `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`.
- Two independent semantic runs generated byte-identical company-usage, SC225-routing, Port-interpretation, unresolved-evidence, semantic-diff and summary artifacts.
- All 31 company-label line Shapes are reconciled into 13 graph-deduplicated usage assignments with every Shape ID retained.
- All C181/F01–F24 positions at SC225 are classified: 8 exact, one owner-anchored AP-side with exact AP unresolved, and 15 other unresolved. Twelve source-supported C182↔C183 transitions remain.
- The certified source conflict is explicit: C182→AP53 and C183→AP54 remain active; the opposite expected swap is not projected.

## Automated validation

- 647 TypeScript/domain tests pass, including 31 focused Iteration 25 checks.
- 12 Python importer geometry/source-regression tests pass.
- TypeScript compilation and the Vite production build pass. The expected large embedded-bundle advisory remains non-blocking.
- Final production assets: `index-DtepX95Z.css` 112,288 bytes and `index-C6mlRJt3.js` 2,655,098 bytes.
- Standalone: `C:\Users\Beka\Desktop\Visio Alt\fiber-prototype.html`, 2,768,205 bytes, SHA-256 `d0894db4fda6eefdfc8b9070f29f68ff2aee800b0514ebc57b9ac7eba57d3b2a`.

## Browser validation

- Engineering source review shows the 24-row SC225 matrix, company counts, F06 evidence boundary and C182/C183 source-label conflict.
- Desktop SC225 checks cover C181/F03→C183/F03, unresolved F06 and C181/F13→C182/F01.
- OpenNet, Magti, Silknet and Skytel filters each return exact usage rows and combine with the existing worksheet controls.
- AP53 Port1, AP54 Port3/Skytel and Lentekhi Port5/Magti show the exact local Segment/Fiber and independent physical status.
- Print retains the company attribution while hiding application chrome.
- Three 390×844 checks cover unresolved SC225, AP54 Skytel and the expanded source matrix without document-wide overflow.
- The single-file standalone has one embedded script, no linked stylesheet, correct AP54/Skytel content and no overflow. Browser logs contain zero warnings/errors.

Machine-readable results are in `docs/iteration25-browser-qa.json`. Screenshots are `docs/iteration25-port-print.png` and `docs/iteration25-mobile.png`.

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

## Iteration 27C validation — 2026-09-30

- 683 Node/TypeScript tests pass, 0 fail; importer Python suite: 6/6 pass.
- TypeScript project compilation passes. Vite production build passes; its existing advisory notes the embedded bundle exceeds 500 kB.
- The standalone prototype was regenerated. Desktop 1440px, mobile 390px, and standalone Import Review checks pass with no horizontal overflow or browser error/warning logs. Mobile QA initially exposed gate-label overflow; compact PASS/FAIL labels fixed it.
- Source B transition-ledger tests verify 1,151/1,151 accounting, 775 local marker-to-marker transitions, 376 duplicate-overlap rows, SC207's 143 mappings, 1,512 partial JourneySummary records, no route-adjacency edges, and the unchanged V1 manifest hash.
- Activation remains withheld because asset/Port, company assignment, annotation scope/status, and SC207 Closure identity gates remain unresolved.

Machine-readable results: `migration/iteration27/source-b-transition-ledger.json`, `migration/iteration27/source-b-fiber-journey-summary.json`, and `docs/iteration27-browser-qa.json`.


