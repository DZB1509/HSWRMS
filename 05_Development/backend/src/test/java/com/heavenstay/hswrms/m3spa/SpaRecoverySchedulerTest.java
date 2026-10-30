package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.entity.*;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentRoomStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentStatus;
import com.heavenstay.hswrms.m3spa.repository.*;
import com.heavenstay.hswrms.m3spa.scheduler.TherapistRecoveryScheduler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(SpaTestConfig.class)
@Transactional
public class SpaRecoverySchedulerTest {

    @Autowired
    private TherapistRecoveryScheduler recoveryScheduler;

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

    private SpaTreatment treatment;
    private Therapist therapist1;
    private Therapist therapist2;
    private TreatmentRoom room1;
    private TreatmentRoom room2;

    @BeforeEach
    public void setUp() {
        treatment = new SpaTreatment("Balinese Deep Tissue", 60, BigDecimal.valueOf(160), TreatmentStatus.ACTIVE);
        treatment = treatmentRepository.save(treatment);

        room1 = new TreatmentRoom("Suite Lotus", "STANDARD", TreatmentRoomStatus.AVAILABLE.name());
        room1 = roomRepository.save(room1);

        room2 = new TreatmentRoom("Suite Frangipani", "STANDARD", TreatmentRoomStatus.AVAILABLE.name());
        room2 = roomRepository.save(room2);

        compatibilityRepository.save(new TreatmentRoomCompatibility(room1, treatment));
        compatibilityRepository.save(new TreatmentRoomCompatibility(room2, treatment));

        therapist1 = new Therapist(801, TherapistStatus.ACTIVE);
        therapist1.setDisplayName("Therapist Alpha");
        therapist1 = therapistRepository.save(therapist1);
        qualificationRepository.save(new TherapistTreatmentQualification(therapist1, treatment));

        therapist2 = new Therapist(802, TherapistStatus.ACTIVE);
        therapist2.setDisplayName("Therapist Beta");
        therapist2 = therapistRepository.save(therapist2);
        qualificationRepository.save(new TherapistTreatmentQualification(therapist2, treatment));
    }

    @Test
    @DisplayName("BR-M3-13: Background recovery sweep detects stranded session with suspended therapist and rematches it")
    public void testRecoveryOfStrandedSessionsAfterInterruptedProcess() {
        LocalDateTime start = LocalDateTime.now().plusDays(2).withHour(11).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusMinutes(60);

        SpaSession session = new SpaSession();
        session.setTreatment(treatment);
        session.setTherapist(therapist1);
        session.setTreatmentRoom(room1);
        session.setScheduledStartAt(start);
        session.setScheduledEndAt(end);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);
        session.setRetreatBookingId(101);
        session = sessionRepository.save(session);

        // Simulate crash / interrupted event listener: Therapist 1 is directly suspended in DB
        therapist1.setTherapistStatus(TherapistStatus.SUSPENDED);
        therapistRepository.save(therapist1);

        // Verify session is currently stranded with suspended therapist
        SpaSession beforeSweep = sessionRepository.findById(session.getSpaSessionId()).orElseThrow();
        assertEquals(TherapistStatus.SUSPENDED, beforeSweep.getTherapist().getTherapistStatus());
        assertEquals(SpaSessionStatus.SCHEDULED, beforeSweep.getSessionStatus());

        // Background recovery sweep runs
        int processed = recoveryScheduler.runTherapistRecoverySweep();
        assertTrue(processed >= 1, "Sweep must process at least 1 stranded session");

        // Verify session was recovered and rematched to qualified Therapist 2
        SpaSession afterSweep = sessionRepository.findById(session.getSpaSessionId()).orElseThrow();
        assertEquals(therapist2.getTherapistId(), afterSweep.getTherapist().getTherapistId(),
                "Session must be rematched to alternative qualified Therapist 2");
        assertEquals(start, afterSweep.getScheduledStartAt(), "Slot start time must be preserved");
        assertEquals(SpaSessionStatus.SCHEDULED, afterSweep.getSessionStatus());
    }

    @Test
    @DisplayName("BR-M3-13: Sweep transitions session to RESCHEDULING when no replacement therapist is available")
    public void testRecoverySweepAwaitsConsentWhenNoReplacementAvailable() {
        // Disqualify therapist2
        qualificationRepository.deleteAll();
        qualificationRepository.save(new TherapistTreatmentQualification(therapist1, treatment));

        LocalDateTime start = LocalDateTime.now().plusDays(2).withHour(14).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusMinutes(60);

        SpaSession session = new SpaSession();
        session.setTreatment(treatment);
        session.setTherapist(therapist1);
        session.setTreatmentRoom(room1);
        session.setScheduledStartAt(start);
        session.setScheduledEndAt(end);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);
        session.setRetreatBookingId(101);
        session = sessionRepository.save(session);

        // Inactive therapist directly in DB
        therapist1.setTherapistStatus(TherapistStatus.INACTIVE);
        therapistRepository.save(therapist1);

        // Background sweep runs
        int processed = recoveryScheduler.runTherapistRecoverySweep();
        assertEquals(1, processed);

        SpaSession afterSweep = sessionRepository.findById(session.getSpaSessionId()).orElseThrow();
        assertEquals(SpaSessionStatus.RESCHEDULING, afterSweep.getSessionStatus(),
                "Without an alternative therapist, session must transition to RESCHEDULING awaiting consent");
    }

    @Test
    @DisplayName("BR-M3-13: Sweep is idempotent and processes 0 sessions when all sessions are healthy")
    public void testSweepIdempotency() {
        int processed = recoveryScheduler.runTherapistRecoverySweep();
        assertEquals(0, processed, "Healthy sessions require zero recovery actions");
    }
}

