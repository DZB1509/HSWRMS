package com.heavenstay.hswrms.m2booking.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m2booking.service.VNPayDepositService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
public class VNPayCallbackController {

    private final VNPayDepositService vnPayDepositService;

    public VNPayCallbackController(VNPayDepositService vnPayDepositService) {
        this.vnPayDepositService = vnPayDepositService;
    }

    /**
     * IPN Webhook endpoint invoked by VNPay payment server asynchronously.
     * Must return RspCode and Message as expected by VNPay standard specification.
     */
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> handleVNPayIpn(@RequestParam Map<String, String> allParams) {
        Map<String, String> result = vnPayDepositService.processIpn(allParams);
        return ResponseEntity.ok(result);
    }

    /**
     * Return URL endpoint for verification when customer is redirected back from VNPay.
     */
    @GetMapping("/vnpay-return")
    public ResponseEntity<ApiResponse<Map<String, String>>> handleVNPayReturn(@RequestParam Map<String, String> allParams) {
        Map<String, String> result = vnPayDepositService.processIpn(allParams);
        boolean isSuccess = "00".equals(result.get("RspCode"));
        String message = isSuccess ? "Payment verified successfully" : result.get("Message");
        return ResponseEntity.ok(new ApiResponse<>(isSuccess, message, allParams));
    }
}
