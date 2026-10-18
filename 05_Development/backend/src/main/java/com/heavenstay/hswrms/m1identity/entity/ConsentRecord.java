package com.heavenstay.hswrms.m1identity.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

/**
 * ConsentRecord entity tracking explicit consent granted or revoked
 * by users for processing sensitive health and dietary data.
 * Mapped to dbo.ConsentRecord.
 */
@Entity
@Table(name = "\"ConsentRecord\"", schema = "dbo")
public class ConsentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "consent_id", nullable = false)
    private Integer consentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "consent_type", nullable = false, length = 80)
    private String consentType; // e.g. HEALTH_DATA_PROCESSING, DIETARY_SHARING

    @Column(name = "consent_status", nullable = false, length = 20)
    private String consentStatus = "PENDING"; // GRANTED, REVOKED, PENDING

    @Column(name = "policy_version", nullable = false, length = 50)
    private String policyVersion;

    @Column(name = "granted_at")
    private Instant grantedAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    public ConsentRecord() {
    }

    public ConsentRecord(User user, String consentType, String policyVersion) {
        this.user = user;
        this.consentType = consentType;
        this.policyVersion = policyVersion;
        this.consentStatus = "GRANTED";
        this.grantedAt = Instant.now();
    }

    public Integer getConsentId() {
        return consentId;
    }

    public void setConsentId(Integer consentId) {
        this.consentId = consentId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getConsentType() {
        return consentType;
    }

    public void setConsentType(String consentType) {
        this.consentType = consentType;
    }

    public String getConsentStatus() {
        return consentStatus;
    }

    public void setConsentStatus(String consentStatus) {
        this.consentStatus = consentStatus;
    }

    public String getPolicyVersion() {
        return policyVersion;
    }

    public void setPolicyVersion(String policyVersion) {
        this.policyVersion = policyVersion;
    }

    public Instant getGrantedAt() {
        return grantedAt;
    }

    public void setGrantedAt(Instant grantedAt) {
        this.grantedAt = grantedAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Instant revokedAt) {
        this.revokedAt = revokedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConsentRecord that = (ConsentRecord) o;
        return Objects.equals(consentId, that.consentId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(consentId);
    }
}
