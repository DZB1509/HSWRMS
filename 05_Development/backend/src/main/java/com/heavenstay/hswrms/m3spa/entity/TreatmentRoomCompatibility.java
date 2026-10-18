package com.heavenstay.hswrms.m3spa.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "TreatmentRoomCompatibility", schema = "dbo")
public class TreatmentRoomCompatibility {

    @EmbeddedId
    private TreatmentRoomCompatibilityId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("roomId")
    @JoinColumn(name = "room_id", nullable = false)
    private TreatmentRoom treatmentRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("treatmentId")
    @JoinColumn(name = "treatment_id", nullable = false)
    private SpaTreatment treatment;

    public TreatmentRoomCompatibility() {
    }

    public TreatmentRoomCompatibility(TreatmentRoom treatmentRoom, SpaTreatment treatment) {
        this.treatmentRoom = treatmentRoom;
        this.treatment = treatment;
        this.id = new TreatmentRoomCompatibilityId(treatmentRoom.getRoomId(), treatment.getTreatmentId());
    }

    public TreatmentRoomCompatibilityId getId() {
        return id;
    }

    public void setId(TreatmentRoomCompatibilityId id) {
        this.id = id;
    }

    public TreatmentRoom getTreatmentRoom() {
        return treatmentRoom;
    }

    public void setTreatmentRoom(TreatmentRoom treatmentRoom) {
        this.treatmentRoom = treatmentRoom;
    }

    public SpaTreatment getTreatment() {
        return treatment;
    }

    public void setTreatment(SpaTreatment treatment) {
        this.treatment = treatment;
    }
}
