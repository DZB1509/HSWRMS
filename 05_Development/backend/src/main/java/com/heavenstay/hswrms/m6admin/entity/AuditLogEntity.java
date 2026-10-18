package com.heavenstay.hswrms.m6admin.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Maps dbo.AuditLog (append-only; no setters on purpose). */
@Entity
@Table(name = "AuditLog")
public class AuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_log_id")
    private Long auditLogId;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(name = "action", nullable = false, length = 150)
    private String action;

    @Column(name = "target_data_type", length = 100)
    private String targetDataType;

    @Column(name = "access_status", length = 50)
    private String accessStatus;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected AuditLogEntity() {}

    public AuditLogEntity(Long actorUserId, String action, String targetDataType, String accessStatus) {
        this.actorUserId = actorUserId;
        this.action = action;
        this.targetDataType = targetDataType;
        this.accessStatus = accessStatus;
        this.createdAt = LocalDateTime.now();
    }

    public Long getAuditLogId() { return auditLogId; }
    public Long getActorUserId() { return actorUserId; }
    public String getAction() { return action; }
    public String getTargetDataType() { return targetDataType; }
    public String getAccessStatus() { return accessStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
