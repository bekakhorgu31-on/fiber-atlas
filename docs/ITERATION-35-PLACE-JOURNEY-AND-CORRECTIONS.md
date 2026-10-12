# Iteration 35 — a network workspace people can understand

Date: 2026-10-10. **First delivery 35-01–04 completed locally on 2026-10-11. 35-05 was subsequently delivered locally on 2026-10-11; owner acceptance remains pending.**

Evidence: [implementation review](ITERATION-35-IMPLEMENTATION-REVIEW.md), [owner guide](ITERATION-35-OWNER-GUIDE.md), and Iteration 35 validation. Correction activation/reconciliation QA is complete locally; owner comprehension acceptance remains pending.

The owner requests a fundamental presentation change: the long network tree makes it difficult for a newcomer to understand the digital Visio. They also ask how to correct the AP18/Port1 issue shown in the review screen. This iteration addresses both needs through small, independently usable deliveries.

## Product decision

Make the primary experience **find a place → inspect a connection → follow a selected Fiber**. The application should answer “Where am I?”, “What is connected here?”, “Where does this Port go?” and “What remains unknown?” without requiring knowledge of the source drawing or the data model.

Replace the automatically expanded tree as the default workspace. A flatter tree, more collapse buttons or animated lines over the same huge hierarchy do not meet this requirement. Retain the complete inventory and an advanced network view for discovery and engineering investigation. Reuse the established data, source evidence, resolver, database and import pipeline.

The planning chat provides an interactive concept at:

`C:/Users/Beka/.codex/visualizations/2026/10/02/01a0fd27-0367-72d2-8f0a-98aee608ae49/fiber-atlas-place-and-journey.html`

It compares **Place workspace** (recommended main Network entry) with **Question workspace** (the complementary Engineer Search entry). These are two ways into the same product, not two new graph engines. The example choices are deliberately limited to known local fixtures; production discovery must use the complete scoped inventory. The concept is not the running application and never writes data.

## Evidence behind this change

- `NetworkTopologyCanvas.tsx` builds and recursively renders a tree from the physical graph, repeating node, Cable and branch cards. `RouteWorkspace.tsx` defaults to network context and expands everything on desktop unless a collapse state exists. This exposes the whole model before the user's question is known.
- Location, inspected object, selected optical route and the full network compete for attention. A large connected component can become a long page even when the desired answer concerns one Port.
- Iteration 34 delivered accessible review cases and real source geometry, but the screenshot still requires the user to interpret tiny labels and find a generic decision form lower in the pane. Repeated count/uncertainty text does not explain the specific rejected connection.
- The current proposal form records free-text old/new values. It does not apply a Port–Fiber binding. `ReviewInbox.tsx` records `applied:false` and leaves source/topology unchanged. That is an honest review log, but is not yet a complete correction workflow.

### The actual selected example: AP18 / Port1

The source-backed diagnostic record for Port Shape **12158**, AP symbol **12106**, identifies candidate stroke **12110**. The stroke reaches the Port rectangle (`gap: 0`); the opposite Fiber marker is missing or non-unique under the current interpretation. The record is explicitly `diagnostic_only_not_a_mapping`.

The correct next step is to inspect that stroke's other endpoint, printed Fiber marker and owning Cable, then record the exact evidence. The screenshot does not establish which Fiber it should be. **Port1 must not be mapped to F1 by number matching.** A source label `25-128-25020-18-24` supports the SC25020–AP18 Cable context; that alone does not prove the individual Port binding.

Until an exact mapping is established, the owner can save an observation in the active review case. They should not dismiss it as a non-issue merely to reduce the count. The proposed correction builder below must supply the missing path from a verified operator decision to a validated network revision.

## Three consistent levels of detail

### Find a place or ask a question

Network opens a clear region/source context with one search and a concise inventory of places, Cables and routes. Search must recognize AP/SC numbers, location names and source labels. Use disambiguation for repeated numbers across regions; show human labels before technical IDs. Never select the first Cable route as if it were the user's intended location.

The initial screen must explain what to do through useful content, not counts of thousands of Fibers or an onboarding essay. A short example such as “AP16, Tsveri, or a Cable label” is enough. Empty, loading and failed states stay distinct. No demo inventory is injected into an empty database.

Engineer Search remains a primary sidebar item. Questions such as “Where does AP16 Port13 go?” return one direct answer and the same journey component used by Network. An organization query shows only evidence-backed associations and the user's selected route; it must not force several unrelated paths into one chain. Keep Network · Engineer Search · Visio Import · Needs Review.

### Explore one place

Show a stable, bounded schematic of the selected node and its immediate Cable neighbors. Label connections by endpoints and capacity; keep opaque construction references secondary. Clicking a connection reveals its Fibers; choosing a Port or Fiber opens its journey in the same workspace.

Use the physical graph directly, including cycles, parallel Segments and disconnected components. Do not invent an aggregation root or imply upstream/downstream from layout. Any “show further connections” action expands a bounded neighborhood, preserves focus and is reversible. The complete network remains discoverable through inventory/search and an explicit advanced overview; nothing disappears merely because it is outside the current focus.

Use a real geographic map only if source coordinates and a proper basemap support it. The first delivery should use a clearly labelled connection schematic; approximate drawing coordinates must not masquerade as geographic positions.

### Follow one Fiber

Give the answer first, then a compact ordered journey. Retain the complete known path in both directions from the selected item, not just the previous segment. Start at an AGG only when the accepted path actually reaches it. Otherwise identify the known endpoints and the exact unknown continuation.

Examples from the existing Shida resolver:

| Selection | Answer and visible journey |
| --- | --- |
| AP16 · Tsveri / Port13 | AP17 · Aradeti / Port13, through SC25017; `25-123/F13` → `25-124/F13`. Exclude the unrelated `25-122` direction. |
| AP16 / Port1 | F01 is known to SC25017; onward continuation is unknown. Do not use the neighboring Port13 path. |
| AP18 · Kvemo Shakshaketi / Port1 | Exact Fiber binding unknown. Show the selected Port and explain the missing association; there is no accepted optical journey to animate. |

Present only useful stops by default. For long chains, group ordinary intermediate stops behind a count and expand inline. Never group away a branch decision, selected object, ambiguous mapping or unknown continuation. Intermediate-stop grouping is display-only and must not alter the resolver path, hide alternate paths or imply an edge over an evidence gap. Preserve loop/cycle and multiple-path cases explicitly.

On desktop use a compact left-to-right journey where readable; on mobile use a short vertical sequence. Labels remain legible; do not shrink an entire network to fit. The user should not need several screens of scrolling before discovering the answer.

## Case review and correction experience

Selecting an issue should present one concise explanation above the evidence. Keep a compact selected-object heading and current mode visible. Move global counts, category totals, raw JSON and audit internals out of the primary reading path. Preserve independently scrollable list/detail panes and a reliable mobile return.

For AP18/Port1 the explanation is: **“The Port is identified. The Fiber at the other end of its drawn line is not identified.”** Highlight Port Shape12158 and stroke12110, with a clearly marked unresolved endpoint. Differentiate a review highlight from the Fiber's documented physical color. Initial source framing must show that endpoint and readable nearby numbers; widening the neighborhood is an explicit action. Keep the accepted network schematic and original source geometry visually distinct.

Offer action-specific controls, rather than asking a novice to edit arbitrary strings:

1. **Inspect evidence / record an observation.** The user can leave an unresolved case open without manufacturing a value.
2. **Specify the correct connection.** For an active Port-binding case, choose the canonical Port, incident Cable and Fiber number; show both object names and source context. Select the evidence basis and enter a reason. No target is chosen by default. Preserve original source values.
3. **Preview what changes.** Show the proposed old/new binding, affected journeys and any conflicting facts. Indicate that it is still a draft. Distinguish operator-confirmed interpretation from source-extracted facts and field verification.
4. **Apply the reviewed proposal.** After validation, a separate explicit owner action activates a new immutable network revision. The resulting case displays the applied revision and remaining unknowns. A saved note is never labelled an applied repair.

The first correction delivery may support active Port–Fiber bindings only. Numbering, bank/Cable identity, colors and duplicate physical objects need their own typed operations; the UI must honestly state when only a proposal can be recorded. Do not put an unsupported correction behind a successful-looking save action. Historical/staged contexts remain read-only until a properly scoped draft workflow exists.

## Delivery tasks

### 35-01 — Navigation and a place-first Network entry

**P1 · Done locally (2026-10-11).** Implement the scoped finder and inventory, clear location breadcrumb and workspace state. Reuse current canonical identities and navigation; old object/review/search deep links must resolve to the new focused view or an explicit historical state. Browser Back/Forward and refresh restore scope, selection and return position. Preserve the four main sidebar entries. Remove hard-coded regional labels from shared controls.

Done: a newcomer can find AP16 or AP18 directly, identify the region/place, and reach its local connections without expanding a tree. Repeated AP labels across sources require a clear choice. Empty-network behavior still works.

### 35-02 — Local graph and direct Port/Cable exploration

**P1 · Done locally (2026-10-11).** Replace default recursive tree rendering with the selected node's bounded neighborhood and a compact Port/Fiber selector. Exact bindings, unknown bindings, physical availability and usage remain separate. A colored port square alone must not mean “available” or “connected.” Clicking an object inspects it in place; a separate “explore this place” action changes focus when appropriate.

Done: local neighbors, parallel Cables, a cycle, multiple components and a node with many connections are understandable at desktop and 390px widths. Additional neighbors remain discoverable without an unbounded automatic expansion. No graph facts or accepted edges change due to the new layout.

### 35-03 — One reusable journey and optional guided playback

**P1 · Done locally (2026-10-11).** Use the existing resolver for Network, Engineer Search, organization results and review-to-route navigation. Render direct answers, known endpoints, Fiber changes at nodes, intermediate-stop grouping and explicit uncertainty. Keep physical Cable context available as a separate labelled view.

Add an explicit Play/Pause/Replay or step-through action that progresses along accepted journey edges once. Do not autoplay, loop endlessly or animate across unknown/ambiguous connections. Pause on uncertainty and explain it. Playback indicates reading order, not live traffic, verified signal direction or operational health. Respect reduced motion, hidden views and changed selection; static labels contain the same information.

Done: AP16/Port13, AP16/Port1, AP18/Port1, existing AGG-to-AP traces and the SC217→Lentekhi regression retain their original path signatures and limitations. A long path, branching path and cycle stay intelligible without fabricated simplification. The answer is visible before technical details.

### 35-04 — Turn review evidence into a specific next action

**P1 · Done locally (2026-10-11).** Refine the delivered Iteration 34 screen: short issue statement, known/missing facts, highlighted rejected connection and a reachable next-action area. Use existing rejection metadata where present; explicitly flag old snapshots without it. Do not silently mix a newer diagnostic run into an older active revision.

For AP18/Port1, show stroke12110's unresolved endpoint and explain why it was rejected. Preserve source/run/page/Shape identity, zoom, pan, bounded loading, evidence failure/retry and append-only observations. Use two comparison panes when an issue concerns two source locations. Keep group/count parity and review disposition separate from unresolved network facts.

Done: the owner can explain the selected issue and record a useful observation without reading JSON or scrolling through several generic warning paragraphs. Test all five issue categories, with special attention to the screenshot's AP18 case and the AP43/AP47 numbering comparisons.

### 35-05 — Deliver a real, typed Port-binding correction workflow

**P1 · Done locally (2026-10-11); see [correction review](ITERATION-35-PORT-CORRECTION-REVIEW.md).** Implement the four-step active-case workflow above using structured canonical references. Reuse/extend the existing proposal and activation path rather than mutating a live binding in place or turning review comment strings into graph facts.

Required behavior:

- Validate active revision, subject/version, source provenance, role, Port identity, incident node/Cable, Fiber range and existing binding conflicts. A display number, color or construction reference does not identify a unique object. Preserve supported optical relationship types; do not invent a splitter or ambiguous multi-binding.
- Persist a typed draft with old/new references, reason, actor and evidence. Use the same graph resolver to build the candidate and show a bounded but complete impact comparison. Show other affected facts/paths if they change; do not hide them behind a successful Port result.
- Separate saving a draft, validating it and explicitly activating the compared candidate. Refuse stale candidates, concurrent changes and scope mismatches. Preserve original VSDX bytes, source geometry, prior network revision and all review events. No inferred field-verification flag.
- Make the result and its provenance accessible after refresh. A reprocess must preserve the prior human decision history and detect/reconcile incompatible corrections; never silently replay it onto a changed source or discard it. Reversal is an explicit validated revision, not a history deletion.
- Keep unsupported correction types clearly marked “proposal only.” For a source interpretation problem that can fix many cases, recommend the importer investigation instead of hundreds of manual overrides.

Done: in an isolated fixture, an authorized reviewer can choose an evidence-backed exact mapping, inspect the changed journey, explicitly apply a new revision, reload it, and inspect the original values/history. Unauthorized, non-incident, out-of-range, conflicting and stale corrections are refused. Recording an observation alone still leaves the graph unchanged. The worker must not guess or apply the real AP18 mapping to satisfy this test.

### 35-06 — Validate comprehension and release in two useful steps

**P1 · Both-delivery worker QA Done; owner/first-time-user acceptance pending.** Deliver 35-01 through 35-04 as the first usable interface improvement. Deliver 35-05 after its real proposal/activation flow passes checks; do not call the overall correction feature Done while it only stores comments.

Use actual isolated Shida/Tsageri data and report performed checks, not historical totals. Verify desktop/mobile scrolling and layout, keyboard access, deep links, selected-object orientation, errors/retry, unchanged route signatures, reduced-motion behavior and no animation across gaps. Preserve current import/review workflows and data isolation. Measure initial/focus/source payloads; never load the full 62,670-Shape drawing or 153 MB proposal to display a local place.

Provide a short owner acceptance script:

1. Find AP16 in Shida and identify its place and neighboring Cable.
2. Select Port13 and identify the destination and connecting node without opening the raw source.
3. Select Port1 and identify exactly where knowledge ends.
4. Open AP18/Port1 from review; explain what is missing and find the relevant source endpoint.
5. Record an observation, then separately exercise a known test correction through preview and explicit apply.
6. Return to the original place/issue with selection and context intact.

Record whether representative first-time users can complete the tasks; if only the worker tested them, label that limitation. Browser automation is not evidence of newcomer comprehension. Supply before/after screenshots, implementation review, updated owner guide, validation and task status.

## Preserve data work alongside the new presentation

The [Iteration 34 digitization backlog](ITERATION-34-DIGITIZATION-BACKLOG.md) remains active: 406 Port association rejections, 98 marker-attachment outcomes, two undiagnosed scan cases, and the Cable/bank/container questions need source-supported investigation. Their counts are qualified diagnostic classifications, not accepted new mappings. Improving the interface must not hide those gaps or claim the Visio is fully digital.

No new universal-import claim, broad tolerance rule, renumbering, shade equivalence or duplicate merge is authorized by this design. The worker tests locally and leaves owner-server imports, corrections and activation to the owner. Keep credentials, schema isolation and prior deliveries intact.
