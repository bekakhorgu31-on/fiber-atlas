# Iteration 28K — organization search in the route-map workspace

Requested 2026-10-05. Status: **Ready for worker implementation**. The user likes the 28J route map and wants searches such as Silknet to be equally informative. Preserve that design and extend its coverage; do not begin another visual redesign.

## Confirmed current behavior

Planning review used the delivered standalone, SHA-256 `6bb6bacff39d3d2c7e5ac646a79ae1950eafed49f4749665e93aad54ebf45e8e`, in offline headless Edge at 1440×900.

Searching `silknet` returns Silknet first with “4 logical Fiber paths · 12 Cables” and a route action. Clicking it opens `#/engineer?q=Silknet`, not the new map. The report shows large textual facts, 46 additional details, 39 related records and repeated generic Cable/object actions. Its labels also combine “Exact Port binding unknown” with a “ზუსტი topology” badge, which can imply more certainty than the answer supports.

The cause is explicit organization routing in `src/domain/engineerQuery.ts`: organization results point to the Engineer view. The 28J persistent map integration currently specializes in AP destinations. Existing organization projection data is already available; this is primarily a view/navigation extension, not a new import or topology correction.

Evidence: `iteration28k-review-reproduction.json`, `iteration28k-before-silknet-desktop.png`. The current Silknet snapshot has **4 logical strand groups, 28 local Fiber legs, 12 unique Cables and 2 exact Port bindings**. Its projection lists two aggregations and no AP IDs. These are distinct units and derived snapshot results, not target counts to force into the model. No AP should be invented to make Silknet fit an AP-only layout.

## Intended experience

Search Silknet → see its known network use on the map → choose a logical path → inspect its ordered Cable/Fiber route → optionally animate it. Keep Silknet, the selected path and the evidence limits visible throughout.

Reuse the successful 28J diagram, motion language, scroll behavior and inspection controls. Extract shared presentation components where needed rather than copying APWorkspace or squeezing an organization into an AP destination. Keep the existing AP workspace behavior unchanged.

### 1. Organization entry points

- An exact supported organization name or alias opens the organization map from search selection/Enter. Apply the same behavior to Silknet/სილქნეტი, Magti/მაგთი, OpenNet/Open Net/ოპენნეტი and Skytel/სკაიტელი using the existing canonical alias registry.
- Support a stable deep link containing canonical organization identity, selected logical path and inspected object. Preserve Back/Forward, reload, original query and organization scope.
- Opening an old `#/engineer?q=Silknet` bookmark should make the same map available as the primary organization answer. Keep the detailed engineering report as a secondary action/disclosure. Do not create a redirect loop.
- Preserve actual intent for qualified queries. A request for OTDR, review cases, a particular Cable or organization scope must not be silently reduced to an unfiltered organization name. Reuse existing intent parsing; keep unsupported queries in the explicit engineering path.
- Label the action honestly: opening the organization overview is “Show network use”; opening one selected strand is “Show Fiber path”. A route-labeled button must not lead to the old text-only report.

### 2. Organization overview and path selection

- On first opening, frame all known organization paths in the existing network context. Highlight only supported organization-use legs; leave unrelated physical context muted. Show multiple branches/components rather than forcing them into one linear journey or one aggregation origin.
- Keep a compact header with organization name, logical path count, unique Cable count and known exact Port count. Local Fiber legs may appear in details with their explicit unit; never call 28 Silknet legs 28 end-to-end paths or 2 bindings 2 customers/services.
- Immediately display the logical path chooser in a reachable rail. For Silknet show all four paths. For larger organizations, keep the complete set accessible with clear shown/total counts; do not reuse the search suggestion limit of eight examples as the dataset.
- Each path row identifies its known endpoints or stop points, a representative Cable/Fiber, and a meaningful exact/partial/review/unknown-Port state. Include enough identity to distinguish two different Fibers with the same endpoint pair. Never deduplicate paths solely by endpoints, Cable number or organization name.
- Preserve logical strand identity and exact source-scoped leg IDs. A shared Cable can contain several organization Fibers; highlight/count those legs independently rather than coloring the whole Cable as owned or completely used by that organization.
- Overview has no arbitrary automatically playing path. Selecting a path is explicit. If an initial path is selected for readability, label the selection and still expose the complete organization footprint and chooser.

### 3. Selected path, inspection and playback

- Selecting a strand reveals its ordered route from the existing current Fiber resolver, with local Cable/Fiber labels, remaps, endpoints and stops. Use the organization projection for membership/evidence and current resolver output for continuity. Regenerate stale derived views if needed; do not use cached strings as a second path engine.
- Retain the organization header/chooser when a node, Cable, Fiber or Port is inspected. Inspection updates the current rail; it does not replace the organization context with an unrelated detail page. Explicit “Open AP workspace” or “Open as destination” may navigate, with a working return to the selected organization path.
- Reuse 28J Play/Pause, Previous/Next and Replay for one selected known path. Do not animate a union of separate organization paths as one continuous service. No autoplay, infinite loop or live-traffic claim. Pause on selection/mode changes and hidden visibility; reduced motion remains functional.
- Allow return to the full organization footprint and the wider network without losing path selection. Retain origin context when supported, but never extend an optical path to AGG by physical adjacency.
- Right rail must actually scroll to the last path/evidence control independently of the diagram. Mobile preserves organization and selected path identity and uses reachable document-flow details, following 28J's verified interaction pattern.

### 4. Evidence and uncertainty

- Existing organization use evidence is not ownership, service, customer, rights or commercial availability. Use “known Fiber use” or equivalent Georgian wording; technical source terminology belongs in expandable evidence.
- Differentiate direct source use claims, context propagated through exact lineage, review-required/conflicting assignments, missing Port binding and unknown occupancy. Do not display an unconditional exact/success badge over an unknown/review result.
- Show review cases per path where relevant; a source review-case association is not automatically proof that the whole physical path is invalid. Use existing semantic statuses, not new color/count heuristics.
- When the projection has no confirmed AP, show the actual Closure/aggregation/unknown endpoint. When it has no exact Port, say so; never attach an equal-number Port or manufacture an AP card.
- Exact Ports are shown with independent source occupancy. C148 conflicts, source-scoped C172 identity collisions, partial paths and explicit terminations stay intact.
- Keep source evidence reachable from the selected path or claim. Do not delete reports or raw evidence to declutter the primary view.

## Acceptance journeys

1. Search `silknet`, press Enter, and see a map plus four logical path choices without expanding an engineering report. `სილქნეტი` resolves to the same canonical organization.
2. Each of the four Silknet paths can be selected; map edges/local Fiber identities and stops agree with current authoritative resolver output. All 12 unique Cables are represented across the overview, with the correct membership of 28 local legs. Display no invented AP; reconcile the two exact bindings against their actual owners.
3. Inspect a Closure, Cable and a real bound Port while keeping Silknet and the chosen path visible. Return from evidence/AP workspace and verify the same selection and scope. Back/Forward and reload/deep link work.
4. Select a partial/review/unknown-Port path and verify the limitation is visible. Playback follows only that path and stops at its real evidence boundary; no unsupported join between Silknet's distinct strands is drawn.
5. Check Magti, OpenNet and Skytel with existing aliases. OpenNet currently has more than eight logical paths; verify every actual path remains reachable, not just the bounded search examples. Use current data counts, not hardcoded targets.
6. At 1440×900 and 1366×768, actual wheel/PageDown reaches the final path/evidence control while the canvas stays stable. At touch-emulated 390×844 and 320×844, organization identity, path selector and meaningful diagram content are reachable and readable. Check 200% zoom, keyboard selection and reduced motion.
7. Regression: AP42/Port1 persistent map and correct occupancy, AP42/Port16 SC207 gap, Port38 termination, F11/AP49, Tsageri unbound Port, C148 conflict and distinct C172 identities retain 28J behavior. Qualified organization queries keep their intended filters/results.

Use behavior assertions for route type, map content, retained scope, path counts/identities and scroll reachability; text presence alone is insufficient. Run appropriate/full tests, TypeScript, production build and offline export. Save final artifact hash, timestamp, browser/profile, screenshots and actual outcomes; record emulation limitations honestly. Preserve all authoritative hashes and current projections or document a justified equivalent regeneration. Do not degrade the 28J startup profile through repeated resolver/projection construction.

## Delivery scope

One organization-map extension in the existing app, applied consistently to supported organizations. Reuse 28J's design and graph authorities. No new source import, data enrichment, backend, deployment, new graph engine or unrelated UI redesign. Track implementation in HANDOFF.md and record actual delivery in a new 28K implementation review plus VALIDATION.md.
