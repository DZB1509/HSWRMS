package com.heavenstay.hswrms.m4fnb.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateMenuItemRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.ReplaceRecipeRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.MenuAvailabilityResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.MenuItemResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.RecipeLineResponse;
import com.heavenstay.hswrms.m4fnb.service.MenuService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/fnb/menu")
public class MenuController {
    private final MenuService menuService;

    public MenuController(MenuService menuService) { this.menuService = menuService; }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_CUSTOMER','ROLE_F&B STAFF','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getMenu(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestParam(required = false) LocalDate asOfDate) {
        LocalDate date = asOfDate == null ? LocalDate.now() : asOfDate;
        boolean customer = currentUser.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_CUSTOMER".equals(authority.getAuthority()));
        List<MenuItemResponse> menu = customer
                ? menuService.getPersonalizedMenu(currentUser.getUserId(), date)
                : menuService.getManagementMenu(date);
        return ResponseEntity.ok(ApiResponse.ok(menu));
    }

    @GetMapping("/availability")
    @PreAuthorize("hasAnyAuthority('ROLE_F&B STAFF','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<MenuAvailabilityResponse>>> getAvailability(
            @RequestParam(required = false) LocalDate asOfDate) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.getAvailability(asOfDate == null ? LocalDate.now() : asOfDate)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_F&B STAFF')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> createMenuItem(@Valid @RequestBody CreateMenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("MENU_ITEM_CREATED", menuService.createMenuItem(request)));
    }

    @PutMapping("/{menuItemId}")
    @PreAuthorize("hasAuthority('ROLE_F&B STAFF')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateMenuItem(@PathVariable Integer menuItemId,
            @Valid @RequestBody CreateMenuItemRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("MENU_ITEM_UPDATED", menuService.updateMenuItem(menuItemId, request)));
    }

    @GetMapping("/{menuItemId}/recipe")
    @PreAuthorize("hasAnyAuthority('ROLE_F&B STAFF','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<RecipeLineResponse>>> getRecipe(@PathVariable Integer menuItemId) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.getRecipe(menuItemId)));
    }

    @PutMapping("/{menuItemId}/recipe")
    @PreAuthorize("hasAuthority('ROLE_F&B STAFF')")
    public ResponseEntity<ApiResponse<List<RecipeLineResponse>>> replaceRecipe(@PathVariable Integer menuItemId,
            @Valid @RequestBody ReplaceRecipeRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("RECIPE_UPDATED", menuService.replaceRecipe(menuItemId, request)));
    }
}
