package com.heavenstay.hswrms.m4fnb.dto;

import jakarta.validation.constraints.NotNull;

public class UpdateOrderStatusRequest {

    @NotNull(message = "status is required")
    private String status; // PENDING, PREPARING, READY, DELIVERED, CANCELLED

    private String cancellationReason;

    public UpdateOrderStatusRequest() {}

    public UpdateOrderStatusRequest(String status, String cancellationReason) {
        this.status = status;
        this.cancellationReason = cancellationReason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }
}
