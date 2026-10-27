package com.heavenstay.hswrms.m2booking.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "PhysicalVilla", schema = "dbo")
public class PhysicalVilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "villa_id")
    private Integer villaId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "villa_category_id", nullable = false)
    private VillaCategory villaCategory;

    @Column(name = "villa_number", nullable = false, unique = true, length = 30)
    private String villaNumber;

    @Column(name = "floor", length = 30)
    private String floor;

    @Column(name = "villa_status", nullable = false, length = 30)
    private String villaStatus = "AVAILABLE";

    @Column(name = "zone_name", length = 100)
    private String zoneName;

    @Column(name = "bedroom_info", length = 100)
    private String bedroomInfo;

    @Column(name = "max_occupancy", nullable = false)
    private Integer maxOccupancy = 3;

    @Column(name = "area_sqm", precision = 10, scale = 2)
    private BigDecimal areaSqm;

    @Column(name = "has_private_pool", nullable = false)
    private Boolean hasPrivatePool = false;

    @Column(name = "pool_info", length = 100)
    private String poolInfo;

    @Column(name = "view_and_operational_notes", length = 500)
    private String viewAndOperationalNotes;

    public PhysicalVilla() {
    }

    public Integer getVillaId() {
        return villaId;
    }

    public void setVillaId(Integer villaId) {
        this.villaId = villaId;
    }

    public VillaCategory getVillaCategory() {
        return villaCategory;
    }

    public void setVillaCategory(VillaCategory villaCategory) {
        this.villaCategory = villaCategory;
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

    public String getZoneName() {
        return zoneName;
    }

    public void setZoneName(String zoneName) {
        this.zoneName = zoneName;
    }

    public String getBedroomInfo() {
        return bedroomInfo;
    }

    public void setBedroomInfo(String bedroomInfo) {
        this.bedroomInfo = bedroomInfo;
    }

    public Integer getMaxOccupancy() {
        return maxOccupancy;
    }

    public void setMaxOccupancy(Integer maxOccupancy) {
        this.maxOccupancy = maxOccupancy;
    }

    public BigDecimal getAreaSqm() {
        return areaSqm;
    }

    public void setAreaSqm(BigDecimal areaSqm) {
        this.areaSqm = areaSqm;
    }

    public Boolean getHasPrivatePool() {
        return hasPrivatePool;
    }

    public void setHasPrivatePool(Boolean hasPrivatePool) {
        this.hasPrivatePool = hasPrivatePool;
    }

    public String getPoolInfo() {
        return poolInfo;
    }

    public void setPoolInfo(String poolInfo) {
        this.poolInfo = poolInfo;
    }

    public String getViewAndOperationalNotes() {
        return viewAndOperationalNotes;
    }

    public void setViewAndOperationalNotes(String viewAndOperationalNotes) {
        this.viewAndOperationalNotes = viewAndOperationalNotes;
    }
}
