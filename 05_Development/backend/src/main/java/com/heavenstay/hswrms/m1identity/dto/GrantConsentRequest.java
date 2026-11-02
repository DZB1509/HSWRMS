package com.heavenstay.hswrms.m1identity.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Grant-consent request body for POST /api/v1/customers/me/consents.
 * Carries no user identifier and no policy version: identity comes from the
 * JWT principal and the policy version is set server-side per consent type.
 */
public class GrantConsentRequest {

    @NotBlank(message = "Consent type is required")
    private String consentType;

    public String getConsentType() { return consentType; }
    public void setConsentType(String consentType) { this.consentType = consentType; }
}
