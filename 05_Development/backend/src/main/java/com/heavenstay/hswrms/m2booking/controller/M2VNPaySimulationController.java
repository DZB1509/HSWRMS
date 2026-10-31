package com.heavenstay.hswrms.m2booking.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m2booking.service.VNPayDepositService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Dev/Test only controller for M2 booking deposit sandbox payment simulation.
 * Isolated via @Profile({"dev", "local", "test"}) so it is never registered in production.
 * When app.vnpay.sandbox-simulation is false, returns 400 Bad Request.
 */
@RestController
@Profile({"dev", "local", "test"})
@PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
public class M2VNPaySimulationController {

    private final VNPayDepositService vnPayDepositService;
    private final boolean simulationEnabled;

    public M2VNPaySimulationController(
            VNPayDepositService vnPayDepositService,
            @Value("${app.vnpay.sandbox-simulation:false}") boolean simulationEnabled) {
        this.vnPayDepositService = vnPayDepositService;
        this.simulationEnabled = simulationEnabled;
    }

    @PostMapping("/api/v1/payments/simulate-sandbox")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> simulateSandboxPayment(
            @RequestParam String txnRef,
            @RequestParam BigDecimal amount,
            @RequestParam(defaultValue = "00") String responseCode) {
        if (!simulationEnabled) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("400 Bad Request: Simulation is disabled. Real transactions must be processed via VNPay Gateway."));
        }
        Map<String, String> signedParams = vnPayDepositService.createSignedCallbackParams(txnRef, amount, responseCode);
        Map<String, String> result = vnPayDepositService.processIpn(signedParams);
        return ResponseEntity.ok(ApiResponse.ok("Sandbox payment simulation completed", result));
    }

    @PostMapping("/api/v1/customer/bookings/vnpay/simulate-sandbox-payment")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> simulateBookingSandboxPayment(
            @RequestParam String txnRef,
            @RequestParam BigDecimal amount,
            @RequestParam(defaultValue = "00") String responseCode) {
        if (!simulationEnabled) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("400 Bad Request: Simulation is disabled. Real transactions must be processed via VNPay Gateway."));
        }
        Map<String, String> signedParams = vnPayDepositService.createSignedCallbackParams(txnRef, amount, responseCode);
        Map<String, String> result = vnPayDepositService.processIpn(signedParams);
        return ResponseEntity.ok(ApiResponse.ok("Sandbox payment simulation completed", result));
    }
}
