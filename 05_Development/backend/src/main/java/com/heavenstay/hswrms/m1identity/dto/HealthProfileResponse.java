package com.heavenstay.hswrms.m1identity.dto;

import java.util.List;

/**
 * Health & dietary profile response for GET/PUT /api/v1/customers/me/health-profile.
 * Follows API_CONTRACT.md §5.3. System-managed anonymizationStatus is excluded.
 */
public class HealthProfileResponse {

    private Integer healthProfileId;
    private String currentHealthCondition;
    private String injurySurgeryHistory;
    private String mobilityJointNotes;
    private String currentMedications;
    private String stressFatigueLevel;
    private List<String> foodAllergies;
    private String foodIntoleranceNotes;
    private List<String> dietaryRequirements;
    private List<String> therapyPreferences;
    private String dislikedIngredients;
    private String kitchenNotes;
    private boolean hasConsented;

    public Integer getHealthProfileId() { return healthProfileId; }
    public void setHealthProfileId(Integer healthProfileId) { this.healthProfileId = healthProfileId; }

    public String getCurrentHealthCondition() { return currentHealthCondition; }
    public void setCurrentHealthCondition(String currentHealthCondition) { this.currentHealthCondition = currentHealthCondition; }

    public String getInjurySurgeryHistory() { return injurySurgeryHistory; }
    public void setInjurySurgeryHistory(String injurySurgeryHistory) { this.injurySurgeryHistory = injurySurgeryHistory; }

    public String getMobilityJointNotes() { return mobilityJointNotes; }
    public void setMobilityJointNotes(String mobilityJointNotes) { this.mobilityJointNotes = mobilityJointNotes; }

    public String getCurrentMedications() { return currentMedications; }
    public void setCurrentMedications(String currentMedications) { this.currentMedications = currentMedications; }

    public String getStressFatigueLevel() { return stressFatigueLevel; }
    public void setStressFatigueLevel(String stressFatigueLevel) { this.stressFatigueLevel = stressFatigueLevel; }

    public List<String> getFoodAllergies() { return foodAllergies; }
    public void setFoodAllergies(List<String> foodAllergies) { this.foodAllergies = foodAllergies; }

    public String getFoodIntoleranceNotes() { return foodIntoleranceNotes; }
    public void setFoodIntoleranceNotes(String foodIntoleranceNotes) { this.foodIntoleranceNotes = foodIntoleranceNotes; }

    public List<String> getDietaryRequirements() { return dietaryRequirements; }
    public void setDietaryRequirements(List<String> dietaryRequirements) { this.dietaryRequirements = dietaryRequirements; }

    public List<String> getTherapyPreferences() { return therapyPreferences; }
    public void setTherapyPreferences(List<String> therapyPreferences) { this.therapyPreferences = therapyPreferences; }

    public String getDislikedIngredients() { return dislikedIngredients; }
    public void setDislikedIngredients(String dislikedIngredients) { this.dislikedIngredients = dislikedIngredients; }

    public String getKitchenNotes() { return kitchenNotes; }
    public void setKitchenNotes(String kitchenNotes) { this.kitchenNotes = kitchenNotes; }

    public boolean isHasConsented() { return hasConsented; }
    public void setHasConsented(boolean hasConsented) { this.hasConsented = hasConsented; }
}
