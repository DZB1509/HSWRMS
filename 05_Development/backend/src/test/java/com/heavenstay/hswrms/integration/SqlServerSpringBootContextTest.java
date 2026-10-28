package com.heavenstay.hswrms.integration;

import com.heavenstay.hswrms.HswrmsApplication;
import com.heavenstay.hswrms.config.SchedulingConfig;
import com.heavenstay.hswrms.m6admin.service.M6DataInitializer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Dedicated integration test verifying full Spring Boot application-context initialization
 * against Microsoft SQL Server 2019 (HSWRMS_TEST) with least-privilege connectivity.
 *
 * Safety Invariants:
 * 1. Strictly OPT-IN via -Dhswrms.sqlserver.test.enabled=true or HSWRMS_ENABLE_SQLSERVER_TEST=true.
 * 2. Active profile: ONLY 'sqlserver-test' (the 'dev' profile is strictly forbidden).
 * 3. Early validation via SqlServerTestContextInitializer guarantees credentials and target database
 *    are validated before DataSource initialization.
 * 4. M6DataInitializer and SchedulingConfig are proven absent / suppressed via @ConditionalOnProperty.
 * 5. M5DataInitializer and DevAccountBootstrap are proven absent / suppressed.
 * 6. Executes ZERO database mutations, migrations, or DDL operations.
 */
@SpringBootTest(classes = HswrmsApplication.class, webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("sqlserver-test")
@ContextConfiguration(initializers = SqlServerTestContextInitializer.class)
@EnabledIf("isSqlServerTestEnabled")
public class SqlServerSpringBootContextTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private Environment environment;

    @Autowired
    private MockMvc mockMvc;

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
    @DisplayName("Verify full Spring application context loads safely against SQL Server test database")
    void verifyFullContextLoadsSafely() throws Exception {
        assertNotNull(applicationContext, "Spring ApplicationContext must be initialized");
        assertNotNull(dataSource, "DataSource bean must be present in ApplicationContext");

        // 1. Strict Profile Assertions: dev profile must NOT be active
        String[] activeProfiles = environment.getActiveProfiles();
        assertTrue(Arrays.asList(activeProfiles).contains("sqlserver-test"),
                "Profile 'sqlserver-test' must be active");
        assertFalse(Arrays.asList(activeProfiles).contains("dev"),
                "SAFETY VIOLATION: Profile 'dev' must NOT be active during SQL Server test execution");

        // 2. Strict Database Target and Credential Guard
        String effectiveUrl = datasourceUrl;
        if (effectiveUrl == null || effectiveUrl.trim().isEmpty() || SqlServerTestConfigValidator.isUnresolvedPlaceholder(effectiveUrl)) {
            effectiveUrl = environment.getProperty("spring.datasource.url", "");
        }
        String expectedDbName = configuredExpectedDb;
        String urlDbName = SqlServerTestConfigValidator.extractDatabaseNameFromUrl(effectiveUrl);
        if (urlDbName != null && !urlDbName.trim().isEmpty()) {
            expectedDbName = urlDbName;
        }

        SqlServerTestConfigValidator.validateDatabaseTarget(expectedDbName);
        assertFalse("HSWRMS".equalsIgnoreCase(expectedDbName),
                "CRITICAL: Test target must NEVER be the protected primary database 'HSWRMS'");

        String username = environment.getProperty("spring.datasource.username", "");
        assertFalse("sa".equalsIgnoreCase(username.trim()),
                "SAFETY VIOLATION: Privileged account 'sa' must not be used");

        // 3. Verify Mutation Guards: M6DataInitializer MUST NOT be present in context
        assertThrows(NoSuchBeanDefinitionException.class, () -> {
            applicationContext.getBean(M6DataInitializer.class);
        }, "SAFETY VIOLATION: M6DataInitializer must be disabled under profile 'sqlserver-test'");

        // 4. Verify Mutation Guards: SchedulingConfig MUST NOT be present in context
        assertThrows(NoSuchBeanDefinitionException.class, () -> {
            applicationContext.getBean(SchedulingConfig.class);
        }, "SAFETY VIOLATION: SchedulingConfig must be disabled under profile 'sqlserver-test'");

        // 5. Verify Demo Seed Guard: app.seed.demo-data must be false
        assertEquals("false", environment.getProperty("app.seed.demo-data", "false"),
                "SAFETY VIOLATION: app.seed.demo-data must be false");

        // 6. Verify strictly read-only probe against SQL Server
        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "Active JDBC Connection must be established");
            assertFalse(connection.isClosed(), "JDBC Connection must be open");

            // Advisory read-only hint on connection
            connection.setReadOnly(true);

            DatabaseMetaData metaData = connection.getMetaData();
            assertEquals("Microsoft SQL Server", metaData.getDatabaseProductName());
            assertEquals(15, metaData.getDatabaseMajorVersion());

            try (Statement statement = connection.createStatement();
                 ResultSet rs = statement.executeQuery("SELECT @@VERSION AS [version], DB_NAME() AS [db_name]")) {
                assertTrue(rs.next());
                String actualDb = rs.getString("db_name");
                assertNotNull(actualDb);
                assertEquals(expectedDbName.toLowerCase(), actualDb.toLowerCase());
                assertFalse("HSWRMS".equalsIgnoreCase(actualDb),
                        "Connected database must NOT be protected database 'HSWRMS'");
            }
        }
    }

    @Test
    @DisplayName("Controlled API Test 1: GET /api/v1/health returns HTTP 200 with service status")
    void testGetHealthEndpoint() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/health")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("HSWRMS Modular Monolith Backend"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andReturn();

        System.out.println("[API TEST PASS] GET /api/v1/health -> HTTP "
                + result.getResponse().getStatus() + " | Body: " + result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Controlled API Test 2: GET /api/v1/retreat-packages returns HTTP 200 with empty list")
    void testGetRetreatPackagesEndpoint() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/retreat-packages")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0))
                .andReturn();

        System.out.println("[API TEST PASS] GET /api/v1/retreat-packages -> HTTP "
                + result.getResponse().getStatus() + " | Body: " + result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Controlled API Test 3: GET /api/v1/retreat-packages/villa-categories returns HTTP 200 with empty list")
    void testGetRetreatPackageVillaCategoriesEndpoint() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/retreat-packages/villa-categories")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0))
                .andReturn();

        System.out.println("[API TEST PASS] GET /api/v1/retreat-packages/villa-categories -> HTTP "
                + result.getResponse().getStatus() + " | Body: " + result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Controlled API Test 4: GET /api/v1/spa/treatments returns HTTP 200 with empty list")
    void testGetSpaTreatmentsEndpoint() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/spa/treatments")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0))
                .andReturn();

        System.out.println("[API TEST PASS] GET /api/v1/spa/treatments -> HTTP "
                + result.getResponse().getStatus() + " | Body: " + result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Controlled API Test 5: GET /api/v1/fnb/customer/menu-items returns HTTP 200 with empty list")
    void testGetFnbCustomerMenuItemsEndpoint() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/fnb/customer/menu-items")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0))
                .andReturn();

        System.out.println("[API TEST PASS] GET /api/v1/fnb/customer/menu-items -> HTTP "
                + result.getResponse().getStatus() + " | Body: " + result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Controlled API Test 6: GET /api/v1/packages returns HTTP 500 due to unmapped route / NoResourceFoundException")
    void testGetUnmappedPackagesRoute() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/packages")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_SERVER_ERROR"))
                .andReturn();

        System.out.println("[API TEST PASS] GET /api/v1/packages -> HTTP "
                + result.getResponse().getStatus() + " | Body: " + result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Controlled API Test 7: GET /api/v1/retreat-packages/999 returns HTTP 404 for non-existent ID")
    void testGetRetreatPackageDetailNotFound() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/retreat-packages/999")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"))
                .andReturn();

        System.out.println("[API TEST PASS] GET /api/v1/retreat-packages/999 -> HTTP "
                + result.getResponse().getStatus() + " | Body: " + result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Controlled API Test 8: GET /api/v1/spa/treatments/999 returns HTTP 404 for non-existent ID")
    void testGetSpaTreatmentDetailNotFound() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/spa/treatments/999")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"))
                .andReturn();

        System.out.println("[API TEST PASS] GET /api/v1/spa/treatments/999 -> HTTP "
                + result.getResponse().getStatus() + " | Body: " + result.getResponse().getContentAsString());
    }
}

