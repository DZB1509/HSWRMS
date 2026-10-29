package com.heavenstay.hswrms.m4fnb.dto.response;

import java.math.BigDecimal;

public record RecipeLineResponse(Integer ingredientId, String ingredientName, String unitOfMeasure,
                                 BigDecimal requiredQuantity) { }
