package com.heavenstay.hswrms.m4fnb.dto.response;

public record KitchenOrderLineResponse(
        Integer orderLineId,
        Integer menuItemId,
        String itemName,
        Integer quantity,
        String preparationStatus,
        String inventoryStatus,
        String inventoryMessage
) {
    public KitchenOrderLineResponse {
        inventoryStatus = inventoryStatus == null ? "PENDING" : inventoryStatus;
    }

    public KitchenOrderLineResponse(Integer orderLineId, Integer menuItemId, String itemName,
                                    Integer quantity, String preparationStatus) {
        this(orderLineId, menuItemId, itemName, quantity, preparationStatus, "PENDING", null);
    }
}
