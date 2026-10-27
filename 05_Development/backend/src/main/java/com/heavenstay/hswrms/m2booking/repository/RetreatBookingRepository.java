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

    @Query("SELECT b FROM RetreatBooking b LEFT JOIN FETCH b.assignedVilla WHERE b.retreatBookingId = :id")
    java.util.Optional<RetreatBooking> findByIdWithDetails(@Param("id") Integer id);

    default java.util.Optional<RetreatBooking> findByIdWithDetails(Long id) {
        if (id == null || id > Integer.MAX_VALUE) return java.util.Optional.empty();
        return findByIdWithDetails(id.intValue());
    }

    default java.util.Optional<RetreatBooking> findById(Long id) {
        if (id == null || id > Integer.MAX_VALUE) return java.util.Optional.empty();
        return findById(id.intValue());
    }

    @Query("SELECT b FROM RetreatBooking b WHERE b.checkInDate <= :toDate AND b.checkOutDate >= :fromDate")
    List<RetreatBooking> findBookingsInInterval(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    List<RetreatBooking> findByBookingStatus(String bookingStatus);

    @Query("SELECT b FROM RetreatBooking b LEFT JOIN FETCH b.assignedVilla v " +
           "WHERE v IS NOT NULL AND b.bookingStatus IN ('CONFIRMED','CHECKED_IN','COMPLETED') " +
           "AND b.checkInDate <= :toDate AND b.checkOutDate >= :fromDate")
    List<RetreatBooking> findVillaBookingsInInterval(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    @Query("SELECT b FROM RetreatBooking b WHERE b.assignedVilla.villaId = :villaId AND b.bookingStatus = 'CHECKED_IN'")
    List<RetreatBooking> findCheckedInByVillaId(@Param("villaId") Integer villaId);

    default List<RetreatBooking> findCheckedInByVillaId(Long villaId) {
        if (villaId == null || villaId > Integer.MAX_VALUE) return java.util.Collections.emptyList();
        return findCheckedInByVillaId(villaId.intValue());
    }

    /** True when the booking belongs to the customer profile of the given user (ownership check). */
    @Query("SELECT COUNT(b) > 0 FROM RetreatBooking b WHERE b.retreatBookingId = :bookingId AND b.customerProfileId IN (SELECT cp.customerProfileId FROM CustomerProfile cp WHERE cp.user.userId = :userId)")
    boolean existsByIdAndCustomerUserId(@Param("bookingId") Integer bookingId, @Param("userId") Integer userId);

    default boolean existsByIdAndCustomerUserId(Long bookingId, Long userId) {
        if (bookingId == null || userId == null || bookingId > Integer.MAX_VALUE || userId > Integer.MAX_VALUE) {
            return false;
        }
        return existsByIdAndCustomerUserId(bookingId.intValue(), userId.intValue());
    }

    default boolean existsByIdAndCustomerUserId(Integer bookingId, Long userId) {
        if (bookingId == null || userId == null || userId > Integer.MAX_VALUE) {
            return false;
        }
        return existsByIdAndCustomerUserId(bookingId, userId.intValue());
    }
}
