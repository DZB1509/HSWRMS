package com.heavenstay.hswrms.m3spa.entity.enums;

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
