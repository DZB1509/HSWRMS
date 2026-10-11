package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.UserAccount;
import com.heavenstay.hswrms.m1identity.service.IdentityAccountService;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DelegablePermissionView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DelegationCreateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DelegationView;
import com.heavenstay.hswrms.m6admin.entity.Permission;
import com.heavenstay.hswrms.m6admin.entity.RightDelegation;
import com.heavenstay.hswrms.m6admin.entity.RightDelegationPermission;
import com.heavenstay.hswrms.m6admin.repository.PermissionRepository;
import com.heavenstay.hswrms.m6admin.repository.RightDelegationPermissionRepository;
import com.heavenstay.hswrms.m6admin.repository.RightDelegationRepository;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/** FR-M6-05 / UC79 – limited, time-bound delegation of selected admin rights to a Manager. */
@Service
public class DelegationService {

    private static final Logger log = LoggerFactory.getLogger(DelegationService.class);

    private final RightDelegationRepository delegations;
    private final RightDelegationPermissionRepository delegationPermissions;
    private final PermissionRepository permissions;
    private final IdentityAccountService identity;
    private final AuditLogService audit;

    public DelegationService(RightDelegationRepository delegations,
                             RightDelegationPermissionRepository delegationPermissions,
                             PermissionRepository permissions, IdentityAccountService identity,
                             AuditLogService audit) {
        this.delegations = delegations;
        this.delegationPermissions = delegationPermissions;
        this.permissions = permissions;
        this.identity = identity;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<DelegablePermissionView> delegablePermissions() {
        return permissions.findAllByOrderByModuleOrScreenAscActionTypeAsc().stream()
                .filter(Permission::isDelegable)
                .map(p -> new DelegablePermissionView(p.getPermissionId(), p.getModuleOrScreen(), p.getActionType()))
                .toList();
    }

    @Transactional
    public List<DelegationView> list() {
        refreshStatuses();
        return delegations.findAllByOrderByDelegationIdDesc().stream().map(this::toView).toList();
    }

    @Transactional
    public DelegationView create(DelegationCreateRequest request, CurrentActor actor) {
        UserAccount manager = identity.get(request.managerUserId());
        if (!manager.hasRole(Role.MANAGER) || !manager.isActive()) {
            throw new BusinessRuleException("INVALID_DELEGATE", "Delegation target must be an active Manager.");
        }

        LocalDateTime validFrom = utc(request.validFrom());
        LocalDateTime validUntil = utc(request.validUntil());
        if (!validUntil.isAfter(validFrom)) {
            throw new BusinessRuleException("M6-MSG-07", "Expiration time must be later than effective start time.");
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (!validUntil.isAfter(now)) {
            throw new BusinessRuleException("DELEGATION_PERIOD_PAST", "The delegation period has already ended.");
        }

        Set<Integer> ids = new LinkedHashSet<>(request.permissionIds());
        List<Permission> selected = ids.stream().map(id -> permissions.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "id", id))).toList();
        for (Permission p : selected) {
            if (!p.isDelegable()) {
                audit.record(actor, "Create Delegation", "RightDelegation", p.code(), AuditLogService.DENIED);
                throw new BusinessRuleException("M6-MSG-06", "The selected permission cannot be delegated.");
            }
        }

        String status = validFrom.isAfter(now) ? RightDelegation.PENDING : RightDelegation.ACTIVE;
        RightDelegation saved = delegations.save(new RightDelegation(actor.userId(), manager.getUserId(),
                validFrom, validUntil, status));
        for (Permission p : selected) {
            delegationPermissions.save(new RightDelegationPermission(saved.getDelegationId(), p.getPermissionId()));
        }
        // SRS: "notifies the Manager" – delivered by the Notification adapter in Phase 8; logged until then.
        log.info("Delegation {} created for manager {} ({} .. {})", saved.getDelegationId(), manager.getEmail(),
                validFrom, validUntil);
        audit.record(actor, "Create Delegation", "RightDelegation", String.valueOf(saved.getDelegationId()),
                AuditLogService.SUCCESS, null,
                selected.stream().map(Permission::code).sorted().reduce((a, b) -> a + "," + b).orElse(""));
        return toView(saved);
    }

    @Transactional
    public DelegationView revoke(Integer delegationId, CurrentActor actor) {
        RightDelegation d = delegations.findById(delegationId)
                .orElseThrow(() -> new ResourceNotFoundException("Delegation", "id", delegationId));
        refreshStatuses();
        if (!RightDelegation.ACTIVE.equals(d.getDelegationStatus()) && !RightDelegation.PENDING.equals(d.getDelegationStatus())) {
            throw new BusinessRuleException("DELEGATION_NOT_REVOCABLE",
                    "Only Active or Pending delegations can be revoked.");
        }
        String old = d.getDelegationStatus();
        d.setDelegationStatus(RightDelegation.REVOKED);
        d.setRevokedAt(LocalDateTime.now(ZoneOffset.UTC));
        d.setRevokedByAdminUserId(actor.userId());
        delegations.save(d);
        audit.record(actor, "Revoke Delegation", "RightDelegation", String.valueOf(delegationId),
                AuditLogService.SUCCESS, old, RightDelegation.REVOKED);
        return toView(d);
    }

    /** PENDING -> ACTIVE when the period starts; PENDING/ACTIVE -> EXPIRED when valid_until passes. */
    @Transactional
    public int refreshStatuses() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        int changed = 0;
        for (RightDelegation d : delegations.findByDelegationStatusIn(
                List.of(RightDelegation.PENDING, RightDelegation.ACTIVE))) {
            if (d.getValidUntil().isBefore(now)) {
                d.setDelegationStatus(RightDelegation.EXPIRED);
                delegations.save(d);
                changed++;
            } else if (RightDelegation.PENDING.equals(d.getDelegationStatus()) && !d.getValidFrom().isAfter(now)) {
                d.setDelegationStatus(RightDelegation.ACTIVE);
                delegations.save(d);
                changed++;
            }
        }
        return changed;
    }

    @Transactional(readOnly = true)
    public long countActive() {
        return delegations.countByDelegationStatus(RightDelegation.ACTIVE);
    }

    private DelegationView toView(RightDelegation d) {
        List<String> codes = delegationPermissions.findByIdDelegationId(d.getDelegationId()).stream()
                .map(dp -> permissions.findById(dp.getId().getPermissionId()).map(Permission::code).orElse("?"))
                .sorted().toList();
        String managerName = identity.get(d.getReceivedByManagerUserId()).getFullName();
        return new DelegationView(d.getDelegationId(), d.getReceivedByManagerUserId(), managerName,
                d.getGrantedByAdminUserId(), d.getValidFrom().toInstant(ZoneOffset.UTC),
                d.getValidUntil().toInstant(ZoneOffset.UTC), d.getDelegationStatus(), codes,
                d.getRevokedAt() == null ? null : d.getRevokedAt().toInstant(ZoneOffset.UTC));
    }

    private static LocalDateTime utc(Instant instant) {
        return LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
    }
}
