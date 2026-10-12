#!/usr/bin/env python3
"""Build a deterministic fail-closed semantic audit for staged Iteration 27."""
import collections
import gzip
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "migration/iteration27/run-a/tsageri-alpana-tvishi.raw.json.gz"
INTERPRETATION = ROOT / "migration/iteration27/source-interpretation.json"
V1_MANIFEST = ROOT / "reference/tsageri-lentekhi-v1.manifest.json"
NETWORK_MANIFEST = ROOT / "reference/fiber-atlas-network-v1.manifest.json"
OUTPUT = ROOT / "migration/iteration27/semantic-audit.json"
REPORT = ROOT / "docs/ITERATION-27B-SOURCE-B-SEMANTIC-RECONCILIATION.md"
EXPECTED_SOURCE_SHA = "419def34f310a581f0194023da0d25f6b8b44172e45b0a7b2d7785beeb11dd6d"
COMPANIES = {
    "OpenNet (Georgian label)": "ოუფენ ნეტი",
    "Magti": "მაგთი",
    "Silknet": "სილქნეტი",
    "Skytel": "სქაიტელი",
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    raw = json.loads(gzip.open(RAW, "rt", encoding="utf-8").read())
    source = json.loads(INTERPRETATION.read_text(encoding="utf-8"))
    network = json.loads(NETWORK_MANIFEST.read_text(encoding="utf-8"))
    if source["source"]["sha256"] != EXPECTED_SOURCE_SHA:
        raise SystemExit("Refusing to audit a different Source B SHA")
    shapes = raw["pages"][0]["shapes"]
    connects = raw["pages"][0]["connects"]
    shape_by_id = {str(shape["id"]): shape for shape in shapes}
    text_shapes = [shape for shape in shapes if shape.get("text", "").strip()]
    text_counts = collections.Counter()
    company_counts = collections.Counter()
    company_occurrences = []
    marker_evidence = {}
    for edge in source["fiberTopology"]["transitionEdges"]:
        for side in ("a", "z"):
            end = edge[side]
            marker_evidence[str(end["markerShapeId"])] = {"shapeId": str(end["markerShapeId"]), "x": end["x"], "y": end["y"], "fiberColor": end["fiberColorKey"], "segment": end["segment"], "fiberNumber": end["fiberNumber"]}
    for shape in text_shapes:
        text = shape["text"].strip()
        company = next((name for name, label in COMPANIES.items() if label in text), None)
        if re.fullmatch(r"\d+-\d+-\d+-\d+", text):
            category = "Cable label"
        elif company:
            category = "Company label"
            company_counts[company] += 1
        elif "გაიჭრას" in text:
            category = "Cut/module note"
        elif re.fullmatch(r"[\d\s]+", text):
            category = "Numeric/layout text"
        elif text.startswith("FO"):
            category = "Capacity note"
        elif text == "OTDR":
            category = "Technical note"
        elif "მიმართულება" in text or "გადასვლა" in text:
            category = "Route/direction note"
        elif text.startswith("Aagregacia") or text.startswith("ODF-ში"):
            category = "Aggregation/ODF note"
        elif len(text) > 2:
            category = "Place/other text"
        else:
            category = "Other short text"
        text_counts[category] += 1
        if company:
            bounds = shape.get("geometry", {}).get("world_bounds") or {}
            cx = (bounds.get("min_x", 0) + bounds.get("max_x", 0)) / 2
            cy = (bounds.get("min_y", 0) + bounds.get("max_y", 0)) / 2
            nearby = sorted((
                {"shapeId": item["shapeId"], "segment": item["segment"], "fiberNumber": item["fiberNumber"], "fiberColor": item["fiberColor"], "distance": round(((cx-item["x"])**2+(cy-item["y"])**2)**0.5, 4)}
                for item in marker_evidence.values()
            ), key=lambda item: item["distance"])[:5]
            links = []
            for connect in connects:
                if str(connect.get("FromSheet")) == str(shape["id"]):
                    other = str(connect.get("ToSheet"))
                    links.append({"connectRow": connect, "otherShapeId": other, "otherShapeType": shape_by_id.get(other, {}).get("attributes", {}).get("Type")})
                elif str(connect.get("ToSheet")) == str(shape["id"]):
                    other = str(connect.get("FromSheet"))
                    links.append({"connectRow": connect, "otherShapeId": other, "otherShapeType": shape_by_id.get(other, {}).get("attributes", {}).get("Type")})
            company_occurrences.append({"organizationText": text, "organizationKey": company, "shapeId": str(shape["id"]), "sourceDocumentId": source["documentId"], "pageName": raw["pages"][0]["name"], "worldAngle": shape.get("geometry", {}).get("world_angle"), "worldBounds": bounds, "groupPath": shape.get("group_path", []), "directConnectEvidence": links, "nearestTransitionMarkerShapes": nearby, "disposition": "unresolved_source_context", "spatialEvidenceWarning": "Nearest marker positions are spatial context only; no Fiber, Port, or company assignment is inferred."})

    edges = source["fiberTopology"]["transitionEdges"]
    by_node = collections.Counter(edge["nodeToken"] for edge in edges)
    by_pair = collections.Counter(
        (edge["nodeToken"], tuple(sorted((edge["a"]["segment"], edge["z"]["segment"]))))
        for edge in edges
    )
    cables = source["cableLabels"]
    overlap_groups = {
        ("205", ("148", "149")), ("205", ("148", "150")), ("205", ("149", "150")),
        ("206", ("150", "151")), ("206", ("150", "169")),
    }
    overlap_count = sum(count for key, count in by_pair.items() if key in overlap_groups)
    unreviewed_count = len(edges) - overlap_count
    c148 = source["overlapConstructionComparison"]["148"]
    c148_differences = c148["sourceBFiberBanks"][0]["positionDifferences"]
    c148_ranges = []
    for row in c148_differences:
        entry = {
            "firstFiber": row["fiberNumber"], "lastFiber": row["fiberNumber"],
            "tubeNumber": row["sourceA"]["tubeNumber"],
            "sourceA": {"tubeColor": row["sourceA"]["tubeColor"], "groupShapeId": c148["sourceAGroupShapeIds"][0]},
            "sourceB": {"tubeColor": row["sourceB"]["tubeColor"], "groupShapeIds": [bank["sourceBGroupShapeId"] for bank in c148["sourceBFiberBanks"]]},
        }
        if c148_ranges and c148_ranges[-1]["lastFiber"] + 1 == entry["firstFiber"] and c148_ranges[-1]["tubeNumber"] == entry["tubeNumber"] and c148_ranges[-1]["sourceA"]["tubeColor"] == entry["sourceA"]["tubeColor"] and c148_ranges[-1]["sourceB"]["tubeColor"] == entry["sourceB"]["tubeColor"]:
            c148_ranges[-1]["lastFiber"] = entry["lastFiber"]
        else:
            c148_ranges.append(entry)
    transitions = [
        {
            "node": f"SC{node}",
            "segmentPair": f"C{pair[0]} ↔ C{pair[1]}",
            "candidateCount": count,
            "crossValidatedPairs": count if (node, pair) in overlap_groups else 0,
            "validatedExact": 0,
            "disposition": "duplicate_overlap_evidence" if (node, pair) in overlap_groups else "not_semantically_reviewed",
        }
        for (node, pair), count in sorted(by_pair.items(), key=lambda item: (int(item[0][0]), int(item[0][1][0]), int(item[0][1][1])))
    ]
    candidate_tokens = sorted({edge["nodeToken"] for edge in edges}, key=int)
    blockers = [
        {"id": "transition_disposition", "count": unreviewed_count, "detail": f"The {overlap_count} SC205/SC206 pairs match the frozen V1 transition sets and are preserved as cross-document duplicate evidence. The remaining {unreviewed_count} candidate edges lack the required per-group connector-grammar and source-geometry disposition."},
        {"id": "port_odf_semantics", "count": None, "detail": "Source B numbered Port graphics, mirrored representations, occupancy, and Port↔Fiber bindings have not been completely inventoried or independently interpreted."},
        {"id": "company_assignment", "count": sum(company_counts.values()), "detail": "24 company-label occurrences are located but none has a source-validated Fiber, range, Port, Cable, duplicate-representation, or annotation disposition."},
        {"id": "annotation_status", "count": 3, "detail": "Three cut/module instructions have not been classified as planned, completed, or ambiguous from sufficient source context; they create no topology meanwhile."},
        {"id": "asset_and_route_semantics", "count": None, "detail": "Endpoint tokens and textual direction/place labels have not established the complete Aggregation, Closure, AP, route-branch, and external-boundary inventory."},
        {"id": "sc207_boundary", "count": by_node.get("207", 0), "detail": "Source B contains 143 candidate C151↔C152 edges at endpoint token 207, but Closure identity, connector meaning, and Fiber transition disposition remain unvalidated."},
        {"id": "aggregation_correspondence", "count": None, "detail": "Tsageri Aggregation/ODF shape, Ports, mirrored banks, C148 relationship, and SC205 context are not fully reconciled against V1."},
    ]
    correspondences = [
        {"canonicalCandidate": "SC205", "sourceBContextCableLabelShapeIds": ["15769", "14250", "15770"], "state": "exact_cross_document_evidence_not_activated"},
        {"canonicalCandidate": "SC206", "sourceBContextCableLabelShapeIds": ["15770", "15772", "34056"], "state": "exact_cross_document_evidence_not_activated"},
    ]
    for cable in ("148", "149", "150", "151", "169"):
        record = source["overlapCandidates"].get("C" + cable, {}).get("sourceB", {})
        label_shapes = record.get("labels", []) if isinstance(record.get("labels"), list) else []
        if not label_shapes:
            label_shapes = [label for label in cables if label["legacyId"] == "C" + cable]
        label_shape_ids = [shape_id for label in label_shapes for shape_id in label.get("source", {}).get("shapeIds", [])]
        construction = source["physicalConstructionCandidates"].get("C" + cable, {})
        marker_shape_ids = [bank.get("groupShapeId") for bank in construction.get("banks", [])]
        correspondence_state = "physical_identity_candidate_with_attribute_conflict_not_activated" if cable == "148" else "golden_cross_document_correspondence_not_activated" if cable == "169" else "construction_exact_not_activated"
        correspondences.append({"canonicalCandidate": "CAB-000" + cable, "sourceBLabelShapes": label_shape_ids, "sourceBMarkerBankShapes": marker_shape_ids, "state": correspondence_state, **({"crossValidatedFiberTransitions": 48} if cable == "169" else {})})
    conflict = {"id": "CONFLICT-C148-TUBE-COLOR", "status": "unresolved_source_conflict", "physicalIdentity": "strong_candidate_separate_from_attribute_conflict", "sourceA": {"document": "TSAGERI-LENTEKHI-REFERENCE-V1", "shapeIds": c148["sourceAGroupShapeIds"]}, "sourceB": {"document": source["documentId"], "markerBankShapeIds": [bank["sourceBGroupShapeId"] for bank in c148["sourceBFiberBanks"]]}, "affectedPositionCount": 72, "affectedRanges": c148_ranges, "fiberColorPositionsMatch": 192, "resolution": "unresolved; neither source selected; frozen V1 Tube colors remain unchanged"}
    network["candidateSource"]["certificationState"] = "NOT_CERTIFIED"
    network["sourceBSemanticCertification"] = {"state": "NOT_CERTIFIED", "activation": "WITHHELD", "gates": {"package": "PASS", "completeAssetInventory": "FAIL", "fiberTubeConstruction": "FAIL", "closureInterpretation": "FAIL", "apOdfPortInterpretation": "FAIL", "companyOccurrences": "FAIL", "meaningfulAnnotations": "FAIL", "all1151TransitionDispositions": "FAIL", "criticalTransitionAmbiguity": "UNDETERMINED", "SC207Boundary": "UNRESOLVED", "overlapCorrespondence": "PARTIAL_CANDIDATE_ONLY", "C148ConflictPreserved": "PASS", "frozenV1Unchanged": "PASS"}, "transitionDispositions": {"candidateCount": len(edges), "duplicateOverlapEvidence": overlap_count, "notSemanticallyReviewed": unreviewed_count, "activeTransitions": 0}, "sourceBInventoryCandidate": {"cableSegments": len(cables), "fiberPositionsAcrossCableLabels": sum(cable["capacityFibers"] for cable in cables), "markerBankGroups": source["fiberTopology"]["markerBankCount"], "fiberMarkerShapes": source["fiberTopology"]["fiberMarkerRepresentations"], "companyLabelOccurrences": sum(company_counts.values()), "portsCertified": 0, "transitionBearingNodeTokens": len(candidate_tokens)}, "sc207Boundary": {"state": "UNRESOLVED", "candidateTransitionCount": by_node.get("207", 0), "sourceBCableLabels": [label["legacyLabel"] for label in cables if "207" in label["endpointTokens"]]}, "combinedRoutes": [], "blockerIds": [blocker["id"] for blocker in blockers], "auditReport": "docs/ITERATION-27B-SOURCE-B-SEMANTIC-RECONCILIATION.md", "auditArtifact": "migration/iteration27/semantic-audit.json"}
    network["crossDocumentCorrespondenceCandidates"] = correspondences
    network["crossDocumentSourceConflicts"] = [conflict]
    network["promotion"] = {"status": "WITHHELD", "atomic": True, "reason": "Source B semantic certification state is NOT_CERTIFIED"}
    NETWORK_MANIFEST.write_text(json.dumps(network, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    dashboard = {"filename": network["candidateSource"]["filename"], "sha256": source["source"]["sha256"], "packageStatus": "PASS", "certificationState": "NOT_CERTIFIED", "activation": "WITHHELD", "cableLabelCount": len(cables), "overlapCandidates": {"SC205": "exact_match", "SC206": "exact_match", "C148": "source_conflict", "C149": "exact_match", "C150": "exact_match", "C151": "exact_match", "C169": "exact_match", "TsageriAggregation": "strong_candidate"}, "nodeLocalTransitionCandidates": len(edges), "transitionDisposition": {"duplicateOverlapEvidence": overlap_count, "notSemanticallyReviewed": unreviewed_count}, "c148Conflict": "unresolved_source_conflict", "c148ConflictRange": "F121–F192", "sc207Boundary": "unresolved", "directionLabel": network["namedDirectionEvidence"]["rawText"], "activeCanonicalMerges": 0, "frozenReference": network["frozenSource"]["id"]}
    (ROOT / "migration/iteration27/dashboard-summary.json").write_text(json.dumps(dashboard, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    audit = {
        "schemaVersion": 1,
        "state": "NOT_CERTIFIED",
        "activation": "withheld",
        "source": {"id": network["candidateSource"]["id"], "filename": network["candidateSource"]["filename"], "sha256": source["source"]["sha256"]},
        "package": {"gate": "PASS", **{key: source["summary"][key] for key in ("package_parts", "pages", "all_page_shapes_including_subshapes", "top_level_shapes", "grouped_subshapes", "direct_text_shapes", "connect_rows_valid", "connect_rows_dangling", "masters", "styles", "shapes_with_local_property_sections", "unresolved_effective_colors")}},
        "inventoryCandidates": {"cableSegments": len(cables), "fiberPositionsAcrossCableLabels": sum(cable["capacityFibers"] for cable in cables), "markerBankGroups": source["fiberTopology"]["markerBankCount"], "uniqueFiberMarkerShapes": source["fiberTopology"]["fiberMarkerRepresentations"], "transitionBearingNodeTokens": [f"SC{node}" for node in candidate_tokens], "endpointNumberTokensRequireAssetClassification": sorted({token for cable in cables for token in cable["endpointTokens"]}, key=lambda token: (not token.isdigit(), int(token) if token.isdigit() else token)), "portsCertified": 0, "canonicalAssetsActivated": 0, "routesActivated": 0, "fiberLineagesActivated": 0},
        "textShapeDisposition": {"totalNonemptyTextShapes": len(text_shapes), "categories": dict(sorted(text_counts.items())), "companyOccurrenceCounts": dict(sorted(company_counts.items())), "companyOccurrences": company_occurrences, "unclassifiedByOperationalScope": ["Company label assignment", "Port/ODF labels and status", "three cut/module notes", "place/direction-to-route context", "OTDR notes", "ODF shelf-order note"]},
        "transitions": {"candidateCount": len(edges), "validatedExact": 0, "intentionalTerminations": 0, "rejectedNonTopological": 0, "ambiguous": 0, "duplicateOverlapEvidence": overlap_count, "notSemanticallyReviewed": unreviewed_count, "groups": transitions, "nodeCandidateCounts": {f"SC{k}": by_node[k] for k in sorted(by_node, key=int)}},
        "overlap": {"SC205": "exact_cross_document_evidence_not_activated", "SC206": "exact_cross_document_evidence_not_activated", "C149": "construction_exact_not_activated", "C150": "construction_exact_not_activated", "C151": "construction_exact_not_activated", "C169": "48_of_48_construction_and_SC206_mapping_exact_not_activated", "C148": "physical_identity_candidate_with_preserved_tube_attribute_conflict_F121-F192", "TsageriAggregation": "strong_candidate_not_activated", "SC207": "143_source_B_transition_candidates_boundary_still_unresolved"},
        "c148Conflict": conflict,
        "gates": {"package": "PASS", "completeAssetInventory": "FAIL", "fiberTubeConstruction": "FAIL", "closureInterpretation": "FAIL", "apOdfPortInterpretation": "FAIL", "companyOccurrences": "FAIL", "meaningfulAnnotations": "FAIL", "all1151TransitionDispositions": "FAIL", "criticalTransitionAmbiguity": "UNDETERMINED", "SC207Boundary": "UNRESOLVED", "overlapCorrespondence": "PARTIAL_CANDIDATE_ONLY", "C148ConflictPreserved": "PASS", "frozenV1Unchanged": "PASS"},
        "blockers": blockers,
        "integrity": {"frozenV1ManifestSha256": sha(V1_MANIFEST), "sourceInterpretationSha256": sha(INTERPRETATION), "networkCandidateManifestSha256": sha(NETWORK_MANIFEST)},
    }
    OUTPUT.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "# Iteration 27B — Source B semantic reconciliation",
        "",
        "## Certification decision",
        "",
        "# NOT CERTIFIED",
        "",
        "Source B remains staged. The package/extraction gate passes, but the semantic and promotion gates do not. No Source B canonical asset, Route, FiberLineage, Port binding, company assignment, or topology edge is activated. The frozen V1 manifest remains unchanged.",
        "",
        "## Source identity and package gate",
        "",
        f"- `{audit['source']['filename']}` — SHA-256 `{audit['source']['sha256']}`.",
        f"- Package gate: PASS; {audit['package']['package_parts']} package parts, {audit['package']['pages']} page, {audit['package']['all_page_shapes_including_subshapes']:,} Shapes, {audit['package']['connect_rows_valid']}/{audit['package']['connect_rows_valid'] + audit['package']['connect_rows_dangling']} valid Connect rows, and zero unresolved effective colors.",
        f"- Source labels: {len(cables)} candidate Cable Segments; capacities total {sum(c['capacityFibers'] for c in cables):,} fiber positions. {audit['inventoryCandidates']['markerBankGroups']} marker-bank groups contain {audit['inventoryCandidates']['uniqueFiberMarkerShapes']:,} marker Shapes.",
        "- Endpoint-number tokens remain source candidates; they are not used alone to assign Closure/AP/Aggregation identity.",
        "",
        "## Cross-document correspondences and conflicts",
        "",
        "| Object | Evidence | Decision |",
        "|---|---|---|",
        "| SC205 | Exact identity context; all tested local pairs reproduce V1 | Candidate correspondence only; not activated |",
        "| SC206 | Exact identity context; all tested local pairs reproduce V1 | Candidate correspondence only; not activated |",
        "| C149/C150/C151 | Construction agrees at all 24/192/144 positions | Candidate correspondence only; not activated |",
        "| C169 | Exact label/endpoints; 48/48 Fiber, Tube and SC206 transition rows agree with V1 | Golden correspondence candidate; one physical identity is intended only after atomic promotion |",
        "| C148 | Same 192F label/context, all Fiber colors and tested SC205 mappings agree; Tube colors differ at F121–F192 | Keep physical identity as a candidate separate from the preserved 72-position Tube-color source conflict; do not overwrite V1 |",
        "| Tsageri Aggregation/ODF | Shape 12427 and C148/SC205 context are present | Strong candidate; Port-bank and ODF representation audit incomplete |",
        "| SC207/C151 | Source B has 143 C151↔C152 transition candidates at token 207 | Boundary remains unresolved until Closure/connector semantics are reviewed |",
        "",
        "These states are cross-document evidence, not field verification. No canonical mapping or duplicate Fiber suppression has been activated.",
        "",
        "## Cable, node, and transition candidate audit",
        "",
        f"The source interpreter generated {len(edges):,} local transition candidates across {len(by_node)} node tokens. The {overlap_count} SC205/SC206 pairs reproduce V1 and are classified as duplicate cross-document evidence (not separately activated). The other **{unreviewed_count:,}** candidates still lack an explicit semantic disposition. Route adjacency and equal Fiber number do not create edges; source connector grammar and marker alignment still require review for the remaining groups.",
        "",
        "| Node | Segment relationship | Candidate pairs | Cross-validated duplicate evidence | Active exact | Disposition |",
        "|---|---|---:|---:|---:|---|",
    ]
    for group in transitions:
        lines.append(f"| {group['node']} | {group['segmentPair']} | {group['candidateCount']} | {group['crossValidatedPairs']} | 0 | {group['disposition']} |")
    lines += ["", "Node totals: " + "; ".join(f"SC{k}: {by_node[k]}" for k in sorted(by_node, key=int)) + ".", "", "## Text, company, Port, and annotation accounting", "", f"All {len(text_shapes):,} nonempty direct-text Shapes are assigned to broad lexical buckets by the deterministic audit. This is inventory accounting, not semantic certification:", "", "| Text category | Shape occurrences |", "|---|---:|"]
    for category, count in sorted(text_counts.items()):
        lines.append(f"| {category} | {count} |")
    lines += ["", "Company occurrences are located but not assigned: " + "; ".join(f"{name}: {count}" for name, count in sorted(company_counts.items())) + f"; total {sum(company_counts.values())}. Each occurrence's raw label, Shape ID, rotation, world bounds, group ancestry, direct Connect rows, and nearest transition-marker positions are retained as non-inferential context in the machine-readable audit. The three cut/module notes (Shapes 33340, 33349 and 14985) are not classified as planned or completed. The ODF shelf-order note (Shape 41051), OTDR notes, capacity labels, place labels, and direction notes have not all been tied to a certified asset, route, Port, or Fiber range. Numbered Port graphics, mirrored banks, occupancy, and Port-to-Fiber bindings are not inventoried to a certifiable result.", "", "The exact `ლენტეხი-ხელედის მიმართულება` text at Shape 40991 is preserved as direction context, not a Fiber edge. Other place/direction texts include Alpana (28663), Tvishi (30980), and the Ambrolauri direction phrase (33691); their physical route scope remains unverified.", "", "## Critical certification blockers", "", f"1. {unreviewed_count} transitions outside the exact SC205/SC206 overlap remain without a disposition; the transition ambiguity gate is therefore undetermined.", "2. Source B Port/ODF numbered graphics, mirrored representations, status convention, and Port↔Fiber binding have no complete independent inventory.", f"3. The {sum(company_counts.values())} company occurrences have no verified assignment or duplicate/annotation classification.", "4. The three cut/module notes are not proven planned versus completed; their physical meaning remains unresolved.", "5. The full Aggregation, Closure, AP, route branch, and external-boundary inventory is not semantically reconciled. In particular SC207 has 143 candidate pairs but no certified boundary promotion.", "", "The C148 attribute conflict is fully preserved as six source-specific ranges, with no source selected and no V1 overwrite. It is not treated as evidence of a different physical Cable by itself.", "", "## Gate result and integrity", "", "Package gate: **PASS**. Semantic certification: **NOT CERTIFIED**. Activation: **WITHHELD**. The machine-readable audit is `migration/iteration27/semantic-audit.json`; the complete candidate edge and source evidence remains in `migration/iteration27/source-interpretation.json`.", "", f"Frozen V1 manifest SHA-256: `{audit['integrity']['frozenV1ManifestSha256']}`. Source interpretation SHA-256: `{audit['integrity']['sourceInterpretationSha256']}`.", ""]
    REPORT.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
