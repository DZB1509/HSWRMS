package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.IngredientUsageLog;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IngredientUsageLogRepository extends JpaRepository<IngredientUsageLog, Integer> {
    List<IngredientUsageLog> findByMealOrderItemIdInOrderByDeductedAtAsc(Collection<Integer> mealOrderItemIds);
}
