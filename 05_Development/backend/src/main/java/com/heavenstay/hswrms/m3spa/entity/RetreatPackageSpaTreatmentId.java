package com.heavenstay.hswrms.m3spa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class RetreatPackageSpaTreatmentId implements Serializable {

    @Column(name = "retreat_package_id")
    private Integer retreatPackageId;

    @Column(name = "treatment_id")
    private Integer treatmentId;

    public RetreatPackageSpaTreatmentId() {}

    public RetreatPackageSpaTreatmentId(Integer retreatPackageId, Integer treatmentId) {
        this.retreatPackageId = retreatPackageId;
        this.treatmentId = treatmentId;
    }

    public Integer getRetreatPackageId() { return retreatPackageId; }
    public void setRetreatPackageId(Integer retreatPackageId) { this.retreatPackageId = retreatPackageId; }
    public Integer getTreatmentId() { return treatmentId; }
    public void setTreatmentId(Integer treatmentId) { this.treatmentId = treatmentId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RetreatPackageSpaTreatmentId that)) return false;
        return Objects.equals(retreatPackageId, that.retreatPackageId) &&
                Objects.equals(treatmentId, that.treatmentId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(retreatPackageId, treatmentId);
    }
}
