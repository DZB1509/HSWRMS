package com.heavenstay.hswrms.m4fnb.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class MealOrderDto {
    private Long mealOrderId;
    private Integer retreatBookingId;
    private LocalDate orderDate;
    private String mealType;
    private String orderType;
    private String orderStatus;
    private LocalDateTime createdAt;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private List<MealOrderItemDto> items = new ArrayList<>();

    public MealOrderDto() {}

    public Long getMealOrderId() {
        return mealOrderId;
    }

    public void setMealOrderId(Long mealOrderId) {
        this.mealOrderId = mealOrderId;
    }

    public Integer getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Integer retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
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

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public List<MealOrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<MealOrderItemDto> items) {
        this.items = items != null ? items : new ArrayList<>();
    }
}
