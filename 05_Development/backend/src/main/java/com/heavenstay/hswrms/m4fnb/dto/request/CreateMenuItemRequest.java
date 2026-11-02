package com.heavenstay.hswrms.m4fnb.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateMenuItemRequest(
        @NotBlank @Size(max = 150) String itemName,
        @Size(max = 100) String category,
        @Size(max = 50) String mealType,
        @NotNull @DecimalMin("0.00") @Digits(integer = 16, fraction = 2) BigDecimal price,
        @Size(max = 500) String dietaryTags,
        String allergenInformation,
        @NotBlank String availabilityStatus) { }
