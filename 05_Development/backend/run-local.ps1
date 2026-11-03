# ============================================================================
# run-local.ps1 - HSWRMS local development launcher (Windows PowerShell 5.1)
#
# Starts the Spring Boot backend locally using:
#   - Spring profiles: local,smtp  (local => H2 in-memory DB; mail is env-driven)
#   - MAIL_USERNAME / MAIL_PASSWORD from the environment (Gmail SMTP app creds)
#   - JWT_SECRET auto-generated temporarily if absent or too weak (>= 32 bytes)
#
# Credentials are never printed. The original environment variables are
# restored when the backend exits. The Maven exit code is propagated back
# to the caller.
# ============================================================================
$ErrorActionPreference = 'Stop'

$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
$mvn  = Join-Path $here 'mvnw.cmd'

if (-not (Test-Path -LiteralPath $mvn)) {
    Write-Host "mvnw.cmd not found next to this script: $mvn" -ForegroundColor Red
    exit 1
}

# --- 1. Validate Gmail credential presence only (never print values) --------
$hasUser = -not [string]::IsNullOrWhiteSpace($env:MAIL_USERNAME)
$hasPass = -not [string]::IsNullOrWhiteSpace($env:MAIL_PASSWORD)
Write-Host ("MAIL_USERNAME present: {0}; MAIL_PASSWORD present: {1}" -f $hasUser, $hasPass)
if (-not ($hasUser -and $hasPass)) {
    Write-Host "Both MAIL_USERNAME and MAIL_PASSWORD must be set in the environment before starting." -ForegroundColor Red
    Write-Host 'Example (run once, then reopen the terminal): setx MAIL_USERNAME "you@gmail.com" ; setx MAIL_PASSWORD "<gmail-app-password>"' -ForegroundColor Yellow
    exit 1
}

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
    Write-Host "Backend exited. Restored original JWT_SECRET / SPRING_PROFILES_ACTIVE." -ForegroundColor Cyan
}

# --- 5. Propagate the actual Maven exit code --------------------------------
exit $exitCode
