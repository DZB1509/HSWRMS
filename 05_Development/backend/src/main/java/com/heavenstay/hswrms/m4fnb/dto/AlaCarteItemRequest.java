package com.heavenstay.hswrms.m4fnb.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class AlaCarteItemRequest {

    @NotNull(message = "menuItemId is required")
    private Integer menuItemId;

    @NotNull(message = "quantity is required")
    @Min(value = 1, message = "quantity must be at least 1")
    private Integer quantity;

    private String notes;

    public AlaCarteItemRequest() {}

    public AlaCarteItemRequest(Integer menuItemId, Integer quantity, String notes) {
        this.menuItemId = menuItemId;
        this.quantity = quantity;
        this.notes = notes;
    }

    public Integer getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Integer menuItemId) {
        this.menuItemId = menuItemId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
