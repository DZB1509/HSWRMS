<#
.SYNOPSIS
    HSWRMS Root Wrapper for Vietnamese M3 Spa Seed Script.
#>
[CmdletBinding()]
param(
    [string]$ServerInstance = "localhost",
    [string]$DatabaseName = "HSWRMS",
    [string]$Username = $env:HSWRMS_DB_USERNAME,
    [string]$Password = $env:HSWRMS_DB_PASSWORD,
    [string]$CredentialsEnvFile = $env:HSWRMS_CREDENTIALS_FILE
)

$scriptPath = Join-Path $PSScriptRoot "05_Development\database\scripts\seed_m3_vietnamese.ps1"
if (-not (Test-Path $scriptPath)) {
    throw "Target seed script not found at: $scriptPath"
}

& $scriptPath @PSBoundParameters
