package com.heavenstay.hswrms.m1identity.entity;

import jakarta.persistence.*;
import java.util.Objects;

/**
 * Dietary requirement child record (API_CONTRACT.md §5.3).
 * Multiple records per HealthProfile, explicit display order.
 * Mapped to dbo.DietaryRequirement (created by migration, not yet on live DB).
 */
@Entity
@Table(name = "\"DietaryRequirement\"", schema = "dbo")
public class DietaryRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dietary_requirement_id", nullable = false)
    private Integer dietaryRequirementId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "health_profile_id", nullable = false)
    private HealthProfile healthProfile;

    @Column(name = "requirement_name", nullable = false, length = 120)
    private String requirementName;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    public DietaryRequirement() {
    }

    public DietaryRequirement(HealthProfile healthProfile, String requirementName, int displayOrder) {
        this.healthProfile = healthProfile;
        this.requirementName = requirementName;
        this.displayOrder = displayOrder;
    }

    public Integer getDietaryRequirementId() { return dietaryRequirementId; }
    public void setDietaryRequirementId(Integer dietaryRequirementId) { this.dietaryRequirementId = dietaryRequirementId; }

    public HealthProfile getHealthProfile() { return healthProfile; }
    public void setHealthProfile(HealthProfile healthProfile) { this.healthProfile = healthProfile; }

    public String getRequirementName() { return requirementName; }
    public void setRequirementName(String requirementName) { this.requirementName = requirementName; }

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DietaryRequirement that = (DietaryRequirement) o;
        return Objects.equals(dietaryRequirementId, that.dietaryRequirementId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(dietaryRequirementId);
    }
}
