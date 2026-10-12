# Iteration 26 — Tsageri–Lentekhi Reference Dataset Finalization

## Acceptance status

**READY FOR REFERENCE DATASET V1**

Reference identity: `TSAGERI-LENTEKHI-REFERENCE-V1`  
Source: `Tsageri-Lentekhi 2025.vsdx`  
SHA-256: `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`  
Certified importer: `iteration24-certified-v2`  
Interpreter: `iteration26-reference-v1`  
Owner confirmation revision: `owner-confirmation-2026-09-29-sc225-termination`

This status means the current source package is internally reconciled and repeatable. It does not mean field verified. `source_interpreted`, `owner_confirmed`, and `field_verified` remain separate states; field verification is **none**.

## Final inventory and topology

| Record | Count |
|---|---:|
| Cable Segments | 20 |
| Logical Fibers | 1,176 |
| Tube groups | 98 |
| Closures | 12 |
| AP assets | 6 |
| Aggregations | 2 |
| PortTopologyBindings | 192 |
| Exact source-supported NodeFiberTransitions | 838 |
| Owner-confirmed SC225 intentional terminations | 16 |
| Active NodeFiberTransitions | 854 |
| Active Fiber Lineages | 278 |
| Superseded Fiber Lineages | 42 |
| FiberJourneySummary coverage | 1,176 / 1,176 |
| Generic company-use assignments | 13 |

Journey coverage is 172 full-lineage, 976 partial, 16 known terminations and 12 external-document boundaries. Partial means the current source ends before a defensible end-to-end mapping; it is not a generic review queue.

## SC225 final canonical routing matrix

| Incoming C181 Fiber | Active outcome | Basis |
|---|---|---|
| F01–F04 | C183/F01–F04 → AP54 | certified source geometry |
| F05–F12 | terminates at SC225 | latest owner confirmation + source connector ending |
| F13–F16 | C182/F01–F04 → AP53 | certified source geometry |
| F17–F24 | terminates at SC225 | latest owner confirmation + source connector ending |

Every C181 Fiber has exactly one active outcome. The older C181/F06 AP-side unresolved interpretation is superseded and absent from active topology. No termination row carries a candidate AP, outgoing Segment, or fake connection line.

## Port38 corrected final journey

`Lentekhi Port38 → C184/F38 → SC224 → C181/F06 → SC225 → termination`

The journey scope is `termination`; the endpoint is `SC225 / აქ მთავრდება`. AP53, AP54, AP51 and SC223 are absent from the optical path. The physical root route remains available as neutral context, while the selected Fiber highlight stops at SC225.

## Semantic reconciliation

| Category | Final use |
|---|---|
| `source_interpreted` | certified Visio geometry/style/text supports the active fact |
| `owner_confirmed` | network owner explicitly confirms the active fact; not field verified |
| `source_conflict` | incompatible source claims are retained side by side |
| `not_present_in_source` | requested detail is absent from the current Visio |
| `external_document_boundary` | topology continues in another document that is not imported |
| `genuinely_ambiguous` | more than one source-supported interpretation remains |

Pending manual review for this reference package is zero. Engineering provenance and historical assertions remain available; accepted source facts are no longer presented to normal users as a large pending queue.

## Company and Port semantics

All four companies use `NetworkUseAssignment`: OpenNet, Magti, Silknet and Skytel. The 31 source occurrences deduplicate to 13 logical assignments while retaining every source Shape. Usage never becomes ownership, rights, service, customer, occupancy or availability.

Green AP Port graphics mean observed occupied/in use. White Port graphics mean observed unused. `unused` does not mean available. Tsageri and Lentekhi aggregation Port occupancy remains unknown because the source has no separate graphical occupancy state for those logical Ports.

## Lentekhi and Ambrolauri boundaries

Lentekhi is the known canonical endpoint `AGG-LENTEKHI`, displayed as `ლენტეხის აგრეგაცია`. Only the legacy number conflicts: heading 6 versus Property 5.

The Ambrolauri handoff is the structured boundary `BOUNDARY-SC207` with current document, originating node SC206, direction key `alpana-tvishi-ambrolauri`, nullable next document, nullable linked route and `document_known_not_imported` status. Future matching must combine source provenance, endpoint context and geometry. Displayed name, number or Fiber number alone cannot merge assets.

## Freeze package

`reference/tsageri-lentekhi-v1.manifest.json` hashes the source VSDX, lossless raw extraction, interpreted inventory, active transitions, active Lineages, Golden fixtures, semantic summary, company assignments, Port interpretation and annotations. Two independent generations produced byte-identical files.

Frozen Golden cases include C172/F01, C172/F29, C172/F31, SC219 F32→AP52, Lentekhi Port32→AP52, Lentekhi Port38→SC225 termination, both SC225 AP ranges, both SC225 termination ranges, AP51 Port3, company-use examples and occupied/unused Port examples.

## Strict remaining gaps

| Gap | Category | Why it remains |
|---|---|---|
| Lentekhi legacy number 6 / 5 | `source_conflict` | The heading says 6 and Property says 5. The canonical endpoint itself is known. |
| Exact splice mechanism, tray, patch cord, field condition, manufacturer/model | `not_present_in_source` | The current Visio does not encode these facts. |
| Ambrolauri continuation | `external_document_boundary` | It belongs to another Visio that has not been supplied or imported. |

There is no active SC225 continuation ambiguity and no unexplained meaningful source evidence.

## Validation

- 667 TypeScript/domain tests pass, including 20 Iteration 26 finalization tests.
- 12 certified importer tests pass.
- TypeScript compilation, production build and single-file standalone export pass.
- Reference package generation is byte-identical across two runs.
- Desktop and 390px mobile browser QA cover Port38 termination, SC225 routing, termination filtering, Source Review, company attribution and the standalone artifact.

## Iteration 27 recommendation

Import the Ambrolauri Visio as a separate certified source package, preserve its raw provenance, then reconcile it through `BOUNDARY-SC207`. Produce an explicit reference diff before accepting any change to Tsageri–Lentekhi V1. Do not merge shared assets using display identity alone.
