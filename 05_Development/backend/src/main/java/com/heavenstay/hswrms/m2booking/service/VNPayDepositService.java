package com.heavenstay.hswrms.m2booking.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class VNPayDepositService {

    private final RetreatBookingRepository bookingRepository;
    private final RetreatBookingService bookingService;

    @Value("${app.vnpay.tmn-code:HEAVENSTAY}")
    private String tmnCode;

    @Value("${app.vnpay.hash-secret:}")
    private String hashSecret;

    @Value("${app.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String payUrl;

    public VNPayDepositService(RetreatBookingRepository bookingRepository,
                               RetreatBookingService bookingService) {
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
    }

    public void setHashSecret(String hashSecret) {
        this.hashSecret = hashSecret;
    }

    public String generateDepositUrl(Integer bookingId, String customReturnUrl, HttpServletRequest request, CustomUserDetails userDetails) {
        if (hashSecret == null || hashSecret.trim().isEmpty()) {
            throw new BusinessRuleException("VNPay payment gateway is unavailable: merchant hash secret is not configured.");
        }

        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking #" + bookingId + " not found"));

        validatePaymentUrlAuthorization(booking, userDetails);

        if (!"PENDING".equals(booking.getBookingStatus())) {
            throw new BusinessRuleException("Booking is not in PENDING status for deposit");
        }

        return buildPaymentUrl(booking, customReturnUrl, request);
    }

    public String generateDepositUrl(Integer bookingId, String customReturnUrl, HttpServletRequest request) {
        if (hashSecret == null || hashSecret.trim().isEmpty()) {
            throw new BusinessRuleException("VNPay payment gateway is unavailable: merchant hash secret is not configured.");
        }

        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking #" + bookingId + " not found"));

        if (!"PENDING".equals(booking.getBookingStatus())) {
            throw new BusinessRuleException("Booking is not in PENDING status for deposit");
        }

        return buildPaymentUrl(booking, customReturnUrl, request);
    }

    private void validatePaymentUrlAuthorization(RetreatBooking booking, CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new AccessDeniedException("Authentication required to generate payment URL.");
        }
        boolean isManagerOrAdmin = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_MANAGER") || role.equals("ROLE_ADMIN"));
        if (isManagerOrAdmin) {
            return;
        }
        boolean isCustomer = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_CUSTOMER"));
        if (isCustomer) {
            Integer myCustomerProfileId = bookingService.resolveCustomerProfileId(userDetails);
            if (!booking.getCustomerProfileId().equals(myCustomerProfileId)) {
                throw new AccessDeniedException("Access denied: You do not have permission to generate payment URL for booking #" + booking.getRetreatBookingId());
            }
            return;
        }
        throw new AccessDeniedException("Access denied: Unauthorized role for payment generation.");
    }

    private String buildPaymentUrl(RetreatBooking booking, String customReturnUrl, HttpServletRequest request) {
        BigDecimal depositAmount = booking.getDepositAmount();
        long amountInCents = depositAmount.multiply(new BigDecimal(100)).longValue();

        String returnUrl = (customReturnUrl != null && !customReturnUrl.trim().isEmpty())
                ? customReturnUrl
                : "http://localhost:5173/customer/booking/deposit-result";

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", tmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amountInCents));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", "HSW_DEP_" + booking.getRetreatBookingId() + "_" + System.currentTimeMillis());
        vnpParams.put("vnp_OrderInfo", "HSWRMS Dat coc booking #" + booking.getRetreatBookingId());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_IpAddr", getClientIp(request));

        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        vnpParams.put("vnp_CreateDate", formatter.format(new Date()));

        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        for (String fieldName : fieldNames) {
            String value = vnpParams.get(fieldName);
            if (value != null && !value.isEmpty()) {
                hashData.append(fieldName).append('=').append(URLEncoder.encode(value, StandardCharsets.US_ASCII)).append('&');
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII)).append('=')
                     .append(URLEncoder.encode(value, StandardCharsets.US_ASCII)).append('&');
            }
        }
        hashData.setLength(hashData.length() - 1);
        query.setLength(query.length() - 1);

        String secureHash = hmacSHA512(hashSecret, hashData.toString());
        query.append("&vnp_SecureHash=").append(secureHash);

        return payUrl + "?" + query.toString();
    }

    public Map<String, String> processIpn(Map<String, String> params) {
        Map<String, String> response = new HashMap<>();
        if (hashSecret == null || hashSecret.trim().isEmpty()) {
            response.put("RspCode", "99");
            response.put("Message", "Payment gateway unconfigured: hash secret is missing");
            return response;
        }

        String vnpSecureHash = params.get("vnp_SecureHash");

        Map<String, String> sortedParams = new TreeMap<>(params);
        sortedParams.remove("vnp_SecureHashType");
        sortedParams.remove("vnp_SecureHash");

        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                hashData.append(entry.getKey()).append('=').append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII)).append('&');
            }
        }
        if (hashData.length() > 0) {
            hashData.setLength(hashData.length() - 1);
        }

        String calculatedHash = hmacSHA512(hashSecret, hashData.toString());
        if (!calculatedHash.equalsIgnoreCase(vnpSecureHash)) {
            response.put("RspCode", "97");
            response.put("Message", "Invalid Checksum");
            return response;
        }

        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");

        // Parse booking ID from TxnRef: HSW_DEP_{bookingId}_{timestamp}
        Integer bookingId = null;
        if (txnRef != null && txnRef.startsWith("HSW_DEP_")) {
            String[] parts = txnRef.split("_");
            if (parts.length >= 3) {
                try {
                    bookingId = Integer.parseInt(parts[2]);
                } catch (NumberFormatException ignored) {}
            }
        }

        if (bookingId == null) {
            response.put("RspCode", "01");
            response.put("Message", "Order not found");
            return response;
        }

        if ("00".equals(responseCode)) {
            BigDecimal amount = BigDecimal.ZERO;
            if (params.get("vnp_Amount") != null) {
                amount = new BigDecimal(params.get("vnp_Amount")).divide(new BigDecimal(100));
            }
            bookingService.confirmBookingDeposit(bookingId, amount, txnRef);
            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");
        } else {
            response.put("RspCode", "00");
            response.put("Message", "Payment Failed Recorded");
        }

        return response;
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip != null ? ip : "127.0.0.1";
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * bytes.length);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new RuntimeException("Error calculating HMAC-SHA512", ex);
        }
    }
}
