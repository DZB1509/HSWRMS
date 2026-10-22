package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.MealOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public interface MealOrderRepository extends JpaRepository<MealOrder, Integer> {

    // --- M4 Methods ---
    List<MealOrder> findByRetreatBookingIdOrderByOrderDateDescCreatedAtDesc(Integer bookingId);
    List<MealOrder> findByOrderDateAndOrderStatusNotOrderByCreatedAtDesc(LocalDate orderDate, String excludedStatus);
    List<MealOrder> findByOrderStatusNotOrderByCreatedAtDesc(String excludedStatus);
    List<MealOrder> findByOrderDateAndOrderStatusNotOrderByCreatedAtAsc(LocalDate orderDate, String excludedStatus);
    boolean existsByRetreatBookingIdAndOrderDateAndMealTypeAndOrderTypeAndOrderStatusNot(
            Integer retreatBookingId, LocalDate orderDate, String mealType, String orderType, String excludedStatus);
    List<MealOrder> findByIdInOrderByCreatedAtDesc(Collection<Integer> ids);
    List<MealOrder> findByIdInOrderByCreatedAtAsc(Collection<Integer> ids);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select mealOrder from MealOrder mealOrder where mealOrder.id = :id")
    Optional<MealOrder> findLockedById(@Param("id") Integer id);

    // --- Compatibility Methods for M5 Billing Settlement ---
    @Query("SELECT m FROM MealOrder m WHERE m.retreatBookingId = :bookingId AND m.orderStatus IN ('PENDING', 'PREPARING')")
    List<MealOrder> findUnsettledOrdersForBooking(@Param("bookingId") Integer bookingId);

    default List<MealOrder> findUnsettledOrdersForBooking(Long bookingId) {
        if (bookingId == null || bookingId > Integer.MAX_VALUE) return Collections.emptyList();
        return findUnsettledOrdersForBooking(bookingId.intValue());
    }

    @Query("SELECT m FROM MealOrder m WHERE m.retreatBookingId = :bookingId")
    List<MealOrder> findByRetreatBookingId(@Param("bookingId") Integer bookingId);

    default List<MealOrder> findByRetreatBookingId(Long bookingId) {
        if (bookingId == null || bookingId > Integer.MAX_VALUE) return Collections.emptyList();
        return findByRetreatBookingId(bookingId.intValue());
    }

    @Query("SELECT m FROM MealOrder m WHERE m.orderDate >= :fromDate AND m.orderDate <= :toDate")
    List<MealOrder> findOrdersInDateRange(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);
}
