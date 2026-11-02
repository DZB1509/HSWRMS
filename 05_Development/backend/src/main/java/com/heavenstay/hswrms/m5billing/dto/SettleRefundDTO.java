package com.heavenstay.hswrms.m5billing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Request payload for confirming refund settlement of a Credit Note.
 */
public class SettleRefundDTO {

    @NotNull(message = "Settlement amount is required")
    @DecimalMin(value = "0.01", message = "Settlement amount must be positive")
    private BigDecimal settlementAmount;

    @NotBlank(message = "Transaction reference is required")
    private String transactionReference;

    private String notes;

    public SettleRefundDTO() {}

    public SettleRefundDTO(BigDecimal settlementAmount, String transactionReference, String notes) {
        this.settlementAmount = settlementAmount;
        this.transactionReference = transactionReference;
        this.notes = notes;
    }

    public BigDecimal getSettlementAmount() {
        return settlementAmount;
    }

    public void setSettlementAmount(BigDecimal settlementAmount) {
        this.settlementAmount = settlementAmount;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

