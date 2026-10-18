package com.heavenstay.hswrms.m1identity.service;

public interface EmailDeliveryAdapter {
    void sendVerificationOtp(String toEmail, String otp);
}