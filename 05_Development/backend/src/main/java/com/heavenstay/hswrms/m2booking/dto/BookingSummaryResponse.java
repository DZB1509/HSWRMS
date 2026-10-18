package com.heavenstay.hswrms.m2booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class BookingSummaryResponse {

    private Integer retreatBookingId;
    private Integer customerProfileId;
    private Integer retreatPackageId;
    private String packageName;
    private Integer requestedVillaCategoryId;
    private String requestedCategoryName;
    private Integer assignedVillaId;
    private String assignedVillaNumber;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String bookingStatus;
    private BigDecimal depositAmount;
    private BigDecimal totalEstimatedAmount;
    private String specialRequest;
    private LocalDateTime createdAt;
    private Boolean hasResidenceRecord;

    public BookingSummaryResponse() {
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

    public Integer getRetreatPackageId() {
        return retreatPackageId;
    }

    public void setRetreatPackageId(Integer retreatPackageId) {
        this.retreatPackageId = retreatPackageId;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public Integer getRequestedVillaCategoryId() {
        return requestedVillaCategoryId;
    }

    public void setRequestedVillaCategoryId(Integer requestedVillaCategoryId) {
        this.requestedVillaCategoryId = requestedVillaCategoryId;
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

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public BigDecimal getTotalEstimatedAmount() {
        return totalEstimatedAmount;
    }

    public void setTotalEstimatedAmount(BigDecimal totalEstimatedAmount) {
        this.totalEstimatedAmount = totalEstimatedAmount;
    }

    public String getSpecialRequest() {
        return specialRequest;
    }

    public void setSpecialRequest(String specialRequest) {
        this.specialRequest = specialRequest;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getHasResidenceRecord() {
        return hasResidenceRecord;
    }

    public void setHasResidenceRecord(Boolean hasResidenceRecord) {
        this.hasResidenceRecord = hasResidenceRecord;
    }
}
