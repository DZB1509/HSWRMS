package com.heavenstay.hswrms.m1identity.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
}
