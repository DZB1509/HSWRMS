package com.heavenstay.hswrms.m1identity.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

/**
 * HealthDataDeletionRequest entity tracking post-retreat deletion and
 * anonymization requests for sensitive customer health records.
 * Mapped to dbo.HealthDataDeletionRequest.
 *
 * <p>Per the M1 ERD and API_CONTRACT.md §5.4, the request is linked to the
 * customer via {@code customer_profile_id} (FK to CustomerProfile), not via
 * HealthProfile. {@code request_type} expresses the request scope (currently
 * only {@code HEALTH_DATA}). Actual deletion/anonymization execution is out of
 * M1 scope — the record lifecycle is create PENDING → read status → cancel
 * while PENDING/DEFERRED.
 */
@Entity
@Table(name = "\"HealthDataDeletionRequest\"", schema = "dbo")
public class HealthDataDeletionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deletion_request_id", nullable = false)
    private Integer deletionRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_profile_id", nullable = false)
    private CustomerProfile customerProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_user_id", nullable = false)
    private User requestedByUser;

    @Column(name = "request_type", nullable = false, length = 50)
    private String requestType;

    @Column(name = "request_status", nullable = false, length = 20)
    private String requestStatus = "PENDING"; // PENDING, DEFERRED, COMPLETED, CANCELLED

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public HealthDataDeletionRequest() {
    }

    public HealthDataDeletionRequest(CustomerProfile customerProfile, User requestedByUser, String requestType) {
        this.customerProfile = customerProfile;
        this.requestedByUser = requestedByUser;
        this.requestType = requestType;
        this.requestStatus = "PENDING";
        Instant now = Instant.now();
        this.requestedAt = now;
        this.updatedAt = now;
    }

    @PrePersist
    public void onPrePersist() {
        if (this.requestedAt == null) {
            this.requestedAt = Instant.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = Instant.now();
        }
        if (this.requestStatus == null) {
            this.requestStatus = "PENDING";
        }
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    public Integer getDeletionRequestId() {
        return deletionRequestId;
    }

    public void setDeletionRequestId(Integer deletionRequestId) {
        this.deletionRequestId = deletionRequestId;
    }

    public CustomerProfile getCustomerProfile() {
        return customerProfile;
    }

    public void setCustomerProfile(CustomerProfile customerProfile) {
        this.customerProfile = customerProfile;
    }

    public User getRequestedByUser() {
        return requestedByUser;
    }

    public void setRequestedByUser(User requestedByUser) {
        this.requestedByUser = requestedByUser;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getRequestStatus() {
        return requestStatus;
    }

    public void setRequestStatus(String requestStatus) {
        this.requestStatus = requestStatus;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(Instant requestedAt) {
        this.requestedAt = requestedAt;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(Instant processedAt) {
        this.processedAt = processedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HealthDataDeletionRequest that = (HealthDataDeletionRequest) o;
        return Objects.equals(deletionRequestId, that.deletionRequestId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(deletionRequestId);
    }
}
