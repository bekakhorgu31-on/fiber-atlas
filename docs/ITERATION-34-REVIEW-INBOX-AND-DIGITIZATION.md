# Iteration 34 — inspectable review cases and a digitization backlog

Status: **Implemented locally; validation evidence in the implementation review and VALIDATION.md**. Date: 2026-10-10.

## Problem and intended result

The owner has added the partial Shida network and sees “606 to review / 8 conflicts,” but cannot discover what the cases mean. One click on the count must open the actual cases, grouped into useful problems. Selecting a case must show the affected object, a short explanation, exact source evidence and the next decision needed. The same evidence must support a practical plan for completing the digital network.

Read the [analysis](ITERATION-34-REVIEW-ANALYSIS.md) and [606-case inventory](iteration34-review-inventory.json) first. They are local audit evidence, not hard-coded UI data. The owner-reported active output matches the Iteration 33 fixture; resolve actual source, import-run and network revision identities from persisted records.

Preserve the current network, original source, import attempts and review history. Implement and test using isolated local fixtures. Do not reset, reseed, reimport or activate a proposal on the owner's server. Keep **Network · Engineer Search · Visio Import · Needs Review**. A broad search rewrite and new topology rules are separate work; neither should delay access to the cases.

## 34-01 — Connect counts to the actual review inventory

Priority P1. Status **Done locally**. No dependency.

- Replace the plain import count with a keyboard-accessible action scoped to that proposal/source. Show “606 review cases, including 8 conflicts” for the unchanged fixture. The conflict action filters the same list to eight child cases.
- Build the list from persisted `sourceReviewCases`, related conflicts and review events. Do not use only `data.issues`, import-label candidates or the audit JSON. Preserve legacy issue support where relevant without duplicating it into the Shida count.
- Make active, staged and historical contexts explicit. A staged proposal must be inspectable before Add; inspecting it must not change the network or imply its cases belong to the active revision. Historical links retain their original source/run/revision.
- Reconcile immutable import totals, current open review work, reviewed cases, unresolved network facts and pending source imports. Expose their scope in concise labels. Resolve superseded attempts per source so an old unsupported run is not counted as a current pending source after its successor is applied; preserve the history.
- Source-specific filters must not include unrelated regions or every source in a combined proposal. Use canonical identity and provenance, never AP display number or filename alone. Link the eight conflict records to their existing review cases.
- Load a bounded case list and the selected detail. Remove the dependency on deferred lineage/sheet payloads for opening Needs Review. Reuse operational cases where already available; provide a lightweight revision-bound read path when needed for active/staged cases. Do not download a 153 MB proposal or a whole drawing to open a list.

Acceptance: all 606 unique fixture cases are reachable; category totals are 506 + 89 + 8 + 2 + 1; the conflict subset is not counted twice. A nonzero badge never leads to an unexplained empty list. Loading, failure, no results and stale context are distinguishable. No source/network mutation occurs when browsing.

## 34-02 — Provide a clear grouped review workspace

Priority P1. Status **Done locally**. Depends on 34-01.

- Use compact categories with counts, a searchable list, and one selected issue detail. Search by AP/SC, endpoint, full source label, Fiber/Port, location and case ID. Include type/status/source filters and a clear reset. Paginate or virtualize large result sets.
- Group shared evidence without merging identities: 506 Port cases should reveal 23 AP groups in this fixture, including the two single-Port gaps. Group the eight color cases by Cable and comparison. Expand groups to their exact child records. Display both group and case counts, such as “23 APs · 506 Ports.”
- An issue row answers: **which object, what is unknown, what does it affect?** Example: “AP19 · Zemo Shashaketi — 24 Ports have no exact Fiber binding.” Reserve “ambiguous” for recorded competing candidates; the existing category name alone is insufficient.
- The selected detail answers, in order: what is known; what is missing or contradictory; affected Cable/Fiber/Port or route; source evidence; proposed next step. Use concise Georgian operator text. IDs, JSON, rule versions and diagnostic measurements belong in expandable technical details.
- Keep the selected location visible. Open affected assets in the existing map with appropriate context/highlighting and a reliable return to the case. Restore list filters, selection and scroll through Back/Forward and refresh using stable URLs. Do not navigate an object into a blank full-page card list.
- On desktop, the list and detail/source pane must scroll independently with reachable controls. On 390px screens, use a list-to-detail transition with a visible return action, readable text and no horizontal overflow. Keyboard focus, accessible names and non-color status labels are required.

Acceptance: the owner can reach a named case from the count and understand its specific problem without opening technical details. Test at least one example from all five categories, AP18/Port1 and AP37/Port14, a full AP group, source filtering, preserved navigation state and the four-item sidebar.

## 34-03 — Show exact source context and honest decisions

Priority P1. Status **Done locally**. Depends on 34-01; coordinate with 34-02.

- Resolve evidence from the exact stored source revision, import run, page and Shape IDs. Use the source geometry index to load a bounded neighborhood containing the selected label/Port, markers, relevant lines and owning node. Support zoom, pan and fit to issue. A tiny isolated Shape or raw JSON is not sufficient visual evidence.
- Use faithful stored geometry/text for the source view; label any simplified route schematic separately. When comparing fills or duplicated labels, show both source locations with readable labels. Missing geometry must be explained with a retry/exact-source fallback, never silently replaced with another run or the current source revision.
- Surface candidate mappings and rejected alternatives where available, clearly distinguishing accepted source facts, interpreter proposals and owner statements. No candidate is silently selected because it is nearest, shares a number/color, or closes a route.
- Provide applicable review actions with an explicit subject and explanation: leave open, record an observation, request/source-confirm a correction, or dismiss a non-issue with a reason. Reuse append-only review events and existing permissions/concurrency guards. Keep original values, actor, reason, evidence and previous decisions accessible.
- A saved decision is not proof the network has changed. Show review disposition separately from topology/attribute resolution. Existing accepted/rejected/corrected events must not silently make an unresolved Port binding look fixed. Reopened and superseded cases remain traceable across revisions.
- Correction proposals for AP43 and AP47 must preserve the printed source numbers and show the specific Shape-level old/new values. No automatic renumbering. Likewise, grouping purple shades is not an approved physical-color rule, and the duplicate Cable label is not permission to merge physical assets.
- If applying a correction requires an interpreter/proposal pipeline not yet available, record it as **proposed, not applied** with its next task. Never offer a successful-looking “fix” that only records a comment. Activation of any changed network remains an explicit owner action after a validated revision comparison.

Acceptance: inspect both original fill markers, both duplicate label occurrences and the two numbering anomalies from their case pages. Persist a review note, refresh, and verify actor/history/status while graph facts remain unchanged. Test viewer versus reviewer, concurrent edits, stale network revision and inaccessible/missing source. The observation workflow must not imply field verification.

## 34-04 — Explain root causes and prepare the next digitization work

Priority P1. Status **Done locally**. Depends on the inventory contract from 34-01; audit can proceed before the visual workspace is complete.

- Produce a reproducible current-source case inventory and root-cause report with exact reconciliation, stable IDs and references to source evidence. Include the cases in the input proposal and the current review dispositions separately. Avoid assuming that every future source has exactly 606 cases.
- Retain diagnostic outcomes at the stage a candidate is rejected. For unknown Ports, distinguish: no eligible drawn connector found; absent/ambiguous printed marker; missing/non-unique Cable association; ambiguous docking; wrong node; unresolved numbering; unsupported geometry; or not yet classified. Preserve candidate/stroke IDs and relevant measurements. A missing accepted binding is not itself a diagnosis.
- Investigate all 23 affected AP groups and 89 incomplete Cable associations. Check the five unlabelled physical bank pairs and the 2,627 rejected local links. For each group, identify the blocking evidence/rule, affected canonical records and a defensible next step; use “not yet established” when necessary instead of inventing a root cause.
- Maintain a linked coverage ledger for the 47 unowned banks, 579 annotations, 48 raw Ports excluded by the two numbering cases, aggregation Ports, endpoint identity, Tube/ring and usage notes. Classify annotation purpose before treating it as work. State overlap with existing cases and avoid double-counting impacts.
- Separate parser limitations, genuinely missing source information, contradictory source values, uncertain object identity and owner/domain decisions. Propose source-supported importer improvements for recurring patterns, small concrete owner questions for ambiguities, and source corrections where the drawing itself is inconsistent.
- Rank future worker tasks by distinct affected objects, dependency and measurable expected benefit. Report measured improvement only after testing a new proposal. Do not promise to recover all 4,748 Fibers on incomplete Segments or all 9,260 partial paths by repairing one rule.
- Each proposed task needs scope, representative source cases, evidence still required, negative regression cases and an acceptance criterion. Preserve the owner-confirmed Shida docking rule's bounded context. Do not generalize it to unrelated Visio families.

Acceptance: the report explains the 606 cases and names coverage gaps outside that total. Every case is either linked to a supported root cause or explicitly marked undiagnosed with the investigation needed. Shared causes link to their child records. A prioritized next iteration can be assigned without asking the owner to manually investigate hundreds of identical rows. This task delivers diagnostics and requirements; topology-changing improvements are separately proposed.

## 34-05 — Verify the real review journey and report delivery

Priority P1. Status **Done locally**. Depends on 34-01 through 34-04.

- Use the actual large Shida fixture in the isolated API/PostgreSQL/browser workflow. Test active and staged review entry, exact count/category reconciliation, all case IDs reachable, group expansion, search, source details, deep-link reload, Back/Forward, persisted review events and unchanged topology after review-only actions.
- Include missing evidence, request failure/retry, superseded attempts, a newer active network and source-scoped AP collision with existing Tsageri fixtures. Count tests must establish scope and membership, not merely mirror a hard-coded UI number.
- Verify desktop and 390px detail scrolling, keyboard access and absence of browser errors. Record list/detail/source loading measurements and bounded response sizes. Opening review must not force irrelevant large lineage/sheet data.
- Keep existing route correctness regressions, especially AP16 Ports13–24 → SC25017 → AP17, AP16 Ports1/10 partial continuation, and Tsageri SC217 behavior. Run checks appropriate to code changed; do not claim the historical test totals as new runs.
- Update `HANDOFF.md`, `docs/VALIDATION.md`, the owner guide and a short implementation review. State what the owner can now inspect, what remains undiagnosed and which corrections are only proposed. Screenshots should show a real case with readable evidence, not just the count badge.

Done requires all five categories inspectable, count/list parity, useful source context, auditable decisions and a prioritized source-backed backlog. It does **not** mean every uncertainty is resolved or that arbitrary Visio files are universally supported.

## Worker status protocol

Update each task to **In progress**, **Done**, **Blocked — specific dependency**, or **Deferred — reason and follow-up task**. For Done, include a concise result and evidence link. Do not close Iteration 34 based only on a report or a clickable count; the complete owner review workflow must work. Preserve the earlier Iteration 33 delivery as history.


## Implementation boundary

See [implementation review](ITERATION-34-IMPLEMENTATION-REVIEW.md), [owner guide](ITERATION-34-OWNER-GUIDE.md) and [digitization backlog](ITERATION-34-DIGITIZATION-BACKLOG.md). Active review actions use the existing immutable event model. Staged/historical cases are inspectable but remain read-only; a future staged-note model is a separately scoped enhancement. Source corrections are proposed, not applied. No owner-server import, reset or activation was performed. Original assignment evidence remains archived in HANDOFF-34-ASSIGNMENT-2026-10-10.md.
