package com.heavenstay.hswrms.m3spa.port;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

/**
 * Production SMTP implementation of SpaNotificationPort (BR-M3-10, BR-M3-14).
 *
 * Activated when the "smtp" Spring profile is active.
 * Requires spring.mail.* properties (host, port, username, password) to be configured
 * via environment variables or application-smtp.yml.
 *
 * Dispatches real email notifications using JavaMailSender.
 * Catches MailException safely, ensuring no SMTP credentials or sensitive PII are leaked,
 * and returns false upon delivery failure so callers (such as SessionTimelineScheduler)
 * can release claims and schedule retries.
 */
@Service
@Profile("smtp")
@Primary
public class SmtpSpaNotificationAdapter implements SpaNotificationPort {

    private static final Logger log = LoggerFactory.getLogger(SmtpSpaNotificationAdapter.class);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public SmtpSpaNotificationAdapter(JavaMailSender mailSender, Environment env) {
        this.mailSender = mailSender;
        this.fromAddress = env.getProperty("spring.mail.properties.mail.smtp.from",
                env.getProperty("spring.mail.username", "noreply@heavenstay.com"));
    }

    @Override
    public boolean sendAppointmentReminder(SpaSession session, String customerEmail, String customerName) {
        if (session == null) {
            log.warn("Cannot send spa reminder via SMTP: session is null");
            return false;
        }

        if (customerEmail == null || customerEmail.isBlank() || !customerEmail.contains("@")) {
            log.warn("Cannot send spa reminder via SMTP: invalid or missing customer email for session #{}", session.getSpaSessionId());
            return false;
        }

        try {
            String treatmentName = session.getTreatment() != null ? session.getTreatment().getTreatmentName() : "Spa Treatment";
            String specialist = session.getTherapist() != null ? session.getTherapist().getDisplayName() : "Assigned Specialist";
            String suite = session.getTreatmentRoom() != null ? session.getTreatmentRoom().getRoomName() : "Treatment Suite";
            String startFormatted = session.getScheduledStartAt() != null ? session.getScheduledStartAt().format(TIME_FORMATTER) : "Upcoming";
            String guestName = customerName != null && !customerName.isBlank() ? customerName : "Valued Guest";

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(customerEmail);
            message.setSubject("HeavenStay Spa — Upcoming Appointment Reminder & Confirmation Needed");
            message.setText(
                    "Dear " + guestName + ",\n\n"
                    + "This is a reminder that your spa session is scheduled to begin in approximately 1 hour:\n\n"
                    + "• Treatment: " + treatmentName + "\n"
                    + "• Scheduled Time: " + startFormatted + "\n"
                    + "• Specialist: " + specialist + "\n"
                    + "• Treatment Suite: " + suite + "\n\n"
                    + "Please confirm your attendance by visiting your HeavenStay guest portal:\n"
                    + "/api/v1/spa/sessions/" + session.getSpaSessionId() + "/confirm-attendance\n\n"
                    + "If you need to reschedule or have any special requests, please contact our wellness concierge promptly.\n\n"
                    + "Warm regards,\n"
                    + "HeavenStay Wellness Resort Spa Team"
            );

            mailSender.send(message);
            log.info("Spa T-1h reminder email successfully dispatched via SMTP for session #{}", session.getSpaSessionId());
            return true;
        } catch (MailException ex) {
            // Log only the failure reason — never the recipient, credentials, or sensitive token
            log.error("Failed to send spa reminder email via SMTP for session #{}: {}", session.getSpaSessionId(), ex.getMessage());
            return false;
        } catch (Exception ex) {
            log.error("Unexpected error preparing spa reminder email for session #{}: {}", session.getSpaSessionId(), ex.getMessage());
            return false;
        }
    }

    @Override
    public boolean sendScheduleChangeNotification(SpaSession session, String customerEmail, String customerName, String changeDetails) {
        if (session == null) {
            log.warn("Cannot send spa schedule change notification via SMTP: session is null");
            return false;
        }

        if (customerEmail == null || customerEmail.isBlank() || !customerEmail.contains("@")) {
            log.warn("Cannot send spa schedule change notification via SMTP: invalid or missing customer email for session #{}", session.getSpaSessionId());
            return false;
        }

        try {
            String treatmentName = session.getTreatment() != null ? session.getTreatment().getTreatmentName() : "Spa Treatment";
            String specialist = session.getTherapist() != null ? session.getTherapist().getDisplayName() : "Assigned Specialist";
            String suite = session.getTreatmentRoom() != null ? session.getTreatmentRoom().getRoomName() : "Treatment Suite";
            String startFormatted = session.getScheduledStartAt() != null ? session.getScheduledStartAt().format(TIME_FORMATTER) : "N/A";
            String endFormatted = session.getScheduledEndAt() != null ? session.getScheduledEndAt().format(TIME_FORMATTER) : "N/A";
            String guestName = customerName != null && !customerName.isBlank() ? customerName : "Valued Guest";
            String details = changeDetails != null ? changeDetails : "Schedule updated";

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(customerEmail);
            message.setSubject("HeavenStay Spa — Your Schedule Has Been Updated");
            message.setText(
                    "Dear " + guestName + ",\n\n"
                    + "Your spa schedule has been updated. Here are the latest details:\n\n"
                    + "• Change: " + details + "\n"
                    + "• Treatment: " + treatmentName + "\n"
                    + "• Scheduled Time: " + startFormatted + " - " + endFormatted + "\n"
                    + "• Specialist: " + specialist + "\n"
                    + "• Treatment Suite: " + suite + "\n"
                    + "• Status: " + session.getSessionStatus() + "\n\n"
                    + "You can review and manage your retreat schedule in your HeavenStay guest portal.\n\n"
                    + "Warm regards,\n"
                    + "HeavenStay Wellness Resort Spa Team"
            );

            mailSender.send(message);
            log.info("Spa schedule change notification email successfully dispatched via SMTP for session #{}", session.getSpaSessionId());
            return true;
        } catch (MailException ex) {
            log.error("Failed to send spa schedule change email via SMTP for session #{}: {}", session.getSpaSessionId(), ex.getMessage());
            return false;
        } catch (Exception ex) {
            log.error("Unexpected error preparing spa schedule change email for session #{}: {}", session.getSpaSessionId(), ex.getMessage());
            return false;
        }
    }
}

