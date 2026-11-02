package com.heavenstay.hswrms.m4fnb.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateMealOrderLineRequest(
        @NotNull Integer menuItemId,
        @NotNull @Min(1) Integer quantity) { }
