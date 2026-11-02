package com.heavenstay.hswrms.m5billing.repository;

import com.heavenstay.hswrms.m5billing.entity.CustomerReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerReviewRepository extends JpaRepository<CustomerReviewEntity, Long> {

    @Query("SELECT r FROM CustomerReviewEntity r WHERE r.retreatBooking.retreatBookingId = :bookingId")
    Optional<CustomerReviewEntity> findByRetreatBookingId(@Param("bookingId") Integer bookingId);

    default Optional<CustomerReviewEntity> findByRetreatBookingId(Long bookingId) {
        if (bookingId == null || bookingId > Integer.MAX_VALUE) return Optional.empty();
        return findByRetreatBookingId(bookingId.intValue());
    }

    @Query("SELECT COUNT(r) > 0 FROM CustomerReviewEntity r WHERE r.retreatBooking.retreatBookingId = :bookingId")
    boolean existsByRetreatBookingId(@Param("bookingId") Integer bookingId);

    default boolean existsByRetreatBookingId(Long bookingId) {
        if (bookingId == null || bookingId > Integer.MAX_VALUE) return false;
        return existsByRetreatBookingId(bookingId.intValue());
    }
}
