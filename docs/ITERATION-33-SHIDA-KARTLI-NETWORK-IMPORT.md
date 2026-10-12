# Iteration 33 — interpret the owner's staged Shida Kartli drawing

2026-10-09. Requirements following the owner's reported `completed / unsupported / staged` result. No application changes or server processing occurred in this planning pass.

## Diagnosis and scope

The owner reports: “The large drawing is stored as a source inventory. Geometry and Fiber topology require source-specific interpretation before it can be added to the network.”

This exact text is emitted by `ImportedNetworkStore::prepare()` when `summary.extractionScope` is `package_inventory`, before `interpret-upload.py` runs. `ImportStore` selects that branch when expanded package size exceeds `fiber_atlas.full_extraction_max_bytes` (currently 64 MiB). The existing large-source test explicitly expects unsupported semantics and refusal to apply; it verifies safe staging, not a usable imported network.

The recent worker delivery was explicitly scoped to upload/staging only. That scope succeeded; full geometry/topology support remains a separate capability. The message is not evidence of a bad password, damaged upload or proven unrecognizable drafting grammar. The large-source branch has not yet evaluated its geometry/fiber semantics.

Owner file available locally: `C:/Users/Beka/Desktop/Visio Alt/შიდა ქართლი 2026.vsdx`, 6,757,465 bytes. The staging report records a 113,255,345-byte page XML and 62,670 Shapes. Verify hash/page/Shape counts against the actual stored upload at task start; do not silently substitute a different revision or the smaller Tsageri fixtures.

Objective: extend the bounded import pipeline to interpret this actual drawing, persist supported objects/connections into the established tables, and prepare a validated proposal that the owner can inspect and explicitly add to the network. No claim of universal Visio support. The owner continues to control server-side Add to network; do not automatically apply a proposal during repair.

## Owner-confirmed drafting-gap instruction — 2026-10-09

Confirmation ID: `OWNER-SHIDA-DRAFTING-GAP-CONTINUITY-2026-10-09`.

The owner confirms that this drawing can contain small drafting gaps while still depicting intended Cable/Fiber continuation. In the reviewed AP16 (Tsveri) F01 example, uniquely aligned strokes stopping slightly short of the numbered marker are intended continuation. This resolves the pending source-convention question.

- A stroke need not physically touch the marker ellipse or have an explicit Visio Connect row to establish continuation. Recover the relationship from the actual drawn stroke/path, unique numbered-marker alignment, bank structure and local node/endpoint context.
- Validate a bounded, source-specific docking rule against multiple structurally matching examples. Measure marker dimensions, spacing, stroke direction and residual gaps. The example's 0.003–0.007 page-unit gaps are evidence anchors, not a universal tolerance.
- Record source Shape IDs, local node, incoming/outgoing Segment/Fiber identities, measured residuals, matching rule and this confirmation ID for recovered transitions. Keep original geometry unchanged.
- The confirmation authorizes this drafting convention; it does not supply a missing counterpart, Fiber number, Port number, physical splice operation or physical Cable identity. Deterministic source-derived mappings may proceed without repeating the same owner question for each matching case.
- Preserve the distinction between physical Cable continuation and individual optical Fiber continuity. A Fiber graph edge still requires a recovered node-local transition. Route adjacency, number/color equality, capacity and unrelated nearest objects cannot create it.
- Crossings without junction evidence, multiple plausible targets, large unexplained gaps, explicit cut/termination evidence and external-document boundaries retain their own unresolved/conflicting/termination treatment. Do not generalize this Shida convention to another source family without validating that family's evidence.

Strict ellipse containment remains useful diagnostic evidence but is no longer a mandatory acceptance gate for the confirmed Shida drafting convention. A gap alone must not be treated as a cut or an end of the Fiber path.

## 33-01 — audit the source family and required evidence

Inspect the original package, all pages, masters/styles, groups, labels, marker banks, connector representations and relevant object properties. Produce a bounded support matrix and source anchors for Cable/Closure/AP/Aggregation identity, local Fiber/Tube numbering/colors, Port bindings, exact transitions/remaps, terminations and use annotations where present. Record unsupported conventions precisely; ask an owner question only for a concrete semantic ambiguity that the source/code cannot resolve.

Do not apply the Tsageri source-specific label/numbering/meaning rules merely because the drawing has the same object names. Reuse generic extraction/geometry/resolver code and audited matching rules where their preconditions actually hold. Page-local Shape IDs must remain source/page scoped. Report meaningful feature coverage and every detected relevant connector disposition; source-inventory count alone does not establish completeness.

Deliver source-family findings, scale/resource measurements and the exact minimum interpreter changes. Preserve all original bytes and the owner's staged source/review history. This audit must not mutate the active network.

## 33-02 — decode geometry at this drawing's scale

Implement bounded full evidence extraction for the actual file: transforms/group nesting, masters/styles, local/world geometry, explicit Connect rows and exact connector/marker attachments. Use streaming/indexed or staged processing as justified by measurement. The inventory summary lacks required geometry and must never be relabeled as a complete raw extraction or passed unchanged to the existing compiler.

Keep separate limits for compressed upload, expanded package/entry size, Shape/element counts, depth, elapsed time and memory. Retain malformed XML/entity/ZIP safeguards. Do not simply remove all limits or raise the 64 MiB threshold without verifying the full extractor, 50,000-record full-index bound, compiler and browser/server resource behavior end to end. The existing 100,000-Shape inventory capacity does not prove full geometry capacity.

Expose durable progress, interruption/failure states and resumable/reprocessable artifacts. A resource failure is distinct from unsupported source grammar. Store versioned complete extraction separately from the preserved inventory-only run. Log counts, time, peak memory and explicit omitted/unsupported features.

## 33-03 — build and validate the actual network proposal

Implement the audited drawing-family interpreter and map output to the existing relational authority model with real identity/FK fields, exact source provenance and independent color/use/occupancy/availability claims. Reuse the current graph resolver and projection-validation path. Unknown objects or ambiguous endpoints remain review cases; do not fabricate edges from numeric equality, proximity, route adjacency or organization labels.

Verify physical route versus optical continuity, local Fiber remaps, branch paths, explicit termination versus unknown stop, Port bindings, repeated source representations and disconnected components. Reconcile to existing active sources only when actual overlap evidence exists; an unrelated region is not forced onto the Tsageri network. Matching display names alone cannot merge assets.

Give the owner a concise real result: recognized entities/connections, unresolved items and any blockers. Add to network is available only for a validated revision with declared partial-coverage limits and pinned current-network expectation. Keep candidate review, proposal generation and application as separate attributed actions. Failures must leave the existing accepted graph intact.

## 33-04 — reprocess the stored upload and improve status wording

Provide an authenticated reprocess action for the already stored source, using new extraction/interpreter versions. Keep document/source identity and existing review history; create a new linked interpretation run when appropriate. Invalidate/re-key cached inventory-only outcomes so unchanged bytes do not permanently return the old unsupported result. Avoid duplicate source documents or redundant uploads. Reprocessing does not apply topology automatically; the owner performs Add to network after inspecting the result.

Replace generic/raw English status messages in the Georgian owner UI with actionable states. For the current inventory-only case explain: file saved; geometry/network interpretation not yet performed for this large drawing; no network changes applied. Once grammar has actually been evaluated, distinguish unsupported symbols/rules from resource limits, processing failure, review-needed results and validated-ready proposals. Do not show an “upload complete” signal as if the network import is complete. Display useful file/object counts and a precise next action; keep technical evidence expandable.

Test actual 62,670-Shape source through upload/reprocess/proposal in isolated local PostgreSQL and fresh browser sessions; mocks alone are insufficient. Verify original-byte retention, counts/provenance, legitimate mappings and negative cases, restart/retry/deduplication, stale apply rejection, layout and Engineer Search/map/Port/Fiber agreement. Retain small-source Tsageri regressions. Compare independently reviewed source anchors, not fabricated expected counts.

Before reporting full support, deliver measured resource limits, source-to-table mapping, evidence-backed coverage, genuine remaining ambiguities and real browser/database results. Distinguish worker-local verification from the owner's later server acceptance. Never clear or reseed the owner's schema for this task; the earlier empty-database preparation is complete and the owner has now uploaded a file.


## Implementation acceptance — 2026-10-09

The owner-confirmed continuation instruction above is now implemented as a bounded, source-specific marker/Port docking rule. See [semantic review](ITERATION-33-SEMANTIC-REVIEW.md) for the validated partial proposal, source-to-table mapping, complete engineering audit and genuine unknowns. Current source-local support is limited to the audited SHA, with 176 Segments / 9,356 Fibers / 1,759 transitions / 766 exact Port bindings. Each Fiber has a current path; unknown continuation remains partial. AP16 Ports13–24 reach AP17 at SC25017; F01 retains blue local identity without borrowing that range.

Actual isolated API/database and desktop/390px workflows pass. Stored-source reprocessing, versioned history, geometry reuse, latest-proposal/stale-activation guards and exact source evidence navigation are delivered. The worker did not access, import into, reset or activate the owner server. The owner applies the reviewed result personally. Continue future interpretation from the declared gaps rather than guessing whole-source completeness or universal constructor conventions.
