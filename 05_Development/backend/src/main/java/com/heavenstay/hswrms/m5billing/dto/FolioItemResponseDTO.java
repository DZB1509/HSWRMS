package com.heavenstay.hswrms.m5billing.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FolioItemResponseDTO {

    private Long folioItemId;
    private Long folioId;
    private String chargeCategory;
    private String description;
    private BigDecimal amount;
    private LocalDateTime chargedAt;
    private Long sourceBookingId;
    private Long sourceSpaSessionId;
    private Long sourceMealOrderId;
    private Boolean isVoided = Boolean.FALSE;
    private Long voidedAdjustmentRequestId;

    public FolioItemResponseDTO() {}

    public FolioItemResponseDTO(Long folioItemId, Long folioId, String chargeCategory,
                                String description, BigDecimal amount, LocalDateTime chargedAt,
                                Long sourceBookingId, Long sourceSpaSessionId, Long sourceMealOrderId) {
        this.folioItemId = folioItemId;
        this.folioId = folioId;
        this.chargeCategory = chargeCategory;
        this.description = description;
        this.amount = amount;
        this.chargedAt = chargedAt;
        this.sourceBookingId = sourceBookingId;
        this.sourceSpaSessionId = sourceSpaSessionId;
        this.sourceMealOrderId = sourceMealOrderId;
        this.isVoided = Boolean.FALSE;
    }

    public FolioItemResponseDTO(Long folioItemId, Long folioId, String chargeCategory,
                                String description, BigDecimal amount, LocalDateTime chargedAt,
                                Long sourceBookingId, Long sourceSpaSessionId, Long sourceMealOrderId,
                                Boolean isVoided, Long voidedAdjustmentRequestId) {
        this(folioItemId, folioId, chargeCategory, description, amount, chargedAt,
             sourceBookingId, sourceSpaSessionId, sourceMealOrderId);
        this.isVoided = isVoided != null ? isVoided : Boolean.FALSE;
        this.voidedAdjustmentRequestId = voidedAdjustmentRequestId;
    }

    public Long getFolioItemId() {
        return folioItemId;
    }

    public void setFolioItemId(Long folioItemId) {
        this.folioItemId = folioItemId;
    }

    public Long getFolioId() {
        return folioId;
    }

    public void setFolioId(Long folioId) {
        this.folioId = folioId;
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

    public LocalDateTime getChargedAt() {
        return chargedAt;
    }

    public void setChargedAt(LocalDateTime chargedAt) {
        this.chargedAt = chargedAt;
    }

    public Long getSourceBookingId() {
        return sourceBookingId;
    }

    public void setSourceBookingId(Long sourceBookingId) {
        this.sourceBookingId = sourceBookingId;
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

    public Boolean getIsVoided() {
        return isVoided != null ? isVoided : Boolean.FALSE;
    }

    public boolean isVoided() {
        return Boolean.TRUE.equals(this.isVoided);
    }

    public void setIsVoided(Boolean isVoided) {
        this.isVoided = isVoided != null ? isVoided : Boolean.FALSE;
    }

    public Long getVoidedAdjustmentRequestId() {
        return voidedAdjustmentRequestId;
    }

    public void setVoidedAdjustmentRequestId(Long voidedAdjustmentRequestId) {
        this.voidedAdjustmentRequestId = voidedAdjustmentRequestId;
    }
}
