package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.UserAccount;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
import com.heavenstay.hswrms.m1identity.repository.UserAccountRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Public identity API of M1. Other modules (e.g. M6 staff administration) must go through this
 * service instead of injecting identity repositories directly.
 */
@Service
public class IdentityAccountService {

    private final UserAccountRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;

    public IdentityAccountService(UserAccountRepository users, RoleRepository roles, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.roles = roles;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<UserAccount> searchStaff(String q, String roleName, String status, Pageable pageable) {
        Specification<UserAccount> spec = (root, query, cb) -> {
            query.distinct(true);
            Join<UserAccount, Role> role = root.join("roles");
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.notEqual(cb.upper(role.get("roleName")), Role.CUSTOMER));
            if (roleName != null && !roleName.isBlank()) {
                String wanted = Role.canonical(roleName);
                if (Role.FNB_STAFF.equals(wanted)) {
                    predicates.add(cb.or(
                            cb.equal(cb.upper(role.get("roleName")), Role.FNB_STAFF),
                            cb.equal(cb.upper(role.get("roleName")), "F&B STAFF")));
                } else {
                    predicates.add(cb.equal(cb.upper(role.get("roleName")), wanted));
                }
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("accountStatus"), status.trim().toUpperCase(Locale.ROOT)));
            }
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), like),
                        cb.like(cb.lower(root.get("email")), like)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return users.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public UserAccount get(Integer userId) {
        return users.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    @Transactional(readOnly = true)
    public Optional<UserAccount> findByEmail(String email) {
        return users.findByEmailIgnoreCase(email);
    }

    @Transactional(readOnly = true)
    public boolean isActive(Integer userId) {
        return users.findById(userId).map(UserAccount::isActive).orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean emailTakenByAnother(String email, Integer excludeUserId) {
        return users.findByEmailIgnoreCase(email)
                .map(u -> excludeUserId == null || !u.getUserId().equals(excludeUserId))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<Role> staffRoles() {
        return roles.findAll().stream().filter(Role::isStaffRole).toList();
    }

    @Transactional(readOnly = true)
    public List<Role> allRoles() {
        return roles.findAll();
    }

    @Transactional(readOnly = true)
    public Role requireStaffRole(String roleName) {
        String wanted = Role.canonical(roleName == null ? "" : roleName);
        Role role = roles.findAll().stream()
                .filter(r -> wanted.equals(r.canonicalName()))
                .findFirst()
                .orElseThrow(() -> new BusinessRuleException("INVALID_ROLE", "The selected role does not exist."));
        if (!role.isStaffRole()) {
            throw new BusinessRuleException("INVALID_ROLE", "Customer is not a staff role.");
        }
        return role;
    }

    @Transactional
    public UserAccount save(UserAccount account) {
        return users.save(account);
    }

    /** Creates a staff account that is immediately ACTIVE (staff do not self-register). */
    @Transactional
    public UserAccount createStaff(String fullName, String email, String phone, Role role, String rawPassword) {
        UserAccount account = new UserAccount();
        account.setFullName(fullName.trim());
        account.setEmail(email.trim().toLowerCase(Locale.ROOT));
        account.setPhoneNumber(phone == null || phone.isBlank() ? null : phone.trim());
        account.setPasswordHash(passwordEncoder.encode(rawPassword));
        account.setAccountStatus(UserAccount.ACTIVE);
        account.setEmailVerified(true);
        account.getRoles().add(role);
        return users.save(account);
    }

    @Transactional
    public Role ensureRole(String roleName, String description) {
        String wanted = Role.canonical(roleName == null ? "" : roleName);
        return roles.findAll().stream()
                .filter(r -> wanted.equals(r.canonicalName()))
                .findFirst()
                .orElseGet(() -> roles.save(new Role(roleName, description)));
    }

    @Transactional(readOnly = true)
    public long countByStatus(String status) {
        return users.countByAccountStatus(status);
    }

    @Transactional(readOnly = true)
    public long countActiveByRole(String roleName) {
        return users.countActiveByRole(roleName);
    }

    @Transactional(readOnly = true)
    public long countAll() {
        return users.count();
    }

    /** JOB-01: unlock accounts locked longer than {@code lockoutMinutes}. Returns unlocked count. */
    @Transactional
    public int unlockExpiredLockedAccounts(int lockoutMinutes) {
        LocalDateTime threshold = LocalDateTime.now(ZoneOffset.UTC).minusMinutes(lockoutMinutes);
        return users.unlockLockedBefore(threshold);
    }

    public boolean passwordMatches(String raw, String hash) {
        return hash != null && passwordEncoder.matches(raw, hash);
    }
}
