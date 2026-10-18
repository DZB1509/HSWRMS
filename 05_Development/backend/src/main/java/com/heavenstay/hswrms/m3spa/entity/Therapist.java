package com.heavenstay.hswrms.m3spa.entity;

import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "Therapist", schema = "dbo")
public class Therapist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "therapist_id")
    private Integer therapistId;

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "therapist_status", nullable = false, length = 20)
    private TherapistStatus therapistStatus = TherapistStatus.ACTIVE;

    @Transient
    private String displayName;

    public Therapist() {
    }

    public Therapist(Integer userId, TherapistStatus therapistStatus) {
        this.userId = userId;
        this.therapistStatus = therapistStatus;
    }

    public Integer getTherapistId() {
        return therapistId;
    }

    public void setTherapistId(Integer therapistId) {
        this.therapistId = therapistId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public TherapistStatus getTherapistStatus() {
        return therapistStatus;
    }

    public void setTherapistStatus(TherapistStatus therapistStatus) {
        this.therapistStatus = therapistStatus;
    }

    public String getDisplayName() {
        return displayName != null ? displayName : "Therapist #" + therapistId;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
}
