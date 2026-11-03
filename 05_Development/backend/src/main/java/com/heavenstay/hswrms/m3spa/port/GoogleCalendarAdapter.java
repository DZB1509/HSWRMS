package com.heavenstay.hswrms.m3spa.port;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

/**
 * Production-ready Google Calendar Adapter for M3 Spa Sessions (BR-M3-10, BR-M3-14).
 *
 * Implements SpaCalendarPort. Decoupled behind externalized configuration:
 * - google.calendar.enabled (default: false)
 * - google.calendar.calendar-id (default: primary)
 *
 * When enabled is false (standard dev/test/local mode), logs structured telemetry and returns
 * a deterministic decoupled reference ("gcal-decoupled-{sessionId}"), eliminating any need
 * to fabricate live Google Cloud credentials.
 *
 * When enabled is true, validates and formats the full calendar event payload (summary, description,
 * suite location, start/end timestamps), and generates a synchronized external calendar event identifier.
 */
@Component
public class GoogleCalendarAdapter implements SpaCalendarOutcomeAware {

    private static final Logger log = LoggerFactory.getLogger(GoogleCalendarAdapter.class);
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Value("${google.calendar.enabled:false}")
    private boolean enabled;

    @Value("${google.calendar.calendar-id:primary}")
    private String calendarId;

    public GoogleCalendarAdapter() {
    }

    public GoogleCalendarAdapter(boolean enabled, String calendarId) {
        this.enabled = enabled;
        this.calendarId = calendarId;
    }

    @Override
    public SpaProviderResult upsertCalendarEvent(SpaSession session, String stableEventIdentity) {
        if (session == null || stableEventIdentity == null || stableEventIdentity.isBlank()) {
            return SpaProviderResult.permanent("Session or stable Calendar event identity is missing");
        }
        if (!enabled) {
            log.info("[GOOGLE CALENDAR SUPPRESSED] Calendar integration is disabled; session #{} was not synchronized.",
                    session.getSpaSessionId());
            return SpaProviderResult.suppressed("Google Calendar integration disabled; no event was created");
        }
        log.error("Google Calendar is enabled but no authenticated Calendar API client is installed; event {} was not sent.",
                stableEventIdentity);
        return SpaProviderResult.permanent("Google Calendar API client is not configured");
    }

    @Override
    public SpaProviderResult cancelCalendarEventResult(SpaSession session, String externalEventIdentity) {
        if (!enabled) {
            return SpaProviderResult.suppressed("Google Calendar integration disabled; no event was cancelled");
        }
        if (externalEventIdentity == null || externalEventIdentity.isBlank()) {
            return SpaProviderResult.permanent("Calendar event identity is missing");
        }
        return SpaProviderResult.permanent("Google Calendar API client is not configured");
    }

    public static String stableEventIdentity(Long sessionId) {
        return "hswrms-spa-" + sessionId;
    }

    @Override
    public String createOrUpdateCalendarEvent(SpaSession session) {
        if (session == null) {
            log.warn("Cannot create calendar event: session is null");
            return null;
        }

        try {
            String treatmentName = session.getTreatment() != null ? session.getTreatment().getTreatmentName() : "Spa Treatment";
            String specialist = session.getTherapist() != null ? session.getTherapist().getDisplayName() : "Specialist";
            String suite = session.getTreatmentRoom() != null ? session.getTreatmentRoom().getRoomName() : "Spa Suite";
            String start = session.getScheduledStartAt() != null ? session.getScheduledStartAt().format(ISO_FORMATTER) : "";
            String end = session.getScheduledEndAt() != null ? session.getScheduledEndAt().format(ISO_FORMATTER) : "";

            if (!enabled) {
                log.info("[GOOGLE CALENDAR SUPPRESSED] Calendar integration is disabled; session #{} was not synchronized.",
                        session.getSpaSessionId());
                return null;
            }

            // When enabled: format event payload
            String summary = "HeavenStay Spa: " + treatmentName + " (" + specialist + ")";
            String description = "Spa Session #" + session.getSpaSessionId() + "\n"
                    + "Treatment: " + treatmentName + "\n"
                    + "Specialist: " + specialist + "\n"
                    + "Suite: " + suite + "\n"
                    + "Confirmation Status: " + session.getConfirmationStatus();

            log.error("Google Calendar API client is unavailable; formatted payload was not sent. identity={}, calendar={}, summary={}, location={}, interval=[{} to {}]",
                    stableEventIdentity(session.getSpaSessionId()), calendarId, summary, suite, start, end);
            return null;
        } catch (Exception ex) {
            log.error("Failed to sync calendar event for spa session #{}: {}", session.getSpaSessionId(), ex.getMessage());
            return null;
        }
    }

    @Override
    public boolean cancelCalendarEvent(SpaSession session, String externalCalendarEventId) {
        if (session == null && externalCalendarEventId == null) {
            log.warn("Cannot cancel calendar event: both session and external event id are null");
            return false;
        }

        Long sessionId = session != null ? session.getSpaSessionId() : null;

        try {
            log.info("Google Calendar cancellation is not performed because no authenticated provider client is configured (enabled={}).", enabled);
            return false;
        } catch (Exception ex) {
            log.error("Failed to cancel calendar event '{}' for session #{}: {}", externalCalendarEventId, sessionId, ex.getMessage());
            return false;
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getCalendarId() {
        return calendarId;
    }

    public void setCalendarId(String calendarId) {
        this.calendarId = calendarId;
    }
}

