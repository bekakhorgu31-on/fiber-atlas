# Iteration 28 — Network Query Contract

## Purpose and authority

The Engineer Query Workspace accepts identifiers and short operational questions, resolves them to a typed `NetworkQuery`, and obtains every network fact from the active `Inventory`. Parsing selects an intent only; it cannot add a Cable, Fiber, connection, node, Port, availability state, company assignment, or source interpretation. The active node-local Fiber transition graph is authoritative for optical continuation. Cable Route is physical context and never creates a query edge.

The current implementation is in `src/domain/engineerQuery.ts`. `createEngineerQueryService(inventory)` builds a rebuildable in-memory search index and returns `search(text)` and `run(text)`. `parseNetworkQuery(text)` is separately testable. React only renders the structured result.

## Iteration 28C — shared current-path authority

`src/domain/currentFiberPath.ts` exposes `resolveCurrentFiberPath(inventory, canonicalCableId, fiberNumber, startingEndpoint?)` and the indexed snapshot builder `createCurrentFiberPathResolver`. This service supplies Query trace, the normal Fiber Inspector, Fiber/Trace detail, maximum-known JourneySummary, current FiberLineage, Combined Network optical overlay and Splice/current-journey navigation. `traceFiberThroughTransitions` is a compatibility/presentation adapter, not a separate traversal algorithm.

The result includes `topologyRevision`, stable-ID `signature`, both endpoint-oriented paths, exact ordered Cable/Fiber legs, oriented local transitions with evidence/identity, alternatives and stop kinds: `no_transition`, `termination`, `port`, `external_boundary`, `unresolved_transition`, `loop`, `invalid_transition`. Missing edges are genuine source partials only after exact active node/Cable/Fiber lookup. Intentional termination requires an active terminal record; certified Port binding requires matching ownership at that endpoint. An internal inconsistency fails projection validation instead of becoming a user-facing unknown.

`FiberJourneySummary` is derived/cache presentation, not stored topology authority. `applyIteration28C` regenerates every current projection, retaining older `fiberLineages` with `projectionRole: historical` and storing rebuilt operational records in `currentFiberLineages`. Revision mismatches invalidate materialized paths; current Lineage and summary mismatches fail validation. Display metadata has a separate revision, and labels are resolved from current inventory without changing graph identity. No document-change, Route-end or old Lineage can stop an exact current continuation.

The all-Fiber deterministic audit is `migration/iteration28c/fiber-path-consistency.json`. Current projection details and source-gap versus software-defect examples are documented in `docs/ITERATION-28C-FIBER-PATH-CONSISTENCY.md`.

## Typed input

`NetworkQuery` contains `intent`, the original `raw` string, and only the identifiers needed by that intent: `cableToken`, `fiberNumber`, `nodeToken`, `company`, `portNumber`, or `targetSegment`.

Supported intents are:

| Intent | Meaning | Data source |
|---|---|---|
| `search` | Find a Cable, Node, Closure, AP, Aggregation, Port, annotation, or source document | Precomputed canonical and annotation index |
| `trace_fiber` | Trace both ends of one specific Cable Fiber | Active `NodeFiberTransition` graph; endpoint and stop context from active inventory |
| `node_connections` | List Cable Segments physically incident to a node or referenced by local transitions | Cable endpoints plus active node-local transitions |
| `node_transitions` | Summarize exact local Fiber mappings at one node, optionally for one Fiber number | Active `NodeFiberTransition` records only |
| `fibers_to_segment` | Find source Fibers with active local mappings into a target Cable | Active `NodeFiberTransition` records only |
| `port` | Resolve a certified Port binding and its known Fiber path | `PortTopologyBinding` plus active transitions |
| `availability` | Report explicit allocation/availability evidence or preserve unknown | Inventory allocation and availability fields |
| `company_usage` | Show exact assignments and separately disclose source occurrences | `NetworkUseAssignment`, organization aliases, source annotations |
| `conflict` | Explain the requested property conflict | `sourceConflicts` and preserved source claims |
| `unknown` | Empty or unsupported input | No topology inference |

The parser accepts mixed case, whitespace, slash and no-slash Cable/Fiber forms, reversed `Fiber 65 C158` form, `C` prefixes, legacy full Cable labels, `SC` and neutral `Node` identifiers, Port shorthand, Georgian question cues, company names and source place/direction text. Canonical Cable IDs are accepted in explicit Fiber deep links so a user-selected collision result remains selected.

## Structured output

`EngineerAnswer` contains:

```ts
{
  query: NetworkQuery;
  state: 'exact' | 'partial' | 'conflict' | 'unknown' | 'disambiguation' | 'annotation';
  title: string;
  answer: string;
  facts: string[];
  results: SearchResult[];
  pathSignature?: string;
  transitions: Array<{ at: string; from: string; to: string; source: string; localIdentity: string }>;
  actions: Route[];
}
```

`traceFiberThroughTransitions` adapts the shared resolver's both-endpoint result into query text, evidence and exact legs. It exposes `signature` and `topologyRevision`; Fiber trace answers expose the same `pathSignature` used by current Inspector and overlay. Multiple outgoing edges produce a disambiguation state and separate path alternatives.

## Search and identity rules

- Canonical physical objects are indexed once. Source representation aliases are searchable but are not emitted as duplicate physical objects.
- Cable legacy IDs are source-scoped. `C172` returns both matching Cables with endpoint-based names, source labels, and a choice. `C172/F1` returns Fiber choices and does not open a trace until a result is selected.
- Exact full labels such as `169-206-216-48` resolve to the Cable whose source representation contains that exact label.
- Place, direction, company and other source text remains an annotation result type, separate from physical entities.
- Search index construction is derived from the current `Inventory`; rebuilding after a future controlled mutation produces a fresh index.

## Unknowns and conflicts

- A Fiber without a local transition stops at the exact current node with the reason available from the active graph. Absence of an edge does not mean physical disconnection or termination.
- Unknown Node asset types remain neutral `Node N` or degree-one `Endpoint N`, even when a user searches using an `SCN` token. Search aliases do not retype the Node. The 28B-certified existing nodes 207–215 display as SC207–SC215 using enriched metadata and their original canonical IDs.
- `unused`, connected, or source proximity never means commercially available. A query without authoritative availability receives an explicit unknown answer.
- Company occurrence is not usage assignment. Existing exact V1 NetworkUseAssignments can be shown, while Source B company labels remain unbound annotations.
- A C148 Tube-color conflict is isolated to the affected property/ranges. It does not invalidate Cable identity or optical topology.
- Port topology appears only when an active certified binding exists. Source B Port assignments remain absent.

## Future API and conversational layer

A future API can expose `POST /network/query` with `{ text }` as a convenience parser endpoint and a typed endpoint with `{ intent, ...identifiers }`. Both should return the structured result above, including stable entity IDs and evidence references. The API must not convert an unavailable fact into a guess. A future LLM may interpret a question into a typed query; it must not author factual network output. The deterministic query service remains the fact authority.

This contract does not introduce persistence, editing, a remote model/API, or a Laravel/PostgreSQL implementation.
