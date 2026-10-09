package com.heavenstay.hswrms.m3spa.port;

import java.time.LocalDate;

public class StayContextDto {
    private Integer bookingId;
    private String bookingReference;
    private Integer customerProfileId;
    private Integer userId;
    private String customerName;
    private Integer packageId;
    private String packageName;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private boolean active;

    public StayContextDto() {
    }

    public StayContextDto(Integer bookingId, String bookingReference, Integer customerProfileId, Integer userId,
                          String customerName, Integer packageId, String packageName,
                          LocalDate checkInDate, LocalDate checkOutDate, boolean active) {
        this.bookingId = bookingId;
        this.bookingReference = bookingReference;
        this.customerProfileId = customerProfileId;
        this.userId = userId;
        this.customerName = customerName;
        this.packageId = packageId;
        this.packageName = packageName;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.active = active;
    }

    public Integer getBookingId() {
        return bookingId;
    }

    public void setBookingId(Integer bookingId) {
        this.bookingId = bookingId;
    }

    public String getBookingReference() {
        return bookingReference;
    }

    public void setBookingReference(String bookingReference) {
        this.bookingReference = bookingReference;
    }

    public Integer getCustomerProfileId() {
        return customerProfileId;
    }

    public void setCustomerProfileId(Integer customerProfileId) {
        this.customerProfileId = customerProfileId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public Integer getPackageId() {
        return packageId;
    }

    public void setPackageId(Integer packageId) {
        this.packageId = packageId;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
