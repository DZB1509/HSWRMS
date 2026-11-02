package com.heavenstay.hswrms.m3spa.dto.response;

import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;

import java.time.LocalDateTime;

public class TherapistSessionDetailDto {
    private Long spaSessionId;
    private String treatmentName;
    private Integer durationMinutes;
    private LocalDateTime scheduledStartAt;
    private LocalDateTime scheduledEndAt;
    private String roomName;
    private String customerFirstName;
    private String treatmentSafetyNotes;
    private String relevantPrecautions;
    private SpaSessionStatus sessionStatus;
    private SpaConfirmationStatus confirmationStatus;
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

    public String getRelevantPrecautions() {
        return relevantPrecautions;
    }

    public void setRelevantPrecautions(String relevantPrecautions) {
        this.relevantPrecautions = relevantPrecautions;
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

    public String getCustomerNote() {
        return customerNote;
    }

    public void setCustomerNote(String customerNote) {
        this.customerNote = customerNote;
    }
}
