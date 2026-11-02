package com.heavenstay.hswrms.m4fnb.dto;

public class KdsDashboardKpiDto {
    private int retreatMealsToday;
    private int extraOrdersToday;
    private int dietaryAlertsCount;
    private int pendingCount;
    private int preparingCount;

    public KdsDashboardKpiDto() {}

    public KdsDashboardKpiDto(int retreatMealsToday, int extraOrdersToday, int dietaryAlertsCount,
                              int pendingCount, int preparingCount) {
        this.retreatMealsToday = retreatMealsToday;
        this.extraOrdersToday = extraOrdersToday;
        this.dietaryAlertsCount = dietaryAlertsCount;
        this.pendingCount = pendingCount;
        this.preparingCount = preparingCount;
    }

    public int getRetreatMealsToday() {
        return retreatMealsToday;
    }

    public void setRetreatMealsToday(int retreatMealsToday) {
        this.retreatMealsToday = retreatMealsToday;
    }

    public int getExtraOrdersToday() {
        return extraOrdersToday;
    }

    public void setExtraOrdersToday(int extraOrdersToday) {
        this.extraOrdersToday = extraOrdersToday;
    }

    public int getDietaryAlertsCount() {
        return dietaryAlertsCount;
    }

    public void setDietaryAlertsCount(int dietaryAlertsCount) {
        this.dietaryAlertsCount = dietaryAlertsCount;
    }

    public int getPendingCount() {
        return pendingCount;
    }

    public void setPendingCount(int pendingCount) {
        this.pendingCount = pendingCount;
    }

    public int getPreparingCount() {
        return preparingCount;
    }

    public void setPreparingCount(int preparingCount) {
        this.preparingCount = preparingCount;
    }
}
