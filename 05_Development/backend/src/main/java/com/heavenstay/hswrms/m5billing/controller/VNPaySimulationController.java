package com.heavenstay.hswrms.m5billing.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m5billing.service.VNPayService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Dev/Test only controller for VNPay sandbox payment simulation (S42 mock buttons).
 * Isolated via @Profile({"dev", "local", "test"}) so it is never registered in production.
 * When app.vnpay.sandbox-simulation is false, returns 400 Bad Request.
 */
@RestController
@Profile({"dev", "local", "test"})
@PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
public class VNPaySimulationController {

    private final VNPayService vnPayService;
    private final boolean simulationEnabled;

    public VNPaySimulationController(
            VNPayService vnPayService,
            @Value("${app.vnpay.sandbox-simulation:false}") boolean simulationEnabled) {
        this.vnPayService = vnPayService;
        this.simulationEnabled = simulationEnabled;
    }

    /** Sandbox demo control: returns 400 Bad Request when simulation mode is disabled. */
    @PostMapping("/api/v1/payments/vnpay/simulate")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> simulate(
            @RequestParam String transactionRef, @RequestParam(defaultValue = "SUCCESS") String outcome) {
        if (!simulationEnabled) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("400 Bad Request: Simulation is disabled. Real transactions must be processed via VNPay Gateway or VietQR."));
        }
        return ResponseEntity.ok(ApiResponse.ok("Simulated VNPay callback processed", vnPayService.simulateCallback(transactionRef, outcome)));
    }
}
