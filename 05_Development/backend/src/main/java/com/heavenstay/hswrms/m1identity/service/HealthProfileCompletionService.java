package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthDeclarationState;
import com.heavenstay.hswrms.m1identity.repository.ConsentRecordRepository;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Shared completion calculation for HealthProfile.isComplete.
 * <p>
 * Depends only on existing repositories. No dependency on
 * HealthProfileService or ConsentService, so there is no circular
 * dependency. Called from HealthProfileService after a valid update and
 * from ConsentService after a HEALTH_DATA_PROCESSING grant/revocation.
 */
@Service
public class HealthProfileCompletionService {

    private final CustomerProfileRepository customerProfileRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final ConsentRecordRepository consentRecordRepository;

    public HealthProfileCompletionService(
            CustomerProfileRepository customerProfileRepository,
            HealthProfileRepository healthProfileRepository,
            ConsentRecordRepository consentRecordRepository) {
        this.customerProfileRepository = customerProfileRepository;
        this.healthProfileRepository = healthProfileRepository;
        this.consentRecordRepository = consentRecordRepository;
    }

    /**
     * Recalculate completion for the current profile associated with the
     * given user id and persist it. Safe when there is no profile.
     */
    @Transactional
    public void recalculateForUser(Integer userId) {
        CustomerProfile customerProfile = customerProfileRepository
                .findByUserId(userId)
                .orElse(null);

        if (customerProfile == null) {
            return;
        }

        HealthProfile profile = healthProfileRepository
                .findByCustomerProfileId(customerProfile.getCustomerProfileId())
                .orElse(null);

        if (profile == null) {
            return;
        }

        boolean profileExists = customerProfile != null;
        boolean activeConsent = consentRecordRepository
                .hasActiveConsent(userId, ConsentService.HEALTH_DATA_PROCESSING);
        boolean allergiesComplete = profile.getAllergiesDeclarationState() == HealthDeclarationState.DECLARED
                || profile.getAllergiesDeclarationState() == HealthDeclarationState.EXPLICITLY_NONE;
        boolean dietaryComplete = profile.getDietaryRequirementsDeclarationState() == HealthDeclarationState.DECLARED
                || profile.getDietaryRequirementsDeclarationState() == HealthDeclarationState.EXPLICITLY_NONE;

        boolean complete = profileExists
                && activeConsent
                && allergiesComplete
                && dietaryComplete;

        profile.setComplete(complete);
        healthProfileRepository.save(profile);
    }
}
