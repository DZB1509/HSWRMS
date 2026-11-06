package com.heavenstay.hswrms.m4fnb.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * ============================================================================
 * [TRACEABILITY HEADER]
 * Module: M4 - Food & Beverage Management (F&B)
 * Requirements: SR-FNB-001, US-FNB-003, BR-FNB-001, BR-FNB-002
 * Design Pattern: DTO / Kitchen Projection
 * Compliance: Decree 13/2023 & 356/2025/ND-CP (Sensitive Health Data Minimization)
 * Description: Kitchen order queue projection containing guest dietary information,
 *              allergies, retreat package context, and independent inventory status.
 * ============================================================================
 */
public record KitchenOrderResponse(
        Integer id,
        Integer bookingId,
        String guestFirstName,
        String villaNumber,
        LocalDate orderDate,
        String mealType,
        String orderType,
        String status,
        String specialNotes,
        boolean dietaryProfileAvailable,
        List<String> allergies,
        List<String> dietaryPreferences,
        List<KitchenOrderLineResponse> items,
        String packageCode,
        String packageName,
        String dietaryVerificationStatus,
        String locationVerificationStatus,
        String folioPostingStatus,
        String inventoryStatus,
        LocalDateTime createdAt
) {
    public KitchenOrderResponse {
        dietaryVerificationStatus = dietaryVerificationStatus == null ? (dietaryProfileAvailable ? "VERIFIED" : "UNVERIFIED") : dietaryVerificationStatus;
        locationVerificationStatus = locationVerificationStatus == null ? "VERIFIED_VILLA" : locationVerificationStatus;
        folioPostingStatus = folioPostingStatus == null
                ? ("A_LA_CARTE".equalsIgnoreCase(orderType) ? "PENDING_RECONCILIATION" : "NOT_APPLICABLE")
                : folioPostingStatus;
        inventoryStatus = inventoryStatus == null ? "PENDING" : inventoryStatus;
    }

    /**
     * Backward-compatible 19-parameter constructor.
     */
    public KitchenOrderResponse(
            Integer id,
            Integer bookingId,
            String guestFirstName,
            String villaNumber,
            LocalDate orderDate,
            String mealType,
            String orderType,
            String status,
            String specialNotes,
            boolean dietaryProfileAvailable,
            List<String> allergies,
            List<String> dietaryPreferences,
            List<KitchenOrderLineResponse> items,
            String packageCode,
            String packageName,
            String dietaryVerificationStatus,
            String locationVerificationStatus,
            String folioPostingStatus,
            String inventoryStatus
    ) {
        this(id, bookingId, guestFirstName, villaNumber, orderDate, mealType, orderType,
                status, specialNotes, dietaryProfileAvailable, allergies, dietaryPreferences,
                items, packageCode, packageName,
                dietaryVerificationStatus, locationVerificationStatus, folioPostingStatus, inventoryStatus, null);
    }

    /**
     * Backward-compatible 18-parameter constructor.
     */
    public KitchenOrderResponse(
            Integer id,
            Integer bookingId,
            String guestFirstName,
            String villaNumber,
            LocalDate orderDate,
            String mealType,
            String orderType,
            String status,
            String specialNotes,
            boolean dietaryProfileAvailable,
            List<String> allergies,
            List<String> dietaryPreferences,
            List<KitchenOrderLineResponse> items,
            String packageCode,
            String packageName,
            String dietaryVerificationStatus,
            String locationVerificationStatus,
            String folioPostingStatus
    ) {
        this(id, bookingId, guestFirstName, villaNumber, orderDate, mealType, orderType,
                status, specialNotes, dietaryProfileAvailable, allergies, dietaryPreferences,
                items, packageCode, packageName,
                dietaryVerificationStatus, locationVerificationStatus, folioPostingStatus, "PENDING");
    }

    /**
     * Backward-compatible 15-parameter constructor.
     */
    public KitchenOrderResponse(
            Integer id,
            Integer bookingId,
            String guestFirstName,
            String villaNumber,
            LocalDate orderDate,
            String mealType,
            String orderType,
            String status,
            String specialNotes,
            boolean dietaryProfileAvailable,
            List<String> allergies,
            List<String> dietaryPreferences,
            List<KitchenOrderLineResponse> items,
            String packageCode,
            String packageName
    ) {
        this(id, bookingId, guestFirstName, villaNumber, orderDate, mealType, orderType,
                status, specialNotes, dietaryProfileAvailable, allergies, dietaryPreferences,
                items, packageCode, packageName,
                dietaryProfileAvailable ? "VERIFIED" : "UNVERIFIED",
                "VERIFIED_VILLA",
                "A_LA_CARTE".equalsIgnoreCase(orderType) ? "PENDING_RECONCILIATION" : "NOT_APPLICABLE",
                "PENDING");
    }

    /**
     * Backward-compatible 13-parameter constructor for existing callers and test fixtures.
     */
    public KitchenOrderResponse(
            Integer id,
            Integer bookingId,
            String guestFirstName,
            String villaNumber,
            LocalDate orderDate,
            String mealType,
            String orderType,
            String status,
            String specialNotes,
            boolean dietaryProfileAvailable,
            List<String> allergies,
            List<String> dietaryPreferences,
            List<KitchenOrderLineResponse> items
    ) {
        this(id, bookingId, guestFirstName, villaNumber, orderDate, mealType, orderType,
                status, specialNotes, dietaryProfileAvailable, allergies, dietaryPreferences,
                items, null, null);
    }

    /**
     * Determines whether this order requires In-Villa Dining delivery (Amanoi luxury retreat standard).
     * In-Villa delivery requires thermal cloche covers and electric buggy dispatch.
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
     * Resolved operational service location (DINING_PAVILION by default, or IN_VILLA).
     */
    public String getServiceLocation() {
        return isVillaDelivery() ? "IN_VILLA" : "DINING_PAVILION";
    }

    public String serviceLocation() {
        return getServiceLocation();
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
     * Human-readable ETA window (e.g. "15 - 25 phút" or "30 - 45 phút").
     */
    public String getEtaWindow() {
        return isVillaDelivery() ? "30 - 45 phút" : "15 - 25 phút";
    }
}
