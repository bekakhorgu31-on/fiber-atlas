# Iteration 37 — import completeness and retaining confirmed corrections

**Superseded requirements notice, 2026-10-12:** [Iteration38](ITERATION-38-DRAWING-REPAIR-AND-SIMPLE-CORRECTIONS.md) incorporates this pending work. The owner now authorizes automatic repair of matching AP row displacement, marker gaps and fill/shade mistakes, exclusion of repaired cases from Needs Review, persistent compatible Atlas edits and a simpler editor. The mandatory manual AP20 Remap and blanket no-replay statements below describe the earlier policy; follow38 for implementation. The source evidence and prior test results remain historical facts.

Planning review **2026-10-12**. The owner asked to check the worker's updated handoff and missing import data. **AP20's capacity repair is supported; owner activation and correction-retention improvements remain pending.** This review changes requirements/documentation only.

## What is actually missing

The active SC25024 ↔ AP20 · Didi Sative Cable is still **20F**, so **F21–F24 are absent from that stored import**. An independent read-only review request returned that exact 20F Cable at active revision `CORRECTION-dce024db-ad8c-4743-b748-16bb1162c524`, with 606 total / 581 open / 25 reviewed cases. This was a scoped case read, not a complete live graph audit. Counts may change as the owner works.

The source contradicts itself: label Shape78894 says `25-134-25024-20-20`, while both bank labels, Shapes11798/12097, say `FO 24`. This review independently read those exact three texts from the preserved VSDX and verified its SHA-256 as `e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060`. The worker's geometry audit identifies full F1–F24 banks11797/12096 and 24 docked span lines11562–11585.

The earlier importer trusted the label capacity and rejected the conflicting banks, losing four Fiber records and the bank association. The new bounded rule requires both numbered banks, explicit matching FO texts, full unique same-number physical strokes, actual node ownership and an unambiguous local label. It preserves the contradiction for review. This is a sound fix for the verified source convention; it is not evidence that arbitrary Visio drawings import correctly.

| Source-only regeneration | Before | After |
| --- | ---: | ---: |
| Segments | 176 | 176 |
| Fibers | 9,356 | **9,360** |
| Node transitions | 1,759 | 1,759 |
| Drawn-source Port bindings | 766 | **789** |
| Review cases | 606 | **583** |

These are regenerated source-only counts from [the worker audit](ap20-capacity-source-audit.json), not current owner totals. The 23 additional bindings reflect the drawn AP20 Port displacement: F1→Port2 through F23→Port24. Capacity correction alone does not prove the intended same-number Port mapping. Explicit owner Remap remains separate; it must now include all 24 Fibers. Do not call Ports21–24 spare on the basis of the old 20F import.

## Important gap in the recommended update workflow

Reprocessing is staged and cannot silently replace active mappings. However, the current reconciliation UI only offers **accept the fresh source result**, acknowledging all incompatible prior correction records. `ImportCorrectionReconciliation.tsx`, `reconcile-import-corrections.ts` and `reconcileImportCorrections()` preserve correction history but do not offer **retain this confirmed active correction in the new proposal**.

Consequently, accepting the fresh source and then Add can supersede previously confirmed AP18/other mappings when the source still depicts the displaced bank. This is a product limitation of the existing explicit workflow, not a claim that it already changed the owner's network or bypassed confirmation. Retaining history is different from retaining active connections.

The AP20 backend replay proves corrected capacity through upload/reprocess/separate Add into an empty isolated network. Existing generic reconciliation tests prove that disagreements block and can be explicitly superseded. Neither establishes a workflow that adds AP20's missing Fibers **while retaining the owner's chosen conflicting corrections**. Do not describe that combined acceptance as complete.

## Remaining interpretation gaps

Inspection of the worker's regenerated semantic artifact found four physical bank pairs with no accepted Cable-label association:

| Source endpoint tokens | Bank Shape IDs | Observed span strokes |
| --- | --- | ---: |
| 25016 ↔ 25017 | 79506 / 8839 | 24 |
| 23 ↔ 25039 | 18735 / 18798 | 24 |
| 25118 ↔ 25119 | 58103 / 58859 | 59 |
| 25124 ↔ 253138 | 60967 / 79835 | 59 |

Those are unresolved association candidates, not four proven missing Cables or grounds to invent connectivity. In particular, 59 drawn strokes do not by themselves establish a 59F Cable. The 178 raw label occurrences, 176 compiled Segments and 92 physical-pair candidates are different units; do not subtract them as if each represented a unique Cable.

The regenerated semantic artifact contains 1,272 complete-bank canonical Ports, 789 with drawn bindings and **483 without an accepted binding**. Another 48 raw Ports belong to incomplete/irregular banks and remain source evidence. These figures overlap the review backlog; they are not additional issues to add to 583. Aggregation Ports, Tube meaning, unknown continuation and annotation/usage scope still require source interpretation.

## Worker tasks

| ID / priority | Status | Deliverable and acceptance |
| --- | --- | --- |
| **37-01 / P1 — Retain or replace confirmed corrections explicitly** | Ready | Add per-correction or atomic whole-bank choices: retain the confirmed mapping, accept the new source mapping, or leave unresolved/staged. No automatic choice/replay. A retained mapping must pass current source identity, incident Cable, capacity, endpoint occupancy and transition checks; ambiguity blocks retention. Keep group atomicity, provenance, reason, actor and both old/new source evidence. |
| **37-02 / P1 — Validate the actual AP20 upgrade with existing corrections** | Ready after 37-01 | In guarded isolation, start with the currently relevant corrected-network fixture, reprocess the preserved source and explicitly retain chosen existing AP18/other bank decisions. Compare every changed Cable/Fiber/binding/path. Prove the four new AP20 Fibers exist, other chosen corrections remain active, and all 24 AP20 Remap entries can be separately previewed/applied. Keep staged preview, reconciliation and final Add distinct. |
| **37-03 / P1 — Make the source upgrade discoverable** | Ready | On the saved/applied source show when a newer interpreter is available and a clear reprocess action leading to the original inventory internally. Preserve source bytes/document identity and revision history. Explain that browser refresh loads code but cannot change the stored 20F result. Never require reset, file deletion or upload as a new document. |
| **37-04 / P2 — Audit import completeness by cause** | Ready | Update the source-backed backlog from the regenerated artifact. For each remaining pair/bank, show exact rejected rule, source IDs, affected Cable/Fiber/Port counts and whether the cause is unsupported grammar, missing drawing evidence or a real contradiction. Count source occurrences, physical identities and graph facts separately. Investigate the four pairs above before assuming they share AP20's cause. |
| **37-05 / P1 — Combined regression and owner handover** | Ready after 37-01–03 | Verify stale revision/digest/subject checks, occupied endpoints, deleted/changed Cable/Fiber identities, whole-bank atomicity, historical review, reversal and exact-run evidence. Publish a complete impact preview and owner steps. Owner alone performs the final production reconciliation/Add/Remap. Report source-only and active-with-corrections counts separately. |

Keep all implementation mutations in disposable local isolation. No owner migration, reprocess, Add, reset or mapping change is authorized by this review request. A candidate may remain staged while decisions are unresolved; that is a valid status, not a reason to bulk-accept source changes. Do not silently replay old corrections to satisfy preservation requirements.

The performance bounds index remains a separate documented deployment item. It accelerates source viewing and does not restore missing Fibers. Do not mix index deployment with source/correction activation.

## Independent checks in this planning review

- Exact preserved VSDX SHA and three conflicting raw texts verified directly.
- Three AP20 capacity/compiler/Remap tests passed, including negative evidence checks and all-24 Remap.
- Eight Python source-audit tests passed, including missing/duplicate/remapped strokes, incomplete numbering, wrong/missing/ambiguous FO text and ambiguous label rejection.
- Nine existing Port-correction tests passed, including atomic banks, smaller generic ranges, reversal and reconciliation disagreement behavior.
- Regenerated semantic artifact inspected for remaining pairs, capacities and Port-binding coverage; worker full-source regeneration and six-minute backend replay were not rerun.
- One live GET confirmed the still-active AP20 20F review object. No owner data was changed.

The locally verified capacity repair is useful progress. Completion requires an explicit update path that preserves the owner's chosen corrections and a clear accounting of the remaining interpretation gaps.
