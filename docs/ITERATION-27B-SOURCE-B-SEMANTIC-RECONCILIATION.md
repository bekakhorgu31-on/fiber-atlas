# Iteration 27B — Source B semantic reconciliation

## Certification decision

# NOT CERTIFIED

Source B remains staged. The package/extraction gate passes, but the semantic and promotion gates do not. No Source B canonical asset, Route, FiberLineage, Port binding, company assignment, or topology edge is activated. The frozen V1 manifest remains unchanged.

## Source identity and package gate

- `Tsageri-Alpana-Tvishi.vsdx` — SHA-256 `419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d`.
- Package gate: PASS; 40 package parts, 1 page, 9,707 Shapes, 311/311 valid Connect rows, and zero unresolved effective colors.
- Source labels: 22 candidate Cable Segments; capacities total 1,512 fiber positions. 42 marker-bank groups contain 2,928 marker Shapes.
- Endpoint-number tokens remain source candidates; they are not used alone to assign Closure/AP/Aggregation identity.

## Cross-document correspondences and conflicts

| Object | Evidence | Decision |
|---|---|---|
| SC205 | Exact identity context; all tested local pairs reproduce V1 | Candidate correspondence only; not activated |
| SC206 | Exact identity context; all tested local pairs reproduce V1 | Candidate correspondence only; not activated |
| C149/C150/C151 | Construction agrees at all 24/192/144 positions | Candidate correspondence only; not activated |
| C169 | Exact label/endpoints; 48/48 Fiber, Tube and SC206 transition rows agree with V1 | Golden correspondence candidate; one physical identity is intended only after atomic promotion |
| C148 | Same 192F label/context, all Fiber colors and tested SC205 mappings agree; Tube colors differ at F121–F192 | Keep physical identity as a candidate separate from the preserved 72-position Tube-color source conflict; do not overwrite V1 |
| Tsageri Aggregation/ODF | Shape 12427 and C148/SC205 context are present | Strong candidate; Port-bank and ODF representation audit incomplete |
| SC207/C151 | Source B has 143 C151↔C152 transition candidates at token 207 | Boundary remains unresolved until Closure/connector semantics are reviewed |

These states are cross-document evidence, not field verification. No canonical mapping or duplicate Fiber suppression has been activated.

## Cable, node, and transition candidate audit

The source interpreter generated 1,151 local transition candidates across 11 node tokens. The 376 SC205/SC206 pairs reproduce V1 and are classified as duplicate cross-document evidence (not separately activated). The other **775** candidates still lack an explicit semantic disposition. Route adjacency and equal Fiber number do not create edges; source connector grammar and marker alignment still require review for the remaining groups.

| Node | Segment relationship | Candidate pairs | Cross-validated duplicate evidence | Active exact | Disposition |
|---|---|---:|---:|---:|---|
| SC205 | C148 ↔ C149 | 16 | 16 | 0 | duplicate_overlap_evidence |
| SC205 | C148 ↔ C150 | 174 | 174 | 0 | duplicate_overlap_evidence |
| SC205 | C149 ↔ C150 | 6 | 6 | 0 | duplicate_overlap_evidence |
| SC206 | C150 ↔ C151 | 132 | 132 | 0 | duplicate_overlap_evidence |
| SC206 | C150 ↔ C169 | 48 | 48 | 0 | duplicate_overlap_evidence |
| SC207 | C151 ↔ C152 | 143 | 0 | 0 | not_semantically_reviewed |
| SC208 | C152 ↔ C153 | 24 | 0 | 0 | not_semantically_reviewed |
| SC208 | C152 ↔ C154 | 108 | 0 | 0 | not_semantically_reviewed |
| SC209 | C154 ↔ C155 | 18 | 0 | 0 | not_semantically_reviewed |
| SC209 | C154 ↔ C156 | 90 | 0 | 0 | not_semantically_reviewed |
| SC209 | C155 ↔ C156 | 6 | 0 | 0 | not_semantically_reviewed |
| SC210 | C156 ↔ C157 | 12 | 0 | 0 | not_semantically_reviewed |
| SC210 | C156 ↔ C158 | 84 | 0 | 0 | not_semantically_reviewed |
| SC210 | C157 ↔ C158 | 12 | 0 | 0 | not_semantically_reviewed |
| SC211 | C158 ↔ C159 | 14 | 0 | 0 | not_semantically_reviewed |
| SC211 | C158 ↔ C160 | 18 | 0 | 0 | not_semantically_reviewed |
| SC211 | C158 ↔ C161 | 64 | 0 | 0 | not_semantically_reviewed |
| SC211 | C159 ↔ C160 | 2 | 0 | 0 | not_semantically_reviewed |
| SC211 | C159 ↔ C161 | 8 | 0 | 0 | not_semantically_reviewed |
| SC212 | C161 ↔ C162 | 11 | 0 | 0 | not_semantically_reviewed |
| SC212 | C161 ↔ C164 | 23 | 0 | 0 | not_semantically_reviewed |
| SC212 | C162 ↔ C164 | 8 | 0 | 0 | not_semantically_reviewed |
| SC213 | C164 ↔ C165 | 12 | 0 | 0 | not_semantically_reviewed |
| SC213 | C164 ↔ C166 | 36 | 0 | 0 | not_semantically_reviewed |
| SC213 | C165 ↔ C166 | 12 | 0 | 0 | not_semantically_reviewed |
| SC214 | C166 ↔ C167 | 46 | 0 | 0 | not_semantically_reviewed |
| SC215 | C167 ↔ C168 | 24 | 0 | 0 | not_semantically_reviewed |

Node totals: SC205: 196; SC206: 180; SC207: 143; SC208: 132; SC209: 114; SC210: 108; SC211: 106; SC212: 42; SC213: 60; SC214: 46; SC215: 24.

## Text, company, Port, and annotation accounting

All 3,569 nonempty direct-text Shapes are assigned to broad lexical buckets by the deterministic audit. This is inventory accounting, not semantic certification:

| Text category | Shape occurrences |
|---|---:|
| Aggregation/ODF note | 2 |
| Cable label | 22 |
| Capacity note | 42 |
| Company label | 24 |
| Cut/module note | 3 |
| Numeric/layout text | 3463 |
| Place/other text | 9 |
| Route/direction note | 2 |
| Technical note | 2 |

Company occurrences are located but not assigned: Magti: 10; OpenNet (Georgian label): 8; Silknet: 5; Skytel: 1; total 24. Each occurrence's raw label, Shape ID, rotation, world bounds, group ancestry, direct Connect rows, and nearest transition-marker positions are retained as non-inferential context in the machine-readable audit. The three cut/module notes (Shapes 33340, 33349 and 14985) are not classified as planned or completed. The ODF shelf-order note (Shape 41051), OTDR notes, capacity labels, place labels, and direction notes have not all been tied to a certified asset, route, Port, or Fiber range. Numbered Port graphics, mirrored banks, occupancy, and Port-to-Fiber bindings are not inventoried to a certifiable result.

The exact `ლენტეხი-ხელედის მიმართულება` text at Shape 40991 is preserved as direction context, not a Fiber edge. Other place/direction texts include Alpana (28663), Tvishi (30980), and the Ambrolauri direction phrase (33691); their physical route scope remains unverified.

## Critical certification blockers

1. 775 transitions outside the exact SC205/SC206 overlap remain without a disposition; the transition ambiguity gate is therefore undetermined.
2. Source B Port/ODF numbered graphics, mirrored representations, status convention, and Port↔Fiber binding have no complete independent inventory.
3. The 24 company occurrences have no verified assignment or duplicate/annotation classification.
4. The three cut/module notes are not proven planned versus completed; their physical meaning remains unresolved.
5. The full Aggregation, Closure, AP, route branch, and external-boundary inventory is not semantically reconciled. In particular SC207 has 143 candidate pairs but no certified boundary promotion.

The C148 attribute conflict is fully preserved as six source-specific ranges, with no source selected and no V1 overwrite. It is not treated as evidence of a different physical Cable by itself.

## Gate result and integrity

Package gate: **PASS**. Semantic certification: **NOT CERTIFIED**. Activation: **WITHHELD**. The machine-readable audit is `migration/iteration27/semantic-audit.json`; the complete candidate edge and source evidence remains in `migration/iteration27/source-interpretation.json`.

Frozen V1 manifest SHA-256: `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`. Source interpretation SHA-256: `01abbcdc0827d972c0cc0c2272ef934d35cf81c43e594ac6b0e3dbf6b0c62ae3`.


## Iteration 27C superseding transition update

The 775 rows described above were unreviewed at the 27B snapshot. Iteration 27C individually validated all 775 from unique connector-to-marker geometry. Together with 376 overlap rows, 1,151/1,151 dispositions are now accounted with zero unexplained candidates. The 27B status remains a historical snapshot; current decision and exact remaining blockers are in docs/ITERATION-27-TSAGERI-ALPANA-TVISHI-CERTIFICATION.md and the four 27C reports. Asset/Port, company, annotation, and SC207 Closure identity gates remain open.
