package com.heavenstay.hswrms.m4fnb.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record CreateMealOrderRequest(
        @NotNull Integer bookingId,
        @NotNull LocalDate orderDate,
        @NotBlank @Pattern(regexp = "(?i)BREAKFAST|LUNCH|DINNER") String mealType,
        @Size(max = 1000) String specialNotes,
        @NotEmpty @Size(max = 30) List<@Valid CreateMealOrderLineRequest> items) { }
