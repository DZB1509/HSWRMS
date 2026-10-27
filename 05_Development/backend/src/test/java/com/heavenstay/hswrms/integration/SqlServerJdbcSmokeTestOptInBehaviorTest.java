package com.heavenstay.hswrms.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class SqlServerJdbcSmokeTestOptInBehaviorTest {

    @Test
    @DisplayName("Verify that SQL Server smoke test is disabled by default when flags are absent")
    void verifyDefaultOptInState() {
        String prop = System.getProperty("hswrms.sqlserver.test.enabled");
        if (prop == null) {
            assertFalse(SqlServerJdbcSmokeTest.isSqlServerTestEnabled(),
                    "SqlServerJdbcSmokeTest must be disabled by default during ordinary test runs");
        }
    }

    @Test
    @DisplayName("Verify that SQL Server smoke test enables when system property is set to 'true'")
    void verifyOptInEnablesWhenSystemPropertySet() {
        String originalProp = System.getProperty("hswrms.sqlserver.test.enabled");
        try {
            System.setProperty("hswrms.sqlserver.test.enabled", "true");
            assertTrue(SqlServerJdbcSmokeTest.isSqlServerTestEnabled(),
                    "SqlServerJdbcSmokeTest must be enabled when hswrms.sqlserver.test.enabled is 'true'");
        } finally {
            if (originalProp != null) {
                System.setProperty("hswrms.sqlserver.test.enabled", originalProp);
            } else {
                System.clearProperty("hswrms.sqlserver.test.enabled");
            }
        }
    }

    @Test
    @DisplayName("Verify that SQL Server smoke test remains disabled when system property is 'false'")
    void verifyOptInDisabledWhenSystemPropertyFalse() {
        String originalProp = System.getProperty("hswrms.sqlserver.test.enabled");
        try {
            System.setProperty("hswrms.sqlserver.test.enabled", "false");
            assertFalse(SqlServerJdbcSmokeTest.isSqlServerTestEnabled(),
                    "SqlServerJdbcSmokeTest must be disabled when hswrms.sqlserver.test.enabled is 'false'");
        } finally {
            if (originalProp != null) {
                System.setProperty("hswrms.sqlserver.test.enabled", originalProp);
            } else {
                System.clearProperty("hswrms.sqlserver.test.enabled");
            }
        }
    }
}
