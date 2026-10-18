package com.heavenstay.hswrms.m1identity.service.impl;

import com.heavenstay.hswrms.m1identity.service.EmailDeliveryAdapter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile({"dev & !smtp"})
public class DevEmailDeliveryAdapter implements EmailDeliveryAdapter {
    private static final Logger log = LoggerFactory.getLogger(DevEmailDeliveryAdapter.class);

    @Override
    public void sendVerificationOtp(String toEmail, String otp) {
        // ONLY logs during development profile. Does not leak OTP outside local context.
        log.info("==========================================================");
        log.info("DEV MODE E-MAIL DISPATCH");
        log.info("To: {}", toEmail);
        log.info("Subject: HSWRMS Verification Code");
        log.info("OTP Code: {}", otp);
        log.info("==========================================================");
    }
}