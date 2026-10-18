package com.heavenstay.hswrms.m3spa.entity;

import com.heavenstay.hswrms.m2booking.entity.RetreatBookingEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "SpaSession")
public class SpaSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "spa_session_id")
    private Long spaSessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retreat_booking_id", nullable = false)
    private RetreatBookingEntity retreatBooking;

    @Column(name = "treatment_id", nullable = false)
    private Long treatmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "therapist_id", nullable = false)
    private TherapistEntity therapist;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "requested_start_at")
    private LocalDateTime requestedStartAt;

    @Column(name = "scheduled_start_at", nullable = false)
    private LocalDateTime scheduledStartAt;

    @Column(name = "scheduled_end_at", nullable = false)
    private LocalDateTime scheduledEndAt;

    @Column(name = "booking_source", nullable = false, length = 20)
    private String bookingSource = "CUSTOMER";

    @Column(name = "session_status", nullable = false, length = 20)
    private String sessionStatus = "SCHEDULED"; // SCHEDULED, RESCHEDULING, CANCELLED, COMPLETED, NO_SHOW

    @Column(name = "confirmation_status", nullable = false, length = 20)
    private String confirmationStatus = "CONFIRMED"; // PENDING, CONFIRMED, DECLINED, EXPIRED

    @Column(name = "customer_note", length = 1000)
    private String customerNote;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public SpaSessionEntity() {}

    public Long getSpaSessionId() {
        return spaSessionId;
    }

    public void setSpaSessionId(Long spaSessionId) {
        this.spaSessionId = spaSessionId;
    }

    public RetreatBookingEntity getRetreatBooking() {
        return retreatBooking;
    }

    public void setRetreatBooking(RetreatBookingEntity retreatBooking) {
        this.retreatBooking = retreatBooking;
    }

    public Long getTreatmentId() {
        return treatmentId;
    }

    public void setTreatmentId(Long treatmentId) {
        this.treatmentId = treatmentId;
    }

    public TherapistEntity getTherapist() {
        return therapist;
    }

    public void setTherapist(TherapistEntity therapist) {
        this.therapist = therapist;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public LocalDateTime getRequestedStartAt() {
        return requestedStartAt;
    }

    public void setRequestedStartAt(LocalDateTime requestedStartAt) {
        this.requestedStartAt = requestedStartAt;
    }

    public LocalDateTime getScheduledStartAt() {
        return scheduledStartAt;
    }

    public void setScheduledStartAt(LocalDateTime scheduledStartAt) {
        this.scheduledStartAt = scheduledStartAt;
    }

    public LocalDateTime getScheduledEndAt() {
        return scheduledEndAt;
    }

    public void setScheduledEndAt(LocalDateTime scheduledEndAt) {
        this.scheduledEndAt = scheduledEndAt;
    }

    public String getBookingSource() {
        return bookingSource;
    }

    public void setBookingSource(String bookingSource) {
        this.bookingSource = bookingSource;
    }

    public String getSessionStatus() {
        return sessionStatus;
    }

    public void setSessionStatus(String sessionStatus) {
        this.sessionStatus = sessionStatus;
    }

    public String getConfirmationStatus() {
        return confirmationStatus;
    }

    public void setConfirmationStatus(String confirmationStatus) {
        this.confirmationStatus = confirmationStatus;
    }

    public String getCustomerNote() {
        return customerNote;
    }

    public void setCustomerNote(String customerNote) {
        this.customerNote = customerNote;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
