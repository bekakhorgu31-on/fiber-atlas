# Iteration 31 — empty-network Visio import test

**Superseded delivery objective (2026-10-08):** the owner clarified that they will perform imports personally, using a local app URL connected to the existing server database. Follow [Iteration 32](ITERATION-32-OWNER-IMPORT-EMPTY-SERVER-UI.md). The isolated test cases below remain useful worker verification, but do not deliver a pre-imported test app or activate the old server baseline as the next user outcome.

2026-10-08. Worker instructions requested by the owner. No database was emptied or imported by this planning pass.

## Objective and boundary

Prove what the application can reconstruct when it starts with no network data and receives the original Visio documents one at a time. Show exactly which connections are derived from source, which require a review decision, and which remain unsupported. A reload of the prepared database snapshot does not satisfy this test.

Use the existing isolated **local** PostgreSQL test database (`fiber_atlas_test`) with a dedicated schema such as `fiber_import_replay_31`, a separate application process/profile, and a fresh browser context. Keep the owner's server `10.0.61.15:5432/on`, schema `bkhorguashvili`, unchanged. The server's imported baseline is the reference dataset; its pending activation is a separate task. This clean-test request does not approve that previously rejected activation or deletion of the owner's database.

Before any destructive test reset, independently validate loopback host, actual connected database, role, current schema, explicit test marker and exact allowlisted schema. Refuse remote hosts, database `on`, schema `bkhorguashvili`, `public`, or a mismatched effective target even if a profile says “test.” Create a new isolated schema if needed; do not repurpose an unverified existing one. Keep the owner's `backend/.env` intact. Do not weaken remote reset guards or run the standard whole-database reset against this task's shared local test environment. Scope any replay cleanup only to the verified disposable schema.

## Inputs and comparison reference

Original files, freshly hashed during planning:

| Import order | Original source | SHA-256 |
| --- | --- | --- |
| A first | `C:/Users/Beka/Desktop/Visio Alt/Tsageri-Lentekhi 2025.vsdx` | `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa` |
| B second | `C:/Users/Beka/Desktop/Visio Alt/Tsageri-Alpana-Tvishi.vsdx` | `419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d` |

Retain source bytes unchanged and hash them again when imported. Stop for a source-revision discrepancy rather than silently applying an old shape-specific rule to changed bytes.

The current reviewed combined reference has 37 Cable Segments, 2,088 Fibers, 1,631 active transitions, 384 exact Port bindings and 473 current Lineages. Compare complete identities, local mappings, evidence, paths, stops and conflicts, not only totals. It includes accumulated owner decisions and source corrections; source-only import is not required to fabricate those decisions to match these totals. Use Source A-only evidence for the first stage; never demand the combined network from the first file alone.

Reference snapshots, old raw caches, interpreted JSON, `pilot.json`, historical repository overlays and the existing server seed may be read by a separate comparison process. They must not populate the fresh import or satisfy missing authority. Isolate fresh source storage, import-job state, raw artifacts, projections and relevant browser caches so a cache hit cannot masquerade as reconstruction. Existing extraction/interpreter/resolver code may be reused, but audit its inputs for hidden fixture dependencies. Instrument provenance and log consumed input files/tool versions.

## 31-01 — establish an actually empty application

Create schema-only migrations and only the minimum explicitly identified test user/session setup; do not seed network records. Assert zero source documents, import runs, canonical network entities, transitions, bindings, reviews and current paths; active revision is null. Technical migration/account rows are permitted and must be reported separately.

Open database mode with a fresh browser context. An intentionally uninitialized network must display a clear empty state and an import action, not a broken page, a stale map or the offline example. A connection failure must remain a connection failure, not be mislabeled an empty network. Record API responses, screenshot, database counts and effective local target. Keep all requests within the isolated test profile.

## 31-02 — import Source A through the actual workflow

Use the application's upload/import workflow with the original Source A VSDX. Freshly extract, interpret and stage it. Record every stage and distinguish extraction, semantic interpretation, review and active-network status. Inspect all detected relevant connector dispositions and the exact reason for unresolved/unsupported objects or mappings.

The current 29/30 implementation deliberately stops at staged candidates for new source topology. Investigate and implement the missing bounded bridge for the two known source grammars where needed: source-derived candidate authority, explicit review, canonical projection, existing graph validation and atomic activation into the disposable local test schema. Do not build a second routing engine or a general “all Visio files” framework. Never route this test through `fiber:seed-baseline` or manufacture accepted rows from the expected snapshot.

Activate only validated, source-supported authority in the local test environment and show its paths/ports/map through the existing client. Unsupported information remains explicit. If a required semantic step cannot be completed from available evidence, record the exact missing mapping/step and continue independent tests; do not bypass it with the baseline or call the full import Done.

## 31-03 — add Source B and verify the document boundary

Upload the original Source B into the same local test network after A. Keep A's approved authority visible while B is staged. Reconcile source representations to canonical identities with evidence, then atomically activate the validated combined test revision.

Verify shared C148/C149/C150/C151/C169 and shared nodes are not duplicated; preserve A and B evidence. Separate the two distinct C172 identities. Inspect the exact C151-to-C152 boundary transitions at SC207, remapped local Fiber identities and the real F118 gap. Unknown symbols or unresolved joins stay reviewable and do not connect by equal names, colors, Fiber numbers or proximity alone.

Stage isolation must be real: incomplete/failed B processing cannot mutate A's accepted graph, and candidate review acceptance alone cannot silently create topology. Bind all derived path/use/search/map results to the active test revision.

## 31-04 — distinguish automatic import from reviewed completion

Produce two separately labeled results:

1. **Fresh source-derived result:** only original VSDX bytes, versioned interpretation rules and decisions actually made through this test workflow. Record each new review action and count it as manual intervention; do not advertise zero-touch import when decisions were needed.
2. **Reviewed reconstruction:** apply only explicitly enumerated historical owner decisions or corrections that cannot be independently recovered from source. Each overlay must retain evidence, source hash/scope, attribution and reason. Recompute all dependent projections. This is controlled review replay, not automatic import.

SC217 F10/F12 must be regenerated from original connector geometry by the corrected interpreter/audit, not copied as two unexplained transition rows. Keep F11 as the unchanged control. Separately preserve the dated owner endpoint report and F12 Silknet/Skytel use conflict. Distinguish grammar conventions, source-derived repairs and owner-only assertions in the dependency manifest.

Compare every current local Fiber path, exact transition and Port binding against the reviewed reference. Classify deltas as missing source rule, necessary owner decision, source ambiguity, identity/reconciliation error, stale projection, legitimate correction to the reference, or actual source change. Historical evidence is a comparison reference, not infallible ground truth. Any justified difference must be explained and reviewed instead of forcing counts to match.

Golden journeys: SC217 F10/F11/F12 to Lentekhi Ports10/11/12; Silknet F12 with retained conflicting use; F11/AP49 remaps; F32/AP52 branch; Port38 through C181 to SC225 termination; AP42 Port16/SC207 genuine gap; Tsageri unbound Port state; C148 Tube-color conflict; both C172 identities. Cable/Tube summaries, exact search, Port/Fiber entry points and animation must agree with the same current graph.

## 31-05 — prove repeatability and deliver an honest result

- Reimport unchanged A and B, including a renamed byte-identical copy: no duplicated entities, transitions, bindings or review decisions. Same bytes do not become a different physical network because the filename changes.
- A deliberately changed test revision or unsupported/corrupt package remains staged/failed and preserves the accepted graph. Make any synthetic source variants only in the disposable test area, clearly labeled; never edit originals.
- Repeat the clean A-then-B run from zero within the verified disposable schema. Compare normalized semantic outputs/evidence and manifest/tool versions; exclude run IDs/timestamps only where explicitly justified. Review decisions must be replayed explicitly, not silently retained from the first run.
- Restart the test app/database and use a second fresh browser context to confirm persisted network/review state. Check desktop and mobile map/import UI, API failure behavior and independent offline mode.
- Save test-profile start instructions and a user-openable test URL identifying the disposable dataset. Save counts at empty/A-staged/A-active/B-staged/B-active/reimport stages, provenance/dependency manifest, semantic diff, manual-decision list, commands/results and screenshots.
- Update HANDOFF.md and VALIDATION.md with actual status. The full milestone is Done only after the clean workflow is exercised end to end and all required unexplained correctness differences are resolved. Partial extraction/staging success remains partial. Record blocked stages precisely and retain the working comparison reference.

This certifies reconstruction of two already reviewed documents only. It does not certify an unseen drawing family. General UI polish, public deployment, remote-schema deletion and activation of the owner's existing server dataset are outside this test milestone.
