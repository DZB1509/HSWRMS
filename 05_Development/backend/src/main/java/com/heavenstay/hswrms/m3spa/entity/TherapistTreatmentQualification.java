package com.heavenstay.hswrms.m3spa.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "TherapistTreatmentQualification", schema = "dbo")
public class TherapistTreatmentQualification {

    @EmbeddedId
    private TherapistTreatmentQualificationId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("therapistId")
    @JoinColumn(name = "therapist_id", nullable = false)
    private Therapist therapist;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("treatmentId")
    @JoinColumn(name = "treatment_id", nullable = false)
    private SpaTreatment treatment;

    public TherapistTreatmentQualification() {
    }

    public TherapistTreatmentQualification(Therapist therapist, SpaTreatment treatment) {
        this.therapist = therapist;
        this.treatment = treatment;
        this.id = new TherapistTreatmentQualificationId(therapist.getTherapistId(), treatment.getTreatmentId());
    }

    public TherapistTreatmentQualificationId getId() {
        return id;
    }

    public void setId(TherapistTreatmentQualificationId id) {
        this.id = id;
    }

    public Therapist getTherapist() {
        return therapist;
    }

    public void setTherapist(Therapist therapist) {
        this.therapist = therapist;
    }

    public SpaTreatment getTreatment() {
        return treatment;
    }

    public void setTreatment(SpaTreatment treatment) {
        this.treatment = treatment;
    }
}
