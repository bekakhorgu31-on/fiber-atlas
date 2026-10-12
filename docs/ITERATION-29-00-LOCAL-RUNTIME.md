# Iteration 29-00 — project-local backend runtime

Verified 2026-10-05 on this Windows host. A real PostgreSQL connection succeeds; no system service, system PATH or system DLL was changed. This resolves the earlier absence-of-tooling blocker.

| Tool | Actual version | Project-local path |
|---|---|---|
| PHP CLI | 8.3.35, NTS x64 VS16 | `.dev-runtime/php83/php.exe` |
| Composer | 2.10.3 | `.dev-runtime/composer.phar` |
| PostgreSQL | 18.6, x64, msvc-19.44.35229 | `.dev-runtime/postgresql/pgsql/bin/` |
| Laravel framework | 13.34.0 (locked Composer dependency) | `backend/` |
| Microsoft C++ DLLs | 14.51.36247.0, valid Microsoft signatures | beside the PostgreSQL executables only |

## Distribution and verification

PHP's [official Windows distribution](https://www.php.net/downloads.php?os=windows&version=8.3) provides the ZIP used here. Its published SHA-256 matched `25a8e2ac9ff30f1d768d1447c09a600617fa6e6082729f6e95f008b59c91fe45`. PHP 8.4 was tried first but required VCRUNTIME140 14.44; the existing system DLL was 14.29. PHP 8.3 runs without changing that DLL and meets [Laravel 13's PHP requirement](https://laravel.com/docs/13.x/deployment).

The [Composer installer](https://getcomposer.org/download/) was SHA-384-checked against its official signature before execution. Its install directory, configuration and cache are all inside `.dev-runtime`.

The PostgreSQL ZIP is linked by the [official Windows download page](https://www.postgresql.org/download/windows/) through [EDB's binaries page](https://www.enterprisedb.com/download-postgresql-binaries), version 18.6, file ID 1260609. Downloaded archive: 384,620,317 bytes; SHA-256 `e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2`. This SHA is a locally recorded content fingerprint, not a separately published EDB signature. Only `pgsql/bin`, `pgsql/lib` and `pgsql/share` were extracted with containment-checked paths; pgAdmin and StackBuilder were not installed.

The initial PostgreSQL initialization crashed in system `MSVCP140.dll` 14.28. The managed workspace runtime already contains Microsoft-signed 14.51 C++ DLLs under its Poppler dependency. Their signatures were verified and copies placed beside PostgreSQL's executables, a [documented application-local deployment mechanism](https://learn.microsoft.com/en-us/cpp/windows/redistributing-visual-cpp-files). Existing system files are untouched. These development copies are ignored and are not part of a distributed release.

## Start, stop and connection checks

Reproducible tool preparation: `./scripts/setup-local-runtime.ps1`. It verifies the pinned PHP/PostgreSQL archive hashes, validates the managed Microsoft DLL signatures, writes a project-local PHP configuration and installs the checksum-verified Composer version. It requires the managed runtime's DLL directory; absence is reported instead of running a system installer. The helper was replayed successfully on the delivery host. Development PHP uploads are bounded at 20 MB (24 MB POST envelope).

From the project directory in PowerShell:

```powershell
./scripts/local-backend-runtime.ps1 init
./scripts/local-backend-runtime.ps1 start
./scripts/local-backend-runtime.ps1 test
./scripts/local-backend-runtime.ps1 status
./scripts/local-backend-runtime.ps1 stop
```

The cluster lives in `.dev-runtime/pgdata`, listens only on `127.0.0.1:55432`, and uses SCRAM password authentication. A generated development password stays in ignored `.dev-runtime/postgres-settings.json`; no credentials are committed or printed. `init` preserves an existing cluster. `start` hides its helper window and waits only for `pg_ctl`, allowing the database process to remain running. `stop` performs a PostgreSQL fast shutdown; it does not delete data.

Actual connection output:

```text
PostgreSQL 18.6 on x86_64-windows, compiled by msvc-19.44.35229, 64-bit
```

On this Codex host, initialization/server execution must use the normal Windows token: the nested restricted sandbox token cannot create PostgreSQL's child token. Concrete commands succeeded through the normal approval mechanism. Downloads similarly need approved network access; no automatic-review rejection occurred. These are execution-boundary facts, not system-install requirements.

The first connection, shutdown, corrected start helper and second SQL connection all passed. Laravel boots and reports its locked framework version. Backend migrations, persistence, API reads/writes and restart/rollback acceptance remain separate tasks and are not certified by runtime availability alone.

## Existing test-runner issue

The restricted token also caused Node `os.userInfo()` to fail before test discovery. Running the unchanged test suite under the normal token resolves this: 14 focused topology tests and the full 801-test suite pass. No `os.userInfo()` shim or dependency patch was used in the successful runs. Full evidence: `docs/iteration29-checkpoint-tests.txt`.
