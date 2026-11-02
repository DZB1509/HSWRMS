package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.MealOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface MealOrderItemRepository extends JpaRepository<MealOrderItem, Integer> {
    List<MealOrderItem> findByMealOrderId(Integer mealOrderId);

    default List<MealOrderItem> findByMealOrder_MealOrderId(Long mealOrderId) {
        if (mealOrderId == null) return List.of();
        return findByMealOrderId(mealOrderId.intValue());
    }

    List<MealOrderItem> findByMealOrderIdOrderByIdAsc(Integer mealOrderId);
    List<MealOrderItem> findByMealOrderIdInOrderByMealOrderIdAscIdAsc(Collection<Integer> mealOrderIds);
    void deleteByMealOrderId(Integer mealOrderId);
}
