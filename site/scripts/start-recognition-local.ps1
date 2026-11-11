param([int]$Port = 3000, [switch]$Foreground)
$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path -Parent $PSScriptRoot
$shelfRoot = [IO.Path]::GetFullPath((Join-Path $siteRoot '../../../../dj/ShelfData-Belarus'))
$node = Join-Path $shelfRoot 'work/node/node-v24.22.2-win-x64/node.exe'
if (-not (Test-Path -LiteralPath $node)) { throw 'Local Node runtime is missing.' }
if (-not (Test-Path -LiteralPath (Join-Path $siteRoot '.env.local'))) { throw 'Private password configuration is missing.' }
if (netstat -ano | Select-String ":$Port\s.*LISTENING") { throw 'Website port is already occupied.' }
. (Join-Path $shelfRoot 'scripts/hf_token_storage.ps1')
Set-ShelfDataPrivateAcl (Join-Path $siteRoot '.env.local') $false
$logDir = Join-Path $shelfRoot 'work/site-recognition'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$previousToken = $env:SHELFDATA_HF_TOKEN
$secure = $null
$pointer = [IntPtr]::Zero
try {
    $secure = Read-ShelfDataHfToken
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $env:SHELFDATA_HF_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    $env:NEXT_TELEMETRY_DISABLED = '1'
    $env:GRADIO_ANALYTICS_ENABLED = 'False'
    $env:HF_HUB_DISABLE_TELEMETRY = '1'
    $env:TEMP = Join-Path $shelfRoot 'work/tmp'
    $env:TMP = $env:TEMP
    $cli = Join-Path $siteRoot 'node_modules/next/dist/bin/next'
    if ($Foreground) {
        Set-Location -LiteralPath $siteRoot
        & $node $cli dev --hostname 127.0.0.1 --port "$Port" --webpack
        return
    }
    $process = Start-Process -FilePath $node -ArgumentList @("`"$cli`"", 'dev', '--hostname', '127.0.0.1', '--port', "$Port", '--webpack') -WorkingDirectory $siteRoot -PassThru -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'web.log') -RedirectStandardError (Join-Path $logDir 'web.err.log')
    @{ web = $process.Id; port = $Port } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $logDir 'pids.json') -Encoding UTF8
    Write-Output "Recognition website started at http://127.0.0.1:$Port/recognition"
}
finally {
    $env:SHELFDATA_HF_TOKEN = $previousToken
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    if ($secure) { $secure.Dispose() }
}
