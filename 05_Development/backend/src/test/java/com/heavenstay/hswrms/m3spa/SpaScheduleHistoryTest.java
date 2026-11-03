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
import com.heavenstay.hswrms.m3spa.service.SpaDispatchOutboxWorker;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import com.heavenstay.hswrms.m3spa.port.SpaCalendarPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

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
    private SpaDispatchOutboxRepository outboxRepository;

    @Autowired
    private SpaDispatchOutboxWorker outboxWorker;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @MockBean
    private SpaCalendarPort calendarPort;

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
    private final Set<Long> testSessionIds = new HashSet<>();

    @AfterEach
    public void cleanCommittedHistoryFixture() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            for (Long sessionId : testSessionIds) {
                outboxRepository.deleteAll(outboxRepository.findBySessionIdOrderByCreatedAtAsc(sessionId));
                historyRepository.deleteAll(historyRepository.findBySessionIdOrderByCreatedAtAsc(sessionId));
                sessionRepository.deleteById(sessionId);
            }
            qualificationRepository.deleteAll(qualificationRepository.findAll().stream()
                    .filter(q -> q.getTherapist() != null
                            && ((therapist1 != null && q.getTherapist().getTherapistId().equals(therapist1.getTherapistId()))
                                || (therapist2 != null && q.getTherapist().getTherapistId().equals(therapist2.getTherapistId()))))
                    .toList());
            compatibilityRepository.deleteAll(compatibilityRepository.findAll().stream()
                    .filter(c -> c.getTreatmentRoom() != null
                            && ((room1 != null && c.getTreatmentRoom().getRoomId().equals(room1.getRoomId()))
                                || (room2 != null && c.getTreatmentRoom().getRoomId().equals(room2.getRoomId()))))
                    .toList());
            if (therapist1 != null) therapistRepository.delete(therapist1);
            if (therapist2 != null) therapistRepository.delete(therapist2);
            if (room1 != null) roomRepository.delete(room1);
            if (room2 != null) roomRepository.delete(room2);
            if (treatment != null) treatmentRepository.delete(treatment);
        });
        testSessionIds.clear();
    }

    @BeforeEach
    public void setUp() {
        when(calendarPort.createOrUpdateCalendarEvent(any())).thenReturn("calendar-history-test");
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
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    @DisplayName("BR-M3-14: Initial reservation commits history/outbox before asynchronous calendar dispatch")
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
        testSessionIds.add(booked.getSpaSessionId());

        List<SpaScheduleHistory> historyList = historyRepository.findBySessionIdOrderByCreatedAtAsc(booked.getSpaSessionId());
        assertEquals(1, historyList.size(), "Initial reservation must create exactly 1 audit history entry!");

        SpaScheduleHistory entry = historyList.get(0);
        assertEquals("CREATED", entry.getChangeType());
        assertEquals("SCHEDULED", entry.getNewStatus());
        assertEquals(start, entry.getNewStartAt());
        assertEquals(therapist1.getTherapistId(), entry.getNewTherapistId());
        assertEquals(room1.getRoomId(), entry.getNewRoomId());

        List<SpaDispatchOutboxEntity> queued = outboxRepository.findBySessionIdOrderByCreatedAtAsc(booked.getSpaSessionId());
        assertEquals(2, queued.size(), "Business transaction must atomically persist Calendar and Email outbox work");
        assertTrue(queued.stream().allMatch(item -> "PENDING".equals(item.getStatus())));
        assertNull(entry.getExternalCalendarId(), "No external calendar reference exists before worker dispatch");

        SpaSession persistedSession = sessionRepository.findById(booked.getSpaSessionId()).orElseThrow();
        assertNull(persistedSession.getExternalCalendarEventId(), "Reservation must not dispatch Calendar synchronously");

        outboxWorker.processPendingOutboxDispatches("history-test-worker");

        SpaScheduleHistory dispatchedHistory = historyRepository.findBySessionIdOrderByCreatedAtAsc(booked.getSpaSessionId()).get(0);
        SpaSession dispatchedSession = sessionRepository.findById(booked.getSpaSessionId()).orElseThrow();
        assertNotNull(dispatchedHistory.getExternalCalendarId(), "Calendar reference is recorded only after worker success");
        assertNotNull(dispatchedSession.getExternalCalendarEventId(), "Calendar reference is attached after worker success");
        assertEquals(dispatchedHistory.getExternalCalendarId(), dispatchedSession.getExternalCalendarEventId());
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
        testSessionIds.add(initial.getSpaSessionId());

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
        testSessionIds.add(booked.getSpaSessionId());

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

