package com.heavenstay.hswrms.m1identity.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m1identity.dto.ConsentRecordResponse;
import com.heavenstay.hswrms.m1identity.dto.GrantConsentRequest;
import com.heavenstay.hswrms.m1identity.service.ConsentService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Authenticated customer consent endpoints.
 *
 * The current user ID is always taken from the JWT-backed security principal.
 * There is no path variable or request field for user selection, so callers can
 * only ever read or modify their own consent history.
 */
@RestController
@RequestMapping("/api/v1/customers/me/consents")
public class ConsentController {

    private final ConsentService consentService;

    public ConsentController(ConsentService consentService) {
        this.consentService = consentService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ConsentRecordResponse>>> listMyConsents(
            @AuthenticationPrincipal CustomUserDetails principal) {
        List<ConsentRecordResponse> response = consentService.listMyConsents(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Consents retrieved successfully.", response));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ConsentRecordResponse>> grantConsent(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody GrantConsentRequest request) {
        ConsentService.GrantResult result = consentService.grantConsent(principal.getUserId(), request);
        HttpStatus status = result.isCreated() ? HttpStatus.CREATED : HttpStatus.OK;
        String message = result.isCreated() ? "Consent granted successfully." : "Consent already active.";
        return ResponseEntity.status(status).body(ApiResponse.ok(message, result.getResponse()));
    }

    @PostMapping("/{consentType}/revoke")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ConsentRecordResponse>> revokeConsent(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable String consentType) {
        ConsentRecordResponse response = consentService.revokeConsent(principal.getUserId(), consentType);
        return ResponseEntity.ok(ApiResponse.ok("Consent revoked successfully.", response));
    }
}
