package com.heavenstay.hswrms.m6admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A permission is identified by module/screen code (e.g. {@code S50}, {@code DATA_HEALTH_FULL})
 * and an action code: V(iew), C(reate), U(pdate), D(eactivate), X(Execute), E(xport), G(Configure).
 */
@Entity
@Table(name = "`Permission`")
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "permission_id")
    private Integer permissionId;

    @Column(name = "module_or_screen", nullable = false, length = 100)
    private String moduleOrScreen;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    /** M6 migration column: may be granted through a Manager delegation (SRS 4.4.5). */
    @Column(name = "is_delegable", nullable = false)
    private boolean delegable;

    /** M6 migration column: may only be held directly by the Admin role (AC-05). */
    @Column(name = "is_admin_only", nullable = false)
    private boolean adminOnly;

    protected Permission() {
    }

    public Permission(String moduleOrScreen, String actionType, boolean delegable, boolean adminOnly) {
        this.moduleOrScreen = moduleOrScreen;
        this.actionType = actionType;
        this.delegable = delegable;
        this.adminOnly = adminOnly;
    }

    public String code() {
        return moduleOrScreen + ":" + actionType;
    }

    public Integer getPermissionId() { return permissionId; }
    public String getModuleOrScreen() { return moduleOrScreen; }
    public String getActionType() { return actionType; }
    public boolean isDelegable() { return delegable; }
    public boolean isAdminOnly() { return adminOnly; }
}
