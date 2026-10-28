package com.heavenstay.hswrms.m4fnb.dto;

public class CancelOrderRequest {

    private String cancellationReason;

    public CancelOrderRequest() {}

    public CancelOrderRequest(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }
}
