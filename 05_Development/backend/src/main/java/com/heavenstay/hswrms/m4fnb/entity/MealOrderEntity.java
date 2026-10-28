package com.heavenstay.hswrms.m4fnb.entity;

import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Temporary minimal stub for Module 4 (F&B) required by Module 5 billing settlement.
 * Targets canonical RetreatBooking entity.
 */
@Entity
@Table(name = "MealOrder")
public class MealOrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meal_order_id")
    private Long mealOrderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retreat_booking_id", nullable = false)
    private RetreatBooking retreatBooking;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "meal_type", length = 50)
    private String mealType;

    @Column(name = "order_type", nullable = false, length = 20)
    private String orderType = "A_LA_CARTE"; // DAILY_MEAL, A_LA_CARTE

    @Column(name = "order_status", nullable = false, length = 20)
    private String orderStatus = "PENDING"; // PENDING, PREPARING, READY, DELIVERED, CANCELLED

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "mealOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<MealOrderItemEntity> items = new java.util.ArrayList<>();

    public MealOrderEntity() {}

    public Long getMealOrderId() {
        return mealOrderId;
    }

    public void setMealOrderId(Long mealOrderId) {
        this.mealOrderId = mealOrderId;
    }

    public RetreatBooking getRetreatBooking() {
        return retreatBooking;
    }

    public void setRetreatBooking(RetreatBooking retreatBooking) {
        this.retreatBooking = retreatBooking;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
    }

    public String getMealType() {
        return mealType;
    }

    public void setMealType(String mealType) {
        this.mealType = mealType;
    }

    public String getOrderType() {
        return orderType;
    }

    public void setOrderType(String orderType) {
        this.orderType = orderType;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public java.util.List<MealOrderItemEntity> getItems() {
        return items;
    }

    public void setItems(java.util.List<MealOrderItemEntity> items) {
        this.items = items;
    }

    public void addItem(MealOrderItemEntity item) {
        if (items == null) {
            items = new java.util.ArrayList<>();
        }
        items.add(item);
        item.setMealOrder(this);
    }
}
