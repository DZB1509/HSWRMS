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

    public CreditNoteResponseDTO() {}

    public CreditNoteResponseDTO(Long creditNoteId, String creditNoteNumber, Long invoiceId, Long folioItemId,
                                 Long adjustmentRequestId, BigDecimal amount, BigDecimal taxAmount,
                                 BigDecimal finalCreditAmount, LocalDateTime issuedAt, Long issuedByUserId) {
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
}

