package com.heavenstay.hswrms.m2booking.dto;

import java.math.BigDecimal;
import java.util.List;

public class RetreatPackageResponse {

    private Integer retreatPackageId;
    private String packageCode;
    private String packageName;
    private String wellnessGoal;
    private Integer durationNights;
    private String durationUnit;
    private BigDecimal basePrice;
    private String basePriceUnit;
    private String includedTreatments;
    private String dietaryPlan;
    private String extraChargePolicy;
    private String targetGuest;
    private String packageStatus;
    private List<VillaCategoryResponse> eligibleVillaCategories;

    public RetreatPackageResponse() {
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

    public List<VillaCategoryResponse> getEligibleVillaCategories() {
        return eligibleVillaCategories;
    }

    public void setEligibleVillaCategories(List<VillaCategoryResponse> eligibleVillaCategories) {
        this.eligibleVillaCategories = eligibleVillaCategories;
    }
}
