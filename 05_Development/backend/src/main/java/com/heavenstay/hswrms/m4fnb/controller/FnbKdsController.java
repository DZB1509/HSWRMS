package com.heavenstay.hswrms.m4fnb.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m4fnb.dto.CancelOrderRequest;
import com.heavenstay.hswrms.m4fnb.dto.KdsDashboardKpiDto;
import com.heavenstay.hswrms.m4fnb.dto.MealOrderDto;
import com.heavenstay.hswrms.m4fnb.dto.MealPrepEntryDto;
import com.heavenstay.hswrms.m4fnb.dto.UpdateOrderStatusRequest;
import com.heavenstay.hswrms.m4fnb.service.MealOrderService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller for Kitchen Display System (KDS) and F&B staff operations.
 * Protected by S39 authorization and FNB_STAFF/MANAGER/ADMIN roles.
 */
@RestController
@RequestMapping("/api/v1/fnb/kds")
public class FnbKdsController {

    private final MealOrderService mealOrderService;

    public FnbKdsController(MealOrderService mealOrderService) {
        this.mealOrderService = mealOrderService;
    }

    /**
     * Screen 38: F&B Kitchen Dashboard KPIs.
     */
    @GetMapping("/dashboard-kpis")
    @PreAuthorize("@perm.has('S38','V') or @perm.has('S39','V') or hasAnyRole('FNB_STAFF','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<KdsDashboardKpiDto>> getDashboardKpis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        KdsDashboardKpiDto kpis = mealOrderService.getDashboardKpis(date);
        return ResponseEntity.ok(ApiResponse.ok("KDS dashboard KPIs retrieved successfully.", kpis));
    }

    /**
     * Screen 39: Daily Meal Prep Queue & Active Kitchen Queue.
     */
    @GetMapping("/queue")
    @PreAuthorize("@perm.has('S39','V') or hasAnyRole('FNB_STAFF','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<List<MealPrepEntryDto>>> getQueue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false, defaultValue = "all") String type,
            @RequestParam(required = false, defaultValue = "active") String status,
            @RequestParam(required = false) Boolean dietaryOnly,
            @RequestParam(required = false) String search
    ) {
        List<MealPrepEntryDto> queue = mealOrderService.getKitchenPrepQueue(date, type, status, dietaryOnly, search);
        return ResponseEntity.ok(ApiResponse.ok("Kitchen prep queue retrieved successfully.", queue));
    }

    /**
     * Screen 39: Order Detail with minimal sensitive data projection.
     */
    @GetMapping("/orders/{id}")
    @PreAuthorize("@perm.has('S39','V') or hasAnyRole('FNB_STAFF','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<MealPrepEntryDto>> getOrderDetails(@PathVariable("id") Long id) {
        MealPrepEntryDto order = mealOrderService.getOrderDetails(id);
        return ResponseEntity.ok(ApiResponse.ok("Order details retrieved successfully.", order));
    }

    /**
     * Transition order status (PENDING -> PREPARING -> READY -> DELIVERED).
     */
    @PatchMapping("/orders/{id}/status")
    @PreAuthorize("@perm.has('S39','U') or hasAnyRole('FNB_STAFF','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<MealOrderDto>> updateOrderStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        MealOrderDto updated = mealOrderService.updateOrderStatus(id, request, userId, true);
        return ResponseEntity.ok(ApiResponse.ok("Order status updated successfully.", updated));
    }

    /**
     * Cancel an active order by kitchen staff (reason required if PREPARING or READY).
     */
    @PostMapping("/orders/{id}/cancel")
    @PreAuthorize("@perm.has('S39','U') or hasAnyRole('FNB_STAFF','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<MealOrderDto>> cancelOrder(
            @PathVariable("id") Long id,
            @RequestBody(required = false) CancelOrderRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        String reason = request != null ? request.getCancellationReason() : null;
        MealOrderDto cancelled = mealOrderService.cancelOrder(id, reason, userId, true);
        return ResponseEntity.ok(ApiResponse.ok("Order cancelled successfully.", cancelled));
    }
}
