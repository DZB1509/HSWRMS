package com.heavenstay.hswrms.m1identity.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m1identity.dto.CustomerProfileResponse;
import com.heavenstay.hswrms.m1identity.dto.UpdateCustomerProfileRequest;
import com.heavenstay.hswrms.m1identity.service.CustomerProfileService;
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
 * Authenticated customer profile endpoints.
 *
 * The current user ID is always taken from the JWT-backed security principal.
 * There is no path variable or request field for user selection, so callers can
 * only ever read or update their own profile.
 */
@RestController
@RequestMapping("/api/v1/customers/me")
public class CustomerProfileController {

    private final CustomerProfileService customerProfileService;

    public CustomerProfileController(CustomerProfileService customerProfileService) {
        this.customerProfileService = customerProfileService;
    }

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails principal) {
        CustomerProfileResponse response = customerProfileService.getMyProfile(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Customer profile retrieved successfully.", response));
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateCustomerProfileRequest request) {
        CustomerProfileResponse response = customerProfileService.updateMyProfile(principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Customer profile updated successfully.", response));
    }
}
