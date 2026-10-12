# Visio import run — Tsageri–Lentekhi 2025

This iteration implements a controlled evidence pipeline:

`Visio source → raw extraction → interpreted candidates → human review → accepted inventory`

The raw extractor is [`scripts/extract-vsdx.py`](../scripts/extract-vsdx.py). It reads the VSDX package, page/master metadata, every shape and subshape, direct text, cells, sections, Shape Data rows, and Connect rows. It has no Fiber Atlas asset types, label grammar, color rules, or topology rules.

The Tsageri-specific interpreter is [`src/domain/import.ts`](../src/domain/import.ts). [`src/domain/colors.ts`](../src/domain/colors.ts) adds the exact, versioned marker-style decoder and the bounded C172 projection. Geometry, a matching number, or a matching drawing color never creates accepted optical continuity.

## Actual extraction

Source: `Tsageri-Lentekhi 2025.vsdx`

SHA-256: `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`

Generated artifacts:

- `migration/tsageri-lentekhi.raw.json.gz` — complete raw package evidence used for audit and future interpreters.
- `migration/tsageri-lentekhi-extraction-summary.json` — small repeatable extraction summary.
- `src/data/source-evidence.json` — source-specific interpreted evidence prepared from the same file and source hash.
- `src/data/c172-physical-evidence.json` —48 reviewed marker records generated from raw group34626 by `scripts/interpret-c172-colors.py`.

The generic extractor produced:

| Evidence | Count |
| --- | ---: |
| Pages | 1 |
| All page shapes, including subshapes | 7,349 |
| Top-level shapes | 2,640 |
| Shapes with direct text | 2,676 |
| Shapes with local Property sections | 218 |
| Connect rows | 203 |

Run it again with:

```powershell
python scripts/extract-vsdx.py "..\Tsageri-Lentekhi 2025.vsdx" migration\tsageri-lentekhi.raw.json.gz --summary migration\tsageri-lentekhi-extraction-summary.json
```

## Interpreted candidate layer

The current interpreter creates149 review items:

| Candidate kind | Count | Default trust |
| --- | ---: | --- |
| Cable Segment | 20 | Needs human review |
| Closure | 12 | Needs human review |
| Access Point from legacy ODF symbol | 6 | Needs human review |
| Aggregation | 2 | Needs human review |
| SC218 connection geometry | 52 | Unapproved candidate |
| C172 fiber physical marker | 48 | Owner-reviewed and accepted |
| Annotation / investigation issue | 9 | Unresolved unless explicitly decided |

The four-part legacy label is interpreted as `segment ID / typed endpoint A / typed endpoint Z / fiber quantity`. A legacy C169–C174 record is a **Cable Segment**, never proof of a whole physical cable. Canonical `CAB-…` identifiers and full legacy labels remain unchanged. `physicalCableId` stays null unless separate evidence supports a PhysicalCable or CableRun parent. Iteration10 assigns only C172 to the first reviewed PhysicalCable; C171 remains a candidate membership and is not assigned as accepted.

Each candidate carries the source hash, file, page, page ID, package part, shape IDs, raw value, interpretation rule, extractor version, interpreter version, warnings, and a stable natural key. The48 physical records are the only pre-accepted items because their construction and marker/ring meaning were explicitly confirmed. The original101 interpreted records keep their prior unreviewed states.

## C172 physical-color interpretation

This rule applies only to reviewed segment `CAB-000172` / legacy C172 and is versioned as `tsageri-lentekhi-marker-colors/1`:

- inner point/dot `FillForegnd` → individual Fiber physical color;
- surrounding ring/outline `LineColor` → Tube physical color;
- connection-line color → preserved separately and ignored for physical identity and topology.

The accepted construction is four12-fiber tubes: Tube1 F01–F12, Tube2 F13–F24, Tube3 F25–F36 and Tube4 F37–F48. Positions use the centralized sequence Blue, Orange, Green, Brown, Slate/Grey, White, Red, Black, Yellow, Violet, Rose/Pink and Aqua/Turquoise. Each normalized color has a stable key plus Georgian and English labels. Unsupported raw values remain unresolved; the interpreter never chooses a nearest visual color.

Raw evidence is retained per strand as group, marker and numeric-label shape IDs plus the exact inner and outer values. C172 Tube2 includes one conflicting outer value on F13 (`4`, decoded Blue) and alternate orange values on F22/F23 (`#ea700d`). Those values and warnings remain visible. The accepted Tube2 color is Orange from the confirmed tube order and the peer ring evidence; no raw value is discarded.

Rebuild the bounded evidence after a verified source replacement with:

```powershell
python scripts/interpret-c172-colors.py
```

The script refuses to run the shape-specific rule when the source SHA-256 changes.

## Review decisions

The review workspace supports four explicit outcomes:

- **Accept** — creates an accepted-record reference for the candidate.
- **Correct and accept** — stores the correction and accepted-record reference together.
- **Reject** — preserves the candidate and provenance without publishing it.
- **Leave unresolved** — preserves the open question without inventing data.

The current browser prototype keeps ordinary review actions in the current session. It deliberately does not modify `pilot.json` or pretend that the session is a production write path. The48 accepted C172 physical records are curated evidence loaded by the repository projection and are therefore repeatable across sessions.

## Repeat imports and conflicts

Candidate identity is deterministic from the source hash, candidate kind, natural key, and source shape IDs. Reimport applies these rules:

1. An identical candidate is deduplicated and retains its prior review decision.
2. A new candidate is added as unreviewed.
3. Changed evidence for an unreviewed/rejected/unresolved candidate returns as a fresh review item.
4. Changed evidence for an accepted or corrected natural key becomes an explicit conflict.
5. An accepted fingerprint and accepted record reference are never overwritten silently.

## Unresolved or conflicting source evidence

- The Lentekhi aggregation heading says `#6`, while a station property says `5`. Both values are preserved; no identity merge is accepted.
- A note says fiber 5 changes to fiber 9 somewhere, but the closure and segments are unknown. It remains an investigation issue and does not create a splice.
- “Free”, “direct”, and “transit” port values may be stencil defaults. They do not create 144 available ports.
- Coordinate order and CRS are unconfirmed, including different formats for SC221 and SC222. Raw coordinates are preserved.
- Segment 151 references closure 207, which is outside the extracted page inventory. It remains an unresolved boundary.
- The owner confirmed segment 170 has 24 fibers. The correction is retained with source provenance.
- Legacy Loop markings are disabled and do not create live continuity.
- Cut/module text can describe plans or completed work. No tray, cut, or splice is created automatically.
- Long text strips contain numbering anomalies and are not expanded into records without shape-level checking.

## Deliberately not imported as accepted inventory

- No SC218 geometry connection is approved. All 52 remain candidates with operation type unknown.
- No three-way splice or branch is inferred at SC216 merely because three segments meet there.
- No fiber continuity is inferred from equal numbers or colors. Endpoint numbers and physical colors stay independent on each side of a connection.
- No common PhysicalCable/CableRun parent is invented for neighboring segments. The Iteration10 C172 exception uses owner-confirmed sheath extent, keeps its upstream end unresolved, and does not accept C171 from adjacency or equal 48F capacity.
- No manufacturer, model, tube layout, ownership, service, or commercial status is copied from one segment to another. Only C172 has reviewed tube layout and physical colors; all other segment groups remain provisional.
- No unknown allocation becomes free capacity.
- No coordinates are published as GIS-ready locations before axis and CRS validation.

## Tsageri aggregation container convention — version 1

For the reviewed Tsageri–Lentekhi page only, the large yellow rectangle is an aggregation context. It contains a logical ODF. Internal ODF port graphics and the port markers repeated at the rectangle's lower boundary are mirrored source representations of the same logical ports, so import deduplicates them by ODF and logical port number. Both source references remain attached to the one Port record; capacity is not doubled.

Outgoing cable lines cross the lower boundary and their labels may sit outside the yellow rectangle. The source-specific interpreter reviews boundary markers, line geometry, external labels, group/connect information and owner-confirmed range topology together. Nearness, matching color, matching quantity or visual alignment alone never approves an association.

The reviewed Tsageri ODF uses logical ports 1–192 without a fabricated panel subdivision. Dense connector and bank graphics include auxiliary/edited shapes, so raw geometry counts are retained as evidence rather than used as logical capacity. See `ITERATION-10-SOURCE-REVIEW.md` and regenerate `src/data/tsageri-aggregation-evidence.json` with:

```powershell
python scripts/interpret-tsageri-aggregation.py
```
