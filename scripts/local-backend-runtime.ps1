param([ValidateSet('init','start','stop','status','test')][string]$Action = 'status')
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path $PSScriptRoot -Parent
$runtimeDirectory = Join-Path $projectDirectory '.dev-runtime'
$postgresBin = Join-Path $runtimeDirectory 'postgresql/pgsql/bin'
$dataDirectory = Join-Path $runtimeDirectory 'pgdata'
$settingsPath = Join-Path $runtimeDirectory 'postgres-settings.json'
$postgresPort = 55432
function Assert-NativeSuccess { if ($LASTEXITCODE -ne 0) { throw "Runtime command failed: $LASTEXITCODE" } }
if (!(Test-Path (Join-Path $postgresBin 'pg_ctl.exe'))) { throw 'Project-local PostgreSQL binaries are missing. See docs/ITERATION-29-00-LOCAL-RUNTIME.md.' }
if ($Action -eq 'init') {
    if (Test-Path (Join-Path $dataDirectory 'PG_VERSION')) { Write-Output 'Existing database cluster retained.'; exit 0 }
    if (Test-Path $settingsPath) { $settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json }
    else {
        $secretBytes = [byte[]]::new(32)
        [System.Security.Cryptography.RandomNumberGenerator]::Fill($secretBytes)
        $settings = @{ user = 'fiber_dev'; password = [Convert]::ToHexString($secretBytes).ToLower(); port = $postgresPort }
        $settings | ConvertTo-Json | Set-Content -LiteralPath $settingsPath
    }
    $passwordFile = Join-Path $runtimeDirectory 'init-password.txt'
    try {
        Set-Content -LiteralPath $passwordFile -Value $settings.password -NoNewline
        & (Join-Path $postgresBin 'initdb.exe') -D $dataDirectory -U $settings.user --auth=scram-sha-256 --pwfile=$passwordFile --encoding=UTF8 --locale=C
        Assert-NativeSuccess
        Add-Content -LiteralPath (Join-Path $dataDirectory 'postgresql.conf') -Value "`nlisten_addresses = '127.0.0.1'`nport = $postgresPort"
    } finally { if (Test-Path $passwordFile) { Remove-Item -LiteralPath $passwordFile } }
    exit 0
}
if (!(Test-Path $settingsPath)) { throw 'Initialize the project-local cluster first.' }
$settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json
if ($Action -eq 'start') {
    & (Join-Path $postgresBin 'pg_ctl.exe') status -D $dataDirectory *> $null
    if ($LASTEXITCODE -eq 0) { Write-Output 'Project database is already running.'; exit 0 }
    $arguments = @('-D',('"' + $dataDirectory + '"'),'-l',('"' + (Join-Path $runtimeDirectory 'postgres.log') + '"'),'-w','start')
    $process = Start-Process -FilePath (Join-Path $postgresBin 'pg_ctl.exe') -ArgumentList $arguments -WindowStyle Hidden -PassThru
    if (!$process.WaitForExit(30000)) { throw 'PostgreSQL control process did not finish in 30 seconds.' }
    if ($process.ExitCode -ne 0) { throw "PostgreSQL start failed; inspect .dev-runtime/postgres.log. Exit: $($process.ExitCode)" }
    Write-Output "Project PostgreSQL listening on 127.0.0.1:$postgresPort"
    exit 0
} elseif ($Action -eq 'stop') {
    & (Join-Path $postgresBin 'pg_ctl.exe') -D $dataDirectory -m fast -w stop
    Assert-NativeSuccess
} elseif ($Action -eq 'status') {
    & (Join-Path $postgresBin 'pg_ctl.exe') status -D $dataDirectory
    Assert-NativeSuccess
} else {
    $previousPassword = $env:PGPASSWORD
    try {
        $env:PGPASSWORD = $settings.password
        & (Join-Path $postgresBin 'psql.exe') -h 127.0.0.1 -p $settings.port -U $settings.user -d postgres --no-password -At -c 'SELECT version();'
        Assert-NativeSuccess
    } finally { $env:PGPASSWORD = $previousPassword }
}
