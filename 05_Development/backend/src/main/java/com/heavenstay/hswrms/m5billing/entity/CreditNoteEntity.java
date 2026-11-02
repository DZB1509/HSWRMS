package com.heavenstay.hswrms.m5billing.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "CreditNote")
public class CreditNoteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "credit_note_id")
    @JdbcTypeCode(SqlTypes.INTEGER)
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

    @Column(name = "status", nullable = false, length = 30)
    private String status = "CREDIT_APPLIED"; // CREDIT_APPLIED, PENDING_REFUND, REFUNDED

    @Column(name = "refund_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal refundAmount = BigDecimal.ZERO;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt = LocalDateTime.now();

    @Column(name = "issued_by_user_id", nullable = false)
    @JdbcTypeCode(SqlTypes.INTEGER)
    private Long issuedByUserId;

    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    @Column(name = "settled_by_user_id")
    @JdbcTypeCode(SqlTypes.INTEGER)
    private Long settledByUserId;

    @Column(name = "refund_transaction_ref", length = 100)
    private String refundTransactionRef;

    @Column(name = "settlement_notes", length = 500)
    private String settlementNotes;

    public CreditNoteEntity() {}

    public CreditNoteEntity(String creditNoteNumber, InvoiceEntity invoice, FolioItemEntity folioItem,
                            AdjustmentRequestEntity adjustmentRequest, BigDecimal amount, BigDecimal taxAmount,
                            BigDecimal finalCreditAmount, Long issuedByUserId) {
        this(creditNoteNumber, invoice, folioItem, adjustmentRequest, amount, taxAmount, finalCreditAmount,
             issuedByUserId, "CREDIT_APPLIED", BigDecimal.ZERO);
    }

    public CreditNoteEntity(String creditNoteNumber, InvoiceEntity invoice, FolioItemEntity folioItem,
                            AdjustmentRequestEntity adjustmentRequest, BigDecimal amount, BigDecimal taxAmount,
                            BigDecimal finalCreditAmount, Long issuedByUserId, String status, BigDecimal refundAmount) {
        this.creditNoteNumber = creditNoteNumber;
        this.invoice = invoice;
        this.folioItem = folioItem;
        this.adjustmentRequest = adjustmentRequest;
        this.amount = amount;
        this.taxAmount = taxAmount != null ? taxAmount : BigDecimal.ZERO;
        this.finalCreditAmount = finalCreditAmount;
        this.issuedByUserId = issuedByUserId;
        this.status = status != null ? status : "CREDIT_APPLIED";
        this.refundAmount = refundAmount != null ? refundAmount : BigDecimal.ZERO;
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

    public String getStatus() {
        return status != null ? status : "CREDIT_APPLIED";
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount != null ? refundAmount : BigDecimal.ZERO;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount != null ? refundAmount : BigDecimal.ZERO;
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
