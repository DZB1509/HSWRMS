package com.heavenstay.hswrms.m2booking.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "RetreatPackage", schema = "dbo")
public class RetreatPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "retreat_package_id")
    private Integer retreatPackageId;

    @Column(name = "package_code", length = 50)
    private String packageCode;

    @Column(name = "package_name", nullable = false, unique = true, length = 150)
    private String packageName;

    @Column(name = "wellness_goal", length = 250)
    private String wellnessGoal;

    @Column(name = "duration_nights", nullable = false)
    private Integer durationNights;

    @Column(name = "duration_unit", nullable = false, length = 50)
    private String durationUnit = "Đêm (Nights)";

    @Column(name = "base_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "base_price_unit", nullable = false, length = 50)
    private String basePriceUnit = "VND/khách/gói";

    @Column(name = "included_treatments", columnDefinition = "NVARCHAR(MAX)")
    private String includedTreatments;

    @Column(name = "dietary_plan", length = 1000)
    private String dietaryPlan;

    @Column(name = "extra_charge_policy", length = 1000)
    private String extraChargePolicy;

    @Column(name = "target_guest", length = 500)
    private String targetGuest;

    @Column(name = "package_status", nullable = false, length = 20)
    private String packageStatus = "ACTIVE";

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "RetreatPackageVillaCategory",
            schema = "dbo",
            joinColumns = @JoinColumn(name = "retreat_package_id"),
            inverseJoinColumns = @JoinColumn(name = "villa_category_id")
    )
    private Set<VillaCategory> eligibleVillaCategories = new HashSet<>();

    public RetreatPackage() {
    }

    public Integer getRetreatPackageId() {
        return retreatPackageId;
    }

    public void setRetreatPackageId(Integer retreatPackageId) {
        this.retreatPackageId = retreatPackageId;
    }

    public String getPackageCode() {
        return packageCode;
    }

    public void setPackageCode(String packageCode) {
        this.packageCode = packageCode;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public String getWellnessGoal() {
        return wellnessGoal;
    }

    public void setWellnessGoal(String wellnessGoal) {
        this.wellnessGoal = wellnessGoal;
    }

    public Integer getDurationNights() {
        return durationNights;
    }

    public void setDurationNights(Integer durationNights) {
        this.durationNights = durationNights;
    }

    public String getDurationUnit() {
        return durationUnit;
    }

    public void setDurationUnit(String durationUnit) {
        this.durationUnit = durationUnit;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public String getBasePriceUnit() {
        return basePriceUnit;
    }

    public void setBasePriceUnit(String basePriceUnit) {
        this.basePriceUnit = basePriceUnit;
    }

    public String getIncludedTreatments() {
        return includedTreatments;
    }

    public void setIncludedTreatments(String includedTreatments) {
        this.includedTreatments = includedTreatments;
    }

    public String getDietaryPlan() {
        return dietaryPlan;
    }

    public void setDietaryPlan(String dietaryPlan) {
        this.dietaryPlan = dietaryPlan;
    }

    public String getExtraChargePolicy() {
        return extraChargePolicy;
    }

    public void setExtraChargePolicy(String extraChargePolicy) {
        this.extraChargePolicy = extraChargePolicy;
    }

    public String getTargetGuest() {
        return targetGuest;
    }

    public void setTargetGuest(String targetGuest) {
        this.targetGuest = targetGuest;
    }

    public String getPackageStatus() {
        return packageStatus;
    }

    public void setPackageStatus(String packageStatus) {
        this.packageStatus = packageStatus;
    }

    public Set<VillaCategory> getEligibleVillaCategories() {
        return eligibleVillaCategories;
    }

    public void setEligibleVillaCategories(Set<VillaCategory> eligibleVillaCategories) {
        this.eligibleVillaCategories = eligibleVillaCategories;
    }
}
