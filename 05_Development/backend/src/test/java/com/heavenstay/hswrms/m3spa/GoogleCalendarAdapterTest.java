package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.Therapist;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoom;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.port.GoogleCalendarAdapter;
import com.heavenstay.hswrms.m3spa.port.SpaProviderResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Reliability and configuration tests for GoogleCalendarAdapter (BR-M3-10, BR-M3-14).
 */
public class GoogleCalendarAdapterTest {

    private SpaSession createSampleSession() {
        SpaTreatment treatment = new SpaTreatment();
        treatment.setTreatmentId(2);
        treatment.setTreatmentName("Deep Tissue Therapy");

        Therapist therapist = new Therapist();
        therapist.setTherapistId(8);
        therapist.setDisplayName("Michael Chen");

        TreatmentRoom room = new TreatmentRoom();
        room.setRoomId(15);
        room.setRoomName("Bamboo Suite 3");

        SpaSession session = new SpaSession();
        session.setSpaSessionId(202L);
        session.setTreatment(treatment);
        session.setTherapist(therapist);
        session.setTreatmentRoom(room);
        session.setScheduledStartAt(LocalDateTime.of(2026, 11, 20, 10, 0));
        session.setScheduledEndAt(LocalDateTime.of(2026, 11, 20, 11, 30));
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);

        return session;
    }

    @Test
    @DisplayName("Disabled mode: Does not fabricate an event ID or report a successful Calendar delivery")
    public void testDisabledModeDoesNotFabricateDelivery() {
        GoogleCalendarAdapter adapter = new GoogleCalendarAdapter(false, "primary");
        SpaSession session = createSampleSession();

        String ref = adapter.createOrUpdateCalendarEvent(session);
        assertNull(ref);
        SpaProviderResult result = adapter.upsertCalendarEvent(session, GoogleCalendarAdapter.stableEventIdentity(202L));
        assertEquals(SpaProviderResult.Disposition.SUPPRESSED, result.disposition());
        assertEquals("hswrms-spa-202", GoogleCalendarAdapter.stableEventIdentity(202L));
        assertEquals(SpaProviderResult.Disposition.SUPPRESSED,
                adapter.cancelCalendarEventResult(session, "hswrms-spa-202").disposition());
        assertFalse(adapter.cancelCalendarEvent(session, "hswrms-spa-202"));
    }

    @Test
    @DisplayName("Enabled mode without API client: Fails closed and does not generate a pretend event ID")
    public void testEnabledModeWithoutClientFailsClosed() {
        GoogleCalendarAdapter adapter = new GoogleCalendarAdapter(true, "resort-spa-calendar@heavenstay.com");
        SpaSession session = createSampleSession();

        String eventId = adapter.createOrUpdateCalendarEvent(session);
        assertNull(eventId);
        assertEquals(SpaProviderResult.Disposition.PERMANENT_FAILURE,
                adapter.upsertCalendarEvent(session, GoogleCalendarAdapter.stableEventIdentity(202L)).disposition());
        assertFalse(adapter.cancelCalendarEvent(session, "hswrms-spa-202"));
    }

    @Test
    @DisplayName("Null safety: Handles null session and invalid inputs gracefully without throwing uncaught exceptions")
    public void testNullSafety() {
        GoogleCalendarAdapter adapter = new GoogleCalendarAdapter(true, "primary");

        assertNull(adapter.createOrUpdateCalendarEvent(null));
        assertFalse(adapter.cancelCalendarEvent(null, null));
    }
}

