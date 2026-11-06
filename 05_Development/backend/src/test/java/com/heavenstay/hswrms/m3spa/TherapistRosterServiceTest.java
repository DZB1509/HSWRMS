package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m3spa.dto.response.TherapistRosterDto;
import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.Therapist;
import com.heavenstay.hswrms.m3spa.entity.TherapistTreatmentQualification;
import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentStatus;
import com.heavenstay.hswrms.m3spa.repository.SpaTreatmentRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistTreatmentQualificationRepository;
import com.heavenstay.hswrms.m3spa.service.TherapistStatusService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Import(SpaTestConfig.class)
@Transactional
public class TherapistRosterServiceTest {

    @Autowired
    private TherapistStatusService therapistStatusService;

    @Autowired
    private TherapistRepository therapistRepository;

    @Autowired
    private TherapistTreatmentQualificationRepository qualificationRepository;

    @Autowired
    private SpaTreatmentRepository treatmentRepository;

    @Autowired
    private UserRepository userRepository;

    private User user1;
    private User user2;
    private SpaTreatment treatment1;
    private SpaTreatment treatment2;

    @BeforeEach
    void setUp() {
        qualificationRepository.deleteAll();
        therapistRepository.deleteAll();

        // Create test users
        user1 = new User();
        user1.setFullName("Ananya Sharma");
        user1.setEmail("ananya.sharma@heavenstay.com");
        user1.setPasswordHash("hashed-pw-secret");
        user1.setPhoneNumber("+84901234567");
        user1 = userRepository.save(user1);

        user2 = new User();
        user2.setFullName("Master Administrator");
        user2.setEmail("admin@heavenstay.com");
        user2.setPasswordHash("hashed-pw-admin");
        user2.setPhoneNumber("+84909999999");
        user2 = userRepository.save(user2);

        // Create treatments with qualifications
        treatment1 = new SpaTreatment("Himalayan Hot Stone", 60, BigDecimal.valueOf(1200000), TreatmentStatus.ACTIVE);
        treatment1.setTreatmentCode("SPA-MASS-01");
        treatment1.setRequiredQualificationCode("QUAL_HOT_STONE_MASSAGE");
        treatment1 = treatmentRepository.save(treatment1);

        treatment2 = new SpaTreatment("Deep Tissue Massage", 90, BigDecimal.valueOf(1500000), TreatmentStatus.ACTIVE);
        treatment2.setTreatmentCode("SPA-MASS-02");
        treatment2.setRequiredQualificationCode("QUAL_DEEP_TISSUE_TRIGGER_POINT");
        treatment2 = treatmentRepository.save(treatment2);
    }

    @Test
    @DisplayName("Roster 1. Successfully maps Therapist name, status, and qualifications from database")
    void testGetTherapistRosterMapping() {
        Therapist t1 = new Therapist(user1.getUserId(), TherapistStatus.ACTIVE);
        t1 = therapistRepository.save(t1);

        qualificationRepository.save(new TherapistTreatmentQualification(t1, treatment1));
        qualificationRepository.save(new TherapistTreatmentQualification(t1, treatment2));

        List<TherapistRosterDto> roster = therapistStatusService.getTherapistRoster();

        assertEquals(1, roster.size());
        TherapistRosterDto item = roster.get(0);
        assertEquals(t1.getTherapistId(), item.therapistId());
        assertEquals(user1.getUserId(), item.userId());
        assertEquals("Ananya Sharma", item.name());
        assertEquals(TherapistStatus.ACTIVE, item.status());
        assertTrue(item.specialty().contains("Himalayan Hot Stone"));
        assertTrue(item.specialty().contains("Deep Tissue Massage"));
        assertEquals(2, item.qualifications().size());
        assertTrue(item.qualifications().contains("QUAL_HOT_STONE_MASSAGE"));
        assertTrue(item.qualifications().contains("QUAL_DEEP_TISSUE_TRIGGER_POINT"));
    }

    @Test
    @DisplayName("Roster 2. Therapist with missing qualifications defaults gracefully without crashing")
    void testTherapistWithoutQualificationsDefaultsGracefully() {
        Therapist t2 = new Therapist(user2.getUserId(), TherapistStatus.ACTIVE);
        t2 = therapistRepository.save(t2);

        List<TherapistRosterDto> roster = therapistStatusService.getTherapistRoster();

        assertEquals(1, roster.size());
        TherapistRosterDto item = roster.get(0);
        assertEquals("Master Administrator", item.name());
        assertEquals("General Wellness & Spa Therapy", item.specialty());
        assertNotNull(item.qualifications());
        assertTrue(item.qualifications().isEmpty());
    }

    @Test
    @DisplayName("Roster 3. Inactive and Suspended therapist statuses are accurately represented")
    void testTherapistStatusRepresentation() {
        Therapist t1 = new Therapist(user1.getUserId(), TherapistStatus.SUSPENDED);
        therapistRepository.save(t1);

        Therapist t2 = new Therapist(user2.getUserId(), TherapistStatus.INACTIVE);
        therapistRepository.save(t2);

        List<TherapistRosterDto> roster = therapistStatusService.getTherapistRoster();

        assertEquals(2, roster.size());
        assertEquals(TherapistStatus.SUSPENDED, roster.get(0).status());
        assertEquals(TherapistStatus.INACTIVE, roster.get(1).status());
    }

    @Test
    @DisplayName("Roster 4. Empty therapist table returns empty list safely")
    void testEmptyRosterReturnsEmptyList() {
        List<TherapistRosterDto> roster = therapistStatusService.getTherapistRoster();
        assertNotNull(roster);
        assertTrue(roster.isEmpty());
    }

    @Test
    @DisplayName("Roster 5. Update status transitions therapist and persists change")
    void testUpdateTherapistStatusPersists() {
        Therapist t1 = new Therapist(user1.getUserId(), TherapistStatus.ACTIVE);
        t1 = therapistRepository.save(t1);

        Therapist updated = therapistStatusService.updateTherapistStatus(
                t1.getTherapistId(), TherapistStatus.SUSPENDED, "Emergency medical suspension"
        );

        assertEquals(TherapistStatus.SUSPENDED, updated.getTherapistStatus());
        Therapist reloaded = therapistRepository.findById(t1.getTherapistId()).orElseThrow();
        assertEquals(TherapistStatus.SUSPENDED, reloaded.getTherapistStatus());
    }

    @Test
    @DisplayName("Roster 6. Therapist with null password hash is fully operational in roster without credential requirements")
    void testTherapistWithNullPasswordHashIsFullyOperationalInRoster() {
        User fixtureUser = new User();
        fixtureUser.setFullName("Dev Test Specialist Chloe");
        fixtureUser.setEmail("therapist.test@heavenstay.dev");
        fixtureUser.setPasswordHash(null); // Direct password login disabled / test fixture
        fixtureUser.setPhoneNumber("+84909999003");
        fixtureUser.setAccountStatus("ACTIVE");
        fixtureUser.setEmailVerified(true);
        fixtureUser = userRepository.save(fixtureUser);

        Therapist t3 = new Therapist(fixtureUser.getUserId(), TherapistStatus.ACTIVE);
        t3 = therapistRepository.save(t3);

        qualificationRepository.save(new TherapistTreatmentQualification(t3, treatment1));
        qualificationRepository.save(new TherapistTreatmentQualification(t3, treatment2));

        List<TherapistRosterDto> roster = therapistStatusService.getTherapistRoster();

        assertEquals(1, roster.size());
        TherapistRosterDto item = roster.get(0);
        assertEquals(t3.getTherapistId(), item.therapistId());
        assertEquals(fixtureUser.getUserId(), item.userId());
        assertEquals("Dev Test Specialist Chloe", item.name());
        assertEquals(TherapistStatus.ACTIVE, item.status());
        assertTrue(item.specialty().contains("Himalayan Hot Stone"));
        assertTrue(item.specialty().contains("Deep Tissue Massage"));
        assertEquals(2, item.qualifications().size());
        assertTrue(item.qualifications().contains("QUAL_HOT_STONE_MASSAGE"));
        assertTrue(item.qualifications().contains("QUAL_DEEP_TISSUE_TRIGGER_POINT"));
    }
}
