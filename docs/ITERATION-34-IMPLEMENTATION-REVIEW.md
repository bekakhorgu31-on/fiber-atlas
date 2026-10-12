# Iteration 34 — inspectable review workflow

2026-10-10. The owner-reported applied Shida network is preserved. Implementation and verification use the guarded loopback fixture only. No owner-server request, reset, import, activation or schema migration was performed.

## Data and scope contract

`ReviewInboxStore` reads persisted `sourceReviewCases`, relevant canonical assets, source documents and append-only review events. Active/historical lists use bounded domain-record queries rather than projection snapshots. New staged candidates receive a separately pinned, digest-checked `review-index.json` while their authority is already in memory. Its cap is 8 MiB / 10,000 cases; list pages contain at most 50 rows. An older staged attempt without this artifact returns a distinct unavailable-index state and requests explicit stored-source reprocessing. Browsing never reads its 153 MB candidate.

The review context pins the network revision, source revision and import attempt. Source attribution uses explicit provenance, canonical membership and source-scoped IDs; shared AP numbers and filenames cannot merge regions. Older Shida snapshots without the new provenance fields retain their source-scoped ID checks. Duplicate-label provenance is checked against original indexed text and its source-document identity. Missing identity is surfaced rather than guessed.

Frozen proposal case totals, open/reviewed dispositions, interpretation uncertainty and pending source imports remain separate. Conflicts are a subset of cases. Older unsuccessful attempts are excluded from current pending-source work when a newer interpretation supersedes them. Legacy issues remain supported and are deduplicated against source case IDs.

## User experience and evidence

Import counts open their exact source/run inventory; a conflict action filters that same list. The new workspace groups related Ports by canonical AP and the eight fill conflicts by Cable. Five categories, source/status/search filters, pagination, stable deep links and restored Back/Forward/list position replace the large anonymous decision dropdown. Desktop panes scroll independently; mobile switches between list and detail with a visible return action. Engineer Search remains a primary navigation entry.

The existing deferred Lineage/sheet loader is removed from review entry. Selected source details load separately. The source viewer redraws stored world geometry, transformed marker ellipses and exact text in bounded neighborhoods, with zoom, pan and issue/full-crop fit. It shows separate source locations for conflicts and duplicate labels and the complete numbered bank for irregular Port cases. Original fills and Shape IDs remain visible. This is a source-geometry view, not the simplified network schematic or a pixel-identical Visio font renderer. A 600-Shape-per-crop cap and truncation warning prevent a whole drawing download; missing geometry or exact-run provenance is an error, never a latest-file fallback.

Coverage facets expose the exact-run banks, annotations and excluded raw Ports separately from the case total. Local-link counts and further construction/aggregation/endpoint questions link to the engineering backlog. Semantic artifact access is bounded and source-checksum scoped; no new optical fact is derived in that view.

## Decisions and integrity

Existing reviewer permissions, active-revision locks, expected subject versions and immutable review events are reused. Notes/reopen actions remain unresolved dispositions; source corrections are saved with exact Shape-level old/new values as proposals. The server forces `applied=false` and `fieldVerified=false`. Dismissing a concern with a reason closes review work but does not change source or graph attributes. Historical events remain readable. Staged and historical contexts are read-only because the existing event model pins events to an active persisted network; a future staged-note model would require an explicit separate design rather than writing comments into an unrelated active revision.

Source-local reprocessing now retains rejected one-marker Port candidates, bank/label/stroke references and measured docking reasons before discarding them. Accepted mapping gates and optical traversal rules are unchanged. The full-source audit independently classifies the remaining candidate outcomes; older accepted snapshots without stored diagnostics remain truthfully undiagnosed in the app.

## Audit and next work

The real fixture reconciles **506 Port cases + 89 bank cases + 8 fill conflicts + 2 numbering cases + 1 duplicate identity = 606 unique cases**. The eight conflicts are included. All five categories have inspectable source neighborhoods. The 23 AP groups preserve their distinct child records and singleton cases. The root-cause report covers all 89 incomplete associations, 47 node-unassociated banks, five unlabelled pairs, 2,627 rejected links and 579 purpose-classified text occurrences.

Read [the digitization backlog](ITERATION-34-DIGITIZATION-BACKLOG.md), [reproducible diagnostics](iteration34-rejection-diagnostics.json), [actual local persisted inventory](iteration34-active-fixture-inventory.json) and [owner guide](ITERATION-34-OWNER-GUIDE.md). These are audit evidence, not hard-coded production input. Proposed numbering, shade normalization, duplicate equivalence and bank-grammar improvements require separate evidence-backed comparison and owner activation. No uncertainty is declared fixed by this iteration.

## Validation checkpoint

Actual large-source upload/reprocess creates a staged lightweight index; its 606-case count opens before Add without changing active state. Local owner Add supplies the disposable active fixture. Desktop 1440px/mobile 390px QA passes 26 workflows across all categories, all case IDs, group counts, source detail, reload, exact AP18/Port1 and AP37/Port14 searches, coverage ledgers and persisted observations. Eight additional navigation/recovery workflows cover Back/Forward, exact-source retry, both original AP43/AP47 anomalies and no automatic renumbering. Zero browser errors or owner-server writes.

Measured list maximum: 140956 bytes; selected-detail maximum: 17852 bytes; two-crop source maximum: 1442869 bytes. Maximum measured evidence read: 1.427s on the local fixture. No `/network/{revision}/details` request was required for review entry. TypeScript: 818/818; Python: 47/47; isolated review contract checks passed initially 3 tests / 41 assertions. Final affected backend checks pass 7 tests / 6,410 assertions; final measurements and historical distinctions are in VALIDATION.md.
