package com.heavenstay.hswrms.m4fnb.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.heavenstay.hswrms.m4fnb.config.IngredientUnitRegistry;
import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import com.heavenstay.hswrms.m4fnb.integration.DietaryProfilePort;
import com.heavenstay.hswrms.m4fnb.mapper.MenuItemMapper;
import com.heavenstay.hswrms.m4fnb.repository.IngredientRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemIngredientRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

class MenuServiceTest {

    private MenuService menuService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        MenuItemRepository menuItemRepository = mock(MenuItemRepository.class);
        IngredientRepository ingredientRepository = mock(IngredientRepository.class);
        MenuItemIngredientRepository recipeRepository = mock(MenuItemIngredientRepository.class);
        InventoryService inventoryService = mock(InventoryService.class);
        MenuItemMapper menuItemMapper = new MenuItemMapper();
        IngredientUnitRegistry unitRegistry = new IngredientUnitRegistry();
        ObjectProvider<DietaryProfilePort> dietaryProfilePortProvider = mock(ObjectProvider.class);

        menuService = new MenuService(
                menuItemRepository,
                ingredientRepository,
                recipeRepository,
                inventoryService,
                menuItemMapper,
                unitRegistry,
                dietaryProfilePortProvider
        );
    }

    @Test
    @DisplayName("conflictsWithFoodProfile detects allergen conflict with English and Vietnamese diacritics")
    void detectsAllergenConflictsBilingual() {
        MenuItem seafoodItem = new MenuItem(
                "Súp Tôm Hùm Nấm Tuyết",
                "STARTER",
                "LUNCH",
                new BigDecimal("150000"),
                "pescatarian, gluten_free",
                "Tôm, cua, giáp xác (Shellfish)",
                "AVAILABLE"
        );

        // Conflict when customer is allergic to shellfish / hải sản
        DietaryProfilePort.FoodProfileProjection profile1 = new DietaryProfilePort.FoodProfileProjection(
                List.of("Tôm", "Hải sản"),
                List.of("Pescatarian")
        );
        assertTrue(menuService.conflictsWithFoodProfile(seafoodItem, profile1));

        DietaryProfilePort.FoodProfileProjection profile2 = new DietaryProfilePort.FoodProfileProjection(
                List.of("Crustaceans & Shellfish"),
                List.of("Pescatarian")
        );
        assertTrue(menuService.conflictsWithFoodProfile(seafoodItem, profile2));

        // No conflict when customer is only allergic to peanuts
        DietaryProfilePort.FoodProfileProjection profile3 = new DietaryProfilePort.FoodProfileProjection(
                List.of("Đậu phộng (Peanuts)"),
                List.of("Pescatarian")
        );
        assertFalse(menuService.conflictsWithFoodProfile(seafoodItem, profile3));
    }

    @Test
    @DisplayName("conflictsWithFoodProfile filters out non-vegan or non-gluten-free dishes for dietary restrictions")
    void detectsDietaryPreferenceConflicts() {
        MenuItem beefItem = new MenuItem(
                "Thăn Bò Áp Chảo",
                "MAIN",
                "DINNER",
                new BigDecimal("250000"),
                "keto",
                "None",
                "AVAILABLE"
        );

        // Vegan customer cannot eat beef
        DietaryProfilePort.FoodProfileProjection veganProfile = new DietaryProfilePort.FoodProfileProjection(
                List.of(),
                List.of("Vegan")
        );
        assertTrue(menuService.conflictsWithFoodProfile(beefItem, veganProfile));

        // Vegetarian customer cannot eat beef
        DietaryProfilePort.FoodProfileProjection vegetarianProfile = new DietaryProfilePort.FoodProfileProjection(
                List.of(),
                List.of("Ăn chay (Vegetarian)")
        );
        assertTrue(menuService.conflictsWithFoodProfile(beefItem, vegetarianProfile));

        // Vegan dish matches vegan and vegetarian
        MenuItem saladItem = new MenuItem(
                "Salad Hạt Quinoa Bơ Tươi",
                "STARTER",
                "LUNCH",
                new BigDecimal("95000"),
                "vegan, vegetarian, gluten_free, dairy_free",
                "None",
                "AVAILABLE"
        );
        assertFalse(menuService.conflictsWithFoodProfile(saladItem, veganProfile));
        assertFalse(menuService.conflictsWithFoodProfile(saladItem, vegetarianProfile));
    }
}
