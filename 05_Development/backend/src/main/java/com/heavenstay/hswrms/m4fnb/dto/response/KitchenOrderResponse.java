package com.heavenstay.hswrms.m4fnb.dto.response;

import java.time.LocalDate;
import java.util.List;

/**
 * ============================================================================
 * [TRACEABILITY HEADER]
 * Module: M4 - Food & Beverage Management (F&B)
 * Requirements: SR-FNB-001, US-FNB-003, BR-FNB-001, BR-FNB-002
 * Design Pattern: DTO / Kitchen Projection
 * Compliance: Decree 13/2023 & 356/2025/ND-CP (Sensitive Health Data Minimization)
 * Description: Kitchen order queue projection containing guest dietary information,
 *              allergies, and retreat package context for food preparation.
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
        String packageName
) {
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
}
