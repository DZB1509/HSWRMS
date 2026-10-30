package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.entity.*;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentRoomStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentStatus;
import com.heavenstay.hswrms.m3spa.port.SpaNotificationPort;
import com.heavenstay.hswrms.m3spa.repository.*;
import com.heavenstay.hswrms.m3spa.service.SpaDispatchOutboxWorker;
import com.heavenstay.hswrms.m3spa.service.SpaScheduleAuditEventListener;
import com.heavenstay.hswrms.m3spa.service.event.SpaScheduleAcceptedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@Import(SpaTestConfig.class)
@Transactional
public class SpaDispatchOutboxTest {

    @Autowired
    private SpaScheduleAuditEventListener auditEventListener;

    @Autowired
    private SpaDispatchOutboxWorker outboxWorker;

    @Autowired
    private SpaDispatchOutboxRepository outboxRepository;

    @Autowired
    private SpaScheduleHistoryRepository historyRepository;

    @Autowired
    private SpaSessionRepository sessionRepository;

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

    @MockBean
    private SpaNotificationPort mockNotificationPort;

    private SpaSession session;
    private SpaTreatment treatment;
    private Therapist therapist;
    private TreatmentRoom room;

    @BeforeEach
    public void setUp() {
        treatment = new SpaTreatment("Aromatherapy", 60, BigDecimal.valueOf(140), TreatmentStatus.ACTIVE);
        treatment = treatmentRepository.save(treatment);

        room = new TreatmentRoom("Suite Magnolia", "STANDARD", TreatmentRoomStatus.AVAILABLE.name());
        room = roomRepository.save(room);

        compatibilityRepository.save(new TreatmentRoomCompatibility(room, treatment));

        therapist = new Therapist(701, TherapistStatus.ACTIVE);
        therapist.setDisplayName("Specialist Sarah");
        therapist = therapistRepository.save(therapist);
        qualificationRepository.save(new TherapistTreatmentQualification(therapist, treatment));

        LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(9).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusMinutes(60);

        session = new SpaSession();
        session.setTreatment(treatment);
        session.setTherapist(therapist);
        session.setTreatmentRoom(room);
        session.setScheduledStartAt(start);
        session.setScheduledEndAt(end);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);
        session.setRetreatBookingId(101);
        session = sessionRepository.save(session);
    }

    @Test
    @DisplayName("BR-M3-14: Notification provider failure retains failed outbox record, and worker successfully retries")
    public void testProviderFailureFollowedBySuccessfulRetry() {
        // Mock notification failure initially
        when(mockNotificationPort.sendScheduleChangeNotification(any(), anyString(), anyString(), anyString()))
                .thenReturn(false);

        SpaScheduleAcceptedEvent event = new SpaScheduleAcceptedEvent(
                session, "RESCHEDULED", "PENDING", "CONFIRMED",
                session.getScheduledStartAt().minusHours(2), session.getScheduledStartAt(),
                therapist.getTherapistId(), therapist.getTherapistId(),
                room.getRoomId(), room.getRoomId(),
                1, "CUSTOMER",
                "Customer requested earlier morning slot",
                "sarah.guest@heavenstay.com", "Sarah Guest"
        );

        auditEventListener.onScheduleAccepted(event);

        List<SpaDispatchOutboxEntity> outboxItems = outboxRepository.findBySessionIdOrderByCreatedAtAsc(session.getSpaSessionId());
        assertEquals(2, outboxItems.size(), "Should have 1 CALENDAR and 1 EMAIL outbox record");

        SpaDispatchOutboxEntity emailOutbox = outboxItems.stream()
                .filter(o -> "EMAIL".equals(o.getChannel())).findFirst().orElseThrow();
        assertEquals("FAILED", emailOutbox.getStatus(), "Initial notification failure must mark status FAILED");
        assertEquals(1, emailOutbox.getRetryCount(), "Retry count must be incremented to 1");

        // Repair notification provider
        when(mockNotificationPort.sendScheduleChangeNotification(any(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        // Run worker sweep to retry pending/failed dispatches
        int processed = outboxWorker.processPendingOutboxDispatches();
        assertTrue(processed >= 1, "Worker sweep should process failed outbox record");

        SpaDispatchOutboxEntity retriedOutbox = outboxRepository.findById(emailOutbox.getOutboxId()).orElseThrow();
        assertEquals("SENT", retriedOutbox.getStatus(), "Retried outbox dispatch must reach SENT status");
        assertNotNull(retriedOutbox.getProcessedAt(), "Processed timestamp must be populated on success");
    }

    @Test
    @DisplayName("BR-M3-14: Application restart simulation: Pending outbox record in DB is picked up and dispatched")
    public void testApplicationRestartWithPendingDispatch() {
        when(mockNotificationPort.sendScheduleChangeNotification(any(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        SpaDispatchOutboxEntity pending = new SpaDispatchOutboxEntity(
                999L, session.getSpaSessionId(), "EMAIL",
                "guest.restart@heavenstay.com", "Guest Restart",
                "RESCHEDULED", "Schedule updated after reboot",
                null, "outbox-restart-test-key-1"
        );
        pending.setStatus("PENDING");
        outboxRepository.save(pending);

        // Worker sweep acts as startup/periodic recovery
        int processed = outboxWorker.processPendingOutboxDispatches();
        assertTrue(processed >= 1, "Worker sweep must process pending outbox rows from DB");

        SpaDispatchOutboxEntity loaded = outboxRepository.findById(pending.getOutboxId()).orElseThrow();
        assertEquals("SENT", loaded.getStatus());
        assertNotNull(loaded.getProcessedAt());
    }

    @Test
    @DisplayName("BR-M3-14: Duplicate event delivery does not create duplicate schedule history or outbox records")
    public void testDuplicateEventDeliveryDoesNotCreateDuplicateHistoryOrOutbox() {
        when(mockNotificationPort.sendScheduleChangeNotification(any(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        SpaScheduleAcceptedEvent event = new SpaScheduleAcceptedEvent(
                session, "ATTENDANCE_CONFIRMED", "PENDING", "CONFIRMED",
                session.getScheduledStartAt(), session.getScheduledStartAt(),
                therapist.getTherapistId(), therapist.getTherapistId(),
                room.getRoomId(), room.getRoomId(),
                1, "CUSTOMER",
                "Customer confirmed attendance",
                "guest@heavenstay.com", "Guest"
        );

        // First delivery
        auditEventListener.onScheduleAccepted(event);
        List<SpaScheduleHistory> historyFirst = historyRepository.findBySessionIdOrderByCreatedAtAsc(session.getSpaSessionId());
        assertEquals(1, historyFirst.size());

        // Duplicate delivery with exact same event
        auditEventListener.onScheduleAccepted(event);
        List<SpaScheduleHistory> historySecond = historyRepository.findBySessionIdOrderByCreatedAtAsc(session.getSpaSessionId());
        assertEquals(1, historySecond.size(), "Duplicate delivery must NOT create duplicate history rows");

        List<SpaDispatchOutboxEntity> outboxItems = outboxRepository.findBySessionIdOrderByCreatedAtAsc(session.getSpaSessionId());
        assertEquals(2, outboxItems.size(), "Should only have 2 outbox entries (1 Calendar, 1 Email)");
    }

    @Test
    @DisplayName("BR-M3-14: Independent failure: Calendar succeeds, Notification fails; on retry only Notification runs")
    public void testIndependentFailureOfCalendarAndSmtpDispatch() {
        // Notification throws exception; Calendar runs in decoupled mode (succeeds)
        when(mockNotificationPort.sendScheduleChangeNotification(any(), anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("SMTP transport timeout"));

        SpaScheduleAcceptedEvent event = new SpaScheduleAcceptedEvent(
                session, "CREATED", null, "SCHEDULED",
                null, session.getScheduledStartAt(),
                null, therapist.getTherapistId(),
                null, room.getRoomId(),
                1, "RECEPTIONIST",
                "Front desk booking",
                "guest@heavenstay.com", "Guest"
        );

        auditEventListener.onScheduleAccepted(event);

        List<SpaDispatchOutboxEntity> outboxItems = outboxRepository.findBySessionIdOrderByCreatedAtAsc(session.getSpaSessionId());
        SpaDispatchOutboxEntity calOutbox = outboxItems.stream().filter(o -> "CALENDAR".equals(o.getChannel())).findFirst().orElseThrow();
        SpaDispatchOutboxEntity emailOutbox = outboxItems.stream().filter(o -> "EMAIL".equals(o.getChannel())).findFirst().orElseThrow();

        assertEquals("SENT", calOutbox.getStatus(), "Calendar outbox should succeed");
        assertEquals("FAILED", emailOutbox.getStatus(), "Email outbox should fail");
        assertTrue(emailOutbox.getLastError().contains("SMTP transport timeout"));

        // Now fix notification using doReturn to avoid throwing during stubbing
        doReturn(true).when(mockNotificationPort).sendScheduleChangeNotification(any(), anyString(), anyString(), anyString());

        outboxWorker.processPendingOutboxDispatches();

        SpaDispatchOutboxEntity calAfter = outboxRepository.findById(calOutbox.getOutboxId()).orElseThrow();
        SpaDispatchOutboxEntity emailAfter = outboxRepository.findById(emailOutbox.getOutboxId()).orElseThrow();

        assertEquals("SENT", calAfter.getStatus());
        assertEquals("SENT", emailAfter.getStatus());
    }
}
