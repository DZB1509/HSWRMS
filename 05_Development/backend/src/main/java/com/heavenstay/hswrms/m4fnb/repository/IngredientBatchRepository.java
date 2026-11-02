package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.IngredientBatch;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IngredientBatchRepository extends JpaRepository<IngredientBatch, Integer> {
    @Query("select b from IngredientBatch b where b.ingredientId = :ingredientId "
            + "and b.expirationDate >= :asOfDate and b.remainingQuantity > 0 "
            + "and b.stockCondition in :usableConditions order by b.expirationDate, b.id")
    List<IngredientBatch> findUsableBatches(@Param("ingredientId") Integer ingredientId,
            @Param("asOfDate") LocalDate asOfDate,
            @Param("usableConditions") Collection<String> usableConditions);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from IngredientBatch b where b.ingredientId = :ingredientId "
            + "and b.expirationDate >= :asOfDate and b.remainingQuantity > 0 "
            + "and b.stockCondition in :usableConditions order by b.expirationDate, b.id")
    List<IngredientBatch> findUsableBatchesForUpdate(@Param("ingredientId") Integer ingredientId,
            @Param("asOfDate") LocalDate asOfDate,
            @Param("usableConditions") Collection<String> usableConditions);

    @Query("select b from IngredientBatch b where (:ingredientId is null or b.ingredientId = :ingredientId) "
            + "order by b.expirationDate, b.id")
    List<IngredientBatch> findAllByIngredient(@Param("ingredientId") Integer ingredientId);
}
