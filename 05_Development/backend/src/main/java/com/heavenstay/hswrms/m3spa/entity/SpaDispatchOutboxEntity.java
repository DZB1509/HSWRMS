package com.heavenstay.hswrms.m3spa.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

/**
 * Transactional Outbox Entity for Spa External Dispatches (BR-M3-14).
 *
 * Ensures durable, fault-tolerant dispatch of external notifications (SMTP email)
 * and calendar synchronization (Google Calendar) without blocking or endangering
 * the core booking state transaction.
 */
@Entity
@Table(name = "SpaDispatchOutbox", schema = "dbo")
public class SpaDispatchOutboxEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "outbox_id")
    private Long outboxId;

    @Column(name = "history_id")
    private Long historyId;

    @Column(name = "session_id", nullable = false)
    @JdbcTypeCode(SqlTypes.INTEGER)
    private Long sessionId;

    @Column(name = "channel", nullable = false, length = 30)
    private String channel; // "CALENDAR" or "EMAIL"

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING"; // "PENDING", "PROCESSING", "SENT", "FAILED"

    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @Column(name = "claimed_by", length = 100)
    private String claimedBy;

    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @Column(name = "max_retries", nullable = false)
    private int maxRetries = 5;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @Column(name = "customer_name", length = 255)
    private String customerName;

    @Column(name = "change_type", length = 50)
    private String changeType;

    @Column(name = "change_details", length = 1000)
    private String changeDetails;

    @Column(name = "external_calendar_id", length = 255)
    private String externalCalendarId;

    @Column(name = "last_error", length = 1000)
    private String lastError;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 150)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    public SpaDispatchOutboxEntity() {}

    public SpaDispatchOutboxEntity(Long historyId, Long sessionId, String channel,
                                   String customerEmail, String customerName,
                                   String changeType, String changeDetails,
                                   String externalCalendarId, String idempotencyKey) {
        this.historyId = historyId;
        this.sessionId = sessionId;
        this.channel = channel;
        this.status = "PENDING";
        this.retryCount = 0;
        this.maxRetries = 5;
        this.customerEmail = customerEmail;
        this.customerName = customerName;
        this.changeType = changeType;
        this.changeDetails = changeDetails;
        this.externalCalendarId = externalCalendarId;
        this.idempotencyKey = idempotencyKey;
        this.createdAt = LocalDateTime.now();
    }

    public Long getOutboxId() {
        return outboxId;
    }

    public void setOutboxId(Long outboxId) {
        this.outboxId = outboxId;
    }

    public Long getHistoryId() {
        return historyId;
    }

    public void setHistoryId(Long historyId) {
        this.historyId = historyId;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(int retryCount) {
        this.retryCount = retryCount;
    }

    public int getMaxRetries() {
        return maxRetries;
    }

    public void setMaxRetries(int maxRetries) {
        this.maxRetries = maxRetries;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getChangeType() {
        return changeType;
    }

    public void setChangeType(String changeType) {
        this.changeType = changeType;
    }

    public String getChangeDetails() {
        return changeDetails;
    }

    public void setChangeDetails(String changeDetails) {
        this.changeDetails = changeDetails;
    }

    public String getExternalCalendarId() {
        return externalCalendarId;
    }

    public void setExternalCalendarId(String externalCalendarId) {
        this.externalCalendarId = externalCalendarId;
    }

    public String getLastError() {
        return lastError;
    }

    public void setLastError(String lastError) {
        this.lastError = lastError;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }

    public LocalDateTime getClaimedAt() {
        return claimedAt;
    }

    public void setClaimedAt(LocalDateTime claimedAt) {
        this.claimedAt = claimedAt;
    }

    public String getClaimedBy() {
        return claimedBy;
    }

    public void setClaimedBy(String claimedBy) {
        this.claimedBy = claimedBy;
    }
}

