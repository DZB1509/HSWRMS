package com.heavenstay.hswrms.m2booking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;

public class UpdateBookingRequest {

    private LocalDate checkInDate;

    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOutDate;

    private Integer requestedVillaCategoryId;

    @Min(value = 1, message = "Guest count must be at least 1")
    private Integer guestCount;

    private String specialRequest;

    public UpdateBookingRequest() {
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

    public Integer getRequestedVillaCategoryId() {
        return requestedVillaCategoryId;
    }

    public void setRequestedVillaCategoryId(Integer requestedVillaCategoryId) {
        this.requestedVillaCategoryId = requestedVillaCategoryId;
    }

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public String getSpecialRequest() {
        return specialRequest;
    }

    public void setSpecialRequest(String specialRequest) {
        this.specialRequest = specialRequest;
    }
}
