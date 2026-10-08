package com.heavenstay.hswrms.m3spa.dto.response;

import java.math.BigDecimal;

public class SpaTreatmentDto {
    private Integer treatmentId;
    private String treatmentName;
    private Integer durationMinutes;
    private BigDecimal basePrice;
    private String category;
    private String description;
    private boolean included;
    private String treatmentStatus;

    public SpaTreatmentDto() {
    }

    public SpaTreatmentDto(Integer treatmentId, String treatmentName, Integer durationMinutes,
                           BigDecimal basePrice, String category, String description,
                           boolean included, String treatmentStatus) {
        this.treatmentId = treatmentId;
        this.treatmentName = treatmentName;
        this.durationMinutes = durationMinutes;
        this.basePrice = basePrice;
        this.category = category;
        this.description = description;
        this.included = included;
        this.treatmentStatus = treatmentStatus;
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

    public boolean isIncluded() {
        return included;
    }

    public void setIncluded(boolean included) {
        this.included = included;
    }

    public String getTreatmentStatus() {
        return treatmentStatus;
    }

    public void setTreatmentStatus(String treatmentStatus) {
        this.treatmentStatus = treatmentStatus;
    }
}
