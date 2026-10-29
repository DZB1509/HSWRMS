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

    default Optional<MealOrderEntity> findById(Long id) {
        if (id == null) return Optional.empty();
        return findById(id.intValue());
    }

    default Optional<MealOrderEntity> findByIdWithLock(Long mealOrderId) {
        if (mealOrderId == null) return Optional.empty();
        return findLockedById(mealOrderId.intValue());
    }

    default Optional<MealOrderEntity> findByIdWithLock(Integer mealOrderId) {
        if (mealOrderId == null) return Optional.empty();
        return findLockedById(mealOrderId);
    }

    // --- Compatibility Methods for M5 Billing Settlement ---
    @Query("SELECT m FROM MealOrderEntity m WHERE m.retreatBookingId = :bookingId AND m.orderStatus IN ('PENDING', 'PREPARING', 'READY')")
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

    /**
     * Active kitchen queue: includes only unfulfilled active statuses (PENDING, PREPARING, READY).
     * Excludes terminal statuses (DELIVERED, CANCELLED).
     */
    @Query("SELECT m FROM MealOrderEntity m WHERE m.orderStatus IN ('PENDING', 'PREPARING', 'READY') ORDER BY m.orderDate ASC, m.createdAt ASC")
    List<MealOrderEntity> findActiveKitchenQueue();

    /**
     * Active kitchen queue for a specific target order date: includes only unfulfilled active statuses.
     * Excludes terminal statuses (DELIVERED, CANCELLED).
     */
    @Query("SELECT m FROM MealOrderEntity m WHERE m.orderDate = :orderDate AND m.orderStatus IN ('PENDING', 'PREPARING', 'READY') ORDER BY m.createdAt ASC")
    List<MealOrderEntity> findActiveKitchenQueueByDate(@Param("orderDate") LocalDate orderDate);

    /**
     * Explicit non-terminal order query: excludes both DELIVERED and CANCELLED.
     * Replaces legacy queries that filtered out only CANCELLED.
     */
    @Query("SELECT m FROM MealOrderEntity m WHERE m.orderStatus NOT IN ('DELIVERED', 'CANCELLED') ORDER BY m.orderDate ASC, m.createdAt ASC")
    List<MealOrderEntity> findNonTerminalOrders();

    @Query("SELECT m FROM MealOrderEntity m WHERE m.orderDate = :orderDate AND m.orderStatus NOT IN ('DELIVERED', 'CANCELLED') ORDER BY m.createdAt ASC")
    List<MealOrderEntity> findNonTerminalOrdersByDate(@Param("orderDate") LocalDate orderDate);

    @Query("SELECT m FROM MealOrderEntity m WHERE m.retreatBookingId = :bookingId AND m.orderDate = :orderDate AND m.mealType = :mealType AND m.orderType = 'DAILY_MEAL'")
    Optional<MealOrderEntity> findDailyMealSelection(
            @Param("bookingId") Integer bookingId,
            @Param("orderDate") LocalDate orderDate,
            @Param("mealType") String mealType);

    @Query("SELECT m FROM MealOrderEntity m WHERE m.retreatBookingId = :bookingId ORDER BY m.createdAt DESC")
    List<MealOrderEntity> findByBookingIdOrderByCreatedAtDesc(@Param("bookingId") Integer bookingId);

    @Query("SELECT m FROM MealOrderEntity m WHERE m.orderDate = :orderDate ORDER BY m.createdAt ASC")
    List<MealOrderEntity> findOrdersByDate(@Param("orderDate") LocalDate orderDate);
}
