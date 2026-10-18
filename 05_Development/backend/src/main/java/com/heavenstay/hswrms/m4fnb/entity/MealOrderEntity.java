package com.heavenstay.hswrms.m4fnb.entity;

import com.heavenstay.hswrms.m2booking.entity.RetreatBookingEntity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "MealOrder")
public class MealOrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meal_order_id")
    private Long mealOrderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retreat_booking_id", nullable = false)
    private RetreatBookingEntity retreatBooking;

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

    public MealOrderEntity() {}

    public Long getMealOrderId() {
        return mealOrderId;
    }

    public void setMealOrderId(Long mealOrderId) {
        this.mealOrderId = mealOrderId;
    }

    public RetreatBookingEntity getRetreatBooking() {
        return retreatBooking;
    }

    public void setRetreatBooking(RetreatBookingEntity retreatBooking) {
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
}
