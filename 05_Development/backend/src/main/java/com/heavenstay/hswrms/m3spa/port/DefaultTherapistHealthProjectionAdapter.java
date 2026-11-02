package com.heavenstay.hswrms.m3spa.port;

import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Production runtime adapter for Therapist health notes projection.
 *
 * M1 HealthProfile integration is not implemented yet.
 * In accordance with sensitive-data minimization and fail-closed rules:
 * - Production runtime must NOT fabricate medical conditions, precautions,
 *   health notes, allergy information, or treatment safety text.
 * - If real records are absent or M1 is not integrated, returns explicit empty/null projection.
 * - Integration is marked PARTIAL.
 */
@Component
public class DefaultTherapistHealthProjectionAdapter implements TherapistHealthProjectionPort {

    private final JdbcTemplate jdbcTemplate;
    private final AuditLogService auditLogService;

    @Autowired
    public DefaultTherapistHealthProjectionAdapter(JdbcTemplate jdbcTemplate,
                                                   @Autowired(required = false) AuditLogService auditLogService) {
        this.jdbcTemplate = jdbcTemplate;
        this.auditLogService = auditLogService;
    }

    public DefaultTherapistHealthProjectionAdapter(JdbcTemplate jdbcTemplate) {
        this(jdbcTemplate, null);
    }

    @Override
    public TreatmentSafetyNotesDto getTreatmentSafetyNotes(Integer retreatBookingId) {
        if (retreatBookingId == null) {
            return new TreatmentSafetyNotesDto(null, null, null);
        }
        try {
            String sql = "SELECT u.full_name, hp.treatment_safety_notes " +
                         "FROM dbo.RetreatBooking b " +
                         "INNER JOIN dbo.CustomerProfile cp ON b.customer_profile_id = cp.customer_profile_id " +
                         "INNER JOIN dbo.[User] u ON cp.user_id = u.user_id " +
                         "LEFT JOIN dbo.HealthProfile hp ON cp.customer_profile_id = hp.customer_profile_id " +
                         "WHERE b.retreat_booking_id = ?";
            List<TreatmentSafetyNotesDto> results = jdbcTemplate.query(sql, (rs, rowNum) -> {
                String fullName = rs.getString("full_name");
                String firstName = (fullName != null && !fullName.isBlank()) ? fullName.trim().split("\\s+")[0] : null;
                String notes = rs.getString("treatment_safety_notes");
                // Do NOT fabricate notes or precautions if not present in the database record
                return new TreatmentSafetyNotesDto(
                        firstName,
                        notes, // exact database note or null
                        null   // precautions require M1 clinical rules; fail closed when not integrated
                );
            }, retreatBookingId);

            if (!results.isEmpty()) {
                if (auditLogService != null) {
                    auditLogService.record(null, "THERAPIST", "View Treatment Safety Projection", "DATA_HEALTH_TREATMENT",
                            String.valueOf(retreatBookingId), AuditLogService.SUCCESS, null, null);
                }
                return results.get(0);
            }
        } catch (Exception ignored) {
            // Fail closed on query/schema exception
        }

        // Fail-closed fallback: return explicit empty/null projection; no fabricated data
        return new TreatmentSafetyNotesDto(null, null, null);
    }
}
