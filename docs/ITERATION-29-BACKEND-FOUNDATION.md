# Iteration 29 — database foundation and import reliability boundary

2026-10-05. Requirements and independent report review; implementation not started here.

## Decision and user intent

Begin the local Laravel/PostgreSQL foundation now, preserving the accepted React/TypeScript map and domain behavior. The user agrees to move toward a database before further UI/UX and small features. Engineer answers are too large and insufficiently focused; defer their broad redesign. Fix contradictory operational answers as correctness work, not cosmetic polish.

This authorizes the next backend iteration and supersedes the completed 28L handoff's prohibition on starting a backend. It does not authorize public deployment or declare the importer universal. This chat prepares requirements; the worker implements and records status in HANDOFF.md.

Retain the previously recorded production direction: Laravel API, PostgreSQL system of record, existing web client and Python extraction utility. Do not rewrite the working map or port the graph resolver merely for language consistency. No microservice split, new search engine, GIS rollout or complete editor is needed for this milestone.

## What the latest review establishes

- The 28L test log records 796/796 passing tests. Its browser report records 13 journeys and no runtime errors. This review checked those artifacts and independently matched the standalone SHA-256 to `72111b6eae31c3ad90f4722d4087380bc7080479915a6473f24dc91b7f12884a`; it did not rerun that suite or fresh browser QA.
- SC217 F10/F12 corrections have concrete source geometry, retain F11 as a control, and reach Lentekhi Ports10/12. Current totals are 37 Cable Segments, 2,088 Fibers, 1,631 active transitions and 473 current Lineages. The F12 Silknet/Skytel use conflict remains independent from optical continuity.
- Cross-document linking is demonstrated for the two reviewed sources. The 27D audit establishes shared canonical assets, 143 C151-to-C152 transitions at the document boundary, and separate identities for two different C172 cables. Subsequent 28B–28L evidence supersedes older enrichment/connection limits where explicitly recorded.
- This is evidence for those files and rules, not a guarantee for an arbitrary Visio. The generic VSDX reader and source-specific interpretation are separate. The inbox importer explicitly withholds semantic certification and stages candidate output; matching two recognizable text labels is not sufficient to approve a new source grammar or topology.
- The SC217 error affected familiar marker symbols, not just an unknown object type. Two visible connector endpoints were missed by a fixed center-distance tolerance. The delivered fix activates two scoped corrections; it is not a general repair or certification of every geometry matcher.
- General theme-formula coverage and some curve interpretation remain limited. The reviewed format is VSDX; arbitrary legacy Visio formats are not certified.

Sources: [28L audit](ITERATION-28L-SC217-SOURCE-AUDIT.md), [validation](VALIDATION.md), [28L browser results](iteration28l-browser-qa.json), [24 extraction certification](ITERATION-24-VSDX-IMPORTER-CERTIFICATION.md), [27D topology certification](ITERATION-27-TSAGERI-ALPANA-TVISHI-CERTIFICATION.md), `scripts/import-inbox.py`, and `src/data/repository.ts`.

## Remaining correctness issue found in delivery evidence

The saved 28L browser journey “F10 path, Closure/Cable inspection, physical context and browser history” contains a C171 Inspector summary stating F01–F28 and F30–F48 have unresolved continuation, with only F29 mapped. That includes F10/F11/F12 even though their active paths cross SC217.

Code inspection explains the discrepancy: `SegmentInspector` in `src/views/RouteWorkspace.tsx` calls `segmentContinuationGroups`; `src/domain/cableContinuity.ts` builds those groups from historical `data.cableContinuations` and manufactures uncovered ranges as unresolved. It does not consult the current node-transition graph there. Thus passing path and layout checks did not establish agreement of every operational summary.

Worker must reproduce in the current standalone, replace operational continuation summaries with a shared current-graph projection, and check immediate local mappings at each cable end. Preserve historical evidence views with explicit historical scope. Group only Fibers with genuinely equivalent mappings/status; do not join numeric ranges across remaps, branches or gaps. Check Cable/Tube summaries and their search consumers for the same source of stale facts. Do not change accepted topology to make a summary agree.

Acceptance: C171/F10, F11 and F12 show their exact C172 continuations at SC217, agree with individual paths, and never appear in an unresolved range there. Genuine SC207/F118 gaps, branch alternatives, unknown Port bindings and explicit SC225 termination remain distinct. Add a regression against the erroneous range, not only a snapshot of the new wording.

## Backend scope and authority

### A. Persistence contract and baseline

Before migration, export a reproducible active 28L baseline through the existing repository. Include canonical IDs, local Fiber/Port identities, transitions, bindings, source/evidence references, review claims and current derived signatures. Record schema, source, interpreter and topology revisions. Keep frozen V1 as an immutable historical reference, separate from the current operational graph.

Write a short schema/API decision record and implement it in this iteration. Use relational records and constraints for canonical Nodes/assets, Cable Segments, Fibers, Ports, exact transitions and bindings; preserve source documents/revisions and their many-to-one representations/evidence associations. JSON payloads are appropriate for raw source evidence and extensible attributes. A single opaque Inventory JSON blob is not the completed system of record.

Source Shape IDs are scoped to document revision/page; C172, SC labels, filenames and display aliases are not global primary keys. Hash identifies file content, not a physical cable or the permanent identity of a document. A source rename must not duplicate accepted assets. A new hash does not alone prove a different document, nor does a reused filename prove the same document. Store explicit document/revision and canonical reconciliation decisions.

Preserve physical construction, operational use, organization claims, Port occupancy, allocation/availability and owner reports independently. Unknown values and competing claims must survive the migration. Source interpretation is not field verification.

### B. First working vertical slice

1. Provide local Laravel/PostgreSQL setup, migrations and repeatable seed/import of the reviewed baseline. Keep credentials outside tracked files. Use a single application layout and the existing tooling where practical.
2. Load the existing web client through an API implementation of `NetworkRepository.load()`. Keep the existing TypeScript resolver authoritative for path calculations initially; do not build a competing PHP routing algorithm. Laravel serves persisted authority records plus revision-consistent projections. Build/materialize projections using the existing domain code, or resolve them in the client through a documented single path.
3. Keep the offline repository/export as an explicit reference/demo mode. An API failure must show a clear connection/error state; it must not silently display the offline snapshot as current database data.
4. Persist an append-only review decision with actor, time, source/evidence revision, correction payload/reason and previous revision. Demonstrate that it survives application/database restart and appears consistently in a second client session. Review acceptance alone must not secretly create topology edges.
5. Protect writes with an authenticated reviewer identity and server-side authorization; a read-only caller cannot write. Validate request references and reject stale concurrent updates rather than silently overwriting them. Use the smallest existing Laravel mechanism suitable for the app; no elaborate role-management UI is required.

### C. Staged imports and revision safety

Persist source files in application-controlled storage and their hashes/references, import runs, tool/rule versions, stage/status, candidates, warnings, errors and review events in the database. Keep original bytes and raw extracted evidence immutable. Reuse Python extraction rather than rebuilding it in PHP.

Identical content reimport must not duplicate canonical entities or accepted decisions. Permit a deliberate new interpretation run when tool/rule versions change, linked to the same source revision, with an explicit comparison. Treat changed source content as a staged revision and produce additions/changes/removals/ambiguities; do not replace accepted inventory automatically or erase records still supported by another document.

The first milestone may ingest and inspect a new source without activating its topology. Show extraction success, semantic coverage and active-network status separately. Unknown grammars/objects, ambiguous marker attachments and unresolved cross-document identity remain visible, reviewable candidates. A syntactically valid VSDX is not a certified optical network.

Activate the reviewed baseline atomically with a revision identifier. Readers must never combine graph records from one revision with paths/use/search projections from another. Validate before switching the active revision, retain the previous revision for rollback, and leave it active if the transaction or projection build fails. Implement/test that boundary for the baseline now; general new-source topology activation can follow after its semantic/reconciliation gates are implemented.

Apply upload size/package limits, safe stored filenames and bounded extraction execution as part of this import endpoint. Do not expose a user-provided host path or an unrestricted shell command through the API.

### D. Importer reliability work alongside persistence

Add an explicit support/coverage report for each source: package extraction, recognized grammar, object/marker accounting, connector-end dispositions, optical transitions, cross-document identity, and remaining unknowns. Every detected relevant connector must have a recorded disposition; this is accounting for what the interpreter detected, not proof that no source feature was missed.

Use SC217 as a regression for omitted endpoint attachments. Test geometry inside actual transformed marker boundaries, offsets, rotations/flips, competing hits and absent Connect rows. Unique evidence may support a candidate; ambiguous/unsupported geometry must not become an invented splice. Do not widen one global tolerance until things connect.

Add cross-document contract cases for true overlap, same-name different cables (both C172 identities), renumbered Fiber transitions, unresolved boundary, changed revision and repeat import. Reconcile actual overlapping evidence before joining accepted entities/edges; equal number, color, organization name or physical adjacency is insufficient.

Retain the scoped 28L correction unless and until a generalized interpreter reproduces its exact evidence and all affected-path checks. Never transfer source-specific Shape IDs or rules blindly to another file.

Before advertising support for a new drawing family, validate at least one previously unreviewed real VSDX from that family against independently reviewed connector/endpoint examples and cross-document joins. No such new file was reviewed in this planning pass. Synthetic tests and replaying the existing two sources are useful but must not be presented as that held-out acceptance. Its absence does not block local database/API work; record it as a later import-support gate.

## Delivery acceptance

- Demonstrate a fresh local PostgreSQL setup, seed, API load, restart, persisted review, read/write authorization and failed/stale write handling. Use actual PostgreSQL integration tests, not only an in-memory substitute.
- Compare all 2,088 local Fiber path structures, active transitions and exact Port bindings against the 28L baseline. Report any intentional serialization/schema differences separately from semantic changes. No graph changes are needed for persistence or the summary correction.
- Verify cross-source identity, repeat seed/import, changed-source staging, revised interpretation, failed activation, rollback and revision-consistent projection reads.
- Verify current routes in the API-backed UI: Silknet/F12 conflict and Lentekhi endpoint; F10/F11; F32/AP52; Port38/SC225; AP42 Port16/SC207 gap; Tsageri unknown binding; distinct C172 assets. Check C171 summary agreement explicitly.
- Run relevant Python/importer tests, existing domain suite, TypeScript/build and backend integration tests. Preserve the working offline export. Save commands/results, actual environment, screenshots and limitations in an implementation review and VALIDATION.md.
- If runtime/database tooling is unavailable, complete independent schema/contract/source work and record the exact blocked integration step. Do not label the backend verified or Done on the strength of code generation alone.

This milestone is a working local persistence foundation. Public production readiness still requires the selected deployment environment, backup/restore verification, operational monitoring and a release/access review. Do not equate the current prototype tests with those completed activities.

## Deferred engineer-answer improvement

Answer the specific question first, normally in one short sentence plus the relevant route or compact table. Show exact local identities/remaps and the endpoint or precise gap; offer evidence and full inventory on demand. For example, “C169/F12 reaches Lentekhi Port12; the route carries conflicting Silknet/Skytel use evidence.” Do not dump every neighboring cable, all Fibers or repeated provenance into a simple answer. Ambiguous questions should show a small scoped choice, not silently pick an object.

Preserve this as the next UX backlog after the database slice. Incorrect or contradictory answers are not deferred with visual polish.
