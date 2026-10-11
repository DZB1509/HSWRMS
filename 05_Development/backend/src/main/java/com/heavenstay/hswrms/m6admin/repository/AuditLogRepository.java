package com.heavenstay.hswrms.m6admin.repository;

import com.heavenstay.hswrms.m6admin.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Deliberately NOT a JpaRepository: audit records are append-only, so no delete/update operations are exposed.
 * Purging is performed exclusively by {@code AuditLogPurgeDao} on behalf of JOB-02.
 */
public interface AuditLogRepository extends Repository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    AuditLog save(AuditLog entry);

    Optional<AuditLog> findById(Long id);

    long count();

    long countByAccessStatusAndCreatedAtAfter(String accessStatus, LocalDateTime after);
}
