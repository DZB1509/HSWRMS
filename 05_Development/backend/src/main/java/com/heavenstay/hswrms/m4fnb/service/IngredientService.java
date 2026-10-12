package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateIngredientRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.IngredientResponse;
import com.heavenstay.hswrms.m4fnb.entity.Ingredient;
import com.heavenstay.hswrms.m4fnb.repository.IngredientRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class IngredientService {
    private final IngredientRepository ingredientRepository;

    public IngredientService(IngredientRepository ingredientRepository) {
        this.ingredientRepository = ingredientRepository;
    }

    public List<IngredientResponse> listIngredients() {
        return ingredientRepository.findAllByOrderByIngredientNameAsc().stream()
                .map(ingredient -> new IngredientResponse(ingredient.getId(), ingredient.getIngredientName(),
                        ingredient.getUnitOfMeasure())).toList();
    }

    @Transactional
    public IngredientResponse createIngredient(CreateIngredientRequest request) {
        String name = request.ingredientName().trim();
        if (ingredientRepository.existsByIngredientNameIgnoreCase(name)) {
            throw new ConflictException("INGREDIENT_NAME_EXISTS", "An ingredient with this name already exists.");
        }
        Ingredient saved = ingredientRepository.save(new Ingredient(name, request.unitOfMeasure().trim()));
        return new IngredientResponse(saved.getId(), saved.getIngredientName(), saved.getUnitOfMeasure());
    }
}
