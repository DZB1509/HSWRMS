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

    @Column(name = "treatment_code", length = 50)
    private String treatmentCode;

    @Column(name = "treatment_name", nullable = false, length = 150)
    private String treatmentName;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "base_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "pricing_rule", length = 500)
    private String pricingRule;

    @Column(name = "room_compatibility", length = 250)
    private String roomCompatibility;

    @Column(name = "required_qualification_code", length = 100)
    private String requiredQualificationCode;

    @Column(name = "description", length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "treatment_status", nullable = false, length = 20)
    private TreatmentStatus treatmentStatus = TreatmentStatus.ACTIVE;

    // Transient attributes for UI presentation without SQL Server physical column
    @Transient
    private String therapistQualification;

    @Transient
    private String contraindications;

    @Transient
    private String precautions;

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

    public SpaTreatment(String treatmentCode, String treatmentName, Integer durationMinutes, BigDecimal basePrice, String category, String description) {
        this.treatmentCode = treatmentCode;
        this.treatmentName = treatmentName;
        this.durationMinutes = durationMinutes;
        this.basePrice = basePrice;
        this.category = category;
        this.description = description;
        this.treatmentStatus = TreatmentStatus.ACTIVE;
    }

    public SpaTreatment(String treatmentName, int durationMinutes, BigDecimal basePrice, TreatmentStatus treatmentStatus) {
        this.treatmentName = treatmentName;
        this.durationMinutes = durationMinutes;
        this.basePrice = basePrice;
        this.treatmentStatus = treatmentStatus != null ? treatmentStatus : TreatmentStatus.ACTIVE;
    }

    public SpaTreatment(String treatmentName, int durationMinutes, BigDecimal basePrice, String treatmentStatus) {
        this(treatmentName, durationMinutes, basePrice, TreatmentStatus.from(treatmentStatus));
    }

    public String getTreatmentCode() {
        return treatmentCode;
    }

    public void setTreatmentCode(String treatmentCode) {
        this.treatmentCode = treatmentCode;
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

    public String getPricingRule() {
        return pricingRule;
    }

    public void setPricingRule(String pricingRule) {
        this.pricingRule = pricingRule;
    }

    public String getRoomCompatibility() {
        return roomCompatibility;
    }

    public void setRoomCompatibility(String roomCompatibility) {
        this.roomCompatibility = roomCompatibility;
    }

    public String getRequiredQualificationCode() {
        return requiredQualificationCode;
    }

    public void setRequiredQualificationCode(String requiredQualificationCode) {
        this.requiredQualificationCode = requiredQualificationCode;
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

    public void setTreatmentStatus(String statusStr) {
        this.treatmentStatus = TreatmentStatus.from(statusStr);
    }

    public String getTherapistQualification() {
        return therapistQualification;
    }

    public void setTherapistQualification(String therapistQualification) {
        this.therapistQualification = therapistQualification;
    }

    public String getContraindications() {
        return contraindications;
    }

    public void setContraindications(String contraindications) {
        this.contraindications = contraindications;
    }

    public String getPrecautions() {
        return precautions;
    }

    public void setPrecautions(String precautions) {
        this.precautions = precautions;
    }
}
