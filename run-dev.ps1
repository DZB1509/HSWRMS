# ============================================================================
# run-dev.ps1 - HSWRMS Full Development Environment Launcher (Windows PowerShell)
#
# Standardized launcher for HSWRMS:
#   - Backend: Spring Boot, Java 17, profile 'dev', SQL Server HSWRMS (port 8080)
#   - Frontend: React + TypeScript + Vite (port 5173)
#   - External credentials loaded securely from hswrms_local_credentials.env
#
# Usage (from repository root):
#   .\run-dev.ps1                    # Starts both Backend (new window) & Frontend (current window)
#   .\run-dev.ps1 -Component Backend # Starts only Backend in current window
#   .\run-dev.ps1 -Component Frontend # Starts only Frontend in current window
# ============================================================================
[CmdletBinding()]
param(
    [ValidateSet('All', 'Backend', 'Frontend')]
    [string]$Component = 'All',

    [string]$CredentialsPath = "",

    [switch]$StrictPort
)

$ErrorActionPreference = 'Stop'

$scriptPath = $PSScriptRoot
if (-not $scriptPath -and $MyInvocation.MyCommand.Path) {
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if (-not $scriptPath -and $MyInvocation.MyCommand.Definition) {
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
}
if (-not $scriptPath) {
    $scriptPath = (Get-Item .).FullName
}
$root            = (Resolve-Path $scriptPath).Path
$backendDir      = Join-Path $root '05_Development\backend'
$backendLauncher = Join-Path $backendDir 'run-dev.ps1'
$frontendDir     = Join-Path $root '05_Development\frontend'
$packageJson     = Join-Path $frontendDir 'package.json'
$nodeModules     = Join-Path $frontendDir 'node_modules'
$logsDir         = Join-Path $root 'logs'
$backendPidFile  = Join-Path $logsDir 'hswrms-backend.session.json'
$frontendPidFile = Join-Path $logsDir 'hswrms-frontend.session.json'
$rootPidFile     = Join-Path $logsDir 'hswrms-dev-session.json'

function Write-Info([string]$msg) {
    Write-Host "[INFO] $msg" -ForegroundColor Cyan
}

function Write-Success([string]$msg) {
    Write-Host "[SUCCESS] $msg" -ForegroundColor Green
}

function Write-Warn([string]$msg) {
    Write-Host "[WARN] $msg" -ForegroundColor Yellow
}

function Write-Err([string]$msg) {
    Write-Host "[ERROR] $msg" -ForegroundColor Red
}

function Fail([string]$msg) {
    Write-Err $msg
    exit 1
}

# Run tool and capture output safely
function Get-ToolOutput([string]$exe, [string[]]$argList) {
    $cmd = Get-Command $exe -ErrorAction SilentlyContinue
    if (-not $cmd) { return $null }
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { return ((& $exe @argList 2>&1) | Out-String) }
    finally { $ErrorActionPreference = $prev }
}

# Inspect listener on a port
function Get-PortListener([int]$Port) {
    try {
        $conn = Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $Port -and $_.OwningProcess -gt 4 } | Select-Object -First 1
        if ($conn) {
            $procId = $conn.OwningProcess
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            $cmdLine = "N/A"
            try {
                $wmi = Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction SilentlyContinue
                if ($wmi -and $wmi.CommandLine) { $cmdLine = $wmi.CommandLine }
            } catch {}

            return [PSCustomObject]@{
                Port        = $Port
                ProcessId   = $procId
                ProcessName = if ($proc) { $proc.ProcessName } else { "Unknown" }
                CommandLine = $cmdLine
            }
        }
    } catch {}
    return $null
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " HSWRMS Standardized Development Launcher (Profile: dev, SQL Server)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# --- 1. Verify Prerequisites ---
if ($Component -in @('All', 'Backend')) {
    if (-not (Test-Path -LiteralPath $backendLauncher)) {
        Fail "Backend launcher script not found: $backendLauncher"
    }

    $javaOut = Get-ToolOutput 'java' @('-version')
    if ([string]::IsNullOrWhiteSpace($javaOut)) {
        Fail 'Java 17 not found. Install JDK 17 and ensure "java" is on PATH.'
    }
    if ($javaOut -notmatch 'version"?\s*"?17') {
        Fail "Java 17 was not detected. The backend requires Java 17. Detected runtime:`n$javaOut"
    } else {
        Write-Info "Java 17 runtime verified."
    }
}

if ($Component -in @('All', 'Frontend')) {
    if (-not (Test-Path -LiteralPath $packageJson)) {
        Fail "Frontend package.json not found: $packageJson"
    }

    $nodeOut = Get-ToolOutput 'node' @('--version')
    if ([string]::IsNullOrWhiteSpace($nodeOut)) {
        Fail 'Node.js not found. Install Node.js (LTS) and ensure "node" is on PATH.'
    }
    $npmOut = Get-ToolOutput 'npm' @('--version')
    if ([string]::IsNullOrWhiteSpace($npmOut)) {
        Fail 'npm not found. Reinstall Node.js.'
    }
    Write-Info ("Node {0}; npm {1} verified." -f $nodeOut.Trim(), $npmOut.Trim())
}

# --- 2. Port Pre-flight Checks ---
$port8080Listener = $null
$port5173Listener = $null

if ($Component -in @('All', 'Backend')) {
    $port8080Listener = Get-PortListener 8080
    if ($port8080Listener) {
        Write-Err "Port 8080 is already in use!"
        Write-Host "  PID         : $($port8080Listener.ProcessId)" -ForegroundColor Yellow
        Write-Host "  Process Name: $($port8080Listener.ProcessName)" -ForegroundColor Yellow
        Write-Host "  Command Line: $($port8080Listener.CommandLine)" -ForegroundColor Yellow
        Write-Host "`nLauncher will NOT terminate existing processes automatically." -ForegroundColor Yellow
        Write-Host "To shut down previous HSWRMS instances safely, run .\stop-dev.ps1." -ForegroundColor Yellow
        exit 1
    }
    Write-Success "Port 8080 is available for Backend."
}

if ($Component -in @('All', 'Frontend')) {
    $port5173Listener = Get-PortListener 5173
    if ($port5173Listener) {
        Write-Warn "Port 5173 is already in use by PID $($port5173Listener.ProcessId) ($($port5173Listener.ProcessName))."
        Write-Host "  Command Line: $($port5173Listener.CommandLine)" -ForegroundColor DarkGray
        if ($StrictPort) {
            Fail "StrictPort requested: refusing to start frontend because 5173 is occupied."
        } else {
            Write-Warn "Vite will attempt to bind to the next available port (e.g. http://localhost:5174)."
            Write-Warn "To stop the existing frontend instance on 5173, run .\stop-dev.ps1 -Component Frontend."
        }
    } else {
        Write-Success "Port 5173 is available for Frontend."
    }
}

# --- 3. Execution ---
if (-not (Test-Path -LiteralPath $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

if ($Component -eq 'Backend') {
    # Run backend directly in current window
    Write-Info "Starting Backend in current window..."
    & $backendLauncher -CredentialsPath $CredentialsPath
    exit $LASTEXITCODE
}

if ($Component -eq 'Frontend') {
    # Run frontend directly in current window with session tracking
    Push-Location $frontendDir
    $fwJob = $null
    try {
        if (-not (Test-Path -LiteralPath $nodeModules)) {
            Write-Info "Installing frontend dependencies (npm ci)..."
            & npm ci
            if ($LASTEXITCODE -ne 0) { Fail "npm ci failed." }
        }
        Write-Info "Starting Vite dev server in current window..."

        $curr = [System.Diagnostics.Process]::GetCurrentProcess()
        $fwJob = Start-Job -ScriptBlock {
            param($fPidFile, $launcherProcId, $pStartTime)
            $startTime = Get-Date
            while ((Get-Date) - $startTime -lt [TimeSpan]::FromMinutes(2)) {
                Start-Sleep -Seconds 1
                for ($p = 5173; $p -le 5185; $p++) {
                    try {
                        $conn = Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $p -and $_.OwningProcess -gt 4 } | Select-Object -First 1
                        if ($conn) {
                            $nPid = $conn.OwningProcess
                            $nProc = Get-Process -Id $nPid -ErrorAction SilentlyContinue
                            if ($nProc -and $nProc.ProcessName -eq 'node') {
                                $cmd = "N/A"
                                try {
                                    $wmi = Get-CimInstance Win32_Process -Filter "ProcessId = $nPid" -ErrorAction SilentlyContinue
                                    if ($wmi -and $wmi.CommandLine) { $cmd = $wmi.CommandLine }
                                } catch {}
                                if ($cmd -match 'vite' -or $cmd -match 'frontend') {
                                    $obj = [PSCustomObject]@{
                                        Component            = "Frontend"
                                        LauncherPid          = $launcherProcId
                                        LauncherCreationTime = $pStartTime
                                        ProcessPid           = $nPid
                                        ProcessCreationTime  = $nProc.StartTime.ToString("o")
                                        CommandLine          = $cmd
                                        Port                 = $p
                                        Profile              = "dev"
                                        StartTime            = (Get-Date).ToString("o")
                                        VitePid              = $nPid
                                        CreationTime         = $nProc.StartTime.ToString("o")
                                    }
                                    $obj | ConvertTo-Json | Set-Content -LiteralPath $fPidFile -Encoding UTF8
                                    return
                                }
                            }
                        }
                    } catch {}
                }
            }
        } -ArgumentList $frontendPidFile, $curr.Id, $curr.StartTime.ToString("o")

        & cmd.exe /c "npm run dev"
        exit $LASTEXITCODE
    } finally {
        Pop-Location
        if ($fwJob) {
            Stop-Job $fwJob -ErrorAction SilentlyContinue
            Remove-Job $fwJob -ErrorAction SilentlyContinue
        }
        if (Test-Path -LiteralPath $frontendPidFile) {
            try {
                $fObj = Get-Content -LiteralPath $frontendPidFile -Raw -Encoding UTF8 | ConvertFrom-Json
                $fPid = if ($fObj.ProcessPid) { $fObj.ProcessPid } else { $fObj.VitePid }
                if ($fPid) {
                    $fp = Get-Process -Id $fPid -ErrorAction SilentlyContinue
                    if (-not $fp -or $fp.HasExited) {
                        Remove-Item -LiteralPath $frontendPidFile -Force -ErrorAction SilentlyContinue
                    }
                }
            } catch {
                Remove-Item -LiteralPath $frontendPidFile -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# Component -eq 'All': Start Backend in separate window, verify readiness, then start Frontend and verify readiness
$backendArgs = @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', ('"{0}"' -f $backendLauncher))
if ($CredentialsPath) {
    $backendArgs += @('-CredentialsPath', ('"{0}"' -f $CredentialsPath))
}

Write-Info "Starting Backend in separate PowerShell window..."
$backendProcess = $null
try {
    $backendProcess = Start-Process -FilePath 'powershell.exe' -ArgumentList $backendArgs -WorkingDirectory $backendDir -PassThru
} catch {
    Fail "Could not launch backend window: $($_.Exception.Message)"
}

Write-Info "Waiting for Backend to become ready on http://localhost:8080/api/v1/health (Window PID: $($backendProcess.Id))..."
$backendReady = $false
$swB = [System.Diagnostics.Stopwatch]::StartNew()
while ($swB.Elapsed.TotalSeconds -lt 90) {
    if ($backendProcess.HasExited) {
        Fail "Backend launcher window exited prematurely with code $($backendProcess.ExitCode). Check backend logs for errors."
    }
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($resp -and $resp.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    } catch {}
    Start-Sleep -Milliseconds 1000
}

if (-not $backendReady) {
    Write-Err "Backend failed to become ready within 90 seconds."
    Write-Warn "To safely stop any running backend processes, run: .\stop-dev.ps1 -Component Backend"
    exit 1
}
Write-Success "Backend is healthy and listening on port 8080."

# Prepare frontend dependencies
Push-Location $frontendDir
try {
    if (-not (Test-Path -LiteralPath $nodeModules)) {
        Write-Info "node_modules missing - running npm ci..."
        & npm ci
        if ($LASTEXITCODE -ne 0) {
            Write-Err "npm ci failed."
            Write-Warn "Backend is currently running on port 8080 (Window PID: $($backendProcess.Id))."
            Write-Host "To safely stop the running Backend, run: .\stop-dev.ps1 -Component Backend" -ForegroundColor Yellow
            exit 1
        }
    }
} finally {
    Pop-Location
}

# Launch frontend in separate window
$frontendScript = @"
Set-Location '$frontendDir'
`$host.UI.RawUI.WindowTitle = 'HSWRMS Frontend (Vite)'
Write-Host '[INFO] Starting Vite dev server...' -ForegroundColor Cyan
& cmd.exe /c "npm run dev"
"@
$frontendScriptFile = Join-Path $logsDir 'launch-frontend.ps1'
Set-Content -LiteralPath $frontendScriptFile -Value $frontendScript -Encoding UTF8

$frontendArgs = @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', ('"{0}"' -f $frontendScriptFile))
Write-Info "Starting Frontend dev server in separate PowerShell window..."
$frontendProcess = $null
try {
    $frontendProcess = Start-Process -FilePath 'powershell.exe' -ArgumentList $frontendArgs -WorkingDirectory $frontendDir -PassThru
} catch {
    Write-Err "Could not launch frontend window: $($_.Exception.Message)"
    Write-Warn "Backend is currently running on port 8080 (Window PID: $($backendProcess.Id))."
    Write-Host "To safely stop the running Backend, run: .\stop-dev.ps1 -Component Backend" -ForegroundColor Yellow
    exit 1
}

Write-Info "Waiting for Frontend dev server to become ready (Window PID: $($frontendProcess.Id))..."
$frontendReady = $false
$detectedPort = $null
$detectedNodePid = $null
$detectedNodeCmdLine = ""
$detectedNodeStartTime = ""
$swF = [System.Diagnostics.Stopwatch]::StartNew()

while ($swF.Elapsed.TotalSeconds -lt 30) {
    if ($frontendProcess.HasExited) {
        break
    }
    # Probe ports 5173 to 5185
    for ($p = 5173; $p -le 5185; $p++) {
        try {
            $conn = Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $p -and $_.OwningProcess -gt 4 } | Select-Object -First 1
            if ($conn) {
                $candidatePid = $conn.OwningProcess
                $pProc = Get-Process -Id $candidatePid -ErrorAction SilentlyContinue
                $pCmd = "N/A"
                try {
                    $wmi = Get-CimInstance Win32_Process -Filter "ProcessId = $candidatePid" -ErrorAction SilentlyContinue
                    if ($wmi -and $wmi.CommandLine) { $pCmd = $wmi.CommandLine }
                } catch {}

                # Check if process is Node running Vite or in frontendDir
                $isVite = ($pProc.ProcessName -eq 'node') -and ($pCmd -match 'vite' -or $pCmd -match 'frontend')
                if ($isVite) {
                    # Verify HTTP response from Vite
                    try {
                        $resp = Invoke-WebRequest -Uri "http://localhost:$p" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
                        if ($resp -and $resp.StatusCode -eq 200) {
                            $frontendReady = $true
                            $detectedPort = $p
                            $detectedNodePid = $candidatePid
                            $detectedNodeCmdLine = $pCmd
                            $detectedNodeStartTime = $pProc.StartTime.ToString("o")
                            break
                        }
                    } catch {}
                }
            }
        } catch {}
    }
    if ($frontendReady) { break }
    Start-Sleep -Milliseconds 500
}

if (-not $frontendReady) {
    Write-Err "Frontend failed to start or become ready within 30 seconds."
    Write-Warn "Backend is currently running on port 8080 (Window PID: $($backendProcess.Id))."
    Write-Host "To safely stop the running Backend, run: .\stop-dev.ps1 -Component Backend" -ForegroundColor Yellow
    exit 1
}

Write-Success "Frontend is ready and listening on port $detectedPort."

# Write frontend session file
$frontendSession = [PSCustomObject]@{
    Component            = "Frontend"
    LauncherPid          = $frontendProcess.Id
    LauncherCreationTime = $frontendProcess.StartTime.ToString("o")
    ProcessPid           = $detectedNodePid
    ProcessCreationTime  = $detectedNodeStartTime
    CommandLine          = $detectedNodeCmdLine
    Port                 = $detectedPort
    Profile              = "dev"
    StartTime            = (Get-Date).ToString("o")
    VitePid              = $detectedNodePid
    CreationTime         = $detectedNodeStartTime
}
$frontendSession | ConvertTo-Json | Set-Content -LiteralPath $frontendPidFile -Encoding UTF8

# Update root session file
$rootSessionData = [PSCustomObject]@{
    Component          = "All"
    StartTime          = (Get-Date).ToString("o")
    BackendWindowPid   = $backendProcess.Id
    BackendPort        = 8080
    FrontendWindowPid  = $frontendProcess.Id
    FrontendPort       = $detectedPort
}
$rootSessionData | ConvertTo-Json | Set-Content -LiteralPath $rootPidFile -Encoding UTF8

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] HSWRMS Development Environment Ready" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  Backend API : http://localhost:8080/api/v1   (Health: http://localhost:8080/api/v1/health)" -ForegroundColor Green
Write-Host "  Frontend    : http://localhost:$detectedPort" -ForegroundColor Green
Write-Host "  Database    : Microsoft SQL Server (HSWRMS) via least-privilege hswrms_app_user" -ForegroundColor Green
Write-Host "  Stop        : Run .\stop-dev.ps1 to stop all services cleanly" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

