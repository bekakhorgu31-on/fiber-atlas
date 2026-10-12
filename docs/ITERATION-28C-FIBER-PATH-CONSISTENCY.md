# Iteration 28C — authoritative current Fiber paths

Completed 2026-10-01 from the certified Iteration 28B network. All 2,088 canonical Fibers now use one active-graph resolver across current journey surfaces. The C152/F11 false stop at SC208 is corrected without changing a source transition or creating a special F11 record.

## Discovered defect and proven root cause

The active record `27D-NFT-208-15797` already linked C152/F11 to C154/F11 at canonical `network_node:208`. Its connector evidence is Shape 15797; both local sides are Tube 1, blue Tube, rose Fiber. Source uncertainty was not the cause of the reported SC208 stop.

The actual divergent code paths were:

1. `applyIteration27D` in `src/domain/iteration27d.ts` appended the active Source B graph and called `rebuildFiberJourneySummaries` from `src/domain/iteration20.ts`.
2. That summary builder searched the older `data.fiberLineages`. It did not traverse active transitions. Without a legacy Lineage for C152/F11, `knownFrom` and `knownTo` fell back to the Cable endpoints, and the stop text described the far endpoint as unknown.
3. `FiberInspector` in `src/views/RouteWorkspace.tsx` read that older Lineage/summary projection. Engineer Query and the combined overlay used a separate active-transition walker. They could therefore continue through SC208 while the normal Inspector stopped there.
4. Display naming independently called `getSegmentDisplayName` without inventory metadata, leaving Node207/Node208 strings after the 28B Closure enrichment. This display bug did not remove the canonical transition; it was a separate stale projection.

Before: active graph → Query/overlay walker; legacy Lineage → endpoint-fallback summary → Inspector. After: active graph → `resolveCurrentFiberPath` → Query, Inspector, current Summary, current Lineage, overlay and Splice journey navigation.

## Authority and resolver

`src/domain/currentFiberPath.ts` owns traversal. Inputs require an exact canonical Cable/Fiber and optionally one of its real endpoints. A state is keyed by canonical node kind/ID, Cable ID and Fiber number. Each continuation crosses an active local transition and then follows that physical Cable to its opposite endpoint. Route order, display labels, number equality, colors and source-document changes cannot create edges or stops.

The resolver returns both orientations, ordered legs, oriented local transitions, decoded local identities, source evidence, alternatives and explicit stop types. It follows remaps, preserves every alternative, and detects repeated canonical states. Port endpoints require the exact certified binding at its owning node. Missing transitions remain partial; only an active intentional-termination record produces a termination. Unresolved source records, external boundaries and loops retain distinct reasons.

`traceFiberThroughTransitions` is now a presentation adapter around this resolver. React renders its result. `CurrentFiberJourney` is shared by the normal Inspector, Fiber detail and Trace views. Combined overlay Cable membership comes from the same result. Splice return navigation preserves the focused exact Cable/Fiber.

## F11 Golden path

Selected local identity: **SC207 ↔ SC208 · 144F / F11**, blue Tube 1, rose Fiber.

Toward SC207:

`C152/F11 → SC207 → C151/F11 → SC206 → C150/F11 → SC205 → C148/F11 → AGG5`

Toward SC208:

`C152/F11 → SC208 → C154/F11 → SC209 → C156/F11 → SC210 → C158/F11 → SC211 → C161/F11 → SC212 → C164/F23 → SC213 → C166/F23 → SC214 → C167/F23 → SC215 → C168/F11 → Endpoint 49`

The active data has no certified endpoint Port for this strand at AGG5 or Endpoint49 and no explicit termination there. Both ends are genuine maximum-known partial endpoints. Endpoint49 remains neutral. The path follows the exact F11→F23 and F23→F11 remaps; it does not borrow neighboring strands.

## Deterministic projection and historical lineage

`applyIteration28C` runs after 27D and 28B in the repository. It builds all paths, 2,088 summaries and 475 unique current Lineages from one indexed graph snapshot. These Lineages include partial paths; their presence does not imply a complete end-to-end connection. Ambiguous/cyclic results stay resolver paths rather than being forced into a single Lineage.

The 278 prior Lineages remain with `projectionRole: historical`; the earlier superseded archive is retained. Their IDs may be reused for matching current leg membership, but all current steps are regenerated. Historical Lineages never override the active graph. Current lookup rejects stale graph revisions and refuses ambiguous legacy Cable IDs such as C172.

Graph revision records the canonical Cable endpoints, Fiber membership, active local transition sides/types, certified bindings and ODF ownership. A separate display revision tracks node enrichment. Path signatures contain canonical states and transition IDs, not rendered labels. Materialized paths are used only at the current graph revision; otherwise the resolver recomputes. Summary labels are read from current metadata. The validator checks live path signatures, summary revision/signature, current Lineage legs/edges/revision, stop evidence and certified Port ownership before activation.

Generation runs twice and requires byte-identical normalized JSON. Rebuild with `scripts/build-iteration28c-audit.ts`. The audit is `migration/iteration28c/fiber-path-consistency.json`; each Fiber records current resolver/summary/Lineage signatures, previous derivation fingerprint, historical IDs, mismatch classifications, remediation and exact stop nodes/types. Previous fingerprints preserve comparison metadata; the older pipeline/reference files retain the original derivations.

## All-Fiber audit

| Measurement | Result |
|---|---:|
| Canonical Cables | 37, unchanged |
| Canonical Fibers / current summaries | 2,088 / 2,088 |
| Transition records | 1,629, unchanged |
| New Source B exact records | 775, unchanged |
| Source B overlap evidence records | 376, unchanged |
| Repaired stale Fiber projections | 1,270 |
| Previous Lineages with changed leg membership | 131 of 278 |
| Unique rebuilt current Lineages | 475 |
| Exact Port-to-Port Fiber paths | 172 |
| Genuine partial Fiber paths | 1,892 |
| Fibers participating in explicit termination paths | 24 |
| Ambiguous current paths | 0 |
| Matching current derived signatures | 2,088 |
| False partial stops | 0 |
| False terminations | 0 |
| Unsupported current edges | 0 |
| Stale operational Closure display identities | 0 |
| Active source-supported edge coverage | 100% |

The 1,270 repair count compares previous transition footprints, prior Lineage leg membership and missing multi-leg derivations; it is not a count of source defects. All 2,088 summaries were regenerated. The 131 count specifically measures changed historical leg membership, not every metadata/text update. The 24 termination-path Fibers share the unchanged sixteen owner-confirmed SC225 termination records. Consistency matches measure agreement between projections; they do not mean all paths have certified endpoints.

The engineering `Fiber path consistency` disclosure reports these totals and zero-defect gates. Genuine gaps are retained with an exact node and reason. Internal projection inconsistencies fail the validation gate rather than appearing as network uncertainty.

## Source and regression preservation

- C151/F118 remains partial at SC207, with no C152 continuation or termination.
- Lentekhi Port38 still binds C184/F38, crosses SC224 into C181/F06 and explicitly terminates at SC225. No AP51 destination is introduced.
- C176/F32 remains black locally, crosses SC219 into C175/F24 and reaches AP52. SC218/AP51 are absent from its optical path; AP52 Port navigation returns to the same strand.
- C158/F65 crosses SC211 into C159/F01 without same-index normalization.
- SC207–SC215 display enrichment changes names, not canonical connectivity or path signatures. Source endpoints 42–49 remain neutral.
- C148's preserved Tube-color conflict, source-scoped C172 collision, raw VSDX evidence, all transition records, certified Port bindings, Closure grammar/coordinates/GJS evidence and NetworkUseAssignments remain unchanged. No Source B Port or company assignment was invented.
- Frozen V1 manifest and its file hashes remain unchanged. No importer redesign, new Visio, database or backend was introduced.

## Validation and browser evidence

The previous baseline was 708 tests. **722/722 tests pass**, including 14 current-path regressions for F11, both remaps, all-Fiber gates, F118, Port38, AP52, canonical identity, node naming, adjacency rejection, alternatives, loops, stale summaries/Lineages and source immutability. TypeScript and the production build pass. The usual large JavaScript chunk advisory remains a build advisory; browser logs contain no warnings.

The regenerated standalone embeds one script, no linked stylesheets and no external assets. It was tested from its local file URL with no server. `scripts/iteration28c-browser-qa.mjs` passes **11 desktop flows at 1440px and 4 mobile flows at 390px**, checking normal C152→F11 selection, all overlay Cable IDs, Query/Inspector/overlay signature equality, exact connector Splice return, F118 negative, Port38 termination, F32/AP52 Port navigation, nonidentity mapping, adjacent F12 and engineering diagnostics. Browser runtime errors/warnings: **0**. Tested horizontal overflow: **0**.

Evidence: `docs/iteration28c-test-run.log`, `docs/iteration28c-build.log`, `docs/iteration28c-browser-qa.json`, `docs/iteration28c-f11-desktop.png`, `docs/iteration28c-f11-390px.png` and `docs/iteration28c-f11-remap-390px.png`.

## Remaining actual unknowns

The active graph contains source gaps and uncertified endpoint Ports; these explain the 1,892 partial paths. F11's AGG5/Endpoint49 endpoints and F118's SC207 gap remain explicit examples. Source B company annotations remain unbound, endpoint equipment classes remain unknown where uncertified, and C148 retains both source claims. These are evidence limits, not unresolved software projection defects.
