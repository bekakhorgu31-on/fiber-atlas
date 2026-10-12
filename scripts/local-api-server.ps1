param([ValidateSet('start','stop','status')][string]$Action='status',[ValidateSet('server','local','isolation')][string]$Profile='server',[int]$Port=8000)
$ErrorActionPreference='Stop'
$projectDirectory=Split-Path $PSScriptRoot -Parent
$runtimeDirectory=Join-Path $projectDirectory '.dev-runtime'
$statePath=Join-Path $runtimeDirectory $(if($Port -eq 8000){'api-server.json'}else{"api-server-$Port.json"})
$phpPath=Join-Path $runtimeDirectory 'php83/php.exe'
if($Action -eq 'start') {
    if(Test-Path $statePath) {
        $state=Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
        if(Get-Process -Id $state.processId -ErrorAction SilentlyContinue) { if($state.profile -and $state.profile -ne $Profile){throw 'Another profile already uses this port. Stop it explicitly first.'}; Write-Output 'Local API process is already running.';exit 0 }
    }
    $publicDirectory=Join-Path $projectDirectory 'backend/public'
    $routerPath=Join-Path $projectDirectory 'backend/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php'
    $previousEnvironment=@{}
    $desiredEnvironment=@{}
    $profileFile=Join-Path $projectDirectory $(if($Profile -eq 'server'){'backend/.env'}else{"backend/.env.$Profile"})
    foreach($line in (Get-Content -LiteralPath $profileFile)) {
        if($line -match '^([A-Z][A-Z0-9_]*)=(.*)$'){$desiredEnvironment[$Matches[1]]=$Matches[2].Trim('"')}
    }
    if($Profile -eq 'isolation') {
        $keyLine=Get-Content -LiteralPath (Join-Path $projectDirectory 'backend/.env.local') | Where-Object {$_ -match '^APP_KEY='} | Select-Object -First 1
        $desiredEnvironment['APP_KEY']=$keyLine.Substring(8).Trim('"');$desiredEnvironment['SESSION_DRIVER']='file';$desiredEnvironment['CACHE_STORE']='file'
        $desiredEnvironment['FIBER_PYTHON']=Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
    }
    $desiredEnvironment['APP_ENV']=$Profile
    $desiredEnvironment['APP_URL']="http://127.0.0.1:$Port"
    foreach($key in $desiredEnvironment.Keys){$previousEnvironment[$key]=[Environment]::GetEnvironmentVariable($key,'Process');[Environment]::SetEnvironmentVariable($key,$desiredEnvironment[$key],'Process')}
    $arguments=@('-d','memory_limit=1536M','-d','max_execution_time=300','-d','upload_max_filesize=20M','-d','post_max_size=24M','-S',"127.0.0.1:$Port",'-t',('"'+$publicDirectory+'"'),('"'+$routerPath+'"'))
    $stdoutName=if($Port -eq 8000){'api-stdout.log'}else{"api-stdout-$Port.log"}
    $stderrName=if($Port -eq 8000){'api-stderr.log'}else{"api-stderr-$Port.log"}
    try{$process=Start-Process -FilePath $phpPath -ArgumentList $arguments -WorkingDirectory $publicDirectory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDirectory $stdoutName) -RedirectStandardError (Join-Path $runtimeDirectory $stderrName)}
    finally{foreach($key in $previousEnvironment.Keys){if($null -eq $previousEnvironment[$key]){Remove-Item -LiteralPath "Env:\$key" -ErrorAction SilentlyContinue}else{[Environment]::SetEnvironmentVariable($key,$previousEnvironment[$key],'Process')}}}
    @{processId=$process.Id;executable=$phpPath;port=$Port;profile=$Profile} | ConvertTo-Json | Set-Content -LiteralPath $statePath
    Write-Output "Project API started on http://127.0.0.1:$Port ($Profile profile)"
} elseif($Action -eq 'stop') {
    if(!(Test-Path $statePath)) { Write-Output 'No saved API process.';exit 0 }
    $state=Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    $process=Get-CimInstance Win32_Process -Filter "ProcessId = $($state.processId)"
    if($process) {
        if($process.ExecutablePath -ne $phpPath -or $process.CommandLine -notmatch ('127\.0\.0\.1:'+[regex]::Escape([string]$state.port))) { throw 'Saved PID belongs to another process; refusing to stop it.' }
        Stop-Process -Id $state.processId
    }
    Remove-Item -LiteralPath $statePath
    Write-Output 'Project API stopped.'
} else {
    if(!(Test-Path $statePath)) { Write-Output 'Local API is not running.';exit 0 }
    $state=Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    Get-Process -Id $state.processId | Select-Object Id,ProcessName
}
