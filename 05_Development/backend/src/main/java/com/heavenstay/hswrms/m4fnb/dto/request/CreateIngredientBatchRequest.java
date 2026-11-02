package com.heavenstay.hswrms.m4fnb.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateIngredientBatchRequest(
        @NotNull Integer ingredientId,
        @NotNull @PastOrPresent LocalDate receivedDate,
        @NotNull LocalDate expirationDate,
        @NotNull @DecimalMin("0.000") @Digits(integer = 15, fraction = 3) BigDecimal remainingQuantity,
        @NotBlank String stockCondition) { }
