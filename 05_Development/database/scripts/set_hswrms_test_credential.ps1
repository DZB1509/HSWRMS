<#
.SYNOPSIS
    Manages local Windows Credential Manager storage for HSWRMS test database credentials.

.DESCRIPTION
    Stores, verifies, or removes credentials for the dedicated SQL Server test account
    (hswrms_test_user) in Windows Credential Manager under a dedicated target name.

    Security Properties:
    - Scoped exclusively to the current Windows user profile.
    - Password is typed interactively via masked prompt (Read-Host -AsSecureString).
    - Never accepts passwords as command-line arguments.
    - Never writes credentials to disk, configuration files, git, or command history.
    - Memory buffers are zeroed immediately after writing.
    - Connects to ZERO databases and executes ZERO SQL commands.

.PARAMETER TargetName
    The Windows Credential Manager target name. Default: 'HSWRMS_TEST_SQLSERVER'.

.PARAMETER Username
    The SQL Server test login name. Must be 'hswrms_test_user'. Default: 'hswrms_test_user'.

.PARAMETER VerifyOnly
    Checks whether the credential exists in Windows Credential Manager and displays
    its target name, username, and last-written timestamp without displaying the password.

.PARAMETER DeleteCredential
    Removes the credential from Windows Credential Manager.

.PARAMETER SecurePassword
    Optional System.Security.SecureString parameter for automated setup harnesses.
    Never accepts plaintext strings.

.EXAMPLE
    # One-time interactive setup:
    .\set_hswrms_test_credential.ps1

.EXAMPLE
    # Verify credential presence without revealing secret:
    .\set_hswrms_test_credential.ps1 -VerifyOnly

.EXAMPLE
    # Remove stored credential:
    .\set_hswrms_test_credential.ps1 -DeleteCredential
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param (
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string]$TargetName = "HSWRMS_TEST_SQLSERVER",

    [Parameter(Mandatory = $false)]
    [ValidateSet("hswrms_test_user")]
    [string]$Username = "hswrms_test_user",

    [Parameter(Mandatory = $false)]
    [switch]$VerifyOnly = $false,

    [Parameter(Mandatory = $false)]
    [switch]$DeleteCredential = $false,

    [Parameter(Mandatory = $false)]
    [System.Security.SecureString]$SecurePassword = $null
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- Native Windows Credential Manager API Definition ---
if (-not ([System.Management.Automation.PSTypeName]'Hswrms.Security.NativeCredentialManager').Type) {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;

namespace Hswrms.Security {
    public static class NativeCredentialManager {
        public const int CRED_TYPE_GENERIC = 1;
        public const int CRED_PERSIST_LOCAL_MACHINE = 2;

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct CREDENTIAL {
            public int Flags;
            public int Type;
            public string TargetName;
            public string Comment;
            public long LastWritten;
            public int CredentialBlobSize;
            public IntPtr CredentialBlob;
            public int Persist;
            public int AttributeCount;
            public IntPtr Attributes;
            public string TargetAlias;
            public string UserName;
        }

        [DllImport("advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern bool CredWrite([In] ref CREDENTIAL userCredential, [In] uint flags);

        [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern bool CredRead(string target, int type, int flags, out IntPtr credentialPtr);

        [DllImport("advapi32.dll", EntryPoint = "CredDeleteW", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern bool CredDelete(string target, int type, int flags);

        [DllImport("advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
        public static extern void CredFree(IntPtr cred);

        public static bool Write(string target, string username, string password) {
            byte[] passBytes = Encoding.Unicode.GetBytes(password);
            IntPtr blobPtr = Marshal.AllocHGlobal(passBytes.Length);
            try {
                Marshal.Copy(passBytes, 0, blobPtr, passBytes.Length);
                CREDENTIAL cred = new CREDENTIAL();
                cred.Flags = 0;
                cred.Type = CRED_TYPE_GENERIC;
                cred.TargetName = target;
                cred.Comment = "HSWRMS Test Database Local Credentials";
                cred.UserName = username;
                cred.CredentialBlob = blobPtr;
                cred.CredentialBlobSize = passBytes.Length;
                cred.Persist = CRED_PERSIST_LOCAL_MACHINE;
                cred.AttributeCount = 0;
                cred.Attributes = IntPtr.Zero;
                cred.TargetAlias = null;

                return CredWrite(ref cred, 0);
            } finally {
                Marshal.FreeHGlobal(blobPtr);
                Array.Clear(passBytes, 0, passBytes.Length);
            }
        }

        public static bool Read(string target, out string username, out string password, out DateTime lastWrittenUtc) {
            username = null;
            password = null;
            lastWrittenUtc = DateTime.MinValue;
            IntPtr credPtr;

            if (CredRead(target, CRED_TYPE_GENERIC, 0, out credPtr)) {
                try {
                    CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                    username = cred.UserName;
                    if (cred.LastWritten > 0) {
                        lastWrittenUtc = DateTime.FromFileTimeUtc(cred.LastWritten);
                    }
                    if (cred.CredentialBlob != IntPtr.Zero && cred.CredentialBlobSize > 0) {
                        byte[] passBytes = new byte[cred.CredentialBlobSize];
                        Marshal.Copy(cred.CredentialBlob, passBytes, 0, cred.CredentialBlobSize);
                        password = Encoding.Unicode.GetString(passBytes);
                        Array.Clear(passBytes, 0, passBytes.Length);
                    }
                    return true;
                } finally {
                    CredFree(credPtr);
                }
            }
            return false;
        }

        public static bool Exists(string target, out string username, out DateTime lastWrittenUtc) {
            username = null;
            lastWrittenUtc = DateTime.MinValue;
            IntPtr credPtr;

            if (CredRead(target, CRED_TYPE_GENERIC, 0, out credPtr)) {
                try {
                    CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                    username = cred.UserName;
                    if (cred.LastWritten > 0) {
                        lastWrittenUtc = DateTime.FromFileTimeUtc(cred.LastWritten);
                    }
                    return true;
                } finally {
                    CredFree(credPtr);
                }
            }
            return false;
        }

        public static bool Delete(string target) {
            return CredDelete(target, CRED_TYPE_GENERIC, 0);
        }
    }
}
"@
}

# --- Action 1: Delete Credential ---
if ($DeleteCredential) {
    if ($PSCmdlet.ShouldProcess("Credential Target '$TargetName'", "Delete from Windows Credential Manager")) {
        $deleted = [Hswrms.Security.NativeCredentialManager]::Delete($TargetName)
        if ($deleted) {
            Write-Host "[SUCCESS] Credential '$TargetName' deleted from Windows Credential Manager."
        } else {
            $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
            if ($err -eq 1168) { # ERROR_NOT_FOUND
                Write-Host "[INFO] Credential '$TargetName' was not found in Windows Credential Manager."
            } else {
                throw "Failed to delete credential '$TargetName'. Win32 Error: $err"
            }
        }
    }
    return
}

# --- Action 2: Verify Existing Credential ---
if ($VerifyOnly) {
    $existingUser = $null
    $lastWritten = [DateTime]::MinValue
    $found = [Hswrms.Security.NativeCredentialManager]::Exists($TargetName, [ref]$existingUser, [ref]$lastWritten)

    if ($found) {
        Write-Host "================================================================="
        Write-Host "HSWRMS TEST CREDENTIAL STATUS: PRESENT"
        Write-Host "================================================================="
        Write-Host "Target Name:   $TargetName"
        Write-Host "Username:      $existingUser"
        Write-Host "Last Written:  $($lastWritten.ToString('o'))"
        Write-Host "Security:      Stored in Windows Credential Manager (Encrypted)"
        Write-Host "Password:      [REDACTED / SECURE]"
        Write-Host "================================================================="
        if ($existingUser -ne $Username) {
            Write-Warning "Stored username '$existingUser' does not match expected '$Username'."
            exit 2
        }
        exit 0
    } else {
        Write-Host "================================================================="
        Write-Host "HSWRMS TEST CREDENTIAL STATUS: NOT FOUND"
        Write-Host "================================================================="
        Write-Host "Target Name:   $TargetName"
        Write-Host "Action Needed: Run set_hswrms_test_credential.ps1 to configure."
        Write-Host "================================================================="
        exit 1
    }
}

# --- Action 3: Store / Update Credential ---
Write-Host "================================================================="
Write-Host "HSWRMS TEST CREDENTIAL CONFIGURATION (LOCAL SECURE STORE)"
Write-Host "================================================================="
Write-Host "Target Name: $TargetName"
Write-Host "Login Name:  $Username"
Write-Host "Scope:       Current Windows User (${env:USERDOMAIN}\${env:USERNAME})"
Write-Host "Storage:     Windows Credential Manager (Generic Credential)"
Write-Host "================================================================="

$plainPass = $null
$bstr = [System.IntPtr]::Zero

try {
    if ($SecurePassword -ne $null) {
        $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
        $plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    } else {
        # Prompt securely with console masking (never logged to history)
        $promptMsg = "Enter password for SQL test login '$Username' (min 12 chars): "
        $secInput = Read-Host -Prompt $promptMsg -AsSecureString
        if ($secInput -eq $null) {
            throw "Password input was cancelled or empty."
        }
        $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secInput)
        $plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }

    # Validate password rules
    if ([string]::IsNullOrWhiteSpace($plainPass)) {
        throw "VALIDATION ERROR: Password cannot be null, empty, or whitespace."
    }
    if ($plainPass.Length -lt 12) {
        throw "VALIDATION ERROR: Password length ($($plainPass.Length) chars) is below minimum policy (12 characters)."
    }
    if ($plainPass.Length -gt 128) {
        throw "VALIDATION ERROR: Password length exceeds maximum policy (128 characters)."
    }

    $prohibitedPlaceholders = @(
        "REPLACE_WITH_STRONG_PASSWORD_BEFORE_EXECUTION",
        "CHANGE_ME_STRONG_PASSWORD!"
    )
    if ($prohibitedPlaceholders -contains $plainPass) {
        throw "VALIDATION ERROR: Default placeholder password value is strictly prohibited."
    }

    # Write to Windows Credential Manager
    if ($PSCmdlet.ShouldProcess("Target '$TargetName' for user '$Username'", "Save credential to Windows Credential Manager")) {
        $written = [Hswrms.Security.NativeCredentialManager]::Write($TargetName, $Username, $plainPass)
        if (-not $written) {
            $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
            throw "Failed to write credential to Windows Credential Manager. Win32 Error: $err"
        }
        Write-Host "[SUCCESS] Credential for '$Username' securely stored under target '$TargetName'."
        Write-Host "You can now run 'run_hswrms_jdbc_smoke_test.ps1' repeatedly without re-entering the password."
    }
}
finally {
    # Scrub memory immediately
    if ($bstr -ne [System.IntPtr]::Zero) {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        $bstr = [System.IntPtr]::Zero
    }
    $plainPass = $null
    [System.GC]::Collect()
}

