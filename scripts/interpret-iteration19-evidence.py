import collections
import gzip
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "migration" / "tsageri-lentekhi-iteration09.raw.json.gz"
OUTPUT = ROOT / "src" / "data" / "iteration19-physical-evidence.json"

SOURCE_SHA256 = "51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a"
RULE = "tsageri-lentekhi-marker-colors/2"

# Each entry names the complete marker bank at one cable end. C148 uses a
# second overlay group for Fibers 169-192. The other entries are single groups.
GROUPS = {
    "148": [["43430", "43429"], ["43833", "43832"]],
    "149": [["14251"], ["13910"]],
    "150": [["19355"], ["15601"]],
    "151": [["17264"]],
    "169": [["33954"], ["33254"]],
    "170": [["33752"], ["33700"]],
    "171": [["34109"], ["34777"]],
    "172": [["34626"], ["34524"]],
    "173": [["34424"], ["34372"]],
    "174": [["35376"], ["35527"]],
    "175": [["35174"], ["35122"]],
    "176": [["36781"], ["15253"]],
    "177": [["43278"], ["36883"]],
    "178": [["43022"], ["43128"]],
    "179": [["42872"], ["36373"]],
    "180": [["37086"], ["37290"]],
    "181": [["32572"], ["23293"]],
    "182": [["37908"], ["37855"]],
    "183": [["38439"], ["38386"]],
    "184": [["36531"], ["37188"]],
}

RAW_COLORS = {
    "4": "blue", "#0000ff": "blue",
    "#f48c37": "orange", "#ea700d": "orange", "#f9bb00": "orange",
    "9": "green", "#008000": "green",
    "#9c4a09": "brown",
    "19": "slate", "#7f7f7f": "slate",
    "1": "white", "#ffffff": "white",
    "#ff0000": "red", "#000000": "black", "#ffff00": "yellow",
    "#7030a0": "violet", "#cc99ff": "violet",
    "#ff00ff": "rose", "#00ffff": "aqua",
}


def cell(shape, name):
    for item in shape.get("cells", []):
        if item.get("N") == name:
            return str(item.get("V"))
    return None


def number(shape, name):
    try:
        return float(cell(shape, name) or 0)
    except ValueError:
        return 0.0


def is_marker(shape):
    if cell(shape, "FillForegnd") is None or cell(shape, "LineColor") is None:
        return False
    return any(
        row.get("attributes", {}).get("T") == "EllipticalArcTo"
        for section in shape.get("sections", []) if isinstance(section, dict)
        for row in section.get("rows", [])
    )


def main():
    with gzip.open(RAW, "rt", encoding="utf-8") as handle:
        raw = json.load(handle)
    shapes = raw["pages"][0]["shapes"]
    by_id = {str(shape["id"]): shape for shape in shapes}
    children = collections.defaultdict(list)
    for shape in shapes:
        children[str(shape.get("parent_id"))].append(shape)

    def absolute_x(shape):
        x = number(shape, "PinX")
        parent_id = shape.get("parent_id")
        if parent_id and str(parent_id) in by_id:
            parent = by_id[str(parent_id)]
            return absolute_x(parent) - number(parent, "Width") / 2 + x
        return x

    def markers(group_ids):
        result = []
        for group_id in group_ids:
            result.extend(item for item in children[group_id] if is_marker(item))
        return sorted(result, key=lambda item: absolute_x(item))

    segments = []
    for legacy_id, bank_sets in GROUPS.items():
        decoded_banks = []
        for group_ids in bank_sets:
            bank_markers = markers(group_ids)
            decoded_banks.append([
                (RAW_COLORS.get((cell(item, "FillForegnd") or "").lower()),
                 RAW_COLORS.get((cell(item, "LineColor") or "").lower()))
                for item in bank_markers
            ])
        canonical = markers(bank_sets[0])
        records = []
        for index, marker in enumerate(canonical):
            fiber_number = index + 1
            tube_number = index // 12 + 1
            tube_markers = canonical[(tube_number - 1) * 12:tube_number * 12]
            ring_counts = collections.Counter(
                RAW_COLORS.get((cell(item, "LineColor") or "").lower())
                for item in tube_markers
            )
            ring_counts.pop(None, None)
            tube_color = ring_counts.most_common(1)[0][0] if ring_counts else None
            raw_ring = cell(marker, "LineColor")
            observed_ring = RAW_COLORS.get((raw_ring or "").lower())
            warnings = []
            if observed_ring != tube_color:
                warnings.append("Individual ring differs from the repeated ring color of its 12-position Tube group.")
            records.append({
                "fiberNumber": fiber_number,
                "tubeNumber": tube_number,
                "positionInTube": (fiber_number - 1) % 12 + 1,
                "markerShapeId": str(marker["id"]),
                "rawInnerColor": cell(marker, "FillForegnd"),
                "fiberColorKey": RAW_COLORS.get((cell(marker, "FillForegnd") or "").lower()),
                "rawOuterColor": raw_ring,
                "observedOuterColorKey": observed_ring,
                "tubeColorKey": tube_color,
                "warnings": warnings,
            })
        segments.append({
            "segmentId": f"CAB-{int(legacy_id):06d}",
            "legacySegmentId": legacy_id,
            "fiberCount": len(records),
            "tubeCount": (len(records) + 11) // 12,
            "groupShapeIds": bank_sets[0],
            "corroboratingGroupShapeIds": [item for bank in bank_sets[1:] for item in bank],
            "pairedBanksAgree": all(bank == decoded_banks[0] for bank in decoded_banks[1:]),
            "decodedFiberColors": sum(item["fiberColorKey"] is not None for item in records),
            "decodedTubeColors": len({item["tubeNumber"] for item in records if item["tubeColorKey"] is not None}),
            "confidence": "owner_confirmed" if legacy_id == "172" else "source_interpreted",
            "records": records,
            "unresolved": [] if all(item["fiberColorKey"] and item["tubeColorKey"] for item in records) else ["One or more marker colors are outside the bounded source color map."],
        })

    result = {
        "schemaVersion": 1,
        "sourceSha256": SOURCE_SHA256,
        "source": {"file": "Tsageri-Lentekhi 2025.vsdx", "page": "ცაგერი-ლენტეხი", "pageId": "4", "part": "visio/pages/page1.xml"},
        "interpretationRule": RULE,
        "convention": "outer ring = Tube physical color; inner fill = Fiber physical color",
        "ignoredStyle": "Connector and cable line color is never decoded as a physical Tube or Fiber color.",
        "segments": segments,
    }
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} with {len(segments)} segments and {sum(len(item['records']) for item in segments)} markers")


if __name__ == "__main__":
    main()
