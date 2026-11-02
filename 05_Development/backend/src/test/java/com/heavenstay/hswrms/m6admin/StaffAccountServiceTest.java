package com.heavenstay.hswrms.m6admin;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.entity.UserRole;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRoleRepository;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.PageView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffCreateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffCreatedView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffUpdateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffView;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.StaffAccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "app.seed.demo-data=false"
})
@Transactional
public class StaffAccountServiceTest {

    @Autowired
    private StaffAccountService staffAccountService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    private User adminUser;
    private CurrentActor adminActor;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByRoleNameIgnoreCase("ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("ADMIN", "System Admin")));

        adminUser = userRepository.findByEmail("admin.test@heavenstay.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setFullName("Super Admin");
                    u.setEmail("admin.test@heavenstay.com");
                    u.setAccountStatus("ACTIVE");
                    u.setEmailVerified(true);
                    User saved = userRepository.save(u);
                    UserRole ur = new UserRole(saved, adminRole);
                    userRoleRepository.save(ur);
                    saved.getUserRoles().add(ur);
                    return saved;
                });

        adminActor = new CurrentActor(adminUser.getUserId(), adminUser.getEmail(), "ADMIN", true);
    }

    @Test
    @DisplayName("UC75: Create staff account succeeds and generates temporary password")
    void createStaffAccountSuccess() {
        StaffCreateRequest req = new StaffCreateRequest(
                "Receptionist Jane",
                "jane.receptionist@heavenstay.com",
                "0901234567",
                "RECEPTIONIST"
        );

        StaffCreatedView result = staffAccountService.create(req, adminActor);

        assertNotNull(result);
        assertNotNull(result.staff());
        assertEquals("Receptionist Jane", result.staff().fullName());
        assertEquals("jane.receptionist@heavenstay.com", result.staff().email());
        assertEquals("RECEPTIONIST", result.staff().role());
        assertNotNull(result.temporaryPassword());
        assertEquals(14, result.temporaryPassword().length());
    }

    @Autowired
    private com.heavenstay.hswrms.m6admin.repository.AuditLogRepository auditLogRepository;

    @Test
    @DisplayName("UC75: Duplicate email is rejected with M6-MSG-01 and records FAILED audit")
    void createStaffAccountDuplicateEmail() {
        StaffCreateRequest req = new StaffCreateRequest(
                "Jane Duplicate",
                adminUser.getEmail(),
                "0909999999",
                "RECEPTIONIST"
        );

        ConflictException ex = assertThrows(ConflictException.class, () ->
                staffAccountService.create(req, adminActor));
        assertEquals("M6-MSG-01", ex.getConflictCode());

        // Verify FAILED audit is recorded
        assertTrue(auditLogRepository.findAll().stream()
                .anyMatch(l -> "Create Staff Account".equals(l.getAction())
                        && "FAILED".equals(l.getAccessStatus())
                        && adminUser.getEmail().equals(l.getTargetRefId())));
    }

    @Test
    @DisplayName("UC75: Invalid status string is rejected and records FAILED audit")
    void changeStatusInvalidStatusRecordsFailedAudit() {
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                staffAccountService.changeStatus(adminUser.getUserId(), "NOT_A_STATUS", adminActor));
        assertEquals("INVALID_STATUS", ex.getErrorCode());

        assertTrue(auditLogRepository.findAll().stream()
                .anyMatch(l -> "Change Staff Account Status".equals(l.getAction())
                        && "FAILED".equals(l.getAccessStatus())
                        && String.valueOf(adminUser.getUserId()).equals(l.getTargetRefId())));
    }

    @Test
    @DisplayName("UC75: Self-lockout prevention (M6-MSG-02) when admin removes own admin role")
    void updateStaffAccountSelfLockout() {
        StaffUpdateRequest req = new StaffUpdateRequest(
                "Admin Rename",
                adminUser.getEmail(),
                "0900000000",
                "RECEPTIONIST" // Demoting self
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                staffAccountService.update(adminUser.getUserId(), req, adminActor));
        assertEquals("M6-MSG-02", ex.getErrorCode());
    }

    @Test
    @DisplayName("UC75: Deactivate admin account rejected with M6-MSG-03")
    void deactivateAdminAccountRejected() {
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                staffAccountService.changeStatus(adminUser.getUserId(), "INACTIVE", adminActor));
        // Either M6-MSG-02 (self) or M6-MSG-03 (admin)
        assertTrue("M6-MSG-02".equals(ex.getErrorCode()) || "M6-MSG-03".equals(ex.getErrorCode()));
    }

    @Test
    @DisplayName("UC75: Search staff accounts returns paginated staff views")
    void searchStaffAccounts() {
        PageView<StaffView> result = staffAccountService.search(null, null, "ACTIVE", 0, 10);
        assertNotNull(result);
        assertTrue(result.totalElements() > 0);
    }
}
