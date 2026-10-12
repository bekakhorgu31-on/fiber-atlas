# Iteration 30 — schema profiles and isolation

2026-10-06. Server inventory/mapping is read-only. No remote migration, seed, account creation or data mutation has occurred.

## Connection profiles

Protected `backend/.env` retains the owner's host/database/login/password. Only explicit profile/scope/prerequisite values were added: `DB_PROFILE=server`, `DB_SCHEMA=bkhorguashvili`, `FIBER_SERVER_WRITES_ENABLED=false`. No credentials are in this report or source control.

`DB_PROFILE=local` selects ignored `.dev-runtime/local-db-profile.json`. Testing uses protected `.env.testing`/`.env.isolation`, the loopback test database and its declared schema/role. Local setup preserves a server `.env`, writing `.env.local` instead. This prevents the old helper from replacing server credentials.

The PostgreSQL connection sets one explicit search-path schema. Server mode accepts only `bkhorguashvili`; `public` is not a fallback. `DB_URL` overrides are refused by scope checks. Actual database/current schema/search path are checked before migration/seed/API use. Server sessions must negotiate encryption. Writes additionally require completion of the schema/TLS prerequisites.

Configure CA verification through `DB_SSLMODE`, `DB_SSLROOTCERT`, optional `DB_SSLCERT`/`DB_SSLKEY`, and the matching `DB_HOST`. No certificate validation is disabled to overcome a failed connection. The current owner-supplied mode is `prefer`; trusted CA/hostname requirements remain pending. [PostgreSQL documents the difference between encryption and certificate/host verification](https://www.postgresql.org/docs/18/libpq-ssl.html).

## Migration and function scope

All migration bookkeeping, application/framework tables, indexes, constraints and identity sequences resolve through the explicit schema. Application trigger functions have qualified names, pinned search paths and qualified authority-table references. Migration 000600 pins existing application functions when upgrading an already populated local schema. Runtime raw table queries are constrained by checked connection scope; fixed table names are never supplied by an upload/request.

Fresh/reset/refresh/rollback/wipe commands are rejected unless the profile is local, the host is loopback and the database is exactly `fiber_atlas_test`. Local demo-account creation is forbidden on the server profile. The server will receive only additive migrations and reviewed seed after prerequisites; no database/schema recreation or unrelated grants/extensions is planned.

## Actual local proof

`scripts/prepare-schema-isolation.php` creates `fiber_isolation` owned by `fiber_schema_test` in the existing local test database. The role is not a superuser and has no public CREATE/write privilege. Existing same-named public tables/functions are read-only sentinels, including `migrations`, `users`, `fibers`, `network_revisions` and `projection_snapshots`.

`scripts/run-schema-isolation-tests.php` loads the ignored restricted-role profile without putting credentials on the command line. Full results: **5 tests / 2,191 assertions pass**, `iteration30-schema-full-tests.txt`. All original 2,088 path/core comparisons, seed/reseed, API, reviews, staging and activation/rollback checks run under the non-public restricted role.

The isolation test verifies migration ledger placement, zero fibers before seed, complete scoped API after seed, unchanged sentinel fingerprints/function definitions, three scoped function configurations, and a trigger invoked with caller search path `public` still protecting an isolation-only validated revision. It also proves the remote profile cannot enter destructive resets.

Focused replay of the final pinning migration: `iteration30-schema-tests.txt`. PHP syntax checks pass. Frontend/topology code and the standalone export remain unchanged in this iteration.

## Resume point

Read [the mapping plan](ITERATION-30-SCHEMA-MAPPING.md), resolve the owner's required TLS mode/CA/server name, repeat the bounded remote collision/privilege check and enable only the tested server profile for additive changes. Then apply migrations, repeat reviewed seed, create a separately agreed server reviewer identity, and validate server-backed reads/review persistence/browser behavior. Local demo passwords must not become server credentials.
