package com.heavenstay.hswrms.m4fnb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "IngredientUsageLog", schema = "dbo")
public class IngredientUsageLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ingredient_usage_log_id")
    private Integer id;

    @Column(name = "meal_order_item_id", nullable = false)
    private Integer mealOrderItemId;

    @Column(name = "ingredient_batch_id", nullable = false)
    private Integer ingredientBatchId;

    @Column(name = "logged_by_user_id", nullable = false)
    private Integer loggedByUserId;

    @Column(name = "quantity_used", nullable = false, precision = 18, scale = 3)
    private BigDecimal quantityUsed;

    @Column(name = "deducted_at", nullable = false)
    private LocalDateTime deductedAt;

    protected IngredientUsageLog() { }

    public IngredientUsageLog(Integer mealOrderItemId, Integer ingredientBatchId, Integer loggedByUserId,
                              BigDecimal quantityUsed, LocalDateTime deductedAt) {
        this.mealOrderItemId = mealOrderItemId;
        this.ingredientBatchId = ingredientBatchId;
        this.loggedByUserId = loggedByUserId;
        this.quantityUsed = quantityUsed;
        this.deductedAt = deductedAt;
    }

    public Integer getId() { return id; }
    public Integer getMealOrderItemId() { return mealOrderItemId; }
    public Integer getIngredientBatchId() { return ingredientBatchId; }
    public Integer getLoggedByUserId() { return loggedByUserId; }
    public BigDecimal getQuantityUsed() { return quantityUsed; }
    public LocalDateTime getDeductedAt() { return deductedAt; }
}
