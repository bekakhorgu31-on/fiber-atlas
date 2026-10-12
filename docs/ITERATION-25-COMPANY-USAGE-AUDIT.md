# Iteration 25 — Company Usage Audit

## Reconciliation

| Company | Raw occurrences | Exact logical assignments |
|---|---:|---:|
| OpenNet | 12 | 4 |
| Magti | 6 | 2 |
| Silknet | 6 | 3 |
| Skytel | 7 | 4 |
| **Total** | **31** | **13** |

The decoder uses text on the line Shape, its world Begin/End coordinates, and exact Fiber-marker alignment. Nearby labels or colors alone never create an assignment. Repeated labels on one connected optical component are deduplicated after applying the certified node-transition graph; all source Shape IDs remain attached.

## Exact assignments

- OpenNet: components containing C148/F145–F148, C150/F145–F148, C169/F01–F04 and C184/F01–F04.
- Magti: components containing C148/F149 and F152, C150/F149 and F152, C169/F05 and F08, and C184/F05 and F08.
- Silknet: components containing C148/F154–F155, C150/F154–F155, C169/F10–F11, plus C184/F10 and F11 according to the exact source lines.
- Skytel: components containing C148/F156, C150/F156, C169/F12; C184/F12; and two components containing C184/F35→C183/F03 and C184/F36→C183/F04.

The last two Skytel AP-side occurrences terminate at the AP54 graphic boundary. They support usage on C183/F03 and F04, not an inferred AP internal splice or service.

## Policy

`NetworkUseAssignment` records usage only. Every record explicitly sets ownership, rights and service inference to false. Physical Port occupancy, administrative allocation, commercial availability and company use remain separate dimensions.

The machine-readable audit is `src/data/iteration25-company-usage.json`; its generator is `scripts/interpret-iteration25-source.py`.

