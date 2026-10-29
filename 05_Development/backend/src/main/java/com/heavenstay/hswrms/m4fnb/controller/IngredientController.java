package com.heavenstay.hswrms.m4fnb.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateIngredientBatchRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateIngredientRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.UpdateBatchConditionRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.IngredientBatchResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.IngredientResponse;
import com.heavenstay.hswrms.m4fnb.service.IngredientService;
import com.heavenstay.hswrms.m4fnb.service.InventoryService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/fnb")
@PreAuthorize("hasAuthority('ROLE_F&B STAFF')")
public class IngredientController {
    private final IngredientService ingredientService;
    private final InventoryService inventoryService;

    public IngredientController(IngredientService ingredientService, InventoryService inventoryService) {
        this.ingredientService = ingredientService;
        this.inventoryService = inventoryService;
    }

    @GetMapping("/ingredients")
    @PreAuthorize("hasAnyAuthority('ROLE_F&B STAFF','ROLE_ADMIN')")  // Admin: read-only tracking, no dietary data
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> getIngredients() {
        return ResponseEntity.ok(ApiResponse.ok(ingredientService.listIngredients()));
    }

    @PostMapping("/ingredients")
    public ResponseEntity<ApiResponse<IngredientResponse>> createIngredient(@Valid @RequestBody CreateIngredientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("INGREDIENT_CREATED", ingredientService.createIngredient(request)));
    }

    @GetMapping("/inventory/batches")
    @PreAuthorize("hasAnyAuthority('ROLE_F&B STAFF','ROLE_ADMIN')")  // Admin: read-only tracking, no dietary data
    public ResponseEntity<ApiResponse<List<IngredientBatchResponse>>> getBatches(
            @RequestParam(required = false) Integer ingredientId,
            @RequestParam(required = false) LocalDate asOfDate) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.listBatches(ingredientId,
                asOfDate == null ? LocalDate.now() : asOfDate)));
    }

    @PostMapping("/inventory/batches")
    public ResponseEntity<ApiResponse<IngredientBatchResponse>> receiveBatch(@Valid @RequestBody CreateIngredientBatchRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("INGREDIENT_BATCH_RECEIVED", inventoryService.receiveBatch(request)));
    }

    @PatchMapping("/inventory/batches/{batchId}/condition")
    public ResponseEntity<ApiResponse<IngredientBatchResponse>> updateBatchCondition(@PathVariable Integer batchId,
            @Valid @RequestBody UpdateBatchConditionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("INGREDIENT_BATCH_UPDATED", inventoryService.updateCondition(batchId, request)));
    }
}
