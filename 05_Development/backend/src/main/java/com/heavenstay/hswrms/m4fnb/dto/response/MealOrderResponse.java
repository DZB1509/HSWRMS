package com.heavenstay.hswrms.m4fnb.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record MealOrderResponse(
        Integer id,
        Integer bookingId,
        LocalDate orderDate,
        String mealType,
        String orderType,
        String status,
        String specialNotes,
        LocalDateTime createdAt,
        BigDecimal subtotal,
        List<MealOrderLineResponse> items,
        String folioPostingStatus,
        String inventoryStatus
) {
    public MealOrderResponse {
        inventoryStatus = inventoryStatus == null ? "PENDING" : inventoryStatus;
        folioPostingStatus = folioPostingStatus == null
                ? ("A_LA_CARTE".equalsIgnoreCase(orderType) ? "PENDING_RECONCILIATION" : "NOT_APPLICABLE")
                : folioPostingStatus;
    }

    public MealOrderResponse(Integer id, Integer bookingId, LocalDate orderDate, String mealType,
            String orderType, String status, String specialNotes, LocalDateTime createdAt, BigDecimal subtotal,
            List<MealOrderLineResponse> items, String folioPostingStatus) {
        this(id, bookingId, orderDate, mealType, orderType, status, specialNotes, createdAt, subtotal, items,
                folioPostingStatus, "PENDING");
    }

    public MealOrderResponse(Integer id, Integer bookingId, LocalDate orderDate, String mealType,
            String orderType, String status, String specialNotes, LocalDateTime createdAt, BigDecimal subtotal,
            List<MealOrderLineResponse> items) {
        this(id, bookingId, orderDate, mealType, orderType, status, specialNotes, createdAt, subtotal, items,
                "A_LA_CARTE".equalsIgnoreCase(orderType) ? "PENDING_RECONCILIATION" : "NOT_APPLICABLE", "PENDING");
    }

    /**
     * Determines whether this order is designated for In-Villa Dining (Amanoi wellness retreat model).
     */
    public boolean isVillaDelivery() {
        if (specialNotes == null) return false;
        String upper = specialNotes.toUpperCase();
        return upper.contains("IN-VILLA") || upper.contains("IN_VILLA") || upper.contains("IN VILLA") || upper.contains("BIỆT THỰ")
                || upper.contains("TẠI VILLA") || upper.contains("GIAO VILLA") || upper.contains("VILLA DELIVERY");
    }

    /**
     * Operational service venue: DINING_PAVILION by default, or IN_VILLA.
     */
    public String serviceLocation() {
        return isVillaDelivery() ? "IN_VILLA" : "DINING_PAVILION";
    }
}
