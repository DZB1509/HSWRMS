package com.heavenstay.hswrms.m2booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ReceptionistBookingResponse {

    private Integer retreatBookingId;
    private String bookingReference;
    private Integer customerProfileId;
    private Integer userId;
    private String customerFullName;
    private String customerEmail;
    private String customerPhone;
    private String emergencyContact;

    private Integer retreatPackageId;
    private String packageCode;
    private String packageName;
    private Integer durationNights;

    private Integer requestedVillaCategoryId;
    private String requestedCategoryName;

    private Integer assignedVillaId;
    private String assignedVillaNumber;

    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String bookingStatus;

    private BigDecimal depositAmount;
    private BigDecimal totalEstimatedAmount;
    private Integer guestCount;
    private String specialRequest;
    private LocalDateTime createdAt;

    private Boolean hasResidenceRecord;
    private Boolean hasHealthProfile;

    private String paymentStatus;
    private String paymentMethod;
    private String transactionReference;

    public ReceptionistBookingResponse() {
    }

    public Integer getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Integer retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
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

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public Integer getRetreatPackageId() {
        return retreatPackageId;
    }

    public void setRetreatPackageId(Integer retreatPackageId) {
        this.retreatPackageId = retreatPackageId;
    }

    public String getPackageCode() {
        return packageCode;
    }

    public void setPackageCode(String packageCode) {
        this.packageCode = packageCode;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public Integer getDurationNights() {
        return durationNights;
    }

    public void setDurationNights(Integer durationNights) {
        this.durationNights = durationNights;
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

    public Boolean getHasHealthProfile() {
        return hasHealthProfile;
    }

    public void setHasHealthProfile(Boolean hasHealthProfile) {
        this.hasHealthProfile = hasHealthProfile;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }
}
