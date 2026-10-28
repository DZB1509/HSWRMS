package com.heavenstay.hswrms.m4fnb.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Entity mapped to dbo.MenuItem representing food and beverage offerings,
 * dietary tags, allergen specifications, and availability status.
 */
@Entity
@Table(name = "MenuItem")
public class MenuItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_item_id")
    private Integer menuItemId;

    @Column(name = "item_name", nullable = false, length = 150, unique = true)
    private String itemName;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "meal_type", length = 50)
    private String mealType;

    @Column(name = "price", nullable = false, precision = 18, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "dietary_tags", length = 500)
    private String dietaryTags;

    @Column(name = "allergen_information", columnDefinition = "NVARCHAR(MAX)")
    private String allergenInformation;

    @Column(name = "availability_status", nullable = false, length = 20)
    private String availabilityStatus = "AVAILABLE"; // AVAILABLE, UNAVAILABLE

    public MenuItemEntity() {}

    public MenuItemEntity(String itemName, String category, String mealType, BigDecimal price,
                          String dietaryTags, String allergenInformation, String availabilityStatus) {
        this.itemName = itemName;
        this.category = category;
        this.mealType = mealType;
        this.price = price != null ? price : BigDecimal.ZERO;
        this.dietaryTags = dietaryTags;
        this.allergenInformation = allergenInformation;
        this.availabilityStatus = availabilityStatus != null ? availabilityStatus : "AVAILABLE";
    }

    public Integer getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Integer menuItemId) {
        this.menuItemId = menuItemId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getMealType() {
        return mealType;
    }

    public void setMealType(String mealType) {
        this.mealType = mealType;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getDietaryTags() {
        return dietaryTags;
    }

    public void setDietaryTags(String dietaryTags) {
        this.dietaryTags = dietaryTags;
    }

    public String getAllergenInformation() {
        return allergenInformation;
    }

    public void setAllergenInformation(String allergenInformation) {
        this.allergenInformation = allergenInformation;
    }

    public String getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(String availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }
}
