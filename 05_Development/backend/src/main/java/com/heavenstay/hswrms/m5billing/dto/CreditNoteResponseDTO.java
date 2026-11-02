package com.heavenstay.hswrms.m5billing.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CreditNoteResponseDTO {

    private Long creditNoteId;
    private String creditNoteNumber;
    private Long invoiceId;
    private Long folioItemId;
    private Long adjustmentRequestId;
    private BigDecimal amount;
    private BigDecimal taxAmount;
    private BigDecimal finalCreditAmount;
    private LocalDateTime issuedAt;
    private Long issuedByUserId;
    private String status;
    private BigDecimal refundAmount;
    private LocalDateTime settledAt;
    private Long settledByUserId;
    private String refundTransactionRef;
    private String settlementNotes;

    public CreditNoteResponseDTO() {}

    public CreditNoteResponseDTO(Long creditNoteId, String creditNoteNumber, Long invoiceId, Long folioItemId,
                                 Long adjustmentRequestId, BigDecimal amount, BigDecimal taxAmount,
                                 BigDecimal finalCreditAmount, LocalDateTime issuedAt, Long issuedByUserId) {
        this(creditNoteId, creditNoteNumber, invoiceId, folioItemId, adjustmentRequestId, amount, taxAmount,
             finalCreditAmount, issuedAt, issuedByUserId, "CREDIT_APPLIED", BigDecimal.ZERO);
    }

    public CreditNoteResponseDTO(Long creditNoteId, String creditNoteNumber, Long invoiceId, Long folioItemId,
                                 Long adjustmentRequestId, BigDecimal amount, BigDecimal taxAmount,
                                 BigDecimal finalCreditAmount, LocalDateTime issuedAt, Long issuedByUserId,
                                 String status, BigDecimal refundAmount) {
        this(creditNoteId, creditNoteNumber, invoiceId, folioItemId, adjustmentRequestId, amount, taxAmount,
             finalCreditAmount, issuedAt, issuedByUserId, status, refundAmount, null, null, null, null);
    }

    public CreditNoteResponseDTO(Long creditNoteId, String creditNoteNumber, Long invoiceId, Long folioItemId,
                                 Long adjustmentRequestId, BigDecimal amount, BigDecimal taxAmount,
                                 BigDecimal finalCreditAmount, LocalDateTime issuedAt, Long issuedByUserId,
                                 String status, BigDecimal refundAmount, LocalDateTime settledAt,
                                 Long settledByUserId, String refundTransactionRef, String settlementNotes) {
        this.creditNoteId = creditNoteId;
        this.creditNoteNumber = creditNoteNumber;
        this.invoiceId = invoiceId;
        this.folioItemId = folioItemId;
        this.adjustmentRequestId = adjustmentRequestId;
        this.amount = amount;
        this.taxAmount = taxAmount;
        this.finalCreditAmount = finalCreditAmount;
        this.issuedAt = issuedAt;
        this.issuedByUserId = issuedByUserId;
        this.status = status;
        this.refundAmount = refundAmount != null ? refundAmount : BigDecimal.ZERO;
        this.settledAt = settledAt;
        this.settledByUserId = settledByUserId;
        this.refundTransactionRef = refundTransactionRef;
        this.settlementNotes = settlementNotes;
    }

    public Long getCreditNoteId() {
        return creditNoteId;
    }

    public void setCreditNoteId(Long creditNoteId) {
        this.creditNoteId = creditNoteId;
    }

    public String getCreditNoteNumber() {
        return creditNoteNumber;
    }

    public void setCreditNoteNumber(String creditNoteNumber) {
        this.creditNoteNumber = creditNoteNumber;
    }

    public Long getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(Long invoiceId) {
        this.invoiceId = invoiceId;
    }

    public Long getFolioItemId() {
        return folioItemId;
    }

    public void setFolioItemId(Long folioItemId) {
        this.folioItemId = folioItemId;
    }

    public Long getAdjustmentRequestId() {
        return adjustmentRequestId;
    }

    public void setAdjustmentRequestId(Long adjustmentRequestId) {
        this.adjustmentRequestId = adjustmentRequestId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getFinalCreditAmount() {
        return finalCreditAmount;
    }

    public void setFinalCreditAmount(BigDecimal finalCreditAmount) {
        this.finalCreditAmount = finalCreditAmount;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(LocalDateTime issuedAt) {
        this.issuedAt = issuedAt;
    }

    public Long getIssuedByUserId() {
        return issuedByUserId;
    }

    public void setIssuedByUserId(Long issuedByUserId) {
        this.issuedByUserId = issuedByUserId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }

    public LocalDateTime getSettledAt() {
        return settledAt;
    }

    public void setSettledAt(LocalDateTime settledAt) {
        this.settledAt = settledAt;
    }

    public Long getSettledByUserId() {
        return settledByUserId;
    }

    public void setSettledByUserId(Long settledByUserId) {
        this.settledByUserId = settledByUserId;
    }

    public String getRefundTransactionRef() {
        return refundTransactionRef;
    }

    public void setRefundTransactionRef(String refundTransactionRef) {
        this.refundTransactionRef = refundTransactionRef;
    }

    public String getSettlementNotes() {
        return settlementNotes;
    }

    public void setSettlementNotes(String settlementNotes) {
        this.settlementNotes = settlementNotes;
    }
}
