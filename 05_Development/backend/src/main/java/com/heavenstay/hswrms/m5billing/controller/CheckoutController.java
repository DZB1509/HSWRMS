package com.heavenstay.hswrms.m5billing.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m5billing.dto.FinalizeCheckoutResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.PaymentRequestDTO;
import com.heavenstay.hswrms.m5billing.dto.PaymentResponseDTO;
import com.heavenstay.hswrms.m5billing.security.BillingAccessEvaluator;
import com.heavenstay.hswrms.m5billing.service.CheckoutService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/billing")
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final BillingAccessEvaluator billingAccess;

    public CheckoutController(CheckoutService checkoutService, BillingAccessEvaluator billingAccess) {
        this.checkoutService = checkoutService;
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

    @PostMapping("/invoices/{invoiceId}/finalize-checkout")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN')")
    public ResponseEntity<ApiResponse<FinalizeCheckoutResponseDTO>> finalizeCheckout(
            @PathVariable("invoiceId") Long invoiceId) {
        FinalizeCheckoutResponseDTO response = checkoutService.finalizeCheckout(invoiceId);
        return ResponseEntity.ok(ApiResponse.ok("Resort checkout completed successfully", response));
    }
}
