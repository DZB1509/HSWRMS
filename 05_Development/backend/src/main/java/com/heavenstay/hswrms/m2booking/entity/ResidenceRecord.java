package com.heavenstay.hswrms.m2booking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ResidenceRecord", schema = "dbo")
public class ResidenceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "residence_record_id")
    private Integer residenceRecordId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "retreat_booking_id", nullable = false, unique = true)
    private RetreatBooking retreatBooking;

    @Column(name = "identification_number", nullable = false, length = 100)
    private String identificationNumber;

    @Column(name = "identification_type", nullable = false, length = 50)
    private String identificationType;

    @Column(name = "nationality", length = 100)
    private String nationality;

    @Column(name = "permanent_address", length = 500)
    private String permanentAddress;

    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt = LocalDateTime.now();

    public ResidenceRecord() {
    }

    public Integer getResidenceRecordId() {
        return residenceRecordId;
    }

    public void setResidenceRecordId(Integer residenceRecordId) {
        this.residenceRecordId = residenceRecordId;
    }

    public RetreatBooking getRetreatBooking() {
        return retreatBooking;
    }

    public void setRetreatBooking(RetreatBooking retreatBooking) {
        this.retreatBooking = retreatBooking;
    }

    public String getIdentificationNumber() {
        return identificationNumber;
    }

    public void setIdentificationNumber(String identificationNumber) {
        this.identificationNumber = identificationNumber;
    }

    public String getIdentificationType() {
        return identificationType;
    }

    public void setIdentificationType(String identificationType) {
        this.identificationType = identificationType;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getPermanentAddress() {
        return permanentAddress;
    }

    public void setPermanentAddress(String permanentAddress) {
        this.permanentAddress = permanentAddress;
    }

    public LocalDateTime getCollectedAt() {
        return collectedAt;
    }

    public void setCollectedAt(LocalDateTime collectedAt) {
        this.collectedAt = collectedAt;
    }
}
