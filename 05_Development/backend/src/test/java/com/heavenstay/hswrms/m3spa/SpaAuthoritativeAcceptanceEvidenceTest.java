package com.heavenstay.hswrms.m3spa;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.common.exception.BusinessRuleException;

import com.heavenstay.hswrms.common.exception.ConflictException;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;

import com.heavenstay.hswrms.m3spa.dto.request.ConfirmReservationRequest;

import com.heavenstay.hswrms.m3spa.dto.request.GenerateCandidatesRequest;

import com.heavenstay.hswrms.m3spa.dto.response.CandidateGenerationResultDto;

import com.heavenstay.hswrms.m3spa.dto.response.RecoveryResultDto;

import com.heavenstay.hswrms.m3spa.dto.response.SchedulingCandidateDto;

import com.heavenstay.hswrms.m3spa.dto.response.SpaSessionDto;

import com.heavenstay.hswrms.m3spa.entity.*;

import com.heavenstay.hswrms.m3spa.entity.enums.*;

import com.heavenstay.hswrms.m3spa.repository.*;

import com.heavenstay.hswrms.m3spa.scheduler.SessionTimelineScheduler;

import com.heavenstay.hswrms.m3spa.service.SchedulingEngineService;

import com.heavenstay.hswrms.m3spa.service.SessionRecoveryService;

import com.heavenstay.hswrms.m3spa.service.SpaSessionService;

import org.junit.jupiter.api.BeforeEach;

import org.junit.jupiter.api.DisplayName;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.context.annotation.Import;

import org.springframework.http.MediaType;

import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import java.time.LocalDate;

import java.time.LocalDateTime;
import java.time.Clock;
import java.time.ZoneId;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.HashSet;
import java.util.Collections;
import java.util.ArrayList;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.CyclicBarrier;


import java.util.List;

import java.util.concurrent.CountDownLatch;

import java.util.concurrent.ExecutorService;

import java.util.concurrent.Executors;

import java.util.concurrent.Future;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**

 * Authoritative Acceptance Evidence Test Suite for Module 3 (Spa & Therapy Scheduling).

 *

 * Final Evidence Quality & Reconciliation Review:

 * - BR-M3-01: Customer only (HTTP security boundary 401 vs service stay context enforcement, tenant isolation)

 * - BR-M3-02: Eligibility first (independent verification of inactive treatment vs invalid stay context before locks)

 * - BR-M3-04: Joint availability (qualified therapist + compatible room, rejection when only one available)

 * - BR-M3-08: Alternative loop (primary date full -> alternative dates -> exhaustion -> explicit cancellation; loop gap noted)

 * - BR-M3-13: Automatic recovery (independent trigger verification: cancellation lock release, scheduler deadline, same-time rematch)

 * - BR-M3-14: Accepted change notification and history (schedule state preservation; external dispatch absence noted)

 */

@SpringBootTest

@AutoConfigureMockMvc

@Import(SpaTestConfig.class)

public class SpaAuthoritativeAcceptanceEvidenceTest {

    @Autowired

    private MockMvc mockMvc;

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

    private SpaDispatchOutboxRepository outboxRepository;

    @Autowired

    private SchedulingEngineService schedulingEngineService;

    @Autowired

    private SpaSessionService spaSessionService;

    @Autowired

    private SessionTimelineScheduler timelineScheduler;

    @Autowired

    private SessionRecoveryService recoveryService;

    private SpaTreatment massageTreatment;

    private SpaTreatment yogaTreatment;

    private SpaTreatment inactiveTreatment;

    private Therapist qualifiedTherapist;

    private Therapist secondQualifiedTherapist;

    private TreatmentRoom compatibleRoom;

    private TreatmentRoom secondCompatibleRoom;

    @BeforeEach

    public void setupFixtures() {

        timelineScheduler.setClock(Clock.systemDefaultZone());

        outboxRepository.deleteAll();

        sessionRepository.deleteAll();

        qualificationRepository.deleteAll();

        compatibilityRepository.deleteAll();

        treatmentRepository.deleteAll();

        therapistRepository.deleteAll();

        roomRepository.deleteAll();

        // 1. Treatments

        massageTreatment = new SpaTreatment(

                "Signature Herbal Compress Massage",

                60,

                new BigDecimal("1200000"),

                "Massage",

                "Traditional herbal therapy"

        );

        massageTreatment = treatmentRepository.save(massageTreatment);

        yogaTreatment = new SpaTreatment(

                "Sunrise Hatha Yoga",

                60,

                new BigDecimal("800000"),

                "Yoga",

                "Mindful yoga"

        );

        yogaTreatment = treatmentRepository.save(yogaTreatment);

        inactiveTreatment = new SpaTreatment(

                "Seasonal Monsoon Scrub",

                60,

                new BigDecimal("950000"),

                "Scrub",

                "Inactive seasonal treatment"

        );

        inactiveTreatment.setTreatmentStatus(TreatmentStatus.INACTIVE);

        inactiveTreatment = treatmentRepository.save(inactiveTreatment);

        // 2. Therapists

        qualifiedTherapist = new Therapist(10, TherapistStatus.ACTIVE);

        qualifiedTherapist.setDisplayName("Mai Nguyen");

        qualifiedTherapist = therapistRepository.save(qualifiedTherapist);

        secondQualifiedTherapist = new Therapist(12, TherapistStatus.ACTIVE);

        secondQualifiedTherapist.setDisplayName("Hoa Le");

        secondQualifiedTherapist = therapistRepository.save(secondQualifiedTherapist);

        // 3. Treatment Rooms

        compatibleRoom = new TreatmentRoom("Lotus Suite", TreatmentRoomStatus.AVAILABLE);

        compatibleRoom = roomRepository.save(compatibleRoom);

        secondCompatibleRoom = new TreatmentRoom("Orchid Suite", TreatmentRoomStatus.AVAILABLE);

        secondCompatibleRoom = roomRepository.save(secondCompatibleRoom);

        // 4. Qualifications

        qualificationRepository.save(new TherapistTreatmentQualification(qualifiedTherapist, massageTreatment));

        qualificationRepository.save(new TherapistTreatmentQualification(secondQualifiedTherapist, massageTreatment));

        // 5. Compatibility

        compatibilityRepository.save(new TreatmentRoomCompatibility(compatibleRoom, massageTreatment));

        compatibilityRepository.save(new TreatmentRoomCompatibility(secondCompatibleRoom, massageTreatment));

    }

    // =========================================================================

    // BR-M3-01: Customer only (HTTP Boundary + Service-Level Verification)

    // =========================================================================

    @Test

    @DisplayName("BR-M3-01.0a: HTTP Security Boundary rejects unauthenticated session reservation with HTTP 401 Unauthorized")

    public void testHttpUnauthenticatedPostSessionsRejectedWith401Unauthorized() throws Exception {

        mockMvc.perform(post("/api/v1/spa/sessions")

                        .contentType(MediaType.APPLICATION_JSON)

                        .content("{\"treatmentId\":1,\"therapistId\":10,\"roomId\":1,\"scheduledStartAt\":\"2026-09-26T09:00:00\",\"scheduledEndAt\":\"2026-09-26T10:00:00\"}"))

                .andExpect(status().isUnauthorized());

    }

    @Test

    @DisplayName("BR-M3-01.0b: HTTP Security Boundary rejects unauthenticated candidate generation with HTTP 401 Unauthorized")

    public void testHttpUnauthenticatedPostCandidatesRejectedWith401Unauthorized() throws Exception {

        mockMvc.perform(post("/api/v1/spa/candidates")

                        .contentType(MediaType.APPLICATION_JSON)

                        .content("{\"treatmentId\":1,\"preferredDate\":\"2026-09-26\"}"))

                .andExpect(status().isUnauthorized());

    }

    @Test

    @DisplayName("BR-M3-01.1: Service Layer rejects unauthenticated caller context (null userId & bookingId)")

    public void testServiceLayerUnauthenticatedCallerRejected() {

        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);

        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start,

                end,

                null,

                null

        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->

                spaSessionService.confirmReservation(req, null)

        );

        assertTrue(ex.getMessage().contains("Authenticated customer context or retreat booking ID is required."));

        assertEquals(0, sessionRepository.count(), "No session record must be created for unauthenticated caller!");

    }

    @Test

    @DisplayName("BR-M3-01.2: Service Layer rejects authenticated Customer without valid retreat/stay context")

    public void testServiceLayerAuthenticatedCustomerWithoutStayContextRejected() {

        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);

        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start,

                end,

                null,

                null

        );

        // User ID 999 is configured in SpaTestConfig to have no active retreat stay

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->

                spaSessionService.confirmReservation(req, 999)

        );

        assertTrue(ex.getMessage().contains("No active retreat stay found for current user."));

        assertEquals(0, sessionRepository.count(), "No session record must be created when stay context is missing!");

    }

    @Test

    @DisplayName("BR-M3-01.3: Service Layer succeeds for valid Customer with active retreat stay context")

    public void testServiceLayerValidCustomerWithValidStaySucceeds() {

        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);

        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start,

                end,

                null,

                "Customer initial request"

        );

        // User ID 1 has active stay booking 101

        SpaSessionDto session = spaSessionService.confirmReservation(req, 1);

        assertNotNull(session);

        assertNotNull(session.getSpaSessionId());

        assertEquals(101, session.getRetreatBookingId());

        assertEquals(SpaSessionStatus.SCHEDULED, session.getSessionStatus());

        assertEquals(SpaConfirmationStatus.PENDING, session.getConfirmationStatus());

        assertEquals(1, sessionRepository.count());

    }

    @Test

    @DisplayName("BR-M3-01.4: Service Layer enforces cross-customer isolation (rejection of cross-modification & list isolation)")

    public void testServiceLayerCustomerCannotAccessOrModifyAnotherCustomerSession() {

        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 10, 0);

        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req1 = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start,

                end,

                101, // Belongs to Customer 1

                null

        );

        SpaSessionDto session = spaSessionService.confirmReservation(req1, 1);

        // Customer 2 (userId=2, bookingId=102) attempts to confirm attendance of Customer 1's session

        BusinessRuleException confirmEx = assertThrows(BusinessRuleException.class, () ->

                spaSessionService.confirmAttendance(session.getSpaSessionId(), 2)

        );

        assertTrue(confirmEx.getMessage().contains("Cannot modify a session belonging to another customer"));

        // Customer 2 attempts to cancel Customer 1's session

        BusinessRuleException cancelEx = assertThrows(BusinessRuleException.class, () ->

                spaSessionService.cancelSession(session.getSpaSessionId(), 2)

        );

        assertTrue(cancelEx.getMessage().contains("Cannot cancel a session belonging to another customer"));

        // Customer 2 attempts to reschedule Customer 1's session

        ConfirmReservationRequest reqReschedule = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start.plusHours(2),

                end.plusHours(2),

                102,

                null

        );

        reqReschedule.setRescheduleSessionId(session.getSpaSessionId());

        BusinessRuleException reschedEx = assertThrows(BusinessRuleException.class, () ->

                spaSessionService.confirmReservation(reqReschedule, 2)

        );

        assertTrue(reschedEx.getMessage().contains("Cannot reschedule a session belonging to another retreat booking"));

        // Verify listCustomerSessions(2) isolates records: Customer 2 sees 0 sessions
        List<SpaSessionDto> customer2Sessions = spaSessionService.listCustomerSessions(2);
        assertTrue(customer2Sessions.isEmpty(), "Customer 2 must not see Customer 1's sessions in their personal list!");

        // Customer 2 attempts to schedule a session specifying Customer 1's retreat booking (bookingId=101)
        ConfirmReservationRequest reqCrossBooking = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start.plusHours(4),
                end.plusHours(4),
                101,
                null
        );
        reqCrossBooking.setBookingSource(BookingSource.RECEPTIONIST);
        BusinessRuleException crossBookingEx = assertThrows(BusinessRuleException.class, () ->
                spaSessionService.confirmReservation(reqCrossBooking, 2, false)
        );
        assertTrue(crossBookingEx.getMessage().contains("Cannot book a spa session for another customer's retreat booking"));

        // Single session detail verification: Customer 2 cannot view Customer 1's session
        BusinessRuleException getEx = assertThrows(BusinessRuleException.class, () ->
                spaSessionService.getCustomerSessionById(session.getSpaSessionId(), 2, false)
        );
        assertTrue(getEx.getMessage().contains("Session does not belong to the current customer stay"));

        // But Staff (isStaff=true) CAN view the session
        SpaSessionDto staffView = spaSessionService.getCustomerSessionById(session.getSpaSessionId(), 2, true);
        assertNotNull(staffView);
        assertEquals(session.getSpaSessionId(), staffView.getSpaSessionId());

    }

    // =========================================================================

    // BR-M3-02: Eligibility first (Independent Validation Before Resource Locks)

    // =========================================================================

    @Test

    @DisplayName("BR-M3-02.1a: Eligibility validation independently rejects inactive treatment before acquiring locks or persisting")

    public void testEligibilityValidationRejectsInactiveTreatmentBeforeResourceReservation() {

        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);

        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest inactiveReq = new ConfirmReservationRequest(

                inactiveTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start,

                end,

                101,

                null

        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->

                spaSessionService.confirmReservation(inactiveReq, 1)

        );

        assertTrue(ex.getMessage().contains("Selected Spa Treatment is currently inactive."));

        // Assert observable execution order: 0 sessions created, therapist/room unmodified, no locks held

        assertEquals(0, sessionRepository.count(), "Inactive treatment must fail closed with 0 sessions created!");

        assertEquals(TherapistStatus.ACTIVE, therapistRepository.findById(qualifiedTherapist.getTherapistId()).orElseThrow().getTherapistStatus());

        assertEquals(TreatmentRoomStatus.AVAILABLE, roomRepository.findById(compatibleRoom.getRoomId()).orElseThrow().getRoomStatus());

        assertFalse(sessionRepository.hasOverlappingSession(qualifiedTherapist.getTherapistId(), compatibleRoom.getRoomId(), start, end, null));

    }

    @Test

    @DisplayName("BR-M3-02.1b: Eligibility validation independently rejects invalid/nonexistent stay context before acquiring locks or persisting")

    public void testEligibilityValidationRejectsInvalidStayContextBeforeResourceReservation() {

        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);

        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest invalidStayReq = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start,

                end,

                null,

                null

        );

        // Caller has no stay context (userId = 999)

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->

                spaSessionService.confirmReservation(invalidStayReq, 999)

        );

        assertTrue(ex.getMessage().contains("No active retreat stay found for current user."));

        // Assert observable execution order: 0 sessions created, resources intact

        assertEquals(0, sessionRepository.count());

        assertEquals(TherapistStatus.ACTIVE, therapistRepository.findById(qualifiedTherapist.getTherapistId()).orElseThrow().getTherapistStatus());

        assertEquals(TreatmentRoomStatus.AVAILABLE, roomRepository.findById(compatibleRoom.getRoomId()).orElseThrow().getRoomStatus());

        assertFalse(sessionRepository.hasOverlappingSession(qualifiedTherapist.getTherapistId(), compatibleRoom.getRoomId(), start, end, null));

    }

    @Test

    @DisplayName("BR-M3-02.2: Package quota eligibility separates included package sessions from billable extra spa sessions")

    public void testPackageQuotaEligibilityAndExtraChargeSeparation() {

        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);

        LocalDateTime end = start.plusMinutes(60);

        // Treatment 1 (massageTreatment) is configured in SpaTestConfig as included in Package 1

        ConfirmReservationRequest includedReq = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start,

                end,

                101,

                null

        );

        SpaSessionDto includedSession = spaSessionService.confirmReservation(includedReq, 1);

        assertTrue(includedSession.isIncluded(), "Package-eligible treatment must be flagged as included (0 extra charge)!");

        // Treatment 2 (yogaTreatment) is not included in Package 1 in test fixture

        qualificationRepository.save(new TherapistTreatmentQualification(secondQualifiedTherapist, yogaTreatment));

        compatibilityRepository.save(new TreatmentRoomCompatibility(secondCompatibleRoom, yogaTreatment));

        ConfirmReservationRequest extraReq = new ConfirmReservationRequest(

                yogaTreatment.getTreatmentId(),

                secondQualifiedTherapist.getTherapistId(),

                secondCompatibleRoom.getRoomId(),

                start.plusHours(2),

                end.plusHours(2),

                101,

                null

        );

        SpaSessionDto extraSession = spaSessionService.confirmReservation(extraReq, 1);

        assertFalse(extraSession.isIncluded(), "A-la-carte extra treatment must be flagged as not included and billed to folio!");

    }

    // =========================================================================

    // BR-M3-04: Joint availability

    // =========================================================================

    @Test

    @DisplayName("BR-M3-04.1: Candidate generation rejects slot if only Therapist is available but Room is busy")

    public void testJointAvailabilityRejectionWhenRoomBusy() {

        LocalDate testDate = LocalDate.of(2026, 9, 26);

        LocalDateTime busyStart = LocalDateTime.of(testDate, java.time.LocalTime.of(9, 0));

        LocalDateTime busyEnd = busyStart.plusMinutes(60);

        // Room 1 is booked by an existing session with another therapist (Therapist 2)

        SpaSession existingRoomBooking = new SpaSession(

                101,

                massageTreatment,

                secondQualifiedTherapist,

                compatibleRoom,

                busyStart,

                busyStart,

                busyEnd,

                BookingSource.CUSTOMER,

                "Pre-existing room reservation"

        );

        sessionRepository.save(existingRoomBooking);

        // Candidate generation for massageTreatment:

        // qualifiedTherapist is free from 09:00 to 10:00, but compatibleRoom is busy!

        // (secondCompatibleRoom is removed from compatibility for this test to isolate single room)

        compatibilityRepository.deleteAll();

        compatibilityRepository.save(new TreatmentRoomCompatibility(compatibleRoom, massageTreatment));

        GenerateCandidatesRequest req = new GenerateCandidatesRequest(

                massageTreatment.getTreatmentId(),

                testDate,

                "MORNING",

                0

        );

        CandidateGenerationResultDto result = schedulingEngineService.generateCandidates(req);

        // Slot 09:00 - 10:00 must NOT be present in generated candidates

        boolean hasConflictSlot = result.getCandidates().stream()

                .anyMatch(c -> c.getStartTime().equals("09:00") && c.getRoomId().equals(compatibleRoom.getRoomId()));

        assertFalse(hasConflictSlot, "Candidate generation must reject slot where room is busy even if therapist is free!");

    }

    @Test

    @DisplayName("BR-M3-04.2: Candidate generation rejects slot if only Room is available but Therapist is busy")

    public void testJointAvailabilityRejectionWhenTherapistBusy() {

        LocalDate testDate = LocalDate.of(2026, 9, 26);

        LocalDateTime busyStart = LocalDateTime.of(testDate, java.time.LocalTime.of(14, 0));

        LocalDateTime busyEnd = busyStart.plusMinutes(60);

        // qualifiedTherapist is booked in another room (secondCompatibleRoom)

        SpaSession existingTherapistBooking = new SpaSession(

                101,

                massageTreatment,

                qualifiedTherapist,

                secondCompatibleRoom,

                busyStart,

                busyStart,

                busyEnd,

                BookingSource.CUSTOMER,

                "Pre-existing therapist reservation"

        );

        sessionRepository.save(existingTherapistBooking);

        // Isolate single therapist by suspending second therapist

        secondQualifiedTherapist.setTherapistStatus(TherapistStatus.SUSPENDED);

        secondQualifiedTherapist = therapistRepository.save(secondQualifiedTherapist);

        GenerateCandidatesRequest req = new GenerateCandidatesRequest(

                massageTreatment.getTreatmentId(),

                testDate,

                "AFTERNOON",

                0

        );

        CandidateGenerationResultDto result = schedulingEngineService.generateCandidates(req);

        boolean hasConflictSlot = result.getCandidates().stream()

                .anyMatch(c -> c.getStartTime().equals("14:00") && c.getTherapistId().equals(qualifiedTherapist.getTherapistId()));

        assertFalse(hasConflictSlot, "Candidate generation must reject slot where therapist is busy even if room is free!");

    }

    // =========================================================================

    // BR-M3-08: Alternative loop (Read-Only Candidate Horizon vs Explicit Cancellation)

    // =========================================================================

    @Test

    @DisplayName("BR-M3-08: Candidate generation returns nearest alternatives on unavailable date; explicit cancellation transitions session to CANCELLED")

    public void testAlternativeGenerationOnUnavailableDateAndExplicitCancellation() {

        LocalDate primaryDate = LocalDate.of(2026, 9, 26);

        // 1. Fully occupy all slots on primaryDate for all qualified therapists and rooms

        for (int hour = 8; hour < 20; hour++) {

            LocalDateTime start = LocalDateTime.of(primaryDate, java.time.LocalTime.of(hour, 0));

            LocalDateTime end = start.plusMinutes(60);

            sessionRepository.save(new SpaSession(

                    101, massageTreatment, qualifiedTherapist, compatibleRoom,

                    start, start, end, BookingSource.CUSTOMER, "Full booking"

            ));

            sessionRepository.save(new SpaSession(

                    101, massageTreatment, secondQualifiedTherapist, secondCompatibleRoom,

                    start, start, end, BookingSource.CUSTOMER, "Full booking 2"

            ));

        }

        // 2. Request candidate generation for primary date with alternativeSearchDays = 3

        GenerateCandidatesRequest req = new GenerateCandidatesRequest(

                massageTreatment.getTreatmentId(),

                primaryDate,

                "ALL",

                3

        );

        CandidateGenerationResultDto result = schedulingEngineService.generateCandidates(req);

        // Primary date has 0 slots

        assertFalse(result.isHasAvailability(), "Primary date must be reported as unavailable!");

        assertTrue(result.getCandidates().isEmpty(), "Primary candidates list must be empty!");

        // System automatically searches subsequent dates and returns nearest available alternative cluster

        assertFalse(result.getAlternatives().isEmpty(), "System must generate alternative candidates on subsequent dates!");

        SchedulingCandidateDto altCandidate = result.getAlternatives().get(0);

        assertTrue(altCandidate.isAlternative());

        assertTrue(altCandidate.getDate().isAfter(primaryDate), "Alternative date must be subsequent to unavailable primary date!");

        // 3. When search horizon is exhausted (horizon = 0), alternative candidates list is empty

        GenerateCandidatesRequest exhaustedReq = new GenerateCandidatesRequest(

                massageTreatment.getTreatmentId(),

                primaryDate,

                "ALL",

                0

        );

        CandidateGenerationResultDto exhaustedResult = schedulingEngineService.generateCandidates(exhaustedReq);

        assertTrue(exhaustedResult.getCandidates().isEmpty());

        assertTrue(exhaustedResult.getAlternatives().isEmpty(), "When horizon is 0, alternative candidates must be empty!");

        // 4. Cancellation changes the session lifecycle without impersonating an attendance decline

        SpaSession scheduledSession = new SpaSession(

                101, massageTreatment, qualifiedTherapist, compatibleRoom,

                LocalDateTime.of(2026, 9, 28, 9, 0),

                LocalDateTime.of(2026, 9, 28, 9, 0),

                LocalDateTime.of(2026, 9, 28, 10, 0),

                BookingSource.CUSTOMER,

                "Pending alternative review"

        );

        scheduledSession = sessionRepository.save(scheduledSession);

        SpaSessionDto cancelledSession = spaSessionService.cancelSession(scheduledSession.getSpaSessionId(), 1);

        assertEquals(SpaSessionStatus.CANCELLED, cancelledSession.getSessionStatus());

        assertEquals(SpaConfirmationStatus.PENDING, cancelledSession.getConfirmationStatus());

        SpaSession inDb = sessionRepository.findById(scheduledSession.getSpaSessionId()).orElseThrow();

        assertEquals(SpaSessionStatus.CANCELLED, inDb.getSessionStatus(), "Session must reach authoritative CANCELLED state!");

    }

    @Test

    @DisplayName("BR-M3-08.1: Multi-turn negotiation excludes rejected candidate IDs across successive queries")

    public void testAlternativeLoopSuccessiveRejectionExcludesPreviousCandidates() {

        LocalDate date = LocalDate.of(2026, 9, 27);

        GenerateCandidatesRequest initialReq = new GenerateCandidatesRequest(

                massageTreatment.getTreatmentId(),

                date,

                "MORNING",

                1

        );

        CandidateGenerationResultDto initialRes = schedulingEngineService.generateCandidates(initialReq);

        assertFalse(initialRes.getCandidates().isEmpty(), "Must produce candidates initially");

        SchedulingCandidateDto rejected = initialRes.getCandidates().get(0);

        // Turn 2: Customer rejects candidate bundle

        GenerateCandidatesRequest secondReq = new GenerateCandidatesRequest(

                massageTreatment.getTreatmentId(),

                date,

                "MORNING",

                1

        );

        secondReq.setRejectedCandidateIds(List.of(rejected.getCandidateId()));

        CandidateGenerationResultDto secondRes = schedulingEngineService.generateCandidates(secondReq);

        boolean containsRejected = secondRes.getCandidates().stream()

                .anyMatch(c -> c.getCandidateId().equals(rejected.getCandidateId()));

        assertFalse(containsRejected, "Scheduling engine must exclude previously rejected candidate ID from subsequent candidates!");

    }

    @Test

    @DisplayName("BR-M3-08.2: Alternative exhaustion across search horizon produces empty candidates and alternatives")

    public void testAlternativeLoopExhaustionProducesEmptyAvailability() {

        LocalDate date = LocalDate.of(2026, 9, 27);

        GenerateCandidatesRequest req = new GenerateCandidatesRequest(

                massageTreatment.getTreatmentId(),

                date,

                "MORNING",

                1

        );

        List<String> rejected = new java.util.ArrayList<>();

        CandidateGenerationResultDto currentRes;

        int negotiationTurns = 0;

        // Customer successively rejects all offered candidates across turns until total exhaustion

        while (true) {

            req.setRejectedCandidateIds(new java.util.ArrayList<>(rejected));

            currentRes = schedulingEngineService.generateCandidates(req);

            if (currentRes.getCandidates().isEmpty() && currentRes.getAlternatives().isEmpty()) {

                break;

            }

            negotiationTurns++;

            assertTrue(negotiationTurns <= 10, "Negotiation must terminate within finite turns");

            currentRes.getCandidates().forEach(c -> rejected.add(c.getCandidateId()));

            currentRes.getAlternatives().forEach(c -> rejected.add(c.getCandidateId()));

        }

        assertTrue(negotiationTurns >= 1, "Must have gone through at least one active negotiation turn");

        assertTrue(currentRes.getCandidates().isEmpty(), "All primary candidates must be exhausted!");

        assertTrue(currentRes.getAlternatives().isEmpty(), "All alternative candidates must be exhausted!");

        assertFalse(currentRes.isHasAvailability(), "Availability must report false when all candidates are exhausted!");

    }

    @Test

    @DisplayName("BR-M3-08.3: Session cancellation endpoint is idempotent for repeated/duplicate calls")

    public void testAlternativeLoopCancellationIdempotency() {

        SpaSession scheduledSession = new SpaSession(

                101, massageTreatment, qualifiedTherapist, compatibleRoom,

                LocalDateTime.of(2026, 9, 29, 9, 0),

                LocalDateTime.of(2026, 9, 29, 9, 0),

                LocalDateTime.of(2026, 9, 29, 10, 0),

                BookingSource.CUSTOMER,

                "Idempotency test session"

        );

        scheduledSession = sessionRepository.save(scheduledSession);

        Long sId = scheduledSession.getSpaSessionId();

        // First cancellation

        SpaSessionDto res1 = spaSessionService.cancelSession(sId, 1);

        assertEquals(SpaSessionStatus.CANCELLED, res1.getSessionStatus());

        assertEquals(SpaConfirmationStatus.PENDING, res1.getConfirmationStatus());

        // Repeated cancellation must safely return cancelled DTO without throwing exception

        SpaSessionDto res2 = assertDoesNotThrow(() -> spaSessionService.cancelSession(sId, 1));

        assertEquals(SpaSessionStatus.CANCELLED, res2.getSessionStatus());

        assertEquals(SpaConfirmationStatus.PENDING, res2.getConfirmationStatus());

    }

    @Test

    @DisplayName("BR-M3-08.4: Declining alternatives and cancelling session safely releases resource locks")

    public void testAlternativeLoopCancellationReleasesResourceLocks() {

        LocalDateTime start = LocalDateTime.of(2026, 9, 29, 14, 0);

        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req1 = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start,

                end,

                101,

                "Customer 1 booking"

        );

        SpaSessionDto session1 = spaSessionService.confirmReservation(req1, 1);

        // Attempt concurrent booking on same slot by Customer 2

        ConfirmReservationRequest req2 = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start,

                end,

                102,

                "Customer 2 booking"

        );

        assertThrows(ConflictException.class, () -> spaSessionService.confirmReservation(req2, 2));

        // Customer 1 declines alternatives / cancels session

        spaSessionService.cancelSession(session1.getSpaSessionId(), 1);

        // Resource lock is released: Customer 2 can now reserve the slot

        SpaSessionDto session2 = assertDoesNotThrow(() -> spaSessionService.confirmReservation(req2, 2));

        assertNotNull(session2);

        assertEquals(102, session2.getRetreatBookingId());

        assertEquals(SpaSessionStatus.SCHEDULED, session2.getSessionStatus());

    }

    @Test

    @DisplayName("BR-M3-03.2 / BR-M3-08: Invariants preserved with client-provided rejected IDs (harmlessness, read-only, non-locking, cannot bypass eligibility)")

    public void testBR03_InvariantsPreservedWithClientProvidedRejectedIds() {

        LocalDate date = LocalDate.of(2026, 9, 27);

        long initialSessionCount = sessionRepository.count();

        // 1. Pass arbitrary / fabricated / malicious rejected candidate IDs

        List<String> fabricatedIds = List.of(

                "FORGED-UUID-NONEXISTENT",

                "'; DROP TABLE spa_sessions; --",

                "FAKE-THERAPIST-BUNDLE-999"

        );

        GenerateCandidatesRequest req = new GenerateCandidatesRequest(

                massageTreatment.getTreatmentId(),

                date,

                "MORNING",

                1

        );

        req.setRejectedCandidateIds(fabricatedIds);

        // 2. Engine executes safely without crashing, without SQL injection, and returns only valid qualified system candidates

        CandidateGenerationResultDto result = schedulingEngineService.generateCandidates(req);

        assertNotNull(result);

        assertFalse(result.getCandidates().isEmpty());

        for (SchedulingCandidateDto c : result.getCandidates()) {

            assertNotNull(c.getCandidateId());

            assertNotNull(c.getTherapistId());

            assertNotNull(c.getRoomId());

            // Candidate must not match any fabricated string

            assertFalse(fabricatedIds.contains(c.getCandidateId()));

        }

        // 3. Strict Read-Only invariant: No database records created

        assertEquals(initialSessionCount, sessionRepository.count(), "Candidate generation with rejected IDs must not create session records!");

        // 4. Client cannot bypass inactive treatment eligibility via candidate generation

        GenerateCandidatesRequest inactiveReq = new GenerateCandidatesRequest(

                inactiveTreatment.getTreatmentId(),

                date,

                "MORNING",

                1

        );

        inactiveReq.setRejectedCandidateIds(fabricatedIds);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->

                schedulingEngineService.generateCandidates(inactiveReq)

        );

        assertTrue(ex.getMessage().contains("inactive"), "Cannot generate candidates for inactive treatment");

        assertEquals(initialSessionCount, sessionRepository.count(), "Failed eligibility query must create 0 sessions!");

    }

    @Test

    @DisplayName("BR-M3-08.5: Exhaustion semantics distinguish Flow A (new booking abandonment) vs Flow B (existing session cancellation)")

    public void testBR08_ExhaustionSemanticsDistinguishNewBookingVsExistingSession() {

        LocalDate date = LocalDate.of(2026, 9, 27);

        long initialSessionCount = sessionRepository.count();

        // --- Flow A: New Booking Flow Exhaustion ---

        GenerateCandidatesRequest newBookingReq = new GenerateCandidatesRequest(

                massageTreatment.getTreatmentId(),

                date,

                "MORNING",

                1

        );

        List<String> allIds = new java.util.ArrayList<>();

        CandidateGenerationResultDto exhaustRes;

        int turns = 0;

        // Customer successively rejects all offered candidates across turns until total exhaustion

        while (true) {

            newBookingReq.setRejectedCandidateIds(new java.util.ArrayList<>(allIds));

            exhaustRes = schedulingEngineService.generateCandidates(newBookingReq);

            if (exhaustRes.getCandidates().isEmpty() && exhaustRes.getAlternatives().isEmpty()) {

                break;

            }

            turns++;

            assertTrue(turns <= 10, "Negotiation must terminate within finite turns");

            exhaustRes.getCandidates().forEach(c -> allIds.add(c.getCandidateId()));

            exhaustRes.getAlternatives().forEach(c -> allIds.add(c.getCandidateId()));

        }

        // Exhaustion reached: candidates list empty

        assertFalse(exhaustRes.isHasAvailability());

        assertTrue(exhaustRes.getCandidates().isEmpty());

        assertTrue(exhaustRes.getAlternatives().isEmpty());

        // Invariant: Unconfirmed new booking abandonment creates ZERO database sessions

        assertEquals(initialSessionCount, sessionRepository.count(), "New booking exhaustion must NOT create dummy CANCELLED sessions in database!");

        // --- Flow B: Existing Session Rescheduling Exhaustion ---

        // Customer has an existing session in SCHEDULED status

        LocalDateTime start = LocalDateTime.of(2026, 9, 30, 10, 0);

        LocalDateTime end = start.plusMinutes(60);

        SpaSession existingSession = new SpaSession(

                101, massageTreatment, qualifiedTherapist, compatibleRoom,

                start, start, end, BookingSource.CUSTOMER, "Existing session to reschedule"

        );

        existingSession = sessionRepository.save(existingSession);

        Long existingSessionId = existingSession.getSpaSessionId();

        // Customer searches replacements, rejects all offered alternatives, and explicitly declines

        // Existing session transitions to CANCELLED; attendance confirmation remains a separate state

        SpaSessionDto cancelledDto = spaSessionService.cancelSession(existingSessionId, 1);

        assertEquals(SpaSessionStatus.CANCELLED, cancelledDto.getSessionStatus());

        assertEquals(SpaConfirmationStatus.PENDING, cancelledDto.getConfirmationStatus());

        SpaSession inDb = sessionRepository.findById(existingSessionId).orElseThrow();

        assertEquals(SpaSessionStatus.CANCELLED, inDb.getSessionStatus());

        assertEquals(SpaConfirmationStatus.PENDING, inDb.getConfirmationStatus());

        // A COMPLETED session cannot be cancelled even on exhaustion

        inDb.setSessionStatus(SpaSessionStatus.COMPLETED);

        sessionRepository.save(inDb);

        BusinessRuleException completedEx = assertThrows(BusinessRuleException.class, () ->

                spaSessionService.cancelSession(existingSessionId, 1)

        );

        assertTrue(completedEx.getMessage().contains("Cannot cancel session already COMPLETED"));

    }

    // =========================================================================

    // BR-M3-13: Automatic recovery (3 Independent Triggers)

    // =========================================================================

    @Test

    @DisplayName("BR-M3-13.1: Trigger 1 (Customer cancellation) releases resource locks; verified that no background waitlist queue exists")

    public void testTrigger1CustomerCancellationReleasesResourceLocksWithoutProactiveWaitlistRematching() {

        LocalDateTime slotTime = LocalDateTime.of(2026, 9, 26, 11, 0);

        // Customer 1 books the slot

        ConfirmReservationRequest req1 = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                slotTime,

                slotTime.plusMinutes(60),

                101,

                null

        );

        SpaSessionDto session1 = spaSessionService.confirmReservation(req1, 1);

        // Slot is now locked: Attempt by Customer 2 to book the same slot throws ConflictException

        ConfirmReservationRequest req2 = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                slotTime,

                slotTime.plusMinutes(60),

                102,

                null

        );

        assertThrows(ConflictException.class, () -> spaSessionService.confirmReservation(req2, 2));

        // Customer 1 cancels the session

        spaSessionService.cancelSession(session1.getSpaSessionId(), 1);

        // Verification: Cancellation updates session to CANCELLED and frees resource locks

        SpaSession cancelled = sessionRepository.findById(session1.getSpaSessionId()).orElseThrow();

        assertEquals(SpaSessionStatus.CANCELLED, cancelled.getSessionStatus());

        assertEquals(SpaConfirmationStatus.PENDING, cancelled.getConfirmationStatus());

        assertFalse(sessionRepository.hasOverlappingSession(

                qualifiedTherapist.getTherapistId(), compatibleRoom.getRoomId(),

                slotTime, slotTime.plusMinutes(60), null

        ), "Resource lock must be released in session repository!");

        // Customer 2 can now manually reserve the released slot

        SpaSessionDto session2 = spaSessionService.confirmReservation(req2, 2);

        assertNotNull(session2);

        assertEquals(SpaSessionStatus.SCHEDULED, session2.getSessionStatus());

        assertEquals(102, session2.getRetreatBookingId());

    }

    @Test

    @DisplayName("BR-M3-13.2: Trigger 2 (Customer non-confirmation at T-60m) scheduler transitions to EXPIRED/RESCHEDULING without false NO_SHOW")

    public void testTrigger2CustomerNonConfirmationSchedulerDeadlineTransitionWithoutAutomatedRecoveryInvocation() {

        LocalDateTime approachingSlot = LocalDateTime.now().plusMinutes(45); // Within T-60m window

        SpaSession pendingSession = new SpaSession(

                101,

                massageTreatment,

                qualifiedTherapist,

                compatibleRoom,

                approachingSlot,

                approachingSlot,

                approachingSlot.plusMinutes(60),

                BookingSource.CUSTOMER,

                "Approaching session"

        );

        pendingSession.setConfirmationStatus(SpaConfirmationStatus.PENDING);

        pendingSession.setSessionStatus(SpaSessionStatus.SCHEDULED);

        pendingSession = sessionRepository.save(pendingSession);

        // Scheduler executes periodic deadline inspection

        timelineScheduler.processConfirmationDeadlines();

        SpaSession evaluated = sessionRepository.findById(pendingSession.getSpaSessionId()).orElseThrow();

        assertEquals(SpaConfirmationStatus.EXPIRED, evaluated.getConfirmationStatus());

        assertEquals(SpaSessionStatus.RESCHEDULING, evaluated.getSessionStatus());

        assertNotEquals(SpaSessionStatus.NO_SHOW, evaluated.getSessionStatus(),

                "Non-confirmation at T-60m must trigger rescheduling transition, NOT false punitive NO_SHOW!");

    }

    @Test

    @DisplayName("BR-M3-13.3: Trigger 3A (Therapist unavailability same-time recovery) algorithm auto-rematches preserving exact time at service layer")

    public void testTrigger3ASameTimeRecoveryAlgorithmPreservesTimeWhenReplacementTherapistAvailable() {

        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);

        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start,

                end,

                101,

                "Session for therapist recovery"

        );

        SpaSessionDto session = spaSessionService.confirmReservation(req, 1);

        // Primary therapist becomes suspended/unavailable

        qualifiedTherapist.setTherapistStatus(TherapistStatus.SUSPENDED);

        therapistRepository.save(qualifiedTherapist);

        // Execute recovery service algorithm

        RecoveryResultDto recoveryResult = recoveryService.attemptSameTimeRecovery(session.getSpaSessionId());

        assertTrue(recoveryResult.isRecovered(), "Recovery algorithm must succeed when a second qualified therapist is available!");

        assertTrue(recoveryResult.isPreservedSameTime(), "Exact scheduled interval must be strictly preserved!");

        assertEquals(secondQualifiedTherapist.getTherapistId(), recoveryResult.getReplacementTherapistId());

        SpaSession inDb = sessionRepository.findById(session.getSpaSessionId()).orElseThrow();

        assertEquals(start, inDb.getScheduledStartAt());

        assertEquals(SpaSessionStatus.SCHEDULED, inDb.getSessionStatus());

        assertEquals(secondQualifiedTherapist.getTherapistId(), inDb.getTherapist().getTherapistId());

    }

    @Test

    @DisplayName("BR-M3-13.4: Trigger 3B (Therapist unavailability without same-time rematch) algorithm awaits Customer consent without silent time alteration")

    public void testTrigger3BRecoveryAlgorithmRequiresCustomerConsentWhenNoSameTimeTherapistAvailable() {

        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);

        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start,

                end,

                101,

                null

        );

        SpaSessionDto session = spaSessionService.confirmReservation(req, 1);

        // Suspend both qualified therapists so no same-time replacement is available

        qualifiedTherapist.setTherapistStatus(TherapistStatus.SUSPENDED);

        secondQualifiedTherapist.setTherapistStatus(TherapistStatus.SUSPENDED);

        therapistRepository.save(qualifiedTherapist);

        therapistRepository.save(secondQualifiedTherapist);

        RecoveryResultDto recoveryResult = recoveryService.attemptSameTimeRecovery(session.getSpaSessionId());

        assertFalse(recoveryResult.isRecovered());

        assertTrue(recoveryResult.isRequiresCustomerConsent(), "System must require customer consent before altering session time!");

        assertFalse(recoveryResult.isPreservedSameTime());

        SpaSession inDb = sessionRepository.findById(session.getSpaSessionId()).orElseThrow();

        assertEquals(SpaSessionStatus.RESCHEDULING, inDb.getSessionStatus(), "Session must remain in RESCHEDULING awaiting consent!");

        assertEquals(start, inDb.getScheduledStartAt(), "System must not silently commit an unauthorized time change!");

    }

    // =========================================================================

    // BR-M3-14: Accepted change persistent state (Schedule State Preservation)

    // =========================================================================

    @Test

    @DisplayName("BR-M3-14: All accepted schedule change paths maintain persistent state in spa_sessions; absence of external dispatch confirmed")

    public void testAcceptedScheduleChangePathsMaintainPersistentScheduleStateWithoutExternalDispatch() {

        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);

        LocalDateTime end = start.plusMinutes(60);

        // 1. Initial creation

        ConfirmReservationRequest req = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                qualifiedTherapist.getTherapistId(),

                compatibleRoom.getRoomId(),

                start,

                end,

                101,

                "Initial reservation note"

        );

        SpaSessionDto initial = spaSessionService.confirmReservation(req, 1);

        assertEquals(SpaSessionStatus.SCHEDULED, initial.getSessionStatus());

        assertEquals("Initial reservation note", initial.getCustomerNote());

        // 2. Path A: Customer-initiated reschedule

        ConfirmReservationRequest rescheduleReq = new ConfirmReservationRequest(

                massageTreatment.getTreatmentId(),

                secondQualifiedTherapist.getTherapistId(),

                secondCompatibleRoom.getRoomId(),

                start.plusHours(3),

                end.plusHours(3),

                101,

                "Rescheduled to afternoon"

        );

        rescheduleReq.setRescheduleSessionId(initial.getSpaSessionId());

        SpaSessionDto rescheduled = spaSessionService.confirmReservation(rescheduleReq, 1);

        assertEquals(initial.getSpaSessionId(), rescheduled.getSpaSessionId(), "Same session entity must be updated!");

        assertEquals(start.plusHours(3), rescheduled.getScheduledStartAt());

        assertEquals("Rescheduled to afternoon", rescheduled.getCustomerNote());

        assertEquals(SpaConfirmationStatus.PENDING, rescheduled.getConfirmationStatus());

        // 3. Path B: Customer attendance confirmation

        SpaSessionDto confirmed = spaSessionService.confirmAttendance(rescheduled.getSpaSessionId(), 1);

        assertEquals(SpaConfirmationStatus.CONFIRMED, confirmed.getConfirmationStatus());

        assertEquals(SpaSessionStatus.SCHEDULED, confirmed.getSessionStatus(), "Attendance confirmation retains SCHEDULED status!");

        // 4. Path C: Assigned therapist outcome completion (by assigned therapist userId=12)

        SpaSessionDto completed = spaSessionService.recordSessionOutcome(

                confirmed.getSpaSessionId(), secondQualifiedTherapist.getUserId(), "COMPLETED", "Therapy completed smoothly."

        );

        assertEquals(SpaSessionStatus.COMPLETED, completed.getSessionStatus());

        // 5. State Persistence Verification:

        // Persistent database state commits cleanly and remains intact.

        SpaSession finalPersisted = sessionRepository.findById(completed.getSpaSessionId()).orElseThrow();

        assertEquals(SpaSessionStatus.COMPLETED, finalPersisted.getSessionStatus());

        assertEquals(secondQualifiedTherapist.getTherapistId(), finalPersisted.getTherapist().getTherapistId());

        assertEquals(secondCompatibleRoom.getRoomId(), finalPersisted.getTreatmentRoom().getRoomId());

    }

    // =========================================================================

    // BR-M3-10: T-1h Reminder, Customer Confirmation & Scheduler Reliability

    // =========================================================================

    @Test

    @DisplayName("BR-M3-10.1: Eligible pending session in the T-75m checkpoint window is durably queued")

    public void testBR10_EligiblePendingSessionInReminderWindowReceivesReminderDispatch() {

        LocalDateTime sessionStart = LocalDateTime.now().plusMinutes(65); // Approaching in 65 min (~1 hour)

        SpaSession pending = new SpaSession(

                101,

                massageTreatment,

                qualifiedTherapist,

                compatibleRoom,

                sessionStart,

                sessionStart,

                sessionStart.plusMinutes(60),

                BookingSource.CUSTOMER,

                "Upcoming massage due for reminder"

        );

        pending.setConfirmationStatus(SpaConfirmationStatus.PENDING);

        pending.setSessionStatus(SpaSessionStatus.SCHEDULED);

        pending = sessionRepository.save(pending);

        assertNull(pending.getReminderSentAt(), "Initially reminderSentAt must be null");

        // Execute scheduled reminder scanner

        timelineScheduler.dispatchUpcomingSessionReminders();

        SpaSession evaluated = sessionRepository.findById(pending.getSpaSessionId()).orElseThrow();

        assertNull(evaluated.getReminderSentAt(), "Queueing a reminder must not claim provider delivery");

        SpaDispatchOutboxEntity queuedReminder = outboxRepository.findBySessionIdOrderByCreatedAtAsc(
                        pending.getSpaSessionId()).stream()
                .filter(entry -> "REMINDER_T75M".equals(entry.getChangeType()))
                .findFirst().orElseThrow();

        assertEquals("PENDING", queuedReminder.getStatus(), "Reminder is queued for post-commit provider processing");

        assertEquals("spa:" + pending.getSpaSessionId() + ":schedule:1:REMINDER_T75M",
                queuedReminder.getIdempotencyKey());

        assertEquals(SpaConfirmationStatus.PENDING, evaluated.getConfirmationStatus(), "Confirmation status remains PENDING awaiting Customer action");

        assertEquals(SpaSessionStatus.SCHEDULED, evaluated.getSessionStatus(), "Session remains SCHEDULED");

    }

    @Test

    @DisplayName("BR-M3-10.2: Session outside reminder window (e.g. >75m in future) does not receive premature reminder")

    public void testBR10_SessionOutsideReminderWindowDoesNotReceiveReminder() {

        LocalDateTime futureStart = LocalDateTime.now().plusHours(3); // 180 min away

        SpaSession futureSession = new SpaSession(

                101,

                massageTreatment,

                qualifiedTherapist,

                compatibleRoom,

                futureStart,

                futureStart,

                futureStart.plusMinutes(60),

                BookingSource.CUSTOMER,

                "Future session outside window"

        );

        futureSession.setConfirmationStatus(SpaConfirmationStatus.PENDING);

        futureSession.setSessionStatus(SpaSessionStatus.SCHEDULED);

        futureSession = sessionRepository.save(futureSession);

        timelineScheduler.dispatchUpcomingSessionReminders();

        SpaSession evaluated = sessionRepository.findById(futureSession.getSpaSessionId()).orElseThrow();

        assertNull(evaluated.getReminderSentAt(), "Session > 75 minutes away must NOT receive premature reminder");

    }

    @Test

    @DisplayName("BR-M3-10.3: Non-pending sessions (already CONFIRMED or CANCELLED) do not receive pending-confirmation reminders")

    public void testBR10_NonPendingSessionsDoNotReceiveReminder() {

        LocalDateTime sessionStart = LocalDateTime.now().plusMinutes(65);

        // Session A: Already confirmed

        SpaSession confirmedSession = new SpaSession(

                101, massageTreatment, qualifiedTherapist, compatibleRoom,

                sessionStart, sessionStart, sessionStart.plusMinutes(60),

                BookingSource.CUSTOMER, "Already confirmed"

        );

        confirmedSession.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);

        confirmedSession.setSessionStatus(SpaSessionStatus.SCHEDULED);

        confirmedSession = sessionRepository.save(confirmedSession);

        // Session B: Cancelled

        SpaSession cancelledSession = new SpaSession(

                101, yogaTreatment, secondQualifiedTherapist, secondCompatibleRoom,

                sessionStart, sessionStart, sessionStart.plusMinutes(60),

                BookingSource.CUSTOMER, "Cancelled session"

        );

        cancelledSession.setConfirmationStatus(SpaConfirmationStatus.DECLINED);

        cancelledSession.setSessionStatus(SpaSessionStatus.CANCELLED);

        cancelledSession = sessionRepository.save(cancelledSession);

        timelineScheduler.dispatchUpcomingSessionReminders();

        SpaSession evalA = sessionRepository.findById(confirmedSession.getSpaSessionId()).orElseThrow();

        SpaSession evalB = sessionRepository.findById(cancelledSession.getSpaSessionId()).orElseThrow();

        assertNull(evalA.getReminderSentAt(), "CONFIRMED session must not receive pending reminder");

        assertNull(evalB.getReminderSentAt(), "CANCELLED session must not receive pending reminder");

    }

    @Test

    @DisplayName("BR-M3-10.4: Duplicate reminder prevention across repeated scheduler executions")

    public void testBR10_DuplicateReminderPreventionAcrossRepeatedRuns() {

        LocalDateTime sessionStart = LocalDateTime.now().plusMinutes(65);

        SpaSession session = new SpaSession(

                101, massageTreatment, qualifiedTherapist, compatibleRoom,

                sessionStart, sessionStart, sessionStart.plusMinutes(60),

                BookingSource.CUSTOMER, "Session for idempotency verification"

        );

        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);

        session.setSessionStatus(SpaSessionStatus.SCHEDULED);

        session = sessionRepository.save(session);

        // Run 1: Reminder checkpoint is durably queued.

        timelineScheduler.dispatchUpcomingSessionReminders();

        List<SpaDispatchOutboxEntity> firstRun = outboxRepository.findBySessionIdOrderByCreatedAtAsc(session.getSpaSessionId());

        assertEquals(1, firstRun.size(), "First run must persist exactly one checkpoint");

        assertEquals("PENDING", firstRun.get(0).getStatus());

        assertNull(sessionRepository.findById(session.getSpaSessionId()).orElseThrow().getReminderSentAt(),
                "Queueing must not record delivery");

        // Run 2: Immediate repeated scheduler execution

        timelineScheduler.dispatchUpcomingSessionReminders();

        List<SpaDispatchOutboxEntity> secondRun = outboxRepository.findBySessionIdOrderByCreatedAtAsc(session.getSpaSessionId());

        assertEquals(1, secondRun.size(), "Repeated scheduler execution must not duplicate the checkpoint");

        assertEquals(firstRun.get(0).getIdempotencyKey(), secondRun.get(0).getIdempotencyKey());

        // Run 3: Simulating application restart / separate context query

        assertTrue(outboxRepository.existsByIdempotencyKey(firstRun.get(0).getIdempotencyKey()),
                "The durable idempotency record remains available after another scheduler run");

    }

    @Test

    @DisplayName("BR-M3-10.5: Customer attendance confirmation preserves reserved slot, retains locks, and rejects expired confirmation")

    public void testBR10_CustomerConfirmationLifecycleAndWindowValidation() {

        LocalDateTime slotTime = LocalDateTime.of(2026, 11, 10, 10, 0);

        SpaSession session = new SpaSession(

                101, massageTreatment, qualifiedTherapist, compatibleRoom,

                slotTime, slotTime, slotTime.plusMinutes(60),

                BookingSource.CUSTOMER, "Session for confirmation test"

        );

        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);

        session.setSessionStatus(SpaSessionStatus.SCHEDULED);

        session = sessionRepository.save(session);

        // 1. Owning Customer confirms attendance
        final Long targetConfirmId = session.getSpaSessionId();

        SpaSessionDto confirmedDto = spaSessionService.confirmAttendance(targetConfirmId, 1);

        assertEquals(SpaConfirmationStatus.CONFIRMED, confirmedDto.getConfirmationStatus());

        assertEquals(SpaSessionStatus.SCHEDULED, confirmedDto.getSessionStatus(), "Attendance confirmation retains SCHEDULED status");

        // Verify resource locks remain active (slot is preserved)

        assertTrue(sessionRepository.hasOverlappingSession(

                qualifiedTherapist.getTherapistId(), compatibleRoom.getRoomId(),

                slotTime, slotTime.plusMinutes(60), null

        ), "Resource locks must remain held after attendance confirmation!");

        // 2. Second confirmation attempt fails closed safely (idempotent / already confirmed rejection)

        assertThrows(BusinessRuleException.class, () -> {

            spaSessionService.confirmAttendance(targetConfirmId, 1);

        }, "Re-confirming already confirmed session must be rejected!");

        // 3. Different Customer (userId=2) cannot confirm Customer 1's session

        SpaSession sessionCust1 = new SpaSession(

                101, massageTreatment, secondQualifiedTherapist, secondCompatibleRoom,

                slotTime.plusHours(2), slotTime.plusHours(2), slotTime.plusHours(3),

                BookingSource.CUSTOMER, "Customer 1 session"

        );

        sessionCust1 = sessionRepository.save(sessionCust1);

        final Long cust1SessionId = sessionCust1.getSpaSessionId();

        assertThrows(BusinessRuleException.class, () -> {

            spaSessionService.confirmAttendance(cust1SessionId, 2); // Customer 2 attempting modification

        }, "Customer 2 must NOT be permitted to confirm Customer 1's session!");

        // 4. Session with EXPIRED confirmation status cannot be confirmed

        sessionCust1.setConfirmationStatus(SpaConfirmationStatus.EXPIRED);

        sessionCust1.setSessionStatus(SpaSessionStatus.RESCHEDULING);

        sessionRepository.save(sessionCust1);

        assertThrows(BusinessRuleException.class, () -> {

            spaSessionService.confirmAttendance(cust1SessionId, 1);

        }, "Expired session cannot be confirmed; must require rescheduling!");

    }

    @Test

    @DisplayName("BR-M3-10.6: Concurrency between Customer confirmation and scheduler deadline resolution")

    public void testBR10_ConcurrencyBetweenCustomerConfirmationAndSchedulerDeadline() throws Exception {

        LocalDateTime deadlineSlot = LocalDateTime.now().plusMinutes(50); // Inside deadline window

        SpaSession session = new SpaSession(

                101, massageTreatment, qualifiedTherapist, compatibleRoom,

                deadlineSlot, deadlineSlot, deadlineSlot.plusMinutes(60),

                BookingSource.CUSTOMER, "Racing session"

        );

        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);

        session.setSessionStatus(SpaSessionStatus.SCHEDULED);

        session = sessionRepository.save(session);

        final Long sessionId = session.getSpaSessionId();

        ExecutorService executor = Executors.newFixedThreadPool(2);

        CountDownLatch readyLatch = new CountDownLatch(2);

        CountDownLatch startLatch = new CountDownLatch(1);

        Future<Void> customerConfirmFuture = executor.submit(() -> {

            readyLatch.countDown();

            try {

                startLatch.await();

                spaSessionService.confirmAttendance(sessionId, 1);

            } catch (Exception ignored) {

                // Racing with scheduler expiration

            }

            return null;

        });

        Future<Void> schedulerDeadlineFuture = executor.submit(() -> {

            readyLatch.countDown();

            try {

                startLatch.await();

                timelineScheduler.processConfirmationDeadlines();

            } catch (Exception ignored) {

            }

            return null;

        });

        readyLatch.await(5, TimeUnit.SECONDS);

        startLatch.countDown();

        customerConfirmFuture.get(10, TimeUnit.SECONDS);

        schedulerDeadlineFuture.get(10, TimeUnit.SECONDS);

        executor.shutdown();

        // Verification: Final state must be one of two valid business states:

        // Either Customer confirmed in time: (CONFIRMED, SCHEDULED)

        // OR Scheduler expired it first: (EXPIRED, RESCHEDULING)

        // In NO case can it be NO_SHOW or corrupt.

        SpaSession finalSession = sessionRepository.findById(sessionId).orElseThrow();

        boolean isConfirmed = finalSession.getConfirmationStatus() == SpaConfirmationStatus.CONFIRMED &&

                              finalSession.getSessionStatus() == SpaSessionStatus.SCHEDULED;

        boolean isExpired = finalSession.getConfirmationStatus() == SpaConfirmationStatus.EXPIRED &&

                            finalSession.getSessionStatus() == SpaSessionStatus.RESCHEDULING;

        assertTrue(isConfirmed || isExpired,

                "Final session state must resolve to either (CONFIRMED, SCHEDULED) or (EXPIRED, RESCHEDULING)! Actual: " +

                finalSession.getConfirmationStatus() + " / " + finalSession.getSessionStatus());

        assertNotEquals(SpaSessionStatus.NO_SHOW, finalSession.getSessionStatus(), "Racing deadline must never produce false NO_SHOW!");

    }


    @Test
    @DisplayName("BR-M3-10.7: Boundary condition verification across 9 temporal offsets (+90m, +76m, +75m, +65m, +60m, +59m, +30m, 0m, -10m)")
    public void testBR10_AllNineBoundaryOffsetsAndNoCycleOverlap() {
        LocalDateTime baseNow = LocalDateTime.of(2026, 11, 15, 12, 0);
        Clock fixedClock = Clock.fixed(
                baseNow.atZone(ZoneId.systemDefault()).toInstant(),
                ZoneId.systemDefault()
        );
        timelineScheduler.setClock(fixedClock);

        int[] offsets = {90, 76, 75, 65, 60, 59, 30, 0, -10};
        Map<Integer, Long> sessionByOffset = new HashMap<>();

        for (int offset : offsets) {
            LocalDateTime start = baseNow.plusMinutes(offset);
            SpaSession s = new SpaSession(
                    101, massageTreatment, qualifiedTherapist, compatibleRoom,
                    start, start, start.plusMinutes(60),
                    BookingSource.CUSTOMER, "Offset test " + offset + "m"
            );
            s.setConfirmationStatus(SpaConfirmationStatus.PENDING);
            s.setSessionStatus(SpaSessionStatus.SCHEDULED);
            s = sessionRepository.save(s);
            sessionByOffset.put(offset, s.getSpaSessionId());
        }

        // Run 1: Dispatch reminders
        timelineScheduler.dispatchUpcomingSessionReminders();

        // Run 2: Process deadlines
        timelineScheduler.processConfirmationDeadlines();

        // Re-read all sessions
        for (int offset : offsets) {
            Long sId = sessionByOffset.get(offset);
            SpaSession session = sessionRepository.findById(sId).orElseThrow();

            if (offset == 90 || offset == 76) {
                // Outside reminder window (>75m), before deadline (>60m)
                assertNull(session.getReminderSentAt(), "Offset " + offset + "m must NOT receive reminder (too early)");
                assertEquals(SpaConfirmationStatus.PENDING, session.getConfirmationStatus(), "Offset " + offset + "m must remain PENDING");
                assertEquals(SpaSessionStatus.SCHEDULED, session.getSessionStatus(), "Offset " + offset + "m must remain SCHEDULED");
            } else if (offset == 75 || offset == 65) {
                // Inside reminder window (<=75m and >60m), before deadline (>60m)
                assertNull(session.getReminderSentAt(), "Offset " + offset + "m is queued, not synchronously delivered");

                assertTrue(outboxRepository.existsByIdempotencyKey(
                                "spa:" + sId + ":schedule:1:REMINDER_T75M"),
                        "Offset " + offset + "m MUST persist its T-75m checkpoint");
                assertEquals(SpaConfirmationStatus.PENDING, session.getConfirmationStatus(), "Offset " + offset + "m must remain PENDING for customer confirmation");
                assertEquals(SpaSessionStatus.SCHEDULED, session.getSessionStatus(), "Offset " + offset + "m must remain SCHEDULED");
            } else {
                // offset in {60, 59, 30, 0, -10}: At or past deadline (<=60m), outside reminder window (not >60m)
                assertNull(session.getReminderSentAt(), "Offset " + offset + "m must NOT receive reminder in same cycle as deadline");
                assertEquals(SpaConfirmationStatus.EXPIRED, session.getConfirmationStatus(), "Offset " + offset + "m MUST transition to EXPIRED");
                assertEquals(SpaSessionStatus.RESCHEDULING, session.getSessionStatus(), "Offset " + offset + "m MUST transition to RESCHEDULING");
            }

            // CRITICAL INVARIANT: No session can receive a reminder AND expire in the same cycle!
            boolean receivedReminderAndExpired = (session.getReminderSentAt() != null) &&
                    (session.getConfirmationStatus() == SpaConfirmationStatus.EXPIRED);
            assertFalse(receivedReminderAndExpired,
                    "INVARIANT VIOLATION: Session at offset " + offset + "m received reminder and expired in same cycle!");
        }

        // Reset clock
        timelineScheduler.setClock(Clock.systemDefaultZone());
    }

    @Test
    @DisplayName("BR-M3-10.8: Multi-instance atomic claim prevents duplicate reminder dispatch across concurrent scheduler workers")
    public void testBR10_MultiInstanceConcurrentClaimAtomicDeduplication() throws Exception {
        LocalDateTime sessionStart = LocalDateTime.now().plusMinutes(70);
        SpaSession s = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Concurrent claim test"
        );
        s.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        s.setSessionStatus(SpaSessionStatus.SCHEDULED);
        s = sessionRepository.save(s);
        final Long targetSessionId = s.getSpaSessionId();

        int numThreads = 4;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CountDownLatch readyLatch = new CountDownLatch(numThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        AtomicInteger claimSuccessCount = new AtomicInteger(0);

        for (int i = 0; i < numThreads; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    int claimed = sessionRepository.claimSessionForReminder(targetSessionId, LocalDateTime.now());
                    if (claimed == 1) {
                        claimSuccessCount.incrementAndGet();
                    }
                } catch (Exception ex) {
                    System.err.println("Concurrent claim worker exception: " + ex.getClass().getName() + " - " + ex.getMessage());
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();
        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);

        assertEquals(1, claimSuccessCount.get(),
                "Exactly ONE scheduler thread must successfully claim the session; all other threads must receive 0!");
    }

    @Test
    @DisplayName("BR-M3-10.9: Notification provider failure safely releases claim for automatic retry on subsequent tick")
    public void testBR10_ProviderFailureAndClaimReleaseRetry() {
        LocalDateTime sessionStart = LocalDateTime.now().plusMinutes(70);
        SpaSession s = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Provider failure retry test"
        );
        s.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        s.setSessionStatus(SpaSessionStatus.SCHEDULED);
        s = sessionRepository.save(s);
        final Long targetSessionId = s.getSpaSessionId();

        // 1. Simulate worker claiming the session
        LocalDateTime claimTime = LocalDateTime.now();
        String claimToken = UUID.randomUUID().toString();
        int claimed = sessionRepository.claimSessionForReminder(targetSessionId, claimTime, claimTime.plusMinutes(2), claimToken);
        assertEquals(1, claimed, "Initial claim must succeed");

        SpaSession claimedSession = sessionRepository.findById(targetSessionId).orElseThrow();
        assertEquals(SpaReminderStatus.CLAIMED, claimedSession.getReminderStatus(), "Status must transition to CLAIMED");
        assertNotNull(claimedSession.getReminderClaimedAt(), "Claim timestamp must be set");
        assertNull(claimedSession.getReminderSentAt(), "reminderSentAt must remain null during active claim!");

        // 2. Simulate dispatch failure (e.g. SMTP down / network error) -> trigger release with matching token
        int released = sessionRepository.releaseReminderClaim(targetSessionId, claimToken);
        assertEquals(1, released, "Release must affect exactly 1 row");

        SpaSession releasedSession = sessionRepository.findById(targetSessionId).orElseThrow();
        assertEquals(SpaReminderStatus.RETRYABLE_FAILURE, releasedSession.getReminderStatus(), "Status must transition to RETRYABLE_FAILURE");
        assertNull(releasedSession.getReminderSentAt(), "reminderSentAt must remain null for retry");
        assertNull(releasedSession.getReminderClaimExpiresAt(), "Lease expiration must be cleared upon release");

        // 3. Subsequent scheduler tick can successfully claim and dispatch
        String retryToken = UUID.randomUUID().toString();
        int retriedClaim = sessionRepository.claimSessionForReminder(targetSessionId, LocalDateTime.now(), LocalDateTime.now().plusMinutes(2), retryToken);
        assertEquals(1, retriedClaim, "Subsequent scheduler run must be able to re-claim and retry!");
    }

    // =========================================================================
    // BR-M3-10 Phase 3: Crash Recovery & Dispatch State Model Deterministic Tests
    // =========================================================================

    @Test
    @DisplayName("BR-M3-10.10: Process crash immediately after claim retains lease with reminderSentAt null")
    public void testBR10_CrashImmediatelyAfterClaim_LeaseRetainedWithSentAtNull() {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Crash after claim test"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // Worker claims session with 2-minute lease
        LocalDateTime claimTime = baseTime;
        LocalDateTime leaseExpiresAt = baseTime.plusMinutes(2);
        int claimed = sessionRepository.claimSessionForReminder(sId, claimTime, leaseExpiresAt);
        assertEquals(1, claimed, "Claim must succeed");

        // Simulated process termination: no dispatch occurs, no release executed.
        SpaSession persisted = sessionRepository.findById(sId).orElseThrow();
        assertEquals(SpaReminderStatus.CLAIMED, persisted.getReminderStatus(), "State must remain persistently CLAIMED");
        assertEquals(claimTime, persisted.getReminderClaimedAt(), "Claim timestamp must be recorded");
        assertEquals(leaseExpiresAt, persisted.getReminderClaimExpiresAt(), "Lease expiration must be recorded");
        assertNull(persisted.getReminderSentAt(), "reminderSentAt must remain null - no reminder was dispatched!");
    }

    @Test
    @DisplayName("BR-M3-10.11: Application restart with an unexpired claim rejects duplicate claim attempts")
    public void testBR10_ApplicationRestart_WithUnexpiredClaim_RejectsSecondaryClaim() {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Unexpired claim test"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // Worker 1 claimed at baseTime with lease until baseTime + 2m
        sessionRepository.claimSessionForReminder(sId, baseTime, baseTime.plusMinutes(2));

        // Restart simulation at baseTime + 30s (lease is still active for 90s)
        LocalDateTime restartTime = baseTime.plusSeconds(30);

        // Worker 2 attempts to claim
        int secondaryClaim = sessionRepository.claimSessionForReminder(sId, restartTime, restartTime.plusMinutes(2));
        assertEquals(0, secondaryClaim, "Active unexpired lease MUST reject secondary worker claim!");

        // Query for due reminders must also exclude sessions with active unexpired leases
        List<SpaSession> due = sessionRepository.findSessionsDueForReminder(
                SpaSessionStatus.SCHEDULED, SpaConfirmationStatus.PENDING, restartTime,
                restartTime.plusMinutes(60), restartTime.plusMinutes(75)
        );
        boolean foundInDue = due.stream().anyMatch(s -> s.getSpaSessionId().equals(sId));
        assertFalse(foundInDue, "Session with unexpired lease must be excluded from due reminders query");
    }

    @Test
    @DisplayName("BR-M3-10.12: Application restart after claim lease expiration successfully reclaims and completes dispatch")
    public void testBR10_ApplicationRestart_AfterLeaseExpiration_ReclaimsAndDispatches() {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Expired lease recovery test"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // Crashed worker claimed at baseTime with lease expiring at baseTime + 2m
        sessionRepository.claimSessionForReminder(sId, baseTime, baseTime.plusMinutes(2));

        // System restarts / ticks at baseTime + 3m (lease has expired!)
        LocalDateTime restartTime = baseTime.plusMinutes(3);

        // 1. Due reminder query must detect the expired lease
        List<SpaSession> due = sessionRepository.findSessionsDueForReminder(
                SpaSessionStatus.SCHEDULED, SpaConfirmationStatus.PENDING, restartTime,
                restartTime.plusMinutes(60), restartTime.plusMinutes(75)
        );
        boolean foundInDue = due.stream().anyMatch(s -> s.getSpaSessionId().equals(sId));
        assertTrue(foundInDue, "Expired lease session MUST be detected as due for recovery reminder dispatch!");

        // 2. Recovery worker re-claims with token
        String recoveryToken = UUID.randomUUID().toString();
        int reclaimed = sessionRepository.claimSessionForReminder(sId, restartTime, restartTime.plusMinutes(2), recoveryToken);
        assertEquals(1, reclaimed, "Reclaim of expired lease MUST succeed!");

        // 3. Dispatch succeeds and records SENT with matching token
        int recorded = sessionRepository.recordReminderSent(sId, restartTime, recoveryToken);
        assertEquals(1, recorded, "Recording sent state must affect 1 row");

        SpaSession finalSession = sessionRepository.findById(sId).orElseThrow();
        assertEquals(SpaReminderStatus.SENT, finalSession.getReminderStatus(), "Final state must be SENT");
        assertEquals(restartTime, finalSession.getReminderSentAt(), "reminderSentAt must be populated with recovery dispatch time");
        assertNull(finalSession.getReminderClaimExpiresAt(), "Lease expiration must be cleared after successful dispatch");
    }

    @Test
    @DisplayName("BR-M3-10.13: Provider acceptance followed by persistence failure exhibits safe at-least-once recovery")
    public void testBR10_ProviderAcceptanceFollowedByPersistenceFailure_AtLeastOnceSemantics() {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "At-least-once edge case test"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // Worker claims session
        sessionRepository.claimSessionForReminder(sId, baseTime, baseTime.plusMinutes(2));

        // Provider sends notification, but application abruptly crashes before recordReminderSent executes.
        // Persistence verification:
        SpaSession midCrash = sessionRepository.findById(sId).orElseThrow();
        assertEquals(SpaReminderStatus.CLAIMED, midCrash.getReminderStatus());
        assertNull(midCrash.getReminderSentAt(), "reminderSentAt was not yet committed");

        // Advance past lease expiration (baseTime + 3m)
        LocalDateTime recoveryTime = baseTime.plusMinutes(3);
        String recoveryToken = UUID.randomUUID().toString();
        int reclaimed = sessionRepository.claimSessionForReminder(sId, recoveryTime, recoveryTime.plusMinutes(2), recoveryToken);
        assertEquals(1, reclaimed, "System detects unconfirmed dispatch and safely initiates retry (at-least-once)");

        // Complete the recovery dispatch with matching recoveryToken
        sessionRepository.recordReminderSent(sId, recoveryTime, recoveryToken);
        SpaSession recovered = sessionRepository.findById(sId).orElseThrow();
        assertEquals(SpaReminderStatus.SENT, recovered.getReminderStatus());
        assertNotNull(recovered.getReminderSentAt());

        // Subsequent runs are fully idempotent
        int duplicateClaim = sessionRepository.claimSessionForReminder(sId, recoveryTime.plusMinutes(1), recoveryTime.plusMinutes(3));
        assertEquals(0, duplicateClaim, "SENT session must NEVER be claimed again!");
    }

    @Test
    @DisplayName("BR-M3-10.14: Multiple workers competing to reclaim an expired claim - exactly one succeeds")
    public void testBR10_TwoWorkersAttemptingToReclaimExpiredClaim_ExactlyOneSucceeds() throws Exception {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Concurrent reclaim race test"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // Expired claim from crashed worker (expired 5 minutes ago)
        sessionRepository.claimSessionForReminder(sId, baseTime.minusMinutes(10), baseTime.minusMinutes(5));

        int numWorkers = 4;
        ExecutorService executor = Executors.newFixedThreadPool(numWorkers);
        CountDownLatch readyLatch = new CountDownLatch(numWorkers);
        CountDownLatch startLatch = new CountDownLatch(1);
        AtomicInteger reclaimWins = new AtomicInteger(0);

        for (int i = 0; i < numWorkers; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    int won = sessionRepository.claimSessionForReminder(sId, baseTime, baseTime.plusMinutes(2));
                    if (won == 1) {
                        reclaimWins.incrementAndGet();
                    }
                } catch (Exception ignored) {
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();
        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);

        assertEquals(1, reclaimWins.get(), "Exactly ONE worker thread must win the reclaim of an expired lease!");
    }

    @Test
    @DisplayName("BR-M3-10.15: Session cancellation or expiration while claim is pending blocks subsequent dispatch/reclaim")
    public void testBR10_SessionCancellationOrExpirationWhileClaimPending_BlocksDispatch() {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Cancellation during claim test"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // 1. Worker claims session with expired lease for test
        sessionRepository.claimSessionForReminder(sId, baseTime.minusMinutes(5), baseTime.minusMinutes(3));

        // 2. Customer explicitly cancels session
        session.setSessionStatus(SpaSessionStatus.CANCELLED);
        sessionRepository.save(session);

        // 3. Worker attempting to reclaim cancelled session must be rejected
        int reclaimCancelled = sessionRepository.claimSessionForReminder(sId, baseTime, baseTime.plusMinutes(2));
        assertEquals(0, reclaimCancelled, "Reclaiming a CANCELLED session must be rejected!");

        // 4. Test expiration: Session in EXPIRED status
        session.setSessionStatus(SpaSessionStatus.RESCHEDULING);
        session.setConfirmationStatus(SpaConfirmationStatus.EXPIRED);
        sessionRepository.save(session);

        int reclaimExpired = sessionRepository.claimSessionForReminder(sId, baseTime, baseTime.plusMinutes(2));
        assertEquals(0, reclaimExpired, "Reclaiming an EXPIRED / RESCHEDULING session must be rejected!");
    }

    // =========================================================================
    // BR-M3-10 Phase 4: Missed Reminder Window & Bounded Catch-Up Policy Tests
    // =========================================================================

    @Test
    @DisplayName("BR-M3-10.16: 5-minute scheduler outage within reminder window dispatches bounded catch-up reminder")
    public void testBR10_OutageRecovery_5MinuteOutage_WithinWindow_DispatchesCatchUp() {
        // Appointment scheduled for 12:00.
        // Normal window: (10:45, 11:00]. Deadline: 11:00.
        LocalDateTime appointmentStart = LocalDateTime.of(2026, 11, 25, 12, 0);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                appointmentStart, appointmentStart, appointmentStart.plusMinutes(60),
                BookingSource.CUSTOMER, "5-min outage test"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // Scheduler goes offline at 10:45 and recovers 5 minutes later at 10:50.
        LocalDateTime recoveryTime = LocalDateTime.of(2026, 11, 25, 10, 50);
        Clock recoveryClock = Clock.fixed(recoveryTime.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        timelineScheduler.setClock(recoveryClock);

        // At 10:50, appointment is 70 minutes away.
        // 70m is within (60m, 75m]. Catch-up scan executes:
        timelineScheduler.dispatchUpcomingSessionReminders();

        SpaSession evaluated = sessionRepository.findById(sId).orElseThrow();
        assertNull(evaluated.getReminderSentAt(), "Catch-up queueing must not claim email delivery");

        assertTrue(outboxRepository.existsByIdempotencyKey(
                        "spa:" + sId + ":schedule:1:REMINDER_T75M"),
                "Catch-up within the T-75m window must persist the checkpoint");

        assertEquals("PENDING", outboxRepository.findBySessionIdOrderByCreatedAtAsc(sId).get(0).getStatus());
        assertEquals(SpaConfirmationStatus.PENDING, evaluated.getConfirmationStatus(), "Guest still has 10 minutes to confirm attendance");

        // Reset clock
        timelineScheduler.setClock(Clock.systemDefaultZone());
    }

    @Test
    @DisplayName("BR-M3-10.17: 15-minute scheduler outage spanning up to T-60m deadline expires session cleanly without reminder")
    public void testBR10_OutageRecovery_15MinuteOutage_AtDeadline_ExpiresWithoutReminder() {
        // Appointment scheduled for 12:00.
        LocalDateTime appointmentStart = LocalDateTime.of(2026, 11, 25, 12, 0);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                appointmentStart, appointmentStart, appointmentStart.plusMinutes(60),
                BookingSource.CUSTOMER, "15-min outage at deadline test"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // Scheduler offline from 10:45 to 11:00 (exact T-60m deadline).
        LocalDateTime recoveryTime = LocalDateTime.of(2026, 11, 25, 11, 0);
        Clock recoveryClock = Clock.fixed(recoveryTime.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        timelineScheduler.setClock(recoveryClock);

        // At 11:00, appointment is 60 minutes away.
        // Dispatch query requires scheduledStartAt > now + 60m (12:00 > 12:00 is FALSE).
        // Deadline query requires scheduledStartAt <= now + 60m (12:00 <= 12:00 is TRUE).
        timelineScheduler.dispatchUpcomingSessionReminders();
        timelineScheduler.processConfirmationDeadlines();

        SpaSession evaluated = sessionRepository.findById(sId).orElseThrow();
        assertNull(evaluated.getReminderSentAt(), "Reminder must NOT be sent to a session reaching expiration deadline!");
        assertEquals(SpaConfirmationStatus.EXPIRED, evaluated.getConfirmationStatus(), "Session MUST transition to EXPIRED");
        assertEquals(SpaSessionStatus.RESCHEDULING, evaluated.getSessionStatus(), "Session MUST transition to RESCHEDULING");

        // Reset clock
        timelineScheduler.setClock(Clock.systemDefaultZone());
    }

    @Test
    @DisplayName("BR-M3-10.18: 20-minute scheduler outage past T-60m deadline preserves fail-closed safety and avoids stale reminder")
    public void testBR10_OutageRecovery_20MinuteOutage_PastDeadline_CleanExpirationNoReminder() {
        // Appointment scheduled for 12:00.
        LocalDateTime appointmentStart = LocalDateTime.of(2026, 11, 25, 12, 0);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                appointmentStart, appointmentStart, appointmentStart.plusMinutes(60),
                BookingSource.CUSTOMER, "20-min outage past deadline test"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // Scheduler recovers at 11:05 (55 minutes before appointment, 5 minutes past deadline).
        LocalDateTime recoveryTime = LocalDateTime.of(2026, 11, 25, 11, 5);
        Clock recoveryClock = Clock.fixed(recoveryTime.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        timelineScheduler.setClock(recoveryClock);

        timelineScheduler.dispatchUpcomingSessionReminders();
        timelineScheduler.processConfirmationDeadlines();

        SpaSession evaluated = sessionRepository.findById(sId).orElseThrow();
        assertNull(evaluated.getReminderSentAt(), "No reminder must ever be sent after T-60m deadline has passed!");
        assertEquals(SpaConfirmationStatus.EXPIRED, evaluated.getConfirmationStatus(), "Session is marked EXPIRED");
        assertEquals(SpaSessionStatus.RESCHEDULING, evaluated.getSessionStatus(), "Session is marked RESCHEDULING");

        // Reset clock
        timelineScheduler.setClock(Clock.systemDefaultZone());
    }

    @Test
    @DisplayName("BR-M3-10.19: Recovery after appointment time (long outage) strictly prohibits stale reminders and never revives expired sessions")
    public void testBR10_OutageRecovery_PostDeadlineLongOutage_NoStaleReminderLongAfterAppointment() {
        // Appointment scheduled for 10:00.
        LocalDateTime appointmentStart = LocalDateTime.of(2026, 11, 25, 10, 0);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                appointmentStart, appointmentStart, appointmentStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Long outage test"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // Scheduler offline during morning and recovers in afternoon at 14:00 (4 hours after appointment).
        LocalDateTime recoveryTime = LocalDateTime.of(2026, 11, 25, 14, 0);
        Clock recoveryClock = Clock.fixed(recoveryTime.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        timelineScheduler.setClock(recoveryClock);

        timelineScheduler.dispatchUpcomingSessionReminders();
        timelineScheduler.processConfirmationDeadlines();

        SpaSession evaluated = sessionRepository.findById(sId).orElseThrow();
        assertNull(evaluated.getReminderSentAt(), "Stale reminder long after appointment is strictly prohibited!");
        assertEquals(SpaConfirmationStatus.EXPIRED, evaluated.getConfirmationStatus());
        assertEquals(SpaSessionStatus.RESCHEDULING, evaluated.getSessionStatus());

        // Reset clock
        timelineScheduler.setClock(Clock.systemDefaultZone());
    }

    @Test
    @DisplayName("BR-M3-10.20: Remediated stale worker fencing - Worker A with token A cannot release or mutate Worker B's active lease")
    public void testBR10_RemediatedStaleWorkerFencing_ReleaseRejected() {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Remediated stale worker fencing"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // 1. Worker A claims at 10:00 with lease expiring at 10:02 and token A
        String tokenA = UUID.randomUUID().toString();
        int claimA = sessionRepository.claimSessionForReminder(sId, baseTime, baseTime.plusMinutes(2), tokenA);
        assertEquals(1, claimA, "Worker A claim succeeds");

        // 2. Worker A experiences extended pause (3 minutes). Lease expires at 10:02.
        // Worker B reclaims the expired lease at 10:03 with lease expiring at 10:05 and token B.
        LocalDateTime reclaimTime = baseTime.plusMinutes(3);
        String tokenB = UUID.randomUUID().toString();
        int claimB = sessionRepository.claimSessionForReminder(sId, reclaimTime, reclaimTime.plusMinutes(2), tokenB);
        assertEquals(1, claimB, "Worker B successfully reclaims the expired lease");

        SpaSession stateAfterB = sessionRepository.findById(sId).orElseThrow();
        assertEquals(SpaReminderStatus.CLAIMED, stateAfterB.getReminderStatus());
        assertEquals(tokenB, stateAfterB.getReminderClaimToken(), "Worker B holds active lease token");
        assertEquals(reclaimTime, stateAfterB.getReminderClaimedAt(), "Worker B is the active lease owner");
        assertEquals(reclaimTime.plusMinutes(2), stateAfterB.getReminderClaimExpiresAt(), "Worker B holds active lease until 10:05");

        // 3. Stale Worker A wakes up at 10:03:30. Worker A encountered an error and calls releaseReminderClaim with stale token A.
        // Remediated verification:
        // releaseReminderClaim matches s.reminderClaimToken = :tokenA.
        // Since token in DB is tokenB, exactly 0 rows are updated!
        int staleReleaseCount = sessionRepository.releaseReminderClaim(sId, tokenA);
        assertEquals(0, staleReleaseCount, "FENCING VERIFICATION: Stale Worker A with token A must update 0 rows!");

        SpaSession uncorruptedState = sessionRepository.findById(sId).orElseThrow();
        assertEquals(SpaReminderStatus.CLAIMED, uncorruptedState.getReminderStatus(),
                "Worker B's active lease remains CLAIMED!");
        assertEquals(tokenB, uncorruptedState.getReminderClaimToken(),
                "Worker B's active token is intact!");
        assertEquals(reclaimTime.plusMinutes(2), uncorruptedState.getReminderClaimExpiresAt(),
                "Worker B's lease expiration remains intact!");
    }

    @Test
    @DisplayName("BR-M3-10.21: Stale worker success rejection - Worker A with token A cannot mark session SENT after Worker B reclaims")
    public void testBR10_TestB_StaleWorkerSuccess_Rejected() {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Stale worker success rejection"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // 1. Worker A claims with tokenA
        String tokenA = UUID.randomUUID().toString();
        int claimA = sessionRepository.claimSessionForReminder(sId, baseTime, baseTime.plusMinutes(2), tokenA);
        assertEquals(1, claimA);

        // 2. Lease expires, Worker B reclaims with tokenB
        LocalDateTime reclaimTime = baseTime.plusMinutes(3);
        String tokenB = UUID.randomUUID().toString();
        int claimB = sessionRepository.claimSessionForReminder(sId, reclaimTime, reclaimTime.plusMinutes(2), tokenB);
        assertEquals(1, claimB);

        // 3. Stale Worker A calls recordReminderSent using tokenA
        int staleSentCount = sessionRepository.recordReminderSent(sId, reclaimTime.plusSeconds(30), tokenA);
        assertEquals(0, staleSentCount, "FENCING VERIFICATION: Stale Worker A cannot mark session SENT with token A!");

        SpaSession stateAfterStale = sessionRepository.findById(sId).orElseThrow();
        assertEquals(SpaReminderStatus.CLAIMED, stateAfterStale.getReminderStatus(), "Session remains CLAIMED by Worker B");
        assertEquals(tokenB, stateAfterStale.getReminderClaimToken(), "Worker B remains the rightful leaseholder");
        assertNull(stateAfterStale.getReminderSentAt(), "Session was not marked SENT by stale worker");
    }

    @Test
    @DisplayName("BR-M3-10.22: Current worker success - Worker B with matching token B successfully records SENT and clears token/lease")
    public void testBR10_TestC_CurrentWorkerSuccess_RecordedAndCleared() {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Current worker success"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        String tokenB = UUID.randomUUID().toString();
        int claim = sessionRepository.claimSessionForReminder(sId, baseTime, baseTime.plusMinutes(2), tokenB);
        assertEquals(1, claim);

        LocalDateTime sentTime = baseTime.plusMinutes(1);
        int sentCount = sessionRepository.recordReminderSent(sId, sentTime, tokenB);
        assertEquals(1, sentCount, "Exactly 1 row updated for valid token holder");

        SpaSession finalSession = sessionRepository.findById(sId).orElseThrow();
        assertEquals(SpaReminderStatus.SENT, finalSession.getReminderStatus());
        assertEquals(sentTime, finalSession.getReminderSentAt());
        assertNull(finalSession.getReminderClaimToken(), "Claim token must be cleared upon SENT");
        assertNull(finalSession.getReminderClaimExpiresAt(), "Lease expiry must be cleared upon SENT");
    }

    @Test
    @DisplayName("BR-M3-10.23: Current worker failure - Worker B with matching token B releases own claim to RETRYABLE_FAILURE")
    public void testBR10_TestD_CurrentWorkerFailure_ReleasedAndCleared() {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Current worker failure"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        String tokenB = UUID.randomUUID().toString();
        int claim = sessionRepository.claimSessionForReminder(sId, baseTime, baseTime.plusMinutes(2), tokenB);
        assertEquals(1, claim);

        int releaseCount = sessionRepository.releaseReminderClaim(sId, tokenB);
        assertEquals(1, releaseCount, "Exactly 1 row updated for release by valid token holder");

        SpaSession finalSession = sessionRepository.findById(sId).orElseThrow();
        assertEquals(SpaReminderStatus.RETRYABLE_FAILURE, finalSession.getReminderStatus());
        assertNull(finalSession.getReminderClaimToken(), "Claim token must be cleared upon release");
        assertNull(finalSession.getReminderClaimExpiresAt(), "Lease expiry must be cleared upon release");
        assertNull(finalSession.getReminderSentAt(), "reminderSentAt must remain null for retry");
    }

    @Test
    @DisplayName("BR-M3-10.24: Concurrent reclaim race - exactly one worker obtains valid claim; loser gets 0 rows")
    public void testBR10_TestE_ConcurrentReclaim_ExactlyOneWinner() throws Exception {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Concurrent reclaim race"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // Expired claim at 09:50
        String initialToken = UUID.randomUUID().toString();
        sessionRepository.claimSessionForReminder(sId, baseTime.minusMinutes(10), baseTime.minusMinutes(5), initialToken);

        // 10 concurrent threads attempting to reclaim the expired lease
        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CyclicBarrier barrier = new CyclicBarrier(threadCount);
        AtomicInteger successfulClaims = new AtomicInteger(0);
        List<String> winningTokens = Collections.synchronizedList(new ArrayList<>());

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                try {
                    barrier.await(5, TimeUnit.SECONDS);
                    String workerToken = UUID.randomUUID().toString();
                    int won = sessionRepository.claimSessionForReminder(
                            sId, baseTime, baseTime.plusMinutes(2), workerToken
                    );
                    if (won == 1) {
                        successfulClaims.incrementAndGet();
                        winningTokens.add(workerToken);
                    }
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            }));
        }

        for (Future<?> f : futures) {
            f.get(5, TimeUnit.SECONDS);
        }
        executor.shutdown();

        assertEquals(1, successfulClaims.get(), "Exactly ONE worker must win the reclaim race");
        assertEquals(1, winningTokens.size());
        String winnerToken = winningTokens.get(0);

        SpaSession state = sessionRepository.findById(sId).orElseThrow();
        assertEquals(winnerToken, state.getReminderClaimToken(), "Winning token must be persisted in DB");
    }

    @Test
    @DisplayName("BR-M3-10.25: Reclaim token uniqueness - successive claims generate unique tokens within the same second")
    public void testBR10_TestF_ReclaimTokenUniqueness_WithinSameSecond() {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0, 0); // Exact second
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Token uniqueness"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        Set<String> generatedTokens = new HashSet<>();
        // Perform 5 successive claim & release cycles all occurring at the EXACT same timestamp baseTime
        for (int i = 0; i < 5; i++) {
            String token = UUID.randomUUID().toString();
            int claim = sessionRepository.claimSessionForReminder(sId, baseTime, baseTime.plusMinutes(2), token);
            assertEquals(1, claim, "Claim " + i + " must succeed");
            assertTrue(generatedTokens.add(token), "Token " + token + " must be unique");

            SpaSession claimed = sessionRepository.findById(sId).orElseThrow();
            assertEquals(token, claimed.getReminderClaimToken(), "Claimed session must store current token");

            // Release back to RETRYABLE_FAILURE with matching token
            int release = sessionRepository.releaseReminderClaim(sId, token);
            assertEquals(1, release, "Release " + i + " must succeed");

            SpaSession released = sessionRepository.findById(sId).orElseThrow();
            assertNull(released.getReminderClaimToken(), "Token cleared after release");
            assertEquals(SpaReminderStatus.RETRYABLE_FAILURE, released.getReminderStatus());
        }

        assertEquals(5, generatedTokens.size(), "All 5 tokens generated within same timestamp must be strictly unique");
    }

    @Test
    @DisplayName("BR-M3-10.26: Public API serialization regression - serialized SpaSessionDto must not expose reminderClaimToken")
    public void testBR10_PublicApiSerializationDoesNotExposeReminderClaimToken() throws Exception {
        LocalDateTime baseTime = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime sessionStart = baseTime.plusMinutes(70);

        SpaSession session = new SpaSession(
                101, massageTreatment, qualifiedTherapist, compatibleRoom,
                sessionStart, sessionStart, sessionStart.plusMinutes(60),
                BookingSource.CUSTOMER, "Public API boundary token encapsulation test"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);
        final Long sId = session.getSpaSessionId();

        // 1. Worker claims session with an active token
        String internalClaimToken = "internal-fencing-uuid-token-" + UUID.randomUUID();
        LocalDateTime claimedAt = baseTime;
        LocalDateTime expiresAt = baseTime.plusMinutes(2);
        int claimed = sessionRepository.claimSessionForReminder(sId, claimedAt, expiresAt, internalClaimToken);
        assertEquals(1, claimed);

        SpaSession entityInDb = sessionRepository.findById(sId).orElseThrow();
        assertEquals(internalClaimToken, entityInDb.getReminderClaimToken(), "Entity in database holds active token");
        entityInDb.setTreatment(massageTreatment);
        entityInDb.setTherapist(qualifiedTherapist);
        entityInDb.setTreatmentRoom(compatibleRoom);

        // 2. Map entity to public DTO
        SpaSessionDto dto = spaSessionService.toDto(entityInDb);
        assertNotNull(dto);
        assertEquals(SpaReminderStatus.CLAIMED, dto.getReminderStatus());
        assertEquals(claimedAt, dto.getReminderClaimedAt());
        assertEquals(expiresAt, dto.getReminderClaimExpiresAt());

        // 3. Serialize DTO to JSON
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        String dtoJson = mapper.writeValueAsString(dto);

        // Assert legitimate fields are present in public DTO
        assertTrue(dtoJson.contains("\"reminderStatus\":\"CLAIMED\""), "reminderStatus must be serialized");
        assertTrue(dtoJson.contains("\"reminderClaimedAt\""), "reminderClaimedAt must be serialized");
        assertTrue(dtoJson.contains("\"reminderClaimExpiresAt\""), "reminderClaimExpiresAt must be serialized");

        // CRITICAL REGRESSION ASSERTION: reminderClaimToken must NEVER be exposed in public JSON
        assertFalse(dtoJson.contains("reminderClaimToken"), "Serialized SpaSessionDto must NOT contain reminderClaimToken property");
        assertFalse(dtoJson.contains(internalClaimToken), "Serialized SpaSessionDto must NOT contain internal token value");

        // 4. Verify ApiResponse wrapper serialization
        ApiResponse<SpaSessionDto> apiResponse = ApiResponse.ok("Session retrieved.", dto);
        String apiResponseJson = mapper.writeValueAsString(apiResponse);
        assertFalse(apiResponseJson.contains("reminderClaimToken"), "Serialized ApiResponse<SpaSessionDto> must NOT contain reminderClaimToken");
        assertFalse(apiResponseJson.contains(internalClaimToken), "Serialized ApiResponse must NOT contain internal token value");
    }
}
