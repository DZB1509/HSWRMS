package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m4fnb.config.IngredientUnitRegistry;
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

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 25010 MAINTAINABILITY & TRACEABILITY STANDARD]
// ----------------------------------------------------------------------------
// Requirements Ref   : UC19 / UC20 / BF-04 (Fulfill Meal Orders & Dietary F&B Management)
// Business Rule Ref  : BR-FNB-02 (Kitchen Preparation & Allergy Minimization)
// Database Entity    : INGREDIENT, INGREDIENT_BATCH, MENU_ITEM_INGREDIENT, MEAL_ORDER
// Compliance Standard: Nghị định 13/2023/NĐ-CP & 356/2025/NĐ-CP (Personal Data Protection PII)
// Architecture Layer : SERVICE LAYER -> Business Logic & Demand Calculation
// International Standard: Oracle Java Code Conventions & Google Java Style Guide
// ============================================================================
@Service
@Transactional(readOnly = true)
public class FnbDashboardService {
    private final MealOrderService mealOrderService;
    private final MenuItemIngredientRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final InventoryService inventoryService;
    private final MenuService menuService;
    private final IngredientUnitRegistry unitRegistry;

    public FnbDashboardService(MealOrderService mealOrderService,
            MenuItemIngredientRepository recipeRepository, IngredientRepository ingredientRepository,
            InventoryService inventoryService, MenuService menuService, IngredientUnitRegistry unitRegistry) {
        this.mealOrderService = mealOrderService;
        this.recipeRepository = recipeRepository;
        this.ingredientRepository = ingredientRepository;
        this.inventoryService = inventoryService;
        this.menuService = menuService;
        this.unitRegistry = unitRegistry;
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
        if (orders != null) {
            for (KitchenOrderResponse order : orders) {
                if (!"PENDING".equals(order.status()) && !"PREPARING".equals(order.status())) continue;
                List<Integer> menuItemIds = order.items().stream().map(line -> line.menuItemId()).distinct().toList();
                if (menuItemIds.isEmpty()) continue;
                Map<Integer, List<MenuItemIngredient>> recipeByItem = new HashMap<>();
                recipeRepository.findByMenuItemIdIn(menuItemIds).forEach(recipe ->
                        recipeByItem.computeIfAbsent(recipe.getMenuItemId(), ignored -> new ArrayList<>()).add(recipe));
                order.items().stream()
                        .filter(orderLine -> "PENDING".equals(orderLine.preparationStatus())
                                || "PREPARING".equals(orderLine.preparationStatus()))
                        .forEach(orderLine -> recipeByItem.getOrDefault(orderLine.menuItemId(), List.of())
                                .forEach(recipe -> {
                            Integer ingredientId = recipe.getIngredientId();
                            if (ingredientId == null || recipe.getRequiredQuantity() == null
                                    || recipe.getRequiredQuantity().signum() <= 0
                                    || orderLine.quantity() == null || orderLine.quantity() <= 0) {
                                throw new BusinessRuleException("INVALID_MEAL_ORDER_DEMAND",
                                        "Meal order recipe demand is incomplete or invalid.");
                            }
                            BigDecimal lineDemand = recipe.getRequiredQuantity()
                                    .multiply(BigDecimal.valueOf(orderLine.quantity()));
                            BigDecimal currentDemand = requiredByIngredient.get(ingredientId);
                            requiredByIngredient.put(ingredientId, currentDemand == null
                                    ? lineDemand : currentDemand.add(lineDemand));
                        }));
            }
        }

        // Load ingredient catalog
        Map<Integer, Ingredient> ingredients = new LinkedHashMap<>();
        List<Ingredient> allCatalogIngredients = ingredientRepository.findAll();
        if (allCatalogIngredients != null && !allCatalogIngredients.isEmpty()) {
            for (Ingredient ing : allCatalogIngredients) {
                if (ing.getId() != null) {
                    ingredients.put(ing.getId(), ing);
                }
            }
        }

        // Support mock environments where only findAllById was stubbed
        if (!requiredByIngredient.isEmpty()) {
            List<Integer> missingIds = requiredByIngredient.keySet().stream()
                    .filter(id -> !ingredients.containsKey(id))
                    .toList();
            if (!missingIds.isEmpty()) {
                ingredientRepository.findAllById(missingIds)
                        .forEach(ing -> ingredients.put(ing.getId(), ing));
            }
        }

        if (ingredients.isEmpty() && requiredByIngredient.isEmpty()) {
            return List.of();
        }

        java.util.Set<Integer> allTargetIngredientIds = new java.util.TreeSet<>();
        allTargetIngredientIds.addAll(ingredients.keySet());
        allTargetIngredientIds.addAll(requiredByIngredient.keySet());

        List<IngredientDemandResponse> result = new ArrayList<>();
        for (Integer ingredientId : allTargetIngredientIds) {
            Ingredient ingredient = ingredients.get(ingredientId);
            BigDecimal required = requiredByIngredient.getOrDefault(ingredientId, BigDecimal.ZERO);
            BigDecimal usable = inventoryService.getUsableQuantity(ingredientId, businessDate);
            BigDecimal shortfall = required.subtract(usable).max(BigDecimal.ZERO);
            String rawName = ingredient != null ? ingredient.getIngredientName() : "Nguyên liệu #" + ingredientId;
            String name = com.heavenstay.hswrms.common.util.TextEncodingSanitizer.sanitize(rawName);
            String unit = ingredient != null ? unitRegistry.unitFor(ingredient) : "g";

            result.add(new IngredientDemandResponse(ingredientId,
                    name, unit, required, usable, shortfall,
                    shortfall.signum() > 0 ? "SHORTAGE" : "COVERED"));
        }
        return result;
    }
}
