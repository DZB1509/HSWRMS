package com.heavenstay.hswrms.m2booking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CreateBookingRequest {

    @NotNull(message = "Retreat package ID is required")
    private Integer retreatPackageId;

    @NotNull(message = "Requested villa category ID is required")
    private Integer requestedVillaCategoryId;

    @NotNull(message = "Check-in date is required")
    private LocalDate checkInDate;

    @NotNull(message = "Check-out date is required")
    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOutDate;

    private String specialRequest;

    @jakarta.validation.constraints.Min(value = 1, message = "Guest count must be at least 1")
    private Integer guestCount = 1;

    private String fullName;
    private String email;
    private String phoneNumber;
    private String emergencyContact;

    public CreateBookingRequest() {
    }

    public Integer getRetreatPackageId() {
        return retreatPackageId;
    }

    public void setRetreatPackageId(Integer retreatPackageId) {
        this.retreatPackageId = retreatPackageId;
    }

    public Integer getRequestedVillaCategoryId() {
        return requestedVillaCategoryId;
    }

    public void setRequestedVillaCategoryId(Integer requestedVillaCategoryId) {
        this.requestedVillaCategoryId = requestedVillaCategoryId;
    }

    public LocalDate getCheckInDate() {
        return checkInDate;
    }

    public void setCheckInDate(LocalDate checkInDate) {
        this.checkInDate = checkInDate;
    }

    public LocalDate getCheckOutDate() {
        return checkOutDate;
    }

    public void setCheckOutDate(LocalDate checkOutDate) {
        this.checkOutDate = checkOutDate;
    }

    public String getSpecialRequest() {
        return specialRequest;
    }

    public void setSpecialRequest(String specialRequest) {
        this.specialRequest = specialRequest;
    }

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }
}
