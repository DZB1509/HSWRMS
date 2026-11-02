package com.heavenstay.hswrms.m4fnb.entity;

import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "MealOrder", schema = "dbo")
public class MealOrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meal_order_id")
    private Integer id;

    @Column(name = "retreat_booking_id", nullable = false)
    private Integer retreatBookingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retreat_booking_id", insertable = false, updatable = false)
    private RetreatBooking retreatBooking;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "meal_type", length = 50)
    private String mealType;

    @Column(name = "order_type", nullable = false, length = 20)
    private String orderType = "A_LA_CARTE"; // DAILY_MEAL, A_LA_CARTE

    @Column(name = "order_status", nullable = false, length = 20)
    private String orderStatus = "PENDING"; // PENDING, PREPARING, READY, DELIVERED, CANCELLED

    @Column(name = "special_notes", length = 1000)
    private String specialNotes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "mealOrder", cascade = CascadeType.ALL)
    private java.util.List<MealOrderItem> items = new java.util.ArrayList<>();

    public java.util.List<MealOrderItem> getItems() {
        return items;
    }

    public void setItems(java.util.List<MealOrderItem> items) {
        if (this.items == null) {
            this.items = new java.util.ArrayList<>();
        }
        this.items.clear();
        if (items != null) {
            for (MealOrderItem it : items) {
                addItem(it);
            }
        }
    }

    public void addItem(MealOrderItem item) {
        if (items == null) {
            items = new java.util.ArrayList<>();
        }
        items.add(item);
        item.setMealOrder(this);
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public MealOrderEntity() { }

    public MealOrderEntity(Integer retreatBookingId, LocalDate orderDate, String mealType,
                           FnbOrderType orderType, FnbOrderStatus orderStatus, LocalDateTime createdAt,
                           String specialNotes) {
        this.retreatBookingId = retreatBookingId;
        this.orderDate = orderDate;
        this.mealType = mealType;
        this.orderType = orderType != null ? orderType.name() : "A_LA_CARTE";
        this.orderStatus = orderStatus != null ? orderStatus.name() : "PENDING";
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.specialNotes = specialNotes;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Long getMealOrderId() { return id != null ? id.longValue() : null; }
    public void setMealOrderId(Long id) { this.id = id != null ? id.intValue() : null; }
    public void setMealOrderId(Integer id) { this.id = id; }

    public Integer getRetreatBookingId() { return retreatBookingId; }
    public void setRetreatBookingId(Integer retreatBookingId) { this.retreatBookingId = retreatBookingId; }

    public RetreatBooking getRetreatBooking() { return retreatBooking; }
    public void setRetreatBooking(RetreatBooking retreatBooking) {
        this.retreatBooking = retreatBooking;
        if (retreatBooking != null && retreatBooking.getRetreatBookingId() != null) {
            this.retreatBookingId = retreatBooking.getRetreatBookingId().intValue();
        }
    }

    public LocalDate getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDate orderDate) { this.orderDate = orderDate; }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }
    public FnbOrderType getOrderTypeValue() {
        try {
            return FnbOrderType.valueOf(orderType);
        } catch (Exception e) {
            return FnbOrderType.A_LA_CARTE;
        }
    }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
    public FnbOrderStatus getOrderStatusValue() {
        try {
            return FnbOrderStatus.valueOf(orderStatus);
        } catch (Exception e) {
            return FnbOrderStatus.PENDING;
        }
    }
    public void setOrderStatus(FnbOrderStatus orderStatus) {
        this.orderStatus = orderStatus != null ? orderStatus.name() : "PENDING";
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getSpecialNotes() { return specialNotes; }
    public void setSpecialNotes(String specialNotes) { this.specialNotes = specialNotes; }
}
