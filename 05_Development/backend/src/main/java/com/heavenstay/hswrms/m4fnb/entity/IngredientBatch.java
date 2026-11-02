package com.heavenstay.hswrms.m4fnb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "IngredientBatch", schema = "dbo")
public class IngredientBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ingredient_batch_id")
    private Integer id;

    @Column(name = "ingredient_id", nullable = false)
    private Integer ingredientId;

    @Column(name = "received_date", nullable = false)
    private LocalDate receivedDate;

    @Column(name = "expiration_date", nullable = false)
    private LocalDate expirationDate;

    @Column(name = "remaining_quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal remainingQuantity;

    @Column(name = "stock_condition", nullable = false, length = 50)
    private String stockCondition;

    protected IngredientBatch() { }

    public IngredientBatch(Integer ingredientId, LocalDate receivedDate, LocalDate expirationDate,
                           BigDecimal remainingQuantity, String stockCondition) {
        this.ingredientId = ingredientId;
        this.receivedDate = receivedDate;
        this.expirationDate = expirationDate;
        this.remainingQuantity = remainingQuantity;
        this.stockCondition = stockCondition;
    }

    public Integer getId() { return id; }
    public Integer getIngredientId() { return ingredientId; }
    public LocalDate getReceivedDate() { return receivedDate; }
    public LocalDate getExpirationDate() { return expirationDate; }
    public BigDecimal getRemainingQuantity() { return remainingQuantity; }
    public void setRemainingQuantity(BigDecimal remainingQuantity) { this.remainingQuantity = remainingQuantity; }
    public String getStockCondition() { return stockCondition; }
    public void setStockCondition(String stockCondition) { this.stockCondition = stockCondition; }
}
