package com.heavenstay.hswrms.m4fnb.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record RecipeLineRequest(
        @NotNull Integer ingredientId,
        @NotNull @DecimalMin(value = "0.001", inclusive = true) @Digits(integer = 15, fraction = 3)
        BigDecimal requiredQuantity) { }
