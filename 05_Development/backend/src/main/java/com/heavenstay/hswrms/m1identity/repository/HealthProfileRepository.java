package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HealthProfileRepository extends JpaRepository<HealthProfile, Integer> {

    @Query("SELECT hp FROM HealthProfile hp WHERE hp.customerProfile.customerProfileId = :customerProfileId")
    Optional<HealthProfile> findByCustomerProfileId(@Param("customerProfileId") Integer customerProfileId);

    @Query("SELECT hp FROM HealthProfile hp WHERE hp.customerProfile.user.userId = :userId")
    Optional<HealthProfile> findByUserId(@Param("userId") Integer userId);

    boolean existsByCustomerProfileCustomerProfileId(Integer customerProfileId);

    @Query("SELECT COUNT(hp) FROM HealthProfile hp WHERE hp.isComplete = true")
    long countByIsCompleteTrue();

    @Query("SELECT COUNT(hp) FROM HealthProfile hp WHERE hp.isComplete = false")
    long countByIsCompleteFalse();

    @Query("SELECT COUNT(DISTINCT hp.healthProfileId) FROM HealthProfile hp " +
            "WHERE EXISTS (" +
            "    SELECT c FROM ConsentRecord c " +
            "    WHERE c.user.userId = hp.customerProfile.user.userId " +
            "    AND c.consentType = 'HEALTH_DATA_PROCESSING' " +
            "    AND c.consentStatus = 'GRANTED' " +
            "    AND c.revokedAt IS NULL" +
            ")")
    long countByCustomerHasActiveHealthConsent();
}
