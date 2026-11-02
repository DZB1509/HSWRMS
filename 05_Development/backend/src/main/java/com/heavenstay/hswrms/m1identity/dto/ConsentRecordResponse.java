package com.heavenstay.hswrms.m1identity.dto;

import java.time.Instant;

/**
 * Consent history item for GET /api/v1/customers/me/consents.
 *
 * Maps the legacy {@code consent_status} column onto the contract model:
 * {@code granted = "GRANTED".equals(consentStatus)},
 * {@code active = granted && revokedAt == null}.
 */
public class ConsentRecordResponse {

    private Integer consentId;
    private String consentType;
    private boolean granted;
    private Instant grantedAt;
    private Instant revokedAt;
    private String policyVersion;
    private boolean active;

    public ConsentRecordResponse() {
    }

    public ConsentRecordResponse(Integer consentId, String consentType, boolean granted,
                                 Instant grantedAt, Instant revokedAt, String policyVersion, boolean active) {
        this.consentId = consentId;
        this.consentType = consentType;
        this.granted = granted;
        this.grantedAt = grantedAt;
        this.revokedAt = revokedAt;
        this.policyVersion = policyVersion;
        this.active = active;
    }

    public Integer getConsentId() { return consentId; }
    public void setConsentId(Integer consentId) { this.consentId = consentId; }

    public String getConsentType() { return consentType; }
    public void setConsentType(String consentType) { this.consentType = consentType; }

    public boolean isGranted() { return granted; }
    public void setGranted(boolean granted) { this.granted = granted; }

    public Instant getGrantedAt() { return grantedAt; }
    public void setGrantedAt(Instant grantedAt) { this.grantedAt = grantedAt; }

    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }

    public String getPolicyVersion() { return policyVersion; }
    public void setPolicyVersion(String policyVersion) { this.policyVersion = policyVersion; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
