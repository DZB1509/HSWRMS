package com.heavenstay.hswrms.m2booking.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "PhysicalVilla")
public class PhysicalVillaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "villa_id")
    private Long villaId;

    @Column(name = "villa_category_id", nullable = false)
    private Long villaCategoryId;

    @Column(name = "villa_number", nullable = false, unique = true, length = 30)
    private String villaNumber;

    @Column(name = "floor", length = 30)
    private String floor;

    @Column(name = "villa_status", nullable = false, length = 30)
    private String villaStatus = "AVAILABLE"; // AVAILABLE, OCCUPIED, MAINTENANCE, NEEDS_CLEANING, INACTIVE

    public PhysicalVillaEntity() {}

    public PhysicalVillaEntity(Long villaId, Long villaCategoryId, String villaNumber, String villaStatus) {
        this.villaId = villaId;
        this.villaCategoryId = villaCategoryId;
        this.villaNumber = villaNumber;
        this.villaStatus = villaStatus;
    }

    public Long getVillaId() {
        return villaId;
    }

    public void setVillaId(Long villaId) {
        this.villaId = villaId;
    }

    public Long getVillaCategoryId() {
        return villaCategoryId;
    }

    public void setVillaCategoryId(Long villaCategoryId) {
        this.villaCategoryId = villaCategoryId;
    }

    public String getVillaNumber() {
        return villaNumber;
    }

    public void setVillaNumber(String villaNumber) {
        this.villaNumber = villaNumber;
    }

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public String getVillaStatus() {
        return villaStatus;
    }

    public void setVillaStatus(String villaStatus) {
        this.villaStatus = villaStatus;
    }
}
