package com.heavenstay.hswrms.m5billing.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AdjustmentResponseDTO {

    private Long adjustmentRequestId;
    private Long folioItemId;
    private Long folioId;
    private Long retreatBookingId;
    private Long sourceMealOrderId;
    private String adjustmentType; // VOID, CREDIT_NOTE
    private BigDecimal requestedAmount;
    private String reason;
    private String status; // PENDING_APPROVAL, APPROVED, REJECTED
    private Long requestedByUserId;
    private LocalDateTime requestedAt;
    private Long approvedByUserId;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private Long creditNoteId;
    private String creditNoteNumber;
    private String creditNoteStatus;
    private BigDecimal refundAmount;

    public AdjustmentResponseDTO() {}

    public AdjustmentResponseDTO(Long adjustmentRequestId, Long folioItemId, Long folioId, Long retreatBookingId,
                                 Long sourceMealOrderId, String adjustmentType, BigDecimal requestedAmount,
                                 String reason, String status, Long requestedByUserId, LocalDateTime requestedAt,
                                 Long approvedByUserId, LocalDateTime approvedAt, String rejectionReason,
                                 Long creditNoteId, String creditNoteNumber) {
        this.adjustmentRequestId = adjustmentRequestId;
        this.folioItemId = folioItemId;
        this.folioId = folioId;
        this.retreatBookingId = retreatBookingId;
        this.sourceMealOrderId = sourceMealOrderId;
        this.adjustmentType = adjustmentType;
        this.requestedAmount = requestedAmount;
        this.reason = reason;
        this.status = status;
        this.requestedByUserId = requestedByUserId;
        this.requestedAt = requestedAt;
        this.approvedByUserId = approvedByUserId;
        this.approvedAt = approvedAt;
        this.rejectionReason = rejectionReason;
        this.creditNoteId = creditNoteId;
        this.creditNoteNumber = creditNoteNumber;
    }

    public Long getAdjustmentRequestId() {
        return adjustmentRequestId;
    }

    public void setAdjustmentRequestId(Long adjustmentRequestId) {
        this.adjustmentRequestId = adjustmentRequestId;
    }

    public Long getFolioItemId() {
        return folioItemId;
    }

    public void setFolioItemId(Long folioItemId) {
        this.folioItemId = folioItemId;
    }

    public Long getFolioId() {
        return folioId;
    }

    public void setFolioId(Long folioId) {
        this.folioId = folioId;
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

    public String getCreditNoteStatus() {
        return creditNoteStatus;
    }

    public void setCreditNoteStatus(String creditNoteStatus) {
        this.creditNoteStatus = creditNoteStatus;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }
}

