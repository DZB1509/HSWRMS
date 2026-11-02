package com.heavenstay.hswrms.m5billing.dto;

import java.math.BigDecimal;

public class CreateAdjustmentRequestDTO {

    private Long folioItemId;
    private String reason;
    private BigDecimal requestedAmount;

    public CreateAdjustmentRequestDTO() {}

    public CreateAdjustmentRequestDTO(Long folioItemId, String reason, BigDecimal requestedAmount) {
        this.folioItemId = folioItemId;
        this.reason = reason;
        this.requestedAmount = requestedAmount;
    }

    public Long getFolioItemId() {
        return folioItemId;
    }

    public void setFolioItemId(Long folioItemId) {
        this.folioItemId = folioItemId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public BigDecimal getRequestedAmount() {
        return requestedAmount;
    }

    public void setRequestedAmount(BigDecimal requestedAmount) {
        this.requestedAmount = requestedAmount;
    }
}

