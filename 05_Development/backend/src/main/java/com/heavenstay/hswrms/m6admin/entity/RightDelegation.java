package com.heavenstay.hswrms.m6admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"RightDelegation\"", schema = "dbo")
public class RightDelegation {

    public static final String PENDING = "PENDING";
    public static final String ACTIVE = "ACTIVE";
    public static final String EXPIRED = "EXPIRED";
    public static final String REVOKED = "REVOKED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "delegation_id")
    private Integer delegationId;

    @Column(name = "granted_by_admin_user_id", nullable = false)
    private Integer grantedByAdminUserId;

    @Column(name = "received_by_manager_user_id", nullable = false)
    private Integer receivedByManagerUserId;

    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Column(name = "valid_until", nullable = false)
    private LocalDateTime validUntil;

    @Column(name = "delegation_status", nullable = false, length = 20)
    private String delegationStatus = PENDING;

    /** M6 migration column. */
    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    /** M6 migration column. */
    @Column(name = "revoked_by_admin_user_id")
    private Integer revokedByAdminUserId;

    protected RightDelegation() {
    }

    public RightDelegation(Integer adminId, Integer managerId, LocalDateTime validFrom,
                           LocalDateTime validUntil, String status) {
        this.grantedByAdminUserId = adminId;
        this.receivedByManagerUserId = managerId;
        this.validFrom = validFrom;
        this.validUntil = validUntil;
        this.delegationStatus = status;
    }

    public Integer getDelegationId() { return delegationId; }
    public Integer getGrantedByAdminUserId() { return grantedByAdminUserId; }
    public Integer getReceivedByManagerUserId() { return receivedByManagerUserId; }
    public LocalDateTime getValidFrom() { return validFrom; }
    public LocalDateTime getValidUntil() { return validUntil; }
    public String getDelegationStatus() { return delegationStatus; }
    public void setDelegationStatus(String delegationStatus) { this.delegationStatus = delegationStatus; }
    public LocalDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; }
    public Integer getRevokedByAdminUserId() { return revokedByAdminUserId; }
    public void setRevokedByAdminUserId(Integer revokedByAdminUserId) { this.revokedByAdminUserId = revokedByAdminUserId; }
}
