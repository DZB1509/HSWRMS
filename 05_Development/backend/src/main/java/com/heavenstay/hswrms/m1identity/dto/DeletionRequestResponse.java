package com.heavenstay.hswrms.m1identity.dto;

import java.time.Instant;

/**
 * Response payload for health data deletion requests (API_CONTRACT.md §5.4).
 * Fields: deletionRequestId, requestType, status, requestedByUserId, createdAt, updatedAt.
 * No health-profile details are exposed.
 */
public class DeletionRequestResponse {

    private Integer deletionRequestId;
    private String requestType;
    private String status;
    private Integer requestedByUserId;
    private Instant createdAt;
    private Instant updatedAt;

    public DeletionRequestResponse() {
    }

    public DeletionRequestResponse(Integer deletionRequestId, String requestType, String status,
                                   Integer requestedByUserId, Instant createdAt, Instant updatedAt) {
        this.deletionRequestId = deletionRequestId;
        this.requestType = requestType;
        this.status = status;
        this.requestedByUserId = requestedByUserId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Integer getDeletionRequestId() {
        return deletionRequestId;
    }

    public void setDeletionRequestId(Integer deletionRequestId) {
        this.deletionRequestId = deletionRequestId;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getRequestedByUserId() {
        return requestedByUserId;
    }

    public void setRequestedByUserId(Integer requestedByUserId) {
        this.requestedByUserId = requestedByUserId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}