# Iteration 28F — Aggregation Operational Projection

This deterministic, revision-bound view is derived from the active 28E Fiber usage projection, current 28C path resolver and exact PortTopologyBinding records. It stores no new topology, Port binding, or occupancy facts.

## Coverage

| Aggregation | Cable Segments | Fibers | In use | Unused | Review | Unknown | Exact Port bindings | Exact Port unknown |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| ცაგერი (5) | C148 | 192 | 33 | 156 | 3 | 0 | 0 | 192 |
| ლენტეხის აგრეგაცია (AGG-LENTEKHI) | C184 | 48 | 12 | 14 | 0 | 22 | 48 | 0 |

### Tsageri

The ODF has 192 logical Ports and C148 has 192 local Fiber usage rows. There are zero exact C148 per-Port bindings in current source evidence. Port occupancy is unknown independently for all C148 Fibers. Company use, line style and same-number conventions do not create a Port binding. Fiber use remains visible: {"Magti":4,"OpenNet":17,"Silknet":2}.

### Lentekhi

C184 has 48 source-supported exact Port↔Fiber bindings. Port occupancy remains unknown independently for all 48 bindings. Fiber usage on C184 is {"in_use":12,"unused":14,"review_required":0,"unknown":22}; organization counts are {"Magti":2,"OpenNet":5,"Silknet":2,"Skytel":3}. The path column comes from exact 28C transitions and may terminate at an AP, Closure, or another Aggregation; Cable Route order does not extend it.

## Display rules

- Fiber use (in_use / unused / review_required / unknown), Port binding, and Port occupancy remain independent.
- Unknown binding is shown as “პორტის ზუსტი მიბმა წყაროდან არ არის დადგენილი”. Unknown occupancy is shown separately.
- Tube and physical Fiber color come from decoded local construction.
- Cable, path endpoint and organization context are derived and revision-bound.
- No Port, availability, service, customer, ownership, rights, or occupancy is inferred from line style or organization use.

Projection revision: `canonical-active-fiber-path/1/e7d1e8bcb8c747e2`.
