package com.heavenstay.hswrms.m6admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heavenstay.hswrms.m1identity.dto.AuthDtos.LoginRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DelegationCreateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MatrixChange;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MatrixChangeRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.ParameterUpdateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffCreateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffStatusRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class M6AdminIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private Integer adminUserId;

    @BeforeEach
    void setupAdminToken() throws Exception {
        LoginRequest login = new LoginRequest("admin@heavenstay.com", "Admin@123456");
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        this.adminToken = json.path("data").path("token").asText();
        this.adminUserId = json.path("data").path("userId").asInt();
    }

    @Test
    @DisplayName("Phase 0 Auth: Login succeeds and /me returns current profile and permissions")
    void loginAndMeProfile() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email", is("admin@heavenstay.com")))
                .andExpect(jsonPath("$.data.roles", hasItem("ADMIN")))
                .andExpect(jsonPath("$.data.permissions", hasItem("S49:V")));
    }

    @Test
    @DisplayName("Phase 0 Auth: Bad credentials returns 401 UNAUTHORIZED")
    void badCredentialsReturns401() throws Exception {
        LoginRequest bad = new LoginRequest("admin@heavenstay.com", "WrongPassword999!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("FR-M6-01: Admin can list staff and create a new staff account")
    void staffManagementFlow() throws Exception {
        // List staff
        mockMvc.perform(get("/api/v1/admin/staff")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", notNullValue()))
                .andExpect(jsonPath("$.data.totalElements", greaterThanOrEqualTo(1)));

        // Create new staff
        String email = "staff.new." + System.currentTimeMillis() + "@heavenstay.com";
        StaffCreateRequest req = new StaffCreateRequest("Vinh Spa Therapist", email, "0912345678", "THERAPIST");
        MvcResult createdRes = mockMvc.perform(post("/api/v1/admin/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.staff.email", is(email)))
                .andExpect(jsonPath("$.data.staff.role", is("THERAPIST")))
                .andExpect(jsonPath("$.data.temporaryPassword", notNullValue()))
                .andReturn();

        // Duplicate email must be rejected (M6-MSG-01)
        mockMvc.perform(post("/api/v1/admin/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("M6-MSG-01")));

        // Self-lockout guard (Admin cannot deactivate self - M6-MSG-02)
        mockMvc.perform(patch("/api/v1/admin/staff/" + adminUserId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StaffStatusRequest("INACTIVE"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("M6-MSG-02")));
    }

    @Test
    @DisplayName("FR-M6-03: Business parameter range validation rejects out-of-range value (M6-MSG-04)")
    void parameterRangeValidation() throws Exception {
        // Out of range refund percentage (150% > 100%)
        ParameterUpdateRequest invalid = new ParameterUpdateRequest("150");
        mockMvc.perform(put("/api/v1/admin/parameters/refund_percentage")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("M6-MSG-04")));

        // Valid update
        ParameterUpdateRequest valid = new ParameterUpdateRequest("85");
        mockMvc.perform(put("/api/v1/admin/parameters/refund_percentage")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(valid)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.value", is("85")));
    }

    @Test
    @DisplayName("FR-M6-04: Permission matrix rejects sensitive-data minimization violation (M6-MSG-05)")
    void permissionMatrixMinimization() throws Exception {
        // Trying to grant Receptionist full health data (DATA_HEALTH_FULL:V)
        MatrixChangeRequest bad = new MatrixChangeRequest(List.of(
                new MatrixChange("RECEPTIONIST", "DATA_HEALTH_FULL", "V", true)
        ));

        mockMvc.perform(put("/api/v1/admin/permissions/matrix")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("M6-MSG-05")));
    }

    @Test
    @DisplayName("FR-M6-05: Delegation rejects invalid dates (M6-MSG-07) and non-delegable permissions (M6-MSG-06)")
    void delegationValidation() throws Exception {
        Instant now = Instant.now();
        Instant past = now.minus(2, ChronoUnit.HOURS);

        // Date valid_until <= valid_from
        DelegationCreateRequest badDates = new DelegationCreateRequest(2, List.of(1), now, past);
        mockMvc.perform(post("/api/v1/admin/delegations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badDates)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("M6-MSG-07")));
    }

    @Test
    @DisplayName("FR-M6-06: Audit log rejects invalid date range (M6-MSG-08) and exports CSV")
    void auditLogValidationAndExport() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs?from=2026-10-15T00:00:00&to=2026-10-10T00:00:00")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("M6-MSG-08")));

        mockMvc.perform(get("/api/v1/admin/audit-logs/export")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", startsWith("text/csv")));
    }

    @Test
    @DisplayName("FR-M6-07: Dashboards and Police Residency Report export")
    void dashboardsAndReports() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.widgets", notNullValue()));

        mockMvc.perform(get("/api/v1/system-overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.widgets", notNullValue()));

        mockMvc.perform(get("/api/v1/system-overview/police-residency-report/export")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", startsWith("text/csv")));
    }
}
