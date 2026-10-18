package com.heavenstay.hswrms.m1identity.service.impl;

import com.heavenstay.hswrms.m1identity.service.EmailDeliveryAdapter;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile({"!dev & !smtp"})
public class NoOpEmailDeliveryAdapter implements EmailDeliveryAdapter {

    @Override
    public void sendVerificationOtp(String toEmail, String otp) {
        // Fail-safe closed behavior. Prevents generating accounts without an ability to verify them.
        throw new IllegalStateException("Email delivery provider is not configured for this environment. Registration aborted.");
    }
}