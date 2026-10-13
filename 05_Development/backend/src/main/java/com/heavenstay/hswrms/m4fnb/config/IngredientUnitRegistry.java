package com.heavenstay.hswrms.m4fnb.config;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m4fnb.entity.Ingredient;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Central source of canonical stock units because the active schema has no unit column. */
@Component
@ConfigurationProperties(prefix = "app.fnb.inventory")
public class IngredientUnitRegistry {
    private Map<String, String> units = new HashMap<>();
    private Map<String, String> normalizedUnits = Map.of();

    public void setUnits(Map<String, String> units) {
        this.units = units == null ? new HashMap<>() : new HashMap<>(units);
        this.normalizedUnits = Map.of();
    }

    public Map<String, String> getUnits() {
        return units;
    }

    @jakarta.annotation.PostConstruct
    public void validateAndNormalize() {
        Map<String, String> normalized = new HashMap<>();
        for (Map.Entry<String, String> entry : units.entrySet()) {
            String ingredientKey = normalize(entry.getKey());
            String unit = entry.getValue() == null ? "" : entry.getValue().trim();
            if (ingredientKey.isEmpty() || unit.isEmpty()) {
                throw new IllegalStateException("F&B inventory unit configuration has a blank ingredient or unit.");
            }
            if (normalized.putIfAbsent(ingredientKey, unit) != null) {
                throw new IllegalStateException("F&B inventory unit configuration contains duplicate normalized ingredient names.");
            }
        }
        normalizedUnits = Map.copyOf(normalized);
    }

    public String unitFor(Ingredient ingredient) {
        if (ingredient == null || ingredient.getIngredientName() == null) {
            throw unconfigured("unknown ingredient");
        }
        return unitForName(ingredient.getIngredientName());
    }

    public String unitForName(String ingredientName) {
        String unit = normalizedUnits.get(normalize(ingredientName));
        if (unit == null) {
            throw unconfigured(ingredientName);
        }
        return unit;
    }

    private BusinessRuleException unconfigured(String ingredientName) {
        return new BusinessRuleException("INGREDIENT_UNIT_NOT_CONFIGURED",
                "A canonical inventory unit is not configured for ingredient: " + ingredientName + ".");
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
