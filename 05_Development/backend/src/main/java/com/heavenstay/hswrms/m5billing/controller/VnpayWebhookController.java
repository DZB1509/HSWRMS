package com.heavenstay.hswrms.m5billing.controller;

import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.m5billing.service.CheckoutService;
import com.heavenstay.hswrms.m5billing.service.VNPayService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/v1/commerce/payment/webhook")
public class VnpayWebhookController {

    private static final Logger log = LoggerFactory.getLogger(VnpayWebhookController.class);

    private final CheckoutService checkoutService;
    private final VNPayService vnPayService;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final String hashSecret;
    private final String vietQrWebhookSecret;

    public VnpayWebhookController(CheckoutService checkoutService,
                                  VNPayService vnPayService,
                                  PaymentTransactionRepository paymentTransactionRepository,
                                  @Value("${app.vnpay.hash-secret:}") String hashSecret,
                                  @Value("${app.vietqr.webhook-secret:}") String vietQrWebhookSecret) {
        this.checkoutService = checkoutService;
        this.vnPayService = vnPayService;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.hashSecret = hashSecret != null ? hashSecret.trim() : "";
        this.vietQrWebhookSecret = vietQrWebhookSecret != null ? vietQrWebhookSecret.trim() : "";
    }

    /**
     * VNPay IPN Webhook callback endpoint.
     * Verifies cryptographic HMAC-SHA512 checksum and performs idempotent settlement.
     */
    @RequestMapping(value = "/vnpay", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, String>> handleVnpayWebhook(@RequestParam Map<String, String> params) {
        Map<String, String> response = vnPayService.processCallback(params);
        if ("97".equals(response.get("RspCode"))) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * VietQR / Bank Transfer IPN Webhook endpoint.
     * Receives bank transaction notifications (PayOS, SePay, Casso, or Open API).
     */
    @PostMapping(value = {"/vietqr", "/bank-transfer"})
    public ResponseEntity<Map<String, Object>> handleVietQrWebhook(
            @RequestHeader(value = "X-Webhook-Secret", required = false) String headerSecret,
            @RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();

        // Mandatory webhook authentication
        if (vietQrWebhookSecret == null || vietQrWebhookSecret.isBlank() || headerSecret == null || !vietQrWebhookSecret.equals(headerSecret)) {
            response.put("success", false);
            response.put("code", "97");
            response.put("message", "Unauthorized: invalid or missing webhook secret");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        String txnRef = (String) payload.get("transactionReference");
        String content = (String) payload.get("content");

        if ((txnRef == null || txnRef.isBlank()) && content != null) {
            // Attempt auto-discovery by parsing transfer content, e.g. "HSW INV <invoiceNumber>"
            txnRef = resolveTxnRefFromContent(content);
        }

        if (txnRef == null || txnRef.isBlank()) {
            response.put("success", false);
            response.put("code", "01");
            response.put("message", "Unable to match transaction reference from payload or content");
            return ResponseEntity.badRequest().body(response);
        }

        String statusStr = (String) payload.getOrDefault("status", "SUCCESSFUL");
        boolean isSuccess = "SUCCESSFUL".equalsIgnoreCase(statusStr) || "SUCCESS".equalsIgnoreCase(statusStr) || "00".equals(statusStr);

        boolean updated = checkoutService.confirmGatewayPayment(txnRef, isSuccess);
        if (!updated) {
            response.put("success", false);
            response.put("code", "01");
            response.put("message", "Transaction reference not found in database: " + txnRef);
            return ResponseEntity.ok(response);
        }

        response.put("success", true);
        response.put("code", "00");
        response.put("message", "VietQR transaction settled successfully");
        response.put("transactionReference", txnRef);
        return ResponseEntity.ok(response);
    }

    private String resolveTxnRefFromContent(String content) {
        String upper = content.toUpperCase();
        if (upper.contains("HSW_INV_") || upper.contains("HSW_DEP_")) {
            for (String part : upper.split("\\s+")) {
                if (part.startsWith("HSW_INV_") || part.startsWith("HSW_DEP_")) {
                    return part;
                }
            }
        }
        // Match by invoice number if formatted as "HSW INV <invNum>"
        if (upper.contains("HSW INV")) {
            String invNum = upper.substring(upper.indexOf("HSW INV") + 7).trim();
            String fallbackRef = null;
            for (PaymentTransactionEntity tx : paymentTransactionRepository.findAll()) {
                if (tx.getInvoice() != null && tx.getInvoice().getInvoiceNumber() != null
                        && invNum.startsWith(tx.getInvoice().getInvoiceNumber().toUpperCase())) {
                    if ("PENDING".equalsIgnoreCase(tx.getPaymentStatus())
                            && "VIETQR_BANK_TRANSFER".equalsIgnoreCase(tx.getPaymentMethod())) {
                        return tx.getTransactionReference();
                    }
                    if (fallbackRef == null) {
                        fallbackRef = tx.getTransactionReference();
                    }
                }
            }
            return fallbackRef;
        }
        return null;
    }

    public static boolean verifyChecksum(Map<String, String> params, String secureHash, String secret) {
        try {
            List<String> fieldNames = new ArrayList<>(params.keySet());
            Collections.sort(fieldNames);

            StringBuilder sb = new StringBuilder();
            for (String fieldName : fieldNames) {
                if ("vnp_SecureHash".equals(fieldName) || "vnp_SecureHashType".equals(fieldName)) {
                    continue;
                }
                String fieldValue = params.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    if (sb.length() > 0) {
                        sb.append('&');
                    }
                    sb.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII))
                      .append('=')
                      .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                }
            }

            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(sb.toString().getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }

            return hex.toString().equalsIgnoreCase(secureHash);
        } catch (Exception e) {
            log.error("Failed to verify VNPay checksum", e);
            return false;
        }
    }
}
