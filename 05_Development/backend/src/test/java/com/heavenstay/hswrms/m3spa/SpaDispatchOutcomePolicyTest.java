package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.config.SpaOutboxProperties;
import com.heavenstay.hswrms.m3spa.entity.SpaDispatchOutboxEntity;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.SpaScheduleHistory;
import com.heavenstay.hswrms.m3spa.port.SpaCalendarOutcomeAware;
import com.heavenstay.hswrms.m3spa.port.SpaCalendarPort;
import com.heavenstay.hswrms.m3spa.port.SpaNotificationOutcomeAware;
import com.heavenstay.hswrms.m3spa.port.SpaProviderResult;
import com.heavenstay.hswrms.m3spa.repository.SpaDispatchOutboxRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaScheduleHistoryRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.service.SpaDispatchOutboxWorker;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SpaDispatchOutcomePolicyTest {
    @Test
    void retryableFailureUsesConfiguredDelayAndStableIdempotencyKey() {
        Fixture fixture = new Fixture();
        when(fixture.notification.sendScheduleChangeNotificationResult(any(), any(), any(), any()))
                .thenReturn(SpaProviderResult.retryable("temporary rejection"));
        SpaDispatchOutboxEntity outbox = fixture.outbox("EMAIL");
        String key = outbox.getIdempotencyKey();
        LocalDateTime before = LocalDateTime.now();

        assertFalse(fixture.worker.processEntry(outbox));

        assertEquals("FAILED", outbox.getStatus());
        assertEquals(1, outbox.getRetryCount());
        assertEquals(key, outbox.getIdempotencyKey());
        assertNotNull(outbox.getNextAttemptAt());
        assertFalse(outbox.getNextAttemptAt().isBefore(before.plusSeconds(29)));
        assertFalse(outbox.getNextAttemptAt().isAfter(before.plusSeconds(31)));
    }

    @Test
    void ambiguousEmailOutcomeIsTerminalAndNeverBlindlyRetried() {
        Fixture fixture = new Fixture();
        when(fixture.notification.sendScheduleChangeNotificationResult(any(), any(), any(), any()))
                .thenReturn(SpaProviderResult.ambiguous("SMTP response timed out after submission"));
        SpaDispatchOutboxEntity outbox = fixture.outbox("EMAIL");

        assertFalse(fixture.worker.processEntry(outbox));

        assertEquals("AMBIGUOUS", outbox.getStatus());
        assertEquals(1, outbox.getRetryCount());
        assertNull(outbox.getNextAttemptAt());
        verify(fixture.notification, times(1)).sendScheduleChangeNotificationResult(any(), any(), any(), any());
    }

    @Test
    void permanentConfigurationFailureIsTerminalAndSuppressionIsNotSent() {
        Fixture permanentFixture = new Fixture();
        when(permanentFixture.notification.sendScheduleChangeNotificationResult(any(), any(), any(), any()))
                .thenReturn(SpaProviderResult.permanent("SMTP authentication is invalid"));
        SpaDispatchOutboxEntity permanent = permanentFixture.outbox("EMAIL");
        permanentFixture.worker.processEntry(permanent);
        assertEquals("FINAL_FAILURE", permanent.getStatus());
        assertNull(permanent.getNextAttemptAt());

        Fixture suppressedFixture = new Fixture();
        when(suppressedFixture.notification.sendScheduleChangeNotificationResult(any(), any(), any(), any()))
                .thenReturn(SpaProviderResult.suppressed("log-only adapter"));
        SpaDispatchOutboxEntity suppressed = suppressedFixture.outbox("EMAIL");
        suppressedFixture.worker.processEntry(suppressed);
        assertEquals("SKIPPED", suppressed.getStatus());
        assertNotEquals("SENT", suppressed.getStatus());
    }

    @Test
    void missingProviderIsTerminalAndCalendarRequiresAStableReferenceForSuccess() {
        SpaDispatchOutboxRepository outboxRepository = mock(SpaDispatchOutboxRepository.class);
        SpaSessionRepository sessions = mock(SpaSessionRepository.class);
        SpaScheduleHistoryRepository histories = mock(SpaScheduleHistoryRepository.class);
        SpaSession session = new SpaSession();
        session.setSpaSessionId(77L);
        when(sessions.findById(77L)).thenReturn(Optional.of(session));

        SpaDispatchOutboxWorker noProviders = new SpaDispatchOutboxWorker(
                new SpaOutboxProperties(), outboxRepository, sessions, histories, null, null);
        SpaDispatchOutboxEntity email = new SpaDispatchOutboxEntity(null, 77L, "EMAIL",
                "x@example.com", "Customer", "CHANGE", "details", null, "email-missing-provider-key");
        noProviders.processEntry(email);
        assertEquals("FINAL_FAILURE", email.getStatus());

        SpaCalendarPort calendar = mock(SpaCalendarPort.class);
        when(calendar.createOrUpdateCalendarEvent(session)).thenReturn(" ");
        SpaDispatchOutboxWorker calendarWorker = new SpaDispatchOutboxWorker(
                new SpaOutboxProperties(), outboxRepository, sessions, histories, null, calendar);
        SpaDispatchOutboxEntity calendarOutbox = new SpaDispatchOutboxEntity(null, 77L, "CALENDAR",
                null, null, "CHANGE", "details", null, "calendar-no-reference-key");
        calendarWorker.processEntry(calendarOutbox);
        assertEquals("FAILED", calendarOutbox.getStatus());
        assertNull(calendarOutbox.getExternalCalendarId());
    }

    @Test
    void calendarUsesStableIdentityAndUpdatesAuditOnlyAfterProviderAcceptance() {
        SpaDispatchOutboxRepository outboxRepository = mock(SpaDispatchOutboxRepository.class);
        SpaSessionRepository sessions = mock(SpaSessionRepository.class);
        SpaScheduleHistoryRepository histories = mock(SpaScheduleHistoryRepository.class);
        SpaCalendarOutcomeAware calendar = mock(SpaCalendarOutcomeAware.class);
        SpaSession session = new SpaSession();
        session.setSpaSessionId(77L);
        SpaScheduleHistory history = new SpaScheduleHistory(77L, null, "SYSTEM", "CREATED",
                null, "SCHEDULED", null, LocalDateTime.now(), null, null, null, null, null, null);
        when(sessions.findById(77L)).thenReturn(Optional.of(session));
        when(histories.findById(12L)).thenReturn(Optional.of(history));
        when(calendar.upsertCalendarEvent(session, "hswrms-spa-77"))
                .thenReturn(SpaProviderResult.accepted("calendar-provider-event-77"));

        SpaDispatchOutboxWorker worker = new SpaDispatchOutboxWorker(new SpaOutboxProperties(),
                outboxRepository, sessions, histories, null, calendar);
        SpaDispatchOutboxEntity outbox = new SpaDispatchOutboxEntity(12L, 77L, "CALENDAR",
                null, null, "CREATED", "created", null, "stable-calendar-key");

        assertTrue(worker.processEntry(outbox));
        verify(calendar).upsertCalendarEvent(session, "hswrms-spa-77");
        assertEquals("SENT", outbox.getStatus());
        assertEquals("calendar-provider-event-77", session.getExternalCalendarEventId());
        assertEquals("calendar-provider-event-77", history.getExternalCalendarId());
        verify(histories).save(history);
    }

    private static class Fixture {
        final SpaDispatchOutboxRepository outboxRepository = mock(SpaDispatchOutboxRepository.class);
        final SpaSessionRepository sessions = mock(SpaSessionRepository.class);
        final SpaScheduleHistoryRepository histories = mock(SpaScheduleHistoryRepository.class);
        final SpaNotificationOutcomeAware notification = mock(SpaNotificationOutcomeAware.class);
        final SpaSession session = new SpaSession();
        final SpaDispatchOutboxWorker worker;

        Fixture() {
            session.setSpaSessionId(42L);
            when(sessions.findById(42L)).thenReturn(Optional.of(session));
            worker = new SpaDispatchOutboxWorker(new SpaOutboxProperties(), outboxRepository,
                    sessions, histories, notification, null);
        }

        SpaDispatchOutboxEntity outbox(String channel) {
            return new SpaDispatchOutboxEntity(null, 42L, channel,
                    "customer@example.com", "Customer", "CHANGE", "details", null,
                    "stable-idempotency-key");
        }
    }
}
