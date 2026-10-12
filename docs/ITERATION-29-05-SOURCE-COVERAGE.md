# Iteration 29-05 — importer and cross-document source coverage

Updated 2026-10-05. This report describes evidence from the two reviewed VSDX source packages and the importer regressions currently exercised. It does not certify a new drawing family or claim universal Visio support.

## Support matrix

| Coverage layer | Source A: Tsageri–Lentekhi | Source B: Tsageri–Alpana–Tvishi |
|---|---|---|
| Package and extraction | Original VSDX SHA `caae4bad…b34a6fa`; 41 package parts, 1 page, hierarchy, Connect rows, masters/styles, comments, text and transformed geometry retained. See [Iteration 24 certification](ITERATION-24-VSDX-IMPORTER-CERTIFICATION.md). | Source SHA `419def34…11dd6d`; 40 package parts, 311 valid Connect rows, 0 dangling. See [Iteration 27D certification](ITERATION-27-TSAGERI-ALPANA-TVISHI-CERTIFICATION.md). |
| Source grammar and marker accounting | Historical Iteration 24 extraction: 20 exact Cable labels; 2,208 Fiber-marker and 98 Tube-marker candidates; 384 Port marker evidence records; 838 exact source transitions and 192 logical Port bindings. These are extraction-stage counts, not an exhaustive current-network completeness claim. | 22 Cable labels; 42 marker groups and 2,928 unique Fiber marker Shapes; 1,512 source Fiber positions; 775 exact source transitions. |
| Current Port enrichment | Source A bindings remain active with their exact evidence. | [Iteration 28D certification](ITERATION-28D-SOURCE-B-AP-PORT-GRAMMAR.md) adds 192 active Ports/bindings for AP42–49. The 216 source Port/binding representations also include AP41 overlap. Additional Source B C172-to-AP44 correspondence remains unresolved; C157's AP44 bank is certified. |
| Connector dispositions | Historical certified source comparison reproduced 838 transitions. Current combined graph has 1,631 active records, including the two scoped SC217 additions; the comparison is not proof of exhaustive current-source completeness. Focused SC217 audit separately evaluates F10–F12 attachments. | 1,151 detected transition candidates: 775 exact transitions and 376 overlap evidence rows; 0 unexplained, rejected, ambiguous, or inferred-termination dispositions in the certified ledger. |
| Cross-document identity | Source A is independently reviewed; its own cable identities and SC217 remaps are source-specific. | Shared canonical assets C148–C151 and C169 are reconciled with Source A. C151 construction matches at 144/144 positions; 143 C151↔C152 transitions join at neutral Node 207; F118 remains a boundary gap. Source B C172 remains a distinct source-scoped identity. |
| Repeat import / revisions | Inbox importer uses content hashes and stages candidates without changing the active catalog. Python regressions cover valid/corrupt packages, identical hash, same-name changed content, stable files and locked scans (`tests/test_import_inbox.py`). | Same inbox behavior applies; no source-specific evidence upgrades an unreviewed revision to active topology. |
| Held-out source family | Not tested. | Not tested. |

## SC217 endpoint regression

`scripts/audit-iteration28l-sc217.py` uses the shared `scripts/marker_geometry.py` predicate with source local ellipse bounds and the complete local-to-page affine transform. The predicate inverts that transform before testing containment. World bounding boxes are never substituted for a rotated ellipse. The checked source audit records:

| Connector Shape | Local pair | Endpoint ellipse hits | Old center tolerance | Visio Connect rows |
|---|---|---:|---|---:|
| 34070 | C171/F10 ↔ C172/F10 | 1, 1 | missed | 0 |
| 34071 | C171/F11 ↔ C172/F11 | 1, 1 | matched | 0 |
| 34072 | C171/F12 ↔ C172/F12 | 1, 1 | missed | 0 |

The regression suite asserts these observed pairs, unique hit counts, absent Connect rows, and the old-tolerance contrast. It also runs the real audit generator and verifies byte-identical audit and scoped-correction outputs. Containment tests exercise the review's rotated non-circular counterexample and a composed nested transform with rotation, unequal scale and flips. Geometry unit tests cover the exact ellipse edge, outside points and ambiguous double hits. The matching helper returns all hits; unsupported/missing/singular transforms raise an explicit unsupported-geometry error rather than becoming no-hit. The caller must first identify a genuine ellipse marker through the source grammar. This evidence does not certify arbitrary Visio shape families.

The scoped F10/F12 correction records remain source-specific. F11 is the unchanged control. Owner endpoint context is recorded separately from exact geometry evidence; it is not treated as an owner-verified local Fiber mapping.

## Cross-document and revision gates

Existing importer/domain suites cover:

- verified overlap reconciliation while retaining source representations;
- same display label C172 with distinct source-scoped identities;
- remapped local Fiber transitions and no route-adjacency optical edges;
- unresolved Node 207 / C151-F118 boundary;
- source hash re-import and changed-content revision staging;
- immutable frozen V1 reference and deterministic active projection.

Evidence lives in `tests/iteration27c-source-b.test.ts`, `tests/iteration27d-topology-activation.test.ts`, `tests/import.test.ts`, `tests/test_import_inbox.py`, and the two source certification reports above. These are reviewed-source and synthetic contract regressions, not evidence from a third real Visio.

## Remaining support limits

- No previously unreviewed real VSDX drawing family was available for a held-out acceptance test.
- A detected-feature ledger accounts for features found by the interpreter; it cannot prove that the source grammar detector found every relevant feature.
- Source B AP42–49 exact Port bindings are certified by 28D; AP41 overlap is retained separately. Additional C172-to-AP44 correspondence remains unresolved. AP47 Port3 occupancy is unknown; exact binding and occupancy are separate facts.
- New source revisions remain staged until their package, grammar, marker attachments, connector dispositions and cross-document identity are reviewed independently.
- Do not advertise universal Visio support. The current evidence supports the two reviewed source packages plus the listed synthetic regressions only.
