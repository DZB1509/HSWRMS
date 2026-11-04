# ============================================================================
# run-project.ps1 - HSWRMS one-command local launcher (Windows PowerShell 5.1)
#
# Usage (from the repository root):
#   .\run-project.ps1
#
# What it does:
#   1. Checks prerequisites (Java 17, Node.js, npm) and required files.
#   2. Starts the backend launcher (05_Development/backend/run-local.ps1) in a
#      separate PowerShell window. The backend runs on H2 (local profile) and
#      its Gmail SMTP dev defaults are handled by run-local.ps1 - no manual setup.
#   3. Installs frontend dependencies (npm ci) ONLY if node_modules is missing.
#   4. Starts the Vite dev server (npm run dev) in THIS window.
#
#   Frontend: http://localhost:5173
#   Backend : http://localhost:8080/api/v1  (health: /api/v1/health)
#
# This script never prints any credentials.
# ============================================================================
$ErrorActionPreference = 'Stop'

$root            = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backendLauncher = Join-Path $root '05_Development\backend\run-local.ps1'
$backendDir      = Join-Path $root '05_Development\backend'
$mvnw            = Join-Path $backendDir 'mvnw.cmd'
$frontendDir     = Join-Path $root '05_Development\frontend'
$packageJson     = Join-Path $frontendDir 'package.json'
$nodeModules     = Join-Path $frontendDir 'node_modules'

function Fail([string]$msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

# Run a native tool and capture its combined output (used only for version checks).
function Get-ToolOutput([string]$exe, [string[]]$argList) {
    $cmd = Get-Command $exe -ErrorAction SilentlyContinue
    if (-not $cmd) { return $null }
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { return ((& $exe @argList 2>&1) | Out-String) }
    finally { $ErrorActionPreference = $prev }
}

Write-Host 'HSWRMS local launcher - checking prerequisites...' -ForegroundColor Cyan

# --- Required files --------------------------------------------------------
foreach ($f in @($backendLauncher, $mvnw, $packageJson)) {
    if (-not (Test-Path -LiteralPath $f)) { Fail "Required file not found: $f" }
}

# --- Java 17 ---------------------------------------------------------------
$javaOut = Get-ToolOutput 'java' @('-version')
if ([string]::IsNullOrWhiteSpace($javaOut)) {
    Fail 'Java 17 not found. Install JDK 17 and ensure "java" is on PATH.'
}
if ($javaOut -notmatch 'version"?\s*"?17') {
    Write-Host 'WARNING: Java 17 was not detected. The backend requires Java 17.' -ForegroundColor Yellow
}

# --- Node.js + npm ---------------------------------------------------------
$nodeOut = Get-ToolOutput 'node' @('--version')
if ([string]::IsNullOrWhiteSpace($nodeOut)) {
    Fail 'Node.js not found. Install Node.js and ensure "node" is on PATH.'
}
$npmOut = Get-ToolOutput 'npm' @('--version')
if ([string]::IsNullOrWhiteSpace($npmOut)) {
    Fail 'npm not found. Reinstall Node.js (npm ships with Node.js).'
}
Write-Host ("Prerequisites OK - Node {0}; npm {1}" -f $nodeOut.Trim(), $npmOut.Trim()) -ForegroundColor DarkGray

# --- Port checks (informational only; never kill unrelated processes) ------
function Test-PortListening([int]$port) {
    try { return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop | Select-Object -First 1) }
    catch { return $false }
}
if (Test-PortListening 8080) { Write-Host 'WARNING: port 8080 already in use - the backend may fail to bind (no process was killed).' -ForegroundColor Yellow }
if (Test-PortListening 5173) { Write-Host 'WARNING: port 5173 already in use - Vite may choose another port (no process was killed).' -ForegroundColor Yellow }

# --- Start backend in a separate PowerShell window -------------------------
Write-Host 'Starting backend in a new PowerShell window (H2 + Gmail SMTP configured automatically)...' -ForegroundColor Green
$backendArgs = @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', ('"{0}"' -f $backendLauncher))
try {
    Start-Process -FilePath 'powershell.exe' -ArgumentList $backendArgs -WorkingDirectory $backendDir | Out-Null
}
catch {
    Fail "Could not start the backend window: $($_.Exception.Message)"
}

# --- Frontend --------------------------------------------------------------
Push-Location $frontendDir
try {
    if (-not (Test-Path -LiteralPath $nodeModules)) {
        Write-Host 'node_modules missing - running "npm ci" (one-time dependency install)...' -ForegroundColor Yellow
        $prevEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try { & npm ci } finally { $ErrorActionPreference = $prevEap }
        if ($LASTEXITCODE -ne 0) { Fail 'npm ci failed. Fix the errors above and re-run .\run-project.ps1.' }
    }
    else {
        Write-Host 'node_modules present - skipping dependency install.' -ForegroundColor DarkGray
    }

    Write-Host ''
    Write-Host '  Frontend : http://localhost:5173' -ForegroundColor Green
    Write-Host '  Backend  : http://localhost:8080/api/v1   (health: /api/v1/health)' -ForegroundColor Green
    Write-Host '  Next     : open the frontend, register with your own email to receive a Gmail OTP, then verify and log in.' -ForegroundColor Green
    Write-Host '  Stop     : close/stop the backend window; press Ctrl+C here to stop the frontend.' -ForegroundColor Green
    Write-Host ''

    $prevEap2 = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & npm run dev } finally { $ErrorActionPreference = $prevEap2 }
    if ($LASTEXITCODE -ne 0) { Fail 'Frontend dev server exited with an error.' }
}
finally {
    Pop-Location
}
