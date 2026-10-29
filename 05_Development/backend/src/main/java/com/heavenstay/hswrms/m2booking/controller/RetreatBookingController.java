package com.heavenstay.hswrms.m2booking.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
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

import java.math.BigDecimal;
import java.util.HashMap;
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
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        BookingSummaryResponse response = bookingService.createBooking(request, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Retreat booking draft created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingSummaryResponse>>> getCustomerBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<BookingSummaryResponse> list = bookingService.getCustomerBookings(userDetails);
        return ResponseEntity.ok(ApiResponse.ok("Customer bookings retrieved successfully", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> getBookingDetail(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        BookingSummaryResponse response = bookingService.getBookingDetail(id, userDetails);
        return ResponseEntity.ok(ApiResponse.ok("Booking details retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> updateBooking(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateBookingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer resolvedCustomerId = isStaffOrAdmin(userDetails) ? null : bookingService.resolveCustomerProfileId(userDetails);
        Integer actorUserId = userDetails != null ? userDetails.getUserId() : null;
        BookingSummaryResponse response = bookingService.updateBooking(id, request, resolvedCustomerId, actorUserId);
        return ResponseEntity.ok(ApiResponse.ok("Booking modified successfully", response));
    }

    @PostMapping("/{id}/vnpay-url")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateVNPayDepositUrl(
            @PathVariable Integer id,
            @RequestParam(required = false) String returnUrl,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest request) {
        String paymentUrl = vnPayDepositService.generateDepositUrl(id, returnUrl, request, userDetails);
        Map<String, String> data = new HashMap<>();
        data.put("paymentUrl", paymentUrl);
        return ResponseEntity.ok(ApiResponse.ok("VNPay payment URL generated successfully", data));
    }

    @PostMapping("/vnpay/simulate-sandbox-payment")
    public ResponseEntity<ApiResponse<Map<String, String>>> simulateSandboxPayment(
            @RequestParam String txnRef,
            @RequestParam BigDecimal amount,
            @RequestParam(defaultValue = "00") String responseCode) {
        Map<String, String> signedParams = vnPayDepositService.createSignedCallbackParams(txnRef, amount, responseCode);
        Map<String, String> result = vnPayDepositService.processIpn(signedParams);
        return ResponseEntity.ok(ApiResponse.ok("Sandbox payment simulation completed", result));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> cancelBooking(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        BookingSummaryResponse response = bookingService.cancelBooking(id, userDetails);
        return ResponseEntity.ok(ApiResponse.ok("Booking cancelled successfully", response));
    }

    private boolean isStaffOrAdmin(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getAuthorities() == null) return false;
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_RECEPTIONIST")
                            || a.getAuthority().equalsIgnoreCase("ROLE_ADMIN")
                            || a.getAuthority().equalsIgnoreCase("ROLE_MANAGER"));
    }
}
