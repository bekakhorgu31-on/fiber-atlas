# Iteration 36 — fast review cases and source drawings

Prepared **2026-10-12**. Status: **implemented and verified locally; owner bounds-index deployment and acceptance pending**. See [implementation/results/deployment](ITERATION-36-IMPLEMENTATION-REVIEW.md). The owner identifies opening review issues and source drawings as the main delay. This iteration improves that workflow before adding more features. Keep Laravel, PostgreSQL, the current topology model and the place/journey direction.

## Measured on the owner's running app

Read-only GET requests to `http://127.0.0.1:8000/`, using its current internal PostgreSQL connection. No import, correction, activation, restart or database write was performed by this diagnostic work. Machine-readable evidence: [baseline](iteration36-review-performance-baseline.json). Timestamp is UTC; the local date in Asia/Tbilisi is October 12.

The sampled revision was `CORRECTION-dce024db-ad8c-4743-b748-16bb1162c524`: **606 total cases, 581 open, 25 reviewed**. It remained active at the end of the probe. These counts supersede the October 11 report's 605 open cases; counts can change as the owner works. They are not constants for tests, and reviewed does not by itself mean a physical connection was established.

| Read | Time until response completed | Response body |
| --- | ---: | ---: |
| Open Port-case list, first page | 1,484 ms | 116,481 bytes |
| Selected case details | 1,486 ms | 13,571 bytes |
| Source drawing, first request in this probe | 2,289 ms | 170,895 bytes |
| Same source drawing again | 2,429 ms | 170,895 bytes |
| List + detail + source started together, matching a selection's current requests | **5,382 ms for all three** | Same bodies as above |

In that concurrent group, list completed at 1,506 ms, detail at 3,009 ms and source at 5,380 ms. Time to first byte was almost the entire duration. The sampled crop contained **92 Shapes**, with no truncation. All responses were HTTP 200 and uncompressed even though gzip was accepted. Node's JSON parsing took 0.1–1.5 ms; this does not measure browser rendering.

This is a small endpoint diagnostic, not a browser click benchmark, cold-cache test, p95, SQL profile or whole-system capacity claim. The first request may already benefit from server/OS caches. No query plan or database/server resource profile was collected. Do not assign the whole delay to PostgreSQL hardware or to SVG rendering.

## Causes supported by the code and measurements

1. **Selecting a case reloads the list unnecessarily.** `src/components/ReviewInbox.tsx` uses one query key containing filters, page, selected case and coverage for separate list/detail/evidence effects. Case-only changes refetch all three. List-only changes also reload unchanged selected evidence. Initial revision pinning can trigger another fetch cycle. Saving a note changes one shared refresh counter and reloads immutable drawing data too.
2. **Each of those requests rebuilds the review context.** `ReviewInboxController` calls `ReviewInboxStore.context()` for list, detail and evidence. For an active/historical revision it loads complete case collections and related objects, source-run context, ancestry/events and operator corrections before selecting one case. Filtering and pagination occur after this work. Some matching corrections trigger individual binding-existence reads. Their actual count and cost must be profiled; do not claim one query for every case without evidence.
3. **Source crops use JSON bounds filtering.** `ReviewInboxStore.evidence()` compares four bounds extracted and cast from `source_shapes.payload`, then sorts and returns up to 600 Shapes per crop. The supplied migrations define the source/run/page/Shape identity primary key, with no dedicated bounds index. A small returned crop does not guarantee a small database scan. The 62,670-Shape source page makes this a strong profiling target; an actual scan plan is not yet measured.
4. **The current local web server serializes the requests.** `scripts/local-api-server.ps1` launches PHP's built-in server with `-S`. The observed completion sequence matches this queue. PHP documents a single-threaded process and states that its multiple-worker option is unavailable on Windows. [PHP manual](https://www.php.net/manual/en/features.commandline.webserver.php). Do not prescribe `PHP_CLI_SERVER_WORKERS` as a Windows fix.
5. **Drawing interaction repeats static work.** `ReviewEvidence.tsx` sorts Shapes and rebuilds path/text elements on each pan state update. This is a potential drag/zoom cost, distinct from the measured server wait. Profile it before replacing the renderer.
6. **Heavy startup can compete with review entry.** `App.tsx` starts loading the whole operational graph even for review entry. The last Iteration 35 result was **40,871,497 decoded bytes**; hydration resolves every Fiber path. Current built main JS is **9,992,432 uncompressed bytes** and the API repository statically imports the offline repository. Those numbers are not transferred-byte measurements, and the historical payload was not downloaded again here. Broad bundle/payload reduction is a separate follow-up; remove review's dependency on loading that graph now.

## Worker tasks, in delivery order

### 36-01 — Finish the performance baseline

**Status: Done locally; SQL/phase/query-plan and browser evidence recorded.** Instrument list/detail/evidence phases and count/query-time totals in guarded local QA. Separate connection/setup, context, crop lookup, JSON encoding, response transfer and browser drawing. Record actual before/after request waterfalls. Use the sampled case, one two-crop color case, a numbering case and a duplicate case, including 1440px desktop and 390px mobile.

Use a read-only bounded query plan for the exact crop in the disposable copy, and inspect actual indexes. Keep traces free of credentials, CSRF/session tokens and unnecessary full source payloads. Do not create artificial extra owner revisions merely to benchmark. Historical reports measured a different environment and are comparison context, not this iteration's acceptance results.

### 36-02 — Stop redundant loading and keep navigation responsive

**Status: Done locally.** Give list, detail, coverage and evidence independent request identities and invalidation. A case-only selection must not reload the list or coverage. A list filter/page change must not reload unchanged selected geometry. Adopt the first resolved revision without issuing the identical list request again. Preserve deep links, Back/Forward, selected row, filters and list scroll.

Show the selected case title and explanation while its source loads independently. Keep the list usable. Deduplicate in-flight requests and cancel/ignore stale responses, including A→B→A navigation and source/run changes. Do not display the previous case's drawing under the new case's title. Reopening an unchanged, previously loaded crop should reuse a bounded in-memory cache. Do not add an extra click just to hide the delay.

Saving a note refreshes relevant disposition/version/count/detail state, not unchanged source geometry. Apply, reversal and reprocessing have different invalidation requirements from a note. Show useful loading/error/retry states independently for detail and source; a failed crop must not blank the whole inbox.

### 36-03 — Make server reads selective and batch repeated checks

**Status: Done locally.** Avoid constructing/describing every review case for a one-case detail/evidence request. Reuse a compact revision-scoped review projection/index or a bounded cache of immutable case metadata; fetch the selected case and its required history/context. Batch operator-binding membership checks and source-run lookups. Keep paged list rows lean and obtain counts without loading full geometry/network snapshots. Prefer the existing index/projection conventions over a second topology model.

Separate immutable source/case metadata from mutable disposition, subject version, current active revision and authorization. Review events can change with no new network revision; caching solely by network revision is insufficient. Updates must invalidate the relevant review summary/list/detail state across tabs. Historical views must exclude future events. Pinning a revision must not cache `active` or writable status permanently. Recheck actual current state on all writes.

Measure SQL count and phase time before/after. Repeated per-case membership reads should become batched reads rather than grow with the number of corrected cases. Corrected history must still show the exact affected Port's binding, not another member sharing the root case ID.

### 36-04 — Make exact source drawing reads cheap

**Status: Done locally.** Cache immutable base crop geometry using complete source SHA/identity, import run, page, anchor/bounds and extraction/geometry/crop version. Scope contextual highlights separately by case/diagnostic version so the same anchor cannot reuse the wrong diagnosis. Validate source membership and authorization before returning cached data. Never use filename-only or latest-run fallback.

Use the measured plan to choose indexed typed bounds, an appropriate spatial index, or a precomputed crop/index approach. Do not add a spatial database dependency merely by assumption. Build/backfill derived indexes only in guarded QA for this task; provide an explicit owner deployment step and rollback if a schema change is required. Preserve the original payload and geometry. Reads must not trigger source re-extraction or semantic interpretation.

Preserve anchors/highlights, affine transforms, text, original colors and the explicit truncation warning. Keep a deterministic, bounded crop; do not improve speed by silently dropping evidence or lowering the cap. Cache misses must still render correct evidence. Bound disk/memory growth and handle unavailable or corrupt cached artifacts safely. Response compression is useful but secondary: the measured delay is mostly before the response starts.

### 36-05 — Smooth drawing interaction and isolate review startup

**Status: Done locally.** Memoize stable shape order, geometry and text/path construction; pan/zoom should update the viewport without rebuilding all static drawing elements on every pointer event. Use frame-aligned updates if profiling supports them. Preserve pointer cancel/capture, buttons, keyboard access, Fit, source identity and endpoint annotations. Do not introduce decorative animation into this diagnostic viewer.

Opening Needs Review directly must not download/hydrate the full operational graph in the background merely to read cases and crops. Load the graph when a network-dependent action actually needs it, with clear preparation state for Open on map or typed correction. Preserve Engineer Search and correction availability. Check shared session/count requests for duplication without removing authorization or freshness checks.

### 36-06 — Verify speed and correctness together

**Status: Done locally; owner acceptance and live index deployment pending.** Record actual click-to-explanation and click-to-readable-drawing timing, independent of loading placeholders. Measure warm and cold behavior separately. For the warmed app on the documented dataset/machine, aim for **p95 explanation ≤500 ms**, **p95 drawing ≤1,000 ms**, and **cached unchanged drawing ≤200 ms**. These are acceptance targets, not promised measured results. Use at least 20 representative selections in disposable QA, report sample size/device/network/server configuration, and report a concrete blocker/follow-up if a target is missed. A fast local DB alone does not establish internal-server performance; use a small read-only live comparison if available.

Mandatory functional checks:

- A case-only click sends no list request; filter-only changes do not refetch unchanged evidence; first revision pinning is not a duplicate fetch cycle; revisits reuse matching immutable geometry.
- Direct review entry is independent of full-graph loading. Case-to-map/correction still obtains the correct pinned/current data when requested.
- Rapid selection/back navigation never mixes case titles and drawings, leaves stale errors, or loses list scroll. Large two-crop views remain usable on mobile. Pan/zoom profiling demonstrates static geometry is not rebuilt per pointer movement.
- Active, historical and staged contexts, exact-run/source isolation, missing-run failure, role changes and cache eviction remain correct. No global public cache of authenticated staged data.
- In guarded fixtures, note/review disposition, individual and whole-bank Apply, reversal, and reprocessing refresh the proper state. Review-count changes and corrected Port membership remain accurate without reloading unrelated geometry. Another tab's change cannot enable a stale write.
- Preserve route signatures and the AP16/AP18/Tsageri safeguards in HANDOFF. No topology/source-decoder changes or owner data writes are needed to optimize reads.

Deliver the implementation review, before/after JSON timing evidence and an updated VALIDATION/HANDOFF status. Update each task to In progress, Done with evidence, Blocked with the precise dependency, or Deferred with a named follow-up. A loading animation or a larger timeout is not completion.

## Named follow-ups

- **PERF-STARTUP — full bundle and operational payload reduction:** lazy-load the offline adapter/legacy tools, quantify bundle composition, avoid resolving all Fibers before first useful screen, and serve/cache appropriately scoped operational projections. Preserve standalone offline behavior and a single topology resolver. Review startup isolation is already part of 36-05; broad application work follows this iteration.
- **PERF-SERVING — concurrent serving before shared production use:** prepare and test a runtime that can serve concurrent requests on the actual target OS. Document the launcher/deployment, asset compression, queue behavior and rollback. Keep the current local URL workflow; do not restart/change the owner's service during diagnosis. Avoid choosing a hosting/runtime stack or adding dependencies without checking the project's deployment constraints. Faster serving complements selective reads; it does not remove repeated work by itself.

Owner acceptance of Iteration 35's presentation and the Iteration 34 source-digitization backlog remain open. Performance work must not claim universal Visio import correctness or resolve unknown connectivity by inference.
