package com.heavenstay.hswrms.m5billing;

import com.heavenstay.hswrms.m5billing.controller.VnpayWebhookController;
import com.heavenstay.hswrms.m5billing.service.CheckoutService;
import com.heavenstay.hswrms.m5billing.service.VietQrService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class VietQrAndPaymentWebhookTest {

    @Test
    @DisplayName("VietQR EMVCo generator produces valid TLV and 4-digit uppercase CRC16")
    public void testVietQrPayloadGeneration() {
        String bankBin = "970422";
        String account = "0987654321";
        BigDecimal amount = new BigDecimal("1500000");
        String content = "HSW INV 1001";

        String payload = VietQrService.buildEmvCoPayload(bankBin, account, amount, content);
        assertNotNull(payload);
        assertTrue(payload.startsWith("00020101021238"));
        assertTrue(payload.contains("5303704")); // VND
        assertTrue(payload.contains("54071500000")); // Amount
        assertTrue(payload.contains("5802VN")); // Country VN
        assertTrue(payload.contains("6304")); // Tag 63 length 4
        // Payload must end with 4 hex characters
        String crc = payload.substring(payload.length() - 4);
        assertEquals(4, crc.length());
        assertTrue(crc.matches("^[0-9A-F]{4}$"));
    }

    @Test
    @DisplayName("VietQR content sanitizer removes diacritics and special characters")
    public void testSanitizeContent() {
        String input = "HSW Hóa Đơn #1001 & VIP!";
        String sanitized = VietQrService.sanitizeContent(input);
        assertEquals("HSW Hoa Don 1001  VIP", sanitized);
    }

    @Test
    @DisplayName("VNPay HMAC-SHA512 checksum validation matches specification")
    public void testVnpayChecksumVerification() {
        String secret = "TEST_SECRET_KEY_1234567890";
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Amount", "10000000");
        params.put("vnp_Command", "pay");
        params.put("vnp_OrderInfo", "HSWRMS Test Payment");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TmnCode", "HEAVENSTAY");
        params.put("vnp_TxnRef", "TXN-TEST-001");

        // Calculate expected hash
        String rawData = "vnp_Amount=" + URLEncoder.encode("10000000", StandardCharsets.US_ASCII)
                + "&vnp_Command=" + URLEncoder.encode("pay", StandardCharsets.US_ASCII)
                + "&vnp_OrderInfo=" + URLEncoder.encode("HSWRMS Test Payment", StandardCharsets.US_ASCII)
                + "&vnp_ResponseCode=" + URLEncoder.encode("00", StandardCharsets.US_ASCII)
                + "&vnp_TmnCode=" + URLEncoder.encode("HEAVENSTAY", StandardCharsets.US_ASCII)
                + "&vnp_TxnRef=" + URLEncoder.encode("TXN-TEST-001", StandardCharsets.US_ASCII);

        String secureHash = CheckoutService.hmacSHA512(secret, rawData);
        assertNotNull(secureHash);

        // Verification must return true
        boolean isValid = VnpayWebhookController.verifyChecksum(params, secureHash, secret);
        assertTrue(isValid, "HMAC-SHA512 checksum should be valid");

        // Tampered param must fail
        params.put("vnp_Amount", "99999999");
        boolean isTamperedValid = VnpayWebhookController.verifyChecksum(params, secureHash, secret);
        assertFalse(isTamperedValid, "Tampered parameters must fail checksum verification");
    }
}

