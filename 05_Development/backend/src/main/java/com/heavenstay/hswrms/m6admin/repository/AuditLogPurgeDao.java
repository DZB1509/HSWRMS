package com.heavenstay.hswrms.m6admin.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Dedicated purging DAO for JOB-02 (Clean Up Old Audit Log Entries).
 * Only used by the background batch purge job. Does not expose generic delete APIs.
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
        // Native query or JPQL batch delete
        return em.createQuery("delete from AuditLog a where a.auditLogId in ("
                        + "select sub.auditLogId from AuditLog sub where sub.createdAt < :cutoff "
                        + "order by sub.createdAt asc)")
                .setParameter("cutoff", olderThan)
                .setMaxResults(batchSize)
                .executeUpdate();
    }
}
