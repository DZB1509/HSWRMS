package com.heavenstay.hswrms.m2booking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "VillaFunctionalArea")
public class VillaFunctionalArea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "functional_area_id")
    private Integer functionalAreaId;

    @Column(name = "space_group", nullable = false, length = 100)
    private String spaceGroup;

    @Column(name = "room_name", nullable = false, unique = true, length = 150)
    private String roomName;

    @Column(name = "area_range_sqm", length = 50)
    private String areaRangeSqm;

    @Column(name = "quantity_in_1br", length = 50)
    private String quantityIn1Br;

    @Column(name = "quantity_in_2_3br", length = 50)
    private String quantityIn23Br;

    @Column(name = "quantity_in_estate_4_6br", length = 50)
    private String quantityInEstate46Br;

    @Column(name = "key_furnishing", length = 500)
    private String keyFurnishing;

    @Column(name = "operational_purpose", length = 500)
    private String operationalPurpose;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);

    public VillaFunctionalArea() {}

    public VillaFunctionalArea(String spaceGroup, String roomName, String areaRangeSqm, String quantityIn1Br,
                                String quantityIn23Br, String quantityInEstate46Br, String keyFurnishing, String operationalPurpose) {
        this.spaceGroup = spaceGroup;
        this.roomName = roomName;
        this.areaRangeSqm = areaRangeSqm;
        this.quantityIn1Br = quantityIn1Br;
        this.quantityIn23Br = quantityIn23Br;
        this.quantityInEstate46Br = quantityInEstate46Br;
        this.keyFurnishing = keyFurnishing;
        this.operationalPurpose = operationalPurpose;
        this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public Integer getFunctionalAreaId() { return functionalAreaId; }
    public String getSpaceGroup() { return spaceGroup; }
    public void setSpaceGroup(String spaceGroup) { this.spaceGroup = spaceGroup; }
    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
    public String getAreaRangeSqm() { return areaRangeSqm; }
    public void setAreaRangeSqm(String areaRangeSqm) { this.areaRangeSqm = areaRangeSqm; }
    public String getQuantityIn1Br() { return quantityIn1Br; }
    public void setQuantityIn1Br(String quantityIn1Br) { this.quantityIn1Br = quantityIn1Br; }
    public String getQuantityIn23Br() { return quantityIn23Br; }
    public void setQuantityIn23Br(String quantityIn23Br) { this.quantityIn23Br = quantityIn23Br; }
    public String getQuantityInEstate46Br() { return quantityInEstate46Br; }
    public void setQuantityInEstate46Br(String quantityInEstate46Br) { this.quantityInEstate46Br = quantityInEstate46Br; }
    public String getKeyFurnishing() { return keyFurnishing; }
    public void setKeyFurnishing(String keyFurnishing) { this.keyFurnishing = keyFurnishing; }
    public String getOperationalPurpose() { return operationalPurpose; }
    public void setOperationalPurpose(String operationalPurpose) { this.operationalPurpose = operationalPurpose; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
