package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.HealthDataDeletionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HealthDataDeletionRequestRepository extends JpaRepository<HealthDataDeletionRequest, Integer> {

    List<HealthDataDeletionRequest> findByCustomerProfileCustomerProfileIdOrderByRequestedAtDesc(Integer customerProfileId);

    Optional<HealthDataDeletionRequest> findFirstByCustomerProfileCustomerProfileIdOrderByRequestedAtDesc(Integer customerProfileId);

    @Query("SELECT r FROM HealthDataDeletionRequest r WHERE r.customerProfile.customerProfileId = :customerProfileId AND r.requestStatus IN ('PENDING', 'DEFERRED') ORDER BY r.requestedAt DESC")
    List<HealthDataDeletionRequest> findActiveRequestsByCustomerProfileId(@Param("customerProfileId") Integer customerProfileId);

    boolean existsByCustomerProfileCustomerProfileIdAndRequestStatusIn(Integer customerProfileId, List<String> statuses);

    Optional<HealthDataDeletionRequest> findByDeletionRequestIdAndCustomerProfileCustomerProfileId(Integer deletionRequestId, Integer customerProfileId);
}
