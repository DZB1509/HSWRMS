package com.heavenstay.hswrms.m5billing.entity;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m2booking.entity.RetreatBookingEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "CustomerReview")
public class CustomerReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long reviewId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retreat_booking_id", nullable = false, unique = true)
    private RetreatBookingEntity retreatBooking;

    @Column(name = "overall_rating", nullable = false)
    private Integer overallRating; // 1 to 5

    @Column(name = "comments", length = 2000)
    private String comments;

    @Column(name = "room_rating")
    private Integer roomRating;

    @Column(name = "spa_rating")
    private Integer spaRating;

    @Column(name = "dining_rating")
    private Integer diningRating;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    public CustomerReviewEntity() {}

    public CustomerReviewEntity(RetreatBookingEntity retreatBooking, Integer overallRating, String comments) {
        this.retreatBooking = retreatBooking;
        this.overallRating = overallRating;
        this.comments = comments;
        this.submittedAt = LocalDateTime.now();
        validateRating();
    }

    public CustomerReviewEntity(RetreatBookingEntity retreatBooking, Integer overallRating, String comments,
                                Integer roomRating, Integer spaRating, Integer diningRating) {
        this(retreatBooking, overallRating, comments);
        this.roomRating = roomRating;
        this.spaRating = spaRating;
        this.diningRating = diningRating;
        validateRating();
    }

    @PrePersist
    @PreUpdate
    public void validateRating() {
        if (overallRating == null || overallRating < 1 || overallRating > 5) {
            throw new BusinessRuleException("INVALID_RATING", "Overall rating must be between 1 and 5.");
        }
        for (Integer category : new Integer[]{roomRating, spaRating, diningRating}) {
            if (category != null && (category < 1 || category > 5)) {
                throw new BusinessRuleException("INVALID_RATING", "Category ratings must be between 1 and 5.");
            }
        }
        if (comments != null && comments.length() > 2000) {
            throw new BusinessRuleException("INVALID_COMMENT", "Comments must not exceed 2000 characters.");
        }
    }

    public Integer getRoomRating() {
        return roomRating;
    }

    public Integer getSpaRating() {
        return spaRating;
    }

    public Integer getDiningRating() {
        return diningRating;
    }

    public Long getReviewId() {
        return reviewId;
    }

    public void setReviewId(Long reviewId) {
        this.reviewId = reviewId;
    }

    public RetreatBookingEntity getRetreatBooking() {
        return retreatBooking;
    }

    public void setRetreatBooking(RetreatBookingEntity retreatBooking) {
        this.retreatBooking = retreatBooking;
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
}
