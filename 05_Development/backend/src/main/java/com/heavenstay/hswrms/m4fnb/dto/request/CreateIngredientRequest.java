package com.heavenstay.hswrms.m4fnb.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateIngredientRequest(
        @NotBlank @Size(max = 150) String ingredientName) { }
