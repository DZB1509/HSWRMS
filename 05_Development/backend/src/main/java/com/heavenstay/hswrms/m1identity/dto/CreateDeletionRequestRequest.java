package com.heavenstay.hswrms.m1identity.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for creating a health data deletion request (API_CONTRACT.md §5.4).
 * Body: { "requestType": "HEALTH_DATA" }. requestType expresses scope only;
 * it does not decide hard-delete vs anonymization.
 */
public class CreateDeletionRequestRequest {

    @NotBlank(message = "requestType is required")
    private String requestType;

    public CreateDeletionRequestRequest() {
    }

    public CreateDeletionRequestRequest(String requestType) {
        this.requestType = requestType;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }
}