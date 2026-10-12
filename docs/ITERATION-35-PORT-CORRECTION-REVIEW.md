# Iteration 35 — typed Port-binding corrections

2026-10-11. Second delivery: **35-05 implemented and verified locally**, with second-delivery checks under 35-06. This extends the completed place/journey/evidence release. Owner and first-time-user acceptance remain pending.

## Delivered workflow

An authenticated reviewer can open an active, source-scoped Port-binding case and select its exact incident Cable and Fiber. Neither is preselected. The builder records a reason, evidence basis and Shape IDs from that exact source/run/page. It stores an immutable typed draft in the existing append-only review log. Saving does not modify the graph.

Validation uses the existing current Fiber resolver, regenerates current Lineages/JourneySummaries and usage/organization/aggregation projections, and compares the complete snapshot. It writes a private immutable candidate and a separate digest-pinned impact artifact. Changed paths and other changed facts are accessible in 20-row pages; snapshot revision stamps alone are not presented as independent defects. The preview shows both directions of known paths, explicit gaps, physical identities and technical details when expanded.

A separate reviewer acknowledgment and **შესწორების ქსელში გამოყენება** action activates exactly the compared candidate. The request supplies its digest, active revision and subject version. The existing revision store certifies records and atomically changes active state. Original source objects, bytes, geometry, previous revisions and all observations remain intact. The case shows its applied revision and can open the accepted Port journey after refresh. The new connection is an operator-reviewed interpretation, with `fieldVerified:false`; source-extracted certification is not fabricated.

Reversal is another typed draft/validation/explicit activation. It restores the recorded previous binding or original unknown endpoint while retaining both decisions. A reversal whose prior connection no longer matches the current binding is rejected.

## Integrity rules

- Reviewer role is required for options, preview and mutations. Active revision, exact case/Port, current subject version and source scope must match. Evidence IDs must exist in the recorded source/run/page. Cable/Fiber must exist and be incident to that Port's canonical node; cross-source corrections are not supported by this operation.
- Duplicate physical Port identity, multiple existing bindings, an occupied Fiber endpoint, out-of-range/nonexistent Fiber, or a conflicting explicit local continuation/termination refuses a candidate. Matching number/color/capacity/Route never supplies an edge. Legacy bindings without a canonical-node field cannot bypass occupancy checks.
- Candidate and impact digests are checked on reads/activation. Concurrent review/network changes, a stale preview or changed artifact refuses activation. The ordinary observation endpoint cannot forge the reserved typed correction format. Runtime schema/TLS/write guards remain in effect.
- No migration, dependency, topology engine, splitter rule, renumbering, shade equivalence or physical splice assertion was introduced. Active canonical AP Port-binding cases are supported; historical/staged cases remain read-only. Numbering, colors, duplicate objects and bank identity edits remain proposal-only.
- Prototype bounds: at most 256 incident Cables / 4,096 local Fibers in the selector; comparison snapshots at most 25,000 Fibers and 200,000 changed facts. Exceeding a bound rejects validation rather than silently dropping impacts. Pagination retains the complete supported comparison. These limits do not claim universal Visio support.

## Reprocessing and reconciliation

Fresh source interpretation compares existing human decisions by exact canonical Port/Cable/Fiber identity. It copies decision history into the candidate but never automatically replays a manual binding. A matching source result records agreement. A missing/different/ambiguous result blocks Add and exposes all affected paths/facts through a bounded comparison.

The reviewer can explicitly accept the fresh source result and retain the earlier human interpretation as history, giving a reason and acknowledging all incompatible draft IDs and the comparison digest. This produces a new immutable candidate and refreshed review index; it does not change active state. A separate Add action requires the current candidate digest and active revision. Stale reconciliation, wrong/incomplete decisions and an old candidate digest are rejected. Earlier candidate, impact and source artifacts are retained.

Choosing to preserve the existing manual decision leaves the source candidate staged while the source interpretation is investigated. No automatic carry-forward is offered across changed source evidence. Source history stays inspectable in its original revision/run; historical views do not incorporate future review events. Review ordering follows snapshot ancestry and within-revision versions. A superseded manual binding is never displayed as an active repaired fact merely because its history exists.

## Performed verification

- Full TypeScript suite **832/832**; application and compiler checks include the new correction/reconciliation scripts. Production build and standalone export pass; the existing bundle-size warning remains.
- Backend regressions **16 tests / 6,579 assertions**, including the actual large-source upload/reprocess/apply regression. Final focused correction/review guard tests **8 / 127 assertions** pass. Required formatting was applied. No new Python importer code was changed; the importer suite remains covered by the completed first delivery's 47 checks and the backend full-source regression.
- Known synthetic **Port7 → F13** fixture: desktop 1440px and mobile 390px each complete draft-save/reload, validate/reload, path/fact comparison, disabled Apply before acknowledgment, explicit activation, accepted Port journey, persisted actor/history and explicit reversal. There are no JS errors or horizontal overflow. This deliberately disproves same-number binding assumptions and is not a real AP18 mapping.
- A synthetic reprocess comparison at 390px verifies blocked Add, readable complete impacts, explicit source reconciliation with unchanged active state, digest/revision-correct staged review, separate Add and retained prior human history. No new real VSDX was uploaded in this check.
- Preserved actual Shida and Tsageri checks retain AP16's exact/partial journeys, AP18's unknown binding, F32's AP52 branch and Port38's accepted SC225 path. Source-specific gaps/backlog remain open. See the existing Iteration 35 reports for counts and final rerun evidence.

Evidence: `iteration35-correction-browser-qa.json`, `iteration35-import-reconciliation-browser-qa.json`, `iteration35-correction-preview-1440.png`, `iteration35-correction-preview-390.png`, `iteration35-import-reconciliation-390.png`, and `tmp/iteration35-correction-ts-tests.log`.

All writes/activations were confined to guarded loopback `fiber_atlas_test` / `fiber_isolation` and isolated storage. **Owner-server requests/writes, owner corrections, real AP18 mappings and new real source imports: zero.** No first-time-user comprehension or owner acceptance is claimed. The source-decoding backlog and initial operational-payload reduction remain separate follow-ups.

## Owner-confirmed whole-bank Remap follow-up — 2026-10-11

The owner explains AP18’s Port bank is shifted left relative to straight Cable markers and confirms this bank is F1→Port1 through F24→Port24. The saved local draft snapshot independently shows a systematic old offset: Port2→F1 through Port24→F23, Port1 unknown. This confirmation supersedes the earlier AP18 uncertainty; no global decoder numbering rule is introduced.

The same typed draft/validated-impact/explicit-Apply pipeline now supports **remap**. It removes the selected bank’s old bindings before inserting all corrected bindings, then checks every endpoint with the existing resolver and regenerates projections once. Other banks/ODFs, physical identity, raw geometry and node transitions remain protected. Requirements: complete unique 1–N Port bank and equal-size 1–N Cable, one canonical node/source, one incident Cable, at most 256 Ports, owner-confirmation basis and exact-run evidence. Mixed banks, ambiguous identity, foreign occupied endpoints and explicit optical-continuation conflicts are rejected atomically.

The AP workspace supplies a dedicated bank action even where there is no unresolved Port case. Older Shida Port source references are scoped by their document-derived canonical shape ID in the API and unambiguous incident inventory in the domain; filenames/public AP numbers never select a document. All affected review subject versions are captured and locked at validation/Apply. Every member stores old/new bindings with a shared group, separate stable UUID, actor/source/evidence; original source certification is preserved. Reversal checks all current member decisions and restores the complete old bank. Reprocessing compares every member, retains history and requires explicit reconciliation on disagreement; it never replays Remap.

The preview starts with the complete bounded bank table. Detailed bidirectional path/fact comparisons remain expandable and paginated without truncation. The reusable button does not automatically modify other APs. A read-only uniform-offset scan found AP18 as the only complete candidate in this saved snapshot; incomplete or non-uniform banks are not thereby certified.

Actual snapshot audit: all 24 AP18 endpoints verified in a local projection; 24 journeys/123 derived facts changed, all 9,356 Fibers compared; all other AP bindings, original Ports and explicit node transitions unchanged. No owner-server read/write/activation or new Visio import. Source report: `iteration35-bank-remap-source-audit.json`. Synthetic desktop/mobile reports: `iteration35-bank-remap-browser-qa.json` and two bank-preview screenshots. Final check results are in `VALIDATION.md`.
