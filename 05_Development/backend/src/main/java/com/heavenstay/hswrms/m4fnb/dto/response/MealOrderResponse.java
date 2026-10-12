package com.heavenstay.hswrms.m4fnb.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record MealOrderResponse(Integer id, Integer bookingId, LocalDate orderDate, String mealType,
        String orderType, String status, String specialNotes, LocalDateTime createdAt, BigDecimal subtotal,
        List<MealOrderLineResponse> items) { }
