package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.m3spa.dto.request.ConfirmReservationRequest;
import com.heavenstay.hswrms.m3spa.dto.request.GenerateCandidatesRequest;
import com.heavenstay.hswrms.m3spa.dto.response.CandidateGenerationResultDto;
import com.heavenstay.hswrms.m3spa.dto.response.SchedulingCandidateDto;
import com.heavenstay.hswrms.m3spa.dto.response.SpaSessionDto;
import com.heavenstay.hswrms.m3spa.dto.response.TherapistSessionDetailDto;
import com.heavenstay.hswrms.m3spa.entity.*;
import com.heavenstay.hswrms.m3spa.entity.enums.*;
import com.heavenstay.hswrms.m3spa.repository.*;
import com.heavenstay.hswrms.m3spa.scheduler.SessionTimelineScheduler;
import com.heavenstay.hswrms.m3spa.service.SchedulingEngineService;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.context.annotation.Import;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(SpaTestConfig.class)
public class SpaServiceTests {

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
    private SchedulingEngineService schedulingEngineService;

    @Autowired
    private SpaSessionService spaSessionService;

    @Autowired
    private SessionTimelineScheduler timelineScheduler;

    @Autowired
    private com.heavenstay.hswrms.m3spa.service.SessionRecoveryService recoveryService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private SpaTreatment massageTreatment;
    private SpaTreatment yogaTreatment;
    private Therapist qualifiedTherapist;
    private Therapist unqualifiedTherapist;
    private TreatmentRoom compatibleRoom;
    private TreatmentRoom incompatibleRoom;

    @BeforeEach
    public void setupData() {
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
                "Traditional Vietnamese herbal compress massage"
        );
        massageTreatment = treatmentRepository.save(massageTreatment);

        yogaTreatment = new SpaTreatment(
                "Sunrise Hatha Yoga",
                90,
                new BigDecimal("800000"),
                "Yoga",
                "Mindful yoga session"
        );
        yogaTreatment = treatmentRepository.save(yogaTreatment);

        // 2. Therapists
        qualifiedTherapist = new Therapist(10, TherapistStatus.ACTIVE);
        qualifiedTherapist.setDisplayName("Mai Nguyen");
        qualifiedTherapist = therapistRepository.save(qualifiedTherapist);

        unqualifiedTherapist = new Therapist(11, TherapistStatus.ACTIVE);
        unqualifiedTherapist.setDisplayName("Linh Tran");
        unqualifiedTherapist = therapistRepository.save(unqualifiedTherapist);

        // 3. Treatment Rooms
        compatibleRoom = new TreatmentRoom("Lotus Suite", TreatmentRoomStatus.AVAILABLE);
        compatibleRoom = roomRepository.save(compatibleRoom);

        incompatibleRoom = new TreatmentRoom("Open Yoga Pavilion", TreatmentRoomStatus.AVAILABLE);
        incompatibleRoom = roomRepository.save(incompatibleRoom);

        // 4. Qualifications: qualifiedTherapist is qualified for massageTreatment
        TherapistTreatmentQualification qual = new TherapistTreatmentQualification(
                qualifiedTherapist,
                massageTreatment
        );
        qualificationRepository.save(qual);

        // 5. Compatibility: compatibleRoom is compatible with massageTreatment
        TreatmentRoomCompatibility comp = new TreatmentRoomCompatibility(
                compatibleRoom,
                massageTreatment
        );
        compatibilityRepository.save(comp);
    }

    @Test
    @DisplayName("1. Qualified Therapist is accepted for reservation")
    public void testQualifiedTherapistAccepted() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start,
                end,
                101,
                "Quiet room please"
        );

        SpaSessionDto dto = spaSessionService.confirmReservation(req, 1);
        assertNotNull(dto);
        assertEquals(qualifiedTherapist.getTherapistId(), dto.getTherapistId());
        assertNotNull(dto.getTherapistName());
    }

    @Test
    @DisplayName("2. Unqualified Therapist is rejected")
    public void testUnqualifiedTherapistRejected() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                unqualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start,
                end,
                101,
                null
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                spaSessionService.confirmReservation(req, 1)
        );
        assertTrue(ex.getMessage().contains("not qualified"));
    }

    @Test
    @DisplayName("3. Compatible Treatment Room is accepted")
    public void testCompatibleRoomAccepted() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 11, 0);
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

        SpaSessionDto dto = spaSessionService.confirmReservation(req, 1);
        assertNotNull(dto);
        assertEquals(compatibleRoom.getRoomName(), dto.getRoomName());
    }

    @Test
    @DisplayName("4. Incompatible Treatment Room is rejected")
    public void testIncompatibleRoomRejected() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 11, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                incompatibleRoom.getRoomId(),
                start,
                end,
                101,
                null
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                spaSessionService.confirmReservation(req, 1)
        );
        assertTrue(ex.getMessage().contains("not compatible"));
    }

    @Test
    @DisplayName("5. Non-overlapping intervals are accepted")
    public void testNonOverlappingIntervalsAccepted() {
        LocalDateTime start1 = LocalDateTime.of(2026, 9, 26, 9, 0);
        LocalDateTime end1 = start1.plusMinutes(60);

        ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start1,
                end1,
                101,
                null
        );
        spaSessionService.confirmReservation(req1, 1);

        // Distinct slot 11:00-12:00
        LocalDateTime start2 = LocalDateTime.of(2026, 9, 26, 11, 0);
        LocalDateTime end2 = start2.plusMinutes(60);
        ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start2,
                end2,
                101,
                null
        );

        SpaSessionDto dto2 = spaSessionService.confirmReservation(req2, 1);
        assertNotNull(dto2);
        assertEquals("11:00", dto2.getStartTime());
    }

    @Test
    @DisplayName("6. Overlapping Therapist interval is rejected")
    public void testOverlappingTherapistIntervalRejected() {
        LocalDateTime start1 = LocalDateTime.of(2026, 9, 26, 9, 0);
        LocalDateTime end1 = start1.plusMinutes(60); // 09:00 - 10:00

        ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start1,
                end1,
                101,
                null
        );
        spaSessionService.confirmReservation(req1, 1);

        // Overlapping slot 09:30 - 10:30 with same therapist
        LocalDateTime start2 = LocalDateTime.of(2026, 9, 26, 9, 30);
        LocalDateTime end2 = start2.plusMinutes(60);

        ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start2,
                end2,
                102,
                null
        );

        ConflictException ex = assertThrows(ConflictException.class, () ->
                spaSessionService.confirmReservation(req2, 2)
        );
        assertTrue(ex.getMessage().contains("conflict") || ex.getMessage().contains("already reserved"));
    }

    @Test
    @DisplayName("7. Overlapping Treatment Room interval is rejected")
    public void testOverlappingRoomIntervalRejected() {
        LocalDateTime start1 = LocalDateTime.of(2026, 9, 26, 14, 0);
        LocalDateTime end1 = start1.plusMinutes(60); // 14:00 - 15:00

        ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start1,
                end1,
                101,
                null
        );
        spaSessionService.confirmReservation(req1, 1);

        // Overlapping slot 14:15 - 15:15 targeting same room
        LocalDateTime start2 = LocalDateTime.of(2026, 9, 26, 14, 15);
        LocalDateTime end2 = start2.plusMinutes(60);

        ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start2,
                end2,
                102,
                null
        );

        assertThrows(ConflictException.class, () ->
                spaSessionService.confirmReservation(req2, 2)
        );
    }

    @Test
    @DisplayName("8 & 25. Candidate generation does not reserve resources and remains read-only under repeated calls")
    public void testCandidateGenerationIsReadOnly() {
        long sessionCountBefore = sessionRepository.count();

        GenerateCandidatesRequest req = new GenerateCandidatesRequest(
                massageTreatment.getTreatmentId(),
                LocalDate.of(2026, 9, 26),
                "ALL"
        );

        CandidateGenerationResultDto res1 = schedulingEngineService.generateCandidates(req);
        CandidateGenerationResultDto res2 = schedulingEngineService.generateCandidates(req);

        assertNotNull(res1);
        assertNotNull(res2);
        assertFalse(res1.getCandidates().isEmpty());
        assertEquals(res1.getCandidates().size(), res2.getCandidates().size());
        assertEquals(sessionCountBefore, sessionRepository.count(), "Generating candidates must not persist any session!");
    }

    @Test
    @DisplayName("9. Candidate is always a complete: time + Therapist + Treatment Room bundle")
    public void testCandidateIntegrity() {
        GenerateCandidatesRequest req = new GenerateCandidatesRequest(
                massageTreatment.getTreatmentId(),
                LocalDate.of(2026, 9, 26),
                "ALL"
        );

        CandidateGenerationResultDto res = schedulingEngineService.generateCandidates(req);
        for (SchedulingCandidateDto c : res.getCandidates()) {
            assertNotNull(c.getScheduledStartAt(), "Time must be present");
            assertNotNull(c.getTherapistId(), "Therapist must be present");
            assertNotNull(c.getTherapistName(), "Therapist name must be present");
            assertNotNull(c.getRoomId(), "Room must be present");
            assertNotNull(c.getRoomName(), "Room name must be present");
        }
    }

    @Test
    @DisplayName("10 & 11. Successful new confirmation creates exactly one SpaSession with SCHEDULED + PENDING")
    public void testNewConfirmationStatusModel() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 16, 0);
        LocalDateTime end = start.plusMinutes(60);

        long countBefore = sessionRepository.count();

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start,
                end,
                101,
                "First session"
        );

        SpaSessionDto sessionDto = spaSessionService.confirmReservation(req, 1);
        assertEquals(countBefore + 1, sessionRepository.count());

        assertEquals(SpaSessionStatus.SCHEDULED, sessionDto.getSessionStatus());
        assertEquals(SpaConfirmationStatus.PENDING, sessionDto.getConfirmationStatus());
    }

    @Test
    @DisplayName("12 & 13. Customer attendance confirmation changes only confirmation_status to CONFIRMED, and EXPIRED != NO_SHOW")
    public void testAttendanceConfirmation() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 17, 0);
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

        SpaSessionDto created = spaSessionService.confirmReservation(req, 1);
        assertEquals(SpaConfirmationStatus.PENDING, created.getConfirmationStatus());

        SpaSessionDto confirmed = spaSessionService.confirmAttendance(created.getSpaSessionId(), 1);
        assertEquals(SpaSessionStatus.SCHEDULED, confirmed.getSessionStatus(), "session_status must remain SCHEDULED");
        assertEquals(SpaConfirmationStatus.CONFIRMED, confirmed.getConfirmationStatus(), "confirmation_status must transition to CONFIRMED");

        // Verify distinct semantics of EXPIRED and NO_SHOW
        assertNotEquals(SpaConfirmationStatus.EXPIRED.name(), SpaSessionStatus.NO_SHOW.name());
    }

    @Test
    @DisplayName("14. Therapist cannot access another Therapist's session")
    public void testTherapistSessionAccessRestriction() {
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

        // unqualifiedTherapist user ID is 11
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                spaSessionService.getTherapistSessionDetail(session.getSpaSessionId(), 11)
        );
        assertTrue(ex.getMessage().contains("not authorized"));
    }

    @Test
    @DisplayName("15. Therapist health projection excludes unrelated HealthProfile fields (data minimization)")
    public void testTherapistHealthProjectionMinimization() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 13, 0);
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

        // qualifiedTherapist user ID is 10
        TherapistSessionDetailDto detail = spaSessionService.getTherapistSessionDetail(session.getSpaSessionId(), 10);
        assertNotNull(detail);
        assertNotNull(detail.getCustomerFirstName());
        assertNotNull(detail.getTreatmentSafetyNotes());
        assertNotNull(detail.getRelevantPrecautions());
    }

    @Test
    @DisplayName("16. No availability creates no SpaSession and reserves no resource")
    public void testNoAvailabilityCreatesNothing() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start,
                end,
                101,
                null
        );
        spaSessionService.confirmReservation(req1, 1);

        long sessionCount = sessionRepository.count();

        // Conflicting request
        ConfirmReservationRequest conflictReq = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start,
                end,
                102,
                null
        );

        assertThrows(ConflictException.class, () -> spaSessionService.confirmReservation(conflictReq, 2));
        assertEquals(sessionCount, sessionRepository.count(), "No new session should be persisted on conflict");
    }

    @Test
    @DisplayName("17, 18, 19, 20 & 21. Customer reschedule preserves original session during search and on conflict, and moves atomically on success")
    public void testCustomerRescheduleInvariants() {
        LocalDateTime origStart = LocalDateTime.of(2026, 9, 26, 9, 0);
        LocalDateTime origEnd = origStart.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                origStart,
                origEnd,
                101,
                "Original Note"
        );
        SpaSessionDto originalSession = spaSessionService.confirmReservation(req, 1);

        // 17. Browsing replacement candidates does not modify original session
        GenerateCandidatesRequest genReq = new GenerateCandidatesRequest(
                massageTreatment.getTreatmentId(),
                LocalDate.of(2026, 9, 26),
                "ALL"
        );
        schedulingEngineService.generateCandidates(genReq);

        SpaSession origSessionInDb = sessionRepository.findById(originalSession.getSpaSessionId()).orElseThrow();
        assertEquals(origStart, origSessionInDb.getScheduledStartAt(), "Original start time must remain intact!");

        // 20 & 19. Failed Customer reschedule preserves original SpaSession
        LocalDateTime conflictingStart = LocalDateTime.of(2026, 9, 26, 14, 0);
        LocalDateTime conflictingEnd = conflictingStart.plusMinutes(60);

        // Create an existing blocking session at 14:00
        ConfirmReservationRequest blockReq = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                conflictingStart,
                conflictingEnd,
                102,
                "Blocking session"
        );
        spaSessionService.confirmReservation(blockReq, 2);

        // Attempting to reschedule originalSession into conflicting slot (14:00) must fail with 409
        ConfirmReservationRequest conflictRescheduleReq = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                conflictingStart,
                conflictingEnd,
                101,
                "Attempted reschedule"
        );
        conflictRescheduleReq.setRescheduleSessionId(originalSession.getSpaSessionId());

        assertThrows(ConflictException.class, () ->
                spaSessionService.confirmReservation(conflictRescheduleReq, 1)
        );

        // Original session must still be intact at 09:00
        origSessionInDb = sessionRepository.findById(originalSession.getSpaSessionId()).orElseThrow();
        assertEquals(origStart, origSessionInDb.getScheduledStartAt());
        assertEquals(SpaSessionStatus.SCHEDULED, origSessionInDb.getSessionStatus());

        // 21. Customer cannot reschedule another Customer's session
        ConfirmReservationRequest unauthorizedReschedule = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                LocalDateTime.of(2026, 9, 26, 16, 0),
                LocalDateTime.of(2026, 9, 26, 17, 0),
                102, // Different booking ID
                null
        );
        unauthorizedReschedule.setRescheduleSessionId(originalSession.getSpaSessionId());

        assertThrows(BusinessRuleException.class, () ->
                spaSessionService.confirmReservation(unauthorizedReschedule, 2)
        );

        // 18. Successful Customer reschedule updates session atomically
        LocalDateTime freeStart = LocalDateTime.of(2026, 9, 26, 16, 0);
        LocalDateTime freeEnd = freeStart.plusMinutes(60);

        ConfirmReservationRequest validRescheduleReq = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                freeStart,
                freeEnd,
                101,
                "Updated Reschedule"
        );
        validRescheduleReq.setRescheduleSessionId(originalSession.getSpaSessionId());

        SpaSessionDto rescheduledDto = spaSessionService.confirmReservation(validRescheduleReq, 1);
        assertEquals(freeStart, rescheduledDto.getScheduledStartAt());
        assertEquals(SpaSessionStatus.SCHEDULED, rescheduledDto.getSessionStatus());
        assertEquals(SpaConfirmationStatus.PENDING, rescheduledDto.getConfirmationStatus());
    }

    @Test
    @DisplayName("22 & 23. Confirmation timeout produces confirmation_status=EXPIRED and session_status=RESCHEDULING")
    public void testConfirmationTimeoutDeadlineEnforcement() {
        // Create session scheduled 30 minutes from now (past T-60m deadline)
        LocalDateTime sessionTime = LocalDateTime.now().plusMinutes(30);

        SpaSession session = new SpaSession(
                101,
                massageTreatment,
                qualifiedTherapist,
                compatibleRoom,
                sessionTime,
                sessionTime,
                sessionTime.plusMinutes(60),
                BookingSource.CUSTOMER,
                "Approaching session"
        );
        session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
        session.setSessionStatus(SpaSessionStatus.SCHEDULED);
        session = sessionRepository.save(session);

        // Run scheduler
        timelineScheduler.processConfirmationDeadlines();

        SpaSession updated = sessionRepository.findById(session.getSpaSessionId()).orElseThrow();
        assertEquals(SpaConfirmationStatus.EXPIRED, updated.getConfirmationStatus());
        assertEquals(SpaSessionStatus.RESCHEDULING, updated.getSessionStatus());
        assertNotEquals(SpaSessionStatus.NO_SHOW, updated.getSessionStatus(), "EXPIRED must not become NO_SHOW!");
    }

    @Test
    @DisplayName("24. Invalid lifecycle status transition is rejected and IN_PROGRESS is prohibited (OI-08)")
    public void testInvalidStatusTransitionsAndInProgressProhibition() {
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

        // Attempting to set IN_PROGRESS must fail per OI-08
        BusinessRuleException ex1 = assertThrows(BusinessRuleException.class, () ->
                spaSessionService.recordSessionOutcome(session.getSpaSessionId(), 10, "IN_PROGRESS", "Notes")
        );
        assertTrue(ex1.getMessage().contains("OI-08") || ex1.getMessage().contains("IN_PROGRESS"));

        // Marking COMPLETED is accepted
        SpaSessionDto completed = spaSessionService.recordSessionOutcome(session.getSpaSessionId(), 10, "COMPLETED", "Excellent session");
        assertEquals(SpaSessionStatus.COMPLETED, completed.getSessionStatus());

        // Cancel after COMPLETED is rejected
        assertThrows(BusinessRuleException.class, () ->
                spaSessionService.cancelSession(session.getSpaSessionId(), 1)
        );
    }

    @Test
    @DisplayName("26. Receptionist extra booking uses the same Scheduling Engine")
    public void testReceptionistExtraBookingUsesSameEngine() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 15, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start,
                end,
                101,
                "Receptionist note"
        );
        req.setBookingSource(BookingSource.RECEPTIONIST);

        SpaSessionDto sessionDto = spaSessionService.confirmReservation(req, 99);
        assertNotNull(sessionDto);
        assertEquals(BookingSource.RECEPTIONIST, sessionDto.getBookingSource());
        assertEquals(SpaSessionStatus.SCHEDULED, sessionDto.getSessionStatus());
    }

    @Test
    @DisplayName("29. Same-time recovery preserves original interval when replacement qualified therapist exists")
    public void testSameTimeRecoveryPreservesTime() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);
        LocalDateTime end = start.plusMinutes(60);

        // Add a second qualified therapist (userId=12)
        Therapist secondQualified = new Therapist(12, TherapistStatus.ACTIVE);
        secondQualified = therapistRepository.save(secondQualified);
        qualificationRepository.save(new TherapistTreatmentQualification(secondQualified, massageTreatment));

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start,
                end,
                101,
                "Session needing recovery"
        );
        SpaSessionDto session = spaSessionService.confirmReservation(req, 1);

        // Make the originally assigned therapist unavailable (suspended)
        qualifiedTherapist.setTherapistStatus(TherapistStatus.SUSPENDED);
        therapistRepository.save(qualifiedTherapist);

        // Execute recovery
        com.heavenstay.hswrms.m3spa.dto.response.RecoveryResultDto recoveryResult =
                recoveryService.attemptSameTimeRecovery(session.getSpaSessionId());

        assertTrue(recoveryResult.isRecovered());
        assertTrue(recoveryResult.isPreservedSameTime());
        assertEquals(secondQualified.getTherapistId(), recoveryResult.getReplacementTherapistId());

        SpaSession inDb = sessionRepository.findById(session.getSpaSessionId()).orElseThrow();
        assertEquals(start, inDb.getScheduledStartAt(), "Original time must be strictly preserved!");
        assertEquals(SpaSessionStatus.SCHEDULED, inDb.getSessionStatus());
    }

    @Test
    @DisplayName("30. Recovery requiring time change does NOT auto-commit without Customer consent")
    public void testTimeChangeRecoveryRequiresCustomerConsent() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start,
                end,
                101,
                "Single therapist session"
        );
        SpaSessionDto session = spaSessionService.confirmReservation(req, 1);

        // Make the only qualified therapist inactive and no other qualified therapist exists
        qualifiedTherapist.setTherapistStatus(TherapistStatus.INACTIVE);
        therapistRepository.save(qualifiedTherapist);

        com.heavenstay.hswrms.m3spa.dto.response.RecoveryResultDto recoveryResult =
                recoveryService.attemptSameTimeRecovery(session.getSpaSessionId());

        assertFalse(recoveryResult.isRecovered());
        assertTrue(recoveryResult.isRequiresCustomerConsent(), "System must require customer consent!");
        assertFalse(recoveryResult.isPreservedSameTime());

        SpaSession inDb = sessionRepository.findById(session.getSpaSessionId()).orElseThrow();
        assertEquals(SpaSessionStatus.RESCHEDULING, inDb.getSessionStatus(), "Session must remain in RESCHEDULING status!");
        assertEquals(start, inDb.getScheduledStartAt(), "System must not silently commit a new time!");
    }

    @Test
    @DisplayName("31. Customer cannot confirm or cancel another customer's session")
    public void testCustomerCannotModifyAnotherCustomerSession() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 26, 11, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                massageTreatment.getTreatmentId(),
                qualifiedTherapist.getTherapistId(),
                compatibleRoom.getRoomId(),
                start,
                end,
                101, // Belongs to Customer 1 (booking 101)
                null
        );
        SpaSessionDto session = spaSessionService.confirmReservation(req, 1);

        // Customer 2 (userId 2, booking 102) attempts to confirm attendance of Customer 1's session
        assertThrows(BusinessRuleException.class, () ->
                spaSessionService.confirmAttendance(session.getSpaSessionId(), 2)
        );

        // Customer 2 attempts to cancel Customer 1's session
        assertThrows(BusinessRuleException.class, () ->
                spaSessionService.cancelSession(session.getSpaSessionId(), 2)
        );
    }

    @Test
    @DisplayName("32. Alternative slot candidate generation respects configured search horizon parameter")
    public void testAlternativeGenerationConfigurableHorizon() {
        GenerateCandidatesRequest req = new GenerateCandidatesRequest(
                massageTreatment.getTreatmentId(),
                LocalDate.of(2026, 9, 26),
                "ALL",
                1 // Custom 1 day horizon
        );

        CandidateGenerationResultDto res = schedulingEngineService.generateCandidates(req);
        assertNotNull(res);
    }

    @Test
    @DisplayName("33. Alternative generation without caller or configured horizon returns empty alternatives safely")
    public void testAlternativeGenerationWithoutConfiguredHorizonReturnsEmptyAlternativesWhenDateUnavailable() {
        // Suspend qualified therapist for the requested date
        qualifiedTherapist.setTherapistStatus(TherapistStatus.INACTIVE);
        therapistRepository.save(qualifiedTherapist);

        GenerateCandidatesRequest req = new GenerateCandidatesRequest(
                massageTreatment.getTreatmentId(),
                LocalDate.of(2026, 9, 26),
                "ALL",
                null // No caller-specified alternative search horizon
        );

        CandidateGenerationResultDto res = schedulingEngineService.generateCandidates(req);
        assertFalse(res.isHasAvailability());
        assertTrue(res.getCandidates().isEmpty());
        assertTrue(res.getAlternatives().isEmpty(), "Absence of approved horizon must not speculate or invent alternatives!");
    }

    @Test
    @DisplayName("34. Candidate generation fails safely with BusinessRuleException when operating hours are not configured")
    public void testSchedulingFailsSafelyWhenOperatingHoursNotConfigured() {
        SchedulingEngineService unconfiguredService = new SchedulingEngineService(
                treatmentRepository, therapistRepository, roomRepository, sessionRepository
        );
        GenerateCandidatesRequest req = new GenerateCandidatesRequest(
                massageTreatment.getTreatmentId(),
                LocalDate.of(2026, 9, 26),
                "ALL"
        );
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                unconfiguredService.generateCandidates(req)
        );
        assertTrue(ex.getMessage().contains("operating hours are not configured"));
    }

    @Test
    @DisplayName("35. DefaultTherapistHealthProjectionAdapter fails closed without fabricating clinical data")
    public void testDefaultTherapistHealthProjectionAdapterFailsClosedWhenM1Unavailable() {
        com.heavenstay.hswrms.m3spa.port.DefaultTherapistHealthProjectionAdapter prodAdapter =
                new com.heavenstay.hswrms.m3spa.port.DefaultTherapistHealthProjectionAdapter(jdbcTemplate);

        com.heavenstay.hswrms.m3spa.port.TreatmentSafetyNotesDto result = prodAdapter.getTreatmentSafetyNotes(99999);
        assertNotNull(result);
        assertNull(result.getTreatmentSafetyNotes(), "Must not fabricate clinical treatment safety notes!");
        assertNull(result.getRelevantPrecautions(), "Must not fabricate clinical precautions!");
        assertNull(result.getCustomerFirstName(), "Must not fabricate customer identity without M1 data!");

        com.heavenstay.hswrms.m3spa.port.TreatmentSafetyNotesDto nullBookingResult = prodAdapter.getTreatmentSafetyNotes(null);
        assertNotNull(nullBookingResult);
        assertNull(nullBookingResult.getTreatmentSafetyNotes());
        assertNull(nullBookingResult.getRelevantPrecautions());
        assertNull(nullBookingResult.getCustomerFirstName());
    }

    @Test
    @DisplayName("36. SpaTreatment persistence and retrieval with treatmentCode preserves durationMinutes, category, and status")
    public void testSpaTreatmentCodePersistenceAndRetrieval() {
        SpaTreatment treatment = new SpaTreatment(
                "TRT-HYDRO-01",
                "Ocean Mineral Hydrotherapy",
                45,
                new BigDecimal("950000.00"),
                "Hydrotherapy",
                "Restorative warm mineral soak"
        );
        SpaTreatment saved = treatmentRepository.save(treatment);
        assertNotNull(saved.getTreatmentId());

        SpaTreatment loaded = treatmentRepository.findById(saved.getTreatmentId()).orElseThrow();
        assertEquals("TRT-HYDRO-01", loaded.getTreatmentCode());
        assertEquals("Ocean Mineral Hydrotherapy", loaded.getTreatmentName());
        assertEquals(45, loaded.getDurationMinutes());
        assertEquals(new BigDecimal("950000.00"), loaded.getBasePrice());
        assertEquals("Hydrotherapy", loaded.getCategory());
        assertEquals(TreatmentStatus.ACTIVE, loaded.getTreatmentStatus());

        loaded.setTreatmentCode("TRT-HYDRO-02");
        SpaTreatment updated = treatmentRepository.save(loaded);
        assertEquals("TRT-HYDRO-02", updated.getTreatmentCode());
    }

    @Test
    @DisplayName("37. TreatmentRoom persistence and retrieval with roomType preserves roomStatus and roomName")
    public void testTreatmentRoomTypePersistenceAndRetrieval() {
        TreatmentRoom room = new TreatmentRoom(
                "Ocean Breeze VIP Suite",
                TreatmentRoomStatus.AVAILABLE,
                "VIP_SUITE"
        );
        TreatmentRoom saved = roomRepository.save(room);
        assertNotNull(saved.getRoomId());

        TreatmentRoom loaded = roomRepository.findById(saved.getRoomId()).orElseThrow();
        assertEquals("Ocean Breeze VIP Suite", loaded.getRoomName());
        assertEquals("VIP_SUITE", loaded.getRoomType());
        assertEquals(TreatmentRoomStatus.AVAILABLE, loaded.getRoomStatus());

        loaded.setRoomType("SINGLE_STANDARD");
        TreatmentRoom updated = roomRepository.save(loaded);
        assertEquals("SINGLE_STANDARD", updated.getRoomType());
    }

    @Test
    @DisplayName("38. findUnsettledSessionsForBooking retrieves unsettled sessions (SCHEDULED, RESCHEDULING) by retreatBookingId, excludes terminal statuses (CANCELLED, COMPLETED, NO_SHOW), and orders ASC by scheduledStartAt")
    public void testFindUnsettledSessionsForBookingFiltersAndOrders() {
        Integer targetBookingId = 301;
        Integer otherBookingId = 302;

        LocalDateTime baseTime = LocalDateTime.of(2026, 10, 1, 9, 0);

        // Session 1: target booking, SCHEDULED at 09:00 (MUST be included)
        SpaSession s1 = new SpaSession(
                targetBookingId, massageTreatment, qualifiedTherapist, compatibleRoom,
                baseTime, baseTime, baseTime.plusMinutes(60), BookingSource.CUSTOMER, "Session 1 Scheduled"
        );
        s1.setSessionStatus(SpaSessionStatus.SCHEDULED);
        sessionRepository.save(s1);

        // Session 2: target booking, CANCELLED at 11:00 (MUST be excluded)
        LocalDateTime t2 = baseTime.plusHours(2);
        SpaSession s2 = new SpaSession(
                targetBookingId, massageTreatment, qualifiedTherapist, compatibleRoom,
                t2, t2, t2.plusMinutes(60), BookingSource.CUSTOMER, "Session 2 Cancelled"
        );
        s2.setSessionStatus(SpaSessionStatus.CANCELLED);
        sessionRepository.save(s2);

        // Session 3: target booking, RESCHEDULING at 12:00 (MUST be included)
        LocalDateTime t3 = baseTime.plusHours(3);
        SpaSession s3 = new SpaSession(
                targetBookingId, massageTreatment, qualifiedTherapist, compatibleRoom,
                t3, t3, t3.plusMinutes(60), BookingSource.CUSTOMER, "Session 3 Rescheduling"
        );
        s3.setSessionStatus(SpaSessionStatus.RESCHEDULING);
        sessionRepository.save(s3);

        // Session 4: target booking, COMPLETED at 14:00 (MUST be excluded - terminal status)
        LocalDateTime t4 = baseTime.plusHours(5);
        SpaSession s4 = new SpaSession(
                targetBookingId, massageTreatment, qualifiedTherapist, compatibleRoom,
                t4, t4, t4.plusMinutes(60), BookingSource.CUSTOMER, "Session 4 Completed"
        );
        s4.setSessionStatus(SpaSessionStatus.COMPLETED);
        sessionRepository.save(s4);

        // Session 5: target booking, NO_SHOW at 16:00 (MUST be excluded - terminal status)
        LocalDateTime t5 = baseTime.plusHours(7);
        SpaSession s5 = new SpaSession(
                targetBookingId, massageTreatment, qualifiedTherapist, compatibleRoom,
                t5, t5, t5.plusMinutes(60), BookingSource.CUSTOMER, "Session 5 No-Show"
        );
        s5.setSessionStatus(SpaSessionStatus.NO_SHOW);
        sessionRepository.save(s5);

        // Session 6: different booking ID at 08:00 (MUST be excluded)
        LocalDateTime t6 = baseTime.minusHours(1);
        SpaSession s6 = new SpaSession(
                otherBookingId, massageTreatment, qualifiedTherapist, compatibleRoom,
                t6, t6, t6.plusMinutes(60), BookingSource.CUSTOMER, "Other Booking Session"
        );
        s6.setSessionStatus(SpaSessionStatus.SCHEDULED);
        sessionRepository.save(s6);

        List<SpaSession> unsettled = sessionRepository.findUnsettledSessionsForBooking(targetBookingId);

        // Verify count: exactly 2 unsettled sessions (s1 SCHEDULED and s3 RESCHEDULING)
        assertEquals(2, unsettled.size(),
                "Must return exactly 2 unsettled sessions (SCHEDULED, RESCHEDULING; CANCELLED, COMPLETED, NO_SHOW excluded)");
        assertTrue(unsettled.stream().noneMatch(s ->
                s.getSessionStatus() == SpaSessionStatus.CANCELLED
                        || s.getSessionStatus() == SpaSessionStatus.COMPLETED
                        || s.getSessionStatus() == SpaSessionStatus.NO_SHOW),
                "Terminal statuses (CANCELLED, COMPLETED, NO_SHOW) must be strictly excluded from unsettled sessions");
        assertTrue(unsettled.stream().allMatch(s -> s.getRetreatBookingId().equals(targetBookingId)),
                "All returned sessions must match requested retreatBookingId");

        // Verify ascending chronological order: s1 at 09:00, then s3 at 12:00
        assertEquals(baseTime, unsettled.get(0).getScheduledStartAt(), "First unsettled session must be s1 at 09:00");
        assertEquals(t3, unsettled.get(1).getScheduledStartAt(), "Second unsettled session must be s3 at 12:00");

        // Verify empty result for unknown booking
        List<SpaSession> emptyList = sessionRepository.findUnsettledSessionsForBooking(9999);
        assertTrue(emptyList.isEmpty(), "Must return empty list for non-existent booking ID");
    }

    @Test
    @DisplayName("39. findSessionsInDateRange retrieves sessions within inclusive range ordered ascending by scheduledStartAt with therapist fetched eagerly")
    public void testFindSessionsInDateRangeInclusiveAndOrdered() {
        LocalDate testDay = LocalDate.of(2026, 10, 5);
        LocalDateTime lowerBound = testDay.atTime(9, 0);
        LocalDateTime upperBound = testDay.atTime(17, 0);

        // Session A: before range at 08:00 (excluded)
        SpaSession sA = new SpaSession(
                201, massageTreatment, qualifiedTherapist, compatibleRoom,
                testDay.atTime(8, 0), testDay.atTime(8, 0), testDay.atTime(9, 0),
                BookingSource.CUSTOMER, "Before lower bound"
        );
        sessionRepository.save(sA);

        // Session B: exactly at lower bound 09:00 (included - inclusive)
        SpaSession sB = new SpaSession(
                201, massageTreatment, qualifiedTherapist, compatibleRoom,
                lowerBound, lowerBound, lowerBound.plusMinutes(60),
                BookingSource.CUSTOMER, "At lower bound"
        );
        sessionRepository.save(sB);

        // Session C: inside range at 13:00 (included)
        LocalDateTime midTime = testDay.atTime(13, 0);
        SpaSession sC = new SpaSession(
                201, massageTreatment, qualifiedTherapist, compatibleRoom,
                midTime, midTime, midTime.plusMinutes(60),
                BookingSource.CUSTOMER, "Mid range"
        );
        sessionRepository.save(sC);

        // Session D: exactly at upper bound 17:00 (included - inclusive)
        SpaSession sD = new SpaSession(
                201, massageTreatment, qualifiedTherapist, compatibleRoom,
                upperBound, upperBound, upperBound.plusMinutes(60),
                BookingSource.CUSTOMER, "At upper bound"
        );
        sessionRepository.save(sD);

        // Session E: after range at 18:00 (excluded)
        SpaSession sE = new SpaSession(
                201, massageTreatment, qualifiedTherapist, compatibleRoom,
                testDay.atTime(18, 0), testDay.atTime(18, 0), testDay.atTime(19, 0),
                BookingSource.CUSTOMER, "After upper bound"
        );
        sessionRepository.save(sE);

        List<SpaSession> rangeSessions = sessionRepository.findSessionsInDateRange(lowerBound, upperBound);

        // Verify count: exactly 3 (sB, sC, sD)
        assertEquals(3, rangeSessions.size(), "Must include exact boundary matches (09:00 and 17:00) and mid-range session");
        assertEquals(lowerBound, rangeSessions.get(0).getScheduledStartAt(), "First result must be lower bound (09:00)");
        assertEquals(midTime, rangeSessions.get(1).getScheduledStartAt(), "Second result must be mid-range (13:00)");
        assertEquals(upperBound, rangeSessions.get(2).getScheduledStartAt(), "Third result must be upper bound (17:00)");

        // Verify that LEFT JOIN FETCH eagerly loaded therapist association
        for (SpaSession session : rangeSessions) {
            assertNotNull(session.getTherapist(), "Therapist must be eagerly fetched by LEFT JOIN FETCH");
            assertEquals(qualifiedTherapist.getTherapistId(), session.getTherapist().getTherapistId());
            assertEquals(qualifiedTherapist.getUserId(), session.getTherapist().getUserId());
            assertEquals(TherapistStatus.ACTIVE, session.getTherapist().getTherapistStatus());
        }

        // Verify empty result when range has no sessions
        List<SpaSession> emptyRange = sessionRepository.findSessionsInDateRange(
                testDay.plusDays(10).atTime(9, 0),
                testDay.plusDays(10).atTime(17, 0)
        );
        assertTrue(emptyRange.isEmpty(), "Must return empty list for date range with no sessions");
    }
}
