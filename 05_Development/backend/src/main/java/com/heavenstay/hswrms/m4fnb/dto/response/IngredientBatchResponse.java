package com.heavenstay.hswrms.m4fnb.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record IngredientBatchResponse(Integer id, Integer ingredientId, String ingredientName, String unitOfMeasure,
        LocalDate receivedDate, LocalDate expirationDate, BigDecimal remainingQuantity,
        String stockCondition, boolean expired, boolean usable) { }
