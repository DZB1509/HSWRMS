package com.heavenstay.hswrms.m2booking.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m2booking.dto.BookingSummaryResponse;
import com.heavenstay.hswrms.m2booking.dto.CreateBookingRequest;
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
        Integer resolvedCustomerId = resolveCustomerId(userDetails, customerId);
        BookingSummaryResponse response = bookingService.createBooking(request, resolvedCustomerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Retreat booking draft created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingSummaryResponse>>> getCustomerBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer customerId) {
        Integer resolvedCustomerId = resolveCustomerId(userDetails, customerId);
        List<BookingSummaryResponse> list = bookingService.getCustomerBookings(resolvedCustomerId);
        return ResponseEntity.ok(ApiResponse.ok("Customer bookings retrieved successfully", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> getBookingDetail(@PathVariable Integer id) {
        BookingSummaryResponse response = bookingService.getBookingDetail(id);
        return ResponseEntity.ok(ApiResponse.ok("Booking details retrieved successfully", response));
    }

    @PostMapping("/{id}/vnpay-url")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateVNPayDepositUrl(
            @PathVariable Integer id,
            @RequestParam(required = false) String returnUrl,
            HttpServletRequest request) {
        String paymentUrl = vnPayDepositService.generateDepositUrl(id, returnUrl, request);
        return ResponseEntity.ok(ApiResponse.ok("VNPay payment URL generated successfully",
                Collections.singletonMap("paymentUrl", paymentUrl)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> cancelBooking(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer customerId) {
        Integer resolvedCustomerId = resolveCustomerId(userDetails, customerId);
        BookingSummaryResponse response = bookingService.cancelBooking(id, resolvedCustomerId);
        return ResponseEntity.ok(ApiResponse.ok("Booking cancelled successfully", response));
    }

    private Integer resolveCustomerId(CustomUserDetails userDetails, Integer customerIdParam) {
        if (userDetails != null && userDetails.getUserId() != null) {
            return userDetails.getUserId();
        }
        return (customerIdParam != null) ? customerIdParam : 1;
    }
}
