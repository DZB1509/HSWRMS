# ============================================================================
# run-local.ps1 - HSWRMS local development launcher (Windows PowerShell 5.1 / 7)
#
# Starts the Spring Boot backend locally using:
#   - In-memory H2 database (profile: local)
#   - Optional real SMTP email delivery (profile: smtp) ONLY if external credentials
#     are configured via environment variables (MAIL_USERNAME / MAIL_PASSWORD).
#   - Zero hardcoded credentials. Never leaks secrets to logs or terminal.
# ============================================================================
[CmdletBinding()]
param(
    [switch]$RequireSmtp,
    [string]$CredentialsPath = ""
)

$ErrorActionPreference = 'Stop'

$here        = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Split-Path -Parent (Split-Path -Parent $here)
$mvn         = Join-Path $here 'mvnw.cmd'
$logsDir     = Join-Path $here 'logs'
$pidFile     = Join-Path $logsDir 'hswrms-backend-local.pid.json'

if (-not (Test-Path -LiteralPath $mvn)) {
    Write-Host "mvnw.cmd not found next to this script: $mvn" -ForegroundColor Red
    exit 1
}

# --- 1. Load external credentials if provided ---
if (-not [string]::IsNullOrWhiteSpace($CredentialsPath) -and (Test-Path -LiteralPath $CredentialsPath)) {
    Get-Content -LiteralPath $CredentialsPath -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
            $parts = $line.Split('=', 2)
            $k = $parts[0].Trim()
            $v = $parts[1].Trim()
            if ($k) {
                [System.Environment]::SetEnvironmentVariable($k, $v, 'Process')
            }
        }
    }
}

# Check for sibling external credentials if MAIL credentials not yet set
if ([string]::IsNullOrWhiteSpace($env:MAIL_USERNAME) -or [string]::IsNullOrWhiteSpace($env:MAIL_PASSWORD)) {
    $candidate = Join-Path (Split-Path $projectRoot -Parent) 'HSWRMS_DB_BACKUPS\hswrms_local_credentials.env'
    if (Test-Path -LiteralPath $candidate) {
        Get-Content -LiteralPath $candidate -Encoding UTF8 | ForEach-Object {
            $line = $_.Trim()
            if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
                $parts = $line.Split('=', 2)
                $k = $parts[0].Trim()
                $v = $parts[1].Trim()
                if ($k -in @('MAIL_USERNAME', 'MAIL_PASSWORD', 'MAIL_HOST', 'MAIL_PORT', 'MAIL_FROM')) {
                    [System.Environment]::SetEnvironmentVariable($k, $v, 'Process')
                }
            }
        }
    }
}

# --- 2. Determine SMTP Profile Activation ---
$smtpActive = $false
$originalMailUser = $env:MAIL_USERNAME
$originalMailPass = $env:MAIL_PASSWORD

if (-not [string]::IsNullOrWhiteSpace($env:MAIL_USERNAME) -and -not [string]::IsNullOrWhiteSpace($env:MAIL_PASSWORD)) {
    $smtpActive = $true
    Write-Host '[INFO] SMTP credentials detected in environment: real SMTP profile will be active.' -ForegroundColor Green
} else {
    if ($RequireSmtp) {
        Write-Host '[ERROR] Real SMTP requested (-RequireSmtp), but MAIL_USERNAME or MAIL_PASSWORD is not set in environment.' -ForegroundColor Red
        exit 1
    }
    Write-Host '[INFO] SMTP credentials not configured. Running without real SMTP.' -ForegroundColor Yellow
    Write-Host '[INFO] Email verification codes will be logged to console by DevEmailDeliveryAdapter.' -ForegroundColor Cyan
}

$activeProfiles = if ($smtpActive) { 'local,smtp' } else { 'local' }

# --- 3. Ensure a strong JWT_SECRET (>= 32 UTF-8 bytes); generate temp if weak ---
$originalJwt = $env:JWT_SECRET
$jwtGenerated = $false
$jwtLen = 0
if ($null -ne $env:JWT_SECRET) { $jwtLen = [System.Text.Encoding]::UTF8.GetByteCount($env:JWT_SECRET) }
if ($jwtLen -lt 32) {
    $bytes = New-Object 'byte[]' 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    $env:JWT_SECRET = [Convert]::ToBase64String($bytes)
    $jwtGenerated = $true
}
$jwtBytes = [System.Text.Encoding]::UTF8.GetByteCount($env:JWT_SECRET)
$jwtSource = if ($jwtGenerated) { 'temporary generated key' } else { 'from environment' }
Write-Host ("JWT_SECRET satisfied: {0} bytes ({1})" -f $jwtBytes, $jwtSource)

# --- 4. Record PID Tracking File ---
if (-not (Test-Path -LiteralPath $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

$currentProc = [System.Diagnostics.Process]::GetCurrentProcess()
$pidData = [PSCustomObject]@{
    Component    = "Backend-Local"
    LauncherPid  = $currentProc.Id
    CreationTime = $currentProc.StartTime.ToString("o")
    StartTime    = (Get-Date).ToString("o")
    Port         = 8080
    Profiles     = $activeProfiles
}
$pidData | ConvertTo-Json | Set-Content -LiteralPath $pidFile -Encoding UTF8

# --- 5. Activate profile and run ---
$originalProfiles = $env:SPRING_PROFILES_ACTIVE
$env:SPRING_PROFILES_ACTIVE = $activeProfiles

$exitCode = 0
Push-Location $here
try {
    Write-Host "Starting HSWRMS backend (profiles: $activeProfiles, H2 in-memory DB)..." -ForegroundColor Green
    & $mvn spring-boot:run "-Dspring-boot.run.profiles=$activeProfiles"
    $exitCode = $LASTEXITCODE
}
finally {
    Pop-Location
    if ($null -ne $originalJwt) {
        $env:JWT_SECRET = $originalJwt
    } else {
        Remove-Item Env:\JWT_SECRET -ErrorAction SilentlyContinue
    }
    if ($null -ne $originalProfiles) {
        $env:SPRING_PROFILES_ACTIVE = $originalProfiles
    } else {
        Remove-Item Env:\SPRING_PROFILES_ACTIVE -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $pidFile) {
        Remove-Item -LiteralPath $pidFile -ErrorAction SilentlyContinue
    }
    Write-Host "Backend exited. Restored original environment." -ForegroundColor Cyan
}

exit $exitCode
