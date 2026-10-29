package com.heavenstay.hswrms.m2booking.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.PaymentTransaction;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import com.heavenstay.hswrms.security.CustomUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@Transactional
public class VNPayDepositService {

    private static final Logger log = LoggerFactory.getLogger(VNPayDepositService.class);

    private final RetreatBookingRepository bookingRepository;
    private final RetreatBookingService bookingService;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final BookingClock bookingClock;

    @Value("${app.vnpay.tmn-code:HEAVENSTAY}")
    private String tmnCode;

    @Value("${app.vnpay.hash-secret:SECRET_VNPAY_KEY_FOR_DEVELOPMENT_ONLY_HSWRMS}")
    private String hashSecret;

    @Value("${app.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String payUrl;

    @Value("${app.vnpay.return-url:http://localhost:5173/customer/booking/deposit-result}")
    private String defaultReturnUrl;

    public VNPayDepositService(RetreatBookingRepository bookingRepository,
                               RetreatBookingService bookingService) {
        this(bookingRepository, bookingService, null, new BookingClock());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public VNPayDepositService(RetreatBookingRepository bookingRepository,
                               RetreatBookingService bookingService,
                               @org.springframework.beans.factory.annotation.Qualifier("bookingPaymentTransactionRepository") PaymentTransactionRepository paymentTransactionRepository,
                               BookingClock bookingClock) {
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.bookingClock = bookingClock;
    }

    public record VNPayDepositInitResult(String paymentUrl, String transactionReference) {}

    /**
     * Initializes VNPay deposit payment URL and creates a tracked PaymentTransaction row.
     */
    public String generateDepositUrl(Integer bookingId, String customReturnUrl, HttpServletRequest request) {
        return generateDepositUrlWithResult(bookingId, customReturnUrl, request).paymentUrl();
    }

    public VNPayDepositInitResult generateDepositUrlWithResult(Integer bookingId, String customReturnUrl, HttpServletRequest request) {
        if (hashSecret == null || hashSecret.trim().isEmpty()) {
            throw new BusinessRuleException("VNPay payment gateway is unavailable: merchant hash secret is not configured.");
        }
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking #" + bookingId + " not found"));

        if (!"PENDING".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new BusinessRuleException("Booking is in " + booking.getBookingStatus() + " status and cannot initiate deposit payment");
        }

        BigDecimal depositAmount = booking.getDepositAmount();
        long amountInCents = depositAmount.multiply(new BigDecimal(100)).longValue();

        String returnUrl = (customReturnUrl != null && !customReturnUrl.trim().isEmpty())
                ? customReturnUrl
                : defaultReturnUrl;

        String txnRef = "HSW_DEP_" + bookingId + "_" + System.currentTimeMillis();

        // Create or update PENDING PaymentTransaction record (SRS Data Rule 23)
                if (paymentTransactionRepository != null) {
            PaymentTransaction txn = new PaymentTransaction();
            txn.setRetreatBookingId(bookingId);
            txn.setPaymentType(PaymentTransaction.TYPE_DEPOSIT);
            txn.setPaymentMethod(PaymentTransaction.METHOD_VNPAY);
            txn.setTransactionReference(txnRef);
            txn.setAmountPaid(depositAmount);
            txn.setPaymentStatus(PaymentTransaction.STATUS_PENDING);
            txn.setTransactionDate(bookingClock != null ? bookingClock.utcNow() : java.time.LocalDateTime.now());
            paymentTransactionRepository.save(txn);
        }

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", tmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amountInCents));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", "HSWRMS Dat coc booking #" + bookingId);
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

        String paymentUrl = payUrl + "?" + query.toString();
        return new VNPayDepositInitResult(paymentUrl, txnRef);
    }

    /**
     * Verifies VNPay signature and processes payment result idempotently.
     */
    public Map<String, String> processIpn(Map<String, String> params) {
        if (hashSecret == null || hashSecret.trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("RspCode", "99");
            err.put("Message", "VNPay payment gateway is unavailable: merchant hash secret is missing.");
            return err;
        }
        Map<String, String> response = new HashMap<>();
        String vnpSecureHash = params.get("vnp_SecureHash");

        if (vnpSecureHash == null || !verifyChecksum(params, vnpSecureHash)) {
            log.warn("VNPay IPN invalid checksum rejected");
            response.put("RspCode", "97");
            response.put("Message", "Invalid Checksum");
            return response;
        }

        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");

        // Parse booking ID from TxnRef: HSW_DEP_{bookingId}_{timestamp}
        Integer bookingId = extractBookingId(txnRef);
        if (bookingId == null) {
            response.put("RspCode", "01");
            response.put("Message", "Order not found");
            return response;
        }

        // Lock payment transaction by reference for idempotent execution
        Optional<PaymentTransaction> txnOpt = paymentTransactionRepository.findByReferenceForUpdate(txnRef);
        PaymentTransaction txn;
        if (txnOpt.isPresent()) {
            txn = txnOpt.get();
        } else {
            // Find latest pending transaction for this booking
            List<PaymentTransaction> list = paymentTransactionRepository
                    .findByRetreatBookingIdAndPaymentTypeOrderByTransactionIdDesc(bookingId, PaymentTransaction.TYPE_DEPOSIT);
            txn = list.isEmpty() ? null : list.get(0);
        }

        if (txn == null) {
            response.put("RspCode", "01");
            response.put("Message", "Order not found");
            return response;
        }

        // Idempotency: if already successful, return success without double processing
        if (PaymentTransaction.STATUS_SUCCESSFUL.equalsIgnoreCase(txn.getPaymentStatus())) {
            response.put("RspCode", "00");
            response.put("Message", "Order already confirmed");
            return response;
        }

        BigDecimal amountPaid = BigDecimal.ZERO;
        if (params.get("vnp_Amount") != null) {
            amountPaid = new BigDecimal(params.get("vnp_Amount")).divide(new BigDecimal(100));
        }

        // Check amount match
        if (txn.getAmountPaid() != null && txn.getAmountPaid().compareTo(amountPaid) != 0) {
            log.warn("VNPay IPN amount mismatch: expected {} but got {}", txn.getAmountPaid(), amountPaid);
            response.put("RspCode", "04");
            response.put("Message", "Invalid Amount");
            return response;
        }

        if ("00".equals(responseCode)) {
            txn.setPaymentStatus(PaymentTransaction.STATUS_SUCCESSFUL);
            txn.setTransactionDate(bookingClock.utcNow());
            paymentTransactionRepository.save(txn);

            bookingService.confirmBookingDeposit(bookingId, amountPaid, txnRef);

            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");
        } else {
            txn.setPaymentStatus(PaymentTransaction.STATUS_FAILED);
            txn.setTransactionDate(bookingClock.utcNow());
            paymentTransactionRepository.save(txn);

            response.put("RspCode", "00");
            response.put("Message", "Payment Failure Recorded");
        }

        return response;
    }

    public boolean verifyChecksum(Map<String, String> params, String secureHash) {
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
        return calculatedHash.equalsIgnoreCase(secureHash);
    }

    /**
     * Builds valid signed parameters for developer testing / sandbox flow.
     */
    public Map<String, String> createSignedCallbackParams(String txnRef, BigDecimal amount, String responseCode) {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_Amount", String.valueOf(amount.multiply(new BigDecimal(100)).longValue()));
        params.put("vnp_ResponseCode", responseCode);
        params.put("vnp_TransactionNo", "DEV_" + System.currentTimeMillis());

        Map<String, String> sortedParams = new TreeMap<>(params);
        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                hashData.append(entry.getKey()).append('=').append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII)).append('&');
            }
        }
        if (hashData.length() > 0) {
            hashData.setLength(hashData.length() - 1);
        }

        String secureHash = hmacSHA512(hashSecret, hashData.toString());
        params.put("vnp_SecureHash", secureHash);
        return params;
    }

    private Integer extractBookingId(String txnRef) {
        if (txnRef != null && txnRef.startsWith("HSW_DEP_")) {
            String[] parts = txnRef.split("_");
            if (parts.length >= 3) {
                try {
                    return Integer.parseInt(parts[2]);
                } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip != null ? ip : "127.0.0.1";
    }

    public String hmacSHA512(String key, String data) {
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

    public void setHashSecret(String hashSecret) {
        this.hashSecret = hashSecret;
    }

    public String generateDepositUrl(Integer bookingId, String customReturnUrl, HttpServletRequest request, CustomUserDetails userDetails) {
        if (hashSecret == null || hashSecret.trim().isEmpty()) {
            throw new BusinessRuleException("VNPay payment gateway is unavailable: merchant hash secret is not configured.");
        }
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking #" + bookingId + " not found"));
        bookingService.validateBookingAccess(booking, userDetails, "generate payment for");
        return generateDepositUrl(bookingId, customReturnUrl, request);
    }

}
