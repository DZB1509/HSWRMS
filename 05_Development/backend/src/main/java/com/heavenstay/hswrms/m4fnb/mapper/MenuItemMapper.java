package com.heavenstay.hswrms.m4fnb.mapper;

import com.heavenstay.hswrms.m4fnb.dto.request.CreateMenuItemRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.MenuItemResponse;
import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class MenuItemMapper {
    public MenuItem toEntity(CreateMenuItemRequest request) {
        return new MenuItem(request.itemName().trim(), normalize(request.category()),
                normalize(request.mealType()), request.price(), normalize(request.dietaryTags()),
                normalize(request.allergenInformation()), request.availabilityStatus().trim().toUpperCase(Locale.ROOT));
    }

    public MenuItemResponse toResponse(MenuItem item, boolean available, Integer servingsAvailable,
                                       boolean allergyWarning) {
        List<String> tags = new ArrayList<>();
        String dietaryTags = item.getDietaryTags();
        if (dietaryTags != null && !dietaryTags.isBlank()) {
            for (String rawTag : dietaryTags.split("[,;|]")) {
                String tag = rawTag.trim();
                if (!tag.isEmpty()) {
                    tags.add(tag);
                }
            }
        }
        return new MenuItemResponse(item.getId(), item.getItemName(), item.getCategory(), item.getMealType(),
                item.getPrice(), tags, item.getAllergenInformation(), available, servingsAvailable, allergyWarning);
    }

    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
