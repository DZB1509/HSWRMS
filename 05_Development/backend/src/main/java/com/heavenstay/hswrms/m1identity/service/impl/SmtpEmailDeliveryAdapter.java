package com.heavenstay.hswrms.m1identity.service.impl;

import com.heavenstay.hswrms.m1identity.service.EmailDeliveryAdapter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Real SMTP email adapter. Activated when the "smtp" Spring profile is active.
 * Requires spring.mail.* properties (host, port, username, password) to be configured
 * via environment variables or application-smtp.yml.
 */
@Service
@Profile("smtp")
public class SmtpEmailDeliveryAdapter implements EmailDeliveryAdapter {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailDeliveryAdapter.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public SmtpEmailDeliveryAdapter(JavaMailSender mailSender,
                                     org.springframework.core.env.Environment env) {
        this.mailSender = mailSender;
        this.fromAddress = env.getProperty("spring.mail.properties.mail.smtp.from",
                env.getProperty("spring.mail.username", "noreply@heavenstay.com"));
    }

    @Override
    public void sendVerificationOtp(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("HeavenStay – Email Verification Code");
        message.setText(
                "Welcome to HeavenStay Wellness Resort!\n\n"
                + "Your email verification code is: " + otp + "\n\n"
                + "This code will expire in 10 minutes.\n"
                + "If you did not request this, please ignore this email.\n\n"
                + "— HeavenStay Wellness Resort Management System"
        );

        try {
            mailSender.send(message);
            log.info("Verification email dispatched to {}", toEmail);
        } catch (MailException ex) {
            log.error("Failed to send verification email to {}: {}", toEmail, ex.getMessage());
            throw new IllegalStateException(
                    "Email delivery failed. Registration cannot proceed without a verified email address.", ex);
        }
    }
}
