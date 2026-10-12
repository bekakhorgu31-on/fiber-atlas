# Iteration 30 — use the owner's existing PostgreSQL schema

2026-10-06. Worker requirements, not a completed server connection.

Progress update: the owner subsequently configured `backend/.env`; [read-only connection verification](ITERATION-30-CONNECTION-CHECK.md) succeeded on 2026-10-06. Authentication and named-schema access are established. The initial pending-connection statements below are historical; no server migrations/seed have run, and schema mapping/application integration remain open.

## User direction and starting point

The owner has an existing PostgreSQL database on a server, with personal schema **`bkhorguashvili`** and tables reported to be empty. Use this as the intended database target and inspect/reuse compatible tables. Schema name is not the database name or necessarily the login username.

The latest handoff reports the Iteration 29 local Laravel/PostgreSQL pilot complete. Keep that implementation and its isolated local database for development and destructive integration tests. This new direction changes the database target; it does not require a new frontend, another backend implementation or public web deployment. The reported 29 delivery was read for context in this planning pass; its full verification was not rerun.

Owner-provided connection target:

| Setting | Value |
| --- | --- |
| Host | `10.0.61.15` |
| Port | `5432` |
| Database | `on` |
| Login role | `bkhorguashvili` |
| Application schema | `bkhorguashvili` |
| Network | Owner's internal network |
| Original connection string | `jdbc:postgresql://10.0.61.15:5432/on` |

The JDBC string identifies the target; Laravel uses its PostgreSQL/PDO connection settings and does not need a Java/JDBC driver. Reachability has not been tested. Password/authentication configuration and TLS requirements/CA location are not yet supplied. An internal address does not establish TLS policy. Obtain credentials through ignored local configuration or an existing protected connection configuration; do not put them in chat, documentation, command output or source control. No remote connection has been attempted.

## 30-01 — inspect and map the existing schema

First connect read-only and verify server/database/current role, PostgreSQL version, effective search path, schema ownership and actual privileges. Inventory only the named schema and necessary referenced dependencies: tables, columns/types/defaults, keys, indexes, sequences/identity columns, enums, views, functions/triggers and foreign-key relationships. Verify the relevant tables are empty instead of treating the report as proof. Do not enumerate unrelated business records.

Produce a schema mapping against the implemented Iteration 29 relational model: reuse as-is, adapt application mapping, add missing structure, or identify an incompatible collision. Preserve existing object definitions. Inspect the actual migrations and seeder before proposing any server changes. Record a schema-definition snapshot and reviewable additive migration plan, excluding credentials and unrelated data.

Prefer reusing compatible existing tables. Do not create a duplicate parallel model merely because names differ, and do not force incompatible tables to represent different meanings. A real ambiguity about the owner's table semantics requires a specific question with the inspected alternatives.

Acceptance: successful read-only connection; verified schema and permissions; inventory/mapping report; precise remaining changes or blockers. Missing connection details block server inspection, not independent local configuration work.

## 30-02 — make the existing application schema-aware

Code inspection during planning found `backend/config/database.php` currently hardcodes PostgreSQL `search_path` to `public`. Merely changing host/database would target the wrong schema.

Make the database schema configurable for the server profile with `bkhorguashvili` as its explicit target. Retain a separate local profile. Ensure migration bookkeeping, application tables, framework auth/session/cache tables where applicable, sequences, trigger functions, raw SQL and connection reuse all resolve intentionally. Check all migrations and raw SQL, not only Eloquent models. No accidental fallback writes into `public` or other users' schemas.

Keep credentials in ignored environment configuration and redact connection errors/logs. Match the server's TLS requirements; do not disable certificate verification to make a connection succeed. Determine privileges from the actual login; do not assume ownership/superuser rights, install global extensions, or modify unrelated grants.

In isolated local PostgreSQL, exercise the application with a non-public schema and a restricted role. Add same-named sentinel objects in a different schema to prove they are not read or modified. Run migration, seed, API and review persistence checks there. Destructive test reset helpers must reject the remote server profile.

Acceptance: tested configuration and schema isolation, including migration/trigger behavior and the existing current-network path authority. Documentation contains connection-variable names and local/server profile selection without credentials.

## 30-03 — apply compatible changes and validate the server-backed app

Dependencies: successful 30-01 inventory/mapping and 30-02 isolated tests.

The owner's direction authorizes using the named schema for this app. Apply the reviewed compatible additive changes and idempotent baseline seed within that scope once prerequisites pass. Preserve the existing tables and any data found. Do not run `migrate:fresh`, drop/truncate the schema, recreate the database, execute destructive integration tests on the server, or overwrite incompatible objects. If destructive replacement is actually necessary, prepare the exact impact and resolve that specific decision before proceeding; do not seek generic reconfirmation for ordinary authorized setup.

Scope rollback to this application's changes and revisions. Preserve any pre-existing migration ledger and verify object ownership and sequence permissions. Do not import local test accounts/passwords as server credentials.

Verify the API reads the server's `bkhorguashvili` records, repeats seed without duplicates, preserves 2,088 current Fiber paths / 1,631 transitions / 384 exact Port bindings and all scoped uncertainty/conflicts, and persists an attributed review across application restart and a second client session. Demonstrate no writes to other schemas. Check network/TLS/auth failures visibly fail rather than silently loading offline data. Reuse the existing map and API browser journeys.

Deliver a sanitized connection/setup guide, schema mapping and exact applied changes, count/path comparison, real connection and browser results, rollback procedure, and remaining limits. Server database integration does not itself certify public web deployment or arbitrary Visio import.

## Worker status

Track execution in HANDOFF.md. No server access, schema inspection, DDL, seed or application connection was performed by this planning update.
