package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.MealOrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MealOrderItemRepository extends JpaRepository<MealOrderItemEntity, Integer> {

    List<MealOrderItemEntity> findByMealOrder_MealOrderId(Long mealOrderId);
}
