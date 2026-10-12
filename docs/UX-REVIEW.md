# Iteration 04 product review — 2026-09-24

Architect self-review of implementation, not user or field acceptance.

| Perspective | Problem reviewed | Final behavior |
| --- | --- | --- |
| Technician | Numeric labels obscure endpoints; colors could look physically verified | Typed endpoint names lead, old IDs remain secondary/searchable. Actual tube and strand colors are neutral/unknown; provisional12-position groups are labeled hypotheses. Selected F29 shows only its peer and closure. |
| NOC | Optical trace could be mistaken for a cable sheath or accepted path | Cable Route is separate, with ordered A/B references and unknown intermediate knowledge. Strict trace stops at unapproved joins; explicit candidates are dashed. Starting fiber record is neutral. |
| Planner | Unknown construction/capacity could look complete | Manufacturer/model/tube count remain unknown. All240 real fibers have unknown availability; confirmed available0 is a count of evidence-backed records. Assigned/reserved and damaged/blocked remain separate dimensions. |
| Engineer | Internal IDs, route collisions and AP50 ambiguity could corrupt inventory | Canonical stored IDs are distinct from display labels; duplicate routes are allowed. Legacy aliases survive. SC216 retains three separate cables; AP50/legacy ODF50 ambiguity is explicit and optical mappings are withheld. |
| Ordinary employee | Extra technical detail can obscure basic cable identity | Cable view leads with display name, old alias, manufacturer/owner and route. Internal ID, technical extras, tube groups, commercial details and source evidence use disclosures. Global search avoids territory drill-down. |

Review corrections made: removed internal-ID prominence in the closure selector, removed repeated peer/trace identity, fixed type narrowing, clarified actual tube number versus proposed group, labeled damaged/blocked counts, shortened route labels, and removed the claim that proposed palette values were recovered physical colors.

## Owner walkthrough

1. Search `SC217 SC218`, then `172-217-218-48`; confirm both reach the same cable.
2. On Cable172, find A, B,48 fibers, unknown manufacturer/owner and unknown intermediate route. Explain why one described interval is not a surveyed segment.
3. Expand provisional group3 and openF29. Identify actual tube number, tube color, strand color and position as unknown.
4. Open strict Trace, then include candidates. Find AP51/port1 and the missing mapping atSC216; neither proves a live service.
5. On SC218 choose C172/F29, then reverse to C173/F01. Inspect only the relevant endpoint pair and evidence.
6. On SC216 switch among legacy169/170/171. Explain why three attached cables do not establish a three-way fiber branch.
7. Search `ODF50`: confirm typed AP50 and the unresolved asset/panel relationship; there is no Closure50.
8. Search `Magti`: source annotation does not assign ownership. Search `ZTT`: no invented manufacturer match.

Record misunderstandings before adding features. Current browser/self-review is not a claim that an employee can complete these journeys unaided.

---

# Iteration 08 route-context review — 2026-09-25

Architect browser review of the running production build and standalone export; this is not employee or field acceptance.

| Perspective | Operational question | Reviewed result |
| --- | --- | --- |
| Fiber engineer | Are physical route, segment membership, and strand continuity kept separate? | C172/F29 has separate actions for the physical Cable Route and optical Fiber Trace. Route membership does not create optical mappings or a shared PhysicalCable. Strict Trace still follows only accepted relationships. |
| NOC/operator | Can C172 and the affected direction/branch be found quickly during an incident? | Search `C172` returns clearly typed Route and Segment results. Segment detail highlights C172 in AGG5→Lentekhi context, shows SC217/SC218 as its local ends, and exposes the SC218→AP51 branch with condition unknown. |
| Planner | Can the corridor, missing inventory and endpoint uncertainty be assessed without treating gaps as facts? | The Route screen presents ordered nodes/segments, dashed documented gaps, incomplete-documentation status, nullable PhysicalCable identity, and the unresolved Lentekhi AGG6/title versus property ID5 conflict. |
| Field technician | Can a closure visit identify incoming/outgoing segments and the AP drop while leaving treatment open? | SC218 shows C172, C173 and C174 directions plus the C173→AP51 branch above the ledger. Closure treatment remains unknown; the UI does not label a cut, splice, pass-through or mid-span access without evidence. |
| Occasional/non-technical employee | Can the user understand the path without reading Visio or audit metadata? | The dashboard leads to one named route, the route is a numbered timeline with clickable labels, and evidence/hash/shape details are closed. Labels state that AP branches continue from the main route and that Fiber Trace is separate. |

Browser journeys completed: dashboard → route; search `C172`; C172 segment; SC218 closure; C172/F29 fiber; C171/F29 strict Trace; candidate Trace with Port1; direct standalone route link. The route order, branch semantics and unresolved boundary were visible without expanding evidence. Console error/warning log was empty.

The next moderated walkthrough should time the same journeys with representatives of all five roles and record where terminology or hierarchy still causes hesitation.
