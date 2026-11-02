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
import com.heavenstay.hswrms.m3spa.service.TherapistStatusService;
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

/**
 * Automated recovery orchestration verification for BR-M3-13.
 *
 * Verifies that updating a therapist's operational status to INACTIVE or SUSPENDED
 * automatically triggers same-time recovery across active upcoming sessions:
 * 1. Automatic rematching preserving exact session interval if replacement therapist exists.
 * 2. Automatic transition to RESCHEDULING awaiting Customer consent if no qualified replacement exists.
 * 3. Status changes to ACTIVE do not trigger session alterations.
 */
@SpringBootTest
@Import(SpaTestConfig.class)
@Transactional
public class TherapistRecoveryOrchestrationTest {

    @Autowired
    private TherapistStatusService therapistStatusService;

    @Autowired
    private SpaSessionService spaSessionService;

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
    private Therapist primaryTherapist;
    private Therapist backupTherapist;
    private TreatmentRoom treatmentRoom;

    @BeforeEach
    public void setUp() {
        treatment = new SpaTreatment("Hydrotherapy Reflexology", 60, BigDecimal.valueOf(100), TreatmentStatus.ACTIVE);
        treatment = treatmentRepository.save(treatment);

        treatmentRoom = new TreatmentRoom("Suite Orchidee", "STANDARD", TreatmentRoomStatus.AVAILABLE.name());
        treatmentRoom = roomRepository.save(treatmentRoom);

        compatibilityRepository.save(new TreatmentRoomCompatibility(treatmentRoom, treatment));

        // Primary therapist (will be suspended)
        primaryTherapist = new Therapist(801, TherapistStatus.ACTIVE);
        primaryTherapist.setDisplayName("Therapist Alpha");
        primaryTherapist = therapistRepository.save(primaryTherapist);
        qualificationRepository.save(new TherapistTreatmentQualification(primaryTherapist, treatment));

        // Backup qualified therapist
        backupTherapist = new Therapist(802, TherapistStatus.ACTIVE);
        backupTherapist.setDisplayName("Therapist Beta");
        backupTherapist = therapistRepository.save(backupTherapist);
        qualificationRepository.save(new TherapistTreatmentQualification(backupTherapist, treatment));
    }

    @Test
    @DisplayName("BR-M3-13 Orchestration: Therapist suspension automatically rematches session to available qualified therapist preserving exact interval")
    public void testTherapistSuspensionTriggersAutomaticRematching() {
        LocalDateTime futureStart = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime futureEnd = futureStart.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                primaryTherapist.getTherapistId(),
                treatmentRoom.getRoomId(),
                futureStart,
                futureEnd,
                201,
                "Need soothing therapy"
        );
        SpaSessionDto booked = spaSessionService.confirmReservation(req, 1);
        assertEquals(primaryTherapist.getTherapistId(), booked.getTherapistId());
        assertEquals(SpaSessionStatus.SCHEDULED, booked.getSessionStatus());

        // When: Primary therapist is suspended via TherapistStatusService
        therapistStatusService.updateTherapistStatus(
                primaryTherapist.getTherapistId(),
                TherapistStatus.SUSPENDED,
                "Emergency medical leave"
        );

        // Then: The session must have been automatically rematched to backupTherapist
        SpaSession recoveredSession = sessionRepository.findById(booked.getSpaSessionId()).orElseThrow();
        assertEquals(backupTherapist.getTherapistId(), recoveredSession.getTherapist().getTherapistId(),
                "Session must be automatically reassigned to the qualified backup therapist!");
        assertEquals(futureStart, recoveredSession.getScheduledStartAt(),
                "Exact scheduled interval must be strictly preserved!");
        assertEquals(SpaSessionStatus.SCHEDULED, recoveredSession.getSessionStatus(),
                "Session status must remain SCHEDULED after successful same-time rematch!");
    }

    @Test
    @DisplayName("BR-M3-13 Orchestration: When no qualified replacement is available, session transitions to RESCHEDULING awaiting customer consent")
    public void testTherapistInactivationAwaitsConsentWhenNoReplacementAvailable() {
        // Suspend the backup therapist first so that no qualified replacement exists
        backupTherapist.setTherapistStatus(TherapistStatus.INACTIVE);
        therapistRepository.save(backupTherapist);

        LocalDateTime futureStart = LocalDateTime.now().plusDays(3).withHour(14).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime futureEnd = futureStart.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                primaryTherapist.getTherapistId(),
                treatmentRoom.getRoomId(),
                futureStart,
                futureEnd,
                202,
                "Afternoon relaxation"
        );
        SpaSessionDto booked = spaSessionService.confirmReservation(req, 1);

        // When: Primary therapist is deactivated
        therapistStatusService.updateTherapistStatus(
                primaryTherapist.getTherapistId(),
                TherapistStatus.INACTIVE,
                "Resignation"
        );

        // Then: Without a replacement therapist, session must transition to RESCHEDULING
        SpaSession sessionInDb = sessionRepository.findById(booked.getSpaSessionId()).orElseThrow();
        assertEquals(SpaSessionStatus.RESCHEDULING, sessionInDb.getSessionStatus(),
                "Session must transition to RESCHEDULING awaiting Customer consent when same-time replacement is impossible!");
        assertEquals(futureStart, sessionInDb.getScheduledStartAt(),
                "Original start time must not be silently altered!");
    }

    @Test
    @DisplayName("BR-M3-13 Orchestration: Status change to ACTIVE does not trigger recovery")
    public void testTherapistActivationDoesNotTriggerRecovery() {
        LocalDateTime futureStart = LocalDateTime.now().plusDays(2).withHour(16).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime futureEnd = futureStart.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                primaryTherapist.getTherapistId(),
                treatmentRoom.getRoomId(),
                futureStart,
                futureEnd,
                203,
                "Evening therapy"
        );
        SpaSessionDto booked = spaSessionService.confirmReservation(req, 1);

        // When: Primary therapist status set to ACTIVE (e.g. renewal/reactivation)
        therapistStatusService.updateTherapistStatus(
                primaryTherapist.getTherapistId(),
                TherapistStatus.ACTIVE,
                "Certified active"
        );

        // Then: Session remains assigned to primary therapist with no alterations
        SpaSession sessionInDb = sessionRepository.findById(booked.getSpaSessionId()).orElseThrow();
        assertEquals(primaryTherapist.getTherapistId(), sessionInDb.getTherapist().getTherapistId());
        assertEquals(SpaSessionStatus.SCHEDULED, sessionInDb.getSessionStatus());
    }
}
