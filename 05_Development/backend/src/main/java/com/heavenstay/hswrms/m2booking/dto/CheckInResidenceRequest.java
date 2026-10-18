package com.heavenstay.hswrms.m2booking.dto;

import jakarta.validation.constraints.NotBlank;

public class CheckInResidenceRequest {

    @NotBlank(message = "Identification number (CCCD/Passport) is required")
    private String identificationNumber;

    @NotBlank(message = "Identification type is required (e.g., CCCD, PASSPORT)")
    private String identificationType = "CCCD";

    private String nationality = "Việt Nam";

    private String permanentAddress;

    public CheckInResidenceRequest() {
    }

    public String getIdentificationNumber() {
        return identificationNumber;
    }

    public void setIdentificationNumber(String identificationNumber) {
        this.identificationNumber = identificationNumber;
    }

    public String getIdentificationType() {
        return identificationType;
    }

    public void setIdentificationType(String identificationType) {
        this.identificationType = identificationType;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getPermanentAddress() {
        return permanentAddress;
    }

    public void setPermanentAddress(String permanentAddress) {
        this.permanentAddress = permanentAddress;
    }
}
