package com.heavenstay.hswrms.m3spa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "RetreatPackageSpaTreatment")
public class RetreatPackageSpaTreatment {

    @EmbeddedId
    private RetreatPackageSpaTreatmentId id = new RetreatPackageSpaTreatmentId();

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("retreatPackageId")
    @JoinColumn(name = "retreat_package_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private RetreatPackage retreatPackage;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("treatmentId")
    @JoinColumn(name = "treatment_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private SpaTreatment spaTreatment;

    @Column(name = "included_sessions", nullable = false)
    private Integer includedSessions = 1;

    @Column(name = "entitlement_status", nullable = false, length = 50)
    private String entitlementStatus = "INCLUDED";

    @Column(name = "notes", length = 500)
    private String notes;

    public RetreatPackageSpaTreatment() {}

    public RetreatPackageSpaTreatment(RetreatPackage retreatPackage, SpaTreatment spaTreatment, Integer includedSessions, String entitlementStatus, String notes) {
        this.retreatPackage = retreatPackage;
        this.spaTreatment = spaTreatment;
        if (retreatPackage != null && spaTreatment != null) {
            this.id = new RetreatPackageSpaTreatmentId(retreatPackage.getRetreatPackageId(), spaTreatment.getTreatmentId());
        }
        this.includedSessions = includedSessions != null ? includedSessions : 1;
        this.entitlementStatus = entitlementStatus != null ? entitlementStatus : "INCLUDED";
        this.notes = notes;
    }

    public RetreatPackageSpaTreatmentId getId() { return id; }
    public void setId(RetreatPackageSpaTreatmentId id) { this.id = id; }
    public RetreatPackage getRetreatPackage() { return retreatPackage; }
    public void setRetreatPackage(RetreatPackage retreatPackage) {
        this.retreatPackage = retreatPackage;
        if (retreatPackage != null && this.id != null) {
            this.id.setRetreatPackageId(retreatPackage.getRetreatPackageId());
        }
    }
    public SpaTreatment getSpaTreatment() { return spaTreatment; }
    public void setSpaTreatment(SpaTreatment spaTreatment) {
        this.spaTreatment = spaTreatment;
        if (spaTreatment != null && this.id != null) {
            this.id.setTreatmentId(spaTreatment.getTreatmentId());
        }
    }
    public Integer getIncludedSessions() { return includedSessions; }
    public void setIncludedSessions(Integer includedSessions) { this.includedSessions = includedSessions; }
    public String getEntitlementStatus() { return entitlementStatus; }
    public void setEntitlementStatus(String entitlementStatus) { this.entitlementStatus = entitlementStatus; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
