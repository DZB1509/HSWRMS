package com.heavenstay.hswrms.m2booking.dto;

import java.math.BigDecimal;

public class VillaCategoryResponse {

    private Integer villaCategoryId;
    private String categoryName;
    private Integer maxOccupancy;
    private BigDecimal priceModifier;
    private String categoryStatus;
    private Integer inventoryCount;
    private Integer bedroomCount;
    private String bedroomDescription;
    private String areaDescription;
    private Boolean hasPrivatePool;
    private String poolDescription;
    private String featuresAndAmenities;
    private String eligiblePackages;

    public VillaCategoryResponse() {
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

    public Integer getMaxOccupancy() {
        return maxOccupancy;
    }

    public void setMaxOccupancy(Integer maxOccupancy) {
        this.maxOccupancy = maxOccupancy;
    }

    public BigDecimal getPriceModifier() {
        return priceModifier;
    }

    public void setPriceModifier(BigDecimal priceModifier) {
        this.priceModifier = priceModifier;
    }

    public String getCategoryStatus() {
        return categoryStatus;
    }

    public void setCategoryStatus(String categoryStatus) {
        this.categoryStatus = categoryStatus;
    }

    public Integer getInventoryCount() {
        return inventoryCount;
    }

    public void setInventoryCount(Integer inventoryCount) {
        this.inventoryCount = inventoryCount;
    }

    public Integer getBedroomCount() {
        return bedroomCount;
    }

    public void setBedroomCount(Integer bedroomCount) {
        this.bedroomCount = bedroomCount;
    }

    public String getBedroomDescription() {
        return bedroomDescription;
    }

    public void setBedroomDescription(String bedroomDescription) {
        this.bedroomDescription = bedroomDescription;
    }

    public String getAreaDescription() {
        return areaDescription;
    }

    public void setAreaDescription(String areaDescription) {
        this.areaDescription = areaDescription;
    }

    public Boolean getHasPrivatePool() {
        return hasPrivatePool;
    }

    public void setHasPrivatePool(Boolean hasPrivatePool) {
        this.hasPrivatePool = hasPrivatePool;
    }

    public String getPoolDescription() {
        return poolDescription;
    }

    public void setPoolDescription(String poolDescription) {
        this.poolDescription = poolDescription;
    }

    public String getFeaturesAndAmenities() {
        return featuresAndAmenities;
    }

    public void setFeaturesAndAmenities(String featuresAndAmenities) {
        this.featuresAndAmenities = featuresAndAmenities;
    }

    public String getEligiblePackages() {
        return eligiblePackages;
    }

    public void setEligiblePackages(String eligiblePackages) {
        this.eligiblePackages = eligiblePackages;
    }
}
