package com.heavenstay.hswrms.m4fnb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m4fnb.config.IngredientUnitRegistry;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateIngredientBatchRequest;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class InventoryServiceTest {

    private IngredientRepository ingredientRepository;
    private IngredientBatchRepository batchRepository;
    private MenuItemIngredientRepository recipeRepository;
    private MealOrderItemRepository orderItemRepository;
    private InventoryMapper inventoryMapper;
    private IngredientUnitRegistry unitRegistry;
    private InventoryService inventoryService;

    @BeforeEach
    void setUp() {
        ingredientRepository = mock(IngredientRepository.class);
        batchRepository = mock(IngredientBatchRepository.class);
        recipeRepository = mock(MenuItemIngredientRepository.class);
        orderItemRepository = mock(MealOrderItemRepository.class);
        unitRegistry = new IngredientUnitRegistry();
        inventoryMapper = new InventoryMapper(unitRegistry);

        inventoryService = new InventoryService(
                ingredientRepository,
                batchRepository,
                recipeRepository,
                orderItemRepository,
                inventoryMapper,
                unitRegistry
        );
    }

    @Test
    @DisplayName("getUsableQuantity aggregates only usable condition batches")
    void getUsableQuantityAggregatesUsableBatches() {
        LocalDate asOfDate = LocalDate.of(2026, 10, 18);
        Ingredient ingredient = mock(Ingredient.class);
        when(ingredient.getId()).thenReturn(10);
        when(ingredient.getIngredientName()).thenReturn("Yến Mạch Cán Vỡ Hữu Cơ");
        when(ingredientRepository.findById(10)).thenReturn(Optional.of(ingredient));

        IngredientBatch batch1 = mock(IngredientBatch.class);
        when(batch1.getRemainingQuantity()).thenReturn(new BigDecimal("3.500"));

        IngredientBatch batch2 = mock(IngredientBatch.class);
        when(batch2.getRemainingQuantity()).thenReturn(new BigDecimal("2.250"));

        when(batchRepository.findUsableBatches(eq(10), eq(asOfDate), any(Set.class)))
                .thenReturn(List.of(batch1, batch2));

        BigDecimal total = inventoryService.getUsableQuantity(10, asOfDate);

        assertEquals(new BigDecimal("5.750"), total);
    }

    @Test
    @DisplayName("getAvailableServings divides usable quantity by recipe required quantity")
    void getAvailableServingsCalculatesCorrectIntegralServings() {
        LocalDate asOfDate = LocalDate.of(2026, 10, 18);
        Ingredient ingredient = mock(Ingredient.class);
        when(ingredient.getId()).thenReturn(10);
        when(ingredient.getIngredientName()).thenReturn("Yến Mạch Cán Vỡ Hữu Cơ");
        when(ingredientRepository.findById(10)).thenReturn(Optional.of(ingredient));

        IngredientBatch batch1 = mock(IngredientBatch.class);
        when(batch1.getRemainingQuantity()).thenReturn(new BigDecimal("5.500"));

        when(batchRepository.findUsableBatches(eq(10), eq(asOfDate), any(Set.class)))
                .thenReturn(List.of(batch1));

        int servings = inventoryService.getAvailableServings(10, new BigDecimal("0.500"), asOfDate);

        assertEquals(11, servings);
    }

    @Test
    @DisplayName("consumeForOrderItem scales recipe by servings and deducts batches in FEFO order")
    void consumeForOrderItemDeductsBatchesFefo() {
        LocalDate asOfDate = LocalDate.of(2026, 10, 18);
        Integer orderLineId = 501;
        Integer menuItemId = 1;
        int orderQuantity = 4; // 4 servings

        MealOrderItem orderLine = mock(MealOrderItem.class);
        when(orderLine.getId()).thenReturn(orderLineId);
        when(orderLine.getMenuItemId()).thenReturn(menuItemId);
        when(orderLine.getQuantity()).thenReturn(orderQuantity);
        when(orderItemRepository.findById(orderLineId)).thenReturn(Optional.of(orderLine));

        // Recipe: 0.250 kg per serving -> 4 servings = 1.000 kg required
        MenuItemIngredient recipeLine = new MenuItemIngredient(menuItemId, 10, new BigDecimal("0.250"));
        when(recipeRepository.findByMenuItemIdOrderByIngredientIdAsc(menuItemId))
                .thenReturn(List.of(recipeLine));

        Ingredient ingredient = mock(Ingredient.class);
        when(ingredient.getId()).thenReturn(10);
        when(ingredient.getIngredientName()).thenReturn("Yến Mạch Cán Vỡ Hữu Cơ");
        when(ingredientRepository.findById(10)).thenReturn(Optional.of(ingredient));

        // Batch 1 (earlier expiry): 0.400 kg remaining
        IngredientBatch batch1 = new IngredientBatch(10, asOfDate.minusDays(5), asOfDate.plusDays(2),
                new BigDecimal("0.400"), "NEAR_EXPIRY");
        // Batch 2 (later expiry): 1.500 kg remaining
        IngredientBatch batch2 = new IngredientBatch(10, asOfDate.minusDays(2), asOfDate.plusDays(10),
                new BigDecimal("1.500"), "FRESH");

        when(batchRepository.findUsableBatchesForUpdate(eq(10), eq(asOfDate), any(Set.class)))
                .thenReturn(List.of(batch1, batch2));

        inventoryService.consumeForOrderItem(orderLineId, asOfDate);

        // Batch 1 should be completely consumed (0 remaining)
        assertEquals(0, batch1.getRemainingQuantity().compareTo(BigDecimal.ZERO));
        // Batch 2 should be partially consumed (1.500 - 0.600 = 0.900 remaining)
        assertEquals(0, new BigDecimal("0.900").compareTo(batch2.getRemainingQuantity()));
    }

    @Test
    @DisplayName("consumeForOrderItem throws INSUFFICIENT_USABLE_STOCK when remaining is less than required")
    void consumeForOrderItemThrowsWhenStockInsufficient() {
        LocalDate asOfDate = LocalDate.of(2026, 10, 18);
        Integer orderLineId = 502;
        Integer menuItemId = 1;
        int orderQuantity = 10; // 10 servings * 0.250 = 2.500 kg

        MealOrderItem orderLine = mock(MealOrderItem.class);
        when(orderLine.getId()).thenReturn(orderLineId);
        when(orderLine.getMenuItemId()).thenReturn(menuItemId);
        when(orderLine.getQuantity()).thenReturn(orderQuantity);
        when(orderItemRepository.findById(orderLineId)).thenReturn(Optional.of(orderLine));

        MenuItemIngredient recipeLine = new MenuItemIngredient(menuItemId, 10, new BigDecimal("0.250"));
        when(recipeRepository.findByMenuItemIdOrderByIngredientIdAsc(menuItemId))
                .thenReturn(List.of(recipeLine));

        Ingredient ingredient = mock(Ingredient.class);
        when(ingredient.getId()).thenReturn(10);
        when(ingredient.getIngredientName()).thenReturn("Yến Mạch Cán Vỡ Hữu Cơ");
        when(ingredientRepository.findById(10)).thenReturn(Optional.of(ingredient));

        // Usable stock is only 1.200 kg
        IngredientBatch batch1 = new IngredientBatch(10, asOfDate.minusDays(2), asOfDate.plusDays(10),
                new BigDecimal("1.200"), "FRESH");

        when(batchRepository.findUsableBatchesForUpdate(eq(10), eq(asOfDate), any(Set.class)))
                .thenReturn(List.of(batch1));

        BusinessRuleException exception = assertThrows(BusinessRuleException.class, () ->
                inventoryService.consumeForOrderItem(orderLineId, asOfDate));

        assertEquals("INSUFFICIENT_USABLE_STOCK", exception.getErrorCode());
    }

    @Test
    @DisplayName("receiveBatch rejects expiration date before received date")
    void receiveBatchRejectsInvalidDates() {
        LocalDate received = LocalDate.of(2026, 10, 18);
        LocalDate expired = LocalDate.of(2026, 10, 10); // before received!

        Ingredient ingredient = mock(Ingredient.class);
        when(ingredient.getId()).thenReturn(10);
        when(ingredient.getIngredientName()).thenReturn("Yến Mạch");
        when(ingredientRepository.findById(10)).thenReturn(Optional.of(ingredient));

        CreateIngredientBatchRequest request = new CreateIngredientBatchRequest(
                10, received, expired, new BigDecimal("10.000"), "FRESH");

        BusinessRuleException exception = assertThrows(BusinessRuleException.class, () ->
                inventoryService.receiveBatch(request));

        assertEquals("INVALID_BATCH_DATES", exception.getErrorCode());
    }
}
