package com.heavenstay.hswrms.m5billing.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVillaEntity;
import com.heavenstay.hswrms.m2booking.entity.RetreatBookingEntity;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m5billing.dto.FinalizeCheckoutResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.PaymentRequestDTO;
import com.heavenstay.hswrms.m5billing.dto.PaymentResponseDTO;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class CheckoutService {

    private static final Set<String> VALID_PAYMENT_METHODS = Set.of("CASH", "CARD", "VNPAY");

    private final InvoiceRepository invoiceRepository;
    private final FolioRepository folioRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RetreatBookingRepository bookingRepository;
    private final PhysicalVillaRepository physicalVillaRepository;
    private final FolioBillingService folioBillingService;
    private final AuditLogService auditLogService;
    private final boolean mockAutoConfirm;

    public CheckoutService(InvoiceRepository invoiceRepository,
                           FolioRepository folioRepository,
                           PaymentTransactionRepository paymentTransactionRepository,
                           RetreatBookingRepository bookingRepository,
                           PhysicalVillaRepository physicalVillaRepository,
                           FolioBillingService folioBillingService,
                           AuditLogService auditLogService,
                           @Value("${app.vnpay.mock-auto-confirm:false}") boolean mockAutoConfirm) {
        this.invoiceRepository = invoiceRepository;
        this.folioRepository = folioRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.bookingRepository = bookingRepository;
        this.physicalVillaRepository = physicalVillaRepository;
        this.folioBillingService = folioBillingService;
        this.auditLogService = auditLogService;
        this.mockAutoConfirm = mockAutoConfirm;
    }

    @Transactional
    public PaymentResponseDTO processPayment(Long invoiceId, PaymentRequestDTO request, boolean isStaff) {
        InvoiceEntity invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        FolioEntity folio = invoice.getFolio();
        RetreatBookingEntity booking = folio.getRetreatBooking();

        // Guard: Check method validity
        String method = request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "";
        if (!VALID_PAYMENT_METHODS.contains(method)) {
            throw new BusinessRuleException("INVALID_PAYMENT_METHOD",
                    "Payment method must be one of: CASH, CARD, VNPAY. Provided: " + request.getPaymentMethod());
        }

        // Guard: Role restrictions on payment method
        if (!isStaff && !"VNPAY".equalsIgnoreCase(method)) {
            throw new AccessDeniedException("Customer can only pay via VNPay online QR. Cash and POS Card are restricted to Front Desk.");
        }

        // Guard: Billing guard on unsettled orders
        folioBillingService.validateBillingGuard(booking.getRetreatBookingId());

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

        // Determine status: VNPAY without mockAutoConfirm is PENDING awaiting webhook
        String paymentStatus = ("VNPAY".equalsIgnoreCase(method) && !mockAutoConfirm) ? "PENDING" : "SUCCESSFUL";

        PaymentTransactionEntity transaction = new PaymentTransactionEntity(
                null,
                invoice,
                "FINAL",
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
            auditLogService.record("PAYMENT_INITIATED", "Invoice#" + invoiceId + " (VNPAY-PENDING)", "PENDING");
        }

        PaymentResponseDTO response = mapToPaymentResponse(savedTx);
        if ("PENDING".equalsIgnoreCase(paymentStatus)) {
            response.setMessage("VNPay QR payment initiated. Awaiting gateway webhook confirmation.");
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

        FolioEntity folio = invoice.getFolio();
        RetreatBookingEntity booking = folio.getRetreatBooking();

        // Idempotency: If checkout already completed, return idempotent response
        if ("COMPLETED".equalsIgnoreCase(booking.getBookingStatus()) && "CLOSED".equalsIgnoreCase(folio.getFolioStatus())) {
            FinalizeCheckoutResponseDTO response = buildFinalizeResponse(invoice, folio, booking, false);
            response.setMessage("Resort checkout was already completed for this stay.");
            return response;
        }

        // Booking status check: Must be CHECKED_IN
        if (!"CHECKED_IN".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new BusinessRuleException("BOOKING_NOT_CHECKED_IN",
                    "Checkout can only be finalized for currently checked-in stays. Current status: " + booking.getBookingStatus());
        }

        // 1. BILLING GUARD INVARIANT: Validate zero pending/preparing orders
        folioBillingService.validateBillingGuard(booking.getRetreatBookingId());

        // 2. FINANCIAL INVARIANT: Checkout cannot complete while unpaid obligations remain
        BigDecimal successfulPayments = paymentTransactionRepository.sumSuccessfulPaymentsForInvoice(invoiceId);
        if (successfulPayments == null) successfulPayments = BigDecimal.ZERO;

        BigDecimal remainingBalance = invoice.getFinalAmount().subtract(successfulPayments);
        if (remainingBalance.compareTo(BigDecimal.ZERO) < 0) remainingBalance = BigDecimal.ZERO;

        boolean isZeroBalance = remainingBalance.compareTo(BigDecimal.ZERO) == 0;
        if (!isZeroBalance && !"PAID".equalsIgnoreCase(invoice.getInvoiceStatus())) {
            throw new BusinessRuleException("UNPAID_CHARGES_REMAIN",
                    "Checkout cannot complete while unpaid Spa/F&B charges remain. Outstanding balance: " + remainingBalance + " VND.");
        }

        // 3. ZERO BALANCE DUE / FULLY SETTLED PATH (SRS FR-M5-02 Alt 2)
        boolean zeroBalanceSettlement = (invoice.getFinalAmount().compareTo(BigDecimal.ZERO) == 0)
                || (successfulPayments.compareTo(BigDecimal.ZERO) == 0 && invoice.getFinalAmount().compareTo(BigDecimal.ZERO) == 0);

        // 4. ATOMIC BACKEND TRANSACTION
        // - Invoice.invoice_status -> 'PAID'
        // - Folio.folio_status -> 'CLOSED'
        // - RetreatBooking.booking_status -> 'COMPLETED'
        // - PhysicalVilla.villa_status -> 'NEEDS_CLEANING'
        invoice.setInvoiceStatus("PAID");
        invoiceRepository.save(invoice);

        folio.setFolioStatus("CLOSED");
        folio.setClosedAt(LocalDateTime.now());
        folioRepository.save(folio);

        booking.setBookingStatus("COMPLETED");
        bookingRepository.save(booking);

        PhysicalVillaEntity villa = booking.getAssignedVilla();
        if (villa != null) {
            villa.setVillaStatus("NEEDS_CLEANING");
            physicalVillaRepository.save(villa);
        }

        auditLogService.record("FINALIZE_CHECKOUT", "RetreatBooking#" + booking.getRetreatBookingId(), "SUCCESS");

        FinalizeCheckoutResponseDTO response = buildFinalizeResponse(invoice, folio, booking, zeroBalanceSettlement);
        response.setMessage(zeroBalanceSettlement
                ? "Resort checkout completed with Zero Balance Due. Villa #" + (villa != null ? villa.getVillaNumber() : "N/A") + " marked as NEEDS_CLEANING."
                : "Resort checkout completed successfully. Villa #" + (villa != null ? villa.getVillaNumber() : "N/A") + " marked as NEEDS_CLEANING. Departure finalized.");

        return response;
    }

    @Transactional
    public boolean confirmGatewayPayment(String transactionReference, boolean isSuccess) {
        Optional<PaymentTransactionEntity> txOpt = paymentTransactionRepository.findByTransactionReference(transactionReference);
        if (txOpt.isEmpty()) {
            return false;
        }

        PaymentTransactionEntity tx = txOpt.get();
        if ("SUCCESSFUL".equalsIgnoreCase(tx.getPaymentStatus())) {
            return true; // Already processed
        }

        if (isSuccess) {
            tx.setPaymentStatus("SUCCESSFUL");
            paymentTransactionRepository.save(tx);

            if (tx.getInvoice() != null) {
                InvoiceEntity invoice = tx.getInvoice();
                FolioEntity folio = invoice.getFolio();
                RetreatBookingEntity booking = folio.getRetreatBooking();
                applySuccessfulPayment(invoice, folio, booking, tx.getAmountPaid());
            }
            auditLogService.record("VNPAY_WEBHOOK", "TxRef#" + transactionReference, "SUCCESS");
            return true;
        } else {
            tx.setPaymentStatus("FAILED");
            paymentTransactionRepository.save(tx);
            auditLogService.record("VNPAY_WEBHOOK", "TxRef#" + transactionReference, "FAILED");
            return true;
        }
    }

    private void applySuccessfulPayment(InvoiceEntity invoice, FolioEntity folio, RetreatBookingEntity booking, BigDecimal amountPaid) {
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

    private FinalizeCheckoutResponseDTO buildFinalizeResponse(InvoiceEntity invoice, FolioEntity folio,
                                                              RetreatBookingEntity booking, boolean zeroBalance) {
        FinalizeCheckoutResponseDTO response = new FinalizeCheckoutResponseDTO();
        response.setInvoiceId(invoice.getInvoiceId());
        response.setBookingId(booking.getRetreatBookingId());
        response.setBookingReference("HSW-" + (88000 + booking.getRetreatBookingId()));
        response.setBookingStatus("COMPLETED");
        response.setFolioStatus("CLOSED");
        response.setInvoiceStatus("PAID");
        response.setInvoiceNumber(invoice.getInvoiceNumber());
        response.setZeroBalanceSettlement(zeroBalance);

        PhysicalVillaEntity villa = booking.getAssignedVilla();
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
