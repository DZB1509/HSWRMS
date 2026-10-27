package com.heavenstay.hswrms.m6admin.security;

import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import com.heavenstay.hswrms.m6admin.service.PermissionCatalog;
import com.heavenstay.hswrms.m6admin.service.PermissionService;
import org.springframework.stereotype.Component;

/**
 * Used from {@code @PreAuthorize("@perm.has('S50','U')")}. Deny by default; a denied attempt is audited.
 */
@Component("perm")
public class PermissionEvaluator {

    private final PermissionService permissionService;
    private final UserRepository userRepository;
    private final AuditLogService audit;

    public PermissionEvaluator(PermissionService permissionService, UserRepository userRepository,
                               AuditLogService audit) {
        this.permissionService = permissionService;
        this.userRepository = userRepository;
        this.audit = audit;
    }

    public boolean has(String screen, String action) {
        CurrentActor actor = CurrentActor.current().orElse(null);
        if (actor == null) {
            return false;
        }
        boolean active = userRepository.findById(actor.userId())
                .map(User::getAccountStatus)
                .map("ACTIVE"::equalsIgnoreCase)
                .orElse(false);

        boolean isSensitiveData = PermissionCatalog.SENSITIVE_DATA_ALLOWED_ROLES.containsKey(screen);
        boolean allowed = active
                && ((actor.admin() && !isSensitiveData) || permissionService.userHas(actor.userId(), screen, action));
        if (!allowed) {
            audit.record(actor, "Access Denied", "Screen:" + screen, screen + ":" + action, AuditLogService.DENIED);
        }
        return allowed;
    }
}
