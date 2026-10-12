# Closure 216: bounded geometry evidence

## Finding

The source extracts support three distinct cable records meeting the Closure 216 area: Cable 169 from Closure 206, Cable 171 toward Closure 217, and Cable 170 toward the source symbol AP50/ODF. A bounded endpoint-matching pass, adapted from `work/extract_candidates.py`, finds plausible two-ended path groups among their nearby numbered rows. It is useful as a secondary-branch stress case, but the nearby Cable 170 and AP50 number rows cannot be assigned reliably to optical endpoints from these extracts alone. **Do not import any Closure 216 optical mapping in this iteration.** No line establishes splice versus uncut continuity, approval, or a live route.

## Source anchors

`src/data/source-evidence.json` identifies Closure 216 as shape `33587`, with a declared cable count of three. Its cable labels are:

| Record | Source label | Source shape | Label-derived endpoint and count |
| --- | --- | --- | --- |
| Cable 169 | `169-206-216-48` | `34056` | Closure 206 ↔ Closure 216, 48 fibers |
| Cable 171 | `171-216-217-48` | `15982` | Closure 216 ↔ Closure 217, 48 fibers |
| Cable 170 | `170-216-50-24` | `33699` | Closure 216 ↔ source asset 50, 24 fibers |

The 24-fiber count for Cable 170 matches the source label and the source-evidence note recording the user's correction from an earlier “25” to 24. Asset 50 is shape `33591`, whose source entry records legacy symbol type `ODF`, 24 ports, and `asset_vs_panel_relationship: needs_confirmation`. The extracts do not prove whether AP50 names a network asset, a panel, or both.

The Closure 216 Visio group `33587` has bounds `[72.63281, 536.43161, 104.26562, 543.57346]` in `visio-resolved.json`. Its direct children in `visio-shapes.json` are callout/heading shapes `33588`, `33589`, and `33590`; no explicit splice, tray, or other optical joining component was found in that group. This limited observation does not rule out ungrouped drawing objects or physical components absent from the page.

## Candidate paths seen in the bounded endpoint pass

`extract_candidates.py` already treats Closure 218 edges as geometry candidates: it anchors numbered labels, matches line endpoints by drawing-space distance, skips short loops, and leaves approval and operation kind unresolved. Its anchor coordinates are Closure-218-specific. For this check I used the corresponding local numbered-label groups in `visio-resolved.json`, restricted each group to its main 48- or 24-number row (excluding nearby small 1–4/1–2 index labels), and used the script's `<0.05` inch endpoint tolerance. These are candidate path observations, not connectivity approvals.

| Candidate row pairing | Numbered-row evidence | Matching line shapes | Endpoint match residual, max |
| --- | --- | --- | --- |
| Cable 169 local row ↔ Cable 171 local row; same-number pairs F01–F32 | Parent groups `33954` and `34777`; each has a 48-number child row (first/last label IDs `33968`/`34045` and `34791`/`34868`) | `31960–31971`, `32287–32302`, `33005–33008` | 0.02501 in |
| Cable 169 local row F33–F48 ↔ nearby 24-number row F01–F16 | Parent group `33954` and ambiguous group `33752`; the latter's 24-number child row begins/ends at label IDs `33766`/`33799` | `33076–33087`, `37707–37710` | 0.03648 in |
| Cable 171 local row F33–F40 ↔ the same nearby 24-number row F17–F24 | Parent groups `34777` and `33752`; 48-number and 24-number child rows as above | `37711–37718` | 0.03816 in |

The second and third rows show separate numbered paths into distinct positions on the 24-number row; they do not show one fiber connected to three endpoints. Keep any future representation strictly as separate two-ended candidates unless a component and its physical joins are confirmed. Under this bounded selector, no matching path was found for Cable 171 F41–F48; that is not proof that those fibers are unconnected, spare, or unavailable.

## Why this is not ready for import

- The 24-number group `33752` is close to the Cable 170 label, but it is not an explicit cable-end or port declaration. Another nearby 24-number group, `33700` (first/last main label IDs `33714`/`33747`, plus two small number labels `33748`/`33749`), and standalone number shapes `33643–33666` also appear near the AP50 symbol `33591`. The extracts do not identify which numbered row represents Cable 170 strands, AP50 ports, or drawing annotations.
- Even if the geometric pair groups are correctly transcribed, the drawing does not distinguish splice from uncut continuity. The source evidence reports zero approved connections overall and no field verification for these records.
- Color and straight-line geometry are not enough to assign operational meaning, splice direction, ownership, service, or a 3-way junction. No AP50 port mapping should be inferred from the 24-port symbol or the nearby labels.

Treat the three geometric groups above as review leads only. Closure 216 is a useful stress case for testing distinct cable directions, ambiguous asset/panel endpoints, and unknown per-fiber status without inventing a branching optical component.

The geometry working files/scripts referenced above are investigation intermediates and are not part of the portable source package. The source labels and anchors remain in `src/data/source-evidence.json`; no SC216 candidate edges were added to `pilot.json`.
