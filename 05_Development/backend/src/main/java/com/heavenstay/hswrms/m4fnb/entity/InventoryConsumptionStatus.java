package com.heavenstay.hswrms.m4fnb.entity;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 25010 MAINTAINABILITY & TRACEABILITY STANDARD]
// ----------------------------------------------------------------------------
// Requirements Ref   : UC19 / UC20 / BF-04 (Fulfill Meal Orders & Dietary F&B Management)
// Business Rule Ref  : BR-FNB-02 (Kitchen Preparation & FEFO Inventory Consumption)
// Architectural Layer: DOMAIN MODEL -> Enumeration
// International Std  : Oracle Java Code Conventions & Google Java Style Guide
// ============================================================================
public enum InventoryConsumptionStatus {
    PENDING,
    CONSUMED,
    NOT_CONFIGURED,
    INSUFFICIENT_STOCK,
    FAILED
}
