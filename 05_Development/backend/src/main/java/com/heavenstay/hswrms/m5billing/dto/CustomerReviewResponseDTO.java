package com.heavenstay.hswrms.m5billing.dto;

import java.time.LocalDateTime;

public class CustomerReviewResponseDTO {

    private Long reviewId;
    private Long retreatBookingId;
    private Integer overallRating;
    private String comments;
    private LocalDateTime submittedAt;
    private Integer roomRating;
    private Integer spaRating;
    private Integer diningRating;

    public CustomerReviewResponseDTO() {}

    public CustomerReviewResponseDTO(Long reviewId, Long retreatBookingId, Integer overallRating, String comments, LocalDateTime submittedAt) {
        this.reviewId = reviewId;
        this.retreatBookingId = retreatBookingId;
        this.overallRating = overallRating;
        this.comments = comments;
        this.submittedAt = submittedAt;
    }

    public CustomerReviewResponseDTO(Long reviewId, Integer retreatBookingId, Integer overallRating, String comments, LocalDateTime submittedAt) {
        this(reviewId, retreatBookingId != null ? retreatBookingId.longValue() : null, overallRating, comments, submittedAt);
    }

    public Long getReviewId() {
        return reviewId;
    }

    public void setReviewId(Long reviewId) {
        this.reviewId = reviewId;
    }

    public Long getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Long retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
    }

    public Integer getOverallRating() {
        return overallRating;
    }

    public void setOverallRating(Integer overallRating) {
        this.overallRating = overallRating;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public Integer getRoomRating() {
        return roomRating;
    }

    public void setRoomRating(Integer roomRating) {
        this.roomRating = roomRating;
    }

    public Integer getSpaRating() {
        return spaRating;
    }

    public void setSpaRating(Integer spaRating) {
        this.spaRating = spaRating;
    }

    public Integer getDiningRating() {
        return diningRating;
    }

    public void setDiningRating(Integer diningRating) {
        this.diningRating = diningRating;
    }
}
