"""Build the progressively expanded Iteration 09 Cable Route from reviewed source labels.

This does not infer a shared physical sheath or closure treatment. It preserves
unimported route gaps and the conflicting Lentekhi aggregation identity.
"""

from __future__ import annotations

import json
import gzip
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "data" / "source-evidence.json"
OUTPUT = ROOT / "src" / "data" / "primary-route-evidence.json"
EXPECTED_EVIDENCE_SHA = "caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa"
CURRENT_SOURCE_SHA = "51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a"
CURRENT_RAW = ROOT / "migration" / "tsageri-lentekhi-iteration09.raw.json.gz"


def source_ref(shape_ids: list[str], note: str) -> dict:
    return {
        "file": "Tsageri-Lentekhi 2025.vsdx",
        "page": "ცაგერი-ლენტეხი",
        "pageId": "4",
        "part": "visio/pages/page1.xml",
        "shapeIds": shape_ids,
        "interpretationRule": "tsageri-lentekhi-primary-cable-route/2",
        "note": note,
    }


def main() -> None:
    evidence = json.loads(SOURCE.read_text(encoding="utf-8"))
    if evidence["source_sha256"] != EXPECTED_EVIDENCE_SHA:
        raise RuntimeError("Unexpected preserved structured-evidence hash")
    with gzip.open(CURRENT_RAW, "rt", encoding="utf-8") as stream:
        current_raw = json.load(stream)
    if current_raw["source"]["sha256"] != CURRENT_SOURCE_SHA:
        raise RuntimeError("Unexpected current source hash")

    cables = {record["id"]: record for record in evidence["cables"]}
    expected = {
        "148": "148-5-205-192",
        "150": "150-205-206-192",
        "169": "169-206-216-48",
        "170": "170-216-50-24",
        "171": "171-216-217-48",
        "172": "172-217-218-48",
        "173": "173-218-51-24",
        "174": "174-218-219-48",
        "176": "176-219-220-48",
        "177": "177-220-221-48",
        "178": "178-221-222-48",
        "179": "179-222-223-48",
        "180": "180-223-224-48",
        "184": "184-6-224-48",
    }
    for cable_id, label in expected.items():
        if cables.get(cable_id, {}).get("legacy_label") != label:
            raise RuntimeError(f"Missing or changed route label {label}")
    current_texts = {shape["text"].strip() for page in current_raw["pages"] for shape in page["shapes"] if shape.get("text", "").strip()}
    for label in (*expected.values(), "Alpana-Tvishi-Ambrolauri directiion"):
        if label not in current_texts:
            raise RuntimeError(f"Current source no longer contains {label}")

    closures = {record["id"]: record for record in evidence["closures"]}
    aggregation5 = next(record for record in evidence["aggregations"] if record.get("id_candidate") == "5" and record.get("name") == "ცაგერი")
    aggregation6 = next(record for record in evidence["aggregations"] if record.get("id_candidate") == "6")

    def cable_shapes(*ids: str) -> list[str]:
        return [shape for cable_id in ids for shape in cables[cable_id]["source"]["shape_ids"]]

    def closure_shapes(closure_id: str) -> list[str]:
        return list(closures[closure_id]["source"]["shape_ids"])

    nodes = [
        {
            "id": "node-agg5",
            "sequence": 0,
            "asset": {"kind": "aggregation", "id": "5"},
            "label": "AGG5 · ცაგერი",
            "treatment": "aggregation_termination",
            "treatmentVerification": "documentation_reviewed",
            "verification": "documentation_reviewed",
            "source": source_ref(list(aggregation5["source"]["shape_ids"]) + cable_shapes("148"), "AGG5 is the documented Tsageri-side route origin; SC205 is the next explicit route node."),
            "warnings": [],
        },
        *[
            {
                "id": f"node-sc{closure_id}",
                "sequence": sequence,
                "asset": {"kind": "closure", "id": closure_id},
                "label": f"SC{closure_id}",
                "treatment": "unknown",
                "treatmentVerification": "needs_verification",
                "verification": "documentation_reviewed",
                "source": source_ref(closure_shapes(closure_id), "Closure identity is documented; cable treatment is not established by the source."),
                "warnings": ["Cable cut, mid-span access, pass-through, and termination treatment remain unresolved."],
            }
            for sequence, closure_id in enumerate(("205", "206", "216", "217", "218", "219", "220", "221", "222", "223", "224"), start=1)
        ],
        {
            "id": "node-lentekhi-boundary",
            "sequence": 12,
            "asset": None,
            "label": "ლენტეხის მიმართულება · დაუდასტურებელი აგრეგაცია",
            "treatment": "unknown",
            "treatmentVerification": "needs_verification",
            "verification": "needs_verification",
            "source": source_ref(cable_shapes("184") + list(aggregation6["source"]["shape_ids"]), "C184 continues from SC224 toward the Lentekhi aggregation symbol, whose heading and property IDs conflict."),
            "warnings": ["The heading says aggregation 6 while a property says 5; no inventory asset is created for this endpoint."],
        },
    ]

    leg_specs = (
        ("148", "agg5", "sc205"),
        ("150", "sc205", "sc206"),
        ("169", "sc206", "sc216"),
        ("171", "sc216", "sc217"),
        ("172", "sc217", "sc218"),
        ("174", "sc218", "sc219"),
        ("176", "sc219", "sc220"),
        ("177", "sc220", "sc221"),
        ("178", "sc221", "sc222"),
        ("179", "sc222", "sc223"),
        ("180", "sc223", "sc224"),
    )
    legs = [
        *[
            {
                "id": f"route-leg-c{cable_id}",
                "sequence": sequence,
                "fromNodeId": f"node-{from_id}",
                "toNodeId": f"node-{to_id}",
                "segmentId": f"CAB-000{cable_id}",
                "relationship": "segment",
                "sourceLabel": expected[cable_id],
                "verification": "documentation_reviewed",
                "source": source_ref(cable_shapes(cable_id), f"Legacy label {expected[cable_id]} establishes this node-to-node Cable Segment."),
                "warnings": ["Route membership does not establish a shared PhysicalCable or the treatment inside either closure."],
            }
            for sequence, (cable_id, from_id, to_id) in enumerate(leg_specs)
        ],
        {
            "id": "route-leg-c184-unresolved-endpoint",
            "sequence": 11,
            "fromNodeId": "node-sc224",
            "toNodeId": "node-lentekhi-boundary",
            "segmentId": None,
            "relationship": "unresolved_leg",
            "sourceLabel": expected["184"],
            "verification": "conflicting",
            "source": source_ref(cable_shapes("184"), "Legacy label 184-6-224-48 documents the final source segment, but aggregation 6 conflicts with property ID 5."),
            "warnings": ["C184 is preserved as source evidence but not promoted to Cable Segment inventory until the aggregation endpoint identity is resolved."],
        },
    ]

    branches = [
        {
            "id": "route-direction-alpana-tvishi-ambrolauri",
            "fromNodeId": "node-sc206",
            "destination": None,
            "segmentIds": [],
            "role": "branch",
            "branchKind": "named_direction",
            "sourceLabel": "Alpana-Tvishi-Ambrolauri directiion",
            "targetDirectionText": "Alpana–Tvishi–Ambrolauri direction",
            "linkedRouteId": None,
            "destinationRole": "external_direction",
            "treatment": "unknown",
            "treatmentVerification": "needs_verification",
            "verification": "documentation_reviewed",
            "source": source_ref(["44235"], "The exact source text names an external direction from the SC206 area; it does not establish a Cable Segment or optical connection."),
            "warnings": ["No linked Cable Route, destination asset, Cable Segment, or optical continuity is inferred."],
        },
        {
            "id": "route-branch-ap50",
            "fromNodeId": "node-sc216",
            "destination": {"kind": "ap", "id": "50"},
            "segmentIds": ["CAB-000170"],
            "role": "branch",
            "branchKind": "asset_branch",
            "sourceLabel": expected["170"],
            "targetDirectionText": None,
            "linkedRouteId": None,
            "destinationRole": "ap_termination",
            "treatment": "unknown",
            "treatmentVerification": "needs_verification",
            "verification": "documentation_reviewed",
            "source": source_ref(cable_shapes("170"), "Legacy label 170-216-50-24 documents a separate branch segment from SC216 to AP50."),
            "warnings": ["AP/ODF containment and the physical branch treatment remain unresolved; no optical mapping at SC216 is inferred."],
        },
        {
            "id": "route-branch-ap51",
            "fromNodeId": "node-sc218",
            "destination": {"kind": "ap", "id": "51"},
            "segmentIds": ["CAB-000173"],
            "role": "branch",
            "branchKind": "asset_branch",
            "sourceLabel": expected["173"],
            "targetDirectionText": None,
            "linkedRouteId": None,
            "destinationRole": "ap_termination",
            "treatment": "unknown",
            "treatmentVerification": "needs_verification",
            "verification": "documentation_reviewed",
            "source": source_ref(cable_shapes("173"), "Legacy label 173-218-51-24 documents a branch segment from SC218 to AP51."),
            "warnings": ["The branch segment ends at AP51, but this does not terminate the main route; AP/ODF containment remains unresolved."],
        },
    ]

    all_shapes = list(dict.fromkeys(
        list(aggregation5["source"]["shape_ids"])
        + list(aggregation6["source"]["shape_ids"])
        + cable_shapes(*expected.keys())
        + [shape for closure_id in ("205", "206", "216", "217", "218", "219", "220", "221", "222", "223", "224") for shape in closure_shapes(closure_id)]
        + ["44235"]
    ))
    output = {
        "schemaVersion": 2,
        "sourceSha256": CURRENT_SOURCE_SHA,
        "interpretationRule": "tsageri-lentekhi-primary-cable-route/2",
        "review": {"reviewer": "iteration-09-route-and-annotation-review", "reviewedAt": "2026-09-25T00:00:00.000Z"},
        "route": {
            "id": "ROUTE-TSAGERI-LENTEKHI-CORE",
            "displayName": "AGG5 · ცაგერი → ლენტეხის მიმართულება",
            "origin": {
                "state": "known",
                "asset": {"kind": "aggregation", "id": "5"},
                "label": "AGG5 · ცაგერი",
                "verification": "documentation_reviewed",
                "source": source_ref(list(aggregation5["source"]["shape_ids"]) + cable_shapes("148"), "Tsageri aggregation 5 is the documented route-side origin."),
            },
            "destination": {
                "state": "unresolved",
                "label": "ლენტეხის მიმართულება · აგრეგაცია დაუდასტურებელია",
                "candidateAssetLabel": "AGG6 სათაური / property ID 5",
                "verification": "conflicting",
                "source": source_ref(list(aggregation6["source"]["shape_ids"]) + cable_shapes("184"), "The route reaches the Lentekhi aggregation symbol, but its source identifiers conflict."),
                "warnings": ["Do not create or link an AGG6 inventory record until the heading/property conflict is resolved."],
            },
            "nodes": nodes,
            "legs": legs,
            "branches": branches,
            "condition": "unknown",
            "conditionVerification": "needs_verification",
            "documentation": "incomplete",
            "verification": "documentation_reviewed",
            "physicalCableId": None,
            "allowCircular": False,
            "source": source_ref(all_shapes, "Ordered route is built from the documented endpoint chain; physical sheath identity and closure treatments are not inferred."),
            "warnings": [
                "This is an operational Cable Route, not a PhysicalCable/CableRun identity.",
                "The expanded pilot imports C148/C150, C169/C171/C172/C174 and C176–C180; only C184 remains an unresolved leg because its aggregation endpoint identity conflicts.",
                "AP50 and AP51 are branches and do not terminate the main route.",
                "The named SC206 direction is topological context only and creates no optical connectivity.",
            ],
        },
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(nodes)} nodes, {len(legs)} legs and {len(branches)} branches to {OUTPUT}")


if __name__ == "__main__":
    main()
