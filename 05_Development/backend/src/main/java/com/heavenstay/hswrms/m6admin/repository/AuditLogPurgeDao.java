package com.heavenstay.hswrms.m6admin.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Dedicated purging DAO for JOB-02 (Clean Up Old Audit Log Entries).
 * Only used by the background batch purge job. Does not expose generic delete APIs.
 * Uses bounded batch query followed by ID-based bulk delete for portable SQL Server & H2 execution.
 */
@Repository
public class AuditLogPurgeDao {

    @PersistenceContext
    private EntityManager em;

    /**
     * Purges audit log records older than the cutoff threshold in batches up to {@code batchSize}.
     * Returns the number of records deleted in this batch.
     */
    @Transactional
    public int purgeBatch(LocalDateTime olderThan, int batchSize) {
        List<Long> ids = em.createQuery(
                "select a.auditLogId from AuditLog a where a.createdAt < :cutoff order by a.createdAt asc", Long.class)
                .setParameter("cutoff", olderThan)
                .setMaxResults(batchSize)
                .getResultList();

        if (ids.isEmpty()) {
            return 0;
        }

        return em.createQuery("delete from AuditLog a where a.auditLogId in :ids")
                .setParameter("ids", ids)
                .executeUpdate();
    }
}
