package com.heavenstay.hswrms.m6admin.dto;

/**
 * DTO for Manager Health & Wellness Readiness Report API response.
 */
public record HealthReadinessDto(
        Integer totalProfiles,
        Integer completedProfiles,
        Integer incompleteProfiles,
        Integer activeConsents,
        Integer pendingConsents,
        Double completionRate
) {
    public static HealthReadinessDto of() {
        return new HealthReadinessDto(0, 0, 0, 0, 0, 0.0);
    }
}