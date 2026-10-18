package com.heavenstay.hswrms.m2booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DailyArrivalResponse {

    private Integer retreatBookingId;
    private Integer customerProfileId;
    private String customerFullName;
    private String customerEmail;
    private String customerPhone;
    private String packageName;
    private String requestedCategoryName;
    private Integer assignedVillaId;
    private String assignedVillaNumber;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String bookingStatus;
    private BigDecimal depositPaid;
    private Boolean hasResidenceRecord;

    public DailyArrivalResponse() {
    }

    public Integer getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Integer retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
    }

    public Integer getCustomerProfileId() {
        return customerProfileId;
    }

    public void setCustomerProfileId(Integer customerProfileId) {
        this.customerProfileId = customerProfileId;
    }

    public String getCustomerFullName() {
        return customerFullName;
    }

    public void setCustomerFullName(String customerFullName) {
        this.customerFullName = customerFullName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public String getRequestedCategoryName() {
        return requestedCategoryName;
    }

    public void setRequestedCategoryName(String requestedCategoryName) {
        this.requestedCategoryName = requestedCategoryName;
    }

    public Integer getAssignedVillaId() {
        return assignedVillaId;
    }

    public void setAssignedVillaId(Integer assignedVillaId) {
        this.assignedVillaId = assignedVillaId;
    }

    public String getAssignedVillaNumber() {
        return assignedVillaNumber;
    }

    public void setAssignedVillaNumber(String assignedVillaNumber) {
        this.assignedVillaNumber = assignedVillaNumber;
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

    public String getBookingStatus() {
        return bookingStatus;
    }

    public void setBookingStatus(String bookingStatus) {
        this.bookingStatus = bookingStatus;
    }

    public BigDecimal getDepositPaid() {
        return depositPaid;
    }

    public void setDepositPaid(BigDecimal depositPaid) {
        this.depositPaid = depositPaid;
    }

    public Boolean getHasResidenceRecord() {
        return hasResidenceRecord;
    }

    public void setHasResidenceRecord(Boolean hasResidenceRecord) {
        this.hasResidenceRecord = hasResidenceRecord;
    }
}
