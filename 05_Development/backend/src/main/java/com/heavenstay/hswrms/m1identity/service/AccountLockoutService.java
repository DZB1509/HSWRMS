package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m6admin.service.BusinessParameterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Manages consecutive failed login tracking, account lockout transitions,
 * and successful login resets. Uses {@link Propagation#REQUIRES_NEW} so failed attempts
 * are reliably persisted even when the outer authentication transaction throws
 * {@link org.springframework.security.authentication.BadCredentialsException}.
 */
import com.heavenstay.hswrms.m6admin.service.AuditLogService;

@Service
public class AccountLockoutService {

    private static final Logger log = LoggerFactory.getLogger(AccountLockoutService.class);

    private final UserRepository userRepository;
    private final BusinessParameterService businessParameterService;
    private final AuditLogService auditLogService;

    @Autowired
    public AccountLockoutService(UserRepository userRepository,
                                 @Autowired(required = false) BusinessParameterService businessParameterService,
                                 @Autowired(required = false) AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.businessParameterService = businessParameterService;
        this.auditLogService = auditLogService;
    }

    public int getMaxFailedLoginAttempts() {
        if (businessParameterService != null) {
            return businessParameterService.getInt(BusinessParameterService.MAX_FAILED_LOGIN_ATTEMPTS, 5);
        }
        return 5;
    }

    public int getLockoutDurationMinutes() {
        if (businessParameterService != null) {
            return businessParameterService.getInt(BusinessParameterService.LOCKOUT_DURATION_MINUTES, 10);
        }
        return 10;
    }

    /**
     * Atomically increments the failed login count for an active user and locks the account
     * if the maximum failed login threshold is reached or exceeded.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailedAttempt(Integer userId) {
        if (userId == null) {
            return;
        }
        int maxAttempts = getMaxFailedLoginAttempts();
        Instant now = Instant.now();
        int affected = userRepository.incrementFailedAttemptAndLockIfThresholdReached(userId, maxAttempts, now);
        if (affected > 0) {
            userRepository.findById(userId).ifPresent(u -> {
                if ("LOCKED".equalsIgnoreCase(u.getAccountStatus())) {
                    log.warn("[SECURITY] User account {} has been LOCKED due to {} consecutive failed sign-in attempts.",
                            userId, u.getFailedLoginCount());
                    if (auditLogService != null) {
                        auditLogService.record(userId, "System", "Account Lockout", "User",
                                String.valueOf(userId), AuditLogService.SUCCESS, "ACTIVE", "LOCKED");
                    }
                } else {
                    log.debug("Recorded failed sign-in attempt {}/{} for user {}",
                            u.getFailedLoginCount(), maxAttempts, userId);
                }
            });
        }
    }

    /**
     * Atomically resets failed login counter to 0 and records the latest successful login timestamp.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccessfulLogin(Integer userId) {
        if (userId == null) {
            return;
        }
        userRepository.recordSuccessfulLogin(userId, Instant.now());
    }

    /**
     * Atomically unlocks a locked account, resetting status to ACTIVE, failedLoginCount to 0, and lockedAt to null.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void unlockAccount(Integer userId) {
        if (userId == null) {
            return;
        }
        userRepository.unlockAccountById(userId);
        log.info("[SECURITY] User account {} has been unlocked.", userId);
        if (auditLogService != null) {
            auditLogService.record(userId, "System", "Account Unlock", "User",
                    String.valueOf(userId), AuditLogService.SUCCESS, "LOCKED", "ACTIVE");
        }
    }
}
