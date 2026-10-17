package com.heavenstay.hswrms.m1identity.dto;

public class RegisterResponse {

    private Integer userId;
    private String email;
    private String message;

    public RegisterResponse(Integer userId, String email, String message) {
        this.userId = userId;
        this.email = email;
        this.message = message;
    }

    // Getters
    public Integer getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getMessage() { return message; }
}