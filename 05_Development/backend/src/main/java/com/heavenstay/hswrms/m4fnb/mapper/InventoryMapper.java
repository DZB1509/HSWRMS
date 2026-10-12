package com.heavenstay.hswrms.m4fnb.mapper;

import com.heavenstay.hswrms.m4fnb.dto.response.IngredientBatchResponse;
import com.heavenstay.hswrms.m4fnb.entity.Ingredient;
import com.heavenstay.hswrms.m4fnb.entity.IngredientBatch;
import java.time.LocalDate;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class InventoryMapper {
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
                ingredient == null ? null : ingredient.getUnitOfMeasure(),
                batch.getReceivedDate(), batch.getExpirationDate(), batch.getRemainingQuantity(),
                batch.getStockCondition(), expired, usable);
    }
}
