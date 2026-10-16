package com.heavenstay.hswrms.m4fnb.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateMealOrderRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.UpdateOrderStatusRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.KitchenOrderResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.MealOrderResponse;
import com.heavenstay.hswrms.m4fnb.service.MealOrderService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/fnb/orders")
public class MealOrderController {
    private final MealOrderService mealOrderService;

    public MealOrderController(MealOrderService mealOrderService) {
        this.mealOrderService = mealOrderService;
    }

    @PostMapping("/daily-meals")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<MealOrderResponse>> placeDailyMealOrder(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CreateMealOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("MEAL_ORDER_CREATED",
                mealOrderService.placeDailyMealOrder(currentUser.getUserId(), request)));
    }

    @PostMapping("/ala-carte")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<MealOrderResponse>> placeAlaCarteOrder(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CreateMealOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("ALA_CARTE_ORDER_CREATED",
                mealOrderService.placeAlaCarteOrder(currentUser.getUserId(), request)));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<List<MealOrderResponse>>> getMyOrders(
            @AuthenticationPrincipal CustomUserDetails currentUser, @RequestParam Integer bookingId) {
        return ResponseEntity.ok(ApiResponse.ok(mealOrderService.listCustomerOrders(currentUser.getUserId(), bookingId)));
    }

    @GetMapping("/mine/{orderId}")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<MealOrderResponse>> getMyOrder(
            @AuthenticationPrincipal CustomUserDetails currentUser, @PathVariable Integer orderId) {
        return ResponseEntity.ok(ApiResponse.ok(mealOrderService.getCustomerOrder(currentUser.getUserId(), orderId)));
    }

    @PutMapping("/mine/{orderId}/daily-meal")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<MealOrderResponse>> updateDailyMealSelection(
            @AuthenticationPrincipal CustomUserDetails currentUser, @PathVariable Integer orderId,
            @Valid @RequestBody CreateMealOrderRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("MEAL_SELECTION_UPDATED",
                mealOrderService.updateDailyMealSelection(currentUser.getUserId(), orderId, request)));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_F&B STAFF','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<KitchenOrderResponse>>> getKitchenOrders(
            @RequestParam(required = false) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(mealOrderService.listKitchenOrders(date)));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyAuthority('ROLE_F&B STAFF','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<KitchenOrderResponse>> getKitchenOrder(@PathVariable Integer orderId) {
        return ResponseEntity.ok(ApiResponse.ok(mealOrderService.getKitchenOrder(orderId)));
    }

    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasAuthority('ROLE_F&B STAFF')")
    public ResponseEntity<ApiResponse<KitchenOrderResponse>> updateOrderStatus(
            @PathVariable Integer orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("ORDER_STATUS_UPDATED",
                mealOrderService.updateStatus(orderId, request.status())));
    }

    @PatchMapping("/{orderId}/items/{orderLineId}/preparation-status")
    @PreAuthorize("hasAuthority('ROLE_F&B STAFF')")
    public ResponseEntity<ApiResponse<KitchenOrderResponse>> updateOrderLinePreparationStatus(
            @PathVariable Integer orderId, @PathVariable Integer orderLineId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("ORDER_LINE_PREPARATION_STATUS_UPDATED",
                mealOrderService.updateItemPreparationStatus(orderId, orderLineId, request.status())));
    }
}
