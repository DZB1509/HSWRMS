package com.heavenstay.hswrms.m4fnb.dto.response;

import java.time.LocalDate;
import java.util.List;

public record KitchenOrderResponse(Integer id, Integer bookingId, String guestFirstName,
        String villaNumber, LocalDate orderDate, String mealType, String orderType,
        String status, String specialNotes, boolean dietaryProfileAvailable,
        List<String> allergies, List<String> dietaryPreferences,
        List<KitchenOrderLineResponse> items) { }
