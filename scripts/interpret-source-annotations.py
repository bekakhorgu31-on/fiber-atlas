"""Interpret source text conservatively while preserving every meaningful raw label.

Numeric fiber-position layout text is counted and deliberately ignored as UI scaffolding.
Cable labels, capacity labels and aggregation headings are counted as structured source
text because their raw values already survive in the typed evidence. All other meaningful
direct text and Visio comments become first-class SourceAnnotation records.
"""

from __future__ import annotations

import gzip
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "migration" / "iteration24" / "tsageri-lentekhi.iteration24.raw.json.gz"
OUTPUT = ROOT / "src" / "data" / "source-annotations.json"
SOURCE_SHA = "caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa"
ROUTE_ID = "ROUTE-TSAGERI-LENTEKHI-CORE"
RUN_ID = "IMPORT-TL-2026-09-29-I24"

AP_ROOTS = {"12432": "41", "33591": "50", "34263": "51", "35041": "52", "37759": "53", "38310": "54"}
PLACE_TEXTS = {"ჩხუტელი", "რცხმელეთი", "ყვედრეში", "ხოფური", "წანაში", "ხელედი"}
COMPANIES = {
    "open net": "opennet", "ოუფენ ნეტი": "opennet",
    "მაგთი": "magti", "სილქნეტი": "silknet",
    "skytel data": "skytel", "სქაიტელი": "skytel",
}


def cell_map(shape: dict) -> dict[str, str]:
    return {cell.get("N", ""): cell.get("V", "") for cell in shape.get("cells", [])}


def as_number(value: str | None) -> float | None:
    try:
        return float(value) if value is not None and value != "" else None
    except ValueError:
        return None


def geometry(shapes: list[dict], context: str) -> dict | None:
    if not shapes:
        return None
    cells = [cell_map(shape) for shape in shapes]
    if len(cells) == 1:
        item = cells[0]
        return {
            "pinX": as_number(item.get("PinX")), "pinY": as_number(item.get("PinY")),
            "width": as_number(item.get("Width")), "height": as_number(item.get("Height")),
            "beginX": as_number(item.get("BeginX")), "beginY": as_number(item.get("BeginY")),
            "endX": as_number(item.get("EndX")), "endY": as_number(item.get("EndY")),
            "context": context,
        }
    return {"context": f"{context}; {len(shapes)} source text shapes grouped without inventing one placement."}


def source_ref(shape_ids: list[str], raw_text: str, part: str = "visio/pages/page1.xml", note: str | None = None) -> dict:
    return {
        "file": "Tsageri-Lentekhi 2025.vsdx", "page": "ცაგერი-ლენტეხი", "pageId": "4",
        "part": part, "shapeIds": shape_ids, "rawValue": raw_text,
        "interpretationRule": "tsageri-lentekhi-source-annotations/3", "note": note,
    }


def annotation(annotation_id: str, raw_text: str, shapes: list[dict], *, category: str, scope: str,
               summary: str | None = None, assets: list[dict] | None = None,
               route_ids: list[str] | None = None, node_ids: list[str] | None = None,
               organizations: list[str] | None = None, association: str = "unresolved",
               verification: str = "needs_verification", warnings: list[str] | None = None,
               part: str = "visio/pages/page1.xml", note: str | None = None) -> dict:
    shape_ids = [str(shape["id"]) for shape in shapes]
    return {
        "id": annotation_id, "rawText": raw_text, "normalizedSummary": summary,
        "category": category, "scope": scope, "sourceSha256": SOURCE_SHA,
        "source": source_ref(shape_ids, raw_text, part, note),
        "sourceGeometry": geometry(shapes, note or scope),
        "associatedAssets": assets or [], "associatedRouteIds": route_ids or [],
        "associatedRouteNodeIds": node_ids or [], "associatedOrganizationIds": organizations or [],
        "associationState": association, "verification": verification,
        "warnings": warnings or [], "importedAt": "2026-09-29T00:00:00.000Z", "extractionRunId": RUN_ID,
    }


def main() -> None:
    with gzip.open(RAW, "rt", encoding="utf-8") as stream:
        raw = json.load(stream)
    if raw["source"]["sha256"] != SOURCE_SHA:
        raise RuntimeError("Unexpected current source hash")
    page = next(page for page in raw["pages"] if page["id"] == "4")
    shapes = {str(shape["id"]): shape for shape in page["shapes"]}
    text_shapes = [shape for shape in page["shapes"] if shape.get("text", "").strip()]
    grouped: dict[str, list[dict]] = defaultdict(list)
    for shape in text_shapes:
        grouped[shape["text"].strip()].append(shape)

    records: list[dict] = []
    structured_count = 0
    ignored_count = 0
    scope_occurrences = defaultdict(int)

    def add(record: dict, occurrences: int) -> None:
        records.append(record)
        scope_occurrences[record["scope"]] += occurrences

    for raw_text, items in sorted(grouped.items()):
        normalized_space = " ".join(raw_text.split())
        if re.fullmatch(r"[\d\s]+", raw_text):
            ignored_count += len(items)
            continue
        if re.fullmatch(r"\d+-\d+-\d+-\d+", normalized_space) or re.fullmatch(r"(?:FO|oc)\s*-?\s*\d+", normalized_space, re.I) or normalized_space.startswith("Aagregacia #"):
            structured_count += len(items)
            continue
        if raw_text == "Alpana-Tvishi-Ambrolauri directiion":
            add(annotation("ANN-DIRECTION-SC206-ALPANA", raw_text, items, category="direction", scope="route",
                summary="Alpana–Tvishi–Ambrolauri direction", route_ids=[ROUTE_ID], node_ids=["node-sc206"],
                association="confirmed", verification="documentation_reviewed",
                warnings=["Direction text does not establish a Cable Segment, linked Cable Route, or optical connectivity."],
                note="Exact source spelling retained; normalized punctuation/spelling is presentation-only."), len(items))
            continue
        if raw_text in PLACE_TEXTS:
            root_id = str(items[0].get("parent_id") or "")
            ap_id = AP_ROOTS.get(root_id)
            add(annotation(f"ANN-AP{ap_id or 'UNKNOWN'}-PLACE", raw_text, items, category="general", scope="asset" if ap_id else "unresolved",
                summary=raw_text, assets=[{"kind": "ap", "id": ap_id}] if ap_id else [],
                association="confirmed" if ap_id else "unresolved", verification="documentation_reviewed" if ap_id else "needs_verification",
                warnings=[] if ap_id else ["The place label could not be tied to a typed AP asset."],
                note="AP place label preserved from the source stencil."), len(items))
            continue
        if raw_text.casefold() in COMPANIES:
            org_id = COMPANIES[raw_text.casefold()]
            add(annotation(f"ANN-ORG-{org_id.upper()}-{len([r for r in records if r['id'].startswith('ANN-ORG-'+org_id.upper())])+1}", raw_text, items,
                category="service_commercial_note", scope="page_general", summary=f"Source organization label: {org_id}", organizations=[org_id],
                association="candidate", verification="imported",
                warnings=["Source placement does not by itself establish ownership, strand rights, service provider, or customer role."],
                note="Repeated organization label is grouped by exact raw text."), len(items))
            continue
        if raw_text.startswith("გაიჭრას"):
            for item in items:
                add(annotation(f"ANN-CUT-NOTE-{item['id']}", raw_text, [item], category="instruction", scope="unresolved",
                    summary=None, association="unresolved", verification="needs_verification",
                    warnings=["The note may describe planned or completed work; status and exact asset association require review."],
                    note="Physical operation and completion state are not inferred from the instruction text."), 1)
            continue
        if raw_text.startswith("მე5 ჟილა"):
            add(annotation("ANN-FIBER-MISMATCH-F5-F9", raw_text, items, category="fiber_mapping_note", scope="unresolved",
                summary="Fiber 5 may be mixed and continue as fiber 9 at an unspecified closure.", association="unresolved",
                verification="needs_verification", warnings=["Closure, cable segments and fiber endpoints are not identified by the source text."],
                note="Raw Georgian text remains authoritative; summary is only a search/display aid."), len(items))
            continue
        lower = raw_text.casefold()
        category = "historical_note" if lower == "loop" else "service_commercial_note" if lower == "free" else "investigation_issue" if lower == "otdr" else "general"
        warning = "Legacy 'free' text is not accepted as current availability." if lower == "free" else "Exact asset association is unresolved; no topology or state is inferred."
        add(annotation(f"ANN-UNRESOLVED-{re.sub(r'[^A-Za-z0-9]+', '-', raw_text).strip('-').upper() or 'TEXT'}-{items[0]['id']}", raw_text, items,
            category=category, scope="unresolved", summary=None, association="unresolved", verification="needs_verification",
            warnings=[warning], note="Meaningful text retained without a confident structured association."), len(items))

    comments = raw.get("comments", [])
    for comment in comments:
        if comment.get("raw_text") != "დამატებულია ქუროები" or comment.get("shape_id") != "44242":
            raise RuntimeError(f"Unreviewed Visio comment: {comment}")
        anchor = shapes.get("44242")
        record = annotation("ANN-GROUP-SC220-SC223-ADDED", comment["raw_text"], [anchor] if anchor else [],
            category="added_asset", scope="group_range", summary="SC220–SC223 · დამატებული ქუროები",
            assets=[{"kind": "closure", "id": item} for item in ("220", "221", "222", "223")],
            route_ids=[ROUTE_ID], node_ids=[f"node-sc{item}" for item in ("220", "221", "222", "223")],
            association="confirmed", verification="documentation_reviewed",
            warnings=["The comment establishes a shared change annotation only; it does not prove installation date, field verification, optical connectivity, or splice treatment."],
            part="visio/comments.xml", note=f"Comment {comment['id']} by {comment.get('author', {}).get('name')}; attached bracket geometry spans SC220–SC223.")
        record["source"]["shapeIds"] = ["44242"]
        record["sourceGeometry"] = geometry([anchor] if anchor else [], "Comment bracket spans the SC220–SC223 closure rows.")
        add(record, 1)

    total = len(text_shapes) + len(comments)
    represented = sum(scope_occurrences.values())
    if represented + structured_count + ignored_count != total:
        raise RuntimeError("Source text classification is incomplete")
    output = {
        "schemaVersion": 1, "sourceSha256": SOURCE_SHA, "extractionRunId": RUN_ID,
        "annotations": records,
        "report": {
            "directTextShapes": len(text_shapes), "uniqueDirectTexts": len(grouped), "commentEntries": len(comments),
            "totalCandidateTexts": total, "associated": scope_occurrences["asset"],
            "groupAssociated": scope_occurrences["group_range"], "routeAssociated": scope_occurrences["route"],
            "pageGeneral": scope_occurrences["page_general"], "unresolvedAssociation": scope_occurrences["unresolved"],
            "deliberatelyIgnored": ignored_count, "structuredSourceTexts": structured_count,
            "annotationIds": [record["id"] for record in records],
            "notes": [
                "Counts use individual direct-text/comment occurrences; repeated exact labels may share one annotation record.",
                "Numeric fiber-position layout is deliberately ignored as non-operational UI text but remains in the immutable raw extraction.",
                "Cable labels, aggregation headings and FO/oc capacity labels remain available in typed/raw source evidence rather than duplicate annotation facts.",
                "No patch-cord, port-assignment, service-path or distance value text was found in the reviewed direct text/comments.",
            ],
        },
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} annotations covering {represented} meaningful text occurrences; {structured_count} structured and {ignored_count} non-operational occurrences classified.")


if __name__ == "__main__":
    main()

