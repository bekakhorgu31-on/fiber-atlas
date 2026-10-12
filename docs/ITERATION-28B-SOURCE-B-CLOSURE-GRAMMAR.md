# Iteration 28B — Source B Closure grammar, coordinates, and GIS references

## Result

Source B's grouped Closure symbol is now deterministically recognized and tied to the existing physical endpoint records. Existing `network_node` IDs remain canonical; nodes 207–215 are typed as Closures and shown as SC207–SC215. Nodes 205 and 206 retain their existing Closure identities and receive the same source evidence. No Cable, Fiber, node-local transition, FiberLineage, JourneySummary, or frozen V1 manifest record changes.

## Source grammar

The source is `imports/inbox/Tsageri-Alpana-Tvishi.vsdx`, SHA-256 `419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d`. Two independently cached raw extractions agree on the relevant structure. The source page is `სვანეთი` (page ID 4).

A candidate is accepted only when it is a top-level Visio Group whose root is Master 23 / Master Shape 5 (`ქურო`), has the effective grey fill `#bfbfbf`, has its own integer Row_1 Closure number, a valid source-ordered E/W longitude then N/S latitude DMS pair in Row_2, and a GJS/GIS-style external reference in Row_3. It must contain exactly three child callout Shapes using Master Shapes 6, 7, and 8, each bound to the matching number, coordinate, or reference. The evaluator checks each candidate independently; cable-route order, color resemblance, and numeric proximity do not type a node.

The structural scan found 11 matches (SC205–SC215) among 64 top-level group candidates; 53 are rejected. Negative examples include a purple group and ordinary Cable-label Shapes. The complete candidate ledger, raw Shape IDs, geometry, style, and rejection results are in `migration/iteration28b/source-b-closure-grammar.json`.

## Golden SC207 and physical identity

SC207 is Visio root Shape 19954, with callout Shapes 19955–19957. It carries its own number `207`, coordinate text `42°47'38.509\"E  42°39'12.421\"N `, and external reference `GJS  - 3019A`. The root references Master 23 / Shape 5 (`ქურო`); the three callouts reference Master Shapes 6–8. Its supported physical Cable context is existing C151 and C152, and its existing 143 local transitions remain byte-for-byte unchanged. The source has no direct Connect row to the group/callout Shapes; Cable endpoint labels and the already-active canonical physical projection provide consistency evidence only and create no new edge.

The raw coordinate text and its source Shape ID are retained. The parsed longitude is 42.79403027777778° and latitude is 42.65345027777778°. CRS/datum remains unknown; the coordinates do not yet create map geometry. The exact Visio prefix is **GJS**, although the owner describes the field generically as GIS. Both raw text and `GJS` are preserved; GIS is a search alias.

All 11 symbols repeat the value `GJS:3019A`; it is not a unique Closure identifier. Search therefore presents/disambiguates the matching Closures rather than selecting one by this value. No records are merged.

## Certified inventory

| Canonical node | Source number | Grammar | Raw coordinate (longitude, latitude) | External reference | Final type |
|---|---:|---|---|---|---|
| network_node:205 | 205 | PASS | 42°46'32.095"E 42°39'7.663"N | GJS - 3019A | Closure / SC205 |
| network_node:206 | 206 | PASS | 42°46'18.669"E 42°39'22.455"N | GJS - 3019A | Closure / SC206 |
| network_node:207 | 207 | PASS | 42°47'38.509"E 42°39'12.421"N | GJS - 3019A | Closure / SC207 |
| network_node:208 | 208 | PASS | 42°49'45.14"E 42°37'52.434"N | GJS - 3019A | Closure / SC208 |
| network_node:209 | 209 | PASS | 42°49'48.601"E 42°37'6.401"N | GJS - 3019A | Closure / SC209 |
| network_node:210 | 210 | PASS | 42°49'55.196"E 42°36'43.483"N | GJS - 3019A | Closure / SC210 |
| network_node:211 | 211 | PASS | 42°51'12.771"E 42°35'50.747"N | GJS - 3019A | Closure / SC211 |
| network_node:212 | 212 | PASS | 42°51'43.255"E 42°33'40.618"N | GJS - 3019A | Closure / SC212 |
| network_node:213 | 213 | PASS | 42°49'29.467"E 42°33'32.291"N | GJS - 3019A | Closure / SC213 |
| network_node:214 | 214 | PASS | 42°49'3.641"E 42°33'27.597"N | GJS - 3019A | Closure / SC214 |
| network_node:215 | 215 | PASS | 42°47'36.11"E 42°31'37.071"N | GJS - 3019A | Closure / SC215 |

All eleven coordinate strings parsed successfully using the source's E/N axis order. The full audit artifact also records the decimal-degree values, source Shape IDs, world bounds, master references, connector consistency, and every rejected group candidate.

## Data and UI behavior

- Existing canonical `network_node:207`–`:215` identities, Cable endpoints, deep links, and transition node references remain stable. The historical `BOUNDARY-SC207` provenance alias remains secondary evidence.
- The existing Closure 205/206 records are enriched in place; no duplicate nodes or Closure records are created.
- Closure search recognizes SC names, prior Node aliases, and the duplicated GIS/GJS code. Inspector details show source coordinates, exact raw code, transition counts, and evidence provenance.
- Selecting SC207 in the splice workspace uses its existing 143 local transitions. C151/F1 still maps into C152/F1; C151/F118 remains a partial known Fiber leg at SC207 and is not called terminated.
- The ten other Source B endpoints not matched by this grammar remain neutral. No AP typing or topology is inferred for them.

## Validation

The regression suite passes 708/708 tests. Tests cover the actual SC207 source Shapes, grammar rejection, all 11 independent matches, DMS parsing and unknown CRS, duplicate external references, stable canonical IDs, unchanged graph records, unchanged C151/F1 and F118 traces, and legacy/current search aliases. Production build, standalone export, and browser QA at desktop and 390px mobile are recorded in `docs/VALIDATION.md`; the targeted standalone browser checks produced zero browser logs and no tested viewport overflow.

The frozen `TSAGERI-LENTEKHI-REFERENCE-V1` manifest is unchanged at SHA-256 `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`. No field verification is claimed.
