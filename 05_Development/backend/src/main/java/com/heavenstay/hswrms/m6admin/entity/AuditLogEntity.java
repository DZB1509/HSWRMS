package com.heavenstay.hswrms.m6admin.entity;

/**
 * Backward compatibility alias for {@link AuditLog}.
 * @deprecated Use {@link AuditLog} directly.
 */
@Deprecated
public class AuditLogEntity extends AuditLog {

    public AuditLogEntity() {
        super();
    }

    public AuditLogEntity(Integer actorUserId, String action, String targetDataType, String accessStatus) {
        super(actorUserId, action, targetDataType, accessStatus);
    }
}
