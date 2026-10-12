# Iteration 28K — organization search in the route map

Delivered 2026-10-05. Status: **Done**. Continues the accepted 28J presentation; source data and optical topology are unchanged.

## Result

Exact organization names and aliases open an organization map with a complete logical path chooser. Silknet opens four distinct groups directly. OpenNet exposes all 17 groups, independently of the eight-example search suggestion limit. A selected group uses the existing current-path resolver; it does not join unrelated strands or create organization-owned Cables.

| Organization | Logical groups | Local Fiber legs | Unique Cables | Exact Port bindings | Projected AP IDs |
|---|---:|---:|---:|---:|---|
| Silknet | 4 | 28 | 12 | 2 | none |
| OpenNet | 17 | 154 | 25 | 13 | 49, 41, 46, 47 |
| Magti | 4 | 40 | 18 | 2 | none |
| Skytel | 4 | 18 | 14 | 5 | 54 |

Silknet's two bindings belong to **ODF-LENTEKHI-01, Ports 10 and 11**, displayed as Lentekhi Aggregation. They are not AP Ports. Their occupancy remains unknown; a known Fiber binding does not establish occupancy or availability. The opposite endpoint can still lack an exact aggregation Port.

The footprint highlights actual source-scoped Fiber numbers on shared physical Cables. Selected paths show resolver nodes, local Fiber legs, remaps and stops. Unrelated physical context stays visible. A partial path ends at its evidence boundary. Review-case association is disclosed separately from whether the entire optical path is invalid. Direct use claims identify their origin Fiber; projected use on other legs is explicitly derived through the exact path.

## Implementation and navigation

- `src/domain/organizationEntry.ts` recognizes complete names/aliases only. Qualified OTDR, Cable, review and unsupported questions retain Engineer scope. Cable and review answers apply their actual filters.
- `src/domain/iteration28k.ts` reads the existing organization projection with one resolver per inventory/organization model. Every row retains stable strand identity, exact member legs, resolver signature, evidence and actual binding owners. The complete dataset is not truncated.
- `src/views/OrganizationWorkspace.tsx` supplies the persistent map, chooser, independent inspection and evidence rail. `NetworkTopologyCanvas.tsx` marks individual local use legs, without implying Cable ownership.
- `src/views/RouteJourney.tsx` extracts the accepted diagram and finite playback controls from APWorkspace. AP behavior remains covered by the original 28J browser workflows. Ambiguous alternatives remain separate; a multi-alternative path cannot be played as a single traversal.
- `#/organization/silknet?strand=…&inspect=…&mode=…&q=…` retains canonical organization, selected group, inspected object, original query and map mode. Inspection replaces the current entry; changing paths/modes creates normal history. Evidence and explicit destinations use ordinary Back navigation. Real AP bindings open their source-supported AP workspace explicitly.
- Pure legacy `#/engineer?q=Silknet` links open the map as the primary answer. `report=1` retains the secondary report without redirect loops. Engineer badges show unknown-Port/review outcomes instead of contradictory exact-success labels. A search history collision that prevented qualified queries from rendering was corrected and browser-tested.
- Responsive styles put Fiber membership on its own row and reduce tree indentation on narrow screens. This fixes the mobile footprint overflow discovered during QA.

## Acceptance evidence

Final artifact: `../fiber-prototype.html`, SHA-256 **4a38c04b060e7d3fe02493c135eceef2b0d2730792d92e5790879121859f9d3d**.

**787/787 repository tests pass**, 0 failed/skipped. Full TypeScript compilation, Vite production build and standalone export pass. The existing large offline-bundle advisory remains. Browser runs used offline Edge **154.0.4258.53**. All three reports identify the same final artifact hash.

| Required journey | Actual evidence |
|---|---|
| 1. Exact search and aliases | Silknet Enter and Georgian alias open the map immediately; legacy bookmarks and secondary-report reload avoid loops. |
| 2. Separate Silknet paths and full footprint | All four paths verified at four viewport sizes against resolver signatures, ordered source-scoped legs, nodes, remaps, stops and actual binding IDs/owners. Overview membership equals all 28 local legs across 12 Cables. No AP is invented. |
| 3. Persistent inspection and return | Closure, Fiber, physical Cable and real ODF Port inspection retain organization/group. Source return, explicit AP destination/Back, deep link/reload, network mode and Back/Forward restore scope. Source B exact Shape 41050 is opened and verified. |
| 4. Limits and selected-path playback | Partial path boundaries, unknown Port binding and review association remain visible. Normal/reduced-motion playback follows one resolver path, stops at its end, and pauses on inspection/mode change. Reduced motion has no travelling edge. |
| 5. Other organizations and completeness | Every configured alias tested for Magti, OpenNet, Silknet and Skytel. Complete stable chooser IDs match the projection. OpenNet's final group is keyboard selectable beyond the suggestion limit. All organization models are compared to the resolver in automated tests. |
| 6. Desktop, mobile, keyboard and zoom | Actual wheel/PageDown at 1440×900 and 1366×768 reach rail content without moving the canvas. OpenNet's final path remains reachable; Tab reaches final evidence in 51 steps. Touch-emulated 390×844 and 320×844 have no document overflow and readable identity, chooser and diagram. 200% CSS scaling plus 720×450 reflow preserve last-path/evidence access. |
| 7. Existing behavior and qualified intent | All 40 existing 28J flows pass: AP42/Port1, Port16 SC207 gap, independent occupancy, Port38 termination, F11/AP49, Tsageri unbound Port, C148 conflict and separate C172 identities. OTDR/C148/review questions retain their actual query and scoped Engineer answer. |

**91 browser flows pass:** 45 organization flows, 6 supplemental organization checks and 40 AP/domain regression flows. Zero recorded page errors; both main browser suites record zero external requests. Screenshots were inspected at desktop and mobile sizes.

Raw evidence:

- [Organization QA](iteration28k-after-browser-qa.json), [supplemental checks](iteration28k-supplemental-qa.json), [AP regression](iteration28k-ap-regression.json).
- [Full test log](iteration28k-tests.txt), [TypeScript](iteration28k-typescript.txt), [build](iteration28k-build.txt), [export](iteration28k-export.txt).
- [Runtime path/binding snapshot](iteration28k-runtime-snapshot.json), [projection preservation](iteration28k-projection-preservation.json), [before QA](iteration28k-before-browser-qa.json).
- [Desktop overview](iteration28k-after-silknet-overview-1440.png), [desktop selected path](iteration28k-after-silknet-selected-1440.png), [390px identity/chooser](iteration28k-mobile-header-390.png), [320px diagram](iteration28k-mobile-diagram-320.png). Full-page mobile, 1366px, zoom and AP screenshots are retained alongside these.

## Integrity and startup

All **45 authoritative top-level JSON hashes** match the before artifact inventory. The six complete derived projection hashes match delivered 28J. The frozen V1 manifest remains `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`. Counts remain 37 Cables, 2,088 Fibers, 1,629 active transitions, 48 Lentekhi bindings, 192 Tsageri Ports and zero C148 bindings. The runtime snapshot also records organization/aggregation projection hashes. No import, transition interpretation, new graph engine or backend was introduced.

Three fresh offline desktop contexts per artifact: 28J baseline **2097–2166 ms**, median **2133 ms**; final **2091–2190 ms**, median **2117 ms**. Largest startup tasks: baseline 1756–1783 ms; final 1756–1836 ms. These paired local measurements support preservation of the startup profile, not a general performance guarantee. Cold loads ran separately from the test suite/AP regression workload.

## Remaining limits

Exact unknown Ports, partial boundaries, review cases and physical construction conflicts are preserved source limitations. Organization use does not establish ownership, a customer/service, availability or field verification. Source A's compact diagnostic viewer covers selected anchors; other Shape IDs remain outside that compact view, with their use claim and full preserved migration artifacts still available. Source B evidence uses its own certified Shape viewer and does not fall back to Source A.

Mobile checks are browser touch emulation, not real-device certification. Zoom uses CSS scaling and equivalent viewport reflow, not native browser-chrome zoom. The AP hidden-tab regression uses a simulated visibility event because headless tabs remain visible. No deployment or production-readiness claim is made.
