package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.m3spa.dto.request.ConfirmReservationRequest;
import com.heavenstay.hswrms.m3spa.dto.response.SpaSessionDto;
import com.heavenstay.hswrms.m3spa.entity.*;
import com.heavenstay.hswrms.m3spa.entity.enums.*;
import com.heavenstay.hswrms.m3spa.repository.*;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.heavenstay.hswrms.m3spa.port.StayContextDto;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase A Acceptance Tests: Booking Lifecycle, Stay Boundaries, Invariants & Rescheduling.
 */
@SpringBootTest
@Import(SpaTestConfig.class)
@Transactional
public class SpaBookingLifecycleHardeningTest {

    @Autowired
    private SpaSessionService sessionService;

    @Autowired
    private SpaSessionRepository sessionRepository;

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
    private SpaDispatchOutboxRepository outboxRepository;

    private SpaTreatment treatment;
    private SpaTreatment unqualifiedTreatment;
    private Therapist activeTherapist;
    private Therapist suspendedTherapist;
    private TreatmentRoom compatibleRoom;

    @BeforeEach
    void setUp() {
        tearDown();

        treatment = treatmentRepository.save(new SpaTreatment(
                "Ayurvedic Rejuvenation", 60, BigDecimal.valueOf(1500000), TreatmentStatus.ACTIVE
        ));

        unqualifiedTreatment = treatmentRepository.save(new SpaTreatment(
                "Acupuncture Healing", 60, BigDecimal.valueOf(1800000), TreatmentStatus.ACTIVE
        ));

        activeTherapist = new Therapist(8801, TherapistStatus.ACTIVE);
        activeTherapist.setDisplayName("Senior Specialist A");
        activeTherapist = therapistRepository.save(activeTherapist);

        suspendedTherapist = new Therapist(8802, TherapistStatus.SUSPENDED);
        suspendedTherapist.setDisplayName("Suspended Specialist B");
        suspendedTherapist = therapistRepository.save(suspendedTherapist);

        compatibleRoom = roomRepository.save(new TreatmentRoom(
                "Ayurveda Suite 1", "PREMIUM", TreatmentRoomStatus.AVAILABLE.name()
        ));

        qualificationRepository.save(new TherapistTreatmentQualification(activeTherapist, treatment));
        compatibilityRepository.save(new TreatmentRoomCompatibility(compatibleRoom, treatment));
        compatibilityRepository.save(new TreatmentRoomCompatibility(compatibleRoom, unqualifiedTreatment));
    }

    @AfterEach
    void tearDown() {
        outboxRepository.deleteAll();
        sessionRepository.deleteAll();
        qualificationRepository.deleteAll();
        compatibilityRepository.deleteAll();
        treatmentRepository.deleteAll();
        therapistRepository.deleteAll();
        roomRepository.deleteAll();
    }

    @Test
    @DisplayName("Invariant 1 & 2: Stay window validation rejects bookings before check-in date (BR-M3-02)")
    void testStayWindowEnforcement_RejectsDateBeforeCheckIn() {
        // Customer 1 stay window is 2026-09-01 to 2027-01-01
        LocalDateTime beforeStay = LocalDateTime.of(2026, 8, 15, 10, 0);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                activeTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                beforeStay,
                beforeStay.plusMinutes(60),
                101,
                "Early session"
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(req, 1)
        );
        assertTrue(ex.getMessage().contains("falls outside customer stay window"),
                "Expected stay window boundary violation message, got: " + ex.getMessage());
    }

    @Test
    @DisplayName("Invariant 1 & 2: Stay window validation rejects bookings after check-out date (BR-M3-02)")
    void testStayWindowEnforcement_RejectsDateAfterCheckOut() {
        // Customer 1 stay window is 2026-09-01 to 2027-01-01
        LocalDateTime afterStay = LocalDateTime.of(2027, 2, 10, 14, 0);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                activeTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                afterStay,
                afterStay.plusMinutes(60),
                101,
                "Late session"
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(req, 1)
        );
        assertTrue(ex.getMessage().contains("falls outside customer stay window"),
                "Expected stay window boundary violation message, got: " + ex.getMessage());
    }

    @Test
    @DisplayName("Invariant 5: Backend service rejects null request, null dates, and reversed time intervals")
    void testBackendValidation_RejectsInvalidIntervals() {
        assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(null, 1)
        );

        LocalDateTime validStart = LocalDateTime.of(2026, 11, 10, 10, 0);

        ConfirmReservationRequest nullEndReq = new ConfirmReservationRequest(
                treatment.getTreatmentId(), activeTherapist.getTherapistId(), compatibleRoom.getRoomId(),
                validStart, null, 101, null
        );
        assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(nullEndReq, 1)
        );

        ConfirmReservationRequest reversedReq = new ConfirmReservationRequest(
                treatment.getTreatmentId(), activeTherapist.getTherapistId(), compatibleRoom.getRoomId(),
                validStart, validStart.minusMinutes(30), 101, null
        );
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(reversedReq, 1)
        );
        assertTrue(ex.getMessage().contains("strictly before"));
    }

    @Test
    @DisplayName("Invariant 4: Suspended therapists cannot receive new bookings")
    void testSuspendedTherapist_RejectedWithConflict() {
        LocalDateTime validTime = LocalDateTime.of(2026, 11, 10, 10, 0);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(),
                suspendedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                validTime,
                validTime.plusMinutes(60),
                101,
                "Booking with suspended therapist"
        );

        ConflictException ex = assertThrows(ConflictException.class, () ->
                sessionService.confirmReservation(req, 1)
        );
        assertTrue(ex.getMessage().contains("no longer available"));
    }

    @Test
    @DisplayName("Invariant 3: Unqualified therapist cannot be booked for selected treatment")
    void testUnqualifiedTherapist_RejectedWithBusinessRuleException() {
        LocalDateTime validTime = LocalDateTime.of(2026, 11, 10, 10, 0);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                unqualifiedTreatment.getTreatmentId(),
                activeTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                validTime,
                validTime.plusMinutes(60),
                101,
                "Therapist not qualified"
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(req, 1)
        );
        assertTrue(ex.getMessage().contains("not qualified"));
    }

    @Test
    @DisplayName("Invariant 1 & 2: Overlapping active session within 15-minute buffer is strictly blocked")
    void testTherapistAndRoomBufferOverlap_RejectedWithConflict() {
        LocalDateTime session1Start = LocalDateTime.of(2026, 11, 10, 10, 0);
        LocalDateTime session1End = session1Start.plusMinutes(60); // 10:00 - 11:00

        ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                treatment.getTreatmentId(), activeTherapist.getTherapistId(), compatibleRoom.getRoomId(),
                session1Start, session1End, 101, "First session"
        );
        SpaSessionDto booked1 = sessionService.confirmReservation(req1, 1);
        assertNotNull(booked1);

        // Second booking requests 11:10 - 12:10 (only 10 mins after session 1 ends, violates 15m buffer)
        LocalDateTime session2Start = session1End.plusMinutes(10);
        ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                treatment.getTreatmentId(), activeTherapist.getTherapistId(), compatibleRoom.getRoomId(),
                session2Start, session2Start.plusMinutes(60), 101, "Second session too close"
        );

        ConflictException ex = assertThrows(ConflictException.class, () ->
                sessionService.confirmReservation(req2, 1)
        );
        assertTrue(ex.getMessage().contains("Scheduling conflict"));
    }

    @Test
    @DisplayName("Invariant 7: Rescheduling preserves schedule versioning and updates session state consistently")
    void testReschedule_IncrementsScheduleVersionAndPreservesConsistency() {
        LocalDateTime start1 = LocalDateTime.of(2026, 11, 10, 10, 0);
        ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                treatment.getTreatmentId(), activeTherapist.getTherapistId(), compatibleRoom.getRoomId(),
                start1, start1.plusMinutes(60), 101, "Original time"
        );
        SpaSessionDto booked = sessionService.confirmReservation(req1, 1);
        assertEquals(1, booked.getScheduleVersion());
        assertEquals(SpaSessionStatus.SCHEDULED, booked.getSessionStatus());

        // Reschedule to afternoon
        LocalDateTime start2 = LocalDateTime.of(2026, 11, 10, 15, 0);
        ConfirmReservationRequest rescheduleReq = new ConfirmReservationRequest(
                treatment.getTreatmentId(), activeTherapist.getTherapistId(), compatibleRoom.getRoomId(),
                start2, start2.plusMinutes(60), 101, "Rescheduled to afternoon"
        );
        rescheduleReq.setRescheduleSessionId(booked.getSpaSessionId());

        SpaSessionDto rescheduled = sessionService.confirmReservation(rescheduleReq, 1);
        assertEquals(2, rescheduled.getScheduleVersion(), "Schedule version must increment to 2");
        assertEquals(start2, rescheduled.getScheduledStartAt());
        assertEquals(SpaSessionStatus.SCHEDULED, rescheduled.getSessionStatus());
        assertEquals(SpaConfirmationStatus.PENDING, rescheduled.getConfirmationStatus());

        SpaSession reloaded = sessionRepository.findById(booked.getSpaSessionId()).orElseThrow();
        assertEquals(2, reloaded.getScheduleVersion());
        assertEquals(start2, reloaded.getScheduledStartAt());
    }

    @Test
    @DisplayName("Invariant 8: Cannot reschedule or cancel another customer's session")
    void testUnauthorizedCustomer_CannotModifyOtherSession() {
        LocalDateTime start = LocalDateTime.of(2026, 11, 10, 10, 0);
        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(), activeTherapist.getTherapistId(), compatibleRoom.getRoomId(),
                start, start.plusMinutes(60), 101, "Customer 1 session"
        );
        SpaSessionDto booked = sessionService.confirmReservation(req, 1);

        // Customer 2 attempts to cancel Customer 1's session
        BusinessRuleException cancelEx = assertThrows(BusinessRuleException.class, () ->
                sessionService.cancelSession(booked.getSpaSessionId(), 2)
        );
        assertTrue(cancelEx.getMessage().contains("Unauthorized"));

        // Customer 2 attempts to reschedule Customer 1's session
        ConfirmReservationRequest rescheduleReq = new ConfirmReservationRequest(
                treatment.getTreatmentId(), activeTherapist.getTherapistId(), compatibleRoom.getRoomId(),
                start.plusHours(2), start.plusHours(3), 102, "Malicious reschedule"
        );
        rescheduleReq.setRescheduleSessionId(booked.getSpaSessionId());

        BusinessRuleException reschedEx = assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(rescheduleReq, 2)
        );
        assertTrue(reschedEx.getMessage().contains("Unauthorized"));
    }

    // =========================================================================
    // FOCUSED STAY-WINDOW VALIDATION TESTS (M3.5.1 CRITICAL REVIEW SCOPE)
    // =========================================================================

    @Test
    @DisplayName("Stay Window 1: Valid stay context and valid session interval succeeds without exception")
    void testStayWindow_Case1_ValidStayContextAndValidSession() {
        StayContextDto stay = new StayContextDto(
                501, "HSW-501", 1, 10, "Sarah Jenkins", 1, "Detox Retreat",
                LocalDate.of(2026, 11, 4), LocalDate.of(2026, 11, 8), true
        );
        LocalDateTime start = LocalDateTime.of(2026, 11, 5, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        assertDoesNotThrow(() -> sessionService.validateStayWindow(stay, start, end));
    }

    @Test
    @DisplayName("Stay Window 2: Session scheduled before check-in date is rejected")
    void testStayWindow_Case2_SessionBeforeCheckIn() {
        StayContextDto stay = new StayContextDto(
                501, "HSW-501", 1, 10, "Sarah Jenkins", 1, "Detox Retreat",
                LocalDate.of(2026, 11, 4), LocalDate.of(2026, 11, 8), true
        );
        LocalDateTime start = LocalDateTime.of(2026, 11, 3, 15, 0);
        LocalDateTime end = start.plusMinutes(60);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.validateStayWindow(stay, start, end)
        );
        assertTrue(ex.getMessage().contains("falls outside customer stay window"),
                "Expected stay boundary violation, got: " + ex.getMessage());
    }

    @Test
    @DisplayName("Stay Window 3: Session scheduled after checkout date is rejected")
    void testStayWindow_Case3_SessionAfterCheckout() {
        StayContextDto stay = new StayContextDto(
                501, "HSW-501", 1, 10, "Sarah Jenkins", 1, "Detox Retreat",
                LocalDate.of(2026, 11, 4), LocalDate.of(2026, 11, 8), true
        );
        LocalDateTime start = LocalDateTime.of(2026, 11, 9, 9, 0);
        LocalDateTime end = start.plusMinutes(60);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.validateStayWindow(stay, start, end)
        );
        assertTrue(ex.getMessage().contains("falls outside customer stay window"),
                "Expected stay boundary violation, got: " + ex.getMessage());
    }

    @Test
    @DisplayName("Stay Window 4: Missing StayContextDto rejects with meaningful business rule exception")
    void testStayWindow_Case4_MissingStayContextDto() {
        LocalDateTime start = LocalDateTime.of(2026, 11, 5, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.validateStayWindow(null, start, end)
        );
        assertTrue(ex.getMessage().contains("Authoritative customer stay context is required"),
                "Expected missing stay context error, got: " + ex.getMessage());
    }

    @Test
    @DisplayName("Stay Window 5: Incomplete StayContextDto with missing check-in date is rejected")
    void testStayWindow_Case5_MissingCheckInDate() {
        StayContextDto stay = new StayContextDto(
                501, "HSW-501", 1, 10, "Sarah Jenkins", 1, "Detox Retreat",
                null, LocalDate.of(2026, 11, 8), true
        );
        LocalDateTime start = LocalDateTime.of(2026, 11, 5, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.validateStayWindow(stay, start, end)
        );
        assertTrue(ex.getMessage().contains("check-in date is missing"),
                "Expected missing check-in error, got: " + ex.getMessage());
    }

    @Test
    @DisplayName("Stay Window 6: Incomplete StayContextDto with missing checkout date is rejected")
    void testStayWindow_Case6_MissingCheckoutDate() {
        StayContextDto stay = new StayContextDto(
                501, "HSW-501", 1, 10, "Sarah Jenkins", 1, "Detox Retreat",
                LocalDate.of(2026, 11, 4), null, true
        );
        LocalDateTime start = LocalDateTime.of(2026, 11, 5, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.validateStayWindow(stay, start, end)
        );
        assertTrue(ex.getMessage().contains("check-out date is missing"),
                "Expected missing check-out error, got: " + ex.getMessage());
    }

    @Test
    @DisplayName("Stay Window 7: Session crossing the checkout day boundary is rejected")
    void testStayWindow_Case7_SessionCrossingCheckoutBoundary() {
        // Check-out date is 2026-11-08. Session starts at 23:30 on 2026-11-08 and ends 00:30 on 2026-11-09
        StayContextDto stay = new StayContextDto(
                501, "HSW-501", 1, 10, "Sarah Jenkins", 1, "Detox Retreat",
                LocalDate.of(2026, 11, 4), LocalDate.of(2026, 11, 8), true
        );
        LocalDateTime start = LocalDateTime.of(2026, 11, 8, 23, 30);
        LocalDateTime end = start.plusMinutes(60); // 2026-11-09T00:30

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.validateStayWindow(stay, start, end)
        );
        assertTrue(ex.getMessage().contains("scheduled end date (2026-11-09) falls outside customer stay window"),
                "Expected checkout boundary crossing error, got: " + ex.getMessage());
    }

    @Test
    @DisplayName("Stay Window 8: Enforces that stay context is strictly non-optional in HSWRMS spa booking flow")
    void testStayWindow_Case8_StayContextIsStrictlyMandatoryInBookingFlow() {
        LocalDateTime validTime = LocalDateTime.of(2026, 11, 10, 10, 0);
        LocalDateTime validEnd = validTime.plusMinutes(60);

        // 8a. Request with no customer context and no retreat booking ID must fail
        ConfirmReservationRequest unauthReq = new ConfirmReservationRequest(
                treatment.getTreatmentId(), activeTherapist.getTherapistId(), compatibleRoom.getRoomId(),
                validTime, validEnd, null, null
        );
        BusinessRuleException ex1 = assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(unauthReq, null)
        );
        assertTrue(ex1.getMessage().contains("Authenticated customer context or retreat booking ID is required"));

        // 8b. Authenticated customer without active retreat stay must fail (user 999 configured with no stay)
        ConfirmReservationRequest noStayReq = new ConfirmReservationRequest(
                treatment.getTreatmentId(), activeTherapist.getTherapistId(), compatibleRoom.getRoomId(),
                validTime, validEnd, null, null
        );
        BusinessRuleException ex2 = assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(noStayReq, 999)
        );
        assertTrue(ex2.getMessage().contains("No active retreat stay found for current user"));
    }
}
