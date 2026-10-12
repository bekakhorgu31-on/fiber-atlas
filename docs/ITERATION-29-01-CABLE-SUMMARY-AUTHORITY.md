# Iteration 29-01 — active Cable and Tube continuation summaries

Date: 2026-10-05. Status: Done.

## Correction

The operational C171 Inspector previously used historical `CableContinuation` data to display F01–F28 and F30–F48 as unresolved at SC217, despite the active Fiber graph continuing those fibers into C172. Operational Cable and Tube views now derive each local mapping from active `NodeFiberTransition` edges. Route direction is used only to describe the end; it never creates a Fiber mapping.

Adjacent mappings are grouped only when they share the same node, direction, destination, status and contiguous number offset. Fibers with a different target, gap, conflicting alternative, or explicit stop stay separate. Uncovered source positions remain unresolved. No topology record or routing authority was changed.

Previous `CableContinuation` records remain immutable and can be read through `historicalSegmentContinuationGroups`. The Cable Inspector exposes them only under a collapsed, explicitly historical section. This prevents older interpretation records from appearing as current operational truth.

## Search and verification

Cable and Tube compact search facts now use the same active graph projection as their Inspectors. C171 reports the SC217 active mapping F01–F48 → C172/F01–F48; individual F10, F11 and F12 each map to the exact same-number C172 Fiber. None are classified as unresolved. Tube 1 and its search result agree with those local mappings. Existing SC207 gap, C172 split, candidate and SC225 termination cases remain covered by the prior suite.

- 801/801 repository tests pass, including five new regressions for F10/F11/F12, historical preservation, Tube summary, and Cable/Tube search.
- TypeScript compilation and Vite build pass. The known large standalone-bundle advisory remains.
- Standalone Edge QA passes four C171 Cable, Tube, Cable-search and Tube-search journeys with zero browser errors. Screenshot: `iteration29-01-c171-cable.png`; machine result: `iteration29-01-browser-qa.json`.
- Refreshed standalone SHA-256: `FDBAFD333981C79C1F3F0D4B09B572A243118B88996942C82DF71877E5157FF6`.

Implementation: `src/domain/cableContinuity.ts`, `src/domain/iteration28g.ts`, `src/views/RouteWorkspace.tsx`. Regression coverage: `tests/iteration29-cable-summary.test.ts`.
