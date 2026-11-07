package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m3spa.dto.request.ConfirmReservationRequest;
import com.heavenstay.hswrms.m3spa.dto.request.GenerateCandidatesRequest;
import com.heavenstay.hswrms.m3spa.dto.response.CandidateGenerationResultDto;
import com.heavenstay.hswrms.m3spa.dto.response.SchedulingCandidateDto;
import com.heavenstay.hswrms.m3spa.dto.response.SpaSessionDto;
import com.heavenstay.hswrms.m3spa.entity.*;
import com.heavenstay.hswrms.m3spa.entity.enums.*;
import com.heavenstay.hswrms.m3spa.port.*;
import com.heavenstay.hswrms.m3spa.repository.*;
import com.heavenstay.hswrms.m3spa.service.SchedulingEngineService;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Isolated Automated Test Suite: M3 Past-Date Booking Validation & Discovery Defense.
 *
 * Verifies that:
 * 1. Customer bookings on past dates are strictly rejected (PAST_DATE_NOT_ALLOWED).
 * 2. Customer bookings earlier than current time on today are strictly rejected (PAST_DATE_NOT_ALLOWED).
 * 3. Exact boundary behavior at current time vs 1 second before is verified.
 * 4. Valid future slots are accepted by validation.
 * 5. SchedulingEngineService candidate discovery skips past slots on current and past dates.
 * 6. Valid future slots outside the customer stay window are rejected by validateStayWindow.
 * 7. Staff booking override behavior allows operational walk-in / immediate sessions without past-date rejection.
 */
@ExtendWith(MockitoExtension.class)
public class SpaPastDateValidationTest {

    @Mock
    private SpaSessionRepository sessionRepository;
    @Mock
    private SpaTreatmentRepository treatmentRepository;
    @Mock
    private TherapistRepository therapistRepository;
    @Mock
    private TreatmentRoomRepository roomRepository;
    @Mock
    private TherapistTreatmentQualificationRepository qualificationRepository;
    @Mock
    private TreatmentRoomCompatibilityRepository compatibilityRepository;
    @Mock
    private CustomerStayPort customerStayPort;
    @Mock
    private TherapistHealthProjectionPort healthProjectionPort;
    @Mock
    private BillingPort billingPort;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    private SpaSessionService sessionService;
    private SchedulingEngineService schedulingEngineService;

    // Fixed reference time for deterministic testing: Saturday, 2026-11-07 10:00:00
    private static final ZoneId RESORT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime BASE_NOW = LocalDateTime.of(2026, 11, 7, 10, 0, 0);
    private Clock fixedClock;

    private StayContextDto stayContext;
    private SpaTreatment testTreatment;
    private Therapist testTherapist;
    private TreatmentRoom testRoom;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(BASE_NOW.atZone(RESORT_ZONE).toInstant(), RESORT_ZONE);

        sessionService = new SpaSessionService(
                sessionRepository, treatmentRepository, therapistRepository, roomRepository,
                qualificationRepository, compatibilityRepository, customerStayPort, healthProjectionPort, billingPort, eventPublisher
        );
        sessionService.setClock(fixedClock);

        schedulingEngineService = new SchedulingEngineService(
                treatmentRepository, therapistRepository, roomRepository, sessionRepository
        );
        schedulingEngineService.setClock(fixedClock);
        ReflectionTestUtils.setField(schedulingEngineService, "operatingOpenStr", "08:00");
        ReflectionTestUtils.setField(schedulingEngineService, "operatingCloseStr", "20:00");

        stayContext = new StayContextDto(
                3, "HSW-3", 1, 101, "Test Customer", 1, "Detox Retreat",
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 15), true
        );

        testTreatment = new SpaTreatment("Detox Herbal Wrap", 60, BigDecimal.valueOf(1200000), TreatmentStatus.ACTIVE);
        testTreatment.setTreatmentId(10);

        testTherapist = new Therapist(2, TherapistStatus.ACTIVE);
        testTherapist.setTherapistId(2);
        testTherapist.setDisplayName("Therapist Minh");

        testRoom = new TreatmentRoom("Suite Lotus", "PREMIUM", TreatmentRoomStatus.AVAILABLE.name());
        testRoom.setRoomId(1);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Case 1: Customer booking on past date (2026-11-05 08:00) throws PAST_DATE_NOT_ALLOWED")
    void testCase1_PastDateRejected_ForCustomerBooking() {
        when(customerStayPort.getActiveStayForUser(101)).thenReturn(Optional.of(stayContext));

        LocalDateTime pastStart = LocalDateTime.of(2026, 11, 5, 8, 0);
        LocalDateTime pastEnd = pastStart.plusMinutes(90);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                10, 2, 1, pastStart, pastEnd, 3, "Customer booking 2 days ago"
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(req, 101, false)
        );

        assertEquals("PAST_DATE_NOT_ALLOWED", ex.getErrorCode(),
                "Expected error code PAST_DATE_NOT_ALLOWED, got: " + ex.getErrorCode());
        assertTrue(ex.getMessage().contains("past"),
                "Expected message indicating past scheduling is forbidden, got: " + ex.getMessage());

        // Also verify DTO helper
        assertFalse(req.isFuture(BASE_NOW), "ConfirmReservationRequest.isFuture should return false for past date");
    }

    @Test
    @DisplayName("Case 2: Customer booking earlier today (2026-11-07 09:00 when now is 10:00) throws PAST_DATE_NOT_ALLOWED")
    void testCase2_PastSlotEarlierToday_RejectedForCustomerBooking() {
        when(customerStayPort.getActiveStayForUser(101)).thenReturn(Optional.of(stayContext));

        LocalDateTime earlierTodayStart = LocalDateTime.of(2026, 11, 7, 9, 0);
        LocalDateTime earlierTodayEnd = earlierTodayStart.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                10, 2, 1, earlierTodayStart, earlierTodayEnd, 3, "Customer booking 1 hour ago"
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(req, 101, false)
        );

        assertEquals("PAST_DATE_NOT_ALLOWED", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("past"));
        assertFalse(req.isFuture(BASE_NOW));
    }

    @Test
    @DisplayName("Case 3: Exact boundary verification at current reference time vs 1 second before")
    void testCase3_ExactBoundary_BehaviorVerified() {
        LocalDateTime exactNow = BASE_NOW;
        LocalDateTime oneSecondBefore = BASE_NOW.minusSeconds(1);

        // Exact boundary (10:00:00) is not in the past relative to 10:00:00 -> passes validation
        assertDoesNotThrow(() -> sessionService.validateNotPastDate(exactNow, false),
                "Scheduled time exactly matching current clock boundary should be accepted");

        // 1 second before (09:59:59) is in the past -> must throw PAST_DATE_NOT_ALLOWED
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.validateNotPastDate(oneSecondBefore, false)
        );
        assertEquals("PAST_DATE_NOT_ALLOWED", ex.getErrorCode());
    }

    @Test
    @DisplayName("Case 4: Valid future slot (2026-11-07 14:00 when now is 10:00) accepted by validation")
    void testCase4_ValidFutureSlot_AcceptedByValidation() {
        LocalDateTime validFutureStart = LocalDateTime.of(2026, 11, 7, 14, 0);
        LocalDateTime validFutureEnd = validFutureStart.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                10, 2, 1, validFutureStart, validFutureEnd, 3, "Afternoon session"
        );

        assertDoesNotThrow(() -> sessionService.validateNotPastDate(validFutureStart, false));
        assertTrue(req.isFuture(BASE_NOW), "ConfirmReservationRequest.isFuture should return true for future date");
    }

    @Test
    @DisplayName("Case 5: SchedulingEngineService skips past slots on current date and past dates")
    void testCase5_SchedulingEngine_SkipsPastSlots() {
        when(treatmentRepository.findById(10)).thenReturn(Optional.of(testTreatment));
        when(therapistRepository.findQualifiedTherapists(10, TherapistStatus.ACTIVE)).thenReturn(List.of(testTherapist));
        when(roomRepository.findCompatibleRooms(10, TreatmentRoomStatus.AVAILABLE)).thenReturn(List.of(testRoom));

        // Part A: Requested date is entirely in the past (2026-11-05) -> returns 0 primary candidates
        GenerateCandidatesRequest pastDateReq = new GenerateCandidatesRequest(
                10, LocalDate.of(2026, 11, 5), null
        );
        CandidateGenerationResultDto pastResult = schedulingEngineService.generateCandidates(pastDateReq);
        assertNotNull(pastResult);
        assertTrue(pastResult.getCandidates().isEmpty(),
                "Candidate generation for a past date must return 0 candidates");

        // Part B: Requested date is today (2026-11-07, BASE_NOW = 10:00:00)
        // Sessions in window: empty
        when(sessionRepository.findActiveConflictingSessionsInWindow(any(), any(), any()))
                .thenReturn(Collections.emptyList());

        GenerateCandidatesRequest todayReq = new GenerateCandidatesRequest(
                10, LocalDate.of(2026, 11, 7), null
        );
        CandidateGenerationResultDto todayResult = schedulingEngineService.generateCandidates(todayReq);
        assertNotNull(todayResult);
        assertFalse(todayResult.getCandidates().isEmpty(),
                "Operating hours 10:00 to 20:00 should yield future candidates for today");

        // Ensure all generated slots start AT OR AFTER 10:00:00
        for (SchedulingCandidateDto candidate : todayResult.getCandidates()) {
            LocalDateTime candidateStart = candidate.getScheduledStartAt();
            assertFalse(candidateStart.isBefore(BASE_NOW),
                    "Slot " + candidateStart + " is in the past! All candidates must be >= " + BASE_NOW);
        }

        // Specifically verify that past morning slots (08:00, 08:30, 09:00, 09:30) are NOT present
        List<String> slotTimes = todayResult.getCandidates().stream().map(SchedulingCandidateDto::getStartTime).toList();
        assertFalse(slotTimes.contains("08:00"), "08:00 should have been skipped");
        assertFalse(slotTimes.contains("08:30"), "08:30 should have been skipped");
        assertFalse(slotTimes.contains("09:00"), "09:00 should have been skipped");
        assertFalse(slotTimes.contains("09:30"), "09:30 should have been skipped");
        assertTrue(slotTimes.contains("10:00"), "10:00 slot should be available");
    }

    @Test
    @DisplayName("Case 6: Valid future slot outside customer stay window is rejected by validateStayWindow")
    void testCase6_FutureSlotOutsideStayWindow_RejectedByValidateStayWindow() {
        // Customer stay is 2026-11-01 to 2026-11-15
        // Slot is 2026-11-20 (in the future relative to BASE_NOW 2026-11-07, but outside stay window)
        LocalDateTime futureStart = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime futureEnd = futureStart.plusMinutes(60);

        // Future check itself passes
        assertDoesNotThrow(() -> sessionService.validateNotPastDate(futureStart, false));

        // But stay window validation catches the boundary violation
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.validateStayWindow(stayContext, futureStart, futureEnd)
        );
        assertTrue(ex.getMessage().contains("falls outside customer stay window"),
                "Expected stay window exception, got: " + ex.getMessage());
    }

    @Test
    @DisplayName("Case 7: Staff booking override behavior allows operational walk-in / immediate sessions")
    void testCase7_StaffBookingOverride_AllowsOperationalImmediateBooking() {
        LocalDateTime pastStart = LocalDateTime.of(2026, 11, 5, 8, 0);

        // Customer booking throws PAST_DATE_NOT_ALLOWED
        assertThrows(BusinessRuleException.class, () ->
                sessionService.validateNotPastDate(pastStart, false)
        );

        // Staff booking does NOT throw PAST_DATE_NOT_ALLOWED (operational override allowed per UC15)
        assertDoesNotThrow(() ->
                sessionService.validateNotPastDate(pastStart, true),
                "Staff member should have operational override for walk-in / same-day bookings"
        );
    }

    @Test
    @DisplayName("Case 8: Authenticated CUSTOMER with bookingSource=RECEPTIONIST is rejected as staff")
    void testCase8_CustomerWithSpoofedReceptionistBookingSource_RejectedAsStaff() {
        when(customerStayPort.getActiveStayForUser(101)).thenReturn(Optional.of(stayContext));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("cust101", "pass", List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")))
        );

        LocalDateTime pastStart = LocalDateTime.of(2026, 11, 5, 8, 0);
        LocalDateTime pastEnd = pastStart.plusMinutes(90);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                10, 2, 1, pastStart, pastEnd, 3, "Customer attempting staff spoofing"
        );
        req.setBookingSource(BookingSource.RECEPTIONIST);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(req, 101)
        );

        assertEquals("PAST_DATE_NOT_ALLOWED", ex.getErrorCode());
        assertEquals(BookingSource.CUSTOMER, req.getBookingSource(),
                "Backend must forcibly sanitize client bookingSource to CUSTOMER");
    }

    @Test
    @DisplayName("Case 9: Missing SecurityContext with bookingSource=RECEPTIONIST defaults to non-staff and fails past-date validation")
    void testCase9_MissingSecurityContextWithReceptionistBookingSource_DefaultsToNonStaff() {
        when(customerStayPort.getActiveStayForUser(101)).thenReturn(Optional.of(stayContext));
        SecurityContextHolder.clearContext(); // auth == null

        LocalDateTime pastStart = LocalDateTime.of(2026, 11, 5, 8, 0);
        LocalDateTime pastEnd = pastStart.plusMinutes(90);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                10, 2, 1, pastStart, pastEnd, 3, "Unauthenticated request with RECEPTIONIST tag"
        );
        req.setBookingSource(BookingSource.RECEPTIONIST);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.confirmReservation(req, 101)
        );

        assertEquals("PAST_DATE_NOT_ALLOWED", ex.getErrorCode());
    }

    @Test
    @DisplayName("Case 10: Authenticated RECEPTIONIST preserves legitimate UC15 behavior without past-date rejection")
    void testCase10_AuthenticatedReceptionist_LegitimateUC15BehaviorPreserved() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("recUser", "pass", List.of(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")))
        );

        when(customerStayPort.getStayById(3)).thenReturn(Optional.of(stayContext));
        when(treatmentRepository.findById(10)).thenReturn(Optional.of(testTreatment));
        when(therapistRepository.findByIdWithLock(2)).thenReturn(Optional.of(testTherapist));
        when(roomRepository.findByIdWithLock(1)).thenReturn(Optional.of(testRoom));
        when(qualificationRepository.existsByTherapist_TherapistIdAndTreatment_TreatmentId(2, 10)).thenReturn(true);
        when(compatibilityRepository.existsByTreatmentRoom_RoomIdAndTreatment_TreatmentId(1, 10)).thenReturn(true);
        when(sessionRepository.hasOverlappingSession(eq(2), isNull(), any(), any(), any())).thenReturn(false);
        when(sessionRepository.hasOverlappingSession(isNull(), eq(1), any(), any(), any())).thenReturn(false);

        LocalDateTime walkInStart = LocalDateTime.of(2026, 11, 5, 8, 0); // Walk-in slot within stay window
        LocalDateTime walkInEnd = walkInStart.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                10, 2, 1, walkInStart, walkInEnd, 3, "Front-desk walk-in extra service"
        );
        req.setBookingSource(BookingSource.RECEPTIONIST);

        SpaSession savedSession = new SpaSession();
        savedSession.setSpaSessionId(777L);
        savedSession.setTreatment(testTreatment);
        savedSession.setTherapist(testTherapist);
        savedSession.setTreatmentRoom(testRoom);
        savedSession.setScheduledStartAt(walkInStart);
        savedSession.setScheduledEndAt(walkInEnd);
        savedSession.setRetreatBookingId(3);
        savedSession.setBookingSource(BookingSource.RECEPTIONIST);
        savedSession.setSessionStatus(SpaSessionStatus.SCHEDULED);
        savedSession.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);

        when(sessionRepository.save(any(SpaSession.class))).thenReturn(savedSession);

        SpaSessionDto dto = assertDoesNotThrow(() -> sessionService.confirmReservation(req, 99));

        assertNotNull(dto);
        assertEquals(BookingSource.RECEPTIONIST, dto.getBookingSource());
        assertEquals(SpaSessionStatus.SCHEDULED, dto.getSessionStatus());
    }

    @Test
    @DisplayName("Case 11: Existing customer booking behavior unchanged for valid future slot within stay window")
    void testCase11_ExistingCustomerBookingBehavior_Unchanged() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("cust101", "pass", List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")))
        );
        when(customerStayPort.getActiveStayForUser(101)).thenReturn(Optional.of(stayContext));
        when(treatmentRepository.findById(10)).thenReturn(Optional.of(testTreatment));
        when(therapistRepository.findByIdWithLock(2)).thenReturn(Optional.of(testTherapist));
        when(roomRepository.findByIdWithLock(1)).thenReturn(Optional.of(testRoom));
        when(qualificationRepository.existsByTherapist_TherapistIdAndTreatment_TreatmentId(2, 10)).thenReturn(true);
        when(compatibilityRepository.existsByTreatmentRoom_RoomIdAndTreatment_TreatmentId(1, 10)).thenReturn(true);
        when(sessionRepository.hasOverlappingSession(eq(2), isNull(), any(), any(), any())).thenReturn(false);
        when(sessionRepository.hasOverlappingSession(isNull(), eq(1), any(), any(), any())).thenReturn(false);

        LocalDateTime futureStart = LocalDateTime.of(2026, 11, 7, 14, 0); // Future slot today
        LocalDateTime futureEnd = futureStart.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                10, 2, 1, futureStart, futureEnd, 3, "Customer valid afternoon session"
        );

        SpaSession savedSession = new SpaSession();
        savedSession.setSpaSessionId(888L);
        savedSession.setTreatment(testTreatment);
        savedSession.setTherapist(testTherapist);
        savedSession.setTreatmentRoom(testRoom);
        savedSession.setScheduledStartAt(futureStart);
        savedSession.setScheduledEndAt(futureEnd);
        savedSession.setRetreatBookingId(3);
        savedSession.setBookingSource(BookingSource.CUSTOMER);
        savedSession.setSessionStatus(SpaSessionStatus.SCHEDULED);
        savedSession.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);

        when(sessionRepository.save(any(SpaSession.class))).thenReturn(savedSession);

        SpaSessionDto dto = assertDoesNotThrow(() -> sessionService.confirmReservation(req, 101));

        assertNotNull(dto);
        assertEquals(BookingSource.CUSTOMER, dto.getBookingSource());
    }

    @Test
    @DisplayName("Case 12: Timezone boundary test - 2026-11-06 17:30 UTC derives 2026-11-07 in Ho Chi Minh City")
    void testCase12_TimezoneBoundary_1730UTC_DerivesNov07() {
        Instant instant = Instant.parse("2026-11-06T17:30:00Z");
        Clock hcmClock = Clock.fixed(instant, SpaSessionService.RESORT_ZONE_ID);

        sessionService.setClock(hcmClock);
        schedulingEngineService.setClock(hcmClock);

        LocalDateTime nowInHcm = LocalDateTime.now(hcmClock);
        assertEquals(LocalDate.of(2026, 11, 7), nowInHcm.toLocalDate(),
                "17:30 UTC + 7h must evaluate to 2026-11-07 in Asia/Ho_Chi_Minh");
        assertEquals(LocalTime.of(0, 30), nowInHcm.toLocalTime());

        // A slot on 2026-11-06 at 20:00 is in the PAST relative to 2026-11-07 00:30
        LocalDateTime pastSlot = LocalDateTime.of(2026, 11, 6, 20, 0);
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.validateNotPastDate(pastSlot, false)
        );
        assertEquals("PAST_DATE_NOT_ALLOWED", ex.getErrorCode());

        // A slot on 2026-11-07 at 08:00 is in the FUTURE relative to 2026-11-07 00:30
        LocalDateTime futureSlot = LocalDateTime.of(2026, 11, 7, 8, 0);
        assertDoesNotThrow(() -> sessionService.validateNotPastDate(futureSlot, false));
    }

    @Test
    @DisplayName("Case 13: Timezone boundary test - 2026-11-06 16:59 UTC derives 2026-11-06 in Ho Chi Minh City")
    void testCase13_TimezoneBoundary_1659UTC_DerivesNov06() {
        Instant instant = Instant.parse("2026-11-06T16:59:00Z");
        Clock hcmClock = Clock.fixed(instant, SpaSessionService.RESORT_ZONE_ID);

        sessionService.setClock(hcmClock);
        schedulingEngineService.setClock(hcmClock);

        LocalDateTime nowInHcm = LocalDateTime.now(hcmClock);
        assertEquals(LocalDate.of(2026, 11, 6), nowInHcm.toLocalDate(),
                "16:59 UTC + 7h must evaluate to 2026-11-06 in Asia/Ho_Chi_Minh");
        assertEquals(LocalTime.of(23, 59), nowInHcm.toLocalTime());

        // A slot on 2026-11-06 at 23:59:00 is current / future relative to 23:59:00
        LocalDateTime currentSlot = LocalDateTime.of(2026, 11, 6, 23, 59);
        assertDoesNotThrow(() -> sessionService.validateNotPastDate(currentSlot, false));
    }

    @Test
    @DisplayName("Case 14: Timezone boundary test - 2026-11-06 17:00:00 UTC shifts to next calendar day in Vietnam")
    void testCase14_TimezoneBoundary_1700UTC_ExactMidnight_DerivesNov07() {
        // 17:00:00 UTC + 7h = 00:00:00 on Nov 7 in Asia/Ho_Chi_Minh
        Instant midnightInstant = Instant.parse("2026-11-06T17:00:00Z");
        Clock hcmClock = Clock.fixed(midnightInstant, SpaSessionService.RESORT_ZONE_ID);

        sessionService.setClock(hcmClock);
        schedulingEngineService.setClock(hcmClock);

        LocalDateTime nowInHcm = LocalDateTime.now(hcmClock);
        assertEquals(LocalDate.of(2026, 11, 7), nowInHcm.toLocalDate(),
                "17:00 UTC + 7h must evaluate to exactly 2026-11-07 00:00:00 in Asia/Ho_Chi_Minh");
        assertEquals(LocalTime.of(0, 0, 0), nowInHcm.toLocalTime());

        // A slot on 2026-11-06 is now in the past and must be rejected
        LocalDateTime pastSlot = LocalDateTime.of(2026, 11, 6, 15, 0);
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                sessionService.validateNotPastDate(pastSlot, false)
        );
        assertEquals("PAST_DATE_NOT_ALLOWED", ex.getErrorCode());
    }
}

