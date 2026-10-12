#!/usr/bin/env python3
"""Finalize the Iteration 27C staged reports and exact certification blockers."""
import gzip,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; MIG=ROOT/"migration/iteration27"; DOC=ROOT/"docs"
src=json.loads((MIG/"source-interpretation.json").read_text(encoding="utf-8"))
audit=json.loads((MIG/"semantic-audit.json").read_text(encoding="utf-8-sig"))
ledger=json.loads((MIG/"source-b-transition-ledger.json").read_text(encoding="utf-8"))
raw=json.loads(gzip.open(MIG/"run-a/tsageri-alpana-tvishi.raw.json.gz","rt",encoding="utf-8").read())
page=raw["pages"][0]
shapes={str(s["id"]):s for s in page["shapes"]}
texts=[s for s in page["shapes"] if (s.get("text") or "").strip()]
manifest=ROOT/"reference/tsageri-lentekhi-v1.manifest.json"
v1sha=hashlib.sha256(manifest.read_bytes()).hexdigest()
assert v1sha=="59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125"
def raw_text(s): return " ".join((s.get("text") or "").split())
meaningful=[s for s in texts if len(raw_text(s))>2 and not raw_text(s).isdecimal()]
place_names={"ალპანა","ტვიში","აჭარა","გაგულეჩი","ლაილაში","ლაჯანა","ორბელი","სურმუში","ჩხუტელი"}
company_ids={c["shapeId"] for c in audit["textShapeDisposition"]["companyOccurrences"]}
selected=[s for s in meaningful if s["id"] not in company_ids and ("მოდული" in raw_text(s) or "OTDR" in raw_text(s) or "თარო" in raw_text(s) or "მიმართულება" in raw_text(s) or "გადასვლა ქურო" in raw_text(s) or raw_text(s) in place_names)]
company=audit["textShapeDisposition"]["companyOccurrences"]
labels=src["cableLabels"]
place_text=sorted({raw_text(s) for s in selected if raw_text(s) in place_names})
notes=sorted(selected,key=lambda s:int(s["id"]))
# Asset/Port report.
asset=["# Iteration 27C — Source B asset and Port audit","","**Asset/Port semantic gate: FAIL. Source B stays staged.**","","## Cable Segment inventory","","The source has 22 exact four-field label candidates with 1,512 capacity positions and 42 marker banks / 2,928 marker representations. Endpoint tokens remain untyped source identifiers pending asset association; they are not silently promoted to AP/Closure/Aggregation objects.","","| Segment | Literal label | Endpoint tokens | Capacity |","|---|---|---|---:|"]
for x in labels: asset.append(f"| {x['legacyId']} | {x['legacyLabel']} | {x['endpointTokens'][0]} ↔ {x['endpointTokens'][1]} | {x['capacityFibers']} |")
asset += ["","## Closures and node candidates","","Transition-bearing node tokens are SC205–SC215 (11 groups); the transition ledger supplies exact local connector evidence per relationship. Source B contains no literal text matching SC205…SC215; the numbers are shared Cable endpoint tokens. The Closure graphic/entity correspondence is therefore not independently certified for canonical merging, including SC207.","","## Aggregation, AP and ODF","","- Aggregation text candidates: Shape 12427, raw source text “Aagregacia #5” and “cageri” appear in the source context; nearby C148 and C150 labels make Tsageri Aggregation a strong candidate, but geometry/context is not sufficient for an exact canonical Port/ODF relation in the current audited inventory.\n- ODF shelf-order note: retained verbatim at Shape 41051; it says shelves I and II are mixed and gives 1–12 orange / 13–24 blue. This records an ordering/color annotation, not Fiber-to-Port occupancy.\n- AP/ODF-like Port inventory: 0 logical Ports certified; 0 occupancy bindings certified; 0 Port↔Fiber bindings activated. Numbered labels are present as layout text, but no audited source rule presently binds them to a logical ODF Port and physical Fiber marker.\n- AP/Closure interpretation is not inferred from endpoint number alone. Cable endpoints 5, 41–49, 205–216 and 225 remain source tokens unless a drawing asset and relationship are independently established.","","## Certification limit","","The import may create staged Cable/Fiber source representations, but canonical assets, APs, ODF Ports, occupancy, or availability remain withheld. Exact blocker: asset identity and Port semantics are not tied by a source-decoded typed bank/connector rule. An owner/engineering Port schedule can resolve Port numbering, occupancy, and whether an asset is an AP/ODF; Closure canonical identities need a source-marked label or confirmed correspondence."]
(DOC/"ITERATION-27C-SOURCE-B-ASSET-PORT-AUDIT.md").write_text("\n".join(asset)+"\n",encoding="utf-8")
# Company and annotations.
co=["# Iteration 27C — Company and annotation audit","","**Occurrence accounting: PASS. Company assignment and annotation-scope gates: FAIL.**","","## Company occurrences","","All 24 labels are individually retained below. Current extraction finds no direct Connect rows for these labels; nearest marker geometry is context only and is not treated as company ownership or Fiber usage.","","| Shape | Label | Orientation | Source disposition |","|---:|---|---:|---|"]
for c in company: co.append(f"| {c['shapeId']} | {c['organizationText']} ({c['organizationKey']}) | {c['worldAngle']:.3f} rad | occurrence accounted; assignment unresolved |")
co += ["","Counts: Magti 10; OpenNet (Georgian label) 8; Silknet 5; Skytel 1. No occurrence is omitted, and no usage or ownership has been inferred from proximity.","","## Meaningful annotation occurrences","","The source extraction accounts for 3,569 nonempty text Shapes in deterministic lexical buckets. The following operational text occurrences are individually listed; their raw text is preserved (whitespace normalized in this table).","","| Shape | Raw text | Current semantic status |","|---:|---|---|"]
for s in notes:
    t=raw_text(s).replace("|","\\|").replace("\n"," / ")
    co.append(f"| {s['id']} | {t} | occurrence accounted; route/scope/status not promoted without evidence |")
co += ["","The three cut/module notes (Shapes 14985, 33340, 33349) are retained individually; source text alone does not establish completed versus planned work. OTDR notes and the ODF shelf-order note are preserved as technical/layout annotations. The Lentekhi–Kheledi and Ambrolauri direction text is preserved as direction context only; neither creates a Fiber edge or external boundary by itself.","","## Exact semantic blockers","","- Company: 24 occurrences have not been reconciled to a logical assignment, Port/Fiber range, or ownership/usage semantics; no direct Connect attachment exists in the extracted evidence. Owner confirmation or an authoritative company-use schedule is needed for assignments not encoded in the drawing.\n- Cut/module status: 3 notes lack a source status/date/legend that distinguishes completed from planned cuts. Owner confirmation is needed only for those three statuses.\n- Route/place scope: 9 place/other text occurrences and two direction texts are inventoried, but drawing scope is not deterministically tied to a single Cable/branch in the current decoded source. The source drawing or owner must identify the intended route scope before creating external boundaries."]
(DOC/"ITERATION-27C-COMPANY-ANNOTATION-AUDIT.md").write_text("\n".join(co)+"\n",encoding="utf-8")
# Boundary report.
sc207=[e for e in ledger["transitions"] if e["node"]=="SC207"]
missing=sorted(set(range(1,145))-{e["fiberA"] for e in sc207})
bound=["# Iteration 27C — Source B boundary reconciliation","","**SC207 local topology: decoded. Cross-document Closure/boundary activation: withheld.**","","## SC207 local evidence","",f"Source B has {len(sc207)} individual connector-backed C151↔C152 transitions. Both endpoints of all {len(sc207)} connectors align to unique marker Shapes. Fiber numbers map identity-to-identity for all observed pairs. C151 has 144 positions; the source draws {len(sc207)} local connectors. Position(s) without a connector: "+(", ".join(f"F{x}" for x in missing) if missing else "none")+"; the drawing does not label a termination there, so none is asserted.","","## Cross-document evidence","","C151 has an exact label and 144/144 Fiber/Tubes/colors physical-construction agreement with frozen V1; its SC206 local transition set also reproduces V1. This supports one shared physical Cable correspondence without duplicating its Fiber identities. Source B then supplies the local C151↔C152 transition at the far end.","","## Remaining boundary blocker","","The Visio text inventory contains no literal SC207 label; 207 is a Cable endpoint token. The source-only extraction therefore cannot prove that the represented Closure is canonical SC207, rather than merely inferring the number from Cable labels. Keep the local transition graph staged and withhold the canonical Closure/boundary object link pending a source-marked Closure label or owner-confirmed correspondence. The owner can resolve canonical naming/identity; the 143 local Fiber mappings are already source-derived.","","## Ambrolauri","","Raw direction annotation is preserved at Shape 33691: “გადასვლა ქურო N162-ში / ამბროლაურის მიმართულება”. It does not identify a decoded Cable endpoint or an imported continuation target. No external boundary is created from this text alone."]
(DOC/"ITERATION-27C-BOUNDARY-RECONCILIATION.md").write_text("\n".join(bound)+"\n",encoding="utf-8")
# Certification report final decision, overlap report update, handoff.
cert=DOC/"ITERATION-27-TSAGERI-ALPANA-TVISHI-CERTIFICATION.md"
ct=cert.read_text(encoding="utf-8")
marker="\n\n## Iteration 27C final gate\n"
if marker in ct: ct=ct.split(marker)[0]
ct += marker + "\n**NOT CERTIFIED. Activation remains WITHHELD.** Source-local transition decoding is complete: 775 previously unreviewed candidates are individually supported by unique marker-to-marker connector geometry, and 376 SC205/SC206 candidates remain duplicate overlap evidence. The 1,151-candidate accounting has zero unexplained rows. Source B now has 1,512 partial JourneySummary records derived only from local transitions. These results do not authorize partial network activation.\n\nExact critical blockers:\n\n1. **Asset/Port semantics:** zero logical Ports or occupancy bindings are certified. The ODF shelf note is preserved, but no decoded source rule binds a logical Port to a Fiber marker; endpoint tokens also do not independently certify Closure/AP identity. Owner/engineering confirmation can resolve Port numbering and occupancy; Closure canonical identity needs a source-marked label or owner correspondence.\n2. **Company assignment:** 24/24 occurrences are inventoried (Magti 10, OpenNet 8, Silknet 5, Skytel 1), but the source has no decoded direct assignment to a Port/Fiber range. Owner confirmation or an authoritative usage schedule is needed for those assignments.\n3. **Annotations and route scope:** three cut/module notes do not encode planned/completed status; nine place/other labels and two direction texts lack a source-supported branch scope. Owner confirmation is needed for the three cut statuses and the intended route scope where the drawing does not bind the note.\n4. **SC207 cross-document asset link:** 143/143 local C151↔C152 transitions are decoded and C151 matches V1 at 144/144 physical positions, but Source B has no literal SC207 Closure label. Keep the physical Cable correspondence as evidence and withhold the canonical Closure/boundary link pending source-marked or owner-confirmed identity.\n\nC148's F121–F192 Tube-color conflict remains explicit and separate from physical identity. Frozen V1 manifest SHA-256 remains " + v1sha + ". See the Iteration 27C audit reports and source-b-transition-ledger.json.\n"
cert.write_text(ct,encoding="utf-8")
overlap=DOC/"ITERATION-27-OVERLAP-RECONCILIATION.md"
ot=overlap.read_text(encoding="utf-8")
marker="\n\n## Iteration 27C staged decisions\n"
if marker in ot: ot=ot.split(marker)[0]
ot += marker+"\nSource-local transition decoding is complete and does not change the frozen reference: SC205/SC206 retain 376 duplicate-overlap transitions; the other 775 connector-to-marker edges are source-local transitions in the staged Source B graph. C149, C150, C151 and C169 remain exact construction correspondences as previously documented. C148 remains a preserved source conflict at Tube colors F121–F192; no V1 data was overwritten. SC207 has 143 source-supported local C151↔C152 transitions; the physical C151 correspondence is exact, but Closure identity/boundary link is withheld because no literal SC207 label is in Source B. No canonical merge or network link is active.\n"
overlap.write_text(ot,encoding="utf-8")
hand=ROOT/"HANDOFF.md"; ht=hand.read_text(encoding="utf-8")
marker="\n\n## Iteration 27C — Source B semantic decoding (2026-09-30)\n"
if marker in ht: ht=ht.split(marker)[0]
ht += marker+"\nState: **NOT CERTIFIED / CANDIDATE_NOT_ACTIVE**. The Source B source SHA remains 419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d. All 1,151 transition candidates are accounted: 376 duplicate overlap evidence at SC205/SC206 and 775 exact local connector-to-marker transitions at SC207–SC215; zero unexplained candidates. The 775 individual edges each retain source connector and marker Shape IDs, geometry rows, Fiber/Tube/color context and unique endpoint marker checks. Route adjacency, equal number, and color were not used to create an edge. Source B has 1,512 partial JourneySummary rows in 361 transition-only connected components; no unsupported full route or intentional termination is claimed.\n\nSC207: 143 C151↔C152 local transitions decoded; C151 construction matches V1 at all 144 positions. Fiber 118 has no drawn connector and is not called terminated. Source B has no literal SC207 label, so the Closure identity/boundary link is withheld. C148 F121–F192 Tube-color conflict remains separate and V1 manifest remains byte-identical at SHA-256 59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125.\n\nOther critical blockers: Port/ODF inventory has 0 certified logical Ports/occupancy bindings; 24 company labels are inventoried but assignment/ownership semantics are unresolved; 3 cut-module notes lack planned/completed status; place and direction annotations lack a source-supported Cable/branch scope. Source B remains staged; no canonical assets, routes, lineages, or cross-document boundary links are active. See docs/ITERATION-27C-SOURCE-B-TRANSITION-AUDIT.md, docs/ITERATION-27C-SOURCE-B-ASSET-PORT-AUDIT.md, docs/ITERATION-27C-COMPANY-ANNOTATION-AUDIT.md, docs/ITERATION-27C-BOUNDARY-RECONCILIATION.md, and migration/iteration27/source-b-transition-ledger.json.\n"
hand.write_text(ht,encoding="utf-8")
sem_path=MIG/"semantic-audit.json"
sem=json.loads(sem_path.read_text(encoding="utf-8-sig"))
sem["state"]="NOT_CERTIFIED";sem["activation"]="withheld"
sem["transitions"].update({"validatedExact":775,"intentionalTerminations":0,"rejectedNonTopological":0,"ambiguous":0,"duplicateOverlapEvidence":376,"notSemanticallyReviewed":0,"unexplained":0,"connectorGrammar":"source-geometry endpoints uniquely aligned to one decoded Fiber marker at each end","journeySummaryCoverage":1512,"journeyStatusCounts":{"full":0,"partial":1512,"intentional_termination":0,"external_boundary":0}})
for row in sem["transitions"]["groups"]:
    row["validatedExact"]=row["candidateCount"] if row["node"] not in {"SC205","SC206"} else 0
    if row["node"] not in {"SC205","SC206"}: row["disposition"]="exact_source_transition"
sem["gates"].update({"fiberTubeConstruction":"PASS_SOURCE_BANKS_AGREE_C148_CONFLICT_RECORDED","all1151TransitionDispositions":"PASS_ZERO_UNEXPLAINED","criticalTransitionAmbiguity":"PASS_NONE","SC207Boundary":"LOCAL_TOPOLOGY_PASS_CANONICAL_ID_UNRESOLVED"})
sem["blockers"]=[
 {"id":"asset_port_semantics","count":0,"detail":"Zero logical Ports and occupancy bindings are certified; source Port/ODF numbering is not yet tied to marker fibers. Owner/engineering schedule can resolve Port/occupancy semantics."},
 {"id":"company_assignment","count":24,"detail":"All 24 company occurrences are located, but no source-validated Port/Fiber usage or ownership assignment exists; owner confirmation or authoritative schedule needed."},
 {"id":"annotation_status_and_scope","count":14,"detail":"Three cut-module notes lack planned/completed status, and nine place/other labels plus two directions lack a source-supported route branch scope."},
 {"id":"sc207_closure_identity","count":1,"detail":"143 local C151↔C152 transitions are decoded and C151 matches V1 at all 144 construction positions, but the source has no literal SC207 label; canonical Closure/boundary link withheld pending marked or owner-confirmed identity."},
 {"id":"aggregation_canonical_correspondence","count":1,"detail":"Shape 12427 is an Aggregation candidate but its ODF/Port relationship and exact canonical correspondence are not certified."}
]
sem_path.write_text(json.dumps(sem,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
net_path=ROOT/"reference/fiber-atlas-network-v1.manifest.json"
net=json.loads(net_path.read_text(encoding="utf-8"))
net["candidateSource"]["sourceLocalTransitionLedgerSha256"]=hashlib.sha256((MIG/"source-b-transition-ledger.json").read_bytes()).hexdigest()
net["candidateSource"]["sourceLocalJourneySummarySha256"]=hashlib.sha256((MIG/"source-b-fiber-journey-summary.json").read_bytes()).hexdigest()
for candidate in net.get("overlapCandidates",[]):
    if "SC207" in candidate.get("sourceB",""): candidate["state"]="local_topology_decoded_closure_identity_unresolved"
gate=net["sourceBSemanticCertification"]
gate["gates"]=sem["gates"]
gate["transitionDispositions"]={"candidateCount":1151,"duplicateOverlapEvidence":376,"exactSourceTransitions":775,"notSemanticallyReviewed":0,"unexplained":0,"activeTransitions":0}
gate["sc207Boundary"]={"state":"LOCAL_TRANSITIONS_DECODED_CANONICAL_CLOSURE_ID_UNRESOLVED","candidateTransitionCount":143,"unmappedFiberNumber":118,"sourceBCableLabels":["151-206-207-144","152-207-208-144"]}
gate["blockerIds"]=[x["id"] for x in sem["blockers"]]
gate["auditReport"]="docs/ITERATION-27C-SOURCE-B-TRANSITION-AUDIT.md"
gate["assetPortAuditReport"]="docs/ITERATION-27C-SOURCE-B-ASSET-PORT-AUDIT.md"
gate["companyAnnotationAuditReport"]="docs/ITERATION-27C-COMPANY-ANNOTATION-AUDIT.md"
gate["boundaryAuditReport"]="docs/ITERATION-27C-BOUNDARY-RECONCILIATION.md"
gate["transitionLedger"]="migration/iteration27/source-b-transition-ledger.json"
gate["journeySummary"]="migration/iteration27/source-b-fiber-journey-summary.json"
net_path.write_text(json.dumps(net,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
sem["integrity"]["networkCandidateManifestSha256"]=hashlib.sha256(net_path.read_bytes()).hexdigest()
sem["integrity"]["transitionLedgerSha256"]=hashlib.sha256((MIG/"source-b-transition-ledger.json").read_bytes()).hexdigest()
sem["integrity"]["journeySummarySha256"]=hashlib.sha256((MIG/"source-b-fiber-journey-summary.json").read_bytes()).hexdigest()
sem_path.write_text(json.dumps(sem,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
report27b=DOC/"ITERATION-27B-SOURCE-B-SEMANTIC-RECONCILIATION.md"
r27b=report27b.read_text(encoding="utf-8")
note="\n\n## Iteration 27C superseding transition update\n\nThe 775 rows described above were unreviewed at the 27B snapshot. Iteration 27C individually validated all 775 from unique connector-to-marker geometry. Together with 376 overlap rows, 1,151/1,151 dispositions are now accounted with zero unexplained candidates. The 27B status remains a historical snapshot; current decision and exact remaining blockers are in docs/ITERATION-27-TSAGERI-ALPANA-TVISHI-CERTIFICATION.md and the four 27C reports. Asset/Port, company, annotation, and SC207 Closure identity gates remain open.\n"
marker="\n\n## Iteration 27C superseding transition update\n"
if marker in r27b:r27b=r27b.split(marker)[0]
report27b.write_text(r27b+note,encoding="utf-8")
print(json.dumps({"meaningfulOperationalTextOccurrences":len(selected),"companyOccurrences":len(company),"cutAndOtherNotes":len(notes),"cableLabels":len(labels),"placeTerms":place_text,"v1Sha256":v1sha},ensure_ascii=False,indent=2))
