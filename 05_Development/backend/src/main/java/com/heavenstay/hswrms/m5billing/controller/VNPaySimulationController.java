package com.heavenstay.hswrms.m5billing.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.m5billing.service.CheckoutService;
import com.heavenstay.hswrms.m5billing.service.FolioBillingService;
import com.heavenstay.hswrms.m5billing.service.VNPayService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Dev/Test only controller for VNPay sandbox payment simulation and instant settlement callback.
 * Isolated via @Profile({"dev", "local", "test"}) so it is never registered in production.
 */
@RestController
@Profile({"dev", "local", "test"})
@PreAuthorize("hasAnyRole('CUSTOMER', 'RECEPTIONIST', 'ADMIN')")
public class VNPaySimulationController {

    private static final Logger log = LoggerFactory.getLogger(VNPaySimulationController.class);

    private final VNPayService vnPayService;
    private final CheckoutService checkoutService;
    private final PaymentTransactionRepository transactionRepository;
    private final InvoiceRepository invoiceRepository;
    private final FolioRepository folioRepository;
    private final FolioBillingService folioBillingService;
    private final boolean simulationEnabled;

    public VNPaySimulationController(
            VNPayService vnPayService,
            CheckoutService checkoutService,
            PaymentTransactionRepository transactionRepository,
            InvoiceRepository invoiceRepository,
            FolioRepository folioRepository,
            FolioBillingService folioBillingService,
            @Value("${app.vnpay.sandbox-simulation:true}") boolean simulationEnabled) {
        this.vnPayService = vnPayService;
        this.checkoutService = checkoutService;
        this.transactionRepository = transactionRepository;
        this.invoiceRepository = invoiceRepository;
        this.folioRepository = folioRepository;
        this.folioBillingService = folioBillingService;
        this.simulationEnabled = simulationEnabled;
    }

    /**
     * Dev Mode: Instant 100% payment settlement simulation for VietQR and VNPay.
     * Completes PaymentTransaction -> SUCCESSFUL, Invoice -> PAID, Folio -> CLOSED, Booking -> COMPLETED, Villa -> NEEDS_CLEANING.
     */
    @PostMapping({
            "/api/v1/billing/payment/simulate-success",
            "/api/v1/billing/payments/simulate-success",
            "/api/v1/m5/payments/simulate-success"
    })
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> simulateSuccess(
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam(required = false) String transactionRef,
            @RequestParam(required = false) Long invoiceId,
            @RequestParam(required = false) Long bookingId,
            @RequestParam(required = false) Long folioId) {

        if (!simulationEnabled) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("400 Bad Request: Simulation is disabled. Real transactions must be processed via VNPay Gateway or VietQR."));
        }

        String targetRef = extractString(body, "transactionRef", "transactionReference", transactionRef);
        Long targetInvoiceId = extractLong(body, "invoiceId", invoiceId);
        Long targetBookingId = extractLong(body, "bookingId", bookingId);
        Long targetFolioId = extractLong(body, "folioId", folioId);

        PaymentTransactionEntity tx = null;
        if (targetRef != null && !targetRef.isBlank()) {
            tx = transactionRepository.findByTransactionReference(targetRef).orElse(null);
        }

        InvoiceEntity invoice = null;
        if (tx != null && tx.getInvoice() != null) {
            invoice = tx.getInvoice();
        } else if (targetInvoiceId != null && targetInvoiceId > 0) {
            invoice = invoiceRepository.findByIdWithDetails(targetInvoiceId).orElse(null);
        } else if (targetBookingId != null && targetBookingId > 0) {
            invoice = invoiceRepository.findByRetreatBookingId(targetBookingId.intValue()).orElse(null);
            if (invoice == null) {
                try {
                    com.heavenstay.hswrms.m5billing.dto.InvoiceResponseDTO gen = folioBillingService.generateConsolidatedInvoice(targetBookingId.intValue());
                    if (gen != null && gen.invoiceId() != null) {
                        invoice = invoiceRepository.findByIdWithDetails(gen.invoiceId()).orElse(null);
                    }
                } catch (Exception e) {
                    log.warn("Auto-generate invoice failed in simulateSuccess for booking {}: {}", targetBookingId, e.getMessage());
                }
            }
        } else if (targetFolioId != null && targetFolioId > 0) {
            invoice = invoiceRepository.findByFolioId(targetFolioId).orElse(null);
        }

        if (invoice == null) {
            List<InvoiceEntity> allInvoices = invoiceRepository.findAll();
            if (!allInvoices.isEmpty()) {
                invoice = allInvoices.get(0);
            }
        }

        if (tx == null) {
            if (invoice != null) {
                List<PaymentTransactionEntity> existingTxs = transactionRepository.findByInvoiceId(invoice.getInvoiceId());
                tx = existingTxs.stream()
                        .filter(t -> !"SUCCESSFUL".equalsIgnoreCase(t.getPaymentStatus()))
                        .findFirst()
                        .orElse(null);
            }

            if (tx == null && invoice != null) {
                BigDecimal existingPaid = transactionRepository.sumSuccessfulPaymentsForInvoice(invoice.getInvoiceId());
                if (existingPaid == null) existingPaid = BigDecimal.ZERO;
                BigDecimal bal = invoice.getFinalAmount().subtract(existingPaid);
                if (bal.compareTo(BigDecimal.ZERO) <= 0) {
                    bal = invoice.getFinalAmount();
                }

                tx = new PaymentTransactionEntity();
                tx.setTransactionReference(targetRef != null && !targetRef.isBlank() ? targetRef : "HSW-SIM-" + System.currentTimeMillis());
                tx.setPaymentType("FINAL");
                tx.setPaymentMethod("VNPAY");
                tx.setPaymentStatus("PENDING");
                tx.setAmountPaid(bal);
                tx.setTransactionDate(LocalDateTime.now());
                tx.setInvoice(invoice);
                tx.setRetreatBooking(null);
                tx = transactionRepository.save(tx);
            }
        }

        if (tx != null) {
            checkoutService.confirmGatewayPayment(tx.getTransactionReference(), true);
        }

        if (invoice != null && invoice.getFolio() != null) {
            FolioEntity folio = invoice.getFolio();
            com.heavenstay.hswrms.m2booking.entity.RetreatBooking booking = folio.getRetreatBooking();
            if (booking != null && booking.getRetreatBookingId() != null) {
                folioBillingService.settleAllUnderlyingOrdersAndSessions(booking.getRetreatBookingId());
            }
            if (!"CLOSED".equalsIgnoreCase(folio.getFolioStatus())) {
                checkoutService.closeStayAndReleaseVilla(invoice, folio, booking);
            }
        } else if (targetBookingId != null) {
            folioBillingService.settleAllUnderlyingOrdersAndSessions(targetBookingId.intValue());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transactionReference", tx != null ? tx.getTransactionReference() : targetRef);
        result.put("invoiceId", invoice != null ? invoice.getInvoiceId() : targetInvoiceId);
        result.put("invoiceStatus", "PAID");
        result.put("folioStatus", "CLOSED");
        result.put("bookingStatus", "COMPLETED");
        result.put("villaStatus", "NEEDS_CLEANING");
        result.put("paymentStatus", "SUCCESSFUL");
        result.put("message", "Simulated settlement completed successfully. Stay closed and villa set to NEEDS_CLEANING.");

        return ResponseEntity.ok(ApiResponse.ok("Payment simulation succeeded", result));
    }

    /** Sandbox legacy simulation handler. */
    @PostMapping({"/api/v1/payments/vnpay/simulate", "/api/v1/m5/payments/vnpay/simulate"})
    public ResponseEntity<ApiResponse<Map<String, String>>> simulate(
            @RequestParam String transactionRef, @RequestParam(defaultValue = "SUCCESS") String outcome) {
        if (!simulationEnabled) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("400 Bad Request: Simulation is disabled. Real transactions must be processed via VNPay Gateway or VietQR."));
        }
        return ResponseEntity.ok(ApiResponse.ok("Simulated VNPay callback processed", vnPayService.simulateCallback(transactionRef, outcome)));
    }

    private String extractString(Map<String, Object> body, String k1, String k2, String fallback) {
        if (body != null) {
            if (body.get(k1) != null) return String.valueOf(body.get(k1)).trim();
            if (body.get(k2) != null) return String.valueOf(body.get(k2)).trim();
        }
        return fallback != null ? fallback.trim() : null;
    }

    private Long extractLong(Map<String, Object> body, String key, Long fallback) {
        if (body != null && body.get(key) != null) {
            try {
                return Long.parseLong(String.valueOf(body.get(key)).trim());
            } catch (NumberFormatException ignored) {}
        }
        return fallback;
    }
}
