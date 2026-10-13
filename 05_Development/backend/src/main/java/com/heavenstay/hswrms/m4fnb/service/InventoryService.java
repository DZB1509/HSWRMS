package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateIngredientBatchRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.UpdateBatchConditionRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.IngredientBatchResponse;
import com.heavenstay.hswrms.m4fnb.config.IngredientUnitRegistry;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class InventoryService {
    private static final Set<String> USABLE_CONDITIONS = Set.of("FRESH", "GOOD", "NEAR_EXPIRY");
    private static final Set<String> ALLOWED_CONDITIONS = Set.of("FRESH", "GOOD", "NEAR_EXPIRY", "HOLD", "EXPIRED",
            "DISCARDED");

    private final IngredientRepository ingredientRepository;
    private final IngredientBatchRepository batchRepository;
    private final MenuItemIngredientRepository recipeRepository;
    private final MealOrderItemRepository orderItemRepository;
    private final InventoryMapper inventoryMapper;
    private final IngredientUnitRegistry unitRegistry;

    public InventoryService(IngredientRepository ingredientRepository, IngredientBatchRepository batchRepository,
            MenuItemIngredientRepository recipeRepository, MealOrderItemRepository orderItemRepository,
            InventoryMapper inventoryMapper, IngredientUnitRegistry unitRegistry) {
        this.ingredientRepository = ingredientRepository;
        this.batchRepository = batchRepository;
        this.recipeRepository = recipeRepository;
        this.orderItemRepository = orderItemRepository;
        this.inventoryMapper = inventoryMapper;
        this.unitRegistry = unitRegistry;
    }

    @Transactional
    public IngredientBatchResponse receiveBatch(CreateIngredientBatchRequest request) {
        if (request == null) {
            throw new BusinessRuleException("INVALID_BATCH_REQUEST", "Batch request is required.");
        }
        CreateIngredientBatchRequest safeRequest = request;
        int requestedIngredientId = safeRequest.ingredientId();
        Ingredient ingredient = ingredientRepository.findById(requestedIngredientId)
                .orElseThrow(() -> new ResourceNotFoundException("Ingredient", "id", requestedIngredientId));
        unitRegistry.unitFor(ingredient);
        Integer ingredientId = ingredient.getId();
        if (ingredientId == null) {
            throw new BusinessRuleException("INVALID_INGREDIENT_ID", "Ingredient must have a persisted ID.");
        }
        if (safeRequest.expirationDate().isBefore(safeRequest.receivedDate())) {
            throw new BusinessRuleException("INVALID_BATCH_DATES", "Expiration date cannot be before received date.");
        }
        String condition = normalizeCondition(safeRequest.stockCondition());
        IngredientBatch batch = batchRepository.save(new IngredientBatch(ingredientId, safeRequest.receivedDate(),
                safeRequest.expirationDate(), safeRequest.remainingQuantity(), condition));
        return inventoryMapper.toResponse(batch, Map.of(ingredientId, ingredient), LocalDate.now());
    }

    @Transactional
    public IngredientBatchResponse updateCondition(Integer batchId, UpdateBatchConditionRequest request) {
        if (batchId == null || request == null) {
            throw new BusinessRuleException("INVALID_BATCH_REQUEST", "Batch ID and update request are required.");
        }
        Integer safeBatchId = batchId;
        UpdateBatchConditionRequest safeRequest = request;
        IngredientBatch batch = batchRepository.findById(safeBatchId)
                .orElseThrow(() -> new ResourceNotFoundException("IngredientBatch", "id", safeBatchId));
        batch.setStockCondition(normalizeCondition(safeRequest.stockCondition()));
        IngredientBatch saved = batchRepository.save(batch);
        Integer ingredientId = saved.getIngredientId();
        if (ingredientId == null) {
            throw new BusinessRuleException("INVALID_BATCH_INGREDIENT",
                    "Ingredient batch must reference an ingredient.");
        }
        Ingredient ingredient = ingredientRepository.findById(ingredientId)
                .orElseThrow(() -> new ResourceNotFoundException("Ingredient", "id", ingredientId));
        unitRegistry.unitFor(ingredient);
        return inventoryMapper.toResponse(saved, Map.of(ingredientId, ingredient), LocalDate.now());
    }

    public List<IngredientBatchResponse> listBatches(Integer ingredientId, LocalDate asOfDate) {
        if (ingredientId != null) {
            Integer safeIngredientId = ingredientId;
            Ingredient ingredient = ingredientRepository.findById(safeIngredientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Ingredient", "id", safeIngredientId));
            unitRegistry.unitFor(ingredient);
        }
        List<IngredientBatch> batches = batchRepository.findAllByIngredient(ingredientId);
        Map<Integer, Ingredient> ingredients = new HashMap<>();
        Set<Integer> ingredientIds = new HashSet<>();
        for (IngredientBatch batch : batches) {
            Integer batchIngredientId = batch.getIngredientId();
            if (batchIngredientId != null) {
                ingredientIds.add(batchIngredientId);
            }
        }
        List<Integer> safeIngredientIds = new ArrayList<>(ingredientIds);
        for (Ingredient ingredient : ingredientRepository.findAllById(safeIngredientIds)) {
            unitRegistry.unitFor(ingredient);
            Integer persistedIngredientId = ingredient.getId();
            if (persistedIngredientId == null) {
                throw new BusinessRuleException("INVALID_INGREDIENT_ID", "Ingredient must have a persisted ID.");
            }
            ingredients.put(persistedIngredientId, ingredient);
        }
        List<IngredientBatchResponse> responses = new ArrayList<>(batches.size());
        for (IngredientBatch batch : batches) {
            responses.add(inventoryMapper.toResponse(batch, ingredients, asOfDate));
        }
        return responses;
    }

    public BigDecimal getUsableQuantity(Integer ingredientId, LocalDate asOfDate) {
        Integer safeIngredientId = Objects.requireNonNull(ingredientId, "ingredientId");
        LocalDate safeAsOfDate = Objects.requireNonNull(asOfDate, "asOfDate");
        Ingredient ingredient = ingredientRepository.findById(safeIngredientId)
                .orElseThrow(() -> new ResourceNotFoundException("Ingredient", "id", safeIngredientId));
        unitRegistry.unitFor(ingredient);
        BigDecimal total = BigDecimal.ZERO;
        for (IngredientBatch batch : batchRepository.findUsableBatches(
                safeIngredientId, safeAsOfDate, USABLE_CONDITIONS)) {
            BigDecimal remaining = batch.getRemainingQuantity();
            if (remaining == null || remaining.signum() < 0) {
                throw new BusinessRuleException("INVALID_BATCH_QUANTITY",
                        "Usable ingredient batch has an invalid remaining quantity.");
            }
            total = total.add(remaining);
        }
        return total;
    }

    public int getAvailableServings(Integer ingredientId, BigDecimal requiredQuantity, LocalDate asOfDate) {
        if (requiredQuantity == null || requiredQuantity.signum() <= 0)
            return 0;
        BigDecimal servings = getUsableQuantity(ingredientId, asOfDate).divideToIntegralValue(requiredQuantity);
        return servings.compareTo(BigDecimal.valueOf(Integer.MAX_VALUE)) > 0
                ? Integer.MAX_VALUE
                : servings.intValue();
    }

    /**
     * Deducts recipe quantities directly from usable batches when one order line is
     * marked READY.
     * This runs in the caller's transaction with the line-status update; no
     * consumption-history
     * entity or history record is created. Batch rows are locked in ingredient/FEFO
     * order.
     */
    @Transactional
    public void consumeForOrderItem(Integer orderLineId, LocalDate asOfDate) {
        Integer safeOrderLineId = Objects.requireNonNull(orderLineId, "orderLineId");
        LocalDate safeAsOfDate = Objects.requireNonNull(asOfDate, "asOfDate");
        MealOrderItem orderLine = orderItemRepository.findById(safeOrderLineId)
                .orElseThrow(() -> new ResourceNotFoundException("MealOrderItem", "id", safeOrderLineId));
        Integer menuItemId = orderLine.getMenuItemId();
        Integer quantity = orderLine.getQuantity();
        if (menuItemId == null || quantity == null || quantity <= 0) {
            throw new BusinessRuleException("INVALID_ORDER_LINE",
                    "Meal order line must reference a menu item and have a positive quantity.");
        }
        List<MenuItemIngredient> recipeLines = recipeRepository
                .findByMenuItemIdOrderByIngredientIdAsc(menuItemId);
        if (recipeLines.isEmpty()) {
            throw new BusinessRuleException("RECIPE_NOT_CONFIGURED",
                    "A menu item has no recipe; inventory cannot be consumed safely.");
        }

        Map<Integer, BigDecimal> requirementsByIngredient = new TreeMap<>();
        for (MenuItemIngredient recipeLine : recipeLines) {
            Integer ingredientId = recipeLine.getIngredientId();
            BigDecimal requiredQuantity = recipeLine.getRequiredQuantity();
            if (ingredientId == null || requiredQuantity == null || requiredQuantity.signum() <= 0) {
                throw new BusinessRuleException("INVALID_RECIPE_QUANTITY",
                        "Recipe ingredient and required quantity must be configured with positive values.");
            }
            Ingredient ingredient = ingredientRepository.findById(ingredientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Ingredient", "id", ingredientId));
            unitRegistry.unitFor(ingredient);
            BigDecimal required = requiredQuantity.multiply(BigDecimal.valueOf(quantity));
            BigDecimal currentRequired = requirementsByIngredient.get(ingredientId);
            requirementsByIngredient.put(ingredientId,
                    currentRequired == null ? required : currentRequired.add(required));
        }

        for (Map.Entry<Integer, BigDecimal> entry : requirementsByIngredient.entrySet()) {
            Integer ingredientId = entry.getKey();
            if (ingredientId == null) {
                throw new BusinessRuleException("INVALID_RECIPE_INGREDIENT",
                        "Recipe ingredient ID cannot be null.");
            }
            List<IngredientBatch> batches = batchRepository.findUsableBatchesForUpdate(
                    ingredientId, safeAsOfDate, USABLE_CONDITIONS);
            BigDecimal totalRequired = entry.getValue();
            BigDecimal totalUsable = BigDecimal.ZERO;
            for (IngredientBatch batch : batches) {
                BigDecimal remaining = batch.getRemainingQuantity();
                if (remaining == null || remaining.signum() < 0) {
                    throw new BusinessRuleException("INVALID_BATCH_QUANTITY",
                            "Ingredient batch has an invalid remaining quantity.");
                }
                totalUsable = totalUsable.add(remaining);
            }
            if (totalUsable.compareTo(totalRequired) < 0) {
                Ingredient ingredient = ingredientRepository.findById(ingredientId)
                        .orElseThrow(() -> new ResourceNotFoundException("Ingredient", "id", ingredientId));
                String name = ingredient.getIngredientName();
                throw new BusinessRuleException("INSUFFICIENT_USABLE_STOCK",
                        "Insufficient usable stock for " + name + ". Required " + totalRequired + ", available "
                                + totalUsable + ".");
            }

            BigDecimal quantityLeft = totalRequired;
            int batchIndex = 0;
            while (quantityLeft.signum() > 0) {
                IngredientBatch batch = batches.get(batchIndex);
                BigDecimal allocation = batch.getRemainingQuantity().min(quantityLeft);
                batch.setRemainingQuantity(batch.getRemainingQuantity().subtract(allocation));
                quantityLeft = quantityLeft.subtract(allocation);
                if (batch.getRemainingQuantity().signum() == 0)
                    batchIndex++;
            }
            // These batches were loaded and locked in this transaction; JPA dirty checking
            // persists the remaining-quantity updates when the transaction commits.
        }
    }

    private String normalizeCondition(String rawCondition) {
        if (rawCondition == null || rawCondition.isBlank()) {
            throw new BusinessRuleException("INVALID_STOCK_CONDITION", "Stock condition is required.");
        }
        String condition = rawCondition.trim().toUpperCase(java.util.Locale.ROOT);
        if (!ALLOWED_CONDITIONS.contains(condition)) {
            throw new BusinessRuleException("INVALID_STOCK_CONDITION", "Stock condition is not supported.");
        }
        return condition;
    }
}
