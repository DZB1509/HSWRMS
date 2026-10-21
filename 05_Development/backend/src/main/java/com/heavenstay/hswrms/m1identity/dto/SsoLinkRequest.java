package com.heavenstay.hswrms.m1identity.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for {@code POST /api/v1/auth/sso/tickets/link}: the single-use
 * LINK ticket plus the OTP sent to the existing account's email, proving the
 * account holder owns the mailbox before the Facebook identity is bound.
 */
public class SsoLinkRequest {

    @NotBlank(message = "SSO ticket is required")
    private String ticket;

    @NotBlank(message = "Verification code is required")
    private String otp;

    public SsoLinkRequest() {
    }

    public SsoLinkRequest(String ticket, String otp) {
        this.ticket = ticket;
        this.otp = otp;
    }

    public String getTicket() { return ticket; }
    public void setTicket(String ticket) { this.ticket = ticket; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
}
