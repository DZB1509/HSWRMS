package com.heavenstay.hswrms.m3spa.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CompleteSessionRequest {

    @NotBlank(message = "outcome must be either COMPLETED or NO_SHOW")
    private String outcome; // COMPLETED or NO_SHOW

    private String therapistNotes;

    public CompleteSessionRequest() {
    }

    public CompleteSessionRequest(String outcome, String therapistNotes) {
        this.outcome = outcome;
        this.therapistNotes = therapistNotes;
    }

    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public String getTherapistNotes() {
        return therapistNotes;
    }

    public void setTherapistNotes(String therapistNotes) {
        this.therapistNotes = therapistNotes;
    }
}
