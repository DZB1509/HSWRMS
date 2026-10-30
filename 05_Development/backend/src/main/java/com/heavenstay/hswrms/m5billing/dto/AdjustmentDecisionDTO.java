package com.heavenstay.hswrms.m5billing.dto;

public class AdjustmentDecisionDTO {

    private String decision; // APPROVE or REJECT
    private String rejectionReason;

    public AdjustmentDecisionDTO() {}

    public AdjustmentDecisionDTO(String decision, String rejectionReason) {
        this.decision = decision;
        this.rejectionReason = rejectionReason;
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}

