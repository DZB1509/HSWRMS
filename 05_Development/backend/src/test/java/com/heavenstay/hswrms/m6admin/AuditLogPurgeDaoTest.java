package com.heavenstay.hswrms.m6admin;

import com.heavenstay.hswrms.m6admin.entity.AuditLog;
import com.heavenstay.hswrms.m6admin.repository.AuditLogPurgeDao;
import com.heavenstay.hswrms.m6admin.repository.AuditLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "app.seed.demo-data=false"
})
public class AuditLogPurgeDaoTest {

    @Autowired
    private AuditLogPurgeDao purgeDao;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    @DisplayName("JOB-02 / AuditLogPurgeDao: Bounded batch purge deletes only records older than cutoff up to batch size")
    void purgeBatchBoundedExecution() {
        LocalDateTime cutoff = LocalDateTime.now(ZoneOffset.UTC).minusDays(90);

        // Seed 3 old records and 1 recent record
        auditLogRepository.save(new AuditLog(1, "ADMIN", "OLD_ACTION_1", "Type", "1", "SUCCESS", null, null, null, cutoff.minusDays(5)));
        auditLogRepository.save(new AuditLog(1, "ADMIN", "OLD_ACTION_2", "Type", "2", "SUCCESS", null, null, null, cutoff.minusDays(3)));
        auditLogRepository.save(new AuditLog(1, "ADMIN", "OLD_ACTION_3", "Type", "3", "SUCCESS", null, null, null, cutoff.minusDays(1)));
        auditLogRepository.save(new AuditLog(1, "ADMIN", "RECENT_ACTION", "Type", "4", "SUCCESS", null, null, null, LocalDateTime.now(ZoneOffset.UTC)));

        // Purge with batchSize = 2
        int purged = purgeDao.purgeBatch(cutoff, 2);
        assertEquals(2, purged, "Should purge exactly batch size 2");

        // Verify that the recent action is still present
        List<AuditLog> remaining = auditLogRepository.findAll();
        boolean recentExists = remaining.stream().anyMatch(l -> "RECENT_ACTION".equals(l.getAction()));
        assertTrue(recentExists, "Recent audit log must not be purged");
    }
}
