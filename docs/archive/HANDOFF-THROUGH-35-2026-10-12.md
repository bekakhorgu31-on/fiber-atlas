# Fiber Atlas — current handoff

Updated **2026-10-11**. **Both Iteration 35 deliveries are Done locally (35-01–05).** The place/journey/evidence workspace and typed Port-binding draft → validated impact comparison → explicit owner activation now work. Source reprocessing compares human decisions and requires explicit reconciliation of disagreements. Owner and first-time-user acceptance remain pending; the source-decoding backlog and initial payload reduction remain open.

Read [the correction/reconciliation review](docs/ITERATION-35-PORT-CORRECTION-REVIEW.md), [the first-delivery review](docs/ITERATION-35-IMPLEMENTATION-REVIEW.md), [owner guide](docs/ITERATION-35-OWNER-GUIDE.md), [Iteration 35 requirements](docs/ITERATION-35-PLACE-JOURNEY-AND-CORRECTIONS.md) and [concept review](docs/ITERATION-35-CONCEPT-REVIEW.md). The previous delivered handoff is preserved [byte-for-byte in the archive](docs/archive/HANDOFF-THROUGH-34-2026-10-10.md).

## Product direction

**Find a place → see nearby connections → select a Port/Fiber → follow its journey.** Replace the default full recursive tree with a bounded local schematic. Give the direct answer first and retain the complete known optical path, explicit gaps and an optional finite walkthrough. Keep the full inventory and advanced overview available separately.

Engineer Search is the question-based entry into the same journey. Preserve **Network · Engineer Search · Visio Import · Needs Review**. Do not build another topology engine or remove evidence to make the UI look cleaner. Data correctness and presentation are separate responsibilities.

Interactive concept (two complementary entries, verified source examples, no live writes):
`C:/Users/Beka/.codex/visualizations/2026/10/02/01a0fd27-0367-72d2-8f0a-98aee608ae49/fiber-atlas-place-and-journey.html`

**Place workspace** is the recommended Network default. **Question workspace** is the complementary Engineer Search experience. Production must support the full scoped inventory; the concept only demonstrates three examples. The worker may refine layout while preserving the behavior and acceptance criteria.

## Worker tasks

| Task | Status | Required result |
| --- | --- | --- |
| **35-01 — Place-first entry and navigation** | Done locally | Scoped finder/inventory, clear location, stable deep links and Back/Forward. |
| **35-02 — Local graph and Port/Cable exploration** | Done locally | Immediate neighbors, direct Port/Fiber access, bounded expansion and explicit advanced overview. |
| **35-03 — Shared compact journey and playback** | Done locally | Answer first, all known path context, honest gaps, optional finite playback, shared across search/map/review. |
| **35-04 — Actionable review evidence** | Done locally | Plain issue explanation, highlighted rejected endpoint, readable source context and reachable decisions. |
| **35-05 — Typed Port-binding correction** | Done locally | Exact connection draft → validated impact preview → explicit owner activation of an immutable revision. |
| **35-06 — Verification and owner acceptance** | Both-delivery QA Done; owner acceptance pending | Desktop/mobile, source/route parity, navigation, correction safeguards, screenshots and updated guides. |

Deliver **35-01 through 35-04 first** as a usable presentation improvement. Deliver **35-05** when the actual validation/activation workflow works; do not mark it Done for a comment-only form. Use 35-06 for both deliveries. A restyled long tree is not acceptance.

Update statuses to In progress, Done with evidence, Blocked with a specific dependency, or Deferred with a reason and named follow-up. Preserve prior results as history. The 2026-10-10 planning chat changed only documentation/concept; the 2026-10-11 worker delivered the first product milestone. No first-time-user comprehension acceptance is claimed.

## Owner-confirmed AP18 bank correction — 2026-10-11

The owner confirms the AP Port bank was shifted left while the Cable marker bank stayed straight. The saved local active-draft snapshot shows **F1→Port2 through F23→Port24**, with Port1 unbound, on `25-128-25020-18-24` (SC25020 ↔ AP18 · Kvemo Shakshaketi · 24F). The owner authorizes the corrected bank rule **F1→Port1 through F24→Port24**. This supersedes the earlier instruction to leave AP18's exact mapping unconfirmed. It is owner-confirmed interpretation, not newly decoded source geometry or field verification.

**Remap** is now implemented in the AP place workspace and active Port correction panel. An authenticated reviewer chooses one incident Cable, confirms this whole bank's 1→1 rule, records exact-run evidence/reason, saves a draft, validates the complete comparison and separately Applies. All affected bindings are replaced atomically; individual occupied-endpoint protection remains. The worker verified AP18 in a local copy of the previously saved snapshot; **no owner-server read, mapping write or activation was performed**. The owner must Apply to update their active network.

Only a complete unique 1–N AP bank paired with an equal-size 1–N Cable is supported (maximum 256 Ports). Mixed-Cable, duplicate/missing numbering, cross-source or conflicting local transitions are refused. Remap is a reusable per-bank operator action; **it is not a universal source-decoder numbering rule**. Existing intentional remaps remain valid. Per-Port old/new connections, group identity, actor, evidence, original geometry and revision history are retained. Reversal restores the entire group after stale checks. Reprocessing compares every member and never silently replays the manual bank correction.

The source snapshot scan found **one complete uniformly displaced candidate: AP18**. Other partially decoded or irregular banks still require source investigation; this scan does not certify them. Evidence and limitations: [correction review](docs/ITERATION-35-PORT-CORRECTION-REVIEW.md), `docs/iteration35-bank-remap-source-audit.json`, and `docs/iteration35-bank-remap-browser-qa.json`.

## Applied Remap / Needs Review display correction — 2026-10-11

After the owner reported Remap still appeared in the validation list, **read-only app requests** confirmed active revision `CORRECTION-f56ebb5a-4100-4374-a432-6e9c8304ad5e`. All **24** live AP18 bindings are F1→Port1 through F24→Port24. AP18/Port1 is resolved, closed and absent from `status=open`; the sidebar review count is **605**. The worker did not activate, modify or reprocess any owner mapping. The earlier “owner must Apply” statements describe the prior delivery; the owner has now done so.

The misleading presentation came from an All/history default and closed rows still saying “binding unknown / network fact unchanged.” Needs Review now defaults to **Open**, including clear-filters; explicit All/Reviewed history remains available. Corrected rows say the connection was corrected/applied, and details show the exact current Port/Fiber with the original source under disclosure.

A bank started from a review case gave several member records the root subject ID, so review metadata incorrectly chose Port24 for the Port1 case. Correction lookup now also requires the case’s exact affected Port ID. Current AP18/Port1 readback is **Port1↔F1**. Regression checks cover review-origin whole-bank Apply, the proper member, closed/open/history filters, original historical revision, and reversal reopening Port1. Existing immutable bank history and graph are unchanged.

Final targeted tests: **13 backend tests / 222 assertions**, application typecheck, build/export and desktop/mobile correction/review QA. Live verification was read-only; test writes stayed in disposable isolation. Use **Codex → Luna → Medium → Fast off** for routine follow-up UI work.

## Preserve the accepted topology and source backlog

- The owner reports the partial Shida result was applied: **176 Segments, 9,356 Fibers, 1,759 transitions, 1,272 canonical Ports, 766 exact bindings**. The planning chat has not queried the live revision. Do not repeat import/Add or treat the database as empty.
- Existing coverage: 96 exact selected-Fiber paths, 9,260 partial paths; **606 review cases, including eight conflicts**. Partial paths are impacts, not independent defects. Review disposition does not resolve a network fact.
- **AP16/Port13 → SC25017 → AP17/Port13** uses F13 on `25-123` and `25-124`, excluding the unrelated `25-122` direction. AP16 Ports1/10 remain partial after their known local bindings. Keep Tsageri/SC217→Lentekhi regressions and source-scoped regional AP identity.
- An AGG is shown as an endpoint only when the accepted optical path reaches it. Schematic ordering and playback do not establish traffic direction, operational health or optical continuation. Unknown continuation is not termination.
- The [Iteration 34 digitization backlog](docs/ITERATION-34-DIGITIZATION-BACKLOG.md) remains required source work: 406 Port association rejections, 98 marker-attachment outcomes, two undiagnosed scan cases; bank/container/pair investigations and remaining annotation/Tube/aggregation questions. These are diagnostic classifications, not accepted mappings. Prefer evidence-backed improvements that address shared causes over hundreds of manual overrides.
- Preserve source SHA `e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060`, the bounded owner-confirmed Shida drafting-gap rule and all original geometry/history. No automatic renumbering, shade equivalence, duplicate merge or global tolerance expansion.

## Current implementation and working boundaries

Iteration 34 is **Done locally**, with a persisted case index, grouped lists, source crops, review events and diagnostic ledger. Read its [implementation review](docs/ITERATION-34-IMPLEMENTATION-REVIEW.md), [owner guide](docs/ITERATION-34-OWNER-GUIDE.md) and [validation](docs/VALIDATION.md). Its test evidence is historical for this new work. Ordinary review notes/proposals leave the graph unchanged. The separately validated typed correction activates an immutable revision. Historical/staged correction contexts remain read-only; fresh-source reconciliation is explicit and precedes a separate Add.

The owner app is **http://127.0.0.1:8000/**, started with **Start Fiber Atlas.cmd**. The owner personally uploads and applies sources/corrections; the worker only exercised activations in guarded local fixtures. Preserve internal PostgreSQL `10.0.61.15:5432/on`, schema/login `bkhorguashvili`, TLS and protected credentials. Do not reset, reseed, reimport, alter mappings or activate proposals on the owner's server. Test mutations only in the guarded disposable local schema/storage.

For Iteration 35, report actual checks, unchanged route signatures, proposal/activation behavior, limitations and remaining source gaps. UI improvement is not universal Visio certification. The owner should be able to understand a known route, a partial route and an unknown binding before opening technical details.

## Iteration 35 delivered evidence and next worker

- **829 TypeScript tests**, **47 Python tests**, **5 affected backend tests / 61 assertions**, **47 browser workflows** (33 actual Shida + 2 navigation/keyboard + 12 preserved Tsageri). Both type checks, build, formatter and standalone export pass. No JS errors or horizontal overflow were found. Resolver signatures and owner data are unchanged.
- Initial Shida operational payload remains **40.9 MB decoded**; local selection adds no graph request, and AP18 evidence is bounded to **171 KB**. Initial payload reduction remains a follow-up. See the implementation review, validation and three Iteration 35 browser reports.
- QA services on 8010/55432 are stopped after validation. Final backend tests reset only disposable isolation. Preserved candidate/geometry files remain available; `.dev-runtime/prepare-iteration35-browser.php` restores the audited local fixture without re-extraction. Owner app/database were not queried or changed.
- **35-05 is Done locally.** Validation evidence: **832 TypeScript tests**, **16 backend tests / 6,579 assertions**, then **8 focused correction/review tests / 127 assertions** after final guards. Desktop/mobile known **Port7→F13** draft/preview/apply/reversal and synthetic reprocess conflict/reconciliation/Add pass. Actual Shida **33 workflows** and Tsageri standalone **12 workflows** were rerun after integration; navigation/keyboard evidence remains in its report. At that delivery no AP18 mapping or owner-server operation was performed; see the later owner-confirmed bank correction above.
- Next work: owner acceptance, the existing source-decoding backlog, and initial payload reduction. Routine interface cleanup/documentation fits **Codex → Luna → Medium (Low for mechanical edits) → Fast off**. Source/topology/data-integrity decisions may warrant Sol Medium; do not use Astra, extra credits or a banked reset for routine work.
- Preserve `#/place` source/focus/selection/retained-strand/expansion state, the shared resolver and exact-run evidence. Older Tsageri documents use typed `closure:`/`segment:` memberships; Shida uses scoped IDs and explicit provenance. Do not substitute filename/AP-number matching. The database server deliberately redirects offline-mode URLs; test the preserved offline reference through the exported standalone file.
- Keep correction activation tests in guarded disposable isolation. Source backlog investigation remains separate; no broad tolerance or source renumbering was added. The later selected-bank Remap preserves all original source numbering. Owner/first-time-user acceptance remains pending.

## Typed correction/reconciliation safeguards

- The supported operation is an active canonical AP Port binding within one source. No target is preselected. Number/color/Route adjacency never creates an edge. Non-incident/out-of-range/occupied/ambiguous identities and explicit continuation conflicts are refused. Source numbering/color/duplicate edits remain proposal-only; confirmed complete-bank connection Remap is now supported.
- Drafts and validation records append to existing review events; candidates/impacts are private digest-pinned artifacts. Explicit Apply supplies the compared digest, revision, subject version and acknowledgment. Source bytes/geometry/history survive; field verification remains false. Reversal is another validated revision.
- Reprocessing never replays a manual binding automatically. It compares exact canonical connections, retains history and blocks Add on disagreement. Owner acceptance of the fresh-source result creates a new immutable candidate/index; separate Add checks its digest and active revision. Leaving it staged preserves the current manual decision while evidence is investigated.
- Review history follows snapshot ancestry; historical views exclude future events. A historical correction is not an active fact unless its binding still exists in that snapshot. Unknown onward continuation remains unknown.
- Prototype bounds are explicit: 256 local Cables / 4,096 local Fibers; comparison at most 25,000 Fibers and 200,000 changed facts, paged completely. Oversize comparisons fail instead of truncating impacts.
- The final disposable test schema is not an owner deployment. Local API/PG are stopped after final checks. Use the guarded fixture preparation helpers for any later replay; no new schema migration was needed.

## Bank Remap follow-up validation

- Full TypeScript suite **834/834** passed; final focused correction suite **6/6** adds the older accepted Port-source identity regression. Both TypeScript checks, build, formatter and standalone export pass.
- Backend correction/review **12 tests / 196 assertions** pass; final browser checks are recorded in `docs/VALIDATION.md`; all mutations used disposable local isolation.
- Saved actual AP18 snapshot: all **24** corrected resolver endpoints verified, **24 changed journeys / 123 changed derived facts**, all **9,356** Fibers compared. Other AP bindings, node transitions and original Port geometry remain unchanged.
- Desktop 1440px/mobile 390px whole-bank draft/reload/preview/Apply/Port journey/reversal pass with zero JS errors or horizontal overflow. Individual Port correction/reversal was also rechecked. The comparison UI keeps complete detailed impacts expandable.
- Routine later UI cleanup fits **Codex → Luna → Medium → Fast off**; escalation is only needed for another topology/data-integrity decision. Owner acceptance, source-decoding gaps and initial payload reduction remain open.
