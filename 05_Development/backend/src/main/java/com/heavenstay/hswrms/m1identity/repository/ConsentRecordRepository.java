package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.ConsentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsentRecordRepository extends JpaRepository<ConsentRecord, Integer> {

    List<ConsentRecord> findByUserUserIdOrderByGrantedAtDesc(Integer userId);

    Optional<ConsentRecord> findFirstByUserUserIdAndConsentTypeOrderByGrantedAtDesc(Integer userId, String consentType);

    @Query("SELECT COUNT(c) > 0 FROM ConsentRecord c WHERE c.user.userId = :userId AND c.consentType = :consentType AND c.consentStatus = 'GRANTED'")
    boolean hasActiveConsent(@Param("userId") Integer userId, @Param("consentType") String consentType);
}
