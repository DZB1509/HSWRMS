package com.heavenstay.hswrms.security.dto;

import java.util.List;

public class AuthResponse {

    private String token;
    private Integer userId;
    private Integer customerProfileId;
    private String email;
    private String fullName;
    private List<String> roles;

    public AuthResponse() {
    }

    public AuthResponse(String token, Integer userId, Integer customerProfileId, String email, String fullName, List<String> roles) {
        this.token = token;
        this.userId = userId;
        this.customerProfileId = customerProfileId;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getCustomerProfileId() {
        return customerProfileId;
    }

    public void setCustomerProfileId(Integer customerProfileId) {
        this.customerProfileId = customerProfileId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
}
