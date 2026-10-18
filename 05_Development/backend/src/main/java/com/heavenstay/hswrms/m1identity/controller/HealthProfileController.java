package com.heavenstay.hswrms.m1identity.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m1identity.dto.HealthProfileResponse;
import com.heavenstay.hswrms.m1identity.dto.UpdateHealthProfileRequest;
import com.heavenstay.hswrms.m1identity.service.HealthProfileService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authenticated customer health & dietary profile endpoints.
 * Identity always comes from the JWT principal; PUT is gated on an
 * active HEALTH_DATA_PROCESSING consent via ConsentService.
 */
@RestController
@RequestMapping("/api/v1/customers/me/health-profile")
public class HealthProfileController {

    private final HealthProfileService healthProfileService;

    public HealthProfileController(HealthProfileService healthProfileService) {
        this.healthProfileService = healthProfileService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<HealthProfileResponse>> getMyHealthProfile(
            @AuthenticationPrincipal CustomUserDetails principal) {
        HealthProfileResponse response = healthProfileService.getMyHealthProfile(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Health profile retrieved successfully.", response));
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<HealthProfileResponse>> updateMyHealthProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateHealthProfileRequest request) {
        HealthProfileResponse response = healthProfileService.updateMyHealthProfile(principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Health profile updated successfully.", response));
    }
}
