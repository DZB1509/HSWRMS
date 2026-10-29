package com.heavenstay.hswrms.m4fnb.mapper;

import com.heavenstay.hswrms.m4fnb.dto.response.IngredientBatchResponse;
import com.heavenstay.hswrms.m4fnb.config.IngredientUnitRegistry;
import com.heavenstay.hswrms.m4fnb.entity.Ingredient;
import com.heavenstay.hswrms.m4fnb.entity.IngredientBatch;
import java.time.LocalDate;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class InventoryMapper {
    private final IngredientUnitRegistry unitRegistry;

    public InventoryMapper(IngredientUnitRegistry unitRegistry) {
        this.unitRegistry = unitRegistry;
    }

    public IngredientBatchResponse toResponse(IngredientBatch batch, Map<Integer, Ingredient> ingredients,
                                               LocalDate asOfDate) {
        Ingredient ingredient = ingredients.get(batch.getIngredientId());
        boolean expired = batch.getExpirationDate().isBefore(asOfDate);
        boolean conditionUsable = "FRESH".equals(batch.getStockCondition())
                || "GOOD".equals(batch.getStockCondition())
                || "NEAR_EXPIRY".equals(batch.getStockCondition());
        boolean usable = !expired && batch.getRemainingQuantity().signum() > 0 && conditionUsable;
        return new IngredientBatchResponse(batch.getId(), batch.getIngredientId(),
                ingredient == null ? "Unknown ingredient" : ingredient.getIngredientName(),
                unitRegistry.unitFor(ingredient),
                batch.getReceivedDate(), batch.getExpirationDate(), batch.getRemainingQuantity(),
                batch.getStockCondition(), expired, usable);
    }
}
