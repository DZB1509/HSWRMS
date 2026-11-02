package com.heavenstay.hswrms.m4fnb.entity;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 25010 MAINTAINABILITY & TRACEABILITY STANDARD]
// ----------------------------------------------------------------------------
// Requirements Ref   : UC19 / UC20 / BF-04 (Fulfill Meal Orders & Dietary F&B Management)
// Business Rule Ref  : BR-FNB-02 (Kitchen Preparation & Allergy Minimization)
// Database Entity    : MEAL_ORDER_ITEM (Column: preparation_status)
// Compliance Standard: Nghị định 13/2023/NĐ-CP & 356/2025/NĐ-CP (Personal Data Protection PII)
// Architecture Layer : MODEL LAYER -> Entity / Enumeration
// International Standard: Oracle Java Code Conventions & Google Java Style Guide
// ============================================================================
public enum MealOrderItemPreparationStatus {
    PENDING,
    PREPARING,
    READY
}
