package com.heavenstay.hswrms.m6admin.job;

import com.heavenstay.hswrms.m6admin.repository.AuditLogPurgeDao;
import com.heavenstay.hswrms.m6admin.service.BusinessParameterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * 2.2 Clean Up Old Audit Log Entries (JOB-02)
 * Trigger: Scheduled — daily at 2:00 AM.
 * Purpose: Removes audit log entries older than the configured retention period (default: 90 days)
 * in batches of up to 5,000 records per run to avoid database locking.
 */
@Component
public class AuditLogCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(AuditLogCleanupJob.class);
    private static final int BATCH_SIZE = 5000;

    private final AuditLogPurgeDao purgeDao;
    private final BusinessParameterService parameters;

    public AuditLogCleanupJob(AuditLogPurgeDao purgeDao, BusinessParameterService parameters) {
        this.purgeDao = purgeDao;
        this.parameters = parameters;
    }

    @Scheduled(cron = "${app.jobs.audit-cleanup.cron:0 0 2 * * *}")
    public void run() {
        int retentionDays = parameters.getInt(BusinessParameterService.AUDIT_LOG_RETENTION_DAYS, 90);
        LocalDateTime cutoff = LocalDateTime.now(ZoneOffset.UTC).minusDays(retentionDays);

        int totalDeleted = 0;
        int batchCount = 0;

        try {
            while (true) {
                int deleted = purgeDao.purgeBatch(cutoff, BATCH_SIZE);
                if (deleted == 0) {
                    break;
                }
                totalDeleted += deleted;
                batchCount++;
                log.info("[JOB-02] Batch {}: Purged {} audit records older than {} days (cutoff: {}).",
                        batchCount, deleted, retentionDays, cutoff);

                if (deleted < BATCH_SIZE) {
                    break;
                }
                // Small sleep between batches to yield database locks
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }

            if (totalDeleted > 0) {
                log.info("[JOB-02] Completed: Purged {} total audit log records in {} batches.", totalDeleted, batchCount);
            } else {
                log.debug("[JOB-02] No audit log records older than {} days found.", retentionDays);
            }
        } catch (Exception ex) {
            log.warn("[JOB-02] Warning during audit log batch purge: {}. Job will retry at next schedule.", ex.getMessage(), ex);
        }
    }
}
