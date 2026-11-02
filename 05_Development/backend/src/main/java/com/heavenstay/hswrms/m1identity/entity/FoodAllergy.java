package com.heavenstay.hswrms.m1identity.entity;

import jakarta.persistence.*;
import java.util.Objects;

/**
 * Food allergy child record (API_CONTRACT.md §5.3).
 * Multiple records per HealthProfile, explicit display order.
 * Mapped to dbo.FoodAllergy (created by migration, not yet on live DB).
 */
@Entity
@Table(name = "\"FoodAllergy\"", schema = "dbo")
public class FoodAllergy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "food_allergy_id", nullable = false)
    private Integer foodAllergyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "health_profile_id", nullable = false)
    private HealthProfile healthProfile;

    @Column(name = "allergen_name", nullable = false, length = 120)
    private String allergenName;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    public FoodAllergy() {
    }

    public FoodAllergy(HealthProfile healthProfile, String allergenName, int displayOrder) {
        this.healthProfile = healthProfile;
        this.allergenName = allergenName;
        this.displayOrder = displayOrder;
    }

    public Integer getFoodAllergyId() { return foodAllergyId; }
    public void setFoodAllergyId(Integer foodAllergyId) { this.foodAllergyId = foodAllergyId; }

    public HealthProfile getHealthProfile() { return healthProfile; }
    public void setHealthProfile(HealthProfile healthProfile) { this.healthProfile = healthProfile; }

    public String getAllergenName() { return allergenName; }
    public void setAllergenName(String allergenName) { this.allergenName = allergenName; }

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FoodAllergy that = (FoodAllergy) o;
        return Objects.equals(foodAllergyId, that.foodAllergyId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(foodAllergyId);
    }
}
