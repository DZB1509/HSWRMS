package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.MealOrderEntity;
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
public interface MealOrderRepository extends JpaRepository<MealOrderEntity, Integer> {

    // --- M4 Methods ---
    List<MealOrderEntity> findByRetreatBookingIdOrderByOrderDateDescCreatedAtDesc(Integer bookingId);
    List<MealOrderEntity> findByOrderDateAndOrderStatusNotOrderByCreatedAtDesc(LocalDate orderDate, String excludedStatus);
    List<MealOrderEntity> findByOrderStatusNotOrderByCreatedAtDesc(String excludedStatus);
    List<MealOrderEntity> findByOrderDateAndOrderStatusNotOrderByCreatedAtAsc(LocalDate orderDate, String excludedStatus);
    boolean existsByRetreatBookingIdAndOrderDateAndMealTypeAndOrderTypeAndOrderStatusNot(
            Integer retreatBookingId, LocalDate orderDate, String mealType, String orderType, String excludedStatus);
    List<MealOrderEntity> findByIdInOrderByCreatedAtDesc(Collection<Integer> ids);
    List<MealOrderEntity> findByIdInOrderByCreatedAtAsc(Collection<Integer> ids);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select mealOrder from MealOrderEntity mealOrder where mealOrder.id = :id")
    Optional<MealOrderEntity> findLockedById(@Param("id") Integer id);

    // --- Compatibility Methods for M5 Billing Settlement ---
    @Query("SELECT m FROM MealOrderEntity m WHERE m.retreatBookingId = :bookingId AND m.orderStatus IN ('PENDING', 'PREPARING')")
    List<MealOrderEntity> findUnsettledOrdersForBooking(@Param("bookingId") Integer bookingId);

    default List<MealOrderEntity> findUnsettledOrdersForBooking(Long bookingId) {
        if (bookingId == null || bookingId > Integer.MAX_VALUE) return Collections.emptyList();
        return findUnsettledOrdersForBooking(bookingId.intValue());
    }

    @Query("SELECT m FROM MealOrderEntity m WHERE m.retreatBookingId = :bookingId")
    List<MealOrderEntity> findByRetreatBookingId(@Param("bookingId") Integer bookingId);

    default List<MealOrderEntity> findByRetreatBookingId(Long bookingId) {
        if (bookingId == null || bookingId > Integer.MAX_VALUE) return Collections.emptyList();
        return findByRetreatBookingId(bookingId.intValue());
    }

    @Query("SELECT m FROM MealOrderEntity m WHERE m.orderDate >= :fromDate AND m.orderDate <= :toDate")
    List<MealOrderEntity> findOrdersInDateRange(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);
}
