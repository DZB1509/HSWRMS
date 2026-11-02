package com.heavenstay.hswrms.m4fnb.dto.response;

import java.util.List;

/**
 * ============================================================================
 * [TRACEABILITY HEADER]
 * Module: M4 - Food & Beverage Management (F&B)
 * Requirements: SR-FNB-001, US-FNB-003, BR-FNB-002
 * Design Pattern: Domain-Driven Design / DTO Projection
 * Compliance: Decree 13/2023/ND-CP & Decree 356/2025/ND-CP (Sensitive Health Data Minimization)
 * Description: Data transfer representation of an official Retreat Package F&B Plan.
 * ============================================================================
 */
public record RetreatPackageFnbPlanResponse(
        String packageCode,
        String packageName,
        Integer durationNights,
        String wellnessGoal,
        String dietaryRegimen,
        String caloricTarget,
        Integer breakfastCount,
        Integer lunchCount,
        Integer dinnerCount,
        String mealQuotaSummary,
        String beverageAndHydrationPlan,
        List<String> keyIngredients,
        List<String> safetyGuidelines,
        List<String> contraindications,
        List<String> recommendedDishKeywords
) { }
