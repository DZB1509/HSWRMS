package com.heavenstay.hswrms.m5billing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PostChargeRequestDTO {

    @NotNull(message = "retreatBookingId is mandatory")
    private Long retreatBookingId;

    @NotBlank(message = "chargeCategory is mandatory (PACKAGE, SPA, FNB)")
    private String chargeCategory;

    @NotBlank(message = "description is mandatory")
    private String description;

    @NotNull(message = "amount is mandatory")
    @DecimalMin(value = "0.0", inclusive = true, message = "amount must be >= 0")
    private BigDecimal amount;

    private Long sourceBookingId;
    private Long sourceSpaSessionId;
    private Long sourceMealOrderId;

    public PostChargeRequestDTO() {}

    public Long getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Long retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
    }

    public void setRetreatBookingId(Integer retreatBookingId) {
        this.retreatBookingId = retreatBookingId != null ? retreatBookingId.longValue() : null;
    }

    public String getChargeCategory() {
        return chargeCategory;
    }

    public void setChargeCategory(String chargeCategory) {
        this.chargeCategory = chargeCategory;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Long getSourceBookingId() {
        return sourceBookingId;
    }

    public void setSourceBookingId(Long sourceBookingId) {
        this.sourceBookingId = sourceBookingId;
    }

    public void setSourceBookingId(Integer sourceBookingId) {
        this.sourceBookingId = sourceBookingId != null ? sourceBookingId.longValue() : null;
    }

    public Long getSourceSpaSessionId() {
        return sourceSpaSessionId;
    }

    public void setSourceSpaSessionId(Long sourceSpaSessionId) {
        this.sourceSpaSessionId = sourceSpaSessionId;
    }

    public Long getSourceMealOrderId() {
        return sourceMealOrderId;
    }

    public void setSourceMealOrderId(Long sourceMealOrderId) {
        this.sourceMealOrderId = sourceMealOrderId;
    }
}
