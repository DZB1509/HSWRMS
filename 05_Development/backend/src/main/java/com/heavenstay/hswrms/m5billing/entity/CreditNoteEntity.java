package com.heavenstay.hswrms.m5billing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "CreditNote")
public class CreditNoteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "credit_note_id")
    private Long creditNoteId;

    @Column(name = "credit_note_number", nullable = false, unique = true, length = 50)
    private String creditNoteNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private InvoiceEntity invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folio_item_id", nullable = false)
    private FolioItemEntity folioItem;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adjustment_request_id", nullable = false, unique = true)
    private AdjustmentRequestEntity adjustmentRequest;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "tax_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "final_credit_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal finalCreditAmount;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt = LocalDateTime.now();

    @Column(name = "issued_by_user_id", nullable = false)
    private Long issuedByUserId;

    public CreditNoteEntity() {}

    public CreditNoteEntity(String creditNoteNumber, InvoiceEntity invoice, FolioItemEntity folioItem,
                            AdjustmentRequestEntity adjustmentRequest, BigDecimal amount, BigDecimal taxAmount,
                            BigDecimal finalCreditAmount, Long issuedByUserId) {
        this.creditNoteNumber = creditNoteNumber;
        this.invoice = invoice;
        this.folioItem = folioItem;
        this.adjustmentRequest = adjustmentRequest;
        this.amount = amount;
        this.taxAmount = taxAmount != null ? taxAmount : BigDecimal.ZERO;
        this.finalCreditAmount = finalCreditAmount;
        this.issuedByUserId = issuedByUserId;
        this.issuedAt = LocalDateTime.now();
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

    public InvoiceEntity getInvoice() {
        return invoice;
    }

    public void setInvoice(InvoiceEntity invoice) {
        this.invoice = invoice;
    }

    public FolioItemEntity getFolioItem() {
        return folioItem;
    }

    public void setFolioItem(FolioItemEntity folioItem) {
        this.folioItem = folioItem;
    }

    public AdjustmentRequestEntity getAdjustmentRequest() {
        return adjustmentRequest;
    }

    public void setAdjustmentRequest(AdjustmentRequestEntity adjustmentRequest) {
        this.adjustmentRequest = adjustmentRequest;
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

