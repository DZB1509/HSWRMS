package com.heavenstay.hswrms.m5billing.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class FolioResponseDTO {

    private Long folioId;
    private Long retreatBookingId;
    private String bookingReference;
    private String customerName;
    private String villaNumber;
    private BigDecimal totalCharges;
    private BigDecimal totalPaid;
    private BigDecimal balanceDue;
    private String folioStatus;
    private LocalDateTime closedAt;

    // Invoice preview (same maths as the generated invoice: BF-05 / Data Rule 21)
    private BigDecimal depositPaid = BigDecimal.ZERO;
    private BigDecimal packageOutstanding = BigDecimal.ZERO;
    private BigDecimal vatRate = BigDecimal.ZERO;
    private BigDecimal estimatedTax = BigDecimal.ZERO;
    private BigDecimal estimatedAmountDue = BigDecimal.ZERO;
    private Long invoiceId;
    private String invoiceStatus;

    private boolean canGenerateInvoice;
    private boolean hasUnsettledOrders;
    private String unsettledOrdersWarning;

    private List<FolioItemResponseDTO> items = new ArrayList<>();

    public FolioResponseDTO() {}

    public Long getFolioId() {
        return folioId;
    }

    public void setFolioId(Long folioId) {
        this.folioId = folioId;
    }

    public Long getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Long retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
    }

    public void setRetreatBookingId(Integer retreatBookingId) {
        this.retreatBookingId = retreatBookingId != null ? retreatBookingId.longValue() : null;
    }

    public String getBookingReference() {
        return bookingReference;
    }

    public void setBookingReference(String bookingReference) {
        this.bookingReference = bookingReference;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getVillaNumber() {
        return villaNumber;
    }

    public void setVillaNumber(String villaNumber) {
        this.villaNumber = villaNumber;
    }

    public BigDecimal getTotalCharges() {
        return totalCharges;
    }

    public void setTotalCharges(BigDecimal totalCharges) {
        this.totalCharges = totalCharges;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getBalanceDue() {
        return balanceDue;
    }

    public void setBalanceDue(BigDecimal balanceDue) {
        this.balanceDue = balanceDue;
    }

    public String getFolioStatus() {
        return folioStatus;
    }

    public void setFolioStatus(String folioStatus) {
        this.folioStatus = folioStatus;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }

    public boolean isCanGenerateInvoice() {
        return canGenerateInvoice;
    }

    public void setCanGenerateInvoice(boolean canGenerateInvoice) {
        this.canGenerateInvoice = canGenerateInvoice;
    }

    public boolean isHasUnsettledOrders() {
        return hasUnsettledOrders;
    }

    public void setHasUnsettledOrders(boolean hasUnsettledOrders) {
        this.hasUnsettledOrders = hasUnsettledOrders;
    }

    public String getUnsettledOrdersWarning() {
        return unsettledOrdersWarning;
    }

    public void setUnsettledOrdersWarning(String unsettledOrdersWarning) {
        this.unsettledOrdersWarning = unsettledOrdersWarning;
    }

    public List<FolioItemResponseDTO> getItems() {
        return items;
    }

    public void setItems(List<FolioItemResponseDTO> items) {
        this.items = items;
    }

    public BigDecimal getDepositPaid() {
        return depositPaid;
    }

    public void setDepositPaid(BigDecimal depositPaid) {
        this.depositPaid = depositPaid;
    }

    public BigDecimal getPackageOutstanding() {
        return packageOutstanding;
    }

    public void setPackageOutstanding(BigDecimal packageOutstanding) {
        this.packageOutstanding = packageOutstanding;
    }

    public BigDecimal getVatRate() {
        return vatRate;
    }

    public void setVatRate(BigDecimal vatRate) {
        this.vatRate = vatRate;
    }

    public BigDecimal getEstimatedTax() {
        return estimatedTax;
    }

    public void setEstimatedTax(BigDecimal estimatedTax) {
        this.estimatedTax = estimatedTax;
    }

    public BigDecimal getEstimatedAmountDue() {
        return estimatedAmountDue;
    }

    public void setEstimatedAmountDue(BigDecimal estimatedAmountDue) {
        this.estimatedAmountDue = estimatedAmountDue;
    }

    public Long getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(Long invoiceId) {
        this.invoiceId = invoiceId;
    }

    public String getInvoiceStatus() {
        return invoiceStatus;
    }

    public void setInvoiceStatus(String invoiceStatus) {
        this.invoiceStatus = invoiceStatus;
    }
}
