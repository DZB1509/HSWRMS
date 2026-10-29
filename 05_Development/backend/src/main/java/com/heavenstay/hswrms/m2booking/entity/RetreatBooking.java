package com.heavenstay.hswrms.m2booking.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "RetreatBooking", schema = "dbo")
public class RetreatBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "retreat_booking_id")
    private Integer retreatBookingId;

    @Column(name = "customer_profile_id", nullable = false)
    private Integer customerProfileId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "retreat_package_id", nullable = false)
    private RetreatPackage retreatPackage;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "requested_villa_category_id", nullable = false)
    private VillaCategory requestedVillaCategory;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_villa_id")
    private PhysicalVilla assignedVilla;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "check_out_date", nullable = false)
    private LocalDate checkOutDate;

    @Column(name = "booking_status", nullable = false, length = 20)
    private String bookingStatus = "PENDING";

    @Column(name = "deposit_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Column(name = "total_estimated_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalEstimatedAmount = BigDecimal.ZERO;

    @Column(name = "special_request", length = 1000)
    private String specialRequest;

    /** Added by draft migration _draft_m2_retreat_booking_guest_count.sql. */
    @Column(name = "guest_count", nullable = false)
    private Integer guestCount = 1;

    /** Stored in UTC, consistent with the schema default SYSUTCDATETIME(). */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);

    @OneToOne(mappedBy = "retreatBooking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ResidenceRecord residenceRecord;

    public RetreatBooking() {
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

    public RetreatPackage getRetreatPackage() {
        return retreatPackage;
    }

    public void setRetreatPackage(RetreatPackage retreatPackage) {
        this.retreatPackage = retreatPackage;
    }

    public VillaCategory getRequestedVillaCategory() {
        return requestedVillaCategory;
    }

    public void setRequestedVillaCategory(VillaCategory requestedVillaCategory) {
        this.requestedVillaCategory = requestedVillaCategory;
    }

    public PhysicalVilla getAssignedVilla() {
        return assignedVilla;
    }

    public void setAssignedVilla(PhysicalVilla assignedVilla) {
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

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public ResidenceRecord getResidenceRecord() {
        return residenceRecord;
    }

    public void setResidenceRecord(ResidenceRecord residenceRecord) {
        this.residenceRecord = residenceRecord;
    }
}
