package com.heavenstay.hswrms.m6admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.entity.UserRole;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRoleRepository;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DelegationCreateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.ParameterUpdateRequest;
import com.heavenstay.hswrms.m6admin.entity.Permission;
import com.heavenstay.hswrms.m6admin.entity.RightDelegation;
import com.heavenstay.hswrms.m6admin.entity.RightDelegationPermission;
import com.heavenstay.hswrms.m6admin.repository.PermissionRepository;
import com.heavenstay.hswrms.m6admin.repository.RightDelegationPermissionRepository;
import com.heavenstay.hswrms.m6admin.repository.RightDelegationRepository;
import com.heavenstay.hswrms.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.seed.demo-data=false"
})
@AutoConfigureMockMvc
public class AdminControllersSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private RightDelegationRepository delegationRepository;

    @Autowired
    private RightDelegationPermissionRepository delegationPermissionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.heavenstay.hswrms.m6admin.service.StaffAccountService staffAccountService;

    @Autowired
    private com.heavenstay.hswrms.m6admin.repository.SystemConfigurationRepository configRepository;

    @Autowired
    private com.heavenstay.hswrms.m6admin.service.AuditLogService auditLogService;

    @Autowired
    private com.heavenstay.hswrms.m6admin.security.PermissionEvaluator permissionEvaluator;

    private User managerUser;
    private User adminUser;
    private String managerToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        Role managerRole = roleRepository.findByRoleNameIgnoreCase("Manager")
                .orElseGet(() -> roleRepository.saveAndFlush(new Role("Manager", "Manager role")));
        Role adminRole = roleRepository.findByRoleNameIgnoreCase("Admin")
                .orElseGet(() -> roleRepository.saveAndFlush(new Role("Admin", "Admin role")));

        long ts = System.currentTimeMillis();
        managerUser = new User("Manager Test " + ts, "mgr." + ts + "@heavenstay.com", "enc_hash");
        managerUser.setAccountStatus("ACTIVE");
        managerUser.setEmailVerified(true);
        managerUser = userRepository.saveAndFlush(managerUser);
        userRoleRepository.saveAndFlush(new UserRole(managerUser, managerRole));

        adminUser = new User("Admin Test " + ts, "admin." + ts + "@heavenstay.com", "enc_hash");
        adminUser.setAccountStatus("ACTIVE");
        adminUser.setEmailVerified(true);
        adminUser = userRepository.saveAndFlush(adminUser);
        userRoleRepository.saveAndFlush(new UserRole(adminUser, adminRole));

        managerToken = jwtTokenProvider.generateToken(
                managerUser.getUserId(), managerUser.getEmail(), managerUser.getFullName(), List.of("MANAGER"));
        adminToken = jwtTokenProvider.generateToken(
                adminUser.getUserId(), adminUser.getEmail(), adminUser.getFullName(), List.of("ADMIN"));
    }

    @Test
    @DisplayName("SECURITY-01: Unauthenticated requests to /api/v1/admin/** are rejected with 401 Unauthorized")
    void unauthenticatedAdminRequestsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/admin/staff"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/parameters"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/permissions/matrix"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/delegations"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/audit-logs"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "customer@heavenstay.com", roles = {"CUSTOMER"})
    @DisplayName("SECURITY-02: Customer role requests to /api/v1/admin/** are rejected with 403 Forbidden")
    void customerForbiddenFromAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/staff"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/parameters"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/permissions/matrix"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/delegations"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/audit-logs"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SECURITY-03: Manager WITHOUT delegation is rejected with 403 Forbidden on admin operations")
    void managerWithoutDelegation_isForbiddenFromAdminOperations() throws Exception {
        // Staff operations (S10:V) require delegation or admin
        mockMvc.perform(get("/api/v1/admin/staff")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        // Parameter viewing (S50:V)
        mockMvc.perform(get("/api/v1/admin/parameters")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        // Matrix viewing (S51:V)
        mockMvc.perform(get("/api/v1/admin/permissions/matrix")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        // Delegation list (S52:V)
        mockMvc.perform(get("/api/v1/admin/delegations")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        // Audit log list (S53:V)
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SECURITY-04: Manager WITH ACTIVE delegation succeeds on delegated operation (200 OK)")
    void managerWithActiveDelegation_canAccessDelegatedOperation() throws Exception {
        Permission pParamView = permissionRepository.findByModuleOrScreenAndActionType("S50", "V").orElseThrow();

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        RightDelegation delegation = new RightDelegation(
                adminUser.getUserId(),
                managerUser.getUserId(),
                now.minusHours(1),
                now.plusHours(24),
                RightDelegation.ACTIVE
        );
        delegation = delegationRepository.saveAndFlush(delegation);
        delegationPermissionRepository.saveAndFlush(
                new RightDelegationPermission(delegation.getDelegationId(), pParamView.getPermissionId()));

        mockMvc.perform(get("/api/v1/admin/parameters")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("SECURITY-05: Manager with EXPIRED or REVOKED delegation is rejected with 403 Forbidden")
    void managerWithExpiredOrRevokedDelegation_isForbidden() throws Exception {
        Permission pParamView = permissionRepository.findByModuleOrScreenAndActionType("S50", "V").orElseThrow();

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        // Expired delegation: valid until 1 hour ago
        RightDelegation expired = new RightDelegation(
                adminUser.getUserId(),
                managerUser.getUserId(),
                now.minusHours(5),
                now.minusHours(1),
                RightDelegation.EXPIRED
        );
        expired = delegationRepository.saveAndFlush(expired);
        delegationPermissionRepository.saveAndFlush(
                new RightDelegationPermission(expired.getDelegationId(), pParamView.getPermissionId()));

        mockMvc.perform(get("/api/v1/admin/parameters")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        // Revoked delegation
        RightDelegation revoked = new RightDelegation(
                adminUser.getUserId(),
                managerUser.getUserId(),
                now.minusHours(1),
                now.plusHours(24),
                RightDelegation.REVOKED
        );
        revoked.setRevokedAt(now);
        revoked.setRevokedByAdminUserId(adminUser.getUserId());
        revoked = delegationRepository.saveAndFlush(revoked);
        delegationPermissionRepository.saveAndFlush(
                new RightDelegationPermission(revoked.getDelegationId(), pParamView.getPermissionId()));

        mockMvc.perform(get("/api/v1/admin/parameters")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SECURITY-06: Manager with S50:U delegation CANNOT update security parameters (manager_editable = false)")
    void managerCannotUpdateSecurityParameters() throws Exception {
        Permission pParamUpdate = permissionRepository.findByModuleOrScreenAndActionType("S50", "U").orElseThrow();

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        RightDelegation delegation = new RightDelegation(
                adminUser.getUserId(),
                managerUser.getUserId(),
                now.minusHours(1),
                now.plusHours(24),
                RightDelegation.ACTIVE
        );
        delegation = delegationRepository.saveAndFlush(delegation);
        delegationPermissionRepository.saveAndFlush(
                new RightDelegationPermission(delegation.getDelegationId(), pParamUpdate.getPermissionId()));

        // 1. Attempting to update a non-manager-editable security parameter (max_failed_login_attempts) -> 403 Forbidden
        ParameterUpdateRequest badReq = new ParameterUpdateRequest("7");
        mockMvc.perform(put("/api/v1/admin/parameters/max_failed_login_attempts")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isForbidden());

        // 2. Updating a manager-editable parameter (refund_percentage) -> 200 OK
        ParameterUpdateRequest goodReq = new ParameterUpdateRequest("75");
        mockMvc.perform(put("/api/v1/admin/parameters/refund_percentage")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goodReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.value", is("75")));
    }

    @Test
    @DisplayName("SECURITY-07: Admin attempting to delegate an admin-only/non-delegable permission is rejected (M6-MSG-06)")
    void delegatingNonDelegablePermission_isRejectedWithM6Msg06() throws Exception {
        // S51:G (Matrix configuration) has is_delegable = false
        Permission pMatrix = permissionRepository.findByModuleOrScreenAndActionType("S51", "G").orElseThrow();

        Instant now = Instant.now();
        DelegationCreateRequest req = new DelegationCreateRequest(
                managerUser.getUserId(),
                List.of(pMatrix.getPermissionId()),
                now,
                now.plus(48, ChronoUnit.HOURS)
        );

        mockMvc.perform(post("/api/v1/admin/delegations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("M6-MSG-06")));
    }

    @Test
    @DisplayName("SECURITY-08: Admin role can access all admin endpoints (200 OK)")
    void adminCanAccessAllAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/staff")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/parameters")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/permissions/matrix")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/delegations")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title", is("Administrator Governance Cockpit")))
                .andExpect(jsonPath("$.data.widgets").isArray());

        mockMvc.perform(get("/api/v1/admin/dashboard/system-overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title", is("System Operational Overview")))
                .andExpect(jsonPath("$.data.widgets[0].key", is("auditActivity")))
                .andExpect(jsonPath("$.data.widgets[0].available", is(true)))
                .andExpect(jsonPath("$.data.widgets[1].key", is("businessParameters")))
                .andExpect(jsonPath("$.data.widgets[1].available", is(true)))
                .andExpect(jsonPath("$.data.widgets[2].key", is("managerDelegations")))
                .andExpect(jsonPath("$.data.widgets[2].available", is(true)));
    }

    @Test
    @DisplayName("SECURITY-09: Manager cannot access S49 Admin Dashboard without delegation (403 Forbidden)")
    void managerCannotAccessAdminDashboardWithoutDelegation() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SECURITY-10: Manager can access S55 System Overview (200 OK, admin widgets hidden)")
    void managerCanAccessSystemOverview() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard/system-overview")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title", is("System Operational Overview")))
                .andExpect(jsonPath("$.data.widgets[0].key", is("auditActivity")))
                .andExpect(jsonPath("$.data.widgets[0].available", is(true)))
                .andExpect(jsonPath("$.data.widgets[1].key", is("businessParameters")))
                .andExpect(jsonPath("$.data.widgets[1].available", is(false)))
                .andExpect(jsonPath("$.data.widgets[1].note", is("Requires administrative widgets permission")))
                .andExpect(jsonPath("$.data.widgets[2].key", is("managerDelegations")))
                .andExpect(jsonPath("$.data.widgets[2].available", is(false)))
                .andExpect(jsonPath("$.data.widgets[2].note", is("Requires administrative widgets permission")));
    }

    @Test
    @DisplayName("SECURITY-11: Admin attempting to self-delegate is rejected with CANNOT_DELEGATE_TO_SELF")
    void adminCannotSelfDelegate() throws Exception {
        // Also assign Manager role to admin user to test self-delegation block
        Role managerRole = roleRepository.findByRoleNameIgnoreCase("Manager").orElseThrow();
        userRoleRepository.saveAndFlush(new UserRole(adminUser, managerRole));

        Permission pParamView = permissionRepository.findByModuleOrScreenAndActionType("S50", "V").orElseThrow();
        Instant now = Instant.now();
        DelegationCreateRequest selfReq = new DelegationCreateRequest(
                adminUser.getUserId(),
                List.of(pParamView.getPermissionId()),
                now,
                now.plus(24, ChronoUnit.HOURS)
        );

        mockMvc.perform(post("/api/v1/admin/delegations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(selfReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("CANNOT_DELEGATE_TO_SELF")));
    }

    @Test
    @DisplayName("SECURITY-12: Revoking an already revoked delegation is rejected with DELEGATION_NOT_REVOCABLE")
    void revokeAlreadyRevokedDelegationRejected() throws Exception {
        Permission pParamView = permissionRepository.findByModuleOrScreenAndActionType("S50", "V").orElseThrow();
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        RightDelegation delegation = new RightDelegation(
                adminUser.getUserId(),
                managerUser.getUserId(),
                now.minusHours(1),
                now.plusHours(24),
                RightDelegation.ACTIVE
        );
        delegation = delegationRepository.saveAndFlush(delegation);
        delegationPermissionRepository.saveAndFlush(
                new RightDelegationPermission(delegation.getDelegationId(), pParamView.getPermissionId()));

        // First revocation -> 200 OK
        mockMvc.perform(post("/api/v1/admin/delegations/" + delegation.getDelegationId() + "/revoke")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Second revocation -> 400 Bad Request with DELEGATION_NOT_REVOCABLE
        mockMvc.perform(post("/api/v1/admin/delegations/" + delegation.getDelegationId() + "/revoke")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("DELEGATION_NOT_REVOCABLE")));
    }

    @Test
    @DisplayName("SECURITY-13: Manager WITH S55_ADMIN_WIDGETS delegation can view admin widgets on S55 System Overview")
    void managerWithDelegatedAdminWidgets_canViewAdminWidgets() throws Exception {
        Permission pAdminWidgets = permissionRepository.findByModuleOrScreenAndActionType("S55_ADMIN_WIDGETS", "V").orElseThrow();

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        RightDelegation delegation = new RightDelegation(
                adminUser.getUserId(),
                managerUser.getUserId(),
                now.minusHours(1),
                now.plusHours(24),
                RightDelegation.ACTIVE
        );
        delegation = delegationRepository.saveAndFlush(delegation);
        delegationPermissionRepository.saveAndFlush(
                new RightDelegationPermission(delegation.getDelegationId(), pAdminWidgets.getPermissionId()));

        mockMvc.perform(get("/api/v1/admin/dashboard/system-overview")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.widgets[0].key", is("auditActivity")))
                .andExpect(jsonPath("$.data.widgets[0].available", is(true)))
                .andExpect(jsonPath("$.data.widgets[1].key", is("businessParameters")))
                .andExpect(jsonPath("$.data.widgets[1].available", is(true)))
                .andExpect(jsonPath("$.data.widgets[2].key", is("managerDelegations")))
                .andExpect(jsonPath("$.data.widgets[2].available", is(true)));
    }

    @Test
    @DisplayName("SECURITY-14: Fail-closed principle - AdminDashboardController masks widgets without NPE when PermissionService is null")
    void systemOverview_failClosedWhenPermissionServiceIsNull() {
        com.heavenstay.hswrms.m6admin.controller.AdminDashboardController controllerWithoutPerm =
                new com.heavenstay.hswrms.m6admin.controller.AdminDashboardController(
                        staffAccountService, configRepository, delegationRepository, auditLogService, permissionEvaluator, null);

        try {
            // 1. Manager actor: widgets masked without NPE
            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            new com.heavenstay.hswrms.security.CustomUserDetails(
                                    managerUser.getUserId(), managerUser.getEmail(), "", "Manager", true, List.of("MANAGER")),
                            null,
                            List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_MANAGER"))));

            var managerResponse = controllerWithoutPerm.getSystemOverview();
            org.junit.jupiter.api.Assertions.assertNotNull(managerResponse.getBody());
            var managerWidgets = managerResponse.getBody().getData().widgets();
            org.junit.jupiter.api.Assertions.assertFalse(managerWidgets.get(1).available());
            org.junit.jupiter.api.Assertions.assertNull(managerWidgets.get(1).value());
            org.junit.jupiter.api.Assertions.assertEquals("Requires administrative widgets permission", managerWidgets.get(1).note());
            org.junit.jupiter.api.Assertions.assertFalse(managerWidgets.get(2).available());
            org.junit.jupiter.api.Assertions.assertNull(managerWidgets.get(2).value());
            org.junit.jupiter.api.Assertions.assertEquals("Requires administrative widgets permission", managerWidgets.get(2).note());

            // 2. Admin actor: admin retains full widget access without relying on PermissionService
            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            new com.heavenstay.hswrms.security.CustomUserDetails(
                                    adminUser.getUserId(), adminUser.getEmail(), "", "Admin", true, List.of("ADMIN")),
                            null,
                            List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))));

            var adminResponse = controllerWithoutPerm.getSystemOverview();
            org.junit.jupiter.api.Assertions.assertNotNull(adminResponse.getBody());
            var adminWidgets = adminResponse.getBody().getData().widgets();
            org.junit.jupiter.api.Assertions.assertTrue(adminWidgets.get(1).available());
            org.junit.jupiter.api.Assertions.assertNotNull(adminWidgets.get(1).value());
            org.junit.jupiter.api.Assertions.assertTrue(adminWidgets.get(2).available());
            org.junit.jupiter.api.Assertions.assertNotNull(adminWidgets.get(2).value());
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }
}
