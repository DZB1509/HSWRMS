package com.heavenstay.hswrms.m5billing.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Formal invoice view. {@code amountDue} is what is still owed on the invoice
 * (final amount minus successful FINAL payments and applied credit notes);
 * {@code zeroBalance} means the stay can be finalized without any payment step (SRS FR-M5-02 Alt 2).
 * {@code pendingRefundTotal} tracks refund liability for credit notes issued against already PAID invoices.
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
        List<FolioItemResponseDTO> items,
        BigDecimal creditNotesTotal,
        BigDecimal pendingRefundTotal) {

    public InvoiceResponseDTO(
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
        this(invoiceId, folioId, retreatBookingId,
             invoiceNumber, bookingReference, customerName, villaNumber,
             checkInDate, checkOutDate, packageCharges, depositDeducted, packageOutstanding,
             spaCharges, fnbCharges, vatRate, subtotalAmount, taxAmount, finalAmount,
             amountPaid, amountDue, zeroBalance, invoiceStatus, issuedDate, items,
             BigDecimal.ZERO, BigDecimal.ZERO);
    }

    public InvoiceResponseDTO(
            Long invoiceId,
            Long folioId,
            Integer retreatBookingId,
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
        this(invoiceId, folioId, retreatBookingId != null ? retreatBookingId.longValue() : null,
             invoiceNumber, bookingReference, customerName, villaNumber,
             checkInDate, checkOutDate, packageCharges, depositDeducted, packageOutstanding,
             spaCharges, fnbCharges, vatRate, subtotalAmount, taxAmount, finalAmount,
             amountPaid, amountDue, zeroBalance, invoiceStatus, issuedDate, items,
             BigDecimal.ZERO, BigDecimal.ZERO);
    }

    public InvoiceResponseDTO(
            Long invoiceId,
            Long folioId,
            Integer retreatBookingId,
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
            List<FolioItemResponseDTO> items,
            BigDecimal creditNotesTotal,
            BigDecimal pendingRefundTotal) {
        this(invoiceId, folioId, retreatBookingId != null ? retreatBookingId.longValue() : null,
             invoiceNumber, bookingReference, customerName, villaNumber,
             checkInDate, checkOutDate, packageCharges, depositDeducted, packageOutstanding,
             spaCharges, fnbCharges, vatRate, subtotalAmount, taxAmount, finalAmount,
             amountPaid, amountDue, zeroBalance, invoiceStatus, issuedDate, items,
             creditNotesTotal, pendingRefundTotal);
    }
}
