package com.heavenstay.hswrms.m3spa.port;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class TreatmentSafetyNotesDto {
    private String customerFirstName;
    private String treatmentSafetyNotes;
    private String mobilityJointNotes;
    private List<String> relevantPrecautions;

    public TreatmentSafetyNotesDto() {
    }

    public TreatmentSafetyNotesDto(String customerFirstName, String treatmentSafetyNotes, List<String> relevantPrecautions) {
        this.customerFirstName = customerFirstName;
        this.treatmentSafetyNotes = treatmentSafetyNotes;
        this.relevantPrecautions = relevantPrecautions;
    }

    public TreatmentSafetyNotesDto(String customerFirstName, String treatmentSafetyNotes, String relevantPrecaution) {
        this.customerFirstName = customerFirstName;
        this.treatmentSafetyNotes = treatmentSafetyNotes;
        if (relevantPrecaution != null && !relevantPrecaution.isBlank()) {
            this.relevantPrecautions = new ArrayList<>(List.of(relevantPrecaution.trim()));
        } else {
            this.relevantPrecautions = null;
        }
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
        return relevantPrecautions;
    }

    public void setRelevantPrecautions(List<String> relevantPrecautions) {
        this.relevantPrecautions = relevantPrecautions;
    }

    public void setRelevantPrecautions(String relevantPrecaution) {
        if (relevantPrecaution != null && !relevantPrecaution.isBlank()) {
            this.relevantPrecautions = new ArrayList<>(List.of(relevantPrecaution.trim()));
        } else {
            this.relevantPrecautions = null;
        }
    }
}
