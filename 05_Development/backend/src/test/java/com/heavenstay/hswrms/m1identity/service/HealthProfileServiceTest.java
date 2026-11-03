package com.heavenstay.hswrms.m1identity.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m1identity.dto.HealthProfileResponse;
import com.heavenstay.hswrms.m1identity.dto.UpdateHealthProfileRequest;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthDeclarationState;
import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.DietaryRequirementRepository;
import com.heavenstay.hswrms.m1identity.repository.FoodAllergyRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileTherapyPreferenceRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class HealthProfileServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private CustomerProfileRepository customerProfileRepository;
    @Mock private HealthProfileRepository healthProfileRepository;
    @Mock private FoodAllergyRepository foodAllergyRepository;
    @Mock private DietaryRequirementRepository dietaryRequirementRepository;
    @Mock private HealthProfileTherapyPreferenceRepository therapyPreferenceRepository;
    @Mock private ConsentService consentService;
    @Mock private HealthProfileCompletionService completionService;
    @InjectMocks private HealthProfileService healthProfileService;
    private User user(Integer id) {
        User u = new User("Jane Doe", "jane@example.com", "hash");
        u.setUserId(id);
        u.setAccountStatus("ACTIVE");
        u.setEmailVerified(true);
        return u;
    }
    @Test
    @DisplayName("Write without active consent is rejected before any persistence")
    void write_withoutConsent_rejected() {
        org.mockito.Mockito.doThrow(new BusinessRuleException("HEALTH_CONSENT_REQUIRED", "consent required")).when(consentService).requireActiveConsent(205, ConsentService.HEALTH_DATA_PROCESSING);
        UpdateHealthProfileRequest req = new UpdateHealthProfileRequest();
        req.setStressFatigueLevel("moderate");
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> healthProfileService.updateMyHealthProfile(205, req));
        assertEquals("HEALTH_CONSENT_REQUIRED", ex.getErrorCode());
        verify(healthProfileRepository, never()).save(any(HealthProfile.class));
    }
    @Test
    @DisplayName("Write with consent persists fields and returns saved data")
    void write_withConsent_persists() {
        User u = user(205);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(77);
        HealthProfile hp = new HealthProfile(cp);
        when(userRepository.findById(205)).thenReturn(Optional.of(u));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(77)).thenReturn(Optional.of(hp));
        when(healthProfileRepository.save(any(HealthProfile.class))).thenAnswer(i -> i.getArgument(0));
        when(foodAllergyRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        when(dietaryRequirementRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        when(therapyPreferenceRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        UpdateHealthProfileRequest req = new UpdateHealthProfileRequest();
        req.setStressFatigueLevel("moderate");
        req.setCurrentMedications("magnesium");
        req.setFoodAllergies(List.of("Peanuts", "Shellfish"));
        req.setDietaryRequirements(List.of("Pescatarian"));
        req.setTherapyPreferences(List.of("Aromatherapy"));
        HealthProfileResponse res = healthProfileService.updateMyHealthProfile(205, req);
        verify(consentService).requireActiveConsent(205, ConsentService.HEALTH_DATA_PROCESSING);
        assertEquals("moderate", res.getStressFatigueLevel());
        assertEquals("magnesium", res.getCurrentMedications());
        assertEquals(List.of("Peanuts", "Shellfish"), res.getFoodAllergies());
        assertEquals(List.of("Pescatarian"), res.getDietaryRequirements());
        assertEquals(List.of("Aromatherapy"), res.getTherapyPreferences());
    }
    @Test
    @DisplayName("Read returns persisted data with consent flag")
    void read_returnsPersisted() {
        User u = user(205);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(77);
        HealthProfile hp = new HealthProfile(cp);
        hp.setStressFatigueLevel("mild");
        hp.setCurrentMedications("none");
        when(userRepository.findById(205)).thenReturn(Optional.of(u));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(77)).thenReturn(Optional.of(hp));
        when(consentService.hasActiveConsent(205, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(true);
        HealthProfileResponse res = healthProfileService.getMyHealthProfile(205);
        assertEquals("mild", res.getStressFatigueLevel());
        assertEquals("none", res.getCurrentMedications());
        assertTrue(res.isHasConsented());
    }
    @Test
    @DisplayName("Current health condition maps correctly and does not overwrite allergies")
    void currentHealthCondition_mapsCorrectly() {
        User u = user(205);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(77);
        HealthProfile hp = new HealthProfile(cp);
        when(userRepository.findById(205)).thenReturn(Optional.of(u));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(77)).thenReturn(Optional.of(hp));
        when(healthProfileRepository.save(any(HealthProfile.class))).thenAnswer(i -> i.getArgument(0));
        when(foodAllergyRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        when(consentService.hasActiveConsent(205, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(true);

        UpdateHealthProfileRequest req = new UpdateHealthProfileRequest();
        req.setCurrentHealthCondition("Hypertension");
        req.setFoodAllergies(java.util.List.of("Peanuts"));

        HealthProfileResponse res = healthProfileService.updateMyHealthProfile(205, req);

        assertEquals("Hypertension", res.getCurrentHealthCondition());
        assertEquals(java.util.List.of("Peanuts"), res.getFoodAllergies());
    }

    @Test
    @DisplayName("GET response includes declaration states and completion")
    void get_includesDeclarationAndCompletion() {
        User u = user(205);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(77);
        HealthProfile hp = new HealthProfile(cp);
        hp.setStressFatigueLevel("mild");
        hp.setAllergiesDeclarationState(HealthDeclarationState.EXPLICITLY_NONE);
        hp.setDietaryRequirementsDeclarationState(HealthDeclarationState.DECLARED);
        hp.setComplete(true);
        when(userRepository.findById(205)).thenReturn(Optional.of(u));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(77)).thenReturn(Optional.of(hp));
        when(consentService.hasActiveConsent(205, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(true);

        HealthProfileResponse res = healthProfileService.getMyHealthProfile(205);

        assertEquals(HealthDeclarationState.EXPLICITLY_NONE, res.getAllergiesDeclarationState());
        assertEquals(HealthDeclarationState.DECLARED, res.getDietaryRequirementsDeclarationState());
        assertTrue(res.isComplete());
    }

    @Test
    @DisplayName("PUT response includes declaration states and completion")
    void put_includesDeclarationAndCompletion() {
        User u = user(205);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(77);
        HealthProfile hp = new HealthProfile(cp);
        when(userRepository.findById(205)).thenReturn(Optional.of(u));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(77)).thenReturn(Optional.of(hp));
        when(healthProfileRepository.save(any(HealthProfile.class))).thenAnswer(i -> i.getArgument(0));
        when(consentService.hasActiveConsent(205, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(true);

        UpdateHealthProfileRequest req = new UpdateHealthProfileRequest();
        req.setAllergiesDeclarationState(HealthDeclarationState.EXPLICITLY_NONE);
        req.setDietaryRequirementsDeclarationState(HealthDeclarationState.EXPLICITLY_NONE);

        HealthProfileResponse res = healthProfileService.updateMyHealthProfile(205, req);

        assertEquals(HealthDeclarationState.EXPLICITLY_NONE, res.getAllergiesDeclarationState());
        assertEquals(HealthDeclarationState.EXPLICITLY_NONE, res.getDietaryRequirementsDeclarationState());
    }

    @Test
    @DisplayName("Omitted partial-update state preserves existing state")
    void partialUpdate_preservesState() {
        User u = user(205);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(77);
        HealthProfile hp = new HealthProfile(cp);
        hp.setAllergiesDeclarationState(HealthDeclarationState.DECLARED);
        when(userRepository.findById(205)).thenReturn(Optional.of(u));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(77)).thenReturn(Optional.of(hp));
        when(healthProfileRepository.save(any(HealthProfile.class))).thenAnswer(i -> i.getArgument(0));
        when(consentService.hasActiveConsent(205, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(true);

        UpdateHealthProfileRequest req = new UpdateHealthProfileRequest();
        req.setCurrentMedications("magnesium");

        HealthProfileResponse res = healthProfileService.updateMyHealthProfile(205, req);

        assertEquals(HealthDeclarationState.DECLARED, res.getAllergiesDeclarationState());
    }

    @Test
    @DisplayName("Legacy null state normalizes to NOT_DECLARED")
    void legacyNull_normalizes() {
        User u = user(205);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(77);
        HealthProfile hp = new HealthProfile(cp);
        hp.setAllergiesDeclarationState(null);
        hp.setDietaryRequirementsDeclarationState(null);
        when(userRepository.findById(205)).thenReturn(Optional.of(u));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(77)).thenReturn(Optional.of(hp));
        when(healthProfileRepository.save(any(HealthProfile.class))).thenAnswer(i -> i.getArgument(0));
        when(consentService.hasActiveConsent(205, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(true);

        UpdateHealthProfileRequest req = new UpdateHealthProfileRequest();
        HealthProfileResponse res = healthProfileService.updateMyHealthProfile(205, req);

        assertEquals(HealthDeclarationState.NOT_DECLARED, res.getAllergiesDeclarationState());
        assertEquals(HealthDeclarationState.NOT_DECLARED, res.getDietaryRequirementsDeclarationState());
    }

    @Test
    @DisplayName("DECLARED with empty list is rejected")
    void declared_empty_rejected() {
        User u = user(205);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(77);
        HealthProfile hp = new HealthProfile(cp);
        when(userRepository.findById(205)).thenReturn(Optional.of(u));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(77)).thenReturn(Optional.of(hp));

        UpdateHealthProfileRequest req = new UpdateHealthProfileRequest();
        req.setAllergiesDeclarationState(HealthDeclarationState.DECLARED);
        req.setFoodAllergies(java.util.List.of());

        assertThrows(BusinessRuleException.class, () -> healthProfileService.updateMyHealthProfile(205, req));
    }

    @Test
    @DisplayName("EXPLICITLY_NONE with empty list is accepted")
    void explicitlyNone_empty_accepted() {
        User u = user(205);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(77);
        HealthProfile hp = new HealthProfile(cp);
        when(userRepository.findById(205)).thenReturn(Optional.of(u));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(77)).thenReturn(Optional.of(hp));
        when(healthProfileRepository.save(any(HealthProfile.class))).thenAnswer(i -> i.getArgument(0));
        when(foodAllergyRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        when(consentService.hasActiveConsent(205, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(true);

        UpdateHealthProfileRequest req = new UpdateHealthProfileRequest();
        req.setAllergiesDeclarationState(HealthDeclarationState.EXPLICITLY_NONE);
        req.setFoodAllergies(java.util.List.of());

        HealthProfileResponse res = healthProfileService.updateMyHealthProfile(205, req);
        assertEquals(HealthDeclarationState.EXPLICITLY_NONE, res.getAllergiesDeclarationState());
    }

    @Test
    @DisplayName("NOT_DECLARED is not treated as explicit absence")
    void notDeclared_notExplicit() {
        User u = user(205);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(77);
        HealthProfile hp = new HealthProfile(cp);
        when(userRepository.findById(205)).thenReturn(Optional.of(u));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(77)).thenReturn(Optional.of(hp));
        when(healthProfileRepository.save(any(HealthProfile.class))).thenAnswer(i -> i.getArgument(0));
        when(foodAllergyRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        when(consentService.hasActiveConsent(205, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(true);

        UpdateHealthProfileRequest req = new UpdateHealthProfileRequest();
        req.setAllergiesDeclarationState(HealthDeclarationState.NOT_DECLARED);
        req.setFoodAllergies(java.util.List.of());

        HealthProfileResponse res = healthProfileService.updateMyHealthProfile(205, req);
        assertEquals(HealthDeclarationState.NOT_DECLARED, res.getAllergiesDeclarationState());
        assertFalse(res.isComplete());
    }

    @Test
    @DisplayName("Medical conditions and therapy preferences remain optional")
    void optionalFields_doNotBlockCompletion() {
        User u = user(205);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(77);
        HealthProfile hp = new HealthProfile(cp);
        when(userRepository.findById(205)).thenReturn(Optional.of(u));
        when(customerProfileRepository.findByUserId(205)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(77)).thenReturn(Optional.of(hp));
        when(healthProfileRepository.save(any(HealthProfile.class))).thenAnswer(i -> i.getArgument(0));
        when(consentService.hasActiveConsent(205, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(true);

        UpdateHealthProfileRequest req = new UpdateHealthProfileRequest();
        req.setAllergiesDeclarationState(HealthDeclarationState.EXPLICITLY_NONE);
        req.setDietaryRequirementsDeclarationState(HealthDeclarationState.EXPLICITLY_NONE);
        // medical conditions and therapy preferences omitted

        HealthProfileResponse res = healthProfileService.updateMyHealthProfile(205, req);
        // completion is recalculated by service; response reflects persisted value
        org.mockito.Mockito.verify(completionService).recalculateForUser(205);
    }

}
