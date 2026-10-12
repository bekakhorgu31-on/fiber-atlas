#!/usr/bin/env python3
"""Measure individual source evidence quality for the 27C candidate edges."""
import gzip, json, math
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
src = json.loads((ROOT / "migration/iteration27/source-interpretation.json").read_text(encoding="utf-8"))
raw = json.loads(gzip.open(ROOT / "migration/iteration27/run-a/tsageri-alpana-tvishi.raw.json.gz", "rt", encoding="utf-8").read())
page = raw["pages"][0]
by_id = {str(s["id"]): s for s in page["shapes"]}
edges = [e for e in src["fiberTopology"]["transitionEdges"] if e["nodeToken"] not in {"205", "206"}]
all_marker_shapes=[s for s in page["shapes"] if any(r.get("attributes",{}).get("T")=="EllipticalArcTo" for sec in s.get("sections",[]) for r in sec.get("rows",[])) and s.get("geometry",{}).get("global_pin")]
all_marker_points=[(str(s["id"]),s["geometry"]["global_pin"]["x"],s["geometry"]["global_pin"]["y"]) for s in all_marker_shapes]
counts = Counter()
per_group = defaultdict(Counter)
shape_forms = Counter()
color_pair_evidence = Counter()
issues = []
for e in edges:
    sh = by_id[e["connectorShapeId"]]
    begin, end = sh["geometry"].get("global_begin"), sh["geometry"].get("global_end")
    targets = [e["a"], e["z"]]
    eps = [begin, end]
    # The candidate endpoint ordering is by Segment identity, while connector
    # Begin/End order is drawing-specific. Test both bijections.
    d00 = math.hypot(eps[0]["x"]-targets[0]["x"], eps[0]["y"]-targets[0]["y"])
    d11 = math.hypot(eps[1]["x"]-targets[1]["x"], eps[1]["y"]-targets[1]["y"])
    d01 = math.hypot(eps[0]["x"]-targets[1]["x"], eps[0]["y"]-targets[1]["y"])
    d10 = math.hypot(eps[1]["x"]-targets[0]["x"], eps[1]["y"]-targets[0]["y"])
    ds = min((d00,d11),(d01,d10),key=lambda pair:max(pair))
    endpoint_marker_counts=[]
    for p in eps:
        endpoint_marker_counts.append(sum(1 for _,x,y in all_marker_points if abs(x-p["x"])<=.015 and abs(y-p["y"])<=.05))
    cells = {c.get("N"): c.get("V") for c in sh.get("cells", [])}
    sec = [(s.get("name"), [(r.get("T"), r.get("X"), r.get("Y")) for r in s.get("rows", [])]) for s in sh.get("sections", [])]
    form = tuple((s.get("name"), tuple(r.get("T") for r in s.get("rows", []))) for s in sh.get("sections", []))
    shape_forms[str(form)] += 1
    direct = [r for r in page["connects"] if str(r.get("FromSheet")) == e["connectorShapeId"]]
    evidence = {
        "fiber_pair": all(t["markerShapeId"] and t["segment"] for t in targets),
        "both_endpoints_attached": len(ds)==2 and max(ds)<=0.051,
        "line_shape": cells.get("Height") == "0" and cells.get("Width") is not None,
        "green": sh.get("effective_style",{}).get("LineColor",{}).get("rgb")=="#009945",
        "no_text": not (sh.get("text") or "").strip(),
        "no_parent": sh.get("depth",0)==0,
        "source_connect_rows": len(direct),
        "endpoint_marker_counts": endpoint_marker_counts,
        "line_color": sh.get("effective_style",{}).get("LineColor",{}).get("rgb"),
        "shape_type": sh.get("attributes",{}).get("Type"),
        "begin_end_distance": round(math.dist((begin["x"],begin["y"]),(end["x"],end["y"])),5),
        "endpoint_distances": [round(x,6) for x in ds],
        "section_count": len(sec),
        "node": e["nodeToken"], "relationship": "C%s/C%s" % (e["a"]["segment"],e["z"]["segment"]),
    }
    key = (e["nodeToken"], evidence["relationship"])
    connector_color=sh.get("effective_style",{}).get("LineColor",{}).get("rgb")
    color_hex={"blue":"#0000ff","orange":"#f48c37","green":"#008000","brown":"#9c4a09","slate":"#808080","white":"#ffffff","red":"#ff0000","black":"#000000","yellow":"#ffff00","violet":"#cc99ff","rose":"#ff00ff","aqua":"#00ffff"}
    endpoint_colors=[color_hex.get(t.get("fiberColorKey")) for t in targets]
    color_pair_evidence[(evidence["node"],evidence["relationship"],connector_color,"both" if connector_color in endpoint_colors and endpoint_colors[0]==endpoint_colors[1] else "one" if connector_color in endpoint_colors else "neither")]+=1
    for k,v in evidence.items():
        if isinstance(v,bool): per_group[key][k+"_true" if v else k+"_false"] += 1
    per_group[key]["explicit_connect_rows"] += len(direct)
    per_group[key]["unique_marker_endpoints"] += sum(n==1 for n in endpoint_marker_counts)
    per_group[key]["ambiguous_marker_endpoints"] += sum(n>1 for n in endpoint_marker_counts)
    per_group[key]["unmatched_marker_endpoints"] += sum(n==0 for n in endpoint_marker_counts)
    counts["edges"] += 1
    for k,v in evidence.items():
        if isinstance(v,bool): counts[k+"_true" if v else k+"_false"] += 1
    if not evidence["both_endpoints_attached"] or not evidence["line_shape"] or not evidence["no_text"] or min(endpoint_marker_counts)!=1:
        issues.append({"id":e["id"],**evidence})
line_colors=Counter((by_id[e["connectorShapeId"]].get("effective_style",{}).get("LineColor",{}).get("rgb")) for e in edges)
widths=Counter(next((c.get("V") for c in by_id[e["connectorShapeId"]].get("cells",[]) if c.get("N")=="Width"),None) for e in edges)
out={"schema":"iteration27c-connector-evidence-metrics/1","sourceSha256":src["source"]["sha256"],"previouslyUnreviewedCount":len(edges),"evidenceCounts":dict(counts),"connectorLineColors":dict(line_colors),"connectorColorRelation":[{"node":"SC"+n,"relationship":rel,"lineColor":col,"colorRelation":relation,"count":count} for (n,rel,col,relation),count in sorted(color_pair_evidence.items())],"connectorWidthCellValues":dict(widths),"shapeForms":[{"count":n,"form":form} for form,n in shape_forms.most_common()],"groups":[{"node":"SC"+n,"relationship":rel,"features":dict(c)} for (n,rel),c in sorted(per_group.items(),key=lambda x:(int(x[0][0]),x[0][1]))],"exceptionCount":len(issues),"exceptions":issues}
(ROOT/"migration/iteration27/connector-evidence-metrics.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"count":len(edges),"metrics":dict(counts),"exceptionCount":len(issues),"exceptions":issues[:12]},ensure_ascii=False,indent=2))
