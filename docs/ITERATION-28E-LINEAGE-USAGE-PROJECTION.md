# Iteration 28E — Lineage-wide operational-use projection

## Model

The source records where a label or style occurs. The derived view answers what is known about the same logical strand along its current exact path. The projection uses the 28C resolver and its topology revision. It never changes `NodeFiberTransition`, `PortTopologyBinding`, Cable identity, Fiber physical color, Tube color, Port occupancy, rights, services, or commercial availability.

`FiberUsageProjection` holds the source line observations, logical claims, current local-leg views, and review cases. A claim retains the originating C/F, source line Shape, company label Shapes and occurrence IDs, status, organization, purpose, evidence basis, topology revision, path signature, every projected local leg, and where traversal stopped. Claims are scoped by exact Fiber; they do not expand to an entire Cable.

The path walker accepts only active exact node transitions and certified endpoint Port bindings. It follows a number, Tube, or physical-color remap only when the graph carries that mapping. It stops at the first unresolved/ambiguous transition, explicit termination, source gap, or unlinked external boundary. A Port is retained as the endpoint when the exact 28D binding exists.

## Demonstrations from this source

### Company label at a local Fiber endpoint

Shape 17536 is the Magti label attached to C148/F20. The derived current view carries Magti on the exact known legs of that strand. Selecting any such Cable/Fiber leg shows the same usage and keeps Shape 17536 as the origin evidence. It does not relocate the label in the source inspector or imply a customer circuit, ownership, rights, service, or SLA.

### Fiber-number remap

The 28C golden path for C161/F11 includes C164/F23. The 28E view remains keyed to the exact resolver path, not the starting number. Source claims stay attached to their local evidence, and a claim that is present on that path is exposed at its mapped C164/F23 leg.

### Owner-confirmed use styles

- Blue `#0000FF`, Pattern 1 maps to `unused`; allocation, availability, and condition remain unknown.
- Green `#00B050` or `#009945`, Pattern 1 maps to OpenNet `in_use` with internal purpose. Four exact green/OTDR attachments add the OTDR purpose and preserve their OTDR text Shape IDs.
- Red `#FF0000`, Pattern 1 maps to `in_use`; exact company labels populate the organization. Unnamed strands remain organization unknown and appear in the enrichment queue.
- Red `#FF0000`, Pattern 2 maps only to review required. Each source occurrence remains separate.

### Conflicts and selection from any point

Four local conflicts are visible as review-required views. The Inspector reads the local view and its preserved origin Shapes, so a company claim found near one endpoint appears from each exact leg that the current path proves. It includes the original source location in the collapsed evidence area. Cable cards group the count of used, unused, and review-required Fibers; selecting a Fiber opens the same path and usage evidence.

## Current totals

The generated projection covers all 2,088 local Fiber records: 306 in use, 1,431 unused, 17 review required, and 334 unknown. Current known logical path groups include 38 in-use claims, 301 unused claims, and two review-required claims. Counts are derived from the current source and may change with evidence; none is frozen as a target.

Full per-claim/per-leg data is in `migration/iteration28e/fiber-lineage-usage.json`. The review queue is append-only and separate from source evidence at `migration/iteration28e/review-queue.json`. Regenerate after the line grammar or topology revision changes; stale topology revisions fail validation.
