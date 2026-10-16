package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.MealOrder;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MealOrderRepository extends JpaRepository<MealOrder, Integer> {
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
}
