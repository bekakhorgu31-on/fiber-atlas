# Iteration 30 — server migration and verified seed

**Owner direction update, 2026-10-08:** the proposal below to activate the seeded reference is superseded. The owner wants the app network emptied after import-workflow readiness, then will upload Visio personally through a local URL connected to this server. Follow [Iteration 32](ITERATION-32-OWNER-IMPORT-EMPTY-SERVER-UI.md). This document retains the historical seed/verification evidence; no cleanup has yet been performed by the planning session.

2026-10-08. Owner selected `DB_SSLMODE=require` and explicitly enabled scoped writes in protected configuration. The connection remains encrypted (TLSv1.3); no custom CA/certificate-identity verification is claimed. Password and credential fields were not printed or changed.

## Applied within bkhorguashvili

- Fresh read-only collision check confirmed the schema was still empty before any DDL.
- Nine compatible additive migrations plus migration bookkeeping succeeded. The post-seed scoped inventory reports 35 relations (application/framework tables and identity sequences), three application functions and their scoped triggers/constraints/indexes. No fresh/reset/drop/truncate or unrelated grants/extensions were executed.
- Reviewed baseline persisted successfully. Repeat seed reused the same revision and records without duplicates.
- Read-only verification compares every stored core record and all 2,088 path structures to the reviewed reference: 37 Cables, 174 Tubes, 2,088 Fibers, 1,631 node transitions, 384 exact Port bindings and 473 current Lineages. No cross-schema foreign key was found. Database/current schema/effective search path match the declared owner target.

Evidence: `iteration30-server-migrations.txt`, `iteration30-server-seed.txt`, `iteration30-server-reseed.txt`, `iteration30-server-verification.json`, `iteration30-server-after-seed.json`. Pre-change inventory remains `iteration30-server-inventory.json`.

## Activation not performed

Independent configuration recheck (2026-10-08): Laravel's effective profile is `server`, schema/search path is `bkhorguashvili`, SSL mode is `require`, scoped writes are enabled, and no cached configuration is present. A fresh metadata-only read-only connection to `10.0.61.15:5432/on` as `bkhorguashvili` succeeded over TLSv1.3. It found 31 base tables and confirmed the active-state row still has `network_revision = NULL`. This check made no server changes and did not rerun full seed/path parity or browser QA.

Validated revision: `NETWORK-28L-397cb29f8c3b0280-OP1-8109aecedeb6`.

The remote active revision is still **NULL**. Automatic approval review rejected the combined seed/activate command, stating that activation required explicit approval separate from table creation/seeding. The safer seed-only operation was then completed. No indirect activation or bypass was attempted.

The reviewable next operation is initial activation of the already verified revision with expected current revision NULL. This does not replace another active dataset. After explicit approval: activate that revision, verify the server-backed API, then complete scoped account/review persistence and browser delivery checks. The server integration is not yet Done and is not a public web deployment.
