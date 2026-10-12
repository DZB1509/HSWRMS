package com.heavenstay.hswrms.m4fnb.dto.response;

import java.time.LocalDate;
import java.util.List;

public record FnbDashboardResponse(LocalDate businessDate, KpiSummary kpis,
        List<KitchenOrderResponse> todaysMealOrders,
        List<IngredientDemandResponse> ingredientDemand,
        List<MenuAvailabilityResponse> menuAvailability) {
    public record KpiSummary(int totalOrders, int retreatMealOrders, int alaCarteOrders,
            int pendingOrders, int preparingOrders, int dietaryAlerts) { }
}
