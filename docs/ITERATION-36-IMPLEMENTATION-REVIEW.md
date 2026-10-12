# Iteration 36 — fast review reads and source drawings

2026-10-12. All six worker tasks are delivered locally; owner database index deployment and owner acceptance remain pending. No topology engine, source interpretation, dependencies or owner graph/review mutations were introduced.

## What changed

Case selection now leaves the list and coverage requests alone. List, mutable detail/history, immutable evidence and coverage have separate identities. Revision adoption does not repeat the first list request. The UI shows current-case explanation and source independently; source data/errors are tagged with the exact request and authorization generation, so old responses cannot appear under a new title. List scroll and browser navigation are preserved. A note refreshes counts/status/history without another geometry request. Source failures have their own retry.

The browser deduplicates simultaneous reads and keeps a 64-entry / 32 MB serialized-geometry LRU for up to 15 minutes. Failed/oversized responses are not retained. Role changes clear the geometry cache and revalidate the source. Storage broadcasts carry only an invalidation marker across tabs; notes and decisions update other tabs, while writes still check the actual current revision and subject version. Focus refreshes mutable context.

Direct Needs Review entry sends no operational-network request and performs no Fiber hydration. Open on map fetches the current graph only when requested and checks it against the selected context. The server-backed correction builder is opened on request; draft, validation, impact preview and explicit Apply remain available. Global search can enter Engineer Search, which then loads its required graph. The large static bundle/offline adapter remain the named PERF-STARTUP follow-up.

Server reads separate immutable case/source metadata from mutable events, versions, active state and authorization. A cold one-case read selects only that case and affected objects. Warm metadata is a private digest-checked derived artifact, keyed by database/schema, revision, authority SHA and implementation version. Current/historical status, actor history and writable state are re-read. Source-run lookups, duplicate text reads and binding membership are batched. Ancestry uses one bounded recursive SQL read instead of a round trip per revision. Corrected Port cases still select their own exact member.

Crop geometry uses the exact source revision/SHA, run, page, extractor version, anchor/parent/bank payload, bounds and crop version. Authorization/source membership and the actual run/anchor are validated before cache use. Base geometry is cached independently of contextual diagnostic highlights. Corrupt/missing/expired cache data falls back to the real source; a missing anchor still fails. No source re-extraction or latest-run/filename fallback occurs. Private disk cache caps: 256 entries, 128 MB total, 16 MB per entry, one-day expiry. Geometry cap stays 600 Shapes with explicit truncation; anchor-first Shape ID ordering is deterministic.

A built-in PostgreSQL box/GiST expression index was measured and tested in the disposable schema. No spatial extension or source-payload rewrite is needed. The application uses the same query with or without this index, so the current server remains functional before deployment. **The index has not been installed on the owner server.** See deployment/rollback below.

Source Shape order, paths/text, affine ellipses and diagnostic annotations are built once per immutable view and reused. Pan changes only viewBox with frame-aligned updates; pointer capture/cancel, Fit, zoom buttons, original colors and truncation warnings remain. A 30-step pan causes zero static geometry rebuilds.

## Measurements

The original live endpoint sample remains `iteration36-review-performance-baseline.json`: detail 1,486 ms, repeated drawing 2,429 ms, and list+detail+source together 5,382 ms. It was an endpoint sample, not a browser p95.

Local SQL/phase baseline uses the complete preserved Shida copy: 9,356 Fibers, 62,670 Shapes, Windows PHP built-in server, PostgreSQL on loopback 55432. Baseline selected context read 18 queries, about 40–60 ms; a 92-Shape Port crop spent 376–481 ms, two-crop cases 933–1,039 ms. After batching/cache/index, selected context uses 7 queries, about 23–28 ms; first Port crop about 18–27 ms, first two-crop cases about 76–144 ms. Repeated geometry lookup is about 7–42 ms. Separate JSON timings and SQL totals are in the reports. The measured original JSON-bounds plan takes **446ms**, versus **0.085ms** for the indexed plan on the same 92-Shape region. The CLI records **101ms framework bootstrap / 57ms explicit PDO setup** separately; web requests additionally include PHP startup/middleware/wire overhead. The query plan selects `source_shapes_bounds_gist` and returns the same bounded evidence; index rollback/reapply leaves the original source payload intact.

Browser timings start at the actual browser click event, excluding automation pre-click scrolling/waiting. Explanation and drawing readiness are measured independently; two animation frames confirm drawing paint. No full test suite ran concurrently with the accepted sample. Each viewport has 20 first-pass selections and 20 cached revisits across Port, color/two-crop, numbering and duplicate categories (13 distinct cases; sparse categories repeat). First pass has an initially empty browser geometry cache, while PostgreSQL/OS and some server artifacts may already be warm. This is not a claim about a cold physical device or the owner's server p95.

| Viewport | p95 explanation, first pass | p95 drawing, first pass | p95 explanation, revisit | p95 drawing, revisit |
| --- | ---: | ---: | ---: | ---: |
| Desktop 1440px | 347 ms | 890 ms | 371 ms | 89 ms |
| Mobile viewport 390px | 346 ms | 895 ms | 353 ms | 91 ms |

All three QA targets pass on this documented machine/dataset. Case clicks send zero list requests; cached revisits send zero evidence requests. Notes/filter-only changes do not refetch the selected geometry. Initial review entry sends one list request and zero graph requests. Pan/fit, late A/B errors, retry, cross-tab list/history refresh, role revalidation and stale-version refusal pass without JS errors or horizontal overflow.

A small read-only comparison on the owner app found detail **444 ms** and repeated drawing **498 ms**, with gzip reducing the sampled drawing from about 171 KB decoded to **8.8 KB transferred**. First uncached drawing stayed **2,344 ms**, including **1,902 ms in crop lookup**, because the owner lacks the tested index. Its startup/middleware/connection/transfer residual is about 0.3 seconds per endpoint. This is a small sample, not owner p95. Revision stayed `CORRECTION-dce024db-ad8c-4743-b748-16bb1162c524`, 606 cases / 581 open / 25 reviewed during that probe; do not hard-code these later.

## Checks and evidence

Full TypeScript suite: **838/838**. Final backend read/cache/correction/reconciliation/persisted-network/isolation suite: **23 tests / 2,467 assertions**. Both type checks, production build, formatter and standalone export pass. The existing bundle-size advisory remains. Python importer code is unchanged; its historical suite was not rerun solely for these read/UI changes.

Browser evidence: 80 measured selections; cross-tab tests; known Port7→F13 desktop/mobile draft/Apply/map/reversal; staged source reconciliation/separate Add; preserved standalone Tsageri golden cases. Reports include `iteration36-browser-performance.json`, `iteration36-cross-tab-qa.json`, `iteration36-local-read-baseline.json`, `iteration36-local-index-results.json`, `iteration36-index-roundtrip.json`, `iteration36-live-read-comparison.json` and the existing correction/reconciliation/reference reports. Before and after samples use different server connections; local and live numbers must not be conflated.

All worker activations, notes, fixtures and migrations use disposable loopback isolation. Live owner requests were GET-only. No real source import/reprocessing, owner graph correction or owner migration was performed. Source gaps, owner/first-time-user acceptance and broader payload/bundle reduction remain open.

## Owner index deployment — separate tested step

This is the remaining cause of slow **first uncached live crops**. It is intentionally not executed by the worker. Use the existing protected server environment and schema checks; keep credentials, TLS and `bkhorguashvili` isolation unchanged. These commands were tested with the same migration in local isolation, including rollback/reapply on 62,670 source Shapes. They create/drop only a derived index, not source or network rows. Schedule index creation separately from source imports; it can briefly block source-table writes.

From `C:/Users/Beka/Desktop/Visio Alt/fiber-prototype/backend`, run:

```powershell
& '../.dev-runtime/php83/php.exe' artisan migrate --path='database/migrations/2026_10_11_204956_add_source_shapes_bounds_index.php' --force
```

Confirm the app's schema checks still pass and repeat an uncached source-crop timing. No service/runtime switch is required. If rolling back this latest migration is needed, use the tested index-only rollback:

```powershell
& '../.dev-runtime/php83/php.exe' artisan migrate:rollback --path='database/migrations/2026_10_11_204956_add_source_shapes_bounds_index.php' --step=1 --force
```

After later unrelated migrations, use a separately reviewed index rollback rather than blindly rolling back another latest batch. The application remains compatible without this index; cached drawing improvements still work. PERF-SERVING (concurrent Windows serving) and PERF-STARTUP (bundle/payload reduction) remain named follow-ups.
