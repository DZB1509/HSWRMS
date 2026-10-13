package com.heavenstay.hswrms.m1identity.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class UpdateCustomerProfileRequest {

    @Size(min = 1, max = 150, message = "Full name must be between 1 and 150 characters")
    private String fullName;

    @Size(max = 30, message = "Phone number must not exceed 30 characters")
    @Pattern(regexp = "^[+()\\-\\s0-9]*$", message = "Phone number contains invalid characters")
    private String phoneNumber;

    private LocalDate dateOfBirth;

    @Size(max = 500, message = "Residential address must not exceed 500 characters")
    private String residentialAddress;

    @Pattern(regexp = "^(vi|en|zh-CN|ja|fr)$", message = "Preferred language is not supported")
    private String preferredLanguage;

    @Size(max = 255, message = "Emergency contact name must not exceed 255 characters")
    private String emergencyContactName;

    @Size(max = 50, message = "Emergency contact phone must not exceed 50 characters")
    @Pattern(regexp = "^[+()\\-\\s0-9]*$", message = "Emergency contact phone contains invalid characters")
    private String emergencyContactPhone;

    @Size(max = 100, message = "Emergency contact relationship must not exceed 100 characters")
    private String emergencyContactRelationship;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getResidentialAddress() { return residentialAddress; }
    public void setResidentialAddress(String residentialAddress) { this.residentialAddress = residentialAddress; }

    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }

    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

    public String getEmergencyContactRelationship() { return emergencyContactRelationship; }
    public void setEmergencyContactRelationship(String emergencyContactRelationship) { this.emergencyContactRelationship = emergencyContactRelationship; }
}
