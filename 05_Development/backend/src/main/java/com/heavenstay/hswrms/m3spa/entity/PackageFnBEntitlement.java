package com.heavenstay.hswrms.m3spa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "PackageFnBEntitlement")
public class PackageFnBEntitlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "entitlement_id")
    private Integer entitlementId;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "retreat_package_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private RetreatPackage retreatPackage;

    @Column(name = "breakfast_count", nullable = false)
    private Integer breakfastCount = 0;

    @Column(name = "lunch_count", nullable = false)
    private Integer lunchCount = 0;

    @Column(name = "dinner_count", nullable = false)
    private Integer dinnerCount = 0;

    @Column(name = "total_meals", nullable = false)
    private Integer totalMeals = 0;

    @Column(name = "menu_plan", length = 250)
    private String menuPlan;

    @Column(name = "dietary_notes", length = 500)
    private String dietaryNotes;

    @Column(name = "entitlement_status", nullable = false, length = 50)
    private String entitlementStatus = "APPROVED";

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public PackageFnBEntitlement() {}

    public PackageFnBEntitlement(RetreatPackage retreatPackage, Integer breakfastCount, Integer lunchCount, Integer dinnerCount, String menuPlan, String dietaryNotes) {
        this.retreatPackage = retreatPackage;
        this.breakfastCount = breakfastCount != null ? breakfastCount : 0;
        this.lunchCount = lunchCount != null ? lunchCount : 0;
        this.dinnerCount = dinnerCount != null ? dinnerCount : 0;
        this.totalMeals = this.breakfastCount + this.lunchCount + this.dinnerCount;
        this.menuPlan = menuPlan;
        this.dietaryNotes = dietaryNotes;
        this.entitlementStatus = "APPROVED";
    }

    public Integer getEntitlementId() { return entitlementId; }
    public RetreatPackage getRetreatPackage() { return retreatPackage; }
    public void setRetreatPackage(RetreatPackage retreatPackage) { this.retreatPackage = retreatPackage; }
    public Integer getBreakfastCount() { return breakfastCount; }
    public void setBreakfastCount(Integer breakfastCount) { this.breakfastCount = breakfastCount; }
    public Integer getLunchCount() { return lunchCount; }
    public void setLunchCount(Integer lunchCount) { this.lunchCount = lunchCount; }
    public Integer getDinnerCount() { return dinnerCount; }
    public void setDinnerCount(Integer dinnerCount) { this.dinnerCount = dinnerCount; }
    public Integer getTotalMeals() { return totalMeals; }
    public void setTotalMeals(Integer totalMeals) { this.totalMeals = totalMeals; }
    public String getMenuPlan() { return menuPlan; }
    public void setMenuPlan(String menuPlan) { this.menuPlan = menuPlan; }
    public String getDietaryNotes() { return dietaryNotes; }
    public void setDietaryNotes(String dietaryNotes) { this.dietaryNotes = dietaryNotes; }
    public String getEntitlementStatus() { return entitlementStatus; }
    public void setEntitlementStatus(String entitlementStatus) { this.entitlementStatus = entitlementStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
