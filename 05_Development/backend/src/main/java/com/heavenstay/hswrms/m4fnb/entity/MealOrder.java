package com.heavenstay.hswrms.m4fnb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "MealOrder", schema = "dbo")
public class MealOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meal_order_id")
    private Integer id;

    @Column(name = "retreat_booking_id", nullable = false)
    private Integer retreatBookingId;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "meal_type", length = 50)
    private String mealType;

    @Column(name = "order_type", nullable = false, length = 20)
    private String orderType;

    @Column(name = "order_status", nullable = false, length = 20)
    private String orderStatus;

    @Column(name = "special_notes", length = 1000)
    private String specialNotes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected MealOrder() { }

    public MealOrder(Integer retreatBookingId, LocalDate orderDate, String mealType,
                     FnbOrderType orderType, FnbOrderStatus orderStatus, LocalDateTime createdAt,
                     String specialNotes) {
        this.retreatBookingId = retreatBookingId;
        this.orderDate = orderDate;
        this.mealType = mealType;
        this.orderType = orderType.name();
        this.orderStatus = orderStatus.name();
        this.createdAt = createdAt;
        this.specialNotes = specialNotes;
    }

    public Integer getId() { return id; }
    public Integer getRetreatBookingId() { return retreatBookingId; }
    public LocalDate getOrderDate() { return orderDate; }
    public String getMealType() { return mealType; }
    public String getOrderType() { return orderType; }
    public FnbOrderType getOrderTypeValue() { return FnbOrderType.valueOf(orderType); }
    public String getOrderStatus() { return orderStatus; }
    public FnbOrderStatus getOrderStatusValue() { return FnbOrderStatus.valueOf(orderStatus); }
    public void setOrderStatus(FnbOrderStatus orderStatus) { this.orderStatus = orderStatus.name(); }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getSpecialNotes() { return specialNotes; }
    public void setSpecialNotes(String specialNotes) { this.specialNotes = specialNotes; }
}
