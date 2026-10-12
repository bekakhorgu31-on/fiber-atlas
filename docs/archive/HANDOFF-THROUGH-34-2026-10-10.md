# Fiber Atlas — current handoff

Updated **2026-10-10**. The owner reports that the partial Shida Kartli proposal has been **added to the network**. **Iteration 34 implementation is delivered locally:** its 606 review cases are now reachable through grouped, source-scoped lists, visual source evidence and append-only decisions. The source-backed follow-up backlog is ready. Final local regression checks pass; owner-server installation/acceptance is not claimed.

The owner's pasted applied result matches the local Iteration 33 fixture: **176 Segments · 9,356 Fibers · 1,759 transitions · 766 exact Port bindings**. This planning review did not query the live database or verify its active revision independently. Do not repeat Add, clear the database or treat the network as empty.

## Iteration 34 delivery and next worker boundaries

Read [requirements and acceptance checks](docs/ITERATION-34-REVIEW-INBOX-AND-DIGITIZATION.md), [analysis of the actual cases](docs/ITERATION-34-REVIEW-ANALYSIS.md), and [complete case inventory](docs/iteration34-review-inventory.json).

| Task | Status | Deliverable |
| --- | --- | --- |
| **34-01 — Review inventory and count parity** | Done locally — see implementation/validation evidence | Clickable, revision/source-scoped counts leading to the actual cases; consistent active/staged/historical totals. |
| **34-02 — Grouped review workspace** | Done locally — see implementation/validation evidence | Searchable groups and concise issue details with usable scrolling, asset/map links and preserved navigation. |
| **34-03 — Source evidence and decisions** | Done locally — see implementation/validation evidence | Exact visual source context, traceable review history, and a clear distinction between proposed corrections and applied network changes. |
| **34-04 — Root causes and digitization backlog** | Done locally — see implementation/validation evidence | Explain shared causes, retain rejected-candidate diagnostics, cover gaps outside 606, and prepare prioritized follow-up tasks. |
| **34-05 — Owner workflow verification** | Done locally — see implementation/validation evidence | Real large-source local API/browser checks, desktop/mobile evidence and updated validation/owner guide. |

Update each task to In progress, Done with evidence, Blocked with a specific dependency, or Deferred with a reason and follow-up. A clickable number alone does not complete this iteration. Deliver browsing and diagnosis first; propose topology-changing improvements separately.

## Findings the implementation must address

The earlier implementation printed a number and listed empty `data.issues`. The new Review Inbox reads persisted `sourceReviewCases`, related canonical records and review events. It offers source/run/revision-scoped count links, groups, exact evidence, honest review dispositions and a separate coverage ledger. See [implementation review](docs/ITERATION-34-IMPLEMENTATION-REVIEW.md) and [owner guide](docs/ITERATION-34-OWNER-GUIDE.md). The pre-delivery assignment checkpoint is archived.

| Problem | Cases |
| --- | ---: |
| Unknown exact Port–Fiber binding | 506 |
| Incomplete Cable–Fiber-bank association | 89 |
| Conflicting source fills | 8 |
| Irregular printed Port numbering | 2 |
| Duplicate full Cable label / uncertain physical identity | 1 |
| **Total, including eight conflicts** | **606** |

- **506 Port cases form 23 AP groups:** 21 whole banks of 24 Ports, plus AP18/Port1 and AP37/Port14. Diagnose common source-association failures before requesting hundreds of owner decisions.
- **89 incomplete Segments contain 4,748 logical Fibers.** Separately, 2,627 drawn local links lack unique Cable association on at least one bank. These are investigation priorities, not a promise that every partial path can be recovered.
- **All eight fill conflicts are on SC25075–SC25081**, source label `25-206-25075-25081-96`, Fibers 10/22/34/46/58/70/82/94: `#7030a0` versus `#cc99ff`. Show one expandable group; do not assume the two shades are equivalent or that continuity is broken.
- **AP43 · Noste** repeats printed 1 and lacks 24; **AP47 · Prezeti** prints 0 and lacks 9. Original XML confirms the unusual values. Present potential corrections with evidence; do not renumber automatically or infer bindings from numbering.
- Label `25-178-25060-25061-48` appears on Shapes 27117 and 29315. Physical identity remains unresolved.
- **9,260 partial selected-Fiber paths are impacts, not separate defects.** The 47 unowned banks, 579 annotations, aggregation Ports, Tube/ring meaning and other unknowns require a linked coverage ledger. These totals overlap and must not be added to 606.

All detailed source references, case IDs, AP groups, artifact hashes and original-source spot checks are in the linked inventory. It is an audit fixture; the app must use actual persisted data. Review decisions must not silently turn unresolved topology into “fixed.”

## Preserve the existing delivery

Iteration 33 is **Done for its declared partial source scope**. Read its [semantic review](docs/ITERATION-33-SEMANTIC-REVIEW.md), [source audit](docs/ITERATION-33-SOURCE-AUDIT.md), and [validation](docs/VALIDATION.md). The full previous handoff is [archived without changes](docs/archive/HANDOFF-THROUGH-33-2026-10-10.md); its “owner has not applied” and earlier empty-network statements are historical.

The existing delivery preserves all 62,670 Shapes, source-scoped canonical identities, exact node-local transitions and unknown continuations. It has 1,272 canonical printed Ports, 766 exact bindings, 96 exact selected-Fiber paths and 9,260 partial paths. This is useful partial digitization, not universal Visio interpretation or end-to-end certification. Retain immutable proposals/revisions, source evidence and existing review decisions.

Source SHA: `e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060`. Owner-confirmed drafting-gap convention: `OWNER-SHIDA-DRAFTING-GAP-CONTINUITY-2026-10-09`; rule `shida-numbered-marker-and-port-drafting-gap/2`. Small gaps require the established directional geometry, numbering, measured pitch and node context. Never invent optical continuation from route adjacency, equal numbers/colors, range formulas or a globally widened tolerance.

Keep AP16 Ports13–24 → SC25017 → AP17, excluding the unrelated `25-122` branch; AP16 Ports1/10 keep their local bindings and unknown onward continuation. Preserve Tsageri/SC217 regression coverage. Shida AP numbers must not merge with Tsageri by display number. Construction references remain opaque source fields, not unique physical Cable identities. Raw source Port State/fill do not establish occupancy, service use or availability.

## Working boundaries and owner workflow

- Iteration 34 implementation is now local and tested. It does not certify or alter the underlying unresolved topology. The preparation-only documents remain historical analysis; actual features and measured checks are documented separately.
- Owner app: **http://127.0.0.1:8000/**, launched with **Start Fiber Atlas.cmd**. The owner personally uploads, reviews and applies their Visio proposals.
- Preserve the internal PostgreSQL `10.0.61.15:5432/on`, schema/login `bkhorguashvili`, protected credentials and TLS policy. Do not reset, reseed, reimport or activate on the owner's server. Test mutations only in the existing guarded loopback fixture schema/storage.
- Keep the primary sidebar **Network · Engineer Search · Visio Import · Needs Review**. Engineer Search is a core feature. Keep answers concise and reveal full evidence on demand.
- Update actual implementation status and new test evidence in this handoff and validation report. Historical test results must not be presented as newly run checks.

## Iteration 34 current worker checkpoint

- Real original Shida source was uploaded/reprocessed and applied only in guarded loopback `fiber_atlas_test / fiber_isolation`, separate storage and port 8010. The owner server was not read or written. New candidate generation retains a lightweight digest-pinned review index; old staged attempts without that index need explicit reprocessing. Active older Shida revisions are read from persisted records with source-scoped identity checks, not from the audit fixture.
- All 606 unique persisted fixture cases are reachable: 506 + 89 + 8 + 2 + 1; 23 AP groups; eight conflict children are not double-counted. Source/revision deep links, independent desktop scrolling, mobile list/detail return, source crop zoom/pan, both numbering anomalies, both fill markers and duplicate-label locations pass actual browser checks. Review entry does not request deferred Lineages/sheets.
- Review notes/proposals preserve actor/version/reason and force applied=false/fieldVerified=false. Original graph/source values remain unchanged. Historical and staged views are read-only under the existing active-network review-event model; no comments are written against unrelated active data. Applying a correction requires a new validated comparison and explicit owner action.
- Rejection diagnostics are retained during subsequent source-local interpretation. A reproducible full-source diagnostic report links all 89 bank cases, 23 AP groups, 47 node-unassociated banks, five unlabelled pairs, 2,627 rejected links and 579 text occurrences. Counts overlap and must not be added to 606 or treated as recovered paths. See [backlog](docs/ITERATION-34-DIGITIZATION-BACKLOG.md), `iteration34-rejection-diagnostics.json`, `iteration34-active-fixture-inventory.json` and `iteration34-case-diagnostic-links.json`. The last two contain actual local fixture IDs, not a live-owner export.
- Port scan: 406 candidate-bank association rejections; 98 missing/ambiguous marker-attachment outcomes; AP37/Port14 and AP40/Port4 remain undiagnosed by that scan. Bank candidates: 39 node-container gaps, 32 unestablished physical pairs, 13 non-unique/missing two-bank sets, five owner/endpoint disagreements in proximity candidates. These are investigation classifications, not accepted optical mappings.
- Next work is the prioritized source-backed backlog: container/bank association grammar first, remaining Port attachment evidence, then explicit owner numbering/shade/duplicate questions and aggregation/Tube/annotation scope. No automatic renumbering, shade equivalence, duplicate merge or tolerance expansion is authorized by this iteration.
- Current checks: TypeScript 818/818, Python 47/47, 26 actual desktop/mobile owner workflows plus eight navigation/recovery/anomaly workflows, zero JS errors/external requests/overflow. Final affected backend checks: 7 tests / 6,410 assertions. Earlier isolated review contract: 3 tests / 41 assertions. Final evidence is in VALIDATION.md. Build/compiler, PHP format and standalone export pass. The QA API was stopped before final isolated backend checks; the local PostgreSQL test runtime was stopped afterward.
