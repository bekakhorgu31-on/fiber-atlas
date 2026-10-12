# Iteration 28J — persistent AP workspace and complete route context

Requested 2026-10-03. Status: **Done**. Delivered implementation and browser-profile limits: [28J review](ITERATION-28J-IMPLEMENTATION-REVIEW.md). The requirements below are retained as the acceptance contract. Status tracking: `../HANDOFF.md`.

## User problem and reproduced findings

The user cannot tell where they are after selecting an AP. Port information requires expansion, the right panel does not scroll, and the AP view shows only the preceding Cable instead of its route from an aggregation point. Repeated navigation obscures the network context.

The planning session reproduced these issues in offline headless Edge at 1440×900 against the exact 28I standalone SHA-256 `117fd2e39bba4daf111d09033ce1a3044cbf83116f30f796b5046cb0db1b309c`.

1. AP42 opens `select=network_node:42`; the visible body contains only AP42 and C153 / SC208 ↔ AP42. This is an immediate-neighbor list, not the full route.
2. Details initially close. Selecting Port 1 changes selection and closes them again. `RouteWorkspace` resets `detailOpen` and `showFull` whenever `selectionValue` changes. `FocusedRoute` uses the same `onSelect` for a new route target and for inspecting a route node. This conflates inspection with changing the workspace's subject.
3. The desktop body is bounded to 771px and clips overflow. The selected-details child measured 901px, its inspector 831px. The inspector has `overflow-y:auto` but equal client/scroll heights, so setting its scrollTop to 800 leaves it at zero. The child expands instead of owning a scrollable viewport. Programmatically scrolling the hidden-overflow ancestor is not a usable repair.
4. Port 1 already has this resolver-derived path: AGG5 — C148/F103 — SC205 — C150/F103 — SC206 — C151/F103 — SC207 — C152/F103 — SC208 — C153/F01 — AP42/Port1. The AGG5 endpoint's exact Port/continuation remains unknown. This evidence must not be promoted to a fully known AGG Port-to-Port service.
5. AP42 Port16 is different: the known Fiber path starts at SC207 on C152/F118, remaps at SC208 to C153/F16 and ends at AP42/Port16. A full *physical* Cable context from AGG5 is possible, but the Fiber cannot be painted as connected across the SC207 gap.
6. Port 1's source occupancy is `in_use`, while the focused header reports unknown. `PortOperationalView.occupancy` contains localized display text; `FocusedRoute` compares it with raw `in_use`/`unused` enum strings. This display regression must be fixed, not hidden by the redesign.

Reproduction: `iteration28j-review-reproduction.json`; screenshot: `iteration28j-before-ap42-desktop.png`. `iteration28j-ap42-preview-data.json` records the actual 24 displayed Port paths and source Port occupancies used for the planning preview. These are review artifacts, not authoritative replacements for runtime inventory.

A fresh real-wheel check confirms the scrolling failure without programmatically moving any ancestor: after a 700px wheel input over the rail, both inspector and workspace scrollTop stayed at zero. Port24 still extended from y=880 to y=948 in a 900px viewport, leaving its lower area clipped.

28I's 777-test success and startup improvements remain useful historical evidence. Its browser checks assert that details open and the document fits horizontally; they do not prove that the last Port/evidence action can be reached by a real scroll or that AP browsing preserves context. Do not equate those checks with the newly requested workflow.

## Product decision: one workspace, stable destination

An AP is a destination inside the network workspace, not a succession of unrelated detail pages. Keep its identity, origin, route mode and Ports visible while the user inspects nodes, Cables and Fibers.

Maintain distinct state for:

- **Workspace target:** AP42 (or another requested object).
- **Physical route context:** selected origin AGG5 and selected documented/derived physical path to AP42.
- **Port selection:** null initially; selecting Port1 activates its exact Fiber path without losing AP42.
- **Inspected object:** current route node/Cable/Port. Inspection updates details without changing the route target.
- **View state:** physical versus Fiber mode, expanded branches, scroll/zoom where applicable, and playback progress.

Use the existing routing system to encode shareable target/origin/mode/Port state. Browser Back/Forward and reload restore meaningful selection. A change in URL is acceptable; visual replacement, automatic panel closure and loss of parent context are not. Explicit “Open as destination” changes the workspace target; ordinary node inspection does not.

### Interaction contract

| User action | Required result |
|---|---|
| Search AP42 and open it | AP42 identity, Ports and physical path from the selected/known aggregation are visible immediately; no generic details expansion. |
| Click AP42 on the network | Same AP workspace behavior; preserve the chosen aggregation/network context. |
| Select Port1 | Remain in AP42 workspace; show its known Fiber path, Port state and remaps. Keep the Port grid available. |
| Inspect SC208 or C152 | Highlight it and update the detail area; retain AGG5 → AP42 and selected Port. |
| Select Port16 | Keep physical context but highlight only SC207 → AP42 as known optical path; label the missing upstream connection. |
| Select another Port | Update the overlay/details in place, pause playback, retain origin and destination. |
| Show whole network, then return | Retain AP, Port, path mode and meaningful view state. |
| Open source evidence | Use a secondary evidence surface or explicit engineering navigation with a working return to the exact context. |

## Route meaning and origin choice

Use the existing physical topology projection for Cable connections and the existing 28C resolver for Fiber continuity. A view-only path selection algorithm on the physical graph is allowed; it must never add optical transitions, persisted connectivity or inferred asset ownership.

Prefer an origin already selected by the user or an established Cable Route context that actually reaches the AP. If only one applicable aggregation is established, preselect it and display its identity. If several origins/paths are possible, display the current choice and provide a labeled choice; do not silently call the shortest arbitrary path the operational upstream. Distances are unknown, so do not label graph-shortest paths as geographically shortest. If none is known, show the known subnetwork and a precise missing-origin message.

For AP42's physical example retain AGG5 → SC205 → SC206 → SC207 → SC208 → AP42 with Cable labels C148, C150, C151, C152 and C153. Validate against current typed endpoints in code. Physical mode alone cannot establish an AGG Port number, live service or a shared Fiber path.

Fiber mode starts at the selected origin only when the resolver actually reaches it. Otherwise retain the physical route as muted context, show the exact optical start/stop, and clearly label the gap. Avoid a continuous animated accent line through unknown edges. A partial path at AGG5 may say “AGG5 reached; exact aggregation Port unknown.” Do not call it fully exact end-to-end.

## Layout and wayfinding

### Desktop

- Compact persistent context bar: Network / origin / AP42 / selected Port, plus a clear physical/Fiber mode label. Keep the destination visible even while inspecting an intermediate node.
- Main route canvas takes the majority of available width. Render connected nodes and Cable spans as a diagram, not a series of oversized cards or an empty AP screen with one button.
- AP summary and compact numbered Port bank are immediately available in the right rail. Selected Port state and the current inspected object appear below; one clearly scoped inspection area avoids duplicating long journey text.
- Give the right rail its own bounded height and vertical scroll. Use `min-height:0` through the grid/flex sizing chain and constrain the actual scroll owner. Keep its AP/Port identity header visible. Scrolling that rail must not move or clip the route canvas. Provide a visible scroll affordance when content exceeds the rail.
- Clicking a route node highlights it; it does not switch to a one-hop page. A breadcrumb or explicit Back to AP remains meaningful throughout.

### Mobile and zoom

Show destination and route context first, then a compact AP/Port selector and a vertical route. Use ordinary document flow or a deliberately bounded accessible sheet for details; do not inherit desktop clipped ancestors. At least the selected Port, origin/destination and the start of the route must be visible without unrelated headings pushing them offscreen.

Support 320/390px width, short desktop heights, 200% zoom and keyboard-only use. Text and critical warnings remain readable. Do not shrink a desktop diagram until labels become illegible. Long routes may offer a compact overview and a focused step, while origin/destination and gaps remain visible.

## Visual design and animation

Use a restrained Fiber Atlas palette: quiet neutral physical connections, one accent for selected known Fiber continuity, and explicit text/symbols for unknown, conflict, termination and selected state. Physical Tube/Fiber swatches remain separately labeled; visual route accent is not a physical Fiber color or usage assertion.

On user selection, animate the existing overlay between states with a short transition (roughly 160–240ms). On “Play route,” draw a highlight along the known sequence and move one marker between nodes. Pause at each node long enough to read its label/remap; target about 700–1000ms travel plus 400–700ms dwell, adjustable only if needed. Stop after one traversal. Keep Play/Pause, Previous/Next and Replay near the route and the current step visible.

Animation is an inspection guide, not live traffic, signal speed or proof of service. Preserve the full static path before playback. Physical and Fiber modes must have explicit labels; they animate their own respective edges only. Pause on manual selection, mode/Port changes, tab hiding and workspace exit. Reduced motion uses discrete highlighting with the same controls, no camera glide, line sweep or pulse. Do not move keyboard focus during playback or announce every animation frame.

Selection glow, subtle node emphasis and line-draw motion are sufficient. Do not add particles, bouncing objects, decorative dashboards, infinite pulses or network-map movement that makes reading harder. Changes to display style must not alter path order or topology.

## Occupancy correction

Expose a typed, source-native occupancy state separately from its translated label, or consistently reuse the existing occupancy label without reverse-parsing it. AP Port1 and Port3 are in use; Port2 is unused; AP47's unknown Port stays unknown. Preserve Fiber operational-use state independently: Port1's Fiber use is review-required in the checked view while its physical Port occupancy is in use. Both may be true at once.

The same AP/Port state must appear in the grid, focused header, selected details and search. Add behavioral assertions for known in-use, unused and unknown, rather than checking for presence of a generic status label. Do not infer commercial availability from unused occupancy.

## Acceptance journeys — release gate

1. **Direct AP:** open AP42 by search and by network click. Without opening any disclosure, see AP42, its 24 Ports and AGG5-to-AP42 physical context. The first Port can be inspected with one further click.
2. **Persistent inspection:** select Port1; inspect SC208, then C152, then another Port. AP42 remains the destination, the origin/mode remain explicit, the panel stays available, and no route becomes a single-neighbor substitute.
3. **Scroll reachability:** at 1440×900 and 1366×768, wheel/trackpad over the right rail reaches Port24 and the last evidence action. Verify scrollTop actually changes, focused last controls are visible, and the canvas scroll position is unchanged. Test keyboard PageDown/Tab with focus in the panel; never pass this by assigning scrollTop to a hidden ancestor.
4. **Known versus partial:** Port1 shows the verified F103→F01 remap at SC208 and unknown AGG Port. Port16 shows C152/F118→C153/F16 and stops optically at SC207. AGG context remains visible but is not highlighted as confirmed Fiber continuity for Port16. Retain Port38 termination, F11/AP49 remaps, Tsageri unbound Ports and source conflicts.
5. **Status accuracy:** Port1 in-use, Port2 unused and AP47 unknown agree across surfaces. Separately retain Fiber usage/review state. These tests must catch the localized-label/enum comparison error.
6. **Animation:** verify each animated edge belongs to the selected mode's ordered data. Pause retains progress; manual selection pauses; Replay works; no animation crosses a missing edge. Reduced motion and hidden-tab checks pass. Static use works without Play.
7. **Navigation:** Back/Forward, reload/deep link, whole-network return and source-evidence return restore AP, selected Port and origin/mode. Node inspection does not create confusing page-level history jumps.
8. **Responsive:** desktop, 390px, 320px and 200% zoom have accessible labels, complete controls and reachable details. Check vertical reachability as well as horizontal overflow.

Run meaningful regressions, full repository tests, TypeScript/build/export and final offline browser checks. Record timestamp, artifact hash, browser/profile, before/after evidence, actual results and remaining limitations. Preserve authoritative file/projection hashes and domain invariants; do not add source data to solve a display issue. Keep the existing startup gain and measure any material rendering regression. No backend, new import, deployment or framework rewrite is required.

## Planning preview

The interactive AP42 proposal uses the checked 24-Port snapshot. It demonstrates a persistent workspace, physical versus Fiber mode, node inspection, Port selection, a visible SC207 gap for Port16 and animated known paths. It is a reviewable design concept, not the production implementation or new authoritative data.

Preview source: `C:/Users/Beka/.codex/visualizations/2026/10/02/01a0fd27-0367-72d2-8f0a-98aee608ae49/ap-route-workspace.html`. In the concept, all 24 sets of displayed Fiber-leg labels were compared with the captured paths. Headless Edge checks verified persistent AP/Port selection during SC208 inspection, real wheel scrolling of the right rail, pause/replay, Port16's restricted optical overlay, 390/320px widths and no page errors. Source details move below the route on mobile. Evidence: `iteration28j-concept-qa.json`, `iteration28j-concept-desktop.png`, `iteration28j-concept-mobile.png`. This is concept QA only; the worker must independently validate the implemented application.

