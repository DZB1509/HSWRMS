package com.heavenstay.hswrms.m3spa.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class SchedulingCandidateDto {
    private String candidateId;
    private Integer treatmentId;
    private String treatmentName;
    private Integer durationMinutes;
    private Integer therapistId;
    private String therapistName;
    private Integer roomId;
    private String roomName;
    private LocalDateTime scheduledStartAt;
    private LocalDateTime scheduledEndAt;
    private LocalDate date;
    private String startTime;
    private String endTime;
    private boolean alternative;

    public SchedulingCandidateDto() {
    }

    public SchedulingCandidateDto(String candidateId, Integer treatmentId, String treatmentName, Integer durationMinutes,
                                  Integer therapistId, String therapistName, Integer roomId, String roomName,
                                  LocalDateTime scheduledStartAt, LocalDateTime scheduledEndAt,
                                  LocalDate date, String startTime, String endTime, boolean alternative) {
        this.candidateId = candidateId;
        this.treatmentId = treatmentId;
        this.treatmentName = treatmentName;
        this.durationMinutes = durationMinutes;
        this.therapistId = therapistId;
        this.therapistName = therapistName;
        this.roomId = roomId;
        this.roomName = roomName;
        this.scheduledStartAt = scheduledStartAt;
        this.scheduledEndAt = scheduledEndAt;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.alternative = alternative;
    }

    public String getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }

    public Integer getTreatmentId() {
        return treatmentId;
    }

    public void setTreatmentId(Integer treatmentId) {
        this.treatmentId = treatmentId;
    }

    public String getTreatmentName() {
        return treatmentName;
    }

    public void setTreatmentName(String treatmentName) {
        this.treatmentName = treatmentName;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public Integer getTherapistId() {
        return therapistId;
    }

    public void setTherapistId(Integer therapistId) {
        this.therapistId = therapistId;
    }

    public String getTherapistName() {
        return therapistName;
    }

    public void setTherapistName(String therapistName) {
        this.therapistName = therapistName;
    }

    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public LocalDateTime getScheduledStartAt() {
        return scheduledStartAt;
    }

    public void setScheduledStartAt(LocalDateTime scheduledStartAt) {
        this.scheduledStartAt = scheduledStartAt;
    }

    public LocalDateTime getScheduledEndAt() {
        return scheduledEndAt;
    }

    public void setScheduledEndAt(LocalDateTime scheduledEndAt) {
        this.scheduledEndAt = scheduledEndAt;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public boolean isAlternative() {
        return alternative;
    }

    public void setAlternative(boolean alternative) {
        this.alternative = alternative;
    }
}
