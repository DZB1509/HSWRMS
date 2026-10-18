package com.heavenstay.hswrms.m5billing.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class TherapistUtilizationDTO {

    private int totalTherapists;
    private int totalScheduledSessions;
    private int completedSessions;
    private int noShowSessions;
    private int cancelledSessions;
    private double totalBookedHours;
    private LocalDate fromDate;
    private LocalDate toDate;

    private List<TherapistDetailItem> therapistDetails = new ArrayList<>();

    public TherapistUtilizationDTO() {}

    public static class TherapistDetailItem {
        private Long therapistId;
        private String name;
        private int sessionsCount;
        private int completedCount;
        private int noShowCount;
        private int cancelledCount;
        private int bookedMinutes;
        private double bookedHours;

        public TherapistDetailItem() {}

        public TherapistDetailItem(Long therapistId, String name, int sessionsCount, int completedCount,
                                   int noShowCount, int cancelledCount, int bookedMinutes, double bookedHours) {
            this.therapistId = therapistId;
            this.name = name;
            this.sessionsCount = sessionsCount;
            this.completedCount = completedCount;
            this.noShowCount = noShowCount;
            this.cancelledCount = cancelledCount;
            this.bookedMinutes = bookedMinutes;
            this.bookedHours = bookedHours;
        }

        public Long getTherapistId() {
            return therapistId;
        }

        public void setTherapistId(Long therapistId) {
            this.therapistId = therapistId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getSessionsCount() {
            return sessionsCount;
        }

        public void setSessionsCount(int sessionsCount) {
            this.sessionsCount = sessionsCount;
        }

        public int getCompletedCount() {
            return completedCount;
        }

        public void setCompletedCount(int completedCount) {
            this.completedCount = completedCount;
        }

        public int getNoShowCount() {
            return noShowCount;
        }

        public void setNoShowCount(int noShowCount) {
            this.noShowCount = noShowCount;
        }

        public int getCancelledCount() {
            return cancelledCount;
        }

        public void setCancelledCount(int cancelledCount) {
            this.cancelledCount = cancelledCount;
        }

        public int getBookedMinutes() {
            return bookedMinutes;
        }

        public void setBookedMinutes(int bookedMinutes) {
            this.bookedMinutes = bookedMinutes;
        }

        public double getBookedHours() {
            return bookedHours;
        }

        public void setBookedHours(double bookedHours) {
            this.bookedHours = bookedHours;
        }
    }

    public int getTotalTherapists() {
        return totalTherapists;
    }

    public void setTotalTherapists(int totalTherapists) {
        this.totalTherapists = totalTherapists;
    }

    public int getTotalScheduledSessions() {
        return totalScheduledSessions;
    }

    public void setTotalScheduledSessions(int totalScheduledSessions) {
        this.totalScheduledSessions = totalScheduledSessions;
    }

    public int getCompletedSessions() {
        return completedSessions;
    }

    public void setCompletedSessions(int completedSessions) {
        this.completedSessions = completedSessions;
    }

    public int getNoShowSessions() {
        return noShowSessions;
    }

    public void setNoShowSessions(int noShowSessions) {
        this.noShowSessions = noShowSessions;
    }

    public int getCancelledSessions() {
        return cancelledSessions;
    }

    public void setCancelledSessions(int cancelledSessions) {
        this.cancelledSessions = cancelledSessions;
    }

    public double getTotalBookedHours() {
        return totalBookedHours;
    }

    public void setTotalBookedHours(double totalBookedHours) {
        this.totalBookedHours = totalBookedHours;
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

    public List<TherapistDetailItem> getTherapistDetails() {
        return therapistDetails;
    }

    public void setTherapistDetails(List<TherapistDetailItem> therapistDetails) {
        this.therapistDetails = therapistDetails;
    }
}
