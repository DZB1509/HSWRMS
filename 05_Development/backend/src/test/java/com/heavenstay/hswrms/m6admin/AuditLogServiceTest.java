package com.heavenstay.hswrms.m6admin;

import com.heavenstay.hswrms.m6admin.entity.AuditLog;
import com.heavenstay.hswrms.m6admin.repository.AuditLogRepository;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "app.seed.demo-data=false"
})
public class AuditLogServiceTest {

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    @DisplayName("AUDIT LOG: Integer actorUserId is persisted and retrieved correctly")
    void recordWithIntegerActorUserId() {
        Integer actorId = 42;
        String action = "AUDIT_TEST_ACTION";
        String target = "Folio#999";
        String status = "SUCCESS";

        auditLogService.record(actorId, action, target, status);

        List<AuditLog> logs = auditLogRepository.findAll();
        AuditLog found = logs.stream()
                .filter(l -> action.equals(l.getAction()))
                .findFirst()
                .orElse(null);

        assertNotNull(found, "Audit log record should be found in repository");
        assertEquals(actorId, found.getActorUserId(), "Actor user ID must match Integer 42");
        assertEquals(action, found.getAction());
        assertEquals(target, found.getTargetDataType());
        assertEquals(status, found.getAccessStatus());
        assertNotNull(found.getCreatedAt());
    }

    @Test
    @DisplayName("AUDIT LOG: Long actorUserId overload converts to Integer safely")
    void recordWithLongActorUserIdOverload() {
        Long actorIdLong = 105L;
        String action = "AUDIT_TEST_LONG_OVERLOAD";
        String target = "Invoice#123";
        String status = "SUCCESS";

        auditLogService.record(actorIdLong, action, target, status);

        List<AuditLog> logs = auditLogRepository.findAll();
        AuditLog found = logs.stream()
                .filter(l -> action.equals(l.getAction()))
                .findFirst()
                .orElse(null);

        assertNotNull(found);
        assertEquals(105, found.getActorUserId());
    }

    @Test
    @DisplayName("AUDIT LOG: Null actorUserId is supported for system/unauthenticated events")
    void recordWithNullActorUserId() {
        String action = "SYSTEM_BACKGROUND_SYNC";
        String target = "SystemConfiguration";
        String status = "SUCCESS";

        auditLogService.record((Integer) null, action, target, status);

        List<AuditLog> logs = auditLogRepository.findAll();
        AuditLog found = logs.stream()
                .filter(l -> action.equals(l.getAction()))
                .findFirst()
                .orElse(null);

        assertNotNull(found);
        assertNull(found.getActorUserId());
    }

    @Test
    @DisplayName("AUDIT LOG: Overlong action and target data types are truncated to column capacities")
    void recordTruncatesOverlongFields() {
        Integer actorId = 1;
        String longAction = "A".repeat(200); // column capacity is 150
        String longTarget = "T".repeat(150); // column capacity is 100
        String status = "SUCCESS";

        auditLogService.record(actorId, longAction, longTarget, status);

        List<AuditLog> logs = auditLogRepository.findAll();
        AuditLog found = logs.stream()
                .filter(l -> l.getAction().startsWith("AAAA") && l.getAction().length() == 150)
                .findFirst()
                .orElse(null);

        assertNotNull(found, "Truncated action should match 150 chars");
        assertEquals(150, found.getAction().length());
        assertEquals(100, found.getTargetDataType().length());
    }

    @Test
    @DisplayName("AUDIT LOG: Caller transaction rollback reverts audit log entry")
    void auditLogRollsBackWithCallerTransaction() {
        String uniqueAction = "ROLLBACK_TEST_ACTION_" + System.currentTimeMillis();

        TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition());
        try {
            auditLogService.record(1, uniqueAction, "TestTarget", "PENDING");
            // Deliberately roll back
            transactionManager.rollback(status);
        } catch (Exception e) {
            transactionManager.rollback(status);
        }

        List<AuditLog> logs = auditLogRepository.findAll();
        boolean exists = logs.stream().anyMatch(l -> uniqueAction.equals(l.getAction()));
        assertFalse(exists, "Rolled-back transaction should not commit audit record to database");
    }

    @Test
    @DisplayName("AUDIT LOG: M6 8-parameter overload records actorRole, targetRefId, oldValue, newValue")
    void recordM6EnhancedFields() {
        Integer actorId = 99;
        String actorRole = "ADMIN";
        String action = "UPDATE_CONFIG";
        String targetType = "SystemConfiguration";
        String refId = "deposit_percentage";
        String status = "SUCCESS";
        String oldVal = "20";
        String newVal = "30";

        auditLogService.record(actorId, actorRole, action, targetType, refId, status, oldVal, newVal);

        List<AuditLog> logs = auditLogRepository.findAll();
        AuditLog found = logs.stream()
                .filter(l -> action.equals(l.getAction()) && refId.equals(l.getTargetRefId()))
                .findFirst()
                .orElse(null);

        assertNotNull(found);
        assertEquals(actorRole, found.getActorRole());
        assertEquals(oldVal, found.getOldValue());
        assertEquals(newVal, found.getNewValue());
    }
}
