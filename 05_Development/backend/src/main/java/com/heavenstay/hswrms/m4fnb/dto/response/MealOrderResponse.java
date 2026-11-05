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
        return upper.contains("IN-VILLA") || upper.contains("IN_VILLA") || upper.contains("IN VILLA")
                || upper.contains("BIỆT THỰ") || upper.contains("BIET THU")
                || upper.contains("TẠI VILLA") || upper.contains("TAI VILLA")
                || upper.contains("GIAO VILLA") || upper.contains("VILLA DELIVERY");
    }

    /**
     * Operational service venue: DINING_PAVILION by default, or IN_VILLA.
     */
    public String getServiceLocation() {
        return isVillaDelivery() ? "IN_VILLA" : "DINING_PAVILION";
    }

    public String serviceLocation() {
        return getServiceLocation();
    }

    /**
     * Check if customer can cancel this order (permitted only if status is PENDING).
     */
    public boolean isCancelable() {
        return "PENDING".equalsIgnoreCase(status);
    }

    /**
     * SLA Lead time in minutes: 20 mins for Central Dining Pavilion, 35 mins for In-Villa Dining.
     */
    public int getLeadTimeMinutes() {
        return isVillaDelivery() ? 35 : 20;
    }

    /**
     * Returns scheduled delivery time if specified in specialNotes (e.g., [SCHEDULED: 19:30] or [TARGET: 12:45]).
     */
    public String getTargetDeliveryTime() {
        if (specialNotes == null) return null;
        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("\\[(?:SCHEDULED|TARGET|HẸN GIỜ|HEN GIO):\\s*(\\d{1,2}:\\d{2})\\]", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(specialNotes);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    /**
     * Estimated completion/delivery time (ETA).
     */
    public LocalDateTime getEstimatedDeliveryTime() {
        String target = getTargetDeliveryTime();
        if (target != null && orderDate != null) {
            try {
                String[] parts = target.split(":");
                int hour = Integer.parseInt(parts[0].trim());
                int min = Integer.parseInt(parts[1].trim());
                return orderDate.atTime(hour, min);
            } catch (Exception ignored) {
            }
        }
        if (createdAt != null) {
            return createdAt.plusMinutes(getLeadTimeMinutes());
        }
        return null;
    }

    /**
     * Human-readable ETA window (e.g. "15 - 25 phút" or "30 - 45 phút").
     */
    public String getEtaWindow() {
        return isVillaDelivery() ? "30 - 45 phút" : "15 - 25 phút";
    }
}
