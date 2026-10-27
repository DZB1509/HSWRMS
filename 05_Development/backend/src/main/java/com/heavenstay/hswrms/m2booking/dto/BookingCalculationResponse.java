package com.heavenstay.hswrms.m2booking.dto;

import java.math.BigDecimal;

public class BookingCalculationResponse {

    private boolean available;
    private long availableCount;
    private int durationNights;
    private BigDecimal packageBaseAmount;
    private BigDecimal villaModifierAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalEstimatedAmount;
    private BigDecimal requiredDepositAmount;
    private int depositPercentage = 30;

    public BookingCalculationResponse() {
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public long getAvailableCount() {
        return availableCount;
    }

    public void setAvailableCount(long availableCount) {
        this.availableCount = availableCount;
    }

    public int getDurationNights() {
        return durationNights;
    }

    public void setDurationNights(int durationNights) {
        this.durationNights = durationNights;
    }

    public BigDecimal getPackageBaseAmount() {
        return packageBaseAmount;
    }

    public void setPackageBaseAmount(BigDecimal packageBaseAmount) {
        this.packageBaseAmount = packageBaseAmount;
    }

    public BigDecimal getVillaModifierAmount() {
        return villaModifierAmount;
    }

    public void setVillaModifierAmount(BigDecimal villaModifierAmount) {
        this.villaModifierAmount = villaModifierAmount;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getTotalEstimatedAmount() {
        return totalEstimatedAmount;
    }

    public void setTotalEstimatedAmount(BigDecimal totalEstimatedAmount) {
        this.totalEstimatedAmount = totalEstimatedAmount;
    }

    public BigDecimal getRequiredDepositAmount() {
        return requiredDepositAmount;
    }

    public void setRequiredDepositAmount(BigDecimal requiredDepositAmount) {
        this.requiredDepositAmount = requiredDepositAmount;
    }

    public int getDepositPercentage() {
        return depositPercentage;
    }

    public void setDepositPercentage(int depositPercentage) {
        this.depositPercentage = depositPercentage;
    }
}
