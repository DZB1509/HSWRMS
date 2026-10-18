package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.MealOrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MealOrderRepository extends JpaRepository<MealOrderEntity, Long> {

    @Query("SELECT m FROM MealOrderEntity m WHERE m.retreatBooking.retreatBookingId = :bookingId")
    List<MealOrderEntity> findByRetreatBookingId(@Param("bookingId") Long bookingId);

    @Query("SELECT m FROM MealOrderEntity m WHERE m.retreatBooking.retreatBookingId = :bookingId AND m.orderStatus IN ('PENDING', 'PREPARING')")
    List<MealOrderEntity> findUnsettledOrdersForBooking(@Param("bookingId") Long bookingId);

    @Query("SELECT m FROM MealOrderEntity m WHERE m.orderDate >= :fromDate AND m.orderDate <= :toDate")
    List<MealOrderEntity> findOrdersInDateRange(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);
}
