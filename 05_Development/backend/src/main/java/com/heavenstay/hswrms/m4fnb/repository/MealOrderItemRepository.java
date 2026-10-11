package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.MealOrderItem;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealOrderItemRepository extends JpaRepository<MealOrderItem, Integer> {
    List<MealOrderItem> findByMealOrderIdOrderByIdAsc(Integer mealOrderId);
    List<MealOrderItem> findByMealOrderIdInOrderByMealOrderIdAscIdAsc(Collection<Integer> mealOrderIds);
    void deleteByMealOrderId(Integer mealOrderId);
}
