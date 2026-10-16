package com.heavenstay.hswrms.m2booking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "RetreatPackage")
public class RetreatPackage {

    public static final String ACTIVE = "ACTIVE";
    public static final String INACTIVE = "INACTIVE";

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
    private int durationNights;

    @Column(name = "base_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "included_treatments", columnDefinition = "NVARCHAR(MAX)")
    private String includedTreatments;

    @Column(name = "dietary_plan", length = 1000)
    private String dietaryPlan;

    @Column(name = "target_guest", length = 500)
    private String targetGuest;

    @Column(name = "package_status", nullable = false, length = 20)
    private String packageStatus = ACTIVE;

    public RetreatPackage() {}

    public RetreatPackage(String packageName, String wellnessGoal, int durationNights, BigDecimal basePrice, String packageStatus) {
        this.packageName = packageName;
        this.wellnessGoal = wellnessGoal;
        this.durationNights = durationNights;
        this.basePrice = basePrice;
        this.packageStatus = packageStatus != null ? packageStatus : ACTIVE;
    }

    public Integer getRetreatPackageId() { return retreatPackageId; }
    public String getPackageCode() { return packageCode; }
    public void setPackageCode(String packageCode) { this.packageCode = packageCode; }
    public String getPackageName() { return packageName; }
    public void setPackageName(String packageName) { this.packageName = packageName; }
    public String getWellnessGoal() { return wellnessGoal; }
    public void setWellnessGoal(String wellnessGoal) { this.wellnessGoal = wellnessGoal; }
    public int getDurationNights() { return durationNights; }
    public void setDurationNights(int durationNights) { this.durationNights = durationNights; }
    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
    public String getIncludedTreatments() { return includedTreatments; }
    public void setIncludedTreatments(String includedTreatments) { this.includedTreatments = includedTreatments; }
    public String getDietaryPlan() { return dietaryPlan; }
    public void setDietaryPlan(String dietaryPlan) { this.dietaryPlan = dietaryPlan; }
    public String getTargetGuest() { return targetGuest; }
    public void setTargetGuest(String targetGuest) { this.targetGuest = targetGuest; }
    public String getPackageStatus() { return packageStatus; }
    public void setPackageStatus(String packageStatus) { this.packageStatus = packageStatus; }
}
