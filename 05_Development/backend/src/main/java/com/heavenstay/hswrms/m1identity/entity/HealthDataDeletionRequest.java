package com.heavenstay.hswrms.m1identity.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

/**
 * HealthDataDeletionRequest entity tracking post-retreat deletion and
 * anonymization requests for sensitive customer health records.
 * Mapped to dbo.HealthDataDeletionRequest.
 */
@Entity
@Table(name = "\"HealthDataDeletionRequest\"", schema = "dbo")
public class HealthDataDeletionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deletion_request_id", nullable = false)
    private Integer deletionRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "health_profile_id", nullable = false)
    private HealthProfile healthProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_user_id", nullable = false)
    private User requestedByUser;

    @Column(name = "request_status", nullable = false, length = 20)
    private String requestStatus = "PENDING"; // PENDING, DEFERRED, COMPLETED, CANCELLED

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    public HealthDataDeletionRequest() {
    }

    public HealthDataDeletionRequest(HealthProfile healthProfile, User requestedByUser) {
        this.healthProfile = healthProfile;
        this.requestedByUser = requestedByUser;
        this.requestStatus = "PENDING";
        this.requestedAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (this.requestedAt == null) {
            this.requestedAt = Instant.now();
        }
        if (this.requestStatus == null) {
            this.requestStatus = "PENDING";
        }
    }

    public Integer getDeletionRequestId() {
        return deletionRequestId;
    }

    public void setDeletionRequestId(Integer deletionRequestId) {
        this.deletionRequestId = deletionRequestId;
    }

    public HealthProfile getHealthProfile() {
        return healthProfile;
    }

    public void setHealthProfile(HealthProfile healthProfile) {
        this.healthProfile = healthProfile;
    }

    public User getRequestedByUser() {
        return requestedByUser;
    }

    public void setRequestedByUser(User requestedByUser) {
        this.requestedByUser = requestedByUser;
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
