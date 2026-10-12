# Iteration 28F — Organization Network Search

Organization search projects exact network-use claims through the active 28E Fiber usage claims and current 28C Fiber paths. It does not make organization-to-Cable/AP/Port/Aggregation/Closure relationships into stored topology facts.

## Results

| Organization | Logical strand groups | Unique local Fiber legs | Cables | Exact APs / Port bindings | Aggregations reached | Source label occurrences | Example exact path legs |
|---|---:|---:|---:|---:|---:|---:|---|
| OpenNet | 17 | 154 | 25 | 4 / 13 | 2 | 20 | C148/F1 → C150/F1 → C151/F1 → C152/F1 → C154/F1 → C156/F1 → C158/F1 → C161/F1 → C164/F13 → C166/F13 → C167/F13 → C168/F1 |
| Magti | 4 | 40 | 18 | 0 / 2 | 2 | 16 | C148/F20 → C150/F20 → C151/F20 → C152/F20 → C154/F20 → C156/F20 → C158/F20 → C161/F20 |
| Silknet | 4 | 28 | 12 | 0 / 2 | 2 | 11 | C184/F10 → C180/F10 → C179/F10 → C178/F10 → C177/F10 → C176/F10 → C174/F10 → C172/F10 |
| Skytel | 4 | 18 | 14 | 1 / 5 | 2 | 8 | C183/F3 → C181/F3 → C184/F35 |

Aliases are exact: Magti / მაგთი; OpenNet / Open Net / ოპენნეტი; Silknet / სილქნეტი; Skytel / სკაიტელი. Approximate names are not matched. The 28E review/conflict queue currently contains 229 cases; review claims stay visible as review-required and are not promoted to green/authoritative use.

## Evidence and path semantics

A source organization label is local evidence. The projection keeps its source occurrence IDs, original label Shape IDs, source line Shape IDs, usage claim IDs, exact local Fiber legs and path signatures. Each resulting Cable, AP, Port, Aggregation and Closure entry is derived from those exact Fiber legs and current exact transitions/PortTopologyBinding. A Closure is described as a Fiber path passing through it; the organization does not own the Closure. AP/Port results require exact PortTopologyBinding. Aggregation results require an exact endpoint or current resolved path.

A source/owner observation remains direct evidence; propagated legs and endpoints are derived context. Unknown Port, occupancy, purpose and path continuation remain explicit. Organization Fiber use does not imply ownership, service, customer, billing, or rights/IRU.

## Query catalog

1. `Magti`
2. `მაგთი`
3. `Magti რომელ კაბელებს იყენებს?`
4. `Magti რომელ Fiber-ებს იყენებს?`
5. `Magti რომელ აგრეგაციაზეა?`
6. `Magti რომელ პორტზეა?`
7. `OpenNet`
8. `OpenNet OTDR`
9. `Silknet`
10. `Skytel`
11. `Tsageri Aggregation-ზე ვინ იყენებს Fiber-ებს?`
12. `Lentekhi Aggregation-ზე რომელი Port/Fiber გამოიყენება?`
13. `C158-ს ვინ იყენებს?`
14. `SC211-ში რომელი ორგანიზაციების Fiber-ები გადის?`

Projection revision: `canonical-active-fiber-path/1/e7d1e8bcb8c747e2`.
