package com.heavenstay.hswrms.m1identity.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Sensitive HealthProfile entity storing customer health, dietary,
 * allergy, and treatment-safety notes with explicit consent gating.
 * Mapped to dbo.HealthProfile. Structured columns + child collections
 * follow API_CONTRACT.md §5.3; legacy unstructured columns
 * (allergies, dietary_requirements, treatment_safety_notes) are retained
 * for backward compatibility with the existing live schema.
 */
@Entity
@Table(name = "\"HealthProfile\"", schema = "dbo")
public class HealthProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "health_profile_id", nullable = false)
    private Integer healthProfileId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_profile_id", nullable = false, unique = true)
    private CustomerProfile customerProfile;

    @Column(name = "allergies", columnDefinition = "NVARCHAR(MAX)")
    private String allergies;

    @Column(name = "dietary_requirements", columnDefinition = "NVARCHAR(MAX)")
    private String dietaryRequirements;

    @Column(name = "treatment_safety_notes", columnDefinition = "NVARCHAR(MAX)")
    private String treatmentSafetyNotes;

    @Column(name = "current_health_condition", columnDefinition = "NVARCHAR(MAX)")
    private String currentHealthCondition;

    @Column(name = "injury_surgery_history", columnDefinition = "NVARCHAR(MAX)")
    private String injurySurgeryHistory;

    @Column(name = "mobility_joint_notes", columnDefinition = "NVARCHAR(MAX)")
    private String mobilityJointNotes;

    @Column(name = "current_medications", length = 500)
    private String currentMedications;

    @Column(name = "stress_fatigue_level", length = 20)
    private String stressFatigueLevel;

    @Column(name = "food_intolerance_notes", columnDefinition = "NVARCHAR(MAX)")
    private String foodIntoleranceNotes;

    @Column(name = "disliked_ingredients", columnDefinition = "NVARCHAR(MAX)")
    private String dislikedIngredients;

    @Column(name = "kitchen_notes", columnDefinition = "NVARCHAR(MAX)")
    private String kitchenNotes;

    @OneToMany(mappedBy = "healthProfile", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<FoodAllergy> foodAllergies = new ArrayList<>();

    @OneToMany(mappedBy = "healthProfile", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<DietaryRequirement> dietaryRequirementsList = new ArrayList<>();

    @OneToMany(mappedBy = "healthProfile", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<HealthProfileTherapyPreference> therapyPreferences = new ArrayList<>();

    @Column(name = "anonymization_status", nullable = false, length = 20)
    private String anonymizationStatus = "IDENTIFIABLE"; // IDENTIFIABLE, ANONYMIZED

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public HealthProfile() {
    }

    public HealthProfile(CustomerProfile customerProfile) {
        this.customerProfile = customerProfile;
        this.anonymizationStatus = "IDENTIFIABLE";
    }

    @PrePersist
    public void onPrePersist() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.anonymizationStatus == null) {
            this.anonymizationStatus = "IDENTIFIABLE";
        }
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters

    public Integer getHealthProfileId() {
        return healthProfileId;
    }

    public void setHealthProfileId(Integer healthProfileId) {
        this.healthProfileId = healthProfileId;
    }

    public CustomerProfile getCustomerProfile() {
        return customerProfile;
    }

    public void setCustomerProfile(CustomerProfile customerProfile) {
        this.customerProfile = customerProfile;
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    public String getDietaryRequirements() {
        return dietaryRequirements;
    }

    public void setDietaryRequirements(String dietaryRequirements) {
        this.dietaryRequirements = dietaryRequirements;
    }

    public String getTreatmentSafetyNotes() {
        return treatmentSafetyNotes;
    }

    public void setTreatmentSafetyNotes(String treatmentSafetyNotes) {
        this.treatmentSafetyNotes = treatmentSafetyNotes;
    }

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

    public String getFoodIntoleranceNotes() { return foodIntoleranceNotes; }
    public void setFoodIntoleranceNotes(String v) { this.foodIntoleranceNotes = v; }

    public String getDislikedIngredients() { return dislikedIngredients; }
    public void setDislikedIngredients(String v) { this.dislikedIngredients = v; }

    public String getKitchenNotes() { return kitchenNotes; }
    public void setKitchenNotes(String v) { this.kitchenNotes = v; }

    public List<FoodAllergy> getFoodAllergies() { return foodAllergies; }
    public void setFoodAllergies(List<FoodAllergy> foodAllergies) { this.foodAllergies = foodAllergies; }

    public List<DietaryRequirement> getDietaryRequirementsList() { return dietaryRequirementsList; }
    public void setDietaryRequirementsList(List<DietaryRequirement> v) { this.dietaryRequirementsList = v; }

    public List<HealthProfileTherapyPreference> getTherapyPreferences() { return therapyPreferences; }
    public void setTherapyPreferences(List<HealthProfileTherapyPreference> v) { this.therapyPreferences = v; }

    public String getAnonymizationStatus() {
        return anonymizationStatus;
    }

    public void setAnonymizationStatus(String anonymizationStatus) {
        this.anonymizationStatus = anonymizationStatus;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HealthProfile that = (HealthProfile) o;
        return Objects.equals(healthProfileId, that.healthProfileId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(healthProfileId);
    }
}
