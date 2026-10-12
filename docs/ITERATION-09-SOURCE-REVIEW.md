# Iteration 09 source review — Tsageri–Lentekhi

Review date: 2026-09-25  
Source: `Tsageri-Lentekhi 2025.vsdx`, page `ცაგერი-ლენტეხი` (page ID 4)

## Source revision and method

The currently supplied file has SHA-256 `51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a`. The earlier preserved structured evidence was extracted from SHA-256 `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`.

The current file is 150 bytes larger and contains one Visio comment. A structural comparison found the same page, shape, property and Connect-row counts, the same direct text and topology content, and only formula-serialization whitespace changes in shapes 44243 and 44244. The current source was extracted independently to `migration/tsageri-lentekhi-iteration09.raw.json.gz`; the earlier raw and interpreted evidence remain preserved for their historical review scopes.

Current raw counts: 1 page, 7,349 shapes, 2,640 top-level shapes, 2,676 direct-text shapes, 218 shapes with local properties, 203 Connect rows and 1 comment entry.

## Route records accepted in this iteration

New explicit closures: SC205, SC220, SC221, SC222, SC223 and SC224. Their identities and ordering are documentation-reviewed; their cable treatment, model, mounting, coordinates, physical condition and ownership remain unknown unless separately established.

New accepted Cable Segments:

| Segment | Source label | Endpoints | Fibers | Shape |
|---|---|---|---:|---:|
| C148 | `148-5-205-192` | AGG5 → SC205 | 192 | 15769 |
| C150 | `150-205-206-192` | SC205 → SC206 | 192 | 15770 |
| C176 | `176-219-220-48` | SC219 → SC220 | 48 | 15988 |
| C177 | `177-220-221-48` | SC220 → SC221 | 48 | 15989 |
| C178 | `178-221-222-48` | SC221 → SC222 | 48 | 43428 |
| C179 | `179-222-223-48` | SC222 → SC223 | 48 | 42871 |
| C180 | `180-223-224-48` | SC223 → SC224 | 48 | 15990 |

These labels establish node-to-node segment identity and fiber quantity. They do not establish a common PhysicalCable, fiber colors, tube structure, optical connections, availability, condition, owner, distance or service use.

The last leg after SC224 remains unresolved. The source label `184-6-224-48` (shape 15991) conflicts with the existing Lentekhi aggregation heading/property identity. No C184 inventory segment or AGG6 asset was created. The route retains one `unresolved_leg` from SC224 to the unresolved Lentekhi boundary.

## Exact requested evidence

SC205 is shape 12428. Its adjacent source labels are C148 `148-5-205-192` (shape 15769) and C150 `150-205-206-192` (shape 15770). This supports the explicit order AGG5 → SC205 → SC206.

The SC206 direction text is shape 44235 at approximately x=34.5625, y=541.5625. Its immutable raw text is:

> Alpana-Tvishi-Ambrolauri directiion

The UI may show the normalized summary “Alpana–Tvishi–Ambrolauri direction,” but the exact spelling remains attached. It is a named route direction from SC206 with no destination asset, Cable Segment, linked route or optical connection.

The exact downstream order supported by labels and closure shapes is:

`SC219 → C176 → SC220 → C177 → SC221 → C178 → SC222 → C179 → SC223 → C180 → SC224`

The shared SC220–SC223 comment is Visio comment ID 1 by Alexander Gelenidze, dated 2024-12-30T09:48:25 and edited at 09:48:36. It is attached to shape 44242. The bracket extends from y=475.0 to y=499.4096 and spans the four closure rows. Its immutable raw text is:

> დამატებულია ქუროები

It is stored once as `ANN-GROUP-SC220-SC223-ADDED`, with group/range scope and associations to SC220, SC221, SC222 and SC223. It establishes a shared source change annotation only. It does not establish installation date, field verification, optical connectivity, splice treatment or service state.

## Source annotations discovered

The review classified all 2,677 direct-text/comment occurrences:

- 6 asset-associated occurrences;
- 1 group-associated comment;
- 1 route-associated direction;
- 31 page/general occurrences;
- 19 occurrences with unresolved association;
- 61 occurrences retained as typed structured source text, including cable labels and asset headings;
- 2,558 numeric layout occurrences deliberately classified as non-operational display text while remaining in the immutable raw extraction.

Twenty-six first-class Source Annotation records cover 58 meaningful text occurrences. Repeated exact organization labels can share a semantic class while every shape ID remains in provenance.

Other meaningful text includes four Georgian module-cut instructions (shapes 14985, 15250, 15252 and 15251), the F5→F9 fiber-mismatch investigation note, AP/place labels for AP41 and AP50–AP54, OpenNet/Open Net, Magti, Silknet and Skytel labels, and legacy `free`, `Loop` and `OTDR` text. Module-cut instructions remain instructions because the source and owner explanation describe a mixture of planned and completed work. They were not converted into completed cuts, trays or optical edges. `Loop` remains historical/disabled context and does not create continuity.

Unresolved associations include free/Loop/OTDR occurrences and nearby operational text whose exact asset link cannot be proved from the source. They remain accessible with geometry, source shape and uncertainty rather than being attached by proximity.

## ODF, patch, port, distance and organization findings

The package contains ODF stencil/property prompt text, but the reviewed page does not establish a real Site → ODF → Panel → Port inventory for AP50 or AP51. No patch-cord assignment, port-face connection, fiber termination record or reliable port occupancy record was found. No pilot ODF, panel, port, termination or patch record was created.

No route-leg or Cable Segment distance value was found in the reviewed direct text or comment. `OTDR` text alone is not a distance observation. The pilot therefore has no distance observations, and route distance is `unknown` with all twelve legs missing rather than zero.

Organization labels for OpenNet, Magti, Silknet and Skytel were preserved as annotations. The user’s owner confirmation establishes OpenNet as the route-level physical-infrastructure owner and network operator. It does not assign per-segment owner fields, strand rights, dark-fiber leases, L2 services, providers, customers or beneficiaries. Magti, Silknet and Skytel remain source annotations only.

## Deliberately not converted into structured truth

The review did not create an AGG6 record, C184 segment, common PhysicalCable, closure cut/pass-through treatment, fiber mappings on the new segments, tube/color data, free capacity, ODF containment, ports, terminations, patch cords, services, rights, customers, distances, coordinates or field-verification claims. Those concepts now have stable domain contracts and validation rules, but the current source does not justify pilot records.

This is a progressive review of one direction, not a claim that the whole page or national network is operationally complete. The immutable raw extraction and unresolved annotation records remain the boundary for later review.
