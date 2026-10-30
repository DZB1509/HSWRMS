package com.heavenstay.hswrms.m5billing.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m5billing.dto.*;
import com.heavenstay.hswrms.m5billing.service.AdjustmentService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/billing")
public class AdjustmentController {

    private final AdjustmentService adjustmentService;

    public AdjustmentController(AdjustmentService adjustmentService) {
        this.adjustmentService = adjustmentService;
    }

    /**
     * Submit an adjustment request for a posted FolioItem.
     */
    @PostMapping("/adjustments")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'STAFF', 'FNB_STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AdjustmentResponseDTO>> submitAdjustmentRequest(
            @Valid @RequestBody CreateAdjustmentRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getUserId().longValue() : null;
        AdjustmentResponseDTO response = adjustmentService.submitAdjustmentRequest(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Adjustment request submitted successfully", response));
    }

    /**
     * List adjustment requests with optional filtering by folio, booking, or status.
     */
    @GetMapping("/adjustments")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'STAFF', 'FNB_STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AdjustmentResponseDTO>>> listAdjustments(
            @RequestParam(required = false) Long folioId,
            @RequestParam(required = false) Long bookingId,
            @RequestParam(required = false) String status) {
        List<AdjustmentResponseDTO> list;
        if (folioId != null) {
            list = adjustmentService.getAdjustmentRequestsForFolio(folioId);
        } else if (bookingId != null) {
            list = adjustmentService.getAdjustmentRequestsForBooking(bookingId);
        } else if (status != null && !status.isBlank()) {
            list = adjustmentService.getAdjustmentRequestsByStatus(status.trim().toUpperCase());
        } else {
            list = adjustmentService.getAdjustmentRequestsByStatus("PENDING_APPROVAL");
        }
        return ResponseEntity.ok(ApiResponse.ok("Adjustment requests retrieved successfully", list));
    }

    /**
     * Get details of a single adjustment request.
     */
    @GetMapping("/adjustments/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'STAFF', 'FNB_STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AdjustmentResponseDTO>> getAdjustmentDetails(@PathVariable("id") Long id) {
        AdjustmentResponseDTO response = adjustmentService.getAdjustmentRequestDetails(id);
        return ResponseEntity.ok(ApiResponse.ok("Adjustment request retrieved successfully", response));
    }

    /**
     * Manager decision: APPROVE or REJECT an adjustment request.
     */
    @PostMapping("/adjustments/{id}/decision")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AdjustmentResponseDTO>> processDecision(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdjustmentDecisionDTO decision,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new BusinessRuleException("AUTHENTICATION_REQUIRED", "Authenticated user is required.");
        }
        Long approverId = userDetails.getUserId().longValue();
        Collection<String> roles = userDetails.getAuthorities() != null ?
                userDetails.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList()) :
                Collections.emptyList();

        AdjustmentResponseDTO response = adjustmentService.processAdjustmentDecision(id, decision, approverId, roles);
        return ResponseEntity.ok(ApiResponse.ok("Adjustment decision processed successfully", response));
    }

    /**
     * View details of an issued Credit Note.
     */
    @GetMapping("/credit-notes/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'STAFF', 'FNB_STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<CreditNoteResponseDTO>> getCreditNoteDetails(@PathVariable("id") Long id) {
        CreditNoteResponseDTO response = adjustmentService.getCreditNoteDetails(id);
        return ResponseEntity.ok(ApiResponse.ok("Credit note retrieved successfully", response));
    }

    /**
     * List all Credit Notes or filter by status (e.g. PENDING_REFUND, REFUNDED, CREDIT_APPLIED).
     */
    @GetMapping("/credit-notes")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'STAFF', 'FNB_STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<CreditNoteResponseDTO>>> listCreditNotes(
            @RequestParam(required = false) String status) {
        List<CreditNoteResponseDTO> list = adjustmentService.getCreditNotesByStatus(status);
        return ResponseEntity.ok(ApiResponse.ok("Credit notes retrieved successfully", list));
    }

    /**
     * View Credit Notes linked to a specific Invoice.
     */
    @GetMapping("/invoices/{invoiceId}/credit-notes")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'STAFF', 'FNB_STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<CreditNoteResponseDTO>>> getCreditNotesForInvoice(
            @PathVariable("invoiceId") Long invoiceId) {
        List<CreditNoteResponseDTO> list = adjustmentService.getCreditNotesForInvoice(invoiceId);
        return ResponseEntity.ok(ApiResponse.ok("Credit notes for invoice retrieved successfully", list));
    }

    /**
     * Manager settlement confirmation: Transition a Credit Note from PENDING_REFUND to REFUNDED.
     */
    @PostMapping("/credit-notes/{id}/settle-refund")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<CreditNoteResponseDTO>> settleRefund(
            @PathVariable("id") Long id,
            @Valid @RequestBody SettleRefundDTO settleDTO,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new BusinessRuleException("AUTHENTICATION_REQUIRED", "Authenticated user is required.");
        }
        Long settledByUserId = userDetails.getUserId().longValue();
        Collection<String> roles = userDetails.getAuthorities() != null ?
                userDetails.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList()) :
                Collections.emptyList();

        CreditNoteResponseDTO response = adjustmentService.confirmRefundSettlement(id, settleDTO, settledByUserId, roles);
        return ResponseEntity.ok(ApiResponse.ok("Credit note refund settled successfully", response));
    }
}
