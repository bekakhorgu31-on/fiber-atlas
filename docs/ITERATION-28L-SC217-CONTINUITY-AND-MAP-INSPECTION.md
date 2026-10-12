# Iteration 28L — SC217 continuity correction and consistent map inspection

Requested 2026-10-05. Status: **Ready for worker investigation and implementation**. The current user correction expands scope beyond presentation: investigate the reported missing Fiber continuation as well as the overall-flow navigation defect. Track task status in HANDOFF.md.

## User correction and screenshots

The user reports that Silknet Fibers F10/F11/F12 pass from AGG5 through SC206 and SC216, but F12 disappears after SC217 even though it continues to Lentekhi (called AGG6 by the user). The same issue is seen in the overall flow. The user also rejects the sparse object page and large stacked Fiber cards shown after clicking the map.

Record this as a dated owner/user-reported endpoint-continuity correction for the F12 case. It is not a statement that every local Fiber keeps the same number or that a particular SC217 splice pair has been confirmed. The user's note does not explicitly settle F10's endpoint or the conflicting organization labels. Preserve that scope. Use the existing canonical Lentekhi identity (`AGG-LENTEKHI`); the AGG6 wording does not authorize overwriting the separate legacy-number conflict.

User images are preserved as `iteration28l-user-fiber-view.png` and `iteration28l-user-sc206-view.png`. Image 1 shows **C148/F154**, which is the upstream identity of **C169/F10**, not F12. It is a useful adjacent failure case, and must not be confused with the user's explicit F12 report.

## Findings verified during planning

Current offline standalone paths were inspected in headless Edge. Complete displayed text and URLs are in `iteration28l-path-reproduction.json`.

| Selected local Fiber | Current behavior |
|---|---|
| C169/F10 | AGG5 → C148/F154 → SC205 → C150/F154 → SC206 → C169/F10 → SC216 → C171/F10 → SC217; no continuation recorded. |
| C169/F11 | Already reaches Lentekhi ODF Port11 through the downstream chain; the other end reaches AGG5 with exact aggregation Port unknown. Preserve it. |
| C169/F12 | AGG5 → C148/F156 → SC205 → C150/F156 → SC206 → C169/F12 → SC216 → C171/F12 → SC217; use is review-required and no continuation is recorded. |
| C184/F12 | Lentekhi Port12 → C184/F12 → C180/F12 → C179/F12 → C178/F12 → C177/F12 → C176/F12 → C174/F12 → C172/F12 → SC217. Current use label is Skytel. |

Both `iteration21-routing-evidence.json` and `iteration24-fresh-transitions.json` contain SC217 mappings for neighboring F9, F11 and F13, but no SC217 edge involving F10/F12. The missing display therefore agrees with a gap in the current interpreted graph; this is not established as a rendering-only defect. Why the interpretation omitted these transitions remains to be audited in the preserved raw source. Do not use neighboring number patterns to invent an edge.

The map-navigation defect has a separate cause. `RouteWorkspace` routes AP targets to APWorkspace, but other selections still use `FocusedRoute`. Its asset fallback lists adjacent Cables, and Fiber mode renders the oversized vertical cards. Selection resets `showFull` and `detailOpen`; clicking SC206 therefore replaces the overall map and closes details. The new organization workspace does not fix those generic overall-flow entry points.

## A. Audit the exact SC217 continuity

Trace F10, F11 and F12 in both directions across SC206, SC216 and SC217. Compare raw Visio Connect rows, transformed connector geometry, numbered banks and local marker identities against generated transitions and active resolver edges. Include the downstream C172 sides and exact Lentekhi endpoint bindings. Check both source revisions where relevant, using source-scoped IDs.

Produce a compact per-Fiber audit: upstream local identity, exact SC217 incoming/outgoing identity if established, connector/marker source references, importer disposition/rejection reason, active transition, downstream endpoint, use claims and outstanding uncertainty. F11 is the positive control. Inspect nearby omitted/candidate connectors by geometry and source records, not by assuming a missing sequential Shape ID.

Distinguish: a missed source-supported connector, an intentional source omission, a stale active/projection record, an owner correction beyond the document, a real remap and an organization-use conflict. The organization filter must not determine whether optical continuity exists.

If raw evidence establishes the missing connection, fix the source interpretation/active correction at its authority layer and regenerate dependents. If it establishes a remap to another Fiber, follow that mapping. If only the reported Lentekhi destination is known, preserve that owner assertion and identify the exact still-missing local mapping rather than claiming a confirmed splice or silently rejecting the user's correction. Ask a narrowly scoped mapping/evidence question only after exhausting the available source audit; continue UI work independently.

## B. Apply a traceable correction and reconcile use

This task authorizes evidence-backed correction of the reported continuity defect. Earlier instructions to preserve all active topology hashes/counts were for UI-only iterations and must not block an explained correction here. Preserve original raw source and the frozen V1 package; represent new owner evidence and source interpretation revisions explicitly, with old/new affected records and reasons. Do not edit generated display JSON as the sole fix.

Reconcile the C169/F12 review state and C184/F12 Skytel claim with the user's Silknet report. Connectivity and organization use are independent: a valid continuation may coexist with conflicting/dated use evidence. Do not replace Skytel with Silknet or assign ownership just to make the map appear continuous. Show the scoped claims/conflict until resolved. Never assume C171/F12 joins C172/F12 because the numbers match.

After an established correction, regenerate current paths, signatures, Lineages, Journey summaries, use projections, organization membership/grouping, search and visual overlays. All entry points must use the same corrected authority. Counts such as four Silknet groups and 1,629 transitions may legitimately change; report actual deltas with causes instead of enforcing obsolete totals. Prove unrelated source, topology and regression cases remain unchanged.

## C. Keep the overall map during every normal inspection

Extend the accepted 28J/28K inspection pattern to Closure, Cable, Fiber, Aggregation and unbound Port selections in the overall network and physical-route views. Reuse RouteJourney and existing inspection components; do not add another visual style or another resolver.

- Clicking SC206 highlights it and opens its immediately readable details in the rail while the overall flow remains visible. Keep the origin, destination/context, current optical selection, organization filter, branches and viewport meaningful.
- Clicking a Cable inspects it without replacing the map with two endpoint cards. Clicking a Fiber selects its optical overlay and connected diagram without reverting to the large stacked-card screen.
- Inspection state is separate from changing the workspace target. Only an explicit “Open as destination” or equivalent changes the route subject. Back/Forward and reload must restore the expected state.
- All map contexts use a genuinely scrollable desktop rail and accessible mobile details. Do not require a generic collapsed “selected details” disclosure before showing the selected object's useful information.
- Long routes retain visible origin/destination context, remaps and boundaries. Use fit/overview plus readable focused steps or controlled scrolling, not huge cards or tiny scaled labels. The old detail layout may remain as an explicitly requested technical report, never the default consequence of a map click.

## D. No disappearing continuation

Show explicit distinctions between a known termination, an unresolved transition, a hidden/collapsed continuation and a filtered organization-use boundary. A selected Fiber must never appear to physically end merely because an organization label changes. Show known connectivity beyond the use boundary with appropriate neutral styling and a clear use-evidence explanation.

Before the mapping is resolved, preserve the known upstream route and the physical downstream context toward Lentekhi, with a visibly marked unresolved optical link at SC217 and the recorded user-reported destination. Do not draw or animate a confirmed optical edge through that gap. After correction, the selected path and animation must cross the exact established SC217 transition and reach the supported Lentekhi endpoint/Port. Do not animate by Cable adjacency or a blanket F-number rule.

## Acceptance journeys

1. Trace C169/F10/F11/F12, C171/F10/F11/F12 and the actual audited downstream counterpart(s) from both ends. Compare exact ordered identities and stops with source evidence. Record one disposition per Fiber; do not mark an unresolved mapping fixed.
2. For the user-reported F12 continuation, either demonstrate the evidence-backed full route to Lentekhi or retain an explicitly pending, precisely scoped correction with the unresolved mapping identified. A prettier line or a repeated “source unknown” assertion is not completion of the investigation.
3. Check Silknet search, selected organization strand, overall flow, direct Fiber search, Cable/Fiber inventory and Lentekhi Port entry. They agree on the same current route. Prove any splitting/merging of organization groups or changed membership is a consequence of reviewed evidence, not truncation/filtering.
4. In the overall network, click SC206, inspect C169, select F10 then F12 and inspect SC217. The connected map remains visible; context and inspection remain distinct; no screenshot-style empty neighbor page or giant legacy cards appear. Repeat via direct search and via the organization map. Back/Forward/reload restore meaningful scope.
5. Check both directions and animation after correction; include F11 as the unchanged control. If unresolved, animation stops at the real evidence boundary while downstream physical context and the user report remain legible.
6. Verify rail wheel/PageDown/last-action reachability, mobile 390/320px, 1366×768 desktop, zoom, keyboard and reduced motion. Preserve AP42/Port16's separate SC207 gap, Port38/SC225 termination, F11/AP49 remaps, Tsageri unknown bindings, C148 color conflict and source-scoped C172 identities.

Run relevant/full tests, build/export and artifact-bound offline browser checks. Save a source audit, old/new affected-record and projection diffs, actual count/hash deltas, screenshots and exact remaining limits. Retain immutable raw sources and frozen V1. No new source import, backend, deployment or unrelated topology cleanup.
