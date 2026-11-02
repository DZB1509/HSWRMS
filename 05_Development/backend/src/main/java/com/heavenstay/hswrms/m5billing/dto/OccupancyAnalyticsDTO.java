package com.heavenstay.hswrms.m5billing.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class OccupancyAnalyticsDTO {

    private int totalVillas;
    private int occupiedCount;
    private int reservedCount;
    private int readyCount;
    private int cleaningCount;
    private int maintenanceCount;
    private double occupancyRate;
    private LocalDate fromDate;
    private LocalDate toDate;

    private List<VillaOccupancyDetailDTO> villaDetails = new ArrayList<>();

    public OccupancyAnalyticsDTO() {}

    public static class VillaOccupancyDetailDTO {
        private Long villaId;
        private String villaNumber;
        private String category;
        private String status;
        private String customerName;
        private String bookingReference;

        public VillaOccupancyDetailDTO() {}

        public VillaOccupancyDetailDTO(Long villaId, String villaNumber, String category, String status, String customerName, String bookingReference) {
            this.villaId = villaId;
            this.villaNumber = villaNumber;
            this.category = category;
            this.status = status;
            this.customerName = customerName;
            this.bookingReference = bookingReference;
        }

        public VillaOccupancyDetailDTO(Integer villaId, String villaNumber, String category, String status, String customerName, String bookingReference) {
            this(villaId != null ? villaId.longValue() : null, villaNumber, category, status, customerName, bookingReference);
        }

        public Long getVillaId() {
            return villaId;
        }

        public void setVillaId(Long villaId) {
            this.villaId = villaId;
        }

        public String getVillaNumber() {
            return villaNumber;
        }

        public void setVillaNumber(String villaNumber) {
            this.villaNumber = villaNumber;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getCustomerName() {
            return customerName;
        }

        public void setCustomerName(String customerName) {
            this.customerName = customerName;
        }

        public String getBookingReference() {
            return bookingReference;
        }

        public void setBookingReference(String bookingReference) {
            this.bookingReference = bookingReference;
        }
    }

    public int getTotalVillas() {
        return totalVillas;
    }

    public void setTotalVillas(int totalVillas) {
        this.totalVillas = totalVillas;
    }

    public int getOccupiedCount() {
        return occupiedCount;
    }

    public void setOccupiedCount(int occupiedCount) {
        this.occupiedCount = occupiedCount;
    }

    public int getReservedCount() {
        return reservedCount;
    }

    public void setReservedCount(int reservedCount) {
        this.reservedCount = reservedCount;
    }

    public int getReadyCount() {
        return readyCount;
    }

    public void setReadyCount(int readyCount) {
        this.readyCount = readyCount;
    }

    public int getCleaningCount() {
        return cleaningCount;
    }

    public void setCleaningCount(int cleaningCount) {
        this.cleaningCount = cleaningCount;
    }

    public int getMaintenanceCount() {
        return maintenanceCount;
    }

    public void setMaintenanceCount(int maintenanceCount) {
        this.maintenanceCount = maintenanceCount;
    }

    public double getOccupancyRate() {
        return occupancyRate;
    }

    public void setOccupancyRate(double occupancyRate) {
        this.occupancyRate = occupancyRate;
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

    public List<VillaOccupancyDetailDTO> getVillaDetails() {
        return villaDetails;
    }

    public void setVillaDetails(List<VillaOccupancyDetailDTO> villaDetails) {
        this.villaDetails = villaDetails;
    }
}
