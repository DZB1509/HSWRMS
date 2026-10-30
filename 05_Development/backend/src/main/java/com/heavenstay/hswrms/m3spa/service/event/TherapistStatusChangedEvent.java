package com.heavenstay.hswrms.m3spa.service.event;

import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;

import java.time.LocalDateTime;

/**
 * Event published whenever a therapist's operational status changes (BR-M3-13).
 */
public class TherapistStatusChangedEvent {

    private final Integer therapistId;
    private final TherapistStatus previousStatus;
    private final TherapistStatus newStatus;
    private final String reason;
    private final LocalDateTime timestamp;

    public TherapistStatusChangedEvent(Integer therapistId, TherapistStatus previousStatus, TherapistStatus newStatus, String reason, LocalDateTime timestamp) {
        this.therapistId = therapistId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.reason = reason;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
    }

    public Integer getTherapistId() {
        return therapistId;
    }

    public TherapistStatus getPreviousStatus() {
        return previousStatus;
    }

    public TherapistStatus getNewStatus() {
        return newStatus;
    }

    public String getReason() {
        return reason;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    @Override
    public String toString() {
        return "TherapistStatusChangedEvent{" +
                "therapistId=" + therapistId +
                ", previousStatus=" + previousStatus +
                ", newStatus=" + newStatus +
                ", reason='" + reason + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}

