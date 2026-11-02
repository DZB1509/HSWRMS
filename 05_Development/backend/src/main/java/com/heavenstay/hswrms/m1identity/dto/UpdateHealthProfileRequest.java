package com.heavenstay.hswrms.m1identity.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Health & dietary profile write body for PUT /api/v1/customers/me/health-profile.
 * Contract §5.3 validation: stress enum, list caps (20 items x 120 chars),
 * text caps. Carries no user identifier: identity comes from the JWT principal.
 */
public class UpdateHealthProfileRequest {

    @Size(max = 2000, message = "Current health condition must not exceed 2000 characters")
    private String currentHealthCondition;

    @Size(max = 2000, message = "Injury/surgery history must not exceed 2000 characters")
    private String injurySurgeryHistory;

    @Size(max = 2000, message = "Mobility/joint notes must not exceed 2000 characters")
    private String mobilityJointNotes;

    @Size(max = 500, message = "Current medications must not exceed 500 characters")
    private String currentMedications;

    @Pattern(regexp = "^(mild|moderate|high)$", message = "Stress/fatigue level must be mild, moderate, or high")
    private String stressFatigueLevel;

    @Size(max = 20, message = "Food allergies must not exceed 20 items")
    private List<@Size(max = 120, message = "Allergen name must not exceed 120 characters") String> foodAllergies;

    @Size(max = 2000, message = "Food intolerance notes must not exceed 2000 characters")
    private String foodIntoleranceNotes;

    @Size(max = 20, message = "Dietary requirements must not exceed 20 items")
    private List<@Size(max = 120, message = "Requirement name must not exceed 120 characters") String> dietaryRequirements;

    @Size(max = 20, message = "Therapy preferences must not exceed 20 items")
    private List<@Size(max = 120, message = "Therapy preference must not exceed 120 characters") String> therapyPreferences;

    @Size(max = 40, message = "Therapy code must not exceed 40 characters")
    private String therapyCode;

    @Size(max = 2000, message = "Disliked ingredients must not exceed 2000 characters")
    private String dislikedIngredients;

    @Size(max = 2000, message = "Kitchen notes must not exceed 2000 characters")
    private String kitchenNotes;

    public String getCurrentHealthCondition() { return currentHealthCondition; }
    public void setCurrentHealthCondition(String v) { this.currentHealthCondition = v; }

    public String getInjurySurgeryHistory() { return injurySurgeryHistory; }
    public void setInjurySurgeryHistory(String v) { this.injurySurgeryHistory = v; }

    public String getMobilityJointNotes() { return mobilityJointNotes; }
    public void setMobilityJointNotes(String v) { this.mobilityJointNotes = v; }

    public String getCurrentMedications() { return currentMedications; }
    public void setCurrentMedications(String v) { this.currentMedications = v; }

    public String getStressFatigueLevel() { return stressFatigueLevel; }
    public void setStressFatigueLevel(String v) { this.stressFatigueLevel = v; }

    public List<String> getFoodAllergies() { return foodAllergies; }
    public void setFoodAllergies(List<String> v) { this.foodAllergies = v; }

    public String getFoodIntoleranceNotes() { return foodIntoleranceNotes; }
    public void setFoodIntoleranceNotes(String v) { this.foodIntoleranceNotes = v; }

    public List<String> getDietaryRequirements() { return dietaryRequirements; }
    public void setDietaryRequirements(List<String> v) { this.dietaryRequirements = v; }

    public List<String> getTherapyPreferences() { return therapyPreferences; }
    public void setTherapyPreferences(List<String> v) { this.therapyPreferences = v; }

    public String getTherapyCode() { return therapyCode; }
    public void setTherapyCode(String v) { this.therapyCode = v; }

    public String getDislikedIngredients() { return dislikedIngredients; }
    public void setDislikedIngredients(String v) { this.dislikedIngredients = v; }

    public String getKitchenNotes() { return kitchenNotes; }
    public void setKitchenNotes(String v) { this.kitchenNotes = v; }
}
