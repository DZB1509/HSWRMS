package com.heavenstay.hswrms.m2booking.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Writes M2 operational history (e.g. receptionist-recorded cash payments, check-in) into the
 * shared {@code dbo.AuditLog} table (SRS data rule 28). The write is part of the caller's
 * transaction: if the audit row cannot be stored the operation is rolled back.
 */
@Service
public class BookingAuditService {

    private final JdbcTemplate jdbc;

    public BookingAuditService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void record(Integer actorUserId, String action, String targetDataType, String accessStatus) {
        if (jdbc == null) {
            return;
        }
        jdbc.update("INSERT INTO dbo.AuditLog (actor_user_id, action, target_data_type, access_status) VALUES (?, ?, ?, ?)",
                actorUserId, truncate(action, 150), truncate(targetDataType, 100), truncate(accessStatus, 50));
    }

    private static String truncate(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}
