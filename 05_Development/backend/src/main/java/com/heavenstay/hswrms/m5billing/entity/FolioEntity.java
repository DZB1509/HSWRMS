package com.heavenstay.hswrms.m5billing.entity;

import com.heavenstay.hswrms.m2booking.entity.RetreatBookingEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Folio")
public class FolioEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "folio_id")
    private Long folioId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retreat_booking_id", nullable = false, unique = true)
    private RetreatBookingEntity retreatBooking;

    @Column(name = "total_charges", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalCharges = BigDecimal.ZERO;

    @Column(name = "total_paid", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalPaid = BigDecimal.ZERO;

    @Column(name = "balance_due", insertable = false, updatable = false)
    private BigDecimal balanceDue;

    @Column(name = "folio_status", nullable = false, length = 20)
    private String folioStatus = "OPEN"; // OPEN, PARTIALLY_PAID, PAID, CLOSED

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @OneToMany(mappedBy = "folio", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FolioItemEntity> items = new ArrayList<>();

    public FolioEntity() {}

    public FolioEntity(RetreatBookingEntity retreatBooking) {
        this.retreatBooking = retreatBooking;
        this.totalCharges = BigDecimal.ZERO;
        this.totalPaid = BigDecimal.ZERO;
        this.folioStatus = "OPEN";
    }

    public void addItem(FolioItemEntity item) {
        items.add(item);
        item.setFolio(this);
        recalculateTotals();
    }

    public void recalculateTotals() {
        BigDecimal sum = BigDecimal.ZERO;
        for (FolioItemEntity item : items) {
            if (item.getAmount() != null) {
                sum = sum.add(item.getAmount());
            }
        }
        this.totalCharges = sum;
    }

    public Long getFolioId() {
        return folioId;
    }

    public void setFolioId(Long folioId) {
        this.folioId = folioId;
    }

    public RetreatBookingEntity getRetreatBooking() {
        return retreatBooking;
    }

    public void setRetreatBooking(RetreatBookingEntity retreatBooking) {
        this.retreatBooking = retreatBooking;
    }

    public BigDecimal getTotalCharges() {
        return totalCharges != null ? totalCharges : BigDecimal.ZERO;
    }

    public void setTotalCharges(BigDecimal totalCharges) {
        this.totalCharges = totalCharges;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid != null ? totalPaid : BigDecimal.ZERO;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getBalanceDue() {
        if (balanceDue != null) {
            return balanceDue;
        }
        BigDecimal charges = getTotalCharges();
        BigDecimal paid = getTotalPaid();
        return charges.subtract(paid);
    }

    public void setBalanceDue(BigDecimal balanceDue) {
        this.balanceDue = balanceDue;
    }

    public String getFolioStatus() {
        return folioStatus;
    }

    public void setFolioStatus(String folioStatus) {
        this.folioStatus = folioStatus;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }

    public List<FolioItemEntity> getItems() {
        return items;
    }

    public void setItems(List<FolioItemEntity> items) {
        this.items = items;
    }
}
