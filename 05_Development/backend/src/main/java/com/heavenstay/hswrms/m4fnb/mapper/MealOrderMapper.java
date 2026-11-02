package com.heavenstay.hswrms.m4fnb.mapper;

import com.heavenstay.hswrms.m4fnb.dto.response.MealOrderLineResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.MealOrderResponse;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderEntity;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderItem;
import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class MealOrderMapper {
    public MealOrderResponse toResponse(MealOrderEntity order, List<MealOrderItem> orderItems,
                                        Map<Integer, MenuItem> menuItems) {
        List<MealOrderLineResponse> lines = orderItems.stream().map(line -> {
            MenuItem menuItem = menuItems.get(line.getMenuItemId());
            BigDecimal lineTotal = line.getUnitPrice().multiply(BigDecimal.valueOf(line.getQuantity()));
            String rawName = menuItem == null ? "Menu item unavailable" : menuItem.getItemName();
            String cleanName = com.heavenstay.hswrms.common.util.TextEncodingSanitizer.sanitize(rawName);
            return new MealOrderLineResponse(line.getId(), line.getMenuItemId(), cleanName,
                    line.getQuantity(), line.getUnitPrice(), lineTotal, line.getPreparationStatus());
        }).toList();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (MealOrderLineResponse line : lines) {
            subtotal = subtotal.add(line.lineTotal());
        }
        String cleanNotes = com.heavenstay.hswrms.common.util.TextEncodingSanitizer.sanitize(order.getSpecialNotes());
        return new MealOrderResponse(order.getId(), order.getRetreatBookingId(), order.getOrderDate(),
                order.getMealType(), order.getOrderType(), order.getOrderStatus(), cleanNotes, order.getCreatedAt(),
                subtotal, lines);
    }

    public MealOrderResponse toResponse(MealOrderEntity order, List<MealOrderItem> orderItems,
                                        Map<Integer, MenuItem> menuItems, String folioPostingStatus) {
        List<MealOrderLineResponse> lines = orderItems.stream().map(line -> {
            MenuItem menuItem = menuItems.get(line.getMenuItemId());
            BigDecimal lineTotal = line.getUnitPrice().multiply(BigDecimal.valueOf(line.getQuantity()));
            String rawName = menuItem == null ? "Menu item unavailable" : menuItem.getItemName();
            String cleanName = com.heavenstay.hswrms.common.util.TextEncodingSanitizer.sanitize(rawName);
            return new MealOrderLineResponse(line.getId(), line.getMenuItemId(), cleanName,
                    line.getQuantity(), line.getUnitPrice(), lineTotal, line.getPreparationStatus());
        }).toList();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (MealOrderLineResponse line : lines) {
            subtotal = subtotal.add(line.lineTotal());
        }
        String cleanNotes = com.heavenstay.hswrms.common.util.TextEncodingSanitizer.sanitize(order.getSpecialNotes());
        return new MealOrderResponse(order.getId(), order.getRetreatBookingId(), order.getOrderDate(),
                order.getMealType(), order.getOrderType(), order.getOrderStatus(), cleanNotes, order.getCreatedAt(),
                subtotal, lines, folioPostingStatus);
    }
}
