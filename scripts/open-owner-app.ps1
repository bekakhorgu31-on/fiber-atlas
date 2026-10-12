param([switch]$Stop)
$ErrorActionPreference='Stop'
$projectDirectory=Split-Path $PSScriptRoot -Parent
if($Stop){& (Join-Path $PSScriptRoot 'local-api-server.ps1') stop -Profile server;exit}
$phpPath=Join-Path $projectDirectory '.dev-runtime/php83/php.exe'
$artisanPath=Join-Path $projectDirectory 'backend/artisan'
& $phpPath (Join-Path $PSScriptRoot 'configure-owner-web.php')
if($LASTEXITCODE -ne 0){throw 'Owner web configuration check failed.'}
& $phpPath $artisanPath fiber:owner-setup --env=server --no-interaction
if($LASTEXITCODE -ne 0){throw 'Database connection or owner setup check failed.'}
& (Join-Path $PSScriptRoot 'local-api-server.ps1') start -Profile server
$url='http://127.0.0.1:8000/?data=database'
$ticketPath=Join-Path $projectDirectory '.dev-runtime/owner-setup-server.json'
if(Test-Path -LiteralPath $ticketPath){$ticket=Get-Content -LiteralPath $ticketPath -Raw | ConvertFrom-Json;$url+='&setup='+[uri]::EscapeDataString($ticket.token)}
Start-Process -FilePath $url
