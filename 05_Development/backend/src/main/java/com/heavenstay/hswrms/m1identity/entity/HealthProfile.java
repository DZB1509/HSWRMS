package com.heavenstay.hswrms.m1identity.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

/**
 * Sensitive HealthProfile entity storing customer health, dietary,
 * allergy, and treatment-safety notes with explicit consent gating.
 * Mapped to dbo.HealthProfile.
 */
@Entity
@Table(name = "HealthProfile")
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
