package com.heavenstay.hswrms.m5billing.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m5billing.dto.FinalizeCheckoutResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.PaymentRequestDTO;
import com.heavenstay.hswrms.m5billing.dto.PaymentResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.VietQrResponseDTO;
import com.heavenstay.hswrms.m5billing.security.BillingAccessEvaluator;
import com.heavenstay.hswrms.m5billing.service.CheckoutService;
import com.heavenstay.hswrms.m5billing.service.VietQrService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/billing")
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final VietQrService vietQrService;
    private final BillingAccessEvaluator billingAccess;

    public CheckoutController(CheckoutService checkoutService,
                              VietQrService vietQrService,
                              BillingAccessEvaluator billingAccess) {
        this.checkoutService = checkoutService;
        this.vietQrService = vietQrService;
        this.billingAccess = billingAccess;
    }

    @PostMapping("/invoices/{invoiceId}/pay")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessInvoice(#invoiceId, authentication)")
    public ResponseEntity<ApiResponse<PaymentResponseDTO>> processPayment(
            @PathVariable("invoiceId") Long invoiceId,
            @Valid @RequestBody PaymentRequestDTO request,
            Authentication authentication) {
        boolean isStaff = billingAccess.isStaff(authentication);
        PaymentResponseDTO response = checkoutService.processPayment(invoiceId, request, isStaff);
        return ResponseEntity.ok(ApiResponse.ok("Payment processed successfully", response));
    }

    @GetMapping({"/invoices/{invoiceId}/vietqr", "/checkout/vietqr/{invoiceId}"})
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessInvoice(#invoiceId, authentication)")
    public ResponseEntity<ApiResponse<VietQrResponseDTO>> getInvoiceVietQr(
            @PathVariable("invoiceId") Long invoiceId) {
        VietQrResponseDTO response = vietQrService.generateInvoiceVietQr(invoiceId);
        return ResponseEntity.ok(ApiResponse.ok("Dynamic VietQR generated successfully", response));
    }

    @GetMapping({"/deposit/{bookingId}/vietqr", "/checkout/deposit/{bookingId}/vietqr"})
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessBooking(#bookingId, authentication)")
    public ResponseEntity<ApiResponse<VietQrResponseDTO>> getDepositVietQr(
            @PathVariable("bookingId") Integer bookingId) {
        VietQrResponseDTO response = vietQrService.generateDepositVietQr(bookingId);
        return ResponseEntity.ok(ApiResponse.ok("Dynamic VietQR for deposit generated successfully", response));
    }

    @GetMapping("/payments/transactions/{transactionReference}/status")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessTransaction(#transactionReference, authentication)")
    public ResponseEntity<ApiResponse<PaymentResponseDTO>> getTransactionStatus(
            @PathVariable("transactionReference") String transactionReference) {
        PaymentResponseDTO response = checkoutService.getTransactionStatus(transactionReference);
        return ResponseEntity.ok(ApiResponse.ok("Payment transaction status retrieved", response));
    }

    @PostMapping("/invoices/{invoiceId}/finalize-checkout")
    @PreAuthorize("@billingAccess.canFinalizeCheckout(#invoiceId, authentication)")
    public ResponseEntity<ApiResponse<FinalizeCheckoutResponseDTO>> finalizeCheckout(
            @PathVariable("invoiceId") Long invoiceId) {
        FinalizeCheckoutResponseDTO response = checkoutService.finalizeCheckout(invoiceId);
        return ResponseEntity.ok(ApiResponse.ok("Resort checkout completed successfully", response));
    }
}
