package com.heavenstay.hswrms.m3spa;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m1identity.entity.*;
import com.heavenstay.hswrms.m1identity.repository.*;
import com.heavenstay.hswrms.m1identity.service.ConsentService;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m3spa.dto.response.TherapistSessionDetailDto;
import com.heavenstay.hswrms.m3spa.entity.*;
import com.heavenstay.hswrms.m3spa.entity.enums.*;
import com.heavenstay.hswrms.m3spa.port.DefaultTherapistHealthProjectionAdapter;
import com.heavenstay.hswrms.m3spa.port.TreatmentSafetyNotesDto;
import com.heavenstay.hswrms.m3spa.repository.*;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class TherapistHealthProjectionConsentTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private ConsentRecordRepository consentRecordRepository;

    @Autowired
    private HealthProfileRepository healthProfileRepository;

    @Autowired
    private RetreatBookingRepository retreatBookingRepository;

    @Autowired
    private RetreatPackageRepository retreatPackageRepository;

    @Autowired
    private VillaCategoryRepository villaCategoryRepository;

    @Autowired
    private TherapistRepository therapistRepository;

    @Autowired
    private TreatmentRoomRepository treatmentRoomRepository;

    @Autowired
    private SpaTreatmentRepository spaTreatmentRepository;

    @Autowired
    private SpaSessionRepository spaSessionRepository;

    @Autowired
    private TherapistTreatmentQualificationRepository qualificationRepository;

    @Autowired
    private DefaultTherapistHealthProjectionAdapter healthProjectionAdapter;

    @Autowired
    private SpaSessionService spaSessionService;

    private User customerUser;
    private CustomerProfile customerProfile;
    private RetreatBooking booking;
    private User therapistUser1;
    private Therapist therapist1;
    private User therapistUser2;
    private Therapist therapist2;
    private SpaTreatment treatment;
    private TreatmentRoom room;
    private SpaSession session;

    @BeforeEach
    public void setUp() {
        spaSessionRepository.deleteAll();
        qualificationRepository.deleteAll();
        therapistRepository.deleteAll();
        healthProfileRepository.deleteAll();
        consentRecordRepository.deleteAll();

        // 1. Create Customer and Profile
        customerUser = new User();
        customerUser.setEmail("linh." + System.currentTimeMillis() + "@heavenstay.test");
        customerUser.setFullName("Linh Nguyen");
        customerUser.setPasswordHash("hashed_pw");
        customerUser.setAccountStatus("ACTIVE");
        customerUser = userRepository.saveAndFlush(customerUser);

        customerProfile = new CustomerProfile(customerUser);
        customerProfile = customerProfileRepository.saveAndFlush(customerProfile);

        // 2. Create or reuse Retreat Booking
        RetreatPackage pkg = retreatPackageRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    RetreatPackage p = new RetreatPackage();
                    p.setPackageCode("PKG-TEST-" + System.nanoTime());
                    p.setPackageName("Wellness Detox 3D2N");
                    p.setDurationNights(2);
                    p.setBasePrice(new BigDecimal("10000000.00"));
                    return retreatPackageRepository.saveAndFlush(p);
                });

        VillaCategory villaCat = villaCategoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    VillaCategory c = new VillaCategory();
                    c.setCategoryName("Garden Villa Suite " + System.nanoTime());
                    c.setMaxOccupancy(2);
                    return villaCategoryRepository.saveAndFlush(c);
                });

        booking = new RetreatBooking();
        booking.setCustomerProfileId(customerProfile.getCustomerProfileId());
        booking.setRetreatPackage(pkg);
        booking.setRequestedVillaCategory(villaCat);
        booking.setCheckInDate(LocalDate.now().minusDays(1));
        booking.setCheckOutDate(LocalDate.now().plusDays(5));
        booking.setBookingStatus("CHECKED_IN");
        booking.setDepositAmount(BigDecimal.ZERO);
        booking.setTotalEstimatedAmount(new BigDecimal("10000000.00"));
        booking = retreatBookingRepository.saveAndFlush(booking);

        // 3. Create Therapists
        therapistUser1 = new User();
        therapistUser1.setEmail("ther1." + System.currentTimeMillis() + "@heavenstay.test");
        therapistUser1.setFullName("Tran Therapist One");
        therapistUser1.setPasswordHash("hashed_pw");
        therapistUser1.setAccountStatus("ACTIVE");
        therapistUser1 = userRepository.saveAndFlush(therapistUser1);

        therapist1 = new Therapist(therapistUser1.getUserId(), TherapistStatus.ACTIVE);
        therapist1.setDisplayName("Therapist Tran");
        therapist1 = therapistRepository.saveAndFlush(therapist1);

        therapistUser2 = new User();
        therapistUser2.setEmail("ther2." + System.currentTimeMillis() + "@heavenstay.test");
        therapistUser2.setFullName("Le Therapist Two");
        therapistUser2.setPasswordHash("hashed_pw");
        therapistUser2.setAccountStatus("ACTIVE");
        therapistUser2 = userRepository.saveAndFlush(therapistUser2);

        therapist2 = new Therapist(therapistUser2.getUserId(), TherapistStatus.ACTIVE);
        therapist2.setDisplayName("Therapist Le");
        therapist2 = therapistRepository.saveAndFlush(therapist2);

        // 4. Treatment and Room
        treatment = spaTreatmentRepository.findAll().stream().findFirst()
                .orElseGet(() -> spaTreatmentRepository.saveAndFlush(new SpaTreatment("Aroma Deep Massage " + System.nanoTime(), 60, new BigDecimal("1200000"), "Massage", "Deep relaxation")));

        room = treatmentRoomRepository.findByRoomStatus(TreatmentRoomStatus.AVAILABLE).stream().findFirst()
                .orElseGet(() -> treatmentRoomRepository.saveAndFlush(new TreatmentRoom("Lotus Suite " + System.nanoTime(), TreatmentRoomStatus.AVAILABLE)));

        // 5. Spa Session assigned to Therapist 1
        LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusMinutes(60);
        session = new SpaSession(
                booking.getRetreatBookingId(), treatment, therapist1, room,
                start, start, end, BookingSource.CUSTOMER, "Prefer light music"
        );
        session = spaSessionRepository.saveAndFlush(session);
    }

    @AfterEach
    public void tearDown() {
        spaSessionRepository.deleteAll();
        qualificationRepository.deleteAll();
        therapistRepository.deleteAll();
        healthProfileRepository.deleteAll();
        consentRecordRepository.deleteAll();
    }

    @Test
    @DisplayName("1. No consent: restricted health fields are NOT returned; returns non-sensitive first name and empty precautions")
    public void testNoConsentRestrictedHealthFieldsExcluded() {
        // Ensure no ConsentRecord exists for customer
        assertTrue(consentRecordRepository.findByUserUserIdOrderByGrantedAtDesc(customerUser.getUserId()).isEmpty());

        TreatmentSafetyNotesDto result = healthProjectionAdapter.getTreatmentSafetyNotes(booking.getRetreatBookingId());

        assertNotNull(result);
        assertEquals("Linh", result.getCustomerFirstName(), "Non-sensitive first name is returned for polite greeting");
        assertNull(result.getTreatmentSafetyNotes(), "Restricted treatment safety notes must be null without consent");
        assertNotNull(result.getRelevantPrecautions(), "Precautions must not be null (safe empty state)");
        assertTrue(result.getRelevantPrecautions().isEmpty(), "Precautions must be empty list without consent");
    }

    @Test
    @DisplayName("2. Revoked consent: restricted health fields are NOT returned after customer revokes consent")
    public void testRevokedConsentRestrictedHealthFieldsExcluded() {
        ConsentRecord revoked = new ConsentRecord(customerUser, ConsentService.HEALTH_DATA_PROCESSING, ConsentService.HEALTH_DATA_POLICY_VERSION);
        revoked.setConsentStatus("REVOKED");
        revoked.setRevokedAt(Instant.now());
        consentRecordRepository.saveAndFlush(revoked);

        // Even if HealthProfile exists, revoked consent blocks health data projection
        HealthProfile hp = new HealthProfile(customerProfile);
        hp.setTreatmentSafetyNotes("Severe chronic back injury");
        hp.setMobilityJointNotes("Do not apply direct spinal pressure");
        healthProfileRepository.saveAndFlush(hp);

        TreatmentSafetyNotesDto result = healthProjectionAdapter.getTreatmentSafetyNotes(booking.getRetreatBookingId());

        assertNotNull(result);
        assertEquals("Linh", result.getCustomerFirstName());
        assertNull(result.getTreatmentSafetyNotes(), "Treatment safety notes must be null when consent is revoked");
        assertTrue(result.getRelevantPrecautions().isEmpty(), "Precautions must be empty list when consent is revoked");
    }

    @Test
    @DisplayName("3. Expired or invalid/pending consent: restricted health fields are NOT returned")
    public void testPendingConsentRestrictedHealthFieldsExcluded() {
        ConsentRecord pending = new ConsentRecord(customerUser, ConsentService.HEALTH_DATA_PROCESSING, ConsentService.HEALTH_DATA_POLICY_VERSION);
        pending.setConsentStatus("PENDING");
        pending.setGrantedAt(null);
        consentRecordRepository.saveAndFlush(pending);

        TreatmentSafetyNotesDto result = healthProjectionAdapter.getTreatmentSafetyNotes(booking.getRetreatBookingId());

        assertNotNull(result);
        assertEquals("Linh", result.getCustomerFirstName());
        assertNull(result.getTreatmentSafetyNotes());
        assertTrue(result.getRelevantPrecautions().isEmpty());
    }

    @Test
    @DisplayName("4. Active consent with no HealthProfile: returns non-sensitive first name, null notes, and empty precautions")
    public void testActiveConsentWithNoHealthProfile() {
        ConsentRecord active = new ConsentRecord(customerUser, ConsentService.HEALTH_DATA_PROCESSING, ConsentService.HEALTH_DATA_POLICY_VERSION);
        active.setConsentStatus("GRANTED");
        consentRecordRepository.saveAndFlush(active);

        // Ensure no HealthProfile
        assertTrue(healthProfileRepository.findByCustomerProfileId(customerProfile.getCustomerProfileId()).isEmpty());

        TreatmentSafetyNotesDto result = healthProjectionAdapter.getTreatmentSafetyNotes(booking.getRetreatBookingId());

        assertNotNull(result);
        assertEquals("Linh", result.getCustomerFirstName());
        assertNull(result.getTreatmentSafetyNotes(), "Notes must be null when HealthProfile is absent");
        assertNotNull(result.getRelevantPrecautions());
        assertTrue(result.getRelevantPrecautions().isEmpty());
    }

    @Test
    @DisplayName("5. Active consent with populated relevant safety notes: returns treatmentSafetyNotes successfully")
    public void testActiveConsentWithPopulatedSafetyNotes() {
        ConsentRecord active = new ConsentRecord(customerUser, ConsentService.HEALTH_DATA_PROCESSING, ConsentService.HEALTH_DATA_POLICY_VERSION);
        active.setConsentStatus("GRANTED");
        consentRecordRepository.saveAndFlush(active);

        HealthProfile hp = new HealthProfile(customerProfile);
        hp.setTreatmentSafetyNotes("Customer reports lower back stiffness. Prefers medium pressure.");
        healthProfileRepository.saveAndFlush(hp);

        TreatmentSafetyNotesDto result = healthProjectionAdapter.getTreatmentSafetyNotes(booking.getRetreatBookingId());

        assertNotNull(result);
        assertEquals("Linh", result.getCustomerFirstName());
        assertEquals("Customer reports lower back stiffness. Prefers medium pressure.", result.getTreatmentSafetyNotes());
        assertNotNull(result.getRelevantPrecautions());
        assertTrue(result.getRelevantPrecautions().isEmpty(), "Precautions empty when mobilityJointNotes not provided");
    }

    @Test
    @DisplayName("6. Active consent with populated precautions: parses and returns structured precaution list")
    public void testActiveConsentWithPopulatedPrecautions() {
        ConsentRecord active = new ConsentRecord(customerUser, ConsentService.HEALTH_DATA_PROCESSING, ConsentService.HEALTH_DATA_POLICY_VERSION);
        active.setConsentStatus("GRANTED");
        consentRecordRepository.saveAndFlush(active);

        HealthProfile hp = new HealthProfile(customerProfile);
        hp.setTreatmentSafetyNotes("Recent muscle strain in left rotator cuff");
        hp.setMobilityJointNotes("Avoid aggressive lumbar hyperextension; Provide knee bolster; Gentle left shoulder rotation");
        healthProfileRepository.saveAndFlush(hp);

        TreatmentSafetyNotesDto result = healthProjectionAdapter.getTreatmentSafetyNotes(booking.getRetreatBookingId());

        assertNotNull(result);
        assertEquals("Linh", result.getCustomerFirstName());
        assertEquals("Recent muscle strain in left rotator cuff", result.getTreatmentSafetyNotes());
        assertEquals("Avoid aggressive lumbar hyperextension; Provide knee bolster; Gentle left shoulder rotation", result.getMobilityJointNotes());
        assertNotNull(result.getRelevantPrecautions());
        assertEquals(3, result.getRelevantPrecautions().size());
        assertEquals("Avoid aggressive lumbar hyperextension", result.getRelevantPrecautions().get(0));
        assertEquals("Provide knee bolster", result.getRelevantPrecautions().get(1));
        assertEquals("Gentle left shoulder rotation", result.getRelevantPrecautions().get(2));
    }

    @Test
    @DisplayName("7. Optional health fields absent: active consent but empty/whitespace notes returns null notes and empty precautions")
    public void testActiveConsentWithOptionalFieldsAbsent() {
        ConsentRecord active = new ConsentRecord(customerUser, ConsentService.HEALTH_DATA_PROCESSING, ConsentService.HEALTH_DATA_POLICY_VERSION);
        active.setConsentStatus("GRANTED");
        consentRecordRepository.saveAndFlush(active);

        HealthProfile hp = new HealthProfile(customerProfile);
        hp.setTreatmentSafetyNotes("   ");
        hp.setMobilityJointNotes("");
        healthProfileRepository.saveAndFlush(hp);

        TreatmentSafetyNotesDto result = healthProjectionAdapter.getTreatmentSafetyNotes(booking.getRetreatBookingId());

        assertNotNull(result);
        assertEquals("Linh", result.getCustomerFirstName());
        assertNull(result.getTreatmentSafetyNotes(), "Whitespace notes must normalize to null");
        assertTrue(result.getRelevantPrecautions().isEmpty(), "Empty precautions must normalize to empty list");
    }

    @Test
    @DisplayName("8. Customer A cannot access Customer B's health projection or stay details")
    public void testCustomerIsolationEnforced() {
        // Customer 2 attempts to access session assigned to booking 1
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                spaSessionService.getCustomerSessionById(session.getSpaSessionId(), 9999)
        );
        assertTrue(ex.getMessage().contains("Unauthorized") || ex.getMessage().contains("does not belong"));
    }

    @Test
    @DisplayName("9. Unauthorized Therapist cannot access another Therapist's session detail")
    public void testUnauthorizedTherapistCannotAccessSession() {
        // session is assigned to therapist1 (therapistUser1). therapistUser2 attempts access:
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                spaSessionService.getTherapistSessionDetail(session.getSpaSessionId(), therapistUser2.getUserId())
        );
        assertTrue(ex.getMessage().contains("not authorized to access sessions assigned to another therapist"));
    }

    @Test
    @DisplayName("10. Receptionist/Customer authorization boundary: Customer cannot access therapist session detail endpoint")
    @WithMockUser(username = "customer", roles = {"CUSTOMER"})
    public void testCustomerCannotAccessTherapistSessionDetailEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/therapist/sessions/" + session.getSpaSessionId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("10b. Receptionist cannot access therapist session detail endpoint (data minimization rule 9)")
    @WithMockUser(username = "receptionist", roles = {"RECEPTIONIST"})
    public void testReceptionistCannotAccessTherapistSessionDetailEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/therapist/sessions/" + session.getSpaSessionId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("10c. Manager cannot access therapist session detail endpoint (Point A - least privilege & data minimization)")
    @WithMockUser(username = "manager", roles = {"MANAGER"})
    public void testManagerCannotAccessTherapistSessionDetailEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/therapist/sessions/" + session.getSpaSessionId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("10d. Admin cannot access therapist session detail endpoint (Point A - least privilege & data minimization)")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testAdminCannotAccessTherapistSessionDetailEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/therapist/sessions/" + session.getSpaSessionId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("10e. Manager can still perform legitimate operational therapist status updates (Point A)")
    @WithMockUser(username = "manager", roles = {"MANAGER"})
    public void testManagerCanUpdateTherapistOperationalStatus() throws Exception {
        mockMvc.perform(patch("/api/v1/therapist/" + therapist1.getTherapistId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\",\"reason\":\"Manager operational review\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("10f. Admin can still perform legitimate operational therapist status updates (Point A)")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testAdminCanUpdateTherapistOperationalStatus() throws Exception {
        mockMvc.perform(patch("/api/v1/therapist/" + therapist1.getTherapistId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\",\"reason\":\"Admin operational review\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("11. DTO serialization does not expose fields outside the approved projection")
    public void testDtoSerializationDataMinimization() throws Exception {
        TherapistSessionDetailDto dto = new TherapistSessionDetailDto();
        dto.setSpaSessionId(101L);
        dto.setTreatmentName("Swedish Massage");
        dto.setDurationMinutes(60);
        dto.setScheduledStartAt(LocalDateTime.of(2026, 11, 10, 10, 0));
        dto.setScheduledEndAt(LocalDateTime.of(2026, 11, 10, 11, 0));
        dto.setRoomName("Bamboo Suite");
        dto.setCustomerFirstName("Linh");
        dto.setTreatmentSafetyNotes("Reports lower back sensitivity");
        dto.setMobilityJointNotes("Avoid heavy pressure on lumbar region; Use bolster");
        dto.setRelevantPrecautions(List.of("Avoid heavy pressure on lumbar region", "Use bolster"));
        dto.setSessionStatus(SpaSessionStatus.SCHEDULED);
        dto.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);
        dto.setCustomerNote("Prefers lavender scent");

        String json = objectMapper.writeValueAsString(dto);
        JsonNode node = objectMapper.readTree(json);

        // Permitted fields present
        assertTrue(node.has("spaSessionId"));
        assertTrue(node.has("treatmentName"));
        assertTrue(node.has("roomName"));
        assertTrue(node.has("customerFirstName"));
        assertTrue(node.has("treatmentSafetyNotes"));
        assertTrue(node.has("mobilityJointNotes"));
        assertTrue(node.has("relevantPrecautions"));
        assertTrue(node.get("relevantPrecautions").isArray(), "relevantPrecautions must serialize as a JSON array");
        assertEquals(2, node.get("relevantPrecautions").size());

        // Strictly forbidden fields must NOT be present
        assertFalse(node.has("customerLastName"), "Full name / last name must not be exposed");
        assertFalse(node.has("customerFullName"), "Full name must not be exposed");
        assertFalse(node.has("email"), "Customer email must not be exposed to therapist");
        assertFalse(node.has("allergies"), "General allergies must not be exposed");
        assertFalse(node.has("foodAllergies"), "Food allergies must not be exposed to therapist");
        assertFalse(node.has("dietaryRequirements"), "Dietary requirements must not be exposed to therapist");
        assertFalse(node.has("totalPrice"), "Financial info must not be exposed to therapist");
        assertFalse(node.has("folioBalance"), "Folio balances must not be exposed to therapist");
        assertFalse(node.has("currentMedications"), "Medical prescriptions must not be exposed to therapist");
        assertFalse(node.has("stressFatigueLevel"), "Internal wellness survey ratings must not be exposed");
    }
}
