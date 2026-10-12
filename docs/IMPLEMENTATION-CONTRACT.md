> Historical iteration03 implementation contract. Identity, routes, tube/color modeling and current counts are superseded by `ITERATION-04-CONTRACT.md` and `../HANDOFF.md`.

# Implementation contract — architect-approved foundation

Implementation is complete. Agent ownership below records the original delegation only; no agent is currently editing these files. See HANDOFF.md for current state.

Read `src/domain/types.ts` for exact shapes. Do not redefine domain relationships.

Base props: `{data: Inventory, navigate:(route:Route)=>void}`. Typed routes in `types.ts`.

`src/domain/network.ts` will export:
- `findCable(data,id): Cable | undefined`, `findFiber(data,cableId,number): Fiber | undefined`
- `cableFibers(data,id): Fiber[]`, `attachedCables(data, AssetRef): Cable[]`
- `rowsForClosure(data,closureId,cableId): ConnectionRow[]` (one row per selected cable fiber; unmatched is unknown, not unconnected)
- `fiberConnections(data,cableId,number): Connection[]`
- `otherEnd(connection,cableId,number): OpticalEnd`
- `assetLabel(ref): string` (`ქურო 218`, `AP51`, etc.)
- `endLabel(end): string` (`C172 / F29`, `AP51 / Port 1`)
- `commercialRoles(data,cableId,fiberNumber?): {label:string;value:string;note:string}[]` (5 rows: physical cable owner, fiber holder, service provider, customer, service)
- `traceFiber(data,cableId,fiberNumber,includeCandidates): TraceResult` (derived traversal; candidate inclusion false by default)
- `searchInventory(data,query): SearchResult[]`
- `availabilitySummary(data,fibers): {assigned:number;reserved:number;available:number;damaged:number;unknown:number}`; free requires explicit evidence and policy, never merely no connection.
- `verificationLabels`, `allocationLabels`, `conditionLabels`, `connectivityLabels`: Record<enum,string>, `fiberLabel(n):string`.

Common UI to be provided in `src/components/ui.tsx` by views agent:
`PageHeader({eyebrow?,title,description?,action?})`, `Badge({children,tone?:'neutral'|'warning'|'success'|'danger'})`, `VerificationBadge({value})`, `EmptyState({title,description})`, `FiberIdentity({fiber,compact?})`, `CommercialRoles({data,cableId,fiberNumber?})`, `Evidence({source})`.

View exports from `src/views/NetworkViews.tsx`: `CableView(props & {id:string})`, `ClosureView(props & {id:string})`, `FiberView(props & {cableId:string;fiber:number})`, `TraceView(props & {cableId:string;fiber:number})`, `AccessPointView(props & {id:string})`, `AggregationView(props & {id:string})`, `ReviewView(props & {query?:string})`.

Architect owns App.tsx, Dashboard.tsx, domain, data, handoff. Views agent owns ONLY components/ui.tsx and views/NetworkViews.tsx. CSS agent owns ONLY src/styles.css. Coordinate via messages when a class/interface needs changing.

Visual thesis: calm operational workbench; deep teal navigation strip, white surfaces, cool gray structure, restrained amber for uncertainty, no decorative charts. Georgian typography with generous line height (>=1.55). Essential text 14–16px. Few sidebar destinations, global search in header. Tables must reflow to cards on mobile/tablet when needed. Use semantic buttons/labels; lucide-react icons where useful; no emoji or decorative generated images.

Core classes agreed: `.app-shell`, `.sidebar`, `.brand`, `.nav-link`, `.sidebar-note`, `.workspace`, `.topbar`, `.global-search`, `.search-results`, `.search-result`, `.page`, `.page-header`, `.eyebrow`, `.page-title`, `.page-description`, `.button`, `.button-primary`, `.button-quiet`, `.badge`, `.badge-neutral`, `.badge-warning`, `.badge-success`, `.badge-danger`, `.panel`, `.panel-header`, `.notice`, `.notice-warning`, `.muted`, `.stats-grid`, `.stat`, `.stat-value`, `.dashboard-grid`, `.asset-list`, `.asset-row`, `.route-context`, `.facts-grid`, `.fact`, `.field-label`, `.filter-bar`, `.field`, `.table-wrap`, `.data-table`, `.selected-row`, `.fiber-grid`, `.fiber-button`, `.fiber-swatch`, `.fiber-identity`, `.connection-focus`, `.connection-node`, `.connection-middle`, `.roles-grid`, `.role-card`, `.evidence`, `.trace-list`, `.trace-step`, `.trace-marker`, `.trace-card`, `.trace-stop`, `.tabs`, `.tab`, `.empty-state`, `.issue`, `.pill-row`, `.split-view`, `.section-title`, `.context-link`, `.sr-only`, `.loading-state`, `.error-state`.

All UI copy Georgian. Technical IDs remain C172/F29/AP51. Color and module are provisional standard scheme, not confirmed identity. Unknown owner/rights/provider/customer remain unknown independently; no Company A fictional fixtures. Organization search returns source-annotation review results with no asserted asset assignment.

There are 4 pilot cables/168 fiber objects; closures 216/217/218/219; AP51; aggregation 5 source reference. All 52 SC218 connection candidates plus one SC217 F29 and one AP51 F1/P1 termination candidate = 54 candidate connections, zero approved. All allocation/condition unknown. No editing or backend in current iteration. Do not show nonfunctional edit/save buttons. Future editing belongs in handoff design.
