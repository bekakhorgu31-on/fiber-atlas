#!/usr/bin/env python3
"""Build reviewed C172 physical-color evidence from the neutral VSDX extraction.

This interpreter is deliberately source-specific. The generic extractor keeps raw
Visio values; this script knows the Tsageri-Lentekhi marker-group convention.
"""

from __future__ import annotations

import gzip
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "migration" / "tsageri-lentekhi.raw.json.gz"
OUTPUT = ROOT / "src" / "data" / "c172-physical-evidence.json"
GROUP_ID = "34626"
RULE = "tsageri-lentekhi-marker-colors/1"
SOURCE_SHA256 = "caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa"

COLOR_KEYS = (
    "blue", "orange", "green", "brown", "slate", "white",
    "red", "black", "yellow", "violet", "rose", "aqua",
)

RAW_COLORS = {
    "4": "blue",
    "#0000ff": "blue",
    "#f48c37": "orange",
    "#ea700d": "orange",
    "9": "green",
    "#008000": "green",
    "#9c4a09": "brown",
    "19": "slate",
    "1": "white",
    "#ffffff": "white",
    "#ff0000": "red",
    "#000000": "black",
    "#ffff00": "yellow",
    "#cc99ff": "violet",
    "#ff00ff": "rose",
    "#00ffff": "aqua",
}


def cell(shape: dict, name: str) -> str | None:
    return next((item.get("V") for item in shape.get("cells", []) if item.get("N") == name), None)


def decode(raw: str | None) -> str | None:
    return RAW_COLORS.get((raw or "").lower())


def main() -> None:
    with gzip.open(RAW, "rt", encoding="utf-8") as stream:
        document = json.load(stream)

    if document["source"]["sha256"] != SOURCE_SHA256:
        raise RuntimeError("Source SHA-256 changed; refuse to reuse shape-specific interpretation")

    page = document["pages"][0]
    children = [shape for shape in page["shapes"] if shape.get("parent_id") == GROUP_ID]
    markers = [
        shape for shape in children
        if not shape.get("text", "").strip()
        and cell(shape, "FillForegnd") is not None
        and cell(shape, "LineColor") is not None
        and shape.get("attributes", {}).get("FillStyle") == "6"
    ]
    labels = [
        shape for shape in children
        if shape.get("text", "").strip().isdigit()
        and float(cell(shape, "PinY") or 0) > 0.15
    ]
    markers.sort(key=lambda shape: float(cell(shape, "PinX") or 0))
    labels.sort(key=lambda shape: float(cell(shape, "PinX") or 0))
    if len(markers) != 48 or len(labels) != 48:
        raise RuntimeError(f"Expected 48 C172 markers and labels; got {len(markers)} and {len(labels)}")

    records = []
    for marker, label in zip(markers, labels, strict=True):
        fiber = int(label["text"].strip())
        tube = ((fiber - 1) // 12) + 1
        position = ((fiber - 1) % 12) + 1
        raw_inner = cell(marker, "FillForegnd")
        raw_outer = cell(marker, "LineColor")
        fiber_key = decode(raw_inner)
        observed_tube_key = decode(raw_outer)
        expected_fiber_key = COLOR_KEYS[position - 1]
        tube_key = COLOR_KEYS[tube - 1]
        warnings = []
        if fiber_key is None:
            warnings.append(f"Unsupported inner marker color: {raw_inner}")
        elif fiber_key != expected_fiber_key:
            warnings.append(f"Inner marker decodes to {fiber_key}; position {position} convention expects {expected_fiber_key}")
        if observed_tube_key is None:
            warnings.append(f"Unsupported outer ring color: {raw_outer}")
        elif observed_tube_key != tube_key:
            warnings.append(f"Outer ring decodes to {observed_tube_key}; Tube {tube} convention and peer markers establish {tube_key}")
        records.append({
            "fiberNumber": fiber,
            "tubeNumber": tube,
            "positionInTube": position,
            "markerShapeId": marker["id"],
            "labelShapeId": label["id"],
            "rawInnerColor": raw_inner,
            "fiberColorKey": fiber_key,
            "rawOuterColor": raw_outer,
            "observedOuterColorKey": observed_tube_key,
            "tubeColorKey": tube_key,
            "warnings": warnings,
        })

    payload = {
        "schemaVersion": 1,
        "segmentId": "CAB-000172",
        "legacySegmentId": "172",
        "sourceSha256": SOURCE_SHA256,
        "source": {
            "file": "Tsageri-Lentekhi 2025.vsdx",
            "page": "ცაგერი-ლენტეხი",
            "pageId": "4",
            "part": "visio/pages/page1.xml",
            "groupShapeId": GROUP_ID,
        },
        "interpretationRule": RULE,
        "convention": "user-confirmed-12-fibers-per-tube/1",
        "review": {
            "state": "accepted",
            "reviewer": "network-owner",
            "decidedAt": "2026-09-25T00:00:00.000Z",
        },
        "records": records,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} records to {OUTPUT}")


if __name__ == "__main__":
    main()
