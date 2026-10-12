# Iteration 28G — Operational Port policy and compact search

**Status:** Implemented and validated 2026-10-02. This iteration changes derived presentation and navigation only. It does not change the topology, 28C current-path resolver, source assignments, PortTopologyBindings, or source-native occupancy.

## Shared Port policy

`src/domain/iteration28g.ts` defines `PortOperationalView` and the exact-binding presentation rule. AP grids, Lentekhi Aggregation’s Port grid, ODF Port Inspector, Port search, and Connection Sheet Port cells use the same projection. It combines the Port identity and source occupancy with Fiber identity, Tube/Fiber physical colors, 28E use state, organization, purpose, and the existing current-path resolver.

Fiber details are present only when one exact `PortTopologyBinding` matches the owner and Port. Missing or ambiguous bindings do not match by number. Fiber use never becomes Port occupancy. Unknown occupancy is shown in technical details, with the source-native state preserved separately from a bound Fiber’s operational status.

Lentekhi shows all **48 exact C184 bindings** as Port cards. Each card prioritizes Port number, C184/Fiber, use and organization, physical Tube/Fiber identity, then a route action; its disclosure retains the source Port status. Current C184 usage remains 12 in use, 14 unused and 22 unknown, and all 48 physical Port occupancies remain source-unknown. “Unused” is not relabeled as available.

Tsageri retains 192 logical Ports and zero exact C148 Port bindings. Its Ports do not inherit C148 use, organization, color, or Fiber number. C148 Fiber use remains in the separate Aggregation Fiber section, and Port occupancy stays unknown.

AP Port cards and Connection Sheet Port cells now share the same view policy. Source occupancy remains independently visible for AP Ports, while exact Fiber data appears only for exact bindings. ODF Port inspection uses the policy and remains unknown where the source has no exact Port-to-Fiber link.

## Compact universal search

Global search follows `find → understand → open`. Network objects have compact typed results with a `Route-ზე ნახვა` action. Source/evidence material stays in details, and organization search returns a bounded set of logical Fiber-path examples rather than a Cable-leg report.

- Exact Fiber: Cable/Segment, Tube number and color, Fiber number and physical color, usage/organization, short path, and a direct Fiber route.
- Cable: canonical endpoint identity, legacy Cable number, capacity, Tube summary and grouped usage counts; no Fiber-row dump.
- Tube: Cable, Tube number/color, Fiber range, use counts and resolver-derived path context.
- Closure: connected Cables, active local-transition count and organizations found through exact current paths.
- AP: place, Cable, Port/use summary, known organizations and AP route.
- Aggregation: connected Cable, logical Ports, exact binding count, use counts and known organizations. Tsageri explicitly reports no Port binding.
- Port: an AP- or Aggregation-scoped Port resolves through its exact binding to the same Fiber route; Tsageri Ports do not borrow C148 Fiber identity. Unscoped Port numbers remain disambiguated by the existing index.
- Organization and source Cable label/place aliases resolve to compact current network objects. Raw source occurrences are not listed as ordinary result cards.

Fiber path labels and remaps come from the existing 28C resolver; 28G adds no second path engine. Browser Back from a selected search result restores the URL-backed search query.

## Validation

- All **37 Cables, 2,088 Fibers, 1,629 transition records, 48 Lentekhi exact Port bindings, and 192 Tsageri logical Ports** remain intact. No source data or topology was edited.
- Automated coverage checks exact/missing Port bindings, unknown occupancy independence, Lentekhi Port38’s path, Tsageri’s no-binding rule, exact Fiber identity and direct route, summarized Cable/source-label results, and Closure/AP/Aggregation/organization queries.
- Full repository tests: **763/763 passed** (including the final scoped-Port regression).
- TypeScript project build passed.
- Vite production build and offline standalone export passed. The bundle still triggers the existing large embedded-source advisory.
- Standalone offline browser QA passed **4 desktop and 3 mobile flows at 390px**: exact Fiber search and Back, source Cable label, compact Magti results, Lentekhi Port38 route, Tsageri unknown binding, and mobile search/grid. Browser errors: 0; external requests: 0; horizontal overflow: 0.
- Screenshots and machine results: `docs/iteration28g-lentekhi-ports-mobile.png`, `docs/iteration28g-search-mobile.png`, and `docs/iteration28g-browser-qa.json`.
- The updated standalone is `C:\Users\Beka\Desktop\Visio Alt\fiber-prototype.html`.

## Boundaries

The projection represents known information for this pilot source and current 28C/28E/28F revision. It does not claim service, ownership, commercial availability, physical condition, or customer rights. If a binding or usage fact changes, regenerate the view from its authoritative source record; do not edit the display projection as evidence.
