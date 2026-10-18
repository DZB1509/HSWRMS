package com.heavenstay.hswrms.m3spa.dto.request;

import com.heavenstay.hswrms.m3spa.entity.enums.BookingSource;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class ConfirmReservationRequest {

    @NotNull(message = "treatmentId is required")
    private Integer treatmentId;

    @NotNull(message = "therapistId is required")
    private Integer therapistId;

    @NotNull(message = "roomId is required")
    private Integer roomId;

    @NotNull(message = "scheduledStartAt is required")
    private LocalDateTime scheduledStartAt;

    @NotNull(message = "scheduledEndAt is required")
    private LocalDateTime scheduledEndAt;

    private Integer retreatBookingId;
    private String customerNote;
    private BookingSource bookingSource = BookingSource.CUSTOMER;
    private Long rescheduleSessionId;

    public ConfirmReservationRequest() {
    }

    public ConfirmReservationRequest(Integer treatmentId, Integer therapistId, Integer roomId,
                                     LocalDateTime scheduledStartAt, LocalDateTime scheduledEndAt,
                                     Integer retreatBookingId, String customerNote) {
        this.treatmentId = treatmentId;
        this.therapistId = therapistId;
        this.roomId = roomId;
        this.scheduledStartAt = scheduledStartAt;
        this.scheduledEndAt = scheduledEndAt;
        this.retreatBookingId = retreatBookingId;
        this.customerNote = customerNote;
    }

    public Integer getTreatmentId() {
        return treatmentId;
    }

    public void setTreatmentId(Integer treatmentId) {
        this.treatmentId = treatmentId;
    }

    public Integer getTherapistId() {
        return therapistId;
    }

    public void setTherapistId(Integer therapistId) {
        this.therapistId = therapistId;
    }

    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
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

    public Integer getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Integer retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
    }

    public String getCustomerNote() {
        return customerNote;
    }

    public void setCustomerNote(String customerNote) {
        this.customerNote = customerNote;
    }

    public BookingSource getBookingSource() {
        return bookingSource;
    }

    public void setBookingSource(BookingSource bookingSource) {
        this.bookingSource = bookingSource;
    }

    public Long getRescheduleSessionId() {
        return rescheduleSessionId;
    }

    public void setRescheduleSessionId(Long rescheduleSessionId) {
        this.rescheduleSessionId = rescheduleSessionId;
    }
}
