# Iteration 27C — Source B transition audit

**Local transition accounting: 1,151/1,151. Network certification: NOT CERTIFIED; activation withheld.**

Source SHA-256: 419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d. Frozen V1 manifest: 59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125.

## Connector grammar

A local Fiber edge is accepted from an individual, text-free Shape whose two geometric endpoints each align to exactly one decoded Fiber marker. Every row retains the exact connector Shape, marker Shape IDs, local Fiber/Tube/color identities, geometry operations, and evidence basis. 575 connectors have a simple MoveTo/LineTo path; 200 have more complex geometry, preserved per row. Connect rows are supporting attachment evidence only. Cable route order, equal Fiber number, and color never create an edge.

All 775 previously unreviewed connectors have 1,550/1,550 unique endpoint-to-marker matches. No connector Shape is reused across candidate pairs. This resolves the local marker-to-marker transition evidence; it does not identify closure entities by token alone or resolve Port/company semantics.

## Accounting

| Disposition | Count |
|---|---:|
| exact source transition | 775 |
| duplicate overlap evidence | 376 |
| intentional termination | 0 inferred |
| rejected non-topological | 0 among transition candidates |
| genuinely ambiguous | 0 |
| unexplained | 0 |
| **Total** | **1,151** |

## Node relationship matrices

| Node | Segment relation | Count | Exact | Duplicate | Nonidentity Fiber maps | Tube/color changes | Example |
|---|---|---:|---:|---:|---:|---:|---|
| SC205 | C148 ↔ C149 | 16 | 0 | 16 | 16 | 16/16 | F129→F1, F130→F2, F131→F3 |
| SC205 | C148 ↔ C150 | 174 | 0 | 174 | 0 | 0/0 | F1→F1, F2→F2, F3→F3 |
| SC205 | C149 ↔ C150 | 6 | 0 | 6 | 6 | 6/6 | F17→F127, F18→F128, F19→F129 |
| SC206 | C150 ↔ C151 | 132 | 0 | 132 | 0 | 0/0 | F1→F1, F2→F2, F3→F3 |
| SC206 | C150 ↔ C169 | 48 | 0 | 48 | 48 | 48/0 | F145→F1, F146→F2, F147→F3 |
| SC207 | C151 ↔ C152 | 143 | 143 | 0 | 0 | 0/0 | F1→F1, F2→F2, F3→F3 |
| SC208 | C152 ↔ C153 | 24 | 24 | 0 | 24 | 24/24 | F103→F1, F104→F2, F105→F3 |
| SC208 | C152 ↔ C154 | 108 | 108 | 0 | 6 | 6/0 | F1→F1, F2→F2, F3→F3 |
| SC209 | C154 ↔ C155 | 18 | 18 | 0 | 18 | 18/0 | F85→F1, F86→F2, F87→F3 |
| SC209 | C154 ↔ C156 | 90 | 90 | 0 | 10 | 10/10 | F1→F1, F2→F2, F3→F3 |
| SC209 | C155 ↔ C156 | 6 | 6 | 0 | 6 | 6/2 | F19→F95, F20→F96, F21→F81 |
| SC210 | C156 ↔ C157 | 12 | 12 | 0 | 12 | 12/0 | F85→F1, F86→F2, F87→F3 |
| SC210 | C156 ↔ C158 | 84 | 84 | 0 | 0 | 0/0 | F1→F1, F2→F2, F3→F3 |
| SC210 | C157 ↔ C158 | 12 | 12 | 0 | 12 | 12/0 | F13→F85, F14→F86, F15→F87 |
| SC211 | C158 ↔ C159 | 14 | 14 | 0 | 14 | 14/14 | F65→F1, F66→F2, F67→F3 |
| SC211 | C158 ↔ C160 | 18 | 18 | 0 | 18 | 18/18 | F69→F1, F70→F2, F71→F3 |
| SC211 | C158 ↔ C161 | 64 | 64 | 0 | 0 | 0/0 | F1→F1, F2→F2, F3→F3 |
| SC211 | C159 ↔ C160 | 2 | 2 | 0 | 2 | 0/2 | F23→F19, F24→F20 |
| SC211 | C159 ↔ C161 | 8 | 8 | 0 | 8 | 8/8 | F15→F65, F16→F66, F17→F67 |
| SC212 | C161 ↔ C162 | 11 | 11 | 0 | 11 | 11/0 | F61→F1, F62→F2, F63→F3 |
| SC212 | C161 ↔ C164 | 23 | 23 | 0 | 15 | 15/4 | F1→F13, F2→F14, F3→F15 |
| SC212 | C162 ↔ C164 | 8 | 8 | 0 | 8 | 8/8 | F13→F41, F14→F42, F15→F43 |
| SC213 | C164 ↔ C165 | 12 | 12 | 0 | 12 | 12/0 | F37→F1, F38→F2, F39→F3 |
| SC213 | C164 ↔ C166 | 36 | 36 | 0 | 0 | 0/0 | F1→F1, F2→F2, F3→F3 |
| SC213 | C165 ↔ C166 | 12 | 12 | 0 | 12 | 12/0 | F13→F37, F14→F38, F15→F39 |
| SC214 | C166 ↔ C167 | 46 | 46 | 0 | 0 | 0/0 | F1→F1, F2→F2, F3→F3 |
| SC215 | C167 ↔ C168 | 24 | 24 | 0 | 24 | 24/0 | F13→F1, F14→F2, F15→F3 |

Every listed relation is backed by individual rows in migration/iteration27/source-b-transition-ledger.json. No range formula is used to add edges.

## Source-local Fiber graph and journey coverage

The transition-only graph contains 1512 Fiber positions, 361 connected components, and 1512 JourneySummary rows. All summaries are partial because endpoint assets and external boundaries have not all been semantically classified. The graph uses only node-local transition edges.

## SC207 local and document-boundary result

Source B contains 143 exact local C151↔C152 transitions. It has no literal SC207 text label; 207 occurs only as a shared Cable endpoint token. C151 construction agrees with V1 at all 144 positions, and its SC206 transition set is cross-validated. The physical Cable correspondence is exact; canonical Closure identity and boundary-link activation remain withheld. C151 has 144 positions but 143 drawn connectors at this node; the remaining fiber is not asserted to be an intentional termination.

## Preserved conflict and certification

C148 Tube-color conflict at F121–F192 remains recorded separately from physical Fiber identity. The frozen V1 manifest is byte-identical. Source B remains candidate/not active because asset, Port/ODF, company, annotation, and Closure/boundary gates still fail.
