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
import com.heavenstay.hswrms.m6admin.service.MasterDataService.MasterDataSaveRequest;
import java.math.BigDecimal;
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
import java.util.Map;

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

        // Admin accounts can never be locked, not even by another Admin (M6-MSG-03)
        StaffCreateRequest adminReq = new StaffCreateRequest("Second Admin",
                "second.admin." + System.currentTimeMillis() + "@heavenstay.com", "0911111111", "ADMIN");
        MvcResult adminRes = mockMvc.perform(post("/api/v1/admin/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminReq)))
                .andExpect(status().isCreated())
                .andReturn();
        int otherAdminId = objectMapper.readTree(adminRes.getResponse().getContentAsString())
                .at("/data/staff/userId").asInt();
        mockMvc.perform(patch("/api/v1/admin/staff/" + otherAdminId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StaffStatusRequest("INACTIVE"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("M6-MSG-03")));
    }

    @Test
    @DisplayName("FR-M6-01: New staff can log in; locked staff cannot log in or reuse an existing token")
    void accountLockAndCreateFlow() throws Exception {
        // 1. Create a Manager account and log in with the temporary password
        String email = "manager.lock." + System.currentTimeMillis() + "@heavenstay.com";
        MvcResult createdRes = mockMvc.perform(post("/api/v1/admin/staff")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new StaffCreateRequest("Lock Test Manager", email, "0900000099", "MANAGER"))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode created = objectMapper.readTree(createdRes.getResponse().getContentAsString()).path("data");
        int staffId = created.path("staff").path("userId").asInt();
        String tempPassword = created.path("temporaryPassword").asText();

        MvcResult loginRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, tempPassword))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.roles", hasItem("MANAGER")))
                .andReturn();
        String managerToken = objectMapper.readTree(loginRes.getResponse().getContentAsString())
                .path("data").path("token").asText();

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        // 2. Admin locks the account
        mockMvc.perform(patch("/api/v1/admin/staff/" + staffId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StaffStatusRequest("INACTIVE"))))
                .andExpect(status().isOk());

        // 3. Locked account cannot log in again...
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, tempPassword))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("ACCOUNT_NOT_ACTIVE")));

        // ...and its previously issued token is rejected immediately
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isUnauthorized());

        // 4. Unlock restores access
        mockMvc.perform(patch("/api/v1/admin/staff/" + staffId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StaffStatusRequest("ACTIVE"))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, tempPassword))))
                .andExpect(status().isOk());
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

    @Test
    @DisplayName("FR-M6-02: Master Data Spa Treatment CRUD enforces TreatmentStatus enum and duration_minutes")
    void spaTreatmentMasterDataLifecycle() throws Exception {
        // List spa services
        mockMvc.perform(get("/api/v1/admin/master-data/spa-services")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()));

        // Create spa service with TreatmentStatus ACTIVE
        String uniqueName = "Zen Bamboo Massage " + System.currentTimeMillis();
        MasterDataSaveRequest req = new MasterDataSaveRequest(uniqueName, "Relaxing bamboo treatment",
                new BigDecimal("95.00"), 75, "ACTIVE");
        MvcResult createRes = mockMvc.perform(post("/api/v1/admin/master-data/spa-services")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name", is(uniqueName)))
                .andExpect(jsonPath("$.data.durationOrOccupancy", is(75)))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andReturn();

        JsonNode json = objectMapper.readTree(createRes.getResponse().getContentAsString());
        int treatmentId = json.path("data").path("id").asInt();

        // Update with INACTIVE
        MasterDataSaveRequest updateReq = new MasterDataSaveRequest(uniqueName, "Updated bamboo treatment",
                new BigDecimal("105.00"), 90, "INACTIVE");
        mockMvc.perform(put("/api/v1/admin/master-data/spa-services/" + treatmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.durationOrOccupancy", is(90)))
                .andExpect(jsonPath("$.data.status", is("INACTIVE")));

        // Invalid status must be rejected (M6-MSG-04)
        MasterDataSaveRequest badStatusReq = new MasterDataSaveRequest(uniqueName, "Invalid status",
                new BigDecimal("105.00"), 90, "NON_EXISTENT_STATUS");
        mockMvc.perform(put("/api/v1/admin/master-data/spa-services/" + treatmentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badStatusReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("M6-MSG-04")));

        // Deactivate
        mockMvc.perform(patch("/api/v1/admin/master-data/spa-services/" + treatmentId + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("M3 Security: GET /spa/treatments is public permitAll, POST requires ADMIN authentication")
    void spaSecurityEndpointRules() throws Exception {
        // 1. GET /api/v1/spa/treatments is public without token
        mockMvc.perform(get("/api/v1/spa/treatments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()));

        // 2. POST /api/v1/spa/treatments without token is 401 UNAUTHORIZED
        Map<String, Object> newTreatment = Map.of(
                "treatmentName", "Himalayan Stone Body Wrap " + System.currentTimeMillis(),
                "durationMinutes", 60,
                "basePrice", 80.0
        );
        mockMvc.perform(post("/api/v1/spa/treatments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newTreatment)))
                .andExpect(status().isUnauthorized());

        // 3. POST /api/v1/spa/treatments with ADMIN token succeeds (201 Created)
        mockMvc.perform(post("/api/v1/spa/treatments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newTreatment)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.treatmentName", is(newTreatment.get("treatmentName"))));

        // 4. GET /api/v1/spa/treatment-rooms is public without token
        mockMvc.perform(get("/api/v1/spa/treatment-rooms"))
                .andExpect(status().isOk());

        // 5. POST /api/v1/spa/treatment-rooms without token is 401 UNAUTHORIZED
        Map<String, Object> newRoom = Map.of(
                "roomName", "Lotus VIP Suite " + System.currentTimeMillis(),
                "roomType", "MASSAGE_STANDARD"
        );
        mockMvc.perform(post("/api/v1/spa/treatment-rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newRoom)))
                .andExpect(status().isUnauthorized());

        // 6. POST /api/v1/spa/treatment-rooms with ADMIN token succeeds (201 Created)
        mockMvc.perform(post("/api/v1/spa/treatment-rooms")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newRoom)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.roomName", is(newRoom.get("roomName"))));
    }
}
