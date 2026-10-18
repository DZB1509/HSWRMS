package com.heavenstay.hswrms.m3spa.entity;

import com.heavenstay.hswrms.m1identity.entity.UserEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "Therapist")
public class TherapistEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "therapist_id")
    private Long therapistId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "therapist_status", nullable = false, length = 20)
    private String therapistStatus = "ACTIVE"; // ACTIVE, INACTIVE, SUSPENDED

    public TherapistEntity() {}

    public Long getTherapistId() {
        return therapistId;
    }

    public void setTherapistId(Long therapistId) {
        this.therapistId = therapistId;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public String getTherapistStatus() {
        return therapistStatus;
    }

    public void setTherapistStatus(String therapistStatus) {
        this.therapistStatus = therapistStatus;
    }
}
