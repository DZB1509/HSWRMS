package com.heavenstay.hswrms.m6admin;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.ParameterView;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.BusinessParameterService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "app.seed.demo-data=false"
})
@Transactional
public class BusinessParameterServiceTest {

    @Autowired
    private BusinessParameterService parameterService;

    @Autowired
    private com.heavenstay.hswrms.m6admin.repository.SystemConfigurationRepository configurationRepository;

    @Autowired
    private com.heavenstay.hswrms.m6admin.service.AuditLogService auditLogService;

    @Autowired
    private com.heavenstay.hswrms.m6admin.repository.AuditLogRepository auditLogRepository;

    private final CurrentActor adminActor = new CurrentActor(1, "admin@heavenstay.com", "ADMIN", true);
    private final CurrentActor managerActor = new CurrentActor(2, "manager@heavenstay.com", "MANAGER", false);

    @Test
    @DisplayName("UC77: List parameters returns initialized business parameters")
    void listParameters() {
        List<ParameterView> list = parameterService.list();
        assertNotNull(list);
        assertFalse(list.isEmpty());
        assertTrue(list.stream().anyMatch(p -> BusinessParameterService.CANCELLATION_WINDOW_HOURS.equals(p.key())));
    }

    @Test
    @DisplayName("UC77: Admin can update valid business parameter")
    void updateValidParameter() {
        ParameterView updated = parameterService.update(
                BusinessParameterService.REFUND_PERCENTAGE, "75", adminActor);

        assertNotNull(updated);
        assertEquals("75", updated.value());
        assertEquals(75, parameterService.getInt(BusinessParameterService.REFUND_PERCENTAGE, 0));
    }

    @Test
    @DisplayName("UC77: Out of range or invalid numeric parameter rejected with M6-MSG-04 and records FAILED audit")
    void updateOutOfRangeParameter() {
        // max refund percentage is 100
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                parameterService.update(BusinessParameterService.REFUND_PERCENTAGE, "150", adminActor));
        assertEquals("M6-MSG-04", ex.getErrorCode());

        // Verify FAILED status is logged in AuditLog
        assertTrue(auditLogRepository.findAll().stream()
                .anyMatch(l -> "Update Business Parameter".equals(l.getAction())
                        && "SystemConfiguration".equals(l.getTargetDataType())
                        && "FAILED".equals(l.getAccessStatus())
                        && "150".equals(l.getNewValue())));

        // non-integer
        BusinessRuleException ex2 = assertThrows(BusinessRuleException.class, () ->
                parameterService.update(BusinessParameterService.REFUND_PERCENTAGE, "invalid_num", adminActor));
        assertEquals("M6-MSG-04", ex2.getErrorCode());
    }

    @Test
    @DisplayName("UC77: Manager cannot update non-manager-editable parameter")
    void managerCannotUpdateNonEditableParameter() {
        // MAX_FAILED_LOGIN_ATTEMPTS is managerEditable=false
        assertThrows(AccessDeniedException.class, () ->
                parameterService.update(BusinessParameterService.MAX_FAILED_LOGIN_ATTEMPTS, "6", managerActor));
    }

    @Test
    @DisplayName("UC77: Manager without delegation cannot update manager-editable parameter")
    void managerWithoutDelegationCannotUpdateEditableParameter() {
        // Manager actor without S50:U delegation -> AccessDeniedException
        CurrentActor nonDelegatedManager = new CurrentActor(999999, "other.manager@heavenstay.com", "MANAGER", false);
        assertThrows(AccessDeniedException.class, () ->
                parameterService.update(BusinessParameterService.REFUND_PERCENTAGE, "50", nonDelegatedManager));
    }

    @Test
    @DisplayName("UC77: Fail-closed principle - Manager rejected when PermissionService is null")
    void managerDeniedWhenPermissionServiceIsNullFailClosed() {
        BusinessParameterService serviceWithoutPerm = new BusinessParameterService(
                configurationRepository, auditLogService, null);

        // Non-admin manager must be rejected with AccessDeniedException even for manager-editable parameter
        assertThrows(AccessDeniedException.class, () ->
                serviceWithoutPerm.update(BusinessParameterService.REFUND_PERCENTAGE, "60", managerActor));

        // Audit log must record DENIED
        assertTrue(auditLogRepository.findAll().stream()
                .anyMatch(l -> "Update Business Parameter".equals(l.getAction())
                        && "DENIED".equals(l.getAccessStatus())
                        && BusinessParameterService.REFUND_PERCENTAGE.equals(l.getTargetRefId())));

        // Admin can still update when PermissionService is null because admin does not rely on delegated permissions
        ParameterView adminUpdated = serviceWithoutPerm.update(
                BusinessParameterService.REFUND_PERCENTAGE, "65", adminActor);
        assertNotNull(adminUpdated);
        assertEquals("65", adminUpdated.value());
    }
}
