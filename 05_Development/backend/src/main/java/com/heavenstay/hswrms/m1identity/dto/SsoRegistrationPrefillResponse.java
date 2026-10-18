package com.heavenstay.hswrms.m1identity.dto;

/**
 * Prefill payload for the existing registration form when arriving from Google SSO.
 * Contains only provider-validated display data; the provider subject stays
 * server-side inside the ticket and is never returned to the frontend.
 */
public class SsoRegistrationPrefillResponse {

    private String provider;
    private String email;
    private String fullName;

    public SsoRegistrationPrefillResponse(String provider, String email, String fullName) {
        this.provider = provider;
        this.email = email;
        this.fullName = fullName;
    }

    public String getProvider() { return provider; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
}
