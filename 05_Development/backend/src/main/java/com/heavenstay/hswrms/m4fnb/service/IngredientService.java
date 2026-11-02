package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateIngredientRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.IngredientResponse;
import com.heavenstay.hswrms.m4fnb.config.IngredientUnitRegistry;
import com.heavenstay.hswrms.m4fnb.entity.Ingredient;
import com.heavenstay.hswrms.m4fnb.repository.IngredientRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class IngredientService {
    private final IngredientRepository ingredientRepository;
    private final IngredientUnitRegistry unitRegistry;

    public IngredientService(IngredientRepository ingredientRepository, IngredientUnitRegistry unitRegistry) {
        this.ingredientRepository = ingredientRepository;
        this.unitRegistry = unitRegistry;
    }

    public List<IngredientResponse> listIngredients() {
        return ingredientRepository.findAllByOrderByIngredientNameAsc().stream()
                .map(ingredient -> new IngredientResponse(ingredient.getId(), ingredient.getIngredientName(),
                        unitRegistry.unitFor(ingredient))).toList();
    }

    @Transactional
    public IngredientResponse createIngredient(CreateIngredientRequest request) {
        String name = request.ingredientName().trim();
        if (ingredientRepository.existsByIngredientNameIgnoreCase(name)) {
            throw new ConflictException("INGREDIENT_NAME_EXISTS", "An ingredient with this name already exists.");
        }
        unitRegistry.unitForName(name);
        Ingredient saved = ingredientRepository.save(new Ingredient(name));
        return new IngredientResponse(saved.getId(), saved.getIngredientName(), unitRegistry.unitFor(saved));
    }
}
