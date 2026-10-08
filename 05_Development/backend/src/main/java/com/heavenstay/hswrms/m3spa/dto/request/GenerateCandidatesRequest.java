package com.heavenstay.hswrms.m3spa.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class GenerateCandidatesRequest {

    @NotNull(message = "treatmentId is required")
    private Integer treatmentId;

    @NotNull(message = "preferredDate is required")
    private LocalDate preferredDate;

    private String timeRangeConstraint; // MORNING, AFTERNOON, EVENING, ALL
    private Integer retreatBookingId;
    private Long rescheduleSessionId;
    private Integer alternativeSearchDays; // Optional client-requested search horizon

    public GenerateCandidatesRequest() {
    }

    public GenerateCandidatesRequest(Integer treatmentId, LocalDate preferredDate, String timeRangeConstraint) {
        this.treatmentId = treatmentId;
        this.preferredDate = preferredDate;
        this.timeRangeConstraint = timeRangeConstraint;
    }

    public GenerateCandidatesRequest(Integer treatmentId, LocalDate preferredDate, String timeRangeConstraint, Integer alternativeSearchDays) {
        this.treatmentId = treatmentId;
        this.preferredDate = preferredDate;
        this.timeRangeConstraint = timeRangeConstraint;
        this.alternativeSearchDays = alternativeSearchDays;
    }

    public Integer getTreatmentId() {
        return treatmentId;
    }

    public void setTreatmentId(Integer treatmentId) {
        this.treatmentId = treatmentId;
    }

    public LocalDate getPreferredDate() {
        return preferredDate;
    }

    public void setPreferredDate(LocalDate preferredDate) {
        this.preferredDate = preferredDate;
    }

    public String getTimeRangeConstraint() {
        return timeRangeConstraint;
    }

    public void setTimeRangeConstraint(String timeRangeConstraint) {
        this.timeRangeConstraint = timeRangeConstraint;
    }

    public Integer getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Integer retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
    }

    public Long getRescheduleSessionId() {
        return rescheduleSessionId;
    }

    public void setRescheduleSessionId(Long rescheduleSessionId) {
        this.rescheduleSessionId = rescheduleSessionId;
    }

    public Integer getAlternativeSearchDays() {
        return alternativeSearchDays;
    }

    public void setAlternativeSearchDays(Integer alternativeSearchDays) {
        this.alternativeSearchDays = alternativeSearchDays;
    }
}
