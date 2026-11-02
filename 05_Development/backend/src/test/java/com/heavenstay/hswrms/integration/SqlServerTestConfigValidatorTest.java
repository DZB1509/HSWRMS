package com.heavenstay.hswrms.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link SqlServerTestConfigValidator}.
 *
 * Verifies that:
 * 1. Missing or blank credentials fail fast before any connection attempt.
 * 2. Unresolved placeholder syntax (${...}) is rejected.
 * 3. Secrets (passwords) are NEVER leaked into error messages.
 * 4. The primary database 'HSWRMS' is strictly forbidden as a test target.
 * 5. System databases ('master', 'tempdb', etc.) are strictly forbidden.
 * 6. Valid test database 'HSWRMS_TEST' is accepted and compared case-insensitively.
 * 7. Privileged account 'sa' is strictly rejected.
 * 8. JDBC URL database extraction works accurately for databaseName, database, and initialCatalog.
 * 9. Least-privilege rules: smoke test principal requires only CONNECT; broad data/admin roles are rejected.
 * 10. Fail-closed state checks on existing databases and logins.
 *
 * Runs without requiring a live SQL Server instance.
 */
public class SqlServerTestConfigValidatorTest {

    private static final String VALID_USER = "hswrms_test_user";
    private static final String VALID_PASS = "ValidTestPass123!#";
    private static final String VALID_DB = "HSWRMS_TEST";

    @Test
    @DisplayName("Valid configuration passes validation cleanly")
    void validConfiguration_Passes() {
        assertDoesNotThrow(() ->
                SqlServerTestConfigValidator.validate(VALID_USER, VALID_PASS, VALID_DB)
        );
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t", "\n", "${DB_USERNAME}", "${SQLSERVER_TEST_USERNAME}", "${DB_USERNAME:}"})
    @DisplayName("Invalid or blank username throws IllegalStateException with actionable instructions")
    void invalidUsername_ThrowsIllegalStateException(String username) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validate(username, VALID_PASS, VALID_DB)
        );
        assertTrue(ex.getMessage().contains("Test username is missing"),
                "Message must explain username error: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("SQLSERVER_TEST_USERNAME"),
                "Message must guide user to environment variable: " + ex.getMessage());
    }

    @ParameterizedTest
    @ValueSource(strings = {"sa", "SA", "Sa", " sa "})
    @DisplayName("Configuring 'sa' account as test username throws IllegalStateException")
    void saAccountAsUsername_ThrowsIllegalStateException(String saUser) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validate(saUser, VALID_PASS, VALID_DB)
        );
        assertTrue(ex.getMessage().contains("SAFETY VIOLATION"),
                "Error message must indicate safety violation: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("privileged account 'sa'"),
                "Error message must mention 'sa': " + ex.getMessage());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t", "\n", "${DB_PASSWORD}", "${SQLSERVER_TEST_PASSWORD}", "${DB_PASSWORD:}"})
    @DisplayName("Invalid or blank password throws IllegalStateException with actionable instructions")
    void invalidPassword_ThrowsIllegalStateException(String password) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validate(VALID_USER, password, VALID_DB)
        );
        assertTrue(ex.getMessage().contains("Test password is missing"),
                "Message must explain password error: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("SQLSERVER_TEST_PASSWORD"),
                "Message must guide user to environment variable: " + ex.getMessage());
    }

    @Test
    @DisplayName("Passwords or secrets are never printed in exception messages")
    void secretsAreNeverLeakedInExceptionMessages() {
        String sensitiveSecret = "SuperSecretPlainTextPasswordThatMustNeverAppearInLogs!";
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validate(null, sensitiveSecret, VALID_DB)
        );
        assertFalse(ex.getMessage().contains(sensitiveSecret),
                "Exception message must NOT contain the sensitive password value");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "${SQLSERVER_TEST_DB}"})
    @DisplayName("Invalid or blank expected database name throws IllegalStateException")
    void invalidExpectedDbName_ThrowsIllegalStateException(String dbName) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validate(VALID_USER, VALID_PASS, dbName)
        );
        assertTrue(ex.getMessage().contains("Test database name is missing"),
                "Message must explain database name error: " + ex.getMessage());
    }

    @ParameterizedTest
    @ValueSource(strings = {"HSWRMS", "hswrms", "Hswrms", " HSWRMS "})
    @DisplayName("Targeting primary database 'HSWRMS' is strictly rejected as a SAFETY VIOLATION")
    void targetingPrimaryDatabase_IsStrictlyForbidden(String primaryDb) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateDatabaseTarget(primaryDb)
        );
        assertTrue(ex.getMessage().contains("SAFETY VIOLATION"),
                "Error must be marked as SAFETY VIOLATION: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("strictly forbidden"),
                "Error must state that targeting primary database is forbidden: " + ex.getMessage());
    }

    @ParameterizedTest
    @ValueSource(strings = {"master", "tempdb", "model", "msdb", "MASTER", "TempDb"})
    @DisplayName("Targeting system databases is strictly rejected as a SAFETY VIOLATION")
    void targetingSystemDatabases_IsStrictlyForbidden(String sysDb) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateDatabaseTarget(sysDb)
        );
        assertTrue(ex.getMessage().contains("SAFETY VIOLATION"),
                "Error must be marked as SAFETY VIOLATION: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("system database"),
                "Error must state that targeting system database is forbidden: " + ex.getMessage());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    @DisplayName("Null or blank database target throws IllegalArgumentException")
    void nullOrBlankDatabaseTarget_ThrowsIllegalArgumentException(String emptyDb) {
        assertThrows(IllegalArgumentException.class, () ->
                SqlServerTestConfigValidator.validateDatabaseTarget(emptyDb)
        );
    }

    @Test
    @DisplayName("Actual connected database matching expected database succeeds case-insensitively")
    void actualConnectedDatabase_Matching_Succeeds() {
        assertDoesNotThrow(() ->
                SqlServerTestConfigValidator.validateActualConnectedDatabase("hswrms_test", "HSWRMS_TEST")
        );
        assertDoesNotThrow(() ->
                SqlServerTestConfigValidator.validateActualConnectedDatabase("HSWRMS_TEST", "HSWRMS_TEST")
        );
    }

    @Test
    @DisplayName("Actual connected database mismatch throws IllegalStateException")
    void actualConnectedDatabase_Mismatch_ThrowsIllegalStateException() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateActualConnectedDatabase("SOME_OTHER_DB", "HSWRMS_TEST")
        );
        assertTrue(ex.getMessage().contains("SAFETY VIOLATION"),
                "Mismatch must trigger safety violation: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("SOME_OTHER_DB"),
                "Message must identify the unexpected connected database");
    }

    @Test
    @DisplayName("Actual connected database targeting HSWRMS throws IllegalStateException even if expected was HSWRMS")
    void actualConnectedDatabase_TargetingPrimaryDb_ThrowsIllegalStateException() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateActualConnectedDatabase("HSWRMS", "HSWRMS")
        );
        assertTrue(ex.getMessage().contains("SAFETY VIOLATION"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void actualConnectedDatabase_NullOrBlank_ThrowsIllegalStateException(String actual) {
        assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateActualConnectedDatabase(actual, "HSWRMS_TEST")
        );
    }

    @Test
    @DisplayName("extractDatabaseNameFromUrl extracts database correctly from various JDBC URLs")
    void extractDatabaseNameFromUrl_Success() {
        assertEquals("HSWRMS_TEST",
                SqlServerTestConfigValidator.extractDatabaseNameFromUrl(
                        "jdbc:sqlserver://localhost:1433;databaseName=HSWRMS_TEST;encrypt=true;"));

        assertEquals("CUSTOM_TEST_DB",
                SqlServerTestConfigValidator.extractDatabaseNameFromUrl(
                        "jdbc:sqlserver://127.0.0.1:1433;database=CUSTOM_TEST_DB;trustServerCertificate=true"));

        assertEquals("PARAM_DB",
                SqlServerTestConfigValidator.extractDatabaseNameFromUrl(
                        "jdbc:sqlserver://localhost:1433?databaseName=PARAM_DB&encrypt=true"));

        assertEquals("HSWRMS_TEST",
                SqlServerTestConfigValidator.extractDatabaseNameFromUrl(
                        "jdbc:sqlserver://localhost:1433;initialCatalog=HSWRMS_TEST;encrypt=true;"));

        assertNull(SqlServerTestConfigValidator.extractDatabaseNameFromUrl(
                "jdbc:sqlserver://localhost:1433;encrypt=true;"));

        assertNull(SqlServerTestConfigValidator.extractDatabaseNameFromUrl(null));
        assertNull(SqlServerTestConfigValidator.extractDatabaseNameFromUrl(""));
    }

    @Test
    @DisplayName("isUnresolvedPlaceholder accurately detects placeholder strings")
    void isUnresolvedPlaceholder_Detection() {
        assertTrue(SqlServerTestConfigValidator.isUnresolvedPlaceholder("${DB_USERNAME}"));
        assertTrue(SqlServerTestConfigValidator.isUnresolvedPlaceholder("${SQLSERVER_TEST_USERNAME:${DB_USERNAME}}"));
        assertTrue(SqlServerTestConfigValidator.isUnresolvedPlaceholder("prefix_${VAR}_suffix"));

        assertFalse(SqlServerTestConfigValidator.isUnresolvedPlaceholder("normal_user"));
        assertFalse(SqlServerTestConfigValidator.isUnresolvedPlaceholder(""));
        assertFalse(SqlServerTestConfigValidator.isUnresolvedPlaceholder(null));
    }

    @Test
    @DisplayName("validateSmokeTestLeastPrivilege passes when user has only CONNECT permission")
    void validateSmokeTestLeastPrivilege_ConnectOnly_Passes() {
        assertDoesNotThrow(() ->
                SqlServerTestConfigValidator.validateSmokeTestLeastPrivilege(true, false, false, false, false)
        );
    }

    @Test
    @DisplayName("validateSmokeTestLeastPrivilege fails when user has db_datareader")
    void validateSmokeTestLeastPrivilege_WithDbDataReader_Throws() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateSmokeTestLeastPrivilege(true, true, false, false, false)
        );
        assertTrue(ex.getMessage().contains("LEAST PRIVILEGE VIOLATION"));
        assertTrue(ex.getMessage().contains("db_datareader"));
    }

    @Test
    @DisplayName("validateSmokeTestLeastPrivilege fails when user has db_datawriter")
    void validateSmokeTestLeastPrivilege_WithDbDataWriter_Throws() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateSmokeTestLeastPrivilege(true, false, true, false, false)
        );
        assertTrue(ex.getMessage().contains("LEAST PRIVILEGE VIOLATION"));
        assertTrue(ex.getMessage().contains("db_datawriter"));
    }

    @Test
    @DisplayName("validateSmokeTestLeastPrivilege fails when user has db_owner")
    void validateSmokeTestLeastPrivilege_WithDbOwner_Throws() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateSmokeTestLeastPrivilege(true, false, false, true, false)
        );
        assertTrue(ex.getMessage().contains("LEAST PRIVILEGE VIOLATION"));
        assertTrue(ex.getMessage().contains("db_owner"));
    }

    @Test
    @DisplayName("validateSmokeTestLeastPrivilege fails when user is sysadmin")
    void validateSmokeTestLeastPrivilege_WithSysadmin_Throws() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateSmokeTestLeastPrivilege(true, false, false, false, true)
        );
        assertTrue(ex.getMessage().contains("LEAST PRIVILEGE VIOLATION"));
        assertTrue(ex.getMessage().contains("sysadmin"));
    }

    @Test
    @DisplayName("validateSmokeTestLeastPrivilege fails when user lacks CONNECT permission")
    void validateSmokeTestLeastPrivilege_WithoutConnect_Throws() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateSmokeTestLeastPrivilege(false, false, false, false, false)
        );
        assertTrue(ex.getMessage().contains("CONFIGURATION ERROR"));
        assertTrue(ex.getMessage().contains("CONNECT permission"));
    }

    @Test
    @DisplayName("validateExistingDatabaseState passes when database is ONLINE and read-write")
    void validateExistingDatabaseState_Online_Passes() {
        assertDoesNotThrow(() ->
                SqlServerTestConfigValidator.validateExistingDatabaseState("HSWRMS_TEST", "ONLINE", false)
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {"OFFLINE", "RESTORING", "RECOVERY_PENDING", "SUSPECT", "EMERGENCY"})
    @DisplayName("validateExistingDatabaseState fails closed when database is not ONLINE")
    void validateExistingDatabaseState_NotOnline_Throws(String state) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateExistingDatabaseState("HSWRMS_TEST", state, false)
        );
        assertTrue(ex.getMessage().contains("FAIL CLOSED"));
        assertTrue(ex.getMessage().contains(state));
    }

    @Test
    @DisplayName("validateExistingDatabaseState fails closed when database is READ_ONLY")
    void validateExistingDatabaseState_ReadOnly_Throws() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateExistingDatabaseState("HSWRMS_TEST", "ONLINE", true)
        );
        assertTrue(ex.getMessage().contains("FAIL CLOSED"));
        assertTrue(ex.getMessage().contains("READ_ONLY"));
    }

    @Test
    @DisplayName("validateExistingLoginState passes when login is active, non-sysadmin, and has safe default database")
    void validateExistingLoginState_Valid_Passes() {
        assertDoesNotThrow(() ->
                SqlServerTestConfigValidator.validateExistingLoginState("hswrms_test_user", false, false, "HSWRMS_TEST")
        );
    }

    @Test
    @DisplayName("validateExistingLoginState fails closed when login is disabled")
    void validateExistingLoginState_Disabled_Throws() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateExistingLoginState("hswrms_test_user", true, false, "HSWRMS_TEST")
        );
        assertTrue(ex.getMessage().contains("FAIL CLOSED"));
        assertTrue(ex.getMessage().contains("DISABLED"));
    }

    @Test
    @DisplayName("validateExistingLoginState fails closed when login has sysadmin privileges")
    void validateExistingLoginState_Sysadmin_Throws() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateExistingLoginState("hswrms_test_user", false, true, "HSWRMS_TEST")
        );
        assertTrue(ex.getMessage().contains("FAIL CLOSED"));
        assertTrue(ex.getMessage().contains("sysadmin"));
    }

    @Test
    @DisplayName("validateExistingLoginState fails closed when login default database is HSWRMS")
    void validateExistingLoginState_DefaultDbIsPrimary_Throws() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateExistingLoginState("hswrms_test_user", false, false, "HSWRMS")
        );
        assertTrue(ex.getMessage().contains("FAIL CLOSED"));
        assertTrue(ex.getMessage().contains("HSWRMS"));
    }

    @Test
    @DisplayName("validateExistingLoginState fails closed when login is sa")
    void validateExistingLoginState_Sa_Throws() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateExistingLoginState("sa", false, true, "master")
        );
        assertTrue(ex.getMessage().contains("SAFETY VIOLATION"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"public", "PUBLIC", ""})
    @NullAndEmptySource
    @DisplayName("validateServerRoleSafety permits public or empty role")
    void validateServerRoleSafety_PublicOrNull_Passes(String role) {
        assertDoesNotThrow(() ->
                SqlServerTestConfigValidator.validateServerRoleSafety(role)
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {"sysadmin", "securityadmin", "serveradmin", "setupadmin", "processadmin", "diskadmin", "dbcreator", "bulkadmin", "custom_server_role"})
    @DisplayName("validateServerRoleSafety strictly rejects elevated server roles")
    void validateServerRoleSafety_ElevatedRoles_Throws(String role) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateServerRoleSafety(role)
        );
        assertTrue(ex.getMessage().contains("LEAST PRIVILEGE VIOLATION"));
        assertTrue(ex.getMessage().contains(role));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @DisplayName("validateServerPermissionSafety permits null or empty permissions")
    void validateServerPermissionSafety_NullOrEmpty_Passes(String perm) {
        assertDoesNotThrow(() ->
                SqlServerTestConfigValidator.validateServerPermissionSafety(perm)
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {"CONTROL SERVER", "ALTER ANY LOGIN", "ALTER ANY DATABASE", "VIEW ANY DEFINITION"})
    @DisplayName("validateServerPermissionSafety strictly rejects explicit server-level grants")
    void validateServerPermissionSafety_ExplicitGrants_Throws(String perm) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateServerPermissionSafety(perm)
        );
        assertTrue(ex.getMessage().contains("LEAST PRIVILEGE VIOLATION"));
        assertTrue(ex.getMessage().contains(perm));
    }

    @Test
    @DisplayName("validateDatabasePermissionSafety permits DATABASE CONNECT GRANT")
    void validateDatabasePermissionSafety_ConnectGrant_Passes() {
        assertDoesNotThrow(() ->
                SqlServerTestConfigValidator.validateDatabasePermissionSafety("DATABASE", "CONNECT", "GRANT")
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {"DENY", "REVOKE"})
    @DisplayName("validateDatabasePermissionSafety rejects non-GRANT CONNECT states")
    void validateDatabasePermissionSafety_NonGrantConnect_Throws(String state) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateDatabasePermissionSafety("DATABASE", "CONNECT", state)
        );
        assertTrue(ex.getMessage().contains("LEAST PRIVILEGE VIOLATION"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"SELECT", "INSERT", "UPDATE", "DELETE", "EXECUTE", "CONTROL"})
    @DisplayName("validateDatabasePermissionSafety rejects data-access and control permissions")
    void validateDatabasePermissionSafety_DataAccessPermissions_Throws(String perm) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                SqlServerTestConfigValidator.validateDatabasePermissionSafety("OBJECT_OR_COLUMN", perm, "GRANT")
        );
        assertTrue(ex.getMessage().contains("LEAST PRIVILEGE VIOLATION"));
        assertTrue(ex.getMessage().contains(perm));
    }
}
