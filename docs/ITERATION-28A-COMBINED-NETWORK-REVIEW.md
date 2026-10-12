# Iteration 28A — Combined Network Route Workspace Review

## Result

The normal Fiber Atlas entry now opens the **Combined Network** topology. The old Tsageri–Lentekhi `CableRoute` remains available as a separate route-context view; it no longer defines the complete network. The combined physical projection is built from the active canonical Cable endpoints and is rendered with stable endpoint identity. The network tree is rooted at the shared Tsageri/SC205/SC206 area and uses existing route order only as a deterministic visual preference.

Physical Cable adjacency defines this diagram. Optical Fiber highlighting is computed separately from the active `NodeFiberTransition` graph through `traceFiberThroughTransitions`; certified Port bindings identify known ends. The combined physical graph never creates an optical edge.

## Topology coverage

| Measure | Active result |
|---|---:|
| Canonical Cable Segments | 37 |
| Canonical Fiber records | 2,088 |
| Source documents | 2 |
| Connected physical components | 1 |
| Cable Segments in primary component | 37 |
| Additional components | 0 |
| Cables attached to a node with degree greater than two | 31 |
| Isolated single-Cable components | 0 |
| Omitted active Cables | 0 |

The browser check rendered 37 distinct Cable cards and found zero omitted IDs. Canonical endpoint identities deduplicate shared nodes and Cable records; source representations remain secondary evidence. C172 remains two source-scoped Cable identities. Source B C172 appears at its canonical Node225/Node44 connection rather than being inserted into the C151 chain.

## SC206 fork and Source B continuation

The default topology shows the physical C169 continuation from SC206 toward SC216 and, at the same fork, C151 toward neutral Node 207. From Node 207 it shows C152 toward Node 208 and the further source-supported branches. The direct fork cards use endpoint-based Cable names, with legacy C-numbers and endpoint identity in secondary text.

Node 207–215 remain neutral `Node` labels. Unknown leaf source tokens render as neutral `Endpoint` labels (for example Endpoint 42); no AP or Closure type is inferred from a number. Clicking a neutral node lists connected canonical Cables, exact local Fiber transition count, and source evidence. The historical `BOUNDARY-SC207` provenance remains in Node 207 technical detail and is not rendered as a physical break.

SC205 and SC206 are each represented once. C148 remains one ordinary physical Cable despite its independent Tube-color conflict. The global product chrome now identifies Fiber Atlas and the combined network, not one source document. Direction/place notes remain in the source annotation inventory and collapsed engineering detail; they do not create Cable edges or pin unsupported place names to nodes.

## Network and Fiber behavior

- Search results for C152 and Node 211 include **ქსელში ჩვენება** navigation and focus the matching graph object.
- Fiber query results can open the Combined Network with the exact Fiber selected. The overlay highlights only Cable legs returned by active node-local transition traversal.
- C151/F1 highlights C151 and its transition-supported continuation through C152; active later transitions continue across canonical nodes as recorded.
- C151/F118 highlights C151 only and stops at Node 207. C152 remains visible as a physical Cable and is not Fiber-highlighted or called a termination.
- Node/Fiber identity changes remain in the transition Inspector; colors and same-number similarity do not create overlay edges.
- Selected object and collapsed branch state serialize in the existing route URL. Browser Back restores the prior expansion/selection state.
- The user can switch from the default Combined Network to the original curated Tsageri–Lentekhi Route context.

## Validation and screenshots

- Full suite: **700/700 tests pass**, including six Iteration 28A tests for canonical Cable coverage, the SC206 fork, neutral node/endpoint labels, source-scoped C172, inventory-only projection, network navigation and URL round-tripping.
- TypeScript and Vite production build pass. The JavaScript bundle remains above Vite's 500 kB advisory threshold; this is non-blocking and expected for the self-contained prototype.
- Standalone export regenerated at `C:/Users/Beka/Desktop/Visio Alt/fiber-prototype.html`.
- Iteration 28A browser QA passes six desktop flows and two mobile flows at 390px. It verifies hashless default entry, all 37 Cable cards, the SC206 fork, Node 207/208, Endpoint 42, neutral Node 211 navigation, C152 navigation, C151/F1 overlay, C151/F118 stop, collapse/Back behavior and zero overflow. Browser logs are clean.
- Iteration 28 regression browser QA passes 13 desktop and 4 mobile flows on the same standalone artifact. Standalone has one embedded script and no linked stylesheet; logs are clean.
- Frozen `reference/tsageri-lentekhi-v1.manifest.json` SHA-256 remains `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.

Reviewed screenshots:

- `docs/iteration28a-sc206-fork-desktop.png` — C169 and C151 directly visible together at SC206.
- `docs/iteration28a-source-b-node207-chain-desktop.png` — Node 207 → C152 → Node 208 and its neutral physical branches.
- `docs/iteration28a-c151-f1-optical-overlay-desktop.png` — active C151/F1 optical path over the physical network.
- `docs/iteration28a-combined-network-mobile-390px.png` — SC206 fork at mobile width.

Machine-readable visual results are in `docs/iteration28a-network-browser-qa.json`.

## Remaining limits

The topology is a connectivity diagram, not a georeferenced map. Source B equipment classes and place-to-node scope remain unknown where the active data has not established them. Physical branches describe Cable adjacency only; they must not be interpreted as optical Fiber splits. No importer redesign, Visio import, persistent topology editor, backend, or database was added.
