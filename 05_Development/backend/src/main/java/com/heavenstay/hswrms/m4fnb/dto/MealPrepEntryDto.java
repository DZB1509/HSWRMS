package com.heavenstay.hswrms.m4fnb.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class MealPrepEntryDto {
    private Long id;
    private String type; // 'retreat_meal' or 'a_la_carte'
    private LocalDate date;
    private String mealPeriod;
    private String targetTime;
    private String customerName;
    private String villaNumber;
    private List<MealOrderItemDto> items = new ArrayList<>();
    private String customerNotes;
    private List<String> dietaryNotes = new ArrayList<>(); // Minimal projection: dietary & allergies only
    private String status; // 'pending', 'preparing', 'ready', 'delivered', 'cancelled'

    public MealPrepEntryDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getMealPeriod() {
        return mealPeriod;
    }

    public void setMealPeriod(String mealPeriod) {
        this.mealPeriod = mealPeriod;
    }

    public String getTargetTime() {
        return targetTime;
    }

    public void setTargetTime(String targetTime) {
        this.targetTime = targetTime;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getVillaNumber() {
        return villaNumber;
    }

    public void setVillaNumber(String villaNumber) {
        this.villaNumber = villaNumber;
    }

    public List<MealOrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<MealOrderItemDto> items) {
        this.items = items != null ? items : new ArrayList<>();
    }

    public String getCustomerNotes() {
        return customerNotes;
    }

    public void setCustomerNotes(String customerNotes) {
        this.customerNotes = customerNotes;
    }

    public List<String> getDietaryNotes() {
        return dietaryNotes;
    }

    public void setDietaryNotes(List<String> dietaryNotes) {
        this.dietaryNotes = dietaryNotes != null ? dietaryNotes : new ArrayList<>();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
