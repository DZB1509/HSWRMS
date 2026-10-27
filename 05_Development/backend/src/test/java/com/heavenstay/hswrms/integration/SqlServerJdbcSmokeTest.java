package com.heavenstay.hswrms.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.PropertySourcesPlaceholderConfigurer;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Opt-in read-only smoke test for Microsoft SQL Server JDBC connectivity.
 *
 * This test is STRICTLY OPT-IN and is automatically disabled during normal H2 test suites.
 *
 * To explicitly activate:
 *   mvn test -Dtest=SqlServerJdbcSmokeTest \
 *            -Dspring.profiles.active=sqlserver-test \
 *            -Dhswrms.sqlserver.test.enabled=true
 *
 * Prerequisites:
 *   - Environment variables configured:
 *       SQLSERVER_TEST_USERNAME (or DB_USERNAME)
 *       SQLSERVER_TEST_PASSWORD (or DB_PASSWORD)
 *       SQLSERVER_TEST_DB (defaults to HSWRMS_TEST)
 *       SQLSERVER_TEST_HOST (defaults to localhost)
 *       SQLSERVER_TEST_PORT (defaults to 1433)
 */
@SpringBootTest(classes = SqlServerJdbcSmokeTest.SimpleJdbcConfig.class, webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("sqlserver-test")
@ContextConfiguration(initializers = SqlServerTestContextInitializer.class)
@EnabledIf("isSqlServerTestEnabled")
public class SqlServerJdbcSmokeTest {

    /**
     * Pure JDBC test configuration.
     * Manually registers a HikariDataSource bean configured from application-sqlserver-test.yml.
     * Completely bypasses Spring Boot auto-configuration, eliminating JPA, Hibernate,
     * EntityManager, repositories, schedulers, and all ApplicationRunner beans (including M6DataInitializer).
     */
    @Configuration
    static class SimpleJdbcConfig {

        @Bean
        public static PropertySourcesPlaceholderConfigurer propertySourcesPlaceholderConfigurer() {
            return new PropertySourcesPlaceholderConfigurer();
        }

        @Bean(destroyMethod = "close")
        public DataSource dataSource(Environment env) {
            String url = env.getProperty("spring.datasource.url");
            String username = env.getProperty("spring.datasource.username");
            String password = env.getProperty("spring.datasource.password");
            String driverClassName = env.getProperty("spring.datasource.driver-class-name", "com.microsoft.sqlserver.jdbc.SQLServerDriver");
            String poolName = env.getProperty("spring.datasource.hikari.pool-name", "HSWRMS-SqlServerTestPool");
            long connectionTimeout = Long.parseLong(env.getProperty("spring.datasource.hikari.connection-timeout", "5000"));
            int maxPoolSize = Integer.parseInt(env.getProperty("spring.datasource.hikari.maximum-pool-size", "5"));
            int minIdle = Integer.parseInt(env.getProperty("spring.datasource.hikari.minimum-idle", "1"));
            boolean autoCommit = Boolean.parseBoolean(env.getProperty("spring.datasource.hikari.auto-commit", "true"));

            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(url);
            config.setUsername(username);
            config.setPassword(password);
            config.setDriverClassName(driverClassName);
            config.setPoolName(poolName);
            config.setConnectionTimeout(connectionTimeout);
            config.setMaximumPoolSize(maxPoolSize);
            config.setMinimumIdle(minIdle);
            config.setAutoCommit(autoCommit);
            return new HikariDataSource(config);
        }
    }

    @Autowired
    private DataSource dataSource;

    @Autowired
    private Environment environment;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${hswrms.sqlserver.test.expected-database:${SQLSERVER_TEST_DB:HSWRMS_TEST}}")
    private String configuredExpectedDb;

    /**
     * Condition method evaluated by JUnit 5 before loading the Spring Test Context.
     */
    static boolean isSqlServerTestEnabled() {
        return "true".equalsIgnoreCase(System.getProperty("hswrms.sqlserver.test.enabled"))
                || "true".equalsIgnoreCase(System.getenv("HSWRMS_ENABLE_SQLSERVER_TEST"));
    }

    @Test
    @DisplayName("Verify real Microsoft SQL Server 2019 JDBC connectivity (strictly read-only)")
    void verifySqlServerConnectivityAndVersion() throws Exception {
        assertNotNull(dataSource, "Datasource bean must be present in Spring Context");

        // 1. Resolve effective expected database name
        String expectedDbName = configuredExpectedDb;
        if (expectedDbName == null || expectedDbName.trim().isEmpty() || SqlServerTestConfigValidator.isUnresolvedPlaceholder(expectedDbName)) {
            expectedDbName = environment.getProperty("hswrms.sqlserver.test.expected-database",
                    environment.getProperty("SQLSERVER_TEST_DB", "HSWRMS_TEST"));
        }

        String effectiveUrl = datasourceUrl;
        if (effectiveUrl == null || effectiveUrl.trim().isEmpty() || SqlServerTestConfigValidator.isUnresolvedPlaceholder(effectiveUrl)) {
            effectiveUrl = environment.getProperty("spring.datasource.url", "");
        }

        String urlDbName = SqlServerTestConfigValidator.extractDatabaseNameFromUrl(effectiveUrl);
        if (urlDbName != null && !urlDbName.trim().isEmpty()) {
            expectedDbName = urlDbName;
        }

        assertNotNull(expectedDbName, "Expected database name must not be null");
        SqlServerTestConfigValidator.validateDatabaseTarget(expectedDbName);

        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "Active JDBC Connection must be established");
            assertFalse(connection.isClosed(), "JDBC Connection must be open");

            // Advisory read-only hint on connection
            connection.setReadOnly(true);

            DatabaseMetaData metaData = connection.getMetaData();
            String productName = metaData.getDatabaseProductName();
            int majorVersion = metaData.getDatabaseMajorVersion();
            int minorVersion = metaData.getDatabaseMinorVersion();
            String productVersion = metaData.getDatabaseProductVersion();

            // 2. Guard against accidental H2 connection
            assertFalse(productName.toLowerCase().contains("h2"),
                    "CRITICAL: Test was configured for SQL Server but connected to H2 in-memory database!");

            // 3. Verify product is Microsoft SQL Server
            assertEquals("Microsoft SQL Server", productName,
                    "Expected database product to be Microsoft SQL Server, but found: " + productName);

            // 4. Verify major version is 15 (SQL Server 2019)
            assertEquals(15, majorVersion,
                    "Expected SQL Server 2019 (Major Version 15), but connected to Major Version " + majorVersion
                            + " (" + productVersion + ")");

            // 5. Execute strictly read-only probe
            try (Statement statement = connection.createStatement();
                 ResultSet rs = statement.executeQuery("SELECT @@VERSION AS [version], DB_NAME() AS [db_name]")) {

                assertTrue(rs.next(), "Harmless query SELECT @@VERSION, DB_NAME() must return a row");

                String fullVersionStr = rs.getString("version");
                String actualDbName = rs.getString("db_name");

                assertNotNull(fullVersionStr, "@@VERSION output must not be null");
                assertNotNull(actualDbName, "DB_NAME() output must not be null");

                assertTrue(fullVersionStr.contains("Microsoft SQL Server 2019"),
                        "Version string must confirm SQL Server 2019: " + fullVersionStr);

                // 6. Strict validation of actual connected database
                SqlServerTestConfigValidator.validateActualConnectedDatabase(actualDbName, expectedDbName);
                assertTrue(actualDbName.equalsIgnoreCase(expectedDbName),
                        "Connected database '" + actualDbName + "' must match expected '" + expectedDbName + "'");
                assertFalse("HSWRMS".equalsIgnoreCase(actualDbName),
                        "Connected database must NOT be the primary development database 'HSWRMS'");
            }
        }
    }
}
