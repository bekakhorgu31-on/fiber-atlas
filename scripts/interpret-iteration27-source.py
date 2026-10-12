#!/usr/bin/env python3
"""Document-B source-only inventory and overlap candidate generation (no active promotion)."""
import argparse, gzip, hashlib, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LABEL=re.compile(r"^(\d+)-(\d+)-(\d+)-(\d+)$")
DIRECTION="ლენტეხი-ხელედის მიმართულება"
COLOR_KEY={"#0000ff":"blue","#f48c37":"orange","#ea700d":"orange","#f9bb00":"orange","#008000":"green","#9c4a09":"brown","#808080":"slate","#7f7f7f":"slate","#ffffff":"white","#ff0000":"red","#000000":"black","#ffff00":"yellow","#cc99ff":"violet","#7030a0":"violet","#ff00ff":"rose","#00ffff":"aqua"}
def marker(shape):
    return bool(shape.get("effective_style",{}).get("FillForegnd",{}).get("rgb")) and any(row.get("attributes",{}).get("T")=="EllipticalArcTo" for section in shape.get("sections",[]) for row in section.get("rows",[]))
def pin(shape): return shape.get("geometry",{}).get("global_pin",{})
def endpoint(shape,side): return shape.get("geometry",{}).get("global_"+side,None)
def style(shape,name): return shape.get("effective_style",{}).get(name,{}).get("rgb")
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
    ap=argparse.ArgumentParser(); ap.add_argument("raw",type=Path); ap.add_argument("output",type=Path); ap.add_argument("--source-only",action="store_true"); args=ap.parse_args()
    raw=json.loads(gzip.open(args.raw,"rt",encoding="utf-8").read()); page=raw["pages"][0]; shapes=page["shapes"]
    by_id={str(s["id"]):s for s in shapes}; children={}
    from collections import defaultdict,Counter
    child_map=defaultdict(list)
    for shape in shapes: child_map[str(shape.get("parent_id"))].append(shape)
    labels=[]; meaningful=[]
    for s in shapes:
        text=(s.get("text") or "").strip()
        if not text: continue
        if m:=LABEL.fullmatch(text):
            cable,endpoint_a,endpoint_b,capacity=m.groups()
            labels.append({"legacyId":"C"+cable,"legacyLabel":text,"endpointTokens":[endpoint_a,endpoint_b],"capacityFibers":int(capacity),"source":{"file":raw["source"]["file"],"page":page["name"],"pageId":page["id"],"shapeIds":[s["id"]],"part":page["part"],"rawValue":s["text"],"interpretationRule":"exact-four-field-cable-label-v1"},"worldBounds":s.get("geometry",{}).get("world_bounds"),"groupPath":s.get("group_path",[])})
        elif len(text)>2 and not text.isdecimal() and text not in meaningful: meaningful.append(text)
    cables_a=[] if args.source_only else json.loads((ROOT/"reference/tsageri-lentekhi-v1.inventory.json").read_text(encoding="utf-8"))["cables"]
    a_by_label={label:c for c in cables_a for label in c.get("legacyLabels",[])}
    for item in labels:
        prior=a_by_label.get(item["legacyLabel"])
        if prior:
            item["sourceAAsset"]={"canonicalId":prior["id"],"legacyCableId":"C"+prior["legacyCableId"],"fiberCount":prior["fiberCount"],"endpointA":prior["endpointA"],"endpointB":prior["endpointB"]}
    anchors={
      "tsageriAggregation":{"state":"strong_candidate","sourceB":{"sourceTextCandidates":[x for x in meaningful if "agreg" in x.casefold() or "cageri" in x.casefold() or "ცაგერი" in x],"nearbyCableLabels":[x["legacyLabel"] for x in labels if x["legacyLabel"].startswith(("148-5-205-192","150-205-206-192"))]},"sourceA":{"canonicalId":"5","name":"Tsageri Aggregation","relatedCableLabels":["148-5-205-192","150-205-206-192"]},"basis":["aggregation label candidate and adjacent source cable labels"],"limitations":["Source B aggregation label uses source spelling and requires geometry/context inspection before exact canonical merge."]},
      "SC205":{"state":"strong_candidate","sourceB":{"adjacentLabels":[x["legacyLabel"] for x in labels if re.search(r"-(?:205)-",x["legacyLabel"]) or x["legacyLabel"].split("-")[2]=="205"]},"sourceA":{"canonicalId":"205","relatedCableLabels":["148-5-205-192","149-205-41-24","150-205-206-192"]},"basis":["matching closure token and adjacent cable label contexts"],"limitations":["Do not merge by displayed number alone; verify source graphic and local node context."]},
      "SC206":{"state":"strong_candidate","sourceB":{"adjacentLabels":[x["legacyLabel"] for x in labels if "-206-" in x["legacyLabel"]]},"sourceA":{"canonicalId":"206","relatedCableLabels":["150-205-206-192","151-206-207-144","169-206-216-48"]},"basis":["matching closure token and multiple adjacent cable labels, including C169"],"limitations":["Multi-direction junction; new Fiber continuity is not inferred from these physical links."]},
      "C169":{"state":"strong_candidate","sourceB":{"labels":[x for x in labels if x["legacyLabel"]=="169-206-216-48"]},"sourceA":{"canonicalId":"CAB-000169","legacyLabel":"169-206-216-48","fiberCount":48,"endpointA":{"kind":"closure","id":"206"},"endpointB":{"kind":"closure","id":"216"}},"basis":["exact full source label","same 48F capacity","same endpoint tokens SC206 and SC216","source B geometry and source A canonical inventory retained"],"limitations":["Exact cross-document physical identity remains a candidate pending multi-anchor geometry/topology review; do not duplicate Fiber identities or project cross-document transitions yet."]}
    }
    # Candidate local Fiber graph is built only from marker groups and explicit
    # Visio Connect/connector geometry. Cable Route and Fiber-number adjacency
    # never add an edge.
    def descendants(group):
        out=[]; stack=list(child_map[str(group["id"])])
        while stack:
            item=stack.pop(); out.append(item); stack.extend(child_map[str(item["id"])])
        return out
    marker_groups=[]
    for shape in shapes:
        if shape.get("attributes",{}).get("Type")!="Group": continue
        marks=[x for x in descendants(shape) if marker(x)]
        if len(marks) in {24,48,72,96,144,192}: marker_groups.append((shape,marks))
    banks={}; physical={}; marker_index={}
    for label in labels:
        cap=label["capacityFibers"]; shape=by_id[label["source"]["shapeIds"][0]]; lp=pin(shape); valid=[]
        for group,marks in marker_groups:
            if len(marks)!=cap: continue
            gp=pin(group); dx=abs(gp.get("x",0)-lp.get("x",0)); dy=gp.get("y",0)-lp.get("y",0)
            if dx<=3.2 and abs(dy)<=7: valid.append((abs(dy)+dx*.1,dy,group,marks,dx))
        chosen=[]
        for sign in (-1,1):
            options=sorted((x for x in valid if (x[1]<0 if sign<0 else x[1]>0)),key=lambda x:x[0])
            if options: chosen.append(options[0])
        if not chosen and valid: chosen.append(min(valid,key=lambda x:x[0]))
        banks[label["legacyId"][1:]]=[]
        for _,_,group,marks,dx in sorted(chosen,key=lambda x:pin(x[2]).get("y",0)):
            ordered=sorted(marks,key=lambda x:pin(x).get("x",0)); records=[]
            for n,mark in enumerate(ordered,1):
                tube=(n-1)//12+1; block=ordered[(tube-1)*12:tube*12]
                rings=Counter(COLOR_KEY.get(style(x,"LineColor")) for x in block); rings.pop(None,None)
                fill=style(mark,"FillForegnd"); record={"fiberNumber":n,"tubeNumber":tube,"positionInTube":(n-1)%12+1,"markerShapeId":str(mark["id"]),"fiberColorKey":COLOR_KEY.get(fill),"effectiveFiberFill":fill,"tubeColorKey":rings.most_common(1)[0][0] if rings else None,"effectiveTubeColor":style(mark,"LineColor")}
                records.append(record); marker_index[str(mark["id"]) ]={"segment":label["legacyId"][1:],"fiberNumber":n,"markerShapeId":str(mark["id"]),"tubeNumber":tube,"tubeColorKey":record["tubeColorKey"],"fiberColorKey":record["fiberColorKey"],"x":pin(mark).get("x"),"y":pin(mark).get("y")}
            banks[label["legacyId"][1:]].append({"groupShapeId":str(group["id"]),"markerCount":len(ordered),"labelGroupDx":dx,"fibers":records})
        if banks[label["legacyId"][1:]]:
            physical[label["legacyId"]]={"legacyLabel":label["legacyLabel"],"banks":[{"groupShapeId":b["groupShapeId"],"fiberCount":b["markerCount"],"fibers":[{k:v for k,v in f.items() if k!="markerShapeId"} for f in b["fibers"]]} for b in banks[label["legacyId"][1:]]],"banksAgree":len({tuple((f["fiberColorKey"],f["tubeColorKey"]) for f in b["fibers"]) for b in banks[label["legacyId"][1:]]})<=1}
    targets=defaultdict(list)
    for row in page["connects"]:
        target=marker_index.get(str(row.get("ToSheet")))
        if target: targets[str(row.get("FromSheet"))].append({**target,"connectorCell":row.get("FromCell"),"basis":"explicit_connect"})
    for connector_id in set(targets)|{str(s["id"]) for s in shapes if endpoint(s,"begin") and endpoint(s,"end")}:
        shape=by_id.get(connector_id,{})
        for side,cell in (("begin","BeginX"),("end","EndX")):
            if any(x.get("connectorCell")==cell for x in targets[connector_id]): continue
            p=endpoint(shape,side)
            if not p: continue
            aligned=[m for m in marker_index.values() if abs(m["x"]-p["x"])<=.015 and abs(m["y"]-p["y"])<=.05]
            if aligned:
                target=min(aligned,key=lambda m:abs(m["x"]-p["x"])+abs(m["y"]-p["y"]))
                targets[connector_id].append({**target,"connectorCell":cell,"basis":"source_geometry"})
    endpoints={x["legacyId"][1:]:x["endpointTokens"] for x in labels}; transitions=[]; dangling=[]
    for connector,items in sorted(targets.items(),key=lambda x:int(x[0])):
        unique={ (x["segment"],x["fiberNumber"]):x for x in items }
        vals=sorted(unique.values(),key=lambda x:(int(x["segment"]),x["fiberNumber"])); made=False
        for i,a in enumerate(vals):
            for z in vals[i+1:]:
                if a["segment"]==z["segment"]: continue
                common=set(endpoints.get(a["segment"],[]))&set(endpoints.get(z["segment"],[]))
                if len(common)!=1: continue
                transitions.append({"id":f"NFT-{next(iter(common))}-{connector}","nodeToken":next(iter(common),None),"connectorShapeId":connector,"a":a,"z":z,"basis":sorted({a.get("basis","source_geometry"),z.get("basis","source_geometry")}),"interpretationRule":"connector-to-marker-at-shared-label-endpoint-v1"}); made=True
        if vals and not made: dangling.append({"connectorShapeId":connector,"markerTargets":vals})
    transitions.sort(key=lambda x:(int(x["nodeToken"]),int(x["connectorShapeId"]),int(x["a"]["segment"]),x["a"]["fiberNumber"]))
    if args.source_only:
        args.output.write_text(json.dumps({"labels":labels,"banks":banks,"physical":physical,"transitions":transitions,"dangling":dangling},ensure_ascii=False),encoding="utf-8")
        return
    # Cross-document comparisons happen only after B has been independently
    # decoded. V1 remains read-only and each disagreement is kept explicit.
    source_a=json.loads((ROOT/"src/data/iteration24-physical-construction.json").read_text(encoding="utf-8"))
    old_segments={x["legacySegmentId"]:x for x in source_a["segments"]}
    construction_comparison={}
    for legacy in ("148","149","150","151","169"):
        b=physical.get("C"+legacy); a=old_segments.get(legacy)
        if not b or not a: continue
        old=a["records"]; old_sig=[(x["fiberColorKey"],x["tubeNumber"],x["tubeColorKey"]) for x in old]
        bank_rows=[]
        for bank in banks[legacy]:
            matched=sum((x["fiberColorKey"],x["tubeNumber"],x["tubeColorKey"])==old_sig[i] for i,x in enumerate(bank["fibers"]) if i<len(old_sig))
            diffs=[{"fiberNumber":i+1,"sourceA":{"fiberColor":old_sig[i][0],"tubeNumber":old_sig[i][1],"tubeColor":old_sig[i][2]},"sourceB":{"fiberColor":x["fiberColorKey"],"tubeNumber":x["tubeNumber"],"tubeColor":x["tubeColorKey"]}} for i,x in enumerate(bank["fibers"]) if i>=len(old_sig) or (x["fiberColorKey"],x["tubeNumber"],x["tubeColorKey"])!=old_sig[i]]
            bank_rows.append({"sourceBGroupShapeId":bank["groupShapeId"],"sourceBMarkerCount":len(bank["fibers"]),"positionMatches":matched,"positionDifferences":diffs})
        all_equal=all(not x["positionDifferences"] for x in bank_rows) and len(old)==b["banks"][0]["fiberCount"]
        construction_comparison[legacy]={"sourceAGroupShapeIds":a["groupShapeIds"],"sourceBFiberBanks":bank_rows,"fiberCountA":len(old),"fiberCountB":b["banks"][0]["fiberCount"],"state":"exact_match" if all_equal else "source_conflict","allBRepresentationBanksAgreeWithA":all_equal}
    def transition_key(node,x,z):
        if int(x["segment"])<=int(z["segment"]): return (str(node),x["segment"],x["fiberNumber"],z["segment"],z["fiberNumber"])
        return (str(node),z["segment"],z["fiberNumber"],x["segment"],x["fiberNumber"])
    a_transitions=json.loads((ROOT/"reference/tsageri-lentekhi-v1.transitions.json").read_text(encoding="utf-8"))
    old_edges=defaultdict(set); new_edges=defaultdict(set)
    for edge in a_transitions:
        if not isinstance(edge.get("a"),dict) or not isinstance(edge.get("z"),dict): continue
        x={"segment":edge["a"]["segmentId"].replace("CAB-000", ""),"fiberNumber":edge["a"]["fiberNumber"]}; z={"segment":edge["z"]["segmentId"].replace("CAB-000", ""),"fiberNumber":edge["z"]["fiberNumber"]}
        old_edges[(str(edge["node"]["id"]),tuple(sorted((x["segment"],z["segment"]))))].add(transition_key(edge["node"]["id"],x,z))
    for edge in transitions:
        new_edges[(str(edge["nodeToken"]),tuple(sorted((edge["a"]["segment"],edge["z"]["segment"]))))].add(transition_key(edge["nodeToken"],edge["a"],edge["z"]))
    transition_comparison=[]
    for key,new_set in sorted(new_edges.items(),key=lambda item:(int(item[0][0]),tuple(map(int,item[0][1])))):
        if not set(key[1]) <= {"148","149","150","151","169"}: continue
        old_set=old_edges.get(key,set())
        if not old_set: continue
        transition_comparison.append({"nodeToken":key[0],"legacySegments":list(key[1]),"sourceAFiberTransitions":len(old_set),"sourceBFiberTransitions":len(new_set),"exactPairsReproduced":len(old_set&new_set),"sourceAOnly":len(old_set-new_set),"sourceBOnly":len(new_set-old_set),"state":"exact_match" if old_set==new_set else "source_conflict"})
    c169_construction=construction_comparison.get("169",{}); c169_edges=next((x for x in transition_comparison if x["nodeToken"]=="206" and x["legacySegments"]==["150","169"]),None)
    a169={x["fiberNumber"]:x for x in old_segments["169"]["records"]}
    b169={x["fiberNumber"]:x for x in banks["169"][0]["fibers"]}
    def local_map(edges):
        result={}
        for edge in edges:
            if edge["nodeToken"]!="206" or {edge["a"]["segment"],edge["z"]["segment"]}!={"150","169"}: continue
            c=next(x for x in (edge["a"],edge["z"]) if x["segment"]=="150"); f=next(x for x in (edge["a"],edge["z"]) if x["segment"]=="169")
            result[f["fiberNumber"]]={"c150Fiber":c["fiberNumber"],"connectorShapeId":edge["connectorShapeId"],"transitionId":edge["id"]}
        return result
    b169_map=local_map(transitions)
    a169_map={}
    for edge in a_transitions:
        if not isinstance(edge.get("a"),dict) or not isinstance(edge.get("z"),dict) or edge.get("node",{}).get("id")!="206" or {edge["a"]["segmentId"],edge["z"]["segmentId"]}!={"CAB-000150","CAB-000169"}: continue
        c=next(x for x in (edge["a"],edge["z"]) if x["segmentId"]=="CAB-000150"); f=next(x for x in (edge["a"],edge["z"]) if x["segmentId"]=="CAB-000169")
        a169_map[f["fiberNumber"]]={"c150Fiber":c["fiberNumber"],"sourceShapeIds":edge.get("source",{}).get("shapeIds",[]),"transitionId":edge["id"]}
    fiber_rows=[]
    for n in range(1,49):
        a=a169[n]; b=b169[n]; am=a169_map.get(n,{}); bm=b169_map.get(n,{})
        fiber_rows.append({"fiberNumber":n,"sourceA":{"tubeNumber":a["tubeNumber"],"tubeColor":a["tubeColorKey"],"fiberColor":a["fiberColorKey"],"markerShapeId":a["markerShapeId"],"incomingC150Fiber":am.get("c150Fiber"),"transitionShapeIds":am.get("sourceShapeIds",[])},"sourceB":{"tubeNumber":b["tubeNumber"],"tubeColor":b["tubeColorKey"],"fiberColor":b["fiberColorKey"],"markerShapeId":b["markerShapeId"],"incomingC150Fiber":bm.get("c150Fiber"),"transitionConnectorShapeId":bm.get("connectorShapeId")},"fiberColorMatches":a["fiberColorKey"]==b["fiberColorKey"],"tubeColorMatches":a["tubeColorKey"]==b["tubeColorKey"] and a["tubeNumber"]==b["tubeNumber"],"SC206TransitionMatches":am.get("c150Fiber")==bm.get("c150Fiber")})
    anchors["C169"]["fiberComparisonRows"]=fiber_rows
    if len(fiber_rows)==48 and all(x["fiberColorMatches"] and x["tubeColorMatches"] and x["SC206TransitionMatches"] for x in fiber_rows) and c169_construction.get("state")=="exact_match" and c169_edges and c169_edges["state"]=="exact_match":
        anchors["C169"]["state"]="exact_match"; anchors["C169"]["basis"].extend(["all 48 source B Fiber/Tubes construction positions match V1","all 48 SC206 C150↔C169 local transition pairs match V1"]); anchors["C169"]["limitations"]=["The C169 source representation has an exact cross-document correspondence; the overall source document remains staged until every required semantic domain passes."]
    for node,segments in (("205",{"148","149","150"}),("206",{"150","151","169"})):
        related=[x for x in transition_comparison if x["nodeToken"]==node and set(x["legacySegments"]) <= segments]
        if related and all(x["state"]=="exact_match" for x in related) and len(related)>=2:
            anchors["SC"+node]["state"]="exact_match"; anchors["SC"+node]["basis"].append("multiple neighboring source-supported local Fiber transition sets reproduce V1 exactly")
    anchors["C169"]["constructionCrossValidation"]=c169_construction
    anchors["C169"]["transitionCrossValidation"]=c169_edges
    direction=[{"shapeId":s["id"],"rawText":s["text"],"worldBounds":s.get("geometry",{}).get("world_bounds")} for s in shapes if s.get("text")==DIRECTION]
    data={"schemaVersion":2,"documentId":"SRC-TSAGERI-ALPANA-TVISHI-419DEF34","source":{"filename":raw["source"]["file"],"absolutePath":raw["source"]["absolute_path"],"sha256":raw["source"]["sha256"],"sizeBytes":raw["source"]["size_bytes"],"modifiedAt":raw["source"]["modified_at"],"pageId":page["id"],"pageName":page["name"]},"versions":raw["versions"],"independentInterpretation":True,"sourceGrammar":"tsageri-alpana-tvishi-marker-and-transition-candidate/2","status":"candidate_not_active","summary":raw["summary"],"cableLabels":sorted(labels,key=lambda x:(int(x["legacyId"][1:]),x["source"]["shapeIds"][0])),"uniqueMeaningfulText":sorted(meaningful),"directionEvidence":direction,"overlapCandidates":anchors,"overlapConstructionComparison":construction_comparison,"overlapTransitionComparison":transition_comparison,"physicalConstructionCandidates":physical,"fiberTopology":{"markerBankCount":sum(len(v) for v in banks.values()),"fiberMarkerRepresentations":len(marker_index),"nodeLocalTransitions":len(transitions),"transitionEdges":transitions,"danglingConnectorGroups":dangling,"basis":"Explicit Visio Connect rows plus endpoint geometry aligned to decoded marker positions. Shared endpoint token is used to label node context; route adjacency and same Fiber number never create an edge.","active":False,"validationState":"candidate_requires_source_specific_audit"},"limits":["Raw source package and generic extraction are independently certified; operational-domain interpretation remains incomplete.","Marker grouping uses exact capacity and spatial proximity; every selected bank/transition still requires document-specific validation against the Visio source.","AP/ODF Port occupancy, company-to-Fiber assignments, meaningful annotation scope, route joins, and canonical asset matching are not fully interpreted.","Candidate overlap records and transitions do not create canonical assets or active cross-document links."]}
    args.output.parent.mkdir(parents=True,exist_ok=True); args.output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
if __name__=="__main__": main()

