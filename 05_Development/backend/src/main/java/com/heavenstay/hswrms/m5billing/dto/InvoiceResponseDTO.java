package com.heavenstay.hswrms.m5billing.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Formal invoice view. {@code amountDue} is what is still owed on the invoice
 * (final amount minus successful FINAL payments); {@code zeroBalance} means the stay
 * can be finalized without any payment step (SRS FR-M5-02 Alt 2).
 */
public record InvoiceResponseDTO(
        Long invoiceId,
        Long folioId,
        Long retreatBookingId,
        String invoiceNumber,
        String bookingReference,
        String customerName,
        String villaNumber,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        BigDecimal packageCharges,
        BigDecimal depositDeducted,
        BigDecimal packageOutstanding,
        BigDecimal spaCharges,
        BigDecimal fnbCharges,
        BigDecimal vatRate,
        BigDecimal subtotalAmount,
        BigDecimal taxAmount,
        BigDecimal finalAmount,
        BigDecimal amountPaid,
        BigDecimal amountDue,
        boolean zeroBalance,
        String invoiceStatus,
        LocalDateTime issuedDate,
        List<FolioItemResponseDTO> items) {
}
