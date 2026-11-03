package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.Therapist;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoom;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.port.SmtpSpaNotificationAdapter;
import com.heavenstay.hswrms.m3spa.port.SpaProviderResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Contract and reliability tests for SmtpSpaNotificationAdapter (BR-M3-10, BR-M3-14).
 */
public class SmtpSpaNotificationAdapterTest {

    private JavaMailSender mailSender;
    private Environment environment;
    private SmtpSpaNotificationAdapter adapter;

    @BeforeEach
    public void setUp() {
        mailSender = mock(JavaMailSender.class);
        environment = mock(Environment.class);
        when(environment.getProperty(eq("spring.mail.properties.mail.smtp.from"), anyString()))
                .thenReturn("concierge@heavenstay.com");
        when(environment.getProperty(eq("spring.mail.username"), anyString()))
                .thenReturn("concierge@heavenstay.com");

        adapter = new SmtpSpaNotificationAdapter(mailSender, environment);
    }

    private SpaSession createSampleSession() {
        SpaTreatment treatment = new SpaTreatment();
        treatment.setTreatmentId(1);
        treatment.setTreatmentName("Aromatherapy Massage");

        Therapist therapist = new Therapist();
        therapist.setTherapistId(5);
        therapist.setDisplayName("Elena Rostova");

        TreatmentRoom room = new TreatmentRoom();
        room.setRoomId(10);
        room.setRoomName("Lotus Suite 1");

        SpaSession session = new SpaSession();
        session.setSpaSessionId(101L);
        session.setTreatment(treatment);
        session.setTherapist(therapist);
        session.setTreatmentRoom(room);
        session.setScheduledStartAt(LocalDateTime.of(2026, 11, 15, 14, 0));
        session.setScheduledEndAt(LocalDateTime.of(2026, 11, 15, 15, 0));
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);

        return session;
    }

    @Test
    @DisplayName("sendAppointmentReminder: Successfully formats and sends reminder email")
    public void testSendAppointmentReminderSuccess() {
        SpaSession session = createSampleSession();

        boolean result = adapter.sendAppointmentReminder(session, "guest@example.com", "Sarah Jenkins");

        assertTrue(result, "Notification adapter should return true upon successful mailSender delivery");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        SimpleMailMessage sentMsg = captor.getValue();
        assertEquals("concierge@heavenstay.com", sentMsg.getFrom());
        assertNotNull(sentMsg.getTo());
        assertEquals("guest@example.com", sentMsg.getTo()[0]);
        assertTrue(sentMsg.getSubject().contains("Upcoming Appointment Reminder"));
        assertTrue(sentMsg.getText().contains("Sarah Jenkins"));
        assertTrue(sentMsg.getText().contains("Aromatherapy Massage"));
        assertTrue(sentMsg.getText().contains("Elena Rostova"));
        assertTrue(sentMsg.getText().contains("Lotus Suite 1"));
        assertTrue(sentMsg.getText().contains("/confirm-attendance"));
    }

    @Test
    @DisplayName("sendAppointmentReminder: MailException safely caught and returns false for retry")
    public void testSendAppointmentReminderMailExceptionReturnsFalse() {
        SpaSession session = createSampleSession();
        doThrow(new MailSendException("SMTP connection timed out")).when(mailSender).send(any(SimpleMailMessage.class));

        boolean result = adapter.sendAppointmentReminder(session, "guest@example.com", "Sarah Jenkins");

        assertFalse(result, "Adapter must return false on MailException to enable scheduler claim release and retry");
    }

    @Test
    @DisplayName("sendAppointmentReminder: Rejects invalid or null email without crashing")
    public void testSendAppointmentReminderInvalidEmail() {
        SpaSession session = createSampleSession();

        assertFalse(adapter.sendAppointmentReminder(session, null, "Guest"), "Null email must return false");
        assertFalse(adapter.sendAppointmentReminder(session, "not-an-email", "Guest"), "Invalid email must return false");
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("sendScheduleChangeNotification: Successfully formats and sends schedule change email")
    public void testSendScheduleChangeNotificationSuccess() {
        SpaSession session = createSampleSession();

        boolean result = adapter.sendScheduleChangeNotification(
                session, "guest@example.com", "Sarah Jenkins", "Rescheduled to Lotus Suite 1 at 14:00"
        );

        assertTrue(result, "Notification adapter should return true on successful schedule change dispatch");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        SimpleMailMessage sentMsg = captor.getValue();
        assertEquals("guest@example.com", sentMsg.getTo()[0]);
        assertTrue(sentMsg.getSubject().contains("Your Schedule Has Been Updated"));
        assertTrue(sentMsg.getText().contains("Rescheduled to Lotus Suite 1 at 14:00"));
        assertTrue(sentMsg.getText().contains("Aromatherapy Massage"));
    }

    @Test
    @DisplayName("sendScheduleChangeNotification: MailAuthenticationException returns false safely")
    public void testSendScheduleChangeNotificationAuthExceptionReturnsFalse() {
        SpaSession session = createSampleSession();
        doThrow(new MailAuthenticationException("Authentication failed")).when(mailSender).send(any(SimpleMailMessage.class));

        boolean result = adapter.sendScheduleChangeNotification(session, "guest@example.com", "Guest", "Room changed");

        assertFalse(result, "Adapter must return false when SMTP authentication fails");
    }

    @Test
    @DisplayName("BR-M3-14: Typed SMTP outcomes distinguish permanent auth failure from ambiguous send timeout")
    public void testTypedProviderOutcomeClassification() {
        SpaSession session = createSampleSession();
        doThrow(new MailAuthenticationException("invalid credentials"))
                .when(mailSender).send(any(SimpleMailMessage.class));
        SpaProviderResult auth = adapter.sendScheduleChangeNotificationResult(
                session, "guest@example.com", "Guest", "Schedule changed");
        assertEquals(SpaProviderResult.Disposition.PERMANENT_FAILURE, auth.disposition());

        reset(mailSender);
        doThrow(new MailSendException("connection timed out after submission"))
                .when(mailSender).send(any(SimpleMailMessage.class));
        SpaProviderResult timeout = adapter.sendScheduleChangeNotificationResult(
                session, "guest@example.com", "Guest", "Schedule changed");
        assertEquals(SpaProviderResult.Disposition.AMBIGUOUS, timeout.disposition());
        assertFalse(adapter.sendScheduleChangeNotificationResult(
                session, null, "Guest", "Schedule changed").disposition()
                == SpaProviderResult.Disposition.ACCEPTED);
    }

    @Test
    @DisplayName("BR-M3-10: Timeline reminder includes checkpoint-specific confirmation context")
    public void testTimelineReminderCheckpointMessage() {
        SpaProviderResult result = adapter.sendTimelineReminder(
                createSampleSession(), "guest@example.com", "Customer", "REMINDER_T2H");
        assertEquals(SpaProviderResult.Disposition.ACCEPTED, result.disposition());
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertTrue(captor.getValue().getText().contains("Please confirm whether you will attend"));
    }
}

