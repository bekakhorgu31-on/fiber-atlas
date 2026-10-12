# Fiber Atlas — project handoff

## Active worker queue — Iteration 28H: search correctness and reliable handoff

Requested: 2026-10-02. Overall status: **Done**. Current delivered baseline: **28H**; earlier iteration validation claims below are historical results. Final 28H verification: 770/770 tests, TypeScript, production build/export and offline desktop/390px QA pass. See `docs/ITERATION-28H-SEARCH-CORRECTNESS.md` and `docs/VALIDATION.md`.

This is the current work order. Earlier iteration narratives, open questions and “next work” paragraphs are historical context; they do not create additional tasks. Preserve source evidence, certified topology and exact-binding rules. Implement this focused correction pass before adding new features. Backend, authentication, new imports and deployment are outside this work order.

### Worker status contract

- Update each task in place: **Ready → In progress → Needs review / Done**, or **Blocked** with the exact reason and required input. Continue independent tasks when one is blocked.
- For every completed task, replace its worker-notes placeholder with changed files, observed before/after behavior, verification results and any remaining limitation. Do not mark Done on implementation alone when acceptance checks remain unverified.
- Findings below came from code review. Reproduce each behavior first; if a finding is not reproducible, record the evidence and mark Needs review rather than introducing a speculative fix.
- Run tasks 28H-01 through 28H-05 first, then 28H-06 and 28H-07. Update this queue as work proceeds. No additional confirmation is needed for this scoped implementation and validation.

### 28H-01 — Restore complete summaries for Source B APs

Priority: **P1**. Status: **Done**. Dependencies: none.

Problem: `compactSearchResult` looks only in `accessPoints`, while AP42–49 retain canonical identity in `networkNodes` with `apEvidence`. Known place, Cable, capacity and occupancy can disappear from compact results.

Requirements: Resolve both supported AP representations without duplicating canonical assets. Read place/capacity from the authoritative AP evidence and occupancy from that AP's Port records. Preserve unknown occupancy explicitly; do not substitute Fiber use. Use typed endpoint identity when finding connected Cables.

Acceptance:
- AP42 search shows ორბელი, 24 Ports, its actual connected Cable context and correct source occupancy counts; no `? Ports` where capacity is known.
- All AP42–49 summaries reconcile against their source inventory, including AP47's unknown Port occupancy. Existing Source A AP search remains correct.
- Result navigation opens the same canonical AP. Regression assertions check actual values and counts, not merely the presence of the word “Ports”.

Worker notes: `src/domain/iteration28g.ts` now reads Source B `networkNodes.apEvidence`, counts the AP's source Port occupancy, matches typed Cable endpoints and routes to the canonical network node. Before: AP42 could lose place/capacity/occupancy and open an absent Source A AP page. After: AP42 is ორბელი · C153 · 24 Ports, 2 used/22 unused/0 unknown; AP47 retains 1 unknown. All AP42–49 source counts and navigation pass focused tests and offline Edge QA.

### 28H-02 — Format compact search cards once and remove repeated facts

Priority: **P1**. Status: **Done**. Dependencies: none.

Problem: bare Cable search already applies `compactSearchResult`; App and Engineer Workspace apply it again. The formatter appends facts and the UI repeats those facts beneath a combined subtitle.

Requirements: Establish one clear formatting boundary shared by global search and Engineer Workspace. Keep identity, construction and usage facts concise and nonduplicated. Preserve source evidence access without placing raw evidence in ordinary result cards.

Acceptance:
- `C158`, `C148` and source label `154-208-209-144` show each summary fact once in both search surfaces.
- Cable cards retain endpoint identity, legacy ID, capacity, Tube summary and grouped use counts without dumping Fiber rows.
- Reformatting cannot accumulate duplicate facts: either make formatting idempotent or enforce/test a single formatting boundary.
- Desktop and 390px cards remain readable; direct navigation and Back-to-query behavior still work.

Worker notes: `src/domain/engineerQuery.ts` returns raw Cable/place results to the UI formatting boundary and gives generic exact-Port cards short legacy Cable/Fiber labels; `src/domain/iteration28g.ts` makes formatting idempotent and separates Cable identity from Tube/use/source facts. Before: repeated formatting and source facts appeared twice, while generic AP42 Port cards showed long internal IDs. After: C158, C148 and `154-208-209-144` show each summary once and AP42 Port1 shows C153/F1. `tests/iteration28h-search-correctness.test.ts` and offline desktop/390px cards pass; source labels remain in details.

### 28H-03 — Reject nonexistent scoped Ports

Priority: **P1**. Status: **Done**. Dependencies: none.

Problem: scoped Aggregation lookup creates a fallback result from any requested number without verifying Port existence.

Requirements: Validate owner and Port identity against the actual inventory before producing a navigable result. Clearly distinguish a nonexistent Port, an existing unbound Port and an ambiguously bound Port. Never infer Fiber identity from matching numbers.

Acceptance:
- `Lentekhi Port999`, `Lentekhi Port0`, `Tsageri Port0`, `Tsageri Port193` and an out-of-range AP42 Port produce no invented Port/Fiber navigation target.
- `Lentekhi Port38` and `AP42 Port1` retain exact Fiber navigation. `Tsageri Port175` opens the existing Port with binding/occupancy unknown and no borrowed C148 Fiber identity.
- An ambiguous-binding regression exposes uncertainty and supplies no exact Fiber route or misleading `Fnull` construction facts.

Worker notes: `src/domain/engineerQuery.ts` validates scoped AP/ODF Port existence before creating a result and uses the exact-or-ambiguous `PortOperationalView`. Before: nonexistent Lentekhi numbers received invented Port routes. After: the five invalid acceptance examples return no result; Lentekhi Port38 and AP42 Port1 remain exact; Tsageri Port175 remains an existing unknown Port; ambiguous bindings expose no Fiber route or Fnull. Focused regressions pass.

### 28H-04 — Use one ordered path presentation policy

Priority: **P1**. Status: **Done**. Dependencies: none.

Problem: Port summaries flatten both resolver sides and globally deduplicate nodes, while `compactPath` reverses the first side before joining. The displayed sequence can disagree with the actual ordered journey.

Requirements: Derive a consistent ordered display from the existing 28C resolver for Port and Fiber summaries. Do not introduce another connectivity engine. Remove only redundant adjacent display nodes; preserve meaningful revisits and show omissions explicitly when shortening a path. Keep partial and termination stops distinguishable.

Acceptance:
- Exact Port and bound Fiber search agree on path order and endpoints for the same journey.
- Lentekhi Port38 preserves its C184/F38 → C181/F06 remap and SC225 termination; F11 preserves its established remaps; C151/F118 remains partial at its genuine gap.
- Regression checks compare ordered sequences with resolver output, including a two-sided path and a revisit/loop fixture where supported. Checking that a Closure name merely appears is insufficient.

Worker notes: `src/domain/iteration28g.ts` now derives Port and Fiber display paths from the same 28C resolver, with ordered local remaps, adjacent-only duplicate collapse, explicit omission, and distinct termination/partial stops. Before: Port paths flattened both sides through a global Set. After: Port38 and C184/F38 agree on Lentekhi Port38 → SC224 C184/F38→C181/F6 → SC225 termination; F11 and F118 regressions pass. No active revisit was found in the checked fixtures; the policy preserves nonadjacent revisits.

### 28H-05 — Make Tube route scope explicit

Priority: **P2**. Status: **Done**. Dependencies: 28H-04 for path presentation.

Problem: a Tube result presents the first Fiber's journey and routes to that Fiber without explaining that other Fibers may follow different paths.

Requirements: For this fast correction pass, label the path as a sample of the specific Cable/Fiber and make the route action name that Fiber. Keep Tube identity, physical color, Fiber range and aggregate usage visible. Do not imply a shared optical route for the whole Tube; a new Tube workspace is not required.

Acceptance:
- Use a Tube whose Fibers have differing journeys to verify that the card clearly identifies the sample Fiber and its action opens exactly that Fiber.
- Tube totals still cover all its Fibers and reconcile to source-derived usage. Unknown/review states are retained.
- Global search and Engineer Workspace use the same wording and scope.

Worker notes: `src/domain/iteration28g.ts`, `src/App.tsx` and `src/views/EngineerWorkspace.tsx` label the Tube path and action with its sample Cable/Fiber. Before: the first Fiber's path appeared to describe the Tube. After: C184 Tube1 retains all 12 Fibers and 10 used/2 unused totals while clearly sampling C184/F1; a different member has a different journey. Focused and offline browser checks pass on both search surfaces.

### 28H-06 — Measure and remove avoidable presentation work

Priority: **P2**. Status: **Done**. Dependencies: 28H-01 through 28H-05.

Problem: each Port/path formatter can rebuild resolver indexes, and exact Fiber formatting calls the path formatter repeatedly. The approximately 9.97 MB standalone also needs measured load behavior rather than an assumed performance pass.

Requirements: Measure cold standalone load, representative search updates and opening the 48-Port Lentekhi grid on a stated browser/device or emulation profile. Reuse a resolver for one inventory snapshot and avoid duplicate path calculation where practical; invalidate reuse when authoritative inputs change. Preserve offline evidence. Do not begin a bundle architecture rewrite in this iteration.

Acceptance:
- Record measurement method and before/after results; distinguish real-device results from emulation. Record any observable input lag or main-thread stalls.
- Grid rendering does not construct a fresh complete resolver per Port; one result does not recompute the same path unnecessarily.
- Any cache/reuse respects inventory changes and leaves path answers unchanged. If meaningful performance measurement is unavailable, record the limitation explicitly rather than claiming mobile performance is verified.

Worker notes: `src/domain/iteration28g.ts` reuses a topology-revision-bound resolver and calculates each compact Fiber path once; `src/views/NetworkViews.tsx` and `src/views/SpliceWorkspace.tsx` omit path calculation when a Port card/cell does not show it. Cache invalidation is tested after an active transition change. Offline headless Edge 1440px previous→latest: 48-Port grid 746→92 ms, cold load 3,566→6,270 ms; final search updates 27–84 ms. Earlier final runs gave 59–62 ms grid but 3.6–3.8-second cold load, so host variation is material. Latest cold startup has a 5.3-second long task. 390px is browser emulation, not real-device certification. Raw evidence remains offline in the large bundle.

### 28H-07 — Verify delivery and reconcile current documentation

Priority: **P1 delivery gate**. Status: **Done**. Dependencies: 28H-01 through 28H-06.

Requirements: Add behavior-focused regressions for these corrections, run the full repository suite and TypeScript/production build, and regenerate `../fiber-prototype.html`. Perform offline desktop and 390px browser checks on the final export. Update `docs/VALIDATION.md` and add `docs/ITERATION-28H-SEARCH-CORRECTNESS.md`. Keep one current baseline statement and this task queue at the top of the handoff; explicitly mark superseded limitations/open questions as historical while preserving their audit history.

Acceptance:
- Record actual test totals and failures, build/export results, browser errors, external requests and overflow. Do not copy 28G's 763-test claim as a new result.
- Browser coverage includes AP42 summary, Cable/source-label summaries, invalid and unbound Ports, Port/Fiber path agreement, Tube sample action, keyboard selection and Back-to-query from both relevant search contexts.
- Save final QA evidence with timestamp, browser/viewport details, explicit expected/actual outcomes and SHA-256 of the tested standalone. Include screenshots of changed cards.
- Verify unchanged authoritative topology/source data, not just entity counts. Retain 37 Cables, 2,088 Fibers, 1,629 transition records, 48 Lentekhi bindings, 192 Tsageri logical Ports and zero C148 Port bindings unless a separately authorized source correction exists. Preserve the frozen V1 manifest.
- Current documentation no longer presents resolved SC225/SC207 historical work as an active instruction. Remaining genuine partial paths and unknown facts remain explicit.
- Mark overall 28H Done only when required checks pass; otherwise state precisely what remains Blocked or Needs review. Prototype acceptance does not imply production deployment or field verification.

Worker notes: `tests/iteration28h-search-correctness.test.ts`, `docs/ITERATION-28H-SEARCH-CORRECTNESS.md`, `docs/VALIDATION.md`, `scripts/iteration28h-browser-qa.mjs`, QA JSON/screenshots and this handoff were added/updated. Final run: 770/770 tests, TypeScript, Vite production build and standalone export pass. Offline Edge 1440px and emulated 390px: 18 recorded flows, zero browser errors/external requests/overflow. Final standalone SHA-256 `5fdb57701ad279d156995b4baa739bf97021acb6283767d143dae1c380b88a81`. Counts and frozen manifest hash remain certified; source AP inventory and transition-ledger hashes are in the report. The prior `uv_os_get_passwd`/`ENOMEM` runner startup issue was resolved with a temporary local Node user-info preload; it was an environment issue, not an application failure. Prototype acceptance does not imply production or field verification.

## Delivered baseline and historical iteration records

The following records describe prior deliveries. Where their instructions or unresolved-state descriptions conflict with the active queue or later accepted evidence, treat them as historical snapshots.

Historical iteration record: 2026-10-02 — Iteration 28G operational Port policy and compact universal search completed and validated. `PortOperationalView` in `src/domain/iteration28g.ts` is the shared derived presentation model for AP Port cards, Lentekhi Aggregation Port cards, ODF Port inspection, Connection Sheet Port cells, and scoped Port search. Fiber identity and usage appear only with one exact PortTopologyBinding. Source-native Port occupancy remains independent and is never inferred from Fiber use. Lentekhi retains 48 exact C184 bindings and 48 unknown occupancies; Tsageri retains 192 logical Ports and zero C148 bindings, with C148 use displayed separately. Universal search now shows short operational cards and direct route actions for Cable, exact Fiber, Tube, Closure, AP, Port, Aggregation, organization, source Cable label, and supported place queries. Fiber path summaries use only the active 28C resolver. Browser Back returns from a selected result to the URL-backed query. No topology, source use assignment, occupancy, or Port binding changed. See `docs/ITERATION-28G-OPERATIONAL-SEARCH-AND-PORT-POLICY.md` and `docs/VALIDATION.md`.

Previous iteration record: 2026-10-02 — Iteration 28F aggregation operational projection and organization network search completed and validated. This is a derived operational layer over 28E/28C, and has not changed topology, local use evidence, source assignments, or Port bindings. The 28D Source B AP/Port and network-use certification remains active. All 37 canonical Cables, 2,088 Fibers and 1,629 transition records remain unchanged. The 28C resolver remains authoritative. Frozen `TSAGERI-LENTEKHI-REFERENCE-V1` manifest SHA-256 remains `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.

## Iteration 28F — aggregation operations and organization network search

1. `src/domain/iteration28f.ts` derives revision-bound `OrganizationNetworkProjection` and `AggregationOperationalProjection` from the 28E usage claims, 28C current Fiber path resolver, and exact 28D/earlier PortTopologyBindings. It adds no persisted topology relationship and changes no NodeFiberTransition, 28C lineage, or 28E source-use claim.
2. The organization index uses exact names/aliases only: Magti / მაგთი; OpenNet / Open Net / ოპენნეტი; Silknet / სილქნეტი; Skytel / სკაიტელი. Source occurrence IDs, company-label Shape IDs, line Shapes, local Fiber legs, current path signatures, exact Port bindings, APs, Aggregations, traversed Closures, conflicts, and review cases remain available.
3. The derived organization inventory currently projects 29 logical strand groups, 236 unique local Fiber legs across 27 Cable Segments, 22 exact Port bindings, two exact Aggregation endpoint paths, and 21 traversed Closures. These counts are projection results, not target counts. Source occurrences remain the direct evidence; remote Cable/AP/Port/Aggregation/Closure context is derived from exact Fiber paths.
4. Tsageri displays operational status for all 192 local C148 Fibers. Its 192 logical ODF Ports remain separate: zero exact per-Port C148 bindings and unknown Port occupancy. Current C148 usage breakdown: 33 in use, 156 unused and three review-required local Fibers; the organization grouping is included in the 28F report. No same-number Port binding is inferred.
5. Lentekhi C184 displays 48 local Fibers and 48 exact PortTopologyBindings. Port occupancy stays unknown independently of Fiber-use state. Current C184 Fiber-use breakdown: 12 in use, 14 unused and 22 unknown; all 48 exact bindings remain navigable. Each path endpoint is taken from the current 28C resolver, including path-specific Closure/AP/Aggregation stops.
6. Aggregation Inspector has an operational Fiber-use section independent of Port occupancy. Organization search presents a first-class Organization result and exact Cable/Fiber, AP/Port, Aggregation and Closure context. Closure wording says the organization Fiber path passes through a Closure. Source evidence is under expandable result details.
7. Query outcomes retain direct/exact, derived-from-exact-lineage, partial, unknown-Port, unknown-occupancy, conflict and review-required distinctions. No ownership, service, customer, commercial allocation, availability, or rights/IRU meaning is inferred.
8. Artifacts: `migration/iteration28f/organization-network-projection.json`, `migration/iteration28f/aggregation-operational-projection.json`, `docs/ITERATION-28F-AGGREGATION-OPERATIONAL-PROJECTION.md`, and `docs/ITERATION-28F-ORGANIZATION-SEARCH.md`. The projections are deterministic build outputs; regenerate them with `scripts/build-iteration28f-projections.ts`.
9. Validation: 755/755 repository tests pass; the focused organization/search and 28F projection suite passes; TypeScript compilation and the Vite production build pass (`vite build --configLoader runner`); standalone export is regenerated. Offline desktop QA passes seven flows at 1440px and mobile QA passes three flows at 390px with no browser errors, warnings, external requests, or horizontal overflow. The build retains the existing large embedded-evidence bundle advisory. Machine QA is in `docs/iteration28f-browser-qa.json`; byte-identical projection hashes are in `migration/iteration28f/determinism.json`.
10. Keep 28C authoritative and rebuild these projections if topology revision, exact Port binding, or 28E usage evidence changes.

## Iteration 28E — Fiber operational-use style and lineage projection

1. Versioned Source B grammar: `tsageri-alpana-tvishi-fiber-usage-line/1`, bound to `Tsageri-Alpana-Tvishi.vsdx` SHA-256 `419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d`. It reads already-resolved effective `LineColor`, `LinePattern` and `LineWeight`; it does not change the generic VSDX reader.
2. Owner-confirmed line meanings: blue `#0000FF` / Pattern 1 = unused; green `#00B050` or `#009945` / Pattern 1 = OpenNet in use, internal unless exact OTDR text attaches; red `#FF0000` / Pattern 1 = in use, organization from exact source Fiber label or unknown; red `#FF0000` / Pattern 2 = review required. Unused never implies allocation, availability, condition or assignability. Operational line color does not overwrite physical Fiber fill, Tube color, or AP Port occupancy.
3. Complete colored line-geometry accounting: 3,092 candidates across 9,707 page Shapes, associated to 2,928 numbered marker representations from 42 banks. Dispositions: 2,603 blue solid unused; 230 green solid OpenNet (four OTDR); 30 red solid named; 192 red solid organization unknown; 28 separate red-dashed review cases; five line/Fiber alignment reviews; four rejected non-Fiber graphics. No unexplained style remains.
4. `src/domain/iteration28e.ts` projects generic local use claims over the existing active 28C resolver. It stores the current topology revision, path signature, observed local C/F, exact local Fiber legs, origin line/company/OTDR Shape IDs, basis and stop points. Fiber-number, Tube and physical-color remaps follow only exact active transitions; ambiguity, termination, source gap and external boundaries stop propagation. No line style adds/removes a NodeFiberTransition.
5. Current use views cover all 2,088 local Fibers: 306 in use, 1,431 unused, 17 review required, 334 unknown. Logical path groups: 38 in-use, 301 unused and two review-required. Four organization conflicts remain review-required. These are source-derived counts, not protected targets. Red solid without organization remains `in_use` / organization unknown.
6. Review queue has 229 individual cases: 28 red-dashed semantics, 192 red-solid organization enrichment, five ambiguous line/Fiber alignments, and four organization conflicts. Each red-dashed occurrence includes exact line style, local Fiber, known path, endpoints, neighboring examples and question. Engineer/owner choices append to browser-local storage; raw Visio and connectivity are unchanged.
7. Fiber Inspector now shows operational status/organization/purpose and preserves origin evidence; Cable cards show grouped usage counts. Engineer queries recognize company, OTDR, unused and review-required questions. Physical swatches and independent AP Port status remain separate.
8. Reports: `docs/ITERATION-28E-FIBER-USAGE-LINE-GRAMMAR.md`, `docs/ITERATION-28E-LINEAGE-USAGE-PROJECTION.md`; data: `migration/iteration28e/fiber-usage-line-audit.json`, `fiber-lineage-usage.json`, `review-queue.json`, and `usage-summary.json`. Runtime compact source evidence: `src/data/source-b-fiber-usage-evidence.json`.
9. Validation complete: 743/743 tests pass; TypeScript/Vite build and standalone export pass; two semantic generations are byte-identical. Seven desktop flows and two 390px mobile flows pass offline with zero errors, warnings, external requests or overflow. The production chunk advisory remains; standalone/offline source evidence is embedded. Preserve the 28C topology revision and 28D AP/Port/company evidence. Do not infer commercial availability or use operational line style as connectivity.

## Iteration 28D — current Source B AP, Port and network-use state

1. Versioned grammar `source-b-purple-ap-block/1` scans all 9,707 source Shapes and 64 top-level groups: nine matches, 55 rejects. It requires solid purple block, own number/place/capacity fields and three matching callouts; numeric endpoint/name/color alone cannot certify an AP. AP42 root23800 owns ორბელი/capacity24/number42 through children23801–23803.
2. AP41–AP49 are source-certified. AP41 overlaps the existing frozen physical AP and remains unchanged. AP42–AP49 enrich the existing canonical network_node IDs42–49 in place; their Cable endpoints and transition nodes retain the same kind/ID. New first-class `apPorts` records and `NetworkNode.apEvidence` hold interpretation; `PortTopologyBinding.canonicalNode` links logical AP equipment ownership to its unchanged physical graph identity. No duplicate AccessPoint entity is created.
3. The source audit contains216 logical Ports and216 exact numbered Fiber bindings. New active inventory adds192 Ports/bindings. Source occupancy including AP41:13 in_use,202 unused,1 unknown. New active occupancy:10 in_use,181 unused,1 unknown. Solid green #92d050/#00b050 means physical use under separate owner evidence; white counterpart means unused. AP47/Port3 is red and unknown. Allocation, commercial availability and condition stay unknown.
4. Port numbers come from actual numbered cells. Fiber numbers come from bank labels, including above/below marker layouts; all2,302 old transition-marker endpoints independently agree. Each new Port binding requires unique local marker alignment and its own drawn connector. Observed/expected coordinates, residuals, bank pitch/tolerance, competing candidates and all Shape IDs remain auditable. Color and equal bank counts never supply binding keys.
5. All24 company occurrences are dispositioned:10 Magti,8 OpenNet,5 Silknet,1 Skytel. Their label-bearing transformed line endpoints uniquely attach to numbered local Fiber markers. They create22 generic Source B NetworkUseAssignments; Magti29210/40999 share C161/F20 and29211/41000 share C161/F21. All occurrence IDs remain. Source A's31 occurrences/13 assignments stay unchanged. No company ownership, rights, services or full service paths are inferred. No unresolved Source B company example remains.
6. Eight review cases remain: six green/“თავისუფალი” Shape Data inconsistencies, red AP47/Port3 status meaning, and Source B C172's uncertain AP44 Port correspondence. C157's actual AP44 bank is exact; no C172 Port is guessed. Review records identify canonical affected IDs, raw text, Shapes, bounds, precise questions, candidates/proposals and options. Local engineer/owner decisions are separate append-only evidence, do not rewrite raw source and do not automatically activate corrections. Future missing-asset confirmations are `added_after_source`; no missing AP or incomplete source Port bank is observed here.
7. The same28C resolver regenerates all2,088 journeys and475 current Lineages. New endpoint bindings change801 path signatures and make197 formerly partial paths exact:369 exact Port-to-Port,1,695 partial,24 termination-participating Fibers,zero ambiguity. No Fiber transition changes; all defect gates remain zero and source-edge coverage100%. F11 retains its original remaps and now reaches AP49/Port11 on C168/F11; AGG5 side remains partial. F118, F32/AP52, Port38/SC225, C148 conflict and source-scoped C172 collision remain intact.
8. AP/place/Cable/Port/status/exact Fiber navigation appears in the existing Manager Inspector. AP42, AP42 Port1, AP42 occupied Ports and C153/F1 Query use the current path authority. Company and AP/Port Shape links are Source B scoped; colliding Source A IDs are not substituted. Engineering queue/decisions/raw evidence are in Import Review, outside normal Manager presentation.
9. Artifacts: `migration/iteration28d/source-b-ap-port-audit.json`, `source-b-network-use-audit.json`, `review-queue.json`, `active-projection-audit.json`, `determinism.json`; `src/data/source-b-ap-inventory.json`; `docs/ITERATION-28D-SOURCE-B-AP-PORT-GRAMMAR.md` and `docs/ITERATION-28D-SOURCE-B-NETWORK-USE.md`. Rebuild with `node scripts/build-iteration28d.mjs` and `tsx scripts/build-iteration28d-active-audit.ts`. Both independent generations are byte-identical.
10. Validation:737/737 tests, TypeScript/build/export,17 offline desktop flows (all24 AP42 Ports included),6 mobile flows at390px. Zero browser errors/warnings, external requests and horizontal overflow. Final screenshots verify readable status cells. Build retains the previous large-bundle advisory. Reports and final QA are in `docs/VALIDATION.md` and `docs/iteration28d-browser-qa.json`.
11. Remaining importer gaps are the eight actual review cases, unknown physical AP internal operations and genuine partial graph endpoints. The Source B grammar is version-specific. Do not infer another Visio's AP semantics, reopen certified Fiber topology, import a new source or start PostgreSQL/Laravel without a new task. Routine continuation can use Luna-class Medium / Fast off under the resource policy; escalate only for material topology/evidence decisions.

## Iteration 28C snapshot — historical baseline

The notes below record the pre-28D snapshot. Statements that Source B AP Ports/company scopes were uncertified, and F11 stopped at a neutral Endpoint49, are superseded by the independently certified 28D evidence above.

## Iteration 28C — current Fiber path consistency (implemented)

1. `src/domain/currentFiberPath.ts` is the current operational continuity authority. `resolveCurrentFiberPath` requires canonical Cable/Fiber identity, traverses both ends using exact active node-local transitions, follows remaps, preserves alternatives, and distinguishes missing evidence, explicit termination, certified Ports, external boundaries and loops. Route adjacency, colors, display aliases and document boundaries create no optical edge.
2. Root cause: 27D rebuilt summaries through Iteration20's legacy-Lineage/endpoint fallback. `FiberInspector` read those summaries while Query/overlay used a separate live walker. C152/F11 therefore falsely stopped at SC208 despite `27D-NFT-208-15797`. The Query walker is now an adapter; current UI uses shared `CurrentFiberJourney`; all current summaries/Lineages derive from the same snapshot.
3. F11 now traverses C152→C154→C156→C158→C161→C164/F23→C166/F23→C167/F23→C168/F11 and reaches neutral Endpoint49. Its opposite end reaches AGG5 through C151/C150/C148. Neither endpoint has a certified Port for this strand or an explicit termination; both remain genuine maximum-known partial ends. Local F11 is rose in blue Tube1. SC208 connector and SC212/SC215 remaps have visible evidence and Splice links.
4. All 2,088 summaries regenerated; 1,270 stale Fiber projections repaired. There are 475 unique current Lineages, including partial paths. All 278 previous Lineages remain historical; 131 have different current leg membership. Never treat historical Lineage counts/paths as immutable truth or allow them to override the active graph. Earlier superseded provenance remains.
5. Audit: 172 exact Port-to-Port paths, 1,892 genuine partial paths, 24 Fibers participating in explicit termination paths, zero ambiguity. These 24 share the unchanged sixteen SC225 termination records. All current projections agree; false partials, false terminations, unsupported edges and stale operational Closure display identities are zero. Active source-supported edge coverage is 100%.
6. Topology revision and stable-ID path signatures detect stale materialized projections. Display revision is separate; Node→SC metadata cannot change connectivity. Validation rejects stale current Lineages and summaries before activation. Rebuild twice with `scripts/build-iteration28c-audit.ts`; normalized JSON must be byte-identical.
7. Preserve F118's SC207 gap, Port38→C184/F38→C181/F06→SC225 termination, C176/F32→C175/F24→AP52 without SC218/AP51, and C158/F65→C159/F01. Source B Ports/companies remain uncertified. C172 remains source-scoped; C148 retains both Tube-color claims. All raw evidence, 775 Source B exact transitions, 376 overlap proofs, Closure grammar/coordinates/GJS evidence and assignments are unchanged.
8. C152 title is SC207 ↔ SC208 · 144F. Neutral leaves remain Endpoint42–49. Combined overlay uses all actual current Fiber legs. Splice return preserves its focused Fiber, and certified Port navigation remains bidirectional. The compact engineering `Fiber path consistency` disclosure reports projection counts and defect gates.
9. Validation: 722/722 tests (previous baseline 708), TypeScript/build, deterministic all-Fiber regeneration and standalone export pass. Standalone browser QA passes 11 desktop and 4 mobile flows at 390px, with clean logs and zero overflow. Evidence: `docs/ITERATION-28C-FIBER-PATH-CONSISTENCY.md`, `migration/iteration28c/fiber-path-consistency.json`, `docs/iteration28c-browser-qa.json` and `docs/VALIDATION.md`.
10. Future controlled graph changes must invalidate/rebuild current projections and validate their revision. Historical projection builders remain for reference/reproducibility only. Continue to distinguish source gaps from software defects; do not import another Visio or begin Laravel/PostgreSQL without a new iteration request.


## Iteration 28B — Source B Closure grammar, coordinates, and references (implemented)

1. A source-specific grammar scans 64 top-level groups in `Tsageri-Alpana-Tvishi.vsdx`; 11 match the owner-confirmed Master 23 / `ქურო` symbol with grey fill, own number/coordinate/reference fields, and exactly three correctly bound callouts. Fifty-three candidates are rejected.
2. Existing canonical network node IDs 207–215 are typed in place as Closures and display as SC207–SC215. SC205 and SC206 receive source evidence in their existing records. IDs, Cable endpoints, transitions, lineages, JourneySummary, and frozen V1 manifest are unchanged.
3. Golden SC207 is Shape 19954 with children 19955–19957, coordinate 42°47'38.509"E 42°39'12.421"N, and raw external code `GJS - 3019A`. Parsed coordinates retain unknown CRS/datum. Exact source prefix is GJS; GIS is a search alias.
4. All eleven Closures repeat `GJS:3019A`, so search disambiguates rather than merging them. Source Connect rows do not target the Closure group; existing cable endpoint labels and canonical physical projection are consistency evidence only.
5. C151/F1 through SC207 into C152/F1 is unchanged. C151/F118 remains partial at SC207, with no inferred continuation or termination. SC207 splice navigation uses the existing 143 local transitions.
6. Evidence: `migration/iteration28b/source-b-closure-grammar.json`, `src/data/source-b-closure-inventory.json`, and `docs/ITERATION-28B-SOURCE-B-CLOSURE-GRAMMAR.md`.
7. Validation: 708/708 tests pass; TypeScript/build and standalone export pass. Targeted standalone QA passes four desktop and one 390px mobile flow; the 28 Engineer regression passes 13 desktop and 4 mobile flows. Details are in `docs/VALIDATION.md`.
## Iteration 28A — Combined Network Route Workspace (implemented)

1. Hashless entry opens a combined, endpoint-based physical topology across both source documents. It contains all 37 active canonical Cables / 2,088 Fibers in one component with zero omitted Cables. The Tsageri–Lentekhi CableRoute remains a separate optional route-context view.
2. The SC206 fork shows C169 toward SC216 and C151 toward neutral Node 207 at the same time; Node 207 continues physically through C152 toward Node 208. Unknown equipment and endpoint classes remain neutral.
3. Physical Cable adjacency is diagram context only. Selected Fiber highlighting and journey steps continue to use active `NodeFiberTransition` traversal; this iteration creates no optical continuity from route or physical adjacency.
4. Engineer search can open and focus Cables and neutral network nodes in the combined workspace. Selected object and collapsed branch state persist in the URL and restore through browser Back.
5. Validation: 700/700 tests, TypeScript/build, standalone export, 6 desktop + 2 mobile combined-network browser flows, and 13 desktop + 4 mobile Iteration 28 regression flows pass. Browser logs are clean and there is no horizontal overflow. Details and screenshots are in `docs/ITERATION-28A-COMBINED-NETWORK-REVIEW.md` and `docs/iteration28a-network-browser-qa.json`.
6. The V1 reference manifest is unchanged. No new source import, backend, database, or persistent topology editor was introduced.

## Iteration 28 — deterministic Engineer Query Workspace (implemented)

1. Engineer Workspace is reachable at `#/engineer` and through the global `მოძებნე ან ჰკითხე Fiber Atlas-ს` search. `src/domain/engineerQuery.ts` exposes typed `parseNetworkQuery`, a rebuildable token index, deterministic `queryFiberAtlas`, and graph-based `traceFiberThroughTransitions`. React renders the structured answer; it does not implement topology traversal.
2. Search covers canonical Cable, Fiber compound IDs, Tube, Node/Closure, AP/Aggregation, certified Port bindings, source annotations, organization aliases, and source documents. C172 and C172/Fiber collisions remain source-scoped choices; exact Visio Cable labels resolve to their matching Cable.
3. Fiber paths traverse only active `NodeFiberTransition` records. Every edge names its node, input/output Cable/Fiber, local Tube/Fiber identity, source document and Shape evidence. Multiple edges remain alternatives; no route adjacency creates a Fiber edge.
4. The 20-question catalog is executable in `tests/iteration28-engineer-query.test.ts`. Golden outputs include C151/F1 across neutral Node 207 into C152; C151/F118 stopping at Node 207; C158/F65→C159/F1 remapping; Lentekhi Port38→C184/F38→SC224→C181/F06→SC225 termination; and C176/F32→C175/F24 at SC219 with AP52, without AP51.
5. Unknown availability, unbound Source B company labels, neutral Node identity, source-only place/direction annotations and the isolated C148 Tube-color conflict are explicit. Existing V1 exact assignments can still be reported separately from Source B annotations. No backend, persistent edit, or new source import was added.
6. Query result/API semantics are documented in `docs/ITERATION-28-NETWORK-QUERY-CONTRACT.md`; operator workflow, 20-question outcome, QA and remaining gaps are in `docs/ITERATION-28-ENGINEER-WORKSPACE-REVIEW.md`.
7. Final validation: 694/694 tests pass; TypeScript and production build pass; standalone export rebuilt; browser QA passes 13 desktop and 4 mobile flows at 390px, with zero console errors/warnings and zero overflow. Standalone contains one embedded script and no linked stylesheet. The live-query and exact F32 status correction is covered by these checks. Full outcomes and assets are recorded at the top of `docs/VALIDATION.md`.

Operator query workflow remains available for review alongside the combined network. Keep editing/persistence and the Laravel/PostgreSQL rewrite deferred until that workflow is accepted.

## Iteration 27D — layered topology certification and activation (implemented)

1. Certification is layered: physical/optical topology is required for activation; endpoint asset typing, Ports, company/commercial attribution, and annotation scope are separate optional enrichment layers. The previous all-or-nothing 27B/27C gate is superseded.
2. Source B `Tsageri-Alpana-Tvishi.vsdx` is active by exact source SHA `419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d`. The 22 Cable labels describe 1,512 Fiber positions; 17 new Cable identities add 912 Fiber records; five shared canonical Cables preserve 600 already-existing Fiber records without duplication.
3. The 1,151 transition candidates remain fully accounted: 775 exact connector/marker transitions are active; 376 SC205/SC206 overlap records are attached as additional evidence to canonical transitions. There are zero unexplained candidates and no route-adjacency, same-number, or color-derived edges.
4. C151 is reconciled by exact Cable label, capacity, all 144 construction positions, SC206 correspondence, and endpoint token 207. Its far end is neutral physical `Node 207`, not a fabricated Closure. The historical `BOUNDARY-SC207` alias stays as provenance. C151↔C152 has 143 exact transitions; C151/F118 stops at Node 207 without a C152 edge or inferred termination.
5. SC205 and SC206 remain one shared canonical node each. C148/C149/C150/C151 and C169 remain canonical shared Cable identities. C169 has 48 canonical Fibers and 48 SC206 transitions with evidence from both documents. Source B C172 uses URL-safe source-scoped ID `SRC-TSAGERI-ALPANA-TVISHI-419DEF34-C172` and cannot merge with V1 C172 by the legacy number alone.
6. C148 remains a single physical Cable identity with a preserved six-range Tube-color conflict across F121–F192. Frozen V1 Fiber/Tube attributes are not overwritten; both document claims remain in `sourceConflicts` and the active network manifest.
7. Nineteen source endpoints remain neutral where type is not established. Source B has zero logical Port bindings and zero company-use assignments. All 24 organization occurrences, three source instructions with unknown execution status, nine places, two direction notes, 42 capacity notes, and four technical notes are retained as unresolved annotations; 106 meaningful text occurrences are accounted.
8. Topology inventory validation passes. The combined repository produces 37 canonical Cables, 2,088 canonical Fiber records, 775 new active transitions, 376 attached duplicate proofs, and complete JourneySummary coverage. Application activation is atomic: source/count/graph gates validate before the combined inventory is returned.
9. The active certification manifest is `reference/fiber-atlas-network-v1.manifest.json`; it records topology PASS separately from asset typing, Port, company, annotations, and source conflicts. Useful owner enrichment questions are in `docs/ITERATION-27D-OWNER-CONFIRMATION-CHECKLIST.md`; topology-critical confirmations required: zero.
10. Source interpretation and deterministic projection are `migration/iteration27/source-interpretation.json`, `source-b-transition-ledger.json`, and `src/data/iteration27d-network-projection.json`. Rebuild with `scripts/build-iteration27d-projection.py`; manifest promotion checks frozen V1 and topology counts with `scripts/finalize-iteration27d.py`.
11. The former Iteration 27B/27C inactive decisions below are retained as historical audit context only; they no longer describe activation state. Updated certification is `docs/ITERATION-27-TSAGERI-ALPANA-TVISHI-CERTIFICATION.md`.
12. Final 27D verification: 688/688 tests; TypeScript, production build, standalone export, 1440px/390px Import Review QA, Source B C172/C151 trace QA, and the Iteration 26 Port38 desktop/mobile/standalone regression all pass. Browser logs are clean and the V1 manifest SHA remains unchanged. See the Iteration 27D section at the top of `docs/VALIDATION.md` for evidence files.

## Iteration 26 — accepted reference finalization decisions (implemented)

1. Sixteen first-class `intentional_termination` transitions end C181/F05–F12 and F17–F24 at SC225. They are owner confirmed, supported by the source connector ending, and explicitly not field verified.
2. The previous F06 AP-side unresolved interpretation is superseded and excluded from active topology. Final Port38 journey: Lentekhi Port38 → C184/F38 → SC224 → C181/F06 → SC225 → known termination.
3. SC225 is fully categorized: F01–F04→C183→AP54, F05–F12 terminate, F13–F16→C182→AP53, F17–F24 terminate. There are no uncategorized C181 Fibers.
4. Active topology contains 838 exact source-supported transitions plus 16 owner-confirmed terminations, 278 active Lineages and 42 historical superseded Lineages. All 1,176 Fibers retain a JourneySummary: 172 full, 976 partial, 16 termination, 12 external boundary.
5. Splice Workspace has a separate terminating state/filter, sixteen clean SC225 terminal rows and no fake target bank or outgoing line. Route/Fiber Inspectors show `SC225-ზე მთავრდება`; selected optical highlighting stops at SC225.
6. Normal company labels come from the generic assignment model; no OpenNet-only Fiber Inspector label remains. Port occupancy and availability remain separate.
7. Lentekhi remains the known `AGG-LENTEKHI`; only legacy number 6/5 is conflicting. Ambrolauri is a reviewed external-document boundary originating at SC206 with nullable next-document/route links.
8. `reference/tsageri-lentekhi-v1.manifest.json` freezes hashes for source, raw extraction, inventory, transitions, Lineages, companies, Ports, annotations, semantic summary and Golden fixtures. Two independent generation runs are byte-identical.
9. Pending manual review for the reference package is zero; field verification remains none. Actual remaining gaps are limited to the Lentekhi legacy-number conflict, facts absent from the current source, and the unimported Ambrolauri document.
10. Validation passes: 667/667 TypeScript/domain tests, 12/12 Python importer tests, TypeScript/build, standalone export, deterministic freeze, desktop QA and 390px mobile QA. Final assets are `index-6PBcXOzS.css` (112,554 bytes), `index-C8_mO1xK.js` (2,651,007 bytes) and `fiber-prototype.html` (2,764,380 bytes; SHA-256 `5d26235f477894427fa68b467745d90117357775de54d7182cd39ec621fe85c9`). Full details are in `docs/ITERATION-26-REFERENCE-DATASET-FINALIZATION.md`.

## Iteration 27 — Tsageri–Alpana–Tvishi import candidate (incomplete; do not activate)

1. The new source `Tsageri-Alpana-Tvishi.vsdx` is present in `imports/inbox/`, SHA-256 `419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d`, 1,540,620 bytes. Its original root copy was retained. Its package/generic extraction is valid; two independent raw extractions match at SHA-256 `05270a1ffc25008270dd434c1bf7f06de40161163f62656db2ecfce52a0c89ea`.
2. The VSDX inbox has `inbox`, `processing`, `processed`, `failed`, `archive`, and generated `state/jobs` areas. Scan: `py -3 scripts/import-inbox.py`; optional polling: `py -3 scripts/import-inbox.py --watch`. Both use the same SHA-first `importVisioDocument` pipeline with stability checks, ZIP/package checks, duplicate suppression, revision numbering, and a single cross-process lock. Six importer tests pass.
3. Source B generic counts: 1 page; 9,707 Shapes including grouped children; 311/311 valid Connect rows; 22 Masters; 7 Styles; 39 verbatim XML parts; no unresolved effective colors. The source-specific pass deterministically preserves 22 Cable labels, decodes 42 marker banks / 2,928 unique marker Shapes and derives 1,151 candidate connector/marker local transitions. Independent interpretation runs match at SHA-256 `01abbcdc0827d972c0cc0c2272ef934d35cf81c43e594ac6b0e3dbf6b0c62ae3`.
4. Exact direction wording `ლენტეხი-ხელედის მიმართულება` occurs at Shape40991. It is stored as a named direction annotation and does not create Fiber continuity.
5. Cross-validation finds exact SC205 and SC206 Closure identity evidence: all 196 tested SC205 pairs and 180 tested SC206 pairs reproduce V1 exactly. C149 (24F), C150 (192F), C151 (144F) and C169 (48F) physical marker construction matches V1 at every position. C169 additionally matches all 48 SC206 C150↔C169 transitions.
6. C148 is a preserved `source_conflict`: both B marker banks agree with each other; Fiber colors match all 192 positions and tested SC205 transitions reproduce V1, but Tube colors disagree for 72 positions F121–F192. No source claim is overwritten.
7. The exact direction `ლენტეხი-ხელედის მიმართულება` occurs at Shape40991. It is retained as route context and creates no optical edge. Other route, endpoint type, Port occupancy, company assignments, and annotation scope/status still need source audit.
8. No canonical merges, boundary links, combined route or FiberLineage has been activated. Whole-document certification remains withheld; the import is fail-closed at `interpreting`. This iteration is not complete yet.
9. Candidate interpretation is `migration/iteration27/source-interpretation.json`; reports are `docs/ITERATION-27-TSAGERI-ALPANA-TVISHI-CERTIFICATION.md`, `docs/ITERATION-27-ALPANA-TVISHI-ROUTE-INTERPRETATION.md`, `docs/ITERATION-27-OVERLAP-RECONCILIATION.md`, and the 48-position `docs/ITERATION-27-C169-FIBER-CROSS-VALIDATION.md`. `reference/fiber-atlas-network-v1.manifest.json` remains `CANDIDATE_NOT_ACTIVE`.
9. The V1 manifest remains byte-identical to the baseline SHA-256 `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`. The frozen reference and its golden tests were not edited.
10. Final candidate validation: 677/677 TypeScript/domain tests pass; all 6 Python inbox tests pass; TypeScript compilation passes. Vite build passes with `index-6PBcXOzS.css` (112,554 bytes) and `index-xm2pZMXk.js` (2,654,290 bytes; the existing large-chunk advisory remains). Standalone export is 2,767,663 bytes, SHA-256 `01dff2cececaa9feaa9c088541bad2dd591ff7a2dba8796f394da96454ebbc95`. Browser QA for the staged import dashboard passes at desktop 1440px, mobile 390px and standalone. Full active combined-route/Closure QA is not applicable before certification and remains withheld.

**Next work:** resolve Tsageri Aggregation/ODF geometry; keep C148’s six-range Tube-color conflict preserved while checking physical identity independently; certify AP/Port occupancy, company alignment and all annotations; audit the connector-derived transitions and SC207 boundary; then rerun full tests/build/export and browser QA. Only after certification should exact source representations be activated in a combined network. The V1 package stays frozen.

## Iteration 27B — final semantic certification decision

1. Formal state is **NOT CERTIFIED**; activation is **WITHHELD**. Generic package gate passes, but no Source B canonical asset, Route, FiberLineage, Port binding, company assignment or topology edge is active.
2. Source audit accounts for 3,569 nonempty text Shapes, 22 Cable label candidates, 42 marker-bank groups / 2,928 marker Shapes, and 1,151 local transition candidates across SC205–SC215.
3. Of the transition candidates, 376 SC205/SC206 pairs reproduce V1 and are recorded as duplicate cross-document evidence; 775 other pairs still lack semantic disposition. No active transition is added.
4. The 24 company occurrences (OpenNet 8, Magti 10, Silknet 5, Skytel 1) lack source-validated assignments. Three cut/module notes lack planned/completed status. Port/ODF inventory and bindings are not certified.
5. SC207 remains unresolved: Source B has 143 C151↔C152 candidate transitions at token 207, without validated Closure or connector semantics.
6. C148 physical identity is a strong candidate independently of the Tube attribute conflict. The 72 conflicts are preserved as six source-specific ranges: F121–132 blue/violet; F133–144 orange/rose; F145–156 green/blue; F157–168 brown/orange; F169–180 slate/green; F181–192 white/brown (V1/Source B). Frozen V1 values are unchanged.
7. C169 is a golden correspondence candidate with all 48 construction positions and SC206 transitions matching. It remains unactivated until whole-document certification. SC205/SC206 and C149/C150/C151 correspondence candidates are also recorded without canonical merges.
8. The network-level candidate manifest now contains `NOT_CERTIFIED`, the semantic gate results, overlap candidates, the structured C148 conflict and exact blockers. The frozen V1 manifest hash remains `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.
9. Deterministic semantic audit outputs were generated twice byte-identically. Full details: `docs/ITERATION-27B-SOURCE-B-SEMANTIC-RECONCILIATION.md` and `migration/iteration27/semantic-audit.json`.

## Iteration 25 — accepted source interpretation decisions (implemented)

1. `NetworkUseAssignment` is the generic company-use record under `tsageri-lentekhi-company-usage/1`. All 31 occurrences (OpenNet 12, Magti 6, Silknet 6, Skytel 7) resolve from text carried by line Shapes plus exact world endpoint/Fiber-marker alignment. Graph deduplication creates 13 logical assignments and retains all 31 Shape IDs.
2. Usage remains independent from ownership, Fiber rights, services, customers, occupancy and commercial availability. No such relationship is inferred.
3. Every C181 Fiber at SC225 is reconciled: F01–F04→C183/F01–F04, F13–F16→C182/F01–F04, F05–F12 and F17–F24 unresolved. F06 remains owner-confirmed AP-side with exact AP/Port unresolved.
4. The certified VSDX labels are Shape37907 `182-225-53-24` and Shape38438 `183-225-54-24`. Therefore C182 remains AP53 and C183 remains AP54. The opposite expected identities in the Iteration 25 brief are recorded as a source conflict and not projected.
5. Twelve C182↔C183 relationships remain because the source contains actual connector Shapes with exact world geometry. Shared closure presence alone is never used as connectivity.
6. AP53/AP54 retain 24 source-aligned bindings each. Lentekhi remains neutral `AGG-LENTEKHI`; aggregation occupancy remains unknown without a distinct filled Port graphic. Unused remains distinct from available.
7. Splice Workspace shows all four company names, compact usage badges and an independent company filter that combines with search, Tube/group, change and unresolved filters. Existing Fiber and Port cross-navigation uses the same derived assignment evidence.
8. Six deterministic artifacts are generated twice byte-identically under `migration/iteration25/run-a` and `run-b`, with active copies in `src/data`. Reports are `docs/ITERATION-25-EXHAUSTIVE-SOURCE-INTERPRETATION.md`, `ITERATION-25-COMPANY-USAGE-AUDIT.md`, and `ITERATION-25-PORT-INTERPRETATION-AUDIT.md`.
9. Validation passes: 647/647 TypeScript/domain tests, 12/12 Python importer tests, TypeScript compilation, production build, standalone export, source matrix, three SC225 flows, four company filters, three Port views, print, three 390px flows and standalone browser QA with zero warnings/errors. Final assets are `index-DtepX95Z.css` (112,288 bytes), `index-C6mlRJt3.js` (2,655,098 bytes) and `fiber-prototype.html` (2,768,205 bytes; SHA-256 `d0894db4fda6eefdfc8b9070f29f68ff2aee800b0514ebc57b9ac7eba57d3b2a`).

Iteration 24 remains the certified importer foundation; no extractor/resolver change was required.

## Iteration 24 — accepted importer certification decisions (implemented)

1. **CERTIFIED FOR NEXT INTERPRETATION ITERATION.** All 15 certification gates pass and Critical importer limitations equal zero. The immutable active source remains `C:\Users\Beka\Desktop\Visio Alt\Tsageri-Lentekhi 2025.vsdx`, 1,223,326 bytes, SHA-256 `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`.
2. The importer is explicitly layered: domain-neutral package reader; render/geometry/style resolver; Tsageri–Lentekhi source grammar; Fiber Atlas projection; UI. Owner confirmations remain separate and are applied only after source interpretation.
3. `scripts/extract-vsdx.py` now emits raw format v3 with exact whitespace-preserving text, all raw Cells/formulas/Sections, root/group ancestry, page dimensions, local-to-world matrices, world pins/bounds/corners/angles, transformed Geometry-row points, master-merged Geometry, effective-style provenance, theme-part inventory, Connect integrity, versions and a source/version cache key.
4. Two independent extractions are byte-identical at gzip SHA-256 `e14e79f5930a1b063db11e4db53d2ac47925fb49ffc3a915449468a54cfb066f`. Counts remain 1 page, 41 package parts, 40 verbatim XML parts, 7,349 Shapes, 2,640 top-level Shapes, 4,709 grouped children, 2,676 direct-text Shapes, 218 Property-bearing Shapes, 203/203 valid Connect rows, 22 Masters, 7 StyleSheets and one comment.
5. Fresh semantics reproduce 20 Cable labels, 39 marker banks, 2,208 marker representations, 1,176 logical Fibers, 98 Tubes, 838 exact node-local transitions, 192 defensible Port bindings and 384 Port evidence records. The old/new transition diff is 838 reproduced, zero missing and zero new. Equality is observed, not protected.
6. Raw render anchors pass: AP41 Port1 Shape12484 is green `#92d050`; Port4 Shape12487 is white `#ffffff`; Shape34674 has inner Fiber fill `#808080` and Tube ring `#008000`; Shape12428 proves master-Shape fill inheritance. All effective color cells in this file resolve.
7. The importer inventories all 31 company-label occurrences: 12 OpenNet, 6 Magti, 6 Silknet and 7 Skytel, including Georgian and English labels. Each retains exact text, group ancestry, rotation, world bounds and bounded neighboring evidence. No new company/Fiber assignment is created.
8. Text reconciliation remains exact: 2,677 direct-text/comment occurrences = 61 structural + 58 meaningful annotation + 2,558 numeric/layout, with zero unexplained meaningful text. All Property rows and the one Georgian comment remain lossless.
9. The prior active Iteration 23 projection and reports are archived in `migration/archive/iteration23/`. The new candidate was certified and diffed before imports were switched to `src/data/iteration24-*`; active topology behavior and the accepted product UX remain intact.
10. Visio Import now provides an engineering-only certification dashboard and Shape ID Source Evidence Inspector. It shows raw text, parent/root/group path, master references, Cells/formulas, Property rows, world geometry and effective-style provenance. Splice Workspace links its source Shapes via `წყაროს მტკიცებულება`. Manager View is unchanged.
11. Reports are `docs/ITERATION-24-VSDX-IMPORTER-CERTIFICATION.md` and `docs/ITERATION-24-SOURCE-EVIDENCE-RECONCILIATION.md`. Versioned evidence is under `migration/iteration24/`; the cache key binds source SHA and all four resolver/interpreter versions.
12. Non-critical limits: future-file theme formulas outside the current resolved set need re-audit; NURBS/elliptical-arc raw cells and endpoints are preserved but complete curve tessellation is deferred; no bundled pixel-perfect Visio renderer exists. None affects current certified topology evidence.
13. Final validation passes: 12/12 dedicated Python importer tests, 616/616 TypeScript/domain tests, TypeScript compilation, production build, standalone export and browser QA. Browser QA covers two importer evidence anchors, 11 desktop connection sheets, six branch-node reconciliation views, print, photo, five 390px cases including the importer, and standalone loading with zero warnings/errors. Final assets are `index-CXzBjj_O.css` (112,175 bytes), `index-DhmDzQ-W.js` (2,635,728 bytes) and `fiber-prototype.html` (2,748,722 bytes; SHA-256 `9ae391d7bb5e9699bb1542392b13c6063d4fc3a2c13bb2fd39e445b2c84ff519`).

Iteration 23 below is the archived baseline. Its v2 extraction is no longer the active source projection.

## Iteration 23 — accepted source-fidelity decisions (implemented)

1. The active immutable source is `C:\Users\Beka\Desktop\Visio Alt\Tsageri-Lentekhi 2025.vsdx`: 1,223,326 bytes, modified 2026-05-20 19:04:21 Asia/Tbilisi, SHA-256 `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`.
2. Iteration 22 generated evidence and documentation are preserved under `migration/archive/iteration22/` with a hash manifest. The clean interpreter reads only `migration/iteration23/tsageri-lentekhi.fresh.raw.json.gz`; it opens the archive only in a later isolated diff phase.
3. `scripts/extract-vsdx.py` is now raw format v2. It preserves all 40 XML/relationship parts verbatim and extracts page/master trees, 7 style sheets, 22 masters, local cells and formulas, Shape Data, comments, Connect rows, relationships, effective styles and page-space geometry. Nested transforms use Pin/LocPin/Angle/flip affine matrices. Two extractions generated identical gzip bytes.
4. Fresh extraction counts are 1 page, 2,640 top-level shapes, 7,349 shapes including subshapes, 2,676 direct text shapes, 218 Property-bearing shapes, 203 Connect rows and 1 comment. These structural counts match the historical extraction; v2 adds lossless XML, effective style and transformed geometry.
5. Fresh cable labels rediscover 20 Cable Segments and 39 marker banks. Marker identity comes from explicit labels and page-space x alignment, never XML enumeration order. `iteration23-physical-construction.json` now regenerates all 1,176 Fiber colors and 98 Tube groups from the current raw artifact under `tsageri-lentekhi-marker-colors/3`; every paired bank agrees. The ring/inner-fill meaning remains in the separate owner-confirmation layer.
6. The fresh source pass independently regenerates 838 exact two-sided NodeFiberTransitions. The isolated old/new diff reports 838 reproduced exactly, 0 changed, 0 missing and 0 new. This equality is an observed result, not a protected count.
7. Owner-confirmed facts live separately in `src/data/iteration23-owner-confirmations.json`. Golden raw transitions remain C172/F29↔C173/F01, C176/F32↔C175/F24 and C184/F38↔C181/F06. The SC225 AP-side unresolved continuation remains an owner overlay and still does not choose AP53 or AP54.
8. Active PortTopologyBinding count is now 192: 144 AP Port↔Fiber alignments and 48 Lentekhi termination-bank alignments. The old 192 Tsageri same-index Port bindings are deactivated because the mirrored source positions do not prove individual Port-to-Fiber termination. The 192 logical Tsageri ports remain, with both source representations and range semantics preserved.
9. Port occupancy is derived only from the effective fill of an actual Port-number graphic: 14 occupied/in use, 127 unused and 243 unknown across 384 logical AP/ODF Ports. AP41=3/21, AP50=2/22, AP51=1/23, AP52=0/24, AP53=4/20 and AP54=4/17/3 occupied/unused/unknown. Tsageri 192 and Lentekhi 48 remain unknown because no separate filled Port graphic is established. Unused never becomes available.
10. The active engineering projection now has 32 sheets and 1,038 rows: 838 exact Fiber transitions, one owner-confirmed unresolved transition, seven additional C181 unresolved positions, and 192 defensible Port bindings. The removed AGG5 sheet is an intentional source-fidelity correction from Iteration 22's 33 sheets / 1,230 rows.
11. Splice Workspace retains the accepted layout and adds `ყველა შეერთება`, a per-node completeness table, filters for number/Tube/Fiber-color changes, unresolved rows and all non-straight mappings, visible evidence-basis badges, full Port status text, and printable generation date/source SHA.
12. Document Overview now shows the active filename, import date and source SHA prefix. Cable, Closure, AP, Aggregation, ODF and SourceAnnotation evidence is revalidated against this revision; 2,677 text/comment occurrences are fully classified. The three Iteration 23 audit reports and deterministic JSON outputs answer which XML shapes, geometry and style support every displayed mapping/status.
13. Remaining source limitations are explicit: Tsageri per-Port Fiber binding, aggregation Port occupancy, AP-internal ingress/return pairing, physical splice mechanism/tray/patching, and C181/F05–F12 AP53/AP54 selection are unresolved.
14. Final validation passes: 608/608 tests, TypeScript, production build, standalone export, two byte-identical raw extraction runs, two byte-identical eleven-artifact interpretation/annotation/report runs, 11 desktop sheet cases, all six branch-node reconciliation views, print, Closure photo, four 390px cases and direct standalone loading. Browser QA records zero warnings/errors. Final assets are `index-C92ZDCHR.css` (111,344 bytes), `index-B39DxgSl.js` (2,404,907 bytes) and `fiber-prototype.html` (2,517,070 bytes; SHA-256 `6722cbef9adda57f390a7ff80e649d5c801d978839288bebd983de6bc45f8785`).

Iteration 22 counts and AGG5 Port bindings below are historical baseline statements and no longer describe the active projection.

## Iteration 22 — accepted product decisions (implemented)

1. `ConnectionSheet`, `ConnectionSheetBank`, `ConnectionSheetRow` and `ConnectionBankRow` form the read-only engineering projection. They are derived from active `NodeFiberTransition` and reviewed `PortTopologyBinding` records; they do not create new continuity.
2. There are 33 relationship sheets and 1,230 visible rows. All 838 active two-sided NodeFiberTransitions appear exactly once. The one owner-confirmed unresolved SC225 transition remains visible, and the C181/F05–F12 unresolved block is shown without choosing AP53 or AP54.
3. Closure sheets group only source-supported Segment pairs. Multi-cable nodes use a relationship selector; every line is one local transition, and line style represents exact/unresolved/selected state rather than physical Fiber color.
4. ODF and AP sheets use PortTopologyBinding: AGG5↔C148, Lentekhi↔C184, AP41↔C149, AP50↔C170, AP51↔C173, AP52↔C175, AP53↔C182 and AP54↔C183.
5. Headers preserve endpoint name, Legacy C-number and exact Visio source label. Rows preserve each side's local Tube/Fiber colors and show number, Tube and Fiber-color changes explicitly.
6. The worksheet supports 12-position Tube/group filters, quick Fiber/Port search, selected-row detail, corrected full-journey navigation and print/PDF output. A 192F sheet defaults to one focused group.
7. Route Fiber transitions expose `შეერთების ნახვა`; Segment, Closure, Aggregation, AP and Port Inspectors expose `შეერთებების სქემა`. Closure Inspector keeps incoming/main/branch context concise and moves engineering detail to the sheet.
8. Port status is independent across `in_use`, `unused`, `reserved`, `unavailable` and `unknown`. `unused` is never converted to `available`. Organization text says “uses” and is shown only through exact FiberUseAssignment lineage evidence. OpenNet is the only current exact use projection; Magti, Silknet and Skytel remain annotation-only.
9. `ClosurePhoto` supports multiple images, preview and one primary image. Prototype uploads use browser session storage and carry an explicit not-persisted warning; they do not alter canonical inventory.
10. Golden worksheet anchors pass: SC218 C172/F29→C173/F01; SC219 C176/F32→C175/F24 with no AP51; Lentekhi Port38→C184/F38→SC224→C181/F06→SC225; AP51 Port3→C173/F03; AGG5 Port175→C148/F175.
11. `docs/ITERATION-22-SPLICE-WORKSPACE-REVIEW.md` contains all node/relationship counts, mapping examples, change counts, status rules and remaining gaps. `scripts/generate-iteration22-report.ts` regenerates it deterministically.
12. Final validation: 576 tests, TypeScript/build, standalone export, deterministic report generation, desktop, print and 390px mobile QA.

## Iteration 21 — accepted product decisions (implemented)

1. `NodeFiberTransition` is the first-class local optical edge. It identifies one node, both local Segment/Fiber identities when known, local Tube/Fiber colors, source geometry, interpretation basis, projection status and optional unresolved AP-side continuation.
2. Fiber Lineage traverses `Segment Fiber endpoint → NodeFiberTransition → next Segment Fiber`. Ordered Cable Route adjacency, equal Fiber number, Tube, color, capacity or main-route membership never creates an optical edge.
3. The deterministic source audit produces 838 exact two-sided transitions from Visio connector/marker geometry plus one owner-confirmed unresolved AP-side transition at SC225. Active multi-leg Lineages cannot contain a hop without one of these local edges.
4. The previous 68 Lineages are historical prototype interpretations. Twenty-six are reproduced exactly; forty-two are stored as superseded provenance. They resolve into 84 corrected active components, alongside 168 newly discovered components, for 278 active Lineages total. No target count is protected.
5. Golden fixture `GOLDEN-SC219-F32-AP52-LENTEKHI` resolves C176/F32 (black) at SC219 to C175/F24 and AP52/Port24. Its other endpoint is Lentekhi/Port32 through C184/C180/C179/C178/C177/C176. SC218, C174, C173 and AP51 are absent.
6. Golden fixture `GOLDEN-LENTEKHI-P38-SC225-AP` resolves Lentekhi Port38/C184/F38 at SC224 to C181/F06 and SC225. The source cannot distinguish AP53 from AP54 for C181/F06, so the active journey stops at the AP-side boundary. SC223 and AP51 are absent.
7. C184/F37 independently follows C184/F37 → C181/F05 and stops at the same unresolved SC225 AP-side boundary. The decoder does not special-case only the owner anchor.
8. Source-specific routing matrices exist for SC205, SC206, SC216, SC218, SC219, SC224 and SC225. Range summaries are compressed views of individual exact edges, never global formulas.
9. AP branch invariants are enforced: AP51 requires C173, AP52 requires C175, AP53 requires C182, AP54 requires C183, and a root-route path entering SC225 requires C181. Skipped nodes, identity mismatches, route-only hops and stale superseded edges fail validation.
10. AP50 and AP52 now have 24 exact endpoint Lineages each. AP53 and AP54 each participate in 16 source-supported endpoint components. C181/F05–F12 remain unresolved at SC225; no AP53/AP54 choice is guessed.
11. All 1,176 FiberJourneySummary records are recomputed after active Lineages, PortTopologyBinding and local Segment context. Current coverage is 584 full-lineage participants, 576 partial, 4 intentional stops and 12 external boundaries.
12. Route Workspace keeps the physical route neutral and highlights only the selected Fiber's actual active legs, including AP52 departure at SC219 and the nested C181 route at SC224. Fiber Inspector uses endpoint-based labels, lists every node-local transition, links endpoint Ports bidirectionally and provides a collapsed old-versus-corrected engineering comparison.
13. Full algorithm, routing matrices, all 68 old-record decisions, AP coverage and gaps are in `docs/ITERATION-21-BRANCH-FIBER-ROUTING-REVIEW.md`. Evidence is generated by `scripts/interpret-iteration21-routing.py` into `src/data/iteration21-routing-evidence.json`.
14. The old Iteration 20 statement that existing 68 Lineages take priority is removed from current behavior. A stale or superseded Lineage cannot override the node-transition graph.
15. Final validation: 551/551 tests, TypeScript, full inventory validation, deterministic source regeneration, production build and standalone export pass. Desktop Manager flows, 390px mobile flows and direct-file standalone QA pass with no horizontal overflow or browser warnings/errors.

## Iteration 20 — accepted product decisions (implemented)

1. `getSegmentDisplayName(segment)` is the single primary Cable Segment naming rule: endpoint A ↔ endpoint B · capacity. Documentation boundaries are explicit, for example `SC206 ↔ SC207 boundary · 144F`.
2. Immutable `CAB-…` identities and legacy C-numbers are unchanged. `C172` and other legacy values remain search aliases, technical metadata and deep-link compatible; search shows the endpoint name first and `Legacy C172` second.
3. `PortTopologyBinding` connects a logical ODF/AP Port to one local Segment/Fiber, Tube/Fiber colors, role, route context, orientation, lineage links and source evidence. It never implies splice, patch, jumper, service or availability.
4. There are 384 Port bindings: 192 Tsageri ODF, 144 existing AP Port Flow projections, and 48 Lentekhi ODF positions.
5. Tsageri Port1–192 maps to the ordered C148/F1–192 bank. The rule is supported by mirrored geometry and owner anchors Port145/F145 and Port175/F175. Range destination remains a separate fact.
6. Tsageri ranges remain unchanged: 1–116 Ambrolauri, 117–130 intentional SC205 stop, 131–144 AP41 direction, 145–192 Lentekhi route. No same-number mapping is inferred beyond the locally aligned C148 bank.
7. Lentekhi `ODF-LENTEKHI-01` has 48 ordered positions mapped to C184/F1–48. This source interpretation does not choose between conflicting numeric legacy claims 6 and 5.
8. `FiberJourneySummary` gives all 1,176 inventory Fibers a maximum-known result. In Iteration 20 the existing 68 Lineages had priority; Iteration 21 explicitly supersedes that rule with corrected active Lineage → NodeFiberTransition → PortTopologyBinding → local Segment context.
9. C148/F23 is the partial-journey Golden Case: AGG5/Port23, `AGG5 ↔ SC205 · 192F`, Tube2 Orange, F23 Rose/Pink, destination SC205, then exact mapping unknown.
10. AGG5 Port175 and AP51 Port3 both open the existing `LINEAGE-AP51-NORTH-03`; AP51 Port3 keeps C173/F03, Blue Tube, Green Fiber, in-use state and OTDR.
11. AP41 Port18 opens its C149/F18 partial journey and states that the internal/outgoing exact Fiber edge is unknown. Lentekhi Port/Fiber selections are bidirectional with C184.
12. Normal Route Workspace, Segment/Tube/Fiber/Port Inspectors, branch cards, inventory and search now lead with endpoint-based Segment names. C-numbers remain visible only as secondary legacy context or technical provenance.
13. Evidence, all 20 names, Port coverage and remaining gaps are in `docs/ITERATION-20-PORT-FIBER-TOPOLOGY-REVIEW.md`.
14. Final validation: 519/519 tests, TypeScript and production build pass; standalone export is 1,578,556 bytes; six focused desktop Manager/simple-view flows, 390px bottom-sheet mobile and standalone checks pass with no overflow or browser warnings/errors.
15. The next product step is persisted operational editing around these stable identities and review rules; do not expand topology from a second Visio until its own evidence package is imported and reconciled.

## Iteration 19 — accepted product decisions (implemented)

1. `APPortFlow` is first-class and uses `tsageri-lentekhi-ap-port-flow/1`. It records 24 Ports for each of AP41, AP50, AP51, AP52, AP53 and AP54: 144 records total.
2. Network role, physical usage, administrative allocation and commercial availability are independent. `unused` never means free or available.
3. AP41 is the AP Port Flow Golden Case. Ports1–16 ingress, Ports16–22 return to the main direction and Ports23–24 end locally. Port16 remains in both source groups and displays as transit without losing either role.
4. The older AP41 Ports3–22 Ambrolauri backfeed statement remains technical provenance. The latest range explanation drives the normal Inspector.
5. All APs independently match a 24-position cable marker bank to their numbered Port layout. This supports same-index arriving Segment/Fiber context. It does not establish an internal splice, patch, jumper or outgoing Fiber mapping.
6. AP51's existing Port mapping, Port3 in-use state, other white-port unused state, OTDR note and 24 Fiber Lineage links remain intact. Its visual usage rule is not applied to other APs.
7. The marker decoder is now `tsageri-lentekhi-marker-colors/2`. Across all 20 Cable Segments it decodes 1,176 Fiber fills and 98 Tube groups from the repeated circular marker grammar. Connector/cable line style is excluded.
8. Every Cable Segment now has documented Tube records and physical Tube/Fiber colors in the prototype. Local Fiber Lineage legs use those Segment-local identities. No `G1/G2` identifiers appear in the normal workspace.
9. Lentekhi is the neutral entity `AGG-LENTEKHI`, displayed as `ლენტეხის აგრეგაცია`. Destination is known; numeric legacy identifier is conflicting. Heading `6` and property `5` remain claims, with no numeric winner.
10. The main route now ends at the known Lentekhi aggregation through canonical C184. Eligible Fiber Lineages reach the same entity; the established count remains 68.
11. All AP Inspectors lead with origin, direction groups and a responsive 24-Port grid. Port cells show role text, local Fiber identity and physical swatch; use status is visually separate. Branch previews include AP name, capacity and range/role summary.
12. Evidence and withheld interpretations are in `docs/ITERATION-19-AP-PORT-FLOW-REVIEW.md` and `docs/ITERATION-19-PHYSICAL-COLOR-COVERAGE.md`. Deterministic color evidence is regenerated by `scripts/interpret-iteration19-evidence.py`.
13. Final validation: 489/489 tests, TypeScript and production build pass; standalone export is 1,567,332 bytes; eleven desktop flows, 390px AP grid and standalone Lentekhi checks pass with no overflow or browser warnings/errors.

## Iteration 18 — accepted product decisions (implemented)

1. The normal Inspector answers the operational question first: what the selected object is, where it comes from/goes, and what the user can open next. Engineering fields remain available through `დამატებითი ინფორმაცია` and `წყარო და ტექნიკური დეტალები`.
2. Proposed construction never presents internal group identifiers as Tube identities. Unknown groups read as `ჟილები F01–F12` / `ტუბის ფერი/ნომერი დაუდგენელია`; route ribbons show only fiber capacity and unknown Tube state until physical construction is established.
3. Cable Segment primary detail now leads with upstream context, the local node-to-node segment, split Fiber destinations and clickable construction rows. Source labels, route position, mapping counts and PhysicalCable IDs are collapsed.
4. Closure primary detail now leads with incoming Segment, main continuation, branch and compact Fiber-range transitions. Hardware, coordinates, counts, connection rows and provenance are collapsed; empty branch/remap sections are omitted.
5. Confirmed Tube detail leads with Tube number/color/range, destination splits and clickable Fibers. Unknown construction is described as a Fiber group without inventing Tube number or color.
6. Fiber detail uses `საიდან მოდის`, `აქ`, `სად მიდის` and `სრული გზა`. Consecutive unchanged legs are grouped, and number/Tube/color changes stand out at the exact Closure.
7. AP51 and AGG5 now expose compact port workflows. Port selection gives the exact Fiber relationship first and keeps administrative/commercial/source fields collapsed. AP51 Port3 remains in use and retains the OTDR note.
8. One global notice states that the prototype is interpreted from real Visio. The same disclaimer is no longer repeated on every Fiber.
9. The simpler Manager presentation is the default visual standard. Both modes use the same network data and primary Inspector content; the mode only reduces evidence/review controls.
10. The domain model and all 68 Fiber Lineages remain unchanged. AP51 mappings, OpenNet use, OTDR, physical colors, CableContinuation, provenance and verification structures are preserved.
11. Full UX results are recorded in `docs/ITERATION-18-UX-SIMPLIFICATION-REVIEW.md`; browser evidence is in `docs/iteration18-browser-qa.json` plus the desktop/mobile screenshots.
12. Final validation: 451/451 tests, TypeScript and production build pass; standalone export regenerated; seven desktop flows plus 390px mobile and standalone checks pass with no horizontal overflow or browser warnings/errors.

## Iteration 17 — accepted product decisions (implemented)

1. Fiber Lineage is the ordered multi-Segment journey of one logical strand. It is distinct from Cable Segment, PhysicalCable, CableContinuation and Fiber Trace.
2. Prototype projection uses `owner_confirmed`, `source_interpreted` and `source_ambiguous`. Normal prototype topology uses the first two. None means field verified or production approved.
3. The decoder is versioned `tsageri-lentekhi-fiber-lineage/1`; every leg and transition retains source file/page/shapes, rule and interpretation basis.
4. Sixty-eight lineages are projected: 28 AGG5-to-Lentekhi, 12 AGG5-to-AP51, 12 Lentekhi-to-AP51 and 16 partial lineages ending unresolved at SC218.
5. C172/F01 runs from AGG5/Port145 through aggregation-side F145 to local F01 and reaches Lentekhi Port/Fiber1. C172/F31 runs from AGG5/Port175 through F175/F31 to C173/F03 and AP51/Port3.
6. Local Fiber number, Tube number/color and Fiber color belong to each leg. No global Fiber or Tube identity is invented.
7. AP51 uses a source-specific 1:1 C173/F01–F24 to Port1–24 prototype mapping. Port3 is in use; white ports are unused. Administrative allocation and commercial availability remain separate and unknown.
8. The C173/F03 OTDR label is a source annotation only. It creates no distance, health or continuity value.
9. OpenNet labels on four aligned source lines create a usage-only assignment for core lineages 1–4. They create no ownership, rights, provider, customer or availability claim.
10. Manager View shows the natural projected network and hides engineering/candidate clutter while preserving genuine unresolved items and the Lentekhi conflict.
11. C170, C175, C181, C182 and C183 were attempted but remain without exact Fiber Lineage because the source does not support a single defensible mapping. AP51 visual rules were not generalized to other APs.
12. Full details and coverage are in `docs/ITERATION-17-FIBER-LINEAGE-REVIEW.md`; deterministic evidence is in `src/data/fiber-lineage-evidence.json` and is regenerated by `scripts/interpret-fiber-lineage.mjs`.
13. Final validation: 436/436 tests, TypeScript and production build pass; standalone export regenerated; eight desktop cases plus 390px mobile and standalone browser checks pass with no horizontal overflow or browser warnings/errors.

## 1. Project objective
Build a functional Georgian local web prototype that lets ordinary employees and engineers understand and eventually operate the fiber network without Visio. Fiber Atlas is intended to become the full operational fiber-infrastructure system, not only a Visio replacement. Test the information architecture and durable identity boundaries before production investment.

## 2. Current product direction
The dashboard leads with one complete reviewed Source Network Document package and links to its Document Overview. The Route Workspace is the primary operating surface and should feel like a simple interactive network map. Every source Segment uses endpoint-based naming, shows decoded Tube ribbons and can expand to Tube/Fiber selection. The Inspector leads with short Georgian operational answers and hides model/provenance fields behind consistent disclosures. Every Fiber opens a maximum-known journey; active node-transition Lineages overlay only that Fiber's actual branch and show local identity changes at the exact Closure. The neutral rail remains the physical Cable Route even where the selected Fiber leaves it. All six APs, AGG5 and Lentekhi use compact port workflows. Port and Fiber selections cross-link through `PortTopologyBinding`. Manager View is the default visual standard and preserves uncertainty. Desktop keeps independent route/Inspector scrolling; at 390px selected detail becomes a bottom sheet. URL-backed selection and Back/Forward remain intact. Visio Import remains the detailed assertion-review workspace. This is still a local static prototype with no production database, authentication, hosting, persisted editing or external integrations.

## 3. Domain terminology
Cable Route = კაბელის მარშრუტი; Cable Segment = კაბელის მონაკვეთი; Cable Continuity = evidence-backed Fiber-bundle continuation at one node; Node Fiber Transition = one source-supported local optical continuation for one Fiber at one node; Fiber Lineage = one logical strand's graph-traversed multi-Segment journey with each local physical identity preserved; Fiber Journey Summary = the maximum known answer for one local Fiber, including an explicit evidence stop; Port Topology Binding = one logical Port's reviewed local Segment/Fiber association; AP Port Flow = one AP Port's incoming/outgoing physical context and independent role/use/allocation/availability dimensions; fiber strand = ჟილა; closure = ქურო; AP = დაშვების წერტილი (legacy symbol is ODF); ODF = ოპტიკური გამანაწილებელი; aggregation = აგრეგაციის წერტილი; splice = გადაბმა; uncut continuity = უწყვეტი ჟილა. **Source Network Document is one immutable imported source file/revision and its reviewed pages; it is not the identity of a Cable, Closure, AP or Route. Cable Route is the full ordered physical network path and display context; it never creates an optical Fiber edge. Cable Segment is one node-to-node portion and its primary display name is endpoint-based. Cable Continuity relates Fiber ranges across one node without asserting a common sheath. NodeFiberTransition is the only way an active Lineage moves between local Segment/Fiber identities. Fiber Lineage answers the evidence-backed multi-Segment journey while keeping every local number, Tube and color. Fiber Journey Summary may stop locally and never creates a missing optical edge. Fiber Trace remains the optical graph traversal. PhysicalCable/CableRun remains a separate evidence-based asset identity. External Documentation Boundary represents a source continuation whose next document, linked route or canonical asset may remain null until evidence exists. A known entity with conflicting legacy properties remains a known entity.** Upstream/downstream is derived from the active Cable Route and never rewrites Segment endpoint A/B. Evidence Basis says how a claim is known; Review State says what a human did; Operational Status says whether normal topology may use it. Prototype projection status is separate from all three and never means field verified. Cable owner, fiber-use organization, fiber-rights holder, service provider and customer remain independent roles.

## 4. Existing Visio context
Original historical copy: `/Users/khkh/Downloads/Tsageri-Lentekhi 2025.vsdx`. Historical source SHA-256 `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa` and extracted evidence are preserved in `src/data/source-evidence.json`. The Iteration 09 reviewed package SHA-256 is `51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a`; its lossless raw extraction is `migration/tsageri-lentekhi-iteration09.raw.json.gz`. The revisions are structurally equivalent for topology/text except formula-serialization whitespace, and that reviewed package adds one Visio comment. Page ცაგერი-ლენტეხი (ID 4). Source-wide counts: 20 cable-segment labels, 12 closure property records, 6 AP/ODF records, 2 aggregation symbols. Counts are documentation candidates, not a verified inventory. `172-217-218-48` means segment 172, closure 217 to closure 218, 48 fibers. `170-216-50-24` means segment 170, closure 216 to AP50, 24 fibers; user confirmed 24 (earlier 25 was a typo). Yellow = aggregation; violet = AP; line colors reused across directions. Loop is obsolete/disabled by owner; do not invent live loop connectivity. Module notes came from the previous engineer; physical cutting/uncut state remains unverified. Native Visio rendering/field verification was not performed; XML, package comments and approximate geometry were reviewed.

The owner confirmed C172's 12-fibers-per-Tube construction and marker meaning. Iteration 19 verified the same circular marker grammar across all 20 labeled Segment banks: inner fill is individual Fiber color and the surrounding ring is Tube color. The normalized Fiber sequence is Blue, Orange, Green, Brown, Slate/Grey, White, Red, Black, Yellow, Violet, Rose/Pink, Aqua/Turquoise. Raw style values, peer-ring reconciliation and shape IDs remain evidence. Connector/line color is separate and never supplies physical identity or connectivity. Iteration 19 used decoder v2; the active clean-source projection revalidates it as `tsageri-lentekhi-marker-colors/3` using effective styles from the current VSDX. Unsupported values or different structures remain unresolved.

Closure 218 candidate groups: C172/F01–28 ↔ C174/F01–28; C172/F29–40 ↔ C173/F01–12; C174/F29–40 ↔ C173/F13–24. Of 52 source relationships, only shape33098 is evidence-reviewed and accepted as C172/F29 ↔ C173/F01; the other51 remain candidates. There are104 distinct cable-side positions and16 unmatched positions on C172/C174 F41–48. Unknown positions are not confirmed spare. Straight lines do not establish splice versus uncut continuity.

Iteration07 reviewed the single target path. SC217 shape34089 accepts optical connectivity C171/F29 ↔ C172/F29. SC218 shape33098 accepts optical connectivity C172/F29 ↔ C173/F01 even though the endpoint numbers and physical colors differ. AP51 shapes34279 and34267 accept connectivity from C173/F01 to the AP51 asset. Port1 remains a candidate because AP/ODF containment and exact port identity are unresolved. All three relationship operation mechanisms remain unknown: no splice, connector, or uncut-continuity claim was added. Strict trace reaches AP51 and stops with port unknown; candidate trace additionally shows Port1. C171 physical construction remains unknown. C173 Tube1/F01–F12 is accepted from matching endpoint marker rows at SC218 and AP51; Tube2/F13–F24 remains provisional.

Source issues: Lentekhi heading aggregation 6 versus property 5; note describing unknown-location F5→F9 mismatch; 144 legacy “free” property assertions may be defaults; unlabelled decimal coordinate pairs for 221/222; closure 207 exists only as a boundary reference on this page. No company annotation is proof of ownership, rights, provider, or customer association.

Iteration09 expands `ROUTE-TSAGERI-LENTEKHI-CORE` to the reviewed order AGG5 → C148 → SC205 → C150 → SC206 → C169 → SC216 → C171 → SC217 → C172 → SC218 → C174 → SC219 → C176 → SC220 → C177 → SC221 → C178 → SC222 → C179 → SC223 → C180 → SC224 → unresolved C184/Lentekhi boundary. SC205 and SC220–SC224 are first-class closure records. C184 remains an unresolved route leg because its aggregation endpoint conflicts; no fake segment was created. C170 branches from SC216 to AP50; C173 branches from SC218 to AP51. The exact source text `Alpana-Tvishi-Ambrolauri directiion` is a named direction from SC206 with no inferred segment or optical connection. Every closure treatment remains `unknown`; no cable cut, mid-span access, pass-through or termination was inferred. The route and every association retain source file/hash, page, labels, shape IDs, rule, review state and warnings in `src/data/primary-route-evidence.json`. `physicalCableId` remains null.

Iteration09 classifies every one of 2,676 direct-text shapes and the one Visio comment. Twenty-six first-class Source Annotation records cover 58 meaningful occurrences; 61 occurrences remain typed source text and 2,558 numeric layout occurrences remain in the immutable raw extraction. The comment `დამატებულია ქუროები` is stored once with group/range scope for SC220–SC223. Four module-cut instructions, the fiber-mismatch note, place labels, company labels and free/Loop/OTDR text remain preserved with their actual association certainty. See `docs/ITERATION-09-SOURCE-REVIEW.md`.

Iteration10 accepts these concepts and constraints:

1. Aggregation may contain independent ODF inventory.
2. In the Tsageri source convention, internal ODF port markers and lower-boundary markers are mirrored source representations of the same logical ports.
3. Import deduplicates those mirrored representations; each logical port keeps both provenance references.
4. Cable labels may be outside the yellow aggregation container and require contextual review rather than proximity-only approval.
5. `ODF-TSAGERI-01` has reviewed logical numbering 1–192 with no fabricated panel/module hierarchy.
6. Ports 1–116 are assigned to Ambrolauri direction.
7. Ports 117–130 intentionally stop at SC205; this is not automatically a damage state.
8. Ports 131–144 feed AP Chkhuteli / AP41.
9. Ports 145–192 continue toward Lentekhi on the reviewed Cable Route.
10. AP Chkhuteli ports 3–22 return/backfeed toward Ambrolauri.
11. AP is not necessarily a terminal/leaf asset; AP41 is a mixed interconnect/transit point.
12. Exact AP ingress-port and internal 131–144 ↔ 3–22 mapping remains unresolved; no splice or one-to-one continuity is invented.
13. Cable Route, PhysicalCable/CableRun, Cable Segment and Fiber Trace have independent extents.
14. A selected Cable Segment may be an interior or terminal segment of a longer PhysicalCable.
15. The first reviewed PhysicalCable contains C172 as an accepted terminal segment, extends upstream beyond SC217 with its exact origin unresolved, and ends at SC218 while the Cable Route continues on another physical cable.
16. Route continuation, adjacency and equal fiber count never prove physical-sheath continuation. C171 remains only a candidate membership.
17. Port direction/physical connectivity does not imply service, customer, administrative allocation, fiber rights or availability.

The source-specific evidence and withheld interpretations are in `docs/ITERATION-10-SOURCE-REVIEW.md` and `src/data/tsageri-aggregation-evidence.json`.

## 5. Current page scope
The complete reviewed `ცაგერი-ლენტეხი` page is the static migration boundary and one first-class Source Network Document package: `DOC-TSAGERI-LENTEKHI-2025`, source file `Tsageri-Lentekhi 2025.vsdx`, page `ცაგერი-ლენტეხი`. Inventory contains all 20 source Cable Segment labels and 1,176 logical fibers with decoded physical colors, 98 documented Tube groups, all 12 closure property records, all 6 AP/ODF-like records with 144 AP Port Flow records, two aggregation entities, one reviewed Tsageri ODF with 192 deduplicated logical ports, four owner-confirmed port ranges, two Cable Routes, one explicit external documentation boundary, one PhysicalCable example, seven legacy CableContinuation records, 839 NodeFiberTransition records, 278 active Fiber Lineages and 42 superseded prior Lineages. SC207 is a legitimate unresolved-document continuation toward Alpana–Tvishi–Ambrolauri; its next-document, linked-route and canonical-asset fields remain null. Lentekhi is the known neutral `AGG-LENTEKHI` endpoint; heading `6` and property `5` remain conflicting numeric claims. The primary reviewed optical path C171/F29 → C172/F29 → C173/F01 → AP51 remains supported by the corrected graph.

The existing 54 network connection records preserve their canonical identities. Three target-path relationships are operationally authoritative at optical-connectivity level: SC217 shape34089, SC218 shape33098 and AP51 shape34267; their physical operation remains unresolved and none is called field verified. The other 51 SC218 relationships remain candidates. Full-page coverage additionally accounts for every one of 203 Connect rows through 148 connector-shape evidence/assertion records: 12 generated connector assertions match SC218 connector IDs and 136 remain unresolved geometry. The complete 52-record SC218 interpretation set remains preserved separately in source evidence and operational inventory. SC216 still has no inferred three-way connection.

## 6. Data model
Typed entities now additionally include EvidenceRecord, AssertionRecord, AssertionGroup, AssertionReviewEvent, MigrationCoverage and ExternalDocumentationBoundary. Claim verification is assertion-level: Evidence Basis supports multiple immutable evidence records; Review State is an auditable human lifecycle; Operational Status is authoritative, candidate, unresolved, conflicting, historical or not applicable. Legacy object-level `verification` fields remain only for compatibility and summary display; they never override assertion uncertainty. Strict Trace traverses `operationalStatus=authoritative` optical relationships and does not require field verification. Candidate Trace may include candidate relationships.

Source Annotation retains immutable raw text and source hash plus optional normalized summary, category, geometry, asset/group/route/page/unresolved scope, associations, verification and warnings. Structured interpretation supplements raw evidence and never replaces it. OpenNet is first-class with separate route-level physical-infrastructure-owner and network-operator assignments; these do not populate segment ownership, fiber rights, service providers or customers.

ODF/Panel/Port identities are independent from connection state. A logical Port may carry multiple `SourceRepresentation` records with roles such as `internal_odf_port` and `aggregation_boundary_port`; normal inventory capacity counts the Port once. `PortRangeAssignment` groups reviewed direction/endpoint facts without copying free text into 192 records. Panels remain optional so `ODF → Port` is valid when the source establishes no module hierarchy. Port front/rear/single faces allow rear Fiber Termination and front Patch Cord edges to coexist. Port physical occupancy, administrative allocation and condition are separate dimensions. Patch Cord is an explicit topology edge and is never represented as a splice. A generic explicit-topology walker can follow fiber termination → port interior → patch cord when evidence-backed records are added. The Tsageri pilot now has one ODF and 192 ports; FiberTermination and PatchCord collections remain empty because exact per-fiber mapping is unresolved.

PhysicalCable is now an independent first-class asset with physical ends, route context and ordered accepted/candidate/unresolved segment memberships. `PC-TSAGERI-SC218-01` accepts only C172, keeps C171 candidate, leaves the upstream physical origin unresolved, and records SC218 as its physical end. Cable Route continuation and Fiber Trace continuation remain separate facts.

CableContinuation is a neutral node-level record with typed sides, structured Fiber ranges, optional documented Tube references, explicit per-Fiber mappings, review/operational state and source connection IDs. It supports same-number, offset, explicit and unresolved mappings without merging Segment identities or PhysicalCable membership. The seven current records cover SC217, SC218 and AP51. Strict Cable Continuity follows authoritative members only; Candidate mode may follow candidates while retaining their status. C172 Tube 3 visibly splits by Fiber range and Tube 4 remains partial. Details and the complete Segment/Closure audit are in `docs/ITERATION-16-CABLE-CONTINUITY-REVIEW.md`.

SourceNetworkDocument records immutable file/page identity, source hash, reviewed package counts and separate completeness dimensions. ExternalDocumentationBoundary now carries `currentSourceDocumentId`, a stable external direction key, nullable `nextSourceDocumentId`, nullable `linkedRouteId`, nullable `boundaryAssetId`, an explicit status, evidence IDs and review state. The current package proves the boundary exists; it does not prove the identity of the next document or topology beyond it.

Distance is a plural, source-aware observation against exactly one Route Leg or Cable Segment. Manual, external, GIS, survey, documentation, OTDR, legacy and unknown sources can coexist without overwrite. Unknown values remain null. Route summaries report complete, partial, unknown or conflicting coverage and never count missing legs as zero. External references retain system IDs separately from immutable Fiber Atlas IDs. Service paths can later reference fibers, connections, port faces, patch cords, passive components and endpoints. OpenNet internal use remains distinct from dark-fiber rights and L2 customer service.

PhysicalColor has a stable technical key plus Georgian/English labels and explicit unknown/documented/proposed basis. The centralized12-position palette lives in `src/domain/colors.ts`. Tube.number/physicalColor and Fiber.number/physicalColor/positionInTube are independent. C172 and only C173 Tube1 are projected from accepted evidence; other provisional groups retain proposed values while actual values remain null. ConnectionReview independently records endpoint identity, optical connectivity, operation, destination asset, port, containment, reviewer, source hash and warnings. Manufacturer/model/productCode/cableType remain null until evidence. Allocation, physical condition, connectivity, verification and physical color remain separate. Unknown versus confirmed none are distinct.

## 7. UX structure
Implemented: a package-first dashboard; manager Document Overview; interactive Manager View; one primary Route Workspace for the root route and nested branch route; all 20 Segment details; all 12 Closure details; six AP views; two aggregation contexts; operational Fiber Detail and Fiber Trace; issue review; and full-page Migration Coverage/Verification Review. The overview reports complete source accounting without a misleading combined percentage. The route rail carries compact confirmed Tube ribbons and plain unknown-construction labels. Expansion exposes Fiber groups and numbered Fiber chips in context. Segment Inspector answers where the cable comes from, the local span, split destinations and construction. Closure Inspector answers what enters, the main continuation, branches and important Fiber transitions. Tube Inspector shows identity/range, destinations and Fibers. Fiber Inspector leads with origin/current identity/destination and a grouped complete journey. AP/Aggregation/Port Inspectors keep selection paths short. Empty sections disappear. Model fields, counts, PhysicalCable IDs, source labels, provenance and ledgers remain in collapsed detail.

## 8. Design decisions
- Ledger default: fewer crossings, exact numbered pairs; alternative full canvas rejected; consequence selected relationships get a compact isolated view.
- Local React + TypeScript + Vite: straightforward portable prototype; alternative production SSR/cloud starter deferred because no persistence/hosting is needed. Sites design/local-preview workflow is used, but no Site is registered or published.
- Real unknowns preserved: no demo company assignments mixed with real assets. Role fields stay visible, with separately typed future relationships.
- Iteration06 accepts four C172 tubes. Iteration07 additionally accepts only C173 Tube1/F01–F12 from matching marker evidence at both ends. Every other group stays neutral/provisional. Color remains a physical attribute, never an identity or graph edge.
- Relationship acceptance is granular. The target path accepts endpoint identity and optical connectivity while all three physical operations remain unknown; AP51 is accepted at asset level while Port1 remains a candidate.
- Trace is computed from a connection graph, not a fixed screenshot/list. Endpoints and source references live in domain data.
- The bounded Cable Route is computed from a deterministic, hash-checked source interpreter. SC205 and SC220–SC224 are imported first-class nodes; the final C184/Lentekhi endpoint remains an explicit unresolved leg. Unknown closure treatments stay visible. Route condition is independent from fiber allocation/service state.
- Route/segment/fiber/closure screens use progressive disclosure. Operational identity and navigation stay visible; provenance and audit detail are available without dominating the normal workflow.
- Operator topology is a pure presentation projection over existing route/segment/asset records. It does not add graph edges, resolve conflicts or alter verification state. A main route is visually linear; documented AP/external routes and linked child routes branch at their source node.
- Normal pages use one compact clarification block for unresolved operational facts. The Migration Review remains the place for assertion-by-assertion evidence work.
- First self-review: selected mappings below48 ledger rows were hard to find; detail now appears above the ledger and hides unrelated rows. Seven columns and all filters were too dense; four columns plus disclosures preserve precision.
- Standalone export: embed the compiled app, data, styles and favicon in one HTML file for easy offline review; keep structured source as the editable system. This avoids requiring a dev server merely to inspect the prototype.
- Fiber availability is independent from connectivity: explicit verified unallocated/serviceable/no-obligation evidence can support capacity availability even without a recorded route. Unknown actual fixtures never qualify. Production reservation/commercial policy remains unimplemented.

## 9. Prototype architecture
React/TypeScript/Vite remains the UX and domain prototype with a static JSON-backed repository. Domain helpers own trace/search/validation/status rules; UI components consume those results. The organization primarily uses PHP/Laravel, so the preferred production direction is `Laravel backend/API → PostgreSQL → web application`. Replace `NetworkRepository.load()` with an API adapter while preserving the current topology semantics and IDs; do not rewrite the accepted frontend or domain merely for stack consistency before pilot acceptance. PostgreSQL is the target system of record; PostGIS can be added when coordinates are trustworthy. The existing Python VSDX extractor is acceptable for the pilot. Production import execution may become a Laravel command/job/service or remain an isolated deterministic utility invoked by Laravel. Keep this as one deployable application unless a concrete need justifies separation; no microservice split is planned.

## 10. Files
`scripts/interpret-full-page.mjs` verifies the current raw extraction and deterministically generates `src/data/full-page-migration.json` plus `docs/ITERATION-12-FULL-MIGRATION-REVIEW.md`. `scripts/interpret-iteration21-routing.py` re-reads every marker bank and connector from the immutable raw source package and generates `src/data/iteration21-routing-evidence.json`. `src/domain/iteration21.ts` builds NodeFiberTransition records, active graph Lineages, old/new audit records, invariants and refreshed Journey summaries. `scripts/generate-iteration21-report.ts` generates `docs/ITERATION-21-BRANCH-FIBER-ROUTING-REVIEW.md`. `src/domain/fullMigration.ts` applies the complete inventory. `src/domain/showcase.ts` adds the Source Network Document package and construction assessment. `src/domain/cableContinuity.ts` preserves the earlier continuation-review records and strict/candidate continuity paths; active Iteration 21 Lineages do not derive edges from them unless the source-specific NodeFiberTransition graph independently supports the edge. `src/domain/operatorTopology.ts` and `src/domain/routeWorkspace.ts` derive operator presentation and URL-backed selection. `src/views/RouteWorkspace.tsx` renders the branch-aware route/Inspector workflow. `tests/iteration21-branch-fiber-routing.test.ts` protects the corrected graph and golden cases. `scripts/export-standalone.mjs` produces `../fiber-prototype.html`.

## 11. How to run

Quick review: open the sibling `fiber-prototype.html` in a modern browser. All code/data/styles are embedded. Browser automation blocked file:// navigation, so the export was verified through localhost and then with the browser network disabled; direct double-click launch was not automated.

Editable project (from this folder; Node22.12+ recommended; Iteration 15 checks ran with the bundled Node runtime):

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/`. Local binding only; stop with Ctrl+C.

```sh
npm test
npm run build
npm run preview
npm run export
```

`build` type-checks app and tests, then writes `dist/`; `preview` serves it on127.0.0.1:4173; `export` rebuilds and embeds it into `../fiber-prototype.html`. Dev port5173 is strict: if occupied, stop the previous process rather than silently using another URL. Generated source ZIP excludes node_modules/dist and includes the standalone copy separately.

## 12. Current prototype state

Completed: complete page-level accounting for 7,349 shapes, 2,677 direct-text/comment occurrences and 203 Connect rows; 20 Cable Segments; 1,176 logical fibers; 98 decoded Tube groups; 12 closures; 6 AP/ODF-like assets; 144 AP Port Flow records; 2 aggregation entities; 2 Cable Routes; 1 external documentation boundary; 384 local PortTopologyBinding records; 320 claim-level assertions; 218 evidence records; 7 legacy CableContinuation records; 839 NodeFiberTransition records; 278 active graph Lineages plus 42 superseded previous interpretations; 33 engineering ConnectionSheets with 1,230 visible rows; one Source Network Document package; branch-aware route overlay; Tube and individual Fiber expansion; Segment/Tube/Fiber/Closure/AP continuity inspection; old-versus-corrected Lineage audit; session-only Closure photos; print/mobile connection sheets; URL-backed selection; responsive mobile Inspector; and 576 passing tests. Exact source reconciliation remains in `docs/ITERATION-12-FULL-MIGRATION-REVIEW.md`; Iteration 16 evidence boundaries are in `docs/ITERATION-16-CABLE-CONTINUITY-REVIEW.md`; Iteration 19 AP/color decisions are in the two Iteration 19 review documents; corrected Fiber routing is in `docs/ITERATION-21-BRANCH-FIBER-ROUTING-REVIEW.md`; engineering sheet coverage is in `docs/ITERATION-22-SPLICE-WORKSPACE-REVIEW.md`.

Partially completed: migration completeness means every meaningful source occurrence is classified, not that every assertion is authoritative. The SC207 external continuation, 136 earlier generated connector-shape assertions, all closure treatment mechanisms, physical rear-face ODF terminations, AP containment and AP internal operations remain unresolved. AP41's direction groups are known but its exact ingress-to-return Fiber operation is not. C181/F05–F12 reach SC225 without a source-readable per-Fiber AP53/AP54 choice. Physical Tube/Fiber construction is decoded for all 20 source Segments; optical continuity is active only where the local transition graph supports it. `PC-TSAGERI-SC218-01` still accepts C172 only and keeps C171 candidate. Commercial labels are preserved, but only OpenNet's owner-confirmed route-level infrastructure-owner/operator roles are operational relationships. Lentekhi's endpoint is known; only its numeric legacy claims conflict.

Not started: production DB/API, persisted editing/approvals/audit, authentication, GIS, offline synchronization, live integrations, real employee/field acceptance. These were deliberately outside this iteration. Temporary review servers are stopped at delivery; use the standalone file or run commands above.

## 13. Known problems / limitations
Historical snapshot: these limitations include states superseded by Iterations 26–28G. Consult the delivered baseline and active worker queue before acting on them.

No field verification was added. The 320 assertion counts describe the earlier assertion inventory and operational use, not truth grades; Iteration 21's source-specific geometry interpreter creates separate NodeFiberTransition provenance and does not bulk-promote the earlier assertion collection. Of the earlier generated connector assertions, 12 match SC218 connector IDs and 136 remain unresolved; this is separate from the 838 exact transition edges decoded across all audited nodes. All closure operation mechanisms, cable conditions, exact trays, physical ODF terminations, patching, AP containment/internal operations, services, rights, customer assignments and availability remain unresolved. C181/F05–F12 stop at SC225; only F06 carries the owner-confirmed unresolved AP-side label, and no AP53/AP54 choice is guessed. No reliable distance was found; DistanceObservation, FiberTermination and PatchCord collections remain empty. Lentekhi AGG6/property5 remains a property conflict on a known endpoint, C151 ends at an external SC207 boundary, and canonical C184 reaches `AGG-LENTEKHI`. Review actions remain session-only and do not mutate inventory or raw evidence.

## 14. Open questions
Historical snapshot: some questions below have since been resolved; this is not the current task queue.

Which closures are pass-through, cable cut, mid-span access or termination? What page/file and asset resolve SC207? Which numeric legacy value should eventually be attached to `AGG-LENTEKHI`? Which of the 136 unresolved earlier connector-shape assertions provide additional usable evidence beyond the exact transition interpreter? Which segments share a proven PhysicalCable? What is the upstream origin of `PC-TSAGERI-SC218-01`? Which exact AP53/AP54 Fibers and Ports continue C181/F05–F12 at SC225? What are the physical ODF terminations, AP41 internal Fiber mapping and AP containment mechanisms? What is the exact F5→F9 location? Which coordinate CRS/axis order applies? Which services, rights, customers, conditions and availability states have authoritative evidence?

## 15. Historical recommended steps — superseded by the active worker queue

Retained for audit history only. Do not execute this list as a current work order.

1. Run the manager walkthrough for the two Iteration 21 Golden Cases and sample the full SC219 F25–F32 and SC224 F33–F48 branch ranges. Confirm that source-interpreted neighbors match field knowledge without treating the owner anchors as blanket formulas.
2. Resolve C181/F05–F12 at SC225 from a clearer source or field observation, identifying both the outgoing C182/C183 Fiber and AP Port before extending those partial journeys.
3. Resolve the SC207 next-document identity and review the remaining earlier connector assertions for evidence not already represented in the exact transition graph. Do not bulk-promote geometric patterns.
4. Confirm physical ODF terminations, AP containment and AP41 internal Fiber behavior only from exact endpoint evidence. Keep PatchCord and FiberTermination empty until those mechanisms are known.
5. Keep Laravel/PostgreSQL deferred until topology acceptance. When authorized later, design persistence around SourceNetworkDocument, NodeFiberTransition, active/superseded FiberLineage, APPortFlow, EvidenceRecord, AssertionRecord and AssertionReviewEvent without reverting to route-adjacency continuity.

## 16. Change log
- 2026-09-28 / 21: Replaced route-projected Fiber continuity with 839 node-local transition records and graph traversal; audited all 68 prior Lineages, preserving 26 and superseding 42; generated 278 active Lineages and recomputed all 1,176 Journey summaries. Corrected C176/F32 to AP52/Port24 ↔ Lentekhi and Lentekhi Port38 to C184/F38 → C181/F06 → unresolved SC225 AP-side. Added branch invariants, exact routing matrices, old/new engineering comparison, physical-versus-selected-route styling and endpoint cross-navigation. Added 32 focused tests; 551/551 tests, TypeScript, full inventory validation, deterministic source regeneration, production build, standalone export and desktop/390px/standalone QA pass.

- 2026-09-28 / 19: Added 144 AP Port Flow records and responsive AP grids for AP41/AP50–54; reconciled AP41's overlapping owner ranges without deleting the earlier statement; decoded all 1,176 Fiber markers and 98 Tube groups across the 20 source Cable Segments; replaced the unresolved Lentekhi boundary experience with neutral `AGG-LENTEKHI` while preserving heading6/property5 claims; made C184 the canonical final leg; preserved 68 Fiber Lineages and AP51/OpenNet/OTDR behavior. Added 38 focused tests; 489/489 tests, TypeScript, production build, standalone export and desktop/390px/standalone browser checks pass.

- 2026-09-27 / 16: Added first-class CableContinuation records with structured ranges, mixed per-Fiber review state, route-relative upstream/downstream projection and strict/candidate continuity paths. Made construction visible on the Route Workspace; added Tube/Fiber expansion, Tube Inspector, Fiber continuation context and Closure continuation forks. Audited all 20 Segments, all 12 Closures and connector/port boundaries in `docs/ITERATION-16-CABLE-CONTINUITY-REVIEW.md`. Added 38 focused tests; 398/398 tests, TypeScript, production build, standalone export and desktop/390px browser checks pass. C172 T3 is visibly split and T4 remains partial; no Tube identity, PhysicalCable membership or exact ODF termination was inferred.

- 2026-09-27 / 15: Completed the Tsageri–Lentekhi page as one manager-ready Source Network Document package. Added the Document Overview, separate completeness dimensions, Manager View, external-document continuation semantics and nullable future-link contract. Enriched Segment, Closure, AP, aggregation and boundary inspection; exposed evidence-scoped construction/tube/PhysicalCable facts while keeping uncertain and absent facts explicit. Added the full showcase audit and 35 focused tests; 360/360 tests, TypeScript, production build and desktop/mobile browser checks pass with no horizontal overflow or console warnings/errors.

- 2026-09-26 / 14: Replaced the route detail page with a route-centric master-detail workspace. Added URL-backed selection, route-scoped search, synchronized focus and inventory, in-place aggregation ranges/ports, Segment fibers, AP ports and nested branches, plus Back/Forward restoration. Made the dashboard route-first and kept legacy full-detail links as secondary actions. Added a responsive 390px Inspector sheet that closes without changing route scroll position. Preserved all Iteration 12/13 records and non-inference rules. Added 35 focused tests; 325/325 tests, TypeScript, production build, standalone export and desktop/mobile browser checks pass.

- 2026-09-26 / 13: Reworked normal topology pages around operator questions. Added derived From/Through/To/Branch/PhysicalCable summaries, main-path versus nested-branch route styling, concise closure/AP/aggregation pages, operational search text and collapsed engineering detail. SC206 now consolidates the named Alpana/Tvishi/Ambrolauri direction without implying connectivity; SC224 nests the SC225/AP53/AP54 route; C172 distinguishes local, route and PhysicalCable endpoints; AP41 remains an interconnect; AGG5 leads with four ranges and keeps its full grid secondary. Corrected generated-connector report wording to 12 SC218-matched plus 136 unresolved assertions while preserving the separate 52-record interpretation set. Added 27 focused tests; 290/290 tests, TypeScript, production build, standalone export and broad desktop/390px browser checks pass.

- 2026-09-26 / 12: Added deterministic full-page migration coverage for all 20 source cable labels, 12 closures, six AP/ODF-like assets, two aggregation contexts, 1,176 fibers and all 203 Connect rows. Added C149/C151/C175/C181–C184, SC225, AP52–AP54, external SC207/Lentekhi boundaries and the SC224→SC225 branch route without inventing optical continuity or common sheaths. Introduced independent Evidence Basis, Review State and Operational Status, 320 assertion and 218 evidence records, grouped review, first-class conflicts and authoritative-status Strict Trace. Replaced candidate-only import review with coverage/reconciliation and assertion review. Added the generated full-migration report and focused tests; 263/263 tests, TypeScript, the production build, standalone export and final desktop/mobile browser checks pass with no page-wide overflow or console warnings/errors.

- 2026-09-25 / 11: Replaced the metadata-heavy Fiber Detail with a compact operational identity, vertical accepted/candidate path, immediate closure event, separate Segment/PhysicalCable/Route/Trace context, upstream/downstream summaries, exact stop reasons, compact use/condition/availability and grouped clarification disclosures. Added a generic future-ready path-step model without fabricating ODF ports or patch cords. Added 27 focused tests; all 226 tests, TypeScript, production build, standalone export and the C172/F01, C172/F29, C172/F41, C171/F29 plus 390px browser journeys pass with no page-wide overflow or console warnings/errors.

- 2026-09-25 / 10: Added the reviewed Tsageri ODF with 192 deduplicated logical ports, four owner-confirmed range assignments, port-start infrastructure traces that stop before unsupported optical mapping, AP Chkhuteli ingress/backfeed semantics, and the first PhysicalCable example around C172. Added dedicated aggregation/port/AP/C172 UX, 34 focused tests, deterministic source evidence and Iteration10 source review. No backend or fabricated panel/splice structure was added.

- 2026-09-24 / 01: Started local prototype from prior evidence; fixed scope and domain boundaries; created this handoff before delegated implementation.

- 2026-09-24 / 02: First coherent build passes. Added 4 cable / 168 strand records and 54 unapproved candidates. Trace walks explicit fiber ends in both directions. Approval, operation, allocation, and physical condition remain independent. Self-review requested simplification: move selected closure relationship above the ledger, hide unrelated rows, collapse advanced filters, expose location and route links, and keep provisional color warnings next to colors. Faster model implementation recovered after an initial usage-limit interruption.

- 2026-09-24 / 03: Simplified closure ledger to four columns, focused selected mappings, disclosed secondary filters/roles, labeled status dimensions, added port records, removed duplicated visible AP trace step, corrected mobile navigation and preserved all unknowns. Domain tests12/12 pass; build/export pass;24 route/viewport checks pass; standalone offline interactions and zero external asset requests verified. Added future editing workflow, UX review, validation notes and portable source package. Original Visio unchanged.


## Iteration 04 — accepted product decisions (implemented)

1. Legacy cable labels are secondary aliases, no longer primary display names.
2. Canonical cable identity is a stored immutable internal ID; endpoint/name/manufacturer/ownership changes cannot change it. Display collisions are allowed and are disambiguated by secondary legacy/context fields.
3. Preserve legacy numeric cable IDs and full Visio labels; old deep links and `172/29` remain resolvable.
4. Display format: typed A endpoint ↔ typed B endpoint · fiber count, e.g. `SC217 ↔ SC218 · 48F`.
5. Cable Route is first-class and separate from Fiber Trace. Do not merge C172 and C173 into a single cable/sheath based on their connected fibers.
6. A and B are ordered cable references, never inherent traffic direction.
7. Ordered route nodes model intermediate closures/accesses. Current source labels supply endpoints only; unknown intermediate nodes/treatments remain unknown. Adjacent node intervals are represented without claiming surveyed geometry.
8. Optical trace still traverses only accepted edges by default; candidates require explicit inclusion.
9. Manufacturer/vendor, model/product code, construction, cable type and tube count are cable attributes with explicit unknowns and manufacturer verification.
10. Tube number/color and fiber number/color/position are independent. Existing12-position groups remain provisional hypotheses, not physical tube inventory.
11. Legacy Visio line color, tube physical color, strand physical color, status color and selection are separate. Drawing colors never prove physical colors.
12. Actual physical colors and manufacturer remain unknown. Prior proposed strand palette is retained separately as an unverified reference, not displayed as established identity.
13. Search supports legacy aliases, endpoint pairs, new names, manufacturer and explicit commercial relationships. No fictional ZTT cable is added just to produce a search result.
14. Closure ledger stays focused and compact; selected endpoints reveal tube/fiber context and verification.
15. Primary pilot remains SC217–SC218/AP51.
16. Secondary stress case is SC216 with legacy169(SC206↔SC216),171(SC216↔SC217),170(SC216↔AP50). AP/ODF50 containment ambiguity remains explicit. Three cable directions do not prove a three-way optical branch.

- 2026-09-24 /04 started: read current handoff, model, fixtures, source records and running prototype; retained prior local/read-only/verification/commercial-role decisions.

- 2026-09-24 /04 model iteration: migrated6 cable records to stored canonical IDs and preserved aliases; added typed A/B routes, manufacturer metadata,20 provisional tube groups,240 neutral physical-color strand records and AP50 ambiguity. Broadened search and retained strict/candidate trace boundaries. SC216 optical import deliberately withheld pending evidence review. Implementation completed and reviewed; current results follow.

- 2026-09-24 /04 completed: reviewed faster-model view/test implementation and bounded source investigation. Fixed remaining internal-ID prominence, duplicate focus/trace identity, type narrowing, Georgian labels and neutral actual colors. Cable Detail now leads with the typed display name, legacy alias, manufacturer/owner and explicit A/B route; grouped fibers keep actual tube/color/position unknown. Search/deep links preserve legacy navigation. Closure216 shows three distinct cable directions and120 unknown local fiber ends, with AP50/ODF ambiguity. The original54 candidates remain unapproved; primary candidate trace reaches AP51/port1 and stops at the unmapped SC216 end (now `missing`, not the former out-of-pilot `boundary`). No field connectivity or commercial assignments were inferred.
- 2026-09-24 /04 validation: 28/28 tests and TypeScript/production build pass;33 route/viewport checks at1440/768/390px have no document overflow; legacy/new-name search, closure reverse focus and candidate/strict/F41 cases passed. Standalone export/offline result is recorded in `docs/VALIDATION.md`. No user/field acceptance, publication, database or persisted editing is claimed.

- 2026-09-24 /04 packaged: standalone offline checks7/7 passed, one document request, no external assets/page errors. Original Visio SHA-256 matches the preserved source hash. Updated source package contains current evidence, screenshots, tests and this handoff. Temporary review servers are stopped at delivery.

## Iteration 05 — accepted product decisions (implemented)

1. Legacy C169–C174 records are Cable Segments / `კაბელის მონაკვეთი`, not whole physical cables.
2. Existing immutable `CAB-…` IDs, numeric legacy IDs, full Visio labels, search aliases and deep links remain valid.
3. A future PhysicalCable/CableRun parent is optional. No parent relationship or shared attributes are inferred from adjacent segments.
4. The migration boundary is explicit: Visio source → raw extraction → interpreted candidates → human review → accepted inventory.
5. Generic VSDX extraction is source-neutral and preserves package parts, page/master metadata, shapes, text, cells, sections, Shape Data and Connect rows.
6. Tsageri-specific label grammar, stencil meaning and geometry matching live in a separate interpreter with versioned provenance.
7. Every interpreted record starts as unreviewed and needs verification. Geometry, matching fiber numbers and drawing colors never grant approval.
8. Fiber continuity exists only through explicit connection endpoints. Each side keeps its own segment, fiber number and physical color; arbitrary remapping is valid.
9. Human review has explicit Accept, Correct and accept, Reject and Leave unresolved outcomes. The local prototype keeps decisions in session and does not claim production persistence.
10. Reimport is idempotent for identical evidence. Changed evidence against an accepted/corrected natural key creates a conflict and never silently overwrites the accepted fingerprint/reference.
11. SC218 remains52 unapproved geometry candidates with operation unknown. SC216 remains three attached segments with no inferred three-way optical connection.
12. Import reporting must state what was extracted, interpreted, unresolved, conflicting and deliberately withheld from accepted inventory.

- 2026-09-25 /05 completed: added the generic raw extractor and ran it against the actual VSDX; generated the compressed raw artifact and matching summary. Added101 provenance-rich candidates, session review UI, deterministic reimport/conflict rules, Cable Segment terminology, independent endpoint identity in the closure ledger and source-run documentation. Existing pilot IDs/routes and all54 network candidates are preserved.
- 2026-09-25 /05 validation:46/46 tests pass, including18 migration cases; TypeScript and production build pass. Browser review verified the import workflow, `C172/F29 → C173/F01`, SC218 ledger identity, SC216 non-branching behavior and zero document overflow at1280×720. Updated standalone export is the sibling `fiber-prototype.html`.

## Iteration 06 — accepted product decisions (implemented)

1. The preferred production stack is Laravel backend/API with PostgreSQL and a web client. The React/TypeScript/Vite application remains the UX/domain prototype; no pre-acceptance rewrite is required.
2. The Python VSDX extractor remains acceptable. Laravel may invoke it as a deterministic utility or later own equivalent command/job logic; production stays a single application unless operations prove otherwise.
3. The confirmed applicable construction is12 fibers per tube/module with the standard Blue-first12-position sequence. Stable technical color keys and Georgian/English labels are centralized.
4. In the relevant legacy marker convention, inner fill maps to Fiber.physicalColor and outer ring maps to Tube.physicalColor. Raw style values, source shapes and rule version remain attached.
5. Connector/line color does not override either physical attribute and never establishes connectivity.
6. Only C172 is upgraded: Tube1 F01–F12, Tube2 F13–F24, Tube3 F25–F36, Tube4 F37–F48. Other segments remain provisional.
7. Tube2 raw evidence is not silently normalized: F13 has a conflicting outer value and F22/F23 use an alternate orange value. The accepted Orange tube identity records these warnings.
8. SC218 remains52 unapproved, operation-unknown geometry candidates. The ledger displays both endpoint numbers, positions and colors; mismatches are valid and do not imply an error.
9. Import Review contains48 accepted C172 physical evidence items in addition to the original101 candidates. Session actions still do not persist.

- 2026-09-25 /06 completed: added the source-specific color interpreter and generated48 marker records from raw group34626; added centralized palette/decoder, reviewed C172 projection, physical evidence on fibers/tubes, refined cable/fiber/closure UI and color-aware Import Review. No other segment or connection was promoted.
- 2026-09-25 /06 validation:64/64 tests pass, including18 new physical-construction/color/topology cases; TypeScript, production build, standalone export and browser review pass.

## Iteration 07 — accepted product decisions (implemented)

1. Review is relationship-specific and evidence-granular. Endpoint identity, optical connectivity, operation, destination asset, port and containment may carry different verification states.
2. SC217 shape34089 accepts C171/F29 ↔ C172/F29 optical connectivity. Operation remains unknown.
3. SC218 shape33098 accepts only C172/F29 ↔ C173/F01. Different numbers and colors are valid because source endpoint identity controls. The other51 SC218 relationships remain candidates.
4. AP51 shapes34279/34267 accept C173/F01 connectivity to the AP51 asset. Port1 remains a candidate; AP/ODF containment and physical termination mechanism remain unresolved.
5. Strict trace follows accepted optical connectivity through unknown operations and ends at AP51 with `port_unknown`. Candidate mode adds AP51/Port1 as a visibly provisional step.
6. C173 Tube1/F01–F12 is accepted from matching source marker styles at SC218 and AP51. C173 Tube2 stays provisional. C171 physical structure remains unknown. C172’s four accepted tubes are unchanged.
7. Source shape IDs, raw geometry, source hash, reviewer, rationale and warnings remain attached to the accepted relationships. `scripts/interpret-target-path.py` deterministically regenerates this bounded evidence.
8. SC216 remains unmapped. Legacy search and deep links such as `172/29` remain valid.

- 2026-09-25 /07 validation:84/84 tests pass, including20 focused target-path cases. TypeScript and production build pass. The standalone export was regenerated and browser QA passed for `172/29` search, SC218 accepted/candidate distinction, strict and candidate traces, the expanded evidence view, and zero browser console warnings/errors.

## Iteration 08 — accepted product decisions (implemented)

1. Cable Route is a first-class inventory entity and the full ordered physical network path. Cable Segment remains one node-to-node portion. Fiber Trace remains one strand’s optical graph path. PhysicalCable/CableRun remains a separate evidence-based asset identity.
2. The bounded real route is `ROUTE-TSAGERI-LENTEKHI-CORE`: AGG5 → documented gap via SC205 context → SC206 → C169 → SC216 → C171 → SC217 → C172 → SC218 → C174 → SC219 → documented continuation via SC220–SC224 → unresolved Lentekhi aggregation boundary.
3. C170 is an AP50 branch from SC216 and C173 is an AP51 branch from SC218. AP branches do not terminate the main route. The C171/F29 optical Trace may leave the main route through C173 to AP51 without changing the physical route’s destination.
4. The source supports the route sequence but not a common sheath. Every route/segment `physicalCableId` stays null. Route membership never infers PhysicalCable identity.
5. The origin AGG5 is known. The destination is an unresolved boundary because the Lentekhi heading says AGG6 and the property says ID5. Both documented gap legs remain explicit and valid.
6. AGG5 is an evidence-reviewed aggregation termination. Closure treatments at SC206, SC216, SC217, SC218 and SC219 are unknown and require verification. The unresolved boundary treatment is unknown. No cut, splice, mid-span, pass-through or termination treatment was invented.
7. Route physical condition is unknown and documentation is incomplete. Route/segment condition is independent from fiber allocation, service and connectivity. The model and validation support serviceable, damaged, broken, suspect and unknown states without changing commercial allocation.
8. Route provenance is generated deterministically from the reviewed source hash by `scripts/interpret-primary-route.py`; node, leg and branch evidence includes source file/hash, page, labels, shape IDs, interpretation rule, review state and warnings.
9. Default UX shows operational information first. Route, segment, closure, fiber and trace screens expose compact context and direct actions; technical metadata, source evidence, raw Visio details, hashes and review dimensions stay behind disclosures. Dashboard and search prioritize route-oriented work; Visio Import remains secondary.
10. Validation rejects duplicate order, unsupported circular routes, segment/node endpoint mismatch, branch promotion, unsupported aggregation endpoints and inferred PhysicalCable parents. Unknown endpoints and treatments remain valid.

- 2026-09-25 /08 validation:111/111 tests pass, including27 focused Cable Route/domain/UX invariants. TypeScript and Vite production build pass. Browser review verified route order, documented gaps, AP50/AP51 branch semantics, unresolved Lentekhi boundary, `C172` Route-versus-Segment search results, selected C172 route context, SC218 route/branch/ledger context, C172/F29 Route-versus-Trace distinction, strict AP51/port-unknown behavior and candidate Port1 behavior. Evidence disclosures remain closed by default. The sibling standalone HTML was regenerated from the validated build. Vite’s expected embedded-bundle size advisory remains non-blocking.

## Iteration 09 — accepted product foundations (implemented)

1. Fiber Atlas is intended as the full operational fiber-infrastructure system, not only a Visio replacement.
2. SC205 is a first-class route node on the reviewed Tsageri–Lentekhi direction, with C148 from AGG5 and C150 to SC206.
3. SC206 has a documented named `Alpana–Tvishi–Ambrolauri direction` branch. Its exact raw source spelling is preserved, and it creates no optical connectivity.
4. The route continues beyond SC219 through explicitly documented SC220, SC221, SC222, SC223 and SC224, using C176–C180. C184/Lentekhi remains an unresolved leg because the aggregation endpoint identity conflicts.
5. SC220–SC223 share the source annotation `დამატებულია ქუროები`; it is stored once with group/range scope, four associations and full provenance.
6. All meaningful Visio comments and annotations must remain preserved even when no structured interpretation exists. Raw source text is immutable evidence; normalized summaries supplement it.
7. Annotation scopes include asset, group/range, route, page/general and unresolved association.
8. OpenNet is the owner-confirmed backbone physical-infrastructure owner and network-operator context for this route.
9. Physical ownership, Cable Segment ownership, strand rights, dark-fiber lease, L2 service, OpenNet internal use, provider and customer/beneficiary roles remain distinct.
10. Site, ODF, Panel and Port are first-class future inventory entities with stable IDs and evidence. No AP51 ODF hierarchy is invented.
11. Fiber Termination and Patch Cord are explicit optical-topology concepts using typed port faces.
12. Patch Cord is an optical edge and is never represented as a splice.
13. Port physical occupancy, administrative allocation and condition are separate dimensions. Front patch and rear fiber termination may coexist.
14. Distance is represented through plural source-aware observations, not one overwriteable number on a route or segment.
15. Manual and external-system distance values may coexist with provenance and resolution state.
16. Route total distance reports complete, partial, unknown or conflicting coverage; missing values never become zero.
17. External-system IDs remain references and never replace immutable Fiber Atlas IDs.
18. No ODF ports, patch cords, terminations, services, internal-use assignments or distance values are fabricated to demonstrate the contracts or UI.

- 2026-09-25 /09 source review: extracted the current source revision including comments; classified all 2,677 text/comment occurrences; generated 26 annotations; imported SC205 and SC220–SC224 plus C148, C150 and C176–C180; retained the exact SC206 direction and one shared SC220–SC223 comment. The exact evidence and non-conversions are in `docs/ITERATION-09-SOURCE-REVIEW.md`.
- 2026-09-25 /09 validation: 165/165 tests pass; TypeScript and the Vite production build pass; the standalone HTML was regenerated. Browser QA verified the 13-node vertical route, named direction, single group annotation, OpenNet roles, honest unknown-distance summary, AP51 no-grid state, unchanged strict/candidate trace and empty logs in both production and standalone builds.



## Iteration 27C — Source B semantic decoding (2026-09-30)

State: **NOT CERTIFIED / CANDIDATE_NOT_ACTIVE**. The Source B source SHA remains 419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d. All 1,151 transition candidates are accounted: 376 duplicate overlap evidence at SC205/SC206 and 775 exact local connector-to-marker transitions at SC207–SC215; zero unexplained candidates. The 775 individual edges each retain source connector and marker Shape IDs, geometry rows, Fiber/Tube/color context and unique endpoint marker checks. Route adjacency, equal number, and color were not used to create an edge. Source B has 1,512 partial JourneySummary rows in 361 transition-only connected components; no unsupported full route or intentional termination is claimed.

SC207: 143 C151↔C152 local transitions decoded; C151 construction matches V1 at all 144 positions. Fiber 118 has no drawn connector and is not called terminated. Source B has no literal SC207 label, so the Closure identity/boundary link is withheld. C148 F121–F192 Tube-color conflict remains separate and V1 manifest remains byte-identical at SHA-256 59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125.

Other critical blockers: Port/ODF inventory has 0 certified logical Ports/occupancy bindings; 24 company labels are inventoried but assignment/ownership semantics are unresolved; 3 cut-module notes lack planned/completed status; place and direction annotations lack a source-supported Cable/branch scope. Source B remains staged; no canonical assets, routes, lineages, or cross-document boundary links are active. See docs/ITERATION-27C-SOURCE-B-TRANSITION-AUDIT.md, docs/ITERATION-27C-SOURCE-B-ASSET-PORT-AUDIT.md, docs/ITERATION-27C-COMPANY-ANNOTATION-AUDIT.md, docs/ITERATION-27C-BOUNDARY-RECONCILIATION.md, and migration/iteration27/source-b-transition-ledger.json.

