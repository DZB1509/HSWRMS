package com.heavenstay.hswrms.m4fnb.dto.response;

import com.heavenstay.hswrms.m4fnb.entity.InventoryConsumptionStatus;
import java.time.LocalDateTime;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 25010 MAINTAINABILITY & TRACEABILITY STANDARD]
// ----------------------------------------------------------------------------
// Requirements Ref   : UC19 / UC20 / BF-04 (Fulfill Meal Orders & Dietary F&B Management)
// Business Rule Ref  : BR-FNB-02 (Kitchen Preparation & FEFO Inventory Consumption)
// Architectural Layer: DTO / SERVICE MODEL
// International Std  : Oracle Java Code Conventions & Google Java Style Guide
// ============================================================================
public record InventoryConsumptionRecord(
        InventoryConsumptionStatus status,
        String message,
        LocalDateTime processedAt
) {
    public static InventoryConsumptionRecord pending() {
        return new InventoryConsumptionRecord(InventoryConsumptionStatus.PENDING, "Pending inventory processing", null);
    }
}
