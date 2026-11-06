package com.heavenstay.hswrms.m4fnb.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record MenuItemResponse(
        Integer id,
        String itemName,
        String category,
        String mealType,
        BigDecimal price,
        List<String> dietaryTags,
        String allergenInformation,
        boolean available,
        Integer availableServings,
        boolean allergyWarning,
        boolean isExtra) {

    public MenuItemResponse(
            Integer id,
            String itemName,
            String category,
            String mealType,
            BigDecimal price,
            List<String> dietaryTags,
            String allergenInformation,
            boolean available,
            Integer availableServings,
            boolean allergyWarning) {
        this(id, itemName, category, mealType, price, dietaryTags, allergenInformation, available, availableServings, allergyWarning, id != null && id >= 1 && id <= 15);
    }
}
