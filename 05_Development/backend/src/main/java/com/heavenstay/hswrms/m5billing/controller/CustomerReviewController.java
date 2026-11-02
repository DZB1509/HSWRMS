package com.heavenstay.hswrms.m5billing.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m5billing.dto.CustomerReviewRequestDTO;
import com.heavenstay.hswrms.m5billing.dto.CustomerReviewResponseDTO;
import com.heavenstay.hswrms.m5billing.security.BillingAccessEvaluator;
import com.heavenstay.hswrms.m5billing.service.ReviewService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customer/reviews")
public class CustomerReviewController {

    private final ReviewService reviewService;
    private final BillingAccessEvaluator billingAccess;

    public CustomerReviewController(ReviewService reviewService, BillingAccessEvaluator billingAccess) {
        this.reviewService = reviewService;
        this.billingAccess = billingAccess;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerReviewResponseDTO>> submitReview(
            @Valid @RequestBody CustomerReviewRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null && userDetails.getUserId() != null ? userDetails.getUserId().longValue() : null;
        CustomerReviewResponseDTO response = reviewService.submitReview(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Review submitted successfully", response));
    }

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessBooking(#bookingId, authentication)")
    public ResponseEntity<ApiResponse<CustomerReviewResponseDTO>> getReviewByBookingId(
            @PathVariable("bookingId") Long bookingId,
            Authentication authentication) {
        Long customerUserId = billingAccess.isStaff(authentication)
                ? null
                : BillingAccessEvaluator.customerUserId(authentication);
        CustomerReviewResponseDTO response = reviewService.getReviewByBookingId(bookingId, customerUserId);
        return ResponseEntity.ok(ApiResponse.ok("Review retrieved successfully", response));
    }
}
