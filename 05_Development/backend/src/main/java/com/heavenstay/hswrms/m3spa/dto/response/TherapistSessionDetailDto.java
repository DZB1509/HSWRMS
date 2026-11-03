package com.heavenstay.hswrms.m3spa.dto.response;

import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class TherapistSessionDetailDto {
    private Long spaSessionId;
    private String treatmentName;
    private Integer durationMinutes;
    private LocalDateTime scheduledStartAt;
    private LocalDateTime scheduledEndAt;
    private String roomName;
    private String customerFirstName;
    private String treatmentSafetyNotes;
    private String mobilityJointNotes;
    private List<String> relevantPrecautions = new ArrayList<>();
    private SpaSessionStatus sessionStatus;
    private SpaConfirmationStatus confirmationStatus;
    private Integer scheduleVersion;
    private String customerNote;

    public TherapistSessionDetailDto() {
    }

    public Long getSpaSessionId() {
        return spaSessionId;
    }

    public void setSpaSessionId(Long spaSessionId) {
        this.spaSessionId = spaSessionId;
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

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getCustomerFirstName() {
        return customerFirstName;
    }

    public void setCustomerFirstName(String customerFirstName) {
        this.customerFirstName = customerFirstName;
    }

    public String getTreatmentSafetyNotes() {
        return treatmentSafetyNotes;
    }

    public void setTreatmentSafetyNotes(String treatmentSafetyNotes) {
        this.treatmentSafetyNotes = treatmentSafetyNotes;
    }

    public String getMobilityJointNotes() {
        return mobilityJointNotes;
    }

    public void setMobilityJointNotes(String mobilityJointNotes) {
        this.mobilityJointNotes = mobilityJointNotes;
    }

    public List<String> getRelevantPrecautions() {
        return relevantPrecautions != null ? relevantPrecautions : Collections.emptyList();
    }

    public void setRelevantPrecautions(List<String> relevantPrecautions) {
        this.relevantPrecautions = relevantPrecautions != null ? relevantPrecautions : new ArrayList<>();
    }

    public void setRelevantPrecautions(String relevantPrecaution) {
        if (relevantPrecaution != null && !relevantPrecaution.isBlank()) {
            this.relevantPrecautions = new ArrayList<>(List.of(relevantPrecaution.trim()));
        } else {
            this.relevantPrecautions = new ArrayList<>();
        }
    }

    public SpaSessionStatus getSessionStatus() {
        return sessionStatus;
    }

    public void setSessionStatus(SpaSessionStatus sessionStatus) {
        this.sessionStatus = sessionStatus;
    }

    public SpaConfirmationStatus getConfirmationStatus() {
        return confirmationStatus;
    }

    public void setConfirmationStatus(SpaConfirmationStatus confirmationStatus) {
        this.confirmationStatus = confirmationStatus;
    }

    public Integer getScheduleVersion() {
        return scheduleVersion;
    }

    public void setScheduleVersion(Integer scheduleVersion) {
        this.scheduleVersion = scheduleVersion;
    }

    public String getCustomerNote() {
        return customerNote;
    }

    public void setCustomerNote(String customerNote) {
        this.customerNote = customerNote;
    }
}
