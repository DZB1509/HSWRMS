package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.dto.response.RecoveryResultDto;
import com.heavenstay.hswrms.m3spa.entity.*;
import com.heavenstay.hswrms.m3spa.entity.enums.*;
import com.heavenstay.hswrms.m3spa.repository.*;
import com.heavenstay.hswrms.m3spa.service.SessionRecoveryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(SpaTestConfig.class)
class SpaRecoveryConcurrencyTest {
    @Autowired private SessionRecoveryService recoveryService;
    @Autowired private SpaSessionRepository sessionRepository;
    @Autowired private SpaTreatmentRepository treatmentRepository;
    @Autowired private TherapistRepository therapistRepository;
    @Autowired private TreatmentRoomRepository roomRepository;
    @Autowired private TherapistTreatmentQualificationRepository qualificationRepository;
    @Autowired private TreatmentRoomCompatibilityRepository compatibilityRepository;
    @Autowired private SpaScheduleHistoryRepository historyRepository;
    @Autowired private SpaDispatchOutboxRepository outboxRepository;

    private SpaTreatment treatment;
    private Therapist unavailableTherapist;
    private Therapist replacementTherapist;
    private TreatmentRoom room;

    @BeforeEach
    void setUp() {
        clearFixtures();

        treatment = treatmentRepository.save(new SpaTreatment("Recovery Race Therapy", 60,
                BigDecimal.valueOf(125), TreatmentStatus.ACTIVE));
        room = roomRepository.save(new TreatmentRoom("Recovery Race Room", "STANDARD",
                TreatmentRoomStatus.AVAILABLE.name()));
        unavailableTherapist = therapistRepository.save(new Therapist(9411, TherapistStatus.ACTIVE));
        replacementTherapist = therapistRepository.save(new Therapist(9412, TherapistStatus.ACTIVE));
        qualificationRepository.save(new TherapistTreatmentQualification(unavailableTherapist, treatment));
        qualificationRepository.save(new TherapistTreatmentQualification(replacementTherapist, treatment));
        compatibilityRepository.save(new TreatmentRoomCompatibility(room, treatment));
    }

    @AfterEach
    void tearDown() {
        clearFixtures();
    }

    @Test
    void concurrentTherapistRecoveryTriggersCommitOneSameTimeReplacement() throws Exception {
        LocalDateTime start = LocalDateTime.now().plusDays(2).withHour(11).withMinute(0).withSecond(0).withNano(0);
        SpaSession session = new SpaSession();
        session.setRetreatBookingId(941);
        session.setTreatment(treatment);
        session.setTherapist(unavailableTherapist);
        session.setTreatmentRoom(room);
        session.setScheduledStartAt(start);
        session.setScheduledEndAt(start.plusMinutes(60));
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);
        session = sessionRepository.saveAndFlush(session);
        Long sessionId = session.getSpaSessionId();

        unavailableTherapist.setTherapistStatus(TherapistStatus.SUSPENDED);
        therapistRepository.saveAndFlush(unavailableTherapist);

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch release = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<RecoveryResultDto> first = executor.submit(() -> triggerRecovery(sessionId, ready, release));
            Future<RecoveryResultDto> second = executor.submit(() -> triggerRecovery(sessionId, ready, release));
            assertTrue(ready.await(5, TimeUnit.SECONDS), "Both recovery triggers must reach the start gate");
            release.countDown();

            assertNotNull(first.get(15, TimeUnit.SECONDS));
            assertNotNull(second.get(15, TimeUnit.SECONDS));
        } finally {
            release.countDown();
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS), "Recovery worker threads must terminate");
        }

        SpaSession recovered = sessionRepository.findById(sessionId).orElseThrow();
        assertEquals(SpaSessionStatus.SCHEDULED, recovered.getSessionStatus());
        assertEquals(replacementTherapist.getTherapistId(), recovered.getTherapist().getTherapistId());
        assertEquals(start, recovered.getScheduledStartAt(), "Concurrent recovery must preserve the original interval");
        assertEquals(2, recovered.getScheduleVersion(), "The schedule version must advance exactly once");

        List<SpaScheduleHistory> history = historyRepository.findBySessionIdOrderByHistoryIdAsc(sessionId);
        assertEquals(1, history.stream().filter(item -> "RECOVERED".equals(item.getChangeType())).count(),
                "Concurrent recovery triggers must persist only one recovery history event");
    }

    private RecoveryResultDto triggerRecovery(Long sessionId, CountDownLatch ready, CountDownLatch release)
            throws InterruptedException {
        ready.countDown();
        if (!release.await(5, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Timed out waiting for concurrent recovery start");
        }
        return recoveryService.attemptSameTimeRecovery(sessionId, true);
    }

    private void clearFixtures() {
        outboxRepository.deleteAll();
        historyRepository.deleteAll();
        sessionRepository.deleteAll();
        qualificationRepository.deleteAll();
        compatibilityRepository.deleteAll();
        treatmentRepository.deleteAll();
        therapistRepository.deleteAll();
        roomRepository.deleteAll();
    }
}
