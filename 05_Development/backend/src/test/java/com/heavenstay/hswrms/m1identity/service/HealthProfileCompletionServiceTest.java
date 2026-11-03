package com.heavenstay.hswrms.m1identity.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthDeclarationState;
import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.ConsentRecordRepository;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class HealthProfileCompletionServiceTest {

    @Mock private CustomerProfileRepository customerProfileRepository;
    @Mock private HealthProfileRepository healthProfileRepository;
    @Mock private ConsentRecordRepository consentRecordRepository;

    @InjectMocks
    private HealthProfileCompletionService completionService;

    private User user(int id) {
        User u = new User("Jane", "jane@example.com", "hash");
        u.setUserId(id);
        return u;
    }

    @Test
    @DisplayName("No customer profile means no completion update")
    void noCustomerProfile_doesNotSave() {
        when(customerProfileRepository.findByUserId(1)).thenReturn(Optional.empty());
        completionService.recalculateForUser(1);
        verify(healthProfileRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("No health profile means no completion update")
    void noHealthProfile_doesNotSave() {
        User u = user(1);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(2);
        when(customerProfileRepository.findByUserId(1)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(2)).thenReturn(Optional.empty());
        completionService.recalculateForUser(1);
        verify(healthProfileRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }
    @Test
    @DisplayName("Complete when consent active and both declarations answered")
    void complete_whenConsentAndDeclarationsAnswered() {
        User u = user(1);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(2);
        HealthProfile hp = new HealthProfile(cp);
        hp.setAllergiesDeclarationState(HealthDeclarationState.DECLARED);
        hp.setDietaryRequirementsDeclarationState(HealthDeclarationState.EXPLICITLY_NONE);
        when(customerProfileRepository.findByUserId(1)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(2)).thenReturn(Optional.of(hp));
        when(consentRecordRepository.hasActiveConsent(1, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(true);
        when(healthProfileRepository.save(hp)).thenReturn(hp);

        completionService.recalculateForUser(1);

        assertTrue(hp.isComplete());
        verify(healthProfileRepository).save(hp);
    }

    @Test
    @DisplayName("Incomplete without active consent")
    void incomplete_withoutConsent() {
        User u = user(1);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(2);
        HealthProfile hp = new HealthProfile(cp);
        hp.setAllergiesDeclarationState(HealthDeclarationState.DECLARED);
        hp.setDietaryRequirementsDeclarationState(HealthDeclarationState.DECLARED);
        when(customerProfileRepository.findByUserId(1)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(2)).thenReturn(Optional.of(hp));
        when(consentRecordRepository.hasActiveConsent(1, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(false);
        when(healthProfileRepository.save(hp)).thenReturn(hp);

        completionService.recalculateForUser(1);

        assertFalse(hp.isComplete());
    }

    @Test
    @DisplayName("Incomplete when allergy declaration is NOT_DECLARED")
    void incomplete_whenAllergyNotDeclared() {
        User u = user(1);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(2);
        HealthProfile hp = new HealthProfile(cp);
        hp.setAllergiesDeclarationState(HealthDeclarationState.NOT_DECLARED);
        hp.setDietaryRequirementsDeclarationState(HealthDeclarationState.EXPLICITLY_NONE);
        when(customerProfileRepository.findByUserId(1)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(2)).thenReturn(Optional.of(hp));
        when(consentRecordRepository.hasActiveConsent(1, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(true);
        when(healthProfileRepository.save(hp)).thenReturn(hp);

        completionService.recalculateForUser(1);

        assertFalse(hp.isComplete());
    }

    @Test
    @DisplayName("Medical conditions and therapy preferences are not required")
    void complete_doesNotRequireOptionalFields() {
        User u = user(1);
        CustomerProfile cp = new CustomerProfile(u);
        cp.setCustomerProfileId(2);
        HealthProfile hp = new HealthProfile(cp);
        hp.setAllergiesDeclarationState(HealthDeclarationState.EXPLICITLY_NONE);
        hp.setDietaryRequirementsDeclarationState(HealthDeclarationState.EXPLICITLY_NONE);
        hp.setCurrentHealthCondition(null);
        hp.setTherapyPreferences(null);
        when(customerProfileRepository.findByUserId(1)).thenReturn(Optional.of(cp));
        when(healthProfileRepository.findByCustomerProfileId(2)).thenReturn(Optional.of(hp));
        when(consentRecordRepository.hasActiveConsent(1, ConsentService.HEALTH_DATA_PROCESSING)).thenReturn(true);
        when(healthProfileRepository.save(hp)).thenReturn(hp);

        completionService.recalculateForUser(1);

        assertTrue(hp.isComplete());
    }

}