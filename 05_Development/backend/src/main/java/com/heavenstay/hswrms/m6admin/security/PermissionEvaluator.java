package com.heavenstay.hswrms.m6admin.security;

import com.heavenstay.hswrms.m1identity.service.IdentityAccountService;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import com.heavenstay.hswrms.m6admin.service.PermissionService;
import org.springframework.stereotype.Component;

/**
 * Used from {@code @PreAuthorize("@perm.has('S50','U')")}. Deny by default; a denied attempt is audited.
 */
@Component("perm")
public class PermissionEvaluator {

    private final PermissionService permissionService;
    private final IdentityAccountService identity;
    private final AuditLogService audit;

    public PermissionEvaluator(PermissionService permissionService, IdentityAccountService identity,
                               AuditLogService audit) {
        this.permissionService = permissionService;
        this.identity = identity;
        this.audit = audit;
    }

    public boolean has(String screen, String action) {
        CurrentActor actor = CurrentActor.current().orElse(null);
        if (actor == null) {
            return false;
        }
        boolean allowed = identity.isActive(actor.userId())
                && (actor.admin() || permissionService.userHas(actor.userId(), screen, action));
        if (!allowed) {
            audit.record(actor, "Access Denied", "Screen:" + screen, screen + ":" + action, AuditLogService.DENIED);
        }
        return allowed;
    }
}
