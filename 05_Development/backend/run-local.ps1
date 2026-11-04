# ============================================================================
# run-local.ps1 - HSWRMS local development launcher (Windows PowerShell 5.1)
#
# Starts the Spring Boot backend locally using:
#   - Spring profiles: local,smtp  (local => H2 in-memory DB; smtp => mail label)
#   - MAIL_USERNAME / MAIL_PASSWORD: process-scoped LOCAL-DEV defaults are
#     embedded below so teammates need no manual setx / .env. Any values the
#     user already provides in the environment are preserved (override wins).
#   - JWT_SECRET auto-generated temporarily if absent or too weak (>= 32 bytes)
#
# LOCAL DEVELOPMENT ONLY. Credentials are never printed. The original
# environment variables are restored when the backend exits. The Maven exit
# code is propagated back to the caller.
# ============================================================================
$ErrorActionPreference = 'Stop'

$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
$mvn  = Join-Path $here 'mvnw.cmd'

if (-not (Test-Path -LiteralPath $mvn)) {
    Write-Host "mvnw.cmd not found next to this script: $mvn" -ForegroundColor Red
    exit 1
}

# --- 1. Gmail SMTP defaults (LOCAL DEVELOPMENT ONLY; never printed) ---------
# Shared dev sender + Gmail app password provided as PROCESS-SCOPED defaults so
# teammates need no manual setx / .env. Values already present in the
# environment (user override) are preserved. Originals are restored on exit.
$devMailUser = 'nguyenviethung2261998@gmail.com'
$devMailPass = 'aeyziocoprdsanqo'

$originalMailUser = $env:MAIL_USERNAME
$originalMailPass = $env:MAIL_PASSWORD
$mailUserDefaulted = $false
$mailPassDefaulted = $false

if ([string]::IsNullOrWhiteSpace($env:MAIL_USERNAME)) {
    $env:MAIL_USERNAME = $devMailUser
    $mailUserDefaulted = $true
}
if ([string]::IsNullOrWhiteSpace($env:MAIL_PASSWORD)) {
    $env:MAIL_PASSWORD = $devMailPass
    $mailPassDefaulted = $true
}
Write-Host 'SMTP configured for local dev: sender set (hidden), app password set (hidden).'

# --- 2. Ensure a strong JWT_SECRET (>= 32 UTF-8 bytes); generate temp if weak
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

# --- 3. Activate the local,smtp profiles ------------------------------------
$originalProfiles = $env:SPRING_PROFILES_ACTIVE
$env:SPRING_PROFILES_ACTIVE = 'local,smtp'

# --- 4. Run the backend, then restore the original environment --------------
$exitCode = 0
Push-Location $here
try {
    Write-Host "Starting HSWRMS backend (profiles: local,smtp, H2 in-memory DB)..." -ForegroundColor Green
    & $mvn spring-boot:run '-Dspring-boot.run.profiles=local,smtp'
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
    if ($mailUserDefaulted) {
        if ([string]::IsNullOrEmpty($originalMailUser)) { Remove-Item Env:\MAIL_USERNAME -ErrorAction SilentlyContinue }
        else { $env:MAIL_USERNAME = $originalMailUser }
    }
    if ($mailPassDefaulted) {
        if ([string]::IsNullOrEmpty($originalMailPass)) { Remove-Item Env:\MAIL_PASSWORD -ErrorAction SilentlyContinue }
        else { $env:MAIL_PASSWORD = $originalMailPass }
    }
    Write-Host "Backend exited. Restored original MAIL_*/JWT_SECRET/SPRING_PROFILES_ACTIVE environment." -ForegroundColor Cyan
}

# --- 5. Propagate the actual Maven exit code --------------------------------
exit $exitCode
