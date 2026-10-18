package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.RetreatBookingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RetreatBookingRepository extends JpaRepository<RetreatBookingEntity, Long> {

    @Query("SELECT b FROM RetreatBookingEntity b LEFT JOIN FETCH b.customerProfile cp LEFT JOIN FETCH cp.user LEFT JOIN FETCH b.assignedVilla WHERE b.retreatBookingId = :id")
    Optional<RetreatBookingEntity> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT b FROM RetreatBookingEntity b WHERE b.checkInDate <= :toDate AND b.checkOutDate >= :fromDate")
    List<RetreatBookingEntity> findBookingsInInterval(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    List<RetreatBookingEntity> findByBookingStatus(String bookingStatus);

    /** True when the booking belongs to the customer profile of the given user (ownership check). */
    @Query("SELECT COUNT(b) > 0 FROM RetreatBookingEntity b WHERE b.retreatBookingId = :bookingId AND b.customerProfile.user.userId = :userId")
    boolean existsByIdAndCustomerUserId(@Param("bookingId") Long bookingId, @Param("userId") Long userId);

    /** Villa-bound stays overlapping the interval that actually consume villa nights (cancelled/pending excluded). */
    @Query("SELECT b FROM RetreatBookingEntity b LEFT JOIN FETCH b.assignedVilla v "
            + "WHERE v IS NOT NULL AND b.bookingStatus IN ('CONFIRMED','CHECKED_IN','COMPLETED') "
            + "AND b.checkInDate <= :toDate AND b.checkOutDate >= :fromDate")
    List<RetreatBookingEntity> findVillaBookingsInInterval(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    @Query("SELECT b FROM RetreatBookingEntity b LEFT JOIN FETCH b.customerProfile cp LEFT JOIN FETCH cp.user WHERE b.assignedVilla.villaId = :villaId AND b.bookingStatus = 'CHECKED_IN'")
    List<RetreatBookingEntity> findCheckedInByVillaId(@Param("villaId") Long villaId);
}
