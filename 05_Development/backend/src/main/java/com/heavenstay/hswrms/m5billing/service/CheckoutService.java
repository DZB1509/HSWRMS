package com.heavenstay.hswrms.m5billing.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m5billing.dto.FinalizeCheckoutResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.PaymentRequestDTO;
import com.heavenstay.hswrms.m5billing.dto.PaymentResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.VietQrResponseDTO;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class CheckoutService {

    private static final Set<String> VALID_PAYMENT_METHODS = Set.of("CASH", "CARD", "VNPAY", "VIETQR_BANK_TRANSFER");

    private final InvoiceRepository invoiceRepository;
    private final FolioRepository folioRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RetreatBookingRepository bookingRepository;
    private final PhysicalVillaRepository physicalVillaRepository;
    private final FolioBillingService folioBillingService;
    private final AuditLogService auditLogService;
    private final VietQrService vietQrService;
    private final boolean mockAutoConfirm;

    @Value("${app.vnpay.tmn-code:HEAVENSTAY}")
    private String vnpayTmnCode;

    @Value("${app.vnpay.hash-secret:SECRET_VNPAY_KEY_FOR_DEVELOPMENT_ONLY_HSWRMS}")
    private String vnpayHashSecret;

    @Value("${app.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnpayPayUrl;

    @Value("${app.vnpay.return-url:http://localhost:5173/customer/checkout/payment-result}")
    private String vnpayReturnUrl;

    public CheckoutService(InvoiceRepository invoiceRepository,
                           FolioRepository folioRepository,
                           PaymentTransactionRepository paymentTransactionRepository,
                           RetreatBookingRepository bookingRepository,
                           PhysicalVillaRepository physicalVillaRepository,
                           FolioBillingService folioBillingService,
                           AuditLogService auditLogService,
                           VietQrService vietQrService,
                           @Value("${app.vnpay.mock-auto-confirm:false}") boolean mockAutoConfirm) {
        this.invoiceRepository = invoiceRepository;
        this.folioRepository = folioRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.bookingRepository = bookingRepository;
        this.physicalVillaRepository = physicalVillaRepository;
        this.folioBillingService = folioBillingService;
        this.auditLogService = auditLogService;
        this.vietQrService = vietQrService;
        this.mockAutoConfirm = mockAutoConfirm;
    }

    @Transactional
    public PaymentResponseDTO processPayment(Long invoiceId, PaymentRequestDTO request, boolean isStaff) {
        InvoiceEntity invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        FolioEntity folio = invoice.getFolio();
        RetreatBooking booking = folio.getRetreatBooking();

        // Guard: Check method validity
        String method = request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "";
        if (!VALID_PAYMENT_METHODS.contains(method)) {
            throw new BusinessRuleException("INVALID_PAYMENT_METHOD",
                    "Payment method must be one of: CASH, CARD, VNPAY, VIETQR_BANK_TRANSFER. Provided: " + request.getPaymentMethod());
        }

        // Guard: Role restrictions on payment method
        if (!isStaff && !"VNPAY".equalsIgnoreCase(method) && !"VIETQR_BANK_TRANSFER".equalsIgnoreCase(method)) {
            throw new AccessDeniedException("Customer can only pay via VNPay or VietQR online bank transfer. Cash and POS Card are restricted to Front Desk.");
        }

        // Guard: Billing guard on unsettled orders
        folioBillingService.validateBillingGuard(booking.getRetreatBookingId());

        // Guard: Stay or folio must not be already closed/completed
        if ("CLOSED".equalsIgnoreCase(folio.getFolioStatus()) || "COMPLETED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new BusinessRuleException("FOLIO_CLOSED", "Cannot process payment for a closed folio or completed stay.");
        }

        // Guard: Invoice must not be already paid or cancelled
        if ("PAID".equalsIgnoreCase(invoice.getInvoiceStatus())) {
            throw new BusinessRuleException("INVOICE_ALREADY_SETTLED", "Invoice is already paid in full.");
        }
        if ("CANCELLED".equalsIgnoreCase(invoice.getInvoiceStatus())) {
            throw new BusinessRuleException("INVOICE_CANCELLED", "Cannot make payments towards a cancelled invoice.");
        }

        // Calculate current amount due
        BigDecimal successfulPayments = paymentTransactionRepository.sumSuccessfulPaymentsForInvoice(invoiceId);
        if (successfulPayments == null) successfulPayments = BigDecimal.ZERO;

        BigDecimal amountDue = invoice.getFinalAmount().subtract(successfulPayments);
        if (amountDue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("NO_BALANCE_DUE", "Invoice has zero balance due. Proceed directly to checkout.");
        }

        if (request.getAmount().compareTo(amountDue) > 0) {
            throw new BusinessRuleException("AMOUNT_EXCEEDS_BALANCE",
                    "Payment amount (" + request.getAmount() + ") exceeds remaining invoice balance (" + amountDue + ").");
        }

        // Idempotency: check if transactionReference already exists
        String reference = request.getTransactionReference();
        if (reference != null && !reference.isBlank()) {
            Optional<PaymentTransactionEntity> existingTx = paymentTransactionRepository.findByTransactionReference(reference);
            if (existingTx.isPresent()) {
                PaymentTransactionEntity tx = existingTx.get();
                PaymentResponseDTO response = mapToPaymentResponse(tx);
                response.setMessage("Payment transaction reference already processed (idempotent result).");
                return response;
            }
        } else {
            reference = "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        // Determine status: VNPAY / VIETQR without mockAutoConfirm is PENDING awaiting webhook / scan
        boolean isOnlineAsync = ("VNPAY".equalsIgnoreCase(method) || "VIETQR_BANK_TRANSFER".equalsIgnoreCase(method)) && !mockAutoConfirm && !isStaff;
        String paymentStatus = isOnlineAsync ? "PENDING" : "SUCCESSFUL";

        String pType = request.getPaymentType() != null && !request.getPaymentType().isBlank()
                ? ("FINAL_PAYMENT".equalsIgnoreCase(request.getPaymentType()) ? "FINAL" : request.getPaymentType())
                : "FINAL";

        PaymentTransactionEntity transaction = new PaymentTransactionEntity(
                null,
                invoice,
                pType,
                method,
                reference,
                request.getAmount(),
                paymentStatus
        );

        PaymentTransactionEntity savedTx = paymentTransactionRepository.save(transaction);

        if ("SUCCESSFUL".equalsIgnoreCase(paymentStatus)) {
            applySuccessfulPayment(invoice, folio, booking, request.getAmount());
            auditLogService.record("PAYMENT", "Invoice#" + invoiceId + " (" + method + ")", "SUCCESS");
        } else {
            auditLogService.record("PAYMENT_INITIATED", "Invoice#" + invoiceId + " (" + method + "-PENDING)", "PENDING");
        }

        PaymentResponseDTO response = mapToPaymentResponse(savedTx);

        // Attach VNPay URL or VietQR Payload if online payment
        if ("VNPAY".equalsIgnoreCase(method)) {
            String vnpUrl = generateVnpayPaymentUrl(invoice, request.getAmount(), reference);
            response.setPaymentUrl(vnpUrl);
            response.setMessage("PENDING".equalsIgnoreCase(paymentStatus)
                    ? "VNPay payment initiated. Awaiting gateway webhook confirmation."
                    : "Payment settled successfully via VNPay.");
        } else if ("VIETQR_BANK_TRANSFER".equalsIgnoreCase(method)) {
            try {
                VietQrResponseDTO qrDto = vietQrService.generateInvoiceVietQr(invoiceId);
                response.setQrImageUrl(qrDto.getQrImageUrl());
                response.setQrPayload(qrDto.getQrPayload());
                response.setTransferContent(qrDto.getTransferContent());
            } catch (Exception ex) {
                // VietQR generator fallback
            }
            response.setMessage("PENDING".equalsIgnoreCase(paymentStatus)
                    ? "VietQR generated. Please scan the QR code to complete transfer."
                    : "VietQR bank transfer verified and settled successfully.");
        } else {
            response.setMessage("Payment transaction settled successfully via " + method + ".");
        }

        return response;
    }

    // Overload for backward compatibility / tests
    @Transactional
    public PaymentResponseDTO processPayment(Long invoiceId, PaymentRequestDTO request) {
        return processPayment(invoiceId, request, true);
    }

    @Transactional
    public FinalizeCheckoutResponseDTO finalizeCheckout(Long invoiceId) {
        InvoiceEntity invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        // 1. Acquire pessimistic write lock on Folio & Booking to serialize against concurrent order placements & deliveries
        FolioEntity folio = invoice.getFolio();
        if (folio != null && folio.getFolioId() != null) {
            folio = folioRepository.findByIdForUpdate(folio.getFolioId()).orElse(folio);
        }
        RetreatBooking booking = folio != null ? folio.getRetreatBooking() : null;
        if (booking != null && booking.getRetreatBookingId() != null) {
            booking = bookingRepository.findByIdForUpdate(booking.getRetreatBookingId()).orElse(booking);
        }

        // Re-fetch invoice with latest items and amounts inside the locked transaction
        invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        // 1. Invoice status check: cancelled invoice can never finalize
        if ("CANCELLED".equalsIgnoreCase(invoice.getInvoiceStatus())) {
            throw new BusinessRuleException("INVOICE_CANCELLED",
                    "Cannot finalize checkout with a cancelled invoice.");
        }

        // Calculate successful payments and remaining balance
        BigDecimal successfulPayments = paymentTransactionRepository.sumSuccessfulPaymentsForInvoice(invoiceId);
        if (successfulPayments == null) successfulPayments = BigDecimal.ZERO;

        BigDecimal remainingBalance = invoice.getFinalAmount().subtract(successfulPayments);
        if (remainingBalance.compareTo(BigDecimal.ZERO) < 0) remainingBalance = BigDecimal.ZERO;

        boolean isBookingCompleted = "COMPLETED".equalsIgnoreCase(booking.getBookingStatus());
        boolean isFolioClosed = "CLOSED".equalsIgnoreCase(folio.getFolioStatus());

        // 2. Detect contradictory/inconsistent checkout states
        if (isBookingCompleted && !isFolioClosed) {
            throw new BusinessRuleException("INCONSISTENT_CHECKOUT_STATE",
                    "Inconsistent state: Booking #" + booking.getRetreatBookingId() + " is COMPLETED but Folio #" + folio.getFolioId() + " is still " + folio.getFolioStatus() + ". Manual front-desk reconciliation required.");
        }
        if (!isBookingCompleted && isFolioClosed) {
            throw new BusinessRuleException("INCONSISTENT_CHECKOUT_STATE",
                    "Inconsistent state: Folio #" + folio.getFolioId() + " is CLOSED but Booking #" + booking.getRetreatBookingId() + " is still " + booking.getBookingStatus() + ". Manual front-desk reconciliation required.");
        }

        // 3. Genuine Idempotency: Both booking is COMPLETED and folio is CLOSED
        if (isBookingCompleted && isFolioClosed) {
            if (!"PAID".equalsIgnoreCase(invoice.getInvoiceStatus())) {
                throw new BusinessRuleException("INCONSISTENT_CHECKOUT_STATE",
                        "Inconsistent state: Stay was marked COMPLETED and Folio CLOSED, but Invoice #" + invoiceId + " status is " + invoice.getInvoiceStatus() + " instead of PAID.");
            }
            if (remainingBalance.compareTo(BigDecimal.ZERO) > 0) {
                throw new BusinessRuleException("INCONSISTENT_CHECKOUT_STATE",
                        "Inconsistent state: Stay was marked COMPLETED and Folio CLOSED, but Invoice #" + invoiceId + " has unpaid remaining balance: " + remainingBalance + " VND.");
            }
            FinalizeCheckoutResponseDTO response = buildFinalizeResponse(invoice, folio, booking, false);
            response.setMessage("Resort checkout was already completed for this stay.");
            return response;
        }

        // 4. In-flight checkout: Booking must be CHECKED_IN
        if (!"CHECKED_IN".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new BusinessRuleException("BOOKING_NOT_CHECKED_IN",
                    "Checkout can only be finalized for currently checked-in stays. Current status: " + booking.getBookingStatus());
        }

        // 5. BILLING GUARD INVARIANT: Validate zero pending/preparing orders
        folioBillingService.validateBillingGuard(booking.getRetreatBookingId());

        // 6. FINANCIAL INVARIANT: Checkout cannot complete while unpaid obligations remain
        if (remainingBalance.compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessRuleException("UNPAID_CHARGES_REMAIN",
                    "Checkout cannot complete while unpaid Spa/F&B charges remain. Outstanding balance: " + remainingBalance + " VND.");
        }

        // ZERO BALANCE DUE / FULLY SETTLED PATH (SRS FR-M5-02 Alt 2)
        boolean zeroBalanceSettlement = (invoice.getFinalAmount().compareTo(BigDecimal.ZERO) == 0)
                || (successfulPayments.compareTo(BigDecimal.ZERO) == 0 && invoice.getFinalAmount().compareTo(BigDecimal.ZERO) == 0);

        // ATOMIC CLOSURE
        closeStayAndReleaseVilla(invoice, folio, booking);
        auditLogService.record("FINALIZE_CHECKOUT", "RetreatBooking#" + booking.getRetreatBookingId(), "SUCCESS");

        PhysicalVilla villa = booking.getAssignedVilla();
        FinalizeCheckoutResponseDTO response = buildFinalizeResponse(invoice, folio, booking, zeroBalanceSettlement);
        response.setMessage(zeroBalanceSettlement
                ? "Resort checkout completed with Zero Balance Due. Villa #" + (villa != null ? villa.getVillaNumber() : "N/A") + " marked as NEEDS_CLEANING."
                : "Resort checkout completed successfully. Villa #" + (villa != null ? villa.getVillaNumber() : "N/A") + " marked as NEEDS_CLEANING. Departure finalized.");

        return response;
    }

    /**
     * Confirms an asynchronous gateway payment (VNPay / Bank Transfer) idempotently.
     */
    @Transactional
    public boolean confirmGatewayPayment(String transactionReference, boolean isSuccess) {
        Optional<PaymentTransactionEntity> txOpt = paymentTransactionRepository.findByTransactionReferenceWithLock(transactionReference);
        if (txOpt.isEmpty()) {
            return false;
        }

        PaymentTransactionEntity tx = txOpt.get();
        if ("SUCCESSFUL".equalsIgnoreCase(tx.getPaymentStatus())) {
            return true; // Idempotent: already processed successfully
        }

        if (isSuccess) {
            // Over-settlement prevention guard
            if (tx.getInvoice() != null) {
                InvoiceEntity invoice = tx.getInvoice();
                BigDecimal existingPaid = paymentTransactionRepository.sumSuccessfulPaymentsForInvoice(invoice.getInvoiceId());
                if (existingPaid == null) existingPaid = BigDecimal.ZERO;
                if ("PAID".equalsIgnoreCase(invoice.getInvoiceStatus()) || existingPaid.compareTo(invoice.getFinalAmount()) >= 0) {
                    tx.setPaymentStatus("FAILED");
                    paymentTransactionRepository.save(tx);
                    auditLogService.record("PAYMENT_OVER_SETTLEMENT_BLOCKED",
                            "TxRef#" + transactionReference + " on Invoice#" + invoice.getInvoiceId()
                                    + " (Already settled: " + existingPaid + "/" + invoice.getFinalAmount() + ")", "WARNING");
                    return true;
                }
            }

            tx.setPaymentStatus("SUCCESSFUL");
            paymentTransactionRepository.save(tx);

            if (tx.getInvoice() != null) {
                InvoiceEntity invoice = tx.getInvoice();
                FolioEntity folio = invoice.getFolio();
                RetreatBooking booking = folio.getRetreatBooking();
                applySuccessfulPayment(invoice, folio, booking, tx.getAmountPaid());
                if ("PAID".equalsIgnoreCase(invoice.getInvoiceStatus())) {
                    closeStayAndReleaseVilla(invoice, folio, booking);
                }
            } else if (tx.getRetreatBooking() != null) {
                RetreatBooking booking = tx.getRetreatBooking();
                if ("PENDING".equalsIgnoreCase(booking.getBookingStatus())) {
                    booking.setBookingStatus("CONFIRMED");
                    bookingRepository.save(booking);
                }
            }
            auditLogService.record("PAYMENT_GATEWAY_WEBHOOK", "TxRef#" + transactionReference, "SUCCESS");
            return true;
        } else {
            tx.setPaymentStatus("FAILED");
            paymentTransactionRepository.save(tx);
            auditLogService.record("PAYMENT_GATEWAY_WEBHOOK", "TxRef#" + transactionReference, "FAILED");
            return true;
        }
    }

    /**
     * Atomically closes the Folio, marks Invoice PAID, completes RetreatBooking, and releases Villa for cleaning.
     */
    public void closeStayAndReleaseVilla(InvoiceEntity invoice, FolioEntity folio, RetreatBooking booking) {
        invoice.setInvoiceStatus("PAID");
        invoiceRepository.save(invoice);

        folio.setFolioStatus("CLOSED");
        folio.setClosedAt(LocalDateTime.now());
        folioRepository.save(folio);

        booking.setBookingStatus("COMPLETED");
        bookingRepository.save(booking);

        PhysicalVilla villa = booking.getAssignedVilla();
        if (villa != null) {
            villa.setVillaStatus("NEEDS_CLEANING");
            physicalVillaRepository.save(villa);
        }
    }

    private void applySuccessfulPayment(InvoiceEntity invoice, FolioEntity folio, RetreatBooking booking, BigDecimal amountPaid) {
        BigDecimal deposits = paymentTransactionRepository.sumSuccessfulDepositsForBooking(booking.getRetreatBookingId());
        if (deposits == null) deposits = BigDecimal.ZERO;

        BigDecimal allInvoicePayments = paymentTransactionRepository.sumSuccessfulPaymentsForInvoice(invoice.getInvoiceId());
        if (allInvoicePayments == null) allInvoicePayments = BigDecimal.ZERO;

        BigDecimal totalPaid = deposits.add(allInvoicePayments);
        folio.setTotalPaid(totalPaid);

        if (allInvoicePayments.compareTo(invoice.getFinalAmount()) >= 0) {
            invoice.setInvoiceStatus("PAID");
            folio.setFolioStatus("PAID");
        } else {
            invoice.setInvoiceStatus("ISSUED");
            folio.setFolioStatus("PARTIALLY_PAID");
        }

        invoiceRepository.save(invoice);
        folioRepository.save(folio);
    }

    public PaymentResponseDTO getTransactionStatus(String transactionReference) {
        PaymentTransactionEntity tx = paymentTransactionRepository.findByTransactionReference(transactionReference)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found for reference: " + transactionReference));
        return mapToPaymentResponse(tx);
    }

    public String generateVnpayPaymentUrl(InvoiceEntity invoice, BigDecimal amount, String txnRef) {
        if (vnpayHashSecret == null || vnpayHashSecret.trim().isEmpty()) {
            return null;
        }
        long amountInCents = amount.multiply(new BigDecimal(100)).longValue();
        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnpayTmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amountInCents));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", "HSWRMS Thanh toan hoa don " + (invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : invoice.getInvoiceId()));
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnpayReturnUrl);
        vnpParams.put("vnp_IpAddr", "127.0.0.1");

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
        if (hashData.length() > 0) hashData.setLength(hashData.length() - 1);
        if (query.length() > 0) query.setLength(query.length() - 1);

        String secureHash = hmacSHA512(vnpayHashSecret, hashData.toString());
        query.append("&vnp_SecureHash=").append(secureHash);

        return vnpayPayUrl + "?" + query.toString();
    }

    public static String hmacSHA512(String key, String data) {
        try {
            Mac sha512Hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            sha512Hmac.init(secretKey);
            byte[] hash = sha512Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA512 calculation failed", e);
        }
    }

    private FinalizeCheckoutResponseDTO buildFinalizeResponse(InvoiceEntity invoice, FolioEntity folio,
                                                              RetreatBooking booking, boolean zeroBalance) {
        FinalizeCheckoutResponseDTO response = new FinalizeCheckoutResponseDTO();
        response.setInvoiceId(invoice.getInvoiceId());
        response.setBookingId(booking.getRetreatBookingId());
        response.setBookingReference("HSW-" + (88000 + booking.getRetreatBookingId()));
        response.setBookingStatus("COMPLETED");
        response.setFolioStatus("CLOSED");
        response.setInvoiceStatus("PAID");
        response.setInvoiceNumber(invoice.getInvoiceNumber());
        response.setZeroBalanceSettlement(zeroBalance);

        PhysicalVilla villa = booking.getAssignedVilla();
        if (villa != null) {
            response.setVillaId(villa.getVillaId());
            response.setVillaNumber(villa.getVillaNumber());
            response.setVillaStatus(villa.getVillaStatus());
        }

        response.setTotalSettled(folio.getTotalPaid());
        response.setCompletedAt(folio.getClosedAt() != null ? folio.getClosedAt() : LocalDateTime.now());
        return response;
    }

    private PaymentResponseDTO mapToPaymentResponse(PaymentTransactionEntity tx) {
        PaymentResponseDTO dto = new PaymentResponseDTO();
        dto.setTransactionId(tx.getTransactionId());
        if (tx.getInvoice() != null) {
            dto.setInvoiceId(tx.getInvoice().getInvoiceId());
        }
        if (tx.getRetreatBooking() != null) {
            dto.setRetreatBookingId(tx.getRetreatBooking().getRetreatBookingId());
        }
        dto.setPaymentType(tx.getPaymentType());
        dto.setPaymentMethod(tx.getPaymentMethod());
        dto.setTransactionReference(tx.getTransactionReference());
        dto.setAmountPaid(tx.getAmountPaid());
        dto.setPaymentStatus(tx.getPaymentStatus());
        dto.setTransactionDate(tx.getTransactionDate());
        return dto;
    }
}
