package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.m4fnb.dto.response.FnbDashboardResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.IngredientDemandResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.KitchenOrderResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.MenuAvailabilityResponse;
import com.heavenstay.hswrms.m4fnb.entity.Ingredient;
import com.heavenstay.hswrms.m4fnb.entity.MenuItemIngredient;
import com.heavenstay.hswrms.m4fnb.repository.IngredientRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemIngredientRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class FnbDashboardService {
    private final MealOrderService mealOrderService;
    private final MenuItemIngredientRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final InventoryService inventoryService;
    private final MenuService menuService;

    public FnbDashboardService(MealOrderService mealOrderService,
            MenuItemIngredientRepository recipeRepository, IngredientRepository ingredientRepository,
            InventoryService inventoryService, MenuService menuService) {
        this.mealOrderService = mealOrderService;
        this.recipeRepository = recipeRepository;
        this.ingredientRepository = ingredientRepository;
        this.inventoryService = inventoryService;
        this.menuService = menuService;
    }

    public FnbDashboardResponse getDashboard(LocalDate businessDate) {
        List<KitchenOrderResponse> orders = mealOrderService.listKitchenOrders(businessDate);
        int retreatMealOrders = (int) orders.stream().filter(order -> "DAILY_MEAL".equals(order.orderType())).count();
        int alaCarteOrders = (int) orders.stream().filter(order -> "A_LA_CARTE".equals(order.orderType())).count();
        int pendingOrders = (int) orders.stream().filter(order -> "PENDING".equals(order.status())).count();
        int preparingOrders = (int) orders.stream().filter(order -> "PREPARING".equals(order.status())).count();
        int dietaryAlerts = (int) orders.stream().filter(order -> !order.dietaryProfileAvailable()
                || !order.allergies().isEmpty() || !order.dietaryPreferences().isEmpty()).count();

        List<IngredientDemandResponse> demand = calculateDemand(orders, businessDate);
        List<MenuAvailabilityResponse> availability = menuService.getAvailability(businessDate);
        FnbDashboardResponse.KpiSummary kpis = new FnbDashboardResponse.KpiSummary(
                orders.size(), retreatMealOrders, alaCarteOrders, pendingOrders, preparingOrders, dietaryAlerts);
        return new FnbDashboardResponse(businessDate, kpis, orders, demand, availability);
    }

    private List<IngredientDemandResponse> calculateDemand(List<KitchenOrderResponse> orders, LocalDate businessDate) {
        Map<Integer, BigDecimal> requiredByIngredient = new TreeMap<>();
        for (KitchenOrderResponse order : orders) {
            if (!"PENDING".equals(order.status()) && !"PREPARING".equals(order.status())) continue;
            List<Integer> menuItemIds = order.items().stream().map(line -> line.menuItemId()).distinct().toList();
            if (menuItemIds.isEmpty()) continue;
            Map<Integer, List<MenuItemIngredient>> recipeByItem = new HashMap<>();
            recipeRepository.findByMenuItemIdIn(menuItemIds).forEach(recipe ->
                    recipeByItem.computeIfAbsent(recipe.getMenuItemId(), ignored -> new ArrayList<>()).add(recipe));
            order.items().forEach(orderLine -> recipeByItem.getOrDefault(orderLine.menuItemId(), List.of())
                    .forEach(recipe -> requiredByIngredient.merge(recipe.getIngredientId(),
                            recipe.getQuantityPerServing().multiply(BigDecimal.valueOf(orderLine.quantity())), BigDecimal::add)));
        }
        if (requiredByIngredient.isEmpty()) return List.of();

        Map<Integer, Ingredient> ingredients = new LinkedHashMap<>();
        ingredientRepository.findAllById(requiredByIngredient.keySet())
                .forEach(ingredient -> ingredients.put(ingredient.getId(), ingredient));
        List<IngredientDemandResponse> result = new ArrayList<>();
        requiredByIngredient.forEach((ingredientId, required) -> {
            BigDecimal usable = inventoryService.getUsableQuantity(ingredientId, businessDate);
            BigDecimal shortfall = required.subtract(usable).max(BigDecimal.ZERO);
            Ingredient ingredient = ingredients.get(ingredientId);
            result.add(new IngredientDemandResponse(ingredientId,
                    ingredient == null ? "Unknown ingredient" : ingredient.getIngredientName(),
                    ingredient == null ? null : ingredient.getUnitOfMeasure(),
                    required, usable, shortfall, shortfall.signum() > 0 ? "SHORTAGE" : "COVERED"));
        });
        return result;
    }
}
