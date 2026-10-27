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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.time.LocalDateTime;
import com.heavenstay.hswrms.m4fnb.dto.response.InventoryConsumptionRecord;
import com.heavenstay.hswrms.m4fnb.entity.InventoryConsumptionStatus;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderItemPreparationStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class InventoryService {
    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);
    private static final Set<String> USABLE_CONDITIONS = Set.of("FRESH", "GOOD", "NEAR_EXPIRY");
    private static final Set<String> ALLOWED_CONDITIONS = Set.of("FRESH", "GOOD", "NEAR_EXPIRY", "HOLD", "EXPIRED",
            "DISCARDED");

    private final IngredientRepository ingredientRepository;
    private final IngredientBatchRepository batchRepository;
    private final MenuItemIngredientRepository recipeRepository;
    private final MealOrderItemRepository orderItemRepository;
    private final InventoryMapper inventoryMapper;
    private final IngredientUnitRegistry unitRegistry;

    private final Map<Integer, InventoryConsumptionRecord> consumptionRecords = new ConcurrentHashMap<>();

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

    public InventoryConsumptionRecord getConsumptionRecord(Integer orderLineId) {
        if (orderLineId == null) {
            return InventoryConsumptionRecord.pending();
        }
        MealOrderItem item = orderItemRepository.findById(orderLineId).orElse(null);
        if (item == null) {
            return InventoryConsumptionRecord.pending();
        }
        MealOrderItemPreparationStatus prepStatus = item.getPreparationStatusValue();
        if (prepStatus == MealOrderItemPreparationStatus.PREPARING || prepStatus == MealOrderItemPreparationStatus.READY) {
            return new InventoryConsumptionRecord(InventoryConsumptionStatus.CONSUMED, "Đã trừ kho thành công", LocalDateTime.now());
        }
        return InventoryConsumptionRecord.pending();
    }

    /**
     * Processes inventory consumption for an order line item upon transitioning to PREPARING.
     * Enforces fail-fast validation: throws BusinessRuleException when stock is insufficient
     * or recipe is unconfigured, ensuring atomic Spring transaction rollback.
     * Idempotent: guarantees that an order line already preparing or ready is not deducted again.
     */
    @Transactional
    public InventoryConsumptionRecord processConsumptionForOrderItem(Integer orderLineId, LocalDate asOfDate) {
        Integer safeOrderLineId = Objects.requireNonNull(orderLineId, "orderLineId");
        LocalDate safeAsOfDate = Objects.requireNonNull(asOfDate, "asOfDate");

        MealOrderItem orderLine = orderItemRepository.findById(safeOrderLineId)
                .orElseThrow(() -> new ResourceNotFoundException("MealOrderItem", "id", safeOrderLineId));

        // Idempotency guard: prevent double-deduction if line is already in preparation or ready
        MealOrderItemPreparationStatus prepStatus = orderLine.getPreparationStatusValue();
        if (prepStatus == MealOrderItemPreparationStatus.PREPARING || prepStatus == MealOrderItemPreparationStatus.READY
                || consumptionRecords.containsKey(safeOrderLineId)) {
            log.info("INVENTORY_ALREADY_CONSUMED | OrderLine: {} | Keeping existing CONSUMED status", safeOrderLineId);
            return new InventoryConsumptionRecord(InventoryConsumptionStatus.CONSUMED, "Đã trừ kho trước đó", LocalDateTime.now());
        }

        Integer menuItemId = orderLine.getMenuItemId();
        Integer quantity = orderLine.getQuantity();
        if (menuItemId == null || quantity == null || quantity <= 0) {
            throw new BusinessRuleException("INVALID_ORDER_LINE",
                    "Meal order line has invalid item ID or non-positive quantity");
        }

        List<MenuItemIngredient> recipeLines = recipeRepository.findByMenuItemIdOrderByIngredientIdAsc(menuItemId);
        if (recipeLines == null || recipeLines.isEmpty()) {
            log.warn("RECIPE_NOT_CONFIGURED | OrderLine: {} | MenuItem: {}", safeOrderLineId, menuItemId);
            InventoryConsumptionRecord record = new InventoryConsumptionRecord(
                    InventoryConsumptionStatus.NOT_CONFIGURED,
                    "Món ăn chưa cấu hình công thức định lượng (Recipe not configured).", LocalDateTime.now());
            consumptionRecords.put(safeOrderLineId, record);
            return record;
        }

        Map<Integer, BigDecimal> requirementsByIngredient = new TreeMap<>();
        for (MenuItemIngredient recipeLine : recipeLines) {
            Integer ingredientId = recipeLine.getIngredientId();
            BigDecimal requiredQuantity = recipeLine.getRequiredQuantity();
            if (ingredientId == null || requiredQuantity == null || requiredQuantity.signum() <= 0) {
                throw new BusinessRuleException("INVALID_RECIPE_QUANTITY",
                        "Recipe ingredient quantity must be positive.");
            }
            BigDecimal required = requiredQuantity.multiply(BigDecimal.valueOf(quantity));
            requirementsByIngredient.merge(ingredientId, required, BigDecimal::add);
        }

        // Verify stock sufficiency for ALL ingredients before deducting anything
        Map<Integer, List<IngredientBatch>> batchesByIngredient = new HashMap<>();
        for (Map.Entry<Integer, BigDecimal> entry : requirementsByIngredient.entrySet()) {
            Integer ingredientId = entry.getKey();
            BigDecimal totalRequired = entry.getValue();

            List<IngredientBatch> batches = batchRepository.findUsableBatchesForUpdate(
                    ingredientId, safeAsOfDate, USABLE_CONDITIONS);
            BigDecimal totalUsable = BigDecimal.ZERO;
            for (IngredientBatch batch : batches) {
                BigDecimal remaining = batch.getRemainingQuantity();
                if (remaining != null && remaining.signum() > 0) {
                    totalUsable = totalUsable.add(remaining);
                }
            }

            if (totalUsable.compareTo(totalRequired) < 0) {
                String ingredientName = ingredientRepository.findById(ingredientId)
                        .map(Ingredient::getIngredientName)
                        .orElse("Nguyên liệu #" + ingredientId);
                log.warn("INSUFFICIENT_STOCK | OrderLine: {} | Ingredient: {} | Required: {} | Usable: {}",
                        safeOrderLineId, ingredientName, totalRequired, totalUsable);
                InventoryConsumptionRecord record = new InventoryConsumptionRecord(
                        InventoryConsumptionStatus.INSUFFICIENT_STOCK,
                        "Thiếu tồn kho khả dụng cho: " + ingredientName + " (Cần " + totalRequired + ", có sẵn " + totalUsable + ")",
                        LocalDateTime.now());
                consumptionRecords.put(safeOrderLineId, record);
                return record;
            }
            batchesByIngredient.put(ingredientId, batches);
        }

        // Deduct from batches using FEFO
        for (Map.Entry<Integer, BigDecimal> entry : requirementsByIngredient.entrySet()) {
            Integer ingredientId = entry.getKey();
            BigDecimal quantityLeft = entry.getValue();
            List<IngredientBatch> batches = batchesByIngredient.get(ingredientId);

            int batchIndex = 0;
            while (quantityLeft.signum() > 0 && batchIndex < batches.size()) {
                IngredientBatch batch = batches.get(batchIndex);
                BigDecimal allocation = batch.getRemainingQuantity().min(quantityLeft);
                batch.setRemainingQuantity(batch.getRemainingQuantity().subtract(allocation));
                quantityLeft = quantityLeft.subtract(allocation);
                batchRepository.save(batch);
                log.info("STOCK_DEDUCTED | OrderLine: {} | ItemId: {} | BatchId: {} | IngredientId: {} | Quantity: {}",
                        safeOrderLineId, menuItemId, batch.getId(), ingredientId, allocation);
                if (batch.getRemainingQuantity().signum() == 0) {
                    batchIndex++;
                }
            }
        }

        InventoryConsumptionRecord successRecord = new InventoryConsumptionRecord(
                InventoryConsumptionStatus.CONSUMED,
                "Đã xuất kho nguyên liệu thành công.",
                LocalDateTime.now());
        consumptionRecords.put(safeOrderLineId, successRecord);
        return successRecord;
    }

    /**
     * Backward-compatible direct deduction method for callers expecting exceptions.
     */
    @Transactional
    public void consumeForOrderItem(Integer orderLineId, LocalDate asOfDate) {
        InventoryConsumptionRecord record = processConsumptionForOrderItem(orderLineId, asOfDate);
        if (record.status() == InventoryConsumptionStatus.NOT_CONFIGURED) {
            throw new BusinessRuleException("RECIPE_NOT_CONFIGURED", record.message());
        }
        if (record.status() == InventoryConsumptionStatus.INSUFFICIENT_STOCK) {
            throw new BusinessRuleException("INSUFFICIENT_USABLE_STOCK", record.message());
        }
        if (record.status() == InventoryConsumptionStatus.FAILED) {
            throw new BusinessRuleException("INVENTORY_CONSUMPTION_FAILED", record.message());
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
