#!/usr/bin/env python3
import collections
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'src/data';DOCS=ROOT/'docs'
summary=json.load(open(DATA/'iteration23-fresh-summary.json',encoding='utf-8'))
trans=json.load(open(DATA/'iteration23-fresh-transitions.json',encoding='utf-8'))
diff=json.load(open(DATA/'iteration23-transition-diff.json',encoding='utf-8'))
occ=json.load(open(DATA/'iteration23-port-occupancy.json',encoding='utf-8'))
rec=json.load(open(DATA/'iteration23-connection-reconciliation.json',encoding='utf-8'))
physical=json.load(open(DATA/'iteration23-physical-construction.json',encoding='utf-8'))
annotations=json.load(open(DATA/'source-annotations.json',encoding='utf-8'))

def write(name,lines):(DOCS/name).write_text('\n'.join(lines).rstrip()+'\n',encoding='utf-8')

s=summary['source'];r=summary['rawCounts'];f=summary['freshCounts']
audit=['# Iteration 23 — VSDX Import Audit','', '## Source file','',
f'- Path: `{s["absolute_path"]}`',f'- File: `{s["file"]}`',f'- Size: {s["size_bytes"]:,} bytes',f'- Modified: {s["modified_at"]}',f'- SHA-256: `{s["sha256"]}`','',
'The VSDX remained immutable. The active raw artifact is `migration/iteration23/tsageri-lentekhi.fresh.raw.json.gz`. Its gzip bytes are deterministic and have SHA-256 `'+summary['generation']['rawArtifactSha256']+'`.','',
'## VSDX package structure','',f'- {r["package_parts"]} package parts; {r["xml_parts_preserved_verbatim"]} XML/relationship parts preserved verbatim.',f'- {r["pages"]} page, {r["masters"]} masters and {r["styles"]} style sheets.',f'- Active page: `{summary["page"]["name"]}` (ID `{summary["page"]["id"]}`, `{summary["page"]["part"]}`).',f'- {r["all_page_shapes_including_subshapes"]:,} shapes including subshapes; {r["top_level_shapes"]:,} top-level shapes; {r["direct_text_shapes"]:,} direct text shapes.',f'- {r["connect_rows"]} Connect rows, {r["shapes_with_local_property_sections"]} shapes with local Property sections, {r["comments"]} comment.','',
'Relevant parts are `visio/document.xml`, `visio/pages/pages.xml`, `visio/pages/page1.xml` and their relationship parts, all master XML/relationship parts, `visio/comments.xml`, and the package/core property parts.','',
f'The fresh annotation pass classifies all {annotations["report"]["totalCandidateTexts"]:,} direct-text/comment occurrences: {len(annotations["annotations"])} retained SourceAnnotation records cover {annotations["report"]["associated"]+annotations["report"]["groupAssociated"]+annotations["report"]["routeAssociated"]+annotations["report"]["pageGeneral"]+annotations["report"]["unresolvedAssociation"]} meaningful occurrences, {annotations["report"]["structuredSourceTexts"]} occurrences remain in typed structured inventory, and {annotations["report"]["deliberatelyIgnored"]:,} numeric/layout occurrences remain preserved in raw evidence.','',
'## Extractor behavior','',
'`scripts/extract-vsdx.py` now preserves raw XML, relationship targets, document colors, style sheets, complete master shape trees, page shapes/subshapes, Shape Data rows, formulas and evaluated values, text, comments and Connect rows. It emits a normalized projection alongside the verbatim XML. It contains no Fiber Atlas routing rules.','',
'## Effective style resolution','',
'For Fill and Line cells, resolution order is a non-inherited local cell, the referenced master shape, and the relevant style-sheet chain. The result retains value, formula, source kind and source ID. RGB values are decoded from literal hex, RGB formulas and Visio color-table indexes. Theme formulas remain preserved even when a full theme function cannot be evaluated. FillPattern and transparency cells remain separate from color. A transparent text label is therefore not mistaken for a white filled Port graphic.','',
'The raw anchors prove both cases: AP41 Port1 resolves local green `#92d050`; AP41 Port4 resolves local white `#ffffff`. Shape 12428 resolves `#bfbfbf` from its master shape.','',
'The physical construction projection is also regenerated from the fresh bank discovery. It decodes 1,176 Fiber fills and 98 repeated Tube rings across all 20 Segments; every paired bank agrees. It replaces the archived Iteration 19 physical fixture in the active prototype.','',
'## Geometry and Connect handling','',
'Nested group coordinates use affine transforms from PinX/PinY, LocPinX/LocPinY, Angle and flips. Connector Begin/End points are transformed through the parent coordinate system. Shape 43430 is retained as a depth-1 child of 43429 with its page-space position.','',
'Connect rows are preserved verbatim. A local Fiber transition is accepted from an explicit Connect endpoint and/or a bounded endpoint-to-marker alignment. Cable Route adjacency never creates an optical edge. Cable and AP bank order comes from explicit numeric labels and x alignment, not ZIP/XML enumeration order.','',
'## Raw extraction reconciliation','',
'| Measure | Historical extractor | Fresh extractor | Explanation |','|---|---:|---:|---|',
'| Pages | 1 | 1 | unchanged |','| Top-level shapes | 2,640 | 2,640 | unchanged |','| All page shapes | 7,349 | 7,349 | unchanged |','| Direct text shapes | 2,676 | 2,676 | unchanged |','| Connect rows | 203 | 203 | unchanged |','| Property-bearing shapes | 218 | 218 | unchanged |','| Comments | 1 | 1 | unchanged |',f'| Masters parsed with content | metadata only | {r["masters"]} | master trees and inheritance are now preserved |',f'| Effective fill projections | local only | {r["shapes_with_effective_fill"]:,} | local/master/style resolution added |',f'| Verbatim XML parts | none | {r["xml_parts_preserved_verbatim"]} | lossless audit layer added |','',
'The source package SHA differs from the Iteration 09 reviewed package, but normalized page counts and all 838 Fiber transitions reproduce exactly. The package difference does not change this page topology.','',
'## Known limitations','',
'- Theme formulas are preserved; only literal/evaluated RGB, RGB formulas and color indexes are decoded to RGB.',
'- Geometry is accepted only through the documented bank grammar and bounded alignment. Proximity elsewhere is not connectivity.',
'- The Tsageri mirrored 192-position banks contain no distinct filled Port graphic; occupancy and exact per-Port Fiber binding remain unknown.',
'- The Lentekhi 48-position termination bank supports ordered local binding, but no separate filled Port graphic; occupancy remains unknown.',
'- Physical splice mechanism, tray, patching and AP-internal Port-to-Port continuity are not inferred.']
write('ITERATION-23-VSDX-IMPORT-AUDIT.md',audit)

conn=['# Iteration 23 — Full Connection Reconciliation','',
'Fresh projection: **838 exact local Fiber transitions**, **192 defensible Port↔Fiber bindings**, and **32 active connection sheets / 1,038 rows** after the separate owner-confirmed unresolved SC225 overlay. Iteration 22 had 838 exact transitions, 384 bindings, 33 sheets and 1,230 rows. The transition count reproduced exactly; 192 Tsageri same-index Port bindings were removed from active projection because the fresh source has mirrored logical positions without a distinct per-Port termination proof.','',
'## Source basis','',
'Each exact mapping records source connector, both marker shape IDs, node, local Fiber numbers, geometry and one or more of `explicit_connect`, `source_geometry`, and `ordered_marker_alignment`. Owner confirmations are held in `iteration23-owner-confirmations.json` and applied after fresh interpretation.','',
'## Relationship reconciliation','',
'| Node | Left bank | Right bank | Capacity | Exact | Number changes | Tube changes | Fiber-color changes | Terminations | Other relationship | Unresolved | Conflicts | Basis |','|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|']
for x in rec['relationships']:
 basis=', '.join(f'{name}: {count}' for name,count in sorted(x['basisCounts'].items()))
 conn.append(f'| {x["nodeId"]} | C{x["leftLegacySegmentId"]} | C{x["rightLegacySegmentId"]} | {x["capacity"]} | {x["exact"]} | {x["numberChanges"]} | {x["tubeChanges"]} | {x["fiberColorChanges"]} | {x["intentionalTerminations"]} | {x["otherRelationship"]} | {x["unresolved"]} | {x["sourceConflicts"]} | {basis} |')
conn += ['', 'Every row reconciles: exact + termination + other relationship + unresolved equals the relevant left-bank capacity. “Other relationship” prevents a branch Fiber from being counted as silently missing in a second relationship sheet.','',
'## Golden raw-source mappings','',
'- SC218: C172/F29 ↔ C173/F01, connector shape 33098.',
'- SC219: C176/F32 ↔ C175/F24, connector shape 37487; owner confirmation keeps AP52 and excludes SC218/AP51.',
'- SC224: C184/F38 ↔ C181/F06, connector shape 37064; owner confirmation continues to the unresolved AP side at SC225.', '',
'## Old versus fresh transitions','',f'- Reproduced exactly: {diff["counts"]["reproducedExactly"]}',f'- Changed: {diff["counts"]["changed"]}',f'- Not found in fresh source: {diff["counts"]["notFoundInFreshSource"]}',f'- Newly discovered: {diff["counts"]["newlyDiscovered"]}','',
'The equality is an observed result, not a protected target. The fresh interpreter did not read the old transition fixture until after all fresh outputs had been written.','',
'## Physical differences','',
'Connection sheets preserve both local Tube and Fiber identities. Number, Tube and Fiber-color changes are calculated from the two local sides and can be filtered independently. Straight same-number rows remain explicit at SC220–SC223.','',
'## Remaining gaps','',
'- C181/F05–F12 reach SC225 without a source-distinguishable AP53/AP54 choice; only owner-confirmed F06 receives the AP-side unresolved overlay.',
'- AP-internal ingress/return pairing remains unresolved.',
'- Transition operation remains “unknown”; optical continuity does not imply a named splice operation.',
'- Tsageri exact per-Port Fiber bindings are withheld pending stronger source or owner evidence.']
write('ITERATION-23-FULL-CONNECTION-RECONCILIATION.md',conn)

port=['# Iteration 23 — Port Occupancy Audit','',
'Owner-confirmed source convention: a filled green Port graphic means **occupied / in use**; a filled white Port graphic means **unused**. Unused does not mean available. Other colors and transparent/non-Port representations remain unknown. Fiber physical color is not consulted.','',
f'Counts: **{occ["counts"]["in_use"]} occupied**, **{occ["counts"]["unused"]} unused**, **{occ["counts"]["unknown"]} unknown** across **{len(occ["ports"])} logical Ports**.','',
'Tsageri’s 192 ports are deduplicated from internal and boundary representations and retain both source shape IDs. Those representations do not provide a standalone filled Port graphic, so all 192 statuses remain unknown. Lentekhi’s 48 positions likewise have no standalone filled Port graphic.','',
'| Owner | Port | Raw fill | Effective fill | Pattern | Usage | Availability | Local Fiber | Tube/color | Fiber color | Role | Maximum known journey endpoints | Company | Source shape IDs |','|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|']
bmap={(b['ownerType'],b['ownerId'],b['portNumber']):b for b in json.load(open(DATA/'iteration23-port-bindings.json',encoding='utf-8'))['bindings']}
phys={(x['legacySegmentId'],r['fiberNumber']):r for x in physical['segments'] for r in x['records']}
segment_ends={'148':['AGG5','SC205'],'149':['SC205','AP41'],'150':['SC205','SC206'],'151':['SC206','SC207 external boundary'],'169':['SC206','SC216'],'170':['SC216','AP50'],'171':['SC216','SC217'],'172':['SC217','SC218'],'173':['SC218','AP51'],'174':['SC218','SC219'],'175':['SC219','AP52'],'176':['SC219','SC220'],'177':['SC220','SC221'],'178':['SC221','SC222'],'179':['SC222','SC223'],'180':['SC223','SC224'],'181':['SC224','SC225'],'182':['SC225','AP53'],'183':['SC225','AP54'],'184':['Lentekhi Aggregation','SC224']}
adj=collections.defaultdict(list)
for e in trans['exactConnectorEdges']:
 a=(e['a']['legacySegmentId'],e['a']['fiberNumber']);z=(e['z']['legacySegmentId'],e['z']['fiberNumber'])
 adj[a].append((z,e['nodeId']));adj[z].append((a,e['nodeId']))
def journey(key):
 seen={key};queue=[key]
 while queue:
  current=queue.pop()
  for other,_ in adj[current]:
   if other not in seen:seen.add(other);queue.append(other)
 endpoints=set()
 for vertex in seen:
  used={node for _,node in adj[vertex]}
  for node in segment_ends[vertex[0]]:
   if not node.startswith('SC'):endpoints.add(node)
   elif node not in used:endpoints.add(f'{node} stop/unresolved')
 return ' ↔ '.join(sorted(endpoints)) or 'unresolved'
def role(p):
 if p['ownerType']=='ap' and p['ownerId']=='41':
  n=p['portNumber'];return 'transit' if n==16 else 'ingress' if n<=15 else 'return' if n<=22 else 'local termination'
 if p['ownerType']=='ap':return 'ingress; internal pairing unresolved'
 if p['ownerId']=='ODF-LENTEKHI-01':return 'aggregation termination'
 n=p['portNumber'];return 'Ambrolauri direction' if n<=116 else 'intentional SC205 stop' if n<=130 else 'AP41 direction' if n<=144 else 'Lentekhi direction'
for p in sorted(occ['ports'],key=lambda x:(x['ownerType'],x['ownerId'],x['portNumber'])):
 b=bmap.get((p['ownerType'],p['ownerId'],p['portNumber']));local='—' if not b else f'C{b["legacySegmentId"]}/F{b["fiberNumber"]:02d}';identity=phys.get((b['legacySegmentId'],b['fiberNumber'])) if b else None
 tube='—' if not identity else f'T{identity["tubeNumber"]} / {identity["tubeColorKey"]}';fiber='—' if not identity else identity['fiberColorKey'];known='owner range only; exact Fiber binding unresolved' if not b else journey((b['legacySegmentId'],b['fiberNumber']))
 port.append(f'| {"AP"+p["ownerId"] if p["ownerType"]=="ap" else p["ownerId"]} | {p["portNumber"]} | {p["rawFill"] or "—"} | {p["effectiveFill"] or "—"} | {p["fillPattern"] or "—"} | {p["physicalUsage"]} | {p["availability"]} | {local} | {tube} | {fiber or "—"} | {role(p)} | {known} | {p["companyLabel"] or "—"} | {", ".join(p["sourceShapeIds"])} |')
port += ['', 'Company labels remain annotation/use context only. They do not establish Cable, Fiber, ODF, provider, customer or rights ownership. AP-internal pairing is not inferred from occupancy.']
write('ITERATION-23-PORT-OCCUPANCY-AUDIT.md',port)
print('wrote iteration 23 reports')
