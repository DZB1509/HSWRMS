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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

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

    @Autowired
    private PlatformTransactionManager transactionManager;

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

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    @DisplayName("BR-M3-14 Concurrency: Two workers racing concurrently on the same PENDING record result in exactly one claim and dispatch")
    public void testTwoConcurrentWorkersClaimingSameRecord() throws Exception {
        try {
            AtomicInteger providerCallCount = new AtomicInteger(0);
            when(mockNotificationPort.sendScheduleChangeNotification(any(), anyString(), anyString(), anyString()))
                    .thenAnswer(inv -> {
                        providerCallCount.incrementAndGet();
                        Thread.sleep(50);
                        return true;
                    });

            SpaDispatchOutboxEntity pending = new SpaDispatchOutboxEntity(
                    1001L, session.getSpaSessionId(), "EMAIL",
                    "concurrent@heavenstay.com", "Concurrent Guest",
                    "RESCHEDULED", "Concurrent worker claim verification",
                    null, "outbox-concurrent-claim-key-" + System.nanoTime()
            );
            pending = outboxRepository.saveAndFlush(pending);
            final Long targetOutboxId = pending.getOutboxId();

            ExecutorService pool = Executors.newFixedThreadPool(2);
            CountDownLatch readyLatch = new CountDownLatch(2);
            CountDownLatch startLatch = new CountDownLatch(1);

            Callable<Boolean> workerATask = () -> {
                readyLatch.countDown();
                startLatch.await(5, TimeUnit.SECONDS);
                SpaDispatchOutboxEntity candidate = outboxRepository.findById(targetOutboxId).orElseThrow();
                return outboxWorker.claimAndProcessEntry(candidate, "worker-node-A");
            };

            Callable<Boolean> workerBTask = () -> {
                readyLatch.countDown();
                startLatch.await(5, TimeUnit.SECONDS);
                SpaDispatchOutboxEntity candidate = outboxRepository.findById(targetOutboxId).orElseThrow();
                return outboxWorker.claimAndProcessEntry(candidate, "worker-node-B");
            };

            Future<Boolean> futureA = pool.submit(workerATask);
            Future<Boolean> futureB = pool.submit(workerBTask);

            assertTrue(readyLatch.await(5, TimeUnit.SECONDS), "Both worker threads must reach ready barrier");
            startLatch.countDown();

            boolean resultA = futureA.get(10, TimeUnit.SECONDS);
            boolean resultB = futureB.get(10, TimeUnit.SECONDS);
            pool.shutdownNow();

            assertTrue(resultA ^ resultB, "Exactly one worker must succeed in claiming and processing the record (A=" + resultA + ", B=" + resultB + ")");
            assertEquals(1, providerCallCount.get(), "External notification provider must be invoked exactly once");

            SpaDispatchOutboxEntity finalState = outboxRepository.findById(targetOutboxId).orElseThrow();
            assertEquals("SENT", finalState.getStatus());
            assertNull(finalState.getClaimedAt(), "Claim timestamp must be cleared upon SENT completion");
            assertNull(finalState.getClaimedBy(), "Claim owner must be cleared upon SENT completion");
        } finally {
            outboxRepository.deleteAll();
            historyRepository.deleteAll();
            sessionRepository.deleteAll();
            qualificationRepository.deleteAll();
            compatibilityRepository.deleteAll();
            therapistRepository.deleteAll();
            roomRepository.deleteAll();
            treatmentRepository.deleteAll();
        }
    }

    @Test
    @DisplayName("BR-M3-14 Concurrency: Worker interruption leaves stale PROCESSING claim which is recovered after lease timeout")
    public void testWorkerInterruptionAndStaleClaimRecovery() {
        when(mockNotificationPort.sendScheduleChangeNotification(any(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        // 1. Fresh PROCESSING claim (not stale) must NOT be stolen by another worker
        SpaDispatchOutboxEntity activeClaim = new SpaDispatchOutboxEntity(
                1002L, session.getSpaSessionId(), "EMAIL",
                "active@heavenstay.com", "Active Claim Guest",
                "RESCHEDULED", "Fresh claim in progress",
                null, "outbox-fresh-claim-key-1"
        );
        activeClaim.setStatus("PROCESSING");
        activeClaim.setClaimedBy("worker-node-1");
        activeClaim.setClaimedAt(LocalDateTime.now().minusMinutes(1)); // Only 1 min old (< 5 min threshold)
        activeClaim = outboxRepository.saveAndFlush(activeClaim);

        boolean stolen = outboxWorker.claimAndProcessEntry(activeClaim, "worker-node-2");
        assertFalse(stolen, "Fresh PROCESSING claim must not be stolen by another worker before lease expiration");

        // 2. Stale PROCESSING claim (> 5 min old after worker crash/interruption) MUST be recovered
        SpaDispatchOutboxEntity staleClaim = new SpaDispatchOutboxEntity(
                1003L, session.getSpaSessionId(), "EMAIL",
                "stale@heavenstay.com", "Stale Claim Guest",
                "RESCHEDULED", "Interrupted worker stale claim",
                null, "outbox-stale-claim-key-1"
        );
        staleClaim.setStatus("PROCESSING");
        staleClaim.setClaimedBy("worker-crashed-node");
        staleClaim.setClaimedAt(LocalDateTime.now().minusMinutes(SpaDispatchOutboxWorker.STALE_CLAIM_MINUTES + 2));
        staleClaim = outboxRepository.saveAndFlush(staleClaim);

        int recoveredCount = outboxWorker.processPendingOutboxDispatches("worker-recovery-node");
        assertEquals(1, recoveredCount, "Recovery worker must reclaim and process only the stale PROCESSING entry");

        SpaDispatchOutboxEntity recovered = outboxRepository.findById(staleClaim.getOutboxId()).orElseThrow();
        assertEquals("SENT", recovered.getStatus(), "Stale claim must transition to SENT after recovery");
        assertNotNull(recovered.getProcessedAt());
        assertNull(recovered.getClaimedAt());
        assertNull(recovered.getClaimedBy());

        SpaDispatchOutboxEntity untouchedActive = outboxRepository.findById(activeClaim.getOutboxId()).orElseThrow();
        assertEquals("PROCESSING", untouchedActive.getStatus(), "Fresh claim must remain PROCESSING");
        assertEquals("worker-node-1", untouchedActive.getClaimedBy());
    }

    @Test
    @DisplayName("BR-M3-14 Delivery Semantics: Provider success followed by crash before marking SENT results in At-Least-Once redelivery on stale recovery")
    public void testProviderSuccessFollowedByCrashBeforeMarkSent() {
        AtomicInteger smtpDeliveries = new AtomicInteger(0);
        when(mockNotificationPort.sendScheduleChangeNotification(any(), anyString(), anyString(), anyString()))
                .thenAnswer(inv -> {
                    smtpDeliveries.incrementAndGet();
                    return true;
                });

        // Simulate Worker 1 claiming the record and invoking SMTP, then crashing before DB status update to SENT
        SpaDispatchOutboxEntity item = new SpaDispatchOutboxEntity(
                1004L, session.getSpaSessionId(), "EMAIL",
                "atleastonce@heavenstay.com", "AtLeastOnce Guest",
                "RESCHEDULED", "At-least-once crash window simulation",
                null, "outbox-at-least-once-key-1"
        );
        item = outboxRepository.saveAndFlush(item);

        boolean claimedByWorker1 = outboxWorker.tryClaimRecord(item.getOutboxId(), "worker-crashing");
        assertTrue(claimedByWorker1);

        // Worker 1 calls external provider (delivery #1)
        mockNotificationPort.sendScheduleChangeNotification(
                session, item.getCustomerEmail(), item.getCustomerName(), item.getChangeDetails()
        );
        assertEquals(1, smtpDeliveries.get());

        // Simulate crash: status remains PROCESSING and claim ages past threshold
        SpaDispatchOutboxEntity crashedState = outboxRepository.findById(item.getOutboxId()).orElseThrow();
        assertEquals("PROCESSING", crashedState.getStatus());
        crashedState.setClaimedAt(LocalDateTime.now().minusMinutes(SpaDispatchOutboxWorker.STALE_CLAIM_MINUTES + 1));
        outboxRepository.saveAndFlush(crashedState);

        // Worker 2 sweeps after lease expiration -> re-delivers (delivery #2) and marks SENT
        int dispatched = outboxWorker.processPendingOutboxDispatches("worker-survivor");
        assertEquals(1, dispatched);
        assertEquals(2, smtpDeliveries.get(), "At-Least-Once semantics: crash after external call but before DB completion causes redelivery");

        SpaDispatchOutboxEntity finalState = outboxRepository.findById(item.getOutboxId()).orElseThrow();
        assertEquals("SENT", finalState.getStatus());
    }

    @Test
    @DisplayName("BR-M3-14 Retry Exhaustion: Outbox entry stops retrying once retryCount reaches maxRetries (5)")
    public void testRetryExhaustionStopsFurtherDispatchAttempts() {
        when(mockNotificationPort.sendScheduleChangeNotification(any(), anyString(), anyString(), anyString()))
                .thenReturn(false);

        SpaDispatchOutboxEntity item = new SpaDispatchOutboxEntity(
                1005L, session.getSpaSessionId(), "EMAIL",
                "exhausted@heavenstay.com", "Exhausted Guest",
                "RESCHEDULED", "Retry exhaustion verification",
                null, "outbox-retry-exhaustion-key-1"
        );
        item.setStatus("FAILED");
        item.setRetryCount(4); // 1 attempt remaining before hitting maxRetries = 5
        item = outboxRepository.saveAndFlush(item);

        // Attempt #5 fails and increments retryCount to 5
        int processed5th = outboxWorker.processPendingOutboxDispatches("worker-retry");
        assertEquals(0, processed5th);

        SpaDispatchOutboxEntity after5th = outboxRepository.findById(item.getOutboxId()).orElseThrow();
        assertEquals(5, after5th.getRetryCount(), "Retry count must reach maxRetries (5)");
        assertEquals("FAILED", after5th.getStatus());

        // Even if provider recovers now, exhausted entry (retryCount == 5) must NOT be claimed or dispatched
        reset(mockNotificationPort);
        when(mockNotificationPort.sendScheduleChangeNotification(any(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        int processedAfterExhaustion = outboxWorker.processPendingOutboxDispatches("worker-retry");
        assertEquals(0, processedAfterExhaustion, "Exhausted outbox entry must not be processed");
        verify(mockNotificationPort, never()).sendScheduleChangeNotification(any(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("BR-M3-14 Transaction Rollback: Rolled-back schedule transaction leaves neither history nor outbox orphan records")
    public void testTransactionRollbackLeavesNoOrphanOutboxOrHistoryRecords() {
        when(mockNotificationPort.sendScheduleChangeNotification(any(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        Long sessionId = session.getSpaSessionId();
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        assertThrows(RuntimeException.class, () -> txTemplate.executeWithoutResult(status -> {
            SpaScheduleAcceptedEvent event = new SpaScheduleAcceptedEvent(
                    session, "RESCHEDULED", "CONFIRMED", "CONFIRMED",
                    session.getScheduledStartAt(), session.getScheduledStartAt().plusHours(1),
                    therapist.getTherapistId(), therapist.getTherapistId(),
                    room.getRoomId(), room.getRoomId(),
                    1, "RECEPTIONIST",
                    "Rollback test transition",
                    "rollback@heavenstay.com", "Rollback Guest"
            );
            auditEventListener.onScheduleAccepted(event);
            throw new RuntimeException("Simulated business transaction rollback after audit event");
        }));

        List<SpaScheduleHistory> histories = historyRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        List<SpaDispatchOutboxEntity> outboxes = outboxRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        assertTrue(histories.isEmpty(), "Rolled-back transaction must not leave schedule history records");
        assertTrue(outboxes.isEmpty(), "Rolled-back transaction must not leave orphan outbox records");
    }
}
