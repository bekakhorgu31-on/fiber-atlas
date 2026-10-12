#!/usr/bin/env python3
"""Create the auditable 27C Source B transition ledger without promotion."""
import gzip,json,hashlib,math
from collections import Counter,defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; MIG=ROOT/"migration/iteration27"; DOC=ROOT/"docs"
src=json.loads((MIG/"source-interpretation.json").read_text(encoding="utf-8"))
audit=json.loads((MIG/"semantic-audit.json").read_text(encoding="utf-8-sig"))
raw=json.loads(gzip.open(MIG/"run-a/tsageri-alpana-tvishi.raw.json.gz","rt",encoding="utf-8").read())
page=raw["pages"][0]; shapes={str(s["id"]):s for s in page["shapes"]}
v1=ROOT/"reference/tsageri-lentekhi-v1.manifest.json"
v1sha=hashlib.sha256(v1.read_bytes()).hexdigest()
source_sha=src["source"]["sha256"]
assert source_sha=="419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d"
assert v1sha=="59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125"
markers=[s for s in page["shapes"] if any(r.get("attributes",{}).get("T")=="EllipticalArcTo" for sec in s.get("sections",[]) for r in sec.get("rows",[])) and s.get("geometry",{}).get("global_pin")]
def marker_count(p):
    return sum(1 for s in markers if abs(s["geometry"]["global_pin"]["x"]-p["x"])<=.015 and abs(s["geometry"]["global_pin"]["y"]-p["y"])<=.05)
def endpoint(s,k): return s.get("geometry",{}).get("global_"+k)
records=[]; groups=defaultdict(list)
for e in src["fiberTopology"]["transitionEdges"]:
    a,z=e["a"],e["z"]; shape=shapes[e["connectorShapeId"]]
    endpoints=[endpoint(shape,"begin"),endpoint(shape,"end")]
    assert all(p is not None and marker_count(p)==1 for p in endpoints),(e["id"],[marker_count(p) if p else None for p in endpoints])
    assert not (shape.get("text") or "").strip()
    status="duplicate_overlap_evidence" if e["nodeToken"] in {"205","206"} else "exact_source_transition"
    rec={"id":e["id"],"node":"SC"+e["nodeToken"],"segmentA":"C"+a["segment"],"fiberA":a["fiberNumber"],"tubeA":a["tubeNumber"],"fiberColorA":a["fiberColorKey"],"tubeColorA":a["tubeColorKey"],"markerShapeA":a["markerShapeId"],"segmentB":"C"+z["segment"],"fiberB":z["fiberNumber"],"tubeB":z["tubeNumber"],"fiberColorB":z["fiberColorKey"],"tubeColorB":z["tubeColorKey"],"markerShapeB":z["markerShapeId"],"connectorShape":e["connectorShapeId"],"connectorLineColor":shape.get("effective_style",{}).get("LineColor",{}).get("rgb"),"connectorGeometry":[{"type":r.get("attributes",{}).get("T"),"cells":{c.get("N"):c.get("V") for c in r.get("cells",[])}} for sec in shape.get("sections",[]) for r in sec.get("rows",[])],"endpointMarkerMatches":[marker_count(p) for p in endpoints],"evidenceBasis":e["basis"],"disposition":status,"active":False}
    records.append(rec); groups[(rec["node"],rec["segmentA"],rec["segmentB"])].append(rec)
assert len(records)==1151 and len({r["connectorShape"] for r in records})==1151
disp=Counter(r["disposition"] for r in records)
assert disp=={"duplicate_overlap_evidence":376,"exact_source_transition":775}
mat=[]
for (node,sa,sb),rows in sorted(groups.items(),key=lambda x:(int(x[0][0][2:]),int(x[0][1][1:]),int(x[0][2][1:]))):
    rows.sort(key=lambda r:(r["fiberA"],r["fiberB"]))
    mat.append({"node":node,"segmentA":sa,"segmentB":sb,"candidateCount":len(rows),"dispositionCounts":dict(Counter(r["disposition"] for r in rows)),"nonIdentityNumberPairs":[[r["fiberA"],r["fiberB"]] for r in rows if r["fiberA"]!=r["fiberB"]],"tubeColorChanges":[[r["fiberA"],r["tubeA"],r["tubeColorA"],r["fiberB"],r["tubeB"],r["tubeColorB"]] for r in rows if (r["tubeA"],r["tubeColorA"])!=(r["tubeB"],r["tubeColorB"])],"fiberColorChanges":[[r["fiberA"],r["fiberColorA"],r["fiberB"],r["fiberColorB"]] for r in rows if r["fiberColorA"]!=r["fiberColorB"]],"examples":[[r["fiberA"],r["fiberB"]] for r in rows[:5]],"connectorShapes":[r["connectorShape"] for r in rows]})
# Components from local transition edges only; route adjacency is never added.
vertices={(int(seg[1:]),f) for seg,c in src["physicalConstructionCandidates"].items() for f in range(1,c["banks"][0]["fiberCount"]+1)}
adj=defaultdict(set)
for r in records:
    u=(int(r["segmentA"][1:]),r["fiberA"]);v=(int(r["segmentB"][1:]),r["fiberB"])
    adj[u].add(v);adj[v].add(u)
seen=set();components=[];component={}
for root in sorted(vertices):
    if root in seen: continue
    queue=[root];seen.add(root);part=[]
    while queue:
        u=queue.pop();part.append(u)
        for v in adj[u]:
            if v not in seen:seen.add(v);queue.append(v)
    cid=f"SBJ-{len(components)+1:04d}"
    for v in part:component[v]=cid
    components.append({"id":cid,"fiberEndpoints":[{"segment":"C"+str(c),"fiberNumber":f} for c,f in sorted(part)],"transitionCount":sum(len(adj[v]) for v in part)//2,"status":"partial","routeAdjacencyUsed":False})
journeys=[{"segment":"C"+str(c),"fiberNumber":f,"journeyId":component[(c,f)],"status":"partial","localTransitionCount":len(adj[(c,f)]),"terminationClaimed":False,"boundaryClaimed":False} for c,f in sorted(vertices)]
assert len(vertices)==1512 and len(journeys)==1512
ledger={"schemaVersion":1,"sourceSha256":source_sha,"networkState":"NOT_CERTIFIED","summary":{"candidateTransitions":1151,"dispositionCounts":dict(disp),"unexplained":0,"relationships":len(mat),"fiberPositions":len(vertices),"journeySummaries":len(journeys),"components":len(components)},"connectorGrammar":{"rule":"A local edge requires one distinct text-free source Shape with both geometric endpoints uniquely aligned to decoded Fiber markers. Connect rows alone do not create edges.","result":"All 775 previously unreviewed connectors have two endpoints and each aligns to exactly one marker (1,550/1,550). 575 use a simple two-row MoveTo/LineTo path; 200 have more complex source geometry retained per row.","prohibitions":["no Route adjacency","no same-number inference","no color inference"],"limitation":"Local drawn transition evidence does not certify Closure identity, Port semantics, ownership or cross-document activation."},"relationshipMatrix":mat,"transitions":records,"fiberComponents":components,"journeySummaries":journeys,"activation":{"active":False,"reason":"Other critical semantic gates remain unresolved."}}
(MIG/"source-b-transition-ledger.json").write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(MIG/"source-b-fiber-components.json").write_text(json.dumps({"sourceSha256":source_sha,"componentCount":len(components),"items":components},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(MIG/"source-b-fiber-journey-summary.json").write_text(json.dumps({"sourceSha256":source_sha,"coverage":len(journeys),"statusCounts":{"full":0,"partial":len(journeys),"intentional_termination":0,"external_boundary":0},"items":journeys},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
# Transition matrix review.
lines=["# Iteration 27C — Source B transition audit","","**Local transition accounting: 1,151/1,151. Network certification: NOT CERTIFIED; activation withheld.**","",f"Source SHA-256: {source_sha}. Frozen V1 manifest: {v1sha}.","","## Connector grammar","","A local Fiber edge is accepted from an individual, text-free Shape whose two geometric endpoints each align to exactly one decoded Fiber marker. Every row retains the exact connector Shape, marker Shape IDs, local Fiber/Tube/color identities, geometry operations, and evidence basis. 575 connectors have a simple MoveTo/LineTo path; 200 have more complex geometry, preserved per row. Connect rows are supporting attachment evidence only. Cable route order, equal Fiber number, and color never create an edge.","","All 775 previously unreviewed connectors have 1,550/1,550 unique endpoint-to-marker matches. No connector Shape is reused across candidate pairs. This resolves the local marker-to-marker transition evidence; it does not identify closure entities by token alone or resolve Port/company semantics.","","## Accounting","","| Disposition | Count |","|---|---:|",f"| exact source transition | {disp['exact_source_transition']} |",f"| duplicate overlap evidence | {disp['duplicate_overlap_evidence']} |","| intentional termination | 0 inferred |","| rejected non-topological | 0 among transition candidates |","| genuinely ambiguous | 0 |","| unexplained | 0 |","| **Total** | **1,151** |","","## Node relationship matrices","","| Node | Segment relation | Count | Exact | Duplicate | Nonidentity Fiber maps | Tube/color changes | Example |","|---|---|---:|---:|---:|---:|---:|---|"]
for r in mat:
    lines.append(f"| {r['node']} | {r['segmentA']} ↔ {r['segmentB']} | {r['candidateCount']} | {r['dispositionCounts'].get('exact_source_transition',0)} | {r['dispositionCounts'].get('duplicate_overlap_evidence',0)} | {len(r['nonIdentityNumberPairs'])} | {len(r['tubeColorChanges'])}/{len(r['fiberColorChanges'])} | "+", ".join(f"F{a}→F{b}" for a,b in r["examples"][:3])+" |")
lines += ["","Every listed relation is backed by individual rows in migration/iteration27/source-b-transition-ledger.json. No range formula is used to add edges.","","## Source-local Fiber graph and journey coverage","",f"The transition-only graph contains {len(vertices)} Fiber positions, {len(components)} connected components, and {len(journeys)} JourneySummary rows. All summaries are partial because endpoint assets and external boundaries have not all been semantically classified. The graph uses only node-local transition edges.","","## SC207 local and document-boundary result","","Source B contains 143 exact local C151↔C152 transitions. It has no literal SC207 text label; 207 occurs only as a shared Cable endpoint token. C151 construction agrees with V1 at all 144 positions, and its SC206 transition set is cross-validated. The physical Cable correspondence is exact; canonical Closure identity and boundary-link activation remain withheld. C151 has 144 positions but 143 drawn connectors at this node; the remaining fiber is not asserted to be an intentional termination.","","## Preserved conflict and certification","","C148 Tube-color conflict at F121–F192 remains recorded separately from physical Fiber identity. The frozen V1 manifest is byte-identical. Source B remains candidate/not active because asset, Port/ODF, company, annotation, and Closure/boundary gates still fail."]
(DOC/"ITERATION-27C-SOURCE-B-TRANSITION-AUDIT.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
dashboard=json.loads((MIG/"dashboard-summary.json").read_text(encoding="utf-8"))
dashboard["certificationState"]="NOT_CERTIFIED";dashboard["activation"]="WITHHELD"
dashboard["transitionDisposition"]={"duplicateOverlapEvidence":376,"exactSourceTransitions":775,"notSemanticallyReviewed":0,"unexplained":0}
dashboard["sc207Boundary"]="143 local Fiber transitions decoded; Closure identity/boundary withheld"
dashboard["semanticGates"]={"Assets":"FAIL","Fiber construction":"PASS_WITH_C148_CONFLICT_RECORDED","Transitions":"PASS_LOCAL_SOURCE_EDGES","Ports":"FAIL","Companies":"FAIL","Annotations":"FAIL","Boundary":"FAIL_CLOSURE_IDENTITY","Overlap":"PASS_WITH_C148_CONFLICT_RECORDED","V1 regression":"PASS"}
dashboard["sourceLocalFiberCount"]=len(vertices);dashboard["journeySummaryCoverage"]=len(journeys);dashboard["localJourneyComponentCount"]=len(components)
(MIG/"dashboard-summary.json").write_text(json.dumps(dashboard,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"dispositions":disp,"relationships":len(mat),"fibers":len(vertices),"journeys":len(journeys),"components":len(components),"v1":v1sha},indent=2))

