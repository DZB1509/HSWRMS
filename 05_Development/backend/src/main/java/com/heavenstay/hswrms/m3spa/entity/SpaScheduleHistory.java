package com.heavenstay.hswrms.m3spa.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Immutable audit history record of an accepted spa schedule modification (BR-M3-14).
 *
 * Persisted upon every accepted state transition:
 * - Initial reservation creation (CREATED)
 * - Customer-requested reschedule (RESCHEDULING / RESCHEDULED)
 * - Attendance confirmation (ATTENDANCE_CONFIRMED)
 * - Session cancellation (CANCELLED)
 * - Therapist outcome recording (COMPLETED / NO_SHOW)
 * - Automated system rematching/recovery (RECOVERED)
 */
@Entity
@Table(name = "SpaScheduleHistory", schema = "dbo")
public class SpaScheduleHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long historyId;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "actor_user_id")
    private Integer actorUserId;

    @Column(name = "actor_role", length = 30)
    private String actorRole;

    @Column(name = "change_type", nullable = false, length = 50)
    private String changeType;

    @Column(name = "previous_status", length = 30)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 30)
    private String newStatus;

    @Column(name = "previous_start_at")
    private LocalDateTime previousStartAt;

    @Column(name = "new_start_at", nullable = false)
    private LocalDateTime newStartAt;

    @Column(name = "previous_therapist_id")
    private Integer previousTherapistId;

    @Column(name = "new_therapist_id")
    private Integer newTherapistId;

    @Column(name = "previous_room_id")
    private Integer previousRoomId;

    @Column(name = "new_room_id")
    private Integer newRoomId;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "external_calendar_id", length = 255)
    private String externalCalendarId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public SpaScheduleHistory() {
    }

    public SpaScheduleHistory(Long sessionId, Integer actorUserId, String actorRole, String changeType,
                              String previousStatus, String newStatus, LocalDateTime previousStartAt,
                              LocalDateTime newStartAt, Integer previousTherapistId, Integer newTherapistId,
                              Integer previousRoomId, Integer newRoomId, String reason, String externalCalendarId) {
        this.sessionId = sessionId;
        this.actorUserId = actorUserId;
        this.actorRole = actorRole;
        this.changeType = changeType;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.previousStartAt = previousStartAt;
        this.newStartAt = newStartAt;
        this.previousTherapistId = previousTherapistId;
        this.newTherapistId = newTherapistId;
        this.previousRoomId = previousRoomId;
        this.newRoomId = newRoomId;
        this.reason = reason;
        this.externalCalendarId = externalCalendarId;
        this.createdAt = LocalDateTime.now();
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

    public Integer getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(Integer actorUserId) {
        this.actorUserId = actorUserId;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getChangeType() {
        return changeType;
    }

    public void setChangeType(String changeType) {
        this.changeType = changeType;
    }

    public String getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(String previousStatus) {
        this.previousStatus = previousStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(String newStatus) {
        this.newStatus = newStatus;
    }

    public LocalDateTime getPreviousStartAt() {
        return previousStartAt;
    }

    public void setPreviousStartAt(LocalDateTime previousStartAt) {
        this.previousStartAt = previousStartAt;
    }

    public LocalDateTime getNewStartAt() {
        return newStartAt;
    }

    public void setNewStartAt(LocalDateTime newStartAt) {
        this.newStartAt = newStartAt;
    }

    public Integer getPreviousTherapistId() {
        return previousTherapistId;
    }

    public void setPreviousTherapistId(Integer previousTherapistId) {
        this.previousTherapistId = previousTherapistId;
    }

    public Integer getNewTherapistId() {
        return newTherapistId;
    }

    public void setNewTherapistId(Integer newTherapistId) {
        this.newTherapistId = newTherapistId;
    }

    public Integer getPreviousRoomId() {
        return previousRoomId;
    }

    public void setPreviousRoomId(Integer previousRoomId) {
        this.previousRoomId = previousRoomId;
    }

    public Integer getNewRoomId() {
        return newRoomId;
    }

    public void setNewRoomId(Integer newRoomId) {
        this.newRoomId = newRoomId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getExternalCalendarId() {
        return externalCalendarId;
    }

    public void setExternalCalendarId(String externalCalendarId) {
        this.externalCalendarId = externalCalendarId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

