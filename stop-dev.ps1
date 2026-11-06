# ============================================================================
# stop-dev.ps1 - Safe HSWRMS Development Shutdown Script (Windows PowerShell)
#
# Safely stops HSWRMS Backend and/or Frontend processes:
#   - Verifies process identity, creation timestamp, and command line before termination
#   - Protects against OS PID reuse mistakes
#   - CRITICAL SAFEGUARD: Never terminates Antigravity, LanguageServer, Gemini, VS Code, or system processes
#   - Never kills all Java or Node processes blindly
#   - Graceful shutdown first; force termination only when explicitly requested (-Force)
#   - Retains tracking records if shutdown fails; deletes only after verified exit
#
# Usage (from repository root):
#   .\stop-dev.ps1                     # Stops both Backend and Frontend
#   .\stop-dev.ps1 -Component Backend  # Stops only Backend
#   .\stop-dev.ps1 -Component Frontend # Stops only Frontend
#   .\stop-dev.ps1 -Force              # Force-stops if graceful close times out
# ============================================================================
[CmdletBinding()]
param(
    [ValidateSet('All', 'Backend', 'Frontend')]
    [string]$Component = 'All',

    [switch]$Force
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
$logsDir         = Join-Path $root 'logs'
$backendPidFile  = Join-Path $logsDir 'hswrms-backend.session.json'
$frontendPidFile = Join-Path $logsDir 'hswrms-frontend.session.json'
$rootPidFile     = Join-Path $logsDir 'hswrms-dev-session.json'

$stoppedList        = [System.Collections.Generic.List[PSCustomObject]]::new()
$alreadyStoppedList = [System.Collections.Generic.List[PSCustomObject]]::new()
$skippedList        = [System.Collections.Generic.List[PSCustomObject]]::new()

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

function Get-ProcessDetails([int]$procId) {
    if ($procId -le 4) { return $null }
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if (-not $proc) { return $null }

    $cmdLine = "N/A"
    try {
        $wmi = Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction SilentlyContinue
        if ($wmi -and $wmi.CommandLine) { $cmdLine = $wmi.CommandLine }
    } catch {}

    $startTime = ""
    try {
        $startTime = $proc.StartTime.ToString("o")
    } catch {}

    return [PSCustomObject]@{
        ProcessId    = $procId
        ProcessName  = $proc.ProcessName
        CommandLine  = $cmdLine
        StartTime    = $startTime
        HasExited    = $proc.HasExited
    }
}

function Test-ProcessSafeToStop([PSCustomObject]$ProcInfo, [string]$ExpectedContext, [string]$ExpectedStartTime) {
    if (-not $ProcInfo) { return $false }

    $procId = $ProcInfo.ProcessId
    $name = $ProcInfo.ProcessName
    $cmdLine = $ProcInfo.CommandLine

    # 1. Critical Safeguard: NEVER kill protected development environment or system processes
    $protectedPatterns = @('antigravity', 'gemini', 'languageserver', 'code\.exe', 'svchost\.exe', 'explorer\.exe', 'csrss\.exe', 'services\.exe', 'lsass\.exe')
    foreach ($pat in $protectedPatterns) {
        if ($cmdLine -match $pat -or $name -match $pat) {
            Write-Err "PID $procId ($name) is a protected system/IDE process matching '$pat'. TERMINATION REFUSED."
            return $false
        }
    }

    # 2. Check for PID reuse if recorded StartTime is available
    if (-not [string]::IsNullOrWhiteSpace($ExpectedStartTime) -and -not [string]::IsNullOrWhiteSpace($ProcInfo.StartTime)) {
        try {
            $t1 = [DateTimeOffset]::Parse($ExpectedStartTime)
            $t2 = [DateTimeOffset]::Parse($ProcInfo.StartTime)
            $diff = [Math]::Abs(($t1 - $t2).TotalSeconds)
            if ($diff -gt 2) {
                Write-Warn "PID $procId creation time mismatch (Expected: $ExpectedStartTime, Current: $($ProcInfo.StartTime), diff: $diff s)."
                Write-Warn "OS reused this PID for an unrelated process. TERMINATION REFUSED to prevent collateral damage."
                return $false
            }
        } catch {
            if ($ProcInfo.StartTime -ne $ExpectedStartTime) {
                Write-Warn "PID $procId creation time mismatch string compare failed. TERMINATION REFUSED."
                return $false
            }
        }
    }

    # 3. Positive Verification: Process must demonstrably belong to HSWRMS
    if ($ExpectedContext -eq 'Backend' -or $ExpectedContext -eq 'JavaBackend') {
        $isJavaBackend = ($name -in @('java', 'javaw') -and ($cmdLine -match 'hswrms' -or $cmdLine -match 'spring-boot' -or $cmdLine -match 'HswrmsApplication')) -or
                         ($name -eq 'cmd' -and $cmdLine -match 'mvnw')
        if ($isJavaBackend) {
            return $true
        }
    } elseif ($ExpectedContext -eq 'BackendWindow') {
        if ($name -match 'powershell' -and $cmdLine -match 'run-dev\.ps1') {
            return $true
        }
    } elseif ($ExpectedContext -eq 'Frontend') {
        $isFrontend = ($name -eq 'node') -and ($cmdLine -match 'vite' -or $cmdLine -match '05_Development.*frontend')
        if ($isFrontend) {
            return $true
        }
    } elseif ($ExpectedContext -eq 'FrontendWindow') {
        if ($name -match 'powershell' -and ($cmdLine -match 'launch-frontend\.ps1' -or $cmdLine -match 'npm run dev')) {
            return $true
        }
    }

    return $false
}

function Stop-SafeProcess([int]$procId, [string]$ExpectedContext, [string]$ExpectedStartTime = "", [string]$Reason = "") {
    $info = Get-ProcessDetails $procId
    if (-not $info) {
        $script:alreadyStoppedList.Add([PSCustomObject]@{
            Component = $ExpectedContext
            Pid       = $procId
            Name      = "N/A"
            Reason    = "Process already exited or does not exist"
        })
        Write-Info "Process PID $procId is already stopped or does not exist."
        return $true
    }

    if (-not (Test-ProcessSafeToStop $info $ExpectedContext $ExpectedStartTime)) {
        $script:skippedList.Add([PSCustomObject]@{
            Component = $ExpectedContext
            Pid       = $procId
            Name      = $info.ProcessName
            Reason    = "Process identity could not be verified as HSWRMS $ExpectedContext; left untouched"
        })
        Write-Warn "Process PID $procId ($($info.ProcessName)) could not be verified as HSWRMS $ExpectedContext."
        Write-Host "  Command Line: $($info.CommandLine)" -ForegroundColor DarkGray
        return $false
    }

    Write-Info "Requesting graceful stop for $ExpectedContext process (PID: $procId, Name: $($info.ProcessName))..."
    try {
        Stop-Process -Id $procId -ErrorAction SilentlyContinue
        # Poll up to 5 seconds for verified process exit
        $exited = $false
        for ($i = 0; $i -lt 10; $i++) {
            Start-Sleep -Milliseconds 500
            $check = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if (-not $check -or $check.HasExited) {
                $exited = $true
                break
            }
        }

        if (-not $exited) {
            if ($Force) {
                Write-Warn "Process did not exit gracefully within timeout. Force stopping PID $procId (-Force)..."
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Start-Sleep -Milliseconds 500
                $check = Get-Process -Id $procId -ErrorAction SilentlyContinue
                $exited = (-not $check -or $check.HasExited)
            } else {
                Write-Warn "Process PID $procId did not exit gracefully. Re-run with -Force if you wish to force termination."
                $script:skippedList.Add([PSCustomObject]@{
                    Component = $ExpectedContext
                    Pid       = $procId
                    Name      = $info.ProcessName
                    Reason    = "Process did not exit gracefully; re-run with -Force"
                })
                return $false
            }
        }

        if ($exited) {
            $script:stoppedList.Add([PSCustomObject]@{
                Component = $ExpectedContext
                Pid       = $procId
                Name      = $info.ProcessName
                Reason    = if ($Reason) { $Reason } else { "Verified process exit" }
            })
            Write-Success "Verified process exit: $ExpectedContext (PID: $procId)."
            return $true
        } else {
            $script:skippedList.Add([PSCustomObject]@{
                Component = $ExpectedContext
                Pid       = $procId
                Name      = $info.ProcessName
                Reason    = "Process is still active after force attempt"
            })
            Write-Err "Process PID $procId is still active after force attempt."
            return $false
        }
    } catch {
        $script:skippedList.Add([PSCustomObject]@{
            Component = $ExpectedContext
            Pid       = $procId
            Name      = $info.ProcessName
            Reason    = "Error stopping process: $($_.Exception.Message)"
        })
        Write-Err "Error stopping PID $($procId): $($_.Exception.Message)"
        return $false
    }
}

function Stop-PortService([int]$Port, [string]$ContextName) {
    try {
        $ownerPid = $null
        $conn = Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $Port -and $_.OwningProcess -gt 4 } | Select-Object -First 1
        if ($conn) {
            $ownerPid = $conn.OwningProcess
        } else {
            $ns = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING" | Select-Object -First 1
            if ($ns -and $ns.Line -match '\s+(\d+)\s*$') {
                $ownerPid = [int]$matches[1]
            }
        }
        if ($ownerPid -and $ownerPid -gt 4) {
            $info = Get-ProcessDetails $ownerPid
            if (-not $info) { return $true }
            if (Test-ProcessSafeToStop $info $ContextName "") {
                Write-Info "Port $Port is occupied by verified HSWRMS process (PID $ownerPid, $($info.ProcessName)). Stopping..."
                return (Stop-SafeProcess $ownerPid $ContextName "" "Port $Port listener verified as HSWRMS")
            } else {
                Write-Warn "Port $Port is occupied by PID $ownerPid ($($info.ProcessName)), but process ownership for HSWRMS $ContextName could NOT be established."
                Write-Host "  Command Line: $($info.CommandLine)" -ForegroundColor DarkGray
                Write-Host "  Process left untouched to prevent terminating unrelated services." -ForegroundColor Yellow
                $script:skippedList.Add([PSCustomObject]@{
                    Component = "$ContextName (Port $Port)"
                    Pid       = $ownerPid
                    Name      = $info.ProcessName
                    Reason    = "Unverified process on port $Port left untouched"
                })
                return $false
            }
        } else {
            Write-Info "Port $Port is free."
            return $true
        }
    } catch {
        Write-Warn "Error inspecting port $Port`: $($_.Exception.Message)"
        return $true
    }
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " HSWRMS Safe Development Shutdown Tool" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# --- 1. Stop Backend ---
if ($Component -in @('All', 'Backend')) {
    Write-Info "--- Shutting down Backend (Port 8080) ---"
    $backendClean = $true

    # A. Stop tracked Java backend process from backend.session.json
    if (Test-Path -LiteralPath $backendPidFile) {
        try {
            $bData = Get-Content -LiteralPath $backendPidFile -Raw -Encoding UTF8 | ConvertFrom-Json
            $jPid = if ($bData.ProcessPid) { $bData.ProcessPid } elseif ($bData.JavaPid) { $bData.JavaPid } else { $null }
            if ($jPid) {
                $jStartTime = if ($bData.ProcessCreationTime) { $bData.ProcessCreationTime } elseif ($bData.JavaStartTime) { $bData.JavaStartTime } else { "" }
                $res = Stop-SafeProcess $jPid "JavaBackend" $jStartTime "Tracked backend process from session"
                if (-not $res) { $backendClean = $false }
            }
            if ($bData.LauncherPid) {
                $lStartTime = if ($bData.LauncherCreationTime) { $bData.LauncherCreationTime } elseif ($bData.CreationTime) { $bData.CreationTime } else { "" }
                $res2 = Stop-SafeProcess $bData.LauncherPid "BackendWindow" $lStartTime "Tracked backend launcher from session"
                if (-not $res2) { $backendClean = $false }
            }
        } catch {
            Write-Warn "Could not parse backend session file: $($_.Exception.Message)"
        }
    }

    # B. Stop tracked root backend window if present
    if (Test-Path -LiteralPath $rootPidFile) {
        try {
            $rData = Get-Content -LiteralPath $rootPidFile -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($rData.BackendWindowPid -and (-not $bData -or $rData.BackendWindowPid -ne $bData.LauncherPid)) {
                $res3 = Stop-SafeProcess $rData.BackendWindowPid "BackendWindow" "" "Tracked backend window process"
                if (-not $res3) { $backendClean = $false }
            }
        } catch {}
    }

    # C. Port 8080 verification & fallback check
    $resPort = Stop-PortService 8080 "Backend"
    if (-not $resPort) { $backendClean = $false }

    # Only delete backend tracking record if verified clean
    if ($backendClean -and (Test-Path -LiteralPath $backendPidFile)) {
        Remove-Item -LiteralPath $backendPidFile -Force -ErrorAction SilentlyContinue
    } elseif (-not $backendClean) {
        Write-Warn "Backend process may still be active. Session tracking file retained: $backendPidFile"
    }
}

# --- 2. Stop Frontend ---
if ($Component -in @('All', 'Frontend')) {
    $detectedVitePort = 5173
    if (Test-Path -LiteralPath $frontendPidFile) {
        try {
            $fData = Get-Content -LiteralPath $frontendPidFile -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($fData.Port) { $detectedVitePort = [int]$fData.Port }
        } catch {}
    } elseif (Test-Path -LiteralPath $rootPidFile) {
        try {
            $rData = Get-Content -LiteralPath $rootPidFile -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($rData.FrontendPort) { $detectedVitePort = [int]$rData.FrontendPort }
        } catch {}
    }

    Write-Info "--- Shutting down Frontend (Port $detectedVitePort) ---"
    $frontendClean = $true

    if (Test-Path -LiteralPath $frontendPidFile) {
        try {
            $fData = Get-Content -LiteralPath $frontendPidFile -Raw -Encoding UTF8 | ConvertFrom-Json
            $nodePid = if ($fData.ProcessPid) { $fData.ProcessPid } elseif ($fData.VitePid) { $fData.VitePid } elseif ($fData.NodePid) { $fData.NodePid } else { $null }
            if ($nodePid) {
                $vStartTime = if ($fData.ProcessCreationTime) { $fData.ProcessCreationTime } elseif ($fData.CreationTime) { $fData.CreationTime } elseif ($fData.NodeStartTime) { $fData.NodeStartTime } else { "" }
                $resF = Stop-SafeProcess $nodePid "Frontend" $vStartTime "Tracked Vite dev server from session"
                if (-not $resF) { $frontendClean = $false }
            }
            if ($fData.LauncherPid) {
                $lStartTime = if ($fData.LauncherCreationTime) { $fData.LauncherCreationTime } else { "" }
                $resL = Stop-SafeProcess $fData.LauncherPid "FrontendWindow" $lStartTime "Tracked frontend launcher from session"
                if (-not $resL) { $frontendClean = $false }
            }
        } catch {
            Write-Warn "Could not parse frontend session file: $($_.Exception.Message)"
        }
    }

    # Stop tracked root frontend window if present and not already stopped
    if (Test-Path -LiteralPath $rootPidFile) {
        try {
            $rData = Get-Content -LiteralPath $rootPidFile -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($rData.FrontendWindowPid -and (-not $fData -or $rData.FrontendWindowPid -ne $fData.LauncherPid)) {
                $resFW = Stop-SafeProcess $rData.FrontendWindowPid "FrontendWindow" "" "Tracked frontend window process"
                if (-not $resFW) { $frontendClean = $false }
            }
        } catch {}
    }

    $resPortF = Stop-PortService $detectedVitePort "Frontend"
    if (-not $resPortF) { $frontendClean = $false }

    if ($frontendClean -and (Test-Path -LiteralPath $frontendPidFile)) {
        Remove-Item -LiteralPath $frontendPidFile -Force -ErrorAction SilentlyContinue
    } elseif (-not $frontendClean) {
        Write-Warn "Frontend process may still be active. Session tracking file retained: $frontendPidFile"
    }
}

# --- 3. Clean Root Session File if All Clean ---
if ($Component -eq 'All') {
    $backendFileStillExists = Test-Path -LiteralPath $backendPidFile
    $frontendFileStillExists = Test-Path -LiteralPath $frontendPidFile
    if (-not $backendFileStillExists -and -not $frontendFileStillExists) {
        if (Test-Path -LiteralPath $rootPidFile) {
            Remove-Item -LiteralPath $rootPidFile -Force -ErrorAction SilentlyContinue
        }
        $launchFe = Join-Path $logsDir 'launch-frontend.ps1'
        if (Test-Path -LiteralPath $launchFe) {
            Remove-Item -LiteralPath $launchFe -Force -ErrorAction SilentlyContinue
        }
        Write-Success "All dev session files cleaned up."
    }
}

# --- 4. Formatted Summary Report ---
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " HSWRMS Development Environment Shutdown Summary" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

Write-Host "Stopped Processes:" -ForegroundColor Green
if ($stoppedList.Count -eq 0) {
    Write-Host "  (None)" -ForegroundColor DarkGray
} else {
    foreach ($item in $stoppedList) {
        Write-Host "  - [$($item.Component)] PID $($item.Pid) ($($item.Name)): $($item.Reason)" -ForegroundColor Green
    }
}

Write-Host "`nAlready Stopped:" -ForegroundColor Yellow
if ($alreadyStoppedList.Count -eq 0) {
    Write-Host "  (None)" -ForegroundColor DarkGray
} else {
    foreach ($item in $alreadyStoppedList) {
        Write-Host "  - [$($item.Component)] PID $($item.Pid): $($item.Reason)" -ForegroundColor Yellow
    }
}

Write-Host "`nSkipped / Untouched Processes:" -ForegroundColor Yellow
if ($skippedList.Count -eq 0) {
    Write-Host "  (None)" -ForegroundColor DarkGray
} else {
    foreach ($item in $skippedList) {
        Write-Host "  - [$($item.Component)] PID $($item.Pid) ($($item.Name)): $($item.Reason)" -ForegroundColor Yellow
    }
}
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Success "Shutdown verification complete."
