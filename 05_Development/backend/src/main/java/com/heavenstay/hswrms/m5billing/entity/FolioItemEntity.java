package com.heavenstay.hswrms.m5billing.entity;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "FolioItem")
public class FolioItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "folio_item_id")
    private Long folioItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folio_id", nullable = false)
    private FolioEntity folio;

    @Column(name = "charge_category", nullable = false, length = 20)
    private String chargeCategory; // PACKAGE, SPA, FNB

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "charged_at", nullable = false)
    private LocalDateTime chargedAt = LocalDateTime.now();

    @Column(name = "source_booking_id")
    private Long sourceBookingId;

    @Column(name = "source_spa_session_id")
    private Long sourceSpaSessionId;

    @Column(name = "source_meal_order_id")
    private Long sourceMealOrderId;

    public FolioItemEntity() {}

    public FolioItemEntity(FolioEntity folio, String chargeCategory, String description,
                           BigDecimal amount, Long sourceBookingId, Long sourceSpaSessionId, Long sourceMealOrderId) {
        this.folio = folio;
        this.chargeCategory = chargeCategory;
        this.description = description;
        this.amount = amount != null ? amount : BigDecimal.ZERO;
        this.sourceBookingId = sourceBookingId;
        this.sourceSpaSessionId = sourceSpaSessionId;
        this.sourceMealOrderId = sourceMealOrderId;
        this.chargedAt = LocalDateTime.now();
        validateSourceConstraint();
    }

    @PrePersist
    @PreUpdate
    public void validateSourceConstraint() {
        if ("PACKAGE".equalsIgnoreCase(chargeCategory)) {
            if (sourceBookingId == null || sourceSpaSessionId != null || sourceMealOrderId != null) {
                throw new BusinessRuleException("INVALID_FOLIO_SOURCE",
                        "PACKAGE charge must have source_booking_id and no other source reference.");
            }
        } else if ("SPA".equalsIgnoreCase(chargeCategory)) {
            if (sourceSpaSessionId == null || sourceBookingId != null || sourceMealOrderId != null) {
                throw new BusinessRuleException("INVALID_FOLIO_SOURCE",
                        "SPA charge must have source_spa_session_id and no other source reference.");
            }
        } else if ("FNB".equalsIgnoreCase(chargeCategory)) {
            if (sourceMealOrderId == null || sourceBookingId != null || sourceSpaSessionId != null) {
                throw new BusinessRuleException("INVALID_FOLIO_SOURCE",
                        "FNB charge must have source_meal_order_id and no other source reference.");
            }
        } else {
            throw new BusinessRuleException("INVALID_CHARGE_CATEGORY",
                    "Charge category must be PACKAGE, SPA, or FNB.");
        }
    }

    public Long getFolioItemId() {
        return folioItemId;
    }

    public void setFolioItemId(Long folioItemId) {
        this.folioItemId = folioItemId;
    }

    public FolioEntity getFolio() {
        return folio;
    }

    public void setFolio(FolioEntity folio) {
        this.folio = folio;
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
}
