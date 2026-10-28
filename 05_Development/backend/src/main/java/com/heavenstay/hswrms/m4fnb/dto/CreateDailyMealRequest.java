package com.heavenstay.hswrms.m4fnb.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class CreateDailyMealRequest {

    @NotNull(message = "retreatBookingId is required")
    private Integer retreatBookingId;

    @NotNull(message = "orderDate is required")
    private LocalDate orderDate;

    @NotNull(message = "mealPeriod is required")
    private String mealPeriod; // breakfast, lunch, dinner

    private List<Integer> menuItemIds = new ArrayList<>();
    private String notes;

    public CreateDailyMealRequest() {}

    public CreateDailyMealRequest(Integer retreatBookingId, LocalDate orderDate, String mealPeriod,
                                  List<Integer> menuItemIds, String notes) {
        this.retreatBookingId = retreatBookingId;
        this.orderDate = orderDate;
        this.mealPeriod = mealPeriod;
        this.menuItemIds = menuItemIds != null ? menuItemIds : new ArrayList<>();
        this.notes = notes;
    }

    public Integer getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Integer retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
    }

    public String getMealPeriod() {
        return mealPeriod;
    }

    public void setMealPeriod(String mealPeriod) {
        this.mealPeriod = mealPeriod;
    }

    public List<Integer> getMenuItemIds() {
        return menuItemIds;
    }

    public void setMenuItemIds(List<Integer> menuItemIds) {
        this.menuItemIds = menuItemIds != null ? menuItemIds : new ArrayList<>();
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
