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
}
