package com.heavenstay.hswrms.m1identity.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m1identity.dto.DeletionRequestResponse;
import com.heavenstay.hswrms.m1identity.dto.CreateDeletionRequestRequest;
import com.heavenstay.hswrms.m1identity.service.HealthDataDeletionRequestService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Health data deletion request endpoints (API_CONTRACT.md §5.4).
 *
 * <p>All operations are scoped to the authenticated customer's own requests.
 * Identity is resolved from the JWT-backed security principal; no caller-supplied
 * customer ID is trusted for authorization.
 */
@RestController
@RequestMapping("/api/v1/customers/me/deletion-requests")
public class HealthDataDeletionRequestController {

    private final HealthDataDeletionRequestService deletionRequestService;

    public HealthDataDeletionRequestController(HealthDataDeletionRequestService deletionRequestService) {
        this.deletionRequestService = deletionRequestService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DeletionRequestResponse>> createDeletionRequest(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateDeletionRequestRequest request) {

        DeletionRequestResponse response = deletionRequestService.createDeletionRequest(
                principal.getUserId(), request.getRequestType());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Deletion request created successfully.", response));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DeletionRequestResponse>>> listDeletionRequests(
            @AuthenticationPrincipal CustomUserDetails principal) {

        List<DeletionRequestResponse> response = deletionRequestService.listDeletionRequests(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Deletion requests retrieved successfully.", response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DeletionRequestResponse>> cancelDeletionRequest(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Integer id) {

        DeletionRequestResponse response = deletionRequestService.cancelDeletionRequest(principal.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Deletion request cancelled successfully.", response));
    }
}