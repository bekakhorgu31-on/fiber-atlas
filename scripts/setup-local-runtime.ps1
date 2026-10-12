param([string]$ManagedRuntimeRoot = (Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies'))
$ErrorActionPreference='Stop'
$projectDirectory=Split-Path $PSScriptRoot -Parent
$runtimeDirectory=Join-Path $projectDirectory '.dev-runtime'
New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null
function Get-VerifiedDownload([string]$Url,[string]$Destination,[string]$Sha256) {
    if(!(Test-Path $Destination) -or (Get-FileHash -LiteralPath $Destination -Algorithm SHA256).Hash.ToLower() -ne $Sha256) {
        & curl.exe --fail --location --continue-at - --max-time 300 --silent --show-error $Url --output $Destination
        if($LASTEXITCODE -ne 0){throw "Download failed: $Url"}
    }
    if((Get-FileHash -LiteralPath $Destination -Algorithm SHA256).Hash.ToLower() -ne $Sha256){throw "Checksum mismatch: $Destination"}
}
$phpArchive=Join-Path $runtimeDirectory 'php-8.3.35.zip'
Get-VerifiedDownload 'https://downloads.php.net/~windows/releases/php-8.3.35-nts-Win32-vs16-x64.zip' $phpArchive '25a8e2ac9ff30f1d768d1447c09a600617fa6e6082729f6e95f008b59c91fe45'
if(!(Test-Path (Join-Path $runtimeDirectory 'php83/php.exe'))){Expand-Archive -LiteralPath $phpArchive -DestinationPath (Join-Path $runtimeDirectory 'php83')}
$postgresArchive=Join-Path $runtimeDirectory 'postgresql-18.6.zip'
Get-VerifiedDownload 'https://sbp.enterprisedb.com/getfile.jsp?fileid=1260609' $postgresArchive 'e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2'
$postgresDirectory=Join-Path $runtimeDirectory 'postgresql'
if(!(Test-Path (Join-Path $postgresDirectory 'pgsql/bin/pg_ctl.exe'))) {
    $archive=[System.IO.Compression.ZipFile]::OpenRead($postgresArchive)
    try {foreach($entry in $archive.Entries) {
        if($entry.FullName -notmatch '^pgsql/(bin|lib|share)/'){continue}
        $target=[System.IO.Path]::GetFullPath((Join-Path $postgresDirectory $entry.FullName))
        $allowed=[System.IO.Path]::GetFullPath($postgresDirectory)+[System.IO.Path]::DirectorySeparatorChar
        if(!$target.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Unsafe archive path.'}
        if($entry.FullName.EndsWith('/')){New-Item -ItemType Directory -Path $target -Force | Out-Null}
        else {New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null;[System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$target,$true)}
    }}finally{$archive.Dispose()}
}
$vcSource=Join-Path $ManagedRuntimeRoot 'native/poppler/Library/bin'
foreach($name in @('msvcp140.dll','msvcp140_1.dll','msvcp140_2.dll','msvcp140_atomic_wait.dll','msvcp140_codecvt_ids.dll','vcruntime140.dll','vcruntime140_1.dll','concrt140.dll')) {
    $source=Join-Path $vcSource $name
    if(!(Test-Path $source)){throw "Managed C++ runtime DLL unavailable: $name. No system installer was run."}
    $signature=Get-AuthenticodeSignature -FilePath $source
    if($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Microsoft' -or [version](Get-Item $source).VersionInfo.FileVersion -lt [version]'14.44.0.0'){throw "Unsupported or unverified runtime DLL: $name"}
    $destination=Join-Path $postgresDirectory "pgsql/bin/$name"
    if(!(Test-Path $destination) -or (Get-FileHash $source).Hash -ne (Get-FileHash $destination).Hash){Copy-Item -LiteralPath $source -Destination $destination}
}
foreach($download in @(@('https://curl.se/ca/cacert.pem','cacert.pem'),@('https://getcomposer.org/installer','composer-setup.php'),@('https://composer.github.io/installer.sig','composer-installer.sig'))) {
    & curl.exe --fail --location --max-time 30 --silent --show-error $download[0] --output (Join-Path $runtimeDirectory $download[1])
    if($LASTEXITCODE -ne 0){throw 'Could not fetch official CA/Composer files.'}
}
$installerHash=(Get-FileHash (Join-Path $runtimeDirectory 'composer-setup.php') -Algorithm SHA384).Hash.ToLower()
if($installerHash -ne (Get-Content (Join-Path $runtimeDirectory 'composer-installer.sig') -Raw).Trim()){throw 'Composer installer signature mismatch.'}
$phpDirectory=(Join-Path $runtimeDirectory 'php83').Replace('\','/')
$caPath=(Join-Path $runtimeDirectory 'cacert.pem').Replace('\','/')
@"
extension_dir="$phpDirectory/ext"
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo_pgsql
extension=pgsql
extension=zip
extension=intl
memory_limit=512M
upload_max_filesize=20M
post_max_size=24M
curl.cainfo="$caPath"
openssl.cafile="$caPath"
date.timezone=Asia/Tbilisi
"@ | Set-Content -LiteralPath (Join-Path $runtimeDirectory 'php83/php.ini')
$previousComposerHome=$env:COMPOSER_HOME;$previousComposerCache=$env:COMPOSER_CACHE_DIR
try {
    $env:COMPOSER_HOME=Join-Path $runtimeDirectory 'composer-home';$env:COMPOSER_CACHE_DIR=Join-Path $runtimeDirectory 'composer-cache'
    & (Join-Path $runtimeDirectory 'php83/php.exe') (Join-Path $runtimeDirectory 'composer-setup.php') --version=2.10.3 --install-dir=$runtimeDirectory --filename=composer.phar
    if($LASTEXITCODE -ne 0){throw 'Project-local Composer installation failed.'}
} finally {$env:COMPOSER_HOME=$previousComposerHome;$env:COMPOSER_CACHE_DIR=$previousComposerCache}
& (Join-Path $runtimeDirectory 'php83/php.exe') -v
& (Join-Path $postgresDirectory 'pgsql/bin/postgres.exe') --version
