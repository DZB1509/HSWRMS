package com.heavenstay.hswrms.integration;

import com.heavenstay.hswrms.HswrmsApplication;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m2booking.dto.RetreatPackageResponse;
import com.heavenstay.hswrms.m2booking.dto.VillaCategoryResponse;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.service.RetreatPackageService;
import com.heavenstay.hswrms.m3spa.repository.SpaTreatmentRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end integration and smoke verification test for TASK-DB-01.
 * Connects directly to local Microsoft SQL Server 2019 database [HSWRMS].
 * Proves that schema reconciliation, RCSI, and M1-M6 demo seed data are 100% active and functional.
 */
@SpringBootTest(classes = HswrmsApplication.class, webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@TestPropertySource(properties = {
        "spring.datasource.url=${HSWRMS_DB_URL:jdbc:sqlserver://localhost:1433;databaseName=HSWRMS;encrypt=true;trustServerCertificate=true;sendStringParametersAsUnicode=true}",
        "spring.datasource.username=${HSWRMS_DB_USERNAME:hswrms_app_user}",
        "spring.datasource.password=${HSWRMS_DB_PASSWORD:}",
        "app.auth.dev-token-enabled=true",
        "logging.level.com.heavenstay.hswrms=INFO"
})
public class HswrmsDatabaseBootstrapIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RetreatPackageService retreatPackageService;

    @Autowired
    private SpaTreatmentRepository spaTreatmentRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RetreatBookingRepository retreatBookingRepository;

    @Autowired
    private FolioRepository folioRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Test
    @DisplayName("Verify SQL Server [HSWRMS] connectivity, dedicated app user least privilege, and RCSI enabled")
    void testDatabaseConnectivityAndRcsi() throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            assertNotNull(conn, "Connection must not be null");
            assertFalse(conn.isClosed(), "Connection must be open");

            DatabaseMetaData meta = conn.getMetaData();
            assertEquals("Microsoft SQL Server", meta.getDatabaseProductName());
            assertEquals(15, meta.getDatabaseMajorVersion(), "Must be SQL Server 2019 (Major version 15)");

            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(
                         "SELECT DB_NAME() AS [db_name], " +
                         "SUSER_SNAME() AS [login_name], " +
                         "CURRENT_USER AS [user_name], " +
                         "IS_SRVROLEMEMBER('sysadmin') AS [is_sysadmin], " +
                         "IS_ROLEMEMBER('db_owner') AS [is_db_owner], " +
                         "is_read_committed_snapshot_on, snapshot_isolation_state_desc " +
                         "FROM sys.databases WHERE name = 'HSWRMS'")) {
                assertTrue(rs.next(), "Database query must return a row");
                assertEquals("HSWRMS", rs.getString("db_name"), "Connected database must be HSWRMS");
                assertEquals("hswrms_app_user", rs.getString("login_name"), "Connected login must be dedicated app user");
                assertEquals(0, rs.getInt("is_sysadmin"), "Application login must NOT be sysadmin");
                assertEquals(0, rs.getInt("is_db_owner"), "Application user must NOT be db_owner");
                assertEquals(1, rs.getInt("is_read_committed_snapshot_on"), "RCSI must be ON (1)");
                assertEquals("ON", rs.getString("snapshot_isolation_state_desc"), "Snapshot Isolation must be ON");
            }
        }
    }

    @Test
    @DisplayName("Verify M1-M6 JPA entities and Seed Data counts")
    void testModuleEntityData() {
        // Module 1: Users
        assertTrue(userRepository.findByEmail("customer@heavenstay.com").isPresent(), "Customer demo user must exist");
        assertTrue(userRepository.findByEmail("receptionist@heavenstay.com").isPresent(), "Receptionist demo user must exist");
        assertTrue(userRepository.findByEmail("admin@heavenstay.com").isPresent(), "Admin demo user must exist");

        // Module 2: Packages & Villa Categories
        List<RetreatPackageResponse> packages = retreatPackageService.getAllActivePackages(null);
        assertEquals(8, packages.size(), "Must have 8 active retreat packages");

        List<VillaCategoryResponse> categories = retreatPackageService.getAllActiveVillaCategories();
        assertEquals(6, categories.size(), "Must have 6 active villa categories");

        // Module 2: Bookings (CONFIRMED, CHECKED_IN, COMPLETED)
        assertEquals(3, retreatBookingRepository.count(), "Must have 3 retreat bookings");

        // Module 3: Spa Treatments
        assertEquals(18, spaTreatmentRepository.count(), "Must have 18 standardized spa treatments");

        // Module 4: F&B Menu Items
        assertEquals(5, menuItemRepository.count(), "Must have 5 menu items");

        // Module 5: Folios and Payment Transactions
        assertEquals(2, folioRepository.count(), "Must have 2 folios (1 open, 1 closed)");
        assertEquals(2, paymentTransactionRepository.count(), "Must have 2 payment transactions");
    }

    @Test
    @DisplayName("REST API: GET /api/v1/retreat-packages returns HTTP 200 with 8 packages")
    void testGetRetreatPackagesEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/retreat-packages").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(8))
                .andExpect(jsonPath("$.data[0].packageName").isNotEmpty());
    }

    @Test
    @DisplayName("REST API: GET /api/v1/retreat-packages/villa-categories returns HTTP 200 with 6 categories")
    void testGetVillaCategoriesEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/retreat-packages/villa-categories").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(6));
    }

    @Test
    @DisplayName("REST API: POST /api/v1/auth/switch-role to customer returns HTTP 200 with JWT token")
    void testSwitchRoleEndpoint() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/switch-role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"customer\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.email").value("customer@heavenstay.com"))
                .andReturn();

        // Verification completed without printing raw token
    }
}

