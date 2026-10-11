package com.heavenstay.hswrms.m6admin.job;

import com.heavenstay.hswrms.m6admin.service.DelegationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically transitions manager delegations:
 * PENDING -> ACTIVE when valid_from arrives,
 * PENDING / ACTIVE -> EXPIRED when valid_until passes.
 */
@Component
public class DelegationExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(DelegationExpiryJob.class);

    private final DelegationService delegations;

    public DelegationExpiryJob(DelegationService delegations) {
        this.delegations = delegations;
    }

    @Scheduled(fixedRateString = "${app.jobs.delegation-expiry.rate:60000}")
    public void run() {
        try {
            int changed = delegations.refreshStatuses();
            if (changed > 0) {
                log.info("[DelegationExpiryJob] Updated {} delegation status(es).", changed);
            }
        } catch (Exception ex) {
            log.warn("[DelegationExpiryJob] Error updating delegation statuses: {}", ex.getMessage());
        }
    }
}
