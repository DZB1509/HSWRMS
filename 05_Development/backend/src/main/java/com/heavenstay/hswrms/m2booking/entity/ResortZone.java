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
@Table(name = "ResortZone")
public class ResortZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "zone_id")
    private Integer zoneId;

    @Column(name = "zone_name", nullable = false, unique = true, length = 100)
    private String zoneName;

    @Column(name = "landscape_description", length = 500)
    private String landscapeDescription;

    @Column(name = "villa_count", nullable = false)
    private int villaCount;

    @Column(name = "villa_category_name", length = 120)
    private String villaCategoryName;

    @Column(name = "relative_price_tier", length = 50)
    private String relativePriceTier;

    @Column(name = "operational_advantages", length = 500)
    private String operationalAdvantages;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);

    public ResortZone() {}

    public ResortZone(String zoneName, String landscapeDescription, int villaCount,
                      String villaCategoryName, String relativePriceTier, String operationalAdvantages) {
        this.zoneName = zoneName;
        this.landscapeDescription = landscapeDescription;
        this.villaCount = villaCount;
        this.villaCategoryName = villaCategoryName;
        this.relativePriceTier = relativePriceTier;
        this.operationalAdvantages = operationalAdvantages;
        this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public Integer getZoneId() { return zoneId; }
    public String getZoneName() { return zoneName; }
    public void setZoneName(String zoneName) { this.zoneName = zoneName; }
    public String getLandscapeDescription() { return landscapeDescription; }
    public void setLandscapeDescription(String landscapeDescription) { this.landscapeDescription = landscapeDescription; }
    public int getVillaCount() { return villaCount; }
    public void setVillaCount(int villaCount) { this.villaCount = villaCount; }
    public String getVillaCategoryName() { return villaCategoryName; }
    public void setVillaCategoryName(String villaCategoryName) { this.villaCategoryName = villaCategoryName; }
    public String getRelativePriceTier() { return relativePriceTier; }
    public void setRelativePriceTier(String relativePriceTier) { this.relativePriceTier = relativePriceTier; }
    public String getOperationalAdvantages() { return operationalAdvantages; }
    public void setOperationalAdvantages(String operationalAdvantages) { this.operationalAdvantages = operationalAdvantages; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
