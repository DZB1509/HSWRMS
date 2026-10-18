package com.heavenstay.hswrms.m2booking.entity;

import com.heavenstay.hswrms.m1identity.entity.CustomerProfileEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "RetreatBooking")
public class RetreatBookingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "retreat_booking_id")
    private Long retreatBookingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_profile_id", nullable = false)
    private CustomerProfileEntity customerProfile;

    @Column(name = "retreat_package_id", nullable = false)
    private Long retreatPackageId;

    @Column(name = "requested_villa_category_id", nullable = false)
    private Long requestedVillaCategoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_villa_id")
    private PhysicalVillaEntity assignedVilla;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "check_out_date", nullable = false)
    private LocalDate checkOutDate;

    @Column(name = "booking_status", nullable = false, length = 20)
    private String bookingStatus = "CONFIRMED"; // PENDING, CONFIRMED, CHECKED_IN, CANCELLED, COMPLETED

    @Column(name = "deposit_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Column(name = "total_estimated_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalEstimatedAmount = BigDecimal.ZERO;

    @Column(name = "special_request", length = 1000)
    private String specialRequest;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public RetreatBookingEntity() {}

    public Long getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Long retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
    }

    public CustomerProfileEntity getCustomerProfile() {
        return customerProfile;
    }

    public void setCustomerProfile(CustomerProfileEntity customerProfile) {
        this.customerProfile = customerProfile;
    }

    public Long getRetreatPackageId() {
        return retreatPackageId;
    }

    public void setRetreatPackageId(Long retreatPackageId) {
        this.retreatPackageId = retreatPackageId;
    }

    public Long getRequestedVillaCategoryId() {
        return requestedVillaCategoryId;
    }

    public void setRequestedVillaCategoryId(Long requestedVillaCategoryId) {
        this.requestedVillaCategoryId = requestedVillaCategoryId;
    }

    public PhysicalVillaEntity getAssignedVilla() {
        return assignedVilla;
    }

    public void setAssignedVilla(PhysicalVillaEntity assignedVilla) {
        this.assignedVilla = assignedVilla;
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
}
