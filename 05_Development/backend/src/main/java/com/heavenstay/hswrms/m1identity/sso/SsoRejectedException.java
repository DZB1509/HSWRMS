package com.heavenstay.hswrms.m1identity.sso;

/**
 * Controlled rejection of an SSO attempt with a stable, frontend-mappable code
 * (e.g. SSO_EMPLOYEE_ACCOUNT, SSO_EMAIL_NOT_VERIFIED). Never carries a stack
 * trace or provider token material to the client — the OAuth callback handler
 * converts it into a plain redirect back to the SPA.
 */
public class SsoRejectedException extends RuntimeException {

    private final String code;

    public SsoRejectedException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
