# Iteration 28J — persistent AP workspace

Completed 2026-10-03. Final workflow run started at 2026-10-03T19:35:26Z, using offline headless Edge 154.0.4258.48. Status: **Done within the recorded automated browser profile**.

## Delivered behavior

Opening an AP now immediately shows its destination identity, numbered Port bank and physical context from the selected aggregation. AP42 displays AGG5 → SC205 → SC206 → SC207 → SC208 → AP42, with C148/C150/C151/C152/C153 supplied by existing typed endpoints. Node and Cable inspection updates one contextual rail while retaining the destination, origin, mode and selected Port. Only the explicit **დანიშნულებად გახსნა** action changes the destination.

The URL separately records destination, origin, physical path choice, mode, selected Port, inspected object, whole-network mode and collapsed network branches. Inspection replaces the current history entry; Port and mode choices create navigable entries. Back/Forward, reload, source-evidence return and whole-network return restore the AP context. Playback progress survives whole-network return within the mounted workspace.

The desktop rail has a bounded scroll owner, `min-height:0` throughout its layout chain, a fixed identity header and a visible scroll hint. Mobile uses document flow: context and Ports precede the vertical route; inspection/evidence follows it. Port24 and the last source action are reachable by keyboard. All six physical nodes fit the desktop AP42 diagram; longer optical paths have their own horizontal scrolling area.

## Physical versus optical meaning

`iteration28j.ts` enumerates view-only simple paths over the existing physical topology projection. It prefers the applicable established CableRoute aggregation and exposes other reachable aggregations and alternative physical paths. Unreachable explicit choices stay unresolved; no shortest-distance or operational-upstream claim is made. Path enumeration is capped at 64 alternatives with an explicit warning if truncated.

Fiber mode uses the current 28C resolver and existing ordered display steps. It never creates a transition, binding, Lineage or optical edge from physical adjacency. Port1 displays F103 → F01 at SC208 and reaches AGG5 with its exact aggregation Port unknown. Port16 highlights only C152/F118 → C153/F16 between SC207 and AP42; C148/C150/C151 remain muted physical context. The whole-network overlay follows the selected Port independently of the inspected node.

`PortOperationalView.occupancyState` preserves the source enum separately from the translated label. AP42 Port1/3 are in use, Port2 is unused, and AP47's actual unknown Port remains unknown across grid, header, details and search. Port1's Fiber use remains review-required independently of its occupied Port.

## Playback

User-triggered traversal uses the same ordered edge data as the static route. Normal motion has 850 ms travel and 550 ms dwell, one marker, Previous/Next, Play/Pause and Replay. It ends once, retains progress on pause and pauses on inspection, Port/mode changes, whole-network changes and hidden visibility. Reduced motion advances discrete steps at 1,400 ms intervals with no travelling marker. Playback never moves keyboard focus or fills the SC207 gap. It is labeled as a viewing guide rather than traffic.

## Acceptance evidence

Final offline workflow QA records **40 passing flows covering all eight acceptance journeys**, with zero page errors and zero external requests.

| Journey | Result |
|---|---|
| Direct AP | Search and fresh network click open AP42 with all 24 Ports and full physical context immediately. |
| Persistent inspection | Port1 → SC208 → C152 → Port2 retains AP42/AGG5/mode; inspecting AP49 retains AP42 until explicit destination navigation. |
| Real scrolling | At 1440×900, wheel changes rail scrollTop by 700 px and PageDown by 524 px. At 1366×768, corresponding changes are 700 and 408 px. Tab reaches the last source action and Port24; canvas scroll position is unchanged. |
| Known versus partial | Port1 remap/unknown aggregation Port and Port16's SC207 gap pass. Port38 termination, F11/AP49 remaps, F118 gap, F32/AP52, unbound Tsageri Ports, C148 conflict and separate C172 search identities pass. |
| Status accuracy | Occupied, unused and unknown states agree across the four surfaces while Fiber usage remains independent. |
| Animation | Both motion settings pass pause/replay/manual selection/mode/visibility checks; normal animated Fiber edges are exactly C152/C153 for Port16. Static use and stable keyboard focus pass. |
| Navigation | Back/Forward, reload/deep link, explicit retarget/Back, whole-network return and evidence return retain the recorded target/origin/Port/mode. |
| Responsive | 1440×900, 1366×768, touch-emulated 390×844 and 320×844 fit horizontally and retain vertically reachable controls. 200% CSS scaling and a 720×450 media-query reflow viewport pass. Additional mobile checks prove the initial AGG5 node label is visible for Port1 at both phone widths. |

Raw results: [final browser QA](iteration28j-after-browser-qa.json), [baseline QA](iteration28j-before-browser-qa.json), [mobile orientation](iteration28j-mobile-orientation.json). Baseline standalone is retained as `iteration28j-before-standalone.html`. Before/after PNGs use the `iteration28j-before-*` and `iteration28j-after-*` prefixes; useful comparisons are AP42 desktop, Port16 gap, rail Port24/last source, and mobile Port1 viewport.

**Limits:** mobile is browser emulation, not a real-device certificate. Native browser zoom was represented by both CSS scaling and its equivalent CSS viewport; it was not controlled through the browser chrome. Headless tabs stayed visible, so hidden-tab behavior was checked with a simulated hidden visibility event and is labeled accordingly in the raw results. Playback position is local UI state, not persisted across reload or navigation to evidence. The remaining startup task and large offline bundle are unchanged limitations.

## Validation and preservation

- **782/782 repository tests pass**, including five new substantive AP workspace cases. Full TypeScript compilation, production build and standalone export pass. Logs: `iteration28j-full-tests.txt`, `iteration28j-typescript.txt`, `iteration28j-build.txt`.
- All **45 authoritative JSON file hashes** match the baseline. All **six complete derived projection hashes** match the previous certified projections: current Fiber paths, current Lineages, Journey summaries, usage projection, node transitions and Port bindings. [Preservation record](iteration28j-projection-preservation.json).
- Inventory remains **37 Cables / 2,088 Fibers / 1,629 active transitions / 48 Lentekhi bindings / 192 Tsageri Ports / zero C148 Port bindings**. Frozen manifest SHA-256 remains `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.
- Three fresh-context offline cold loads, measured after workflow QA without concurrent repository tests: median **2,056 → 2,061 ms**; ranges **2,038–2,282 → 2,041–2,103 ms**. This difference is ordinary host variation, not a claimed speed gain. The largest recorded task is 1,758 ms after versus 1,797 ms before. The 28I startup gain is retained; this is not a production-performance certificate.
- Final standalone: `C:/Users/Beka/Desktop/Visio Alt/fiber-prototype.html`. SHA-256: **`6bb6bacff39d3d2c7e5ac646a79ae1950eafed49f4749665e93aad54ebf45e8e`**.

## Changed areas

New `APWorkspace.tsx` and `iteration28j.ts`; AP integration in `RouteWorkspace.tsx`; independent inspection/optical selection in `NetworkTopologyCanvas.tsx`; URL state in types/navigation/App; typed occupancy in `iteration28g.ts` and its focused/search presentations; responsive AP styles. New domain tests, repeatable offline workflow/orientation/preservation scripts and delivery records accompany the implementation. No authoritative source or topology files changed.
