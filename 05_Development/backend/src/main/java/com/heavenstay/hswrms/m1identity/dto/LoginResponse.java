package com.heavenstay.hswrms.m1identity.dto;

import java.util.List;

/**
 * Login success payload. Deliberately excludes password hash, OTP data,
 * and any sensitive health profile information.
 */
public class LoginResponse {

    private String token;
    private String tokenType;
    private long expiresInMs;
    private Integer userId;
    private String email;
    private String fullName;
    private List<String> roles;
    private String accountStatus;

    public LoginResponse(String token, String tokenType, long expiresInMs, Integer userId,
                         String email, String fullName, List<String> roles, String accountStatus) {
        this.token = token;
        this.tokenType = tokenType;
        this.expiresInMs = expiresInMs;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
        this.accountStatus = accountStatus;
    }

    public String getToken() { return token; }
    public String getTokenType() { return tokenType; }
    public long getExpiresInMs() { return expiresInMs; }
    public Integer getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public List<String> getRoles() { return roles; }
    public String getAccountStatus() { return accountStatus; }
}