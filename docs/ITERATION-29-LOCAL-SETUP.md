# Fiber Atlas — local Laravel/PostgreSQL setup

Updated 2026-10-06. This setup runs inside the existing project on Windows. It uses no Windows service, system PATH change, Docker or WSL. The API and PostgreSQL listen only on loopback.

## First setup

From `C:\Users\Beka\Desktop\Visio Alt\fiber-prototype` in PowerShell:

```powershell
./scripts/setup-local-runtime.ps1
./scripts/local-backend-runtime.ps1 init
./scripts/local-backend-runtime.ps1 start
./scripts/local-backend-runtime.ps1 test
./.dev-runtime/php83/php.exe scripts/configure-local-backend.php
```

The tool helper requires the managed workspace's Microsoft-signed C++ DLLs; it reports the exact missing dependency when unavailable. Official download URLs/checksums and actual versions are in [the runtime record](ITERATION-29-00-LOCAL-RUNTIME.md). On this Codex host, network access and PostgreSQL process initialization require the normal Windows token through the usual concrete approval mechanism.

If Laravel dependencies are absent:

```powershell
$env:COMPOSER_HOME = "$PWD/.dev-runtime/composer-home"
$env:COMPOSER_CACHE_DIR = "$PWD/.dev-runtime/composer-cache"
./.dev-runtime/php83/php.exe .dev-runtime/composer.phar install --working-dir=backend --no-interaction
```

Use the bundled Node executable from the managed runtime, or `node` when available on PATH, for existing frontend commands:

```powershell
node --import tsx scripts/export-iteration29-baseline.ts --check
node --import tsx scripts/export-iteration29-operational.ts
./.dev-runtime/php83/php.exe backend/artisan migrate --force
./.dev-runtime/php83/php.exe -d memory_limit=1536M backend/artisan fiber:seed-baseline --activate
./.dev-runtime/php83/php.exe backend/artisan fiber:local-users
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
node scripts/export-standalone.mjs
./scripts/local-api-server.ps1 start
```

The large reference seed is an import operation and requires the documented temporary 1536 MB PHP budget. Normal API requests retain the 512 MB limit; the complete 75 MB archive is not a startup response. The seed is idempotent and validates persisted records against the reviewed authority. When a different revision is already active, supply its ID with `--expected=...`; a stale expected revision fails.

## Open the application

- Local database mode: `http://127.0.0.1:8000/?data=database`.
- Explicit offline reference mode: `http://127.0.0.1:8000/?data=offline-demo`.
- Standalone offline export: the sibling `fiber-prototype.html`.

An API failure displays a connection error. It never silently loads the offline snapshot. Import/Review/Splice load revision-pinned engineering detail; the map can request that detail through its evidence button.

Local account names are `reviewer@fiber-atlas.local` and `viewer@fiber-atlas.local`. Their generated passwords are in ignored `.dev-runtime/backend-settings.json`. The reviewer can append decisions and stage source files; the viewer cannot write. These are development accounts, not public-production credentials.

To inspect staged files, sign in under Review and open Visio Import. Choose the existing source document explicitly, or explicitly create a named document. Uploaded bytes, extracted artifacts, Shape indexes, candidates, diffs and reviews are retained separately. Candidate acceptance does not activate topology. New or unsupported source semantics stay staged.

## Stop, restart and rollback

```powershell
./scripts/local-api-server.ps1 stop
./scripts/local-backend-runtime.ps1 stop
./scripts/local-backend-runtime.ps1 start
./scripts/local-api-server.ps1 start
```

These commands preserve database files and session/review history. Run the start helpers directly after automated restart tests; test-owned child processes may be cleaned up when the test's process tree closes.

Retained validated revisions can be activated/rolled back only through the local CLI for this milestone:

```powershell
./.dev-runtime/php83/php.exe backend/artisan fiber:activate RETAINED_REVISION --expected=CURRENT_REVISION --rollback
```

Activation locks the active pointer, validates authority digests/counts and projection hashes, and switches atomically. A failed candidate leaves the existing revision active. Details for earlier retained revisions remain pinned and readable.

## Validation

```powershell
node --import tsx --test tests/*.test.ts
./.dev-runtime/php83/php.exe -d memory_limit=1536M backend/vendor/bin/phpunit -c backend/phpunit.xml --testdox
./scripts/local-backend-runtime.ps1 start
node scripts/iteration29-api-browser-qa.mjs
```

Run PostgreSQL integration and server-restart browser tests sequentially. The PostgreSQL test guard refuses every database except `fiber_atlas_test`; tests rebuild that dedicated database, never `fiber_atlas`. On this host the restricted token prevents Node's user-profile lookup, so run these checks under the normal approved token. Python importer commands and full evidence are recorded in `VALIDATION.md`.

This is a working local pilot. Public deployment, backup/restore certification, production access/release review, monitoring and a genuinely new Visio-family acceptance test remain outside this delivery.
