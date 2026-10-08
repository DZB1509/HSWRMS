package com.heavenstay.hswrms.m3spa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class TreatmentRoomCompatibilityId implements Serializable {

    @Column(name = "room_id")
    private Integer roomId;

    @Column(name = "treatment_id")
    private Integer treatmentId;

    public TreatmentRoomCompatibilityId() {
    }

    public TreatmentRoomCompatibilityId(Integer roomId, Integer treatmentId) {
        this.roomId = roomId;
        this.treatmentId = treatmentId;
    }

    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
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
        TreatmentRoomCompatibilityId that = (TreatmentRoomCompatibilityId) o;
        return Objects.equals(roomId, that.roomId) && Objects.equals(treatmentId, that.treatmentId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(roomId, treatmentId);
    }
}
