package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RetreatBookingRepository extends JpaRepository<RetreatBooking, Integer> {

    List<RetreatBooking> findByCustomerProfileIdOrderByCreatedAtDesc(Integer customerProfileId);

    List<RetreatBooking> findByCustomerProfileIdInOrderByCreatedAtDesc(Collection<Integer> customerProfileIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT rb FROM RetreatBooking rb WHERE rb.retreatBookingId = :id")
    Optional<RetreatBooking> findByIdForUpdate(@Param("id") Integer id);

    @Query("SELECT COUNT(rb) FROM RetreatBooking rb " +
           "WHERE rb.requestedVillaCategory.villaCategoryId = :categoryId " +
           "AND rb.bookingStatus IN ('CONFIRMED', 'CHECKED_IN') " +
           "AND rb.checkInDate < :checkOutDate " +
           "AND rb.checkOutDate > :checkInDate")
    long countBookedVillasInCategoryBetweenDates(@Param("categoryId") Integer categoryId,
                                                @Param("checkInDate") LocalDate checkInDate,
                                                @Param("checkOutDate") LocalDate checkOutDate);

    /**
     * Number of bookings of a villa category that occupy inventory in [checkIn, checkOut).
     * Check-in day is counted, check-out day is not (back-to-back stays do not collide).
     * CONFIRMED / CHECKED_IN always hold inventory; PENDING holds it only while its hold
     * window is still open (created_at > holdCutoff).
     */
    @Query("SELECT COUNT(rb) FROM RetreatBooking rb " +
           "WHERE rb.requestedVillaCategory.villaCategoryId = :categoryId " +
           "AND rb.retreatBookingId <> :excludeBookingId " +
           "AND (rb.bookingStatus IN ('CONFIRMED', 'CHECKED_IN') " +
           "     OR (rb.bookingStatus = 'PENDING' AND rb.createdAt > :holdCutoff)) " +
           "AND rb.checkInDate < :checkOutDate " +
           "AND rb.checkOutDate > :checkInDate")
    long countInventoryHolds(@Param("categoryId") Integer categoryId,
                             @Param("checkInDate") LocalDate checkInDate,
                             @Param("checkOutDate") LocalDate checkOutDate,
                             @Param("holdCutoff") LocalDateTime holdCutoff,
                             @Param("excludeBookingId") Integer excludeBookingId);

    /** Bookings of a category that still hold inventory on or after {@code fromDate}. */
    @Query("SELECT rb FROM RetreatBooking rb " +
           "WHERE rb.requestedVillaCategory.villaCategoryId = :categoryId " +
           "AND (rb.bookingStatus IN ('CONFIRMED', 'CHECKED_IN') " +
           "     OR (rb.bookingStatus = 'PENDING' AND rb.createdAt > :holdCutoff)) " +
           "AND rb.checkOutDate > :fromDate")
    List<RetreatBooking> findInventoryHoldingFrom(@Param("categoryId") Integer categoryId,
                                                  @Param("fromDate") LocalDate fromDate,
                                                  @Param("holdCutoff") LocalDateTime holdCutoff);

    /** Arrivals of a given day: confirmed (awaiting check-in) and already checked-in guests. */
    @Query("SELECT rb FROM RetreatBooking rb " +
           "WHERE rb.checkInDate = :date " +
           "AND rb.bookingStatus IN ('CONFIRMED', 'CHECKED_IN') " +
           "ORDER BY rb.checkInDate ASC, rb.retreatBookingId ASC")
    List<RetreatBooking> findArrivalsByDate(@Param("date") LocalDate date);

    @Query("SELECT rb FROM RetreatBooking rb WHERE rb.assignedVilla IS NOT NULL AND rb.bookingStatus = 'CHECKED_IN'")
    List<RetreatBooking> findCheckedInWithVilla();

    boolean existsByAssignedVilla_VillaIdAndBookingStatus(Integer villaId, String bookingStatus);

    @Query("SELECT rb FROM RetreatBooking rb WHERE rb.bookingStatus = :status ORDER BY rb.checkInDate ASC, rb.retreatBookingId ASC")
    List<RetreatBooking> findByStatus(@Param("status") String status);

    @Query("SELECT rb FROM RetreatBooking rb ORDER BY rb.createdAt DESC, rb.retreatBookingId DESC")
    List<RetreatBooking> findAllBookingsOrdered();

    @Query("SELECT rb FROM RetreatBooking rb WHERE rb.bookingStatus = :status ORDER BY rb.createdAt DESC, rb.retreatBookingId DESC")
    List<RetreatBooking> findByStatusOrdered(@Param("status") String status);

    @Query("SELECT b FROM RetreatBooking b LEFT JOIN FETCH b.assignedVilla WHERE b.retreatBookingId = :id")
    Optional<RetreatBooking> findByIdWithDetails(@Param("id") Integer id);

    default Optional<RetreatBooking> findByIdWithDetails(Long id) {
        if (id == null || id > Integer.MAX_VALUE) return Optional.empty();
        return findByIdWithDetails(id.intValue());
    }

    default Optional<RetreatBooking> findById(Long id) {
        if (id == null || id > Integer.MAX_VALUE) return Optional.empty();
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
