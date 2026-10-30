package com.heavenstay.hswrms.m5billing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "AdjustmentRequest")
public class AdjustmentRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "adjustment_request_id")
    private Long adjustmentRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folio_item_id", nullable = false)
    private FolioItemEntity folioItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folio_id", nullable = false)
    private FolioEntity folio;

    @Column(name = "retreat_booking_id", nullable = false)
    private Long retreatBookingId;

    @Column(name = "source_meal_order_id")
    private Long sourceMealOrderId;

    @Column(name = "adjustment_type", nullable = false, length = 30)
    private String adjustmentType; // VOID, CREDIT_NOTE

    @Column(name = "requested_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal requestedAmount;

    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING_APPROVAL"; // PENDING_APPROVAL, APPROVED, REJECTED

    @Column(name = "requested_by_user_id", nullable = false)
    private Long requestedByUserId;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    public AdjustmentRequestEntity() {}

    public AdjustmentRequestEntity(FolioItemEntity folioItem, FolioEntity folio, Long retreatBookingId,
                                   Long sourceMealOrderId, String adjustmentType, BigDecimal requestedAmount,
                                   String reason, Long requestedByUserId) {
        this.folioItem = folioItem;
        this.folio = folio;
        this.retreatBookingId = retreatBookingId;
        this.sourceMealOrderId = sourceMealOrderId;
        this.adjustmentType = adjustmentType;
        this.requestedAmount = requestedAmount;
        this.reason = reason;
        this.requestedByUserId = requestedByUserId;
        this.status = "PENDING_APPROVAL";
        this.requestedAt = LocalDateTime.now();
    }

    public Long getAdjustmentRequestId() {
        return adjustmentRequestId;
    }

    public void setAdjustmentRequestId(Long adjustmentRequestId) {
        this.adjustmentRequestId = adjustmentRequestId;
    }

    public FolioItemEntity getFolioItem() {
        return folioItem;
    }

    public void setFolioItem(FolioItemEntity folioItem) {
        this.folioItem = folioItem;
    }

    public FolioEntity getFolio() {
        return folio;
    }

    public void setFolio(FolioEntity folio) {
        this.folio = folio;
    }

    public Long getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Long retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
    }

    public Long getSourceMealOrderId() {
        return sourceMealOrderId;
    }

    public void setSourceMealOrderId(Long sourceMealOrderId) {
        this.sourceMealOrderId = sourceMealOrderId;
    }

    public String getAdjustmentType() {
        return adjustmentType;
    }

    public void setAdjustmentType(String adjustmentType) {
        this.adjustmentType = adjustmentType;
    }

    public BigDecimal getRequestedAmount() {
        return requestedAmount;
    }

    public void setRequestedAmount(BigDecimal requestedAmount) {
        this.requestedAmount = requestedAmount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getRequestedByUserId() {
        return requestedByUserId;
    }

    public void setRequestedByUserId(Long requestedByUserId) {
        this.requestedByUserId = requestedByUserId;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public Long getApprovedByUserId() {
        return approvedByUserId;
    }

    public void setApprovedByUserId(Long approvedByUserId) {
        this.approvedByUserId = approvedByUserId;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}

