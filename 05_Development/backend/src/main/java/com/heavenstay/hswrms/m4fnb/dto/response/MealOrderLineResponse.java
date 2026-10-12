package com.heavenstay.hswrms.m4fnb.dto.response;

import java.math.BigDecimal;

public record MealOrderLineResponse(Integer id, Integer menuItemId, String itemName,
        Integer quantity, BigDecimal unitPrice, BigDecimal lineTotal, String preparationStatus) { }
