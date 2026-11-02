package com.heavenstay.hswrms.m3spa.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m3spa.dto.request.ConfirmReservationRequest;
import com.heavenstay.hswrms.m3spa.dto.request.GenerateCandidatesRequest;
import com.heavenstay.hswrms.m3spa.dto.response.CandidateGenerationResultDto;
import com.heavenstay.hswrms.m3spa.dto.response.SpaSessionDto;
import com.heavenstay.hswrms.m3spa.service.SchedulingEngineService;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/spa")
public class SpaBookingController {

    private final SchedulingEngineService schedulingEngineService;
    private final SpaSessionService spaSessionService;

    public SpaBookingController(SchedulingEngineService schedulingEngineService,
                                SpaSessionService spaSessionService) {
        this.schedulingEngineService = schedulingEngineService;
        this.spaSessionService = spaSessionService;
    }

    /**
     * Screen 26 & Screen 27: System-Driven Scheduling Candidates.
     * Pure READ-ONLY: generates indivisible bundles (Time + Qualified Therapist + Compatible Room).
     * Does NOT reserve resources or persist any session.
     */
    @PostMapping("/candidates")
    public ResponseEntity<ApiResponse<CandidateGenerationResultDto>> generateCandidates(
            @Valid @RequestBody GenerateCandidatesRequest request
    ) {
        CandidateGenerationResultDto result = schedulingEngineService.generateCandidates(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Screen 28 & Screen 30: Final Confirmation & Atomic Reservation.
     * Concurrency boundary: acquires locks on Therapist & Room, verifies non-overlap, persists SpaSession.
     * Also handles Customer-initiated rescheduling when rescheduleSessionId is present.
     */
    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<SpaSessionDto>> confirmReservation(
            @Valid @RequestBody ConfirmReservationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        SpaSessionDto sessionDto = spaSessionService.confirmReservation(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Spa session successfully scheduled.", sessionDto));
    }

    /**
     * Screen 29: My Spa Sessions.
     * Lists upcoming and past sessions for the authenticated customer.
     */
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<SpaSessionDto>>> listCustomerSessions(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        List<SpaSessionDto> sessions = spaSessionService.listCustomerSessions(userId);
        return ResponseEntity.ok(ApiResponse.ok(sessions));
    }

    /**
     * Screen 29: Customer Attendance Confirmation.
     * Transitions confirmation_status from PENDING -> CONFIRMED.
     * session_status remains SCHEDULED.
     */
    @PostMapping("/sessions/{id}/confirm-attendance")
    public ResponseEntity<ApiResponse<SpaSessionDto>> confirmAttendance(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        SpaSessionDto sessionDto = spaSessionService.confirmAttendance(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Session attendance confirmed.", sessionDto));
    }

    /**
     * Screen 29: Cancel Spa Session.
     * Transitions session_status to CANCELLED.
     */
    @PostMapping("/sessions/{id}/cancel")
    public ResponseEntity<ApiResponse<SpaSessionDto>> cancelSession(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        SpaSessionDto sessionDto = spaSessionService.cancelSession(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Session cancelled.", sessionDto));
    }
}
