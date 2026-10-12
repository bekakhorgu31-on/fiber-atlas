import collections
import gzip
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "migration" / "tsageri-lentekhi-iteration09.raw.json.gz"
OUTPUT = ROOT / "src" / "data" / "iteration21-routing-evidence.json"

GROUPS = {
    "148": [["43430", "43429"], ["43833", "43832"]],
    "149": [["14251"], ["13910"]], "150": [["19355"], ["15601"]], "151": [["17264"]],
    "169": [["33954"], ["33254"]], "170": [["33752"], ["33700"]],
    "171": [["34109"], ["34777"]], "172": [["34626"], ["34524"]],
    "173": [["34424"], ["34372"]], "174": [["35376"], ["35527"]],
    "175": [["35174"], ["35122"]], "176": [["36781"], ["15253"]],
    "177": [["43278"], ["36883"]], "178": [["43022"], ["43128"]],
    "179": [["42872"], ["36373"]], "180": [["37086"], ["37290"]],
    "181": [["32572"], ["23293"]], "182": [["37908"], ["37855"]],
    "183": [["38439"], ["38386"]], "184": [["36531"], ["37188"]],
}

BRANCH_NODES = {
    "SC205": ["148", "149", "150"], "SC206": ["150", "151", "169"],
    "SC216": ["169", "170", "171"], "SC218": ["172", "173", "174"],
    "SC219": ["174", "175", "176"], "SC224": ["180", "181", "184"],
    "SC225": ["181", "182", "183"],
}

SEGMENT_ENDPOINTS = {
    "148": ["AGG5", "SC205"], "149": ["SC205", "AP41"], "150": ["SC205", "SC206"],
    "151": ["SC206", "SC207-boundary"], "169": ["SC206", "SC216"], "170": ["SC216", "AP50"],
    "171": ["SC216", "SC217"], "172": ["SC217", "SC218"], "173": ["SC218", "AP51"],
    "174": ["SC218", "SC219"], "175": ["SC219", "AP52"], "176": ["SC219", "SC220"],
    "177": ["SC220", "SC221"], "178": ["SC221", "SC222"], "179": ["SC222", "SC223"],
    "180": ["SC223", "SC224"], "181": ["SC224", "SC225"], "182": ["SC225", "AP53"],
    "183": ["SC225", "AP54"], "184": ["LENTEKHI", "SC224"],
}


def cell(shape, name):
    return next((str(item.get("V")) for item in shape.get("cells", []) if item.get("N") == name), None)


def number(shape, name):
    try:
        return float(cell(shape, name) or 0)
    except ValueError:
        return 0.0


def is_marker(shape):
    if cell(shape, "FillForegnd") is None or cell(shape, "LineColor") is None:
        return False
    return any(row.get("attributes", {}).get("T") == "EllipticalArcTo"
               for section in shape.get("sections", []) if isinstance(section, dict)
               for row in section.get("rows", []))


def main():
    with gzip.open(RAW, "rt", encoding="utf-8") as handle:
        raw = json.load(handle)
    page = raw["pages"][0]
    shapes = page["shapes"]
    by_id = {str(shape["id"]): shape for shape in shapes}
    children = collections.defaultdict(list)
    for shape in shapes:
        children[str(shape.get("parent_id"))].append(shape)

    def absolute_x(shape):
        x = number(shape, "PinX")
        parent_id = str(shape.get("parent_id"))
        if parent_id in by_id:
            parent = by_id[parent_id]
            return absolute_x(parent) - number(parent, "Width") / 2 + x
        return x

    def absolute_y(shape):
        y = number(shape, "PinY")
        parent_id = str(shape.get("parent_id"))
        if parent_id in by_id:
            parent = by_id[parent_id]
            return absolute_y(parent) - number(parent, "Height") / 2 + y
        return y

    marker_index = {}
    banks = []
    for segment, bank_sets in GROUPS.items():
        for bank_index, group_ids in enumerate(bank_sets):
            markers = sorted((item for group_id in group_ids for item in children[group_id] if is_marker(item)), key=absolute_x)
            bank = {"segment": segment, "bankIndex": bank_index, "groupShapeIds": group_ids,
                    "markerCount": len(markers), "markerShapeIds": [str(item["id"]) for item in markers]}
            banks.append(bank)
            for index, marker in enumerate(markers):
                marker_index[str(marker["id"])] = {"segment": segment, "bankIndex": bank_index,
                                                    "fiberNumber": index + 1, "groupShapeIds": group_ids,
                                                    "markerShapeId": str(marker["id"]),
                                                    "absoluteX": absolute_x(marker), "absoluteY": absolute_y(marker),
                                                    "evidenceBasis": "connect_row"}

    connector_targets = collections.defaultdict(list)
    for row in page.get("connects", []):
        target = marker_index.get(str(row.get("ToSheet")))
        if target:
            connector_targets[str(row.get("FromSheet"))].append({**target, "connectorCell": row.get("FromCell")})

    marker_positions = list(marker_index.values())
    def nearest_marker(x, y):
        candidates = [(abs(item["absoluteX"] - x) + abs(item["absoluteY"] - y), item)
                      for item in marker_positions
                      if abs(item["absoluteX"] - x) <= 0.015 and abs(item["absoluteY"] - y) <= 0.05]
        if not candidates:
            return None
        distance, item = min(candidates, key=lambda value: value[0])
        return {**item, "evidenceBasis": "endpoint_marker_alignment", "alignmentDelta": distance}

    # Some Visio lines are glued at only one end even though the other endpoint lands exactly
    # on a decoded marker. Preserve the Connect-row end and recover the opposite marker only
    # when both X and Y match within the bounded source-specific tolerance.
    connector_ids = set(connector_targets)
    connector_ids.update(str(shape["id"]) for shape in shapes
                         if shape.get("parent_id") is None and cell(shape, "BeginX") is not None and cell(shape, "EndX") is not None)
    for connector_id in sorted(connector_ids, key=int):
        connector = by_id.get(connector_id, {})
        for endpoint, cell_name in (("Begin", "BeginX"), ("End", "EndX")):
            if any(item.get("connectorCell") == cell_name for item in connector_targets[connector_id]):
                continue
            x, y = number(connector, f"{endpoint}X"), number(connector, f"{endpoint}Y")
            match = nearest_marker(x, y)
            if match:
                connector_targets[connector_id].append({**match, "connectorCell": cell_name})

    exact_edges = []
    dangling = []
    for connector_id, targets in sorted(connector_targets.items(), key=lambda item: int(item[0])):
        unique = {(item["segment"], item["bankIndex"], item["fiberNumber"]): item for item in targets}
        values = sorted(unique.values(), key=lambda item: (int(item["segment"]), item["bankIndex"], item["fiberNumber"]))
        connector = by_id.get(connector_id, {})
        connector_summary = {"shapeId": connector_id, "text": connector.get("text", ""),
                             "beginX": cell(connector, "BeginX"), "beginY": cell(connector, "BeginY"),
                             "endX": cell(connector, "EndX"), "endY": cell(connector, "EndY"),
                             "lineColor": cell(connector, "LineColor")}
        if len(values) >= 2:
            for left_index in range(len(values)):
                for right in values[left_index + 1:]:
                    left = values[left_index]
                    if left["segment"] == right["segment"]:
                        continue
                    exact_edges.append({"connector": connector_summary, "a": left, "z": right})
        elif values:
            dangling.append({"connector": connector_summary, "target": values[0]})

    compact_edges = []
    for edge in exact_edges:
        common = set(SEGMENT_ENDPOINTS.get(edge["a"]["segment"], [])) & set(SEGMENT_ENDPOINTS.get(edge["z"]["segment"], []))
        if len(common) != 1:
            continue
        node_id = next(iter(common))
        compact_edges.append({
            "id": f"NFT-{node_id}-{edge['connector']['shapeId']}", "nodeId": node_id,
            "connectorShapeId": edge["connector"]["shapeId"],
            "a": {"legacySegmentId": edge["a"]["segment"], "fiberNumber": edge["a"]["fiberNumber"],
                  "bankIndex": edge["a"]["bankIndex"], "markerShapeId": edge["a"]["markerShapeId"]},
            "z": {"legacySegmentId": edge["z"]["segment"], "fiberNumber": edge["z"]["fiberNumber"],
                  "bankIndex": edge["z"]["bankIndex"], "markerShapeId": edge["z"]["markerShapeId"]},
            "basis": sorted(set([edge["a"].get("evidenceBasis", "connect_row"), edge["z"].get("evidenceBasis", "connect_row")])),
            "geometry": {"beginX": edge["connector"]["beginX"], "beginY": edge["connector"]["beginY"],
                         "endX": edge["connector"]["endX"], "endY": edge["connector"]["endY"]},
        })

    compact_edges.sort(key=lambda edge: (edge["nodeId"], int(edge["connectorShapeId"]), int(edge["a"]["legacySegmentId"]), edge["a"]["fiberNumber"]))
    node_tables = {node: [edge["id"] for edge in compact_edges if edge["nodeId"] == node]
                   for node in BRANCH_NODES}

    result = {
        "schemaVersion": 1,
        "ruleVersion": "tsageri-lentekhi-node-fiber-transition/1",
        "source": {"file": "Tsageri-Lentekhi 2025.vsdx", "page": "ცაგერი-ლენტეხი", "pageId": "4",
                   "part": "visio/pages/page1.xml", "rawArtifact": str(RAW.relative_to(ROOT)).replace("\\", "/")},
        "method": [
            "Decode every source marker bank independently into ordered Segment-local Fiber positions.",
            "Use Visio Connect rows only when a connector endpoint is glued to a decoded marker.",
            "Where one connector end is unglued, accept the opposite endpoint only when its X/Y lands on one decoded marker within the bounded 0.015/0.05 source tolerance.",
            "Create an exact local transition only when one connector resolves to marker positions on two different Segments.",
            "Do not create transitions from Cable Route adjacency, equal number, equal color, equal capacity or physical direction.",
            "Owner anchors may classify a branch destination but never supply an unobserved target Fiber number.",
        ],
        "banks": [{key: value for key, value in bank.items() if key != "markerShapeIds"} for bank in banks],
        "exactConnectorEdges": compact_edges,
        "danglingConnectorEndpointCount": len(dangling),
        "nodeRoutingTables": node_tables,
        "ownerAnchors": {
            "GOLDEN-SC219-F32-AP52-LENTEKHI": {"node": "SC219", "segment": "176", "fiber": 32, "branchSegment": "175", "destination": "AP52"},
            "GOLDEN-LENTEKHI-P38-SC225-AP": {"node": "SC224", "segment": "184", "fiber": 38, "branchSegment": "181", "nextNode": "SC225"},
        },
    }
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT}: {len(compact_edges)} exact cross-Segment connector edges; " +
          ", ".join(f"{node}={len(edges)}" for node, edges in node_tables.items()))


if __name__ == "__main__":
    main()
