import gzip
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "migration" / "tsageri-lentekhi-iteration09.raw.json.gz"
OUTPUT = ROOT / "src" / "data" / "tsageri-aggregation-evidence.json"
EXPECTED_SOURCE_SHA = "51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a"
RULE = "tsageri-lentekhi-aggregation/1"


def cell(shape, name):
    for item in shape.get("cells", []):
        if item.get("N") == name:
            value = item.get("V")
            try:
                return float(value)
            except (TypeError, ValueError):
                return value
    return None


def geometry(shape):
    return {key: cell(shape, key) for key in ("PinX", "PinY", "Width", "Height", "BeginX", "BeginY", "EndX", "EndY") if cell(shape, key) is not None}


def properties(shape):
    result = {}
    for section in shape.get("sections", []):
        if section.get("attributes", {}).get("N") != "Property":
            continue
        for row in section.get("rows", []):
            label = next((item.get("V") for item in row.get("cells", []) if item.get("N") == "Label"), None)
            value = next((item.get("V") for item in row.get("cells", []) if item.get("N") == "Value"), None)
            if label:
                result[label] = value
    return result


with gzip.open(RAW, "rt", encoding="utf-8") as stream:
    document = json.load(stream)

if document["source"]["sha256"] != EXPECTED_SOURCE_SHA:
    raise SystemExit(f"Unexpected source SHA: {document['source']['sha256']}")

page = document["pages"][0]
shape_by_id = {shape["id"]: shape for shape in page["shapes"]}


def shape_record(shape_id):
    shape = shape_by_id[shape_id]
    return {
        "shapeId": shape_id,
        "name": shape.get("attributes", {}).get("NameU"),
        "type": shape.get("attributes", {}).get("Type"),
        "text": shape.get("text", ""),
        "geometry": geometry(shape),
        "properties": properties(shape),
    }


def child_ids(parent_id):
    return [shape["id"] for shape in page["shapes"] if shape.get("parent_id") == parent_id]


def connector_band(begin_low, begin_high, end_low, end_high):
    records = []
    for shape in page["shapes"]:
        if shape.get("depth") != 0:
            continue
        begin_y, end_y = cell(shape, "BeginY"), cell(shape, "EndY")
        if not isinstance(begin_y, float) or not isinstance(end_y, float):
            continue
        if begin_low <= begin_y <= begin_high and end_low <= end_y <= end_high:
            records.append(shape["id"])
    return records


direct_port_labels = []
for shape in page["shapes"]:
    text = shape.get("text", "").strip()
    if not text.isdigit() or not 1 <= int(text) <= 24:
        continue
    pin_y = cell(shape, "PinY")
    if isinstance(pin_y, float) and 572.8 <= pin_y <= 573.4:
        direct_port_labels.append({"port": int(text), "shapeId": shape["id"]})
direct_port_labels.sort(key=lambda item: item["port"])

evidence = {
    "schemaVersion": 1,
    "interpretationRule": RULE,
    "source": document["source"],
    "rawArtifactSha256": hashlib.sha256(RAW.read_bytes()).hexdigest(),
    "page": {"id": page["id"], "name": page["name"], "part": page["part"]},
    "directlyExtracted": {
        "aggregationContainer": shape_record("12426"),
        "aggregationHeading": shape_record("12427"),
        "internalPortBank": {**shape_record("43429"), "childCount": len(child_ids("43429")), "childShapeIds": child_ids("43429")},
        "boundaryPortBank": {**shape_record("43832"), "childCount": len(child_ids("43832")), "childShapeIds": child_ids("43832")},
        "connectorBands": {
            "insideAggregationToLowerEdge": connector_band(595.3, 595.55, 623.3, 623.7),
            "lowerEdgeToOutgoingBank": connector_band(595.3, 595.55, 588.15, 588.45),
        },
        "chkhuteliOdfAp": shape_record("12432"),
        "chkhuteliDirectPortLabels": direct_port_labels,
        "chkhuteliCableLabel": shape_record("14250"),
    },
    "sourceSpecificInterpretation": {
        "aggregationShapeId": "12426",
        "logicalOdfId": "ODF-TSAGERI-01",
        "logicalPortCount": 192,
        "mirroredRepresentations": ["internal_odf_port", "aggregation_boundary_port"],
        "deduplicationKey": "ODF-TSAGERI-01/{logical-port-number}",
        "warning": "Dense connector and bank geometry includes auxiliary shapes; geometry is evidence, not exact marker-to-port optical mapping.",
    },
    "ownerConfirmed": {
        "portRanges": [
            {"start": 1, "end": 116, "destination": "Ambrolauri direction"},
            {"start": 117, "end": 130, "destination": "SC205", "continuity": "stops intentionally"},
            {"start": 131, "end": 144, "destination": "AP Chkhuteli"},
            {"start": 145, "end": 192, "destination": "Lentekhi direction"},
        ],
        "chkhuteliBackfeed": {"ports": "3-22", "destination": "Ambrolauri direction", "internalMapping": "unresolved"},
        "c172PhysicalCable": {"acceptedSegment": "CAB-000172", "upstreamEnd": "unresolved beyond SC217 toward Tsageri", "terminalEnd": "SC218", "candidateSegment": "CAB-000171"},
    },
    "unresolved": [
        "Exact individual Tsageri marker-to-logical-port index",
        "Exact fiber/termination mapping from Tsageri ports",
        "AP Chkhuteli ingress port numbers and internal mapping to ports 3-22",
        "Exact upstream physical origin and complete segment membership of the C172-containing PhysicalCable",
    ],
}

OUTPUT.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {OUTPUT.relative_to(ROOT)}")
