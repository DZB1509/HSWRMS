package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import com.heavenstay.hswrms.m1identity.entity.ConsentRecord;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.ConsentRecordRepository;
import com.heavenstay.hswrms.m6admin.dto.HealthReadinessDto;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HealthReadinessService {

    private final HealthProfileRepository healthProfileRepository;
    private final ConsentRecordRepository consentRecordRepository;

    public HealthReadinessService(HealthProfileRepository healthProfileRepository,
                                   ConsentRecordRepository consentRecordRepository) {
        this.healthProfileRepository = healthProfileRepository;
        this.consentRecordRepository = consentRecordRepository;
    }

    @Transactional(readOnly = true)
    public HealthReadinessDto getHealthReadiness(CurrentActor actor) {
        Long totalProfiles = healthProfileRepository.count();
        Long completedProfiles = healthProfileRepository.countByIsCompleteTrue();
        Long incompleteProfiles = healthProfileRepository.countByIsCompleteFalse();

        Long activeConsents = countActiveConsents();
        Long pendingConsents = totalProfiles - activeConsents;

        Double completionRate = totalProfiles > 0
                ? ((double) completedProfiles / totalProfiles) * 100
                : 0.0;

        return new HealthReadinessDto(
                totalProfiles.intValue(),
                completedProfiles.intValue(),
                incompleteProfiles.intValue(),
                activeConsents.intValue(),
                pendingConsents.intValue(),
                completionRate
        );
    }

    private Long countActiveConsents() {
        // JPQL: count HealthProfile where customer has active HEALTH_DATA_PROCESSING consent
        // Active = consentStatus = GRANTED AND revokedAt IS NULL
        Object result = healthProfileRepository.countByCustomerHasActiveHealthConsent();
        return result != null ? ((Number) result).longValue() : 0L;
    }
}