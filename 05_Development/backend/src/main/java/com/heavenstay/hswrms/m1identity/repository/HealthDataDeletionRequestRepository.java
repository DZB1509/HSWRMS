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

    List<HealthDataDeletionRequest> findByRequestedByUserUserIdOrderByRequestedAtDesc(Integer userId);

    Optional<HealthDataDeletionRequest> findFirstByRequestedByUserUserIdOrderByRequestedAtDesc(Integer userId);

    @Query("SELECT r FROM HealthDataDeletionRequest r WHERE r.requestedByUser.userId = :userId AND r.requestStatus IN ('PENDING', 'DEFERRED') ORDER BY r.requestedAt DESC")
    List<HealthDataDeletionRequest> findActiveRequestsByUserId(@Param("userId") Integer userId);

    boolean existsByRequestedByUserUserIdAndRequestStatusIn(Integer userId, List<String> statuses);
}
