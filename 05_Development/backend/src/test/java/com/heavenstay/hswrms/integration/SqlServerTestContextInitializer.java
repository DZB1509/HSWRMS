package com.heavenstay.hswrms.integration;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

import java.util.Arrays;

/**
 * Early application context initializer for SQL Server test executions.
 * Validates test datasource configuration BEFORE any DataSource bean or connection pool is initialized.
 *
 * Fails fast with clear, actionable configuration errors and prevents any connection attempt
 * when credentials or database target configuration are missing or invalid.
 */
public class SqlServerTestContextInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        Environment env = applicationContext.getEnvironment();
        if (Arrays.asList(env.getActiveProfiles()).contains("sqlserver-test")) {
            String username = env.getProperty("spring.datasource.username");
            String password = env.getProperty("spring.datasource.password");
            String url = env.getProperty("spring.datasource.url");

            String expectedDb = env.getProperty("hswrms.sqlserver.test.expected-database");
            if (expectedDb == null || expectedDb.trim().isEmpty()) {
                expectedDb = SqlServerTestConfigValidator.extractDatabaseNameFromUrl(url);
            }
            if (expectedDb == null || expectedDb.trim().isEmpty()) {
                expectedDb = env.getProperty("SQLSERVER_TEST_DB", SqlServerTestConfigValidator.DEFAULT_TEST_DATABASE);
            }

            SqlServerTestConfigValidator.validate(username, password, expectedDb);
        }
    }
}
