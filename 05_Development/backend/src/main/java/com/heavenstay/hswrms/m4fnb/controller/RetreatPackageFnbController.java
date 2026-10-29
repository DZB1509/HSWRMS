package com.heavenstay.hswrms.m4fnb.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.RetreatPackageFnbPlanResponse;
import com.heavenstay.hswrms.m4fnb.integration.BookingContextPort;
import com.heavenstay.hswrms.m4fnb.service.RetreatPackageFnbService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * ============================================================================
 * [TRACEABILITY HEADER]
 * Module: M4 - Food & Beverage Management (F&B)
 * Requirements: SR-FNB-001, US-FNB-003, BR-FNB-002, BR-FNB-004
 * Design Pattern: RESTful API / MVC Controller
 * Compliance: Decree 13/2023 & 356/2025/ND-CP (Sensitive Health Data Minimization)
 * Description: Controller exposing official Retreat Package F&B Plans and cross-module
 *              dietary safety guidelines to Guests and Resort Operations.
 * ============================================================================
 */
@RestController
@RequestMapping("/api/v1/fnb/packages")
public class RetreatPackageFnbController {

    private final RetreatPackageFnbService packageFnbService;
    private final ObjectProvider<BookingContextPort> bookingContextPortProvider;

    public RetreatPackageFnbController(
            RetreatPackageFnbService packageFnbService,
            ObjectProvider<BookingContextPort> bookingContextPortProvider) {
        this.packageFnbService = packageFnbService;
        this.bookingContextPortProvider = bookingContextPortProvider;
    }

    /**
     * Lists all 8 official Retreat Package F&B Plans (Public & Authenticated).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<RetreatPackageFnbPlanResponse>>> getAllPackagePlans() {
        return ResponseEntity.ok(ApiResponse.ok(packageFnbService.getAllPackagePlans()));
    }

    /**
     * Retrieves specific Retreat Package F&B Plan by package code (Public & Authenticated).
     */
    @GetMapping("/{packageCode}")
    public ResponseEntity<ApiResponse<RetreatPackageFnbPlanResponse>> getPackagePlan(
            @PathVariable String packageCode) {
        return ResponseEntity.ok(ApiResponse.ok(packageFnbService.getPackagePlan(packageCode)));
    }

    /**
     * Retrieves the package F&B plan linked to the active booking of the currently authenticated customer.
     */
    @GetMapping("/active-booking")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<RetreatPackageFnbPlanResponse>> getActiveBookingPlan(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestParam(required = false) Integer bookingId) {
        BookingContextPort port = bookingContextPortProvider.getIfAvailable();
        Integer resolvedBookingId = bookingId;
        if (resolvedBookingId == null && port != null) {
            resolvedBookingId = port.requireOwnedCustomerBooking(currentUser.getUserId(), 1).bookingId();
        }
        return ResponseEntity.ok(ApiResponse.ok(packageFnbService.getPlanForBooking(resolvedBookingId)));
    }

    /**
     * Verifies if a food item violates the culinary safety guidelines of a given package.
     */
    @GetMapping("/{packageCode}/safety-check")
    @PreAuthorize("hasAnyAuthority('ROLE_CUSTOMER','ROLE_F&B STAFF','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<String>>> checkDishSafety(
            @PathVariable String packageCode,
            @RequestParam String itemName,
            @RequestParam(required = false) String allergenInfo) {
        List<String> violations = packageFnbService.validatePackageSafetyViolations(
                packageCode, itemName, allergenInfo, List.of());
        return ResponseEntity.ok(ApiResponse.ok(violations));
    }
}
