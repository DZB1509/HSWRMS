package com.heavenstay.hswrms.m1identity.sso;

/**
 * Purpose bound to an SSO handshake ticket at creation time.
 * LOGIN and REGISTRATION tickets are deliberately not interchangeable.
 */
public enum SsoTicketPurpose {
    /** Exchanged for the standard JWT login response (existing Customer sign-in). */
    LOGIN,
    /** Bound to a pending new-Customer registration (prefill + final account creation). */
    REGISTRATION,
    /**
     * Bound to a Facebook identity that must be linked to an existing email/password
     * Customer account. The link is completed only after the account holder proves
     * mailbox ownership via OTP; the ticket is single-use and never issued for staff.
     */
    LINK
}
