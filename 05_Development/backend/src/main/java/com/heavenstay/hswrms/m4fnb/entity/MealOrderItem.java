package com.heavenstay.hswrms.m4fnb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "MealOrderItem", schema = "dbo")
public class MealOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meal_order_item_id")
    private Integer id;

    @Column(name = "meal_order_id", nullable = false)
    private Integer mealOrderId;

    @Column(name = "menu_item_id", nullable = false)
    private Integer menuItemId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    protected MealOrderItem() { }

    public MealOrderItem(Integer mealOrderId, Integer menuItemId, Integer quantity, BigDecimal unitPrice) {
        this.mealOrderId = mealOrderId;
        this.menuItemId = menuItemId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public Integer getId() { return id; }
    public Integer getMealOrderId() { return mealOrderId; }
    public Integer getMenuItemId() { return menuItemId; }
    public Integer getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
}
