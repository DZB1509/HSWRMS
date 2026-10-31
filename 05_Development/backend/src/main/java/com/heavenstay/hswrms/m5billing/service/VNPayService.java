package com.heavenstay.hswrms.m5billing.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m5billing.config.VNPayConfig;
import com.heavenstay.hswrms.m5billing.dto.PaymentResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.VnpayCreatePaymentRequest;
import com.heavenstay.hswrms.m5billing.dto.VnpayPaymentUrlResponse;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
import com.heavenstay.hswrms.m5billing.repository.CreditNoteRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * VNPay Sandbox integration for the M5 Final Payment screen (S42).
 * Creates signed payment URLs (HMAC-SHA512), persists a PENDING PaymentTransaction,
 * and processes IPN / return callbacks idempotently.
 */
@Service
public class VNPayService {

    private static final Logger log = LoggerFactory.getLogger(VNPayService.class);

    private final VNPayConfig config;
    private final InvoiceRepository invoiceRepository;
    private final FolioRepository folioRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final CreditNoteRepository creditNoteRepository;
    private final CheckoutService checkoutService;
    private final boolean sandboxSimulation;

    public VNPayService(VNPayConfig config,
                        InvoiceRepository invoiceRepository,
                        FolioRepository folioRepository,
                        PaymentTransactionRepository transactionRepository,
                        CreditNoteRepository creditNoteRepository,
                        CheckoutService checkoutService,
                        @org.springframework.beans.factory.annotation.Value("${app.vnpay.sandbox-simulation:true}") boolean sandboxSimulation) {
        this.config = config;
        this.invoiceRepository = invoiceRepository;
        this.folioRepository = folioRepository;
        this.transactionRepository = transactionRepository;
        this.creditNoteRepository = creditNoteRepository;
        this.checkoutService = checkoutService;
        this.sandboxSimulation = sandboxSimulation;
    }

    @Transactional
    public VnpayPaymentUrlResponse createPaymentUrl(VnpayCreatePaymentRequest req, String clientIp) {
        if (config.getHashSecret().isEmpty() || config.getTmnCode().isEmpty()) {
            throw new BusinessRuleException("VNPAY_NOT_CONFIGURED", "VNPay TmnCode / HashSecret is not configured.");
        }

        InvoiceEntity invoice = resolveInvoice(req);

        if ("CANCELLED".equalsIgnoreCase(invoice.getInvoiceStatus())) {
            throw new BusinessRuleException("INVOICE_CANCELLED", "Cannot pay a cancelled invoice.");
        }

        BigDecimal paid = transactionRepository.sumSuccessfulPaymentsForInvoice(invoice.getInvoiceId());
        BigDecimal creditNotes = creditNoteRepository.sumFinalCreditAmountByInvoiceId(invoice.getInvoiceId());
        BigDecimal due = invoice.getFinalAmount()
                .subtract(paid == null ? BigDecimal.ZERO : paid)
                .subtract(creditNotes == null ? BigDecimal.ZERO : creditNotes);
        if (due.compareTo(BigDecimal.ZERO) <= 0 || "PAID".equalsIgnoreCase(invoice.getInvoiceStatus())) {
            if (!"PAID".equalsIgnoreCase(invoice.getInvoiceStatus())) {
                invoice.setInvoiceStatus("PAID");
                invoiceRepository.save(invoice);
            }
            throw new BusinessRuleException("INVOICE_ALREADY_SETTLED", "Invoice is already paid in full.");
        }

        if (!"ISSUED".equalsIgnoreCase(invoice.getInvoiceStatus())) {
            invoice.setInvoiceStatus("ISSUED");
            invoiceRepository.save(invoice);
        }
        // Server is the authoritative source of truth for the balance due.
        // If client sends null or an amount exceeding balance due (e.g. before deposit deduction), safely use balance due.
        BigDecimal amount;
        if (req.amount() == null || req.amount().compareTo(BigDecimal.ZERO) <= 0 || req.amount().compareTo(due) > 0) {
            log.info("Client requested amount [{}] for invoice [{}] - using authoritative remaining balance due [{}]",
                    req.amount(), invoice.getInvoiceId(), due);
            amount = due;
        } else {
            amount = req.amount();
        }

        String invoiceCode = invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : String.valueOf(invoice.getInvoiceId());
        String orderInfo = req.orderInfo() != null && !req.orderInfo().isBlank() ? req.orderInfo() : "HSW INV " + invoiceCode;
        String txnRef = "HSW_INV_" + invoice.getInvoiceId() + "_" + System.currentTimeMillis();

        // Older unfinished VNPay attempts for this invoice are superseded.
        for (PaymentTransactionEntity old : transactionRepository.findByInvoiceId(invoice.getInvoiceId())) {
            if ("PENDING".equalsIgnoreCase(old.getPaymentStatus()) && "VNPAY".equalsIgnoreCase(old.getPaymentMethod())) {
                old.setPaymentStatus("FAILED");
                transactionRepository.save(old);
            }
        }

        PaymentTransactionEntity tx = new PaymentTransactionEntity(
                null, invoice, "FINAL", "VNPAY", txnRef, amount, "PENDING");
        transactionRepository.save(tx);

        String ip = (req.ipAddress() != null && !req.ipAddress().isBlank()) ? req.ipAddress() : clientIp;
        String url = buildSignedUrl(txnRef, amount, orderInfo, normalizeIp(ip));
        return new VnpayPaymentUrlResponse(url, txnRef, invoice.getInvoiceId(), amount, orderInfo, "PENDING");
    }

    private InvoiceEntity resolveInvoice(VnpayCreatePaymentRequest req) {
        if (req.bookingId() != null && req.bookingId() > 0) {
            java.util.Optional<InvoiceEntity> byBooking = invoiceRepository.findByRetreatBookingId(req.bookingId());
            if (byBooking.isPresent()) return byBooking.get();
        }
        if (req.invoiceId() != null && req.invoiceId() > 0) {
            java.util.Optional<InvoiceEntity> byId = invoiceRepository.findByIdWithDetails(req.invoiceId());
            if (byId.isPresent()) return byId.get();
            if (req.invoiceId() <= Integer.MAX_VALUE) {
                java.util.Optional<InvoiceEntity> byBooking = invoiceRepository.findByRetreatBookingId(req.invoiceId().intValue());
                if (byBooking.isPresent()) return byBooking.get();
            }
            throw new ResourceNotFoundException("Invoice not found with ID: " + req.invoiceId());
        }
        throw new BusinessRuleException("MISSING_TARGET", "invoiceId or bookingId is required.");
    }

    String buildSignedUrl(String txnRef, BigDecimal amount, String orderInfo, String ip) {
        Map<String, String> p = new HashMap<>();
        p.put("vnp_Version", "2.1.0");
        p.put("vnp_Command", "pay");
        p.put("vnp_TmnCode", config.getTmnCode());
        p.put("vnp_Amount", String.valueOf(amount.multiply(BigDecimal.valueOf(100)).longValue()));
        p.put("vnp_CurrCode", "VND");
        p.put("vnp_TxnRef", txnRef);
        p.put("vnp_OrderInfo", orderInfo);
        p.put("vnp_OrderType", "other");
        p.put("vnp_Locale", "vn");
        p.put("vnp_ReturnUrl", config.getReturnUrl());
        p.put("vnp_IpAddr", ip);

        TimeZone tz = TimeZone.getTimeZone("Asia/Ho_Chi_Minh");
        SimpleDateFormat fmt = new SimpleDateFormat("yyyyMMddHHmmss");
        fmt.setTimeZone(tz);
        Calendar cal = Calendar.getInstance(tz);
        p.put("vnp_CreateDate", fmt.format(cal.getTime()));
        cal.add(Calendar.MINUTE, 15);
        p.put("vnp_ExpireDate", fmt.format(cal.getTime()));

        List<String> names = new ArrayList<>(p.keySet());
        Collections.sort(names); // ASCII alphabetical order

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        for (String name : names) {
            String value = p.get(name);
            if (value == null || value.isEmpty()) continue;
            if (hashData.length() > 0) { hashData.append('&'); query.append('&'); }
            String enc = URLEncoder.encode(value, StandardCharsets.US_ASCII);
            hashData.append(name).append('=').append(enc);
            query.append(URLEncoder.encode(name, StandardCharsets.US_ASCII)).append('=').append(enc);
        }
        String secureHash = CheckoutService.hmacSHA512(config.getHashSecret(), hashData.toString());
        return config.getPayUrl() + "?" + query + "&vnp_SecureHash=" + secureHash;
    }

    /**
     * Shared by the IPN webhook and the return-URL verification. Returns VNPay-standard {RspCode, Message}.
     */
    @Transactional
    public Map<String, String> processCallback(Map<String, String> params) {
        Map<String, String> rsp = new LinkedHashMap<>();

        String secureHash = params.get("vnp_SecureHash");
        if (config.getHashSecret().isEmpty() || secureHash == null || secureHash.isBlank()
                || !com.heavenstay.hswrms.m5billing.controller.VnpayWebhookController
                        .verifyChecksum(params, secureHash, config.getHashSecret())) {
            rsp.put("RspCode", "97");
            rsp.put("Message", "Invalid Checksum");
            return rsp;
        }

        String txnRef = params.get("vnp_TxnRef");
        Optional<PaymentTransactionEntity> txOpt = txnRef == null
                ? Optional.empty() : transactionRepository.findByTransactionReference(txnRef);
        if (txOpt.isEmpty()) {
            rsp.put("RspCode", "01");
            rsp.put("Message", "Order Not Found");
            return rsp;
        }
        PaymentTransactionEntity tx = txOpt.get();

        try {
            long vnpAmount = Long.parseLong(params.getOrDefault("vnp_Amount", "-1"));
            long expected = tx.getAmountPaid().multiply(BigDecimal.valueOf(100)).longValue();
            if (vnpAmount != expected) {
                rsp.put("RspCode", "04");
                rsp.put("Message", "Invalid Amount");
                return rsp;
            }
        } catch (NumberFormatException e) {
            rsp.put("RspCode", "04");
            rsp.put("Message", "Invalid Amount");
            return rsp;
        }

        if ("SUCCESSFUL".equalsIgnoreCase(tx.getPaymentStatus())) { // idempotent
            rsp.put("RspCode", "00");
            rsp.put("Message", "Confirm Success");
            return rsp;
        }

        boolean success = "00".equals(params.get("vnp_ResponseCode"))
                && (params.get("vnp_TransactionStatus") == null || "00".equals(params.get("vnp_TransactionStatus")));
        checkoutService.confirmGatewayPayment(txnRef, success);
        log.info("VNPay callback txnRef={} success={}", txnRef, success);

        rsp.put("RspCode", "00");
        rsp.put("Message", "Confirm Success");
        return rsp;
    }

    /**
     * Demo / grading helper: produces a correctly signed VNPay callback for a pending transaction and processes it
     * exactly like a real IPN. outcome = SUCCESS | FAILED | CANCELLED. Disabled when app.vnpay.sandbox-simulation=false.
     */
    @Transactional
    public Map<String, String> simulateCallback(String txnRef, String outcome) {
        if (!sandboxSimulation) {
            throw new BusinessRuleException("SIMULATION_DISABLED", "VNPay sandbox simulation is disabled.");
        }
        PaymentTransactionEntity tx = transactionRepository.findByTransactionReference(txnRef)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + txnRef));
        String code = "SUCCESS".equalsIgnoreCase(outcome) ? "00" : "CANCELLED".equalsIgnoreCase(outcome) ? "24" : "51";

        Map<String, String> p = new HashMap<>();
        p.put("vnp_TmnCode", config.getTmnCode());
        p.put("vnp_TxnRef", txnRef);
        p.put("vnp_Amount", String.valueOf(tx.getAmountPaid().multiply(BigDecimal.valueOf(100)).longValue()));
        p.put("vnp_ResponseCode", code);
        p.put("vnp_TransactionStatus", code);
        p.put("vnp_BankCode", "NCB");
        p.put("vnp_OrderInfo", "SIMULATED");

        List<String> names = new ArrayList<>(p.keySet());
        Collections.sort(names);
        StringBuilder data = new StringBuilder();
        for (String n : names) {
            if (data.length() > 0) data.append('&');
            data.append(URLEncoder.encode(n, StandardCharsets.US_ASCII)).append('=')
                .append(URLEncoder.encode(p.get(n), StandardCharsets.US_ASCII));
        }
        p.put("vnp_SecureHash", CheckoutService.hmacSHA512(config.getHashSecret(), data.toString()));
        return processCallback(p);
    }

    @Transactional(readOnly = true)
    public PaymentResponseDTO getStatusByReference(String ref) {
        return checkoutService.getTransactionStatus(ref);
    }

    /** Latest transaction status for an invoice: SUCCESSFUL if any succeeded, else the newest attempt. */
    @Transactional(readOnly = true)
    public Map<String, Object> getInvoicePaymentStatus(Long invoiceId) {
        InvoiceEntity invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));
        List<PaymentTransactionEntity> txs = transactionRepository.findByInvoiceId(invoiceId);
        PaymentTransactionEntity latest = txs.stream()
                .max(Comparator.comparing(PaymentTransactionEntity::getTransactionId)).orElse(null);
        boolean paid = "PAID".equalsIgnoreCase(invoice.getInvoiceStatus())
                || txs.stream().anyMatch(t -> "SUCCESSFUL".equalsIgnoreCase(t.getPaymentStatus()));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("invoiceId", invoiceId);
        out.put("invoiceStatus", invoice.getInvoiceStatus());
        out.put("paymentStatus", paid ? "SUCCESSFUL" : latest != null ? latest.getPaymentStatus() : "NONE");
        out.put("transactionReference", latest != null ? latest.getTransactionReference() : null);
        return out;
    }

    private static String normalizeIp(String ip) {
        if (ip == null || ip.isBlank() || ip.contains(":") || "0:0:0:0:0:0:0:1".equals(ip) || "localhost".equalsIgnoreCase(ip)) {
            return "127.0.0.1";
        }
        return ip.trim();
    }
}
