package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.SpaDispatchOutboxEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpaDispatchOutboxRepository extends JpaRepository<SpaDispatchOutboxEntity, Long> {

    Optional<SpaDispatchOutboxEntity> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);

    List<SpaDispatchOutboxEntity> findByStatusInAndRetryCountLessThanOrderByCreatedAtAsc(
            Collection<String> statuses, int maxRetries
    );

    List<SpaDispatchOutboxEntity> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    /**
     * Finds outbox entries eligible for worker claim:
     * - PENDING entries, or due FAILED entries, with retryCount < maxRetries
     * - Stale PROCESSING entries whose claim lease expired before staleThreshold and retryCount < maxRetries
     */
    @Query("SELECT e FROM SpaDispatchOutboxEntity e " +
           "WHERE (e.status = 'PENDING' " +
           "       OR (e.status = 'FAILED' AND (e.nextAttemptAt IS NULL OR e.nextAttemptAt <= :now)) " +
           "       OR (e.status = 'PROCESSING' AND e.claimedAt < :staleThreshold)) " +
           "  AND e.retryCount < :maxRetries " +
           "ORDER BY e.createdAt ASC")
    List<SpaDispatchOutboxEntity> findClaimableEntries(@Param("maxRetries") int maxRetries,
                                                       @Param("staleThreshold") LocalDateTime staleThreshold,
                                                       @Param("now") LocalDateTime now);

    /**
     * Atomically transitions an eligible outbox record to PROCESSING state for the given workerId.
     * Prevents dual-instance concurrent claiming in multi-node deployments (SQL Server row-level atomic update).
     *
     * @return number of rows updated (1 if claimed by this worker, 0 if already claimed/completed/exhausted)
     */
    @Modifying(flushAutomatically = true)
    @Query("UPDATE SpaDispatchOutboxEntity e " +
           "SET e.status = 'PROCESSING', e.claimedAt = :claimedAt, e.claimedBy = :workerId " +
           "WHERE e.outboxId = :outboxId " +
           "  AND e.retryCount < :maxRetries " +
           "  AND (e.status = 'PENDING' " +
           "       OR (e.status = 'FAILED' AND (e.nextAttemptAt IS NULL OR e.nextAttemptAt <= :claimedAt)) " +
           "       OR (e.status = 'PROCESSING' AND e.claimedAt < :staleThreshold))")
    int claimRecordForProcessing(@Param("outboxId") Long outboxId,
                                 @Param("workerId") String workerId,
                                 @Param("claimedAt") LocalDateTime claimedAt,
                                 @Param("staleThreshold") LocalDateTime staleThreshold,
                                 @Param("maxRetries") int maxRetries);
}

