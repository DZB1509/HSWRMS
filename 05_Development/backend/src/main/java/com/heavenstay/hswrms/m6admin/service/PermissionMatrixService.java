package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MatrixChange;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MatrixDiffEntry;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MatrixRow;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MatrixView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.RoleView;
import com.heavenstay.hswrms.m6admin.entity.Permission;
import com.heavenstay.hswrms.m6admin.entity.RolePermission;
import com.heavenstay.hswrms.m6admin.repository.PermissionRepository;
import com.heavenstay.hswrms.m6admin.repository.RolePermissionRepository;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** FR-M6-04 / UC81 – role × (screen, action) permission matrix with protected rules. */
@Service
public class PermissionMatrixService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissions;
    private final RolePermissionRepository rolePermissions;
    private final AuditLogService audit;

    public PermissionMatrixService(RoleRepository roleRepository, PermissionRepository permissions,
                                   RolePermissionRepository rolePermissions, AuditLogService audit) {
        this.roleRepository = roleRepository;
        this.permissions = permissions;
        this.rolePermissions = rolePermissions;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public MatrixView getMatrix() {
        List<Role> roles = roleRepository.findAll();
        Map<Integer, Set<Integer>> granted = loadGrants();
        List<MatrixRow> rows = new ArrayList<>();
        for (Permission p : permissions.findAllByOrderByModuleOrScreenAscActionTypeAsc()) {
            Map<String, Boolean> grants = new LinkedHashMap<>();
            for (Role r : roles) {
                grants.put(r.getRoleName(), granted.getOrDefault(r.getRoleId(), Set.of()).contains(p.getPermissionId()));
            }
            List<String> locked = PermissionCatalog.ADMIN_LOCKED_SCREENS.contains(p.getModuleOrScreen())
                    ? List.of(Role.ADMIN) : List.of();
            rows.add(new MatrixRow(p.getPermissionId(), p.getModuleOrScreen(), p.getActionType(),
                    p.isDelegable(), p.isAdminOnly(), grants, locked));
        }
        return new MatrixView(roles.stream()
                .map(r -> new RoleView(r.getRoleId(), r.getRoleName(), r.getDescription())).toList(), rows);
    }

    /** Validates the change set and returns the effective diff without persisting anything. */
    @Transactional(readOnly = true)
    public List<MatrixDiffEntry> preview(List<MatrixChange> changes) {
        return plan(changes).stream().map(Planned::diff).toList();
    }

    @Transactional
    public List<MatrixDiffEntry> apply(List<MatrixChange> changes, CurrentActor actor) {
        if (!actor.admin()) {
            audit.record(actor, "Change Permission Matrix", "RolePermission", "-", AuditLogService.DENIED);
            throw new org.springframework.security.access.AccessDeniedException("Only administrators can modify the permission matrix.");
        }

        List<Planned> planned;
        try {
            planned = plan(changes);
        } catch (BusinessRuleException ex) {
            audit.record(actor, "Change Permission Matrix", "RolePermission", "-", AuditLogService.DENIED,
                    null, ex.getErrorCode());
            throw ex;
        }
        for (Planned p : planned) {
            RolePermission.Id id = new RolePermission.Id(p.role().getRoleId(), p.permission().getPermissionId());
            if (p.diff().to()) {
                rolePermissions.save(new RolePermission(id.getRoleId(), id.getPermissionId()));
            } else {
                rolePermissions.deleteById(id);
            }
            audit.record(actor, "Change Permission Matrix", "RolePermission",
                    p.role().getRoleName() + ":" + p.permission().code(), AuditLogService.SUCCESS,
                    p.diff().from() ? "GRANTED" : "REVOKED", p.diff().to() ? "GRANTED" : "REVOKED");
        }
        return planned.stream().map(Planned::diff).toList();
    }

    private record Planned(Role role, Permission permission, MatrixDiffEntry diff) {
    }

    private List<Planned> plan(List<MatrixChange> changes) {
        Map<String, Role> roleByName = new HashMap<>();
        roleRepository.findAll().forEach(r -> {
            roleByName.put(r.getRoleName().toUpperCase(Locale.ROOT), r);
            if (r.getRoleName().startsWith("ROLE_")) {
                roleByName.put(r.getRoleName().substring(5).toUpperCase(Locale.ROOT), r);
            }
        });
        Map<Integer, Set<Integer>> granted = loadGrants();
        Set<String> seen = new HashSet<>();
        List<Planned> result = new ArrayList<>();

        for (MatrixChange c : changes) {
            String roleName = c.role().trim().toUpperCase(Locale.ROOT);
            Role role = roleByName.get(roleName);
            if (role == null) {
                throw new ResourceNotFoundException("Role", "name", c.role());
            }
            Permission perm = permissions.findByModuleOrScreenAndActionType(c.module().trim(), c.action().trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new ResourceNotFoundException("Permission", "code", c.module() + ":" + c.action()));
            if (!seen.add(role.getRoleName() + "|" + perm.code())) {
                throw new BusinessRuleException("DUPLICATE_CHANGE", "Duplicate change for " + role.getRoleName() + " " + perm.code());
            }
            boolean current = granted.getOrDefault(role.getRoleId(), Set.of()).contains(perm.getPermissionId());
            if (current == c.granted()) {
                continue;
            }
            enforceRules(role, perm, c.granted());
            result.add(new Planned(role, perm, new MatrixDiffEntry(role.getRoleName(), perm.getModuleOrScreen(),
                    perm.getActionType(), current, c.granted())));
        }
        return result;
    }

    private void enforceRules(Role role, Permission perm, boolean grant) {
        String roleName = role.canonicalName();
        // Alt 2 – Admin lockout: Admin always keeps S10–S12 / S49–S53.
        if (!grant && Role.ADMIN.equalsIgnoreCase(roleName)
                && PermissionCatalog.ADMIN_LOCKED_SCREENS.contains(perm.getModuleOrScreen())) {
            throw new BusinessRuleException("ADMIN_LOCKED",
                    "The Admin role must keep " + perm.getModuleOrScreen() + " permissions.");
        }
        if (!grant) {
            return;
        }
        // Alt 3 – Admin-only permissions cannot be assigned to any other role; Manager gets them by delegation only.
        if (perm.isAdminOnly() && !Role.ADMIN.equalsIgnoreCase(roleName)) {
            throw new BusinessRuleException("ADMIN_ONLY_PERMISSION",
                    "This permission is Admin-only. It can only be delegated to a Manager (S52).");
        }
        // Alt 1 – sensitive-data minimisation (GB-M6-04). Applies to every role including Admin (AC-06).
        Set<String> allowed = PermissionCatalog.SENSITIVE_DATA_ALLOWED_ROLES.get(perm.getModuleOrScreen());
        if (allowed != null && !allowed.contains(roleName)) {
            throw new BusinessRuleException("M6-MSG-05",
                    "Permission update rejected: Violates sensitive data minimization rules.");
        }
    }

    private Map<Integer, Set<Integer>> loadGrants() {
        Map<Integer, Set<Integer>> map = new HashMap<>();
        for (RolePermission rp : rolePermissions.findAll()) {
            map.computeIfAbsent(rp.getId().getRoleId(), k -> new HashSet<>()).add(rp.getId().getPermissionId());
        }
        return map;
    }
}
