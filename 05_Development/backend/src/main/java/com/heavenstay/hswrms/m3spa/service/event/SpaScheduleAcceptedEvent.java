package com.heavenstay.hswrms.m3spa.service.event;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;

import java.time.LocalDateTime;

/**
 * Event published whenever an accepted spa schedule modification or state transition occurs (BR-M3-14).
 */
public class SpaScheduleAcceptedEvent {

    private final SpaSession session;
    private final String changeType;
    private final String previousStatus;
    private final String newStatus;
    private final LocalDateTime previousStartAt;
    private final LocalDateTime newStartAt;
    private final Integer previousTherapistId;
    private final Integer newTherapistId;
    private final Integer previousRoomId;
    private final Integer newRoomId;
    private final Integer actorUserId;
    private final String actorRole;
    private final String reason;
    private final String customerEmail;
    private final String customerName;
    private final LocalDateTime timestamp;

    public SpaScheduleAcceptedEvent(SpaSession session, String changeType, String previousStatus, String newStatus,
                                    LocalDateTime previousStartAt, LocalDateTime newStartAt,
                                    Integer previousTherapistId, Integer newTherapistId,
                                    Integer previousRoomId, Integer newRoomId,
                                    Integer actorUserId, String actorRole, String reason,
                                    String customerEmail, String customerName) {
        this.session = session;
        this.changeType = changeType;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.previousStartAt = previousStartAt;
        this.newStartAt = newStartAt;
        this.previousTherapistId = previousTherapistId;
        this.newTherapistId = newTherapistId;
        this.previousRoomId = previousRoomId;
        this.newRoomId = newRoomId;
        this.actorUserId = actorUserId;
        this.actorRole = actorRole;
        this.reason = reason;
        this.customerEmail = customerEmail;
        this.customerName = customerName;
        this.timestamp = LocalDateTime.now();
    }

    public SpaSession getSession() {
        return session;
    }

    public String getChangeType() {
        return changeType;
    }

    public String getPreviousStatus() {
        return previousStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public LocalDateTime getPreviousStartAt() {
        return previousStartAt;
    }

    public LocalDateTime getNewStartAt() {
        return newStartAt;
    }

    public Integer getPreviousTherapistId() {
        return previousTherapistId;
    }

    public Integer getNewTherapistId() {
        return newTherapistId;
    }

    public Integer getPreviousRoomId() {
        return previousRoomId;
    }

    public Integer getNewRoomId() {
        return newRoomId;
    }

    public Integer getActorUserId() {
        return actorUserId;
    }

    public String getActorRole() {
        return actorRole;
    }

    public String getReason() {
        return reason;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public String getCustomerName() {
        return customerName;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}

