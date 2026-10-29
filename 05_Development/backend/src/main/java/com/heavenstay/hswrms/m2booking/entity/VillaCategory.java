package com.heavenstay.hswrms.m2booking.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "VillaCategory", schema = "dbo")
public class VillaCategory {

    public static final String ACTIVE = "ACTIVE";
    public static final String INACTIVE = "INACTIVE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "villa_category_id")
    private Integer villaCategoryId;

    @Column(name = "category_name", nullable = false, length = 100)
    private String categoryName;

    @Column(name = "max_occupancy", nullable = false)
    private Integer maxOccupancy = 2;

    @Column(name = "price_modifier", nullable = false, precision = 18, scale = 2)
    private BigDecimal priceModifier = BigDecimal.ZERO;

    @Column(name = "category_status", nullable = false, length = 20)
    private String categoryStatus = ACTIVE;

    @Column(name = "inventory_count", nullable = false)
    private Integer inventoryCount = 0;

    @Column(name = "bedroom_count", nullable = false)
    private Integer bedroomCount = 1;

    @Column(name = "bedroom_description", length = 100)
    private String bedroomDescription;

    @Column(name = "area_description", length = 50)
    private String areaDescription;

    @Column(name = "has_private_pool", nullable = false)
    private Boolean hasPrivatePool = false;

    @Column(name = "pool_description", length = 100)
    private String poolDescription;

    @Column(name = "features_and_amenities", length = 500)
    private String featuresAndAmenities;

    @Column(name = "eligible_packages", length = 250)
    private String eligiblePackages;

    // Transient attributes for UI presentation without SQL Server physical column
    @Transient
    private BigDecimal basePrice = BigDecimal.valueOf(3500000);

    @Transient
    private String bedType = "1 Giường King";

    @Transient
    private Integer maxAdults = 2;

    @Transient
    private Integer maxChildren = 1;

    @Transient
    private String image;

    @Transient
    private String highlights;

    public VillaCategory() {
    }

    public VillaCategory(String categoryName, int maxOccupancy, BigDecimal priceModifier, String categoryStatus,
                         int inventoryCount, int bedroomCount, String bedroomDescription, String areaDescription,
                         boolean hasPrivatePool, String poolDescription, String featuresAndAmenities, String eligiblePackages) {
        this.categoryName = categoryName;
        this.maxOccupancy = maxOccupancy;
        this.priceModifier = priceModifier != null ? priceModifier : BigDecimal.ZERO;
        this.categoryStatus = categoryStatus != null ? categoryStatus : ACTIVE;
        this.inventoryCount = inventoryCount;
        this.bedroomCount = bedroomCount;
        this.bedroomDescription = bedroomDescription;
        this.areaDescription = areaDescription;
        this.hasPrivatePool = hasPrivatePool;
        this.poolDescription = poolDescription;
        this.featuresAndAmenities = featuresAndAmenities;
        this.eligiblePackages = eligiblePackages;
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

    public boolean isHasPrivatePool() {
        return hasPrivatePool != null && hasPrivatePool;
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

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public String getBedType() {
        return bedType;
    }

    public void setBedType(String bedType) {
        this.bedType = bedType;
    }

    public Integer getMaxAdults() {
        return maxAdults;
    }

    public void setMaxAdults(Integer maxAdults) {
        this.maxAdults = maxAdults;
    }

    public Integer getMaxChildren() {
        return maxChildren;
    }

    public void setMaxChildren(Integer maxChildren) {
        this.maxChildren = maxChildren;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getHighlights() {
        return highlights;
    }

    public void setHighlights(String highlights) {
        this.highlights = highlights;
    }
}
