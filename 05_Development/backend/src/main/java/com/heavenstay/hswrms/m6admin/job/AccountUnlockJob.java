package com.heavenstay.hswrms.m6admin.job;

import com.heavenstay.hswrms.m1identity.service.IdentityAccountService;
import com.heavenstay.hswrms.m6admin.service.BusinessParameterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 2.1 Unlock Expired Locked Accounts (JOB-01)
 * Trigger: Scheduled — every 15 minutes.
 * Purpose: Automatically unlocks accounts that were locked after failed sign-in attempts,
 * once the lockout duration has elapsed (default: 10 minutes, configurable via parameters).
 * Failure behavior: Retries up to 3 times with 30-second intervals if database is unreachable.
 */
@Component
public class AccountUnlockJob {

    private static final Logger log = LoggerFactory.getLogger(AccountUnlockJob.class);

    private final IdentityAccountService identity;
    private final BusinessParameterService parameters;

    public AccountUnlockJob(IdentityAccountService identity, BusinessParameterService parameters) {
        this.identity = identity;
        this.parameters = parameters;
    }

    @Scheduled(cron = "${app.jobs.account-unlock.cron:0 */15 * * * *}")
    public void run() {
        int lockoutMinutes = parameters.getInt(BusinessParameterService.LOCKOUT_DURATION_MINUTES, 10);
        int attempts = 0;
        int maxRetries = 3;

        while (attempts < maxRetries) {
            try {
                int unlocked = identity.unlockExpiredLockedAccounts(lockoutMinutes);
                if (unlocked > 0) {
                    log.info("[JOB-01] Successfully unlocked {} accounts locked for > {} minutes.", unlocked, lockoutMinutes);
                } else {
                    log.debug("[JOB-01] No expired locked accounts found in this run.");
                }
                return;
            } catch (Exception ex) {
                attempts++;
                log.warn("[JOB-01] Database error during unlock attempt {}/{}: {}", attempts, maxRetries, ex.getMessage());
                if (attempts >= maxRetries) {
                    log.error("[JOB-01] Critical failure: Database unreachable after {} retries. Accounts remain locked until next run.", maxRetries, ex);
                } else {
                    try {
                        Thread.sleep(30000); // 30-second retry interval per SRS
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                }
            }
        }
    }
}
