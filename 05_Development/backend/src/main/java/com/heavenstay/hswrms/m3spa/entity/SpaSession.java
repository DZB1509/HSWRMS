package com.heavenstay.hswrms.m3spa.entity;

import com.heavenstay.hswrms.m3spa.entity.enums.BookingSource;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "SpaSession", schema = "dbo")
public class SpaSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "spa_session_id")
    private Long spaSessionId;

    @Column(name = "retreat_booking_id", nullable = false)
    private Integer retreatBookingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "treatment_id", nullable = false)
    private SpaTreatment treatment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "therapist_id", nullable = false)
    private Therapist therapist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private TreatmentRoom treatmentRoom;

    @Column(name = "requested_start_at")
    private LocalDateTime requestedStartAt;

    @Column(name = "scheduled_start_at", nullable = false)
    private LocalDateTime scheduledStartAt;

    @Column(name = "scheduled_end_at", nullable = false)
    private LocalDateTime scheduledEndAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_source", nullable = false, length = 20)
    private BookingSource bookingSource = BookingSource.CUSTOMER;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_status", nullable = false, length = 20)
    private SpaSessionStatus sessionStatus = SpaSessionStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(name = "confirmation_status", nullable = false, length = 20)
    private SpaConfirmationStatus confirmationStatus = SpaConfirmationStatus.PENDING;

    @Column(name = "customer_note", length = 1000)
    private String customerNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public SpaSession() {
    }

    public SpaSession(Integer retreatBookingId, SpaTreatment treatment, Therapist therapist, TreatmentRoom treatmentRoom,
                      LocalDateTime requestedStartAt, LocalDateTime scheduledStartAt, LocalDateTime scheduledEndAt,
                      BookingSource bookingSource, String customerNote) {
        this.retreatBookingId = retreatBookingId;
        this.treatment = treatment;
        this.therapist = therapist;
        this.treatmentRoom = treatmentRoom;
        this.requestedStartAt = requestedStartAt;
        this.scheduledStartAt = scheduledStartAt;
        this.scheduledEndAt = scheduledEndAt;
        this.bookingSource = bookingSource;
        this.customerNote = customerNote;
        this.sessionStatus = SpaSessionStatus.SCHEDULED;
        this.confirmationStatus = SpaConfirmationStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public Long getSpaSessionId() {
        return spaSessionId;
    }

    public void setSpaSessionId(Long spaSessionId) {
        this.spaSessionId = spaSessionId;
    }

    public Integer getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Integer retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
    }

    public SpaTreatment getTreatment() {
        return treatment;
    }

    public void setTreatment(SpaTreatment treatment) {
        this.treatment = treatment;
    }

    public Therapist getTherapist() {
        return therapist;
    }

    public void setTherapist(Therapist therapist) {
        this.therapist = therapist;
    }

    public TreatmentRoom getTreatmentRoom() {
        return treatmentRoom;
    }

    public void setTreatmentRoom(TreatmentRoom treatmentRoom) {
        this.treatmentRoom = treatmentRoom;
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

    public BookingSource getBookingSource() {
        return bookingSource;
    }

    public void setBookingSource(BookingSource bookingSource) {
        this.bookingSource = bookingSource;
    }

    public SpaSessionStatus getSessionStatus() {
        return sessionStatus;
    }

    public void setSessionStatus(SpaSessionStatus sessionStatus) {
        this.sessionStatus = sessionStatus;
    }

    public SpaConfirmationStatus getConfirmationStatus() {
        return confirmationStatus;
    }

    public void setConfirmationStatus(SpaConfirmationStatus confirmationStatus) {
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
