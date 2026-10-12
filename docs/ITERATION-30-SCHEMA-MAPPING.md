# Iteration 30 — named-schema inventory and additive plan

2026-10-06. All remote operations in this pass were metadata-only inside an explicit read-only transaction. No server DDL, seed, account creation or data update has run.

The target is database `on` on `10.0.61.15:5432`, login/schema `bkhorguashvili`. The schema is owned by that login; USAGE and CREATE are verified. PostgreSQL 18.3 negotiated TLSv1.3. Full scoped inventory found zero tables, views, sequences, functions, triggers, custom types, indexes and constraints. No referenced dependencies or reusable definitions were found. The owner's reported existing tables are absent in this named schema at the recorded inspection time; no unrelated business schema or records were inspected.

Snapshot: `iteration30-server-inventory.json`. Table plan: `iteration30-table-plan.json`.

## Table-by-table plan

Every following table is absent and will be added through the existing compatible Laravel migrations, exclusively in `bkhorguashvili`:

| Table | Action | Migration |
|---|---|---|
| `users` | add; no existing object replaced | `0001_01_01_000000_create_users_table.php` |
| `password_reset_tokens` | add; no existing object replaced | `0001_01_01_000000_create_users_table.php` |
| `sessions` | add; no existing object replaced | `0001_01_01_000000_create_users_table.php` |
| `cache` | add; no existing object replaced | `0001_01_01_000001_create_cache_table.php` |
| `cache_locks` | add; no existing object replaced | `0001_01_01_000001_create_cache_table.php` |
| `jobs` | add; no existing object replaced | `0001_01_01_000002_create_jobs_table.php` |
| `job_batches` | add; no existing object replaced | `0001_01_01_000002_create_jobs_table.php` |
| `failed_jobs` | add; no existing object replaced | `0001_01_01_000002_create_jobs_table.php` |
| `network_revisions` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `active_network_state` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `source_documents` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `source_revisions` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `network_sources` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `canonical_nodes` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `cable_segments` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `tubes` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `fibers` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `ports` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `node_fiber_transitions` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `port_topology_bindings` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `domain_records` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `network_attributes` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `fiber_paths` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `projection_snapshots` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `review_subject_versions` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `review_events` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `activation_events` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `import_runs` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `import_candidates` | add; no existing object replaced | `2026_10_06_000100_create_network_store.php` |
| `source_shapes` | add; no existing object replaced | `2026_10_06_000300_create_source_shapes.php` |

## Functions, triggers and indexes

The three application functions (`fiber_assert_transition_node`, `fiber_append_only`, `fiber_immutable_snapshot`) are schema-qualified and use a pinned function search path. Their table references are explicitly schema-qualified where they inspect authority. Trigger execution points to these qualified functions. Framework migration bookkeeping, identity sequences, constraints and indexes use the one configured schema; `public` is excluded from the server path.

Local proof uses `fiber_isolation` and a non-superuser role with no public CREATE/write privilege. Existing same-named public tables and functions are read-only sentinels. The whole PostgreSQL acceptance suite, plus function/caller-search-path and sentinel checks, passes 5 tests / 2,191 assertions (`iteration30-schema-tests.txt`). The original four tests retain every 2,088 path/core comparison, review persistence, staged source/version tests and rollback.

## Profile and reset safeguards

`DB_PROFILE=server`, `DB_SCHEMA=bkhorguashvili` selects the owner-provided protected connection fields. Local credentials remain separate in ignored workspace configuration. Local setup writes `.env.local` when a server `.env` exists, preserving the server password and connection fields. `DB_URL` overrides are rejected by the scope guard. HTTP/CLI scope checks verify the actual database, schema and effective path. Server connections must negotiate encryption.

Destructive reset/fresh/drop helpers are limited to loopback `fiber_atlas_test` under the local profile. They reject the server profile before executing reset SQL. Local demonstration account creation is also refused on the server. A server write prerequisite flag remains false until isolation and TLS requirements are resolved; no additional generic approval for ordinary authorized additive changes is required.

## Remaining connection requirement

The configured mode is still `prefer`; observed TLS encryption does not establish CA/hostname verification. The owner's required SSL mode and trusted CA/server-name details are pending. A question is open in this chat. No verification was disabled or downgraded. See [PostgreSQL's verification documentation](https://www.postgresql.org/docs/18/libpq-ssl.html).

After TLS clarification: refresh the read-only collision check, enable only the tested server profile, run additive migrations, seed the reviewed baseline idempotently and verify server-backed API/path/Port behavior. No fresh/reset/drop/truncate, unrelated grant/extension changes, public-schema fallback or import of local demo accounts/passwords is planned. Public application deployment remains separate.
