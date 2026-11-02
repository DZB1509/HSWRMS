package com.heavenstay.hswrms.m4fnb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

    @jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @jakarta.persistence.JoinColumn(name = "meal_order_id", insertable = false, updatable = false)
    private MealOrderEntity mealOrder;

    @jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @jakarta.persistence.JoinColumn(name = "menu_item_id", insertable = false, updatable = false)
    private MenuItem menuItem;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "preparation_status", nullable = false, length = 20)
    private MealOrderItemPreparationStatus preparationStatus = MealOrderItemPreparationStatus.PENDING;

    protected MealOrderItem() { }

    public MealOrderItem(Integer mealOrderId, Integer menuItemId, Integer quantity, BigDecimal unitPrice) {
        this.mealOrderId = mealOrderId;
        this.menuItemId = menuItemId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public MealOrderItem(Integer mealOrderId, Integer menuItemId, Integer quantity, BigDecimal unitPrice,
                         MealOrderItemPreparationStatus preparationStatus) {
        this(mealOrderId, menuItemId, quantity, unitPrice);
        this.preparationStatus = preparationStatus;
    }

    public Integer getId() { return id; }
    public Integer getMealOrderId() { return mealOrderId; }
    public Integer getMenuItemId() { return menuItemId; }
    public Integer getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public String getPreparationStatus() { return preparationStatus.name(); }
    public MealOrderItemPreparationStatus getPreparationStatusValue() { return preparationStatus; }
    public void setPreparationStatus(MealOrderItemPreparationStatus preparationStatus) {
        this.preparationStatus = preparationStatus;
    }

    public Integer getMealOrderItemId() { return id; }
    public void setMealOrderItemId(Integer id) { this.id = id; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public MealOrderItem(MealOrderEntity mealOrder, MenuItem menuItem, Integer quantity) {
        this.mealOrder = mealOrder;
        this.mealOrderId = mealOrder != null && mealOrder.getId() != null ? mealOrder.getId() : null;
        this.menuItem = menuItem;
        this.menuItemId = menuItem != null ? menuItem.getId() : null;
        this.quantity = quantity;
        this.unitPrice = menuItem != null && menuItem.getPrice() != null ? menuItem.getPrice() : BigDecimal.ZERO;
    }

    public MealOrderEntity getMealOrder() { return mealOrder; }
    public void setMealOrder(MealOrderEntity mealOrder) {
        this.mealOrder = mealOrder;
        if (mealOrder != null && mealOrder.getId() != null) {
            this.mealOrderId = mealOrder.getId();
        }
    }

    public MenuItem getMenuItem() { return menuItem; }
    public void setMenuItem(MenuItem menuItem) {
        this.menuItem = menuItem;
        if (menuItem != null && menuItem.getId() != null) {
            this.menuItemId = menuItem.getId();
        }
    }
}
