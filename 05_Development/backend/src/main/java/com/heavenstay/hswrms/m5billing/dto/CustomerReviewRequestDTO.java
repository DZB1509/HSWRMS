package com.heavenstay.hswrms.m5billing.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CustomerReviewRequestDTO {

    @NotNull(message = "retreatBookingId is mandatory")
    private Long retreatBookingId;

    @NotNull(message = "overallRating is mandatory")
    @Min(value = 1, message = "overallRating must be between 1 and 5")
    @Max(value = 5, message = "overallRating must be between 1 and 5")
    private Integer overallRating;

    @Size(max = 2000, message = "comments must not exceed 2000 characters")
    private String comments;

    @Min(value = 1, message = "roomRating must be between 1 and 5")
    @Max(value = 5, message = "roomRating must be between 1 and 5")
    private Integer roomRating;

    @Min(value = 1, message = "spaRating must be between 1 and 5")
    @Max(value = 5, message = "spaRating must be between 1 and 5")
    private Integer spaRating;

    @Min(value = 1, message = "diningRating must be between 1 and 5")
    @Max(value = 5, message = "diningRating must be between 1 and 5")
    private Integer diningRating;

    public CustomerReviewRequestDTO() {}

    public CustomerReviewRequestDTO(Long retreatBookingId, Integer overallRating, String comments) {
        this.retreatBookingId = retreatBookingId;
        this.overallRating = overallRating;
        this.comments = comments;
    }

    public CustomerReviewRequestDTO(Integer retreatBookingId, Integer overallRating, String comments) {
        this(retreatBookingId != null ? retreatBookingId.longValue() : null, overallRating, comments);
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
