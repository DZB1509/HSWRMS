package com.heavenstay.hswrms.m4fnb.dto.response;

public record KitchenOrderLineResponse(Integer orderLineId, Integer menuItemId,
        String itemName, Integer quantity, String preparationStatus) { }
