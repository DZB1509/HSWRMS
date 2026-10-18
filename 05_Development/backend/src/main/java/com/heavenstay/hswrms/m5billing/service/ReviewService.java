package com.heavenstay.hswrms.m5billing.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.RetreatBookingEntity;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m5billing.dto.CustomerReviewRequestDTO;
import com.heavenstay.hswrms.m5billing.dto.CustomerReviewResponseDTO;
import com.heavenstay.hswrms.m5billing.entity.CustomerReviewEntity;
import com.heavenstay.hswrms.m5billing.repository.CustomerReviewRepository;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private final CustomerReviewRepository reviewRepository;
    private final RetreatBookingRepository bookingRepository;
    private final AuditLogService auditLogService;

    public ReviewService(CustomerReviewRepository reviewRepository,
                         RetreatBookingRepository bookingRepository,
                         AuditLogService auditLogService) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public CustomerReviewResponseDTO submitReview(CustomerReviewRequestDTO request, Long authenticatedUserId) {
        RetreatBookingEntity booking = bookingRepository.findById(request.getRetreatBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking not found with ID: " + request.getRetreatBookingId()));

        // Ownership enforcement: the booking must belong to the authenticated customer
        if (authenticatedUserId != null && !bookingRepository.existsByIdAndCustomerUserId(booking.getRetreatBookingId(), authenticatedUserId)) {
            throw new AccessDeniedException("Access denied: You can only submit a review for your own stay.");
        }

        // Invariant: Customer can ONLY submit rating & review for completed bookings
        if (!"COMPLETED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new BusinessRuleException("STAY_NOT_COMPLETED",
                    "Reviews are only permitted for completed retreat stays. Current booking status: " + booking.getBookingStatus() + ".");
        }

        // Invariant: At most ONE review per booking (HTTP 409 ALREADY_REVIEWED)
        if (reviewRepository.existsByRetreatBookingId(booking.getRetreatBookingId())) {
            throw new ConflictException("ALREADY_REVIEWED",
                    "A review has already been submitted for this stay booking.");
        }

        CustomerReviewEntity review = new CustomerReviewEntity(
                booking,
                request.getOverallRating(),
                request.getComments(),
                request.getRoomRating(),
                request.getSpaRating(),
                request.getDiningRating()
        );

        try {
            CustomerReviewEntity savedReview = reviewRepository.save(review);
            auditLogService.record("SUBMIT_REVIEW", "RetreatBooking#" + booking.getRetreatBookingId(), "SUCCESS");
            return mapToReviewResponse(savedReview);
        } catch (DataIntegrityViolationException dive) {
            throw new ConflictException("ALREADY_REVIEWED",
                    "A review has already been submitted for this stay booking.");
        }
    }

    // Overload for backward compatibility / tests without security context
    @Transactional
    public CustomerReviewResponseDTO submitReview(CustomerReviewRequestDTO request) {
        return submitReview(request, null);
    }

    @Transactional(readOnly = true)
    public CustomerReviewResponseDTO getReviewByBookingId(Long bookingId, Long authenticatedUserId) {
        CustomerReviewEntity review = reviewRepository.findByRetreatBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("No review found for booking ID: " + bookingId));

        return mapToReviewResponse(review);
    }

    @Transactional(readOnly = true)
    public CustomerReviewResponseDTO getReviewByBookingId(Long bookingId) {
        return getReviewByBookingId(bookingId, null);
    }

    private CustomerReviewResponseDTO mapToReviewResponse(CustomerReviewEntity review) {
        CustomerReviewResponseDTO dto = new CustomerReviewResponseDTO(
                review.getReviewId(),
                review.getRetreatBooking().getRetreatBookingId(),
                review.getOverallRating(),
                review.getComments(),
                review.getSubmittedAt()
        );
        dto.setRoomRating(review.getRoomRating());
        dto.setSpaRating(review.getSpaRating());
        dto.setDiningRating(review.getDiningRating());
        return dto;
    }
}
