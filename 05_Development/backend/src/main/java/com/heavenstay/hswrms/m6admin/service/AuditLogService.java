package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.m6admin.entity.AuditLog;
import com.heavenstay.hswrms.m6admin.entity.RightDelegation;
import com.heavenstay.hswrms.m6admin.repository.AuditLogRepository;
import com.heavenstay.hswrms.m6admin.repository.RightDelegationRepository;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Writes append-only audit rows. Runs inside the caller's transaction so a rolled-back
 * business operation never leaves an audit row claiming it succeeded.
 */
@Service
public class AuditLogService {

    public static final String SUCCESS = "SUCCESS";
    public static final String DENIED = "DENIED";
    public static final String FAILED = "FAILED";

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);
    private static final Logger auditLog = LoggerFactory.getLogger("hswrms.audit");

    private final AuditLogRepository repository;
    private final RightDelegationRepository delegations;

    public AuditLogService(AuditLogRepository repository, RightDelegationRepository delegations) {
        this.repository = repository;
        this.delegations = delegations;
    }

    // ==================== M5 / Baseline Compatible Methods ====================

    /** Records an action attributed to the authenticated user (null actor for system/webhook callers). */
    @Transactional
    public void record(String action, String targetDataType, String accessStatus) {
        record(currentUserId(), action, targetDataType, accessStatus);
    }

    @Transactional
    public void record(Integer actorUserId, String action, String targetDataType, String accessStatus) {
        record(actorUserId, null, action, targetDataType, null, accessStatus, null, null);
    }

    @Transactional
    public void record(Long actorUserId, String action, String targetDataType, String accessStatus) {
        record(actorUserId != null ? actorUserId.intValue() : null, action, targetDataType, accessStatus);
    }

    // ==================== M6 Enhanced Audit Methods ====================

    @Transactional
    public void record(Integer actorUserId, String actorRole, String action, String targetDataType,
                       String targetRefId, String accessStatus, String oldValue, String newValue) {
        try {
            Integer delegationId = resolveDelegation(actorUserId, actorRole);
            repository.save(new AuditLog(
                    actorUserId,
                    truncate(actorRole, 50),
                    truncate(action, 150),
                    truncate(targetDataType, 100),
                    truncate(targetRefId, 100),
                    truncate(accessStatus, 50),
                    truncate(oldValue, 500),
                    truncate(newValue, 500),
                    delegationId,
                    LocalDateTime.now(ZoneOffset.UTC)
            ));
            auditLog.info("actor={} role={} action=\"{}\" target={} ref={} status={}",
                    actorUserId, actorRole, action, targetDataType, targetRefId, accessStatus);
        } catch (Exception ex) {
            log.warn("Could not write audit log record [action={}, target={}]: {}", action, targetDataType, ex.getMessage());
        }
    }

    public void record(CurrentActor actor, String action, String targetDataType, String targetRefId, String status) {
        record(actor.userId(), actor.role(), action, targetDataType, targetRefId, status, null, null);
    }

    public void record(CurrentActor actor, String action, String targetDataType, String targetRefId,
                       String status, String oldValue, String newValue) {
        record(actor.userId(), actor.role(), action, targetDataType, targetRefId, status, oldValue, newValue);
    }

    /** Active delegation reference for non-admin actors (every delegated action is audited with it). */
    private Integer resolveDelegation(Integer actorUserId, String actorRole) {
        if (actorUserId == null || actorRole == null || actorRole.toUpperCase().contains("ADMIN") || delegations == null) {
            return null;
        }
        try {
            LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
            List<RightDelegation> active = delegations
                    .findByReceivedByManagerUserIdAndDelegationStatusAndValidFromLessThanEqualAndValidUntilGreaterThanEqualOrderByDelegationIdAsc(
                            actorUserId, RightDelegation.ACTIVE, now, now);
            return active.isEmpty() ? null : active.get(0).getDelegationId();
        } catch (Exception ex) {
            log.debug("Delegation lookup failed: {}", ex.getMessage());
            return null;
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> search(AuditFilter filter, Pageable pageable) {
        return repository.findAll(toSpec(filter), pageable);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> searchAll(AuditFilter filter, int limit) {
        return repository.findAll(toSpec(filter),
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt", "auditLogId")))
                .getContent();
    }

    @Transactional(readOnly = true)
    public Optional<AuditLog> find(Long id) {
        return repository.findById(id);
    }

    @Transactional(readOnly = true)
    public long countDeniedSince(LocalDateTime since) {
        return repository.countByAccessStatusAndCreatedAtAfter(DENIED, since);
    }

    @Transactional(readOnly = true)
    public long countSince(LocalDateTime since) {
        return repository.count((root, q, cb) -> cb.greaterThan(root.get("createdAt"), since));
    }

    private Specification<AuditLog> toSpec(AuditFilter f) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (f.from() != null) p.add(cb.greaterThanOrEqualTo(root.get("createdAt"), f.from()));
            if (f.to() != null) p.add(cb.lessThanOrEqualTo(root.get("createdAt"), f.to()));
            if (f.actorUserId() != null) p.add(cb.equal(root.get("actorUserId"), f.actorUserId()));
            if (notBlank(f.role())) p.add(cb.like(cb.upper(root.get("actorRole")), "%" + f.role().trim().toUpperCase() + "%"));
            if (notBlank(f.action())) p.add(cb.like(cb.lower(root.get("action")), "%" + f.action().trim().toLowerCase() + "%"));
            if (notBlank(f.dataType())) p.add(cb.equal(cb.lower(root.get("targetDataType")), f.dataType().trim().toLowerCase()));
            if (notBlank(f.status())) p.add(cb.equal(cb.upper(root.get("accessStatus")), f.status().trim().toUpperCase()));
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    private static Integer currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails details) {
            return details.getUserId();
        }
        return null;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    public record AuditFilter(LocalDateTime from, LocalDateTime to, Integer actorUserId, String role,
                              String action, String dataType, String status) {
    }
}
