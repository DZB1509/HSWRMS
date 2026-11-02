package com.heavenstay.hswrms.m5billing.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m5billing.dto.FolioItemResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.FolioResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.InvoiceResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.PostChargeRequestDTO;
import com.heavenstay.hswrms.m5billing.service.FolioBillingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/billing")
public class FolioBillingController {

    private final FolioBillingService folioBillingService;

    public FolioBillingController(FolioBillingService folioBillingService) {
        this.folioBillingService = folioBillingService;
    }

    @GetMapping("/folios/{bookingId}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessBooking(#bookingId, authentication)")
    public ResponseEntity<ApiResponse<FolioResponseDTO>> getFolioByBookingId(@PathVariable("bookingId") Long bookingId) {
        FolioResponseDTO response = folioBillingService.getFolioByBookingId(bookingId);
        return ResponseEntity.ok(ApiResponse.ok("Folio retrieved successfully", response));
    }

    @PostMapping("/charges")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN')")
    public ResponseEntity<ApiResponse<FolioItemResponseDTO>> postFolioCharge(@Valid @RequestBody PostChargeRequestDTO request) {
        FolioItemResponseDTO response = folioBillingService.postFolioCharge(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Charge posted to folio successfully", response));
    }

    @PostMapping("/folios/{bookingId}/invoice")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessBooking(#bookingId, authentication)")
    public ResponseEntity<ApiResponse<InvoiceResponseDTO>> generateConsolidatedInvoice(@PathVariable("bookingId") Long bookingId) {
        InvoiceResponseDTO response = folioBillingService.generateConsolidatedInvoice(bookingId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Consolidated invoice generated successfully", response));
    }

    @GetMapping("/invoices/{invoiceId}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessInvoice(#invoiceId, authentication)")
    public ResponseEntity<ApiResponse<InvoiceResponseDTO>> getInvoiceById(@PathVariable("invoiceId") Long invoiceId) {
        InvoiceResponseDTO response = folioBillingService.getInvoiceById(invoiceId);
        return ResponseEntity.ok(ApiResponse.ok("Invoice statement retrieved successfully", response));
    }
}
