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
import com.heavenstay.hswrms.m4fnb.config.IngredientUnitRegistry;
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
    private final IngredientUnitRegistry unitRegistry;
    private final ObjectProvider<DietaryProfilePort> dietaryProfilePortProvider;

    public MenuService(MenuItemRepository menuItemRepository, IngredientRepository ingredientRepository,
            MenuItemIngredientRepository recipeRepository, InventoryService inventoryService,
            MenuItemMapper menuItemMapper, IngredientUnitRegistry unitRegistry,
            ObjectProvider<DietaryProfilePort> dietaryProfilePortProvider) {
        this.menuItemRepository = menuItemRepository;
        this.ingredientRepository = ingredientRepository;
        this.recipeRepository = recipeRepository;
        this.inventoryService = inventoryService;
        this.menuItemMapper = menuItemMapper;
        this.unitRegistry = unitRegistry;
        this.dietaryProfilePortProvider = dietaryProfilePortProvider;
    }

    @Transactional
    public MenuItemResponse createMenuItem(CreateMenuItemRequest request) {
        validateAvailability(request.availabilityStatus());
        if (menuItemRepository.existsByItemNameIgnoreCase(request.itemName().trim())) {
            throw new ConflictException("MENU_ITEM_NAME_EXISTS", "A menu item with this name already exists.");
        }
        MenuItem mappedItem = menuItemMapper.toEntity(request);
        if (mappedItem == null) {
            throw new BusinessRuleException("MENU_ITEM_MAPPING_FAILED",
                    "The menu item request could not be mapped to an entity.");
        }
        MenuItem savedItem = menuItemRepository.save(mappedItem);
        return toResponse(savedItem, LocalDate.now(), List.of(), null);
    }

    @Transactional
    public MenuItemResponse updateMenuItem(Integer menuItemId, CreateMenuItemRequest request) {
        if (menuItemId == null || request == null) {
            throw new BusinessRuleException("INVALID_MENU_UPDATE", "Menu item ID and update request are required.");
        }
        Integer safeMenuItemId = menuItemId;
        CreateMenuItemRequest safeRequest = request;
        MenuItem item = menuItemRepository.findById(safeMenuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", safeMenuItemId));
        validateAvailability(safeRequest.availabilityStatus());
        boolean duplicateName = false;
        for (MenuItem existing : menuItemRepository.findAll()) {
            Integer existingId = existing.getId();
            if (existingId == null) {
                throw new BusinessRuleException("INVALID_MENU_ITEM_ID", "Menu item must have a persisted ID.");
            }
            if (!existingId.equals(safeMenuItemId)
                    && existing.getItemName().equalsIgnoreCase(safeRequest.itemName().trim())) {
                duplicateName = true;
                break;
            }
        }
        if (duplicateName) {
            throw new ConflictException("MENU_ITEM_NAME_EXISTS", "A menu item with this name already exists.");
        }
        MenuItem replacement = menuItemMapper.toEntity(safeRequest);
        if (replacement == null) {
            throw new BusinessRuleException("MENU_ITEM_MAPPING_FAILED",
                    "The menu item request could not be mapped to an entity.");
        }
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
        List<MenuItemResponse> responses = new ArrayList<>(items.size());
        for (MenuItem item : items) {
            responses.add(toResponse(item, asOfDate, recipesFor(item.getId(), recipes), null));
        }
        return responses;
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
        List<MenuItemResponse> personalizedItems = new ArrayList<>();
        for (MenuItem item : items) {
            if (conflictsWithFoodProfile(item, profile)) {
                continue;
            }
            MenuItemResponse response = toResponse(item, asOfDate, recipesFor(item.getId(), recipes), null);
            if (response.available()) {
                personalizedItems.add(response);
            }
        }
        return personalizedItems;
    }

    @Transactional
    public List<RecipeLineResponse> replaceRecipe(Integer menuItemId, ReplaceRecipeRequest request) {
        if (menuItemId == null || request == null) {
            throw new BusinessRuleException("INVALID_RECIPE_REQUEST", "Menu item ID and recipe are required.");
        }
        Integer safeMenuItemId = menuItemId;
        ReplaceRecipeRequest safeRequest = request;
        menuItemRepository.findById(safeMenuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", safeMenuItemId));
        Set<Integer> ingredientIds = new HashSet<>();
        for (RecipeLineRequest line : safeRequest.ingredients()) {
            Integer ingredientId = line.ingredientId();
            if (ingredientId == null) {
                throw new BusinessRuleException("INVALID_RECIPE_INGREDIENT",
                        "Each recipe line must reference an ingredient.");
            }
            if (line.requiredQuantity() == null || line.requiredQuantity().signum() <= 0) {
                throw new BusinessRuleException("INVALID_RECIPE_QUANTITY",
                        "Each recipe ingredient requires a positive required quantity.");
            }
            if (!ingredientIds.add(ingredientId)) {
                throw new BusinessRuleException("DUPLICATE_RECIPE_INGREDIENT",
                        "Each ingredient may appear once in a menu item's recipe.");
            }
            Ingredient ingredient = ingredientRepository.findById(ingredientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Ingredient", "id", ingredientId));
            unitRegistry.unitFor(ingredient);
        }
        recipeRepository.deleteByMenuItemId(safeMenuItemId);
        List<MenuItemIngredient> recipe = new ArrayList<>(safeRequest.ingredients().size());
        for (RecipeLineRequest line : safeRequest.ingredients()) {
            recipe.add(new MenuItemIngredient(safeMenuItemId, line.ingredientId(), line.requiredQuantity()));
        }
        recipeRepository.saveAll(recipe);
        return toRecipeResponse(recipe);
    }

    public List<RecipeLineResponse> getRecipe(Integer menuItemId) {
        if (menuItemId == null) {
            throw new BusinessRuleException("INVALID_MENU_ITEM_ID", "Menu item ID is required.");
        }
        Integer safeMenuItemId = menuItemId;
        if (!menuItemRepository.existsById(safeMenuItemId)) {
            throw new ResourceNotFoundException("MenuItem", "id", safeMenuItemId);
        }
        return toRecipeResponse(recipeRepository.findByMenuItemIdOrderByIngredientIdAsc(safeMenuItemId));
    }

    public List<MenuAvailabilityResponse> getAvailability(LocalDate asOfDate) {
        List<MenuItem> items = menuItemRepository.findAllByOrderByItemNameAsc();
        List<MenuItemIngredient> recipes = recipesForMenu(items);
        List<MenuAvailabilityResponse> responses = new ArrayList<>(items.size());
        for (MenuItem item : items) {
            responses.add(availability(item, recipesFor(item.getId(), recipes), asOfDate));
        }
        return responses;
    }

    public MenuAvailabilityResponse availability(MenuItem item, Collection<MenuItemIngredient> recipe,
            LocalDate asOfDate) {
        if (recipe.isEmpty()) {
            return new MenuAvailabilityResponse(item.getId(), item.getItemName(), false, false, 0,
                    "Recipe is not configured.");
        }
        int servings = Integer.MAX_VALUE;
        for (MenuItemIngredient line : recipe) {
            Integer ingredientId = line.getIngredientId();
            BigDecimal requiredQuantity = line.getRequiredQuantity();
            if (ingredientId == null || requiredQuantity == null || requiredQuantity.signum() <= 0) {
                throw new BusinessRuleException("INVALID_RECIPE_QUANTITY",
                        "Recipe ingredient and required quantity must be configured with positive values.");
            }
            servings = Math.min(servings,
                    inventoryService.getAvailableServings(ingredientId, requiredQuantity, asOfDate));
        }
        boolean manuallyAvailable = "AVAILABLE".equalsIgnoreCase(item.getAvailabilityStatus());
        boolean available = manuallyAvailable && servings > 0;
        String reason = !manuallyAvailable ? "Menu item is manually unavailable."
                : servings == 0 ? "No complete serving can be prepared from usable stock."
                        : "Available from usable stock.";
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
        List<Integer> ingredientIds = new ArrayList<>();
        for (MenuItemIngredient line : recipe) {
            Integer ingredientId = line.getIngredientId();
            if (ingredientId == null) {
                throw new BusinessRuleException("INVALID_RECIPE_INGREDIENT",
                        "Recipe ingredient ID cannot be null.");
            }
            ingredientIds.add(ingredientId);
        }
        for (Ingredient ingredient : ingredientRepository.findAllById(ingredientIds)) {
            Integer ingredientId = ingredient.getId();
            if (ingredientId == null) {
                throw new BusinessRuleException("INVALID_INGREDIENT_ID", "Ingredient must have a persisted ID.");
            }
            unitRegistry.unitFor(ingredient);
            ingredients.put(ingredientId, ingredient);
        }

        List<RecipeLineResponse> responses = new ArrayList<>(recipe.size());
        for (MenuItemIngredient line : recipe) {
            Integer ingredientId = line.getIngredientId();
            Ingredient ingredient = ingredients.get(ingredientId);
            if (ingredient == null) {
                throw new ResourceNotFoundException("Ingredient", "id", ingredientId);
            }
            responses.add(new RecipeLineResponse(ingredientId, ingredient.getIngredientName(),
                    unitRegistry.unitFor(ingredient), line.getRequiredQuantity()));
        }
        return responses;
    }

    private boolean hasAllergenConflict(MenuItem item, List<String> allergies) {
        if (item.getAllergenInformation() == null || allergies == null)
            return false;
        Set<String> itemAllergens = allergenTerms(item.getAllergenInformation());
        for (String allergy : allergies) {
            if (allergy == null || allergy.isBlank()) {
                continue;
            }
            for (String allergen : allergenTerms(allergy)) {
                if (itemAllergens.contains(allergen)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean hasDietaryConflict(MenuItem item, List<String> preferences) {
        String tags = compact(item.getDietaryTags());
        for (String preference : preferences == null ? List.<String>of() : preferences) {
            String normalizedPreference = compact(preference);
            if (normalizedPreference.contains("vegan") && !tags.contains("vegan"))
                return true;
            if (normalizedPreference.contains("vegetarian")
                    && !(tags.contains("vegetarian") || tags.contains("vegan")))
                return true;
            if (normalizedPreference.contains("glutenfree") && !tags.contains("glutenfree"))
                return true;
            if (normalizedPreference.contains("dairyfree") && !tags.contains("dairyfree"))
                return true;
            if (normalizedPreference.contains("pescatarian")
                    && !(tags.contains("pescatarian") || tags.contains("vegetarian") || tags.contains("vegan")))
                return true;
            if (normalizedPreference.contains("keto") && !tags.contains("keto"))
                return true;
        }
        return false;
    }

    private Set<String> words(String value) {
        Set<String> result = new HashSet<>();
        String normalized = value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
        if (normalized.isEmpty()) {
            return result;
        }
        for (String word : normalized.split("\\s+")) {
            if (!word.isBlank()) {
                result.add(word.endsWith("s") && word.length() > 3 ? word.substring(0, word.length() - 1) : word);
            }
        }
        return result;
    }

    private Set<String> allergenTerms(String value) {
        Set<String> result = new HashSet<>();
        for (String word : words(value)) {
            String allergen = switch (word) {
                case "peanut", "almond", "cashew", "walnut", "hazelnut", "pistachio", "pecan", "macadamia", "nut" ->
                    "nut";
                case "milk", "lactose", "dairy" -> "dairy";
                case "shrimp", "prawn", "crab", "lobster", "shellfish" -> "shellfish";
                case "soya", "soy" -> "soy";
                case "egg" -> "egg";
                case "wheat", "barley", "rye", "gluten" -> "gluten";
                case "fish" -> "fish";
                default -> word;
            };
            result.add(allergen);
        }
        return result;
    }

    private List<Integer> ids(List<MenuItem> items) {
        List<Integer> itemIds = new ArrayList<>(items.size());
        for (MenuItem item : items) {
            Integer itemId = item.getId();
            if (itemId == null) {
                throw new BusinessRuleException("INVALID_MENU_ITEM_ID", "Menu item must have a persisted ID.");
            }
            itemIds.add(itemId);
        }
        return itemIds;
    }

    private List<MenuItemIngredient> recipesForMenu(List<MenuItem> items) {
        List<Integer> itemIds = ids(items);
        return itemIds.isEmpty() ? List.of() : recipeRepository.findByMenuItemIdIn(itemIds);
    }

    private String compact(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private List<MenuItemIngredient> recipesFor(Integer menuItemId, List<MenuItemIngredient> allRecipes) {
        List<MenuItemIngredient> result = new ArrayList<>();
        for (MenuItemIngredient line : allRecipes) {
            if (menuItemId != null && menuItemId.equals(line.getMenuItemId())) {
                result.add(line);
            }
        }
        return result;
    }

    private void validateAvailability(String rawStatus) {
        if (rawStatus == null || !AVAILABILITY_STATES.contains(rawStatus.trim().toUpperCase(Locale.ROOT))) {
            throw new BusinessRuleException("INVALID_MENU_AVAILABILITY",
                    "Availability must be AVAILABLE or UNAVAILABLE.");
        }
    }
}
