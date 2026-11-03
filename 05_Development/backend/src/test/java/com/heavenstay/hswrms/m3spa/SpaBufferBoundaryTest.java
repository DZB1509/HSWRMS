package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.m3spa.dto.request.ConfirmReservationRequest;
import com.heavenstay.hswrms.m3spa.dto.request.GenerateCandidatesRequest;
import com.heavenstay.hswrms.m3spa.dto.response.CandidateGenerationResultDto;
import com.heavenstay.hswrms.m3spa.dto.response.RecoveryResultDto;
import com.heavenstay.hswrms.m3spa.dto.response.SpaSessionDto;
import com.heavenstay.hswrms.m3spa.entity.*;
import com.heavenstay.hswrms.m3spa.entity.enums.*;
import com.heavenstay.hswrms.m3spa.repository.*;
import com.heavenstay.hswrms.m3spa.service.SchedulingEngineService;
import com.heavenstay.hswrms.m3spa.service.SessionRecoveryService;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(SpaTestConfig.class)
public class SpaBufferBoundaryTest {

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

        @Autowired
        private SchedulingEngineService schedulingEngineService;

        @Autowired
        private SessionRecoveryService sessionRecoveryService;

        private SpaTreatment treatment;
        private Therapist therapist1;
        private Therapist therapist2;
        private TreatmentRoom room1;
        private TreatmentRoom room2;

        @BeforeEach
        public void setup() {
                sessionRepository.deleteAll();
                qualificationRepository.deleteAll();
                compatibilityRepository.deleteAll();
                treatmentRepository.deleteAll();
                therapistRepository.deleteAll();
                roomRepository.deleteAll();

                treatment = new SpaTreatment(
                                "Herbal Harmony Massage",
                                60,
                                new BigDecimal("1200000"),
                                "Massage",
                                "Rejuvenating herbal massage");
                treatment = treatmentRepository.save(treatment);

                therapist1 = new Therapist(101, TherapistStatus.ACTIVE);
                therapist1.setDisplayName("Therapist Alpha");
                therapist1 = therapistRepository.save(therapist1);

                therapist2 = new Therapist(102, TherapistStatus.ACTIVE);
                therapist2.setDisplayName("Therapist Beta");
                therapist2 = therapistRepository.save(therapist2);

                room1 = new TreatmentRoom("Lotus Room", TreatmentRoomStatus.AVAILABLE);
                room1 = roomRepository.save(room1);

                room2 = new TreatmentRoom("Jasmine Room", TreatmentRoomStatus.AVAILABLE);
                room2 = roomRepository.save(room2);

                qualificationRepository.save(new TherapistTreatmentQualification(therapist1, treatment));
                qualificationRepository.save(new TherapistTreatmentQualification(therapist2, treatment));
                compatibilityRepository.save(new TreatmentRoomCompatibility(room1, treatment));
                compatibilityRepository.save(new TreatmentRoomCompatibility(room2, treatment));
        }

        @Test
        @DisplayName("1. Same Therapist, back-to-back sessions (0m gap): REJECT with ConflictException")
        public void testBackToBackTherapistConflictRejected() {
                LocalDateTime start1 = LocalDateTime.of(2026, 9, 26, 9, 0);
                LocalDateTime end1 = start1.plusMinutes(60); // 10:00

                ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start1, end1, 101, "Booking 1");
                spaSessionService.confirmReservation(req1, 1);

                // Session 2 immediately follows at 10:00 with same therapist (different room)
                // -> 0m gap
                ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room2.getRoomId(),
                                end1, end1.plusMinutes(60), 101, "Booking 2 Back-to-Back");

                ConflictException ex = assertThrows(ConflictException.class,
                                () -> spaSessionService.confirmReservation(req2, 1));
                assertTrue(ex.getMessage().contains("Scheduling conflict"));
        }

        @Test
        @DisplayName("2. Same Treatment Room, back-to-back sessions (0m gap): REJECT with ConflictException")
        public void testBackToBackRoomConflictRejected() {
                LocalDateTime start1 = LocalDateTime.of(2026, 9, 26, 9, 0);
                LocalDateTime end1 = start1.plusMinutes(60); // 10:00

                ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start1, end1, 101, "Booking 1");
                spaSessionService.confirmReservation(req1, 1);

                // Session 2 immediately follows at 10:00 in same room (different therapist) ->
                // 0m gap
                ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist2.getTherapistId(), room1.getRoomId(),
                                end1, end1.plusMinutes(60), 101, "Booking 2 Back-to-Back Room");

                ConflictException ex = assertThrows(ConflictException.class,
                                () -> spaSessionService.confirmReservation(req2, 1));
                assertTrue(ex.getMessage().contains("Scheduling conflict"));
        }

        @Test
        @DisplayName("3. Exactly 15 minutes between sessions: ACCEPT")
        public void testExact15MinuteBoundaryAccepted() {
                LocalDateTime start1 = LocalDateTime.of(2026, 9, 26, 9, 0);
                LocalDateTime end1 = start1.plusMinutes(60); // 10:00

                ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start1, end1, 101, "Booking 1");
                spaSessionService.confirmReservation(req1, 1);

                // Session 2 starts at 10:15 (exactly 15m after 10:00) with same therapist and
                // room
                LocalDateTime start2 = end1.plusMinutes(15);
                LocalDateTime end2 = start2.plusMinutes(60);

                ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start2, end2, 101, "Booking 2 Exactly 15m gap");

                SpaSessionDto dto2 = assertDoesNotThrow(() -> spaSessionService.confirmReservation(req2, 1));
                assertNotNull(dto2);
                assertEquals("10:15", dto2.getStartTime());
                assertEquals("11:15", dto2.getEndTime());
        }

        @Test
        @DisplayName("4. 14 minutes 59 seconds between sessions: REJECT with ConflictException")
        public void test14Minute59SecondBoundaryRejected() {
                LocalDateTime start1 = LocalDateTime.of(2026, 9, 26, 9, 0, 0);
                LocalDateTime end1 = start1.plusMinutes(60); // 10:00:00

                ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start1, end1, 101, "Booking 1");
                spaSessionService.confirmReservation(req1, 1);

                // Session 2 starts 14m 59s after 10:00:00 -> 10:14:59
                LocalDateTime start2 = end1.plusMinutes(14).plusSeconds(59);
                LocalDateTime end2 = start2.plusMinutes(60);

                ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start2, end2, 101, "Booking 2 Sub-buffer (14m 59s)");

                ConflictException ex = assertThrows(ConflictException.class,
                                () -> spaSessionService.confirmReservation(req2, 1));
                assertTrue(ex.getMessage().contains("Scheduling conflict"));
        }

        @Test
        @DisplayName("5. Candidate before existing session ending exactly 15m before: ACCEPT")
        public void testCandidateBeforeExistingExact15MinutesAccepted() {
                LocalDateTime existingStart = LocalDateTime.of(2026, 9, 26, 11, 0);
                LocalDateTime existingEnd = existingStart.plusMinutes(60); // 12:00

                ConfirmReservationRequest reqExisting = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                existingStart, existingEnd, 101, "Existing Booking at 11:00");
                spaSessionService.confirmReservation(reqExisting, 1);

                // Candidate session 09:45 to 10:45 (ends exactly 15m before 11:00:00)
                LocalDateTime candStart = existingStart.minusMinutes(75); // 09:45
                LocalDateTime candEnd = existingStart.minusMinutes(15); // 10:45

                ConfirmReservationRequest reqCand = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                candStart, candEnd, 101, "Prior booking ending at 10:45");

                SpaSessionDto dto = assertDoesNotThrow(() -> spaSessionService.confirmReservation(reqCand, 1));
                assertNotNull(dto);
                assertEquals("09:45", dto.getStartTime());
                assertEquals("10:45", dto.getEndTime());
        }

        @Test
        @DisplayName("6. Candidate before existing session ending 14m 59s before: REJECT with ConflictException")
        public void testCandidateBeforeExisting14Minutes59SecondsRejected() {
                LocalDateTime existingStart = LocalDateTime.of(2026, 9, 26, 11, 0, 0);
                LocalDateTime existingEnd = existingStart.plusMinutes(60);

                ConfirmReservationRequest reqExisting = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                existingStart, existingEnd, 101, "Existing Booking at 11:00");
                spaSessionService.confirmReservation(reqExisting, 1);

                // Candidate ends at 10:45:01 (only 14m 59s before 11:00:00)
                LocalDateTime candEnd = existingStart.minusMinutes(14).minusSeconds(59); // 10:45:01
                LocalDateTime candStart = candEnd.minusMinutes(60);

                ConfirmReservationRequest reqCand = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                candStart, candEnd, 101, "Prior booking with sub-buffer gap");

                ConflictException ex = assertThrows(ConflictException.class,
                                () -> spaSessionService.confirmReservation(reqCand, 1));
                assertTrue(ex.getMessage().contains("Scheduling conflict"));
        }

        @Test
        @DisplayName("7. Different Therapist and Different Room in adjacent slot: ACCEPT")
        public void testDifferentTherapistAndDifferentRoomAccepted() {
                LocalDateTime start1 = LocalDateTime.of(2026, 9, 26, 9, 0);
                LocalDateTime end1 = start1.plusMinutes(60); // 10:00

                ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start1, end1, 101, "Booking 1 (T1, R1)");
                spaSessionService.confirmReservation(req1, 1);

                // Session 2 starts immediately at 10:00 with T2 and R2 (independent resources)
                ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist2.getTherapistId(), room2.getRoomId(),
                                end1, end1.plusMinutes(60), 101, "Booking 2 (T2, R2)");

                SpaSessionDto dto2 = assertDoesNotThrow(() -> spaSessionService.confirmReservation(req2, 1));
                assertNotNull(dto2);
                assertEquals(therapist2.getTherapistId(), dto2.getTherapistId());
                assertEquals(room2.getRoomId(), dto2.getRoomId());
        }

        @Test
        @DisplayName("8. CANCELLED session releases both slot and buffer: ACCEPT")
        public void testCancelledSessionDoesNotBlockSlotOrBuffer() {
                LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);
                LocalDateTime end = start.plusMinutes(60);

                ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start, end, 101, "Booking to cancel");
                SpaSessionDto session1 = spaSessionService.confirmReservation(req1, 1);

                // Cancel session 1
                spaSessionService.cancelSession(session1.getSpaSessionId(), 1);

                // Booking 2 at adjacent slot 09:30 to 10:30 (would have conflicted if not
                // cancelled)
                LocalDateTime start2 = start.plusMinutes(30);
                LocalDateTime end2 = start2.plusMinutes(60);

                ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start2, end2, 101, "Booking on previously cancelled interval");

                SpaSessionDto dto2 = assertDoesNotThrow(() -> spaSessionService.confirmReservation(req2, 1));
                assertNotNull(dto2);
                assertEquals(SpaSessionStatus.SCHEDULED, dto2.getSessionStatus());
        }

        @Test
        @DisplayName("9. NO_SHOW session does not block subsequent sessions or buffer: ACCEPT")
        public void testNoShowSessionDoesNotBlockSlotOrBuffer() {
                LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);
                LocalDateTime end = start.plusMinutes(60);

                ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start, end, 101, "Booking for no-show");
                SpaSessionDto session1 = spaSessionService.confirmReservation(req1, 1);

                // Record NO_SHOW outcome by therapist (therapist user ID = 101)
                spaSessionService.recordSessionOutcome(session1.getSpaSessionId(), 101, "NO_SHOW", "Customer absent");

                // Subsequent session at 10:00 (back-to-back with no-show session)
                ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                end, end.plusMinutes(60), 101, "Booking following NO_SHOW");

                // NO_SHOW does not hold buffer for future bookings
                SpaSessionDto dto2 = assertDoesNotThrow(() -> spaSessionService.confirmReservation(req2, 1));
                assertNotNull(dto2);
                assertEquals(SpaSessionStatus.SCHEDULED, dto2.getSessionStatus());
        }

        @Test
        @DisplayName("10. COMPLETED session enforces 15-minute buffer: REJECT within 15m")
        public void testCompletedSessionEnforcesBuffer() {
                LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);
                LocalDateTime end = start.plusMinutes(60); // 10:00

                ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start, end, 101, "Booking for completion");
                SpaSessionDto session1 = spaSessionService.confirmReservation(req1, 1);

                // Therapist marks COMPLETED
                spaSessionService.recordSessionOutcome(session1.getSpaSessionId(), 101, "COMPLETED",
                                "Treatment completed successfully");

                // Booking 2 at 10:05 (only 5m after completion) with same therapist -> REJECT
                ConfirmReservationRequest reqConflict = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room2.getRoomId(),
                                end.plusMinutes(5), end.plusMinutes(65), 101, "Attempting booking 5m after completion");
                assertThrows(ConflictException.class, () -> spaSessionService.confirmReservation(reqConflict, 1));

                // Booking 3 at 10:15 (exact 15m after completion) with same therapist -> ACCEPT
                ConfirmReservationRequest reqValid = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room2.getRoomId(),
                                end.plusMinutes(15), end.plusMinutes(75), 101, "Booking 15m after completion");
                SpaSessionDto dtoValid = assertDoesNotThrow(() -> spaSessionService.confirmReservation(reqValid, 1));
                assertNotNull(dtoValid);
        }

        @Test
        @DisplayName("11. Rescheduling excludes own session from conflict check: ACCEPT")
        public void testRescheduleExcludesOwnSession() {
                LocalDateTime start = LocalDateTime.of(2026, 9, 26, 9, 0);
                LocalDateTime end = start.plusMinutes(60); // 10:00

                ConfirmReservationRequest reqInitial = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start, end, 101, "Initial Booking");
                SpaSessionDto initial = spaSessionService.confirmReservation(reqInitial, 1);

                // Reschedule to slight shift: 09:15 - 10:15 (overlaps with original 09:00 -
                // 10:00)
                LocalDateTime newStart = start.plusMinutes(15);
                LocalDateTime newEnd = newStart.plusMinutes(60);

                ConfirmReservationRequest reqReschedule = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                newStart, newEnd, 101, "Reschedule Shift");
                reqReschedule.setRescheduleSessionId(initial.getSpaSessionId());

                SpaSessionDto rescheduled = assertDoesNotThrow(
                                () -> spaSessionService.confirmReservation(reqReschedule, 1));
                assertNotNull(rescheduled);
                assertEquals(initial.getSpaSessionId(), rescheduled.getSpaSessionId());
                assertEquals("09:15", rescheduled.getStartTime());
                assertEquals("10:15", rescheduled.getEndTime());
        }

        @Test
        @DisplayName("12. Candidate generation excludes buffer conflicts: slot 09:00 booked, 09:30 not suggested")
        public void testCandidateGenerationExcludesBufferConflicts() {
                LocalDate testDate = LocalDate.of(2026, 9, 26);
                LocalDateTime busyStart = LocalDateTime.of(testDate, java.time.LocalTime.of(9, 0));
                LocalDateTime busyEnd = busyStart.plusMinutes(60); // 10:00

                // Book T1 and R1 from 09:00 to 10:00
                ConfirmReservationRequest req = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                busyStart, busyEnd, 101, "Morning session");
                spaSessionService.confirmReservation(req, 1);

                // Query candidates for MORNING (treatment duration 60m)
                // With only therapist1 and room1 available:
                // Slot 09:00 is busy (direct overlap).
                // Slot 09:30 (09:30-10:30) conflicts with 09:00-10:00 within 15m buffer.
                // Slot 10:00 (10:00-11:00) is back-to-back (0m buffer) -> conflicts!
                // Next available slot should be 10:30 (since slots step by 30m: 09:00, 09:30,
                // 10:00, 10:30).
                therapist2.setTherapistStatus(TherapistStatus.SUSPENDED);
                therapistRepository.save(therapist2);
                room2.setRoomStatus(TreatmentRoomStatus.MAINTENANCE);
                roomRepository.save(room2);

                GenerateCandidatesRequest genReq = new GenerateCandidatesRequest(
                                treatment.getTreatmentId(), testDate, "MORNING", 0);
                CandidateGenerationResultDto candidatesResult = schedulingEngineService.generateCandidates(genReq);
                assertNotNull(candidatesResult);

                // Assert 09:00, 09:30, and 10:00 are NOT in generated candidate start times for
                // therapist1/room1
                boolean has0900 = candidatesResult.getCandidates().stream()
                                .anyMatch(c -> c.getStartTime().equals("09:00"));
                boolean has0930 = candidatesResult.getCandidates().stream()
                                .anyMatch(c -> c.getStartTime().equals("09:30"));
                boolean has1000 = candidatesResult.getCandidates().stream()
                                .anyMatch(c -> c.getStartTime().equals("10:00"));

                assertFalse(has0900, "09:00 slot must be excluded (direct overlap)");
                assertFalse(has0930, "09:30 slot must be excluded (buffer overlap)");
                assertFalse(has1000, "10:00 slot must be excluded (0m turnaround buffer conflict)");
        }

        @Test
        @DisplayName("13. Recovery revalidates replacement resources with 15-minute buffer")
        public void testRecoveryRevalidatesReplacementWithBuffer() {
                LocalDateTime start = LocalDateTime.of(2026, 9, 26, 14, 0);
                LocalDateTime end = start.plusMinutes(60); // 15:00

                // Session needing recovery assigned to Therapist 1 in Room 1
                ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                                start, end, 101, "Session for recovery");
                SpaSessionDto session1 = spaSessionService.confirmReservation(req1, 1);

                // Therapist 2 is busy on adjacent slot 15:05 to 16:05 (only 5m buffer after
                // 15:00)
                ConfirmReservationRequest reqT2Busy = new ConfirmReservationRequest(
                                treatment.getTreatmentId(), therapist2.getTherapistId(), room2.getRoomId(),
                                end.plusMinutes(5), end.plusMinutes(65), 101, "T2 busy with 5m buffer");
                spaSessionService.confirmReservation(reqT2Busy, 1);

                // Suspend Therapist 1 -> triggers recovery for Session 1
                therapist1.setTherapistStatus(TherapistStatus.SUSPENDED);
                therapistRepository.save(therapist1);

                // Recovery attempt: Therapist 2 cannot be assigned at 14:00-15:00 because
                // Therapist 2 is booked at 15:05 (violates 15m buffer!)
                RecoveryResultDto result = sessionRecoveryService.attemptSameTimeRecovery(session1.getSpaSessionId(),
                                false);

                assertNotNull(result);
                assertFalse(result.isPreservedSameTime(),
                                "Same-time recovery must NOT assign Therapist 2 who has <15m buffer!");
                assertTrue(result.isRequiresCustomerConsent(),
                                "Must require customer consent for rescheduling when no conflict-free therapist exists!");
        }
}
