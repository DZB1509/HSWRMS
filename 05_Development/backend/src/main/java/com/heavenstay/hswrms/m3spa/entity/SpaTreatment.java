package com.heavenstay.hswrms.m3spa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "SpaTreatment")
public class SpaTreatment {

    public static final String ACTIVE = "ACTIVE";
    public static final String INACTIVE = "INACTIVE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "treatment_id")
    private Integer treatmentId;

    @Column(name = "treatment_name", nullable = false, unique = true, length = 150)
    private String treatmentName;

    @Column(name = "treatment_code", length = 50)
    private String treatmentCode;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(name = "base_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "room_compatibility", length = 250)
    private String roomCompatibility;

    @Column(name = "therapist_qualification", length = 250)
    private String therapistQualification;

    @Column(name = "contraindications", length = 500)
    private String contraindications;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "treatment_status", nullable = false, length = 20)
    private String treatmentStatus = ACTIVE;

    public SpaTreatment() {}

    public SpaTreatment(String treatmentName, int durationMinutes, BigDecimal basePrice, String treatmentStatus) {
        this.treatmentName = treatmentName;
        this.durationMinutes = durationMinutes;
        this.basePrice = basePrice;
        this.treatmentStatus = treatmentStatus != null ? treatmentStatus : ACTIVE;
    }

    public Integer getTreatmentId() { return treatmentId; }
    public String getTreatmentCode() { return treatmentCode; }
    public void setTreatmentCode(String treatmentCode) { this.treatmentCode = treatmentCode; }
    public String getTreatmentName() { return treatmentName; }
    public void setTreatmentName(String treatmentName) { this.treatmentName = treatmentName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
    public String getRoomCompatibility() { return roomCompatibility; }
    public void setRoomCompatibility(String roomCompatibility) { this.roomCompatibility = roomCompatibility; }
    public String getTherapistQualification() { return therapistQualification; }
    public void setTherapistQualification(String therapistQualification) { this.therapistQualification = therapistQualification; }
    public String getContraindications() { return contraindications; }
    public void setContraindications(String contraindications) { this.contraindications = contraindications; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTreatmentStatus() { return treatmentStatus; }
    public void setTreatmentStatus(String treatmentStatus) { this.treatmentStatus = treatmentStatus; }
}
