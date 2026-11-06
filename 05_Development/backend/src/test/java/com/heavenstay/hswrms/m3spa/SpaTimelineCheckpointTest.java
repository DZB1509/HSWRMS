package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.entity.*;
import com.heavenstay.hswrms.m3spa.entity.enums.*;
import com.heavenstay.hswrms.m3spa.port.SpaCalendarPort;
import com.heavenstay.hswrms.m3spa.port.SpaNotificationPort;
import com.heavenstay.hswrms.m3spa.repository.*;
import com.heavenstay.hswrms.m3spa.scheduler.SessionTimelineScheduler;
import com.heavenstay.hswrms.m3spa.service.SpaDispatchOutboxWorker;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@Import(SpaTestConfig.class)
@Transactional
class SpaTimelineCheckpointTest {
    @Autowired private SessionTimelineScheduler timelineScheduler;
    @Autowired private SpaDispatchOutboxWorker outboxWorker;
    @Autowired private SpaSessionService spaSessionService;
    @Autowired private SpaSessionRepository sessionRepository;
    @Autowired private SpaDispatchOutboxRepository outboxRepository;
    @Autowired private SpaScheduleHistoryRepository historyRepository;
    @Autowired private SpaTreatmentRepository treatmentRepository;
    @Autowired private TherapistRepository therapistRepository;
    @Autowired private TreatmentRoomRepository roomRepository;
    @Autowired private TherapistTreatmentQualificationRepository qualificationRepository;
    @Autowired private TreatmentRoomCompatibilityRepository compatibilityRepository;

    @MockBean private SpaNotificationPort notificationPort;
    @MockBean private SpaCalendarPort calendarPort;

    private SpaTreatment treatment;
    private Therapist therapist;
    private TreatmentRoom room;

    @BeforeEach
    void setUp() {
        historyRepository.deleteAll();
        outboxRepository.deleteAll();
        sessionRepository.deleteAll();
        treatment = treatmentRepository.save(new SpaTreatment("Checkpoint Therapy", 60,
                BigDecimal.valueOf(100), TreatmentStatus.ACTIVE));
        therapist = new Therapist(9131, TherapistStatus.ACTIVE);
        therapist.setDisplayName("Checkpoint Therapist");
        therapist = therapistRepository.save(therapist);
        room = roomRepository.save(new TreatmentRoom("Checkpoint Room", "STANDARD", TreatmentRoomStatus.AVAILABLE.name()));
        qualificationRepository.save(new TherapistTreatmentQualification(therapist, treatment));
        compatibilityRepository.save(new TreatmentRoomCompatibility(room, treatment));
        when(notificationPort.sendAppointmentReminder(any(), anyString(), anyString())).thenReturn(true);
        when(notificationPort.sendScheduleChangeNotification(any(), anyString(), anyString(), anyString())).thenReturn(true);
        when(calendarPort.createOrUpdateCalendarEvent(any())).thenReturn("calendar-checkpoint-test");
    }

    @Test
    @DisplayName("BR-M3-10: All four notification checkpoints enqueue once at their exact boundaries")
    void checkpointsAreIndependentAndIdempotent() {
        LocalDateTime base = LocalDateTime.of(2026, 11, 5, 10, 0);
        SpaSession t24 = createSession(base.plusHours(24), SpaConfirmationStatus.PENDING);
        SpaSession t2 = createSession(base.plusHours(2), SpaConfirmationStatus.PENDING);
        SpaSession t75 = createSession(base.plusMinutes(75), SpaConfirmationStatus.PENDING);
        SpaSession t15 = createSession(base.plusMinutes(15), SpaConfirmationStatus.CONFIRMED);

        timelineScheduler.setClock(fixed(base));
        timelineScheduler.dispatchUpcomingSessionReminders();

        Map<String, SpaDispatchOutboxEntity> queued = java.util.stream.Stream.of(t24, t2, t75, t15)
                .flatMap(session -> outboxRepository.findBySessionIdOrderByCreatedAtAsc(session.getSpaSessionId()).stream())
                .collect(Collectors.toMap(SpaDispatchOutboxEntity::getChangeType, Function.identity()));
        assertEquals(4, queued.size());
        assertEquals(t24.getScheduleVersion(), queued.get("REMINDER_T24H").getScheduleVersion());
        assertEquals(t2.getScheduleVersion(), queued.get("REMINDER_T2H").getScheduleVersion());
        assertEquals(t75.getScheduleVersion(), queued.get("REMINDER_T75M").getScheduleVersion());
        assertEquals(t15.getScheduleVersion(), queued.get("REMINDER_T15M").getScheduleVersion());
        verify(notificationPort, never()).sendAppointmentReminder(any(), anyString(), anyString());

        timelineScheduler.dispatchUpcomingSessionReminders();
        assertEquals(4, outboxRepository.findAll().stream()
                .filter(item -> item.getChangeType() != null && item.getChangeType().startsWith("REMINDER_"))
                .count(), "Repeated scheduler execution must retain one outbox row per checkpoint and schedule version");
    }

    @Test
    @DisplayName("BR-M3-10: Worker suppresses a queued reminder from a superseded schedule version")
    void staleReminderIsNeverSentAfterReschedule() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 5, 10, 0);
        SpaSession session = createSession(now.plusHours(2), SpaConfirmationStatus.PENDING);
        timelineScheduler.setClock(fixed(now));
        timelineScheduler.dispatchUpcomingSessionReminders();
        SpaDispatchOutboxEntity reminder = outboxRepository.findBySessionIdOrderByCreatedAtAsc(session.getSpaSessionId())
                .stream().filter(item -> "REMINDER_T2H".equals(item.getChangeType())).findFirst().orElseThrow();

        session.incrementScheduleVersion();
        session.setScheduledStartAt(session.getScheduledStartAt().plusHours(1));
        session.setScheduledEndAt(session.getScheduledEndAt().plusHours(1));
        sessionRepository.saveAndFlush(session);

        assertEquals(0, outboxWorker.processPendingOutboxDispatches("checkpoint-worker"));
        assertEquals("SUPERSEDED", outboxRepository.findById(reminder.getOutboxId()).orElseThrow().getStatus());
        verify(notificationPort, never()).sendAppointmentReminder(any(), anyString(), anyString());
    }

    @Test
    @DisplayName("BR-M3-10/13: T-60 deadline persists expiry and recovery is not repeated for the same schedule version")
    void deadlineQueuesOneRecoveryAttempt() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 5, 10, 0);
        SpaSession session = createSession(now.plusMinutes(60), SpaConfirmationStatus.PENDING);
        timelineScheduler.setClock(fixed(now));

        timelineScheduler.processConfirmationDeadlines();
        SpaSession expired = sessionRepository.findById(session.getSpaSessionId()).orElseThrow();
        assertEquals(SpaSessionStatus.RESCHEDULING, expired.getSessionStatus());
        assertEquals(SpaConfirmationStatus.EXPIRED, expired.getConfirmationStatus());
        assertNull(expired.getRecoveryAttemptedVersion());

        assertEquals(1, timelineScheduler.processPendingRecoveryRequests());
        SpaSession recovered = sessionRepository.findById(session.getSpaSessionId()).orElseThrow();
        assertEquals(SpaSessionStatus.SCHEDULED, recovered.getSessionStatus());
        assertEquals(SpaConfirmationStatus.PENDING, recovered.getConfirmationStatus());
        assertEquals(2, recovered.getScheduleVersion());
        assertEquals(recovered.getScheduleVersion(), recovered.getRecoveryAttemptedVersion());
        assertEquals(0, timelineScheduler.processPendingRecoveryRequests());
    }

    @Test
    @DisplayName("BR-M3-13: Customer decline remains distinct from cancellation and waits for consent to change time")
    void declineIsNotCancellationAndRecoveryDoesNotChangeTime() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 5, 10, 0);
        timelineScheduler.setClock(fixed(now));
        SpaSession session = createSession(now.plusHours(5), SpaConfirmationStatus.PENDING);
        spaSessionService.declineAttendance(session.getSpaSessionId(), 1);

        SpaSession declined = sessionRepository.findById(session.getSpaSessionId()).orElseThrow();
        assertEquals(SpaSessionStatus.RESCHEDULING, declined.getSessionStatus());
        assertEquals(SpaConfirmationStatus.DECLINED, declined.getConfirmationStatus());
        assertEquals(1, timelineScheduler.processPendingRecoveryRequests());

        SpaSession afterRecovery = sessionRepository.findById(session.getSpaSessionId()).orElseThrow();
        assertEquals(SpaSessionStatus.RESCHEDULING, afterRecovery.getSessionStatus());
        assertEquals(SpaConfirmationStatus.DECLINED, afterRecovery.getConfirmationStatus());
        assertEquals(now.plusHours(5), afterRecovery.getScheduledStartAt(),
                "Recovery must not change a declined Customer's time without consent");
        assertEquals(0, timelineScheduler.processPendingRecoveryRequests());
    }

    private SpaSession createSession(LocalDateTime start, SpaConfirmationStatus confirmation) {
        SpaSession session = new SpaSession();
        session.setRetreatBookingId(101);
        session.setTreatment(treatment);
        session.setTherapist(therapist);
        session.setTreatmentRoom(room);
        session.setScheduledStartAt(start);
        session.setScheduledEndAt(start.plusMinutes(60));
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session.setConfirmationStatus(confirmation);
        return sessionRepository.saveAndFlush(session);
    }

    private Clock fixed(LocalDateTime time) {
        return Clock.fixed(time.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
    }
}
