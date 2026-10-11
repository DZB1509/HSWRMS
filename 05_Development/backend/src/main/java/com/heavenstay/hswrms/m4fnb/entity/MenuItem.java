package com.heavenstay.hswrms.m4fnb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "MenuItem", schema = "dbo")
public class MenuItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_item_id")
    private Integer id;

    @Column(name = "item_name", nullable = false, length = 150)
    private String itemName;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "meal_type", length = 50)
    private String mealType;

    @Column(name = "price", nullable = false, precision = 18, scale = 2)
    private BigDecimal price;

    @Column(name = "dietary_tags", length = 500)
    private String dietaryTags;

    @Column(name = "allergen_information", columnDefinition = "nvarchar(max)")
    private String allergenInformation;

    @Column(name = "availability_status", nullable = false, length = 20)
    private String availabilityStatus;

    protected MenuItem() { }

    public MenuItem(String itemName, String category, String mealType, BigDecimal price,
                    String dietaryTags, String allergenInformation, String availabilityStatus) {
        this.itemName = itemName;
        this.category = category;
        this.mealType = mealType;
        this.price = price;
        this.dietaryTags = dietaryTags;
        this.allergenInformation = allergenInformation;
        this.availabilityStatus = availabilityStatus;
    }

    public Integer getId() { return id; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getDietaryTags() { return dietaryTags; }
    public void setDietaryTags(String dietaryTags) { this.dietaryTags = dietaryTags; }
    public String getAllergenInformation() { return allergenInformation; }
    public void setAllergenInformation(String allergenInformation) { this.allergenInformation = allergenInformation; }
    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }
}
