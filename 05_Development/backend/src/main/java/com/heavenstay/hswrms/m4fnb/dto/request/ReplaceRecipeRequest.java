package com.heavenstay.hswrms.m4fnb.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ReplaceRecipeRequest(
        @NotEmpty @Size(max = 50) List<@Valid RecipeLineRequest> ingredients) { }
