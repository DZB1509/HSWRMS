package com.heavenstay.hswrms.m1identity.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;

/**
 * Registration completion request for the Google SSO flow.
 *
 * <p>Email is deliberately NOT accepted from the client: the server takes it from
 * the registration ticket that was bound to the validated Google identity at the
 * OAuth callback, so the client cannot claim a different email or subject (C7).
 * A password is optional — Google-only accounts use {@code password_hash = NULL}.
 * Terms-of-Service consent remains explicit and mandatory.</p>
 */
public class SsoRegisterRequest {

    @NotBlank(message = "SSO ticket is required")
    private String ssoTicket;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String phone;

    /** Optional; when provided it must be a valid password for the new account. */
    private String password;

    @AssertTrue(message = "You must consent to the terms and conditions")
    private boolean consent;

    public String getSsoTicket() { return ssoTicket; }
    public void setSsoTicket(String ssoTicket) { this.ssoTicket = ssoTicket; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public boolean isConsent() { return consent; }
    public void setConsent(boolean consent) { this.consent = consent; }
}
