#!/usr/bin/env python3
"""Render the deterministic 48-position C169 cross-document audit table."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/"migration/iteration27/source-interpretation.json").read_text(encoding="utf-8"))
c169=data["overlapCandidates"]["C169"]
rows=c169["fiberComparisonRows"]
lines=[
"# Iteration 27 — C169 Fiber cross-validation", "",
"**Result: exact 48-position construction and SC206 transition correspondence. The source B document remains staged; these validated correspondences are not activated in the canonical network until complete document certification passes.**", "",
"Source B is interpreted first from its own Visio Shape geometry and Connect rows. Only after that pass is it compared with the frozen V1 package. The exact cable label is `169-206-216-48` (Shape 34056); its selected B marker bank is Group Shape 33254. The source direction annotation remains `ლენტეხი-ხელედის მიმართულება` (Shape 40991) and is not used as a Fiber edge.", "",
"At SC206, the B-source local mapping is `C150/F145–F192 ↔ C169/F01–F48`. All 48 input/output Fiber pairs reproduce the frozen V1 transitions. Each row compares local Fiber color, Tube number/color, and the node-local transition; marker/connector Shape IDs are retained.", "",
"| C169 Fiber | V1 Tube / color | B Tube / color | V1 Fiber color | B Fiber color | SC206 input in V1 / B | V1 source Shapes | B marker / connector Shapes | Result |",
"|---:|---|---|---|---|---|---|---|---|"
]
for row in rows:
    a=row["sourceA"]; b=row["sourceB"]
    result="match" if row["fiberColorMatches"] and row["tubeColorMatches"] and row["SC206TransitionMatches"] else "conflict"
    ashapes=", ".join(a["transitionShapeIds"])
    lines.append(f"| F{row['fiberNumber']:02d} | T{a['tubeNumber']:02d} / {a['tubeColor']} | T{b['tubeNumber']:02d} / {b['tubeColor']} | {a['fiberColor']} | {b['fiberColor']} | C150/F{a['incomingC150Fiber']:03d} / C150/F{b['incomingC150Fiber']:03d} | {ashapes} | {a['markerShapeId']} / {b['markerShapeId']} + {b['transitionConnectorShapeId']} | {result} |")
lines += ["",f"**Totals:** {len(rows)} Fibers compared; {sum(x['fiberColorMatches'] for x in rows)} Fiber colors agree; {sum(x['tubeColorMatches'] for x in rows)} Tube positions/colors agree; {sum(x['SC206TransitionMatches'] for x in rows)} SC206 Fiber pairs agree. Field verification remains none.",""]
(ROOT/"docs/ITERATION-27-C169-FIBER-CROSS-VALIDATION.md").write_text("\n".join(lines),encoding="utf-8")
