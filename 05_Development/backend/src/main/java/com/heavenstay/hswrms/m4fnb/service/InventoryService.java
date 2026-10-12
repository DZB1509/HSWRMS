package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateIngredientBatchRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.UpdateBatchConditionRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.IngredientBatchResponse;
import com.heavenstay.hswrms.m4fnb.entity.Ingredient;
import com.heavenstay.hswrms.m4fnb.entity.IngredientBatch;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderItem;
import com.heavenstay.hswrms.m4fnb.entity.MenuItemIngredient;
import com.heavenstay.hswrms.m4fnb.mapper.InventoryMapper;
import com.heavenstay.hswrms.m4fnb.repository.IngredientBatchRepository;
import com.heavenstay.hswrms.m4fnb.repository.IngredientRepository;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderItemRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemIngredientRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class InventoryService {
    private static final Set<String> USABLE_CONDITIONS = Set.of("FRESH", "GOOD", "NEAR_EXPIRY");
    private static final Set<String> ALLOWED_CONDITIONS = Set.of("FRESH", "GOOD", "NEAR_EXPIRY", "HOLD", "EXPIRED", "DISCARDED");

    private final IngredientRepository ingredientRepository;
    private final IngredientBatchRepository batchRepository;
    private final MenuItemIngredientRepository recipeRepository;
    private final MealOrderItemRepository orderItemRepository;
    private final InventoryMapper inventoryMapper;

    public InventoryService(IngredientRepository ingredientRepository, IngredientBatchRepository batchRepository,
            MenuItemIngredientRepository recipeRepository, MealOrderItemRepository orderItemRepository,
            InventoryMapper inventoryMapper) {
        this.ingredientRepository = ingredientRepository;
        this.batchRepository = batchRepository;
        this.recipeRepository = recipeRepository;
        this.orderItemRepository = orderItemRepository;
        this.inventoryMapper = inventoryMapper;
    }

    @Transactional
    public IngredientBatchResponse receiveBatch(CreateIngredientBatchRequest request) {
        Ingredient ingredient = ingredientRepository.findById(request.ingredientId())
                .orElseThrow(() -> new ResourceNotFoundException("Ingredient", "id", request.ingredientId()));
        if (request.expirationDate().isBefore(request.receivedDate())) {
            throw new BusinessRuleException("INVALID_BATCH_DATES", "Expiration date cannot be before received date.");
        }
        String condition = normalizeCondition(request.stockCondition());
        IngredientBatch batch = batchRepository.save(new IngredientBatch(ingredient.getId(), request.receivedDate(),
                request.expirationDate(), request.remainingQuantity(), condition));
        return inventoryMapper.toResponse(batch, Map.of(ingredient.getId(), ingredient), LocalDate.now());
    }

    @Transactional
    public IngredientBatchResponse updateCondition(Integer batchId, UpdateBatchConditionRequest request) {
        IngredientBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("IngredientBatch", "id", batchId));
        batch.setStockCondition(normalizeCondition(request.stockCondition()));
        IngredientBatch saved = batchRepository.save(batch);
        Ingredient ingredient = ingredientRepository.findById(saved.getIngredientId()).orElse(null);
        return inventoryMapper.toResponse(saved, ingredient == null ? Map.of() : Map.of(ingredient.getId(), ingredient), LocalDate.now());
    }

    public List<IngredientBatchResponse> listBatches(Integer ingredientId, LocalDate asOfDate) {
        if (ingredientId != null && !ingredientRepository.existsById(ingredientId)) {
            throw new ResourceNotFoundException("Ingredient", "id", ingredientId);
        }
        List<IngredientBatch> batches = batchRepository.findAllByIngredient(ingredientId);
        Map<Integer, Ingredient> ingredients = new HashMap<>();
        ingredientRepository.findAllById(batches.stream().map(IngredientBatch::getIngredientId).distinct().toList())
                .forEach(ingredient -> ingredients.put(ingredient.getId(), ingredient));
        return batches.stream().map(batch -> inventoryMapper.toResponse(batch, ingredients, asOfDate)).toList();
    }

    public BigDecimal getUsableQuantity(Integer ingredientId, LocalDate asOfDate) {
        return batchRepository.findUsableBatches(ingredientId, asOfDate, USABLE_CONDITIONS).stream()
                .map(IngredientBatch::getRemainingQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public int getAvailableServings(Integer ingredientId, BigDecimal quantityPerServing, LocalDate asOfDate) {
        if (quantityPerServing.signum() <= 0) return 0;
        return getUsableQuantity(ingredientId, asOfDate).divideToIntegralValue(quantityPerServing).intValue();
    }

    /**
     * Deducts recipe quantities directly from usable batches when one order line is marked READY.
     * This runs in the caller's transaction with the line-status update; no consumption-history
     * entity or history record is created. Batch rows are locked in ingredient/FEFO order.
     */
    @Transactional
    public void consumeForOrderItem(Integer orderLineId, LocalDate asOfDate) {
        MealOrderItem orderLine = orderItemRepository.findById(orderLineId)
                .orElseThrow(() -> new ResourceNotFoundException("MealOrderItem", "id", orderLineId));
        List<MenuItemIngredient> recipeLines = recipeRepository
                .findByMenuItemIdOrderByIngredientIdAsc(orderLine.getMenuItemId());
        if (recipeLines.isEmpty()) {
            throw new BusinessRuleException("RECIPE_NOT_CONFIGURED",
                    "A menu item has no recipe; inventory cannot be consumed safely.");
        }

        Map<Integer, BigDecimal> requirementsByIngredient = new TreeMap<>();
        for (MenuItemIngredient recipeLine : recipeLines) {
            BigDecimal required = recipeLine.getQuantityPerServing().multiply(BigDecimal.valueOf(orderLine.getQuantity()));
            requirementsByIngredient.merge(recipeLine.getIngredientId(), required, BigDecimal::add);
        }

        for (Map.Entry<Integer, BigDecimal> entry : requirementsByIngredient.entrySet()) {
            Integer ingredientId = entry.getKey();
            List<IngredientBatch> batches = batchRepository.findUsableBatchesForUpdate(
                    ingredientId, asOfDate, USABLE_CONDITIONS);
            BigDecimal totalRequired = entry.getValue();
            BigDecimal totalUsable = batches.stream().map(IngredientBatch::getRemainingQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (totalUsable.compareTo(totalRequired) < 0) {
                Ingredient ingredient = ingredientRepository.findById(ingredientId).orElse(null);
                String name = ingredient == null ? "ingredient " + ingredientId : ingredient.getIngredientName();
                throw new BusinessRuleException("INSUFFICIENT_USABLE_STOCK",
                        "Insufficient usable stock for " + name + ". Required " + totalRequired + ", available " + totalUsable + ".");
            }

            BigDecimal quantityLeft = totalRequired;
            int batchIndex = 0;
            while (quantityLeft.signum() > 0) {
                IngredientBatch batch = batches.get(batchIndex);
                BigDecimal allocation = batch.getRemainingQuantity().min(quantityLeft);
                batch.setRemainingQuantity(batch.getRemainingQuantity().subtract(allocation));
                quantityLeft = quantityLeft.subtract(allocation);
                if (batch.getRemainingQuantity().signum() == 0) batchIndex++;
            }
            batchRepository.saveAll(batches);
        }
    }

    private String normalizeCondition(String rawCondition) {
        String condition = rawCondition.trim().toUpperCase();
        if (!ALLOWED_CONDITIONS.contains(condition)) {
            throw new BusinessRuleException("INVALID_STOCK_CONDITION", "Stock condition is not supported.");
        }
        return condition;
    }
}
