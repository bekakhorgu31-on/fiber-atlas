# Iteration 28E — Source B Fiber usage line grammar

## Result

Source B usage is now read from effective Visio line style, joined to exact numbered Fiber markers, and kept separate from marker fill (physical Fiber color), Tube ring color, Port fill, and optical connectivity. The grammar is `tsageri-alpana-tvishi-fiber-usage-line/1`, bound to source SHA-256 `419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d`.

The 9,707-shape source page contains 3,092 colored one-dimensional line geometries. All have a disposition: 2,603 blue solid unused, 230 green solid OpenNet (including four OTDR cases), 222 red solid in use (30 with exact organization and 192 organization unknown), 28 red dashed review cases, five Fiber-association ambiguities, and four rejected non-Fiber graphics. No candidate line remains unexplained and no attached line has an unrecognized style.

## Owner-confirmed source style

| Effective RGB | Visio LinePattern | Result | Source count |
|---|---:|---|---:|
| `#0000FF` | 1 | Unused; allocation, availability, and condition remain unknown | 2,608 line Shapes; five association cases remain unprojected |
| `#00B050` | 1 | In use by OpenNet; internal unless exact OTDR text is attached | 155 |
| `#009945` | 1 | In use by OpenNet; internal unless exact OTDR text is attached | 76 line Shapes; one graphic is rejected because no numbered marker attaches |
| `#FF0000` | 1 | In use; organization comes from exact Fiber-scoped source label or remains unknown | 222 |
| `#FF0000` | 2 | Review required; meaning unresolved | 28 |
| `#000000` | 1 | Rejected after geometry check; no numbered Fiber marker attachment | 3 |

The source uses Pattern `1` for solid and `2` for the dashed red examples. A red dashed line never becomes damaged, in use, reserved, available, or assigned automatically. OTDR does not imply a distance or health result. “Unused” is not rendered or queried as “free.”

## Effective-style and attachment grammar

The interpreter reads resolved `effective_style.LineColor`, `LinePattern`, and `LineWeight`, including the stored style/master provenance. It also preserves each line Shape's raw line Cells, transformed Begin/End world points, root/parent/master IDs, source page, source Connect rows, and measured endpoint residuals in `migration/iteration28e/fiber-usage-line-audit.json`.

The source's 42 decoded marker banks provide 2,928 numbered marker representations. Marker number comes only from the certified bank-local numeric-label alignment. Each candidate line endpoint is compared with those numbered marker centers using a tolerance capped at 0.065 drawing units and scaled to the marker diameter. If the Shape is an exact decoded connector, both local C/F ends may be retained when that same Shape ID and both numbered markers agree with the already decoded transition. No route adjacency or line color creates a transition.

The scan rejects marker ellipses, closure/AP outlines, text without line geometry, and lines that do not reach a numbered marker. Four non-Fiber line graphics are explicitly rejected. Five colored strokes reach two distinct local Fibers but do not match an exact decoded transition Shape; they stay in the review queue. The cases are Shapes 20933, 29642, 29644, 40442, and 41025.

## Source meaning versus path-wide use

Each source stroke and company/OTDR label remains local evidence. `NetworkUseAssignment` stays generic. `FiberUsageProjection` derives use over the current 28C exact Fiber path, records the topology revision/path signature, all local Fiber legs, source line and label Shapes, origin C/F, claim basis, and stop points. The projection stops at ambiguous nodes and the current resolver's genuine gaps, terminations, and external boundaries. It follows fiber-number and physical-color remaps through exact transitions.

Red solid Shapes with exact organization scope use the preserved 28D company occurrence IDs. Multiple occurrences are kept even when the logical claim is deduplicated. Green style adds owner confirmation plus source style evidence; the four exact OTDR lines retain the associated annotation Shape IDs. Red without a uniquely scoped company remains in-use with organization unknown.

Conflicting organizations or use states are not selected silently. Four local conflict cases remain review-required. AP Port occupancy is still stored independently from operational Fiber-line semantics, and the Fiber marker fill and Tube color are never overwritten.

## Current coverage and review

Every one of the 2,088 canonical local Fiber legs has a current view: 306 in use, 1,431 unused, 17 review required, and 334 unknown. Logical projected claims represent 38 in-use, 301 unused, and two review-required known path groups. Company-tagged local views include OpenNet 154, Magti 40, Silknet 24, and Skytel 14. The inventory reports four path/organization conflicts; counts describe this source interpretation and are not acceptance targets.

The 229-case append-only review queue contains 28 individual red-dashed cases, 192 red-solid organization-enrichment cases, five uncertain line/Fiber alignments, and four organization conflicts. Red dashed cases each retain their own source Shape, effective style, local Fiber, full known path, endpoints, neighboring style examples, company evidence, and owner question. Decisions are stored separately in local browser storage and do not rewrite raw Visio or activate connectivity.

Machine-readable details: `migration/iteration28e/fiber-usage-line-audit.json`, `fiber-lineage-usage.json`, `review-queue.json`, and `usage-summary.json`. Compact runtime evidence is `src/data/source-b-fiber-usage-evidence.json`.
