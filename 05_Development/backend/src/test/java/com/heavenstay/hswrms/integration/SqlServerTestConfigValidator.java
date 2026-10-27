package com.heavenstay.hswrms.integration;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Strict validator for SQL Server test configuration, database targets, and security posture.
 *
 * Enforces:
 * 1. Missing or blank credentials fail fast before any connection attempt.
 * 2. Unresolved placeholder syntax (${...}) is rejected immediately.
 * 3. Secrets (passwords) are NEVER leaked into error messages, test outputs, or logs.
 * 4. The target database is strictly restricted to the dedicated test database (HSWRMS_TEST by default)
 *    and forbids targeting the primary development database (HSWRMS) or system databases.
 * 5. Privileged administrative accounts like 'sa' are strictly rejected for test execution.
 * 6. Least-privilege role assertions: smoke test principal requires only CONNECT permission,
 *    not broad data roles like 'db_datareader', 'db_datawriter', or 'db_owner'.
 * 7. Fail-closed state validation for existing database and login objects.
 * 8. Server-role, server-permission, and database-permission boundary safety.
 */
public final class SqlServerTestConfigValidator {

    public static final String DEFAULT_TEST_DATABASE = "HSWRMS_TEST";
    public static final String FORBIDDEN_PRIMARY_DATABASE = "HSWRMS";

    private static final Pattern DB_URL_PATTERN = Pattern.compile("(?i)[;?&](?:databaseName|database|initialCatalog)=([^;?&]+)");

    private SqlServerTestConfigValidator() {
    }

    /**
     * Validates configuration parameters.
     * Throws {@link IllegalStateException} with clean, actionable instructions if validation fails.
     * Never echoes passwords in exception messages.
     */
    public static void validate(String username, String password, String expectedDbName) {
        if (username == null || username.trim().isEmpty() || isUnresolvedPlaceholder(username)) {
            throw new IllegalStateException(
                    "SQL Server test configuration error: Test username is missing, blank, or an unresolved placeholder. " +
                    "Please configure environment variable SQLSERVER_TEST_USERNAME (or DB_USERNAME) " +
                    "with an authorized test account before activating profile 'sqlserver-test'."
            );
        }

        if ("sa".equalsIgnoreCase(username.trim())) {
            throw new IllegalStateException(
                    "SAFETY VIOLATION: Using privileged account 'sa' as test username is strictly forbidden. " +
                    "Please configure a dedicated least-privileged test user (e.g., 'hswrms_test_user')."
            );
        }

        if (password == null || password.trim().isEmpty() || isUnresolvedPlaceholder(password)) {
            throw new IllegalStateException(
                    "SQL Server test configuration error: Test password is missing, blank, or an unresolved placeholder. " +
                    "Please configure environment variable SQLSERVER_TEST_PASSWORD (or DB_PASSWORD) " +
                    "before activating profile 'sqlserver-test'."
            );
        }

        if (expectedDbName == null || expectedDbName.trim().isEmpty() || isUnresolvedPlaceholder(expectedDbName)) {
            throw new IllegalStateException(
                    "SQL Server test configuration error: Test database name is missing, blank, or an unresolved placeholder. " +
                    "Expected dedicated test database: '" + DEFAULT_TEST_DATABASE + "'."
            );
        }

        validateDatabaseTarget(expectedDbName);
    }

    /**
     * Validates that the target database name is a safe, dedicated test database.
     */
    public static void validateDatabaseTarget(String targetDbName) {
        if (targetDbName == null || targetDbName.trim().isEmpty()) {
            throw new IllegalArgumentException("Database name cannot be null or blank");
        }

        String normalized = targetDbName.trim();

        // Safety Rule: Never target primary development / production database
        if (FORBIDDEN_PRIMARY_DATABASE.equalsIgnoreCase(normalized)) {
            throw new IllegalStateException(
                    "SAFETY VIOLATION: Target database is configured as '" + FORBIDDEN_PRIMARY_DATABASE + "'. " +
                    "Integration tests are strictly forbidden from targeting the primary database. " +
                    "Tests must run against dedicated test database '" + DEFAULT_TEST_DATABASE + "' " +
                    "to prevent accidental schema alteration or data loss."
            );
        }

        // Safety Rule: Never target system databases
        if (isSystemDatabase(normalized)) {
            throw new IllegalStateException(
                    "SAFETY VIOLATION: Target database cannot be system database '" + normalized + "'."
            );
        }
    }

    /**
     * Validates the actual connected database returned by DB_NAME() against the expected database.
     */
    public static void validateActualConnectedDatabase(String actualDbName, String expectedDbName) {
        if (actualDbName == null || actualDbName.trim().isEmpty()) {
            throw new IllegalStateException("Database verification failed: Actual connected database name is null or blank.");
        }

        validateDatabaseTarget(actualDbName);

        if (expectedDbName != null && !expectedDbName.trim().isEmpty()) {
            if (!actualDbName.trim().equalsIgnoreCase(expectedDbName.trim())) {
                throw new IllegalStateException(
                        "SAFETY VIOLATION: Connected to unexpected database '" + actualDbName.trim() + "'. " +
                        "Expected configured test database is '" + expectedDbName.trim() + "'."
                );
            }
        }
    }

    /**
     * Checks if a database name is a SQL Server system database.
     */
    public static boolean isSystemDatabase(String dbName) {
        if (dbName == null) {
            return false;
        }
        String normalized = dbName.trim();
        return "master".equalsIgnoreCase(normalized)
                || "tempdb".equalsIgnoreCase(normalized)
                || "model".equalsIgnoreCase(normalized)
                || "msdb".equalsIgnoreCase(normalized);
    }

    /**
     * Extracts databaseName from a JDBC connection URL (supporting databaseName, database, and initialCatalog).
     */
    public static String extractDatabaseNameFromUrl(String jdbcUrl) {
        if (jdbcUrl == null || jdbcUrl.trim().isEmpty()) {
            return null;
        }
        Matcher matcher = DB_URL_PATTERN.matcher(jdbcUrl);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    /**
     * Checks if a string contains unresolved Spring/Maven placeholder syntax.
     */
    public static boolean isUnresolvedPlaceholder(String value) {
        if (value == null) {
            return false;
        }
        String trimmed = value.trim();
        return trimmed.startsWith("${") || (trimmed.contains("${") && trimmed.contains("}"));
    }

    /**
     * Asserts that the smoke test principal only requires CONNECT permissions and strictly forbids
     * broad data-reading/writing or administrative roles.
     */
    public static void validateSmokeTestLeastPrivilege(boolean hasConnectPermission, boolean hasDataReader, boolean hasDataWriter, boolean hasDbOwner, boolean isSysadmin) {
        if (isSysadmin) {
            throw new IllegalStateException("LEAST PRIVILEGE VIOLATION: Smoke test principal must not have 'sysadmin' role.");
        }
        if (hasDbOwner) {
            throw new IllegalStateException("LEAST PRIVILEGE VIOLATION: Smoke test principal must not have 'db_owner' role.");
        }
        if (hasDataWriter) {
            throw new IllegalStateException("LEAST PRIVILEGE VIOLATION: Smoke test principal must not have 'db_datawriter' role.");
        }
        if (hasDataReader) {
            throw new IllegalStateException("LEAST PRIVILEGE VIOLATION: Smoke test principal must not have 'db_datareader' role for scalar metadata probe. Only CONNECT permission is required.");
        }
        if (!hasConnectPermission) {
            throw new IllegalStateException("CONFIGURATION ERROR: Smoke test principal must have CONNECT permission on the test database.");
        }
    }

    /**
     * Validates the status of an existing database to enforce fail-closed behavior.
     */
    public static void validateExistingDatabaseState(String databaseName, String stateDesc, boolean isReadOnly) {
        validateDatabaseTarget(databaseName);
        if (!"ONLINE".equalsIgnoreCase(stateDesc)) {
            throw new IllegalStateException("FAIL CLOSED: Database '" + databaseName + "' exists but is in state '" + stateDesc + "' (expected ONLINE).");
        }
        if (isReadOnly) {
            throw new IllegalStateException("FAIL CLOSED: Database '" + databaseName + "' is marked READ_ONLY.");
        }
    }

    /**
     * Validates the status of an existing login to enforce fail-closed behavior.
     */
    public static void validateExistingLoginState(String loginName, boolean isDisabled, boolean isSysadmin, String defaultDbName) {
        if ("sa".equalsIgnoreCase(loginName)) {
            throw new IllegalStateException("SAFETY VIOLATION: 'sa' account cannot be used as test login.");
        }
        if (isDisabled) {
            throw new IllegalStateException("FAIL CLOSED: Login '" + loginName + "' exists but is DISABLED.");
        }
        if (isSysadmin) {
            throw new IllegalStateException("FAIL CLOSED: Login '" + loginName + "' has 'sysadmin' privileges, violating least privilege.");
        }
        if (FORBIDDEN_PRIMARY_DATABASE.equalsIgnoreCase(defaultDbName)) {
            throw new IllegalStateException("FAIL CLOSED: Login '" + loginName + "' default database is configured as forbidden primary database '" + FORBIDDEN_PRIMARY_DATABASE + "'.");
        }
    }

    /**
     * Checks whether a server role name is permissible for the test principal.
     * Only the default 'public' role is allowed; all fixed or user-defined server roles are prohibited.
     */
    public static void validateServerRoleSafety(String roleName) {
        if (roleName != null && !roleName.trim().isEmpty() && !"public".equalsIgnoreCase(roleName.trim())) {
            throw new IllegalStateException(
                    "LEAST PRIVILEGE VIOLATION: Test principal is assigned server role '" + roleName.trim() +
                    "'. Test principals must have zero server roles (only 'public')."
            );
        }
    }

    /**
     * Checks whether an explicit server permission is permissible for the test principal.
     * Explicit server-level permissions are strictly prohibited.
     */
    public static void validateServerPermissionSafety(String permissionName) {
        if (permissionName != null && !permissionName.trim().isEmpty()) {
            throw new IllegalStateException(
                    "LEAST PRIVILEGE VIOLATION: Test principal has explicit server permission '" + permissionName.trim() +
                    "'. Test principals must have zero explicit server permissions."
            );
        }
    }

    /**
     * Asserts that a database permission granted to the smoke test principal is strictly limited to CONNECT.
     */
    public static void validateDatabasePermissionSafety(String classDesc, String permissionName, String stateDesc) {
        if ("DATABASE".equalsIgnoreCase(classDesc) && "CONNECT".equalsIgnoreCase(permissionName) && "GRANT".equalsIgnoreCase(stateDesc)) {
            return; // Permitted least-privilege permission
        }
        throw new IllegalStateException(
                "LEAST PRIVILEGE VIOLATION: Smoke test principal has permission '" + permissionName +
                "' (" + classDesc + ", state: " + stateDesc + "). Only database-level CONNECT is permitted."
        );
    }
}
