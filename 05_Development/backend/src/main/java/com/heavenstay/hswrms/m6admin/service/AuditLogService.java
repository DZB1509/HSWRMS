package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.m6admin.entity.AuditLogEntity;
import com.heavenstay.hswrms.m6admin.repository.AuditLogRepository;
import com.heavenstay.hswrms.security.CustomUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Writes append-only audit rows. Runs inside the caller's transaction so a rolled-back
 * business operation never leaves an audit row claiming it succeeded.
 */
@Service
public class AuditLogService {

    private static final Logger auditLog = LoggerFactory.getLogger("hswrms.audit");

    private final AuditLogRepository repository;

    public AuditLogService(AuditLogRepository repository) {
        this.repository = repository;
    }

    /** Records an action attributed to the authenticated user (null actor for system/webhook callers). */
    @Transactional
    public void record(String action, String targetDataType, String accessStatus) {
        record(currentUserId(), action, targetDataType, accessStatus);
    }

    @Transactional
    public void record(Long actorUserId, String action, String targetDataType, String accessStatus) {
        repository.save(new AuditLogEntity(actorUserId, truncate(action, 150), truncate(targetDataType, 100), accessStatus));
        auditLog.info("actor={} action=\"{}\" target={} status={}", actorUserId, action, targetDataType, accessStatus);
    }

    private static Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails details
                && details.getUserId() != null) {
            return details.getUserId().longValue();
        }
        return null;
    }

    private static String truncate(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}
