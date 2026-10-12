# Fiber Atlas — current handoff

Updated **2026-10-12**. **Iteration 36 is delivered and verified locally.** Review selection/source loading is independent, reads/crops are cached and selective, and the viewer reuses static geometry. The tested bounds index still needs separate owner deployment; no owner database migration was performed.

Read [the implementation review and index deployment/rollback](docs/ITERATION-36-IMPLEMENTATION-REVIEW.md), [Iteration 36 requirements and diagnosis](docs/ITERATION-36-REVIEW-PERFORMANCE.md) and [measured baseline](docs/iteration36-review-performance-baseline.json). The complete Iteration 35 handoff, including all delivery/test details, is preserved [byte-for-byte in the archive](docs/archive/HANDOFF-THROUGH-35-2026-10-12.md).

## Next priority — import completeness and keeping confirmed corrections

The October 12 planning review independently confirms the **AP20 20-versus-24 source contradiction**, the local capacity fix, and the still-active **20F** owner review object. Read [Iteration 37 review and worker requirements](docs/ITERATION-37-IMPORT-COMPLETENESS-REVIEW.md). Three AP20 tests, eight Python source-audit tests and nine correction tests passed independently; no owner writes occurred.

**Clarification to the deployment instruction below:** current reconciliation offers accepting the fresh source for all disagreements, but no explicit retain-current-correction choice. Accepting that proposal and then Add can replace confirmed AP18/other bindings with the drawn source mappings while keeping their history. The current stale/acknowledgment guards prevent silent activation; the missing capability is preserving the owner's chosen corrections during this source upgrade. Do not present generic reconciliation acceptance as automatically preserving active mappings.

| Task | Status | Required next result |
| --- | --- | --- |
| **37-01 — Explicit retain/replace decisions** | Ready | Retain validated chosen corrections, accept fresh source, or leave staged; whole-bank decisions remain atomic and no choice is automatic. |
| **37-02 — AP20 upgrade with existing corrections** | Ready after 37-01 | Isolated full comparison restores F21–F24 while retaining chosen AP18/other decisions; all-24 AP20 Remap remains separate. |
| **37-03 — Discoverable source-version upgrade** | Ready | Reprocess the saved source from its current entry, showing an available interpreter update and preserving document identity/history. |
| **37-04 — Remaining import completeness audit** | Ready | Explain rejected bank/pair associations by exact source evidence; account separately for inventory, graph facts and unknowns. |
| **37-05 — Regression and owner handover** | Ready after 37-01–03 | Complete impact preview, preservation/stale/source checks and clear owner activation steps; no worker owner-server mutations. |

The regenerated artifact still has four unassociated physical bank pairs: **25016↔25017, 23↔25039, 25118↔25119, 25124↔253138**. These are investigation targets, not inferred connections. Its **583 source-only cases** must not be confused with **581 open cases** in the manually corrected active revision. The performance index deployment is separate and cannot repair import completeness.

## AP20 source-capacity correction — 2026-10-12

- **The earlier AP20 20F diagnosis below is superseded.** The owner's screenshot and preserved real source establish **24 AP Ports and a 24-Fiber Cable** between SC25024 and AP20. Raw label `25-134-25024-20-20` (Shape78894) conflicts with complete F1–F24 banks 11797/12096, FO24 texts 11798/12097 and 24 explicitly docked physical-span lines 11562–11585.
- The importer previously required the label capacity to match before associating banks, then allocated only 20 Fibers from that label. `shida-source-local-semantics/3` resolves a mismatch only from a unique physical span, full unique printed numbering at both ends, complete same-number drawn span coverage, matching explicit FO capacity texts and an unambiguous label inside that span. AP Port count, color, route adjacency or proximity alone never resolve capacity. Incomplete/ambiguous evidence remains unresolved.
- Original raw label and all evidence are preserved in a `source_cable_capacity_conflict` and Cable-scoped review case. Review metadata now distinguishes this from Fiber-color conflicts; it opens the Cable without inventing a Fiber number. Printed source Port displacement remains unchanged until explicit owner Remap.
- Full preserved source recompilation produces **176 Segments / 9,360 Fibers / 1,759 transitions / 789 drawn-source bindings / 583 review cases**, before owner correction/reconciliation. Exactly one capacity override is supported. Other Cable/Fiber topology, node transitions and other AP identities/bindings remain unchanged; interpreter provenance and source diagnostics may refresh. See `docs/ap20-capacity-source-audit.json`.
- Verification: **844 TypeScript tests**, **50 Python importer tests**, **7 affected backend tests / 143 assertions**, both type checks, PHP formatting, production build and standalone export pass. Backend replay uses the actual6.7MB Shida file and verifies upload, geometry reprocessing,24Ports/24Fibers, retained capacity conflict, preserved original inventory/source bytes and separate isolated Add. Capacity-vs-color review links and existing review scope/authentication/stale-version guards pass. Mutation tests used only guarded local isolation; its database was stopped afterward.
- **Owner deployment remains pending.** A read-only probe still finds the current live AP20 Cable at 20F in `CORRECTION-dce024db-ad8c-4743-b748-16bb1162c524`. Refresh alone cannot change stored data. Reprocess the preserved Shida inventory run, review/reconcile prior human corrections, then separately Add the corrected proposal. Afterward owner Remap must preview **all 24**, including F21–F24. Do not reset/reupload or silently overwrite current owner bindings/history. No worker owner writes were performed.

## Earlier AP20 Remap follow-up — generic range support, superseded source diagnosis

- The earlier fix addressed the imported 20F record by allowing a complete smaller Cable within a larger AP bank. This remains useful generic support, but **it does not repair AP20's import mistake**. The owner's real AP20 source has 24 Fibers; Ports21–24 must not be presented as spare merely because the old import truncated the Cable.
- The preview shows the exact affected range and untouched count. Existing displaced bindings of the selected Cable beyond its target range are explicitly included as cleared rows, with full provenance and exact group reversal. Other-Cable bindings inside the target range, incomplete/duplicate numbering, ambiguous source scope and occupied external endpoints still fail validation. This is an owner-confirmed correction, never an automatic same-number decoder rule.
- Remap's confirmation checkbox consistently uses `owner_confirmation`; the evidence-basis selector cannot submit contradictory geometry-only confirmation. Changing the Cable clears acknowledgment. Draft, validation, explicit Apply, stale-state checks and source reconciliation remain separate.
- **841/841 TypeScript tests**, **14 affected backend tests / 256 assertions**, both type checks, build, PHP formatting and standalone export pass. Six desktop/mobile (1440/390px) workflows pass: 20-Fiber bank, existing 24-Fiber bank and individual Port7→F13 correction. Checks include preview/reload, explicit Apply, review member identity, unused-Port cases staying open and reversal. Reports: `docs/ap20-partial-bank-browser-qa.json` and the existing bank/individual QA reports. The running owner page serves the rebuilt asset `index-D7-o2_yc.js`; refresh the browser. No owner bindings or review decisions were changed by the worker. Both isolated QA services were stopped after testing.

## Iteration 36 original baseline — historical evidence

- Iteration **35-01–05 are Done locally**: place-first navigation, bounded local connections, shared compact journeys, review evidence and typed corrections/reconciliation. 35-06 automated QA is done; owner/first-time-user acceptance remains pending.
- Read-only owner-app checks on October 12 found active revision **`CORRECTION-dce024db-ad8c-4743-b748-16bb1162c524`**, **606 cases / 581 open / 25 reviewed**. This supersedes the October 11 report's active revision and 605 open count. The owner is continuing to work; read current state rather than hard-code these values. Reviewed is not equivalent to a confirmed network fact.
- A selected open Port case took **1.49s for details** and **2.29s for source evidence**; repeating the same evidence still took **2.43s**. Starting the three requests currently associated with selection together took **5.38s**. The crop had only **92 Shapes / 171 KB**, and almost all the delay was before the first response byte. This is a small endpoint sample, not a browser/p95 or SQL benchmark.
- Before Iteration 36, the UI reloaded list/detail/evidence together on case selection and each endpoint reconstructed the review context. The implementation below supersedes those loading/rendering defects. The Windows development server, full startup and pending owner bounds index remain separate follow-ups.
- The archived planning pass changed documentation and recorded timings only; the worker implementation is documented below. It did not edit application code, restart services, import, apply/reverse corrections, or mutate owner topology.

## Worker tasks — Iteration 36

| Task | Status | Required result |
| --- | --- | --- |
| **36-01 — Baseline and phase profiling** | Done locally — SQL/phase/browser evidence | Query counts/timing, crop plan, browser waterfall, representative case types and desktop/mobile. |
| **36-02 — Independent list/case/evidence loading** | Done locally | Case changes do not reload the list; stable scroll/navigation; deduplication, correct stale-response handling and bounded revisit caching. |
| **36-03 — Selective server review reads** | Done locally | One-case reads avoid rebuilding every case; batch binding/source checks; separate immutable metadata from changing review state. |
| **36-04 — Fast exact-run source crops** | Done locally; owner index deployment pending | Correctly scoped geometry cache and measured lookup/index improvement, preserving complete evidence identity and truncation behavior. |
| **36-05 — Smooth drawing and independent review startup** | Done locally | Pan/zoom reuses static geometry; reading review cases does not load/hydrate the full graph; map/correction can load it when needed. |
| **36-06 — Measured acceptance and regression checks** | Done locally; owner acceptance pending | Before/after timings, request-count proof, cache freshness/source isolation/correction safeguards and updated reports. |

Deliver the repeated-request/server-read improvements first, then crop and rendering improvements. Targets for the warmed app: **p95 explanation ≤500ms**, **p95 source drawing ≤1s**, **cached drawing ≤200ms** on the documented QA dataset/device. These are targets to verify, not current performance claims. Record a precise remaining cause if a target is missed; do not declare Done for cosmetic loading changes.

Update each task to In progress, Done with evidence, Blocked with a precise dependency, or Deferred with a reason and named follow-up. The detailed requirements define profiling and correctness acceptance. No new topology engine, framework migration or general source reinterpretation belongs in this iteration.

## Iteration 36 result and next deployment

- **838 TypeScript tests**, **23 backend tests / 2,467 assertions**, both type checks, build, formatter and standalone export pass. The 80-selection actual-Shida browser run meets all QA targets: desktop/mobile p95 explanation **≤371ms**, first-pass drawing **≤895ms**, cached drawing **≤91ms**. Each viewport has 20 selections + 20 revisits across four categories (13 distinct cases; sparse categories repeat). The documented device is Windows/headless Edge with local PostgreSQL, not a physical phone or live-server p95.
- Direct review entry sends **one list request / zero graph requests**. Case clicks send no list requests; cached revisits and note/filter-only changes send no geometry requests. Immutable geometry is bounded to 64 entries/32MB/15min in the browser; private derived disk artifacts to 256 entries/128MB/16MB per entry/one day. Exact source/run/page/anchor/bounds/version keys and authorization checks remain. Corruption/expiry fall back; missing anchors still fail.
- Mutable versions/history/counts and active/writable state are not cached with immutable metadata. Source/binding checks are batched, ancestry takes one bounded SQL query, and a cold selected-case read does not load all cases. Other-tab notes refresh the right state without reloading geometry; role changes clear/revalidate it. Writes still reject stale versions. Corrected Port cases keep exact member identity.
- The memoized source viewer performs **zero static geometry rebuilds over a 30-step pan** and retains Fit, capture/cancel, colors/affine transforms and explicit truncation. Source and detail/error readiness are independent and keyed; late A/B errors cannot appear under a new case.
- **Read-only live comparison**: detail **444ms vs 1,486ms baseline**; repeated drawing **498ms vs 2,429ms**. Gzip transfers the sampled drawing in **8.8KB**. First uncached live drawing still takes **2,344ms**, about **1,902ms in crop lookup**, because the owner has no `source_shapes_bounds_gist` index. This is the precise remaining deployment cause, not a claimed owner p95 result. Active revision/counts were unchanged during that probe.
- The index and index-only rollback/reapply are tested on the disposable 62,670-Shape copy. **Do not silently run it on bkhorguashvili.** Concrete commands and rollback are in the implementation review. The app remains compatible without it; cached/improved selective reads are already served by the updated code. Refresh the browser to get the new JS.
- Correction/map/reversal desktop/mobile, whole-bank Remap, reprocessing/staged review/separate Add, and 12 standalone Tsageri workflows were rechecked. No owner network/review writes, service restart, real source import/reprocessing or schema migration was performed. Owner acceptance, source backlog, PERF-STARTUP and PERF-SERVING remain open.

## Product direction to preserve

**Find a place → see nearby connections → select a Port/Fiber → follow its journey.** Use a bounded local schematic and the complete known optical path with explicit gaps. Engineer Search is the question-based entry into that same journey. Keep **Network · Engineer Search · Visio Import · Needs Review**.

Give a direct explanation first; display the exact source drawing independently as it becomes ready. Keep list navigation available during loading. Do not remove evidence, force extra steps, reintroduce the long default tree, or hide slow operations behind animation.

Preserve `#/place` source/focus/selection/retained-strand/expansion state, stable deep links and Back/Forward. Legacy Tsageri uses typed closure/segment memberships; Shida uses scoped IDs and provenance. Filename or AP-number matching cannot replace those identities.

## Corrections and accepted topology

- **AP18 bank Remap is delivered and was applied by the owner.** The October 11 live verification confirmed all 24 same-number bindings and AP18/Port1↔F1. This was an owner-confirmed correction of a displaced bank, not a universal decoder numbering rule. October 12 performance checks did not re-audit every binding; preserve the owner's current revision.
- Remap supports a complete unique 1–M AP bank and a complete 1–N Cable range with **N ≤ M**, maximum 256 Ports. Unaffected Ports and their other-Cable bindings are preserved. Mixed Cable bindings inside the affected range, ambiguous/missing banks and conflicting endpoints are refused. Individual intentional unequal-number bindings remain valid.
- Preserve draft → validated old/new impact comparison → explicit Apply, digest/revision/subject-version checks, atomic bank replacement, full-group reversal, actor/reason and original source history. Root review subject IDs must not cause a corrected Port1 case to display another member's binding.
- Events can change review status without changing the network revision. Cached counts/list/history must reflect new notes and decisions; active/historical/writable state must remain current. An immutable historical view excludes future events and does not adopt a newer run's evidence.
- Reprocessing compares manual corrections and requires explicit reconciliation; it never silently replays them. Separate Add is still required. Historical/staged correction views remain read-only.
- Keep **AP16/Port13 → SC25017 → AP17/Port13**, F13 on `25-123` and `25-124`, excluding `25-122`. AP16 Ports1/10 remain partial after their known local bindings. Preserve Tsageri SC217→Lentekhi regressions and source-scoped regional AP identities.
- An AGG is an endpoint only when the accepted optical path reaches it. Playback/order does not prove traffic direction, health or optical continuation. Unknown continuation is not termination. Performance work must not invent or remove edges.

## Source backlog and historical counts

The original applied Shida result was **176 Segments, 9,356 Fibers, 1,759 transitions, 1,272 canonical Ports and 766 exact bindings**. Its original coverage was 96 exact / 9,260 partial selected-Fiber paths and 606 review cases, including eight conflicts. These are **pre-correction historical counts**, not a current live mapping audit. Do not reset, reseed or repeat Add to recreate them.

Continue the [Iteration 34 digitization backlog](docs/ITERATION-34-DIGITIZATION-BACKLOG.md) separately: the original diagnostic classification included 406 Port association rejections, 98 marker-attachment outcomes and two undiagnosed scan cases, plus bank/container/pair and annotation/Tube/aggregation questions. Owner corrections do not automatically fix the decoder. Prefer evidence-backed shared-cause improvements.

Preserve source SHA `e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060`, exact run/page/Shape evidence and the bounded owner-confirmed Shida drafting-gap rule. No automatic renumbering, shade equivalence, duplicate merging or global tolerance expansion.

## Working boundaries and verification

The owner app is **http://127.0.0.1:8000/**, launched by **Start Fiber Atlas.cmd**. Preserve internal PostgreSQL `10.0.61.15:5432/on`, schema/login `bkhorguashvili`, TLS and protected credentials. The owner imports and applies changes. Read-only timing checks are permitted for diagnosis; do not reset/reimport, change mappings, activate/reverse proposals or run migrations against the owner's server during this task.

Test mutations and any derived-index migration/backfill in guarded disposable `fiber_atlas_test / fiber_isolation` only. QA API/PG on 8010/55432 were stopped after Iteration 35; its guarded fixture helper is `.dev-runtime/prepare-iteration35-browser.php`. Preserve saved source artifacts. If a database/runtime deployment is needed, provide the tested step and rollback separately rather than silently switching the owner service.

Preserve bounds: 256 local Cables / 4,096 local Fibers, correction comparison at most 25,000 Fibers / 200,000 changed facts, complete paging with explicit oversize failure. Retain exact source geometry and partial/ambiguous states.

Prior evidence and guides: [validation](docs/VALIDATION.md), [Iteration 35 implementation review](docs/ITERATION-35-IMPLEMENTATION-REVIEW.md), [correction/reconciliation review](docs/ITERATION-35-PORT-CORRECTION-REVIEW.md), [owner guide](docs/ITERATION-35-OWNER-GUIDE.md), [Iteration 34 review](docs/ITERATION-34-IMPLEMENTATION-REVIEW.md). Historical tests do not certify new caching/index behavior; rerun affected checks and report actual results.

## Named follow-ups

- **PERF-STARTUP:** reduce the approximately 10MB main JS bundle and last-measured 40.9MB decoded operational payload; split offline/advanced modules and defer unnecessary full-Fiber work. Review's startup independence is already required in 36-05.
- **PERF-SERVING:** prepare concurrent serving before shared production use, tested on the chosen OS. The current Windows PHP built-in server handles requests sequentially; its Unix multiple-worker setting is not a Windows solution. See the linked technical basis in Iteration 36 requirements.
- Owner/first-time-user acceptance, source-decoding backlog, and concise Engineer Search answer refinement remain open. Performance improvement is not universal Visio certification.
