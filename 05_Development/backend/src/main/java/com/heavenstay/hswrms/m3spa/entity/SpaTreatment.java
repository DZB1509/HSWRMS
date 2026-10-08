package com.heavenstay.hswrms.m3spa.entity;

import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "SpaTreatment", schema = "dbo")
public class SpaTreatment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "treatment_id")
    private Integer treatmentId;

    @Column(name = "treatment_name", nullable = false, length = 150)
    private String treatmentName;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "base_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "description", length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "treatment_status", nullable = false, length = 20)
    private TreatmentStatus treatmentStatus = TreatmentStatus.ACTIVE;

    public SpaTreatment() {
    }

    public SpaTreatment(String treatmentName, Integer durationMinutes, BigDecimal basePrice, String category, String description) {
        this.treatmentName = treatmentName;
        this.durationMinutes = durationMinutes;
        this.basePrice = basePrice;
        this.category = category;
        this.description = description;
        this.treatmentStatus = TreatmentStatus.ACTIVE;
    }

    public Integer getTreatmentId() {
        return treatmentId;
    }

    public void setTreatmentId(Integer treatmentId) {
        this.treatmentId = treatmentId;
    }

    public String getTreatmentName() {
        return treatmentName;
    }

    public void setTreatmentName(String treatmentName) {
        this.treatmentName = treatmentName;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TreatmentStatus getTreatmentStatus() {
        return treatmentStatus;
    }

    public void setTreatmentStatus(TreatmentStatus treatmentStatus) {
        this.treatmentStatus = treatmentStatus;
    }
}
