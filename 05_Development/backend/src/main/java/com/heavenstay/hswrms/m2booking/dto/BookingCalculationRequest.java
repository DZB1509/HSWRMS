package com.heavenstay.hswrms.m2booking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class BookingCalculationRequest {

    @NotNull(message = "Retreat package ID is required")
    private Integer retreatPackageId;

    @NotNull(message = "Villa category ID is required")
    private Integer villaCategoryId;

    @NotNull(message = "Check-in date is required")
    private LocalDate checkInDate;

    @NotNull(message = "Check-out date is required")
    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOutDate;

    @Min(value = 1, message = "Guest count must be at least 1")
    private Integer guestCount = 1;

    public BookingCalculationRequest() {
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

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }
}
