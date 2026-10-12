package com.heavenstay.hswrms.m4fnb.integration;

import java.util.List;

/** Public M1-facing projection; it must never include diagnoses or treatment notes. */
public interface DietaryProfilePort {
    FoodProfileProjection getFoodProfileForUser(Integer userId);

    record FoodProfileProjection(List<String> foodAllergies, List<String> dietaryPreferences) {
        public FoodProfileProjection {
            foodAllergies = foodAllergies == null ? List.of() : List.copyOf(foodAllergies);
            dietaryPreferences = dietaryPreferences == null ? List.of() : List.copyOf(dietaryPreferences);
        }
    }
}
