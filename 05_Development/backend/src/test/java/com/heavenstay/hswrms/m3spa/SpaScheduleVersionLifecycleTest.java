package com.heavenstay.hswrms.m3spa;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m3spa.dto.request.ConfirmReservationRequest;
import com.heavenstay.hswrms.m3spa.dto.response.RecoveryResultDto;
import com.heavenstay.hswrms.m3spa.dto.response.SpaSessionDto;
import com.heavenstay.hswrms.m3spa.dto.response.TherapistSessionDetailDto;
import com.heavenstay.hswrms.m3spa.entity.*;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentRoomStatus;
import com.heavenstay.hswrms.m3spa.repository.*;
import com.heavenstay.hswrms.m3spa.service.SessionRecoveryService;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SpaScheduleVersionLifecycleTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SpaSessionService spaSessionService;

    @Autowired
    private SessionRecoveryService sessionRecoveryService;

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
    private RetreatBookingRepository bookingRepository;

    @Autowired
    private RetreatPackageRepository packageRepository;

    @Autowired
    private VillaCategoryRepository villaCategoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    private RetreatBooking booking;
    private Therapist therapist1;
    private Therapist therapist2;
    private TreatmentRoom room1;
    private TreatmentRoom room2;
    private SpaTreatment treatment;

    @BeforeEach
    public void setUp() {
        sessionRepository.deleteAll();
        qualificationRepository.deleteAll();
        compatibilityRepository.deleteAll();
        treatmentRepository.deleteAll();
        therapistRepository.deleteAll();
        roomRepository.deleteAll();

        // 1. Reuse existing booking from database to avoid foreign key conflicts with FOLIO
        booking = bookingRepository.findAll().stream().findFirst().orElseGet(() -> {
            User u = new User();
            u.setEmail("cust.ver." + System.currentTimeMillis() + "@heavenstay.test");
            u.setPasswordHash("hashed_pw");
            u.setFullName("Linh Nguyen");
            u.setAccountStatus("ACTIVE");
            u = userRepository.saveAndFlush(u);

            CustomerProfile cp = customerProfileRepository.saveAndFlush(new CustomerProfile(u));
            RetreatPackage p = packageRepository.findAll().stream().findFirst().orElseGet(() -> {
                RetreatPackage pkg = new RetreatPackage();
                pkg.setPackageCode("PKG-VER-" + System.currentTimeMillis());
                pkg.setPackageName("Wellness Detox Test Package");
                pkg.setDurationNights(3);
                pkg.setBasePrice(new BigDecimal("10000000.00"));
                pkg.setPackageStatus(RetreatPackage.ACTIVE);
                return packageRepository.saveAndFlush(pkg);
            });
            VillaCategory vc = villaCategoryRepository.findAll().stream().findFirst().orElseGet(() -> {
                VillaCategory cat = new VillaCategory();
                cat.setCategoryName("Deluxe Pool Villa Test");
                cat.setMaxOccupancy(2);
                cat.setPriceModifier(BigDecimal.ZERO);
                cat.setCategoryStatus(VillaCategory.ACTIVE);
                cat.setInventoryCount(5);
                cat.setBedroomCount(1);
                cat.setHasPrivatePool(true);
                return villaCategoryRepository.saveAndFlush(cat);
            });

            RetreatBooking b = new RetreatBooking();
            b.setCustomerProfileId(cp.getCustomerProfileId());
            b.setRetreatPackage(p);
            b.setRequestedVillaCategory(vc);
            b.setCheckInDate(LocalDate.now().minusDays(1));
            b.setCheckOutDate(LocalDate.now().plusDays(5));
            b.setBookingStatus("CHECKED_IN");
            b.setDepositAmount(BigDecimal.ZERO);
            b.setTotalEstimatedAmount(new BigDecimal("15000000.00"));
            return bookingRepository.saveAndFlush(b);
        });

        // 2. Treatment
        treatment = new SpaTreatment("Herbal Detox Massage", 60, new BigDecimal("1200000"), "Massage", "Detox body massage");
        treatment = treatmentRepository.saveAndFlush(treatment);

        // 3. Therapists (User ID 101 and 102)
        therapist1 = new Therapist(101, TherapistStatus.ACTIVE);
        therapist1.setDisplayName("Therapist Alpha");
        therapist1 = therapistRepository.saveAndFlush(therapist1);

        therapist2 = new Therapist(102, TherapistStatus.ACTIVE);
        therapist2.setDisplayName("Therapist Beta");
        therapist2 = therapistRepository.saveAndFlush(therapist2);

        // 4. Rooms
        room1 = new TreatmentRoom("Lotus Suite", TreatmentRoomStatus.AVAILABLE);
        room1 = roomRepository.saveAndFlush(room1);

        room2 = new TreatmentRoom("Orchid Suite", TreatmentRoomStatus.AVAILABLE);
        room2 = roomRepository.saveAndFlush(room2);

        // 5. Qualifications & Compatibility
        qualificationRepository.saveAndFlush(new TherapistTreatmentQualification(therapist1, treatment));
        qualificationRepository.saveAndFlush(new TherapistTreatmentQualification(therapist2, treatment));
        compatibilityRepository.saveAndFlush(new TreatmentRoomCompatibility(room1, treatment));
        compatibilityRepository.saveAndFlush(new TreatmentRoomCompatibility(room2, treatment));
    }

    @Test
    @DisplayName("1. Initial booking initializes scheduleVersion to 1 in SpaSessionDto and persistence")
    public void testInitialBookingInitializesScheduleVersionToOne() {
        LocalDateTime start = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                start, end, booking.getRetreatBookingId(), "Initial booking note"
        );

        SpaSessionDto dto = spaSessionService.confirmReservation(req, 1, true);

        assertNotNull(dto);
        assertNotNull(dto.getScheduleVersion(), "scheduleVersion must not be null in SpaSessionDto");
        assertEquals(1, dto.getScheduleVersion(), "Newly created session must have scheduleVersion = 1");

        SpaSession persisted = sessionRepository.findById(dto.getSpaSessionId()).orElseThrow();
        assertEquals(1, persisted.getScheduleVersion(), "Persisted entity must have schedule_version = 1");
    }

    @Test
    @DisplayName("2. Customer reschedule increments scheduleVersion to 2")
    public void testCustomerRescheduleIncrementsScheduleVersion() {
        LocalDateTime start1 = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime end1 = start1.plusMinutes(60);

        ConfirmReservationRequest req1 = new ConfirmReservationRequest(
                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                start1, end1, booking.getRetreatBookingId(), "Initial booking"
        );
        SpaSessionDto initialDto = spaSessionService.confirmReservation(req1, 1, true);
        assertEquals(1, initialDto.getScheduleVersion());

        // Reschedule to a new time slot
        LocalDateTime start2 = LocalDateTime.of(2026, 11, 20, 14, 0);
        LocalDateTime end2 = start2.plusMinutes(60);

        ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                start2, end2, booking.getRetreatBookingId(), "Rescheduled slot"
        );
        req2.setRescheduleSessionId(initialDto.getSpaSessionId());

        SpaSessionDto rescheduledDto = spaSessionService.confirmReservation(req2, 1, true);

        assertNotNull(rescheduledDto);
        assertEquals(initialDto.getSpaSessionId(), rescheduledDto.getSpaSessionId());
        assertEquals(2, rescheduledDto.getScheduleVersion(), "Rescheduled session must increment scheduleVersion to 2");

        SpaSession persisted = sessionRepository.findById(rescheduledDto.getSpaSessionId()).orElseThrow();
        assertEquals(2, persisted.getScheduleVersion(), "Persisted entity must have schedule_version = 2 after reschedule");
    }

    @Test
    @DisplayName("3. Same-time recovery increments scheduleVersion from 1 to 2")
    public void testSameTimeRecoveryIncrementsScheduleVersion() {
        LocalDateTime start = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                start, end, booking.getRetreatBookingId(), "Session needing recovery"
        );
        SpaSessionDto initialDto = spaSessionService.confirmReservation(req, 1, true);
        assertEquals(1, initialDto.getScheduleVersion());

        // Suspend original therapist so recovery must reassign to therapist2
        therapist1.setTherapistStatus(TherapistStatus.SUSPENDED);
        therapistRepository.saveAndFlush(therapist1);

        RecoveryResultDto recResult = sessionRecoveryService.attemptSameTimeRecovery(initialDto.getSpaSessionId());
        assertTrue(recResult.isRecovered(), "Recovery should succeed with therapist2");
        assertTrue(recResult.isPreservedSameTime(), "Same time should be preserved");
        assertEquals(2, recResult.getScheduleVersion(), "RecoveryResultDto must report incremented scheduleVersion = 2");

        SpaSession recoveredSession = sessionRepository.findById(initialDto.getSpaSessionId()).orElseThrow();
        assertEquals(2, recoveredSession.getScheduleVersion(), "Persisted session must have scheduleVersion = 2");
        assertEquals(therapist2.getTherapistId(), recoveredSession.getTherapist().getTherapistId());

        // Verify that DTO read-back reflects version 2
        SpaSessionDto readDto = spaSessionService.getCustomerSessionById(initialDto.getSpaSessionId(), 1, true);
        assertEquals(2, readDto.getScheduleVersion(), "Read-back SpaSessionDto must reflect incremented version = 2");
    }

    @Test
    @DisplayName("4. Attendance confirmation retains original scheduleVersion without incrementing")
    public void testConfirmAttendanceDoesNotIncrementScheduleVersion() {
        LocalDateTime start = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                start, end, booking.getRetreatBookingId(), "Awaiting attendance confirmation"
        );
        SpaSessionDto initialDto = spaSessionService.confirmReservation(req, 1, true);
        assertEquals(1, initialDto.getScheduleVersion());

        SpaSessionDto confirmedDto = spaSessionService.confirmAttendance(initialDto.getSpaSessionId(), null);

        assertNotNull(confirmedDto);
        assertEquals(SpaConfirmationStatus.CONFIRMED, confirmedDto.getConfirmationStatus());
        assertEquals(1, confirmedDto.getScheduleVersion(), "confirmAttendance must NOT increment scheduleVersion");

        SpaSession persisted = sessionRepository.findById(initialDto.getSpaSessionId()).orElseThrow();
        assertEquals(1, persisted.getScheduleVersion(), "Persisted schedule_version must remain 1");
    }

    @Test
    @DisplayName("5. Attendance decline retains original scheduleVersion without incrementing")
    public void testDeclineAttendanceDoesNotIncrementScheduleVersion() {
        LocalDateTime start = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                start, end, booking.getRetreatBookingId(), "Session to decline"
        );
        SpaSessionDto initialDto = spaSessionService.confirmReservation(req, 1, true);
        assertEquals(1, initialDto.getScheduleVersion());

        SpaSessionDto declinedDto = spaSessionService.declineAttendance(initialDto.getSpaSessionId(), null);

        assertNotNull(declinedDto);
        assertEquals(SpaConfirmationStatus.DECLINED, declinedDto.getConfirmationStatus());
        assertEquals(SpaSessionStatus.RESCHEDULING, declinedDto.getSessionStatus());
        assertEquals(1, declinedDto.getScheduleVersion(), "declineAttendance must NOT increment scheduleVersion");

        SpaSession persisted = sessionRepository.findById(initialDto.getSpaSessionId()).orElseThrow();
        assertEquals(1, persisted.getScheduleVersion(), "Persisted schedule_version must remain 1");
    }

    @Test
    @DisplayName("6. Cancellation and outcome recording retain original scheduleVersion without incrementing")
    public void testCancellationAndOutcomeDoNotIncrementScheduleVersion() {
        LocalDateTime start = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        // A. Cancellation
        ConfirmReservationRequest reqA = new ConfirmReservationRequest(
                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                start, end, booking.getRetreatBookingId(), "Session to cancel"
        );
        SpaSessionDto sessionA = spaSessionService.confirmReservation(reqA, 1, true);
        assertEquals(1, sessionA.getScheduleVersion());

        SpaSessionDto cancelledDto = spaSessionService.cancelSession(sessionA.getSpaSessionId(), null);
        assertEquals(SpaSessionStatus.CANCELLED, cancelledDto.getSessionStatus());
        assertEquals(1, cancelledDto.getScheduleVersion(), "cancelSession must NOT increment scheduleVersion");

        // B. Outcome Recording
        LocalDateTime startB = LocalDateTime.of(2026, 11, 20, 12, 0);
        LocalDateTime endB = startB.plusMinutes(60);
        ConfirmReservationRequest reqB = new ConfirmReservationRequest(
                treatment.getTreatmentId(), therapist1.getTherapistId(), room2.getRoomId(),
                startB, endB, booking.getRetreatBookingId(), "Session to complete"
        );
        SpaSessionDto sessionB = spaSessionService.confirmReservation(reqB, 1, true);
        assertEquals(1, sessionB.getScheduleVersion());

        SpaSessionDto outcomeDto = spaSessionService.recordSessionOutcome(sessionB.getSpaSessionId(), 101, "COMPLETED", "Completed nicely");
        assertEquals(SpaSessionStatus.COMPLETED, outcomeDto.getSessionStatus());
        assertEquals(1, outcomeDto.getScheduleVersion(), "recordSessionOutcome must NOT increment scheduleVersion");
    }

    @Test
    @DisplayName("7. REST API response exposes scheduleVersion across Customer and Receptionist endpoints")
    @WithMockUser(username = "receptionist", roles = {"RECEPTIONIST"})
    public void testApiResponseExposesScheduleVersionAcrossEndpoints() throws Exception {
        LocalDateTime start = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                start, end, booking.getRetreatBookingId(), "API test note"
        );
        SpaSessionDto initialDto = spaSessionService.confirmReservation(req, 1, true);

        // GET /api/v1/spa/sessions/{id}
        MvcResult getResult = mockMvc.perform(get("/api/v1/spa/sessions/" + initialDto.getSpaSessionId()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode getJson = objectMapper.readTree(getResult.getResponse().getContentAsString());
        assertTrue(getJson.get("data").has("scheduleVersion"), "GET /sessions/{id} response data must have scheduleVersion");
        assertEquals(1, getJson.get("data").get("scheduleVersion").asInt());

        // POST /api/v1/spa/sessions/{id}/confirm-attendance
        MvcResult confirmResult = mockMvc.perform(post("/api/v1/spa/sessions/" + initialDto.getSpaSessionId() + "/confirm-attendance"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode confirmJson = objectMapper.readTree(confirmResult.getResponse().getContentAsString());
        assertTrue(confirmJson.get("data").has("scheduleVersion"));
        assertEquals(1, confirmJson.get("data").get("scheduleVersion").asInt());
    }

    @Test
    @DisplayName("8. TherapistSessionDetailDto exposes scheduleVersion accurately on Therapist endpoint")
    public void testTherapistSessionDetailExposesScheduleVersion() {
        LocalDateTime start = LocalDateTime.of(2026, 11, 20, 10, 0);
        LocalDateTime end = start.plusMinutes(60);

        ConfirmReservationRequest req = new ConfirmReservationRequest(
                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                start, end, booking.getRetreatBookingId(), "Therapist detail test"
        );
        SpaSessionDto initialDto = spaSessionService.confirmReservation(req, 1, true);

        TherapistSessionDetailDto detail = spaSessionService.getTherapistSessionDetail(initialDto.getSpaSessionId(), 101);
        assertNotNull(detail);
        assertNotNull(detail.getScheduleVersion(), "TherapistSessionDetailDto must expose scheduleVersion");
        assertEquals(1, detail.getScheduleVersion());

        // Reschedule and verify detail updates to 2
        LocalDateTime start2 = LocalDateTime.of(2026, 11, 20, 14, 0);
        LocalDateTime end2 = start2.plusMinutes(60);
        ConfirmReservationRequest req2 = new ConfirmReservationRequest(
                treatment.getTreatmentId(), therapist1.getTherapistId(), room1.getRoomId(),
                start2, end2, booking.getRetreatBookingId(), "Rescheduled note"
        );
        req2.setRescheduleSessionId(initialDto.getSpaSessionId());
        spaSessionService.confirmReservation(req2, 1, true);

        TherapistSessionDetailDto updatedDetail = spaSessionService.getTherapistSessionDetail(initialDto.getSpaSessionId(), 101);
        assertEquals(2, updatedDetail.getScheduleVersion(), "TherapistSessionDetailDto must reflect incremented version = 2");
    }
}
