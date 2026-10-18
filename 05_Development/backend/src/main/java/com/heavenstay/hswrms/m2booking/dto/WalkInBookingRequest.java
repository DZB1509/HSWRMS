package com.heavenstay.hswrms.m2booking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class WalkInBookingRequest {

    private Integer customerProfileId;

    @NotBlank(message = "Guest full name is required")
    private String guestFullName;

    private String guestEmail;

    private String guestPhone;

    @NotNull(message = "Retreat package ID is required")
    private Integer retreatPackageId;

    @NotNull(message = "Villa category ID is required")
    private Integer villaCategoryId;

    @NotNull(message = "Physical Villa ID to assign immediately is required")
    private Integer physicalVillaId;

    @NotNull(message = "Check-in date is required")
    private LocalDate checkInDate;

    @NotNull(message = "Check-out date is required")
    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOutDate;

    private String specialRequest;

    @NotBlank(message = "Identification number (CCCD/Passport) is required")
    private String identificationNumber;

    @NotBlank(message = "Identification type is required")
    private String identificationType = "CCCD";

    private String nationality = "Việt Nam";

    private String permanentAddress;

    private String initialPaymentMethod = "CASH"; // CASH, POS, VNPAY

    public WalkInBookingRequest() {
    }

    public Integer getCustomerProfileId() {
        return customerProfileId;
    }

    public void setCustomerProfileId(Integer customerProfileId) {
        this.customerProfileId = customerProfileId;
    }

    public String getGuestFullName() {
        return guestFullName;
    }

    public void setGuestFullName(String guestFullName) {
        this.guestFullName = guestFullName;
    }

    public String getGuestEmail() {
        return guestEmail;
    }

    public void setGuestEmail(String guestEmail) {
        this.guestEmail = guestEmail;
    }

    public String getGuestPhone() {
        return guestPhone;
    }

    public void setGuestPhone(String guestPhone) {
        this.guestPhone = guestPhone;
    }

    public Integer getRetreatPackageId() {
        return retreatPackageId;
    }

    public void setRetreatPackageId(Integer retreatPackageId) {
        this.retreatPackageId = retreatPackageId;
    }

    public Integer getVillaCategoryId() {
        return villaCategoryId;
    }

    public void setVillaCategoryId(Integer villaCategoryId) {
        this.villaCategoryId = villaCategoryId;
    }

    public Integer getPhysicalVillaId() {
        return physicalVillaId;
    }

    public void setPhysicalVillaId(Integer physicalVillaId) {
        this.physicalVillaId = physicalVillaId;
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

    public String getInitialPaymentMethod() {
        return initialPaymentMethod;
    }

    public void setInitialPaymentMethod(String initialPaymentMethod) {
        this.initialPaymentMethod = initialPaymentMethod;
    }
}
