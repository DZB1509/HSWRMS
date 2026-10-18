package com.heavenstay.hswrms.m1identity.dto;

public class VerifyEmailResponse {

    private Integer userId;
    private String email;
    private boolean emailVerified;
    private String accountStatus;

    public VerifyEmailResponse(Integer userId, String email, boolean emailVerified, String accountStatus) {
        this.userId = userId;
        this.email = email;
        this.emailVerified = emailVerified;
        this.accountStatus = accountStatus;
    }

    public Integer getUserId() { return userId; }
    public String getEmail() { return email; }
    public boolean isEmailVerified() { return emailVerified; }
    public String getAccountStatus() { return accountStatus; }
}
