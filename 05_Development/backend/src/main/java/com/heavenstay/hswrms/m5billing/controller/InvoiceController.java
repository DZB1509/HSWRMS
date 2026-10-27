package com.heavenstay.hswrms.m5billing.controller;

import com.heavenstay.hswrms.m5billing.dto.InvoiceResponseDTO;
import com.heavenstay.hswrms.m5billing.service.FolioBillingService;
import com.heavenstay.hswrms.m5billing.service.InvoicePdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/billing/invoices")
public class InvoiceController {

    private final InvoicePdfService invoicePdfService;
    private final FolioBillingService folioBillingService;

    public InvoiceController(InvoicePdfService invoicePdfService, FolioBillingService folioBillingService) {
        this.invoicePdfService = invoicePdfService;
        this.folioBillingService = folioBillingService;
    }

    @GetMapping("/{invoiceId}/pdf")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessInvoice(#invoiceId, authentication)")
    public ResponseEntity<byte[]> getInvoicePdf(@PathVariable("invoiceId") Long invoiceId) {
        InvoiceResponseDTO invoice = folioBillingService.getInvoiceById(invoiceId);
        byte[] pdfBytes = invoicePdfService.generateInvoicePdf(invoiceId);

        String filename = "invoice-" + invoice.invoiceNumber() + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .body(pdfBytes);
    }
}
