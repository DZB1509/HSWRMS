package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateMenuItemRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.RecipeLineRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.ReplaceRecipeRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.MenuAvailabilityResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.MenuItemResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.RecipeLineResponse;
import com.heavenstay.hswrms.m4fnb.entity.Ingredient;
import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import com.heavenstay.hswrms.m4fnb.entity.MenuItemIngredient;
import com.heavenstay.hswrms.m4fnb.integration.DietaryProfilePort;
import com.heavenstay.hswrms.m4fnb.mapper.MenuItemMapper;
import com.heavenstay.hswrms.m4fnb.repository.IngredientRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemIngredientRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MenuService {
    private static final Set<String> AVAILABILITY_STATES = Set.of("AVAILABLE", "UNAVAILABLE");

    private final MenuItemRepository menuItemRepository;
    private final IngredientRepository ingredientRepository;
    private final MenuItemIngredientRepository recipeRepository;
    private final InventoryService inventoryService;
    private final MenuItemMapper menuItemMapper;
    private final ObjectProvider<DietaryProfilePort> dietaryProfilePortProvider;

    public MenuService(MenuItemRepository menuItemRepository, IngredientRepository ingredientRepository,
            MenuItemIngredientRepository recipeRepository, InventoryService inventoryService,
            MenuItemMapper menuItemMapper, ObjectProvider<DietaryProfilePort> dietaryProfilePortProvider) {
        this.menuItemRepository = menuItemRepository;
        this.ingredientRepository = ingredientRepository;
        this.recipeRepository = recipeRepository;
        this.inventoryService = inventoryService;
        this.menuItemMapper = menuItemMapper;
        this.dietaryProfilePortProvider = dietaryProfilePortProvider;
    }

    @Transactional
    public MenuItemResponse createMenuItem(CreateMenuItemRequest request) {
        validateAvailability(request.availabilityStatus());
        if (menuItemRepository.existsByItemNameIgnoreCase(request.itemName().trim())) {
            throw new ConflictException("MENU_ITEM_NAME_EXISTS", "A menu item with this name already exists.");
        }
        MenuItem item = menuItemRepository.save(menuItemMapper.toEntity(request));
        return toResponse(item, LocalDate.now(), List.of(), null);
    }

    @Transactional
    public MenuItemResponse updateMenuItem(Integer menuItemId, CreateMenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", menuItemId));
        validateAvailability(request.availabilityStatus());
        boolean duplicateName = menuItemRepository.findAll().stream()
                .anyMatch(existing -> !existing.getId().equals(menuItemId)
                        && existing.getItemName().equalsIgnoreCase(request.itemName().trim()));
        if (duplicateName) {
            throw new ConflictException("MENU_ITEM_NAME_EXISTS", "A menu item with this name already exists.");
        }
        MenuItem replacement = menuItemMapper.toEntity(request);
        item.setItemName(replacement.getItemName());
        item.setCategory(replacement.getCategory());
        item.setMealType(replacement.getMealType());
        item.setPrice(replacement.getPrice());
        item.setDietaryTags(replacement.getDietaryTags());
        item.setAllergenInformation(replacement.getAllergenInformation());
        item.setAvailabilityStatus(replacement.getAvailabilityStatus());
        return toResponse(menuItemRepository.save(item), LocalDate.now(), List.of(), null);
    }

    public List<MenuItemResponse> getManagementMenu(LocalDate asOfDate) {
        List<MenuItem> items = menuItemRepository.findAllByOrderByItemNameAsc();
        List<MenuItemIngredient> recipes = recipesForMenu(items);
        return items.stream().map(item -> toResponse(item, asOfDate,
                recipesFor(item.getId(), recipes), null)).toList();
    }

    public List<MenuItemResponse> getPersonalizedMenu(Integer customerUserId, LocalDate asOfDate) {
        DietaryProfilePort profilePort = dietaryProfilePortProvider.getIfAvailable();
        if (profilePort == null) {
            throw new BusinessRuleException("M1_DIETARY_INTEGRATION_UNAVAILABLE",
                    "The personalized menu is unavailable until the M1 dietary profile adapter is configured.");
        }
        DietaryProfilePort.FoodProfileProjection profile = profilePort.getFoodProfileForUser(customerUserId);
        if (profile == null) {
            throw new BusinessRuleException("M1_DIETARY_PROFILE_UNAVAILABLE",
                    "The personalized menu is unavailable until M1 provides the customer's food profile.");
        }
        List<MenuItem> items = menuItemRepository.findByAvailabilityStatusOrderByItemNameAsc("AVAILABLE");
        List<MenuItemIngredient> recipes = recipesForMenu(items);
        return items.stream()
                .filter(item -> !conflictsWithFoodProfile(item, profile))
                .map(item -> toResponse(item, asOfDate, recipesFor(item.getId(), recipes), null))
                .filter(MenuItemResponse::available)
                .toList();
    }

    @Transactional
    public List<RecipeLineResponse> replaceRecipe(Integer menuItemId, ReplaceRecipeRequest request) {
        menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", menuItemId));
        Set<Integer> ingredientIds = new HashSet<>();
        for (RecipeLineRequest line : request.ingredients()) {
            if (!ingredientIds.add(line.ingredientId())) {
                throw new BusinessRuleException("DUPLICATE_RECIPE_INGREDIENT",
                        "Each ingredient may appear once in a menu item's recipe.");
            }
            if (!ingredientRepository.existsById(line.ingredientId())) {
                throw new ResourceNotFoundException("Ingredient", "id", line.ingredientId());
            }
        }
        recipeRepository.deleteByMenuItemId(menuItemId);
        List<MenuItemIngredient> recipe = request.ingredients().stream()
                .map(line -> new MenuItemIngredient(menuItemId, line.ingredientId(), line.quantityPerServing()))
                .toList();
        recipeRepository.saveAll(recipe);
        return toRecipeResponse(recipe);
    }

    public List<RecipeLineResponse> getRecipe(Integer menuItemId) {
        if (!menuItemRepository.existsById(menuItemId)) {
            throw new ResourceNotFoundException("MenuItem", "id", menuItemId);
        }
        return toRecipeResponse(recipeRepository.findByMenuItemIdOrderByIngredientIdAsc(menuItemId));
    }

    public List<MenuAvailabilityResponse> getAvailability(LocalDate asOfDate) {
        List<MenuItem> items = menuItemRepository.findAllByOrderByItemNameAsc();
        List<MenuItemIngredient> recipes = recipesForMenu(items);
        return items.stream().map(item -> availability(item, recipesFor(item.getId(), recipes), asOfDate)).toList();
    }

    public MenuAvailabilityResponse availability(MenuItem item, Collection<MenuItemIngredient> recipe, LocalDate asOfDate) {
        if (recipe.isEmpty()) {
            return new MenuAvailabilityResponse(item.getId(), item.getItemName(), false, false, 0,
                    "Recipe is not configured.");
        }
        int servings = recipe.stream().mapToInt(line -> inventoryService.getAvailableServings(
                line.getIngredientId(), line.getQuantityPerServing(), asOfDate)).min().orElse(0);
        boolean manuallyAvailable = "AVAILABLE".equalsIgnoreCase(item.getAvailabilityStatus());
        boolean available = manuallyAvailable && servings > 0;
        String reason = !manuallyAvailable ? "Menu item is manually unavailable."
                : servings == 0 ? "No complete serving can be prepared from usable stock." : "Available from usable stock.";
        return new MenuAvailabilityResponse(item.getId(), item.getItemName(), true, available, servings, reason);
    }

    public boolean conflictsWithFoodProfile(MenuItem item, DietaryProfilePort.FoodProfileProjection profile) {
        return profile != null && (hasAllergenConflict(item, profile.foodAllergies())
                || hasDietaryConflict(item, profile.dietaryPreferences()));
    }

    private MenuItemResponse toResponse(MenuItem item, LocalDate date,
            Collection<MenuItemIngredient> recipe, DietaryProfilePort.FoodProfileProjection profile) {
        MenuAvailabilityResponse availability = availability(item, recipe, date);
        boolean warning = profile != null && hasAllergenConflict(item, profile.foodAllergies());
        return menuItemMapper.toResponse(item, availability.available(), availability.servingsAvailable(), warning);
    }

    private List<RecipeLineResponse> toRecipeResponse(Collection<MenuItemIngredient> recipe) {
        Map<Integer, Ingredient> ingredients = new HashMap<>();
        ingredientRepository.findAllById(recipe.stream().map(MenuItemIngredient::getIngredientId).toList())
                .forEach(ingredient -> ingredients.put(ingredient.getId(), ingredient));
        return recipe.stream().map(line -> new RecipeLineResponse(line.getIngredientId(),
                ingredients.containsKey(line.getIngredientId()) ? ingredients.get(line.getIngredientId()).getIngredientName() : "Unknown ingredient",
                ingredients.containsKey(line.getIngredientId()) ? ingredients.get(line.getIngredientId()).getUnitOfMeasure() : null,
                line.getQuantityPerServing())).toList();
    }

    private boolean hasAllergenConflict(MenuItem item, List<String> allergies) {
        if (item.getAllergenInformation() == null || allergies == null) return false;
        Set<String> itemAllergens = allergenTerms(item.getAllergenInformation());
        return allergies.stream().filter(value -> value != null && !value.isBlank())
                .flatMap(value -> allergenTerms(value).stream()).anyMatch(itemAllergens::contains);
    }

    private boolean hasDietaryConflict(MenuItem item, List<String> preferences) {
        String tags = compact(item.getDietaryTags());
        for (String preference : preferences == null ? List.<String>of() : preferences) {
            String normalizedPreference = compact(preference);
            if (normalizedPreference.contains("vegan") && !tags.contains("vegan")) return true;
            if (normalizedPreference.contains("vegetarian")
                    && !(tags.contains("vegetarian") || tags.contains("vegan"))) return true;
            if (normalizedPreference.contains("glutenfree") && !tags.contains("glutenfree")) return true;
            if (normalizedPreference.contains("dairyfree") && !tags.contains("dairyfree")) return true;
            if (normalizedPreference.contains("pescatarian")
                    && !(tags.contains("pescatarian") || tags.contains("vegetarian") || tags.contains("vegan"))) return true;
            if (normalizedPreference.contains("keto") && !tags.contains("keto")) return true;
        }
        return false;
    }

    private Set<String> words(String value) {
        return java.util.Arrays.stream(value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim().split("\\s+"))
                .filter(word -> !word.isBlank())
                .map(word -> word.endsWith("s") && word.length() > 3 ? word.substring(0, word.length() - 1) : word)
                .collect(Collectors.toSet());
    }

    private Set<String> allergenTerms(String value) {
        return words(value).stream().map(word -> switch (word) {
            case "peanut", "almond", "cashew", "walnut", "hazelnut", "pistachio", "pecan", "macadamia", "nut" -> "nut";
            case "milk", "lactose", "dairy" -> "dairy";
            case "shrimp", "prawn", "crab", "lobster", "shellfish" -> "shellfish";
            case "soya", "soy" -> "soy";
            case "egg" -> "egg";
            case "wheat", "barley", "rye", "gluten" -> "gluten";
            case "fish" -> "fish";
            default -> word;
        }).collect(Collectors.toSet());
    }

    private List<Integer> ids(List<MenuItem> items) { return items.stream().map(MenuItem::getId).toList(); }

    private List<MenuItemIngredient> recipesForMenu(List<MenuItem> items) {
        List<Integer> itemIds = ids(items);
        return itemIds.isEmpty() ? List.of() : recipeRepository.findByMenuItemIdIn(itemIds);
    }

    private String compact(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private List<MenuItemIngredient> recipesFor(Integer menuItemId, List<MenuItemIngredient> allRecipes) {
        return allRecipes.stream().filter(line -> line.getMenuItemId().equals(menuItemId)).toList();
    }

    private void validateAvailability(String rawStatus) {
        if (rawStatus == null || !AVAILABILITY_STATES.contains(rawStatus.trim().toUpperCase(Locale.ROOT))) {
            throw new BusinessRuleException("INVALID_MENU_AVAILABILITY", "Availability must be AVAILABLE or UNAVAILABLE.");
        }
    }
}
