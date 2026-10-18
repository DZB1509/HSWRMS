package com.heavenstay.hswrms.m2booking.dto;

import java.math.BigDecimal;

public class PhysicalVillaResponse {

    private Integer villaId;
    private Integer villaCategoryId;
    private String categoryName;
    private String villaNumber;
    private String floor;
    private String villaStatus;
    private String zoneName;
    private String bedroomInfo;
    private Integer maxOccupancy;
    private BigDecimal areaSqm;
    private Boolean hasPrivatePool;
    private String poolInfo;
    private String viewAndOperationalNotes;

    public PhysicalVillaResponse() {
    }

    public Integer getVillaId() {
        return villaId;
    }

    public void setVillaId(Integer villaId) {
        this.villaId = villaId;
    }

    public Integer getVillaCategoryId() {
        return villaCategoryId;
    }

    public void setVillaCategoryId(Integer villaCategoryId) {
        this.villaCategoryId = villaCategoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
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
