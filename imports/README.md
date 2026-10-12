# Local Visio import

Copy `.vsdx` files into `imports/inbox/`. In PowerShell, run a one-time scan with:

```powershell
py -3 scripts/import-inbox.py
```

An optional polling helper uses the same import service:

```powershell
py -3 scripts/import-inbox.py --watch
```

Both modes wait for stable file size and modified time, validate the VSDX package, identify it by SHA-256, and use the same lock and extraction pipeline. Repeated content is reported as already staged/imported; a changed file under the same name is recorded as a new revision. Job stage/status JSON is written to `imports/state/jobs/`. Extraction candidates are kept under `imports/processing/`; failures and diagnostic artifacts are preserved under `imports/failed/`.

The importer does not activate topology merely because extraction succeeded. A source-specific interpretation and network reconciliation must pass their semantic gates before promotion to the active network. The standalone browser cannot watch a Windows directory on its own.
