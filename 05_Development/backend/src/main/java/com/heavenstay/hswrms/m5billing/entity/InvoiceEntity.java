package com.heavenstay.hswrms.m5billing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Invoice")
public class InvoiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_id")
    private Long invoiceId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folio_id", nullable = false, unique = true)
    private FolioEntity folio;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(name = "subtotal_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal finalAmount = BigDecimal.ZERO;

    @Column(name = "invoice_status", nullable = false, length = 20)
    private String invoiceStatus = "DRAFT"; // DRAFT, ISSUED, PAID, CANCELLED

    @Column(name = "issued_date")
    private LocalDateTime issuedDate;

    public InvoiceEntity() {}

    public InvoiceEntity(FolioEntity folio, String invoiceNumber, BigDecimal subtotalAmount,
                         BigDecimal taxAmount, BigDecimal finalAmount, String invoiceStatus) {
        this.folio = folio;
        this.invoiceNumber = invoiceNumber;
        this.subtotalAmount = subtotalAmount;
        this.taxAmount = taxAmount;
        this.finalAmount = finalAmount;
        this.invoiceStatus = invoiceStatus;
        this.issuedDate = LocalDateTime.now();
    }

    public Long getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(Long invoiceId) {
        this.invoiceId = invoiceId;
    }

    public FolioEntity getFolio() {
        return folio;
    }

    public void setFolio(FolioEntity folio) {
        this.folio = folio;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public BigDecimal getSubtotalAmount() {
        return subtotalAmount;
    }

    public void setSubtotalAmount(BigDecimal subtotalAmount) {
        this.subtotalAmount = subtotalAmount;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }

    public void setFinalAmount(BigDecimal finalAmount) {
        this.finalAmount = finalAmount;
    }

    public String getInvoiceStatus() {
        return invoiceStatus;
    }

    public void setInvoiceStatus(String invoiceStatus) {
        this.invoiceStatus = invoiceStatus;
    }

    public LocalDateTime getIssuedDate() {
        return issuedDate;
    }

    public void setIssuedDate(LocalDateTime issuedDate) {
        this.issuedDate = issuedDate;
    }
}
