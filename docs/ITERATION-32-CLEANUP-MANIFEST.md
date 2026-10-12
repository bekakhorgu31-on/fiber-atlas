# Iteration 32 — exact cleanup manifest and evidence

Target: 10.0.61.15:5432 / on / bkhorguashvili. Completed: 2026-10-08; delivery verified 2026-10-09.

Only NETWORK-28L-397cb29f8c3b0280-OP1-8109aecedeb6 and its two identified reviewed-baseline source revisions were deleted. Backup restoration and transactional cleanup rollback passed locally; fresh locked server fingerprints matched before commit.

| Fully qualified table | Before | After |
|---|---:|---:|
| bkhorguashvili.review_events | 0 | 0 |
| bkhorguashvili.review_subject_versions | 0 | 0 |
| bkhorguashvili.activation_events | 0 | 0 |
| bkhorguashvili.fiber_paths | 2088 | 0 |
| bkhorguashvili.projection_snapshots | 2 | 0 |
| bkhorguashvili.network_attributes | 59 | 0 |
| bkhorguashvili.domain_records | 5242 | 0 |
| bkhorguashvili.port_topology_bindings | 384 | 0 |
| bkhorguashvili.node_fiber_transitions | 1631 | 0 |
| bkhorguashvili.ports | 576 | 0 |
| bkhorguashvili.fibers | 2088 | 0 |
| bkhorguashvili.tubes | 174 | 0 |
| bkhorguashvili.cable_segments | 37 | 0 |
| bkhorguashvili.canonical_nodes | 38 | 0 |
| bkhorguashvili.network_sources | 2 | 0 |
| bkhorguashvili.network_revisions | 1 | 0 |
| bkhorguashvili.source_shapes | 0 | 0 |
| bkhorguashvili.import_candidates | 0 | 0 |
| bkhorguashvili.import_runs | 0 | 0 |
| bkhorguashvili.source_revisions | 2 | 0 |
| bkhorguashvili.source_documents | 2 | 0 |

Preserved: bkhorguashvili.migrations, bkhorguashvili.users, bkhorguashvili.password_reset_tokens, bkhorguashvili.sessions, bkhorguashvili.cache, bkhorguashvili.cache_locks, bkhorguashvili.jobs, bkhorguashvili.job_batches, bkhorguashvili.failed_jobs, bkhorguashvili.active_network_state.

Schema definitions, constraints, indexes, functions, triggers, configuration, original VSDX and shared physical files retained. Active singleton remains NULL. No broad cascade/drop/reset and no physical file deletion. Backup is private in .dev-runtime/iteration32-backup; SHA-256 10c941affc7df6f13c8bbd98804c8176b78cf0d59c7602d85ef762e414abf3ee.

Exact post-cleanup fingerprints are in iteration32-server-cleanup.json; real empty/setup browser checks are in iteration32-server-empty-qa.json.
