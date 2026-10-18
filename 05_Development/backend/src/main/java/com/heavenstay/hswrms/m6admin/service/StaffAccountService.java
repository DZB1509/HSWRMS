package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.UserAccount;
import com.heavenstay.hswrms.m1identity.service.IdentityAccountService;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.PageView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.RoleView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffCreateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffCreatedView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffUpdateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffView;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;

/** FR-M6-01 / UC75 – staff accounts and (single) role assignment. */
@Service
public class StaffAccountService {

    private static final String PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final IdentityAccountService identity;
    private final AuditLogService audit;

    public StaffAccountService(IdentityAccountService identity, AuditLogService audit) {
        this.identity = identity;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public PageView<StaffView> search(String q, String role, String status, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        Page<UserAccount> result = identity.searchStaff(q, role, status,
                PageRequest.of(Math.max(page, 0), safeSize, Sort.by("fullName").ascending()));
        return new PageView<>(result.getContent().stream().map(StaffAccountService::toView).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public StaffView get(Integer id) {
        return toView(requireStaff(id));
    }

    @Transactional(readOnly = true)
    public List<RoleView> staffRoles() {
        return identity.staffRoles().stream()
                .map(r -> new RoleView(r.getRoleId(), r.getRoleName(), r.getDescription())).toList();
    }

    @Transactional
    public StaffCreatedView create(StaffCreateRequest request, CurrentActor actor) {
        assertEmailFree(request.email(), null);
        Role role = identity.requireStaffRole(request.role());
        String temporaryPassword = generateTemporaryPassword();
        UserAccount created = identity.createStaff(request.fullName(), request.email(), request.phoneNumber(),
                role, temporaryPassword);
        audit.record(actor, "Create Staff Account", "User", String.valueOf(created.getUserId()),
                AuditLogService.SUCCESS, null, role.getRoleName());
        return new StaffCreatedView(toView(created), temporaryPassword);
    }

    @Transactional
    public StaffView update(Integer id, StaffUpdateRequest request, CurrentActor actor) {
        UserAccount account = requireStaff(id);
        assertEmailFree(request.email(), id);
        Role newRole = identity.requireStaffRole(request.role());
        String oldRole = primaryRole(account);

        if (id.equals(actor.userId()) && !newRole.isAdminRole()) {
            audit.record(actor, "Update Staff Account", "User", String.valueOf(id), AuditLogService.DENIED);
            throw selfLockout();
        }

        account.setFullName(request.fullName().trim());
        account.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        account.setPhoneNumber(request.phoneNumber() == null || request.phoneNumber().isBlank()
                ? null : request.phoneNumber().trim());
        account.getRoles().clear();
        account.getRoles().add(newRole);
        identity.save(account);

        audit.record(actor, "Update Staff Account", "User", String.valueOf(id), AuditLogService.SUCCESS,
                oldRole, newRole.getRoleName());
        return toView(account);
    }

    @Transactional
    public StaffView changeStatus(Integer id, String requestedStatus, CurrentActor actor) {
        String status = requestedStatus == null ? "" : requestedStatus.trim().toUpperCase(Locale.ROOT);
        if (!UserAccount.ACTIVE.equals(status) && !UserAccount.INACTIVE.equals(status)) {
            throw new BusinessRuleException("INVALID_STATUS", "Status must be ACTIVE or INACTIVE.");
        }
        UserAccount account = requireStaff(id);
        if (UserAccount.INACTIVE.equals(status) && id.equals(actor.userId())) {
            audit.record(actor, "Deactivate Staff Account", "User", String.valueOf(id), AuditLogService.DENIED);
            throw selfLockout();
        }
        if (UserAccount.INACTIVE.equals(status) && account.getRoles().stream().anyMatch(Role::isAdminRole)) {
            audit.record(actor, "Deactivate Staff Account", "User", String.valueOf(id), AuditLogService.DENIED);
            throw new BusinessRuleException("M6-MSG-03", "Admin accounts cannot be locked or deactivated.");
        }
        String old = account.getAccountStatus();
        account.setAccountStatus(status);
        if (UserAccount.ACTIVE.equals(status)) {
            account.setFailedLoginCount(0);
            account.setLockedAt(null);
        }
        identity.save(account);
        audit.record(actor, UserAccount.INACTIVE.equals(status) ? "Deactivate Staff Account" : "Activate Staff Account",
                "User", String.valueOf(id), AuditLogService.SUCCESS, old, status);
        return toView(account);
    }

    private UserAccount requireStaff(Integer id) {
        UserAccount account = identity.get(id);
        boolean staff = account.getRoles().stream().anyMatch(Role::isStaffRole);
        if (!staff) {
            throw new com.heavenstay.hswrms.common.exception.ResourceNotFoundException("Staff account", "id", id);
        }
        return account;
    }

    private void assertEmailFree(String email, Integer excludeId) {
        if (identity.emailTakenByAnother(email.trim(), excludeId)) {
            throw new ConflictException("M6-MSG-01", "Email is already registered by another account.");
        }
    }

    private static BusinessRuleException selfLockout() {
        return new BusinessRuleException("M6-MSG-02", "You cannot deactivate your own account or remove your Admin role.");
    }

    private static String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(14);
        for (int i = 0; i < 14; i++) {
            sb.append(PASSWORD_ALPHABET.charAt(RANDOM.nextInt(PASSWORD_ALPHABET.length())));
        }
        return sb.toString();
    }

    private static String primaryRole(UserAccount account) {
        return account.getRoles().stream().map(Role::canonicalName).sorted().findFirst().orElse(null);
    }

    static StaffView toView(UserAccount a) {
        return new StaffView(a.getUserId(), a.getFullName(), a.getEmail(), a.getPhoneNumber(), primaryRole(a),
                a.getAccountStatus(),
                a.getLastLoginAt() == null ? null : a.getLastLoginAt().toInstant(ZoneOffset.UTC),
                a.getCreatedAt() == null ? null : a.getCreatedAt().toInstant(ZoneOffset.UTC));
    }
}
