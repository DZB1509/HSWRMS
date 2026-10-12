package com.heavenstay.hswrms.m4fnb.mapper;

import com.heavenstay.hswrms.m4fnb.dto.response.MealOrderLineResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.MealOrderResponse;
import com.heavenstay.hswrms.m4fnb.entity.MealOrder;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderItem;
import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class MealOrderMapper {
    public MealOrderResponse toResponse(MealOrder order, List<MealOrderItem> orderItems,
                                        Map<Integer, MenuItem> menuItems) {
        List<MealOrderLineResponse> lines = orderItems.stream().map(line -> {
            MenuItem menuItem = menuItems.get(line.getMenuItemId());
            BigDecimal lineTotal = line.getUnitPrice().multiply(BigDecimal.valueOf(line.getQuantity()));
            return new MealOrderLineResponse(line.getId(), line.getMenuItemId(),
                    menuItem == null ? "Menu item unavailable" : menuItem.getItemName(),
                    line.getQuantity(), line.getUnitPrice(), lineTotal, line.getPreparationStatus());
        }).toList();
        BigDecimal subtotal = lines.stream().map(MealOrderLineResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new MealOrderResponse(order.getId(), order.getRetreatBookingId(), order.getOrderDate(),
                order.getMealType(), order.getOrderType(), order.getOrderStatus(), order.getSpecialNotes(), order.getCreatedAt(),
                subtotal, lines);
    }
}
