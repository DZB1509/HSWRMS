package com.heavenstay.hswrms.m4fnb.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class MenuItemDto {
    private Integer menuItemId;
    private String itemName;
    private String category;
    private String mealType;
    private BigDecimal price;
    private List<String> dietaryTags = new ArrayList<>();
    private List<String> allergenTags = new ArrayList<>();
    private String availabilityStatus;

    public MenuItemDto() {}

    public MenuItemDto(Integer menuItemId, String itemName, String category, String mealType,
                       BigDecimal price, List<String> dietaryTags, List<String> allergenTags,
                       String availabilityStatus) {
        this.menuItemId = menuItemId;
        this.itemName = itemName;
        this.category = category;
        this.mealType = mealType;
        this.price = price;
        this.dietaryTags = dietaryTags != null ? dietaryTags : new ArrayList<>();
        this.allergenTags = allergenTags != null ? allergenTags : new ArrayList<>();
        this.availabilityStatus = availabilityStatus;
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

    public List<String> getDietaryTags() {
        return dietaryTags;
    }

    public void setDietaryTags(List<String> dietaryTags) {
        this.dietaryTags = dietaryTags;
    }

    public List<String> getAllergenTags() {
        return allergenTags;
    }

    public void setAllergenTags(List<String> allergenTags) {
        this.allergenTags = allergenTags;
    }

    public String getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(String availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }
}
