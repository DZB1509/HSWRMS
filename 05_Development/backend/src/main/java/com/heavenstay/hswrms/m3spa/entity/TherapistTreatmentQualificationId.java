package com.heavenstay.hswrms.m3spa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class TherapistTreatmentQualificationId implements Serializable {

    @Column(name = "therapist_id")
    private Integer therapistId;

    @Column(name = "treatment_id")
    private Integer treatmentId;

    public TherapistTreatmentQualificationId() {
    }

    public TherapistTreatmentQualificationId(Integer therapistId, Integer treatmentId) {
        this.therapistId = therapistId;
        this.treatmentId = treatmentId;
    }

    public Integer getTherapistId() {
        return therapistId;
    }

    public void setTherapistId(Integer therapistId) {
        this.therapistId = therapistId;
    }

    public Integer getTreatmentId() {
        return treatmentId;
    }

    public void setTreatmentId(Integer treatmentId) {
        this.treatmentId = treatmentId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TherapistTreatmentQualificationId that = (TherapistTreatmentQualificationId) o;
        return Objects.equals(therapistId, that.therapistId) && Objects.equals(treatmentId, that.treatmentId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(therapistId, treatmentId);
    }
}
