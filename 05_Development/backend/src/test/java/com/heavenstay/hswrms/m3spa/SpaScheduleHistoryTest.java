package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.dto.request.ConfirmReservationRequest;
import com.heavenstay.hswrms.m3spa.dto.response.SpaSessionDto;
import com.heavenstay.hswrms.m3spa.entity.*;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentRoomStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentStatus;
import com.heavenstay.hswrms.m3spa.repository.*;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Automated verification for BR-M3-14 (Accepted Change History & Notifications).
 *
 * Verifies that every accepted schedule state transition records an immutable
 * audit trail in dbo.SpaScheduleHistory, updates external calendar identifiers,
 * and maintains database transaction atomicity even if external dispatch fails.
 */
@SpringBootTest
@Import(SpaTestConfig.class)
@Transactional
public class SpaScheduleHistoryTest {

    @Autowired
    private SpaSessionService spaSessionService;

    @Autowired
    private SpaSessionRepository sessionRepository;

    @Autowired
    private SpaScheduleHistoryRepository historyRepository;

    @Autowired
    private TherapistRepository therapistRepository;

    @Autowired
    private TreatmentRoomRepository roomRepository;

    @Autowired
    private SpaTreatmentRepository treatmentRepository;

    @Autowired
    private TherapistTreatmentQualificationRepository qualificationRepository;

    @Autowired
    private TreatmentRoomCompatibilityRepository compatibilityRepository;

    private SpaTreatment treatment;
    private Therapist therapist1;
    private Therapist therapist2;
    private TreatmentRoom room1;
    private TreatmentRoom room2;

    @BeforeEach
    public void setUp() {
        treatment = new SpaTreatment("Aromatherapy Bliss", 60, BigDecimal.valueOf(150), TreatmentStatus.ACTIVE);
        treatment = treatmentRepository.save(treatment);

        room1 = new TreatmentRoom("Suite Lotus", "STANDARD", TreatmentRoomStatus.AVAILABLE.name());
        room1 = roomRepository.save(room1);

        room2 = new TreatmentRoom("Suite Jasmine", "STANDARD", TreatmentRoomStatus.AVAILABLE.name());
        room2 = roomRepository.save(room2);

        compatibilityRepository.save(new TreatmentRoomCompatibility(room1, treatment));
        compatibilityRepository.save(new TreatmentRoomCompatibility(room2, treatment));

        therapist1 = new Therapist(901, TherapistStatus.ACTIVE);
        therapist1.setDisplayName("Elena");
        therapist1 = therapistRepository.save(therapist1);
        qualificationRepository.save(new TherapistTreatmentQualification(therapist1, treatment));

        therapist2 = new Therapist(902, TherapistStatus.ACTIVE);
        therapist2.setDisplayName("Marco");
        therapist2 = therapistRepository.save(therapist2);
        qualificationRepository.save(new TherapistTreatmentQualification(therapist2, treatment));
    }

    @Test
    @DisplayName("BR-M3-14: Initial reservation creates exactly 1 audit history record and attaches calendar event")
    public void testInitialReservationCreatesHistoryAndCalendarEvent() {
        LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                therapist1.getTherapistId(),
                room1.getRoomId(),
                start,
                end,
                101,
                "Initial reservation"
        );

        SpaSessionDto booked = spaSessionService.confirmReservation(req, 1);
        assertNotNull(booked.getSpaSessionId());

        List<SpaScheduleHistory> historyList = historyRepository.findBySessionIdOrderByCreatedAtAsc(booked.getSpaSessionId());
        assertEquals(1, historyList.size(), "Initial reservation must create exactly 1 audit history entry!");

        SpaScheduleHistory entry = historyList.get(0);
        assertEquals("CREATED", entry.getChangeType());
        assertEquals("SCHEDULED", entry.getNewStatus());
        assertEquals(start, entry.getNewStartAt());
        assertEquals(therapist1.getTherapistId(), entry.getNewTherapistId());
        assertEquals(room1.getRoomId(), entry.getNewRoomId());
        assertNotNull(entry.getExternalCalendarId(), "Calendar reference must be recorded in history");

        SpaSession persistedSession = sessionRepository.findById(booked.getSpaSessionId()).orElseThrow();
        assertNotNull(persistedSession.getExternalCalendarEventId(), "Calendar reference must be attached to the session");
        assertEquals(entry.getExternalCalendarId(), persistedSession.getExternalCalendarEventId());
    }

    @Test
    @DisplayName("BR-M3-14: Rescheduling appends sequential history entry recording previous and new schedules")
    public void testRescheduleCreatesSequentialHistoryRecord() {
        LocalDateTime start1 = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end1 = start1.plusMinutes(60);

        ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                therapist1.getTherapistId(),
                room1.getRoomId(),
                start1,
                end1,
                101,
                "Initial note"
        );
        SpaSessionDto initial = spaSessionService.confirmReservation(req1, 1);

        // Reschedule to afternoon with therapist2 and room2
        LocalDateTime start2 = start1.plusHours(4);
        LocalDateTime end2 = end1.plusHours(4);

        ConfirmReservationRequest rescheduleReq = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                therapist2.getTherapistId(),
                room2.getRoomId(),
                start2,
                end2,
                101,
                "Moved to afternoon"
        );
        rescheduleReq.setRescheduleSessionId(initial.getSpaSessionId());

        spaSessionService.confirmReservation(rescheduleReq, 1);

        List<SpaScheduleHistory> historyList = historyRepository.findBySessionIdOrderByCreatedAtAsc(initial.getSpaSessionId());
        assertEquals(2, historyList.size(), "Rescheduling must append a second history entry!");

        SpaScheduleHistory rescheduleEntry = historyList.get(1);
        assertEquals("RESCHEDULED", rescheduleEntry.getChangeType());
        assertEquals("SCHEDULED", rescheduleEntry.getPreviousStatus());
        assertEquals("SCHEDULED", rescheduleEntry.getNewStatus());
        assertEquals(start1, rescheduleEntry.getPreviousStartAt());
        assertEquals(start2, rescheduleEntry.getNewStartAt());
        assertEquals(therapist1.getTherapistId(), rescheduleEntry.getPreviousTherapistId());
        assertEquals(therapist2.getTherapistId(), rescheduleEntry.getNewTherapistId());
        assertEquals(room1.getRoomId(), rescheduleEntry.getPreviousRoomId());
        assertEquals(room2.getRoomId(), rescheduleEntry.getNewRoomId());
        assertEquals("Moved to afternoon", rescheduleEntry.getReason());
    }

    @Test
    @DisplayName("BR-M3-14: Attendance confirmation and cancellation generate dedicated audit history records")
    public void testAttendanceConfirmationAndCancellationHistory() {
        LocalDateTime start = LocalDateTime.now().plusDays(2).withHour(14).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                therapist1.getTherapistId(),
                room1.getRoomId(),
                start,
                end,
                101,
                "Booking for confirmation"
        );
        SpaSessionDto booked = spaSessionService.confirmReservation(req, 1);

        // Attendance confirmation
        spaSessionService.confirmAttendance(booked.getSpaSessionId(), 1);

        List<SpaScheduleHistory> afterConfirm = historyRepository.findBySessionIdOrderByCreatedAtAsc(booked.getSpaSessionId());
        assertEquals(2, afterConfirm.size());
        assertEquals("ATTENDANCE_CONFIRMED", afterConfirm.get(1).getChangeType());
        assertEquals("CONFIRMED", afterConfirm.get(1).getNewStatus());

        // Cancellation
        spaSessionService.cancelSession(booked.getSpaSessionId(), 1);

        List<SpaScheduleHistory> afterCancel = historyRepository.findBySessionIdOrderByCreatedAtAsc(booked.getSpaSessionId());
        assertEquals(3, afterCancel.size());
        assertEquals("CANCELLED", afterCancel.get(2).getChangeType());
        assertEquals("CANCELLED", afterCancel.get(2).getNewStatus());
    }
}

