#!/usr/bin/env python3
"""Build the bounded Iteration 07 path-review evidence from the raw VSDX extraction."""

from __future__ import annotations

import gzip
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "migration" / "tsageri-lentekhi.raw.json.gz"
OUTPUT = ROOT / "src" / "data" / "target-path-evidence.json"
SOURCE_SHA256 = "caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa"
COLOR_RULE = "tsageri-lentekhi-marker-colors/1"
PATH_RULE = "tsageri-lentekhi-target-path/1"
COLOR_KEYS = ("blue", "orange", "green", "brown", "slate", "white", "red", "black", "yellow", "violet", "rose", "aqua")
RAW_COLORS = {"4": "blue", "#f48c37": "orange", "9": "green", "#9c4a09": "brown", "19": "slate", "1": "white", "#ff0000": "red", "#000000": "black", "#ffff00": "yellow", "#cc99ff": "violet", "#ff00ff": "rose", "#00ffff": "aqua"}


def cell(shape: dict, name: str) -> str | None:
    return next((item.get("V") for item in shape.get("cells", []) if item.get("N") == name), None)


def xy(shape: dict, prefix: str = "Pin") -> tuple[float, float]:
    return float(cell(shape, f"{prefix}X") or 0), float(cell(shape, f"{prefix}Y") or 0)


def global_child_xy(group: dict, child: dict) -> tuple[float, float]:
    pin_x, pin_y = xy(group)
    loc_x = float(cell(group, "LocPinX") or 0)
    loc_y = float(cell(group, "LocPinY") or 0)
    child_x, child_y = xy(child)
    return pin_x - loc_x + child_x, pin_y - loc_y + child_y


def distance(a: tuple[float, float], b: tuple[float, float]) -> float:
    return round(math.dist(a, b), 6)


def marker_record(page: dict, by_id: dict[str, dict], group_id: str, number: int) -> dict:
    group = by_id[group_id]
    children = [shape for shape in page["shapes"] if shape.get("parent_id") == group_id]
    labels = [shape for shape in children if shape.get("text", "").strip() == str(number) and float(cell(shape, "PinY") or 0) > 0.15]
    if len(labels) != 1:
        raise RuntimeError(f"Expected one label {number} in group {group_id}; got {len(labels)}")
    label = labels[0]
    label_x = float(cell(label, "PinX") or 0)
    markers = [shape for shape in children if not shape.get("text", "").strip() and cell(shape, "FillForegnd") is not None and cell(shape, "LineColor") is not None]
    marker = min(markers, key=lambda shape: abs(float(cell(shape, "PinX") or 0) - label_x))
    return {
        "groupShapeId": group_id,
        "markerShapeId": marker["id"],
        "labelShapeId": label["id"],
        "rawInnerColor": cell(marker, "FillForegnd"),
        "rawOuterColor": cell(marker, "LineColor"),
        "globalMarker": list(global_child_xy(group, marker)),
    }


def main() -> None:
    with gzip.open(RAW, "rt", encoding="utf-8") as stream:
        document = json.load(stream)
    if document["source"]["sha256"] != SOURCE_SHA256:
        raise RuntimeError("Source SHA-256 changed; refuse to reuse target-path shape rules")

    page = document["pages"][0]
    by_id = {shape["id"]: shape for shape in page["shapes"]}

    c171_f29 = marker_record(page, by_id, "34109", 29)
    c172_sc217_f29 = marker_record(page, by_id, "34524", 29)
    c172_sc218_f29 = marker_record(page, by_id, "34626", 29)
    c173_sc218_f01 = marker_record(page, by_id, "34424", 1)
    c173_ap_f01 = marker_record(page, by_id, "34372", 1)

    line_sc217 = by_id["34089"]
    line_sc218 = by_id["33098"]
    line_c173_to_panel = by_id["34279"]
    line_panel_to_port = by_id["34267"]

    relationships = [
        {
            "connectionId": "sc217-34089",
            "location": {"kind": "closure", "id": "217"},
            "a": {"kind": "fiber", "segmentId": "CAB-000171", "fiber": 29},
            "z": {"kind": "fiber", "segmentId": "CAB-000172", "fiber": 29},
            "reviewResult": "accepted_connectivity",
            "operation": "unknown",
            "sourceShapeIds": ["34089", "34109", c171_f29["markerShapeId"], c171_f29["labelShapeId"], "34524", c172_sc217_f29["markerShapeId"], c172_sc217_f29["labelShapeId"]],
            "rawGeometry": {
                "lineBegin": list(xy(line_sc217, "Begin")),
                "lineEnd": list(xy(line_sc217, "End")),
                "aMarker": c171_f29["globalMarker"],
                "zMarker": c172_sc217_f29["globalMarker"],
                "aResidualInches": distance(xy(line_sc217, "Begin"), tuple(c171_f29["globalMarker"])),
                "zResidualInches": distance(xy(line_sc217, "End"), tuple(c172_sc217_f29["globalMarker"])),
            },
            "basis": "A dedicated line terminates on the numbered F29 markers in the C171 and C172 endpoint groups at SC217. The operation mechanism is not encoded.",
            "warnings": ["Fusion splice, mechanical splice, connector, and uncut continuity remain unresolved."],
        },
        {
            "connectionId": "sc218-33098",
            "location": {"kind": "closure", "id": "218"},
            "a": {"kind": "fiber", "segmentId": "CAB-000172", "fiber": 29},
            "z": {"kind": "fiber", "segmentId": "CAB-000173", "fiber": 1},
            "reviewResult": "accepted_connectivity",
            "operation": "unknown",
            "sourceShapeIds": ["33098", "34626", c172_sc218_f29["markerShapeId"], c172_sc218_f29["labelShapeId"], "34424", c173_sc218_f01["markerShapeId"], c173_sc218_f01["labelShapeId"]],
            "rawGeometry": {
                "lineBegin": list(xy(line_sc218, "Begin")),
                "lineEnd": list(xy(line_sc218, "End")),
                "aMarker": c172_sc218_f29["globalMarker"],
                "zMarker": c173_sc218_f01["globalMarker"],
                "aResidualInches": distance(xy(line_sc218, "Begin"), tuple(c172_sc218_f29["globalMarker"])),
                "zResidualInches": distance(xy(line_sc218, "End"), tuple(c173_sc218_f01["globalMarker"])),
            },
            "basis": "The dedicated diagonal line terminates on the numbered C172/F29 and C173/F01 markers. Neighboring pattern matches were not reviewed or promoted.",
            "warnings": ["Fusion splice, mechanical splice, connector, and uncut continuity remain unresolved."],
        },
        {
            "connectionId": "ap51-34267",
            "location": {"kind": "ap", "id": "51"},
            "a": {"kind": "fiber", "segmentId": "CAB-000173", "fiber": 1},
            "z": {"kind": "asset", "assetId": "51", "assetKind": "ap"},
            "reviewResult": "accepted_to_asset_port_candidate",
            "operation": "unknown",
            "candidatePort": 1,
            "sourceShapeIds": ["34371", "34424", c173_sc218_f01["markerShapeId"], c173_sc218_f01["labelShapeId"], "34279", "34372", c173_ap_f01["markerShapeId"], c173_ap_f01["labelShapeId"], "34267", "34315", "34263"],
            "rawGeometry": {
                "fiberToPanelBegin": list(xy(line_c173_to_panel, "Begin")),
                "fiberToPanelEnd": list(xy(line_c173_to_panel, "End")),
                "panelToPortBegin": list(xy(line_panel_to_port, "Begin")),
                "panelToPortEnd": list(xy(line_panel_to_port, "End")),
                "fiberMarker": c173_sc218_f01["globalMarker"],
                "panelMarker": c173_ap_f01["globalMarker"],
            },
            "basis": "C173/F01 has a continuous source line chain into the ODF-style object labelled 51. The aligned label 1 is retained as a port candidate because AP/ODF containment is unresolved.",
            "warnings": ["Destination AP51 is accepted; Port 1 and AP-versus-ODF containment remain unresolved.", "Physical connector or termination mechanism is unknown."],
        },
    ]

    c173_records = []
    for number in range(1, 13):
        sc218 = marker_record(page, by_id, "34424", number)
        ap51 = marker_record(page, by_id, "34372", number)
        if sc218["rawInnerColor"] != ap51["rawInnerColor"] or sc218["rawOuterColor"] != ap51["rawOuterColor"]:
            raise RuntimeError(f"C173/F{number:02d} marker styles differ between SC218 and AP51")
        key = RAW_COLORS.get(str(sc218["rawInnerColor"]).lower())
        if key != COLOR_KEYS[number - 1]:
            raise RuntimeError(f"Unexpected C173/F{number:02d} inner color {sc218['rawInnerColor']}")
        c173_records.append({
            "fiberNumber": number,
            "tubeNumber": 1,
            "positionInTube": number,
            "fiberColorKey": key,
            "tubeColorKey": "blue",
            "rawInnerColor": sc218["rawInnerColor"],
            "rawOuterColor": sc218["rawOuterColor"],
            "sc218": {key: sc218[key] for key in ("groupShapeId", "markerShapeId", "labelShapeId")},
            "ap51": {key: ap51[key] for key in ("groupShapeId", "markerShapeId", "labelShapeId")},
        })

    payload = {
        "schemaVersion": 1,
        "sourceSha256": SOURCE_SHA256,
        "source": {"file": "Tsageri-Lentekhi 2025.vsdx", "page": "ცაგერი-ლენტეხი", "pageId": "4", "part": "visio/pages/page1.xml"},
        "interpretationRule": PATH_RULE,
        "colorRule": COLOR_RULE,
        "review": {"reviewer": "iteration-07-source-evidence-review", "reviewedAt": "2026-09-25T00:00:00.000Z", "basis": "shape-level documentation review"},
        "relationships": relationships,
        "c173FirstTube": {"segmentId": "CAB-000173", "reviewResult": "accepted_physical_structure", "records": c173_records},
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(relationships)} relationship reviews and {len(c173_records)} C173 records to {OUTPUT}")


if __name__ == "__main__":
    main()
