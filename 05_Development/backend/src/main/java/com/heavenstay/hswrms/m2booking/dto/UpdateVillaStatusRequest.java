package com.heavenstay.hswrms.m2booking.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateVillaStatusRequest {

    @NotBlank(message = "New villa status is required")
    private String newStatus;

    private String notes;

    public UpdateVillaStatusRequest() {
    }

    public String getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(String newStatus) {
        this.newStatus = newStatus;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
