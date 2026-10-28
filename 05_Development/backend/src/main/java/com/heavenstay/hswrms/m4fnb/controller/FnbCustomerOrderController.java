package com.heavenstay.hswrms.m4fnb.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m4fnb.dto.*;
import com.heavenstay.hswrms.m4fnb.service.MealOrderService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for Customer dining operations: menu browsing, daily meal selection,
 * and a-la-carte ordering.
 */
@RestController
@RequestMapping("/api/v1/fnb/customer")
public class FnbCustomerOrderController {

    private final MealOrderService mealOrderService;

    public FnbCustomerOrderController(MealOrderService mealOrderService) {
        this.mealOrderService = mealOrderService;
    }

    /**
     * Browse available menu items with dietary tags and allergens.
     */
    @GetMapping("/menu-items")
    public ResponseEntity<ApiResponse<List<MenuItemDto>>> getMenuItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String mealPeriod
    ) {
        List<MenuItemDto> items = mealOrderService.getAvailableMenuItems(category, mealPeriod);
        return ResponseEntity.ok(ApiResponse.ok("Menu items retrieved successfully.", items));
    }

    /**
     * Submit or update Daily Meal Selection for a retreat booking.
     */
    @PostMapping("/daily-meals")
    @PreAuthorize("hasRole('CUSTOMER') or hasAnyRole('RECEPTIONIST','ADMIN')")
    public ResponseEntity<ApiResponse<MealOrderDto>> createDailyMealOrder(
            @Valid @RequestBody CreateDailyMealRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        MealOrderDto order = mealOrderService.createDailyMealOrder(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Daily meal selection saved successfully.", order));
    }

    /**
     * Submit an extra A-la-carte dining order.
     */
    @PostMapping("/a-la-carte")
    @PreAuthorize("hasRole('CUSTOMER') or hasAnyRole('RECEPTIONIST','ADMIN')")
    public ResponseEntity<ApiResponse<MealOrderDto>> createAlaCarteOrder(
            @Valid @RequestBody CreateAlaCarteRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        MealOrderDto order = mealOrderService.createAlaCarteOrder(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("A-la-carte order placed successfully.", order));
    }

    /**
     * List dining orders for a given booking.
     */
    @GetMapping("/orders")
    @PreAuthorize("hasRole('CUSTOMER') or hasAnyRole('FNB_STAFF','RECEPTIONIST','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<List<MealOrderDto>>> getOrdersForBooking(
            @RequestParam Integer bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        boolean isStaff = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FNB_STAFF") ||
                        a.getAuthority().equals("ROLE_RECEPTIONIST") ||
                        a.getAuthority().equals("ROLE_MANAGER") ||
                        a.getAuthority().equals("ROLE_ADMIN"));
        List<MealOrderDto> orders = mealOrderService.getOrdersForBooking(bookingId, userId, isStaff);
        return ResponseEntity.ok(ApiResponse.ok("Orders retrieved successfully.", orders));
    }

    /**
     * Customer cancels an order (only permitted if still PENDING).
     */
    @PostMapping("/orders/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER') or hasAnyRole('RECEPTIONIST','ADMIN')")
    public ResponseEntity<ApiResponse<MealOrderDto>> cancelOrder(
            @PathVariable("id") Long id,
            @RequestBody(required = false) CancelOrderRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        String reason = request != null ? request.getCancellationReason() : "Customer cancelled";
        MealOrderDto cancelled = mealOrderService.cancelOrder(id, reason, userId, false);
        return ResponseEntity.ok(ApiResponse.ok("Order cancelled successfully.", cancelled));
    }
}
