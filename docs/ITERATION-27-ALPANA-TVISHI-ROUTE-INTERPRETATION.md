# Iteration 27 — Alpana–Tvishi source interpretation

**State: independently interpreted physical/Fiber evidence candidate; no combined route or Fiber continuity has been activated.** Source B was interpreted from its own extracted Visio package. Frozen V1 evidence was consulted only after its Cable labels, marker banks and local connector edges had been generated.

## Literal cable labels

The source contains 22 shapes matching the legacy four-field cable-label form. The labels below are preserved exactly. Capacity and endpoint tokens are syntactic fields from the label; they do not on their own prove a splice or optical transition.

| Source label | Source-scoped alias | Capacity | Endpoint tokens | Source Shape |
|---|---|---:|---|---:|
| `148-5-205-192` | C148 | 192F | 5 ↔ 205 | 15769 |
| `149-205-41-24` | C149 | 24F | 205 ↔ 41 | 14250 |
| `150-205-206-192` | C150 | 192F | 205 ↔ 206 | 15770 |
| `151-206-207-144` | C151 | 144F | 206 ↔ 207 | 15772 |
| `152-207-208-144` | C152 | 144F | 207 ↔ 208 | 15775 |
| `153-208-42-24` | C153 | 24F | 208 ↔ 42 | 23959 |
| `154-208-209-144` | C154 | 144F | 208 ↔ 209 | 15830 |
| `155-209-43-24` | C155 | 24F | 209 ↔ 43 | 24228 |
| `156-209-210-96` | C156 | 96F | 209 ↔ 210 | 15831 |
| `157-210-44-24` | C157 | 24F | 210 ↔ 44 | 25557 |
| `158-210-211-96` | C158 | 96F | 210 ↔ 211 | 15833 |
| `159-211-45-24` | C159 | 24F | 211 ↔ 45 | 27662 |
| `160-211-46-24` | C160 | 24F | 211 ↔ 46 | 25540 |
| `161-211-212-72` | C161 | 72F | 211 ↔ 212 | 15836 |
| `162-212-47-24` | C162 | 24F | 212 ↔ 47 | 28681 |
| `164-212-213-48` | C164 | 48F | 212 ↔ 213 | 15839 |
| `165-213-48-24` | C165 | 24F | 213 ↔ 48 | 28976 |
| `166-213-214-48` | C166 | 48F | 213 ↔ 214 | 15842 |
| `167-214-215-48` | C167 | 48F | 214 ↔ 215 | 15843 |
| `168-215-49-24` | C168 | 24F | 215 ↔ 49 | 31115 |
| `169-206-216-48` | C169 | 48F | 206 ↔ 216 | 34056 |
| `172-225-44-24` | C172 | 24F | 225 ↔ 44 | 26843 |

Every row retains its source Shape, raw text, world bounds, page, and group context in `migration/iteration27/source-interpretation.json`. Cable IDs remain source-scoped until reconciliation is exact.

## Marker construction and local transition candidates

The source grammar finds 42 capacity-sized marker-bank groups with 2,928 unique marker Shapes. Effective inner marker fills and repeated local ring colors produce physical Fiber/Tube candidates. Connect rows and connector endpoints aligned to those marker positions produce 1,151 node-local transition candidates at SC205–SC215. Each edge is tied to an explicit shared endpoint token; Cable Route adjacency and equal Fiber number are not edge generators. The full per-edge source Shape/marker evidence is retained in `migration/iteration27/source-interpretation.json`.

Cross-document validation reproduces all tested local transition pairs at SC205 (16 C148↔C149, 174 C148↔C150, 6 C149↔C150) and SC206 (132 C150↔C151, 48 C150↔C169). Additional B-source branch matrices are SC207 C151↔C152 (143), SC208 C152↔C153 (24) / C152↔C154 (108), SC209 C154↔C155 (18) / C154↔C156 (90) / C155↔C156 (6), SC210 C156↔C157 (12) / C156↔C158 (84) / C157↔C158 (12), SC211 C158↔C159 (14) / C158↔C160 (18) / C158↔C161 (64) / C159↔C160 (2) / C159↔C161 (8), SC212 C161↔C162 (11) / C161↔C164 (23) / C162↔C164 (8), SC213 C164↔C165 (12) / C164↔C166 (36) / C165↔C166 (12), SC214 C166↔C167 (46), and SC215 C167↔C168 (24). These are candidate interpretations pending complete source-specific review and are not active FiberLineages.

The five duplicated Cable construction comparisons show exact per-position agreement for C149 (24F), C150 (192F), C151 (144F), and C169 (48F). C148 has matching Fiber colors at all 192 positions and its tested SC205 transition pairs match V1, but the two B-source marker banks show a Tube-color conflict at F121–F192 (72 positions): both banks agree with each other, and both differ from V1. Preserve it as `source_conflict` pending resolution. C169's 48-position row-by-row comparison is linked in `docs/ITERATION-27-C169-FIBER-CROSS-VALIDATION.md`.

## Named place, route, and annotation text

- Shape 12427 contains `Aagregacia #5` and `cageri`, a source spelling/context candidate associated with the aggregation area. It is not normalized into the V1 aggregation identity yet.
- Shape 40991 preserves the exact direction label `ლენტეხი-ხელედის მიმართულება`. Its rendered bounds are retained. The wording is a direction annotation and creates no Fiber transition.
- The page includes `ალპანა` (Shape 28663) and `ტვიში` (Shape 30980), plus labels for Орбელი/ორბელი, ლაჯანა, გაგულეჩი, ლაილაში, სურმუში, აჭარა, ჩხუტელი and Magti/OpenNet/Silknet/Skytel text. These are preserved as source text candidates; company assignments and exact route scopes have not been interpreted.
- Additional visible source notes include `გაიჭრას #8 მოდული`, `გაიჭრას #4 მოდული`, `გადასვლა ქურო N162-ში`, `გაიჭრას #11 #12 მოდული`, `ODF-ში არეულია I და II თარო 1-12 ნარინჯისფერია, 13-24 ლურჯი`, and `FO-` capacity labels. Their operational status/scope remains unclassified.

## Assets and topology coverage

The cable labels expose endpoint-number candidates spanning 5 and closures 205–216 and 225, together with AP-like endpoint tokens 41–49. Marker construction and connector-based transition candidates are now decoded, but endpoint asset classes and complete Port/ODF occupancy are not yet certified. Company-label alignment and annotation scope/status also remain open. These gaps prevent a final inventory, active route, or end-to-end Fiber journey from being promoted.

The extract also preserves the exact B-source copies of C148–C151 and C169, as well as a continuation candidate `152-207-208-144` beyond the V1 boundary context. This is a physical-document overlap observation only; no fake splice is created at a source-document edge.

## Iteration 27B final status

The document contains 22 Cable label candidates and 11 transition-bearing node tokens (SC205–SC215), with an additional endpoint token 216 on C169 and source label context at 225. Its complete asset classes, AP/ODF Ports, route directions, and boundary semantics are not certified. The 376 SC205/SC206 pairs that reproduce V1 are candidate duplicate evidence; the other 775 candidates remain undisposed. No combined route is active. Source B is **NOT CERTIFIED** and stays staged; see [the semantic reconciliation report](ITERATION-27B-SOURCE-B-SEMANTIC-RECONCILIATION.md).
