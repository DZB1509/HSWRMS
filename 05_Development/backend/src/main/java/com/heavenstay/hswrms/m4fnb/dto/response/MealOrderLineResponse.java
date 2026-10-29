package com.heavenstay.hswrms.m4fnb.dto.response;

import java.math.BigDecimal;

public record MealOrderLineResponse(
        Integer id,
        Integer menuItemId,
        String itemName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        String preparationStatus,
        String inventoryStatus
) {
    public MealOrderLineResponse {
        inventoryStatus = inventoryStatus == null ? "PENDING" : inventoryStatus;
    }

    public MealOrderLineResponse(Integer id, Integer menuItemId, String itemName,
                                Integer quantity, BigDecimal unitPrice, BigDecimal lineTotal, String preparationStatus) {
        this(id, menuItemId, itemName, quantity, unitPrice, lineTotal, preparationStatus, "PENDING");
    }
}
