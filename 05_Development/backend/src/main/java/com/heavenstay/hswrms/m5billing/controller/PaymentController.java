package com.heavenstay.hswrms.m5billing.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m5billing.dto.PaymentResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.VnpayCreatePaymentRequest;
import com.heavenstay.hswrms.m5billing.dto.VnpayPaymentUrlResponse;
import com.heavenstay.hswrms.m5billing.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Production-ready M5 VNPay payment endpoints (screen S42).
 * Dev/test simulation endpoints are isolated in VNPaySimulationController.
 */
@RestController
public class PaymentController {

    private final VNPayService vnPayService;

    public PaymentController(VNPayService vnPayService) {
        this.vnPayService = vnPayService;
    }

    @PostMapping("/api/v1/payments/vnpay/create-payment-url")
    public ResponseEntity<ApiResponse<VnpayPaymentUrlResponse>> createPaymentUrl(
            @RequestBody VnpayCreatePaymentRequest request, HttpServletRequest http) {
        String clientIp = http.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isBlank()) {
            clientIp = http.getRemoteAddr();
        } else if (clientIp.contains(",")) {
            clientIp = clientIp.split(",")[0].trim();
        }
        VnpayPaymentUrlResponse res = vnPayService.createPaymentUrl(request, clientIp);
        return ResponseEntity.ok(ApiResponse.ok("VNPay payment URL created", res));
    }

    /** Called by the frontend return page: verifies the signed redirect params and settles (idempotent). */
    @GetMapping("/api/v1/payments/vnpay/verify-return")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyReturn(@RequestParam Map<String, String> params) {
        Map<String, String> result = vnPayService.processCallback(params);
        boolean ok = "00".equals(result.get("RspCode")) && "00".equals(params.get("vnp_ResponseCode"));
        return ResponseEntity.ok(new ApiResponse<>(ok, ok ? "Payment verified" : "Payment failed or invalid: " + result.get("Message"), result));
    }

    @GetMapping("/api/v1/payments/status/{transactionRef}")
    public ResponseEntity<ApiResponse<PaymentResponseDTO>> status(@PathVariable String transactionRef) {
        return ResponseEntity.ok(ApiResponse.ok("Transaction status", vnPayService.getStatusByReference(transactionRef)));
    }

    @GetMapping("/api/v1/invoices/{invoiceId}/payment-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> invoicePaymentStatus(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(ApiResponse.ok("Invoice payment status", vnPayService.getInvoicePaymentStatus(invoiceId)));
    }
}
