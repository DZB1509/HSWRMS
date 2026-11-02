package com.heavenstay.hswrms.m4fnb.dto;

import java.math.BigDecimal;

public class MealOrderItemDto {
    private Integer mealOrderItemId;
    private Integer menuItemId;
    private String itemName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
    private String notes;

    public MealOrderItemDto() {}

    public MealOrderItemDto(Integer mealOrderItemId, Integer menuItemId, String itemName,
                            Integer quantity, BigDecimal unitPrice, BigDecimal lineTotal, String notes) {
        this.mealOrderItemId = mealOrderItemId;
        this.menuItemId = menuItemId;
        this.itemName = itemName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = lineTotal;
        this.notes = notes;
    }

    public Integer getMealOrderItemId() {
        return mealOrderItemId;
    }

    public void setMealOrderItemId(Integer mealOrderItemId) {
        this.mealOrderItemId = mealOrderItemId;
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

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
