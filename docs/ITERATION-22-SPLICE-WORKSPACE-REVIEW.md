# Iteration 22 — Splice Workspace Review

## Outcome

Fiber Atlas now provides a first-class engineering connection sheet (`შეერთებების სქემა`) for reviewed ODF, closure, and AP relationships. The operational Route remains the simple context view; the sheet shows the exact local Port/Fiber or Fiber/Fiber relationship.

A worksheet line represents one `NodeFiberTransition` or one `PortTopologyBinding`. Line style shows evidence state. Fiber and Tube colors remain local physical attributes and never determine connectivity.

## Inventory

- 33 connection sheets.
- 1230 visible worksheet rows.
- 838 exact two-sided NodeFiberTransitions, each reachable from exactly one sheet.
- 384 PortTopologyBindings across AGG5, Lentekhi and AP41/AP50/AP51/AP52/AP53/AP54.
- SC225 C181/F05–F12 remains explicitly unresolved on the AP side; F06 retains the owner-confirmed transition record.

## Node routing matrices

| Node | Relationship | Exact | Unresolved | Number changes | Tube changes | Fiber-color changes | Example / range |
|---|---|---:|---:|---:|---:|---:|---|
| AGG5 · ცაგერი | Tsageri aggregation ODF პორტები ↔ C148 | 192 | 0 | 0 | 0 | 0 | AGG5/Port1 → C148/F01; …; AGG5/Port192 → C148/F192 |
| SC205 | C148 ↔ C149 | 16 | 0 | 16 | 16 | 16 | C148/F129 → C149/F01; …; C148/F144 → C149/F16 |
| SC205 | C148 ↔ C150 | 174 | 0 | 0 | 54 | 0 | C148/F01 → C150/F01; …; C148/F192 → C150/F192 |
| SC205 | C149 ↔ C150 | 6 | 0 | 6 | 6 | 6 | C149/F17 → C150/F127; …; C149/F22 → C150/F132 |
| AP41 | AP41 პორტები ↔ C149 | 24 | 0 | 0 | 0 | 0 | AP41/Port1 → C149/F01; …; AP41/Port24 → C149/F24 |
| SC206 | C150 ↔ C151 | 132 | 0 | 0 | 0 | 0 | C150/F01 → C151/F01; …; C150/F132 → C151/F132 |
| SC206 | C150 ↔ C169 | 48 | 0 | 48 | 48 | 0 | C150/F145 → C169/F01; …; C150/F192 → C169/F48 |
| SC216 | C169 ↔ C170 | 16 | 0 | 16 | 16 | 16 | C169/F33 → C170/F01; …; C169/F48 → C170/F16 |
| SC216 | C169 ↔ C171 | 32 | 0 | 0 | 0 | 0 | C169/F01 → C171/F01; …; C169/F32 → C171/F32 |
| SC216 | C170 ↔ C171 | 8 | 0 | 8 | 8 | 8 | C170/F17 → C171/F33; …; C170/F24 → C171/F40 |
| AP50 | AP50 პორტები ↔ C170 | 24 | 0 | 0 | 0 | 0 | AP50/Port1 → C170/F01; …; AP50/Port24 → C170/F24 |
| SC217 | C171 ↔ C172 | 46 | 0 | 0 | 0 | 0 | C171/F01 → C172/F01; …; C171/F48 → C172/F48 |
| SC218 | C172 ↔ C173 | 12 | 0 | 12 | 12 | 12 | C172/F29 → C173/F01; …; C172/F40 → C173/F12 |
| SC218 | C172 ↔ C174 | 28 | 0 | 0 | 0 | 0 | C172/F01 → C174/F01; …; C172/F28 → C174/F28 |
| SC218 | C173 ↔ C174 | 12 | 0 | 12 | 12 | 12 | C173/F13 → C174/F29; …; C173/F24 → C174/F40 |
| AP51 | AP51 პორტები ↔ C173 | 24 | 0 | 0 | 0 | 0 | AP51/Port1 → C173/F01; …; AP51/Port24 → C173/F24 |
| SC219 | C174 ↔ C175 | 16 | 0 | 16 | 16 | 0 | C174/F25 → C175/F01; …; C174/F40 → C175/F16 |
| SC219 | C174 ↔ C176 | 24 | 0 | 0 | 0 | 0 | C174/F01 → C176/F01; …; C174/F24 → C176/F24 |
| SC219 | C175 ↔ C176 | 8 | 0 | 8 | 8 | 8 | C175/F17 → C176/F25; …; C175/F24 → C176/F32 |
| AP52 | AP52 პორტები ↔ C175 | 24 | 0 | 0 | 0 | 0 | AP52/Port1 → C175/F01; …; AP52/Port24 → C175/F24 |
| SC220 | C176 ↔ C177 | 48 | 0 | 0 | 0 | 0 | C176/F01 → C177/F01; …; C176/F48 → C177/F48 |
| SC221 | C177 ↔ C178 | 48 | 0 | 0 | 0 | 0 | C177/F01 → C178/F01; …; C177/F48 → C178/F48 |
| SC222 | C178 ↔ C179 | 48 | 0 | 0 | 0 | 0 | C178/F01 → C179/F01; …; C178/F48 → C179/F48 |
| SC223 | C179 ↔ C180 | 48 | 0 | 0 | 0 | 0 | C179/F01 → C180/F01; …; C179/F48 → C180/F48 |
| SC224 | C180 ↔ C184 | 32 | 0 | 0 | 0 | 0 | C180/F01 → C184/F01; …; C180/F32 → C184/F32 |
| SC224 | C181 ↔ C184 | 16 | 0 | 16 | 16 | 16 | C181/F01 → C184/F33; …; C181/F16 → C184/F48 |
| ლენტეხის აგრეგაცია | ლენტეხის აგრეგაციის ODF პორტები ↔ C184 | 48 | 0 | 0 | 0 | 0 | ლენტეხი/Port1 → C184/F01; …; ლენტეხი/Port48 → C184/F48 |
| SC225 | C181 ↔ AP მხარე დაუზუსტებელია | 0 | 8 | 0 | 0 | 0 | C181/F05 → გაგრძელება დაუდგენელია; …; C181/F12 → გაგრძელება დაუდგენელია |
| SC225 | C181 ↔ C182 | 4 | 0 | 4 | 4 | 0 | C181/F13 → C182/F01; …; C181/F16 → C182/F04 |
| SC225 | C181 ↔ C183 | 4 | 0 | 0 | 0 | 0 | C181/F01 → C183/F01; …; C181/F04 → C183/F04 |
| SC225 | C182 ↔ C183 | 12 | 0 | 12 | 8 | 12 | C182/F05 → C183/F13; …; C182/F16 → C183/F24 |
| AP53 | AP53 პორტები ↔ C182 | 24 | 0 | 0 | 0 | 0 | AP53/Port1 → C182/F01; …; AP53/Port24 → C182/F24 |
| AP54 | AP54 პორტები ↔ C183 | 24 | 0 | 0 | 0 | 0 | AP54/Port1 → C183/F01; …; AP54/Port24 → C183/F24 |

## Acceptance anchors

- SC218 branch: C172/F29 → C173/F01. Headers preserve Visio labels `172-217-218-48` and `173-218-51-24`.
- SC219 AP52: C175/F24 → C176/F32. The sheet contains no AP51 or C173 reference.
- Lentekhi Port38: ODF Port38 → C184/F38, then C181/F06 → C184/F38 at SC224; the journey stops defensibly at the unresolved SC225 AP side.
- AGG5 Port175: Port175 → C148/F175, Grey Tube / Red Fiber, journey endpoint AP51 Port3. Company use remains absent because the source does not attach OpenNet/Magti/Silknet/Skytel to this lineage.
- AP51 Port3: Port3 → C173/F03 and the same corrected full lineage.

## Operational status and organization use

Port status has five independent visual states: in use, unused, reserved, unavailable, and unknown. `unused` is never converted to commercial `available`. Organization text uses “uses” and appears only when a `FiberUseAssignment` supports it. The current exact company projection is OpenNet only; Magti, Silknet, and Skytel remain annotation-only and are not assigned to worksheet rows.

## Closure photos

The prototype defines `ClosurePhoto` and supports multiple local uploads, preview, and one primary photo. Images use browser `sessionStorage`; the UI explicitly warns that they are not saved to a persistent database.

## Filtering, navigation, and output

- 12-position Tube/group filters; 192F sheets default to the focused group (or group 1).
- Quick Fiber/Port search.
- Bidirectional navigation between Route/Fiber/Port Inspectors, the exact connection sheet, and the corrected full journey.
- Print/PDF stylesheet for the current relationship sheet.
- Desktop and 390px mobile layouts retain aligned banks and SVG connection lines.

## Remaining source gaps

- SC225 C181/F05–F12 cannot be assigned to AP53 versus AP54 without stronger source evidence; the sheet shows unresolved rows.
- Port status stays unknown when neither APPortFlow nor source ODF occupancy establishes a value.
- Session photos are intentionally local prototype data and require a persistent media service in a later application phase.

## Deterministic projection

The sheet projection is derived from 839 NodeFiberTransition records and 384 PortTopologyBinding records. It does not parse display labels to create optical continuity.
