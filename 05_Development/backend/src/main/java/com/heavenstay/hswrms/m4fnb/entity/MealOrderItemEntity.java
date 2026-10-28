package com.heavenstay.hswrms.m4fnb.entity;

import jakarta.persistence.*;

/**
 * Entity mapped to dbo.MealOrderItem representing individual items and quantities
 * within a MealOrder.
 */
@Entity
@Table(name = "MealOrderItem", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_MealOrderItem_OrderMenu", columnNames = {"meal_order_id", "menu_item_id"})
})
public class MealOrderItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meal_order_item_id")
    private Integer mealOrderItemId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meal_order_id", nullable = false)
    private MealOrderEntity mealOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItemEntity menuItem;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    public MealOrderItemEntity() {}

    public MealOrderItemEntity(MealOrderEntity mealOrder, MenuItemEntity menuItem, Integer quantity) {
        this.mealOrder = mealOrder;
        this.menuItem = menuItem;
        this.quantity = quantity;
    }

    public Integer getMealOrderItemId() {
        return mealOrderItemId;
    }

    public void setMealOrderItemId(Integer mealOrderItemId) {
        this.mealOrderItemId = mealOrderItemId;
    }

    public MealOrderEntity getMealOrder() {
        return mealOrder;
    }

    public void setMealOrder(MealOrderEntity mealOrder) {
        this.mealOrder = mealOrder;
    }

    public MenuItemEntity getMenuItem() {
        return menuItem;
    }

    public void setMenuItem(MenuItemEntity menuItem) {
        this.menuItem = menuItem;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
