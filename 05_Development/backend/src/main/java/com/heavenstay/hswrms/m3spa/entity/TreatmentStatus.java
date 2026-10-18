package com.heavenstay.hswrms.m3spa.entity;

/**
 * Standardized operational lifecycle status for Spa Treatments in HSWRMS.
 * Used across M3 Spa Scheduling and M6 Master Data Governance.
 */
public enum TreatmentStatus {
    ACTIVE,
    INACTIVE;

    public static TreatmentStatus from(String raw) {
        if (raw == null || raw.isBlank()) {
            return ACTIVE;
        }
        for (TreatmentStatus status : values()) {
            if (status.name().equalsIgnoreCase(raw.trim())) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown TreatmentStatus: " + raw);
    }
}
