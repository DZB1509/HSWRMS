package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.m4fnb.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface FnbKdsOrderService {

    List<MenuItemDto> getAvailableMenuItems(String category, String mealPeriod);

    MealOrderDto createDailyMealOrder(CreateDailyMealRequest request, Integer currentUserId);

    MealOrderDto createAlaCarteOrder(CreateAlaCarteRequest request, Integer currentUserId);

    List<MealOrderDto> getOrdersForBooking(Integer bookingId, Integer currentUserId, boolean isStaff);

    KdsDashboardKpiDto getDashboardKpis(LocalDate date);

    List<MealPrepEntryDto> getKitchenPrepQueue(LocalDate date, String type, String status, Boolean dietaryOnly, String search);

    MealPrepEntryDto getOrderDetails(Long orderId);

    MealOrderDto updateOrderStatus(Long orderId, UpdateOrderStatusRequest request, Integer currentUserId, boolean isStaff);

    MealOrderDto cancelOrder(Long orderId, String cancellationReason, Integer currentUserId, boolean isStaff);
}

