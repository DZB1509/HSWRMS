package com.heavenstay.hswrms.m1identity.sso;

/**
 * Outcome of resolving a validated provider identity against HSWRMS accounts.
 * Either a LOGIN for an existing eligible Customer, or a REGISTRATION prefill
 * ticket token for a brand-new Customer (no account is created at callback time).
 */
public record SsoResolution(SsoTicketPurpose purpose, Integer userId, String registrationTicketToken) {

    public static SsoResolution login(Integer userId) {
        return new SsoResolution(SsoTicketPurpose.LOGIN, userId, null);
    }

    public static SsoResolution registration(String registrationTicketToken) {
        return new SsoResolution(SsoTicketPurpose.REGISTRATION, null, registrationTicketToken);
    }

    public boolean isRegistration() {
        return purpose == SsoTicketPurpose.REGISTRATION;
    }
}
