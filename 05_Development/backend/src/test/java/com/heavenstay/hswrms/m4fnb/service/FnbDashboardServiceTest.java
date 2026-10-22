package com.heavenstay.hswrms.m4fnb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.heavenstay.hswrms.m4fnb.config.IngredientUnitRegistry;
import com.heavenstay.hswrms.m4fnb.dto.response.IngredientDemandResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.KitchenOrderLineResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.KitchenOrderResponse;
import com.heavenstay.hswrms.m4fnb.entity.Ingredient;
import com.heavenstay.hswrms.m4fnb.entity.MenuItemIngredient;
import com.heavenstay.hswrms.m4fnb.repository.IngredientRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemIngredientRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class FnbDashboardServiceTest {
    @Test
    @SuppressWarnings("null")
    void dashboardDemandIncludesOnlyUnpreparedItemsAndUsesRequiredQuantityTimesServingCount() {
        LocalDate businessDate = LocalDate.of(2026, 10, 13);
        MealOrderService orderService = mock(MealOrderService.class);
        MenuItemIngredientRepository recipeRepository = mock(MenuItemIngredientRepository.class);
        IngredientRepository ingredientRepository = mock(IngredientRepository.class);
        InventoryService inventoryService = mock(InventoryService.class);
        MenuService menuService = mock(MenuService.class);
        IngredientUnitRegistry unitRegistry = new IngredientUnitRegistry();
        unitRegistry.setUnits(Map.of("Rice", "g"));
        unitRegistry.validateAndNormalize();

        KitchenOrderResponse order = new KitchenOrderResponse(10, 2, "Guest", "12", businessDate,
                "LUNCH", "DAILY_MEAL", "PREPARING", null, true, List.of(), List.of(), List.of(
                        new KitchenOrderLineResponse(100, 5, "Rice bowl", 3, "PENDING"),
                        new KitchenOrderLineResponse(101, 5, "Rice bowl", 4, "READY")));
        when(orderService.listKitchenOrders(businessDate)).thenReturn(List.of(order));
        when(recipeRepository.findByMenuItemIdIn(List.of(5)))
                .thenReturn(List.of(new MenuItemIngredient(5, 7, new BigDecimal("2.500"))));
        Ingredient rice = mock(Ingredient.class);
        when(rice.getId()).thenReturn(7);
        when(rice.getIngredientName()).thenReturn("Rice");
        when(ingredientRepository.findAllById(List.of(7))).thenReturn(List.of(rice));
        when(inventoryService.getUsableQuantity(7, businessDate)).thenReturn(new BigDecimal("10.000"));

        FnbDashboardService service = new FnbDashboardService(orderService, recipeRepository,
                ingredientRepository, inventoryService, menuService, unitRegistry);

        List<IngredientDemandResponse> demand = service.getDashboard(businessDate).ingredientDemand();

        assertEquals(1, demand.size());
        assertEquals(0, new BigDecimal("7.500").compareTo(demand.get(0).requiredQuantity()));
        assertEquals(0, new BigDecimal("10.000").compareTo(demand.get(0).usableQuantity()));
        assertEquals(0, BigDecimal.ZERO.compareTo(demand.get(0).shortfall()));
        assertEquals("g", demand.get(0).unitOfMeasure());
    }

    @Test
    @org.junit.jupiter.api.DisplayName("Dashboard returns empty demand when there are no recipes or ingredients, without fabricating data")
    void dashboardReturnsEmptyDemandWhenNoRecipesOrIngredients() {
        LocalDate businessDate = LocalDate.of(2026, 10, 13);
        MealOrderService orderService = mock(MealOrderService.class);
        MenuItemIngredientRepository recipeRepository = mock(MenuItemIngredientRepository.class);
        IngredientRepository ingredientRepository = mock(IngredientRepository.class);
        InventoryService inventoryService = mock(InventoryService.class);
        MenuService menuService = mock(MenuService.class);
        IngredientUnitRegistry unitRegistry = new IngredientUnitRegistry();

        when(orderService.listKitchenOrders(businessDate)).thenReturn(List.of());
        when(ingredientRepository.findAll()).thenReturn(List.of());
        when(menuService.getAvailability(businessDate)).thenReturn(List.of());

        FnbDashboardService service = new FnbDashboardService(orderService, recipeRepository,
                ingredientRepository, inventoryService, menuService, unitRegistry);

        var dashboard = service.getDashboard(businessDate);

        assertEquals(0, dashboard.ingredientDemand().size());
        assertEquals(0, dashboard.menuAvailability().size());
    }
}
