# Iteration 35 — first delivery: places, journeys and evidence

Historical first-delivery report. The subsequent typed correction delivery is recorded in [its review](ITERATION-35-PORT-CORRECTION-REVIEW.md).

2026-10-11. Delivered scope: **35-01 through 35-04**, with first-delivery validation under 35-06. **35-05 remains Ready for the second delivery.** This release does not implement typed Port-binding drafts, impact validation or owner activation.

## Result

Network opens a source-scoped place/Cable finder. It no longer chooses the first physical Route or automatically renders the complete recursive tree. A selected place shows a labelled connection schematic, immediate incident Segments, Ports and local Fibers. Complete inventory and an explicit advanced network overview remain available.

`#/place` stores source, query, inventory page, focus, inspected object, retained selected strand, expansion and limit. Back/Forward and refresh restore those values. Old object links adapt to focused selections; explicit advanced Route/physical-path views remain available. Scope uses canonical identity, explicit source provenance and typed document membership, including older `closure:…`/`segment:…` memberships. It never merges APs by display number or filename. Nodes with no incident Cable remain discoverable.

The schematic reads physical Cable endpoints directly. Parallel Segments and cycles remain separate edges. It starts with at most 16 Segments, allows up to 64 and eight expansion nodes, and can return to immediate neighbors. Further places remain in the full inventory. Inspection keeps focus; opening a different place is a separate action. Mobile hides the finder after selection; **ყველა ადგილი** returns to it before choosing another place.

## One journey presentation

Network, Engineer Search, organization-selected strands and existing Fiber inspectors reuse `CompactFiberJourney`. Both Fiber actions and scoped Port/Route actions select the correct strand. Organization questions with several strands are not joined into one chain.

The component reads the established `resolveCurrentFiberPath` output. It shows both known endpoints, the selected local color/Tube, exact legs, remaps and honest stops. Ordinary intermediate places can be expanded inline; selected Cable endpoints, physical branch decisions, remaps, ambiguity and stop nodes stay visible. Independent ambiguous/cyclic alternatives retain the selected local Fiber and have no unified playback. This is presentation only: no resolver, importer, transition, binding or accepted path was changed.

Finite playback is optional, never starts automatically and follows accepted legs once. Reduced motion uses static step progression. Hidden-document events, changed selection and unmount stop playback. The labels describe reading order, not traffic or field verification. Inspecting a stop retains the selected journey; opening an endpoint Port keeps the same selected strand and never labels a known native binding unknown.

Verified examples retain their signatures: Shida AP16 Ports13/14/24 reach AP17 through SC25017, excluding `25-122`; Port1 remains partial. AP18/Port1 remains unbound. Tsageri C176/F32 reaches AP52 through SC219/C175 and Lentekhi, excluding SC218/AP51. C184/F38 retains the currently accepted SC224→SC225 path and its source-supported stop. C169/F12 and C172/F01/F29/F31 regressions remain unchanged.

## Review evidence

The selected object and concise issue statement precede the evidence. Counts, raw candidates and history move into disclosures. Observation/evidence shortcuts are nearby. Active Port cases open their exact canonical Port in Network; Back returns to the same case.

Source crops remain pinned to the case's exact revision/run/page. Recorded rejection metadata is used where available. For older snapshots without it, the viewer explicitly says the diagnostic record is missing. A bounded, read-only scan of that exact crop can annotate an open stroke with one endpoint coincident with the selected Port rectangle; the opposite endpoint is marked unresolved. This does not accept a marker, Fiber number, Cable association or optical edge. Only coincident geometry is used, with numerical roundoff tolerance; no importer tolerance was expanded. An annotation is `diagnostic_only_not_a_mapping`, and it is never persisted as topology.

For the preserved Shida run, Port12158's crop shows stroke12110 and its unresolved opposite end. Review orange is labelled separately from documented Fiber colors. Initial framing includes that end and nearby numbers; zoom, pan and wider framing remain available. All five categories and AP43/AP47 printed-number comparisons were checked. Observation/proposal events remain append-only, unapplied and separate from network facts. Historical/staged contexts remain read-only.

## Validation and limits

- Full TypeScript suite: **829/829**. The final affected 11 place/journey tests also pass after typed membership refinement. Application and import-compiler type checks, production build and standalone export pass. The build retains the existing large bundle warning.
- Python importer suite: **47/47**. Affected backend tests: **5 tests / 61 assertions**, covering exact-run evidence, stale/historical scope, proposal semantics and diagnostic-only endpoint highlights.
- Actual Shida desktop 1440px/mobile 390px: **33 workflows**; exact review-to-Port/Back and keyboard access: **2 additional workflows**. Preserved Tsageri standalone: **12 workflows**. Final reports have zero JavaScript errors; the Shida report has zero external requests and no horizontal overflow.
- AP16 selected paths match the existing resolver signatures. Source crop failure/retry, all categories, both numbering anomalies, refresh/Back/Forward, finite reduced-motion playback, an empty database and append-only local observations pass. Notes do not change the active revision.
- Local fixture restoration reused the previously audited candidate and hash-checked geometry, rather than re-extracting Visio. All mutations stayed in loopback `fiber_atlas_test` / `fiber_isolation` and isolated private storage. Owner-server queries/writes, source changes and owner activations: **zero**. No migration/dependency was added.

The initial Shida operational response is still **40,871,497 decoded bytes** (measured approximately 1.1–1.4 seconds locally). Place focus/selection uses that inventory and makes no additional graph request. AP18's bounded source response is **170,953 bytes** (approximately 0.9–1.1 seconds locally), with at most 600 Shapes per crop. Neither the 153+ MB proposal nor the complete 62,670-Shape geometry drawing is downloaded to display a place. Initial operational payload reduction remains a follow-up; this release does not claim a small initial payload or a new data-loading architecture.

Only worker/automated QA was performed. Representative first-time-user comprehension and owner acceptance are **not yet tested**. The Iteration 34 source backlog remains open, and this interface does not certify unknown connectivity.

Evidence: `iteration35-browser-qa.json`, `iteration35-navigation-browser-qa.json`, `iteration35-reference-browser-qa.json`. Before review: `iteration34-fiber_port_binding_ambiguous-1440.png` and `-390.png`. After: `iteration35-ap18-evidence-1440.png`/`-390.png`, `iteration35-ap16-port13-1440.png`/`-390.png`, `iteration35-tsageri-f32-1440.png`/`-390.png`.

## Second delivery

35-05 must persist a typed exact Port/Cable/Fiber draft, validate incident-node/range/conflict/scope/version/role, compare complete affected journeys with the same resolver, and require a separate explicit owner activation of an immutable candidate. Refresh/history/reprocessing/reversal and stale/concurrent safeguards remain mandatory. Unsupported edits stay proposal-only. Do not guess AP18/Port1, and do not apply a correction on the owner's server during implementation. See the unchanged detailed requirements.
