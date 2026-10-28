package com.heavenstay.hswrms.m4fnb.integration;

import java.util.List;

/**
 * Public M1-facing dietary projection interface for M4 F&B.
 * Strictly adheres to PII data minimization (Decree 13/2023/ND-CP & Decree 356/2025/ND-CP):
 * Exposes only culinary-relevant food allergies and dietary preferences.
 * Sensitive medical diagnoses, medications, or treatment notes are strictly excluded.
 */
public interface DietaryProfilePort {

    enum DietaryVerificationStatus {
        VERIFIED,            // Health & dietary profile confirmed by M1
        UNVERIFIED,          // Profile unconfirmed or survey pending
        NO_PROFILE_ATTACHED  // Guest has no health profile record
    }

    FoodProfileProjection getFoodProfileForUser(Integer userId);
    FoodProfileProjection getFoodProfileForCustomerProfile(Integer customerProfileId);

    record FoodProfileProjection(
            DietaryVerificationStatus verificationStatus,
            List<String> foodAllergies,
            List<String> dietaryPreferences
    ) {
        public FoodProfileProjection {
            verificationStatus = verificationStatus == null ? DietaryVerificationStatus.UNVERIFIED : verificationStatus;
            foodAllergies = foodAllergies == null ? List.of() : List.copyOf(foodAllergies);
            dietaryPreferences = dietaryPreferences == null ? List.of() : List.copyOf(dietaryPreferences);
        }

        public FoodProfileProjection(List<String> foodAllergies, List<String> dietaryPreferences) {
            this(DietaryVerificationStatus.VERIFIED, foodAllergies, dietaryPreferences);
        }
    }
}
