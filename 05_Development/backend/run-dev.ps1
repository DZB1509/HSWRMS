# ============================================================================
# run-dev.ps1 - HSWRMS Backend Developer Launcher (Windows PowerShell 5.1 / 7)
#
# Starts Spring Boot Backend using:
#   - Profile: dev (Microsoft SQL Server HSWRMS database)
#   - User   : hswrms_app_user (Least privilege)
#   - Credentials loaded securely from external hswrms_local_credentials.env
#   - Port   : 8080 (pre-flight check prevents collisions)
#   - Lifecycle: Tracks actual Java process ID and start time for safe shutdown
#
# Usage (from backend dir or root):
#   .\run-dev.ps1 [-CredentialsPath <path>]
# ============================================================================
[CmdletBinding()]
param(
    [string]$CredentialsPath = ""
)

$ErrorActionPreference = 'Stop'

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$mvnw        = Join-Path $scriptDir 'mvnw.cmd'
$logsDir     = Join-Path $projectRoot 'logs'
$pidFile     = Join-Path $logsDir 'hswrms-backend.session.json'

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

# --- 1. Verify Maven Wrapper ---
if (-not (Test-Path -LiteralPath $mvnw)) {
    Fail "Maven wrapper not found: $mvnw"
}
$mvnwItem = Get-Item -LiteralPath $mvnw -ErrorAction SilentlyContinue
if (-not $mvnwItem -or $mvnwItem.Length -eq 0) {
    Fail "Maven wrapper is empty or unreadable: $mvnw"
}

# --- 2. Verify Java 17 ---
$javaCmd = Get-Command 'java' -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Fail 'Java 17 not found. Install JDK 17 and ensure "java" is on PATH.'
}
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $javaVerOut = (& java -version 2>&1 | Out-String)
} finally {
    $ErrorActionPreference = $prevEap
}
if ($javaVerOut -notmatch 'version"?\s*"?17') {
    Fail "Java 17 is required by HSWRMS backend. Detected runtime:`n$javaVerOut"
} else {
    Write-Info "Java 17 runtime verified."
}

# --- 3. Locate & Load External Credentials ---
$targetCredFile = $CredentialsPath
if ([string]::IsNullOrWhiteSpace($targetCredFile)) {
    $candidate = Join-Path (Split-Path $projectRoot -Parent) 'HSWRMS_DB_BACKUPS\hswrms_local_credentials.env'
    if (Test-Path -LiteralPath $candidate) {
        $targetCredFile = $candidate
    }
}

if ([string]::IsNullOrWhiteSpace($targetCredFile) -or -not (Test-Path -LiteralPath $targetCredFile)) {
    Fail "External credentials file not found. Expected at: $targetCredFile`nPlease supply via -CredentialsPath or restore HSWRMS_DB_BACKUPS\hswrms_local_credentials.env."
}

# Process-scoped credential loader (NEVER print secrets)
# Save original environment variables before loading credentials
$originalEnvVars = @{}
$envKeysToManage = @('HSWRMS_DB_URL', 'HSWRMS_DB_USERNAME', 'HSWRMS_DB_PASSWORD', 'DB_URL', 'DB_USERNAME', 'DB_PASSWORD', 'SPRING_PROFILES_ACTIVE')
foreach ($k in $envKeysToManage) {
    $originalEnvVars[$k] = [System.Environment]::GetEnvironmentVariable($k, 'Process')
}

$loadedCount = 0
Get-Content -LiteralPath $targetCredFile -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
        $parts = $line.Split('=', 2)
        $k = $parts[0].Trim()
        $v = $parts[1].Trim()
        if ($k) {
            if (-not $originalEnvVars.ContainsKey($k)) {
                $originalEnvVars[$k] = [System.Environment]::GetEnvironmentVariable($k, 'Process')
            }
            [System.Environment]::SetEnvironmentVariable($k, $v, 'Process')
            $loadedCount++
        }
    }
}

if ([string]::IsNullOrWhiteSpace($env:HSWRMS_DB_USERNAME) -or [string]::IsNullOrWhiteSpace($env:HSWRMS_DB_PASSWORD)) {
    Fail "Required database credentials (HSWRMS_DB_USERNAME, HSWRMS_DB_PASSWORD) missing from $targetCredFile."
}

Write-Success "Loaded credentials from external store ($targetCredFile)."
Write-Info "Database Target : SQL Server HSWRMS"
Write-Info "Database User   : $env:HSWRMS_DB_USERNAME (Password: [PROTECTED])"

if ($env:HSWRMS_DB_USERNAME -eq 'sa') {
    Write-Warn "Application user is 'sa'. Recommend using least-privilege 'hswrms_app_user' for development."
}

# --- 4. Pre-Flight Port 8080 Check ---
$port8080 = 8080
$portListener = $null
try {
    $conn = Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $port8080 -and $_.OwningProcess -gt 4 } | Select-Object -First 1
    if ($conn) {
        $ownerPid = $conn.OwningProcess
        $ownerProc = Get-Process -Id $ownerPid -ErrorAction SilentlyContinue
        $cmdLine = "N/A"
        try {
            $wmi = Get-CimInstance Win32_Process -Filter "ProcessId = $ownerPid" -ErrorAction SilentlyContinue
            if ($wmi -and $wmi.CommandLine) { $cmdLine = $wmi.CommandLine }
        } catch {}

        $portListener = [PSCustomObject]@{
            ProcessId   = $ownerPid
            ProcessName = if ($ownerProc) { $ownerProc.ProcessName } else { "Unknown" }
            CommandLine = $cmdLine
        }
    }
} catch {}

if ($portListener) {
    Write-Err "Port $port8080 is already occupied!"
    Write-Host "  PID         : $($portListener.ProcessId)" -ForegroundColor Yellow
    Write-Host "  Process Name: $($portListener.ProcessName)" -ForegroundColor Yellow
    Write-Host "  Command Line: $($portListener.CommandLine)" -ForegroundColor Yellow
    Write-Host "`nThe launcher will NOT terminate existing processes automatically." -ForegroundColor Yellow
    Write-Host "If this is a previous HSWRMS instance, run .\stop-dev.ps1 or close its window." -ForegroundColor Yellow
    exit 1
}

# --- 5. Prepare Process Tracking ---
if (-not (Test-Path -LiteralPath $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

$currentProc = [System.Diagnostics.Process]::GetCurrentProcess()
$startTimeIso = (Get-Date).ToString("o")
$launcherCreationIso = $currentProc.StartTime.ToString("o")

$initialPidData = [PSCustomObject]@{
    Component            = "Backend"
    LauncherPid          = $currentProc.Id
    LauncherCreationTime = $launcherCreationIso
    ProcessPid           = $null
    ProcessCreationTime  = $null
    CommandLine          = $null
    Port                 = $port8080
    Profile              = "dev"
    StartTime            = $startTimeIso
    JavaPid              = $null
    CreationTime         = $launcherCreationIso
}
$initialPidData | ConvertTo-Json | Set-Content -LiteralPath $pidFile -Encoding UTF8

# Background watcher to capture exact Java PID when port 8080 binds
$bgWatcher = Start-Job -ScriptBlock {
    param($WatchPidFile, $ParentPid)
    $startTime = Get-Date
    while ((Get-Date) - $startTime -lt [TimeSpan]::FromMinutes(5)) {
        Start-Sleep -Seconds 2
        try {
            $conn = Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 8080 -and $_.OwningProcess -gt 4 } | Select-Object -First 1
            if ($conn) {
                $jPid = $conn.OwningProcess
                $proc = Get-Process -Id $jPid -ErrorAction SilentlyContinue
                if ($proc) {
                    $cmd = "N/A"
                    try {
                        $wmi = Get-CimInstance Win32_Process -Filter "ProcessId = $jPid" -ErrorAction SilentlyContinue
                        if ($wmi -and $wmi.CommandLine) { $cmd = $wmi.CommandLine }
                    } catch {}

                    # Positive verification: Process must demonstrably be Java running HSWRMS / Spring Boot
                    $isJava = ($proc.ProcessName -eq 'java' -or $proc.ProcessName -eq 'javaw')
                    $isHswrms = ($cmd -match 'hswrms' -or $cmd -match 'spring-boot' -or $cmd -match 'HswrmsApplication')

                    if ($isJava -and $isHswrms) {
                        if (Test-Path -LiteralPath $WatchPidFile) {
                            $obj = Get-Content -LiteralPath $WatchPidFile -Raw -Encoding UTF8 | ConvertFrom-Json
                            $jStartTime = $proc.StartTime.ToString("o")
                            $obj.ProcessPid = $jPid
                            $obj.ProcessCreationTime = $jStartTime
                            $obj.CommandLine = $cmd
                            $obj.JavaPid = $jPid
                            $obj | Add-Member -NotePropertyName "JavaStartTime" -NotePropertyValue $jStartTime -Force
                            $obj | Add-Member -NotePropertyName "JavaCommandLine" -NotePropertyValue $cmd -Force
                            $obj | ConvertTo-Json | Set-Content -LiteralPath $WatchPidFile -Encoding UTF8
                        }
                        break
                    }
                }
            }
        } catch {}
    }
} -ArgumentList $pidFile, $currentProc.Id

Write-Info "Starting HSWRMS Backend with profile 'dev' on port 8080..."
Write-Info "Console output is attached below. Press Ctrl+C to terminate."
Write-Host "======================================================================" -ForegroundColor DarkGray

# --- 6. Launch Backend ---
$env:SPRING_PROFILES_ACTIVE = 'dev'
$exitCode = 0

Push-Location $scriptDir
try {
    & $mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"
    $exitCode = $LASTEXITCODE
}
finally {
    Pop-Location

    # Stop background watcher
    if ($bgWatcher) {
        Stop-Job $bgWatcher -ErrorAction SilentlyContinue
        Remove-Job $bgWatcher -ErrorAction SilentlyContinue
    }

    # Restore environment variables
    foreach ($k in $originalEnvVars.Keys) {
        $prevVal = $originalEnvVars[$k]
        [System.Environment]::SetEnvironmentVariable($k, $prevVal, 'Process')
    }

    # Verify process termination before removing PID tracking file
    if (Test-Path -LiteralPath $pidFile) {
        try {
            $rec = Get-Content -LiteralPath $pidFile -Raw -Encoding UTF8 | ConvertFrom-Json
            $stillRunning = $false
            $targetPid = if ($rec.ProcessPid) { $rec.ProcessPid } elseif ($rec.JavaPid) { $rec.JavaPid } else { $null }
            if ($targetPid) {
                $jp = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
                if ($jp -and -not $jp.HasExited) { $stillRunning = $true }
            }
            if (-not $stillRunning) {
                Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
            } else {
                Write-Warn "Java process (PID $targetPid) is still active. Session file preserved for stop-dev.ps1."
            }
        } catch {
            Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Info "Backend launcher exited with code $exitCode."
}

exit $exitCode
