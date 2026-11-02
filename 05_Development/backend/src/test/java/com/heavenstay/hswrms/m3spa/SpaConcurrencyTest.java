package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.m3spa.dto.request.ConfirmReservationRequest;
import com.heavenstay.hswrms.m3spa.dto.response.SpaSessionDto;
import com.heavenstay.hswrms.m3spa.entity.*;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.context.annotation.Import;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(SpaTestConfig.class)
public class SpaConcurrencyTest {

    @Autowired
    private SpaTreatmentRepository treatmentRepository;

    @Autowired
    private TherapistRepository therapistRepository;

    @Autowired
    private TreatmentRoomRepository roomRepository;

    @Autowired
    private TherapistTreatmentQualificationRepository qualificationRepository;

    @Autowired
    private TreatmentRoomCompatibilityRepository compatibilityRepository;

    @Autowired
    private SpaSessionRepository sessionRepository;

    @Autowired
    private SpaSessionService spaSessionService;

    private SpaTreatment treatment;
    private Therapist therapist;
    private TreatmentRoom room;

    @BeforeEach
    public void setup() {
        sessionRepository.deleteAll();
        qualificationRepository.deleteAll();
        compatibilityRepository.deleteAll();
        treatmentRepository.deleteAll();
        therapistRepository.deleteAll();
        roomRepository.deleteAll();

        treatment = new SpaTreatment(
                "Aromatherapy Stress Relief",
                60,
                new BigDecimal("1500000"),
                "Massage",
                "Relaxing essential oils"
        );
        treatment = treatmentRepository.save(treatment);

        therapist = new Therapist(20, TherapistStatus.ACTIVE);
        therapist.setDisplayName("Hoang Nam");
        therapist = therapistRepository.save(therapist);

        room = new TreatmentRoom("Bamboo Suite", TreatmentRoomStatus.AVAILABLE);
        room = roomRepository.save(room);

        qualificationRepository.save(new TherapistTreatmentQualification(therapist, treatment));
        compatibilityRepository.save(new TreatmentRoomCompatibility(room, treatment));
    }

    @Test
    @DisplayName("27 & 28. Concurrency Test: Two competing confirmations result in exactly ONE successful reservation and zero partial reservations")
    public void testConcurrentCompetingReservations() throws Exception {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        int numberOfThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch readyLatch = new CountDownLatch(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        Callable<Void> task1 = () -> {
            readyLatch.countDown();
            startLatch.await();
            try {
                ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                        treatment.getTreatmentId(),
                        therapist.getTherapistId(),
                        room.getRoomId(),
                        start,
                        end,
                        101,
                        "Guest 1 Competing"
                );
                SpaSessionDto dto = spaSessionService.confirmReservation(req1, 1);
                if (dto != null) {
                    successCount.incrementAndGet();
                }
            } catch (ConflictException ex) {
                conflictCount.incrementAndGet();
            }
            return null;
        };

        Callable<Void> task2 = () -> {
            readyLatch.countDown();
            startLatch.await();
            try {
                ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                        treatment.getTreatmentId(),
                        therapist.getTherapistId(),
                        room.getRoomId(),
                        start,
                        end,
                        102,
                        "Guest 2 Competing"
                );
                SpaSessionDto dto = spaSessionService.confirmReservation(req2, 2);
                if (dto != null) {
                    successCount.incrementAndGet();
                }
            } catch (ConflictException ex) {
                conflictCount.incrementAndGet();
            }
            return null;
        };

        Future<Void> f1 = executor.submit(task1);
        Future<Void> f2 = executor.submit(task2);

        // Wait for both threads to be ready, then trigger them simultaneously
        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        f1.get(10, TimeUnit.SECONDS);
        f2.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Verification of concurrency invariants:
        assertEquals(1, successCount.get(), "Exactly ONE competing transaction must succeed!");
        assertEquals(1, conflictCount.get(), "Exactly ONE competing transaction must be rejected with ConflictException!");

        long totalSessions = sessionRepository.count();
        assertEquals(1, totalSessions, "Database must persist exactly ONE SpaSession — no partial reservations!");
    }
}
