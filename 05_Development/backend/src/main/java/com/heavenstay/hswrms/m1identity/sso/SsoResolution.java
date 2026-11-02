package com.heavenstay.hswrms.m1identity.sso;

/**
 * Outcome of resolving a validated provider identity against HSWRMS accounts.
 * Either a LOGIN for an existing eligible Customer, a LINK handshake for a
 * Facebook identity that must be bound to an existing account after OTP proof,
 * or a REGISTRATION prefill ticket token for a brand-new Customer (no account is
 * created at callback time).
 */
public record SsoResolution(SsoTicketPurpose purpose, Integer userId, String registrationTicketToken, String linkTicketToken) {

    public static SsoResolution login(Integer userId) {
        return new SsoResolution(SsoTicketPurpose.LOGIN, userId, null, null);
    }

    public static SsoResolution registration(String registrationTicketToken) {
        return new SsoResolution(SsoTicketPurpose.REGISTRATION, null, registrationTicketToken, null);
    }

    /** A Facebook link handshake: {@code userId} is the existing account to bind to. */
    public static SsoResolution link(Integer userId, String linkTicketToken) {
        return new SsoResolution(SsoTicketPurpose.LINK, userId, null, linkTicketToken);
    }

    public boolean isRegistration() {
        return purpose == SsoTicketPurpose.REGISTRATION;
    }

    public boolean isLink() {
        return purpose == SsoTicketPurpose.LINK;
    }
}
