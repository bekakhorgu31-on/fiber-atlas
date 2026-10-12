# Iteration 28 — Engineer Workspace Review

## Result

The existing prototype now has a Georgian-first Engineer Query Workspace at `#/engineer`. Global search and the workspace use one deterministic, precomputed lookup index. Questions are parsed into typed intents and answered from the active combined Inventory; the natural-language parser does not create facts.

## Search, question and trace workflow

An engineer can type a Cable/Fiber token, legacy label, Node/Closure, AP or Port, source annotation, company name, source document, or short question in the top search. Enter opens an operational question in Engineer Workspace; a selected entity opens its existing Inspector. Search result cards identify the result category. C172 shows two separate endpoint-named Cables and their source documents. A selected Fiber result keeps its canonical Cable ID in the URL, so a deliberate choice survives navigation.

Fiber answers trace both endpoints over active `NodeFiberTransition` edges. Each displayed mapping names its node, Cable/Fiber on both sides, local Tube/Fiber identity, and expandable source. The path is vertical and compact; local mappings expand only when requested. A partial journey names the last known node and does not call a missing edge a termination. Local node questions group exact mappings by Cable pair, show a compact count, and expose detailed transitions on demand. Cable Route is not used to create the optical path.

Session history keeps the latest six submitted questions in memory. Search supports arrows, Enter, Escape, `/`, and Ctrl/Cmd+K. Important query state is kept in the URL so browser Back can restore a previous question. No backend persistence is introduced.

## Operational question catalog

The executable 20-question catalog lives in `tests/iteration28-engineer-query.test.ts`; its expected outcomes are evaluated against `repository.load()` rather than a fabricated sample graph.

| Question | Observed answer class | Key behavior |
|---|---|---|
| C151/F1 სად მიდის? | Partial known path | Crosses Node 207 into C152 and follows only active local transitions |
| C151/F118 სად მიდის? | Partial by source | Stops at Node 207; no C152/F118 edge or termination |
| SC211-ში რა კაბელები ერთდება? | Exact physical inventory | Lists incident Cables for neutral Node 211 without retyping it as a Closure |
| SC211-ში როგორ არის გადაერთებული Fibers? | Exact local mapping summary | Groups source-supported Cable pairs; the compact view can expand all 106 exact edges |
| C159-ზე რომელი Fiber-ები გადადის? | Exact mapping query | Returns 24 exact edges; includes C158/F65 → C159/F1, so the Fiber-number remap stays visible |
| C169 სად მიდის? | Exact endpoint answer | Shows SC206 and SC216 endpoints |
| 169-206-216-48 | Exact Cable | Resolves to canonical C169 |
| C172 | Disambiguation required | Shows V1 and Source B C172 as separate Cables |
| C172/F1 სად მიდის? | Disambiguation required | No source is selected until the user chooses one |
| Lentekhi Port38-ის გზა | Exact binding and known journey | Port38 → C184/F38 → SC224 → C181/F06 → SC225 termination |
| SC225 F06 | Exact termination | Uses the active intentional-termination transition |
| C176/F32 სად მიდის? | Exact known endpoints | Shows C175/F24 at SC219 to AP52/Port24 and the opposite path to Lentekhi/Port32; AP51 is absent |
| AP51 Port3 | Exact Port binding | Resolves to C173/F03 |
| C148 Tube | Source conflict | Exposes only the six affected Tube-color ranges; topology remains usable |
| C151/F118 terminated არის? | Unknown/partial | Explicitly says termination is not recorded |
| Magti რომელ Fiber-ებს იყენებს? | Exact known assignments plus annotation limit | Reports current exact assignments separately from unbound Source B mentions |
| ეს Fiber თავისუფალია? | Unknown | Does not infer availability from connection or unused status |
| Node 207 რა არის? | Unknown type disclosed | Keeps the stable neutral Node identity |
| ალპანა | Annotation only | Finds source place text without making a network asset |
| ლენტეხი-ხელედის მიმართულება | Annotation only | Finds the direction note without making a Fiber edge |

## QA findings

The browser QA covers global search, the 20-question catalog, C172 disambiguation, the C151/F1 cross-document trace, the C151/F118 partial stop, SC211 local transitions, C148 conflict, Lentekhi Port38, Magti non-inference, availability unknown, and annotation typing. It runs at desktop width, 390px mobile, and from the exported standalone HTML. The QA artifact records browser errors, viewport overflow, and representative visible results. Production V1 and Iteration 27D test suites remain regression gates; the frozen V1 manifest is not edited.

## Remaining usability gaps

- The active Source B Nodes remain neutral until a source or owner establishes their equipment type.
- Search and questions are intentionally shorthand-driven; unsupported phrasing receives a not-established answer rather than an open-ended chat response.
- The legacy Trace route remains available for existing deep links. New search and Port flows use the graph-backed Engineer Workspace trace.
- There is no persistent query history or operational editing; both remain outside this iteration.

## Recommendation

Use the typed query contract as the acceptance input for future API design. Before starting persistent editing or a backend rewrite, review the catalog with engineers and collect missed shorthand or unanswered question examples while preserving the same unknown, conflict, and evidence rules.
