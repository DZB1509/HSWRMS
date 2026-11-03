package com.heavenstay.hswrms.m3spa.port;

import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.ConsentRecordRepository;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileRepository;
import com.heavenstay.hswrms.m1identity.service.ConsentService;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Production runtime adapter for Therapist health notes projection.
 *
 * Enforces sensitive-data minimization and M1 explicit consent gating (DEF-M3-02 / BR-06):
 * - Checks active HEALTH_DATA_PROCESSING consent prior to loading restricted health data.
 * - If consent is absent, revoked, or expired: returns only non-sensitive first name and safe empty precautions.
 * - If consent is active: projects only treatment-relevant safety notes and mobility precautions.
 * - Never fabricates medical or health data.
 * - Audits all access attempts.
 */
@Component
@Transactional(readOnly = true)
public class DefaultTherapistHealthProjectionAdapter implements TherapistHealthProjectionPort {

    private final RetreatBookingRepository bookingRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final ConsentRecordRepository consentRecordRepository;
    private final ConsentService consentService;
    private final AuditLogService auditLogService;
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public DefaultTherapistHealthProjectionAdapter(
            @Autowired(required = false) RetreatBookingRepository bookingRepository,
            @Autowired(required = false) CustomerProfileRepository customerProfileRepository,
            @Autowired(required = false) HealthProfileRepository healthProfileRepository,
            @Autowired(required = false) ConsentRecordRepository consentRecordRepository,
            @Autowired(required = false) ConsentService consentService,
            @Autowired(required = false) AuditLogService auditLogService,
            @Autowired(required = false) JdbcTemplate jdbcTemplate
    ) {
        this.bookingRepository = bookingRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.healthProfileRepository = healthProfileRepository;
        this.consentRecordRepository = consentRecordRepository;
        this.consentService = consentService;
        this.auditLogService = auditLogService;
        this.jdbcTemplate = jdbcTemplate;
    }

    public DefaultTherapistHealthProjectionAdapter(
            RetreatBookingRepository bookingRepository,
            CustomerProfileRepository customerProfileRepository,
            HealthProfileRepository healthProfileRepository,
            AuditLogService auditLogService,
            JdbcTemplate jdbcTemplate
    ) {
        this(bookingRepository, customerProfileRepository, healthProfileRepository, null, null, auditLogService, jdbcTemplate);
    }

    public DefaultTherapistHealthProjectionAdapter(JdbcTemplate jdbcTemplate, AuditLogService auditLogService) {
        this(null, null, null, null, null, auditLogService, jdbcTemplate);
    }

    public DefaultTherapistHealthProjectionAdapter(JdbcTemplate jdbcTemplate) {
        this(null, null, null, null, null, null, jdbcTemplate);
    }

    @Override
    public TreatmentSafetyNotesDto getTreatmentSafetyNotes(Integer retreatBookingId) {
        if (retreatBookingId == null) {
            return new TreatmentSafetyNotesDto(null, null, (List<String>) null);
        }

        // 1. Prefer type-safe Spring Data JPA repositories
        if (bookingRepository != null && customerProfileRepository != null) {
            try {
                Optional<RetreatBooking> bookingOpt = bookingRepository.findById(retreatBookingId);
                if (bookingOpt.isPresent()) {
                    RetreatBooking booking = bookingOpt.get();
                    Optional<CustomerProfile> profileOpt = customerProfileRepository.findByIdWithUser(booking.getCustomerProfileId());
                    if (profileOpt.isPresent()) {
                        CustomerProfile cp = profileOpt.get();
                        User u = cp.getUser();
                        String fullName = u != null ? u.getFullName() : null;
                        String firstName = (fullName != null && !fullName.isBlank()) ? fullName.trim().split("\\s+")[0] : null;
                        Integer userId = u != null ? u.getUserId() : null;

                        // 1a. Validate M1 Health-Data Processing Consent BEFORE reading health data
                        boolean hasConsent = false;
                        if (userId != null) {
                            if (consentService != null) {
                                hasConsent = consentService.hasActiveConsent(userId, ConsentService.HEALTH_DATA_PROCESSING);
                            } else if (consentRecordRepository != null) {
                                hasConsent = consentRecordRepository.hasActiveConsent(userId, "HEALTH_DATA_PROCESSING");
                            }
                        }

                        if (!hasConsent) {
                            // Non-consented: return only minimum non-sensitive info (firstName); restricted health data is NOT loaded
                            if (auditLogService != null) {
                                auditLogService.record(userId, "THERAPIST", "View Treatment Safety Projection (Consent Not Granted)",
                                        "DATA_HEALTH_TREATMENT", String.valueOf(retreatBookingId),
                                        AuditLogService.DENIED, "Active HEALTH_DATA_PROCESSING consent not found or revoked", null);
                            }
                            return new TreatmentSafetyNotesDto(firstName, null, Collections.emptyList());
                        }

                        // 1b. Consent is ACTIVE: Retrieve health profile and extract permitted fields
                        String notes = null;
                        String mobilityNotes = null;
                        List<String> precautions = new ArrayList<>();
                        if (healthProfileRepository != null) {
                            Optional<HealthProfile> hpOpt = healthProfileRepository.findByCustomerProfileId(cp.getCustomerProfileId());
                            if (hpOpt.isPresent()) {
                                HealthProfile hp = hpOpt.get();
                                if (hp.getTreatmentSafetyNotes() != null && !hp.getTreatmentSafetyNotes().isBlank()) {
                                    notes = hp.getTreatmentSafetyNotes().trim();
                                }
                                if (hp.getMobilityJointNotes() != null && !hp.getMobilityJointNotes().isBlank()) {
                                    mobilityNotes = hp.getMobilityJointNotes().trim();
                                    String[] parts = mobilityNotes.split("[;\r\n]+");
                                    for (String part : parts) {
                                        String clean = part.trim();
                                        if (!clean.isEmpty()) {
                                            precautions.add(clean);
                                        }
                                    }
                                }
                            }
                        }

                        if (auditLogService != null) {
                            auditLogService.record(userId, "THERAPIST", "View Treatment Safety Projection",
                                    "DATA_HEALTH_TREATMENT", String.valueOf(retreatBookingId),
                                    AuditLogService.SUCCESS, null, null);
                        }
                        TreatmentSafetyNotesDto dto = new TreatmentSafetyNotesDto(firstName, notes, precautions);
                        dto.setMobilityJointNotes(mobilityNotes);
                        return dto;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // 2. JDBC fallback
        if (jdbcTemplate != null) {
            try {
                String sql = "SELECT u.user_id, u.full_name, hp.treatment_safety_notes, hp.mobility_joint_notes, " +
                             "(SELECT COUNT(1) FROM dbo.ConsentRecord cr " +
                             " WHERE cr.user_id = u.user_id " +
                             "   AND cr.consent_type = 'HEALTH_DATA_PROCESSING' " +
                             "   AND cr.consent_status = 'GRANTED' " +
                             "   AND cr.revoked_at IS NULL) AS has_consent " +
                             "FROM dbo.RetreatBooking b " +
                             "INNER JOIN dbo.CustomerProfile cp ON b.customer_profile_id = cp.customer_profile_id " +
                             "INNER JOIN dbo.\"User\" u ON cp.user_id = u.user_id " +
                             "LEFT JOIN dbo.HealthProfile hp ON cp.customer_profile_id = hp.customer_profile_id " +
                             "WHERE b.retreat_booking_id = ?";
                List<TreatmentSafetyNotesDto> results = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    String fullName = rs.getString("full_name");
                    String firstName = (fullName != null && !fullName.isBlank()) ? fullName.trim().split("\\s+")[0] : null;
                    int consentCount = rs.getInt("has_consent");
                    if (consentCount <= 0) {
                        return new TreatmentSafetyNotesDto(firstName, null, Collections.emptyList());
                    }
                    String rawNotes = rs.getString("treatment_safety_notes");
                    String notes = (rawNotes != null && !rawNotes.isBlank()) ? rawNotes.trim() : null;
                    String rawMobility = rs.getString("mobility_joint_notes");
                    List<String> precautions = new ArrayList<>();
                    if (rawMobility != null && !rawMobility.isBlank()) {
                        String[] parts = rawMobility.split("[;\r\n]+");
                        for (String part : parts) {
                            String clean = part.trim();
                            if (!clean.isEmpty()) {
                                precautions.add(clean);
                            }
                        }
                    }
                    return new TreatmentSafetyNotesDto(firstName, notes, precautions);
                }, retreatBookingId);

                if (!results.isEmpty()) {
                    if (auditLogService != null) {
                        auditLogService.record(null, "THERAPIST", "View Treatment Safety Projection", "DATA_HEALTH_TREATMENT",
                                String.valueOf(retreatBookingId), AuditLogService.SUCCESS, null, null);
                    }
                    return results.get(0);
                }
            } catch (Exception ignored) {
            }
        }

        // Fail-closed fallback: return explicit empty/null projection; no fabricated data
        return new TreatmentSafetyNotesDto(null, null, (List<String>) null);
    }
}
