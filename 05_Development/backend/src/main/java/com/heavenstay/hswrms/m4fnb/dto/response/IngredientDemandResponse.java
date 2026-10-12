package com.heavenstay.hswrms.m4fnb.dto.response;

import java.math.BigDecimal;

public record IngredientDemandResponse(Integer ingredientId, String ingredientName, String unitOfMeasure,
        BigDecimal requiredQuantity, BigDecimal usableQuantity, BigDecimal shortfall,
        String alert) { }
