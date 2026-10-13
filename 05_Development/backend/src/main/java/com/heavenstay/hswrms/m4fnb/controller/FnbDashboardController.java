package com.heavenstay.hswrms.m4fnb.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.FnbDashboardResponse;
import com.heavenstay.hswrms.m4fnb.service.FnbDashboardService;
import java.time.LocalDate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 25010 MAINTAINABILITY & TRACEABILITY STANDARD]
// ----------------------------------------------------------------------------
// Requirements Ref   : UC19 / UC20 / BF-04 (Fulfill Meal Orders & Dietary F&B Management)
// Business Rule Ref  : BR-FNB-02 (Kitchen Preparation & Allergy Minimization)
// Database Entity    : INGREDIENT, INGREDIENT_BATCH, MENU_ITEM_INGREDIENT, MEAL_ORDER
// Compliance Standard: Nghị định 13/2023/NĐ-CP & 356/2025/NĐ-CP (Personal Data Protection PII)
// Architecture Layer : CONTROLLER LAYER -> REST API Endpoints
// International Standard: Oracle Java Code Conventions & Google Java Style Guide
// ============================================================================
@RestController
@RequestMapping("/api/v1/fnb/dashboard")
@PreAuthorize("hasAuthority('ROLE_F&B STAFF')")
public class FnbDashboardController {
    private final FnbDashboardService dashboardService;

    public FnbDashboardController(FnbDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<FnbDashboardResponse>> getDashboard(
            @RequestParam(required = false) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getDashboard(date == null ? LocalDate.now() : date)));
    }
}
