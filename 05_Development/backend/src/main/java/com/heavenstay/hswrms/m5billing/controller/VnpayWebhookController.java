package com.heavenstay.hswrms.m5billing.controller;

import com.heavenstay.hswrms.m5billing.service.CheckoutService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
    private final String hashSecret;

    public VnpayWebhookController(CheckoutService checkoutService,
                                  @Value("${app.vnpay.hash-secret:}") String hashSecret) {
        this.checkoutService = checkoutService;
        this.hashSecret = hashSecret != null ? hashSecret.trim() : "";
    }

    @RequestMapping(value = "/vnpay", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, String>> handleVnpayWebhook(@RequestParam Map<String, String> params) {
        Map<String, String> response = new HashMap<>();

        if (hashSecret.isEmpty()) {
            log.warn("VNPay webhook received but hash-secret is empty. Rejecting (fail-closed).");
            response.put("RspCode", "97");
            response.put("Message", "Invalid Checksum (Configuration Missing)");
            return ResponseEntity.badRequest().body(response);
        }

        String secureHash = params.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isBlank()) {
            response.put("RspCode", "97");
            response.put("Message", "Missing Secure Hash");
            return ResponseEntity.badRequest().body(response);
        }

        // Verify checksum
        boolean signatureValid = verifyChecksum(params, secureHash, hashSecret);
        if (!signatureValid) {
            log.warn("VNPay signature mismatch for txnRef: {}", params.get("vnp_TxnRef"));
            response.put("RspCode", "97");
            response.put("Message", "Invalid Checksum");
            return ResponseEntity.badRequest().body(response);
        }

        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        boolean isSuccess = "00".equals(responseCode);

        boolean updated = checkoutService.confirmGatewayPayment(txnRef, isSuccess);
        if (!updated) {
            response.put("RspCode", "01");
            response.put("Message", "Order Not Found");
            return ResponseEntity.ok(response);
        }

        response.put("RspCode", "00");
        response.put("Message", "Confirm Success");
        return ResponseEntity.ok(response);
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
