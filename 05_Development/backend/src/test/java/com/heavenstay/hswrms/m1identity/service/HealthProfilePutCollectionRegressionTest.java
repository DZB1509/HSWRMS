package com.heavenstay.hswrms.m1identity.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.heavenstay.hswrms.m1identity.dto.UpdateHealthProfileRequest;
import com.heavenstay.hswrms.m1identity.entity.ConsentRecord;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.DietaryRequirement;
import com.heavenstay.hswrms.m1identity.entity.FoodAllergy;
import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthProfileTherapyPreference;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.ConsentRecordRepository;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regression for the PUT /customers/me/health-profile HibernateException:
 * "A collection with cascade=all-delete-orphan was no longer referenced".
 * Runs the real service PUT path with a real H2 transaction and flush.
 */
@SpringBootTest
@Transactional
class HealthProfilePutCollectionRegressionTest {

    @Autowired private HealthProfileService healthProfileService;
    @Autowired private UserRepository userRepository;
    @Autowired private CustomerProfileRepository customerProfileRepository;
    @Autowired private ConsentRecordRepository consentRecordRepository;
    @Autowired private HealthProfileRepository healthProfileRepository;
    @Autowired private EntityManager em;

    private Integer newUserWithActiveConsent() {
        User u = new User();
        u.setEmail("regress." + System.nanoTime() + "@heavenstay.test");
        u.setFullName("Regression Tester");
        u.setPasswordHash("hashed_pw");
        u.setAccountStatus("ACTIVE");
        u = userRepository.saveAndFlush(u);
        customerProfileRepository.saveAndFlush(new CustomerProfile(u));
        consentRecordRepository.saveAndFlush(new ConsentRecord(u, "HEALTH_DATA_PROCESSING", "v1.2"));
        return u.getUserId();
    }

    private UpdateHealthProfileRequest req(List<String> allergies, List<String> dietary, List<String> therapies) {
        UpdateHealthProfileRequest r = new UpdateHealthProfileRequest();
        r.setFoodAllergies(allergies);
        r.setDietaryRequirements(dietary);
        r.setTherapyPreferences(therapies);
        return r;
    }

    private HealthProfile load(Integer userId) {
        Integer cpId = customerProfileRepository.findByUserId(userId).orElseThrow().getCustomerProfileId();
        return healthProfileRepository.findByCustomerProfileId(cpId).orElseThrow();
    }

    @Test
    @DisplayName("PUT A: replacing populated collections flushes without HibernateException")
    void put_replaceCollections_flushesCleanly() {
        Integer uid = newUserWithActiveConsent();
        assertDoesNotThrow(() -> {
            healthProfileService.updateMyHealthProfile(uid, req(List.of("Peanuts", "Shellfish"), List.of("Vegan"), List.of("Aromatherapy")));
            em.flush();
            healthProfileService.updateMyHealthProfile(uid, req(List.of("Dust"), List.of("Keto"), List.of("Swedish")));
            em.flush();
        });
        HealthProfile hp = load(uid);
        assertEquals(List.of("Dust"), hp.getFoodAllergies().stream().map(FoodAllergy::getAllergenName).toList());
        assertEquals(List.of("Keto"), hp.getDietaryRequirementsList().stream().map(DietaryRequirement::getRequirementName).toList());
        assertEquals(List.of("Swedish"), hp.getTherapyPreferences().stream().map(HealthProfileTherapyPreference::getPreferenceLabel).toList());
    }

    @Test
    @DisplayName("PUT B: clearing collections removes orphans and flushes cleanly")
    void put_clearCollections_flushesCleanly() {
        Integer uid = newUserWithActiveConsent();
        assertDoesNotThrow(() -> {
            healthProfileService.updateMyHealthProfile(uid, req(List.of("Peanuts"), List.of("Vegan"), List.of("Aromatherapy")));
            em.flush();
            healthProfileService.updateMyHealthProfile(uid, req(List.of(), List.of(), List.of()));
            em.flush();
        });
        HealthProfile hp = load(uid);
        assertTrue(hp.getFoodAllergies().isEmpty());
        assertTrue(hp.getDietaryRequirementsList().isEmpty());
        assertTrue(hp.getTherapyPreferences().isEmpty());
    }

    @Test
    @DisplayName("PUT C: new items persist linked to the owning HealthProfile")
    void put_addNewItems_linksOwners() {
        Integer uid = newUserWithActiveConsent();
        healthProfileService.updateMyHealthProfile(uid, req(List.of("Peanuts"), List.of(), List.of()));
        em.flush();
        healthProfileService.updateMyHealthProfile(uid, req(List.of("Peanuts", "Soy"), List.of("Halal"), List.of("Hot Stone")));
        em.flush();
        em.clear();
        HealthProfile hp = load(uid);
        assertEquals(2, hp.getFoodAllergies().size());
        for (FoodAllergy a : hp.getFoodAllergies()) {
            assertEquals(hp.getHealthProfileId(), a.getHealthProfile().getHealthProfileId());
        }
        assertEquals(1, hp.getDietaryRequirementsList().size());
        assertEquals(1, hp.getTherapyPreferences().size());
    }

    @Test
    @DisplayName("PUT D: repeated collection updates in one transaction flush cleanly")
    void put_repeatedUpdates_flushCleanly() {
        Integer uid = newUserWithActiveConsent();
        assertDoesNotThrow(() -> {
            healthProfileService.updateMyHealthProfile(uid, req(List.of("A"), List.of("V1"), List.of("T1")));
            healthProfileService.updateMyHealthProfile(uid, req(List.of("A", "B"), List.of("V1", "V2"), List.of()));
            healthProfileService.updateMyHealthProfile(uid, req(List.of(), List.of("V3"), List.of("T3")));
            em.flush();
        });
        HealthProfile hp = load(uid);
        assertTrue(hp.getFoodAllergies().isEmpty());
        assertEquals(List.of("V3"), hp.getDietaryRequirementsList().stream().map(DietaryRequirement::getRequirementName).toList());
    }
}

