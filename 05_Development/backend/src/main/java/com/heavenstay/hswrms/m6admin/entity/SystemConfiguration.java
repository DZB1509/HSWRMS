package com.heavenstay.hswrms.m6admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** Business parameter row (configuration_type = BUSINESS_PARAMETER). Feature flags are not supported. */
@Entity
@Table(name = "\"SystemConfiguration\"", schema = "dbo")
public class SystemConfiguration {

    public static final String TYPE_BUSINESS_PARAMETER = "BUSINESS_PARAMETER";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "configuration_id")
    private Integer configurationId;

    @Column(name = "configuration_type", nullable = false, length = 50)
    private String configurationType = TYPE_BUSINESS_PARAMETER;

    @Column(name = "configuration_key", nullable = false, unique = true, length = 120)
    private String configurationKey;

    @Column(name = "configuration_value", length = 1000)
    private String configurationValue;

    @Column(name = "configuration_status", nullable = false, length = 20)
    private String configurationStatus = "ACTIVE";

    @Column(name = "updated_by_user_id")
    private Integer updatedByUserId;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /** M6 migration columns (validation metadata). */
    @Column(name = "value_type", nullable = false, length = 20)
    private String valueType = "INT";

    @Column(name = "min_value", precision = 18, scale = 4)
    private BigDecimal minValue;

    @Column(name = "max_value", precision = 18, scale = 4)
    private BigDecimal maxValue;

    @Column(name = "unit", length = 40)
    private String unit;

    @Column(name = "description", length = 500)
    private String description;

    /** Whether a Manager holding a valid delegation may edit this parameter ("only listed parameters"). */
    @Column(name = "manager_editable", nullable = false)
    private boolean managerEditable;

    protected SystemConfiguration() {
    }

    public SystemConfiguration(String key, String value, String valueType, BigDecimal min, BigDecimal max,
                               String unit, String description, boolean managerEditable) {
        this.configurationKey = key;
        this.configurationValue = value;
        this.valueType = valueType;
        this.minValue = min;
        this.maxValue = max;
        this.unit = unit;
        this.description = description;
        this.managerEditable = managerEditable;
        this.updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    @PrePersist
    void onCreate() {
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now(ZoneOffset.UTC);
        }
    }

    public void update(String newValue, Integer userId) {
        this.configurationValue = newValue;
        this.updatedByUserId = userId;
        this.updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public Integer getConfigurationId() { return configurationId; }
    public String getConfigurationType() { return configurationType; }
    public String getConfigurationKey() { return configurationKey; }
    public String getConfigurationValue() { return configurationValue; }
    public String getConfigurationStatus() { return configurationStatus; }
    public Integer getUpdatedByUserId() { return updatedByUserId; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getValueType() { return valueType; }
    public BigDecimal getMinValue() { return minValue; }
    public BigDecimal getMaxValue() { return maxValue; }
    public String getUnit() { return unit; }
    public String getDescription() { return description; }
    public boolean isManagerEditable() { return managerEditable; }
}
