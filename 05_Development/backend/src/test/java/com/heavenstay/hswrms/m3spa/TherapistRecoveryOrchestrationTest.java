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
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.heavenstay.hswrms.security.CustomUserDetails;
import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
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
@AutoConfigureMockMvc
@Import(SpaTestConfig.class)
@Transactional
public class TherapistRecoveryOrchestrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TherapistStatusService therapistStatusService;

    @Autowired
    private SpaSessionService spaSessionService;

    @Autowired
    private com.heavenstay.hswrms.m3spa.service.SessionRecoveryService sessionRecoveryService;

    @Autowired
    private SpaDispatchOutboxRepository outboxRepository;

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

    @Test
    @DisplayName("BR-M3-09 & BR-M3-13: Replacement conflict blocks silent displacement of another customer booking")
    public void testReplacementConflict_DisplacementBlockedWithoutConsent() {
        LocalDateTime futureStart = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime futureEnd = futureStart.plusMinutes(60);

        // Session 1 for Customer 1 with primaryTherapist in treatmentRoom
        ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                primaryTherapist.getTherapistId(),
                treatmentRoom.getRoomId(),
                futureStart,
                futureEnd,
                201,
                "Customer 1 Session"
        );
        SpaSessionDto booked1 = spaSessionService.confirmReservation(req1, 1);

        // Second room for Customer 2
        TreatmentRoom room2 = roomRepository.save(new TreatmentRoom("Suite Rose", "STANDARD", TreatmentRoomStatus.AVAILABLE.name()));
        compatibilityRepository.save(new TreatmentRoomCompatibility(room2, treatment));

        // Session 2 for Customer 2 with backupTherapist at the EXACT same time
        ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                backupTherapist.getTherapistId(),
                room2.getRoomId(),
                futureStart,
                futureEnd,
                202,
                "Customer 2 Session with Backup Therapist"
        );
        SpaSessionDto booked2 = spaSessionService.confirmReservation(req2, 2);

        // When: Primary therapist is suspended
        therapistStatusService.updateTherapistStatus(
                primaryTherapist.getTherapistId(),
                TherapistStatus.SUSPENDED,
                "Sudden absence"
        );

        // Then:
        // 1. Customer 2's session must NOT be displaced
        SpaSession session2After = sessionRepository.findById(booked2.getSpaSessionId()).orElseThrow();
        assertEquals(backupTherapist.getTherapistId(), session2After.getTherapist().getTherapistId(),
                "Customer 2's therapist assignment must NOT be displaced!");
        assertEquals(futureStart, session2After.getScheduledStartAt());
        assertEquals(SpaSessionStatus.SCHEDULED, session2After.getSessionStatus());

        // 2. Customer 1's session cannot take backupTherapist (conflict), so transitions to RESCHEDULING
        SpaSession session1After = sessionRepository.findById(booked1.getSpaSessionId()).orElseThrow();
        assertEquals(SpaSessionStatus.RESCHEDULING, session1After.getSessionStatus(),
                "Session 1 must move to RESCHEDULING awaiting Customer consent without silent displacement!");
        assertEquals(futureStart, session1After.getScheduledStartAt(),
                "Session 1 time must remain preserved without silent alteration!");
    }

    @Test
    @DisplayName("BR-M3-13 Idempotency: Repeated recovery execution does not duplicate outbox records or alter state")
    public void testRepeatedRecoveryProcessingIsIdempotent() {
        LocalDateTime futureStart = LocalDateTime.now().plusDays(2).withHour(11).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime futureEnd = futureStart.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                primaryTherapist.getTherapistId(),
                treatmentRoom.getRoomId(),
                futureStart,
                futureEnd,
                201,
                "Initial booking"
        );
        SpaSessionDto booked = spaSessionService.confirmReservation(req, 1);

        // First recovery: suspend primary therapist (rematches to backupTherapist)
        therapistStatusService.updateTherapistStatus(
                primaryTherapist.getTherapistId(),
                TherapistStatus.SUSPENDED,
                "Emergency leave"
        );

        SpaSession afterFirst = sessionRepository.findById(booked.getSpaSessionId()).orElseThrow();
        assertEquals(backupTherapist.getTherapistId(), afterFirst.getTherapist().getTherapistId());
        int scheduleVersion = afterFirst.getScheduleVersion();

        long outboxCountBefore = outboxRepository.findBySessionIdOrderByCreatedAtAsc(booked.getSpaSessionId()).size();

        // Second recovery invocation on the same session
        com.heavenstay.hswrms.m3spa.dto.response.RecoveryResultDto secondResult =
                sessionRecoveryService.attemptSameTimeRecovery(booked.getSpaSessionId());

        SpaSession afterSecond = sessionRepository.findById(booked.getSpaSessionId()).orElseThrow();
        assertEquals(scheduleVersion, afterSecond.getScheduleVersion(), "Schedule version must not increment on no-op repeat");
        assertEquals(backupTherapist.getTherapistId(), afterSecond.getTherapist().getTherapistId());

        long outboxCountAfter = outboxRepository.findBySessionIdOrderByCreatedAtAsc(booked.getSpaSessionId()).size();
        assertEquals(outboxCountBefore, outboxCountAfter, "No duplicate outbox entries should be created on repeated recovery");
    }

    @Test
    @DisplayName("BR-M3-13 HTTP REST E2E: Manager suspends therapist via REST API, automatically rematching customer session and updating schedule/outbox")
    public void testTrigger3B_HttpRestApi_ManagerSuspensionTriggersRematchingE2E() throws Exception {
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

        // 1. Manager patches therapist status to SUSPENDED via HTTP REST endpoint
        mockMvc.perform(patch("/api/v1/therapist/" + primaryTherapist.getTherapistId() + "/status")
                .with(user(managerUser()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"SUSPENDED\",\"reason\":\"Emergency medical leave\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.therapistStatus").value("SUSPENDED"));

        // 2. Query session detail over HTTP REST endpoint
        mockMvc.perform(get("/api/v1/spa/sessions/" + booked.getSpaSessionId())
                .with(user(managerUser())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.therapistId").value(backupTherapist.getTherapistId()))
                .andExpect(jsonPath("$.data.sessionStatus").value("SCHEDULED"))
                .andExpect(jsonPath("$.data.scheduleVersion").value(2));

        // 3. Verify Outbox event generated for same-time recovery
        var outboxEntries = outboxRepository.findBySessionIdOrderByCreatedAtAsc(booked.getSpaSessionId());
        assertTrue(outboxEntries.stream().anyMatch(e -> "RECOVERED".equals(e.getChangeType())),
                "Outbox must record RECOVERED dispatch event for notification/calendar sync");
    }

    @Test
    @DisplayName("BR-M3-13 HTTP REST E2E: Replacement conflict blocks silent displacement of another customer booking via REST API")
    public void testTrigger3B_HttpRestApi_DisplacementBlockedCustomerConsentRequiredE2E() throws Exception {
        LocalDateTime futureStart = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime futureEnd = futureStart.plusMinutes(60);

        // Customer 1 books session with primaryTherapist in treatmentRoom
        ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                primaryTherapist.getTherapistId(),
                treatmentRoom.getRoomId(),
                futureStart,
                futureEnd,
                201,
                "Customer 1 Session"
        );
        SpaSessionDto booked1 = spaSessionService.confirmReservation(req1, 1);

        // Customer 2 books session with backupTherapist in room2 at the EXACT same time
        TreatmentRoom room2 = roomRepository.save(new TreatmentRoom("Suite Rose", "STANDARD", TreatmentRoomStatus.AVAILABLE.name()));
        compatibilityRepository.save(new TreatmentRoomCompatibility(room2, treatment));

        ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                backupTherapist.getTherapistId(),
                room2.getRoomId(),
                futureStart,
                futureEnd,
                202,
                "Customer 2 Session with Backup Therapist"
        );
        SpaSessionDto booked2 = spaSessionService.confirmReservation(req2, 2);

        // 1. Manager patches primary therapist status to SUSPENDED via HTTP REST endpoint
        mockMvc.perform(patch("/api/v1/therapist/" + primaryTherapist.getTherapistId() + "/status")
                .with(user(managerUser()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"SUSPENDED\",\"reason\":\"Sudden absence\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 2. Customer 2's session must NOT be displaced over HTTP REST endpoint
        mockMvc.perform(get("/api/v1/spa/sessions/" + booked2.getSpaSessionId())
                .with(user(managerUser())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.therapistId").value(backupTherapist.getTherapistId()))
                .andExpect(jsonPath("$.data.sessionStatus").value("SCHEDULED"));

        // 3. Customer 1's session must transition to RESCHEDULING awaiting consent without time change
        mockMvc.perform(get("/api/v1/spa/sessions/" + booked1.getSpaSessionId())
                .with(user(managerUser())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sessionStatus").value("RESCHEDULING"));

        // 4. Verify Outbox event generated for rescheduling consent
        var outboxEntries = outboxRepository.findBySessionIdOrderByCreatedAtAsc(booked1.getSpaSessionId());
        assertTrue(outboxEntries.stream().anyMatch(e -> "RESCHEDULING".equals(e.getChangeType())),
                "Outbox must record RESCHEDULING event awaiting customer consent");
    }

    private CustomUserDetails managerUser() {
        return new CustomUserDetails(1, "manager@heavenstay.com", "", "Sarah Jenkins", true, List.of("ROLE_MANAGER"));
    }
}
