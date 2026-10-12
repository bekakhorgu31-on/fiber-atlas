# Fiber Atlas — current handoff

Updated: 2026-10-05. Delivered baseline: **28K — organization search in the route-map workspace**. Overall status: **Done**. No further task is queued.

The user approves the new route map but reports that searching Silknet still opens the old, less informative presentation. Extend the accepted 28J experience to organization searches; preserve its AP behavior and visual design.

## Read first

- [28K delivered implementation and actual validation](docs/ITERATION-28K-IMPLEMENTATION-REVIEW.md).

- [28K requirements and acceptance](docs/ITERATION-28K-ORGANIZATION-MAP-SEARCH.md).
- [Silknet reproduction](docs/iteration28k-review-reproduction.json) and [before screenshot](docs/iteration28k-before-silknet-desktop.png).
- [28J delivered behavior](docs/ITERATION-28J-IMPLEMENTATION-REVIEW.md).
- [Archived handoff through 28J](docs/archive/HANDOFF-THROUGH-28J-2026-10-05.md).
- [Validation history](docs/VALIDATION.md).

## Review finding

The 28J Silknet result was first in search, but its route action opened `#/engineer?q=Silknet`. The organization projection already provides 4 logical strand groups, 28 local Fiber legs, 12 unique Cables and 2 exact Port bindings, with no AP IDs in this snapshot. 28K now displays that footprint and all four groups in the organization map; one selected resolver path can be inspected/animated. Separate strands remain separate.

Planning review checked the actual delivered standalone SHA-256 `6bb6bacff39d3d2c7e5ac646a79ae1950eafed49f4749665e93aad54ebf45e8e`. 28J's reported 782 passing tests and 40 workflow flows are historical validation, not a new 28K run.

## Worker status contract

Use **Ready**, **In progress**, **Needs review**, **Blocked**, **Done**. Update each task below with changed files, actual verification and unresolved limits. Follow the current specification; do not execute archived tasks. Reproduce first. Done requires acceptance evidence. Continue independent work when another task is blocked. No new import, backend, deployment or unrelated redesign is authorized by this queue.

## Active tasks

### 28K-01 — Route organization searches to the map
Priority: **P1**. Status: **Done**. Dependencies: none.

Use canonical organization identity and aliases to open the new organization map from search/Enter. Add stable URL state. Old organization-query links should expose the map as the primary answer, with the Engineer report secondary. Preserve qualified query intent, including OTDR/Cable/review filters, and avoid redirect loops. Route action labels must match their destination.

Worker notes: Done: canonical exact names/aliases and strand search actions open the organization map. Stable organization URL state and legacy bookmark migration retain the secondary report via report=1. Qualified OTDR/Cable/review answers retain scope; search history collision fixed. Files: App.tsx, types.ts, navigation.ts, organizationEntry.ts, engineerQuery.ts, iteration28g.ts. Alias/deep-link tests and browser journeys 1/7 pass.

### 28K-02 — Organization footprint and complete path chooser
Priority: **P1**. Status: **Done**. Dependencies: 28K-01.

Use the existing organization projection to highlight all known paths in physical network context. Show an immediately accessible logical path chooser and concise, correctly labeled totals. Silknet's four groups remain distinct; all OpenNet paths remain accessible beyond the eight-example suggestion limit. Do not fabricate APs, fill missing Ports or mark entire shared Cables as organization-owned.

Worker notes: Done: OrganizationWorkspace, iteration28k model and NetworkTopologyCanvas use the existing membership projection and one resolver. Silknet retains 4 groups/28 legs/12 Cables/2 actual ODF bindings; OpenNet exposes all 17 groups. Individual use legs are marked without Cable ownership. Complete IDs/membership, all Silknet diagrams and every organization model verified.

### 28K-03 — Reuse the persistent route/inspection/animation experience
Priority: **P1**. Status: **Done**. Dependencies: 28K-02.

Reuse/extract 28J presentation components for selected organization paths, including ordered resolver legs, remaps, stops, retained organization scope, independently scrolling details and mobile flow. Animate only one selected known path. Node/Cable/Port inspection stays in context; explicit AP navigation, evidence return, Back/Forward, reload and whole-network return restore the selected organization/path. Preserve reduced-motion and pause behavior.

Worker notes: Done: shared RouteJourney diagram/playback extracted from APWorkspace. Inspection, explicit destination/source return, Back/Forward, reload and network mode retain organization/strand. Actual Cable/ODF/AP checks pass. Normal/reduced-motion traversal remains finite. All 40 existing AP/domain browser workflows pass against the final export.

### 28K-04 — Make organization evidence and uncertainty consistent
Priority: **P1**. Status: **Done**. Dependencies: 28K-02; complete with 28K-03.

Use actual semantic status for direct/derived use claims, review/conflict, partial routes, unknown Port binding and independent occupancy. Remove contradictory exact/success badges for uncertain organization answers. Source evidence stays available in details. Reconcile Silknet's two bindings to their actual owners; an AP-only visual model must not invent an AP where the projection lists none.

Worker notes: Done: direct use origins and derived path membership remain separate; linked review/conflict and partial/unknown-Port limits are visible. Real Silknet bindings are Lentekhi ODF Ports 10/11 with independent unknown occupancy. Source B exact evidence and source-specific AP navigation verified. Source A compact diagnostic coverage remains a documented limitation. Files: OrganizationWorkspace.tsx, iteration28k.ts, EngineerWorkspace.tsx.

### 28K-05 — Verify supported organizations and export
Priority: **P1 delivery gate**. Status: **Done**. Dependencies: 28K-01 through 28K-04.

Execute the seven acceptance journeys in the 28K specification for Silknet and the other supported organizations. Verify complete path identity/counts, actual map edges, real scroll reachability, navigation restoration and qualified query intent. Run relevant/full tests, TypeScript, production build and offline export. Preserve AP42/Port16, Port38, F11/AP49, Tsageri, C148 and C172 regressions. Save screenshots and artifact-bound browser results; update VALIDATION.md, a 28K implementation review and this queue with actual outcomes.

Worker notes: Done: 787/787 tests, TypeScript, build/export, 45 organization + 6 supplemental + 40 AP regression browser flows pass. Desktop 1440/1366 and touch-emulated 390/320; real wheel/PageDown/Tab, 200% emulated zoom/reflow, reduced motion and screenshots verified. All 45 authoritative JSON hashes and six full projection hashes unchanged; certified counts/frozen manifest preserved. Cold-load median 2133 to 2117 ms. Final SHA-256: 4a38c04b060e7d3fe02493c135eceef2b0d2730792d92e5790879121859f9d3d. See docs/ITERATION-28K-IMPLEMENTATION-REVIEW.md and docs/VALIDATION.md.

## Preserved constraints

- Existing physical projection supplies Cable context; the 28C resolver supplies optical continuity. Organization membership comes from current source-use/lineage projections. No second graph engine or invented optical edge.
- A logical strand group, local Fiber leg, unique Cable and exact Port binding are different units. Organization usage is not ownership, customer, service, commercial availability or rights.
- One exact binding is required for Port/Fiber identity. Occupancy, Fiber use and physical color stay independent. Unknown is not unused; unused is not available.
- Preserve 37 Cables, 2,088 Fibers, 1,629 active transitions, 48 Lentekhi bindings, 192 Tsageri Ports and zero C148 Port bindings. Verify the 45 authoritative JSON hashes and six complete derived projection hashes against the delivered baseline; counts alone are insufficient.
- Frozen V1 manifest SHA-256: `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.
- Retain 28J's stable AP context, real rail scrolling, occupancy correction, partial-route display and animation controls. Retain the 28I/28J startup gains; do not reconstruct resolvers/projections for every displayed row.
- Preserve source evidence and review history. No field-verification or production-readiness claim follows from this presentation extension.

