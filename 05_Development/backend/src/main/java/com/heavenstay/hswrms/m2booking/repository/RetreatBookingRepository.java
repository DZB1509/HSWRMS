package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RetreatBookingRepository extends JpaRepository<RetreatBooking, Integer> {

    List<RetreatBooking> findByCustomerProfileIdOrderByCreatedAtDesc(Integer customerProfileId);

    @Query("SELECT COUNT(rb) FROM RetreatBooking rb " +
           "WHERE rb.requestedVillaCategory.villaCategoryId = :categoryId " +
           "AND rb.bookingStatus IN ('CONFIRMED', 'CHECKED_IN') " +
           "AND rb.checkInDate < :checkOutDate " +
           "AND rb.checkOutDate > :checkInDate")
    long countBookedVillasInCategoryBetweenDates(@Param("categoryId") Integer categoryId,
                                                @Param("checkInDate") LocalDate checkInDate,
                                                @Param("checkOutDate") LocalDate checkOutDate);

    @Query("SELECT rb FROM RetreatBooking rb " +
           "WHERE rb.checkInDate = :date " +
           "AND rb.bookingStatus IN ('CONFIRMED', 'CHECKED_IN') " +
           "ORDER BY rb.checkInDate ASC, rb.retreatBookingId ASC")
    List<RetreatBooking> findArrivalsByDate(@Param("date") LocalDate date);
}
