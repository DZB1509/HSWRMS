package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.entity.UserRole;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRoleRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;

/** FR-M6-01 / UC75 – staff accounts and role assignment using canonical M1 identity entities. */
@Service
public class StaffAccountService {

    private static final String PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService audit;

    public StaffAccountService(UserRepository userRepository,
                               RoleRepository roleRepository,
                               UserRoleRepository userRoleRepository,
                               PasswordEncoder passwordEncoder,
                               AuditLogService audit) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public PageView<StaffView> search(String q, String role, String status, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        String trimmedQuery = (q != null && !q.isBlank()) ? q.trim() : null;
        String trimmedRole = (role != null && !role.isBlank()) ? role.trim() : null;
        String trimmedStatus = (status != null && !status.isBlank()) ? status.trim() : null;

        Page<User> result = userRepository.searchStaff(trimmedQuery, trimmedRole, trimmedStatus,
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
        return roleRepository.findAll().stream()
                .filter(Role::isStaffRole)
                .map(r -> new RoleView(r.getRoleId(), r.getRoleName(), r.getDescription()))
                .toList();
    }

    @Transactional
    public StaffCreatedView create(StaffCreateRequest request, CurrentActor actor) {
        assertEmailFree(request.email(), null, actor, "Create Staff Account");
        Role role = requireStaffRole(request.role());
        String temporaryPassword = generateTemporaryPassword();

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        user.setPhoneNumber(request.phoneNumber() == null || request.phoneNumber().isBlank()
                ? null : request.phoneNumber().trim());
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        user.setAccountStatus("ACTIVE");
        user.setEmailVerified(true);
        user.setFailedLoginCount(0);

        User saved = userRepository.save(user);
        UserRole ur = new UserRole(saved, role);
        userRoleRepository.save(ur);
        saved.getUserRoles().add(ur);

        audit.record(actor, "Create Staff Account", "User", String.valueOf(saved.getUserId()),
                AuditLogService.SUCCESS, null, role.getRoleName());
        return new StaffCreatedView(toView(saved), temporaryPassword);
    }

    @Transactional
    public StaffView update(Integer id, StaffUpdateRequest request, CurrentActor actor) {
        User user = requireStaff(id);
        assertEmailFree(request.email(), id, actor, "Update Staff Account");
        Role newRole = requireStaffRole(request.role());
        String oldRole = primaryRole(user);

        if (id.equals(actor.userId()) && !newRole.isAdminRole()) {
            audit.record(actor, "Update Staff Account", "User", String.valueOf(id), AuditLogService.DENIED);
            throw selfLockout();
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        user.setPhoneNumber(request.phoneNumber() == null || request.phoneNumber().isBlank()
                ? null : request.phoneNumber().trim());

        userRoleRepository.deleteByIdUserId(id);
        UserRole ur = new UserRole(user, newRole);
        userRoleRepository.save(ur);
        user.getUserRoles().clear();
        user.getUserRoles().add(ur);

        userRepository.save(user);

        audit.record(actor, "Update Staff Account", "User", String.valueOf(id), AuditLogService.SUCCESS,
                oldRole, newRole.getRoleName());
        return toView(user);
    }

    @Transactional
    public StaffView changeStatus(Integer id, String requestedStatus, CurrentActor actor) {
        String status = requestedStatus == null ? "" : requestedStatus.trim().toUpperCase(Locale.ROOT);
        if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
            audit.record(actor, "Change Staff Account Status", "User", String.valueOf(id),
                    AuditLogService.FAILED, null, "INVALID_STATUS: " + requestedStatus);
            throw new BusinessRuleException("INVALID_STATUS", "Status must be ACTIVE or INACTIVE.");
        }
        User user = requireStaff(id);
        if ("INACTIVE".equals(status) && id.equals(actor.userId())) {
            audit.record(actor, "Deactivate Staff Account", "User", String.valueOf(id), AuditLogService.DENIED);
            throw selfLockout();
        }
        if ("INACTIVE".equals(status) && user.getUserRoles().stream().anyMatch(ur -> ur.getRole().isAdminRole())) {
            audit.record(actor, "Deactivate Staff Account", "User", String.valueOf(id), AuditLogService.DENIED);
            throw new BusinessRuleException("M6-MSG-03", "Admin accounts cannot be locked or deactivated.");
        }
        String old = user.getAccountStatus();
        user.setAccountStatus(status);
        if ("ACTIVE".equals(status)) {
            user.setFailedLoginCount(0);
            user.setLockedAt(null);
        }
        userRepository.save(user);
        audit.record(actor, "INACTIVE".equals(status) ? "Deactivate Staff Account" : "Activate Staff Account",
                "User", String.valueOf(id), AuditLogService.SUCCESS, old, status);
        return toView(user);
    }

    private User requireStaff(Integer id) {
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff account", "id", id));
        boolean staff = user.getUserRoles().stream().anyMatch(ur -> ur.getRole().isStaffRole());
        if (!staff) {
            throw new ResourceNotFoundException("Staff account", "id", id);
        }
        return user;
    }

    private Role requireStaffRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            throw new ResourceNotFoundException("Role", "name", roleName);
        }
        String normalized = roleName.trim().toUpperCase(Locale.ROOT);
        String withPrefix = normalized.startsWith("ROLE_") ? normalized : "ROLE_" + normalized;
        String withoutPrefix = normalized.startsWith("ROLE_") ? normalized.substring(5) : normalized;

        return roleRepository.findByRoleName(withPrefix)
                .or(() -> roleRepository.findByRoleName(withoutPrefix))
                .filter(Role::isStaffRole)
                .orElseThrow(() -> new ResourceNotFoundException("Staff role", "name", roleName));
    }

    private void assertEmailFree(String email, Integer excludeId, CurrentActor actor, String action) {
        userRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT))
                .ifPresent(existing -> {
                    if (excludeId == null || !existing.getUserId().equals(excludeId)) {
                        if (actor != null) {
                            audit.record(actor, action, "User", email, AuditLogService.FAILED, null, "M6-MSG-01: Duplicate email");
                        }
                        throw new ConflictException("M6-MSG-01", "Email is already registered by another account.");
                    }
                });
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

    private static String primaryRole(User user) {
        return user.getUserRoles().stream()
                .map(ur -> ur.getRole().canonicalName())
                .sorted()
                .findFirst()
                .orElse(null);
    }

    static StaffView toView(User u) {
        return new StaffView(u.getUserId(), u.getFullName(), u.getEmail(), u.getPhoneNumber(), primaryRole(u),
                u.getAccountStatus(), u.getLastLoginAt(), u.getCreatedAt());
    }
}
