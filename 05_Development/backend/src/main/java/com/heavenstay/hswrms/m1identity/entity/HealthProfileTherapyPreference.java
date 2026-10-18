package com.heavenstay.hswrms.m1identity.entity;

import jakarta.persistence.*;
import java.util.Objects;

/**
 * Therapy & essential-oil preference child record (API_CONTRACT.md §5.3).
 * Multiple records per HealthProfile (NOT a comma-separated string).
 * Nullable therapy_code is reserved for future M3 catalog mapping.
 * Mapped to dbo.HealthProfileTherapyPreference (created by migration).
 */
@Entity
@Table(name = "\"HealthProfileTherapyPreference\"", schema = "dbo")
public class HealthProfileTherapyPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "therapy_preference_id", nullable = false)
    private Integer therapyPreferenceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "health_profile_id", nullable = false)
    private HealthProfile healthProfile;

    @Column(name = "preference_label", nullable = false, length = 120)
    private String preferenceLabel;

    @Column(name = "therapy_code", length = 40)
    private String therapyCode;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    public HealthProfileTherapyPreference() {
    }

    public HealthProfileTherapyPreference(HealthProfile healthProfile, String preferenceLabel,
                                          String therapyCode, int displayOrder) {
        this.healthProfile = healthProfile;
        this.preferenceLabel = preferenceLabel;
        this.therapyCode = therapyCode;
        this.displayOrder = displayOrder;
    }

    public Integer getTherapyPreferenceId() { return therapyPreferenceId; }
    public void setTherapyPreferenceId(Integer therapyPreferenceId) { this.therapyPreferenceId = therapyPreferenceId; }

    public HealthProfile getHealthProfile() { return healthProfile; }
    public void setHealthProfile(HealthProfile healthProfile) { this.healthProfile = healthProfile; }

    public String getPreferenceLabel() { return preferenceLabel; }
    public void setPreferenceLabel(String preferenceLabel) { this.preferenceLabel = preferenceLabel; }

    public String getTherapyCode() { return therapyCode; }
    public void setTherapyCode(String therapyCode) { this.therapyCode = therapyCode; }

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HealthProfileTherapyPreference that = (HealthProfileTherapyPreference) o;
        return Objects.equals(therapyPreferenceId, that.therapyPreferenceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(therapyPreferenceId);
    }
}
