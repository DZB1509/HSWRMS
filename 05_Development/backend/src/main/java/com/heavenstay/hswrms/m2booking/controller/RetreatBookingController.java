package com.heavenstay.hswrms.m2booking.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m2booking.dto.BookingSummaryResponse;
import com.heavenstay.hswrms.m2booking.dto.CreateBookingRequest;
import com.heavenstay.hswrms.m2booking.dto.UpdateBookingRequest;
import com.heavenstay.hswrms.m2booking.service.RetreatBookingService;
import com.heavenstay.hswrms.m2booking.service.VNPayDepositService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/customer/bookings")
public class RetreatBookingController {

    private final RetreatBookingService bookingService;
    private final VNPayDepositService vnPayDepositService;

    public RetreatBookingController(RetreatBookingService bookingService,
                                    VNPayDepositService vnPayDepositService) {
        this.bookingService = bookingService;
        this.vnPayDepositService = vnPayDepositService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer customerId) {
        Integer resolvedCustomerId = resolveCustomerProfileId(userDetails, customerId);
        Integer actorUserId = userDetails != null ? userDetails.getUserId() : null;
        BookingSummaryResponse response = bookingService.createBooking(request, resolvedCustomerId, actorUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Retreat booking draft created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingSummaryResponse>>> getCustomerBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer customerId) {
        Integer resolvedCustomerId = resolveCustomerProfileId(userDetails, customerId);
        List<BookingSummaryResponse> list = bookingService.getCustomerBookings(resolvedCustomerId);
        return ResponseEntity.ok(ApiResponse.ok("Customer bookings retrieved successfully", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> getBookingDetail(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer customerId) {
        Integer resolvedCustomerId = isStaffOrAdmin(userDetails) ? null : resolveCustomerProfileId(userDetails, customerId);
        BookingSummaryResponse response = bookingService.getBookingDetail(id, resolvedCustomerId);
        return ResponseEntity.ok(ApiResponse.ok("Booking details retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> updateBooking(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateBookingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer customerId) {
        Integer resolvedCustomerId = isStaffOrAdmin(userDetails) ? null : resolveCustomerProfileId(userDetails, customerId);
        Integer actorUserId = userDetails != null ? userDetails.getUserId() : null;
        BookingSummaryResponse response = bookingService.updateBooking(id, request, resolvedCustomerId, actorUserId);
        return ResponseEntity.ok(ApiResponse.ok("Booking modified successfully", response));
    }

    @PostMapping("/{id}/vnpay-url")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateVNPayDepositUrl(
            @PathVariable Integer id,
            @RequestParam(required = false) String returnUrl,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer customerId,
            HttpServletRequest request) {
        Integer resolvedCustomerId = isStaffOrAdmin(userDetails) ? null : resolveCustomerProfileId(userDetails, customerId);
        // Verify ownership before issuing payment URL
        bookingService.getBookingDetail(id, resolvedCustomerId);

        String paymentUrl = vnPayDepositService.generateDepositUrl(id, returnUrl, request);
        return ResponseEntity.ok(ApiResponse.ok("VNPay payment URL generated successfully",
                Collections.singletonMap("paymentUrl", paymentUrl)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> cancelBooking(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer customerId) {
        Integer resolvedCustomerId = isStaffOrAdmin(userDetails) ? null : resolveCustomerProfileId(userDetails, customerId);
        Integer actorUserId = userDetails != null ? userDetails.getUserId() : null;
        BookingSummaryResponse response = bookingService.cancelBooking(id, resolvedCustomerId, actorUserId);
        return ResponseEntity.ok(ApiResponse.ok("Booking cancelled successfully", response));
    }

    private Integer resolveCustomerProfileId(CustomUserDetails userDetails, Integer customerIdParam) {
        if (userDetails != null && userDetails.getUserId() != null) {
            // Check if user is staff/receptionist/admin acting on behalf of a customerIdParam
            if (isStaffOrAdmin(userDetails) && customerIdParam != null) {
                return customerIdParam;
            }
            return bookingService.resolveCustomerProfileId(userDetails.getUserId());
        }
        if (customerIdParam != null) {
            return customerIdParam;
        }
        throw new BusinessRuleException("Unauthenticated: Please log in to perform this action");
    }

    private boolean isStaffOrAdmin(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getAuthorities() == null) return false;
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_RECEPTIONIST")
                            || a.getAuthority().equalsIgnoreCase("ROLE_ADMIN"));
    }
}
