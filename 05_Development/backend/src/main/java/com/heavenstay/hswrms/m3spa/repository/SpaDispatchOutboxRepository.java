package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.SpaDispatchOutboxEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}

