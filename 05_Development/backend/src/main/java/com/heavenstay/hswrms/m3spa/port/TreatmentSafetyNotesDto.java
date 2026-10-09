package com.heavenstay.hswrms.m3spa.port;

public class TreatmentSafetyNotesDto {
    private String customerFirstName;
    private String treatmentSafetyNotes;
    private String relevantPrecautions;

    public TreatmentSafetyNotesDto() {
    }

    public TreatmentSafetyNotesDto(String customerFirstName, String treatmentSafetyNotes, String relevantPrecautions) {
        this.customerFirstName = customerFirstName;
        this.treatmentSafetyNotes = treatmentSafetyNotes;
        this.relevantPrecautions = relevantPrecautions;
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
}
