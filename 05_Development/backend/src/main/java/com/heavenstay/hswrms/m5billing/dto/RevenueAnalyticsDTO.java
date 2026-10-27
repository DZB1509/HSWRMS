package com.heavenstay.hswrms.m5billing.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class RevenueAnalyticsDTO {

    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private BigDecimal packageRevenue = BigDecimal.ZERO;
    private BigDecimal spaRevenue = BigDecimal.ZERO;
    private BigDecimal fnbRevenue = BigDecimal.ZERO;
    private BigDecimal outstandingBalance = BigDecimal.ZERO;
    private LocalDate fromDate;
    private LocalDate toDate;

    private List<CategoryBreakdownItem> categoryBreakdown = new ArrayList<>();
    private List<DailyRevenuePoint> dailySeries = new ArrayList<>();

    public RevenueAnalyticsDTO() {}

    public static class DailyRevenuePoint {
        private LocalDate date;
        private BigDecimal packageRevenue = BigDecimal.ZERO;
        private BigDecimal spaRevenue = BigDecimal.ZERO;
        private BigDecimal fnbRevenue = BigDecimal.ZERO;
        private BigDecimal totalRevenue = BigDecimal.ZERO;

        public DailyRevenuePoint() {}

        public DailyRevenuePoint(LocalDate date, BigDecimal packageRevenue, BigDecimal spaRevenue, BigDecimal fnbRevenue) {
            this.date = date;
            this.packageRevenue = packageRevenue != null ? packageRevenue : BigDecimal.ZERO;
            this.spaRevenue = spaRevenue != null ? spaRevenue : BigDecimal.ZERO;
            this.fnbRevenue = fnbRevenue != null ? fnbRevenue : BigDecimal.ZERO;
            this.totalRevenue = this.packageRevenue.add(this.spaRevenue).add(this.fnbRevenue);
        }

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        public BigDecimal getPackageRevenue() {
            return packageRevenue;
        }

        public void setPackageRevenue(BigDecimal packageRevenue) {
            this.packageRevenue = packageRevenue;
        }

        public BigDecimal getSpaRevenue() {
            return spaRevenue;
        }

        public void setSpaRevenue(BigDecimal spaRevenue) {
            this.spaRevenue = spaRevenue;
        }

        public BigDecimal getFnbRevenue() {
            return fnbRevenue;
        }

        public void setFnbRevenue(BigDecimal fnbRevenue) {
            this.fnbRevenue = fnbRevenue;
        }

        public BigDecimal getTotalRevenue() {
            return totalRevenue;
        }

        public void setTotalRevenue(BigDecimal totalRevenue) {
            this.totalRevenue = totalRevenue;
        }
    }

    public static class CategoryBreakdownItem {
        private String name;
        private BigDecimal value;
        private String color;

        public CategoryBreakdownItem() {}

        public CategoryBreakdownItem(String name, BigDecimal value, String color) {
            this.name = name;
            this.value = value;
            this.color = color;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public BigDecimal getValue() {
            return value;
        }

        public void setValue(BigDecimal value) {
            this.value = value;
        }

        public String getColor() {
            return color;
        }

        public void setColor(String color) {
            this.color = color;
        }
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public BigDecimal getPackageRevenue() {
        return packageRevenue;
    }

    public void setPackageRevenue(BigDecimal packageRevenue) {
        this.packageRevenue = packageRevenue;
    }

    public BigDecimal getSpaRevenue() {
        return spaRevenue;
    }

    public void setSpaRevenue(BigDecimal spaRevenue) {
        this.spaRevenue = spaRevenue;
    }

    public BigDecimal getFnbRevenue() {
        return fnbRevenue;
    }

    public void setFnbRevenue(BigDecimal fnbRevenue) {
        this.fnbRevenue = fnbRevenue;
    }

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public void setOutstandingBalance(BigDecimal outstandingBalance) {
        this.outstandingBalance = outstandingBalance;
    }

    public LocalDate getFromDate() {
        return fromDate;
    }

    public void setFromDate(LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public LocalDate getToDate() {
        return toDate;
    }

    public void setToDate(LocalDate toDate) {
        this.toDate = toDate;
    }

    public List<CategoryBreakdownItem> getCategoryBreakdown() {
        return categoryBreakdown;
    }

    public void setCategoryBreakdown(List<CategoryBreakdownItem> categoryBreakdown) {
        this.categoryBreakdown = categoryBreakdown;
    }

    public List<DailyRevenuePoint> getDailySeries() {
        return dailySeries;
    }

    public void setDailySeries(List<DailyRevenuePoint> dailySeries) {
        this.dailySeries = dailySeries;
    }
}
