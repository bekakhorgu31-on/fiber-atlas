# Fiber Atlas — current handoff

Updated **2026-10-12**. **Next work: Iteration38 — automatic drawing repair and simple corrections in Fiber Atlas.** The owner has now confirmed that displaced AP rows, the pictured marker gaps and routine fill/shade problems are mechanical Visio mistakes. Recognized cases must be repaired during import and excluded from actionable review. This is a new requirement; implementation is pending.

Read [the complete worker brief, source examples and acceptance](docs/ITERATION-38-DRAWING-REPAIR-AND-SIMPLE-CORRECTIONS.md). The prior handoff is preserved [byte-for-byte](docs/archive/HANDOFF-BEFORE-38-2026-10-12.md). That archive and the older reports are historical where they conflict with this instruction.

## Owner clarification — takes precedence over earlier restrictions

- **First screenshot:** AP-side connectors moved left accidentally. Import should recover the intended bank mapping automatically. AP20's locally repaired capacity is24F; do not keep its displaced F1→Port2 mapping or require a manual Remap for this recognized error.
- **Second screenshot:** disconnected/short drawing lines cause missing continuation. The concrete source is `25-113-25009-25012-48`, SC25009↔SC25012, label7858, banks8327/7886. Recover the intended links from the complete local structure and the approved drawing convention.
- **Color clarification:** a shifted line should reach its intended marker, but **orange/blue→blue/blue at an SC can be correct**. Preserve intentional splices and custom sequences. Keep inner fill, outer ring and drawing-line colors separate; never generate connectivity merely by equal color.
- Normalize recognized shade/fill mistakes automatically. These and recognized mechanical repairs belong in an optional “Corrected during import” summary, not Needs Review. Truly unspecified endpoints/competing mappings still need a simple way to supply the missing fact.
- Numbering and duplicates were reportedly corrected in Visio. Future corrections must work **inside Fiber Atlas**. Ordinary correction should be **select → preview → Save**, with Undo, not mandatory technical draft/validate/apply forms.
- Compatible saved Atlas corrections persist through reimport. Do not repeatedly ask for the same decision or supersede them with a displaced source row. Genuine changed identity/capacity/occupancy conflicts require one focused decision.
- These instructions supersede the older blanket prohibition on automatically correcting matching drawing mistakes, shade normalization and carrying forward any human correction. They do not authorize arbitrary nearest-marker joins, intentional-remap removal or silent owner database activation.

## Worker tasks — Iteration38

| Task | Status | Required result |
| --- | --- | --- |
| **38-01 — Family profile and revised-file support** | Ready | Replace exact-file-SHA eligibility with structurally recognized, versioned Shida drawing policy; keep SHA for integrity/provenance. |
| **38-02 — Displaced AP/bank rows** | Ready | Coherent whole-row alignment and correct canonical mappings; AP20 all24 automatic, no manual Remap/review for the approved pattern. |
| **38-03 — Gaps and omitted depiction** | Ready | Recover short strokes and supported same-Cable endpoint correspondence; restore known journeys without choosing unknown inter-Cable splice targets. |
| **38-04 — Color normalization** | Ready | Normalize recognized fill/shade errors; preserve valid SC color changes, separate marker components and Cable-specific sequences. |
| **38-05 — Persistent Atlas corrections** | Ready | Preserve valid explicit edits across reprocessing/source updates, retain atomic bank edits, surface only real conflicts. Incorporates37-01/02/05. |
| **38-06 — Simple correction editor** | Ready | Connection/range/number/capacity/duplicate/color edits in one contextual panel; short preview, one Save, Undo. |
| **38-07 — Import summary and source updates** | Ready | Automatic repairs grouped separately from genuine questions; discoverable saved-source reprocess/new-version flow. Incorporates37-03/04. |
| **38-08 — End-to-end verification and handover** | Ready after implementation | Both screenshot fixtures, updated source/new SHA, negative cases, retained edits, desktop/mobile usability and performance evidence. |

Deliver parser/profile/retention first with a compact inspectable summary, then finish the simplified editor. Record actual changed facts and remaining unknowns. Do not mark Done for visually moving lines without repairing the graph, hiding issues, making every color equal, or adding a loading animation.

Use In progress, Done with evidence, Blocked with a specific missing fact, or Deferred with a named follow-up. Iteration37 is **incorporated**, not independently completed. The detailed38 brief is the current authority.

## Evidence and implementation starting points

- [Screenshot A: AP20 displacement](docs/iteration38-owner-ap20-displacement.png), [Screenshot B: SC25009–SC25012 gaps](docs/iteration38-owner-sc25009-sc25012-gaps.png). Copies are byte-identical to owner attachments.
- `scripts/interpret-shida-upload.py` currently blocks any SHA different from the original owner file. That must change so corrected same-family files work.
- `scripts/shida_geometry.py` handles only small directional gaps today. `audit-iteration33-shida.py` builds bank ownership and physical associations; screenshot B currently has no accepted physical pair. Use whole-local-pattern evidence rather than a larger global tolerance.
- `compile-shida.ts` currently emits raw color conflicts and requires drawn bank association. Update its normalized facts/provenance/review accounting with the parser.
- Existing `portCorrection.ts` and reconciliation UI preserve history but only accept/supersede conflicting fresh-source outcomes. The38 persistent-edit workflow and simple editor must replace that limitation.
- The [Iteration37 review](docs/ITERATION-37-IMPORT-COMPLETENESS-REVIEW.md), [AP20 source audit](docs/ap20-capacity-source-audit.json) and [digitization backlog](docs/ITERATION-34-DIGITIZATION-BACKLOG.md) retain useful evidence. Their mandatory manual Remap/color-review/no-replay prescriptions are superseded only for the newly approved behavior.

## What is already delivered

- **Iteration35** place-first navigation, bounded local graph, compact full known journeys and typed individual/whole-bank corrections work locally. Keep Network · Engineer Search · Visio Import · Needs Review. Owner/first-time-user acceptance remains pending.
- **Iteration36** review performance is delivered locally: independent reads, selective context, bounded exact-run caches and memoized source geometry. QA p95 explanation≤371ms, drawing≤895ms, cached drawing≤91ms were local measurements, not owner-server guarantees. Owner bounds-index deployment remains pending; read [deployment/rollback details](docs/ITERATION-36-IMPLEMENTATION-REVIEW.md). That index cannot repair topology.
- **AP20 capacity** is corrected in local importer code using full FO24/numbered-bank/stroke evidence, preserving the raw label `25-134-25024-20-20`. Original SHA: `e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060`. New38 normalization also handles its AP-side displacement automatically.
- Last read-only owner check found active `CORRECTION-dce024db-ad8c-4743-b748-16bb1162c524`, AP20 still20F,606 total/581 open/25 reviewed. This is a historical point-in-time read, not a current acceptance result.
- Worker source-only regeneration produced176Segments/9,360Fibers/1,759transitions/789drawn bindings/583cases. These are pre38 normalized/Atlas-edit counts, not targets or live totals.38 must report its actual changes and case accounting.
- Four previously unresolved physical pairs—25016↔25017,23↔25039,25118↔25119,25124↔253138—remain investigation inputs. Determine which match an approved mechanical rule; do not assume all have the same cause.

## Product and data requirements

Use the place-first schematic and shared complete-known journey. Keep source context beside an edit, not an empty destination page or a long recursive default tree. Preserve source/focus/selection/navigation state and scroll. One routine Save may validate/apply internally while retaining immutable revisions, digest/current-state checks and atomic writes.

Keep original source bytes/geometry/history and separate source values from normalized values and explicit Atlas edits. Repaired facts must remain auditable without filling the review inbox. Genuine gaps are neither terminations nor guessed AGG reachability. A displayed playback order is not traffic direction or health.

Preserve AP16/Port13→SC25017→AP17 via F13 on `25-123`/`25-124`, excluding `25-122`, and the Tsageri SC217→Lentekhi regressions. Cases whose unknown continuation is newly supported by the approved repair may improve; do not freeze all old partial-path counts. Preserve valid deliberate Port7→F13 and SC color changes.

Duplicates require true physical-identity reconciliation with both source representations retained; same text alone is not identity. Number edits retain references and handle occupied numbers explicitly. Color-only normalization changes no optical edges. Unknown objects or out-of-scope geometry must be scoped clearly rather than silently omitted.

## Working boundaries and handover

Owner URL: **http://127.0.0.1:8000/**, **Start Fiber Atlas.cmd**. Preserve PostgreSQL `10.0.61.15:5432/on`, schema/login `bkhorguashvili`, TLS and protected credentials. The owner imports and activates network updates. This brief authorizes worker implementation and guarded local tests, not owner-server reset, migration, import activation or correction.

Use disposable `fiber_atlas_test / fiber_isolation` for mutations and saved source artifacts for replay. Keep the default local URL and existing source/document identities. The owner reports a newer Visio with corrected numbering/duplicates; locate the supplied revision when available, without treating the old source as the new file or claiming unperformed acceptance. Use same-family changed-SHA fixtures while independent work proceeds.

Follow38's before/after and negative-case acceptance. Preserve36's performance behavior and bound new repair ledgers/caches. Update [VALIDATION](docs/VALIDATION.md) with actual checks, [HANDOFF](HANDOFF.md) statuses, an implementation review and simple owner steps. Existing test totals are historical.

Remaining separate work: PERF-STARTUP bundle/payload reduction, PERF-SERVING concurrent serving, bounds-index deployment, other unsupported source semantics, concise Engineer Search answer refinement and first-time-user acceptance. Automatic repair of this family is not universal Visio certification.
