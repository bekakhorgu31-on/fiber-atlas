# Iteration 23 — VSDX Import Audit

## Source file

- Path: `C:\Users\Beka\Desktop\Visio Alt\Tsageri-Lentekhi 2025.vsdx`
- File: `Tsageri-Lentekhi 2025.vsdx`
- Size: 1,223,326 bytes
- Modified: 2026-05-20T15:04:21.710335+00:00
- SHA-256: `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`

The VSDX remained immutable. The active raw artifact is `migration/iteration23/tsageri-lentekhi.fresh.raw.json.gz`. Its gzip bytes are deterministic and have SHA-256 `52f353aa6e9be12d94b6cd4cac3ae6db737655d865119d412b5df17e47effdb8`.

## VSDX package structure

- 41 package parts; 40 XML/relationship parts preserved verbatim.
- 1 page, 22 masters and 7 style sheets.
- Active page: `ცაგერი-ლენტეხი` (ID `4`, `visio/pages/page1.xml`).
- 7,349 shapes including subshapes; 2,640 top-level shapes; 2,676 direct text shapes.
- 203 Connect rows, 218 shapes with local Property sections, 1 comment.

Relevant parts are `visio/document.xml`, `visio/pages/pages.xml`, `visio/pages/page1.xml` and their relationship parts, all master XML/relationship parts, `visio/comments.xml`, and the package/core property parts.

The fresh annotation pass classifies all 2,677 direct-text/comment occurrences: 26 retained SourceAnnotation records cover 58 meaningful occurrences, 61 occurrences remain in typed structured inventory, and 2,558 numeric/layout occurrences remain preserved in raw evidence.

## Extractor behavior

`scripts/extract-vsdx.py` now preserves raw XML, relationship targets, document colors, style sheets, complete master shape trees, page shapes/subshapes, Shape Data rows, formulas and evaluated values, text, comments and Connect rows. It emits a normalized projection alongside the verbatim XML. It contains no Fiber Atlas routing rules.

## Effective style resolution

For Fill and Line cells, resolution order is a non-inherited local cell, the referenced master shape, and the relevant style-sheet chain. The result retains value, formula, source kind and source ID. RGB values are decoded from literal hex, RGB formulas and Visio color-table indexes. Theme formulas remain preserved even when a full theme function cannot be evaluated. FillPattern and transparency cells remain separate from color. A transparent text label is therefore not mistaken for a white filled Port graphic.

The raw anchors prove both cases: AP41 Port1 resolves local green `#92d050`; AP41 Port4 resolves local white `#ffffff`. Shape 12428 resolves `#bfbfbf` from its master shape.

The physical construction projection is also regenerated from the fresh bank discovery. It decodes 1,176 Fiber fills and 98 repeated Tube rings across all 20 Segments; every paired bank agrees. It replaces the archived Iteration 19 physical fixture in the active prototype.

## Geometry and Connect handling

Nested group coordinates use affine transforms from PinX/PinY, LocPinX/LocPinY, Angle and flips. Connector Begin/End points are transformed through the parent coordinate system. Shape 43430 is retained as a depth-1 child of 43429 with its page-space position.

Connect rows are preserved verbatim. A local Fiber transition is accepted from an explicit Connect endpoint and/or a bounded endpoint-to-marker alignment. Cable Route adjacency never creates an optical edge. Cable and AP bank order comes from explicit numeric labels and x alignment, not ZIP/XML enumeration order.

## Raw extraction reconciliation

| Measure | Historical extractor | Fresh extractor | Explanation |
|---|---:|---:|---|
| Pages | 1 | 1 | unchanged |
| Top-level shapes | 2,640 | 2,640 | unchanged |
| All page shapes | 7,349 | 7,349 | unchanged |
| Direct text shapes | 2,676 | 2,676 | unchanged |
| Connect rows | 203 | 203 | unchanged |
| Property-bearing shapes | 218 | 218 | unchanged |
| Comments | 1 | 1 | unchanged |
| Masters parsed with content | metadata only | 22 | master trees and inheritance are now preserved |
| Effective fill projections | local only | 7,349 | local/master/style resolution added |
| Verbatim XML parts | none | 40 | lossless audit layer added |

The source package SHA differs from the Iteration 09 reviewed package, but normalized page counts and all 838 Fiber transitions reproduce exactly. The package difference does not change this page topology.

## Known limitations

- Theme formulas are preserved; only literal/evaluated RGB, RGB formulas and color indexes are decoded to RGB.
- Geometry is accepted only through the documented bank grammar and bounded alignment. Proximity elsewhere is not connectivity.
- The Tsageri mirrored 192-position banks contain no distinct filled Port graphic; occupancy and exact per-Port Fiber binding remain unknown.
- The Lentekhi 48-position termination bank supports ordered local binding, but no separate filled Port graphic; occupancy remains unknown.
- Physical splice mechanism, tray, patching and AP-internal Port-to-Port continuity are not inferred.
