# Iteration 28L — SC217 correction and persistent map delivery

2026-10-05. Source correction, persistent whole-network inspection, production build, standalone export, and browser QA are complete. Final 796/796 repository tests pass. Delivery evidence is summarized in `VALIDATION.md` and `iteration28l-browser-qa.json`.

## Source finding

The graph gap was caused by the importer's fixed marker-center X tolerance, not an absent source connector. The SC217 banks are **C171 group 34109** and **Source A C172 group 34524**, each decoded by actual marker X position. Groups 34777/34626 are the other ends of those Segments and do not represent the SC217 transition.

All three audited connector lines have no explicit Visio Connect rows. Their transformed Begin/End coordinates uniquely fall inside the actual decoded marker ellipses. Marker width/height is approximately 0.059055 inches. The earlier extractor required X displacement ≤0.015 inches; that rejected F10/F12 despite their endpoints lying inside their respective physical symbols. Neighboring F11 is the unchanged positive control.

| Selected Fiber | Upstream identity at SC206 | SC217 source pair | Line / marker IDs | Begin X residual | Old disposition | Exact downstream endpoint |
|---|---|---|---|---:|---|---|
| C169/F10 | C150/F154 ↔ C169/F10 | C171/F10 ↔ C172/F10 | 34070 / 34121 / 34536 | 0.016332 | Begin marker rejected by fixed tolerance; one dangling end | Lentekhi ODF Port10, C184/F10 |
| C169/F11 | C150/F155 ↔ C169/F11 | C171/F11 ↔ C172/F11 | 34071 / 34120 / 34535 | 0.008520 | Accepted; unchanged | Lentekhi ODF Port11, C184/F11 |
| C169/F12 | C150/F156 ↔ C169/F12 | C171/F12 ↔ C172/F12 | 34072 / 34122 / 34537 | 0.015112 | Begin marker rejected by fixed tolerance; one dangling end | Lentekhi ODF Port12, C184/F12 |

SC216 already provides C169/F10/F11/F12 ↔ C171/F10/F11/F12. Existing downstream transitions carry the corresponding Source A C172 identities through SC218/SC219/SC220/SC221/SC222/SC223/SC224 to C184 and its exact Lentekhi bindings. The local pair is established by endpoint geometry; equal numbers, color, Cable adjacency and organization labels are not used to establish continuity.

Both corrected lines' four raw BeginX/BeginY/EndX/EndY values agree with the preserved Iteration09 extraction to 1e-9. The fresh source SHA-256 is `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`. [Full audit](iteration28l-sc217-source-audit.json) retains world pins/bounds, raw cells, effective styles, nearby actual lines, explicit Connect dispositions, existing source edges and unique ellipse-hit proof. The generator scans actual geometry; it does not select a neighboring Shape ID by sequence.

## Authority and owner evidence

`scripts/audit-iteration28l-sc217.py` deterministically emits the scoped corrective evidence in `src/data/iteration28l-sc217-corrections.json`. `src/domain/iteration28l.ts` activates exactly **NFT-SC217-34070** and **NFT-SC217-34072** with source-interpreted status, unknown physical operation and exact local construction. It rejects a competing active transition and is idempotent. The old evidence files, raw VSDX/extractions and frozen V1 adapter remain untouched.

The 2026-10-05 F12-to-Lentekhi owner report is separately recorded in the corrective evidence and exported as `sc217OwnerReport`. It identifies C169/F12, canonical AGG-LENTEKHI and reported Silknet use. It does not claim an owner-confirmed splice pair or field verification. F10's endpoint is now established by source geometry; the owner report is not extended to F10.

The correction runs after Source B activation/Closure typing and before the existing 28D/28C current-path rebuild. This uses the established resolver and normal downstream rebuild once, rather than a separate routing engine or a second display fix. A historical 28K loader exists solely for diffs and historical hash checks; it is not the active UI authority.

## Reconciliation and deltas

The new graph has **1,631 active transitions** (was 1,629) and **473 current Lineages** (was 475). Exactly **24 local Fiber paths** change structurally; each contains one of the two new SC217 edges. The remaining 2,064 paths preserve their legs, transitions and stops. Global topology revisions/path signatures legitimately change.

| Organization | Groups before → after | Local legs before → after |
|---|---|---|
| Silknet | 4 → 3 | 28 → 36 |
| Skytel | 4 → 3 | 18 → 18 |
| OpenNet | 17 → 17 | 154 → 154 |
| Magti | 4 → 4 | 40 → 40 |

These merges/extensions follow exact connectivity and existing scoped use claims. The corrected F12 path retains both Silknet and Skytel evidence, generating 12 conflicted local views rather than overwriting either organization. Silknet's projected exact binding associations change from two to three: the existing Lentekhi Port12 binding becomes reachable from its scoped F12 claim. No physical Port binding is added or altered. One C184 Tube1 usage aggregate consequently changes from 10 in-use / 2 unused to 9 in-use / 2 unused / 1 review. Occupancy remains independent.

All existing NodeFiberTransitions are unchanged; the correction adds only two. PortTopologyBinding hashes remain identical. [Projection diff](iteration28l-projection-diff.json) contains complete before/after hashes, added records, every affected path and organization membership/group records. Frozen manifest stays `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`.

Automated correction checks cover both directions and upstream remaps, Lentekhi exact bindings, graph continuity, retained F11, F32/AP52, Port38 termination, F118 gap, use conflict, idempotence, competing-edge rejection and frozen-adapter separation. Historical stage tests remain isolated where their old hashes/counts are intentional; current assertions use the authorized new counts/membership. **794/794 full repository tests pass**, 0 failures/skips; the targeted correction suite passes7/7, including competing-edge rejection. TypeScript compilation passes. Results are in `iteration28l-tests.txt`, `iteration28l-correction-tests.txt` and `iteration28l-typescript.txt`. All45 previous top-level source/reference JSON hashes match the28K baseline; the new corrective evidence is one additional file.

## Delivery and remaining limits

28L-03 through 28L-05 are complete. The map and Inspector remain together during ordinary inspection; `inspect`, optical `selection`, explicit destination `target` and route/network `context` are independent and URL-history aware. Direct Fiber/Port search, Cable/Closure inspection, explicit AP destination navigation, desktop/mobile layout, 200% zoom, rail keyboard scrolling and finite shared playback are verified against the exported standalone.

The F32 overlay uses its current graph-derived AP52 path and does not activate C173/C174. Port38 follows the C181 nested branch to the source-supported SC225 termination, with the root-route continuation excluded. Corrected F10/F12 paths reach exact Lentekhi Ports10/12; F12's owner report and Silknet/Skytel use conflict remain separately attributed. Final browser QA reports zero runtime errors and no horizontal overflow at its tested dimensions. See `iteration28l-browser-qa.json`, screenshots, and `VALIDATION.md` for exact coverage and limits. No new source document, backend, or deployment was introduced.

Per the resource policy, the difficult source/topology decision is now resolved. The next phase can use **Codex GPT-6 Luna · Medium · Fast off**. Escalate only if a new unresolved architecture/topology issue emerges. Do not label the whole iteration Done before UI and final artifact QA are complete.
