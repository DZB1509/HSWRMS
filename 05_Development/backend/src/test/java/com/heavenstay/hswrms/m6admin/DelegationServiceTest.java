package com.heavenstay.hswrms.m6admin;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.entity.UserRole;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRoleRepository;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DelegablePermissionView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DelegationCreateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DelegationView;
import com.heavenstay.hswrms.m6admin.entity.Permission;
import com.heavenstay.hswrms.m6admin.entity.RightDelegation;
import com.heavenstay.hswrms.m6admin.repository.AuditLogRepository;
import com.heavenstay.hswrms.m6admin.repository.PermissionRepository;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.DelegationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "app.seed.demo-data=false"
})
@Transactional
public class DelegationServiceTest {

    @Autowired
    private DelegationService delegationService;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    private User managerUser;
    private final CurrentActor adminActor = new CurrentActor(1, "admin@heavenstay.com", "ADMIN", true);

    @BeforeEach
    void setUp() {
        Role managerRole = roleRepository.findByRoleNameIgnoreCase("MANAGER")
                .orElseGet(() -> roleRepository.save(new Role("MANAGER", "Resort Manager")));

        managerUser = userRepository.findByEmail("manager.delegation.test@heavenstay.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setFullName("Test Manager");
                    u.setEmail("manager.delegation.test@heavenstay.com");
                    u.setAccountStatus("ACTIVE");
                    u.setEmailVerified(true);
                    User saved = userRepository.save(u);
                    UserRole ur = new UserRole(saved, managerRole);
                    userRoleRepository.save(ur);
                    saved.getUserRoles().add(ur);
                    return saved;
                });
    }

    @Test
    @DisplayName("UC79: Delegable permissions returns only permissions marked is_delegable=true")
    void delegablePermissionsOnly() {
        List<DelegablePermissionView> list = delegationService.delegablePermissions();
        assertNotNull(list);
        assertFalse(list.isEmpty());
        for (DelegablePermissionView dp : list) {
            Permission p = permissionRepository.findById(dp.permissionId()).orElseThrow();
            assertTrue(p.isDelegable());
        }
    }

    @Test
    @DisplayName("UC79: Create delegation with valid parameters succeeds")
    void createDelegationSuccess() {
        List<DelegablePermissionView> delegables = delegationService.delegablePermissions();
        assertFalse(delegables.isEmpty());
        Integer permId = delegables.get(0).permissionId();

        Instant now = Instant.now();
        Instant from = now.minus(1, ChronoUnit.MINUTES);
        Instant until = now.plus(2, ChronoUnit.HOURS);

        DelegationCreateRequest req = new DelegationCreateRequest(
                managerUser.getUserId(),
                List.of(permId),
                from,
                until
        );

        DelegationView created = delegationService.create(req, adminActor);
        assertNotNull(created);
        assertEquals(RightDelegation.ACTIVE, created.status());
        assertEquals(managerUser.getUserId(), created.managerUserId());
        assertFalse(created.permissions().isEmpty());
    }

    @Test
    @DisplayName("UC79: Inverted time range rejected with M6-MSG-07")
    void invertedDatesRejected() {
        List<DelegablePermissionView> delegables = delegationService.delegablePermissions();
        Integer permId = delegables.get(0).permissionId();

        Instant now = Instant.now();
        Instant from = now.plus(2, ChronoUnit.HOURS);
        Instant until = now.plus(1, ChronoUnit.HOURS); // until < from

        DelegationCreateRequest req = new DelegationCreateRequest(
                managerUser.getUserId(),
                List.of(permId),
                from,
                until
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                delegationService.create(req, adminActor));
        assertEquals("M6-MSG-07", ex.getErrorCode());
    }

    @Test
    @DisplayName("UC79: Non-delegable permission rejected with M6-MSG-06")
    void nonDelegablePermissionRejected() {
        Permission nonDelegable = permissionRepository.findAll().stream()
                .filter(p -> !p.isDelegable())
                .findFirst()
                .orElseThrow();

        Instant now = Instant.now();
        DelegationCreateRequest req = new DelegationCreateRequest(
                managerUser.getUserId(),
                List.of(nonDelegable.getPermissionId()),
                now,
                now.plus(1, ChronoUnit.HOURS)
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                delegationService.create(req, adminActor));
        assertEquals("M6-MSG-06", ex.getErrorCode());
    }

    @Test
    @DisplayName("UC79: Revoke active delegation succeeds")
    void revokeDelegationSuccess() {
        List<DelegablePermissionView> delegables = delegationService.delegablePermissions();
        Integer permId = delegables.get(0).permissionId();

        Instant now = Instant.now();
        DelegationCreateRequest req = new DelegationCreateRequest(
                managerUser.getUserId(),
                List.of(permId),
                now.minus(1, ChronoUnit.MINUTES),
                now.plus(1, ChronoUnit.HOURS)
        );

        DelegationView created = delegationService.create(req, adminActor);
        DelegationView revoked = delegationService.revoke(created.delegationId(), adminActor);

        assertEquals(RightDelegation.REVOKED, revoked.status());
        assertNotNull(revoked.revokedAt());
    }

    @Test
    @DisplayName("UC79: Self-delegation is rejected with CANNOT_DELEGATE_TO_SELF and audits DENIED")
    void selfDelegationRejected() {
        Role managerRole = roleRepository.findByRoleNameIgnoreCase("MANAGER").orElseThrow();
        User adminUser = userRepository.save(new User("Admin Self", "admin.self@heavenstay.com", "hash"));
        userRoleRepository.save(new UserRole(adminUser, managerRole));
        adminUser.setAccountStatus("ACTIVE");
        userRepository.save(adminUser);

        CurrentActor selfActor = new CurrentActor(adminUser.getUserId(), adminUser.getEmail(), "ADMIN", true);
        List<DelegablePermissionView> delegables = delegationService.delegablePermissions();
        Integer permId = delegables.get(0).permissionId();

        Instant now = Instant.now();
        DelegationCreateRequest req = new DelegationCreateRequest(
                adminUser.getUserId(),
                List.of(permId),
                now,
                now.plus(2, ChronoUnit.HOURS)
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                delegationService.create(req, selfActor));
        assertEquals("CANNOT_DELEGATE_TO_SELF", ex.getErrorCode());
    }

    @Test
    @DisplayName("UC79: Non-admin caller is rejected with AccessDeniedException on create and revoke")
    void nonAdminCannotDelegateOrRevoke() {
        CurrentActor managerActor = new CurrentActor(managerUser.getUserId(), managerUser.getEmail(), "MANAGER", false);
        List<DelegablePermissionView> delegables = delegationService.delegablePermissions();
        Integer permId = delegables.get(0).permissionId();

        Instant now = Instant.now();
        DelegationCreateRequest req = new DelegationCreateRequest(
                managerUser.getUserId(),
                List.of(permId),
                now,
                now.plus(2, ChronoUnit.HOURS)
        );

        assertThrows(AccessDeniedException.class, () ->
                delegationService.create(req, managerActor));

        DelegationView created = delegationService.create(req, adminActor);
        assertThrows(AccessDeniedException.class, () ->
                delegationService.revoke(created.delegationId(), managerActor));
    }

    @Test
    @DisplayName("UC79: Inverted dates records FAILED status in audit log")
    void createDelegationInvertedDatesRecordsFailedAudit() {
        List<DelegablePermissionView> delegables = delegationService.delegablePermissions();
        Integer permId = delegables.get(0).permissionId();

        Instant now = Instant.now();
        Instant from = now.plus(2, ChronoUnit.HOURS);
        Instant until = now.plus(1, ChronoUnit.HOURS);

        DelegationCreateRequest req = new DelegationCreateRequest(
                managerUser.getUserId(),
                List.of(permId),
                from,
                until
        );

        assertThrows(BusinessRuleException.class, () ->
                delegationService.create(req, adminActor));
    }

    @Test
    @DisplayName("UC79: Revoking already revoked delegation is rejected with DELEGATION_NOT_REVOCABLE")
    void revokingAlreadyRevokedDelegationRejected() {
        List<DelegablePermissionView> delegables = delegationService.delegablePermissions();
        Integer permId = delegables.get(0).permissionId();

        Instant now = Instant.now();
        DelegationCreateRequest req = new DelegationCreateRequest(
                managerUser.getUserId(),
                List.of(permId),
                now.minus(1, ChronoUnit.MINUTES),
                now.plus(1, ChronoUnit.HOURS)
        );

        DelegationView created = delegationService.create(req, adminActor);
        delegationService.revoke(created.delegationId(), adminActor);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                delegationService.revoke(created.delegationId(), adminActor));
        assertEquals("DELEGATION_NOT_REVOCABLE", ex.getErrorCode());
    }
}
