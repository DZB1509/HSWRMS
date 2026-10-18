package com.heavenstay.hswrms.m6admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

/**
 * Append-only audit record. Marked {@link Immutable}: Hibernate never issues UPDATE statements and the
 * repository exposes no delete. The SQL migration additionally installs triggers so only JOB-02 may purge.
 */
@Entity
@Immutable
@Table(name = "\"AuditLog\"", schema = "dbo")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_log_id")
    private Long auditLogId;

    @Column(name = "actor_user_id")
    private Integer actorUserId;

    @Column(name = "actor_role", length = 50)
    private String actorRole;

    @Column(name = "action", nullable = false, length = 150)
    private String action;

    @Column(name = "target_data_type", length = 100)
    private String targetDataType;

    @Column(name = "target_ref_id", length = 100)
    private String targetRefId;

    @Column(name = "access_status", length = 50)
    private String accessStatus;

    /** Only populated for non-sensitive configuration (business parameter / permission changes). */
    @Column(name = "old_value", length = 500)
    private String oldValue;

    @Column(name = "new_value", length = 500)
    private String newValue;

    @Column(name = "delegation_id")
    private Integer delegationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected AuditLog() {
    }

    public AuditLog(Integer actorUserId, String actorRole, String action, String targetDataType,
                    String targetRefId, String accessStatus, String oldValue, String newValue,
                    Integer delegationId, LocalDateTime createdAt) {
        this.actorUserId = actorUserId;
        this.actorRole = actorRole;
        this.action = action;
        this.targetDataType = targetDataType;
        this.targetRefId = targetRefId;
        this.accessStatus = accessStatus;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.delegationId = delegationId;
        this.createdAt = createdAt;
    }

    public Long getAuditLogId() { return auditLogId; }
    public Integer getActorUserId() { return actorUserId; }
    public String getActorRole() { return actorRole; }
    public String getAction() { return action; }
    public String getTargetDataType() { return targetDataType; }
    public String getTargetRefId() { return targetRefId; }
    public String getAccessStatus() { return accessStatus; }
    public String getOldValue() { return oldValue; }
    public String getNewValue() { return newValue; }
    public Integer getDelegationId() { return delegationId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
