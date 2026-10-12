# Iteration 28H — search correctness and handoff

Date: 2026-10-02. Scope: derived presentation, scoped search and standalone validation. No source/topology/Port-binding records were edited.

## Corrections

- Source B AP42–49 cards now read the canonical `networkNodes.apEvidence` for place and capacity, match connected Cables by typed endpoint, and count the AP's source Port occupancy. AP42 is ორბელი · C153 · 24 Ports with 2 used, 22 unused and 0 unknown. AP47 retains 1 unknown occupancy. Its result opens the canonical network node in Route Workspace; it does not navigate to a missing Source A AP record.
- Bare Cable and place searches return raw index results to the shared UI formatting boundary. The formatter is idempotent (`compactFormatted`), so reformatting cannot append facts. Cable identity is the subtitle; Tube construction, grouped use and source each appear once. Generic exact-Port index cards use short `C153/F1` style identity and direct Fiber navigation. Source labels remain in details.
- Scoped Port search validates the Port against the AP or ODF inventory. Invalid numbers return no navigable target. Existing unbound Tsageri Port175 remains an ODF Port with unknown binding and occupancy. More than one exact binding produces no Fiber identity or Fiber route.
- Port and Fiber cards use one display policy over the 28C resolver's ordered sides. Local remaps appear at their node, direction arrows follow displayed traversal, only adjacent duplicate node labels collapse, omitted middle steps are marked `…`, and termination differs from a partial/no-transition stop. Lentekhi Port38 and C184/F38 show `ლენტეხის აგრეგაცია / Port 38 → SC224 (C184/F38 → C181/F6) → SC225 / აქ მთავრდება`. F118 remains partial; no AP51 is invented.
- Tube cards retain the full Tube's color, Fiber range and usage totals. The path and action explicitly identify the sample Cable/Fiber. C184 Tube1 samples C184/F1; another Fiber in the Tube has a different journey, so the card makes no Tube-wide optical route claim.
- A resolver is reused for one inventory topology revision. The revision is checked against active authoritative topology inputs, so changing a transition invalidates the cache. Fiber formatting calculates its path once. Port grids and connection cells omit path calculation because they do not display a path; the Port inspector and search still calculate it.

## Reproduction and regressions

The previous code paths directly showed the reported faults: Source B AP formatter gated on `accessPoints`; bare-Cable search formatted before App/Engineer formatting; scoped Aggregation Port fallback accepted any number; Port path flattened sides through a global `Set`; Tube path silently used the first Fiber. The prior exported standalone was retained for before measurements and has SHA-256 `a92b06f01c6101b8958e61f52fdb9b35714801a6b1231a2f3f7afd82f8fcedc6`.

`tests/iteration28h-search-correctness.test.ts` checks all eight Source B AP summaries against their actual source Port records, idempotent Cable formatting, invalid/unbound/ambiguous Ports, ordered Port/Fiber agreement, SC224 remap/SC225 termination, partial F118, Tube sample scope, cache invalidation and certified inventory counts. A historical 28G AP-route assertion was updated to the correct canonical Route Workspace target. No active revisit/loop is present in these checked journey fixtures; the display algorithm removes adjacent duplicates only and therefore preserves nonadjacent revisits.

## Offline Edge measurements

Method: `scripts/iteration28h-browser-qa.mjs`, Microsoft Edge Chromium in headless Playwright, desktop 1440×900, offline `file://` standalone, one run before and one after. Timings are wall-clock observations and include browser scheduling noise; they are not benchmarks or real-device measurements. The 390×844 checks are browser emulation, not a phone. No network request, browser error or horizontal overflow was observed.

| Action | Prior standalone | Final standalone |
|---|---:|---:|
| Cold load to global search | 3,566 ms | 6,270 ms |
| C158 search update | 48 ms | 84 ms |
| C148 search update | 22 ms | 29 ms |
| Source label search update | 26 ms | 27 ms |
| AP42 search update | 19 ms | 30 ms |
| Lentekhi Port38 update | 34 ms | 81 ms |
| C184/F38 update | 52 ms | 44 ms |
| C184 Tube1 update | 54 ms | 60 ms |
| Open 48-Port Lentekhi grid | 746 ms | 92 ms |

Final long-task observations: 65 ms, 117 ms, 151 ms, 5,347 ms, 69 ms, 82 ms and 54 ms, with the largest during cold startup. The immediately preceding final run also measured 6,276 ms cold load and 93 ms grid, indicating that the startup stall is repeatable in that local session. Earlier final runs measured about 3.6–3.8 seconds cold load and 59–62 ms grid; the measurements vary with host conditions. Initial load remains a visible stall tied to the large offline bundle; this iteration did not rewrite bundle architecture. The bundle is about 9.84 MB before inlining; Vite's large-chunk advisory remains. Search-update latency in the latest run ranged 27–84 ms, with no browser error. There is no real-device performance certification.

## Verification and artifacts

The final full repository run passes **770/770 tests**, TypeScript compilation and production Vite build pass, and `../fiber-prototype.html` was regenerated. Final standalone SHA-256: `5fdb57701ad279d156995b4baa739bf97021acb6283767d143dae1c380b88a81`.

Offline browser evidence: `docs/iteration28h-baseline-browser-qa.json` and `docs/iteration28h-final-browser-qa.json`. The final run records 18 explicit workflow outcomes, browser/viewport, timestamp, hash, timings, external requests, errors and overflow. Screenshots: `iteration28h-ap42-desktop.png`, `iteration28h-c158-desktop.png`, `iteration28h-tube-desktop.png`, `iteration28h-ap42-mobile.png`, `iteration28h-tube-mobile.png`.

The active inventory remains 37 Cables, 2,088 Fibers, 1,629 active transition records, 48 Lentekhi bindings, 192 Tsageri logical Ports and zero C148 Port bindings. The frozen V1 manifest file SHA-256 remains `59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125`. Source B AP inventory SHA-256 is `573988938dad56ea3cad034ea3b50608ab71ff9876aa565cbb649f0e11ab039d`; the source transition ledger SHA-256 is `0a595a9d7f90e47746462b1b0ec64501c127323251330b91110af61ba69f69b5`. These authoritative files were not modified in 28H.

Remaining limits are existing partial paths and unknown facts, particularly Tsageri exact per-Port binding and AP47 Port occupancy; neither was filled from Fiber use. Acceptance here is for the offline prototype, not field verification or production deployment.
