package com.heavenstay.hswrms.m5billing.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FinalizeCheckoutResponseDTO {

    private Long invoiceId;
    private Long bookingId;
    private String bookingReference;
    private String bookingStatus;
    private String folioStatus;
    private String invoiceStatus;
    private Long villaId;
    private String villaNumber;
    private String villaStatus;
    private BigDecimal totalSettled;
    private LocalDateTime completedAt;
    private String message;
    private boolean zeroBalanceSettlement;
    private String invoiceNumber;

    public FinalizeCheckoutResponseDTO() {}

    public Long getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(Long invoiceId) {
        this.invoiceId = invoiceId;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public void setBookingId(Integer bookingId) {
        this.bookingId = bookingId != null ? bookingId.longValue() : null;
    }

    public String getBookingReference() {
        return bookingReference;
    }

    public void setBookingReference(String bookingReference) {
        this.bookingReference = bookingReference;
    }

    public String getBookingStatus() {
        return bookingStatus;
    }

    public void setBookingStatus(String bookingStatus) {
        this.bookingStatus = bookingStatus;
    }

    public String getFolioStatus() {
        return folioStatus;
    }

    public void setFolioStatus(String folioStatus) {
        this.folioStatus = folioStatus;
    }

    public String getInvoiceStatus() {
        return invoiceStatus;
    }

    public void setInvoiceStatus(String invoiceStatus) {
        this.invoiceStatus = invoiceStatus;
    }

    public Long getVillaId() {
        return villaId;
    }

    public void setVillaId(Long villaId) {
        this.villaId = villaId;
    }

    public void setVillaId(Integer villaId) {
        this.villaId = villaId != null ? villaId.longValue() : null;
    }

    public String getVillaNumber() {
        return villaNumber;
    }

    public void setVillaNumber(String villaNumber) {
        this.villaNumber = villaNumber;
    }

    public String getVillaStatus() {
        return villaStatus;
    }

    public void setVillaStatus(String villaStatus) {
        this.villaStatus = villaStatus;
    }

    public BigDecimal getTotalSettled() {
        return totalSettled;
    }

    public void setTotalSettled(BigDecimal totalSettled) {
        this.totalSettled = totalSettled;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isZeroBalanceSettlement() {
        return zeroBalanceSettlement;
    }

    public void setZeroBalanceSettlement(boolean zeroBalanceSettlement) {
        this.zeroBalanceSettlement = zeroBalanceSettlement;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }
}
